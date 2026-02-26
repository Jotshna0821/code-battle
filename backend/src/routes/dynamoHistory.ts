import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserProgress,
  getAllQuestions,
  getRecentActivity,
} from '../services/dynamodbService.js';

const router = express.Router();

// Get user's problem completion history
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching history for userId:', req.userId);
    
    // Get user progress
    const userProgress = await getUserProgress(req.userId!);
    const completed = userProgress.filter(p => p.completed);
    
    // Get all questions to get details
    const allQuestions = await getAllQuestions();
    const questionsMap = new Map(allQuestions.map(q => [q.questionId, q]));
    
    // Map to expected format
    const history = completed
      .map((progress, index) => {
        const question = questionsMap.get(progress.questionId);
        if (!question) return null;
        
        return {
          id: index + 1,
          problem_id: progress.questionId,
          title: question.title,
          difficulty: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1),
          platform: question.platform,
          problem_url: question.problemUrl,
          xp_reward: question.difficulty === 'easy' ? 50 : 
                     question.difficulty === 'moderate' ? 100 : 
                     question.difficulty === 'hard' ? 150 : 200,
          completed: true,
          completed_at: progress.completedAt || progress.lastAttemptAt,
          submission_url: progress.submittedUrl,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.completed_at).getTime();
        const dateB = new Date(b.completed_at).getTime();
        return dateB - dateA; // Most recent first
      });
    
    console.log('✅ History fetched:', history.length, 'problems');
    res.json(history);
  } catch (error: any) {
    console.error('❌ Error fetching history:', error);
    res.json([]); // Return empty array on error
  }
});

// Get history statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching history stats for userId:', req.userId);
    
    // Get user progress
    const userProgress = await getUserProgress(req.userId!);
    const completed = userProgress.filter(p => p.completed);
    
    // Calculate stats
    const easyCompleted = completed.filter(p => p.difficulty === 'easy').length;
    const moderateCompleted = completed.filter(p => p.difficulty === 'moderate').length;
    const hardCompleted = completed.filter(p => p.difficulty === 'hard').length;
    const difficultCompleted = completed.filter(p => p.difficulty === 'difficult').length;
    
    // Calculate total XP
    const totalXpEarned = 
      easyCompleted * 50 + 
      moderateCompleted * 100 + 
      hardCompleted * 150 + 
      difficultCompleted * 200;
    
    // Get unique dates
    const uniqueDates = new Set(
      completed.map(p => (p.completedAt || p.lastAttemptAt).split('T')[0])
    );
    
    // Get recent activity
    const recentActivity = await getRecentActivity(req.userId!, 30);
    
    const stats = {
      overall: {
        total_completed: completed.length,
        days_active: uniqueDates.size,
        total_xp_earned: totalXpEarned,
        easy_completed: easyCompleted,
        medium_completed: moderateCompleted,
        hard_completed: hardCompleted,
      },
      byPlatform: [], // TODO: Implement platform grouping
      recentActivity: recentActivity.map(day => ({
        date: day.date,
        total_problems: day.totalCount,
        completed_problems: day.totalCount,
        xp_earned: day.easyCount * 50 + day.moderateCount * 100 + day.hardCount * 150 + day.difficultCount * 200,
      })),
    };
    
    console.log('✅ History stats fetched');
    res.json(stats);
  } catch (error: any) {
    console.error('❌ Error fetching history stats:', error);
    res.json({
      overall: {
        total_completed: 0,
        days_active: 0,
        total_xp_earned: 0,
        easy_completed: 0,
        medium_completed: 0,
        hard_completed: 0,
      },
      byPlatform: [],
      recentActivity: [],
    });
  }
});

export default router;
