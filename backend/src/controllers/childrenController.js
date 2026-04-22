const childrenService = require('../services/childrenService');
const logger = require('../utils/logger');

/**
 * Children Controller
 * Handles HTTP requests for children management
 */

/**
 * GET /api/v1/children
 * List all children with filters
 */
exports.list = async (req, res, next) => {
  try {
    const {
      limit = 20,
      offset = 0,
      search = '',
      teacher_id = '',
      kindergarten_id = '',
      gender = '',
    } = req.query;

    // Validate pagination
    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    // For non-admin users, filter by their kindergarten
    let filters = { search, teacher_id, kindergarten_id, gender };

    if (req.user.role === 'teacher') {
      // Teachers can only see children assigned to them or in their kindergarten
      filters.teacher_id = req.user.id;
    } else if (req.user.role === 'principal') {
      // Principals can only see children in their kindergarten
      filters.kindergarten_id = req.user.kindergarten_id;
    }

    const { children, total } = await childrenService.listChildren(
      filters,
      { limit: validLimit, offset: validOffset }
    );

    logger.info(`Listed ${children.length} children (total: ${total})`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Children retrieved successfully',
      data: {
        children,
        pagination: {
          limit: validLimit,
          offset: validOffset,
          total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error listing children:', error);
    return next(error);
  }
};

/**
 * GET /api/v1/children/:id
 * Get single child by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const child = await childrenService.getChildById(id);

    if (!child) {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization: Principal/Admin can view any, Teacher can view own assignments
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'principal' &&
      child.assigned_teacher_id !== req.user.id
    ) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this child',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Retrieved child: ${id}`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Child retrieved successfully',
      data: child,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting child:', error);
    return next(error);
  }
};

/**
 * POST /api/v1/children
 * Create new child (admin/principal only)
 */
exports.create = async (req, res, next) => {
  try {
    const childData = { ...req.body };

    // Inject kindergarten_id from current user if not provided
    if (!childData.kindergarten_id) {
      childData.kindergarten_id = req.user.kindergarten_id;
    }
    childData.created_by = req.user.id;

    // Principals can only add children to their kindergarten
    if (req.user.role === 'principal') {
      if (childData.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only add children to your own kindergarten',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const newChild = await childrenService.createChild(childData);

    logger.info(`Child created: ${newChild.id} by ${req.user.id}`);

    return res.status(201).json({
      code: 'SUCCESS',
      message: 'Child created successfully',
      data: newChild,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating child:', error);

    // Handle specific errors
    if (error.code === 'INVALID_TEACHER') {
      return res.status(400).json({
        code: 'INVALID_TEACHER',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * PUT /api/v1/children/:id
 * Update child (admin/principal can update any, teacher can update own)
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get current child to check permissions
    const currentChild = await childrenService.getChildById(id);

    if (!currentChild) {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (
      req.user.role === 'teacher' &&
      currentChild.assigned_teacher_id !== req.user.id
    ) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only update children assigned to you',
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.role === 'principal') {
      if (currentChild.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only update children in your kindergarten',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updatedChild = await childrenService.updateChild(id, updateData);

    logger.info(`Child updated: ${id}`);

    return res.status(200).json({
      code: 'CHILD_UPDATED',
      message: 'Child updated successfully',
      data: updatedChild,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating child:', error);

    // Handle specific errors
    if (error.code === 'CHILD_NOT_FOUND') {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'INVALID_TEACHER') {
      return res.status(400).json({
        code: 'INVALID_TEACHER',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * DELETE /api/v1/children/:id
 * Delete child (soft delete - admin/principal only)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get current child to check permissions
    const currentChild = await childrenService.getChildById(id);

    if (!currentChild) {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization for principals
    if (req.user.role === 'principal') {
      if (currentChild.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only delete children in your kindergarten',
          timestamp: new Date().toISOString(),
        });
      }
    }

    await childrenService.deleteChild(id);

    logger.info(`Child deleted: ${id} by ${req.user.id}`);

    return res.status(200).json({
      code: 'CHILD_DELETED',
      message: 'Child deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting child:', error);

    if (error.code === 'CHILD_NOT_FOUND') {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * GET /api/v1/children/:id/progress
 * Get child's progress/achievement summary
 */
exports.getProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get current child to check permissions
    const currentChild = await childrenService.getChildById(id);

    if (!currentChild) {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (
      req.user.role === 'teacher' &&
      currentChild.assigned_teacher_id !== req.user.id
    ) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this child',
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Implement progress calculation logic
    // For now, return placeholder
    const progress = {
      child_id: id,
      child_name: currentChild.name,
      overall_progress: {
        percentage: 0,
        achieved: 0,
        not_achieved: 0,
        partial: 0,
        pending: 0,
      },
      by_area: {
        vận_động_thô: 0,
        vận_động_tinh: 0,
        nhận_biết_ngôn_ngữ: 0,
        cá_nhân_xã_hội: 0,
      },
    };

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Child progress retrieved successfully',
      data: progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting child progress:', error);
    return next(error);
  }
};
