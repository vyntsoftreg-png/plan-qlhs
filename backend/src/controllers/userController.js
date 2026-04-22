const userService = require('../services/userService');
const logger = require('../utils/logger');

/**
 * User Controller
 * Handles HTTP requests for user management
 */

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
exports.list = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, search = '', role = '' } = req.query;

    // Validate pagination
    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    const { users, total } = await userService.listUsers(
      { search, role },
      { limit: validLimit, offset: validOffset }
    );

    logger.info(`Listed ${users.length} users (total: ${total})`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          limit: validLimit,
          offset: validOffset,
          total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error listing users:', error);
    return next(error);
  }
};

/**
 * GET /api/v1/users/:id
 * Get single user by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization: user can view their own profile or admin can view any
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this user',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Retrieved user: ${id}`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting user:', error);
    return next(error);
  }
};

/**
 * POST /api/v1/users
 * Create new user (admin/principal only)
 */
exports.create = async (req, res, next) => {
  try {
    const userData = { ...req.body };

    // Inject kindergarten_id from current user if not provided
    if (!userData.kindergarten_id) {
      userData.kindergarten_id = req.user.kindergarten_id;
    }

    // Check if email already exists
    const existsUser = await userService.getUserByEmail(userData.email);
    if (existsUser) {
      return res.status(409).json({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A user with this email already exists',
        timestamp: new Date().toISOString(),
      });
    }

    const newUser = await userService.createUser(userData);

    logger.info(`User created: ${newUser.id} by ${req.user.id}`);

    return res.status(201).json({
      code: 'SUCCESS',
      message: 'User created successfully',
      data: newUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating user:', error);

    // Handle specific errors
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        code: 'EMAIL_ALREADY_EXISTS',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * PUT /api/v1/users/:id
 * Update user (user can update self, admin can update any)
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { current_password } = updateData;

    // Check authorization: user can update their own profile or admin can update any
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this user',
        timestamp: new Date().toISOString(),
      });
    }

    const updatedUser = await userService.updateUser(
      id,
      updateData,
      current_password
    );

    logger.info(`User updated: ${id}`);

    return res.status(200).json({
      code: 'USER_UPDATED',
      message: 'User updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating user:', error);

    // Handle specific errors
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'INVALID_PASSWORD') {
      return res.status(401).json({
        code: 'INVALID_PASSWORD',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Delete user (soft delete - admin only)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        code: 'CANNOT_DELETE_SELF',
        message: 'You cannot delete your own account',
        timestamp: new Date().toISOString(),
      });
    }

    await userService.deleteUser(id);

    logger.info(`User deleted: ${id} by ${req.user.id}`);

    return res.status(200).json({
      code: 'USER_DELETED',
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting user:', error);

    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/deactivate
 * Deactivate user account (without deleting)
 */
exports.deactivate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userService.deactivateUser(id);

    logger.info(`User deactivated: ${id} by ${req.user.id}`);

    return res.status(200).json({
      code: 'USER_DEACTIVATED',
      message: 'User deactivated successfully',
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deactivating user:', error);

    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/activate
 * Activate deactivated user account
 */
exports.activate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userService.activateUser(id);

    logger.info(`User activated: ${id} by ${req.user.id}`);

    return res.status(200).json({
      code: 'USER_ACTIVATED',
      message: 'User activated successfully',
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error activating user:', error);

    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};
