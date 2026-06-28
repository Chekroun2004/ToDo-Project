const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Le nom est requis',
      code: 400
    });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Adresse email invalide',
      code: 400
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères',
      code: 400
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis',
      code: 400
    });
  }

  next();
}

module.exports = { validateRegister, validateLogin };
