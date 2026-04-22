const templatesService = require('../services/templatesService');
const logger = require('../utils/logger');

exports.listTemplates = async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    const kindergartenId = req.user.kindergarten_id;
    const filters = {};
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    const templates = await templatesService.listTemplates(kindergartenId, filters);

    return res.status(200).json({
      code: 'SUCCESS',
      data: templates.data,
      pagination: { total: templates.total, page: templates.page, pages: templates.pages },
    });
  } catch (err) {
    logger.error('Error listing templates', { error: err.message });
    return next(err);
  }
};

exports.getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kindergartenId = req.user.kindergarten_id;
    const template = await templatesService.getTemplateById(parseInt(id, 10), kindergartenId);

    return res.status(200).json({ code: 'SUCCESS', data: template });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    if (err.statusCode === 403) return res.status(403).json({ code: 'FORBIDDEN', message: err.message });
    return next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const { name, description, age_group, goals } = req.body;
    const userId = req.user.id;
    const kindergartenId = req.user.kindergarten_id;

    if (!name) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'TÃªn máº«u káº¿ hoáº¡ch lÃ  báº¯t buá»™c' });
    }

    const template = await templatesService.createTemplate(
      kindergartenId, name, description, age_group, goals || [], userId,
    );

    return res.status(201).json({ code: 'SUCCESS', message: 'Template created', data: template });
  } catch (err) {
    if (err.statusCode === 409) return res.status(409).json({ code: 'CONFLICT', message: err.message });
    return next(err);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { goals, ...templateUpdates } = req.body;
    const kindergartenId = req.user.kindergarten_id;

    const template = await templatesService.updateTemplate(
      parseInt(id, 10), kindergartenId, templateUpdates, goals,
    );

    return res.status(200).json({ code: 'SUCCESS', message: 'Template updated', data: template });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    return next(err);
  }
};

exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kindergartenId = req.user.kindergarten_id;

    await templatesService.deleteTemplate(parseInt(id, 10), kindergartenId);

    return res.status(200).json({ code: 'SUCCESS', message: 'Template deleted' });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    return next(err);
  }
};

exports.cloneTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kindergartenId = req.user.kindergarten_id;
    const userId = req.user.id;

    const template = await templatesService.cloneTemplate(parseInt(id, 10), kindergartenId, userId);

    return res.status(201).json({ code: 'SUCCESS', message: 'Sao chép mẫu kế hoạch thành công', data: template });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ code: 'NOT_FOUND', message: err.message });
    return next(err);
  }
};
