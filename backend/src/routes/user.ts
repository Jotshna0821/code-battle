import express from 'express';
import { authenticate } from '../middleware/auth.js';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching user profile for userId:', req.userId);
    
    if (MOCK_MODE) {
      // Find user in mock database
      const user = Array.from(mockUsers.values()).find(u => u.userId === req.userId);
      if (!user) {
        console.error('❌ User not found in mock database:', req.userId);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('✅ Mock user profile fetched successfully');
      return res.json(user);
    }
    
    const user = await dynamodbUserService.getUserById(req.userId!);
    
    if (!user) {
      console.error('❌ User not found:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User profile fetched successfully');
    res.json(user);
  } catch (error: any) {
    console.error('❌ Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, college } = req.body;
    
    if (MOCK_MODE) {
      const user = Array.from(mockUsers.values()).find(u => u.userId === req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (name) user.name = name;
      if (college) user.college = college;
      user.updatedAt = new Date().toISOString();
      
      return res.json(user);
    }
    
    const updates: any = {};
    if (name) updates.name = name;
    if (college) updates.college = college;
    
    const user = await dynamodbUserService.updateUser(req.userId!, updates);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user's connected platforms (placeholder)
router.get('/platforms', authenticate, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// Connect a platform (placeholder)
router.post('/platforms', authenticate, async (req, res) => {
  try {
    const { platform_name, username } = req.body;
    res.json({ platform_name, username, verified: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect platform' });
  }
});

// Delete a platform (placeholder)
router.delete('/platforms/:platform_name', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Platform disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

export default router;
