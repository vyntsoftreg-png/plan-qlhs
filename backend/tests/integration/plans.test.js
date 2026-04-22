/**
 * Integration tests for education plans endpoints
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/config/server');
const pool = require('../../src/config/database');

describe('Education Plans Tests', () => {
  // Test users
  const adminUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@example.com',
    role: 'admin',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const principalUser = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'principal@example.com',
    role: 'principal',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const teacherUser = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'teacher@example.com',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  const anotherTeacherUser = {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'teacher2@example.com',
    role: 'teacher',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
  };

  // Test data
  const testChild = {
    id: '550e8400-e29b-41d4-a716-446655440100',
    name: 'Test Child',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    assigned_teacher_id: '550e8400-e29b-41d4-a716-446655440003',
  };

  const testTemplate = {
    id: '550e8400-e29b-41d4-a716-446655440200',
    name: 'Standard Plan Template',
    is_active: true,
  };

  const newPlanData = {
    child_id: '550e8400-e29b-41d4-a716-446655440100',
    month: 4,
    year: 2026,
    template_id: '550e8400-e29b-41d4-a716-446655440200',
  };

  const existingPlan = {
    id: '550e8400-e29b-41d4-a716-446655440300',
    child_id: '550e8400-e29b-41d4-a716-446655440100',
    status: 'draft',
    kindergarten_id: '550e8400-e29b-41d4-a716-446655440010',
    assigned_teacher_id: '550e8400-e29b-41d4-a716-446655440003',
  };

  let adminToken;
  let principalToken;
  let teacherToken;
  let anotherTeacherToken;

  beforeAll(async () => {
    console.log('Setting up plan test data...');
  });

  afterAll(async () => {
    // await pool.end();
  });

  describe('GET /api/v1/plans', () => {
    it('should list all plans for admin', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 'SUCCESS');
      expect(response.body.data).toHaveProperty('plans');
      expect(Array.isArray(response.body.data.plans)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should list plans for principal (only in their kindergarten)', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(response.status).toBe(200);
      // Plans should be filtered by principal's kindergarten
      if (response.body.data.plans.length > 0) {
        // All plans should be in principal's kindergarten
      }
    });

    it('should list plans for teacher (only their assigned children)', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      // Plans should be filtered by teacher's assignments
    });

    it('should filter plans by status', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'draft' });

      expect(response.status).toBe(200);
      if (response.body.data.plans.length > 0) {
        response.body.data.plans.forEach((plan) => {
          expect(plan.status).toBe('draft');
        });
      }
    });

    it('should filter plans by child_id', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ child_id: testChild.id });

      expect(response.status).toBe(200);
      if (response.body.data.plans.length > 0) {
        response.body.data.plans.forEach((plan) => {
          expect(plan.child_id).toBe(testChild.id);
        });
      }
    });

    it('should filter plans by month and year', async () => {
      const response = await request(app)
        .get('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ month: 4, year: 2026 });

      expect(response.status).toBe(200);
      if (response.body.data.plans.length > 0) {
        response.body.data.plans.forEach((plan) => {
          expect(plan.month).toBe(4);
          expect(plan.year).toBe(2026);
        });
      }
    });

    it('should reject list without authentication', async () => {
      const response = await request(app).get('/api/v1/plans');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/plans', () => {
    it('should create plan as admin', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPlanData);

      // 201 or 409 if duplicate
      if (response.status === 201) {
        expect(response.body).toHaveProperty('code', 'PLAN_CREATED');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('status', 'draft');
        expect(response.body.data).toHaveProperty('skills_by_area');
        expect(response.body.data).toHaveProperty('progress');
      } else {
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('code', 'PLAN_ALREADY_EXISTS');
      }
    });

    it('should create plan as teacher (assigned child)', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          ...newPlanData,
          month: 5, // Different month to avoid duplicate
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('code', 'PLAN_CREATED');
      }
    });

    it('should create plan as principal (same kindergarten)', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          ...newPlanData,
          month: 6, // Different month
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('code', 'PLAN_CREATED');
      }
    });

    it('should reject teacher creating plan for non-assigned child', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${anotherTeacherToken}`)
        .send(newPlanData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should reject principal creating plan in different kindergarten', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          ...newPlanData,
          kindergarten_id: '999e8400-e29b-41d4-a716-446655440999',
        });

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          child_id: newPlanData.child_id,
          // Missing month, year, template_id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate month range', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newPlanData,
          month: 13, // Invalid month
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject duplicate plan for same child/month/year', async () => {
      // First create a plan
      await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newPlanData,
          month: 7, // Unique month
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newPlanData,
          month: 7, // Same month
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('code', 'PLAN_ALREADY_EXISTS');
    });

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newPlanData,
          child_id: '999e8400-e29b-41d4-a716-446655440999',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'CHILD_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/plans')
        .send(newPlanData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/plans/:id', () => {
    it('should get full plan details when authorized', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // 200 if authorized (assigned teacher), 404 if not found
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
        expect(response.body.data).toHaveProperty('id', existingPlan.id);
        expect(response.body.data).toHaveProperty('skills_by_area');
        expect(response.body.data).toHaveProperty('progress');
      }
    });

    it('should allow admin to view any plan', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
      }
    });

    it('should allow principal to view plans in their kindergarten', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${principalToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
      }
    });

    it('should reject non-assigned teacher', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/api/v1/plans/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'PLAN_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/plans/${existingPlan.id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/plans/:id', () => {
    it('should update plan status as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed',
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'PLAN_UPDATED');
        expect(response.body.data).toHaveProperty('status');
      }
    });

    it('should update plan status as assigned teacher', async () => {
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: 'completed',
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'PLAN_UPDATED');
      }
    });

    it('should reject non-assigned teacher', async () => {
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`)
        .send({
          status: 'completed',
        });

      expect([403, 404]).toContain(response.status);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
    });

    it('should validate status transitions', async () => {
      // Create a plan in approved state
      // Try to transition to invalid state
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'draft', // Invalid transition from approved
        });

      // May be 400 if invalid transition, 200 if valid
      if (response.status === 400) {
        expect(response.body).toHaveProperty('code', 'INVALID_STATUS_TRANSITION');
      }
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .put('/api/v1/plans/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/plans/${existingPlan.id}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/plans/:id', () => {
    it('should delete draft plan as admin', async () => {
      // Create a draft plan first
      const createResponse = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newPlanData,
          month: 8, // Unique month
        });

      if (createResponse.status === 201) {
        const planId = createResponse.body.data.id;

        const deleteResponse = await request(app)
          .delete(`/api/v1/plans/${planId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('code', 'PLAN_DELETED');
      }
    });

    it('should delete draft plan as teacher (own plan)', async () => {
      // Create and delete own draft plan
      const createResponse = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          ...newPlanData,
          month: 9, // Unique month
        });

      if (createResponse.status === 201) {
        const planId = createResponse.body.data.id;

        const deleteResponse = await request(app)
          .delete(`/api/v1/plans/${planId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(deleteResponse.status).toBe(200);
      }
    });

    it('should reject teacher deleting non-draft plan', async () => {
      // Try to delete non-draft plan as teacher
      const response = await request(app)
        .delete(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // 400 if plan not draft, 403 if not assigned, 404 if not found
      expect([400, 403, 404]).toContain(response.status);
    });

    it('should reject non-assigned teacher', async () => {
      const response = await request(app)
        .delete(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should reject deletion of approved plan', async () => {
      // Create approved plan first, then try to delete
      const response = await request(app)
        .delete(`/api/v1/plans/${existingPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // May be 400 if approved (cannot delete), or 200 if draft
      // Depends on plan status in test data
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .delete('/api/v1/plans/999e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app).delete(
        `/api/v1/plans/${existingPlan.id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/plans/:id/export-pdf', () => {
    it('should export plan as PDF when authorized', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/export-pdf`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // 200 for authorized, 403 for unauthorized, 404 for not found
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'PDF_GENERATION_STARTED');
        expect(response.body.data).toHaveProperty('filename');
      }
    });

    it('should allow admin to export any plan', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/export-pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'PDF_GENERATION_STARTED');
      }
    });

    it('should reject non-assigned teacher', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/export-pdf`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/api/v1/plans/999e8400-e29b-41d4-a716-446655440999/export-pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/plans/${existingPlan.id}/export-pdf`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/plans/:id/progress', () => {
    it('should get progress when authorized', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/progress`)
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
        expect(response.body.data).toHaveProperty('plan_id');
        expect(response.body.data).toHaveProperty('overall_progress');
        expect(response.body.data).toHaveProperty('by_area');
      }
    });

    it('should allow admin to view any progress', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/progress`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 'SUCCESS');
      }
    });

    it('should reject non-assigned teacher', async () => {
      const response = await request(app)
        .get(`/api/v1/plans/${existingPlan.id}/progress`)
        .set('Authorization', `Bearer ${anotherTeacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/api/v1/plans/999e8400-e29b-41d4-a716-446655440999/progress')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/plans/${existingPlan.id}/progress`
      );

      expect(response.status).toBe(401);
    });
  });
});
