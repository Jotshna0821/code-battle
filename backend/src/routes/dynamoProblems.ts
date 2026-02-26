import express from 'express';
import { authenticate } from '../middleware/auth.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import solvedProblemsService from '../services/solvedProblemsService.js';
import {
  getAllQuestions,
  getQuestionsByDifficulty,
  getUserProgress,
  updateUserProgress,
  updateUserStreak,
  updateDailySolved,
  getTodayDate,
} from '../services/dynamodbService.js';

const router = express.Router();

// Get today's assigned problems (for now, return random problems)
router.get('/today', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching today\'s problems for userId:', req.userId);
    
    // Get user progress to check completed problems
    const userProgress = await getUserProgress(req.userId!);
    
    // Get today's date
    const today = getTodayDate();
    
    // Get all questions
    const allQuestions = await getAllQuestions();
    
    // Filter problems completed today
    const completedToday = userProgress.filter(p => 
      p.completed && p.completedAt && p.completedAt.startsWith(today)
    );
    
    const completedTodayIds = new Set(completedToday.map(p => p.questionId));
    
    // Get all completed problem IDs
    const allCompletedIds = new Set(
      userProgress.filter(p => p.completed).map(p => p.questionId)
    );
    
    // Filter out all completed problems for selection
    const availableQuestions = allQuestions.filter(q => !allCompletedIds.has(q.questionId));
    
    // Shuffle and take 5 problems
    const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
    const todaysProblems = shuffled.slice(0, 5);
    
    // Map to expected format, marking completed ones
    const problems = todaysProblems.map((q, index) => {
      const isCompleted = completedTodayIds.has(q.questionId);
      const progressData = userProgress.find(p => p.questionId === q.questionId);
      
      return {
        id: index + 1,
        problem_id: q.questionId,
        title: q.title,
        difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1),
        platform: q.platform,
        problem_url: q.problemUrl,
        xp_reward: q.difficulty === 'easy' ? 50 : q.difficulty === 'moderate' ? 100 : q.difficulty === 'hard' ? 150 : 200,
        completed: isCompleted,
        completed_at: progressData?.completedAt || null,
        submission_url: progressData?.submittedUrl || null,
      };
    });
    
    console.log('✅ Today\'s problems fetched:', problems.length, 'Completed today:', completedToday.length);
    res.json(problems);
  } catch (error: any) {
    console.error('❌ Error fetching today\'s problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Mark problem as completed
router.post('/:problemId/complete', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { submission_url } = req.body;
    
    console.log('✅ Marking problem as completed:', problemId, 'for user:', req.userId);
    
    // Get question details
    const allQuestions = await getAllQuestions();
    const question = allQuestions.find(q => q.questionId === problemId);
    
    if (!question) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Update user progress
    await updateUserProgress(
      req.userId!,
      problemId,
      question.difficulty,
      true,
      submission_url
    );
    
    // Calculate XP reward
    const xpReward = question.difficulty === 'easy' ? 50 : 
                     question.difficulty === 'moderate' ? 100 : 
                     question.difficulty === 'hard' ? 150 : 200;
    
    // Update user XP and stats in DynamoDB Users table
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
    await updateDailySolved(req.userId!, today, problemId, question.difficulty);
    
    // Save to solved problems history
    try {
      await solvedProblemsService.saveSolvedProblem({
        userId: req.userId!,
        problemId: problemId,
        problemTitle: question.title,
        difficulty: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) as 'Easy' | 'Medium' | 'Hard',
        solvedAt: Date.now(),
        xpEarned: xpReward,
        platform: question.platform,
        submissionUrl: submission_url,
      });
    } catch (historyError: any) {
      // Don't fail the request if history save fails
      console.warn('⚠️  Failed to save to history:', historyError.message);
    }
    
    console.log('✅ Problem completed successfully');
    
    res.json({
      success: true,
      xpEarned: xpReward,
      currentStreak: updatedStreak.currentStreak,
      bestStreak: updatedStreak.highestStreak,
    });
  } catch (error: any) {
    console.error('❌ Error completing problem:', error);
    res.status(500).json({ error: 'Failed to complete problem' });
  }
});

export default router;
