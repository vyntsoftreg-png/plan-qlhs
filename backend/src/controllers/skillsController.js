const skillsService = require('../services/skillsService');
const logger = require('../utils/logger');

/**
 * Skills Controller
 */

exports.listSkills = async (req, res, next) => {
  try {
    const { development_area_id, search, limit, offset } = req.query;
    const filters = {};
    if (development_area_id) filters.development_area_id = parseInt(development_area_id, 10);
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    const skills = await skillsService.listSkills(req.user.kindergarten_id, filters);

    return res.status(200).json({
      code: 'SUCCESS',
      message: `Retrieved ${skills.data.length} skills`,
      data: skills.data,
      pagination: { total: skills.total, page: skills.page, pages: skills.pages, limit: filters.limit || 20 },
    });
  } catch (err) {
    logger.error('Error listing skills', { error: err.message });
    return next(err);
  }
};

exports.getSkillById = async (req, res, next) => {
  try {
    const skill = await skillsService.getSkillById(parseInt(req.params.id, 10));
    return res.status(200).json({ code: 'SUCCESS', message: 'Skill retrieved', data: skill });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    return next(err);
  }
};

exports.createSkill = async (req, res, next) => {
  try {
    const { development_area_id, name } = req.body;
    if (!development_area_id || !name) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'development_area_id and name are required' });
    }

    const skill = await skillsService.createSkill(req.body, req.user.id);
    return res.status(201).json({ code: 'SUCCESS', message: 'Skill created successfully', data: skill });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    if (err.statusCode === 409) return res.status(409).json({ code: 'CONFLICT', message: err.message });
    return next(err);
  }
};

exports.updateSkill = async (req, res, next) => {
  try {
    const skill = await skillsService.updateSkill(parseInt(req.params.id, 10), req.body, req.user.id);
    return res.status(200).json({ code: 'SUCCESS', message: 'Skill updated successfully', data: skill });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    if (err.statusCode === 409) return res.status(409).json({ code: 'CONFLICT', message: err.message });
    return next(err);
  }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization
    if (userRole !== 'admin' && userRole !== 'principal') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only admins and principals can delete skills',
      });
    }

    const result = await skillsService.deleteSkill(parseInt(id, 10), userId);

    logger.info(`Skill deleted: ${id}`, { userId });

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Skill deleted successfully',
      data: result,
    });
  } catch (err) {
    logger.error('Error deleting skill', { error: err.message });

    if (err.statusCode === 404) {
      return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    }

    return next(err);
  }
};

/**
 * Get development areas
 * GET /api/v1/development-areas
 */
exports.getDevelopmentAreas = async (req, res, next) => {
  try {
    const areas = await skillsService.getDevelopmentAreas();

    logger.info('Development areas retrieved', {
      userId: req.user.id,
      count: areas.length,
    });

    return res.status(200).json({
      code: 'SUCCESS',
      message: `Retrieved ${areas.length} development areas`,
      data: areas,
    });
  } catch (err) {
    logger.error('Error retrieving development areas', { error: err.message });
    return next(err);
  }
};
