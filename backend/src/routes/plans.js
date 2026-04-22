const express = require('express');
const router = express.Router();
const plansController = require('../controllers/plansController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validator');
const {
  createPlanSchema,
  updatePlanSchema,
} = require('../utils/validators');

/**
 * Education Plans Routes
 * All routes require authentication (filtered by role)
 */

/**
 * GET /api/v1/plans
 * List all plans with pagination and filters
 * Query params: limit, offset, status, child_id, month, year
 * Teachers see only their assigned children's plans
 * Principals see plans in their kindergarten
 * Admin sees all plans
 */
router.get('/', authenticate, plansController.list);

/**
 * POST /api/v1/plans
 * Create new plan from template
 * Body: child_id, month, year, template_id
 * Teacher, Principal (with kindergarten check), or Admin
 */
router.post(
  '/',
  authenticate,
  validate(createPlanSchema),
  plansController.create
);

/**
 * GET /api/v1/plans/:id
 * Get full plan with all skills and evaluations
 */
router.get('/:id', authenticate, plansController.getById);

/**
 * PUT /api/v1/plans/:id
 * Update plan status
 * Body: status (draft|completed|submitted|approved)
 */
router.put(
  '/:id',
  authenticate,
  validate(updatePlanSchema),
  plansController.update
);

/**
 * DELETE /api/v1/plans/:id
 * Delete plan (soft delete)
 * Cannot delete approved plans
 */
router.delete('/:id', authenticate, plansController.delete);

/**
 * GET /api/v1/plans/:id/export-pdf
 * Export plan as PDF
 */
router.get('/:id/export-pdf', authenticate, plansController.exportPdf);

/**
 * GET /api/v1/plans/:id/progress
 * Get plan progress/achievement summary
 */
router.get('/:id/progress', authenticate, plansController.getProgress);

/**
 * PUT /api/v1/plans/:planId/goals/:goalId
 * Evaluate a plan goal
 */
router.put('/:planId/goals/:goalId', authenticate, plansController.evaluateGoal);

/**
 * GET /api/v1/plans/:id/export
 * Export plan evaluation as Word document
 */
router.get('/:id/export', authenticate, plansController.exportEvaluation);

/**
 * GET /api/v1/plans/:id/export-plan
 * Export plan as Word document (review/print - no result column)
 */
router.get('/:id/export-plan', authenticate, plansController.exportPlan);

/**
 * POST /api/v1/plans/:id/sync-template
 * Sync plan goals from template (add new goals from updated template)
 */
router.post('/:id/sync-template', authenticate, plansController.syncTemplate);

/**
 * POST /api/v1/plans/:id/clone
 * Clone a plan to another child/month/year
 */
router.post('/:id/clone', authenticate, plansController.clonePlan);

module.exports = router;
