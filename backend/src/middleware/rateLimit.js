const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const apiLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  // Skip limiting in local development to avoid blocking rapid local polling and testing
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') return true;
    const ip = (req.ip || '').toString();
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
    return false;
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user id when available to key limits per-user instead of per-IP (helps NAT/load balancers)
  keyGenerator: (req, res) => {
    try {
      if (req.user && req.user._id) return req.user._id.toString();
    } catch (e) {}
    return req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    const resetSeconds = req.rateLimit && req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60));
    res.setHeader('Retry-After', String(resetSeconds));
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: resetSeconds
    });
  }
});

const visionApiLimiter = rateLimit({
  windowMs: parseInt(process.env.VISION_RATE_LIMIT_WINDOW_MS) || 2000, // 2 seconds
  // allow slightly larger bursts from clients locally; make configurable via env
  max: parseInt(process.env.VISION_RATE_LIMIT_MAX) || 6,
  skip: (req) => {
    // Allow unlimited in development or from localhost to avoid dev 429s
    if (process.env.NODE_ENV === 'development') return true;
    const ip = (req.ip || '').toString();
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
    return false;
  },
  skipSuccessfulRequests: false,
  // Key by session or user if available so clients behind same IP don't clash
  keyGenerator: (req) => {
    try {
      if (req.body && req.body.sessionId) return req.body.sessionId.toString();
      if (req.user && req.user._id) return req.user._id.toString();
    } catch (e) {}
    return req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Vision rate limit exceeded for IP: ${req.ip}`);
    const resetSeconds = req.rateLimit && req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : Math.ceil((parseInt(process.env.VISION_RATE_LIMIT_WINDOW_MS) || 2000) / 1000);
    res.setHeader('Retry-After', String(resetSeconds));
    res.status(429).json({ success: false, message: 'Vision API rate limit exceeded', retryAfter: resetSeconds });
  },
  message: 'Vision API rate limit exceeded'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts'
});

module.exports = { apiLimiter, visionApiLimiter, authLimiter };
