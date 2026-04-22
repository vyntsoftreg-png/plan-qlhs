# 📋 BACKEND IMPLEMENTATION ROADMAP

**Project**: QLHS Backend API  
**Status**: Phase 1 Complete (Authentication)  
**Date**: April 13, 2026

---

## ✅ COMPLETED (Phase 1)

### Infrastructure
- [x] Database connection pool (PostgreSQL)
- [x] Express app setup with middleware
- [x] Error handling middleware
- [x] Request validation (Joi schemas)
- [x] Logger configuration (Winston)
- [x] Environment configuration (.env template)

### Authentication
- [x] JWT token generation & verification
- [x] Password hashing (bcrypt)
- [x] Authentication middleware
- [x] Authorization middleware (RBAC)
- [x] Rate limiting middleware
- [x] Login endpoint (POST /auth/login) ✅
- [x] Token refresh endpoint (POST /auth/refresh) ✅
- [x] Logout endpoint (POST /auth/logout) ✅
- [x] Authentication tests

### Routes (Stubs Created)
- [x] Auth routes (fully implemented)
- [x] Users routes (stub)
- [x] Children routes (stub)
- [x] Plans routes (stub)
- [x] Evaluations routes (stub)
- [x] Analytics routes (stub)

---

## 📅 PHASE 2: USER MANAGEMENT (5 endpoints)

### Endpoints to Implement

#### 1. GET /api/v1/users
**Admin only** - List all users

```javascript
// Route: GET /api/v1/users
// Required middleware: authenticate, authorize(['admin'])
// Query params: limit=20, offset=0, search="", role=""

// Database query
SELECT id, email, name, role, kindergarten_id, is_active, created_at
FROM users
WHERE deleted_at IS NULL
  AND (name ILIKE '%search%' OR email ILIKE '%search%')
  AND (role = 'role' OR 'role' = '')
ORDER BY created_at DESC
LIMIT limit OFFSET offset

// Response
{
  "code": "SUCCESS",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "email@domain.com",
        "name": "User Name",
        "role": "teacher",
        "kindergarten_id": "uuid",
        "is_active": true,
        "created_at": "2026-04-13T..."
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 50
    }
  }
}
```

#### 2. GET /api/v1/users/:id
**Self or Admin** - Get user details

```javascript
// Route: GET /api/v1/users/:id
// Required middleware: authenticate, authorize (self or admin)

// Response
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "email": "email@domain.com",
    "name": "User Name",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-xxx-xxx",
    "is_active": true,
    "created_at": "2026-04-13T...",
    "updated_at": "2026-04-13T..."
  }
}
```

#### 3. POST /api/v1/users
**Admin or Principal** - Create new user

```javascript
// Route: POST /api/v1/users
// Required middleware: authenticate, authorize(['admin', 'principal'])
// Body validation: createUserSchema

// Request
{
  "email": "newteacher@example.com",
  "name": "New Teacher",
  "password": "SecurePassword123!",
  "role": "teacher",
  "kindergarten_id": "uuid",
  "phone": "+84-xxx-xxx"
}

// Response: 201 Created
{
  "code": "USER_CREATED",
  "data": {
    "id": "uuid",
    "email": "newteacher@example.com",
    "name": "New Teacher",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-xxx-xxx",
    "is_active": true,
    "created_at": "2026-04-13T..."
  }
}
```

#### 4. PUT /api/v1/users/:id
**Self or Admin** - Update user

```javascript
// Route: PUT /api/v1/users/:id
// Required middleware: authenticate, authorize (self or admin)
// Body validation: updateUserSchema

// Request (all fields optional)
{
  "name": "Updated Name",
  "phone": "+84-xxx-xxx",
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}

// Response
{
  "code": "USER_UPDATED",
  "data": {
    "id": "uuid",
    "email": "email@domain.com",
    "name": "Updated Name",
    "phone": "+84-xxx-xxx",
    "updated_at": "2026-04-13T..."
  }
}
```

#### 5. DELETE /api/v1/users/:id
**Admin only** - Soft delete user

```javascript
// Route: DELETE /api/v1/users/:id
// Required middleware: authenticate, authorize(['admin'])

// Response
{
  "code": "USER_DELETED",
  "message": "User deleted successfully",
  "timestamp": "2026-04-13T..."
}
```

### Implementation Steps

1. **Create User Controller** (`src/controllers/userController.js`)
   - List users with pagination & filtering
   - Get single user
   - Create user (hash password)
   - Update user (with password change)
   - Delete user (soft delete)

2. **Create User Service** (`src/services/userService.js`)
   - Get user by ID
   - Get user by email
   - Check user exists
   - All CRUD operations

3. **Update User Routes** (`src/routes/users.js`)
   - Replace stub endpoints
   - Add all middleware
   - Add validation

4. **Create User Tests** (`tests/integration/users.test.js`)
   - Test all 5 endpoints
   - Test authorization rules
   - Test input validation
   - Test edge cases

---

## 📅 PHASE 3: CHILDREN MANAGEMENT (5 endpoints)

### Endpoints to Implement

#### 1. GET /api/v1/children
**Teachers, Principals, Admin** - List children

```javascript
// Query params: limit=20, offset=0, search="", teacher_id=""

// Teachers see only their assigned children
// Principals/Admins see all children in their kindergarten

// Response
{
  "code": "SUCCESS",
  "data": {
    "children": [
      {
        "id": "uuid",
        "name": "Võ Lê Yến Nhi",
        "date_of_birth": "2021-10-16",
        "age": 4,
        "gender": "female",
        "special_needs_description": "...",
        "kindergarten_id": "uuid",
        "assigned_teacher_id": "uuid",
        "assigned_teacher_name": "Võ Thị Thanh Thúy",
        "created_at": "2026-04-13T..."
      }
    ],
    "pagination": { "limit": 20, "offset": 0, "total": 50 }
  }
}
```

#### 2. GET /api/v1/children/:id
**Can view if teacher or admin** - Get child details

```javascript
// Response
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "name": "Võ Lê Yến Nhi",
    "date_of_birth": "2021-10-16",
    "age": 4,
    "gender": "female",
    "special_needs_description": "...",
    "kindergarten_id": "uuid",
    "assigned_teacher_id": "uuid",
    "assigned_teacher_name": "Võ Thị Thanh Thúy",
    "guardian_name": "Võ Lê Ánh",
    "guardian_phone": "+84-xxx-xxx",
    "created_at": "2026-04-13T..."
  }
}
```

#### 3. POST /api/v1/children
**Admin or Principal** - Create new child

```javascript
// Request
{
  "name": "Child Name",
  "date_of_birth": "2021-10-16",
  "gender": "female",
  "special_needs_description": "Description...",
  "kindergarten_id": "uuid",
  "assigned_teacher_id": "uuid"
}

// Response: 201 Created
{
  "code": "CHILD_CREATED",
  "data": { ...child_object }
}
```

#### 4. PUT /api/v1/children/:id
**Admin or Principal** - Update child

```javascript
// Request (all optional)
{
  "name": "Updated Name",
  "gender": "female",
  "special_needs_description": "Updated description...",
  "assigned_teacher_id": "uuid"
}

// Response
{
  "code": "CHILD_UPDATED",
  "data": { ...updated_child_object }
}
```

#### 5. DELETE /api/v1/children/:id
**Admin or Principal** - Soft delete child

```javascript
// Response
{
  "code": "CHILD_DELETED",
  "message": "Child deleted successfully"
}
```

---

## 📅 PHASE 4: EDUCATION PLANS (6 endpoints)

### Endpoints to Implement

#### 1. GET /api/v1/plans
**With filters by status, child_id, month, year**

```javascript
// Query params: status="", child_id="", month="", year="", limit=20, offset=0

// Response includes plan progress
{
  "code": "SUCCESS",
  "data": {
    "plans": [
      {
        "id": "uuid",
        "child_id": "uuid",
        "child_name": "Võ Lê Yến Nhi",
        "month": 4,
        "year": 2026,
        "status": "draft",
        "progress_percentage": 57,
        "skills_achieved": 8,
        "skills_total": 14,
        "created_at": "2026-04-13T...",
        "updated_at": "2026-04-13T..."
      }
    ],
    "pagination": { ... }
  }
}
```

#### 2. GET /api/v1/plans/:id
**Full plan with all skills and evaluations**

```javascript
// Response
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "child_id": "uuid",
    "child_name": "Võ Lê Yến Nhi",
    "month": 4,
    "year": 2026,
    "status": "draft",
    "created_by": "uuid",
    "created_at": "2026-04-13T...",
    
    "skills_by_area": {
      "vận_động_thô": {
        "area_id": "uuid",
        "area_name": "Vận động thô",
        "color": "#FF6B6B",
        "skills": [
          {
            "skill_id": "uuid",
            "skill_name": "Ngồi lăn bóng",
            "instruction_text": "...",
            "image_urls": ["..."],
            "evaluation": {
              "status": "achieved",
              "notes": "...",
              "evaluated_at": "2026-04-13T..."
            }
          }
        ]
      },
      // ... other 3 areas
    },
    
    "progress": {
      "total_skills": 14,
      "achieved": 8,
      "not_achieved": 3,
      "partial": 2,
      "pending": 1,
      "percentage": 57
    }
  }
}
```

#### 3. POST /api/v1/plans
**Create plan from template**

```javascript
// Request
{
  "child_id": "uuid",
  "month": 4,
  "year": 2026,
  "template_id": "uuid"
}

// Creates plan with all skills from template
// Response: 201 Created with full plan
{
  "code": "PLAN_CREATED",
  "data": { ...full_plan_object }
}
```

#### 4. PUT /api/v1/plans/:id
**Update plan status**

```javascript
// Request
{
  "status": "completed"  // draft → completed → submitted → approved
}

// Response
{
  "code": "PLAN_UPDATED",
  "data": { ...updated_plan }
}
```

#### 5. DELETE /api/v1/plans/:id
**Soft delete plan**

```javascript
// Response
{
  "code": "PLAN_DELETED",
  "message": "Plan deleted successfully"
}
```

#### 6. GET /api/v1/plans/:id/export-pdf
**Export plan as PDF**

```javascript
// Response: PDF file downloaded
// Content-Type: application/pdf
// Filename: QLHS_{child_name}_{month}_{year}.pdf

// PDF contains:
// - Header with kindergarten & teacher info
// - Child information
// - 4 development areas with all skills
// - Each skill shows: name, instruction, image, evaluation status
// - Summary section with achievement percentages
// - Signature section for teacher & principal
```

---

## 📅 PHASE 5: EVALUATIONS (3 endpoints)

### Endpoints to Implement

#### 1. POST /api/v1/plans/:planId/evaluate
**Record skill evaluation**

```javascript
// Request
{
  "skill_id": "uuid",
  "result_status": "achieved",  // achieved, not_achieved, partial, pending
  "notes": "Trẻ lăn bóng tốt...",
  "evidence_url": "https://cloudinary.com/..."  // optional
}

// Response
{
  "code": "EVALUATION_RECORDED",
  "data": {
    "evaluation_id": "uuid",
    "plan_id": "uuid",
    "skill_id": "uuid",
    "result_status": "achieved",
    "notes": "...",
    "evaluated_at": "2026-04-13T..."
  }
}
```

#### 2. PUT /api/v1/plans/:planId/evaluate/:skillId
**Update evaluation**

```javascript
// Request (all optional)
{
  "result_status": "partial",
  "notes": "Updated notes...",
  "evidence_url": "https://..."
}

// Response
{
  "code": "EVALUATION_UPDATED",
  "data": { ...updated_evaluation }
}
```

#### 3. GET /api/v1/plans/:planId/progress
**Get plan progress summary**

```javascript
// Response
{
  "code": "SUCCESS",
  "data": {
    "plan_id": "uuid",
    "child_name": "Võ Lê Yến Nhi",
    "month": 4,
    "year": 2026,
    
    "overall_progress": {
      "percentage": 57,
      "achieved": 8,
      "not_achieved": 3,
      "partial": 2,
      "pending": 1
    },
    
    "by_area": {
      "vận_động_thô": {
        "percentage": 50,
        "achieved": 1,
        "not_achieved": 0,
        "partial": 1,
        "pending": 0
      },
      // ... other areas
    },
    
    "comparison_to_previous_month": {
      "previous_month": 3,
      "previous_year": 2026,
      "previous_percentage": 43,
      "improvement_percentage": 14,
      "new_skills_achieved": 2
    }
  }
}
```

---

## 📅 PHASE 6: ANALYTICS (3 endpoints)

### Endpoints to Implement

#### 1. GET /api/v1/analytics/dashboard
**System overview (Admin/Principal only)**

```javascript
// Response
{
  "code": "SUCCESS",
  "data": {
    "summary": {
      "total_children": 50,
      "total_plans_this_month": 8,
      "plans_approved": 3,
      "average_achievement": 92
    },
    
    "recent_plans": [
      {
        "plan_id": "uuid",
        "child_name": "...",
        "teacher_name": "...",
        "status": "draft",
        "progress": 57,
        "updated_at": "2026-04-13T..."
      }
    ],
    
    "achievement_by_area": {
      "vận_động_thô": 85,
      "vận_động_tinh": 92,
      "nhận_biết_ngôn_ngữ": 78,
      "cá_nhân_xã_hội": 88
    },
    
    "teacher_statistics": [
      {
        "teacher_id": "uuid",
        "teacher_name": "Võ Thị Thanh Thúy",
        "children_count": 12,
        "plans_completed": 9,
        "average_achievement": 85
      }
    ]
  }
}
```

#### 2. GET /api/v1/analytics/child/:id/progress
**Individual child progress over time**

```javascript
// Response
{
  "code": "SUCCESS",
  "data": {
    "child_id": "uuid",
    "child_name": "Võ Lê Yến Nhi",
    
    "monthly_progress": [
      {
        "month": 3,
        "year": 2026,
        "percentage": 43,
        "achieved": 6,
        "total": 14
      },
      {
        "month": 4,
        "year": 2026,
        "percentage": 57,
        "achieved": 8,
        "total": 14
      }
    ],
    
    "current_month": {
      "month": 4,
      "year": 2026,
      "percentage": 57,
      "by_area": {
        "vận_động_thô": 50,
        "vận_động_tinh": 75,
        "nhận_biết_ngôn_ngữ": 60,
        "cá_nhân_xã_hội": 70
      }
    },
    
    "trend": {
      "direction": "up",  // up, down, stable
      "change_percentage": 14,
      "comparison_months": 1
    }
  }
}
```

#### 3. GET /api/v1/analytics/reports
**Generate reports data**

```javascript
// Query params: type="monthly"|"quarterly"|"annual", year=2026

// Response
{
  "code": "SUCCESS",
  "data": {
    "report_type": "monthly",
    "period": "April 2026",
    
    "kindergarten_summary": {
      "total_children": 50,
      "plans_created": 8,
      "plans_completed": 5,
      "average_achievement": 92
    },
    
    "teacher_breakdown": [
      {
        "teacher_name": "...",
        "children": 12,
        "plans": 9,
        "average_achievement": 85,
        "completion_rate": 100
      }
    ],
    
    "area_analysis": {
      "vận_động_thô": {
        "achievement_percentage": 85,
        "children_with_progress": 12
      },
      // ... other areas
    },
    
    "export_formats": {
      "csv": "https://api/reports/export/csv",
      "pdf": "https://api/reports/export/pdf",
      "excel": "https://api/reports/export/excel"
    }
  }
}
```

---

## 🔧 ADDITIONAL ENDPOINTS

### Skills Management (4 endpoints - Admin only)
- GET /api/v1/skills (list all)
- GET /api/v1/skills/:id (get with images)
- POST /api/v1/skills (create)
- PUT /api/v1/skills/:id (update)

### Templates Management (4 endpoints - Admin only)
- GET /api/v1/templates (list available)
- GET /api/v1/templates/:id (get details)
- POST /api/v1/templates (create)
- PUT /api/v1/templates/:id (update)

### Kindergartens Management (4 endpoints - Admin only)
- GET /api/v1/kindergartens (list)
- GET /api/v1/kindergartens/:id (details)
- POST /api/v1/kindergartens (create)
- PUT /api/v1/kindergartens/:id (update)

---

## 📊 IMPLEMENTATION TIMELINE

| Phase | Duration | Endpoints | Status |
|-------|----------|-----------|--------|
| 1. Auth & Infrastructure | 3 days | 3 | ✅ DONE |
| 2. Users | 3 days | 5 | ⏳ PENDING |
| 3. Children | 3 days | 5 | ⏳ PENDING |
| 4. Plans | 4 days | 6 | ⏳ PENDING |
| 5. Evaluations | 3 days | 3 | ⏳ PENDING |
| 6. Analytics | 3 days | 3 | ⏳ PENDING |
| 7. Skills/Templates | 4 days | 8 | ⏳ PENDING |
| 8. Testing & Docs | 3 days | All | ⏳ PENDING |
| **TOTAL** | **26 days** | **40+** | **In Progress** |

---

## 🎯 NEXT IMMEDIATE STEP

### Implement Phase 2: User Management

1. **Create `src/services/userService.js`**
   - `getUserById(id)`
   - `getUserByEmail(email)`
   - `listUsers(filters, pagination)`
   - `createUser(data)`
   - `updateUser(id, data)`
   - `deleteUser(id)`
   - `isUserExists(email)`

2. **Create `src/controllers/userController.js`**
   - `list()` - GET /users
   - `getById()` - GET /users/:id
   - `create()` - POST /users
   - `update()` - PUT /users/:id
   - `delete()` - DELETE /users/:id

3. **Update `src/routes/users.js`**
   - Replace all stub endpoints
   - Add middleware: `authenticate`, `authorize`, `validate`
   - Add proper request/response handling

4. **Create `tests/integration/users.test.js`**
   - Test all 5 endpoints
   - Test authorization rules
   - Test validation
   - Test edge cases

5. **Run tests**
   ```bash
   npm run test:integration -- tests/integration/users.test.js
   ```

---

## 📝 BEST PRACTICES

### Error Handling
```javascript
// Consistent error format for all endpoints
{
  "code": "ERROR_CODE",
  "message": "User-friendly message",
  "errors": [  // optional, for validation errors
    { "field": "email", "message": "Invalid email" }
  ],
  "timestamp": "2026-04-13T..."
}
```

### Success Response Format
```javascript
{
  "code": "SUCCESS_CODE",
  "message": "Optional success message",
  "data": { /* response data */ },
  "timestamp": "2026-04-13T..."
}
```

### Service Layer Pattern
```javascript
// Controllers call services, services call database
// Controllers handle HTTP, services handle business logic

// Controller (src/controllers/*.js)
exports.create = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body);
    res.status(201).json({ code: 'SUCCESS', data: result });
  } catch (error) {
    next(error);
  }
};

// Service (src/services/*.js)
exports.createUser = async (data) => {
  // Validate data
  // Check business rules
  // Call database
  // Return result
};
```

### Database Query Pattern
```javascript
// Use parameterized queries to prevent SQL injection
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
  [userId]  // Parameters array
);
```

### Testing Pattern
```javascript
// Unit test: Test service logic
describe('userService.createUser', () => {
  it('should create user with valid data', async () => {
    const result = await userService.createUser(validUserData);
    expect(result).toHaveProperty('id');
  });
});

// Integration test: Test API endpoint
describe('POST /api/v1/users', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send(validUserData);
    expect(response.status).toBe(201);
  });
});
```

---

**Ready to implement Phase 2?** 
Start with `src/services/userService.js`!

---

Created: April 13, 2026
