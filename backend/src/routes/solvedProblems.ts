import express from 'express';
import { authenticate } from '../middleware/auth.js';
import solvedProblemsService from '../services/solvedProblemsService.js';

const router = express.Router();

/**
 * GET /api/solved-problems
 * Get all solved problems for the authenticated user
 * Query params: difficulty (optional) - Easy, Medium, or Hard
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { difficulty } = req.query;
    
    console.log('📊 Fetching solved problems for user:', req.userId);
    
    // Validate difficulty if provided
    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty as string)) {
      return res.status(400).json({ error: 'Invalid difficulty. Must be Easy, Medium, or Hard' });
    }

    const problems = await solvedProblemsService.getUserSolvedProblems(
      req.userId!,
      difficulty as 'Easy' | 'Medium' | 'Hard' | undefined
    );

    res.json({
      success: true,
      count: problems.length,
      problems: problems,
    });
  } catch (error: any) {
    console.error('❌ Error fetching solved problems:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch solved problems',
      message: error.message 
    });
  }
});

/**
 * GET /api/solved-problems/stats
 * Get statistics about solved problems
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching solved problems stats for user:', req.userId);
    
    const stats = await solvedProblemsService.getSolvedProblemsStats(req.userId!);

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching solved problems stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

/**
 * POST /api/solved-problems
 * Save a solved problem (called when user completes a problem)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { problemId, problemTitle, difficulty, xpEarned, platform, submissionUrl } = req.body;

    // Validate required fields
    if (!problemId || !problemTitle || !difficulty || xpEarned === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: problemId, problemTitle, difficulty, xpEarned' 
      });
    }

    // Validate difficulty
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty. Must be Easy, Medium, or Hard' });
    }

    console.log('💾 Saving solved problem:', problemId, 'for user:', req.userId);

    const solvedProblem = await solvedProblemsService.saveSolvedProblem({
      userId: req.userId!,
      problemId,
      problemTitle,
      difficulty,
      solvedAt: Date.now(),
      xpEarned,
      platform,
      submissionUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Problem saved to history',
      problem: solvedProblem,
    });
  } catch (error: any) {
    if (error.message === 'Problem already solved') {
      return res.status(409).json({ 
        success: false,
        error: 'Problem already in history',
        message: 'This problem has already been solved' 
      });
    }

    console.error('❌ Error saving solved problem:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save solved problem',
      message: error.message 
    });
  }
});

export default router;
