const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and extracts user info
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 'MISSING_TOKEN',
        message: 'Authorization header required',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authService.extractToken(authHeader);
    if (!token) {
      return res.status(401).json({
        code: 'INVALID_AUTH_HEADER',
        message: 'Invalid Authorization header format. Use: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify token
    try {
      const decoded = authService.verifyToken(
        token,
        process.env.JWT_ACCESS_SECRET
      );
      req.user = { ...decoded, id: decoded.sub };
      logger.debug(`User authenticated: ${decoded.sub}`);
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh.',
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication error',
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = authenticate;
