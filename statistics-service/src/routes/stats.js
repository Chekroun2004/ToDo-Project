const express = require('express');
const axios = require('axios');
const router = express.Router();
const StatsCache = require('../models/StatsCache');
const auth = require('../middleware/auth');

const NGINX_URL = process.env.NGINX_URL || 'http://nginx';

// GET /api/stats/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'statistics-service' });
});

// GET /api/stats/user/:userId
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur accède à ses propres stats
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        code: 403
      });
    }

    // Vérifier le cache
    const cached = await StatsCache.findOne({ userId });
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        message: 'Stats récupérées (cache)'
      });
    }

    // Récupérer les todos via NGINX
    const token = req.headers.authorization;
    const todosResponse = await axios.get(`${NGINX_URL}/api/todos?userId=${userId}`, {
      headers: { Authorization: token }
    });

    const todos = todosResponse.data.data || todosResponse.data || [];

    // Calculer les statistiques
    const stats = calculateStats(todos);

    // Sauvegarder en cache
    await StatsCache.findOneAndUpdate(
      { userId },
      { data: stats, generatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: stats,
      message: 'Stats calculées'
    });
  } catch (err) {
    console.error('Erreur stats user:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques',
      code: 500
    });
  }
});

function calculateStats(todos) {
  const now = new Date();
  const total = todos.length;

  // Completion rate
  const completed = todos.filter(t => t.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // By status
  const byStatus = {
    pending: todos.filter(t => t.status === 'pending').length,
    in_progress: todos.filter(t => t.status === 'in_progress').length,
    completed: completed,
    cancelled: todos.filter(t => t.status === 'cancelled').length,
  };

  // By priority
  const byPriority = {
    low: todos.filter(t => t.priority === 'low').length,
    medium: todos.filter(t => t.priority === 'medium').length,
    high: todos.filter(t => t.priority === 'high').length,
    urgent: todos.filter(t => t.priority === 'urgent').length,
  };

  // By category
  const byCategory = {};
  todos.forEach(t => {
    const cat = t.categoryId || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  // Weekly evolution (7 derniers jours)
  const weeklyEvolution = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    weeklyEvolution.push({
      date: day.toISOString().split('T')[0],
      created: todos.filter(t => new Date(t.createdAt) >= day && new Date(t.createdAt) <= dayEnd).length,
      completed: todos.filter(t => t.status === 'completed' && new Date(t.updatedAt) >= day && new Date(t.updatedAt) <= dayEnd).length,
    });
  }

  // Overdue tasks
  const overdueTasks = todos.filter(t =>
    t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  ).length;

  return { totalTasks: total, completionRate, byStatus, byPriority, byCategory, weeklyEvolution, overdueTasks };
}

module.exports = router;
