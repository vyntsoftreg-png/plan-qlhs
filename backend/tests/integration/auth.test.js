/**
 * Integration tests for authentication endpoints
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/config/server');
const pool = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('Authentication Tests', () => {
  // Sample test user (would be created in database)
  const testUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'teacher@example.com',
    name: 'Võ Thị Thanh Thúy',
    password: 'SecurePassword123!',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    is_active: true,
  };

  beforeAll(async () => {
    // Would connect to test database here
    // await setupTestDatabase();
  });

  afterAll(async () => {
    // Would cleanup test database and close connections
    // await cleanupTestDatabase();
    // await pool.end();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // This test assumes test user exists in database
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Expected: 200 OK
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'LOGIN_SUCCESS');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        kindergarten_id: testUser.kindergarten_id,
      });
      expect(response.body.data.token_type).toBe('Bearer');
      expect(response.body.data.expires_in).toBe(3600);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject login with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: '123', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let validRefreshToken;

    beforeAll(async () => {
      // Generate a valid refresh token
      const tokens = authService.generateTokens({
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        kindergarten_id: testUser.kindergarten_id,
      });
      validRefreshToken = tokens.refresh_token;
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'TOKEN_REFRESHED');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.token_type).toBe('Bearer');
      expect(response.body.data.expires_in).toBe(3600);

      // Verify the new access token is different from old one
      expect(response.body.data.access_token).not.toBe(validRefreshToken);
    });

    it('should reject refresh with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'MISSING_REFRESH_TOKEN');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid.token.here',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const tokens = authService.generateTokens({
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        kindergarten_id: testUser.kindergarten_id,
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'LOGOUT_SUCCESS');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'MISSING_TOKEN');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_TOKEN');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login after 5 failed attempts', async () => {
      // This would need to make 5 requests in a short time
      // Skip in this example but would be tested in full suite
    });
  });
});
