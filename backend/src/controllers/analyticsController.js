const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

/**
 * Analytics Controller
 * Handles HTTP requests for analytics and reporting
 */

/**
 * Get kindergarten dashboard overview
 * GET /api/v1/analytics/dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const kindergartenId = req.user.kindergarten_id;
    const userRole = req.user.role;

    // Authorization: Admin and principal can view dashboard
    if (userRole === 'teacher' || userRole === 'parent') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only administrators and principals can view kindergarten dashboard',
      });
    }

    // Get dashboard data
    const dashboard = await analyticsService.getKindergartenDashboard(kindergartenId);

    logger.info(`Dashboard retrieved for kindergarten ${kindergartenId}`, {
      userId: req.user.id,
      kindergartenId,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Kindergarten dashboard retrieved',
      data: dashboard,
    });
  } catch (err) {
    logger.error('Error retrieving dashboard', { error: err.message });
    return next(err);
  }
};

/**
 * Get child progress overview
 * GET /api/v1/analytics/child/:childId/progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getChildProgress = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: User can view own child/student progress
    // For now, admins and principals can view any child
    // Teachers can view their assigned children
    // Parents can view their own children (if parent-child relationship exists)

    // Call service to get progress
    const progress = await analyticsService.getChildProgress(parseInt(childId, 10));

    // TODO: Add authorization check based on parent-child relationship or teacher-student assignment

    logger.info(`Child progress retrieved for child ${childId}`, {
      userId,
      childId,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Child progress retrieved',
      data: progress,
    });
  } catch (err) {
    logger.error('Error retrieving child progress', { error: err.message });

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
 * Get monthly/period report
 * GET /api/v1/analytics/reports?year=2026&month=4
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const kindergartenId = req.user.kindergarten_id;
    const userRole = req.user.role;

    // Authorization: Admin and principal can view reports
    if (userRole === 'teacher' || userRole === 'parent') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only administrators and principals can view reports',
      });
    }

    // Validate year is provided
    if (!year) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Year is required',
        field: 'year',
      });
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Year must be a valid number between 2000 and 2100',
        field: 'year',
      });
    }

    // Validate month if provided
    let monthNum = null;
    if (month) {
      monthNum = parseInt(month, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Month must be a number between 1 and 12',
          field: 'month',
        });
      }
    }

    // Get report
    const report = await analyticsService.getMonthlyReport(
      kindergartenId,
      yearNum,
      monthNum,
    );

    logger.info(`Monthly report retrieved for kindergarten ${kindergartenId}`, {
      userId: req.user.id,
      kindergartenId,
      year: yearNum,
      month: monthNum,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Monthly report retrieved',
      data: report,
    });
  } catch (err) {
    logger.error('Error retrieving monthly report', { error: err.message });
    return next(err);
  }
};

/**
 * Get teacher analytics
 * GET /api/v1/analytics/teacher/:teacherId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: Teachers can view own analytics, admins can view any
    if (userRole === 'teacher' && parseInt(teacherId, 10) !== userId) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only view your own analytics',
      });
    }

    // Get teacher performance metrics
    const analyticsQuery = `
      SELECT
        u.id,
        u.name,
        COUNT(DISTINCT c.id) as children_count,
        COUNT(DISTINCT ep.id) as plans_created,
        COUNT(CASE WHEN ep.status = 'completed' THEN 1 END) as plans_completed,
        AVG(CASE WHEN ep.status = 'completed' THEN 100 ELSE 0 END)::INT as completion_percentage,
        COUNT(DISTINCT CASE WHEN er.status = 'achieved' THEN er.id END) as evaluations_achieved,
        COUNT(DISTINCT er.id) as total_evaluations
      FROM users u
      LEFT JOIN children c ON u.id = c.teacher_id
      LEFT JOIN education_plans ep ON u.id = ep.teacher_id
      LEFT JOIN plan_skills ps ON ep.id = ps.plan_id
      LEFT JOIN evaluation_results er ON ps.id = er.plan_skill_id
      WHERE u.id = $1
      GROUP BY u.id, u.fullname
    `;

    const db = require('../database');
    const client = await db.connect();
    try {
      const result = await client.query(analyticsQuery, [parseInt(teacherId, 10)]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      const analytics = result.rows[0];

      logger.info(`Teacher analytics retrieved for teacher ${teacherId}`, {
        userId,
        teacherId,
      });

      return res.status(200).json({
        code: 'SUCCESS',
        message: 'Teacher analytics retrieved',
        data: {
          teacher_id: analytics.id,
          name: analytics.name,
          children_assigned: parseInt(analytics.children_count, 10),
          plans_created: parseInt(analytics.plans_created, 10),
          plans_completed: parseInt(analytics.plans_completed, 10),
          completion_percentage: analytics.completion_percentage || 0,
          evaluations_achieved: parseInt(analytics.evaluations_achieved, 10),
          total_evaluations: parseInt(analytics.total_evaluations, 10),
          average_success_rate:
            analytics.total_evaluations > 0
              ? Math.round(
                  (parseInt(analytics.evaluations_achieved, 10) /
                    parseInt(analytics.total_evaluations, 10)) *
                    100,
                )
              : 0,
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('Error retrieving teacher analytics', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: err.message,
      });
    }

    return next(err);
  }
};
