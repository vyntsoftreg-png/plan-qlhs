const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Templates Service (rebuilt)
 * Templates contain goals grouped by skill
 * Structure: Template â†’ Goals [{skill_name, goal_title, activities, image_url}]
 */

exports.listTemplates = async (kindergartenId, filters = {}) => {
  const client = await db.connect();
  try {
    const { search, limit = 20, offset = 0 } = filters;

    let whereConditions = ['t.deleted_at IS NULL'];
    const params = [];
    let paramCount = 0;

    if (kindergartenId) {
      paramCount++;
      whereConditions.push(`t.kindergarten_id = $${paramCount}`);
      params.push(kindergartenId);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(t.name ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await client.query(
      `SELECT COUNT(DISTINCT t.id) as total FROM templates t WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(limit, offset);
    const result = await client.query(
      `SELECT t.id, t.name, t.description, t.age_group,
              t.created_by, u.fullname as creator_name,
              COUNT(tg.id) as goal_count,
              t.created_at, t.updated_at
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN template_goals tg ON t.id = tg.template_id
       WHERE ${whereClause}
       GROUP BY t.id, u.fullname
       ORDER BY t.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params,
    );

    return {
      data: result.rows.map(r => ({
        ...r,
        goal_count: parseInt(r.goal_count, 10) || 0,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } finally {
    client.release();
  }
};

exports.getTemplateById = async (templateId, kindergartenId) => {
  const client = await db.connect();
  try {
    const templateResult = await client.query(
      `SELECT t.id, t.kindergarten_id, t.name, t.description, t.age_group,
              t.created_by, u.fullname as creator_name, t.created_at, t.updated_at
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [templateId],
    );

    if (templateResult.rows.length === 0) {
      const error = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }

    const template = templateResult.rows[0];

    if (kindergartenId && template.kindergarten_id !== kindergartenId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    const goalsResult = await client.query(
      `SELECT id, skill_name, goal_title, activities, image_url, display_order
       FROM template_goals
       WHERE template_id = $1
       ORDER BY display_order ASC, id ASC`,
      [templateId],
    );

    template.goals = goalsResult.rows;
    return template;
  } finally {
    client.release();
  }
};

exports.createTemplate = async (kindergartenId, name, description, ageGroup, goals, createdBy) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      `INSERT INTO templates (kindergarten_id, name, description, age_group, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [kindergartenId, name, description || null, ageGroup || null, createdBy],
    );
    const template = templateResult.rows[0];

    const insertedGoals = [];
    if (goals && goals.length > 0) {
      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        const goalResult = await client.query(
          `INSERT INTO template_goals (template_id, skill_name, goal_title, activities, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [template.id, g.skill_name, g.goal_title, g.activities || null, g.image_url || null, i],
        );
        insertedGoals.push(goalResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    logger.info(`Template created: ${template.id} with ${insertedGoals.length} goals`);
    return { ...template, goals: insertedGoals };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

exports.updateTemplate = async (templateId, kindergartenId, updates, goals) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id FROM templates WHERE id = $1 AND kindergarten_id = $2 AND deleted_at IS NULL`,
      [templateId, kindergartenId],
    );
    if (existing.rows.length === 0) {
      const error = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }

    const { name, description, age_group } = updates;
    const setClauses = ['updated_at = NOW()'];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) { paramCount++; setClauses.push(`name = $${paramCount}`); params.push(name); }
    if (description !== undefined) { paramCount++; setClauses.push(`description = $${paramCount}`); params.push(description); }
    if (age_group !== undefined) { paramCount++; setClauses.push(`age_group = $${paramCount}`); params.push(age_group); }

    paramCount++;
    params.push(templateId);

    await client.query(
      `UPDATE templates SET ${setClauses.join(', ')} WHERE id = $${paramCount}`,
      params,
    );

    if (goals !== undefined) {
      await client.query('DELETE FROM template_goals WHERE template_id = $1', [templateId]);
      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        await client.query(
          `INSERT INTO template_goals (template_id, skill_name, goal_title, activities, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [templateId, g.skill_name, g.goal_title, g.activities || null, g.image_url || null, i],
        );
      }
    }

    await client.query('COMMIT');
    logger.info(`Template updated: ${templateId}`);
    return exports.getTemplateById(templateId, kindergartenId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

exports.deleteTemplate = async (templateId, kindergartenId) => {
  const client = await db.connect();
  try {
    const result = await client.query(
      `UPDATE templates SET deleted_at = NOW() WHERE id = $1 AND kindergarten_id = $2 AND deleted_at IS NULL RETURNING id`,
      [templateId, kindergartenId],
    );
    if (result.rows.length === 0) {
      const error = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }
    return true;
  } finally {
    client.release();
  }
};

exports.cloneTemplate = async (templateId, kindergartenId, createdBy) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Get source template
    const srcResult = await client.query(
      `SELECT id, name, description, age_group FROM templates WHERE id = $1 AND deleted_at IS NULL`,
      [templateId],
    );
    if (srcResult.rows.length === 0) {
      const error = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }
    const src = srcResult.rows[0];

    // Create new template with "(Bản sao)" suffix
    const newResult = await client.query(
      `INSERT INTO templates (kindergarten_id, name, description, age_group, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [kindergartenId, `${src.name} (Bản sao)`, src.description, src.age_group, createdBy],
    );
    const newTemplate = newResult.rows[0];

    // Copy goals
    await client.query(
      `INSERT INTO template_goals (template_id, skill_name, goal_title, activities, image_url, display_order)
       SELECT $1, skill_name, goal_title, activities, image_url, display_order
       FROM template_goals WHERE template_id = $2
       ORDER BY display_order ASC, id ASC`,
      [newTemplate.id, templateId],
    );

    await client.query('COMMIT');
    logger.info(`Template cloned: ${templateId} -> ${newTemplate.id}`);
    return exports.getTemplateById(newTemplate.id, kindergartenId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
