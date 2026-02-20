const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const { authenticate, authorize } = require('../middlewares/auth');

// ========== ROUTES PUBLIQUES ==========
router.get('/search', articleController.searchArticles);
router.get('/:id', articleController.getArticleById);
router.get('/couturier/:couturierId', articleController.getArticlesByCouturier);

// ========== ROUTES PROTÉGÉES (Couturier) ==========
router.post('/', authenticate, authorize('couturier'), articleController.createArticle);
router.get('/my/articles', authenticate, authorize('couturier'), articleController.getMyArticles);
router.put('/:id', authenticate, authorize('couturier'), articleController.updateArticle);
router.delete('/:id', authenticate, authorize('couturier'), articleController.deleteArticle);

module.exports = router;