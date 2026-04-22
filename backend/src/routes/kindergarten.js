const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const kindergartenController = require('../controllers/kindergartenController');

/**
 * Kindergarten Routes
 * Base path: /api/v1/kindergarten
 */

/**
 * GET /api/v1/kindergarten/profile
 * Get kindergarten profile with statistics
 * Roles: all authenticated users
 */
router.get(
  '/profile',
  authenticate,
  kindergartenController.getProfile,
);

/**
 * PUT /api/v1/kindergarten/profile
 * Update kindergarten profile
 * Roles: admin, principal
 */
router.put(
  '/profile',
  authenticate,
  authorize(['admin', 'principal']),
  kindergartenController.updateProfile,
);

/**
 * GET /api/v1/kindergarten/users
 * Get all users in kindergarten
 * Roles: admin, principal
 */
router.get(
  '/users',
  authenticate,
  authorize(['admin', 'principal']),
  kindergartenController.getUsers,
);

/**
 * GET /api/v1/kindergarten/settings
 * Get kindergarten settings and statistics
 * Roles: admin, principal
 */
router.get(
  '/settings',
  authenticate,
  authorize(['admin', 'principal']),
  kindergartenController.getSettings,
);

module.exports = router;
