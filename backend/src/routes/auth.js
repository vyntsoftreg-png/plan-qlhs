const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validator');
const { authLimiter, setupLimiter } = require('../middleware/rateLimiter');
const { loginSchema, refreshTokenSchema, initAdminSchema } = require('../utils/validators');

/**
 * POST /api/v1/auth/login
 * Login with email and password
 *
 * Request:
 * {
 *   "email": "teacher@example.com",
 *   "password": "SecurePassword123!"
 * }
 *
 * Response: 200 OK
 * {
 *   "code": "LOGIN_SUCCESS",
 *   "data": {
 *     "access_token": "eyJhbGciOiJIUzI1NiIs...",
 *     "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
 *     "token_type": "Bearer",
 *     "expires_in": 3600,
 *     "user": { id, email, name, role, kindergarten_id }
 *   }
 * }
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 *
 * Request:
 * {
 *   "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 *
 * Response: 200 OK
 * {
 *   "code": "TOKEN_REFRESHED",
 *   "data": {
 *     "access_token": "eyJhbGciOiJIUzI1NiIs...",
 *     "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
 *     "token_type": "Bearer",
 *     "expires_in": 3600
 *   }
 * }
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh
);

/**
 * POST /api/v1/auth/logout
 * Logout current user
 *
 * Headers:
 * Authorization: Bearer <access_token>
 *
 * Response: 200 OK
 * {
 *   "code": "LOGOUT_SUCCESS",
 *   "message": "Logout successful"
 * }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /api/v1/auth/setup
 * One-time admin account initialization.
 * Requires SETUP_ENABLED=true and correct SETUP_SECRET in .env.
 * Automatically blocked once any admin user exists.
 *
 * Request:
 * {
 *   "setup_secret": "<value of SETUP_SECRET in .env>",
 *   "email": "admin@example.com",
 *   "name": "Admin Name",
 *   "password": "SecurePass123!"
 * }
 */
router.post(
  '/setup',
  setupLimiter,
  validate(initAdminSchema),
  authController.initAdmin
);

module.exports = router;
