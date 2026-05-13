// middlewares/isAdmin.js
// Vérifie que l'utilisateur authentifié est bien un administrateur
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

module.exports = isAdmin;
