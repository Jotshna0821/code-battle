import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand, 
  PutCommand,
  QueryCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
const PROBLEMS_TABLE = process.env.DYNAMODB_PROBLEMS_TABLE || 'CodeBattleProblems';
const QUESTIONS_TABLE = 'CodeBattleQuestions';
const USER_PROGRESS_TABLE = 'CodeBattleUserProgress';
const USER_STREAKS_TABLE = 'CodeBattleUserStreaks';
const DAILY_SOLVED_TABLE = 'CodeBattleDailySolved';

// Interfaces
export interface DynamoDBProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  platform: string;
  problem_url: string;
  tags?: string[];
  topics?: string[];
  xp_reward: number;
  description?: string;
  created_at?: string;
}

export interface Question {
  questionId: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'difficult';
  platform: string;
  problemUrl: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  userId: string;
  questionId: string;
  difficulty: string;
  completed: boolean;
  completedAt?: string;
  attempts: number;
  lastAttemptAt: string;
  submittedUrl?: string;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  highestStreak: number;
  lastSolvedDate: string;
  totalProblemsSolved: number;
  updatedAt: string;
}

export interface DailySolved {
  userId: string;
  date: string;
  problemsSolved: string[];
  totalCount: number;
  easyCount: number;
  moderateCount: number;
  hardCount: number;
  difficultCount: number;
}

// Get all problems
export async function getAllProblems(): Promise<DynamoDBProblem[]> {
  try {
    const command = new ScanCommand({
      TableName: PROBLEMS_TABLE,
    });
    
    const response = await docClient.send(command);
    return response.Items as DynamoDBProblem[] || [];
  } catch (error) {
    console.error('Error fetching problems from DynamoDB:', error);
    throw error;
  }
}

// Get problems by difficulty
export async function getProblemsByDifficulty(difficulty: string, limit: number = 10): Promise<DynamoDBProblem[]> {
  try {
    const command = new ScanCommand({
      TableName: PROBLEMS_TABLE,
      FilterExpression: 'difficulty = :difficulty',
      ExpressionAttributeValues: {
        ':difficulty': difficulty,
      },
      Limit: limit,
    });
    
    const response = await docClient.send(command);
    return response.Items as DynamoDBProblem[] || [];
  } catch (error) {
    console.error('Error fetching problems by difficulty:', error);
    throw error;
  }
}

// Get random problems by difficulty
export async function getRandomProblemsByDifficulty(difficulty: string, count: number): Promise<DynamoDBProblem[]> {
  try {
    const allProblems = await getProblemsByDifficulty(difficulty, 100);
    
    // Shuffle and return requested count
    const shuffled = allProblems.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error fetching random problems:', error);
    throw error;
  }
}

// Get problem by ID
export async function getProblemById(id: string): Promise<DynamoDBProblem | null> {
  try {
    const command = new GetCommand({
      TableName: PROBLEMS_TABLE,
      Key: { id },
    });
    
    const response = await docClient.send(command);
    return response.Item as DynamoDBProblem || null;
  } catch (error) {
    console.error('Error fetching problem by ID:', error);
    throw error;
  }
}

// Add a new problem
export async function addProblem(problem: DynamoDBProblem): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: PROBLEMS_TABLE,
      Item: {
        ...problem,
        created_at: problem.created_at || new Date().toISOString(),
      },
    });
    
    await docClient.send(command);
    console.log('✅ Problem added to DynamoDB:', problem.title);
  } catch (error) {
    console.error('Error adding problem to DynamoDB:', error);
    throw error;
  }
}

// Batch add problems
export async function batchAddProblems(problems: DynamoDBProblem[]): Promise<void> {
  try {
    for (const problem of problems) {
      await addProblem(problem);
    }
    console.log(`✅ Added ${problems.length} problems to DynamoDB`);
  } catch (error) {
    console.error('Error batch adding problems:', error);
    throw error;
  }
}

// ==================== QUESTIONS MANAGEMENT ====================

// Create a new question
export async function createQuestion(question: Omit<Question, 'questionId' | 'createdAt' | 'updatedAt'>): Promise<Question> {
  try {
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newQuestion: Question = {
      questionId,
      ...question,
      createdAt: now,
      updatedAt: now,
    };
    
    const command = new PutCommand({
      TableName: QUESTIONS_TABLE,
      Item: newQuestion,
    });
    
    await docClient.send(command);
    console.log('✅ Question created:', newQuestion.title);
    return newQuestion;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

// Get all questions
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const command = new ScanCommand({
      TableName: QUESTIONS_TABLE,
    });
    
    const response = await docClient.send(command);
    return (response.Items as Question[]) || [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Get questions by difficulty
export async function getQuestionsByDifficulty(difficulty: string): Promise<Question[]> {
  try {
    const command = new QueryCommand({
      TableName: QUESTIONS_TABLE,
      IndexName: 'difficulty-createdAt-index',
      KeyConditionExpression: 'difficulty = :difficulty',
      ExpressionAttributeValues: {
        ':difficulty': difficulty,
      },
    });
    
    const response = await docClient.send(command);
    return (response.Items as Question[]) || [];
  } catch (error) {
    console.error('Error fetching questions by difficulty:', error);
    // Fallback to scan if GSI doesn't exist
    return getAllQuestions().then(questions => 
      questions.filter(q => q.difficulty === difficulty)
    );
  }
}

// Get question by ID
export async function getQuestionById(questionId: string): Promise<Question | null> {
  try {
    const command = new GetCommand({
      TableName: QUESTIONS_TABLE,
      Key: { questionId },
    });
    
    const response = await docClient.send(command);
    return (response.Item as Question) || null;
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    return null;
  }
}

// Update question
export async function updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
  try {
    const existing = await getQuestionById(questionId);
    if (!existing) {
      throw new Error('Question not found');
    }
    
    const updated = {
      ...existing,
      ...updates,
      questionId,
      updatedAt: new Date().toISOString(),
    };
    
    const command = new PutCommand({
      TableName: QUESTIONS_TABLE,
      Item: updated,
    });
    
    await docClient.send(command);
    console.log('✅ Question updated:', questionId);
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
}

// ==================== USER PROGRESS MANAGEMENT ====================

// Update user progress
export async function updateUserProgress(
  userId: string,
  questionId: string,
  difficulty: string,
  completed: boolean,
  submittedUrl?: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Get existing progress
    const existing = await getUserProgressForQuestion(userId, questionId);
    
    const progress: UserProgress = {
      userId,
      questionId,
      difficulty,
      completed,
      completedAt: completed ? now : existing?.completedAt,
      attempts: (existing?.attempts || 0) + 1,
      lastAttemptAt: now,
      submittedUrl: submittedUrl || existing?.submittedUrl,
    };
    
    const command = new PutCommand({
      TableName: USER_PROGRESS_TABLE,
      Item: progress,
    });
    
    await docClient.send(command);
    console.log('✅ User progress updated:', userId, questionId);
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

// Get user progress for a specific question
export async function getUserProgressForQuestion(userId: string, questionId: string): Promise<UserProgress | null> {
  try {
    const command = new GetCommand({
      TableName: USER_PROGRESS_TABLE,
      Key: { userId, questionId },
    });
    
    const response = await docClient.send(command);
    return (response.Item as UserProgress) || null;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

// Get all user progress
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const command = new QueryCommand({
      TableName: USER_PROGRESS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    
    const response = await docClient.send(command);
    return (response.Items as UserProgress[]) || [];
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}

// Get user progress stats
export async function getUserProgressStats(userId: string): Promise<{
  total: number;
  easy: number;
  moderate: number;
  hard: number;
  difficult: number;
}> {
  try {
    const progress = await getUserProgress(userId);
    const completed = progress.filter(p => p.completed);
    
    return {
      total: completed.length,
      easy: completed.filter(p => p.difficulty === 'easy').length,
      moderate: completed.filter(p => p.difficulty === 'moderate').length,
      hard: completed.filter(p => p.difficulty === 'hard').length,
      difficult: completed.filter(p => p.difficulty === 'difficult').length,
    };
  } catch (error) {
    console.error('Error calculating progress stats:', error);
    return { total: 0, easy: 0, moderate: 0, hard: 0, difficult: 0 };
  }
}

// ==================== STREAK MANAGEMENT ====================

// Get user streak
export async function getUserStreak(userId: string): Promise<UserStreak> {
  try {
    const command = new GetCommand({
      TableName: USER_STREAKS_TABLE,
      Key: { userId },
    });
    
    const response = await docClient.send(command);
    
    if (response.Item) {
      return response.Item as UserStreak;
    }
    
    // Return default streak if not found
    return {
      userId,
      currentStreak: 0,
      highestStreak: 0,
      lastSolvedDate: '',
      totalProblemsSolved: 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user streak:', error);
    return {
      userId,
      currentStreak: 0,
      highestStreak: 0,
      lastSolvedDate: '',
      totalProblemsSolved: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

// Update user streak
export async function updateUserStreak(userId: string, solvedDate: string): Promise<UserStreak> {
  try {
    const streak = await getUserStreak(userId);
    const lastDate = streak.lastSolvedDate;
    
    let newCurrentStreak = streak.currentStreak;
    let newHighestStreak = streak.highestStreak;
    
    if (!lastDate) {
      // First problem ever
      newCurrentStreak = 1;
      newHighestStreak = 1;
    } else {
      const daysDiff = getDaysDifference(lastDate, solvedDate);
      
      if (daysDiff === 0) {
        // Already solved today, no change to streak
        return streak;
      } else if (daysDiff === 1) {
        // Consecutive day
        newCurrentStreak = streak.currentStreak + 1;
        newHighestStreak = Math.max(newCurrentStreak, streak.highestStreak);
      } else if (daysDiff > 1) {
        // Streak broken
        newCurrentStreak = 1;
        newHighestStreak = streak.highestStreak;
      }
    }
    
    const updatedStreak: UserStreak = {
      userId,
      currentStreak: newCurrentStreak,
      highestStreak: newHighestStreak,
      lastSolvedDate: solvedDate,
      totalProblemsSolved: streak.totalProblemsSolved + 1,
      updatedAt: new Date().toISOString(),
    };
    
    const command = new PutCommand({
      TableName: USER_STREAKS_TABLE,
      Item: updatedStreak,
    });
    
    await docClient.send(command);
    console.log('✅ Streak updated:', userId, 'Current:', newCurrentStreak);
    return updatedStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

// Get streak leaderboard
export async function getStreakLeaderboard(limit: number = 10): Promise<Array<{
  userId: string;
  currentStreak: number;
  highestStreak: number;
}>> {
  try {
    const command = new ScanCommand({
      TableName: USER_STREAKS_TABLE,
    });
    
    const response = await docClient.send(command);
    const streaks = (response.Items as UserStreak[]) || [];
    
    // Sort by current streak descending
    return streaks
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, limit)
      .map(s => ({
        userId: s.userId,
        currentStreak: s.currentStreak,
        highestStreak: s.highestStreak,
      }));
  } catch (error) {
    console.error('Error fetching streak leaderboard:', error);
    return [];
  }
}

// ==================== DAILY SOLVED MANAGEMENT ====================

// Update daily solved
export async function updateDailySolved(
  userId: string,
  date: string,
  questionId: string,
  difficulty: string
): Promise<void> {
  try {
    // Get existing daily record
    const command = new GetCommand({
      TableName: DAILY_SOLVED_TABLE,
      Key: { userId, date },
    });
    
    const response = await docClient.send(command);
    const existing = response.Item as DailySolved | undefined;
    
    let dailySolved: DailySolved;
    
    if (existing) {
      // Update existing record
      if (!existing.problemsSolved.includes(questionId)) {
        dailySolved = {
          ...existing,
          problemsSolved: [...existing.problemsSolved, questionId],
          totalCount: existing.totalCount + 1,
          easyCount: existing.easyCount + (difficulty === 'easy' ? 1 : 0),
          moderateCount: existing.moderateCount + (difficulty === 'moderate' ? 1 : 0),
          hardCount: existing.hardCount + (difficulty === 'hard' ? 1 : 0),
          difficultCount: existing.difficultCount + (difficulty === 'difficult' ? 1 : 0),
        };
      } else {
        // Already recorded today
        return;
      }
    } else {
      // Create new record
      dailySolved = {
        userId,
        date,
        problemsSolved: [questionId],
        totalCount: 1,
        easyCount: difficulty === 'easy' ? 1 : 0,
        moderateCount: difficulty === 'moderate' ? 1 : 0,
        hardCount: difficulty === 'hard' ? 1 : 0,
        difficultCount: difficulty === 'difficult' ? 1 : 0,
      };
    }
    
    const putCommand = new PutCommand({
      TableName: DAILY_SOLVED_TABLE,
      Item: dailySolved,
    });
    
    await docClient.send(putCommand);
    console.log('✅ Daily solved updated:', userId, date);
  } catch (error) {
    console.error('Error updating daily solved:', error);
    throw error;
  }
}

// Get recent activity
export async function getRecentActivity(userId: string, days: number = 30): Promise<DailySolved[]> {
  try {
    const command = new QueryCommand({
      TableName: DAILY_SOLVED_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort descending
      Limit: days,
    });
    
    const response = await docClient.send(command);
    return (response.Items as DailySolved[]) || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// ==================== UTILITY FUNCTIONS ====================

// Calculate days difference between two dates (YYYY-MM-DD format)
function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// ==================== GENERIC DYNAMODB OPERATIONS ====================

// Put item to any table
export async function putItem(tableName: string, item: any): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    
    await docClient.send(command);
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error);
    throw error;
  }
}

// Batch write items (max 25 items per batch)
export async function batchWriteItems(tableName: string, items: any[]): Promise<void> {
  try {
    const batchSize = 25;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const requestItems = batch.map(item => ({
        PutRequest: {
          Item: item,
        },
      }));
      
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: requestItems,
        },
      });
      
      await docClient.send(command);
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} written to ${tableName}`);
    }
  } catch (error) {
    console.error(`Error batch writing to ${tableName}:`, error);
    throw error;
  }
}
