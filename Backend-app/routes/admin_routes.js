const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const adminController = require('../controllers/admin_controller');

// Toutes les routes admin nécessitent d'être authentifié ET admin
router.use([auth, isAdmin]);

// Tableau de bord - statistiques globales
router.get('/stats', adminController.getStats);

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Modération des articles
router.get('/articles', adminController.getAllArticles);
router.patch('/articles/:id/moderate', adminController.moderateArticle);

// Gestion des couturiers
router.get('/couturiers', adminController.getAllCouturiers);

// Supervision des commandes
router.get('/orders', adminController.getAllOrders);

module.exports = router;

