const request = require('supertest');
const app = require('../app');
const db = require('../database');
const { generateToken } = require('../utils/jwt');

/**
 * Phase 7 Integration Tests
 * Testing Skills, Templates, and Kindergarten endpoints
 */

describe('Phase 7: Skills, Templates, and Kindergarten API', () => {
  let testKindergarten;
  let testAdmin;
  let testPrincipal;
  let testTeacher;
  let testDevelopmentAreas;
  let testSkills;
  let testTemplates;

  beforeAll(async () => {
    // Create kindergarten
    const kgResult = await db.query(
      'INSERT INTO "Kindergartens" (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
      ['Phase 7 Test KG', '789 Test Ave', '5555555555'],
    );
    testKindergarten = { id: kgResult.rows[0].id };

    // Create admin
    const adminResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'admin.p7@test.com',
        'Admin Phase 7',
        '$2b$10$hashedpassword',
        'admin',
        testKindergarten.id,
      ],
    );
    testAdmin = { id: adminResult.rows[0].id, email: adminResult.rows[0].email };

    // Create principal
    const principalResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'principal.p7@test.com',
        'Principal Phase 7',
        '$2b$10$hashedpassword',
        'principal',
        testKindergarten.id,
      ],
    );
    testPrincipal = {
      id: principalResult.rows[0].id,
      email: principalResult.rows[0].email,
    };

    // Create teacher
    const teacherResult = await db.query(
      'INSERT INTO "Users" (email, name, password_hash, role, kindergarten_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [
        'teacher.p7@test.com',
        'Teacher Phase 7',
        '$2b$10$hashedpassword',
        'teacher',
        testKindergarten.id,
      ],
    );
    testTeacher = {
      id: teacherResult.rows[0].id,
      email: teacherResult.rows[0].email,
    };

    // Get development areas (assuming they exist)
    const areasResult = await db.query(
      'SELECT id FROM "DevelopmentAreas" LIMIT 3',
    );
    testDevelopmentAreas = areasResult.rows;

    // Create skills if areas exist
    testSkills = [];
    if (testDevelopmentAreas.length > 0) {
      for (let i = 0; i < 2; i++) {
        const skillResult = await db.query(
          'INSERT INTO "Skills" (development_area_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
          [
            testDevelopmentAreas[i].id,
            `Test Skill ${i + 1}`,
            `Description for skill ${i + 1}`,
            testAdmin.id,
          ],
        );
        testSkills.push({ id: skillResult.rows[0].id });
      }
    }

    // Create template
    testTemplates = [];
    if (testSkills.length > 0) {
      const templateResult = await db.query(
        'INSERT INTO "Templates" (kindergarten_id, name, description, age_group, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [
          testKindergarten.id,
          'Test Template',
          'Test template description',
          '4-5 tuổi',
          testAdmin.id,
        ],
      );
      testTemplates.push({ id: templateResult.rows[0].id });

      // Add skills to template
      for (let i = 0; i < testSkills.length; i++) {
        await db.query(
          'INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order) VALUES ($1, $2, $3)',
          [templateResult.rows[0].id, testSkills[i].id, i + 1],
        );
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM "TemplateSkills"');
    await db.query('DELETE FROM "Templates"');
    await db.query('DELETE FROM "Skills"');
    await db.query('DELETE FROM "Users"');
    await db.query('DELETE FROM "Kindergartens"');
    await db.release();
  });

  describe('Skills API', () => {
    it('should list development areas', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/development-areas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list all skills', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter skills by development area', async () => {
      if (testDevelopmentAreas.length === 0) return;

      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(
          `/api/v1/skills?development_area_id=${testDevelopmentAreas[0].id}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should get skill by ID', async () => {
      if (testSkills.length === 0) return;

      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/skills/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.id).toBe(testSkills[0].id);
    });

    it('should create skill - admin only', async () => {
      if (testDevelopmentAreas.length === 0) return;

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          development_area_id: testDevelopmentAreas[0].id,
          name: 'New Skill',
          description: 'New skill description',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.name).toBe('New Skill');
    });

    it('should reject skill creation from teacher', async () => {
      if (testDevelopmentAreas.length === 0) return;

      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({
          development_area_id: testDevelopmentAreas[0].id,
          name: 'Unauthorized Skill',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should update skill', async () => {
      if (testSkills.length === 0) return;

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/skills/${testSkills[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should delete skill', async () => {
      // Create a skill to delete
      if (testDevelopmentAreas.length === 0) return;

      const skillResult = await db.query(
        'INSERT INTO "Skills" (development_area_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          testDevelopmentAreas[0].id,
          'Skill to Delete',
          'This will be deleted',
          testAdmin.id,
        ],
      );

      const skillIdToDelete = skillResult.rows[0].id;

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .delete(`/api/v1/skills/${skillIdToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });
  });

  describe('Templates API', () => {
    it('should list templates', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/templates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should get template by ID with skills', async () => {
      if (testTemplates.length === 0) return;

      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get(`/api/v1/templates/${testTemplates[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.id).toBe(testTemplates[0].id);
      expect(Array.isArray(res.body.data.skills)).toBe(true);
    });

    it('should create template - principal only', async () => {
      if (testSkills.length === 0) return;

      const token = generateToken({
        id: testPrincipal.id,
        email: testPrincipal.email,
        role: 'principal',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Template',
          description: 'New template description',
          age_group: '3-4 tuổi',
          skill_ids: [testSkills[0].id],
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.name).toBe('New Template');
    });

    it('should reject template creation from teacher', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Template',
          age_group: '4-5 tuổi',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should update template', async () => {
      if (testTemplates.length === 0) return;

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put(`/api/v1/templates/${testTemplates[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated template description',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should delete template', async () => {
      if (testSkills.length === 0) return;

      // Create a template to delete
      const templateResult = await db.query(
        'INSERT INTO "Templates" (kindergarten_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          testKindergarten.id,
          'Template to Delete',
          'This will be deleted',
          testAdmin.id,
        ],
      );

      const templateIdToDelete = templateResult.rows[0].id;

      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .delete(`/api/v1/templates/${templateIdToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });
  });

  describe('Kindergarten API', () => {
    it('should get kindergarten profile', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/kindergarten/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.id).toBe(testKindergarten.id);
      expect(res.body.data.stats).toBeDefined();
    });

    it('should update kindergarten profile - admin only', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put('/api/v1/kindergarten/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
    });

    it('should reject profile update from teacher', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .put('/api/v1/kindergarten/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '0987654321',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should get kindergarten users', async () => {
      const token = generateToken({
        id: testPrincipal.id,
        email: testPrincipal.email,
        role: 'principal',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/kindergarten/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const token = generateToken({
        id: testAdmin.id,
        email: testAdmin.email,
        role: 'admin',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/kindergarten/users?role=teacher')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      res.body.data.forEach((user) => {
        expect(user.role).toBe('teacher');
      });
    });

    it('should get kindergarten settings', async () => {
      const token = generateToken({
        id: testPrincipal.id,
        email: testPrincipal.email,
        role: 'principal',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/kindergarten/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('SUCCESS');
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.class_distribution).toBeDefined();
      expect(res.body.data.active_plans_this_month).toBeDefined();
    });

    it('should reject settings access from teacher', async () => {
      const token = generateToken({
        id: testTeacher.id,
        email: testTeacher.email,
        role: 'teacher',
        kindergarten_id: testKindergarten.id,
      });

      const res = await request(app)
        .get('/api/v1/kindergarten/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Authorization & Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/v1/skills');

      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/templates')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
    });
  });
});
