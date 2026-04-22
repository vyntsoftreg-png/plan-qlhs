# 🗂️ API ENDPOINTS INDEX

## Complete 40+ Endpoint List

### 1. AUTHENTICATION (5 endpoints)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/refresh-token` | Refresh JWT token | ❌ |
| POST | `/auth/logout` | Logout user | ✅ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |

**Sample Workflow**:
```
1. Register → Login → Get tokens
2. Use accessToken for requests
3. Auto-refresh before expiration
4. Logout to invalidate tokens
```

---

### 2. USER MANAGEMENT (5 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/users/profile` | Get logged-in user | teacher, admin |
| PUT | `/users/profile` | Update own profile | teacher, admin |
| GET | `/users` | List all users | admin |
| POST | `/users` | Create new user | admin |
| DELETE | `/users/:id` | Delete user | admin |

**Access Pattern**:
```
- Teacher/Principal: Can edit own profile
- Admin: Can CRUD all users
```

---

### 3. KINDERGARTEN MANAGEMENT (4 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/kindergartens` | List kindergartens | admin |
| POST | `/kindergartens` | Create kindergarten | admin |
| GET | `/kindergartens/:id` | Get kindergarten detail | admin, principal |
| PUT | `/kindergartens/:id` | Update kindergarten | admin, principal |

**Data Returned**:
```
- Basic info (name, address, phone)
- Principal name
- Children count
- Teachers count
- Plans count
```

---

### 4. CHILDREN MANAGEMENT (6 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/children` | List children | teacher, admin |
| POST | `/children` | Create child | admin, principal |
| GET | `/children/:id` | Get child detail | teacher, admin |
| PUT | `/children/:id` | Update child | teacher, admin |
| DELETE | `/children/:id` | Delete child | admin |
| GET | `/children/:id/progress` | Get child progress | teacher, admin |

**Common Queries**:
```
GET /children?search=Yến&is_active=true
GET /children/:id/progress?month=4&year=2026
```

---

### 5. DEVELOPMENT AREAS (2 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/areas` | List 4 areas | all |
| GET | `/areas/:id/skills` | Get skills in area | all |

**Fixed Data** (4 areas):
```
1. Vận động thô (Coarse Motor)
2. Vận động tinh (Fine Motor)
3. Nhận biết ngôn ngữ & Tư duy (Language & Cognition)
4. Cá nhân & Xã hội (Personal-Social)
```

---

### 6. SKILLS MANAGEMENT (7 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/skills` | List all skills | all |
| GET | `/skills/:id` | Get skill detail | all |
| GET | `/skills/:id/images` | Get skill images | all |
| POST | `/skills` | Create skill | admin |
| PUT | `/skills/:id` | Update skill | admin |
| DELETE | `/skills/:id` | Delete skill | admin |
| POST | `/skills/:id/images` | Upload image | admin |

**Skill Contains**:
```
- Name: "Ngồi lăn bóng..."
- Instruction text: Step-by-step guide
- Images: Multiple minh họa
- Teaching method: How to teach
- Area: Which development area
```

---

### 7. TEMPLATES (6 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/templates` | List templates | all |
| POST | `/templates` | Create template | admin |
| GET | `/templates/:id` | Get template detail | all |
| PUT | `/templates/:id` | Update template | admin |
| DELETE | `/templates/:id` | Delete template | admin |
| POST | `/templates/:id/clone` | Clone template | teacher |

**Template Features**:
```
- Multiple templates per age group
- Pre-bundled skills (14-20 per template)
- Customizable for specific children
- Clone for modification
```

---

### 8. EDUCATION PLANS (8 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/plans` | List plans | teacher, admin |
| POST | `/plans` | Create plan | teacher, admin |
| GET | `/plans/:id` | Get full plan | teacher, admin |
| PUT | `/plans/:id` | Update plan | teacher, admin |
| DELETE | `/plans/:id` | Delete plan | teacher, admin |
| POST | `/plans/:id/submit` | Submit for approval | teacher |
| POST | `/plans/:id/approve` | Approve plan | principal, admin |
| GET | `/plans/:id/export-pdf` | Export as PDF | teacher, admin |
| GET | `/plans/:id/export-excel` | Export as Excel | teacher, admin |

**Plan Status Flow**:
```
draft → completed → submitted → approved
       ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
       Can delete or edit in draft
       Submit when ready
       Principal approves
       Final status: approved
```

**Export Contents**:
```
📄 PDF: Professional document
- Child info
- All 4 areas with skills
- Instruction text & images
- Evaluation results
- Signature section

📊 Excel: Data spreadsheet
- Summary tab
- Per-area sheets
- Evaluation log
- Analytics/charts
```

---

### 9. PLAN SKILLS (5 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/plans/:planId/skills` | List skills in plan | teacher, admin |
| POST | `/plans/:planId/skills` | Add skill to plan | teacher |
| GET | `/plans/:planId/skills/:skillId` | Get specific skill | teacher |
| PUT | `/plans/:planId/skills/:skillId` | Update skill in plan | teacher |
| DELETE | `/plans/:planId/skills/:skillId` | Remove skill | teacher |

**Customization Options**:
```
- Include/exclude skills
- Add personal notes
- Specify learning materials
- Customize instructions
```

---

### 10. EVALUATION RESULTS (6 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| POST | `/plans/:planId/evaluate` | Record evaluation | teacher |
| GET | `/plans/:planId/evaluations` | List evaluations | teacher, admin |
| PUT | `/evaluations/:id` | Update evaluation | teacher |
| DELETE | `/evaluations/:id` | Delete evaluation | teacher |
| GET | `/children/:childId/progress` | Get progress summary | teacher, admin |
| POST | `/evaluations/:id/evidence` | Upload proof image | teacher |

**Evaluation Status**:
```
- achieved: Đạt
- not_achieved: Chưa đạt
- partial: Có tiến bộ
- pending: Chưa đánh giá
```

**Progress Calculation**:
```
Achievement % = (achieved ÷ total) × 100
Result per area: % hoàn thành
Overall result: % toàn bộ
```

---

### 11. SEARCH & ANALYTICS (4 endpoints)

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| GET | `/search/children` | Search children | teacher, admin |
| GET | `/analytics/kindergarten` | School statistics | admin, principal |
| GET | `/analytics/teacher/:teacherId` | Teacher statistics | admin, principal |
| GET | `/reports/compliance` | Compliance report | admin |

**Search Capabilities**:
```
Wildcard: /search/children?q=Yến
Filter: /search/children?status=active&area=1
Combine: /search/children?q=Yến&teacher=2&limit=20
```

**Analytics Available**:
```
- Total children
- Active plans
- Completion rate
- Progress by area
- Teacher workload
- Monthly trends
```

---

## Endpoint Statistics

### By HTTP Method
```
GET    22 endpoints (read operations)
POST   12 endpoints (create operations)
PUT     4 endpoints (update operations)
DELETE  2 endpoints (delete operations)
────────────────────────────────
Total:  40 endpoints
```

### By Category
```
Auth          5 endpoints
Users         5 endpoints
Kindergarten  4 endpoints
Children      6 endpoints
Areas         2 endpoints
Skills        7 endpoints
Templates     6 endpoints
Plans         8 endpoints
Plan Skills   5 endpoints
Evaluations   6 endpoints
Analytics     4 endpoints (future)

────────────────────────────────
Total:        58 planned endpoints
Current MVP: 40 endpoints (Phase 1)
```

### By Security Level
```
❌ No Auth (2)
   - /auth/register
   - /auth/login

✅ Auth Required (38)
   - Role-based access control
   - Resource ownership validation
   - Kindergarten-level isolation
```

---

## Common Workflows

### Workflow 1: Create Monthly Plan (5-10 min)

```
1. GET /children
   → List all children, select one

2. GET /templates?age_group=4-5
   → Choose template for child's age

3. POST /plans
   → Create plan from template (auto-fill all skills)

4. GET /plans/:id
   → View full plan with images & instructions

5. POST /plans/:id/evaluate × 14
   → Quick evaluate each skill (dropdown)

6. POST /plans/:id/submit
   → Submit for principal approval

7. [Principal] POST /plans/:id/approve
   → Approve plan

8. GET /plans/:id/export-pdf
   → Download & print/submit
```

**Time**: ~5-10 minutes (vs 90 minutes by hand)

---

### Workflow 2: Track Child Progress

```
1. GET /children/:id
   → View child details

2. GET /children/:id/progress?month=4&year=2026
   → See progress by area
   {
     "areas": [
       {
         "name": "Vận động thô",
         "total": 2,
         "achieved": 1,
         "percentage": 50
       }, ...
     ],
     "overall": 65.0
   }

3. Repeat for different months
   → Compare progress over time
```

---

### Workflow 3: Generate Reports

```
1. GET /analytics/kindergarten
   → Overall school statistics

2. GET /analytics/teacher/:teacherId
   → Teacher's workload & performance

3. GET /reports/compliance
   → All plans status (draft/submitted/approved)

4. GET /plans?status=submitted
   → Show pending approvals

5. POST /plans/:id/approve × N
   → Batch approve plans
```

---

## Error Scenarios & Responses

### 400 - Bad Request
```
Cause: Invalid input data
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "date_of_birth", "message": "Invalid format" }
    ]
  }
}
```

### 401 - Unauthorized
```
Cause: Missing or invalid token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expired. Please login again."
  }
}
```

### 403 - Forbidden
```
Cause: No permission (teacher can't edit another's plan)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to edit this plan"
  }
}
```

### 404 - Not Found
```
Cause: Resource doesn't exist
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Child with ID 999 not found"
  }
}
```

### 409 - Conflict
```
Cause: Plan already exists for this month
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "Plan already exists for April 2026"
  }
}
```

### 422 - Validation Error
```
Cause: Schema validation failure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email must be unique",
    "details": [{ "field": "email", "message": "Already in use" }]
  }
}
```

### 429 - Rate Limit Exceeded
```
Cause: Too many requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 45
  }
}
```

### 500 - Internal Server Error
```
Cause: Unexpected backend error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_123456"
  }
}
```

---

## Response Examples

### List Response (Pagination)
```json
{
  "success": true,
  "data": [
    { "id": 1, "fullName": "Yến Nhi", ... },
    { "id": 2, "fullName": "Minh Anh", ... }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "pages": 3,
    "current_page": 1
  }
}
```

### Single Resource Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Võ Lê Yến Nhi",
    "date_of_birth": "2021-10-16",
    "gender": "female",
    "teacher_id": 2,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

### Create/Update Response
```json
{
  "success": true,
  "message": "Education plan created successfully",
  "data": {
    "id": 1,
    "child_id": 1,
    "month": 4,
    "year": 2026,
    "status": "draft",
    "skills_count": 14
  }
}
```

### Delete Response
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

---

## Query Parameters Guide

### Pagination
```
?limit=20&offset=0
?limit=50&offset=100
Default: limit=20, offset=0
Max: limit=100
```

### Filtering
```
?status=draft
?month=4&year=2026
?is_active=true
?teacher_id=2
```

### Searching
```
?search=Yến
?search=minh
Wildcard search on text fields
```

### Sorting
```
?sort_by=fullName&sort_order=asc
?sort_by=created_at&sort_order=desc
Defaults: created_at, desc
```

### Combined
```
?search=Yến&month=4&year=2026&limit=20&offset=0&sort_by=fullName&sort_order=asc
```

---

## Rate Limiting

### Limits by Role
```
Anonymous:  10 req/min
Teacher:   100 req/min
Admin:     500 req/min
Principal: 100 req/min

Special:
- File uploads: 10/min
- Exports: 5/min
```

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1681647600
```

### When Exceeded (429)
```
Retry-After: 45 (seconds)
Reset time: 2026-04-13T11:05:00Z
```

---

**Total API Endpoints**: 40  
**Total Planned**: 58  
**Documentation Pages**: 35+  
**Status**: ✅ PHASE 1 COMPLETE

Next: Backend Implementation (Node.js/Express)
