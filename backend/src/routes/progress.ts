import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dynamodb from '../services/dynamodbService.js';

const router = Router();

// GET /api/progress - Get user's overall progress stats
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const stats = await dynamodb.getUserProgressStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/history - Get user's completion history
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const progress = await dynamodb.getUserProgress(userId);
    const completed = progress.filter(p => p.completed);
    
    // Get question details for completed problems
    const historyWithDetails = await Promise.all(
      completed.map(async (p) => {
        const question = await dynamodb.getQuestionById(p.questionId);
        return {
          questionId: p.questionId,
          title: question?.title || 'Unknown',
          difficulty: p.difficulty,
          platform: question?.platform || 'Unknown',
          problemUrl: question?.problemUrl || '',
          completedAt: p.completedAt,
          attempts: p.attempts,
          submittedUrl: p.submittedUrl,
        };
      })
    );
    
    // Sort by completion date (most recent first)
    historyWithDetails.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });
    
    res.json(historyWithDetails);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/progress/:questionId/complete - Mark question as completed
router.post('/:questionId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { questionId } = req.params;
    const { submittedUrl, difficulty } = req.body;
    
    if (!difficulty) {
      return res.status(400).json({ error: 'Difficulty is required' });
    }
    
    // Check if already completed
    const existing = await dynamodb.getUserProgressForQuestion(userId, questionId);
    if (existing?.completed) {
      return res.json({ 
        message: 'Question already completed',
        alreadyCompleted: true,
      });
    }
    
    // Update user progress
    await dynamodb.updateUserProgress(userId, questionId, difficulty, true, submittedUrl);
    
    // Update daily solved
    const today = dynamodb.getTodayDate();
    await dynamodb.updateDailySolved(userId, today, questionId, difficulty);
    
    // Update streak
    const streak = await dynamodb.updateUserStreak(userId, today);
    
    // Get updated stats
    const stats = await dynamodb.getUserProgressStats(userId);
    
    res.json({
      message: 'Question marked as completed',
      stats,
      streak: {
        currentStreak: streak.currentStreak,
        highestStreak: streak.highestStreak,
      },
    });
  } catch (error) {
    console.error('Error marking question complete:', error);
    res.status(500).json({ error: 'Failed to mark question complete' });
  }
});

export default router;
