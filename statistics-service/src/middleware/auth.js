const axios = require('axios');

const NGINX_URL = process.env.NGINX_URL || 'http://nginx';

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant ou invalide',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];

    const response = await axios.get(`${NGINX_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { userId, email } = response.data.data || response.data;
    req.user = { userId, email };

    next();
  } catch (err) {
    const status = err.response?.status || 401;
    return res.status(status).json({
      success: false,
      error: 'Token invalide ou expiré',
      code: status
    });
  }
};
