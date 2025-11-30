const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../middleware/asycHandler');

class NotificationController {
  getNotifications = asyncHandler(async (req, res) => {
    const { limit = 50, unreadOnly = false } = req.query;

    const notifications = await notificationService.getUserNotifications(
      req.userId,
      parseInt(limit),
      unreadOnly === 'true'
    );

    const Notification = require('../models/Notification');
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false
    });

    return ApiResponse.success(res, {
      notifications,
      unreadCount
    });
  });

  markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, req.userId);

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, notification, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.userId);

    return ApiResponse.success(res, null, 'All notifications marked as read');
  });

  deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const Notification = require('../models/Notification');
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.userId
    });

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, null, 'Notification deleted');
  });
}

module.exports = new NotificationController();
