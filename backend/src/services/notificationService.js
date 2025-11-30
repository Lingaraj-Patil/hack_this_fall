const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class NotificationService {
  async create(userId, type, title, message, data = {}, priority = 'medium') {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
        priority
      });

      await notification.save();
      
      // TODO: Emit via Socket.IO for real-time delivery
      // io.to(userId).emit('notification', notification);

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new NotificationService();