const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const skillsController = require('../controllers/skillsController');

/**
 * Skills Routes
 * Base path: /api/v1/skills
 */

/**
 * GET /api/v1/development-areas
 * Get all development areas
 * Roles: all authenticated users
 */
router.get(
  '/development-areas',
  authenticate,
  skillsController.getDevelopmentAreas,
);

/**
 * GET /api/v1/skills
 * List all skills with filtering
 * Roles: all authenticated users
 */
router.get(
  '/',
  authenticate,
  skillsController.listSkills,
);

/**
 * GET /api/v1/skills/:id
 * Get skill by ID
 * Roles: all authenticated users
 */
router.get(
  '/:id',
  authenticate,
  skillsController.getSkillById,
);

/**
 * POST /api/v1/skills
 * Create a new skill
 * Roles: admin, principal
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'principal']),
  skillsController.createSkill,
);

/**
 * PUT /api/v1/skills/:id
 * Update a skill
 * Roles: admin, principal
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'principal']),
  skillsController.updateSkill,
);

/**
 * DELETE /api/v1/skills/:id
 * Delete a skill
 * Roles: admin, principal
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'principal']),
  skillsController.deleteSkill,
);

module.exports = router;
