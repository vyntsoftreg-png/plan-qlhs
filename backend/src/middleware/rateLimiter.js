const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiting middleware
 * Configuration from .env variables
 */

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
    retryAfter: (req, res) => res.getHeader('Retry-After'),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again in 15 minutes',
  },
  handler: (req, res) => {
    logger.warn(`Authentication rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again in 15 minutes',
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Very strict rate limiter for the one-time admin setup endpoint
 * Max 3 attempts per 24 hours per IP
 */
const setupLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Setup rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many setup attempts. Try again later.',
      timestamp: new Date().toISOString(),
    });
  },
});

module.exports = {
  limiter,
  authLimiter,
  setupLimiter,
};
