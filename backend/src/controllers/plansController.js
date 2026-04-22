const plansService = require('../services/plansService');
const childrenService = require('../services/childrenService');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Education Plans Controller
 * Handles HTTP requests for education plan management
 */

/**
 * GET /api/v1/plans
 * List all plans with filters
 */
exports.list = async (req, res, next) => {
  try {
    const {
      limit = 20,
      offset = 0,
      status = '',
      child_id = '',
      month = '',
      year = '',
    } = req.query;

    // Validate pagination
    const validLimit = Math.min(parseInt(limit) || 20, 100);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    // Build filters based on role
    let filters = { status, child_id, month, year };

    if (req.user.role === 'teacher') {
      // Teachers can only see plans for their assigned children
      filters.teacher_id = req.user.id;
    } else if (req.user.role === 'principal') {
      // Principals can only see plans for children in their kindergarten
      filters.kindergarten_id = req.user.kindergarten_id;
    }

    const { plans, total } = await plansService.listPlans(filters, {
      limit: validLimit,
      offset: validOffset,
    });

    logger.info(`Listed ${plans.length} plans (total: ${total})`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Plans retrieved successfully',
      data: {
        plans,
        pagination: {
          limit: validLimit,
          offset: validOffset,
          total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error listing plans:', error);
    return next(error);
  }
};

/**
 * POST /api/v1/plans
 * Create new plan from template
 */
exports.create = async (req, res, next) => {
  try {
    const planData = req.body;

    // Get the child to check authorization
    const child = await childrenService.getChildById(planData.child_id);

    if (!child) {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      // Teacher can only create plans for their assigned children
      if (child.teacher_id !== req.user.id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only create plans for your assigned children',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'principal') {
      // Principal can only create plans in their kindergarten
      if (child.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only create plans in your kindergarten',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const newPlan = await plansService.createPlan(planData, req.user.id);

    logger.info(`Plan created: ${newPlan.id} by ${req.user.id}`);

    return res.status(201).json({
      code: 'PLAN_CREATED',
      message: 'Plan created successfully',
      data: newPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating plan:', error);

    // Handle specific errors
    if (error.code === 'CHILD_NOT_FOUND') {
      return res.status(404).json({
        code: 'CHILD_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'TEMPLATE_NOT_FOUND') {
      return res.status(404).json({
        code: 'TEMPLATE_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'PLAN_ALREADY_EXISTS') {
      return res.status(409).json({
        code: 'PLAN_ALREADY_EXISTS',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * GET /api/v1/plans/:id
 * Get full plan with all skills and evaluations
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await plansService.getPlanBasicInfo(id);

    if (!plan) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      // Teacher can only view plans for their assigned children
      if (plan.plan_teacher_id !== req.user.id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'principal') {
      // Principal can only view plans in their kindergarten
      if (plan.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const fullPlan = await plansService.getPlanById(id);

    logger.info(`Retrieved plan: ${id}`);

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Plan retrieved successfully',
      data: fullPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting plan:', error);
    return next(error);
  }
};

/**
 * PUT /api/v1/plans/:id
 * Update plan status
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get current plan to check authorization and status
    const plan = await plansService.getPlanBasicInfo(id);

    if (!plan) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      // Teacher can only update plans for their assigned children
      if (plan.plan_teacher_id !== req.user.id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this plan',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'principal') {
      // Principal can only update plans in their kindergarten
      if (plan.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this plan',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updatedPlan = await plansService.updatePlan(id, updateData);

    logger.info(`Plan updated: ${id}`);

    return res.status(200).json({
      code: 'PLAN_UPDATED',
      message: 'Plan updated successfully',
      data: updatedPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating plan:', error);

    // Handle specific errors
    if (error.code === 'PLAN_NOT_FOUND') {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({
        code: 'INVALID_STATUS_TRANSITION',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * DELETE /api/v1/plans/:id
 * Delete plan (soft delete)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get current plan to check authorization
    const plan = await plansService.getPlanBasicInfo(id);

    if (!plan) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization - only non-approved plans can be deleted
    if (plan.status === 'approved') {
      return res.status(400).json({
        code: 'CANNOT_DELETE_APPROVED_PLAN',
        message: 'Cannot delete approved plans',
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.role === 'principal') {
      // Principal can only delete plans in their kindergarten
      if (plan.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this plan',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'teacher') {
      // Teacher can only delete their own draft plans
      if (plan.plan_teacher_id !== req.user.id || plan.status !== 'draft') {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You can only delete your own draft plans',
          timestamp: new Date().toISOString(),
        });
      }
    }

    await plansService.deletePlan(id);

    logger.info(`Plan deleted: ${id} by ${req.user.id}`);

    return res.status(200).json({
      code: 'PLAN_DELETED',
      message: 'Plan deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting plan:', error);

    if (error.code === 'PLAN_NOT_FOUND') {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return next(error);
  }
};

/**
 * GET /api/v1/plans/:id/export-pdf
 * Export plan as PDF
 */
exports.exportPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get plan basic info to check authorization
    const planInfo = await plansService.getPlanBasicInfo(id);

    if (!planInfo) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      if (planInfo.plan_teacher_id !== req.user.id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to export this plan',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'principal') {
      if (planInfo.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to export this plan',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Get full plan
    const plan = await plansService.getPlanById(id);

    // TODO: Generate PDF and send
    // For now, return placeholder indicating PDF generation
    logger.info(`Plan PDF export requested: ${id}`);

    return res.status(200).json({
      code: 'PDF_GENERATION_STARTED',
      message: 'PDF generation in progress',
      data: {
        plan_id: id,
        filename: `QLHS_${plan.child_name}_${plan.month}_${plan.year}.pdf`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error exporting plan to PDF:', error);
    return next(error);
  }
};

/**
 * GET /api/v1/plans/:id/progress
 * Get plan progress/achievement summary
 */
exports.getProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get plan basic info to check authorization
    const planInfo = await plansService.getPlanBasicInfo(id);

    if (!planInfo) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check authorization
    if (req.user.role === 'teacher') {
      if (planInfo.plan_teacher_id !== req.user.id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (req.user.role === 'principal') {
      if (planInfo.kindergarten_id !== req.user.kindergarten_id) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this plan',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Get full plan with progress
    const plan = await plansService.getPlanById(id);

    const response = {
      plan_id: id,
      child_name: plan.child_name,
      month: plan.month,
      year: plan.year,
      overall_progress: plan.progress,
      by_area: {},
    };

    // Organize progress by area
    Object.values(plan.skills_by_area).forEach((area) => {
      const areaCounts = {
        achieved: 0,
        not_achieved: 0,
        partial: 0,
        pending: 0,
      };

      area.skills.forEach((skill) => {
        const status = skill.evaluation.status || 'pending';
        if (areaCounts.hasOwnProperty(status)) {
          areaCounts[status]++;
        }
      });

      const totalSkills = Object.values(areaCounts).reduce((a, b) => a + b, 0);
      response.by_area[area.area_name] = {
        percentage:
          totalSkills > 0
            ? Math.round((areaCounts.achieved / totalSkills) * 100)
            : 0,
        ...areaCounts,
      };
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Plan progress retrieved successfully',
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting plan progress:', error);
    return next(error);
  }
};

/**
 * PUT /api/v1/plans/:planId/goals/:goalId
 * Evaluate a plan goal
 */
exports.evaluateGoal = async (req, res, next) => {
  try {
    const { planId, goalId } = req.params;
    const { result_status, result_notes } = req.body;

    // Auth check
    const planInfo = await plansService.getPlanBasicInfo(planId);
    if (!planInfo) {
      return res.status(404).json({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    }
    if (req.user.role === 'teacher' && planInfo.plan_teacher_id !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }
    if (req.user.role === 'principal' && planInfo.kindergarten_id !== req.user.kindergarten_id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }

    const result = await pool.query(
      `UPDATE plan_goals
       SET result_status = $1, result_notes = $2, evaluated_by = $3, evaluated_at = NOW()
       WHERE id = $4 AND plan_id = $5
       RETURNING *`,
      [result_status, result_notes || null, req.user.id, goalId, planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'GOAL_NOT_FOUND', message: 'Goal not found in this plan' });
    }

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Goal evaluated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error evaluating goal:', error);
    return next(error);
  }
};

/**
 * GET /api/v1/plans/:id/export
 * Export plan evaluation as downloadable HTML document (Word-compatible)
 */
exports.exportEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const planInfo = await plansService.getPlanBasicInfo(id);
    if (!planInfo) {
      return res.status(404).json({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    }
    if (req.user.role === 'teacher' && planInfo.plan_teacher_id !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }
    if (req.user.role === 'principal' && planInfo.kindergarten_id !== req.user.kindergarten_id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }

    // Query plan_goals directly (evaluated data, not template data)
    const goalsResult = await pool.query(
      `SELECT pg.skill_name, pg.goal_title, pg.activities, pg.image_url,
              pg.result_status, pg.result_notes, pg.display_order
       FROM plan_goals pg
       WHERE pg.plan_id = $1
       ORDER BY pg.display_order ASC, pg.id ASC`,
      [id]
    );
    const goals = goalsResult.rows;

    // Get plan info separately
    const planResult = await pool.query(
      `SELECT p.id, p.month, p.year, p.approver_name,
              c.fullname as child_name, c.date_of_birth,
              u.fullname as teacher_name
       FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       LEFT JOIN users u ON p.teacher_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    const plan = planResult.rows[0];

    // Get current user's fullname
    const userResult = await pool.query(
      `SELECT fullname FROM users WHERE id = $1`,
      [req.user.id]
    );
    const currentUserName = userResult.rows[0]?.fullname || '';

    // Group goals by skill_name preserving order
    const grouped = {};
    const skillOrder = [];
    goals.forEach(g => {
      if (!grouped[g.skill_name]) {
        grouped[g.skill_name] = [];
        skillOrder.push(g.skill_name);
      }
      grouped[g.skill_name].push(g);
    });

    const statusMap = {
      achieved: 'Đạt',
      partial: 'Đạt một phần',
      not_achieved: 'Chưa đạt',
      pending: 'Chưa đánh giá',
    };

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Build HTML table rows
    let tableRows = '';
    skillOrder.forEach(skillName => {
      const skillGoals = grouped[skillName];
      const rowspan = skillGoals.length;
      skillGoals.forEach((goal, index) => {
        let imgHtml = '';
        if (goal.image_url) {
          imgHtml = `<br><img src="${baseUrl}${goal.image_url}" width="324" height="240" style="display:block;margin-top:6pt;" />`;
        }
        const resultText = statusMap[goal.result_status] || 'Chưa đánh giá';
        const notesText = goal.result_notes ? `<br>${goal.result_notes}` : '';
        tableRows += '<tr>';
        if (index === 0) {
          tableRows += `<td rowspan="${rowspan}" style="border:1px solid #000;padding:6pt;vertical-align:middle;font-weight:bold;text-align:center;">${skillName}</td>`;
        }
        tableRows += `<td style="border:1px solid #000;padding:6pt;vertical-align:top;"><b>${goal.goal_title}</b><br>${(goal.activities || '').replace(/\n/g, '<br>')}${imgHtml}</td>`;
        tableRows += `<td style="border:1px solid #000;padding:6pt;vertical-align:middle;text-align:center;">${resultText}${notesText}</td>`;
        tableRows += '</tr>';
      });
    });

    // Format date of birth
    const dob = plan.date_of_birth ? new Date(plan.date_of_birth) : null;
    const dobStr = dob ? `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}` : '';

    // Format current date for footer
    const now = new Date();
    const exportDateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    // Title month from plan data
    const titleMonthRange = `THÁNG ${plan.month}/${plan.year}`;

    const html = `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #000; }
table { border-collapse: collapse; width: 100%; }
th { border: 1px solid #000; padding: 6pt; background-color: #D9E2F3; color: #000; text-align: center; font-weight: bold; font-size: 13pt; }
td { border: 1px solid #000; padding: 6pt; color: #000; font-size: 12pt; }
h2 { text-align: center; font-size: 16pt; color: #FF0000; font-weight: bold; font-style: italic; margin-bottom: 6pt; }
p { color: #000; font-size: 13pt; margin: 2pt 0; }
@page { size: A4 landscape; margin: 2cm 1.5cm; }
.footer-table { border: none; margin-top: 24pt; }
.footer-table td { border: none; padding: 4pt 0; font-size: 13pt; }
</style>
</head>
<body>
<h2>KẾ HOẠCH GIÁO DỤC CÁ NHÂN ${titleMonthRange}</h2>
<p><b>Họ và tên trẻ:</b> ${plan.child_name || ''}</p>
<p><b>Năm Sinh:</b> ${dobStr}</p>
<p><b>GIÁO VIÊN PHỤ TRÁCH:</b> ${plan.teacher_name || ''}</p>
<br>
<table>
<tr>
<th style="width:15%;">KỸ NĂNG</th>
<th style="width:55%;">MỤC TIÊU</th>
<th style="width:30%;">KẾT QUẢ</th>
</tr>
${tableRows}
</table>
<br>
<table class="footer-table" style="width:100%;border:none;">
<tr>
<td style="width:50%;border:none;">&nbsp;</td>
<td style="width:50%;text-align:center;border:none;"><i>${exportDateStr}</i></td>
</tr>
<tr>
<td style="width:50%;text-align:center;vertical-align:top;border:none;">
<b>Người phê duyệt</b><br><br><br>
${plan.approver_name || ''}
</td>
<td style="width:50%;text-align:center;vertical-align:top;border:none;">
<b>Người soạn</b><br><br><br>
${currentUserName}
</td>
</tr>
</table>
</body>
</html>`;

    const filename = `DanhGia_${(plan.child_name || 'plan').replace(/\s+/g, '_')}_T${plan.month}_${plan.year}.doc`;
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(html);
  } catch (error) {
    logger.error('Error exporting evaluation:', error);
    return next(error);
  }
};

/**
 * GET /api/v1/plans/:id/export-plan
 * Export plan as Word document (review/print - no result column)
 */
exports.exportPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const planInfo = await plansService.getPlanBasicInfo(id);
    if (!planInfo) {
      return res.status(404).json({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    }
    if (req.user.role === 'teacher' && planInfo.plan_teacher_id !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }
    if (req.user.role === 'principal' && planInfo.kindergarten_id !== req.user.kindergarten_id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }

    // Query plan_goals
    const goalsResult = await pool.query(
      `SELECT pg.skill_name, pg.goal_title, pg.activities, pg.image_url, pg.display_order
       FROM plan_goals pg
       WHERE pg.plan_id = $1
       ORDER BY pg.display_order ASC, pg.id ASC`,
      [id]
    );
    const goals = goalsResult.rows;

    // Get plan info
    const planResult = await pool.query(
      `SELECT p.id, p.month, p.year, p.approver_name,
              c.fullname as child_name, c.date_of_birth,
              u.fullname as teacher_name,
              t.name as template_name
       FROM education_plans p
       LEFT JOIN children c ON p.child_id = c.id
       LEFT JOIN users u ON p.teacher_id = u.id
       LEFT JOIN templates t ON p.template_id = t.id
       WHERE p.id = $1`,
      [id]
    );
    const plan = planResult.rows[0];

    // Get current user's fullname
    const userResult = await pool.query(
      `SELECT fullname FROM users WHERE id = $1`,
      [req.user.id]
    );
    const currentUserName = userResult.rows[0]?.fullname || '';

    // Group goals by skill_name preserving order
    const grouped = {};
    const skillOrder = [];
    goals.forEach(g => {
      if (!grouped[g.skill_name]) {
        grouped[g.skill_name] = [];
        skillOrder.push(g.skill_name);
      }
      grouped[g.skill_name].push(g);
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Build HTML table rows (no result column)
    let tableRows = '';
    skillOrder.forEach(skillName => {
      const skillGoals = grouped[skillName];
      const rowspan = skillGoals.length;
      skillGoals.forEach((goal, index) => {
        let imgHtml = '';
        if (goal.image_url) {
          imgHtml = `<br><img src="${baseUrl}${goal.image_url}" width="300" height="220" style="display:block;margin-top:6pt;" />`;
        }
        tableRows += '<tr>';
        if (index === 0) {
          tableRows += `<td rowspan="${rowspan}" style="border:1px solid #000;padding:6pt;vertical-align:middle;font-weight:bold;text-align:center;width:18%;">${skillName}</td>`;
        }
        tableRows += `<td style="border:1px solid #000;padding:6pt;vertical-align:top;width:42%;"><b>${goal.goal_title}</b></td>`;
        tableRows += `<td style="border:1px solid #000;padding:6pt;vertical-align:top;width:40%;">${(goal.activities || '').replace(/\n/g, '<br>')}${imgHtml}</td>`;
        tableRows += '</tr>';
      });
    });

    // Format date of birth
    const dob = plan.date_of_birth ? new Date(plan.date_of_birth) : null;
    const dobStr = dob ? `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}` : '';

    // Format current date for footer
    const now = new Date();
    const exportDateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    const titleMonthRange = `THÁNG ${plan.month}/${plan.year}`;

    const html = `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #000; }
table { border-collapse: collapse; width: 100%; }
th { border: 1px solid #000; padding: 6pt; background-color: #D9E2F3; color: #000; text-align: center; font-weight: bold; font-size: 13pt; }
td { border: 1px solid #000; padding: 6pt; color: #000; font-size: 12pt; }
h2 { text-align: center; font-size: 16pt; color: #FF0000; font-weight: bold; font-style: italic; margin-bottom: 6pt; }
p { color: #000; font-size: 13pt; margin: 2pt 0; }
@page { size: A4 landscape; margin: 2cm 1.5cm; }
.footer-table { border: none; margin-top: 24pt; }
.footer-table td { border: none; padding: 4pt 0; font-size: 13pt; }
</style>
</head>
<body>
<h2>KẾ HOẠCH GIÁO DỤC CÁ NHÂN ${titleMonthRange}</h2>
<p><b>Họ và tên trẻ:</b> ${plan.child_name || ''}</p>
<p><b>Năm Sinh:</b> ${dobStr}</p>
<p><b>GIÁO VIÊN PHỤ TRÁCH:</b> ${plan.teacher_name || ''}</p>
${plan.template_name ? `<p><b>Mẫu kế hoạch:</b> ${plan.template_name}</p>` : ''}
<br>
<table>
<tr>
<th style="width:18%;">KỸ NĂNG</th>
<th style="width:42%;">MỤC TIÊU</th>
<th style="width:40%;">HOẠT ĐỘNG</th>
</tr>
${tableRows}
</table>
<br>
<table class="footer-table" style="width:100%;border:none;">
<tr>
<td style="width:50%;border:none;">&nbsp;</td>
<td style="width:50%;text-align:center;border:none;"><i>${exportDateStr}</i></td>
</tr>
<tr>
<td style="width:50%;text-align:center;vertical-align:top;border:none;">
<b>Người phê duyệt</b><br><br><br>
${plan.approver_name || ''}
</td>
<td style="width:50%;text-align:center;vertical-align:top;border:none;">
<b>Người soạn</b><br><br><br>
${currentUserName}
</td>
</tr>
</table>
</body>
</html>`;

    const filename = `KeHoach_${(plan.child_name || 'plan').replace(/\s+/g, '_')}_T${plan.month}_${plan.year}.doc`;
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(html);
  } catch (error) {
    logger.error('Error exporting plan:', error);
    return next(error);
  }
};

/**
 * POST /api/v1/plans/:id/sync-template
 * Sync plan goals from its linked template
 */
exports.syncTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const planInfo = await plansService.getPlanBasicInfo(id);
    if (!planInfo) {
      return res.status(404).json({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    }
    if (req.user.role === 'teacher' && planInfo.plan_teacher_id !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }
    if (req.user.role === 'principal' && planInfo.kindergarten_id !== req.user.kindergarten_id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'No permission' });
    }

    const result = await plansService.syncFromTemplate(id);

    return res.status(200).json({
      code: 'SUCCESS',
      message: `Đã đồng bộ từ mẫu kế hoạch. Thêm ${result.added} mục tiêu mới.`,
      data: result,
    });
  } catch (error) {
    if (error.code === 'PLAN_NOT_FOUND' || error.code === 'NO_TEMPLATE') {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    logger.error('Error syncing template:', error);
    return next(error);
  }
};

/**
 * POST /api/v1/plans/:id/clone
 * Clone a plan to another child/month/year
 */
exports.clonePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { child_id, month, year } = req.body;

    if (!child_id || !month || !year) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'child_id, month, year là bắt buộc' });
    }

    const planInfo = await plansService.getPlanBasicInfo(id);
    if (!planInfo) {
      return res.status(404).json({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    }

    const newPlan = await plansService.clonePlan(id, {
      child_id,
      month: parseInt(month),
      year: parseInt(year),
      teacher_id: req.user.id,
    });

    return res.status(201).json({
      code: 'SUCCESS',
      message: 'Sao chép kế hoạch thành công',
      data: newPlan,
    });
  } catch (error) {
    if (error.code === 'PLAN_NOT_FOUND') {
      return res.status(404).json({ code: error.code, message: error.message });
    }
    if (error.code === 'PLAN_ALREADY_EXISTS') {
      return res.status(409).json({ code: error.code, message: error.message });
    }
    logger.error('Error cloning plan:', error);
    return next(error);
  }
};
