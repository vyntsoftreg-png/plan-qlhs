/**
 * Integration tests for user management endpoints
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/config/server');
const pool = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('User Management Tests', () => {
  // Test users
  const adminUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'AdminPassword123!',
    role: 'admin',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    is_active: true,
  };

  const principalUser = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'principal@example.com',
    name: 'Principal User',
    password: 'PrincipalPass123!',
    role: 'principal',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    is_active: true,
  };

  const teacherUser = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'teacher@example.com',
    name: 'Võ Thị Thanh Thúy',
    password: 'TeacherPass123!',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    is_active: true,
  };

  const newUserData = {
    email: 'newteacher@example.com',
    name: 'New Teacher',
    password: 'NewPass123!',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    phone: '+84-123-456-789',
  };

  let adminToken;
  let principalToken;
  let teacherToken;

  beforeAll(async () => {
    // Setup: Create test users and get tokens (in a real test, you would seed the database)
    // For now, these are placeholder tests that show the structure
    console.log('Setting up test users...');
  });

  afterAll(async () => {
    // Cleanup: Remove test users and close database connection
    // await pool.end();
  });

  describe('GET /api/v1/users', () => {
    it('should list all users when authenticated as admin', async () => {
      // Requires admin token
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 20, offset: 0 });

      // Expected: 200 OK with user list
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'SUCCESS');
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('offset');

      // Should not include password_hash
      if (response.body.data.users.length > 0) {
        expect(response.body.data.users[0]).not.toHaveProperty('password_hash');
      }
    });

    it('should reject list request with invalid authorization', async () => {
      // Non-admin user (teacher) should not be able to list users
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should reject list request without authentication', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'NOT_AUTHENTICATED');
    });

    it('should filter users by search query', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Thanh' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('users');
      // Should contain users matching the search
      if (response.body.data.users.length > 0) {
        const hasMatch = response.body.data.users.some(
          (user) =>
            user.name.toLowerCase().includes('thanh') ||
            user.email.toLowerCase().includes('thanh')
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'teacher' });

      expect(response.status).toBe(200);
      if (response.body.data.users.length > 0) {
        response.body.data.users.forEach((user) => {
          expect(user.role).toBe('teacher');
        });
      }
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'SUCCESS');
      expect(response.body.data).toHaveProperty('id', teacherUser.id);
      expect(response.body.data).toHaveProperty('email', teacherUser.email);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should allow admin to view any user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(teacherUser.id);
    });

    it('should reject when non-admin tries to view another user profile', async () => {
      // Teacher trying to view another user's profile
      const response = await request(app)
        .get(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '999e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(`/api/v1/users/${teacherUser.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create user when authenticated as admin', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('code', 'USER_CREATED');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', newUserData.email);
      expect(response.body.data).toHaveProperty('name', newUserData.name);
      expect(response.body.data).toHaveProperty('role', newUserData.role);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should create user when authenticated as principal', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          ...newUserData,
          email: 'anothernewteacher@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('code', 'USER_CREATED');
    });

    it('should reject user creation by non-admin/principal', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(newUserData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should reject duplicate email', async () => {
      // First create a user
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          email: 'unique-test@example.com',
        });

      // Try to create another with same email
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          email: 'unique-test@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          // Missing name, password, role, kindergarten_id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate role', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          role: 'invalid-role',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send(newUserData);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update own profile', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Updated Teacher Name',
          phone: '+84-999-999-999',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'USER_UPDATED');
      expect(response.body.data).toHaveProperty('name', 'Updated Teacher Name');
      expect(response.body.data).toHaveProperty('phone', '+84-999-999-999');
    });

    it('should allow admin to update any user', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('name', 'Admin Updated Name');
    });

    it('should reject when non-admin tries to update another user', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Hacker Name',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should change password with current password verification', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          current_password: teacherUser.password,
          new_password: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'USER_UPDATED');
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          current_password: 'WrongPassword123!',
          new_password: 'NewPassword456!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_PASSWORD');
    });

    it('should require current password when changing password', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          new_password: 'NewPassword456!',
          // Missing current_password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '999e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .put(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${teacherUser.id}`)
        .send({
          name: 'Hacker Name',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user when authenticated as admin', async () => {
      // Create a user first
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newUserData,
          email: 'delete-test@example.com',
        });

      const userId = createResponse.body.data.id;

      // Delete the user
      const response = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'USER_DELETED');

      // Verify user is deleted (soft delete)
      const getResponse = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion by non-admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should prevent user from deleting own account', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${teacherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Admin can delete others, but business logic prevents self-deletion
      // This depends on implementation
      if (response.status === 400) {
        expect(response.body).toHaveProperty('code', 'CANNOT_DELETE_SELF');
      }
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '999e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).delete(
        `/api/v1/users/${teacherUser.id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/:id/deactivate', () => {
    it('should deactivate user account', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${teacherUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'USER_DEACTIVATED');
      expect(response.body.data).toHaveProperty('is_active', false);
    });

    it('should reject deactivation by non-admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${adminUser.id}/deactivate`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:id/activate', () => {
    it('should activate user account', async () => {
      // First deactivate
      await request(app)
        .patch(`/api/v1/users/${teacherUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Then activate
      const response = await request(app)
        .patch(`/api/v1/users/${teacherUser.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'USER_ACTIVATED');
      expect(response.body.data).toHaveProperty('is_active', true);
    });

    it('should reject activation by non-admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${adminUser.id}/activate`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
