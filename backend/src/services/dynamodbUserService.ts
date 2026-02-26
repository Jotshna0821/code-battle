import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { enableMockMode } from './mockStore.js';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 5,
  requestHandler: {
    requestTimeout: 10000, // 10 seconds timeout
    httpsAgent: {
      maxSockets: 50,
      keepAlive: true,
    },
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const TABLE_NAME = 'CodeBattleUsers';

// Helper to check if error is due to invalid credentials
function isCredentialError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('credential') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('invalid security token') ||
    errorMessage.includes('expired') ||
    errorCode === 'credentialserror' ||
    errorCode === 'invalidclienttokenid' ||
    errorCode === 'expiredtoken'
  );
}

export interface User {
  userId: string;
  cognitoSub: string;
  email: string;
  name: string;
  phoneNumber?: string;
  college?: string;
  level: string;
  xp: number;
  currentStreak: number;
  bestStreak: number;
  totalProblemsSolved: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Create a new user
export async function createUser(data: {
  cognitoSub: string;
  email: string;
  name: string;
  phoneNumber?: string;
  college?: string;
}): Promise<User> {
  const userId = uuidv4();
  const now = new Date().toISOString();

  const user: User = {
    userId,
    cognitoSub: data.cognitoSub,
    email: data.email,
    name: data.name,
    phoneNumber: data.phoneNumber,
    college: data.college,
    level: 'Bronze I',
    xp: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalProblemsSolved: 0,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: user,
    ConditionExpression: 'attribute_not_exists(userId)',
  });

  try {
    await docClient.send(command);
    console.log('✅ User created in DynamoDB:', userId);
    return user;
  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    
    // Check if it's a credential error
    if (isCredentialError(error)) {
      console.error('🔴 AWS CREDENTIALS ARE INVALID OR EXPIRED!');
      console.error('🔴 Please update your credentials in backend/.env');
      enableMockMode('Invalid AWS credentials detected');
    }
    
    throw error;
  }
}

// Get user by userId
export async function getUserById(userId: string): Promise<User | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId },
  });

  try {
    const response = await docClient.send(command);
    return (response.Item as User) || null;
  } catch (error: any) {
    console.error('❌ Error getting user by ID:', error);
    
    if (isCredentialError(error)) {
      console.error('🔴 AWS CREDENTIALS ARE INVALID OR EXPIRED!');
      enableMockMode('Invalid AWS credentials detected');
    }
    
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  });

  try {
    const response = await docClient.send(command);
    return (response.Items?.[0] as User) || null;
  } catch (error: any) {
    console.error('❌ Error getting user by email:', error);
    
    if (isCredentialError(error)) {
      console.error('🔴 AWS CREDENTIALS ARE INVALID OR EXPIRED!');
      enableMockMode('Invalid AWS credentials detected');
    }
    
    throw error;
  }
}

// Get user by Cognito Sub
export async function getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'CognitoSubIndex',
    KeyConditionExpression: 'cognitoSub = :cognitoSub',
    ExpressionAttributeValues: {
      ':cognitoSub': cognitoSub,
    },
  });

  try {
    const response = await docClient.send(command);
    return (response.Items?.[0] as User) || null;
  } catch (error: any) {
    console.error('❌ Error getting user by Cognito Sub:', error);
    
    if (isCredentialError(error)) {
      console.error('🔴 AWS CREDENTIALS ARE INVALID OR EXPIRED!');
      enableMockMode('Invalid AWS credentials detected');
    }
    
    throw error;
  }
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'userId' | 'cognitoSub' | 'email' | 'createdAt'>>
): Promise<User> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Build update expression dynamically
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    }
  });

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  try {
    const response = await docClient.send(command);
    console.log('✅ User updated:', userId);
    return response.Attributes as User;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
}

// Get all users (for leaderboard)
export async function getAllUsers(limit: number = 100): Promise<User[]> {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    Limit: limit,
  });

  try {
    const response = await docClient.send(command);
    return (response.Items as User[]) || [];
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    throw error;
  }
}

// Increment problem count and XP
export async function incrementUserStats(
  userId: string,
  xpGained: number
): Promise<User> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression:
      'SET xp = xp + :xp, totalProblemsSolved = totalProblemsSolved + :one, updatedAt = :now',
    ExpressionAttributeValues: {
      ':xp': xpGained,
      ':one': 1,
      ':now': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as User;
  } catch (error) {
    console.error('❌ Error incrementing user stats:', error);
    throw error;
  }
}

// Update streak
export async function updateUserStreak(
  userId: string,
  currentStreak: number,
  bestStreak: number
): Promise<User> {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression:
      'SET currentStreak = :current, bestStreak = :best, updatedAt = :now',
    ExpressionAttributeValues: {
      ':current': currentStreak,
      ':best': bestStreak,
      ':now': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  });

  try {
    const response = await docClient.send(command);
    return response.Attributes as User;
  } catch (error) {
    console.error('❌ Error updating user streak:', error);
    throw error;
  }
}

export default {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByCognitoSub,
  updateUser,
  getAllUsers,
  incrementUserStats,
  updateUserStreak,
};
