const pool = require('../config/database');
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Authentication Controller
 */

/**
 * POST /auth/login
 * Login user with email and password
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userResult = await pool.query(
      `SELECT id, email, fullname AS name, password_hash, role, kindergarten_id, is_active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      logger.warn(`Login failed: user not found for email ${email}`);
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      logger.warn(`Login failed: user not active for email ${email}`);
      return res.status(401).json({
        code: 'USER_INACTIVE',
        message: 'Account is temporarily disabled. Contact administrator.',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify password
    const passwordMatch = await authService.comparePassword(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      logger.warn(`Login failed: invalid password for user ${user.id}`);
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate tokens
    const tokens = authService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      kindergarten_id: user.kindergarten_id,
    });

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, ip_address)
       VALUES ($1, $2, 'auth', $3)`,
      [user.id, 'login', req.ip]
    );

    logger.info(`User logged in: ${user.id} (${user.email})`);

    // Return success response
    res.status(200).json({
      code: 'LOGIN_SUCCESS',
      message: 'Login successful',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          kindergarten_id: user.kindergarten_id,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = authService.verifyToken(
        refresh_token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      logger.warn('Invalid refresh token');
      return res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString(),
      });
    }

    // Get fresh user data
    const userResult = await pool.query(
      `SELECT id, email, fullname AS name, role, kindergarten_id, is_active
       FROM users
       WHERE id = $1`,
      [decoded.sub]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found or account is disabled',
        timestamp: new Date().toISOString(),
      });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokens = authService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      kindergarten_id: user.kindergarten_id,
    });

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, ip_address)
       VALUES ($1, $2, 'auth', $3)`,
      [user.id, 'token_refresh', req.ip]
    );

    logger.debug(`Token refreshed for user: ${user.id}`);

    res.status(200).json({
      code: 'TOKEN_REFRESHED',
      message: 'Token refreshed successfully',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: 'Bearer',
        expires_in: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout user (optional: could implement token blacklist)
 */
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user?.sub;

    if (userId) {
      // Log activity
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, ip_address)
         VALUES ($1, $2, 'auth', $3)`,
        [userId, 'logout', req.ip]
      );

      logger.info(`User logged out: ${userId}`);
    }

    res.status(200).json({
      code: 'LOGOUT_SUCCESS',
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

/**
 * POST /auth/setup
 * One-time initialization of the first admin account.
 * - Only works when no admin user exists in the database.
 * - Requires a SETUP_SECRET token from environment variables.
 * - Disabled automatically once an admin is present.
 */
exports.initAdmin = async (req, res, next) => {
  try {
    const { setup_secret, email, name, password } = req.body;

    // --- Guard: endpoint must be explicitly enabled in env ---
    if (process.env.SETUP_ENABLED !== 'true') {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Not found',
        timestamp: new Date().toISOString(),
      });
    }

    // --- Guard: validate setup secret using constant-time comparison ---
    const expectedSecret = process.env.SETUP_SECRET;
    if (!expectedSecret) {
      logger.error('SETUP_SECRET env variable is not set');
      return res.status(500).json({
        code: 'SETUP_NOT_CONFIGURED',
        message: 'Setup is not configured on the server',
        timestamp: new Date().toISOString(),
      });
    }

    // Use timingSafeEqual to prevent timing attacks
    const crypto = require('crypto');
    const secretBuffer = Buffer.from(expectedSecret);
    const providedBuffer = Buffer.alloc(secretBuffer.length);
    Buffer.from(setup_secret).copy(providedBuffer);
    const secretsMatch =
      setup_secret.length === expectedSecret.length &&
      crypto.timingSafeEqual(secretBuffer, providedBuffer);

    if (!secretsMatch) {
      logger.warn(`Setup attempt with invalid secret from IP: ${req.ip}`);
      // Return generic 403 — do not reveal whether secret validation failed
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Forbidden',
        timestamp: new Date().toISOString(),
      });
    }

    // --- Guard: abort if any admin already exists ---
    const existingAdmin = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );
    if (existingAdmin.rows.length > 0) {
      logger.warn(`Setup attempted but admin already exists. IP: ${req.ip}`);
      return res.status(409).json({
        code: 'ADMIN_ALREADY_EXISTS',
        message: 'An admin account already exists. Setup is disabled.',
        timestamp: new Date().toISOString(),
      });
    }

    // --- Guard: email must not already be taken ---
    const existingEmail = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        code: 'EMAIL_TAKEN',
        message: 'Email is already in use',
        timestamp: new Date().toISOString(),
      });
    }

    // --- Create admin account ---
    const passwordHash = await authService.hashPassword(password);

    const insertResult = await pool.query(
      `INSERT INTO users (email, fullname, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())
       RETURNING id, email, fullname AS name, role, created_at`,
      [email.toLowerCase(), name, passwordHash]
    );

    const newAdmin = insertResult.rows[0];
    logger.info(`Initial admin account created: id=${newAdmin.id} email=${newAdmin.email} IP=${req.ip}`);

    // Generate tokens so admin can log in immediately
    const tokens = authService.generateTokens({
      sub: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
      kindergarten_id: null,
    });

    return res.status(201).json({
      code: 'ADMIN_CREATED',
      message: 'Admin account created successfully. Disable SETUP_ENABLED in .env now.',
      data: {
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: 'Bearer',
        expires_in: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('initAdmin error:', error);
    next(error);
  }
};
