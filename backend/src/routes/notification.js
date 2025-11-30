const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, notificationController.getNotifications.bind(notificationController));
router.put('/:notificationId/read', auth, notificationController.markAsRead.bind(notificationController));
router.put('/read-all', auth, notificationController.markAllAsRead.bind(notificationController));
router.delete('/:notificationId', auth, notificationController.deleteNotification.bind(notificationController));

module.exports = router;
