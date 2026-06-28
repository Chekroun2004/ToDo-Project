const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/auth');

// GET /api/comments/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'comment-service' });
});

// GET /api/comments/todo/:todoId — récupérer tous les commentaires d'un todo
router.get('/todo/:todoId', authMiddleware, async (req, res) => {
  try {
    const { todoId } = req.params;
    const comments = await Comment.find({ todoId }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: comments,
      message: 'Commentaires récupérés'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des commentaires',
      code: 500
    });
  }
});

// POST /api/comments — créer un commentaire
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { todoId, content, authorName } = req.body;

    if (!todoId) {
      return res.status(400).json({
        success: false,
        error: 'todoId est requis',
        code: 400
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu est requis',
        code: 400
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu ne doit pas dépasser 1000 caractères',
        code: 400
      });
    }

    const resolvedAuthorName = authorName || req.user.email.split('@')[0];

    const comment = new Comment({
      todoId,
      userId: req.user.userId,
      authorName: resolvedAuthorName,
      content
    });

    await comment.save();

    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Commentaire ajouté'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du commentaire',
      code: 500
    });
  }
});

// PUT /api/comments/:id — mettre à jour un commentaire
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire introuvable',
        code: 404
      });
    }

    if (comment.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé : vous n\'êtes pas l\'auteur de ce commentaire',
        code: 403
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu est requis',
        code: 400
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu ne doit pas dépasser 1000 caractères',
        code: 400
      });
    }

    comment.content = content;
    comment.updatedAt = new Date();
    await comment.save();

    return res.json({
      success: true,
      data: comment,
      message: 'Commentaire mis à jour'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du commentaire',
      code: 500
    });
  }
});

// DELETE /api/comments/:id — supprimer un commentaire
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire introuvable',
        code: 404
      });
    }

    if (comment.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé : vous n\'êtes pas l\'auteur de ce commentaire',
        code: 403
      });
    }

    await comment.deleteOne();

    return res.json({
      success: true,
      data: null,
      message: 'Commentaire supprimé'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du commentaire',
      code: 500
    });
  }
});

module.exports = router;
