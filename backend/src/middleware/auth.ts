import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      cognitoSub?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔍 Received token, length:', token.length);

    // Try to decode the token
    let decoded;
    try {
      decoded = jwt.decode(token) as any;
      console.log('✅ Token decoded successfully:', decoded ? 'Yes' : 'No');
    } catch (decodeError) {
      console.error('❌ JWT decode error:', decodeError);
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    if (!decoded) {
      console.error('❌ Failed to decode token - token is null or invalid');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('🔍 Token payload:', { 
      sub: decoded.sub, 
      email: decoded.email,
      hasUsername: !!decoded['cognito:username']
    });

    // Always use MOCK_MODE for local development
    if (decoded.sub) {
      console.log('🔐 Processing token with sub:', decoded.sub);
      console.log('📊 MOCK_MODE:', MOCK_MODE);
      console.log('📊 Mock users count:', mockUsers.size);
      
      // Look for user by cognitoSub
      let user = mockUsers.get(decoded.sub);
      
      if (!user) {
        console.log('🔍 User not found by sub, checking all users...');
        // Try to find by email as fallback
        for (const [key, value] of mockUsers.entries()) {
          if (value.email === decoded.email || value.cognitoSub === decoded.sub) {
            user = value;
            console.log('✅ Found user by email/cognitoSub:', key);
            break;
          }
        }
      }
      
      if (!user) {
        console.error('❌ User not found in mock database');
        console.log('📋 Available users:', Array.from(mockUsers.keys()));
        console.log('📋 Looking for sub:', decoded.sub);
        
        // Auto-create user if they don't exist
        console.log('🔄 Auto-creating user in mock mode...');
        user = {
          userId: `mock_${Date.now()}`,
          cognitoSub: decoded.sub,
          email: decoded.email || decoded['cognito:username'],
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          level: 'Bronze I',
          xp: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalProblemsSolved: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockUsers.set(decoded.sub, user);
        mockUsers.set(user.email, user);
        console.log('✅ Mock user auto-created, userId:', user.userId);
      }
      
      req.userId = user.userId;
      req.cognitoSub = user.cognitoSub;
      console.log('✅ Authentication successful, userId:', user.userId);
      next();
    } else {
      console.error('❌ Token missing sub field');
      return res.status(401).json({ error: 'Invalid token format - missing sub' });
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
