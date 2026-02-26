import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dynamodb from '../services/dynamodbService.js';

const router = Router();

// GET /api/questions - Get all questions with user's completion status
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { difficulty } = req.query;
    
    // Get questions
    let questions;
    if (difficulty && typeof difficulty === 'string') {
      questions = await dynamodb.getQuestionsByDifficulty(difficulty);
    } else {
      questions = await dynamodb.getAllQuestions();
    }
    
    // Get user's progress
    const userProgress = await dynamodb.getUserProgress(userId);
    const completedMap = new Map(
      userProgress
        .filter(p => p.completed)
        .map(p => [p.questionId, true])
    );
    
    // Merge data
    const questionsWithStatus = questions.map(q => ({
      ...q,
      isCompleted: completedMap.has(q.questionId),
    }));
    
    res.json(questionsWithStatus);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id - Get specific question
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const question = await dynamodb.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get user's progress for this question
    const progress = await dynamodb.getUserProgressForQuestion(userId, id);
    
    res.json({
      ...question,
      isCompleted: progress?.completed || false,
      attempts: progress?.attempts || 0,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/questions (Admin only) - Create new question
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin check middleware
    const { title, description, difficulty, platform, problemUrl, tags } = req.body;
    
    if (!title || !description || !difficulty || !platform || !problemUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const question = await dynamodb.createQuestion({
      title,
      description,
      difficulty,
      platform,
      problemUrl,
      tags: tags || [],
    });
    
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PUT /api/questions/:id (Admin only) - Update question
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin check middleware
    const { id } = req.params;
    const updates = req.body;
    
    await dynamodb.updateQuestion(id, updates);
    
    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

export default router;
