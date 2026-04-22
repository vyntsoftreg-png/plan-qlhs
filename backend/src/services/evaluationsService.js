const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Evaluations Service
 * Handles skill evaluation result recording and management
 */

/**
 * Create a new evaluation for a plan skill
 * @param {number} planId - Education plan ID
 * @param {number} skillId - Skill ID to evaluate
 * @param {string} evaluationDate - Evaluation date (YYYY-MM-DD)
 * @param {string} status - Evaluation status (achieved, not_achieved, partial, pending)
 * @param {string} notes - Evaluation notes (optional)
 * @param {string} evidenceUrl - Evidence URL (optional)
 * @param {number} evaluatedBy - User ID of evaluator (teacher)
 * @returns {Promise<Object>} Created evaluation record
 */
exports.createEvaluation = async (
  planId,
  skillId,
  evaluationDate,
  status,
  notes,
  evidenceUrl,
  evaluatedBy,
) => {
  const client = await db.connect();
  try {
    // Step 1: Verify plan exists and belongs to user's kindergarten
    const planCheckQuery = `
      SELECT ep.id, ep.kindergarten_id, ep.child_id
      FROM education_plans ep
      WHERE ep.id = $1 AND ep.deleted_at IS NULL
    `;
    const planResult = await client.query(planCheckQuery, [planId]);
    if (planResult.rows.length === 0) {
      const error = new Error('Education plan not found');
      error.statusCode = 404;
      throw error;
    }
    const plan = planResult.rows[0];

    // Step 2: Verify plan_skill exists for this plan and skill
    const planSkillQuery = `
      SELECT ps.id
      FROM plan_skills ps
      WHERE ps.plan_id = $1 AND ps.skill_id = $2
    `;
    const planSkillResult = await client.query(planSkillQuery, [planId, skillId]);
    if (planSkillResult.rows.length === 0) {
      const error = new Error('Skill not found in this plan');
      error.statusCode = 404;
      throw error;
    }
    const planSkillId = planSkillResult.rows[0].id;

    // Step 3: Check if evaluation already exists for this skill on this date
    // We want to allow only one evaluation per skill per date
    const existingEvalQuery = `
      SELECT id
      FROM evaluation_results
      WHERE plan_skill_id = $1 AND evaluation_date = $2
      LIMIT 1
    `;
    const existingEvalResult = await client.query(existingEvalQuery, [
      planSkillId,
      evaluationDate,
    ]);
    if (existingEvalResult.rows.length > 0) {
      const error = new Error('Evaluation already exists for this skill on this date');
      error.statusCode = 409;
      throw error;
    }

    // Step 4: Create the evaluation record
    const createEvalQuery = `
      INSERT INTO evaluation_results (
        plan_skill_id,
        evaluation_date,
        status,
        notes,
        evidence_url,
        evaluated_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const evalResult = await client.query(createEvalQuery, [
      planSkillId,
      evaluationDate,
      status,
      notes || null,
      evidenceUrl || null,
      evaluatedBy,
    ]);

    const evaluation = evalResult.rows[0];

    // Step 5: Log activity
    const logQuery = `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_value,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await client.query(logQuery, [
      evaluatedBy,
      'CREATE',
      'evaluation_results',
      evaluation.id,
      JSON.stringify({
        skill_id: skillId,
        status,
        notes,
        evidence_url: evidenceUrl,
      }),
    ]);

    return {
      id: evaluation.id,
      planId,
      skillId,
      plan_skill_id: evaluation.plan_skill_id,
      evaluation_date: evaluation.evaluation_date,
      status: evaluation.status,
      notes: evaluation.notes,
      evidence_url: evaluation.evidence_url,
      evaluated_by: evaluation.evaluated_by,
      created_at: evaluation.created_at,
      updated_at: evaluation.updated_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Update an evaluation record
 * @param {number} planId - Education plan ID
 * @param {number} skillId - Skill ID being evaluated
 * @param {string} status - New evaluation status
 * @param {string} notes - Updated notes (optional)
 * @param {string} evidenceUrl - Updated evidence URL (optional)
 * @param {number} updatedBy - User ID of person making update
 * @returns {Promise<Object>} Updated evaluation record
 */
exports.updateEvaluation = async (
  planId,
  skillId,
  status,
  notes,
  evidenceUrl,
  updatedBy,
) => {
  const client = await db.connect();
  try {
    // Step 1: Verify plan exists
    const planCheckQuery = `
      SELECT id
      FROM education_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const planResult = await client.query(planCheckQuery, [planId]);
    if (planResult.rows.length === 0) {
      const error = new Error('Education plan not found');
      error.statusCode = 404;
      throw error;
    }

    // Step 2: Get current evaluation for this skill in this plan
    const evalQuery = `
      SELECT er.id, er.status, er.notes, er.evidence_url
      FROM evaluation_results er
      INNER JOIN plan_skills ps ON er.plan_skill_id = ps.id
      WHERE ps.plan_id = $1 AND ps.skill_id = $2
      ORDER BY er.evaluation_date DESC
      LIMIT 1
    `;
    const evalResult = await client.query(evalQuery, [planId, skillId]);
    if (evalResult.rows.length === 0) {
      const error = new Error('Evaluation not found for this skill');
      error.statusCode = 404;
      throw error;
    }
    const evaluation = evalResult.rows[0];

    // Step 3: Update the evaluation
    const updateQuery = `
      UPDATE evaluation_results
      SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        evidence_url = COALESCE($3, evidence_url),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [
      status || null,
      notes !== undefined ? notes : null,
      evidenceUrl !== undefined ? evidenceUrl : null,
      evaluation.id,
    ]);

    const updatedEvaluation = updateResult.rows[0];

    // Step 4: Log activity
    const logQuery = `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await client.query(logQuery, [
      updatedBy,
      'UPDATE',
      'evaluation_results',
      evaluation.id,
      JSON.stringify({
        status: evaluation.status,
        notes: evaluation.notes,
        evidence_url: evaluation.evidence_url,
      }),
      JSON.stringify({
        status: updatedEvaluation.status,
        notes: updatedEvaluation.notes,
        evidence_url: updatedEvaluation.evidence_url,
      }),
    ]);

    return {
      id: updatedEvaluation.id,
      plan_skill_id: updatedEvaluation.plan_skill_id,
      evaluation_date: updatedEvaluation.evaluation_date,
      status: updatedEvaluation.status,
      notes: updatedEvaluation.notes,
      evidence_url: updatedEvaluation.evidence_url,
      evaluated_by: updatedEvaluation.evaluated_by,
      created_at: updatedEvaluation.created_at,
      updated_at: updatedEvaluation.updated_at,
    };
  } finally {
    client.release();
  }
};

/**
 * Get all evaluations for a plan
 * @param {number} planId - Education plan ID
 * @param {Object} filters - Filter options { skill_id, status }
 * @returns {Promise<Array>} List of evaluations with skill details
 */
exports.getEvaluationsByPlan = async (planId, filters = {}) => {
  const client = await db.connect();
  try {
    // Verify plan exists
    const planCheckQuery = `
      SELECT id
      FROM education_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const planResult = await client.query(planCheckQuery, [planId]);
    if (planResult.rows.length === 0) {
      const error = new Error('Education plan not found');
      error.statusCode = 404;
      throw error;
    }

    // Build query with optional filters
    let query = `
      SELECT
        er.id,
        er.plan_skill_id,
        er.evaluation_date,
        er.status,
        er.notes,
        er.evidence_url,
        er.evaluated_by,
        er.created_at,
        er.updated_at,
        ps.skill_id,
        s.name as skill_name,
        s.description as skill_description,
        u.fullname as evaluated_by_name
      FROM evaluation_results er
      INNER JOIN plan_skills ps ON er.plan_skill_id = ps.id
      INNER JOIN skills s ON ps.skill_id = s.id
      INNER JOIN users u ON er.evaluated_by = u.id
      WHERE ps.plan_id = $1
    `;

    const params = [planId];
    let paramCount = 1;

    if (filters.skill_id) {
      paramCount++;
      query += ` AND ps.skill_id = $${paramCount}`;
      params.push(filters.skill_id);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND er.status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ` ORDER BY er.evaluation_date DESC, s.name ASC`;

    const result = await client.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      plan_skill_id: row.plan_skill_id,
      skill_id: row.skill_id,
      skill_name: row.skill_name,
      skill_description: row.skill_description,
      evaluation_date: row.evaluation_date,
      status: row.status,
      notes: row.notes,
      evidence_url: row.evidence_url,
      evaluated_by: row.evaluated_by,
      evaluated_by_name: row.evaluated_by_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } finally {
    client.release();
  }
};

/**
 * Delete an evaluation record
 * @param {number} planId - Education plan ID
 * @param {number} skillId - Skill ID
 * @param {number} deletedBy - User ID of person deleting
 * @returns {Promise<Object>} Deletion confirmation
 */
exports.deleteEvaluation = async (planId, skillId, deletedBy) => {
  const client = await db.connect();
  try {
    // Verify plan exists
    const planCheckQuery = `
      SELECT id
      FROM education_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const planResult = await client.query(planCheckQuery, [planId]);
    if (planResult.rows.length === 0) {
      const error = new Error('Education plan not found');
      error.statusCode = 404;
      throw error;
    }

    // Get the most recent evaluation for this skill
    const evalQuery = `
      SELECT er.id
      FROM evaluation_results er
      INNER JOIN plan_skills ps ON er.plan_skill_id = ps.id
      WHERE ps.plan_id = $1 AND ps.skill_id = $2
      ORDER BY er.evaluation_date DESC
      LIMIT 1
    `;
    const evalResult = await client.query(evalQuery, [planId, skillId]);
    if (evalResult.rows.length === 0) {
      const error = new Error('Evaluation not found');
      error.statusCode = 404;
      throw error;
    }

    const evaluationId = evalResult.rows[0].id;

    // Delete the evaluation (hard delete is OK for evaluation history)
    const deleteQuery = `
      DELETE FROM evaluation_results
      WHERE id = $1
    `;
    await client.query(deleteQuery, [evaluationId]);

    // Log activity
    const logQuery = `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;
    await client.query(logQuery, [deletedBy, 'DELETE', 'evaluation_results', evaluationId]);

    return {
      id: evaluationId,
      message: 'Evaluation deleted successfully',
    };
  } finally {
    client.release();
  }
};

/**
 * Get evaluation summary for a plan (progression overview)
 * @param {number} planId - Education plan ID
 * @returns {Promise<Object>} Summary of evaluation status across all skills
 */
exports.getEvaluationSummary = async (planId) => {
  const client = await db.connect();
  try {
    // Verify plan exists
    const planCheckQuery = `
      SELECT id
      FROM education_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const planResult = await client.query(planCheckQuery, [planId]);
    if (planResult.rows.length === 0) {
      const error = new Error('Education plan not found');
      error.statusCode = 404;
      throw error;
    }

    // Get summary stats
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT ps.id) as total_skills,
        COUNT(DISTINCT CASE WHEN er.id IS NOT NULL THEN er.id END) as evaluated_skills,
        COUNT(CASE WHEN er.status = 'achieved' THEN 1 END) as achieved_count,
        COUNT(CASE WHEN er.status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN er.status = 'not_achieved' THEN 1 END) as not_achieved_count,
        COUNT(CASE WHEN er.status = 'pending' THEN 1 END) as pending_count
      FROM plan_skills ps
      LEFT JOIN evaluation_results er ON ps.id = er.plan_skill_id
        AND er.evaluation_date = (
          SELECT MAX(evaluation_date)
          FROM evaluation_results er2
          WHERE er2.plan_skill_id = ps.id
        )
      WHERE ps.plan_id = $1
    `;

    const result = await client.query(summaryQuery, [planId]);
    const summary = result.rows[0];

    return {
      total_skills: parseInt(summary.total_skills, 10),
      evaluated_skills: parseInt(summary.evaluated_skills, 10) || 0,
      achieved_count: parseInt(summary.achieved_count, 10) || 0,
      partial_count: parseInt(summary.partial_count, 10) || 0,
      not_achieved_count: parseInt(summary.not_achieved_count, 10) || 0,
      pending_count: parseInt(summary.pending_count, 10) || 0,
      completion_percentage:
        summary.total_skills > 0
          ? Math.round(((summary.evaluated_skills || 0) / summary.total_skills) * 100)
          : 0,
    };
  } finally {
    client.release();
  }
};
