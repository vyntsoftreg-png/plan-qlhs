const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Analytics Service
 * Handles aggregation and reporting of child progress and evaluation data
 */

/**
 * Get kindergarten dashboard overview
 * Shows: total children, plans completed, skills evaluation summary, teacher stats
 * @param {number} kindergartenId - Kindergarten ID
 * @returns {Promise<Object>} Dashboard data with key metrics
 */
exports.getKindergartenDashboard = async (kindergartenId) => {
  const client = await db.connect();
  try {
    // Get total children count
    const childrenCountResult = await client.query(
      `SELECT COUNT(*) as total FROM children WHERE kindergarten_id = $1 AND deleted_at IS NULL`,
      [kindergartenId]
    );
    const totalChildren = parseInt(childrenCountResult.rows[0].total, 10);

    // Get plans overview
    const plansResult = await client.query(
      `SELECT
        COUNT(*) as total_plans,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_plans,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_plans,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_plans,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_plans
       FROM education_plans
       WHERE kindergarten_id = $1 AND deleted_at IS NULL`,
      [kindergartenId]
    );
    const planStats = plansResult.rows[0];

    // Get evaluation stats from plan_goals
    const evaluationResult = await client.query(
      `SELECT
        COUNT(*) as total_goals,
        COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) as total_evaluations,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_count,
        COUNT(CASE WHEN pg.result_status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN pg.result_status = 'not_achieved' THEN 1 END) as not_achieved_count
       FROM plan_goals pg
       INNER JOIN education_plans ep ON pg.plan_id = ep.id
       WHERE ep.kindergarten_id = $1 AND ep.deleted_at IS NULL`,
      [kindergartenId]
    );
    const evalStats = evaluationResult.rows[0];

    // Get teacher performance
    const teacherResult = await client.query(
      `SELECT
        u.id,
        u.fullname AS name,
        COUNT(DISTINCT c.id) as children_count,
        COUNT(DISTINCT ep.id) as plans_created,
        COUNT(DISTINCT CASE WHEN ep.status = 'completed' THEN ep.id END) as plans_completed
       FROM users u
       LEFT JOIN children c ON u.id = c.teacher_id AND c.deleted_at IS NULL
       LEFT JOIN education_plans ep ON u.id = ep.teacher_id AND ep.deleted_at IS NULL
       WHERE u.kindergarten_id = $1 AND u.role = 'teacher'
       GROUP BY u.id, u.fullname
       ORDER BY plans_created DESC`,
      [kindergartenId]
    );

    // Get top goals performance (grouped by skill_name)
    const skillsResult = await client.query(
      `SELECT
        pg.skill_name as name,
        pg.skill_name as development_area,
        COUNT(*) as times_used,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_count,
        CASE WHEN COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) > 0
          THEN ROUND(
            100.0 * COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) /
            COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END), 2
          )::FLOAT
          ELSE 0
        END as success_rate
       FROM plan_goals pg
       INNER JOIN education_plans ep ON pg.plan_id = ep.id
       WHERE ep.kindergarten_id = $1 AND ep.deleted_at IS NULL
       GROUP BY pg.skill_name
       ORDER BY success_rate DESC NULLS LAST, times_used DESC
       LIMIT 10`,
      [kindergartenId]
    );

    // Get monthly trend data (last 6 months)
    const trendResult = await client.query(
      `SELECT
        EXTRACT(YEAR FROM ep.created_at)::INT as year,
        EXTRACT(MONTH FROM ep.created_at)::INT as month,
        COUNT(DISTINCT ep.id) as plans_created,
        COUNT(DISTINCT CASE WHEN ep.status = 'completed' THEN ep.id END) as plans_completed
       FROM education_plans ep
       WHERE ep.kindergarten_id = $1
         AND ep.deleted_at IS NULL
         AND ep.created_at >= NOW() - INTERVAL '6 months'
       GROUP BY EXTRACT(YEAR FROM ep.created_at), EXTRACT(MONTH FROM ep.created_at)
       ORDER BY year DESC, month DESC`,
      [kindergartenId]
    );

    // Get children missing plans this month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const missingPlansResult = await client.query(
      `SELECT c.id, c.fullname, u.fullname as teacher_name
       FROM children c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.kindergarten_id = $1 AND c.deleted_at IS NULL
         AND c.id NOT IN (
           SELECT ep.child_id FROM education_plans ep
           WHERE ep.kindergarten_id = $1 AND ep.deleted_at IS NULL
             AND ep.month = $2 AND ep.year = $3
         )
       ORDER BY c.fullname`,
      [kindergartenId, currentMonth, currentYear]
    );

    // Get recent activity logs
    const activityResult = await client.query(
      `SELECT al.action, al.entity_type, al.entity_id, al.created_at,
              u.fullname as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE u.kindergarten_id = $1
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [kindergartenId]
    );

    return {
      overview: {
        total_children: totalChildren,
        total_plans: parseInt(planStats.total_plans, 10),
        completed_plans: parseInt(planStats.completed_plans, 10),
        draft_plans: parseInt(planStats.draft_plans, 10),
        submitted_plans: parseInt(planStats.submitted_plans, 10),
        approved_plans: parseInt(planStats.approved_plans, 10),
      },
      evaluation_stats: {
        total_goals: parseInt(evalStats.total_goals, 10),
        total_evaluations: parseInt(evalStats.total_evaluations, 10),
        achieved: parseInt(evalStats.achieved_count, 10),
        partial: parseInt(evalStats.partial_count, 10),
        not_achieved: parseInt(evalStats.not_achieved_count, 10),
      },
      top_teachers: teacherResult.rows.map((row) => ({
        teacher_id: row.id,
        name: row.name,
        children_count: parseInt(row.children_count, 10),
        plans_created: parseInt(row.plans_created, 10),
        plans_completed: parseInt(row.plans_completed, 10),
      })),
      top_skills: skillsResult.rows.map((row) => ({
        name: row.name,
        development_area: row.development_area,
        times_used: parseInt(row.times_used, 10),
        achieved_count: parseInt(row.achieved_count, 10),
        success_rate: row.success_rate ? parseFloat(row.success_rate) : 0,
      })),
      monthly_trend: trendResult.rows.map((row) => ({
        year: row.year,
        month: row.month,
        plans_created: parseInt(row.plans_created, 10),
        plans_completed: parseInt(row.plans_completed, 10),
      })),
      children_missing_plans: missingPlansResult.rows.map((row) => ({
        id: row.id,
        fullname: row.fullname,
        teacher_name: row.teacher_name || '—',
      })),
      recent_activities: activityResult.rows.map((row) => ({
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        user_name: row.user_name,
        created_at: row.created_at,
      })),
    };
  } finally {
    client.release();
  }
};

/**
 * Get child progress overview
 * Shows: current plans, skill evaluations, development area performance
 * @param {number} childId - Child ID
 * @returns {Promise<Object>} Child progress data
 */
exports.getChildProgress = async (childId) => {
  const client = await db.connect();
  try {
    // Verify child exists
    const childResult = await client.query(
      `SELECT id, fullname, date_of_birth, kindergarten_id, teacher_id FROM children WHERE id = $1`,
      [childId]
    );
    if (childResult.rows.length === 0) {
      const error = new Error('Child not found');
      error.statusCode = 404;
      throw error;
    }
    const child = childResult.rows[0];

    // Get active/recent plans
    const plansResult = await client.query(
      `SELECT
        ep.id, ep.month, ep.year, ep.status,
        u.fullname as teacher_name,
        COUNT(DISTINCT pg.id) as total_goals
       FROM education_plans ep
       INNER JOIN users u ON ep.teacher_id = u.id
       LEFT JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.child_id = $1 AND ep.deleted_at IS NULL
       GROUP BY ep.id, ep.month, ep.year, ep.status, u.fullname
       ORDER BY ep.year DESC, ep.month DESC
       LIMIT 12`,
      [childId]
    );

    // Get evaluation summary by skill_name
    const developmentResult = await client.query(
      `SELECT
        pg.skill_name as development_area,
        COUNT(*) as total_goals,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_count,
        COUNT(CASE WHEN pg.result_status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN pg.result_status = 'not_achieved' THEN 1 END) as not_achieved_count,
        COUNT(CASE WHEN pg.result_status = 'pending' OR pg.result_status IS NULL THEN 1 END) as pending_count,
        CASE WHEN COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) > 0
          THEN ROUND(
            100.0 * COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) /
            COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END), 2
          )::FLOAT
          ELSE 0
        END as success_rate
       FROM education_plans ep
       INNER JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.child_id = $1 AND ep.deleted_at IS NULL
       GROUP BY pg.skill_name
       ORDER BY pg.skill_name ASC`,
      [childId]
    );

    // Get latest evaluations (last 10)
    const evaluationsResult = await client.query(
      `SELECT
        pg.skill_name,
        pg.goal_title,
        pg.result_status as status,
        pg.evaluated_at as evaluation_date,
        pg.result_notes as notes,
        u.fullname as evaluated_by
       FROM education_plans ep
       INNER JOIN plan_goals pg ON ep.id = pg.plan_id
       LEFT JOIN users u ON pg.evaluated_by = u.id
       WHERE ep.child_id = $1 AND ep.deleted_at IS NULL
         AND pg.result_status IS NOT NULL AND pg.result_status != 'pending'
       ORDER BY pg.evaluated_at DESC NULLS LAST
       LIMIT 10`,
      [childId]
    );

    // Get overall completion percentage
    const completionResult = await client.query(
      `SELECT
        COUNT(*) as total_goals,
        COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) as goals_evaluated,
        COUNT(DISTINCT ep.id) as total_plans
       FROM education_plans ep
       LEFT JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.child_id = $1 AND ep.deleted_at IS NULL`,
      [childId]
    );
    const completion = completionResult.rows[0];
    const completionPercentage =
      parseInt(completion.total_goals, 10) > 0
        ? Math.round((parseInt(completion.goals_evaluated, 10) / parseInt(completion.total_goals, 10)) * 100)
        : 0;

    return {
      child: {
        id: child.id,
        name: child.fullname,
        date_of_birth: child.date_of_birth,
      },
      summary: {
        total_plans: parseInt(completion.total_plans, 10),
        total_goals: parseInt(completion.total_goals, 10),
        goals_evaluated: parseInt(completion.goals_evaluated, 10),
        completion_percentage: completionPercentage,
      },
      recent_plans: plansResult.rows.map((row) => ({
        plan_id: row.id,
        month: row.month,
        year: row.year,
        status: row.status,
        teacher_name: row.teacher_name,
        total_goals: parseInt(row.total_goals, 10),
      })),
      development_areas: developmentResult.rows.map((row) => ({
        area: row.development_area,
        total_goals: parseInt(row.total_goals, 10),
        achieved: parseInt(row.achieved_count, 10),
        partial: parseInt(row.partial_count, 10),
        not_achieved: parseInt(row.not_achieved_count, 10),
        pending: parseInt(row.pending_count, 10),
        success_rate: row.success_rate ? parseFloat(row.success_rate) : 0,
      })),
      latest_evaluations: evaluationsResult.rows.map((row) => ({
        skill_name: row.skill_name,
        goal_title: row.goal_title,
        status: row.status,
        evaluation_date: row.evaluation_date,
        notes: row.notes,
        evaluated_by: row.evaluated_by,
      })),
    };
  } finally {
    client.release();
  }
};

/**
 * Get monthly/period report with detailed breakdown
 * Shows: completion rates, skill performance, child progress comparison
 * @param {number} kindergartenId - Kindergarten ID
 * @param {number} year - Year for report
 * @param {number} month - Month for report (optional)
 * @returns {Promise<Object>} Detailed monthly report
 */
exports.getMonthlyReport = async (kindergartenId, year, month = null) => {
  const client = await db.connect();
  try {
    let dateCondition = `EXTRACT(YEAR FROM ep.created_at)::INT = $2`;
    const params = [kindergartenId, year];

    if (month) {
      dateCondition += ` AND EXTRACT(MONTH FROM ep.created_at)::INT = $3`;
      params.push(month);
    }

    // Get plans created in period
    const plansResult = await client.query(
      `SELECT
        ep.id, ep.month as plan_month, ep.year as plan_year, ep.status,
        c.fullname as child_name, u.fullname as teacher_name,
        COUNT(DISTINCT pg.id) as total_goals,
        COUNT(DISTINCT CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN pg.id END) as evaluated_goals
       FROM education_plans ep
       INNER JOIN children c ON ep.child_id = c.id
       INNER JOIN users u ON ep.teacher_id = u.id
       LEFT JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.kindergarten_id = $1 AND ${dateCondition} AND ep.deleted_at IS NULL
       GROUP BY ep.id, ep.month, ep.year, ep.status, c.fullname, u.fullname
       ORDER BY ep.created_at DESC`,
      params
    );

    // Get period evaluation statistics
    const statsResult = await client.query(
      `SELECT
        COUNT(DISTINCT ep.id) as total_plans,
        COUNT(DISTINCT CASE WHEN ep.status = 'completed' THEN ep.id END) as completed_plans,
        COUNT(pg.id) as total_goals,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_count,
        COUNT(CASE WHEN pg.result_status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN pg.result_status = 'not_achieved' THEN 1 END) as not_achieved_count,
        COUNT(CASE WHEN pg.result_status = 'pending' OR pg.result_status IS NULL THEN 1 END) as pending_count,
        COUNT(DISTINCT c.id) as children_involved,
        COUNT(DISTINCT u.id) as teachers_involved
       FROM education_plans ep
       INNER JOIN children c ON ep.child_id = c.id
       INNER JOIN users u ON ep.teacher_id = u.id
       LEFT JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.kindergarten_id = $1 AND ${dateCondition} AND ep.deleted_at IS NULL`,
      params
    );
    const stats = statsResult.rows[0];

    // Get skill summary for period
    const areaResult = await client.query(
      `SELECT
        pg.skill_name as development_area,
        COUNT(*) as total_goals,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_count,
        CASE WHEN COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) > 0
          THEN ROUND(
            100.0 * COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) /
            COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END), 2
          )::FLOAT
          ELSE 0
        END as success_rate
       FROM education_plans ep
       INNER JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.kindergarten_id = $1 AND ${dateCondition} AND ep.deleted_at IS NULL
       GROUP BY pg.skill_name
       ORDER BY pg.skill_name ASC`,
      params
    );

    // Get child progress ranking in period
    const childRankingResult = await client.query(
      `SELECT
        c.id, c.fullname AS name,
        COUNT(DISTINCT ep.id) as plans_count,
        COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) as achieved_goals,
        COUNT(pg.id) as total_goals,
        CASE WHEN COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END) > 0
          THEN ROUND(
            100.0 * COUNT(CASE WHEN pg.result_status = 'achieved' THEN 1 END) /
            COUNT(CASE WHEN pg.result_status IS NOT NULL AND pg.result_status != 'pending' THEN 1 END), 2
          )::FLOAT
          ELSE 0
        END as success_rate
       FROM education_plans ep
       INNER JOIN children c ON ep.child_id = c.id
       LEFT JOIN plan_goals pg ON ep.id = pg.plan_id
       WHERE ep.kindergarten_id = $1 AND ${dateCondition} AND ep.deleted_at IS NULL
       GROUP BY c.id, c.fullname
       ORDER BY success_rate DESC NULLS LAST`,
      params
    );

    const reportPeriod = month ? `${year}-${String(month).padStart(2, '0')}` : `${year}`;

    return {
      report_period: reportPeriod,
      summary: {
        total_plans: parseInt(stats.total_plans, 10),
        completed_plans: parseInt(stats.completed_plans, 10),
        total_goals: parseInt(stats.total_goals, 10),
        children_involved: parseInt(stats.children_involved, 10),
        teachers_involved: parseInt(stats.teachers_involved, 10),
      },
      evaluation_breakdown: {
        achieved: parseInt(stats.achieved_count, 10),
        partial: parseInt(stats.partial_count, 10),
        not_achieved: parseInt(stats.not_achieved_count, 10),
        pending: parseInt(stats.pending_count, 10),
      },
      development_areas: areaResult.rows.map((row) => ({
        area: row.development_area,
        total_goals: parseInt(row.total_goals, 10),
        achieved_count: parseInt(row.achieved_count, 10),
        success_rate: row.success_rate ? parseFloat(row.success_rate) : 0,
      })),
      child_rankings: childRankingResult.rows.map((row) => ({
        child_id: row.id,
        child_name: row.name,
        plans_count: parseInt(row.plans_count, 10),
        achieved_goals: parseInt(row.achieved_goals, 10),
        total_goals: parseInt(row.total_goals, 10),
        success_rate: row.success_rate ? parseFloat(row.success_rate) : 0,
      })),
      plans: plansResult.rows.map((row) => ({
        plan_id: row.id,
        plan_month: row.plan_month,
        plan_year: row.plan_year,
        status: row.status,
        child_name: row.child_name,
        teacher_name: row.teacher_name,
        total_goals: parseInt(row.total_goals, 10),
        evaluated_goals: parseInt(row.evaluated_goals, 10),
      })),
    };
  } finally {
    client.release();
  }
};
