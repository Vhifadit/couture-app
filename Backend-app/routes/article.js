const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const { authenticate, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// ========== ROUTES PUBLIQUES ==========
router.get('/search', articleController.searchArticles);
router.get('/couturier/:couturierId', articleController.getArticlesByCouturier);

// ========== ROUTES PROTÉGÉES (Couturier) ==========
router.post('/', authenticate, authorize('couturier'), upload.array('photos', 5), articleController.createArticle);
router.get('/my/articles', authenticate, authorize('couturier'), articleController.getMyArticles);
router.put('/:id', authenticate, authorize('couturier'), upload.array('photos', 5), articleController.updateArticle);
router.delete('/:id', authenticate, authorize('couturier'), articleController.deleteArticle);
router.get('/:id', articleController.getArticleById);

module.exports = router;
