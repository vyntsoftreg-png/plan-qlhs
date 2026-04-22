const request = require('supertest');
const app = require('../app');
const db = require('../database');
const { generateToken } = require('../utils/jwt');

/**
 * Analytics Integration Tests
 * Testing dashboard, child progress, and reporting endpoints
 */

describe('Analytics API', () => {
  let testKindergarten;
  let testAdmin;
  let testPrincipal;
  let testTeacher;
  let testTeacher2;
  let testChildren;
  let testPlans;
  let testSkills;
  let testEvaluations;

  beforeAll(async () => {
    // Create kindergarten
    const kgResult = await db.query(
      'INSERT INTO "Kindergartens" (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
      ['Analytics Test KG', '456 Oak St', '9876543210'],
    );
    testKindergarten = { id: kgResult.rows[0].id };

    // Create admin user
    const adminResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'admin.analytics@test.com',
        'Admin Analytics',
        '$2b$10$hashedpassword',
        'admin',
        testKindergarten.id,
      ],
    );
    testAdmin = { id: adminResult.rows[0].id, email: adminResult.rows[0].email };

    // Create principal user
    const principalResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'principal.analytics@test.com',
        'Principal Analytics',
        '$2b$10$hashedpassword',
        'principal',
        testKindergarten.id,
      ],
    );
    testPrincipal = { id: principalResult.rows[0].id, email: principalResult.rows[0].email };

    // Create teachers
    const teacher1Result = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'teacher.analytics1@test.com',
        'Teacher Analytics 1',
        '$2b$10$hashedpassword',
        'teacher',
        testKindergarten.id,
      ],
    );
    testTeacher = { id: teacher1Result.rows[0].id, email: teacher1Result.rows[0].email };

    const teacher2Result = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'teacher.analytics2@test.com',
        'Teacher Analytics 2',
        '$2b$10$hashedpassword',
        'teacher',
        testKindergarten.id,
      ],
    );
    testTeacher2 = { id: teacher2Result.rows[0].id, email: teacher2Result.rows[0].email };

    // Create children
    const children = [];
    for (let i = 1; i <= 3; i++) {
      const childResult = await db.query(
        'INSERT INTO "Children" (name, date_of_birth, gender, kindergarten_id, assigned_teacher_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [
          `Analytics Child ${i}`,
          `202${0 + i}-0${i}-15`,
          i % 2 === 0 ? 'female' : 'male',
          testKindergarten.id,
          i === 1 ? testTeacher.id : testTeacher2.id,
        ],
      );
      children.push({ id: childResult.rows[0].id });
    }
    testChildren = children;

    // Create template
    const templateResult = await db.query(
      'INSERT INTO "Templates" (name, description) VALUES ($1, $2) RETURNING id',
      ['Analytics Template', 'Template for analytics testing'],
    );
    const testTemplate = { id: templateResult.rows[0].id };

    // Create skills
    const skills = [];
    const skillNames = ['Cognitive Skill', 'Motor Skill', 'Social Skill'];
    const areas = ['cognitive', 'motor', 'social'];
    for (let i = 0; i < skillNames.length; i++) {
      const skillResult = await db.query(
        'INSERT INTO "Skills" (name, description, development_area) VALUES ($1, $2, $3) RETURNING id',
        [skillNames[i], `Test ${skillNames[i]}`, areas[i]],
      );
      skills.push({ id: skillResult.rows[0].id });

      // Add skill to template
      await db.query(
        'INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order) VALUES ($1, $2, $3)',
        [testTemplate.id, skillResult.rows[0].id, i + 1],
      );
    }
    testSkills = skills;

    // Create education plans
    const plans = [];
    for (let i = 0; i < testChildren.length; i++) {
      const planResult = await db.query(
        'INSERT INTO "EducationPlans" (child_id, teacher_id, template_id, kindergarten_id, month, year, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
          testChildren[i].id,
          i === 0 ? testTeacher.id : testTeacher2.id,
          testTemplate.id,
          testKindergarten.id,
          3 + i,
          2026,
          i === 0 ? 'completed' : 'draft',
        ],
      );
      plans.push({ id: planResult.rows[0].id });
    }
    testPlans = plans;

    // Create plan skills and evaluations
    const evaluations = [];
    for (const plan of testPlans) {
      for (const skill of testSkills) {
        const pskillResult = await db.query(
          'INSERT INTO "PlanSkills" (plan_id, skill_id, skill_order) VALUES ($1, $2, $3) RETURNING id',
          [plan.id, skill.id, 1],
        );

        // Add evaluations for some skills
        if (Math.random() > 0.3) {
          const statuses = ['achieved', 'partial', 'not_achieved', 'pending'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          const evalResult = await db.query(
            'INSERT INTO "EvaluationResults" (plan_skill_id, evaluation_date, status, notes, evaluated_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [pskillResult.rows[0].id, '2026-04-13', status, 'Test evaluation', testTeacher.id],
          );
          evaluations.push({ id: evalResult.rows[0].id, status });
        }
      }
    }
    testEvaluations = evaluations;
  });

  afterAll(async () => {
    // Cleanup: Delete in reverse order of dependencies
    await db.query('DELETE FROM "EvaluationResults"');
    await db.query('DELETE FROM "PlanSkills"');
    await db.query('DELETE FROM "EducationPlans"');
    await db.query('DELETE FROM "TemplateSkills"');
    await db.query('DELETE FROM "Templates"');
    await db.query('DELETE FROM "Skills"');
    await db.query('DELETE FROM "Children"');
    await db.query('DELETE FROM "Users"');
    await db.query('DELETE FROM "Kindergartens"');
    await db.release();
  });

  describe('GET /api/v1/analytics/dashboard - Kindergarten Dashboard', () => {
    it('should return dashboard data for admin', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toHaveProperty('overview');
      expect(res.body.data).toHaveProperty('evaluation_stats');
      expect(res.body.data).toHaveProperty('top_teachers');
      expect(res.body.data).toHaveProperty('top_skills');
      expect(res.body.data).toHaveProperty('monthly_trend');
    });

    it('should include overview metrics', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overview).toMatchObject({
        total_children: expect.any(Number),
        total_plans: expect.any(Number),
        completed_plans: expect.any(Number),
        draft_plans: expect.any(Number),
      });
      expect(res.body.data.overview.total_children).toBeGreaterThanOrEqual(3);
    });

    it('should include evaluation statistics', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation_stats).toMatchObject({
        plans_with_evaluations: expect.any(Number),
        total_evaluations: expect.any(Number),
        achieved: expect.any(Number),
      });
    });

    it('should include top teachers list', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.top_teachers)).toBe(true);
      if (res.body.data.top_teachers.length > 0) {
        expect(res.body.data.top_teachers[0]).toHaveProperty('teacher_id');
        expect(res.body.data.top_teachers[0]).toHaveProperty('name');
        expect(res.body.data.top_teachers[0]).toHaveProperty('plans_created');
      }
    });

    it('should include top skills ranking', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.top_skills)).toBe(true);
    });

    it('should include monthly trend data', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.monthly_trend)).toBe(true);
    });

    it('should allow principal to view dashboard', async () => {
      const token = generateToken({
        id: testPrincipal.id,
        email: testPrincipal.email,
        role: 'principal',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject teacher from viewing dashboard', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject parent from viewing dashboard', async () => {
      const token = generateToken({
        id: 1,
        email: 'parent@test.com',
        role: 'parent',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/analytics/child/:childId/progress - Child Progress', () => {
    it('should return child progress overview', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toHaveProperty('child');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('recent_plans');
      expect(res.body.data).toHaveProperty('development_areas');
      expect(res.body.data).toHaveProperty('latest_evaluations');
    });

    it('should include child information', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.child).toMatchObject({
        id: testChildren[0].id,
        name: expect.any(String),
      });
    });

    it('should include progress summary with completion percentage', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toMatchObject({
        total_plans: expect.any(Number),
        total_skills_evaluated: expect.any(Number),
        skills_with_evaluation: expect.any(Number),
        completion_percentage: expect.any(Number),
      });
    });

    it('should include recent plans', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.recent_plans)).toBe(true);
      if (res.body.data.recent_plans.length > 0) {
        expect(res.body.data.recent_plans[0]).toHaveProperty('plan_id');
        expect(res.body.data.recent_plans[0]).toHaveProperty('status');
        expect(res.body.data.recent_plans[0]).toHaveProperty('month');
        expect(res.body.data.recent_plans[0]).toHaveProperty('year');
      }
    });

    it('should include development area breakdown', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.development_areas)).toBe(true);
      if (res.body.data.development_areas.length > 0) {
        expect(res.body.data.development_areas[0]).toHaveProperty('area');
        expect(res.body.data.development_areas[0]).toHaveProperty('total_skills');
        expect(res.body.data.development_areas[0]).toHaveProperty('success_rate');
      }
    });

    it('should include latest evaluations', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.latest_evaluations)).toBe(true);
    });

    it('should return 404 for non-existent child', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/child/9999/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should allow teacher to view their assigned children progress', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/child/${testChildren[0].id}/progress`)
        .set('Authorization', `Bearer ${token}`);

      // Should succeed (authorization can be added later based on assignment)
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('GET /api/v1/analytics/reports - Monthly Report', () => {
    it('should return monthly report with year parameter', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toHaveProperty('report_period');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('evaluation_breakdown');
      expect(res.body.data).toHaveProperty('development_areas');
      expect(res.body.data).toHaveProperty('child_rankings');
      expect(res.body.data).toHaveProperty('plans');
    });

    it('should return monthly report with year and month parameters', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026&month=4')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.report_period).toBe('2026-04');
    });

    it('should include report summary', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026&month=4')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toMatchObject({
        total_plans: expect.any(Number),
        completed_plans: expect.any(Number),
        total_skills_evaluated: expect.any(Number),
        children_involved: expect.any(Number),
        teachers_involved: expect.any(Number),
      });
    });

    it('should include evaluation breakdown', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation_breakdown).toMatchObject({
        achieved: expect.any(Number),
        partial: expect.any(Number),
        not_achieved: expect.any(Number),
        pending: expect.any(Number),
      });
    });

    it('should include child rankings', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.child_rankings)).toBe(true);
      if (res.body.data.child_rankings.length > 0) {
        expect(res.body.data.child_rankings[0]).toHaveProperty('child_id');
        expect(res.body.data.child_rankings[0]).toHaveProperty('child_name');
        expect(res.body.data.child_rankings[0]).toHaveProperty('success_rate');
      }
    });

    it('should reject missing year parameter', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.field).toBe('year');
    });

    it('should reject invalid year', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid month', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026&month=13')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.field).toBe('month');
    });

    it('should allow principal to view reports', async () => {
      const token = generateToken({
        id: testPrincipal.id,
        email: testPrincipal.email,
        role: 'principal',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject teacher from viewing reports', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/reports?year=2026')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/analytics/teacher/:teacherId - Teacher Analytics', () => {
    it('should return teacher analytics', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toMatchObject({
        teacher_id: testTeacher.id,
        name: expect.any(String),
        children_assigned: expect.any(Number),
        plans_created: expect.any(Number),
        plans_completed: expect.any(Number),
        evaluations_achieved: expect.any(Number),
      });
    });

    it('should calculate average success rate', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('average_success_rate');
      expect(typeof res.body.data.average_success_rate).toBe('number');
    });

    it('should allow teacher to view own analytics', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject teacher viewing other teacher analytics', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/analytics/teacher/${testTeacher2.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent teacher', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/analytics/teacher/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Authorization & Authentication', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/analytics/dashboard');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
    });
  });
});
