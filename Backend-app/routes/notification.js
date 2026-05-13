const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/', authenticate, notificationController.getMyNotifications);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.post('/run-reminders', authenticate, authorize('admin'), notificationController.runReminders);

module.exports = router;
