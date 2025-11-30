const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectDB();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode`);
      logger.info(`📡 Listening on http://${HOST}:${PORT}`);
      logger.info(`💚 Health check: http://${HOST}:${PORT}/health`);
    });

    // Setup Socket.IO for real-time communication
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    // Socket.IO connection handling
    require('./src/sockets/sessionSocket')(io);
    
    logger.info('🔌 Socket.IO initialized');

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, closing server gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          
          const { getRedisClient } = require('./src/config/redis');
          const redisClient = getRedisClient();
          if (redisClient) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }
        } catch (error) {
          logger.error('Error during shutdown:', error);
        }
        
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not being required (for testing)
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
