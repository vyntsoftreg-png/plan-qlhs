const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * Analytics Routes
 * Base path: /api/v1/analytics
 */

/**
 * GET /api/v1/analytics/dashboard
 * Get kindergarten dashboard overview
 * Roles: admin, principal
 */
router.get(
  '/dashboard',
  authenticate,
  authorize(['admin', 'principal']),
  analyticsController.getDashboard,
);

/**
 * GET /api/v1/analytics/child/:childId/progress
 * Get child progress overview
 * Roles: admin, principal, teacher, parent
 */
router.get(
  '/child/:childId/progress',
  authenticate,
  authorize(['admin', 'principal', 'teacher', 'parent']),
  analyticsController.getChildProgress,
);

/**
 * GET /api/v1/analytics/reports
 * Get monthly/period report
 * Query params: year (required), month (optional)
 * Roles: admin, principal
 */
router.get(
  '/reports',
  authenticate,
  authorize(['admin', 'principal']),
  analyticsController.getMonthlyReport,
);

/**
 * GET /api/v1/analytics/teacher/:teacherId
 * Get teacher analytics
 * Roles: admin, principal, teacher (own only)
 */
router.get(
  '/teacher/:teacherId',
  authenticate,
  authorize(['admin', 'principal', 'teacher']),
  analyticsController.getTeacherAnalytics,
);

module.exports = router;
