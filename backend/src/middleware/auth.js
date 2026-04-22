/**
 * Authentication and Authorization Middleware Exports
 * Consolidates auth-related middleware for easier imports
 */

const authenticate = require('./authenticate');
const authorize = require('./authorize');

module.exports = {
  authenticate,
  authorize,
};
