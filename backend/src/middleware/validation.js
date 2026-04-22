/**
 * Validation Middleware Exports
 * Consolidates validation-related middleware for easier imports
 */

const validate = require('./validator');

const validateRequest = validate;

module.exports = {
  validate,
  validateRequest,
};
