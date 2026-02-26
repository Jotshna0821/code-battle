import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  college: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const cognitoRegisterSchema = z.object({
  cognitoSub: z.string(),
  email: z.string().email(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  college: z.string().optional(),
});

// Cognito Register - Create user in backend after Cognito registration
router.post('/cognito-register', async (req, res) => {
  try {
    const { cognitoSub, email, name, phoneNumber, college } = cognitoRegisterSchema.parse(req.body);
    
    console.log('📝 Cognito registration request:', { cognitoSub, email, name });
    console.log('📧 Email:', email);
    
    if (MOCK_MODE) {
      // Mock mode - store in memory
      console.log('⚠️  Using MOCK MODE - storing user in memory');
      
      // Check if user already exists
      if (mockUsers.has(email)) {
        console.log('✅ User already exists in mock database');
        return res.json({ user: mockUsers.get(email) });
      }

      // Create mock user
      const mockUser = {
        userId: `mock_${Date.now()}`,
        cognitoSub,
        email,
        name,
        phoneNumber,
        college,
        level: 'Bronze I',
        xp: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalProblemsSolved: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.set(email, mockUser);
      mockUsers.set(cognitoSub, mockUser);
      
      console.log('✅ Mock user created:', mockUser.userId);
      return res.status(201).json({ user: mockUser });
    }

    // Real mode - use DynamoDB
    try {
      let existingUser = await dynamodbUserService.getUserByCognitoSub(cognitoSub);
      
      if (!existingUser) {
        existingUser = await dynamodbUserService.getUserByEmail(email);
      }

      if (existingUser) {
        console.log('✅ User already exists, returning existing user');
        return res.json({ user: existingUser });
      }

      // Create new user
      const user = await dynamodbUserService.createUser({
        cognitoSub,
        email,
        name,
        phoneNumber,
        college,
      });

      console.log('✅ New user created:', user.userId);
      res.status(201).json({ user });
    } catch (dbError: any) {
      // If DynamoDB fails, fall back to mock mode
      console.error('❌ DynamoDB error, falling back to mock mode:', dbError.message);
      
      const mockUser = {
        userId: `mock_${Date.now()}`,
        cognitoSub,
        email,
        name,
        phoneNumber,
        college,
        level: 'Bronze I',
        xp: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalProblemsSolved: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.set(email, mockUser);
      mockUsers.set(cognitoSub, mockUser);
      
      console.log('✅ Mock user created (fallback):', mockUser.userId);
      res.status(201).json({ user: mockUser });
    }
  } catch (error: any) {
    console.error('❌ Cognito register error:', error);
    res.status(400).json({ error: 'Cognito registration failed', details: error.message });
  }
});

// Register (legacy - for non-Cognito users)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, college } = registerSchema.parse(req.body);

    if (MOCK_MODE) {
      // Mock mode
      if (mockUsers.has(email)) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const mockUser = {
        userId: `mock_${Date.now()}`,
        cognitoSub: `legacy_${Date.now()}`,
        email,
        name,
        college,
        level: 'Bronze I',
        xp: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalProblemsSolved: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.set(email, mockUser);
      
      const token = jwt.sign({ userId: mockUser.userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      return res.status(201).json({ user: mockUser, token });
    }

    // Real mode
    const existingUser = await dynamodbUserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await dynamodbUserService.createUser({
      cognitoSub: `legacy_${Date.now()}`,
      email,
      name,
      college,
    });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login (legacy - for non-Cognito users)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    if (MOCK_MODE) {
      const user = mockUsers.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      return res.json({ user, token });
    }

    const user = await dynamodbUserService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Login failed' });
  }
});

// Google OAuth (placeholder)
router.post('/google', async (req, res) => {
  res.status(501).json({ error: 'Google OAuth not implemented yet' });
});

export default router;
