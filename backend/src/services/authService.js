const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * Authentication Service
 * Handles JWT tokens, password hashing, etc.
 */

/**
 * Generate access and refresh tokens
 * @param {Object} payload - Token payload {sub, email, role, kindergarten_id}
 * @returns {Object} {access_token, refresh_token}
 */
exports.generateTokens = (payload) => {
  try {
    const access_token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h',
      algorithm: 'HS256',
    });

    const refresh_token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      algorithm: 'HS256',
    });

    return { access_token, refresh_token };
  } catch (error) {
    logger.error('Error generating tokens:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @param {String} secret - Secret key (access or refresh)
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw {
        name: 'TokenExpiredError',
        message: 'Token has expired',
      };
    }
    throw {
      name: 'InvalidTokenError',
      message: 'Invalid token',
    };
  }
};

/**
 * Hash password with bcrypt
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Boolean} True if password matches
 */
exports.comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing passwords:', error);
    return false;
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
exports.extractToken = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Check if password meets security requirements
 * @param {String} password - Password to validate
 * @returns {Object} {valid: boolean, errors: []}
 */
exports.validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
