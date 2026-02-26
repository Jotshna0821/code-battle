import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 5,
  requestHandler: {
    requestTimeout: 10000,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'SolvedProblems';

export interface SolvedProblem {
  userId: string;
  problemId: string;
  problemTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solvedAt: number; // Unix timestamp
  xpEarned: number;
  platform?: string;
  submissionUrl?: string;
}

/**
 * Check if user has already solved this problem
 */
export async function hasSolvedProblem(
  userId: string,
  problemId: string
): Promise<boolean> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'UserProblemIndex',
      KeyConditionExpression: 'userId = :userId AND problemId = :problemId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':problemId': problemId,
      },
      Limit: 1,
    });

    const response = await docClient.send(command);
    return (response.Items?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking if problem solved:', error);
    return false;
  }
}

/**
 * Save solved problem to database
 */
export async function saveSolvedProblem(
  problem: SolvedProblem
): Promise<SolvedProblem> {
  try {
    // Check if already solved
    const alreadySolved = await hasSolvedProblem(problem.userId, problem.problemId);
    
    if (alreadySolved) {
      console.log(`⚠️  Problem ${problem.problemId} already solved by user ${problem.userId}`);
      throw new Error('Problem already solved');
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId: problem.userId,
        problemId: problem.problemId,
        problemTitle: problem.problemTitle,
        difficulty: problem.difficulty,
        solvedAt: problem.solvedAt,
        xpEarned: problem.xpEarned,
        platform: problem.platform || 'CodeBattle',
        submissionUrl: problem.submissionUrl || null,
      },
    });

    await docClient.send(command);
    console.log('✅ Solved problem saved:', problem.problemId);
    return problem;
  } catch (error: any) {
    console.error('❌ Error saving solved problem:', error);
    throw error;
  }
}

/**
 * Get all solved problems for a user
 */
export async function getUserSolvedProblems(
  userId: string,
  difficulty?: 'Easy' | 'Medium' | 'Hard'
): Promise<SolvedProblem[]> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by solvedAt descending (latest first)
    });

    const response = await docClient.send(command);
    let problems = (response.Items || []) as SolvedProblem[];

    // Filter by difficulty if specified
    if (difficulty) {
      problems = problems.filter(p => p.difficulty === difficulty);
    }

    console.log(`✅ Retrieved ${problems.length} solved problems for user ${userId}`);
    return problems;
  } catch (error) {
    console.error('❌ Error getting solved problems:', error);
    throw error;
  }
}

/**
 * Get solved problems count by difficulty
 */
export async function getSolvedProblemsStats(userId: string): Promise<{
  total: number;
  easy: number;
  medium: number;
  hard: number;
  totalXP: number;
}> {
  try {
    const problems = await getUserSolvedProblems(userId);

    const stats = {
      total: problems.length,
      easy: problems.filter(p => p.difficulty === 'Easy').length,
      medium: problems.filter(p => p.difficulty === 'Medium').length,
      hard: problems.filter(p => p.difficulty === 'Hard').length,
      totalXP: problems.reduce((sum, p) => sum + p.xpEarned, 0),
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting solved problems stats:', error);
    return { total: 0, easy: 0, medium: 0, hard: 0, totalXP: 0 };
  }
}

export default {
  hasSolvedProblem,
  saveSolvedProblem,
  getUserSolvedProblems,
  getSolvedProblemsStats,
};
