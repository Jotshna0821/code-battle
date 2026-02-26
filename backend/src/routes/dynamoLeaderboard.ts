import express from 'express';
import { authenticate } from '../middleware/auth.js';
import dynamodbUserService from '../services/dynamodbUserService.js';

const router = express.Router();

// Get weekly leaderboard (for now, use all-time XP)
router.get('/weekly', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching weekly leaderboard');
    
    // Get all users
    const allUsers = await dynamodbUserService.getAllUsers(100);
    
    // Sort by XP descending
    const sorted = allUsers.sort((a, b) => b.xp - a.xp);
    
    // Map to expected format
    const leaderboard = sorted.map((user, index) => ({
      rank: index + 1,
      weekly_rank: index + 1,
      user_id: user.userId,
      name: user.name,
      college: user.college || 'Unknown',
      level: user.level,
      current_streak: user.currentStreak || 0,
      weekly_xp: user.xp, // Using total XP as weekly XP for now
      xp: user.xp,
    }));
    
    console.log('✅ Weekly leaderboard fetched:', leaderboard.length, 'users');
    res.json(leaderboard);
  } catch (error: any) {
    console.error('❌ Error fetching weekly leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get all-time leaderboard
router.get('/alltime', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching all-time leaderboard');
    
    // Get all users
    const allUsers = await dynamodbUserService.getAllUsers(100);
    
    // Sort by XP descending
    const sorted = allUsers.sort((a, b) => b.xp - a.xp);
    
    // Map to expected format
    const leaderboard = sorted.map((user, index) => ({
      rank: index + 1,
      user_id: user.userId,
      userId: user.userId,
      name: user.name,
      college: user.college || 'Unknown',
      level: user.level,
      xp: user.xp,
      total_problems_solved: user.totalProblemsSolved || 0,
      current_streak: user.currentStreak || 0,
      currentStreak: user.currentStreak || 0,
      best_streak: user.bestStreak || 0,
      bestStreak: user.bestStreak || 0,
    }));
    
    console.log('✅ All-time leaderboard fetched:', leaderboard.length, 'users');
    res.json(leaderboard);
  } catch (error: any) {
    console.error('❌ Error fetching all-time leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
