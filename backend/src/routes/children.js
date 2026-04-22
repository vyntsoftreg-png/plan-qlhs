const express = require('express');
const router = express.Router();
const childrenController = require('../controllers/childrenController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validator');
const {
  createChildSchema,
  updateChildSchema,
} = require('../utils/validators');

/**
 * Children Routes
 * All routes require authentication (except list can be filtered based on role)
 */

/**
 * GET /api/v1/children
 * List all children with pagination and filters
 * Query params: limit, offset, search, teacher_id, kindergarten_id, gender
 * Teachers see only their assigned children
 * Principals see all children in their kindergarten
 * Admin sees all children
 */
router.get('/', authenticate, childrenController.list);

/**
 * POST /api/v1/children
 * Create new child
 * Body: name, date_of_birth, gender, special_needs_description, kindergarten_id, assigned_teacher_id
 * Admin or Principal only
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'principal']),
  validate(createChildSchema),
  childrenController.create
);

/**
 * GET /api/v1/children/:id
 * Get child by ID
 * User can view if: they are assigned teacher, principal in same kindergarten, or admin
 */
router.get('/:id', authenticate, childrenController.getById);

/**
 * PUT /api/v1/children/:id
 * Update child
 * Body: name, gender, special_needs_description, assigned_teacher_id
 * Admin can update any, Principal can update in own kindergarten, Teacher can update own assignments
 */
router.put(
  '/:id',
  authenticate,
  validate(updateChildSchema),
  childrenController.update
);

/**
 * DELETE /api/v1/children/:id
 * Delete child (soft delete)
 * Admin or Principal only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'principal']),
  childrenController.delete
);

/**
 * GET /api/v1/children/:id/progress
 * Get child's progress/achievement summary
 * User can view if: they are assigned teacher or admin/principal
 */
router.get('/:id/progress', authenticate, childrenController.getProgress);

module.exports = router;
