import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserStreak,
  getRecentActivity,
} from '../services/dynamodbService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';

const router = express.Router();

// Get user's streak data
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching streak for userId:', req.userId);
    
    // Get user data from Users table (has current_streak and best_streak)
    const user = await dynamodbUserService.getUserById(req.userId!);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      current_streak: user.currentStreak || 0,
      best_streak: user.bestStreak || 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// Get streak history
router.get('/history', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching streak history for userId:', req.userId);
    
    // Get recent activity (last 30 days)
    const recentActivity = await getRecentActivity(req.userId!, 30);
    
    // Map to expected format
    const history = recentActivity.map(day => ({
      date: day.date,
      problems_completed: day.totalCount,
      xp_earned: day.easyCount * 50 + day.moderateCount * 100 + day.hardCount * 150 + day.difficultCount * 200,
    }));
    
    console.log('✅ Streak history fetched:', history.length, 'days');
    res.json(history);
  } catch (error: any) {
    console.error('❌ Error fetching streak history:', error);
    res.json([]);
  }
});

export default router;
