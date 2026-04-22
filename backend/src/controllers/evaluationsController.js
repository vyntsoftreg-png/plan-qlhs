const evaluationsService = require('../services/evaluationsService');
const plansService = require('../services/plansService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Evaluations Controller
 * Handles HTTP requests for skill evaluation recording
 */

/**
 * Create a new evaluation for a skill in a plan
 * POST /api/v1/plans/:planId/evaluations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.create = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { skill_id, evaluation_date, status, notes, evidence_url } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate input (schema already applied by route middleware; this is a safety check)
    const schema = validators.evaluateSkillSchema;
    const { error } = schema.validate({
      skill_id,
      status,
      notes,
      evidence_url,
    });

    if (error) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
        field: error.details[0].path[0],
      });
    }

    // Authorization: Teacher can only evaluate their own plans or if admin/principal
    if (userRole === 'teacher') {
      const plan = await plansService.getPlanById(planId, userId, userRole);
      if (!plan) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to evaluate this plan',
        });
      }
      // Verify teacher is evaluating their own plan
      if (plan.teacher_id !== userId && userRole !== 'admin' && userRole !== 'principal') {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only evaluate your own plans',
        });
      }
    }

    // Use current date if not provided
    const evalDate = evaluation_date || new Date().toISOString().split('T')[0];

    // Create the evaluation
    const evaluation = await evaluationsService.createEvaluation(
      parseInt(planId, 10),
      parseInt(skill_id, 10),
      evalDate,
      status,
      notes,
      evidence_url,
      userId,
    );

    logger.info(`Evaluation created for plan ${planId}, skill ${skill_id}, status: ${status}`, {
      userId,
      planId,
      skillId: skill_id,
    });

    return res.status(201).json({
      code: 'SUCCESS',
      message: 'Evaluation recorded successfully',
      data: evaluation,
    });
  } catch (err) {
    logger.error('Error creating evaluation', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    if (err.statusCode === 409) {
      return res.status(409).json({
        code: 'CONFLICT',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Update an evaluation record
 * PUT /api/v1/plans/:planId/evaluations/:skillId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.update = async (req, res, next) => {
  try {
    const { planId, skillId } = req.params;
    const { status, notes, evidence_url } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate status only (other fields are optional for update)
    if (status) {
      const validStatuses = ['achieved', 'not_achieved', 'partial', 'pending'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Status must be one of: achieved, not_achieved, partial, pending',
          field: 'status',
        });
      }
    }

    // Validate notes and evidence_url if provided
    if (notes && typeof notes !== 'string') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Notes must be a string',
        field: 'notes',
      });
    }

    if (notes && notes.length > 500) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Notes must not exceed 500 characters',
        field: 'notes',
      });
    }

    // Authorization: Teacher can only update their own plans
    if (userRole === 'teacher') {
      const plan = await plansService.getPlanById(planId, userId, userRole);
      if (!plan) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this plan',
        });
      }
      if (plan.teacher_id !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only update your own plan evaluations',
        });
      }
    }

    // Update the evaluation
    const evaluation = await evaluationsService.updateEvaluation(
      parseInt(planId, 10),
      parseInt(skillId, 10),
      status,
      notes,
      evidence_url,
      userId,
    );

    logger.info(`Evaluation updated for plan ${planId}, skill ${skillId}`, {
      userId,
      planId,
      skillId,
      status,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Evaluation updated successfully',
      data: evaluation,
    });
  } catch (err) {
    logger.error('Error updating evaluation', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    if (err.statusCode === 403) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Get all evaluations for a plan
 * GET /api/v1/plans/:planId/evaluations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.list = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { skill_id, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: User can only view evaluations for their own plans (except admin)
    if (userRole === 'teacher') {
      const plan = await plansService.getPlanById(planId, userId, userRole);
      if (!plan) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
        });
      }
    }

    // Build filters
    const filters = {};
    if (skill_id) {
      filters.skill_id = parseInt(skill_id, 10);
    }
    if (status) {
      const validStatuses = ['achieved', 'not_achieved', 'partial', 'pending'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Status must be one of: achieved, not_achieved, partial, pending',
          field: 'status',
        });
      }
      filters.status = status;
    }

    // Get evaluations
    const evaluations = await evaluationsService.getEvaluationsByPlan(
      parseInt(planId, 10),
      filters,
    );

    // Get summary stats
    const summary = await evaluationsService.getEvaluationSummary(parseInt(planId, 10));

    logger.info(`Evaluations retrieved for plan ${planId}`, {
      userId,
      planId,
      count: evaluations.length,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: `Retrieved ${evaluations.length} evaluations`,
      data: evaluations,
      summary,
    });
  } catch (err) {
    logger.error('Error retrieving evaluations', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    if (err.statusCode === 403) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Delete an evaluation record
 * DELETE /api/v1/plans/:planId/evaluations/:skillId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.delete = async (req, res, next) => {
  try {
    const { planId, skillId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: Only admins and principals can delete evaluations
    if (userRole === 'teacher') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only administrators can delete evaluation records',
      });
    }

    // Teacher can delete their own evaluations
    if (userRole === 'teacher') {
      const plan = await plansService.getPlanById(planId, userId, userRole);
      if (!plan || plan.teacher_id !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only delete your own plan evaluations',
        });
      }
    }

    // Delete the evaluation
    const result = await evaluationsService.deleteEvaluation(
      parseInt(planId, 10),
      parseInt(skillId, 10),
      userId,
    );

    logger.info(`Evaluation deleted for plan ${planId}, skill ${skillId}`, {
      userId,
      planId,
      skillId,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Evaluation deleted successfully',
      data: result,
    });
  } catch (err) {
    logger.error('Error deleting evaluation', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    if (err.statusCode === 403) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Get evaluation summary for a plan
 * GET /api/v1/plans/:planId/evaluations/summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.summary = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: User can only view summary for their own plans (except admin)
    if (userRole === 'teacher') {
      const plan = await plansService.getPlanById(planId, userId, userRole);
      if (!plan) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
        });
      }
    }

    // Get summary
    const summary = await evaluationsService.getEvaluationSummary(parseInt(planId, 10));

    logger.info(`Evaluation summary retrieved for plan ${planId}`, {
      userId,
      planId,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Evaluation summary retrieved',
      data: summary,
    });
  } catch (err) {
    logger.error('Error retrieving evaluation summary', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    if (err.statusCode === 403) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: err.message,
      });
    }

    return next(err);
  }
};
