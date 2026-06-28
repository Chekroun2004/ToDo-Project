const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/auth');

// GET /api/todos/health — no auth required
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'todo-service' });
});

// GET /api/todos/overdue — internal call, no JWT required
router.get('/overdue', async (req, res) => {
  try {
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const todos = await Todo.find({
      dueDate: { $lt: tomorrow },
      status: { $ne: 'completed' }
    });

    res.json({ success: true, data: todos, message: 'Tâches en retard récupérées' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

// GET /api/todos — list all todos for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = { userId: req.user.userId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;

    const todos = await Todo.find(filter);
    res.json({ success: true, data: todos, message: 'Tâches récupérées' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

// POST /api/todos — create a new todo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, categoryId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Le titre est requis', code: 400 });
    }

    const todo = new Todo({
      userId: req.user.userId,
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      categoryId: categoryId || null,
      updatedAt: Date.now()
    });

    await todo.save();
    res.status(201).json({ success: true, data: todo, message: 'Tâche créée' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

// GET /api/todos/:id — get a specific todo
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: 'Tâche introuvable', code: 404 });
    }

    if (todo.userId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès refusé', code: 403 });
    }

    res.json({ success: true, data: todo, message: 'Tâche récupérée' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

// PUT /api/todos/:id — update a todo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await Todo.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tâche introuvable', code: 404 });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès refusé', code: 403 });
    }

    const updates = { ...req.body, updatedAt: Date.now() };

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: todo, message: 'Tâche mise à jour' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

// DELETE /api/todos/:id — delete a todo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: 'Tâche introuvable', code: 404 });
    }

    if (todo.userId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès refusé', code: 403 });
    }

    await Todo.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 });
  }
});

module.exports = router;
