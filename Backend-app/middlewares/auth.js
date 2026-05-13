const jwt = require('jsonwebtoken');

// Middleware d’authentification JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // { sub, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

// Middleware d’autorisation par rôle
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
