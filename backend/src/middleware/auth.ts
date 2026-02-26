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
      return res.status(401).json({ error: 'No token provided' });
    }

    // Try to decode the token
    const decoded = jwt.decode(token) as any;
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if it's a Cognito token (has 'sub' and 'cognito:username')
    if (decoded.sub && decoded['cognito:username']) {
      console.log('🔐 Cognito token detected, sub:', decoded.sub);
      
      if (MOCK_MODE) {
        // Mock mode - find user in memory
        const user = mockUsers.get(decoded.sub);
        if (!user) {
          console.error('❌ User not found in mock database for cognito_sub:', decoded.sub);
          return res.status(404).json({ error: 'User not found' });
        }
        req.userId = user.userId;
        req.cognitoSub = user.cognitoSub;
        console.log('✅ Mock mode auth successful, userId:', user.userId);
        next();
      } else {
        // Real mode - get user from DynamoDB
        try {
          const user = await dynamodbUserService.getUserByCognitoSub(decoded.sub);

          if (!user) {
            console.error('❌ User not found for cognito_sub:', decoded.sub);
            return res.status(404).json({ error: 'User not found' });
          }

          req.userId = user.userId;
          req.cognitoSub = user.cognitoSub;
          console.log('✅ Cognito auth successful, userId:', user.userId);
          next();
        } catch (dbError: any) {
          // If DynamoDB fails, try mock mode as fallback
          console.error('❌ DynamoDB error in auth, trying mock mode:', dbError.message);
          let user = mockUsers.get(decoded.sub);
          
          // Auto-create user in mock mode if they don't exist
          if (!user) {
            console.log('🔄 Auto-creating user in mock mode...');
            user = {
              userId: `mock_${Date.now()}`,
              cognitoSub: decoded.sub,
              email: decoded.email || decoded['cognito:username'],
              name: decoded.name || decoded['cognito:username'],
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
          console.log('✅ Mock mode auth successful (fallback), userId:', user.userId);
          next();
        }
      }
    } else if (decoded.userId) {
      // Regular JWT token
      console.log('🔐 Regular JWT token detected');
      try {
        const jwtDecoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        req.userId = jwtDecoded.userId;
        console.log('✅ JWT auth successful, userId:', jwtDecoded.userId);
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
