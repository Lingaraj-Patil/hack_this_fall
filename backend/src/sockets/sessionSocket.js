const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = (io) => {
  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.username = user.username;
      next();
    } catch (error) {
      logger.error('Socket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} for user ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join clan room if user is in a clan
    User.findById(socket.userId).then(user => {
      if (user.clanId) {
        socket.join(`clan:${user.clanId}`);
        logger.debug(`User ${socket.userId} joined clan room: ${user.clanId}`);
      }
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Study Monitor',
      userId: socket.userId,
      timestamp: Date.now()
    });

    // Real-time session updates
    socket.on('session:update', async (data) => {
      try {
        const { sessionId, type, payload } = data;

        const session = await Session.findOne({
          _id: sessionId,
          userId: socket.userId
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        switch (type) {
          case 'blocked_site_attempt':
            session.analytics.blockedSiteAttempts += 1;
            await session.save();
            
            socket.emit('session:blocked_site', {
              message: 'Blocked site accessed',
              site: payload.site,
              count: session.analytics.blockedSiteAttempts
            });
            break;

          case 'heartbeat':
            // Keep-alive ping
            socket.emit('session:heartbeat_ack', { 
              timestamp: Date.now(),
              sessionId
            });
            break;

          case 'distraction':
            session.analytics.totalDistractions += 1;
            await session.save();
            
            socket.emit('session:distraction_recorded', {
              count: session.analytics.totalDistractions
            });
            break;

          default:
            logger.warn(`Unknown session update type: ${type}`);
            break;
        }
      } catch (error) {
        logger.error('Socket session:update error:', error);
        socket.emit('error', { message: 'Internal error' });
      }
    });

    // Typing indicator for clan chat (future feature)
    socket.on('clan:typing', (data) => {
      if (data.clanId) {
        socket.to(`clan:${data.clanId}`).emit('clan:user_typing', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Make io globally available for emitting from controllers
  global.io = io;
  
  return io;
};
