import express from 'express';
import dynamodbUserService from '../services/dynamodbUserService.js';

const router = express.Router();

// Simple admin authentication middleware
const adminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY || 'admin-key-change-this';
  
  if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await dynamodbUserService.getAllUsers(1000);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const users = await dynamodbUserService.getAllUsers(1000);
    
    const stats = {
      total_users: users.length,
      total_xp: users.reduce((sum, u) => sum + (u.xp || 0), 0),
      total_problems_solved: users.reduce((sum, u) => sum + (u.totalProblemsSolved || 0), 0),
      active_streaks: users.filter(u => (u.currentStreak || 0) > 0).length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
