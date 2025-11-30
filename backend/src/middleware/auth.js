const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId, isActive: true });

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired', 401);
    }
    return ApiResponse.error(res, 'Authentication failed', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.userId, isActive: true });
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
};

module.exports = { auth, optionalAuth };