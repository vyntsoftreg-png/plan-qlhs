const kindergartenService = require('../services/kindergartenService');
const logger = require('../utils/logger');

/**
 * Kindergarten Controller
 * Handles HTTP requests for kindergarten management
 */

/**
 * Get kindergarten profile
 * GET /api/v1/kindergarten/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const kindergartenId = req.user.kindergarten_id;

    const profile = await kindergartenService.getKindergartenProfile(kindergartenId);

    logger.info(`Profile retrieved for kindergarten ${kindergartenId}`, {
      userId: req.user.id,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Kindergarten profile retrieved',
      data: profile,
    });
  } catch (err) {
    logger.error('Error retrieving profile', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Update kindergarten profile
 * PUT /api/v1/kindergarten/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    let kindergartenId = req.user.kindergarten_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    // Authorization: only admin and principal can update
    if (userRole !== 'admin' && userRole !== 'principal') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only admins and principals can update kindergarten profile',
      });
    }

    let updated;
    if (!kindergartenId) {
      // Admin has no kindergarten yet — create one
      updated = await kindergartenService.createKindergarten(updates, userId);
      // Update user's kindergarten_id in the DB
      const db = require('../config/database');
      await db.query('UPDATE users SET kindergarten_id = $1 WHERE id = $2', [updated.id, userId]);
      logger.info(`Kindergarten created: ${updated.id} for user ${userId}`);
    } else {
      updated = await kindergartenService.updateKindergartenProfile(kindergartenId, updates, userId);
    }

    logger.info(`Profile updated for kindergarten ${updated.id}`, { userId });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Kindergarten profile updated successfully',
      data: updated,
    });
  } catch (err) {
    logger.error('Error updating profile', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    return next(err);
  }
};

/**
 * Get kindergarten users
 * GET /api/v1/kindergarten/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const kindergartenId = req.user.kindergarten_id;
    const { role, search, limit, offset } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    const users = await kindergartenService.getKindergartenUsers(
      kindergartenId,
      filters,
    );

    logger.info(`Users listed for kindergarten ${kindergartenId}`, {
      userId: req.user.id,
      count: users.data.length,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: `Retrieved ${users.data.length} users`,
      data: users.data,
      pagination: {
        total: users.total,
        page: users.page,
        pages: users.pages,
      },
    });
  } catch (err) {
    logger.error('Error retrieving users', { error: err.message });
    return next(err);
  }
};

/**
 * Get kindergarten settings and statistics
 * GET /api/v1/kindergarten/settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const kindergartenId = req.user.kindergarten_id;
    const userRole = req.user.role;

    // Authorization: only admin and principal can view settings
    if (userRole !== 'admin' && userRole !== 'principal') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only admins and principals can view kindergarten settings',
      });
    }

    const settings = await kindergartenService.getKindergartenSettings(
      kindergartenId,
    );

    logger.info(`Settings retrieved for kindergarten ${kindergartenId}`, {
      userId: req.user.id,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Kindergarten settings retrieved',
      data: settings,
    });
  } catch (err) {
    logger.error('Error retrieving settings', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    return next(err);
  }
};
