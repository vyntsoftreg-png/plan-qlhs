const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/v1/public/lookup?name=xxx
 * Public endpoint for parents to look up their child's evaluations by name
 */
router.get('/lookup', async (req, res) => {
  const { name } = req.query;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm' });
  }

  const searchTerm = `%${name.trim()}%`;

  // Find children matching the name
  const childrenResult = await pool.query(
    `SELECT id, fullname AS "fullName", date_of_birth, gender
     FROM children
     WHERE fullname ILIKE $1 AND deleted_at IS NULL AND is_active = true
     ORDER BY fullname ASC
     LIMIT 20`,
    [searchTerm]
  );

  if (childrenResult.rows.length === 0) {
    return res.json({ children: [] });
  }

  const childIds = childrenResult.rows.map((c) => c.id);

  // Fetch all plans with goals for those children
  const plansResult = await pool.query(
    `SELECT p.id, p.child_id, p.month, p.year, p.status, p.approver_name,
            c.fullname as child_name,
            t.name as template_name,
            u.fullname as teacher_name
     FROM education_plans p
     JOIN children c ON p.child_id = c.id
     LEFT JOIN templates t ON p.template_id = t.id
     LEFT JOIN users u ON p.teacher_id = u.id
     WHERE p.child_id = ANY($1) AND p.deleted_at IS NULL
     ORDER BY p.year DESC, p.month DESC`,
    [childIds]
  );

  if (plansResult.rows.length === 0) {
    return res.json({
      children: childrenResult.rows.map((c) => ({
        ...c,
        plans: [],
      })),
    });
  }

  const planIds = plansResult.rows.map((p) => p.id);

  // Fetch all goals for those plans
  const goalsResult = await pool.query(
    `SELECT id, plan_id, skill_name, goal_title, activities, image_url,
            display_order, result_status, result_notes
     FROM plan_goals
     WHERE plan_id = ANY($1)
     ORDER BY display_order ASC, id ASC`,
    [planIds]
  );

  // Group goals by plan_id
  const goalsByPlan = {};
  goalsResult.rows.forEach((g) => {
    if (!goalsByPlan[g.plan_id]) goalsByPlan[g.plan_id] = [];
    goalsByPlan[g.plan_id].push(g);
  });

  // Group plans by child_id
  const plansByChild = {};
  plansResult.rows.forEach((p) => {
    if (!plansByChild[p.child_id]) plansByChild[p.child_id] = [];
    plansByChild[p.child_id].push({
      ...p,
      goals: goalsByPlan[p.id] || [],
    });
  });

  // Build final response
  const children = childrenResult.rows.map((c) => ({
    ...c,
    plans: plansByChild[c.id] || [],
  }));

  res.json({ children });
});

/**
 * GET /api/v1/public/suggest?q=xxx
 * Autocomplete suggestions for child names (lightweight, fast)
 */
router.get('/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ suggestions: [] });
  }

  const searchTerm = `%${q.trim()}%`;
  const result = await pool.query(
    `SELECT DISTINCT fullname AS "fullName"
     FROM children
     WHERE fullname ILIKE $1 AND deleted_at IS NULL AND is_active = true
     ORDER BY fullname ASC
     LIMIT 8`,
    [searchTerm]
  );

  res.json({ suggestions: result.rows.map((r) => r.fullName) });
});

/**
 * GET /api/v1/public/export-pdf/:planId
 * Public PDF export of evaluation for parents
 */
router.get('/export-pdf/:planId', async (req, res) => {
  const { planId } = req.params;
  const id = parseInt(planId, 10);
  if (!id || id <= 0) {
    return res.status(400).json({ error: 'Mã kế hoạch không hợp lệ' });
  }

  // Get plan info
  const planResult = await pool.query(
    `SELECT p.id, p.month, p.year, p.approver_name, p.status,
            c.fullname as child_name, c.date_of_birth,
            u.fullname as teacher_name
     FROM education_plans p
     LEFT JOIN children c ON p.child_id = c.id
     LEFT JOIN users u ON p.teacher_id = u.id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );

  if (planResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy kế hoạch' });
  }
  const plan = planResult.rows[0];

  // Get goals
  const goalsResult = await pool.query(
    `SELECT skill_name, goal_title, activities, image_url,
            result_status, result_notes, display_order
     FROM plan_goals
     WHERE plan_id = $1
     ORDER BY display_order ASC, id ASC`,
    [id]
  );
  const goals = goalsResult.rows;

  // Group goals by skill
  const grouped = {};
  const skillOrder = [];
  goals.forEach((g) => {
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

  // Font paths
  const fontRegular = 'C:/Windows/Fonts/times.ttf';
  const fontBold = 'C:/Windows/Fonts/timesbd.ttf';

  // Create PDF — A4 landscape
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    bufferPages: true,
  });

  // Register fonts
  doc.registerFont('Regular', fontRegular);
  doc.registerFont('Bold', fontBold);

  // Set response headers
  const filename = `DanhGia_${(plan.child_name || 'plan').replace(/\s+/g, '_')}_T${plan.month}_${plan.year}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Title
  doc.font('Bold').fontSize(16).fillColor('#CC0000')
    .text(`KẾ HOẠCH GIÁO DỤC CÁ NHÂN THÁNG ${plan.month}/${plan.year}`, { align: 'center' });
  doc.moveDown(0.3);

  // Subtitle
  doc.font('Bold').fontSize(12).fillColor('#333')
    .text('BẢNG ĐÁNH GIÁ KẾT QUẢ', { align: 'center' });
  doc.moveDown(0.6);

  // Child info
  const dob = plan.date_of_birth ? new Date(plan.date_of_birth) : null;
  const dobStr = dob ? `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}` : '';

  doc.font('Regular').fontSize(11).fillColor('#000');
  doc.font('Bold').text('Họ và tên trẻ: ', { continued: true });
  doc.font('Regular').text(plan.child_name || '');
  doc.font('Bold').text('Năm sinh: ', { continued: true });
  doc.font('Regular').text(dobStr);
  doc.font('Bold').text('Giáo viên phụ trách: ', { continued: true });
  doc.font('Regular').text(plan.teacher_name || '');
  doc.moveDown(0.5);

  // Table config
  const colWidths = [pageWidth * 0.15, pageWidth * 0.45, pageWidth * 0.15, pageWidth * 0.25];
  const headerLabels = ['KỸ NĂNG', 'MỤC TIÊU & HOẠT ĐỘNG', 'KẾT QUẢ', 'GHI CHÚ'];
  const tableLeft = doc.page.margins.left;
  const headerBg = '#D9E2F3';
  const achievedColor = '#2e7d32';
  const partialColor = '#e65100';
  const notAchievedColor = '#c62828';
  const pendingColor = '#999999';

  const statusColorMap = {
    achieved: achievedColor,
    partial: partialColor,
    not_achieved: notAchievedColor,
    pending: pendingColor,
  };

  // Draw table header
  function drawTableHeader(y) {
    let x = tableLeft;
    doc.save();
    for (let i = 0; i < 4; i++) {
      doc.rect(x, y, colWidths[i], 28).fillAndStroke(headerBg, '#000');
      doc.fillColor('#000').font('Bold').fontSize(10)
        .text(headerLabels[i], x + 4, y + 8, { width: colWidths[i] - 8, align: 'center' });
      x += colWidths[i];
    }
    doc.restore();
    return y + 28;
  }

  // Draw a cell border
  function drawCellBorder(x, y, w, h) {
    doc.save().rect(x, y, w, h).stroke('#000').restore();
  }

  // Measure text height
  function measureText(text, font, size, width) {
    doc.font(font).fontSize(size);
    return doc.heightOfString(text || '', { width });
  }

  let currentY = drawTableHeader(doc.y);

  // Uploads directory for images
  const uploadsDir = path.resolve(__dirname, '../../uploads');

  // Draw rows
  for (const skillName of skillOrder) {
    const skillGoals = grouped[skillName];

    // Calculate row heights for this skill group
    const rowData = skillGoals.map((goal) => {
      const goalText = (goal.goal_title || '') + '\n' + (goal.activities || '');
      const goalH = measureText(goalText, 'Regular', 9, colWidths[1] - 8);
      const statusH = measureText(statusMap[goal.result_status] || 'Chưa đánh giá', 'Regular', 9, colWidths[2] - 8);
      const notesH = measureText(goal.result_notes || '', 'Regular', 9, colWidths[3] - 8);
      const rowH = Math.max(goalH, statusH, notesH, 24) + 10;
      return { goal, rowH };
    });

    const totalSkillHeight = rowData.reduce((sum, r) => sum + r.rowH, 0);

    // Check page break
    if (currentY + totalSkillHeight > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      currentY = doc.page.margins.top;
      currentY = drawTableHeader(currentY);
    }

    // Draw skill name cell (spanning all rows)
    const skillX = tableLeft;
    drawCellBorder(skillX, currentY, colWidths[0], totalSkillHeight);
    const skillTextH = measureText(skillName, 'Bold', 9, colWidths[0] - 8);
    const skillTextY = currentY + (totalSkillHeight - skillTextH) / 2;
    doc.font('Bold').fontSize(9).fillColor('#000')
      .text(skillName, skillX + 4, skillTextY, { width: colWidths[0] - 8, align: 'center' });

    // Draw each goal row
    let rowY = currentY;
    for (const { goal, rowH } of rowData) {
      const col1X = tableLeft + colWidths[0];
      const col2X = col1X + colWidths[1];
      const col3X = col2X + colWidths[2];

      // Goal column
      drawCellBorder(col1X, rowY, colWidths[1], rowH);
      doc.font('Bold').fontSize(9).fillColor('#000')
        .text(goal.goal_title || '', col1X + 4, rowY + 5, { width: colWidths[1] - 8 });
      if (goal.activities) {
        const titleH = measureText(goal.goal_title || '', 'Bold', 9, colWidths[1] - 8);
        doc.font('Regular').fontSize(8.5).fillColor('#444')
          .text(goal.activities, col1X + 4, rowY + 5 + titleH + 2, { width: colWidths[1] - 8 });
      }

      // Status column
      drawCellBorder(col2X, rowY, colWidths[2], rowH);
      const statusText = statusMap[goal.result_status] || 'Chưa đánh giá';
      const stColor = statusColorMap[goal.result_status] || pendingColor;
      doc.font('Bold').fontSize(9).fillColor(stColor)
        .text(statusText, col2X + 4, rowY + 5, { width: colWidths[2] - 8, align: 'center' });

      // Notes column
      drawCellBorder(col3X, rowY, colWidths[3], rowH);
      if (goal.result_notes) {
        doc.font('Regular').fontSize(8.5).fillColor('#333')
          .text(goal.result_notes, col3X + 4, rowY + 5, { width: colWidths[3] - 8 });
      }

      rowY += rowH;
    }

    currentY = rowY;
  }

  // Footer — signatures
  const footerY = currentY + 30;
  if (footerY > doc.page.height - doc.page.margins.bottom - 80) {
    doc.addPage();
  }

  const now = new Date();
  const dateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  const fY = doc.y > footerY ? doc.y + 20 : footerY;
  doc.font('Regular').fontSize(10).fillColor('#000')
    .text(dateStr, tableLeft + pageWidth * 0.55, fY, { width: pageWidth * 0.4, align: 'center' });

  doc.moveDown(0.5);
  const sigY = doc.y;

  // Left: Approver
  doc.font('Bold').fontSize(11).fillColor('#000')
    .text('Người phê duyệt', tableLeft, sigY, { width: pageWidth * 0.45, align: 'center' });
  doc.moveDown(2);
  doc.font('Regular').fontSize(11)
    .text(plan.approver_name || '', tableLeft, doc.y, { width: pageWidth * 0.45, align: 'center' });

  // Right: Teacher
  doc.font('Bold').fontSize(11).fillColor('#000')
    .text('Giáo viên phụ trách', tableLeft + pageWidth * 0.55, sigY, { width: pageWidth * 0.4, align: 'center' });
  doc.y = sigY;
  doc.moveDown(2);
  doc.font('Regular').fontSize(11)
    .text(plan.teacher_name || '', tableLeft + pageWidth * 0.55, doc.y, { width: pageWidth * 0.4, align: 'center' });

  doc.end();
});

module.exports = router;
