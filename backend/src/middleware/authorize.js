const logger = require('../utils/logger');

/**
 * Authorization middleware
 * Checks user role and permissions
 * Usage: app.get('/admin', authorize(['admin']), (req, res) => {})
 */
const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      // If no specific roles required, allow all authenticated users
      if (requiredRoles.length === 0) {
        return next();
      }

      // Check if user's role is in required roles
      if (!requiredRoles.includes(req.user.role)) {
        logger.warn(
          `Unauthorized access attempt by ${req.user.sub} with role ${req.user.role} to ${req.path}`
        );
        return res.status(403).json({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires one of these roles: ${requiredRoles.join(', ')}`,
          required_roles: requiredRoles,
          user_role: req.user.role,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({
        code: 'AUTHZ_ERROR',
        message: 'Authorization error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

module.exports = authorize;
