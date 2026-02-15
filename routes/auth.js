const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticate, authorize } = require('../middlewares/auth');

// POST /auth/register
router.post('/register', userController.register);

// POST /auth/login
router.post('/login', userController.login);

// POST /auth/refresh
router.post('/refresh', userController.refresh);

// GET /auth/me (protégée)
router.get('/me', authenticate, userController.me);

// Exemple de route protégée par rôle
// GET /auth/admin-only
router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Zone admin' });
});

module.exports = router;
