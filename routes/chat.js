const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { authenticate } = require('../middleware/auth'); // Votre middleware JWT

// Toutes les routes nécessitent authentification
router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getMyConversations);
router.get('/conversations/unread', chatController.getUnreadCount);
router.get('/conversations/:id', chatController.getConversation);
router.post('/conversations/:id/close', chatController.closeConversation);
router.post('/conversations/:id/read', chatController.markAsRead);

// Messages
router.post('/conversations/:id/messages', chatController.sendMessage);

module.exports = router;