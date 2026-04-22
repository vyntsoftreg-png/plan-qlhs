const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validator');
const { createUserSchema, updateUserSchema } = require('../utils/validators');

/**
 * Users Routes
 * All routes require authentication
 */

/**
 * GET /api/v1/users
 * List all users with pagination and filters
 * Query params: limit, offset, search, role
 * Admin only
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  userController.list
);

/**
 * POST /api/v1/users
 * Create new user
 * Body: email, name, password, role, kindergarten_id, phone
 * Admin or Principal only
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'principal']),
  validate(createUserSchema),
  userController.create
);

/**
 * GET /api/v1/users/:id
 * Get user by ID
 * User can view own profile, admin can view any
 */
router.get(
  '/:id',
  authenticate,
  userController.getById
);

/**
 * PUT /api/v1/users/:id
 * Update user
 * Body: name, phone, current_password, new_password
 * User can update own profile, admin can update any
 */
router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  userController.update
);

/**
 * DELETE /api/v1/users/:id
 * Delete user (soft delete)
 * Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  userController.delete
);

/**
 * PATCH /api/v1/users/:id/deactivate
 * Deactivate user account (disable without deleting)
 * Admin only
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(['admin']),
  userController.deactivate
);

/**
 * PATCH /api/v1/users/:id/activate
 * Activate user account
 * Admin only
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize(['admin']),
  userController.activate
);

module.exports = router;
