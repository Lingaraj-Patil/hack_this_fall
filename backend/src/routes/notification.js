const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, notificationController.getNotifications);
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router;
