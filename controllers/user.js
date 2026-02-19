const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

// Helpers
function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role: roleName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email et password sont requis' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Récupération du rôle, par défaut "client"
    // 🔒 Rôles autorisés pour inscription publique
const allowedRoles = ['client', 'couturier'];

const wantedRoleName = roleName || 'client';

if (!allowedRoles.includes(wantedRoleName)) {
  return res.status(403).json({
    message: "Vous ne pouvez pas créer un compte avec ce rôle"
  });
}

const role = await Role.findOne({ name: wantedRoleName });

if (!role) {
  return res.status(400).json({
    message: `Rôle ${wantedRoleName} non initialisé en base`
  });
}

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role._id,
    });

    // Façonner la réponse sans passwordHash
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Générer tokens
    const accessToken = signAccessToken({ sub: user._id.toString(), role: role.name });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), role: role.name });

    return res.status(201).json({ user: safeUser, tokens: { accessToken, refreshToken } });
  } catch (err) {
    // Validation mongoose
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email et password sont requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const roleName = user.role?.name || 'client';

    const accessToken = signAccessToken({ sub: user._id.toString(), role: roleName });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), role: roleName });

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: roleName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ user: safeUser, tokens: { accessToken, refreshToken } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken requis' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
    let payload;
    try {
      payload = jwt.verify(refreshToken, secret);
    } catch (e) {
      return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
    }

    // Optionnel: vérifier que l’utilisateur existe toujours
    const user = await User.findById(payload.sub).populate('role');
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const roleName = user.role?.name || payload.role || 'client';

    const newAccessToken = signAccessToken({ sub: user._id.toString(), role: roleName });
    const newRefreshToken = signRefreshToken({ sub: user._id.toString(), role: roleName });

    return res.json({ tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /auth/me (protégé)
exports.me = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Non authentifié' });

    const user = await User.findById(userId).populate('role');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role?.name || 'client',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
