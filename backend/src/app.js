require('dotenv').config();
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Import ALL routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const visionRoutes = require('./routes/vision');
const gamificationRoutes = require('./routes/gamification');
const clanRoutes = require('./routes/clan');
const notificationRoutes = require('./routes/notification');
const todoRoutes = require('./routes/todo');
const noteRoutes = require('./routes/note');


const app = express();

// Trust proxy (important for rate limiting behind proxies like Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now, customize later
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression & parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50)
    });
  });
  
  next();
});

// Rate limiting - Apply to all API routes
app.use('/api/', apiLimiter);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'study-monitor-api',
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/todos', todoRoutes);
app.use('/api/notes', noteRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Study Monitor API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      sessions: '/api/sessions',
      vision: '/api/vision',
      gamification: '/api/gamification',
      clans: '/api/clans',
      notifications: '/api/notifications'
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
