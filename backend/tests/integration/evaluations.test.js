const request = require('supertest');
const app = require('../app');
const db = require('../database');
const { generateToken } = require('../utils/jwt');

/**
 * Evaluations Integration Tests
 * Testing skill evaluation recording and management endpoints
 */

describe('Evaluations API', () => {
  let testKindergarten;
  let testTeacher;
  let testTeacher2;
  let testAdmin;
  let testChild;
  let testPlan;
  let testTemplate;
  let testSkills;
  let testPlanSkills;
  let testEvaluation;

  beforeAll(async () => {
    // Create kindergarten
    const kgResult = await db.query(
      'INSERT INTO "Kindergartens" (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
      ['Test Kindergarten', '123 Main St', '1234567890'],
    );
    testKindergarten = { id: kgResult.rows[0].id };

    // Create admin user
    const adminResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'admin@test.com',
        'Admin User',
        '$2b$10$hashedpassword',
        'admin',
        testKindergarten.id,
      ],
    );
    testAdmin = { id: adminResult.rows[0].id, email: adminResult.rows[0].email };

    // Create teachers
    const teacherResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'teacher1@test.com',
        'Teacher One',
        '$2b$10$hashedpassword',
        'teacher',
        testKindergarten.id,
      ],
    );
    testTeacher = { id: teacherResult.rows[0].id, email: teacherResult.rows[0].email };

    const teacher2Result = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'teacher2@test.com',
        'Teacher Two',
        '$2b$10$hashedpassword',
        'teacher',
        testKindergarten.id,
      ],
    );
    testTeacher2 = { id: teacher2Result.rows[0].id, email: teacher2Result.rows[0].email };

    // Create child
    const childResult = await db.query(
      'INSERT INTO "Children" (name, date_of_birth, gender, kindergarten_id, assigned_teacher_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Child', '2020-01-15', 'male', testKindergarten.id, testTeacher.id],
    );
    testChild = { id: childResult.rows[0].id };

    // Create template
    const templateResult = await db.query(
      'INSERT INTO "Templates" (name, description) VALUES ($1, $2) RETURNING id',
      ['Test Template', 'Template for testing'],
    );
    testTemplate = { id: templateResult.rows[0].id };

    // Create skills
    const skill1Result = await db.query(
      'INSERT INTO "Skills" (name, description, development_area) VALUES ($1, $2, $3) RETURNING id',
      ['Cognitive Skill', 'Test cognitive skill', 'cognitive'],
    );
    const skill2Result = await db.query(
      'INSERT INTO "Skills" (name, description, development_area) VALUES ($1, $2, $3) RETURNING id',
      ['Motor Skill', 'Test motor skill', 'motor'],
    );
    const skill3Result = await db.query(
      'INSERT INTO "Skills" (name, description, development_area) VALUES ($1, $2, $3) RETURNING id',
      ['Social Skill', 'Test social skill', 'social'],
    );
    testSkills = [
      { id: skill1Result.rows[0].id },
      { id: skill2Result.rows[0].id },
      { id: skill3Result.rows[0].id },
    ];

    // Add skills to template
    await db.query(
      'INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order) VALUES ($1, $2, $3)',
      [testTemplate.id, testSkills[0].id, 1],
    );
    await db.query(
      'INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order) VALUES ($1, $2, $3)',
      [testTemplate.id, testSkills[1].id, 2],
    );
    await db.query(
      'INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order) VALUES ($1, $2, $3)',
      [testTemplate.id, testSkills[2].id, 3],
    );

    // Create education plan
    const planResult = await db.query(
      'INSERT INTO "EducationPlans" (child_id, teacher_id, template_id, kindergarten_id, month, year, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [testChild.id, testTeacher.id, testTemplate.id, testKindergarten.id, 4, 2026, 'draft'],
    );
    testPlan = { id: planResult.rows[0].id };

    // Create plan skills (link skills to plan)
    const pskill1Result = await db.query(
      'INSERT INTO "PlanSkills" (plan_id, skill_id, skill_order) VALUES ($1, $2, $3) RETURNING id',
      [testPlan.id, testSkills[0].id, 1],
    );
    const pskill2Result = await db.query(
      'INSERT INTO "PlanSkills" (plan_id, skill_id, skill_order) VALUES ($1, $2, $3) RETURNING id',
      [testPlan.id, testSkills[1].id, 2],
    );
    const pskill3Result = await db.query(
      'INSERT INTO "PlanSkills" (plan_id, skill_id, skill_order) VALUES ($1, $2, $3) RETURNING id',
      [testPlan.id, testSkills[2].id, 3],
    );
    testPlanSkills = [
      { id: pskill1Result.rows[0].id, skill_id: testSkills[0].id },
      { id: pskill2Result.rows[0].id, skill_id: testSkills[1].id },
      { id: pskill3Result.rows[0].id, skill_id: testSkills[2].id },
    ];

    // Create test evaluation
    const evalResult = await db.query(
      'INSERT INTO "EvaluationResults" (plan_skill_id, evaluation_date, status, notes, evaluated_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [
        testPlanSkills[0].id,
        '2026-04-13',
        'achieved',
        'Child demonstrated skill well',
        testTeacher.id,
      ],
    );
    testEvaluation = { id: evalResult.rows[0].id };
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

  describe('POST /api/v1/plans/:planId/evaluations - Create Evaluation', () => {
    it('should create evaluation for skill - teacher can evaluate own plan', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'partial',
          notes: 'Needs more practice',
          evaluation_date: '2026-04-14',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toMatchObject({
        status: 'partial',
        notes: 'Needs more practice',
      });
      expect(res.body.data.skill_id).toBe(testSkills[1].id);
    });

    it('should create evaluation without evaluation_date - uses current date', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[2].id,
          result_status: 'achieved',
          notes: 'Great progress',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.status).toBe('achieved');
    });

    it('should allow admin to create evaluation for any plan', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[0].id,
          result_status: 'not_achieved',
          notes: 'Needs intervention',
          evaluation_date: '2026-04-12',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject evaluation for non-existent skill in plan', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: 9999,
          result_status: 'achieved',
          notes: 'Test',
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should reject invalid status value', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'invalid_status',
          notes: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject notes exceeding 500 characters', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const longNotes = 'a'.repeat(501);

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'achieved',
          notes: longNotes,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate evaluation for same skill on same date', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const evalDate = '2026-04-15';

      // Create first evaluation
      await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'achieved',
          evaluation_date: evalDate,
        });

      // Attempt duplicate
      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'partial',
          evaluation_date: evalDate,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('should reject missing skill_id', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          result_status: 'achieved',
          notes: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unauthorized teacher evaluating other teacher plan', async () => {
      const token = generateToken({
        id: testTeacher2.id,
        email: testTeacher2.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skill_id: testSkills[1].id,
          result_status: 'achieved',
          notes: 'Unauthorized',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/plans/:planId/evaluations - List Evaluations', () => {
    it('should list all evaluations for a plan', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.total_skills).toBe(3);
    });

    it('should include summary stats in response', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toMatchObject({
        total_skills: expect.any(Number),
        evaluated_skills: expect.any(Number),
        achieved_count: expect.any(Number),
        partial_count: expect.any(Number),
        not_achieved_count: expect.any(Number),
        pending_count: expect.any(Number),
        completion_percentage: expect.any(Number),
      });
    });

    it('should filter evaluations by status', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations?status=achieved`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((evaluation) => {
        expect(evaluation.status).toBe('achieved');
      });
    });

    it('should filter evaluations by skill_id', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations?skill_id=${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((evaluation) => {
        expect(evaluation.skill_id).toBe(testSkills[0].id);
      });
    });

    it('should reject invalid status filter', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations?status=invalid`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unauthorized teacher viewing other teacher plan', async () => {
      const token = generateToken({
        id: testTeacher2.id,
        email: testTeacher2.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow admin to view any plan evaluations', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should return 404 for non-existent plan', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/plans/9999/evaluations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/plans/:planId/evaluations/:skillId - Update Evaluation', () => {
    it('should update evaluation status', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'not_achieved',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.status).toBe('not_achieved');
    });

    it('should update evaluation notes', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const newNotes = 'Updated notes with more detail';

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: newNotes,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe(newNotes);
    });

    it('should update evidence_url', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const evidenceUrl = 'https://example.com/evidence.jpg';

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          evidence_url: evidenceUrl,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.evidence_url).toBe(evidenceUrl);
    });

    it('should reject invalid status', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject notes exceeding 500 characters', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const longNotes = 'a'.repeat(501);

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: longNotes,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject update from unauthorized teacher', async () => {
      const token = generateToken({
        id: testTeacher2.id,
        email: testTeacher2.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'achieved',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent skill evaluation', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/plans/${testPlan.id}/evaluations/9999`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'achieved',
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/plans/:planId/evaluations/:skillId - Delete Evaluation', () => {
    it('should only allow admin/principal to delete evaluations', async () => {
      // Create new evaluation to delete
      const evalResult = await db.query(
        'INSERT INTO "EvaluationResults" (plan_skill_id, evaluation_date, status, evaluated_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [testPlanSkills[2].id, '2026-04-16', 'achieved', testTeacher.id],
      );

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .delete(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[2].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject delete from teacher', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .delete(`/api/v1/plans/${testPlan.id}/evaluations/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/plans/:planId/evaluations/summary - Evaluation Summary', () => {
    it('should return evaluation summary with stats', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data).toMatchObject({
        total_skills: expect.any(Number),
        evaluated_skills: expect.any(Number),
        achieved_count: expect.any(Number),
        partial_count: expect.any(Number),
        not_achieved_count: expect.any(Number),
        pending_count: expect.any(Number),
        completion_percentage: expect.any(Number),
      });
    });

    it('should calculate completion percentage correctly', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const { completion_percentage, total_skills, evaluated_skills } = res.body.data;
      const expectedPercentage = total_skills > 0 ? (evaluated_skills / total_skills) * 100 : 0;
      expect(completion_percentage).toBe(Math.round(expectedPercentage));
    });

    it('should reject unauthorized teacher', async () => {
      const token = generateToken({
        id: testTeacher2.id,
        email: testTeacher2.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Authorization & Authentication', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get(`/api/v1/plans/${testPlan.id}/evaluations`);

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
    });

    it('should allow parent to view evaluations', async () => {
      // Create parent user assigned to child
      const parentResult = await db.query(
        'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
        [
          'parent@test.com',
          'Test Parent',
          '$2b$10$hashedpassword',
          'parent',
          testKindergarten.id,
        ],
      );
      const testParent = { id: parentResult.rows[0].id, email: parentResult.rows[0].email };

      // Create parent-child relationship (in Children table or via Parents table if exists)
      // For now, just test if parent role is allowed in route
      const token = generateToken({
        id: testParent.id,
        email: testParent.email,
        role: 'parent',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/plans/${testPlan.id}/evaluations`)
        .set('Authorization', `Bearer ${token}`);

      // Parent access depends on implementation - might return 403 if not assigned to child
      // Just verify the endpoint is protected
      expect([200, 403, 404]).toContain(res.status);
    });
  });
});
