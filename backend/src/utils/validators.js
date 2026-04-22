const Joi = require('joi');

/**
 * Validation schemas using Joi
 * Reference: https://joi.dev/api/
 */

// ============================================
// AUTHENTICATION
// ============================================
exports.loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be valid',
      'any.required': 'Email is required',
    }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
}).unknown(false);

exports.refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
}).unknown(false);

exports.initAdminSchema = Joi.object({
  setup_secret: Joi.string().required().messages({
    'any.required': 'setup_secret is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be valid',
    'any.required': 'Email is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  password: Joi.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[!@#$%^&*]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)',
      'any.required': 'Password is required',
    }),
}).unknown(false);

exports.passwordSchema = Joi.string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[!@#$%^&*]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain uppercase, lowercase, number, and special character',
  });

// ============================================
// USERS
// ============================================
exports.createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  fullname: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid('admin', 'principal', 'teacher', 'parent')
    .required(),
  kindergarten_id: Joi.number().integer().allow(null),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]*$/)
    .allow('', null),
});

exports.updateUserSchema = Joi.object({
  fullname: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'principal', 'teacher', 'parent'),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]*$/)
    .allow('', null),
  kindergarten_id: Joi.number().integer().allow(null),
  current_password: Joi.when('new_password', {
    is: Joi.exist(),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  new_password: exports.passwordSchema.optional(),
});

// ============================================
// CHILDREN
// ============================================
exports.createChildSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).required(),
  date_of_birth: Joi.date().max('now').required(),
  gender: Joi.string().valid('male', 'female', 'other').allow(null, ''),
  special_notes: Joi.string().max(1000).allow('', null),
  kindergarten_id: Joi.number().integer().allow(null),
  teacher_id: Joi.number().integer().allow(null),
  parent_phone: Joi.string().max(20).allow('', null),
  parent_email: Joi.string().email().allow('', null),
  is_active: Joi.boolean().default(true),
});

exports.updateChildSchema = Joi.object({
  fullname: Joi.string().min(2).max(100),
  date_of_birth: Joi.date().max('now').allow(null),
  gender: Joi.string().valid('male', 'female', 'other').allow(null, ''),
  special_notes: Joi.string().max(1000).allow('', null),
  teacher_id: Joi.number().integer().allow(null),
  parent_phone: Joi.string().max(20).allow('', null),
  parent_email: Joi.string().email().allow('', null),
  is_active: Joi.boolean(),
});

// ============================================
// EDUCATION PLANS
// ============================================
exports.createPlanSchema = Joi.object({
  child_id: Joi.number().integer().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number()
    .integer()
    .min(new Date().getFullYear() - 1)
    .max(new Date().getFullYear() + 5)
    .required(),
  template_id: Joi.number().integer().required(),
});

exports.updatePlanSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'completed', 'submitted', 'approved')
    .optional(),
  approver_name: Joi.string().max(255).allow('', null).optional(),
  teacher_id: Joi.number().integer().optional(),
});

// ============================================
// EVALUATIONS
// ============================================
exports.evaluateSkillSchema = Joi.object({
  skill_id: Joi.number().integer().required(),
  status: Joi.string()
    .valid('achieved', 'not_achieved', 'partial', 'pending')
    .required(),
  notes: Joi.string().max(500).allow('', null),
  evidence_url: Joi.string().uri().allow('', null),
});

// ============================================
// PAGINATION
// ============================================
exports.paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional(),
}).unknown(false);

// ============================================
// SEARCH & FILTERS
// ============================================
exports.childrenFilterSchema = Joi.object({
  search: Joi.string().max(100).allow(''),
  teacher_id: Joi.number().integer().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
}).unknown(true);

exports.plansFilterSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'completed', 'submitted', 'approved')
    .allow(''),
  child_id: Joi.number().integer().allow(null),
  month: Joi.number().integer().min(1).max(12).allow(null),
  year: Joi.number().integer().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
}).unknown(true);
