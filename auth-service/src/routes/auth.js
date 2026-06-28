const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validate');

const NGINX_URL = process.env.NGINX_URL || 'http://nginx';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

function generateAccessToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already in use
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Un compte avec cet email existe déjà',
        code: 409
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    await user.save();

    // Notify user-service via NGINX (non-blocking)
    try {
      await axios.post(`${NGINX_URL}/api/users/internal`, {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      });
    } catch (axiosError) {
      console.error('Failed to notify user-service after register:', axiosError.message);
      // Continue without blocking registration
    }

    // Generate tokens
    const token = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id, user.email);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      message: 'Inscription réussie'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 500
    });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        code: 404
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect',
        code: 401
      });
    }

    // Generate tokens
    const token = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id, user.email);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      message: 'Connexion réussie'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 500
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide',
        code: 401
      });
    }

    // Clear refresh token in DB
    await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Déconnexion réussie'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 500
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token manquant',
        code: 400
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token invalide ou expiré',
        code: 401
      });
    }

    // Find user with matching refresh token
    const user = await User.findOne({ _id: decoded.userId, refreshToken });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token non reconnu',
        code: 401
      });
    }

    // Generate new access token
    const token = generateAccessToken(user._id, user.email);

    return res.status(200).json({
      success: true,
      data: { token },
      message: 'Token rafraîchi'
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 500
    });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
        code: 401
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      },
      message: 'Token valide'
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 500
    });
  }
});

// GET /api/auth/health
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'auth-service'
  });
});

module.exports = router;
