const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Education Plans Service
 * Handles education plan database operations and business logic
 */

/**
 * Get plan by ID with all skills and evaluations
 * @param {String} planId - Plan UUID
 * @returns {Object} Plan object with nested skills and evaluations
 */
exports.getPlanById = async (planId) => {
  try {
    // Get basic plan info
    const planResult = await pool.query(
      `SELECT p.id, p.child_id, c.fullname as child_name, p.month, p.year, p.status,
              p.teacher_id, u.fullname as teacher_name, p.approver_name, p.created_at, p.updated_at
       FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       LEFT JOIN users u ON p.teacher_id = u.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [planId]
    );

    if (planResult.rows.length === 0) {
      return null;
    }

    const plan = planResult.rows[0];

    // Get all skills for this plan, organized by development area
    const skillsResult = await pool.query(
      `SELECT da.id as area_id, da.name as area_name, da.color_code as color,
              sk.id as skill_id, sk.name as skill_name, sk.instruction_text,
              si.image_url, si.alt_text,
              er.id as evaluation_id, er.status as evaluation_status, 
              er.notes as evaluation_notes, er.evaluation_date
       FROM skills sk
       JOIN development_areas da ON sk.development_area_id = da.id
       LEFT JOIN skill_images si ON sk.id = si.skill_id
       LEFT JOIN plan_skills ps ON sk.id = ps.skill_id AND ps.plan_id = $1
       LEFT JOIN evaluation_results er ON ps.id = er.plan_skill_id
       WHERE ps.plan_id = $1
       ORDER BY da.id, sk.id, si.image_order`,
      [planId]
    );

    // Organize skills by area
    const skillsByArea = {};
    skillsResult.rows.forEach((row) => {
      if (!skillsByArea[row.area_id]) {
        skillsByArea[row.area_id] = {
          area_id: row.area_id,
          area_name: row.area_name,
          color: row.color,
          skills: [],
        };
      }

      // Check if skill already exists in this area
      let skill = skillsByArea[row.area_id].skills.find(
        (s) => s.skill_id === row.skill_id
      );

      if (!skill) {
        skill = {
          skill_id: row.skill_id,
          skill_name: row.skill_name,
          instruction_text: row.instruction_text,
          image_urls: [],
          evaluation: {
            status: row.evaluation_status || 'pending',
            notes: row.evaluation_notes || '',
            evaluated_at: row.evaluation_date,
          },
        };
        skillsByArea[row.area_id].skills.push(skill);
      }

      // Add image if exists
      if (row.image_url && !skill.image_urls.includes(row.image_url)) {
        skill.image_urls.push(row.image_url);
      }
    });

    // Calculate progress
    const skillStatusCounts = { achieved: 0, not_achieved: 0, partial: 0, pending: 0 };
    Object.values(skillsByArea).forEach((area) => {
      area.skills.forEach((skill) => {
        const status = skill.evaluation.status || 'pending';
        if (skillStatusCounts.hasOwnProperty(status)) {
          skillStatusCounts[status]++;
        }
      });
    });

    const totalSkills = Object.values(skillStatusCounts).reduce((a, b) => a + b, 0);
    const achievedPercentage =
      totalSkills > 0
        ? Math.round((skillStatusCounts.achieved / totalSkills) * 100)
        : 0;

    plan.skills_by_area = skillsByArea;
    plan.progress = {
      total_skills: totalSkills,
      achieved: skillStatusCounts.achieved,
      not_achieved: skillStatusCounts.not_achieved,
      partial: skillStatusCounts.partial,
      pending: skillStatusCounts.pending,
      percentage: achievedPercentage,
    };

    // Fetch plan goals (new system)
    const goalsResult = await pool.query(
      `SELECT id, skill_name, goal_title, activities, image_url, display_order,
              result_status, result_notes, evaluated_by, evaluated_at
       FROM plan_goals
       WHERE plan_id = $1
       ORDER BY display_order ASC, id ASC`,
      [planId]
    );
    plan.goals = goalsResult.rows;

    return plan;
  } catch (error) {
    logger.error('Error getting plan by ID:', error);
    throw error;
  }
};

/**
 * List all plans with filters and pagination
 * @param {Object} filters - {status, child_id, month, year, kindergarten_id, teacher_id}
 * @param {Object} pagination - {limit, offset}
 * @returns {Object} {plans, total}
 */
exports.listPlans = async (filters = {}, pagination = {}) => {
  try {
    const {
      status = '',
      child_id = '',
      month = '',
      year = '',
      kindergarten_id = '',
      teacher_id = '',
    } = filters;
    const { limit = 20, offset = 0 } = pagination;

    // Build WHERE clause
    let whereConditions = ['p.deleted_at IS NULL'];
    let params = [];
    let paramIndex = 1;

    // Status filter
    if (status && ['draft', 'completed', 'submitted', 'approved'].includes(status)) {
      whereConditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Child filter
    if (child_id) {
      whereConditions.push(`p.child_id = $${paramIndex}`);
      params.push(child_id);
      paramIndex++;
    }

    // Month filter
    if (month) {
      whereConditions.push(`p.month = $${paramIndex}`);
      params.push(parseInt(month));
      paramIndex++;
    }

    // Year filter
    if (year) {
      whereConditions.push(`p.year = $${paramIndex}`);
      params.push(parseInt(year));
      paramIndex++;
    }

    // Kindergarten filter
    if (kindergarten_id) {
      whereConditions.push(`c.kindergarten_id = $${paramIndex}`);
      params.push(kindergarten_id);
      paramIndex++;
    }

    // Teacher filter
    if (teacher_id) {
      whereConditions.push(`c.teacher_id = $${paramIndex}`);
      params.push(teacher_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT p.id, p.child_id, c.fullname as child_name, p.month, p.year, p.status,
              p.teacher_id, u.fullname as teacher_name, p.template_id, t.name as template_name,
              p.created_at, p.updated_at,
              COUNT(CASE WHEN er.status = 'achieved' THEN 1 END) as skills_achieved,
              COUNT(ps.id) as skills_total
       FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       LEFT JOIN users u ON p.teacher_id = u.id
       LEFT JOIN templates t ON p.template_id = t.id
       LEFT JOIN plan_skills ps ON p.id = ps.plan_id
       LEFT JOIN evaluation_results er ON ps.id = er.plan_skill_id
       WHERE ${whereClause}
       GROUP BY p.id, c.fullname, u.fullname, t.name
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const plans = result.rows.map((row) => ({
      ...row,
      progress_percentage:
        row.skills_total > 0
          ? Math.round((row.skills_achieved / row.skills_total) * 100)
          : 0,
    }));

    return {
      plans,
      total,
    };
  } catch (error) {
    logger.error('Error listing plans:', error);
    throw error;
  }
};

/**
 * Create new plan from template
 * @param {Object} planData - {child_id, month, year, template_id}
 * @param {String} createdBy - User ID creating the plan
 * @returns {Object} Created plan object
 */
exports.createPlan = async (planData, createdBy) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { child_id, month, year, template_id } = planData;

    // Validate child exists
    const childResult = await client.query(
      `SELECT id FROM children WHERE id = $1 AND deleted_at IS NULL`,
      [child_id]
    );

    if (childResult.rows.length === 0) {
      throw {
        name: 'ValidationError',
        message: 'Child not found',
        code: 'CHILD_NOT_FOUND',
      };
    }

    // Validate template exists
    const templateResult = await client.query(
      `SELECT id FROM templates WHERE id = $1`,
      [template_id]
    );

    if (templateResult.rows.length === 0) {
      throw {
        name: 'ValidationError',
        message: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND',
      };
    }

    // Check if plan already exists for this child/month/year
    const existingResult = await client.query(
      `SELECT id, deleted_at FROM education_plans 
       WHERE child_id = $1 AND month = $2 AND year = $3`,
      [child_id, month, year]
    );

    if (existingResult.rows.length > 0) {
      if (existingResult.rows.some(r => !r.deleted_at)) {
        throw {
          name: 'ValidationError',
          message: 'A plan already exists for this child in this month',
          code: 'PLAN_ALREADY_EXISTS',
        };
      }
      // Hard delete soft-deleted records to allow reuse
      await client.query(
        `DELETE FROM education_plans WHERE child_id = $1 AND month = $2 AND year = $3 AND deleted_at IS NOT NULL`,
        [child_id, month, year]
      );
    }

    // Create the plan
    const planResult = await client.query(
      `INSERT INTO education_plans (child_id, month, year, teacher_id, kindergarten_id, template_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, (SELECT kindergarten_id FROM children WHERE id=$1), $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, child_id, month, year, status, teacher_id, created_at, updated_at`,
      [child_id, month, year, createdBy, template_id, 'draft']
    );

    const planId = planResult.rows[0].id;

    // Copy skills from template to plan (legacy support)
    const templateSkillsResult = await client.query(
      `SELECT skill_id FROM template_skills WHERE template_id = $1`,
      [template_id]
    );

    for (const row of templateSkillsResult.rows) {
      await client.query(
        `INSERT INTO plan_skills (plan_id, skill_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [planId, row.skill_id]
      );
    }

    // Copy goals from template_goals to plan_goals
    const templateGoalsResult = await client.query(
      `SELECT skill_name, goal_title, activities, image_url, display_order
       FROM template_goals WHERE template_id = $1
       ORDER BY display_order ASC`,
      [template_id]
    );

    for (const g of templateGoalsResult.rows) {
      await client.query(
        `INSERT INTO plan_goals (plan_id, skill_name, goal_title, activities, image_url, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [planId, g.skill_name, g.goal_title, g.activities, g.image_url, g.display_order]
      );
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [createdBy, 'plan_created', 'education_plans', planId]
    );

    await client.query('COMMIT');

    logger.info(`Plan created: ${planId} from template: ${template_id}`);

    // Fetch and return full plan with skills
    return exports.getPlanById(planId);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating plan:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update plan status
 * @param {String} planId - Plan UUID
 * @param {Object} updateData - {status}
 * @returns {Object} Updated plan object
 */
exports.updatePlan = async (planId, updateData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { status, approver_name, teacher_id } = updateData;

    // Check if plan exists
    const planResult = await client.query(
      `SELECT id, status FROM education_plans WHERE id = $1 AND deleted_at IS NULL`,
      [planId]
    );

    if (planResult.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'Plan not found',
        code: 'PLAN_NOT_FOUND',
      };
    }

    const currentStatus = planResult.rows[0].status;

    // Validate status workflow (only if status is changing)
    if (status && status !== currentStatus) {
      const validTransitions = {
        draft: ['completed', 'submitted'],
        completed: ['submitted'],
        submitted: ['approved', 'draft'],
        approved: [],
      };

      if (!validTransitions[currentStatus].includes(status)) {
        throw {
          name: 'ValidationError',
          message: `Cannot transition from ${currentStatus} to ${status}`,
          code: 'INVALID_STATUS_TRANSITION',
        };
      }
    }

    // Update plan
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (approver_name !== undefined) {
      updateFields.push(`approver_name = $${paramIndex}`);
      params.push(approver_name);
      paramIndex++;
    }

    if (teacher_id) {
      updateFields.push(`teacher_id = $${paramIndex}`);
      params.push(teacher_id);
      paramIndex++;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(planId);

    const result = await client.query(
      `UPDATE education_plans
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, child_id, month, year, status, teacher_id, created_at, updated_at`,
      params
    );

    // Log activity (update)
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [1, 'plan_updated', 'education_plans', planId]
    );

    await client.query('COMMIT');

    logger.info(`Plan updated: ${planId}, new status: ${status}`);

    return exports.getPlanById(planId);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating plan:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Sync plan goals from its template (add new goals, keep existing evaluated ones)
 */
exports.syncFromTemplate = async (planId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get plan with template_id
    const planResult = await client.query(
      `SELECT id, template_id FROM education_plans WHERE id = $1 AND deleted_at IS NULL`,
      [planId]
    );
    if (planResult.rows.length === 0) {
      throw { name: 'NotFoundError', message: 'Plan not found', code: 'PLAN_NOT_FOUND' };
    }
    const { template_id } = planResult.rows[0];
    if (!template_id) {
      throw { name: 'ValidationError', message: 'Plan has no linked template', code: 'NO_TEMPLATE' };
    }

    // Get current template goals
    const templateGoals = await client.query(
      `SELECT skill_name, goal_title, activities, image_url, display_order
       FROM template_goals WHERE template_id = $1
       ORDER BY display_order ASC`,
      [template_id]
    );

    // Get existing plan goals
    const existingGoals = await client.query(
      `SELECT id, skill_name, goal_title FROM plan_goals WHERE plan_id = $1`,
      [planId]
    );

    // Build a set of existing goal keys (skill_name + goal_title) for comparison
    const existingKeys = new Set(
      existingGoals.rows.map(g => `${g.skill_name}|||${g.goal_title}`)
    );

    // Add new goals from template that don't exist in plan yet
    let added = 0;
    for (const tg of templateGoals.rows) {
      const key = `${tg.skill_name}|||${tg.goal_title}`;
      if (!existingKeys.has(key)) {
        await client.query(
          `INSERT INTO plan_goals (plan_id, skill_name, goal_title, activities, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [planId, tg.skill_name, tg.goal_title, tg.activities, tg.image_url, tg.display_order]
        );
        added++;
      }
    }

    // Update display_order for all plan goals to match template order
    for (const tg of templateGoals.rows) {
      await client.query(
        `UPDATE plan_goals SET display_order = $1, activities = $2, image_url = $3
         WHERE plan_id = $4 AND skill_name = $5 AND goal_title = $6
           AND (result_status IS NULL OR result_status = 'pending')`,
        [tg.display_order, tg.activities, tg.image_url, planId, tg.skill_name, tg.goal_title]
      );
    }

    await client.query('COMMIT');
    logger.info(`Plan ${planId} synced from template ${template_id}, ${added} new goals added`);
    return { added, template_id };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error syncing plan from template:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete plan (soft delete)
 * @param {String} planId - Plan UUID
 * @returns {Boolean} True if deleted
 */
exports.deletePlan = async (planId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if plan exists
    const planResult = await client.query(
      `SELECT id FROM education_plans WHERE id = $1 AND deleted_at IS NULL`,
      [planId]
    );

    if (planResult.rows.length === 0) {
      throw {
        name: 'NotFoundError',
        message: 'Plan not found',
        code: 'PLAN_NOT_FOUND',
      };
    }

    // Soft delete plan
    await client.query(
      `UPDATE education_plans SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [planId]
    );

    // Log activity (delete)
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [1, 'plan_deleted', 'education_plans', planId]
    );

    await client.query('COMMIT');

    logger.info(`Plan deleted: ${planId}`);

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting plan:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get plan by ID (lightweight version for authorization checks)
 * @param {String} planId - Plan UUID
 * @returns {Object} Basic plan info {id, child_id, status}
 */
exports.getPlanBasicInfo = async (planId) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.child_id, p.status, c.kindergarten_id, c.teacher_id,
              p.teacher_id as plan_teacher_id
       FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [planId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting plan basic info:', error);
    throw error;
  }
};

/**
 * Get plans by child ID
 * @param {String} childId - Child UUID
 * @returns {Array} Array of plans
 */
exports.getPlansByChildId = async (childId) => {
  try {
    const result = await pool.query(
      `SELECT id, child_id, month, year, status, created_at
       FROM education_plans
       WHERE child_id = $1 AND deleted_at IS NULL
       ORDER BY year DESC, month DESC`,
      [childId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting plans by child:', error);
    throw error;
  }
};

/**
 * Clone an existing plan (copy to new child/month/year, goals without evaluations)
 */
exports.clonePlan = async (planId, { child_id, month, year, teacher_id }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get source plan
    const srcResult = await client.query(
      `SELECT id, template_id, kindergarten_id FROM education_plans WHERE id = $1 AND deleted_at IS NULL`,
      [planId]
    );
    if (srcResult.rows.length === 0) {
      throw { name: 'NotFoundError', message: 'Plan not found', code: 'PLAN_NOT_FOUND' };
    }
    const src = srcResult.rows[0];

    // Check duplicate (including soft-deleted due to DB unique constraint)
    const existingResult = await client.query(
      `SELECT id, deleted_at FROM education_plans WHERE child_id = $1 AND month = $2 AND year = $3`,
      [child_id, month, year]
    );
    if (existingResult.rows.length > 0) {
      if (existingResult.rows.some(r => !r.deleted_at)) {
        throw { name: 'ValidationError', message: 'Kế hoạch cho trẻ này trong tháng đã tồn tại', code: 'PLAN_ALREADY_EXISTS' };
      }
      // Hard delete soft-deleted records to allow reuse
      await client.query(
        `DELETE FROM education_plans WHERE child_id = $1 AND month = $2 AND year = $3 AND deleted_at IS NOT NULL`,
        [child_id, month, year]
      );
    }

    // Create new plan
    const newPlanResult = await client.query(
      `INSERT INTO education_plans (child_id, month, year, teacher_id, kindergarten_id, template_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW(), NOW())
       RETURNING id`,
      [child_id, month, year, teacher_id, src.kindergarten_id, src.template_id]
    );
    const newPlanId = newPlanResult.rows[0].id;

    // Copy goals without evaluation data
    await client.query(
      `INSERT INTO plan_goals (plan_id, skill_name, goal_title, activities, image_url, display_order)
       SELECT $1, skill_name, goal_title, activities, image_url, display_order
       FROM plan_goals WHERE plan_id = $2
       ORDER BY display_order ASC, id ASC`,
      [newPlanId, planId]
    );

    await client.query('COMMIT');
    logger.info(`Plan cloned: ${planId} -> ${newPlanId}`);
    return exports.getPlanById(newPlanId);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cloning plan:', error);
    throw error;
  } finally {
    client.release();
  }
};
