import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserProgress,
  getAllQuestions,
  getRecentActivity,
} from '../services/dynamodbService.js';
import dynamodbUserService from '../services/dynamodbUserService.js';

const router = express.Router();

// Get topics breakdown
router.get('/topics', authenticate, async (req, res) => {
  try {
    const userProgress = await getUserProgress(req.userId!);
    const completed = userProgress.filter(p => p.completed);
    
    // Get all questions to get topics
    const allQuestions = await getAllQuestions();
    const questionsMap = new Map(allQuestions.map(q => [q.questionId, q]));
    
    // Group by topic (using tags if available, otherwise use difficulty as topic)
    const topicsMap = new Map<string, { solved: number; total: number }>();
    
    completed.forEach(progress => {
      const question = questionsMap.get(progress.questionId);
      if (question) {
        const topic = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
        const current = topicsMap.get(topic) || { solved: 0, total: 0 };
        topicsMap.set(topic, { solved: current.solved + 1, total: current.total + 1 });
      }
    });
    
    const topics = Array.from(topicsMap.entries()).map(([name, data]) => ({
      name,
      solved: data.solved,
      total: data.total,
    }));
    
    res.json(topics);
  } catch (error: any) {
    res.json([]);
  }
});

// Get weaknesses
router.get('/weaknesses', authenticate, async (req, res) => {
  try {
    const userProgress = await getUserProgress(req.userId!);
    
    // Find topics with low completion rate or many attempts
    const weaknesses = userProgress
      .filter(p => !p.completed || p.attempts > 3)
      .slice(0, 5)
      .map(p => ({
        topic: p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1),
        accuracy: p.completed ? 100 : 0,
        problems_attempted: p.attempts,
      }));
    
    res.json(weaknesses);
  } catch (error: any) {
    res.json([]);
  }
});

// Get difficulty progress
router.get('/difficulty-progress', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const recentActivity = await getRecentActivity(req.userId!, days);
    
    const progress = recentActivity.map(day => ({
      date: day.date,
      easy: day.easyCount,
      moderate: day.moderateCount,
      hard: day.hardCount,
      difficult: day.difficultCount,
    }));
    
    res.json(progress);
  } catch (error: any) {
    res.json([]);
  }
});

// Get rewards/achievements
router.get('/rewards', authenticate, async (req, res) => {
  try {
    const user = await dynamodbUserService.getUserById(req.userId!);
    
    if (!user) {
      return res.json([]);
    }
    
    const rewards = [];
    
    // Add rewards based on achievements
    if (user.totalProblemsSolved >= 1) {
      rewards.push({
        id: 1,
        title: 'First Problem',
        description: 'Solved your first problem',
        icon: '🎯',
        earned: true,
        earned_at: user.createdAt,
      });
    }
    
    if (user.currentStreak >= 3) {
      rewards.push({
        id: 2,
        title: '3-Day Streak',
        description: 'Maintained a 3-day streak',
        icon: '🔥',
        earned: true,
        earned_at: new Date().toISOString(),
      });
    }
    
    if (user.totalProblemsSolved >= 10) {
      rewards.push({
        id: 3,
        title: '10 Problems',
        description: 'Solved 10 problems',
        icon: '⭐',
        earned: true,
        earned_at: new Date().toISOString(),
      });
    }
    
    res.json(rewards);
  } catch (error: any) {
    res.json([]);
  }
});

// Get weekly report
router.get('/weekly-report/latest', authenticate, async (req, res) => {
  try {
    const recentActivity = await getRecentActivity(req.userId!, 7);
    const user = await dynamodbUserService.getUserById(req.userId!);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const totalProblems = recentActivity.reduce((sum, day) => sum + day.totalCount, 0);
    const totalXP = recentActivity.reduce((sum, day) => 
      sum + (day.easyCount * 50 + day.moderateCount * 100 + day.hardCount * 150 + day.difficultCount * 200), 0
    );
    
    const report = {
      week_start: recentActivity[0]?.date || new Date().toISOString().split('T')[0],
      week_end: recentActivity[recentActivity.length - 1]?.date || new Date().toISOString().split('T')[0],
      problems_solved: totalProblems,
      xp_earned: totalXP,
      current_streak: user.currentStreak || 0,
      best_streak: user.bestStreak || 0,
      rank_change: 0, // TODO: Calculate rank change
      strengths: ['Problem Solving'],
      improvements: ['Consistency'],
    };
    
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch weekly report' });
  }
});

export default router;
