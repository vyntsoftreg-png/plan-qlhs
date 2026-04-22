# 🚀 BACKEND SETUP & DEVELOPMENT GUIDE

**Project**: QLHS - Kế Hoạch Giáo Dục Cá Nhân  
**Phase**: 5 - Backend Implementation  
**Tech Stack**: Node.js + Express + PostgreSQL  
**Version**: 1.0

---

## 📋 QUICK START (5 minutes)

```bash
# 1. Prerequisites
Node.js 18+ LTS
PostgreSQL 12+
npm 8+

# 2. Clone database setup
cd d:\Project\QLHS\backend
cp .env.template .env

# 3. Configure database connection
# Edit .env file with your PostgreSQL credentials

# 4. Install dependencies
npm install

# 5. Create database & run migrations
npm run db:setup

# 6. Start development server
npm run dev

# 7. Test API is running
curl http://localhost:5000/api/health
```

---

## 📁 PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection pool
│   │   ├── environment.js       # Env variables validation
│   │   └── server.js            # Express app configuration
│   │
│   ├── middleware/
│   │   ├── authenticate.js      # JWT token verification
│   │   ├── authorize.js         # RBAC permission checking
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── validator.js         # Request validation
│   │   └── rateLimiter.js       # Rate limiting (100 req/min)
│   │
│   ├── routes/
│   │   ├── auth.js              # POST /auth/login, /auth/refresh
│   │   ├── users.js             # User management endpoints
│   │   ├── kindergartens.js      # Kindergarten CRUD
│   │   ├── children.js          # Children management
│   │   ├── areas.js             # Development areas
│   │   ├── skills.js            # Skills CRUD + images
│   │   ├── templates.js         # Template management
│   │   ├── plans.js             # Education plans
│   │   ├── evaluations.js       # Evaluation results
│   │   └── analytics.js         # Progress & reports
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── childrenController.js
│   │   ├── plansController.js
│   │   ├── evaluationsController.js
│   │   └── analyticsController.js
│   │
│   ├── services/
│   │   ├── authService.js       # JWT, password hashing
│   │   ├── planService.js       # Plan creation logic
│   │   ├── evaluationService.js # Evaluation processing
│   │   ├── pdfService.js        # PDF generation
│   │   ├── imageService.js      # Cloudinary integration
│   │   └── emailService.js      # Email notifications
│   │
│   ├── models/
│   │   └── database.js          # Database query utilities
│   │
│   ├── utils/
│   │   ├── validators.js        # Input validation schemas
│   │   ├── helpers.js           # Common utilities
│   │   ├── logger.js            # Logging configuration
│   │   └── constants.js         # App-wide constants
│   │
│   └── index.js                 # Server entry point
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── plans.test.js
│   │   └── evaluations.test.js
│   └── fixtures/                # Test data
│
├── migrations/
│   ├── 001_create_tables.sql
│   ├── 002_add_indexes.sql
│   └── 003_sample_data.sql
│
├── .env.template               # Environment template
├── .env                        # (Git ignored) Real credentials
├── .env.test                   # Test environment
├── .env.production             # Production environment
│
├── .gitignore
├── package.json
├── package-lock.json
├── jest.config.js              # Jest testing configuration
├── docker-compose.yml          # Docker (optional)
├── Dockerfile
├── BACKEND_SETUP.md            # This file
└── README.md                   # Developer guide

```

---

## ⚙️ ENVIRONMENT VARIABLES

### .env.template
```bash
# Server
NODE_ENV=development
PORT=5000
HOSTNAME=localhost

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qlhs_db
DB_USER=qlhs_user
DB_PASSWORD=your_secure_password_here
DB_POOL_MIN=5
DB_POOL_MAX=10

# JWT Authentication
JWT_ACCESS_SECRET=your_access_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail/SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=QLHS <noreply@qlhs.vn>

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW=60000          # 1 minute in ms
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5000,https://qlhs.dev.vn

# API Documentation
SWAGGER_ENABLED=true
API_VERSION=v1
```

---

## 📦 PACKAGE.JSON

```json
{
  "name": "qlhs-backend",
  "version": "1.0.0",
  "description": "QLHS - Kế Hoạch Giáo Dục Cá Nhân Backend API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=integration",
    "db:setup": "node scripts/setupDatabase.js",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "psql -U $DB_USER -d $DB_NAME -f migrations/003_sample_data.sql",
    "db:reset": "node scripts/resetDatabase.js",
    "db:backup": "node scripts/backup.js",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "docker:build": "docker build -t qlhs-backend .",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.10.0",
    "pg-pool": "^3.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "cloudinary": "^1.36.0",
    "nodemailer": "^6.9.7",
    "express-rate-limit": "^7.1.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "faker": "^5.5.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

---

## 🗄️ DATABASE CONNECTION

### config/database.js

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

module.exports = pool;
```

---

## 🔐 AUTHENTICATION

### middleware/authenticate.js

```javascript
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 'MISSING_TOKEN',
      message: 'Authorization token required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please refresh.',
      });
    }
    res.status(403).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authenticate;
```

### middleware/authorize.js

```javascript
const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'NOT_AUTHENTICATED',
        message: 'User not authenticated',
      });
    }

    if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `This action requires one of these roles: ${requiredRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = authorize;
```

---

## 🚦 API ROUTE EXAMPLE

### routes/auth.js

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validator');
const { loginSchema } = require('../utils/validators');

/**
 * POST /api/v1/auth/login
 * Login with email and password
 * @returns {access_token, refresh_token, user}
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 * @returns {access_token, refresh_token}
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/v1/auth/logout
 * Logout (optional: add to blacklist)
 */
router.post('/logout', authController.logout);

module.exports = router;
```

### controllers/authController.js

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
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
      'INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'login', req.ip]
    );

    res.json({
      code: 'LOGIN_SUCCESS',
      message: 'Login successful',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const tokens = authService.generateTokens(decoded);

    res.json({
      code: 'TOKEN_REFRESHED',
      message: 'Token refreshed successfully',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 📨 SKILL EXAMPLE: Create Education Plan

### services/planService.js

```javascript
const pool = require('../config/database');

/**
 * Create a new education plan
 * @param {Object} planData - Child ID, Month, Year, Template ID
 * @param {string} userId - Creating user ID
 * @returns {Object} Created plan with skills
 */
exports.createPlan = async (planData, userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create plan
    const planResult = await client.query(
      `INSERT INTO education_plans 
       (child_id, month, year, teacher_id, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING *`,
      [
        planData.child_id,
        planData.month,
        planData.year,
        userId,
        userId,
      ]
    );

    const plan = planResult.rows[0];

    // 2. Copy skills from template
    const templateSkillsResult = await client.query(
      `SELECT ts.skill_id FROM template_skills ts
       WHERE ts.template_id = $1 AND ts.deleted_at IS NULL`,
      [planData.template_id]
    );

    // 3. Insert skills into plan
    for (const row of templateSkillsResult.rows) {
      await client.query(
        `INSERT INTO plan_skills (plan_id, skill_id)
         VALUES ($1, $2)`,
        [plan.id, row.skill_id]
      );
    }

    // 4. Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, resource_id, resource_type)
       VALUES ($1, 'create_plan', $2, 'plan')`,
      [userId, plan.id]
    );

    await client.query('COMMIT');

    // Fetch full plan with skills
    return await this.getPlanById(plan.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get plan with all details
 */
exports.getPlanById = async (planId) => {
  const result = await pool.query(
    `SELECT ep.*, 
            json_agg(json_build_object(
              'skill_id', ps.skill_id,
              'skill_name', s.name,
              'area_id', s.area_id,
              'instruction_text', s.instruction_text,
              'image_url', s.image_url
            )) as skills
     FROM education_plans ep
     LEFT JOIN plan_skills ps ON ep.id = ps.plan_id
     LEFT JOIN skills s ON ps.skill_id = s.id
     WHERE ep.id = $1 AND ep.deleted_at IS NULL
     GROUP BY ep.id`,
    [planId]
  );

  return result.rows[0];
};
```

---

## ✅ DATABASE MIGRATION SCRIPT

### scripts/setupDatabase.js

```javascript
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔧 Setting up database...');

    // 1. Create tables (from database/01_schema.sql)
    const schema = fs.readFileSync(
      path.join(__dirname, '../migrations/001_create_tables.sql'),
      'utf8'
    );
    await client.query(schema);
    console.log('✅ Tables created');

    // 2. Create indexes
    const indexes = fs.readFileSync(
      path.join(__dirname, '../migrations/002_add_indexes.sql'),
      'utf8'
    );
    await client.query(indexes);
    console.log('✅ Indexes created');

    // 3. Insert sample data (optional)
    const sampleData = fs.readFileSync(
      path.join(__dirname, '../migrations/003_sample_data.sql'),
      'utf8'
    );
    await client.query(sampleData);
    console.log('✅ Sample data inserted');

    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

setupDatabase();
```

---

## 🧪 TESTING EXAMPLE

### tests/integration/auth.test.js

```javascript
const request = require('supertest');
const app = require('../../src/config/server');
const pool = require('../../src/config/database');

describe('Authentication', () => {
  beforeAll(async () => {
    // Setup test database
    await resetTestDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.role).toBe('teacher');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should validate input format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Login first to get refresh token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'SecurePassword123!',
        });

      const { refresh_token } = loginRes.body.data;

      // Now refresh
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.access_token).not.toBe(
        loginRes.body.data.access_token
      );
    });
  });
});
```

---

## 🐳 DOCKER SETUP (Optional)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: qlhs_db
      POSTGRES_USER: qlhs_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: qlhs_db
      DB_USER: qlhs_user
      DB_PASSWORD: secure_password
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## 📋 ENDPOINT IMPLEMENTATION CHECKLIST

### Authentication (2 endpoints)
- [ ] POST /auth/login
- [ ] POST /auth/refresh

### Users (5 endpoints)
- [ ] GET /users (list all)
- [ ] GET /users/:id (get one)
- [ ] POST /users (create)
- [ ] PUT /users/:id (update)
- [ ] DELETE /users/:id (soft delete)

### Children (5 endpoints)
- [ ] GET /children (list assigned)
- [ ] GET /children/:id (get details)
- [ ] POST /children (create new)
- [ ] PUT /children/:id (update)
- [ ] DELETE /children/:id (soft delete)

### Education Plans (6 endpoints)
- [ ] GET /plans (list by filters)
- [ ] GET /plans/:id (get full plan)
- [ ] POST /plans (create from template)
- [ ] PUT /plans/:id (update)
- [ ] DELETE /plans/:id (soft delete)
- [ ] GET /plans/:id/export-pdf (generate PDF)

### Evaluations (3 endpoints)
- [ ] POST /plans/:id/evaluate (record skill result)
- [ ] PUT /plans/:id/evaluate/:skill_id (update)
- [ ] GET /plans/:id/progress (get achievement summary)

### Templates (4 endpoints)
- [ ] GET /templates (list available)
- [ ] GET /templates/:id (get template details)
- [ ] POST /templates (admin only)
- [ ] PUT /templates/:id (admin only)

### Skills (4 endpoints)
- [ ] GET /skills (list all)
- [ ] GET /skills/:id (get with images)
- [ ] POST /skills (admin only)
- [ ] PUT /skills/:id (admin only)

### Analytics (3 endpoints)
- [ ] GET /analytics/dashboard (overview stats)
- [ ] GET /analytics/child/:id/progress (child progress)
- [ ] GET /analytics/reports (export ready data)

---

## 🔍 TESTING STRATEGY

### Unit Tests (Services & Utils)
- Target: 80% coverage
- Focus: Business logic, validations
- Tool: Jest
- Location: `tests/unit/`

### Integration Tests (API Endpoints)
- Target: All 40+ endpoints
- Focus: End-to-end flows
- Tool: Jest + Supertest
- Location: `tests/integration/`

### Test Command
```bash
# Run all tests with coverage
npm run test

# Run specific test file
npm run test -- tests/integration/auth.test.js

# Watch mode for development
npm run test:watch

# Only integration tests
npm run test:integration
```

---

## 📊 PERFORMANCE TARGETS

```
Metric               Target      Current  Status
─────────────────────────────────────────────────
API Response         < 200ms     —        🎯
Database Query       < 100ms     —        🎯
Page Load            < 2s        —        🎯
Concurrent Users     1000+       —        🎯
Error Rate           < 0.1%      —        🎯
CPU Usage            < 60%       —        🎯
Memory Usage         < 512MB     —        🎯
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
Local Development:
□ npm install dependencies
□ Configure .env file
□ npm run db:setup (create tables)
□ npm run dev (start server)
□ npm run test (all tests pass)
□ npm run lint (no linting errors)

Staging Deployment:
□ All tests passing
□ Code reviewed
□ Security scan passed
□ Environment variables set
□ Database backup created
□ Deploy to staging environment
□ Smoke tests passed

Production Deployment:
□ Tag release version
□ Deploy to production
□ Health checks passing
□ Monitor error rates
□ Monitor response times
□ Monitor resource usage
```

---

## 📚 ADDITIONAL RESOURCES

- **API Spec**: See `../api/API_SPECIFICATION.md`
- **Database**: See `../database/DATABASE_DOCUMENTATION.md`
- **UI/UX**: See `../design/WIREFRAMES.md`
- **Environment**: See `.env.template`

---

**Next Steps**:
1. Create directory structure (run init script)
2. Install dependencies (`npm install`)
3. Configure PostgreSQL connection
4. Run database setup (`npm run db:setup`)
5. Start development server (`npm run dev`)
6. Begin implementing routes and controllers

**Estimated Duration**: 2-3 weeks for all 40+ endpoints

---

Created April 2026
