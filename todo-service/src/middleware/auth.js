const axios = require('axios');

const NGINX_URL = process.env.NGINX_URL || 'http://nginx';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant', code: 401 });
  }

  try {
    const response = await axios.get(`${NGINX_URL}/api/auth/verify`, {
      headers: { Authorization: authHeader }
    });

    if (response.status !== 200 || !response.data.data?.valid) {
      return res.status(401).json({ success: false, error: 'Token invalide', code: 401 });
    }

    req.user = {
      userId: response.data.data.userId,
      email: response.data.data.email
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré', code: 401 });
  }
}

module.exports = authMiddleware;
