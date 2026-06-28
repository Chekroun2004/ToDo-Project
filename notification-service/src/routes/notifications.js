const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// GET /api/notifications/health — doit être déclaré AVANT /:userId
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// GET /api/notifications/:userId — récupérer les notifications d'un utilisateur
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès interdit',
        code: 403
      });
    }

    const notifications = await Notification.find({ userId })
      .sort({ isRead: 1, createdAt: -1 });

    res.json({
      success: true,
      data: notifications,
      message: 'Notifications récupérées'
    });
  } catch (error) {
    console.error('Erreur GET notifications:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 500
    });
  }
});

// PUT /api/notifications/:id/read — marquer une notification comme lue
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification introuvable',
        code: 404
      });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès interdit',
        code: 403
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur PUT notification read:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 500
    });
  }
});

// DELETE /api/notifications/clear/:userId — supprimer les notifications lues
// Déclaré après /health mais avant /:userId pour éviter les conflits
router.delete('/clear/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès interdit',
        code: 403
      });
    }

    const result = await Notification.deleteMany({ userId, isRead: true });

    res.json({
      success: true,
      data: { deleted: result.deletedCount },
      message: 'Notifications supprimées'
    });
  } catch (error) {
    console.error('Erreur DELETE notifications:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 500
    });
  }
});

module.exports = router;
