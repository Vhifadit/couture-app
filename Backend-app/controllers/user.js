const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

// Helpers
function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '24h';
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

    console.log('📝 Register attempt:', { name, email, role: roleName });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email et password sont requis' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Récupération du rôle, par défaut "client"
    // Rôles autorisés pour inscription publique
    const allowedRoles = ['client', 'couturier'];

    const wantedRoleName = roleName || 'client';

    if (!allowedRoles.includes(wantedRoleName)) {
      return res.status(403).json({
        message: "Vous ne pouvez pas créer un compte avec ce rôle"
      });
    }

    // Chercher le rôle en base
    const role = await Role.findOne({ name: wantedRoleName });
    
    console.log('🔍 Role lookup:', { wantedRoleName, roleFound: !!role });

    if (!role) {
      // Lister les rôles disponibles pour le diagnostic
      const allRoles = await Role.find({}).select('name');
      console.error('❌ Rôle non trouvé. Rôles disponibles:', allRoles.map(r => r.name));
      
      return res.status(400).json({
        message: `Rôle '${wantedRoleName}' non initialisé en base. Rôles disponibles: ${allRoles.map(r => r.name).join(', ')}`
      });
    }

    // Hasher le mot de passe avec bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('🔐 Password hash generated:', { saltRounds: 10, hashLength: passwordHash.length });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role._id,
    });

    console.log('✅ User created:', { userId: user._id, email: user.email });

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
      console.error('❌ Validation error:', err.errors);
      return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    // Erreur de duplication MongoDB
    if (err.code === 11000) {
      console.error('❌ Duplicate key error:', err.message);
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }
    console.error('❌ Register error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📝 Login attempt:', { email, passwordLength: password ? password.length : 0 });

    if (!email || !password) {
      return res.status(400).json({ message: 'email et password sont requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('🔍 User found:', { userId: user._id, email: user.email });
    
    // Tester bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    console.log('🔑 Bcrypt compare result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password mismatch:', email);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Populate le rôle pour obtenir le nom
    await user.populate('role');
    const roleName = user.role?.name || 'client';
    
    console.log('✅ Login successful:', { userId: user._id, email: user.email, role: roleName });

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
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
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

    // Optionnel: vérifier que l'utilisateur existe toujours
    const user = await User.findById(payload.sub).populate('role');
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const roleName = user.role?.name || payload.role || 'client';

    const newAccessToken = signAccessToken({ sub: user._id.toString(), role: roleName });
    const newRefreshToken = signRefreshToken({ sub: user._id.toString(), role: roleName });

    return res.json({ tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
    console.error('❌ Me error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PUT /auth/password (protégé) - Mettre à jour le mot de passe
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Non authentifié' });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Le mot de passe actuel et le nouveau mot de passe sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Le mot de passe actuel est incorrect' });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    console.log('✅ Password updated successfully for user:', userId);

    return res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('❌ Update password error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PUT /auth/profile (protégé) - Mettre à jour le profil (nom)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Non authentifié' });

    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Le nom est requis' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.name = name.trim();
    await user.save();

    await user.populate('role');
    const roleName = user.role?.name || 'client';

    return res.json({
      message: 'Profil mis à jour',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
      }
    });
  } catch (err) {
    console.error('❌ Update profile error:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

