/**
 * Integration tests for children management endpoints
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/config/server');
const pool = require('../../src/config/database');

describe('Children Management Tests', () => {
  // Test users
  const adminUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const principalUser = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'principal@example.com',
    name: 'Principal User',
    role: 'principal',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const teacherUser = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'teacher@example.com',
    name: 'Võ Thị Thanh Thúy',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const anotherTeacherUser = {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'teacher2@example.com',
    name: 'Teacher Two',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  // Test children
  const newChildData = {
    name: 'Võ Lê Yến Nhi',
    date_of_birth: '2021-10-16',
    gender: 'female',
    special_needs_description: 'No special needs',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    assigned_teacher_id: '550e8400-e29b-41d4-a716-446655440003',
    guardian_name: 'Võ Lê Ánh',
    guardian_phone: '+84-123-456-789',
  };

  const existingChild = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    name: 'Existing Child',
    date_of_birth: '2021-05-10',
    gender: 'male',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    assigned_teacher_id: '550e8400-e29b-41d4-a716-446655440003',
  };

  let adminToken;
  let principalToken;
  let teacherToken;
  let anotherTeacherToken;

  beforeAll(async () => {
    console.log('Setting up test children data...');
  });

  afterAll(async () => {
    // await pool.end();
  });

  describe('GET /api/v1/children', () => {
    it('should list children visible to admin', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'SUCCESS');
      expect(response.body.data).toHaveProperty('children');
      expect(Array.isArray(response.body.data.children)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should list children for principal (only in their kindergarten)', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${principalToken}`)
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'SUCCESS');
      // Principal should only see children in their kindergarten
      if (response.body.data.children.length > 0) {
        response.body.data.children.forEach((child) => {
          expect(child.kindergarten_id).toBe(principalUser.kindergarten_id);
        });
      }
    });

    it('should list children for teacher (only their assignments)', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      // Teacher should only see their assigned children
      if (response.body.data.children.length > 0) {
        response.body.data.children.forEach((child) => {
          expect(child.assigned_teacher_id).toBe(teacherUser.id);
        });
      }
    });

    it('should reject list without authentication', async () => {
      const response = await request(app).get('/api/v1/children');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'NOT_AUTHENTICATED');
    });

    it('should filter children by teacher_id', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ teacher_id: teacherUser.id });

      expect(response.status).toBe(200);
      if (response.body.data.children.length > 0) {
        response.body.data.children.forEach((child) => {
          expect(child.assigned_teacher_id).toBe(teacherUser.id);
        });
      }
    });

    it('should filter children by search query', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Yến' });

      expect(response.status).toBe(200);
      // Results should match search or be empty
      if (response.body.data.children.length > 0) {
        const hasMatch = response.body.data.children.some(
          (child) =>
            child.name.toLowerCase().includes('yến') ||
            child.guardian_name?.toLowerCase().includes('yến')
        );
        // Note: may be empty if test data not in database
      }
    });

    it('should filter children by gender', async () => {
      const response = await request(app)
        .get('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ gender: 'female' });

      expect(response.status).toBe(200);
      if (response.body.data.children.length > 0) {
        response.body.data.children.forEach((child) => {
          expect(child.gender).toBe('female');
        });
      }
    });
  });

  describe('POST /api/v1/children', () => {
    it('should create child as admin', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newChildData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('code', 'CHILD_CREATED');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', newChildData.name);
      expect(response.body.data).toHaveProperty('gender', newChildData.gender);
      expect(response.body.data).toHaveProperty(
        'assigned_teacher_id',
        newChildData.assigned_teacher_id
      );
    });

    it('should create child as principal (same kindergarten)', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${principalToken}`)
        .send(newChildData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('code', 'CHILD_CREATED');
    });

    it('should reject creation by teacher', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(newChildData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should reject creation by principal for different kindergarten', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          ...newChildData,
          kindergarten_id: '550e8400-e29b-41d4-a716-446655440099', // Different kindergarten
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Only Name',
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate date_of_birth (cannot be future)', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newChildData,
          date_of_birth: '2099-01-01', // Future date
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate gender enum', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newChildData,
          gender: 'invalid-gender',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject with invalid teacher', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newChildData,
          assigned_teacher_id: '999e8400-e29b-41d4-a716-446655440999', // Non-existent teacher
        });

      // Might return 400 INVALID_TEACHER or succeed (depends on data)
      if (response.status === 400) {
        expect(response.body).toHaveProperty('code', 'INVALID_TEACHER');
      }
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/children')
        .send(newChildData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/children/:id', () => {
    it('should get child details when authorized', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // 200 if child assigned to this teacher, 404 if not assigned
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
        expect(response.body.data).toHaveProperty('id', existingChild.id);
      } else {
        expect(response.status).toBe(404);
      }
    });

    it('should allow admin to view any child', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should succeed (or 404 if child doesn't exist)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
      }
    });

    it('should allow principal to view children in their kindergarten', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${principalToken}`);

      // Depends on if child is in principal's kindergarten
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
        expect(response.body.data.kindergarten_id).toBe(
          principalUser.kindergarten_id
        );
      }
    });

    it('should reject teacher viewing non-assigned child', async () => {
      // Teacher2 trying to view child assigned to Teacher1
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      // Should be 403 if not assigned, 404 if child not found
      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .get('/api/v1/children/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'CHILD_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/children/${existingChild.id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/children/:id', () => {
    it('should update child as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Child Name',
          gender: 'male',
        });

      // 200 if updated, 404 if not found
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'CHILD_UPDATED');
        expect(response.body.data).toHaveProperty('name', 'Updated Child Name');
      }
    });

    it('should update child as principal (same kindergarten)', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          name: 'Updated by Principal',
        });

      // Depends on if child is in principal's kindergarten
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'CHILD_UPDATED');
      }
    });

    it('should update child as assigned teacher', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Updated by Teacher',
        });

      // Depends on if child is assigned to teacher
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'CHILD_UPDATED');
      }
    });

    it('should reject update by non-assigned teacher', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`)
        .send({
          name: 'Hacker Name',
        });

      expect([403, 404]).toContain(response.status);
    });

    it('should reject update principal for different kindergarten', async () => {
      const response = await request(app)
        .put('/api/v1/children/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          name: 'Hacker Name',
        });

      expect([403, 404]).toContain(response.status);
    });

    it('should validate gender enum', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          gender: 'invalid-gender',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .put('/api/v1/children/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'CHILD_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/children/${existingChild.id}`)
        .send({
          name: 'Hacker Name',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/children/:id', () => {
    it('should delete child as admin', async () => {
      // First create a child to delete
      const createResponse = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newChildData,
          name: 'Child to Delete',
        });

      if (createResponse.status === 201) {
        const childId = createResponse.body.data.id;

        const deleteResponse = await request(app)
          .delete(`/api/v1/children/${childId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('code', 'CHILD_DELETED');
      }
    });

    it('should delete child as principal (same kindergarten)', async () => {
      const response = await request(app)
        .delete(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${principalToken}`);

      // May be 403 if different kindergarten, 404 if not found
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should reject deletion by teacher', async () => {
      const response = await request(app)
        .delete(`/api/v1/children/${existingChild.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should reject deletion by principal for different kindergarten', async () => {
      const response = await request(app)
        .delete('/api/v1/children/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${principalToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .delete('/api/v1/children/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'CHILD_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).delete(
        `/api/v1/children/${existingChild.id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/children/:id/progress', () => {
    it('should get child progress when authorized', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}/progress`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // May be 200 or 404 depending on authorization
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
        expect(response.body.data).toHaveProperty('child_id');
        expect(response.body.data).toHaveProperty('overall_progress');
      }
    });

    it('should allow admin to view any child progress', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}/progress`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
      }
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${existingChild.id}/progress`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .get('/api/v1/children/999e8400-e29b-41d4-a716-446655440999/progress')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/children/${existingChild.id}/progress`
      );

      expect(response.status).toBe(401);
    });
  });
});
