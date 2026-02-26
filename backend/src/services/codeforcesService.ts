import crypto from 'crypto';
import axios from 'axios';

const API_BASE_URL = 'https://codeforces.com/api';
const API_KEY = process.env.CODEFORCES_API_KEY || '';
const API_SECRET = process.env.CODEFORCES_API_SECRET || '';

interface CodeforcesResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}

interface Problem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

interface ProblemStatistics {
  contestId?: number;
  index: string;
  solvedCount: number;
}

interface ProblemsetProblemsResult {
  problems: Problem[];
  problemStatistics: ProblemStatistics[];
}

/**
 * Generate API signature for authenticated requests
 */
function generateApiSig(methodName: string, params: Record<string, any>): string {
  // Generate random 6-character prefix
  const rand = Math.random().toString(36).substring(2, 8);
  
  // Sort parameters lexicographically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Create signature string
  const sigString = `${rand}/${methodName}?${sortedParams}#${API_SECRET}`;
  
  // Generate SHA-512 hash
  const hash = crypto.createHash('sha512').update(sigString).digest('hex');
  
  return `${rand}${hash}`;
}

/**
 * Make authenticated API request to Codeforces
 */
async function makeAuthenticatedRequest<T>(
  methodName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const time = Math.floor(Date.now() / 1000);
  
  const requestParams: any = {
    ...params,
    apiKey: API_KEY,
    time: time.toString(),
  };
  
  const apiSig = generateApiSig(methodName, requestParams);
  requestParams.apiSig = apiSig;
  
  const url = `${API_BASE_URL}/${methodName}`;
  
  try {
    const response = await axios.get<CodeforcesResponse<T>>(url, {
      params: requestParams,
    });
    
    if (response.data.status === 'FAILED') {
      throw new Error(response.data.comment || 'API request failed');
    }
    
    return response.data.result as T;
  } catch (error: any) {
    if (error.response?.data?.comment) {
      throw new Error(`Codeforces API Error: ${error.response.data.comment}`);
    }
    throw error;
  }
}

/**
 * Make public (non-authenticated) API request
 */
async function makePublicRequest<T>(
  methodName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${methodName}`;
  
  try {
    const response = await axios.get<CodeforcesResponse<T>>(url, { params });
    
    if (response.data.status === 'FAILED') {
      throw new Error(response.data.comment || 'API request failed');
    }
    
    return response.data.result as T;
  } catch (error: any) {
    if (error.response?.data?.comment) {
      throw new Error(`Codeforces API Error: ${error.response.data.comment}`);
    }
    throw error;
  }
}

/**
 * Get all problems from Codeforces problemset
 */
export async function getProblems(tags?: string[]): Promise<ProblemsetProblemsResult> {
  const params: Record<string, any> = {};
  
  if (tags && tags.length > 0) {
    params.tags = tags.join(';');
  }
  
  return makePublicRequest<ProblemsetProblemsResult>('problemset.problems', params);
}

/**
 * Get problems filtered by difficulty rating
 */
export async function getProblemsByRating(
  minRating: number,
  maxRating: number,
  tags?: string[]
): Promise<Problem[]> {
  const result = await getProblems(tags);
  
  return result.problems.filter(
    problem => problem.rating && problem.rating >= minRating && problem.rating <= maxRating
  );
}

/**
 * Get user information
 */
export async function getUserInfo(handles: string[]): Promise<any[]> {
  return makePublicRequest('user.info', { handles: handles.join(';') });
}

/**
 * Get user submissions
 */
export async function getUserSubmissions(handle: string, from?: number, count?: number): Promise<any[]> {
  const params: Record<string, any> = { handle };
  
  if (from !== undefined) params.from = from;
  if (count !== undefined) params.count = count;
  
  return makePublicRequest('user.status', params);
}

/**
 * Get contest list
 */
export async function getContests(gym: boolean = false): Promise<any[]> {
  return makePublicRequest('contest.list', { gym });
}

/**
 * Get contest standings
 */
export async function getContestStandings(
  contestId: number,
  from?: number,
  count?: number,
  handles?: string[]
): Promise<any> {
  const params: Record<string, any> = { contestId };
  
  if (from !== undefined) params.from = from;
  if (count !== undefined) params.count = count;
  if (handles && handles.length > 0) params.handles = handles.join(';');
  
  return makeAuthenticatedRequest('contest.standings', params);
}

/**
 * Get random problem by difficulty
 */
export async function getRandomProblem(rating: number, tags?: string[]): Promise<Problem | null> {
  const problems = await getProblemsByRating(rating - 100, rating + 100, tags);
  
  if (problems.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * problems.length);
  return problems[randomIndex];
}

/**
 * Sync Codeforces problems to DynamoDB
 */
export async function syncProblemsToDatabase(
  saveToDynamoDB: (problems: any[]) => Promise<void>
): Promise<number> {
  const result = await getProblems();
  
  const problemsWithStats = result.problems.map((problem, index) => {
    const stats = result.problemStatistics[index];
    
    return {
      id: `CF-${problem.contestId || 'unknown'}-${problem.index}`,
      platform: 'codeforces',
      title: problem.name,
      difficulty: problem.rating ? mapRatingToDifficulty(problem.rating) : 'medium',
      rating: problem.rating || 0,
      tags: problem.tags,
      link: problem.contestId
        ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
        : `https://codeforces.com/problemset/problem/${problem.problemsetName}/${problem.index}`,
      solvedCount: stats?.solvedCount || 0,
      contestId: problem.contestId,
      index: problem.index,
    };
  });
  
  // Save in batches to avoid overwhelming the database
  const batchSize = 25;
  for (let i = 0; i < problemsWithStats.length; i += batchSize) {
    const batch = problemsWithStats.slice(i, i + batchSize);
    await saveToDynamoDB(batch);
  }
  
  return problemsWithStats.length;
}

/**
 * Map Codeforces rating to difficulty level
 */
function mapRatingToDifficulty(rating: number): string {
  if (rating < 1200) return 'easy';
  if (rating < 1600) return 'medium';
  if (rating < 2000) return 'hard';
  return 'expert';
}

export default {
  getProblems,
  getProblemsByRating,
  getUserInfo,
  getUserSubmissions,
  getContests,
  getContestStandings,
  getRandomProblem,
  syncProblemsToDatabase,
};
