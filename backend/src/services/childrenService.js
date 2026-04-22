const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Children Service
 * Handles children database operations and business logic
 */

/**
 * Get child by ID
 * @param {String} childId - Child UUID
 * @returns {Object} Child object with teacher name
 */
exports.getChildById = async (childId) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.fullname, c.date_of_birth, c.gender, c.special_notes,
              c.kindergarten_id, c.teacher_id, u.fullname as teacher_name,
              c.parent_phone, c.parent_email, c.created_at, c.updated_at
       FROM children c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [childId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting child by ID:', error);
    throw error;
  }
};

/**
 * List all children with filters and pagination
 * @param {Object} filters - {search, teacher_id, kindergarten_id, gender}
 * @param {Object} pagination - {limit, offset}
 * @returns {Object} {children, total}
 */
exports.listChildren = async (filters = {}, pagination = {}) => {
  try {
    const {
      search = '',
      teacher_id = '',
      kindergarten_id = '',
      gender = '',
    } = filters;
    const { limit = 20, offset = 0 } = pagination;

    // Build WHERE clause dynamically
    let whereConditions = ['c.deleted_at IS NULL'];
    let params = [];
    let paramIndex = 1;

    // Search filter (search in child name and guardian name)
    if (search) {
      whereConditions.push(
        `(c.fullname ILIKE $${paramIndex} OR c.parent_phone ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Teacher filter
    if (teacher_id) {
      whereConditions.push(`c.teacher_id = $${paramIndex}`);
      params.push(teacher_id);
      paramIndex++;
    }

    // Kindergarten filter
    if (kindergarten_id) {
      whereConditions.push(`c.kindergarten_id = $${paramIndex}`);
      params.push(kindergarten_id);
      paramIndex++;
    }

    // Gender filter
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      whereConditions.push(`c.gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM children c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT c.id, c.fullname, c.date_of_birth, c.gender, c.special_notes,
              c.kindergarten_id, c.teacher_id, u.fullname as teacher_name,
              c.parent_phone, c.parent_email, c.is_active, c.created_at
       FROM children c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      children: result.rows,
      total,
    };
  } catch (error) {
    logger.error('Error listing children:', error);
    throw error;
  }
};

/**
 * Create new child
 * @param {Object} childData - {name, date_of_birth, gender, special_needs_description, kindergarten_id, assigned_teacher_id, guardian_name, guardian_phone}
 * @returns {Object} Created child object
 */
exports.createChild = async (childData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      fullname,
      date_of_birth,
      gender,
      special_notes = '',
      kindergarten_id,
      teacher_id,
      parent_phone = '',
      parent_email = '',
      is_active = true,
    } = childData;

    // Validate that teacher exists and is assigned to this kindergarten
    if (teacher_id) {
      const teacherCheck = await client.query(
        `SELECT id FROM users WHERE id = $1 AND kindergarten_id = $2`,
        [teacher_id, kindergarten_id]
      );

      if (teacherCheck.rows.length === 0) {
        throw {
          name: 'ValidationError',
          message: 'Teacher not found in this kindergarten',
          code: 'INVALID_TEACHER',
        };
      }
    }

    // Create child
    const result = await client.query(
      `INSERT INTO children (fullname, date_of_birth, gender, special_notes,
                            kindergarten_id, teacher_id, parent_phone, parent_email,
                            is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, fullname, date_of_birth, gender, special_notes,
                 kindergarten_id, teacher_id, parent_phone, parent_email,
                 is_active, created_at, updated_at`,
      [
        fullname,
        date_of_birth,
        gender,
        special_notes,
        kindergarten_id,
        teacher_id,
        parent_phone,
        parent_email,
        is_active,
      ]
    );

    const childId = result.rows[0].id;

    // Get teacher name if assigned
    let child = result.rows[0];
    if (teacher_id) {
      const teacherResult = await client.query(
        `SELECT fullname FROM users WHERE id = $1`,
        [teacher_id]
      );
      if (teacherResult.rows.length > 0) {
        child.teacher_name = teacherResult.rows[0].fullname;
      }
    }

    // Log activity (child create)
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [childData.created_by || teacher_id || kindergarten_id || 1, 'child_created', 'children', childId]
    );

    await client.query('COMMIT');

    logger.info(`Child created: ${childId} (${fullname})`);

    return child;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating child:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update child
 * @param {String} childId - Child UUID
 * @param {Object} updateData - {name, gender, special_needs_description, assigned_teacher_id}
 * @returns {Object} Updated child object
 */
exports.updateChild = async (childId, updateData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current child to access kindergarten_id
    const currentChildResult = await client.query(
      `SELECT id, kindergarten_id FROM children WHERE id = $1 AND deleted_at IS NULL`,
      [childId]
    );

    if (currentChildResult.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'Child not found',
        code: 'CHILD_NOT_FOUND',
      };
    }

    const kindergarten_id = currentChildResult.rows[0].kindergarten_id;

    const {
      fullname,
      gender,
      special_notes,
      teacher_id,
      date_of_birth,
      parent_phone,
      parent_email,
      is_active,
    } = updateData;

    // Validate that teacher exists if specified
    if (teacher_id) {
      const teacherCheck = await client.query(
        `SELECT id FROM users WHERE id = $1 AND kindergarten_id = $2`,
        [teacher_id, kindergarten_id]
      );

      if (teacherCheck.rows.length === 0) {
        throw {
          name: 'ValidationError',
          message: 'Teacher not found in this kindergarten',
          code: 'INVALID_TEACHER',
        };
      }
    }

    // Build UPDATE query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (fullname !== undefined) {
      updateFields.push(`fullname = $${paramIndex}`);
      params.push(fullname);
      paramIndex++;
    }

    if (date_of_birth !== undefined) {
      updateFields.push(`date_of_birth = $${paramIndex}`);
      params.push(date_of_birth);
      paramIndex++;
    }

    if (gender !== undefined) {
      updateFields.push(`gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    if (special_notes !== undefined) {
      updateFields.push(`special_notes = $${paramIndex}`);
      params.push(special_notes);
      paramIndex++;
    }

    if (teacher_id !== undefined) {
      updateFields.push(`teacher_id = $${paramIndex}`);
      params.push(teacher_id);
      paramIndex++;
    }

    if (parent_phone !== undefined) {
      updateFields.push(`parent_phone = $${paramIndex}`);
      params.push(parent_phone);
      paramIndex++;
    }

    if (parent_email !== undefined) {
      updateFields.push(`parent_email = $${paramIndex}`);
      params.push(parent_email);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    // Always update updated_at
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Add child ID as last parameter
    params.push(childId);

    // Execute update
    const result = await client.query(
      `UPDATE children
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, fullname, date_of_birth, gender, special_notes,
                 kindergarten_id, teacher_id, parent_phone, parent_email,
                 is_active, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'Child not found',
        code: 'CHILD_NOT_FOUND',
      };
    }

    let child = result.rows[0];

    // Get teacher name if assigned
    if (teacher_id !== undefined && teacher_id) {
      const teacherResult = await client.query(
        `SELECT fullname FROM users WHERE id = $1`,
        [teacher_id]
      );
      if (teacherResult.rows.length > 0) {
        child.teacher_name = teacherResult.rows[0].fullname;
      }
    } else if (child.teacher_id) {
      const teacherResult = await client.query(
        `SELECT fullname FROM users WHERE id = $1`,
        [child.teacher_id]
      );
      if (teacherResult.rows.length > 0) {
        child.teacher_name = teacherResult.rows[0].fullname;
      }
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [child.teacher_id || 1, 'child_updated', 'children', childId]
    );

    await client.query('COMMIT');

    logger.info(`Child updated: ${childId}`);

    return child;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating child:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete child (soft delete)
 * @param {String} childId - Child UUID
 * @returns {Boolean} True if deleted
 */
exports.deleteChild = async (childId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if child exists
    const childResult = await client.query(
      `SELECT id, fullname FROM children WHERE id = $1 AND deleted_at IS NULL`,
      [childId]
    );

    if (childResult.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'Child not found',
        code: 'CHILD_NOT_FOUND',
      };
    }

    const childName = childResult.rows[0].fullname;

    // Soft delete child
    await client.query(
      `UPDATE children SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [childId]
    );

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [1, 'child_deleted', 'children', childId]
    );

    await client.query('COMMIT');

    logger.info(`Child deleted: ${childId}`);

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting child:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get children count by teacher
 * @param {String} teacherId - Teacher UUID
 * @returns {Number} Count of children
 */
exports.getChildrenCountByTeacher = async (teacherId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM children
       WHERE teacher_id = $1 AND deleted_at IS NULL`,
      [teacherId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error getting children count:', error);
    throw error;
  }
};

/**
 * Get children count by kindergarten
 * @param {String} kindergartenId - Kindergarten UUID
 * @returns {Number} Count of children
 */
exports.getChildrenCountByKindergarten = async (kindergartenId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM children
       WHERE kindergarten_id = $1 AND deleted_at IS NULL`,
      [kindergartenId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error getting children count:', error);
    throw error;
  }
};
