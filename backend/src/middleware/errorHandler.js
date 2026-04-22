const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Must be registered LAST in Express
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.details
      ? err.details.map((d) => d.message).join(', ')
      : 'Validation failed';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'You do not have permission to access this resource';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'Database connection failed';
  } else if (err instanceof TypeError) {
    statusCode = 500;
    errorCode = 'TYPE_ERROR';
    message = 'An internal error occurred';
  }

  // Hide sensitive error details in production
  if (process.env.NODE_ENV === 'production') {
    message = statusCode === 500 ? 'Internal server error' : message;
  }

  // Send error response
  res.status(statusCode).json({
    code: errorCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && {
      details: err.message,
      stack: err.stack,
    }),
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
