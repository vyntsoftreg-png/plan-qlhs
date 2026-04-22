# 🚀 QLHS Backend - Getting Started

**Backend API for QLHS (Kế Hoạch Giáo Dục Cá Nhân)**

---

## 📋 QUICK START

### 1️⃣ Prerequisites
```bash
# Check Node.js version (must be 18+)
node --version

# Check npm version (must be 8+)
npm --version

# Install PostgreSQL 12+
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql
# Windows: Download from postgresql.org
```

### 2️⃣ Clone & Setup
```bash
cd d:\Project\QLHS\backend

# Copy environment template
copy .env.template .env

# Edit .env with your database credentials
notepad .env  # or your preferred editor
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ Setup Database
```bash
# Create PostgreSQL database and user
createuser -P qlhs_user    # Create user with password
createdb -O qlhs_user qlhs_db

# Run migrations
npm run db:setup

# Verify setup
npm run db:seed  # Load sample data
```

### 5️⃣ Start Development Server
```bash
npm run dev

# You should see:
# ╔════════════════════════════════════════════╗
# ║  🚀 QLHS Backend Server Started            ║
# ║  Server: http://localhost:5000             ║
# ╚════════════════════════════════════════════╝
```

### 6️⃣ Test the API
```bash
# Terminal 1: Server is running (npm run dev)

# Terminal 2: Test health endpoint
curl http://localhost:5000/api/health

# You should get:
# {"status":"ok","timestamp":"2026-04-13T...","environment":"development","version":"1.0.0"}
```

---

## 📁 PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── server.js           # Express app setup
│   │   └── database.js         # PostgreSQL connection
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification
│   │   ├── authorize.js        # RBAC checking
│   │   ├── errorHandler.js     # Error handling
│   │   ├── validator.js        # Input validation
│   │   └── rateLimiter.js      # Rate limiting
│   ├── routes/                 # API routes (to be created)
│   ├── controllers/            # Route handlers (to be created)
│   ├── services/               # Business logic (to be created)
│   ├── utils/
│   │   ├── logger.js           # Logging
│   │   └── validators.js       # Validation schemas
│   └── index.js                # Server entry point
│
├── tests/                      # Test files (to be created)
├── migrations/                 # Database migrations
├── scripts/                    # Database setup scripts
├── .env.template              # Environment template
├── package.json               # Dependencies
└── BACKEND_SETUP.md           # Detailed setup guide
```

---

## 🛠️ NPM SCRIPTS

```bash
# Development
npm run dev              # Start with auto-reload (nodemon)
npm start               # Start production server

# Testing
npm run test            # Run all tests with coverage
npm run test:watch      # Run tests in watch mode
npm run test:integration # Run integration tests only

# Database
npm run db:setup        # Create tables and indexes
npm run db:migrate      # Run pending migrations
npm run db:seed         # Load sample data
npm run db:reset        # Drop and recreate database
npm run db:backup       # Backup database

# Code Quality
npm run lint            # Check for linting errors
npm run lint:fix        # Fix linting errors
npm run format          # Format code with prettier

# Docker
npm run docker:build    # Build Docker image
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123!"
  }'

# Response:
{
  "code": "LOGIN_SUCCESS",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "teacher@example.com",
      "name": "Võ Thị Thanh Thúy",
      "role": "teacher"
    }
  }
}
```

### 2. Use Access Token
```bash
curl -X GET http://localhost:5000/api/v1/children \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Token expires in 1 hour
# Get new token with refresh_token: POST /auth/refresh
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }'

# Get new access_token (doesn't require old one)
```

---

## 📚 API ENDPOINT CATEGORIES

See [../api/API_SPECIFICATION.md](../api/API_SPECIFICATION.md) for complete endpoint documentation.

**Implemented** (To be built):

### 1. Authentication (2 endpoints)
- `POST /auth/login` - Login with email & password
- `POST /auth/refresh` - Refresh access token

### 2. Users (5 endpoints)
- `GET /users` - List all users (admin only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user

### 3. Children (5 endpoints)
- `GET /children` - List children (teacher's assigned)
- `GET /children/:id` - Get child details
- `POST /children` - Create new child (admin/principal)
- `PUT /children/:id` - Update child
- `DELETE /children/:id` - Delete child

### 4. Plans (6 endpoints)
- `GET /plans` - List plans with filters
- `GET /plans/:id` - Get plan with all skills
- `POST /plans` - Create plan from template
- `PUT /plans/:id` - Update plan
- `DELETE /plans/:id` - Delete plan
- `GET /plans/:id/export-pdf` - Generate PDF

### 5. Evaluations (3 endpoints)
- `POST /plans/:id/evaluate` - Record skill evaluation
- `PUT /plans/:id/evaluate/:skillId` - Update evaluation
- `GET /plans/:id/progress` - Get plan progress summary

### 6. Analytics (3 endpoints)
- `GET /analytics/dashboard` - Overview stats
- `GET /analytics/child/:id/progress` - Child progress
- `GET /analytics/reports` - Generate reports

---

## 🧪 TESTING

### Run Tests
```bash
# All tests with coverage report
npm run test

# Watch mode (re-run on file change)
npm run test:watch

# Integration tests only
npm run test:integration

# Specific test file
npm run test -- tests/integration/auth.test.js
```

### Test Coverage Target
```
Statement   : 80%+
Branch      : 75%+
Function    : 80%+
Lines       : 80%+
```

---

## 🐛 TROUBLESHOOTING

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql --version

# Check credentials in .env
cat .env | grep ^DB_

# Test connection manually
psql -h localhost -U qlhs_user -d qlhs_db

# Reset database
npm run db:reset
npm run db:setup
```

### "Port 5000 already in use"
```bash
# Linux/macOS: Find process using port
lsof -i :5000

# Windows: Find process using port
netstat -ano | findstr :5000

# Kill the process or use different port
PORT=5001 npm run dev
```

### "JWT_ACCESS_SECRET not defined"
```bash
# Copy .env.template to .env
cp .env.template .env

# Edit .env and set JWT secrets
# Generate random secrets:
openssl rand -base64 32
```

### "Tests failing with database errors"
```bash
# Reset test database
npm run db:reset
npm run db:setup

# Run tests again
npm run test
```

---

## 📊 PERFORMANCE

### API Response Time Targets
- Authentication: < 100ms
- Database queries: < 100ms
- Full request: < 200ms

### Monitor Performance
```bash
# Add this to your client requests:
curl -w "\nTime: %{time_total}s\n" http://localhost:5000/api/health

# For detailed profiling, use:
# Node.js built-in: node --prof src/index.js
# Or install: npm install clinic --save-dev
```

---

## 🚀 DEPLOYMENT

### Docker Setup
```bash
# Build image
npm run docker:build

# Start containers
npm run docker:up

# Stop containers
npm run docker:down

# View logs
npm run docker:logs
```

### Deploy to Production (Railway/Render)

1. **Prepare environment**
   ```bash
   git add .
   git commit -m "Backend setup"
   git push
   ```

2. **Connect to Railway/Render**
   - Link GitHub repository
   - Set environment variables from .env
   - Deploy

3. **Run migrations**
   ```bash
   npm run db:setup
   npm run db:seed
   ```

4. **Test production API**
   ```bash
   curl https://your-api.railway.app/api/health
   ```

---

## 📖 ADDITIONAL RESOURCES

- **API Specification**: [../api/API_SPECIFICATION.md](../api/API_SPECIFICATION.md)
- **Database Documentation**: [../database/DATABASE_DOCUMENTATION.md](../database/DATABASE_DOCUMENTATION.md)
- **Detailed Setup**: [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **UI/UX Design**: [../design/WIREFRAMES.md](../design/WIREFRAMES.md)

---

## 👥 TEAM

**QLHS Development Team**

For questions or issues, refer to the detailed documentation or check the troubleshooting section above.

---

**Next Steps**:
1. ✅ Copy .env.template → .env
2. ✅ Configure database credentials
3. ✅ Run `npm install` and `npm run db:setup`
4. ✅ Start with `npm run dev`
5. Start implementing routes from API_SPECIFICATION.md

**Estimated Duration**: 2-3 weeks for all 40+ endpoints

---

Created April 2026
