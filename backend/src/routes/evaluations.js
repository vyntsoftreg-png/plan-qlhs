const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const evaluationsController = require('../controllers/evaluationsController');
const validators = require('../utils/validators');

/**
 * Evaluation Routes (nested under /plans/:planId)
 * Base path: /api/v1/plans/:planId/evaluations
 */

/**
 * POST /api/v1/plans/:planId/evaluations
 * Create a new evaluation for a skill in a plan
 * Roles: teacher, admin, principal
 */
router.post(
  '/',
  authenticate,
  authorize(['teacher', 'admin', 'principal']),
  validateRequest(validators.evaluateSkillSchema, 'body'),
  evaluationsController.create,
);

/**
 * GET /api/v1/plans/:planId/evaluations
 * Get all evaluations for a plan
 * Roles: teacher, admin, principal, parent
 */
router.get(
  '/',
  authenticate,
  authorize(['teacher', 'admin', 'principal', 'parent']),
  evaluationsController.list,
);

/**
 * PUT /api/v1/plans/:planId/evaluations/:skillId
 * Update an evaluation record
 * Roles: teacher, admin, principal
 */
router.put(
  '/:skillId',
  authenticate,
  authorize(['teacher', 'admin', 'principal']),
  evaluationsController.update,
);

/**
 * DELETE /api/v1/plans/:planId/evaluations/:skillId
 * Delete an evaluation record
 * Roles: admin, principal
 */
router.delete(
  '/:skillId',
  authenticate,
  authorize(['admin', 'principal']),
  evaluationsController.delete,
);

/**
 * GET /api/v1/plans/:planId/evaluations/summary
 * Get evaluation summary for a plan
 * Roles: teacher, admin, principal, parent
 */
router.get(
  '/summary',
  authenticate,
  authorize(['teacher', 'admin', 'principal', 'parent']),
  evaluationsController.summary,
);

module.exports = router;
