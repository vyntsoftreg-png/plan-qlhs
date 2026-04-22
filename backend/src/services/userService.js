const pool = require('../config/database');
const authService = require('./authService');
const logger = require('../utils/logger');

/**
 * User Service
 * Handles user database operations and business logic
 */

/**
 * Get user by ID
 * @param {String} userId - User UUID
 * @returns {Object} User object
 */
exports.getUserById = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, email, fullname, role, kindergarten_id, phone, is_active, 
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Get user by email
 * @param {String} email - Email address
 * @returns {Object} User object (including password_hash for auth)
 */
exports.getUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      `SELECT id, email, fullname, password_hash, role, kindergarten_id, 
              phone, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Check if user exists
 * @param {String} email - Email address
 * @returns {Boolean}
 */
exports.isUserExists = async (email) => {
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking if user exists:', error);
    throw error;
  }
};

/**
 * List all users with filters and pagination
 * @param {Object} filters - {search, role}
 * @param {Object} pagination - {limit, offset}
 * @returns {Object} {users, total}
 */
exports.listUsers = async (filters = {}, pagination = {}) => {
  try {
    const { search = '', role = '' } = filters;
    const { limit = 20, offset = 0 } = pagination;

    // Build WHERE clause dynamically
    let whereConditions = ['is_active = true'];
    let params = [];
    let paramIndex = 1;

    // Search filter (search in name and email)
    if (search) {
      whereConditions.push(
        `(fullname ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Role filter
    if (role && ['admin', 'principal', 'teacher', 'parent'].includes(role)) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT id, email, fullname, role, kindergarten_id, phone, is_active, 
              created_at, updated_at
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      users: result.rows,
      total,
    };
  } catch (error) {
    logger.error('Error listing users:', error);
    throw error;
  }
};

/**
 * Create new user
 * @param {Object} userData - {email, name, password, role, kindergarten_id, phone}
 * @returns {Object} Created user object
 */
exports.createUser = async (userData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      email,
      fullname,
      name,
      password,
      role,
      kindergarten_id,
      phone = '',
    } = userData;

    // Check if email already exists
    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw {
        name: 'ValidationError',
        message: 'User with this email already exists',
        code: 'EMAIL_ALREADY_EXISTS',
      };
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, fullname, password_hash, role, kindergarten_id, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, fullname, role, kindergarten_id, phone, is_active, created_at, updated_at`,
      [
        email.toLowerCase(),
        fullname || name,
        passwordHash,
        role,
        kindergarten_id,
        phone,
        true, // is_active = true by default
      ]
    );

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, 'user_created', 'users']
    );

    await client.query('COMMIT');

    logger.info(`User created: ${result.rows[0].id} (${email})`);

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update user
 * @param {String} userId - User UUID
 * @param {Object} updateData - {name, phone, new_password}
 * @param {String} currentPassword - Current password (required if changing password)
 * @returns {Object} Updated user object
 */
exports.updateUser = async (userId, updateData, currentPassword = null) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { fullname, name, role, phone, new_password } = updateData;

    // Get current user to verify password if updating it
    if (new_password) {
      const userResult = await client.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Verify current password
      const passwordMatch = await authService.comparePassword(
        currentPassword,
        userResult.rows[0].password_hash
      );

      if (!passwordMatch) {
        throw {
          name: 'ValidationError',
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
        };
      }
    }

    // Build UPDATE query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (fullname !== undefined || name !== undefined) {
      updateFields.push(`fullname = $${paramIndex}`);
      params.push(fullname || name);
      paramIndex++;
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (new_password) {
      const hashedPassword = await authService.hashPassword(new_password);
      updateFields.push(`password_hash = $${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }

    // Always update updated_at
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Add user ID as last parameter
    params.push(userId);

    // Execute update
    const result = await client.query(
      `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, fullname, role, kindergarten_id, phone, is_active, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [userId, 'user_updated', 'users']
    );

    await client.query('COMMIT');

    logger.info(`User updated: ${userId}`);

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete user (soft delete)
 * @param {String} userId - User UUID
 * @returns {Boolean} True if deleted
 */
exports.deleteUser = async (userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user exists
    const userResult = await client.query(
      `SELECT id FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Soft delete (deactivate) user
    await client.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [userId, 'user_deleted', 'users']
    );

    await client.query('COMMIT');

    logger.info(`User deleted: ${userId}`);

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting user:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deactivate user (set is_active = false)
 * @param {String} userId - User UUID
 * @returns {Object} Updated user object
 */
exports.deactivateUser = async (userId) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE users
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, fullname, role, kindergarten_id, phone, is_active, created_at, updated_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    logger.info(`User deactivated: ${userId}`);

    return result.rows[0];
  } catch (error) {
    logger.error('Error deactivating user:', error);
    throw error;
  }
};

/**
 * Activate user (set is_active = true)
 * @param {String} userId - User UUID
 * @returns {Object} Updated user object
 */
exports.activateUser = async (userId) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE users
       SET is_active = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, email, name, role, kindergarten_id, phone, is_active, created_at, updated_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    logger.info(`User activated: ${userId}`);

    return result.rows[0];
  } catch (error) {
    logger.error('Error activating user:', error);
    throw error;
  }
};
