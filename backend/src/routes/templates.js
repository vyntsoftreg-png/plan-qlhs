const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const templatesController = require('../controllers/templatesController');

/**
 * Templates Routes
 * Base path: /api/v1/templates
 */

/**
 * GET /api/v1/templates
 * List templates for kindergarten
 * Roles: admin, principal, teacher
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'principal', 'teacher']),
  templatesController.listTemplates,
);

/**
 * GET /api/v1/templates/:id
 * Get template by ID with all skills
 * Roles: admin, principal, teacher
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'principal', 'teacher']),
  templatesController.getTemplateById,
);

/**
 * POST /api/v1/templates
 * Create a new template
 * Roles: admin, principal
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'principal']),
  templatesController.createTemplate,
);

/**
 * PUT /api/v1/templates/:id
 * Update a template
 * Roles: admin, principal
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'principal']),
  templatesController.updateTemplate,
);

/**
 * DELETE /api/v1/templates/:id
 * Delete a template
 * Roles: admin, principal
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'principal']),
  templatesController.deleteTemplate,
);

/**
 * POST /api/v1/templates/:id/clone
 * Clone a template
 * Roles: admin, principal, teacher
 */
router.post(
  '/:id/clone',
  authenticate,
  authorize(['admin', 'principal', 'teacher']),
  templatesController.cloneTemplate,
);

module.exports = router;
