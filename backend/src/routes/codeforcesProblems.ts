import express from 'express';
import { authenticate } from '../middleware/auth.js';
import codeforcesService from '../services/codeforcesService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import solvedProblemsService from '../services/solvedProblemsService.js';
import {
  getUserProgress,
  updateUserProgress,
  updateUserStreak,
  updateDailySolved,
  getTodayDate,
} from '../services/dynamodbService.js';

const router = express.Router();

// Cache for daily problems (same for all users)
let dailyProblemsCache: any[] = [];
let cacheDate: string = '';

// Get today's Codeforces problems (same for all users)
router.get('/daily', authenticate, async (req, res) => {
  try {
    const today = getTodayDate();
    
    // Check if we need to fetch new problems
    if (cacheDate !== today || dailyProblemsCache.length === 0) {
      console.log('📊 Fetching new daily problems from Codeforces...');
      
      // Fetch problems from Codeforces
      const result = await codeforcesService.getProblems();
      
      // Filter problems by rating (800-1400 for mixed difficulty)
      const easyProblems = result.problems.filter(p => p.rating && p.rating >= 800 && p.rating < 1000);
      const mediumProblems = result.problems.filter(p => p.rating && p.rating >= 1000 && p.rating < 1300);
      const hardProblems = result.problems.filter(p => p.rating && p.rating >= 1300 && p.rating < 1600);
      
      // Select 2 easy, 2 medium, 1 hard
      const selectedProblems = [
        ...easyProblems.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...mediumProblems.sort(() => 0.5 - Math.random()).slice(0, 2),
        ...hardProblems.sort(() => 0.5 - Math.random()).slice(0, 1),
      ];
      
      // Map to our format
      dailyProblemsCache = selectedProblems.map((problem, index) => ({
        id: index + 1,
        problem_id: `CF-${problem.contestId}-${problem.index}`,
        contest_id: problem.contestId,
        problem_index: problem.index,
        title: problem.name,
        difficulty: (problem.rating || 1000) < 1000 ? 'Easy' : (problem.rating || 1000) < 1300 ? 'Medium' : 'Hard',
        platform: 'Codeforces',
        problem_url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
        xp_reward: (problem.rating || 1000) < 1000 ? 50 : (problem.rating || 1000) < 1300 ? 100 : 150,
        rating: problem.rating,
        tags: problem.tags,
      }));
      
      cacheDate = today;
      console.log('✅ Daily problems cached for', today);
    }
    
    // Get user progress to mark completed problems
    const userProgress = await getUserProgress(req.userId!);
    const completedToday = userProgress.filter(p => 
      p.completed && p.completedAt && p.completedAt.startsWith(today)
    );
    const completedTodayIds = new Set(completedToday.map(p => p.questionId));
    
    // Add completion status for this user
    const problemsWithStatus = dailyProblemsCache.map(problem => ({
      ...problem,
      completed: completedTodayIds.has(problem.problem_id),
    }));
    
    console.log('✅ Daily problems sent to user:', req.userId, 'Completed:', completedToday.length);
    res.json(problemsWithStatus);
  } catch (error: any) {
    console.error('❌ Error fetching daily problems:', error);
    res.status(500).json({ error: 'Failed to fetch daily problems' });
  }
});

// Verify if user solved a Codeforces problem
router.post('/verify/:problemId', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { codeforcesHandle } = req.body;
    
    if (!codeforcesHandle) {
      return res.status(400).json({ error: 'Codeforces handle is required' });
    }
    
    console.log('🔍 Verifying problem:', problemId, 'for handle:', codeforcesHandle);
    
    // Extract contest ID and problem index from problemId (format: CF-contestId-index)
    const parts = problemId.split('-');
    if (parts.length !== 3 || parts[0] !== 'CF') {
      return res.status(400).json({ error: 'Invalid problem ID format' });
    }
    
    const contestId = parseInt(parts[1]);
    const problemIndex = parts[2];
    
    // Get user submissions from Codeforces
    const submissions = await codeforcesService.getUserSubmissions(codeforcesHandle);
    
    // Check if user has a successful submission for this problem
    const solvedSubmission = submissions.find(sub => 
      sub.problem.contestId === contestId &&
      sub.problem.index === problemIndex &&
      sub.verdict === 'OK'
    );
    
    if (!solvedSubmission) {
      return res.json({
        verified: false,
        message: 'No successful submission found for this problem',
      });
    }
    
    // Find the problem in daily cache to get difficulty
    const problem = dailyProblemsCache.find(p => p.problem_id === problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found in today\'s problems' });
    }
    
    // Map difficulty to DynamoDB format
    const difficulty = problem.difficulty.toLowerCase();
    
    // Update user progress
    await updateUserProgress(
      req.userId!,
      problemId,
      difficulty,
      true,
      solvedSubmission.id.toString()
    );
    
    // Calculate XP reward
    const xpReward = problem.xp_reward;
    
    // Update user XP and stats
    await dynamodbUserService.incrementUserStats(req.userId!, xpReward);
    
    // Update streak
    const today = getTodayDate();
    const updatedStreak = await updateUserStreak(req.userId!, today);
    
    // Update user's current streak in Users table
    await dynamodbUserService.updateUserStreak(
      req.userId!,
      updatedStreak.currentStreak,
      updatedStreak.highestStreak
    );
    
    // Update daily solved
    await updateDailySolved(req.userId!, today, problemId, difficulty);
    
    // Save to solved problems history
    try {
      await solvedProblemsService.saveSolvedProblem({
        userId: req.userId!,
        problemId: problemId,
        problemTitle: problem.title,
        difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
        solvedAt: Date.now(),
        xpEarned: xpReward,
        platform: 'Codeforces',
        submissionUrl: `https://codeforces.com/contest/${contestId}/submission/${solvedSubmission.id}`,
      });
    } catch (historyError: any) {
      // Don't fail the request if history save fails
      console.warn('⚠️  Failed to save to history:', historyError.message);
    }
    
    console.log('✅ Problem verified and marked as completed');
    
    res.json({
      verified: true,
      message: 'Problem verified successfully!',
      xpEarned: xpReward,
      currentStreak: updatedStreak.currentStreak,
      bestStreak: updatedStreak.highestStreak,
      submissionId: solvedSubmission.id,
    });
  } catch (error: any) {
    console.error('❌ Error verifying problem:', error);
    res.status(500).json({ error: 'Failed to verify problem' });
  }
});

export default router;
