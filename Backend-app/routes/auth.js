const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const clientController = require('../controllers/client');
const { authenticate, authorize } = require('../middlewares/auth'); // cite: 1

// POST /auth/register
router.post('/register', userController.register);

// POST /auth/login
router.post('/login', userController.login);

// POST /auth/refresh
router.post('/refresh', userController.refresh);

// GET /auth/verify-tailor/:token - activation email couturier
router.get('/verify-tailor/:token', userController.verifyTailorEmail);

// GET /auth/me (protégée)
router.get('/me', authenticate, userController.me);

// PUT /auth/password (protégée) - Mettre à jour le mot de passe
router.put('/password', authenticate, userController.updatePassword);

// PUT /auth/profile (protégée) - Mettre à jour le profil (nom)
router.put('/profile', authenticate, userController.updateProfile);

// GET /auth/admin-only
router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Zone admin' });
});


module.exports = router;
