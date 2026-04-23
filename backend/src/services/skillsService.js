const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Skills Service
 * Manages skill definitions with goals and activities
 */

/**
 * List all skills with filtering, pagination, and goal counts
 */
exports.listSkills = async (kindergartenId, filters = {}) => {
  const client = await db.connect();
  try {
    const { development_area_id, search, limit = 20, offset = 0 } = filters;

    let whereConditions = ['s.deleted_at IS NULL'];
    const params = [];
    let paramCount = 0;

    if (development_area_id) {
      paramCount++;
      whereConditions.push(`s.development_area_id = $${paramCount}`);
      params.push(development_area_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await client.query(
      `SELECT COUNT(DISTINCT s.id) as total FROM skills s WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(limit, offset);
    const result = await client.query(
      `SELECT s.id, s.development_area_id, da.name as development_area_name, da.color_code,
              s.name, s.description, s.instruction_text,
              s.display_order, s.created_by, u.fullname as created_by_name,
              s.created_at, s.updated_at,
              COUNT(sg.id) as goal_count
       FROM skills s
       INNER JOIN development_areas da ON s.development_area_id = da.id
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN skill_goals sg ON s.id = sg.skill_id
       WHERE ${whereClause}
       GROUP BY s.id, da.name, da.color_code, da.display_order, u.fullname
       ORDER BY da.display_order ASC, s.display_order ASC, s.name ASC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params,
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        development_area_id: row.development_area_id,
        development_area_name: row.development_area_name,
        color_code: row.color_code,
        name: row.name,
        description: row.description,
        instruction_text: row.instruction_text,
        display_order: row.display_order,
        created_by: row.created_by,
        created_by_name: row.created_by_name,
        goal_count: parseInt(row.goal_count, 10),
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } finally {
    client.release();
  }
};

/**
 * Get skill by ID with goals
 */
exports.getSkillById = async (skillId) => {
  const client = await db.connect();
  try {
    const skillResult = await client.query(
      `SELECT s.id, s.development_area_id, da.name as development_area_name, da.color_code,
              s.name, s.description, s.instruction_text,
              s.display_order, s.created_by, u.fullname as created_by_name,
              s.created_at, s.updated_at
       FROM skills s
       INNER JOIN development_areas da ON s.development_area_id = da.id
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [skillId],
    );

    if (skillResult.rows.length === 0) {
      const error = new Error('Skill not found');
      error.statusCode = 404;
      throw error;
    }

    const skill = skillResult.rows[0];

    const goalsResult = await client.query(
      `SELECT id, section_name, goal_title, activities, display_order
       FROM skill_goals WHERE skill_id = $1
       ORDER BY display_order ASC, id ASC`,
      [skillId],
    );

    return {
      ...skill,
      goals: goalsResult.rows,
    };
  } finally {
    client.release();
  }
};

/**
 * Create a new skill with goals
 */
exports.createSkill = async (data, createdBy) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { development_area_id, name, description, instruction_text, goals } = data;

    // Verify development area exists
    const areaResult = await client.query('SELECT id FROM development_areas WHERE id = $1', [development_area_id]);
    if (areaResult.rows.length === 0) {
      const error = new Error('Development area not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for duplicate name in same development area
    const dupResult = await client.query(
      'SELECT id FROM skills WHERE development_area_id = $1 AND name = $2 AND deleted_at IS NULL',
      [development_area_id, name],
    );
    if (dupResult.rows.length > 0) {
      const error = new Error('Kỹ năng này đã tồn tại trong lĩnh vực phát triển');
      error.statusCode = 409;
      throw error;
    }

    const skillResult = await client.query(
      `INSERT INTO skills (development_area_id, name, description, instruction_text, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [development_area_id, name, description || null, instruction_text || null, createdBy],
    );
    const skill = skillResult.rows[0];

    // Insert goals
    const insertedGoals = [];
    if (goals && goals.length > 0) {
      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        const goalResult = await client.query(
          `INSERT INTO skill_goals (skill_id, section_name, goal_title, activities, display_order)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [skill.id, g.section_name || null, g.goal_title, g.activities || null, i],
        );
        insertedGoals.push(goalResult.rows[0]);
      }
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES ($1, 'skill_created', 'skills', $2, NOW())`,
      [createdBy, skill.id],
    );

    await client.query('COMMIT');
    logger.info(`Skill created: ${skill.id} with ${insertedGoals.length} goals`);
    return { ...skill, goals: insertedGoals };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a skill and its goals
 */
exports.updateSkill = async (skillId, data, updatedBy) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { name, description, instruction_text, development_area_id, goals } = data;

    // Verify skill exists
    const skillResult = await client.query(
      'SELECT * FROM skills WHERE id = $1 AND deleted_at IS NULL',
      [skillId],
    );
    if (skillResult.rows.length === 0) {
      const error = new Error('Skill not found');
      error.statusCode = 404;
      throw error;
    }
    const skill = skillResult.rows[0];

    // Check duplicate name if changing
    if (name && name !== skill.name) {
      const areaId = development_area_id || skill.development_area_id;
      const dupResult = await client.query(
        'SELECT id FROM skills WHERE development_area_id = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL',
        [areaId, name, skillId],
      );
      if (dupResult.rows.length > 0) {
        const error = new Error('Kỹ năng này đã tồn tại trong lĩnh vực phát triển');
        error.statusCode = 409;
        throw error;
      }
    }

    // Update skill fields
    const fields = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) { paramCount++; fields.push(`name = $${paramCount}`); params.push(name); }
    if (description !== undefined) { paramCount++; fields.push(`description = $${paramCount}`); params.push(description); }
    if (instruction_text !== undefined) { paramCount++; fields.push(`instruction_text = $${paramCount}`); params.push(instruction_text); }
    if (development_area_id !== undefined) { paramCount++; fields.push(`development_area_id = $${paramCount}`); params.push(development_area_id); }

    if (fields.length > 0) {
      paramCount++;
      params.push(skillId);
      await client.query(
        `UPDATE skills SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
        params,
      );
    }

    // Replace goals if provided
    if (goals !== undefined) {
      await client.query('DELETE FROM skill_goals WHERE skill_id = $1', [skillId]);
      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        await client.query(
          `INSERT INTO skill_goals (skill_id, section_name, goal_title, activities, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [skillId, g.section_name || null, g.goal_title, g.activities || null, i],
        );
      }
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES ($1, 'skill_updated', 'skills', $2, NOW())`,
      [updatedBy, skillId],
    );

    await client.query('COMMIT');
    logger.info(`Skill updated: ${skillId}`);
    return exports.getSkillById(skillId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a skill (soft delete)
 */
exports.deleteSkill = async (skillId, deletedBy) => {
  const client = await db.connect();
  try {
    const skillResult = await client.query(
      'SELECT id FROM skills WHERE id = $1 AND deleted_at IS NULL',
      [skillId],
    );
    if (skillResult.rows.length === 0) {
      const error = new Error('Skill not found');
      error.statusCode = 404;
      throw error;
    }

    await client.query('UPDATE skills SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [skillId]);

    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES ($1, 'skill_deleted', 'skills', $2, NOW())`,
      [deletedBy, skillId],
    );

    return { id: skillId, message: 'Skill deleted successfully' };
  } finally {
    client.release();
  }
};

/**
 * Get all development areas
 */
exports.getDevelopmentAreas = async () => {
  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT id, name, description, color_code, icon_name, display_order
       FROM development_areas ORDER BY display_order ASC, name ASC`,
    );
    return result.rows;
  } finally {
    client.release();
  }
};
