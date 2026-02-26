import express from 'express';
import {
  getProblems,
  getProblemsByRating,
  getUserInfo,
  getUserSubmissions,
  getContests,
  getRandomProblem,
  syncProblemsToDatabase,
} from '../services/codeforcesService.js';
import { putItem, batchWriteItems } from '../services/dynamodbService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/codeforces/problems
 * Get all Codeforces problems (optionally filtered by tags)
 */
router.get('/problems', async (req, res) => {
  try {
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const result = await getProblems(tags);
    
    res.json({
      success: true,
      count: result.problems.length,
      problems: result.problems,
      statistics: result.problemStatistics,
    });
  } catch (error: any) {
    console.error('Error fetching Codeforces problems:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch problems',
    });
  }
});

/**
 * GET /api/codeforces/problems/by-rating
 * Get problems filtered by rating range
 */
router.get('/problems/by-rating', async (req, res) => {
  try {
    const minRating = parseInt(req.query.minRating as string) || 800;
    const maxRating = parseInt(req.query.maxRating as string) || 3500;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    
    const problems = await getProblemsByRating(minRating, maxRating, tags);
    
    res.json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error: any) {
    console.error('Error fetching problems by rating:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch problems',
    });
  }
});

/**
 * GET /api/codeforces/problems/random
 * Get a random problem by rating
 */
router.get('/problems/random', async (req, res) => {
  try {
    const rating = parseInt(req.query.rating as string) || 1200;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    
    const problem = await getRandomProblem(rating, tags);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'No problems found matching criteria',
      });
    }
    
    res.json({
      success: true,
      problem,
    });
  } catch (error: any) {
    console.error('Error fetching random problem:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch random problem',
    });
  }
});

/**
 * GET /api/codeforces/user/:handle
 * Get user information
 */
router.get('/user/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const users = await getUserInfo([handle]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      user: users[0],
    });
  } catch (error: any) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user info',
    });
  }
});

/**
 * GET /api/codeforces/user/:handle/submissions
 * Get user submissions
 */
router.get('/user/:handle/submissions', async (req, res) => {
  try {
    const { handle } = req.params;
    const from = req.query.from ? parseInt(req.query.from as string) : undefined;
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    
    const submissions = await getUserSubmissions(handle, from, count);
    
    res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submissions',
    });
  }
});

/**
 * GET /api/codeforces/contests
 * Get contest list
 */
router.get('/contests', async (req, res) => {
  try {
    const gym = req.query.gym === 'true';
    const contests = await getContests(gym);
    
    res.json({
      success: true,
      count: contests.length,
      contests,
    });
  } catch (error: any) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contests',
    });
  }
});

/**
 * POST /api/codeforces/sync
 * Sync Codeforces problems to DynamoDB (Admin only)
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    // Check if user is admin (you can add admin check middleware)
    const tableName = process.env.DYNAMODB_PROBLEMS_TABLE || 'CodeBattleProblems';
    
    const saveToDynamoDB = async (problems: any[]) => {
      await batchWriteItems(tableName, problems);
    };
    
    const count = await syncProblemsToDatabase(saveToDynamoDB);
    
    res.json({
      success: true,
      message: `Successfully synced ${count} problems to DynamoDB`,
      count,
    });
  } catch (error: any) {
    console.error('Error syncing problems:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync problems',
    });
  }
});

export default router;
