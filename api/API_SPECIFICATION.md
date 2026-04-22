# 🔌 QLHS API Design Specification

**Version**: 1.0  
**Status**: Design Phase  
**Last Updated**: 2026-04-13  
**Base URL**: `https://api.qlhs.local/v1`

---

## 1. API OVERVIEW

### Key Principles
- RESTful architecture with JSON responses
- Stateless (all info in headers/payload)
- Proper HTTP status codes
- Consistent error handling
- Versioning via URL path (`/v1`, `/v2`, etc.)

### API Features
```
✅ JWT Authentication (Bearer tokens)
✅ Role-based access control (RBAC)
✅ Request validation & sanitization
✅ Rate limiting (100 req/min per user)
✅ CORS enabled for frontend
✅ Comprehensive error messages
✅ Request/Response logging
✅ Pagination (limit, offset)
✅ Full-text search support
✅ Soft delete support
```

---

## 2. AUTHENTICATION & AUTHORIZATION

### 2.1 JWT Token Structure
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user_id",
  "email": "teacher@school.com",
  "role": "teacher",
  "kindergarten_id": 1,
  "iat": 1681561200,
  "exp": 1681647600,
  "iss": "qlhs.local"
}
```

### 2.2 Token Usage
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Token Expiration
```
Access Token:  1 hour
Refresh Token: 7 days
```

### 2.4 Roles & Permissions

| Role | Permissions | Can Access |
|------|-------------|-----------|
| **admin** | Full CRUD | Everything |
| **principal** | CRUD plans, approve | Own kindergarten |
| **teacher** | CRUD own plans | Own children & plans |
| **parent** | Read-only | Own child progress |

---

## 3. ENDPOINT CATEGORIES

### 3.1 Authentication (5 endpoints)
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh-token
POST   /auth/logout
POST   /auth/forgot-password
```

### 3.2 User Management (5 endpoints)
```
GET    /users/profile
PUT    /users/profile
GET    /users (admin only)
POST   /users (admin only)
DELETE /users/:id (admin only)
```

### 3.3 Kindergarten (4 endpoints)
```
GET    /kindergartens (admin only)
POST   /kindergartens (admin only)
GET    /kindergartens/:id
PUT    /kindergartens/:id
```

### 3.4 Children (6 endpoints)
```
GET    /children
POST   /children
GET    /children/:id
PUT    /children/:id
DELETE /children/:id
GET    /children/:id/progress
```

### 3.5 Development Areas (2 endpoints)
```
GET    /areas
GET    /areas/:id/skills
```

### 3.6 Skills (7 endpoints)
```
GET    /skills
GET    /skills/:id
GET    /skills/:id/images
POST   /skills (admin only)
PUT    /skills/:id (admin only)
DELETE /skills/:id (admin only)
POST   /skills/:id/images (admin only)
```

### 3.7 Templates (6 endpoints)
```
GET    /templates
POST   /templates (admin only)
GET    /templates/:id
PUT    /templates/:id (admin only)
DELETE /templates/:id (admin only)
POST   /templates/:id/clone
```

### 3.8 Education Plans (8 endpoints)
```
GET    /plans
POST   /plans
GET    /plans/:id
PUT    /plans/:id
DELETE /plans/:id
POST   /plans/:id/submit
POST   /plans/:id/approve (principal only)
GET    /plans/:id/export-pdf
GET    /plans/:id/export-excel
```

### 3.9 Plan Skills (5 endpoints)
```
GET    /plans/:planId/skills
POST   /plans/:planId/skills
PUT    /plans/:planId/skills/:skillId
DELETE /plans/:planId/skills/:skillId
GET    /plans/:planId/skills/:skillId
```

### 3.10 Evaluation Results (6 endpoints)
```
POST   /plans/:planId/evaluate
GET    /plans/:planId/evaluations
PUT    /evaluations/:id
DELETE /evaluations/:id
GET    /children/:childId/progress
POST   /evaluations/:id/evidence (upload image)
```

### 3.11 Search & Analytics (4 endpoints)
```
GET    /search/children
GET    /analytics/kindergarten
GET    /analytics/teacher/:teacherId
GET    /reports/compliance
```

---

## 4. DETAILED ENDPOINT SPECIFICATIONS

### 4.1 AUTH ENDPOINTS

#### POST /auth/register
```
Request:
{
  "email": "teacher@school.com",
  "password": "SecurePassword123!",
  "fullName": "Võ Thị Thanh Thúy",
  "phone": "0912345678",
  "kindergarten_id": 1,
  "role": "teacher"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "teacher@school.com",
    "fullName": "Võ Thị Thanh Thúy",
    "role": "teacher",
    "kindergarten_id": 1,
    "created_at": "2026-04-13T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 400: Email already exists
- 400: Invalid password format
- 400: Missing required fields
```

#### POST /auth/login
```
Request:
{
  "email": "teacher@school.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "teacher@school.com",
    "fullName": "Võ Thị Thanh Thúy",
    "role": "teacher",
    "kindergarten_id": 1
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}

Errors:
- 401: Invalid credentials
- 404: User not found
```

#### POST /auth/refresh-token
```
Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}

Errors:
- 401: Invalid or expired refresh token
```

#### POST /auth/logout
```
Request:
Headers: Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4.2 CHILDREN ENDPOINTS

#### GET /children
```
Query Params:
- limit: 20 (default)
- offset: 0 (default)
- search: "Yến Nhi" (optional)
- filter_teacher: 2 (optional)
- sort_by: "fullName" (default) | "date_of_birth"
- is_active: true (default)

Request:
GET /children?limit=20&offset=0&search=Yến

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "Võ Lê Yến Nhi",
      "date_of_birth": "2021-10-16",
      "gender": "female",
      "kindergarten_id": 1,
      "teacher_id": 2,
      "teacher_name": "Võ Thị Thanh Thúy",
      "parent_phone": "0912111111",
      "parent_email": "parent1@email.com",
      "special_notes": "Trẻ chậm phát triển",
      "plans_count": 2,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-04-13T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "pages": 3,
    "current_page": 1
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden (teacher can only view own children)
```

#### POST /children
```
Request:
Headers: Authorization: Bearer {token}
{
  "fullName": "Nguyễn Thị Thu",
  "date_of_birth": "2021-11-15",
  "gender": "female",
  "teacher_id": 2,
  "parent_phone": "0912666666",
  "parent_email": "parent@email.com",
  "special_notes": "Sinh đôi, em trai tên Thái",
  "enrollment_date": "2026-09-01"
}

Response (201):
{
  "success": true,
  "message": "Child created successfully",
  "data": {
    "id": 6,
    "fullName": "Nguyễn Thị Thu",
    "date_of_birth": "2021-11-15",
    "teacher_id": 2,
    "created_at": "2026-04-13T10:35:00Z"
  }
}

Errors:
- 400: Invalid date of birth
- 401: Unauthorized
- 403: Cannot create child (not admin/principal)
```

#### GET /children/:id
```
Request:
GET /children/1

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Võ Lê Yến Nhi",
    "date_of_birth": "2021-10-16",
    "gender": "female",
    "kindergarten_id": 1,
    "teacher_id": 2,
    "teacher_name": "Võ Thị Thanh Thúy",
    "parent_phone": "0912111111",
    "parent_email": "parent1@email.com",
    "special_notes": "Trẻ chậm phát triển",
    "enrollment_date": "2021-09-01",
    "is_active": true,
    "plans": [
      {
        "id": 1,
        "month": 4,
        "year": 2026,
        "status": "draft",
        "created_at": "2026-04-13T10:00:00Z"
      }
    ],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-13T10:30:00Z"
  }
}

Errors:
- 404: Child not found
- 403: No permission to view
```

#### PUT /children/:id
```
Request:
{
  "fullName": "Võ Lê Yến Nhi",
  "parent_phone": "0912111112",
  "special_notes": "Chậm phát triển nhẹ"
}

Response (200):
{
  "success": true,
  "message": "Child updated successfully",
  "data": { ... }
}

Errors:
- 404: Child not found
- 403: No permission to edit
```

#### DELETE /children/:id
```
Request:
DELETE /children/1

Response (200):
{
  "success": true,
  "message": "Child deleted successfully"
}

Errors:
- 404: Child not found
- 403: No permission
- 409: Cannot delete child with active plans
```

#### GET /children/:id/progress
```
Request:
GET /children/1/progress?month=4&year=2026

Query Params:
- month: 4 (required)
- year: 2026 (required)

Response (200):
{
  "success": true,
  "data": {
    "child_id": 1,
    "child_name": "Võ Lê Yến Nhi",
    "month": 4,
    "year": 2026,
    "areas": [
      {
        "area_id": 1,
        "area_name": "Vận động thô",
        "total_skills": 2,
        "achieved_skills": 1,
        "partial_skills": 1,
        "not_achieved_skills": 0,
        "achievement_percentage": 50.0,
        "skills": [
          {
            "skill_id": 1,
            "skill_name": "Ngồi lăn bóng...",
            "status": "achieved",
            "evaluation_date": "2026-04-15"
          }
        ]
      }
    ],
    "total_achievement_percentage": 65.0,
    "summary": {
      "total_skills": 14,
      "achieved": 9,
      "partial": 2,
      "not_achieved": 3
    }
  }
}
```

---

### 4.3 EDUCATION PLANS ENDPOINTS

#### GET /plans
```
Query Params:
- limit: 20
- offset: 0
- month: 4
- year: 2026
- status: draft|completed|submitted|approved
- teacher_id: 2
- child_id: 1
- search: "Yến"

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "child_id": 1,
      "child_name": "Võ Lê Yến Nhi",
      "month": 4,
      "year": 2026,
      "teacher_id": 2,
      "teacher_name": "Võ Thị Thanh Thúy",
      "status": "draft",
      "total_skills": 14,
      "achieved_skills": 8,
      "partial_skills": 2,
      "not_achieved_skills": 4,
      "completion_percentage": 57.1,
      "template_id": 1,
      "template_name": "Mẫu KH Tháng 4-5/2026",
      "created_at": "2026-04-13T10:00:00Z",
      "updated_at": "2026-04-13T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /plans
```
Request (Option 1: From Template):
{
  "child_id": 1,
  "month": 4,
  "year": 2026,
  "template_id": 1,
  "copy_from_plan_id": null
}

Request (Option 2: From Previous Plan):
{
  "child_id": 1,
  "month": 4,
  "year": 2026,
  "template_id": null,
  "copy_from_plan_id": 4
}

Response (201):
{
  "success": true,
  "message": "Education plan created successfully",
  "data": {
    "id": 2,
    "child_id": 1,
    "month": 4,
    "year": 2026,
    "status": "draft",
    "skills_count": 14,
    "created_at": "2026-04-13T10:45:00Z"
  }
}

Errors:
- 400: Plan already exists for this month/year
- 404: Child or template not found
- 409: Conflict - plan exists
```

#### GET /plans/:id
```
Request:
GET /plans/1

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "child_id": 1,
    "child_name": "Võ Lê Yến Nhi",
    "month": 4,
    "year": 2026,
    "status": "draft",
    "areas": [
      {
        "area_id": 1,
        "area_name": "Vận động thô",
        "skills": [
          {
            "plan_skill_id": 1,
            "skill_id": 1,
            "skill_name": "Ngồi lăn bóng...",
            "instruction_text": "Cô chuẩn bị...",
            "teaching_method": "1. Cô làm mẫu...",
            "is_included": true,
            "additional_instructions": "Chú ý giảm hỗ trợ dần",
            "learning_materials": "1 quả bóng",
            "evaluation": {
              "status": "achieved",
              "notes": "Trẻ lăn bóng tốt",
              "evaluation_date": "2026-04-15",
              "evaluated_by": "Võ Thị Thanh Thúy"
            },
            "images": [
              {
                "id": 1,
                "image_url": "https://...",
                "alt_text": "Trẻ lăn bóng"
              }
            ]
          }
        ]
      }
    ],
    "created_at": "2026-04-13T10:00:00Z",
    "updated_at": "2026-04-13T10:30:00Z"
  }
}
```

#### PUT /plans/:id
```
Request:
{
  "status": "completed",
  "notes": "Kết thúc tháng 4"
}

Response (200):
{
  "success": true,
  "message": "Plan updated successfully",
  "data": { ... }
}
```

#### DELETE /plans/:id
```
Response (200):
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

#### POST /plans/:id/submit
```
Request:
{
  "notes": "Hoàn thành đánh giá, chờ phê duyệt"
}

Response (200):
{
  "success": true,
  "message": "Plan submitted for approval",
  "data": {
    "id": 1,
    "status": "submitted",
    "submitted_at": "2026-04-13T15:00:00Z"
  }
}

Errors:
- 409: Plan not in draft status
- 400: Plan has incomplete evaluations
```

#### POST /plans/:id/approve
```
Request (Principal only):
{
  "approval_notes": "Phê duyệt - các mục tiêu phù hợp"
}

Response (200):
{
  "success": true,
  "message": "Plan approved successfully",
  "data": {
    "id": 1,
    "status": "approved",
    "approved_by": 5,
    "approved_at": "2026-04-13T15:30:00Z"
  }
}

Errors:
- 403: Only principal can approve
- 409: Plan not in submitted status
```

#### GET /plans/:id/export-pdf
```
Request:
GET /plans/1/export-pdf

Response (200):
Binary PDF file
Content-Type: application/pdf
Content-Disposition: attachment; filename="KH_Yen_Nhi_4_2026.pdf"

PDF Contains:
- Thông tin trẻ
- 4 lĩnh vực với skills & images
- Kết quả đánh giá
- Nhận xét giáo viên
- Chữ ký phê duyệt
```

#### GET /plans/:id/export-excel
```
Request:
GET /plans/1/export-excel

Response (200):
Binary Excel file
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

Excel Contains:
- Sheet 1: Tổng quan
- Sheet 2-5: Chi tiết từng lĩnh vực
- Summary sheet: Thống kê
```

---

### 4.4 EVALUATION ENDPOINTS

#### POST /plans/:planId/evaluate
```
Request:
{
  "plan_skill_id": 1,
  "status": "achieved",
  "notes": "Trẻ lăn bóng tốt, cần giảm hỗ trợ thêm"
}

Response (201):
{
  "success": true,
  "message": "Evaluation recorded successfully",
  "data": {
    "id": 1,
    "plan_skill_id": 1,
    "skill_name": "Ngồi lăn bóng...",
    "status": "achieved",
    "notes": "Trẻ lăn bóng tốt...",
    "evaluation_date": "2026-04-15",
    "evaluated_by": "Võ Thị Thanh Thúy",
    "created_at": "2026-04-15T14:00:00Z"
  }
}

Status Values:
- achieved: Đạt
- not_achieved: Chưa đạt
- partial: Có tiến bộ
- pending: Chưa đánh giá
```

#### PUT /evaluations/:id
```
Request:
{
  "status": "partial",
  "notes": "Trẻ có tiến bộ nhưng còn cần hỗ trợ"
}

Response (200):
{
  "success": true,
  "message": "Evaluation updated",
  "data": { ... }
}
```

#### POST /evaluations/:id/evidence
```
Request:
Multipart form with image file
{
  "image": [File object]
}

Response (200):
{
  "success": true,
  "message": "Evidence uploaded",
  "data": {
    "id": 1,
    "evidence_url": "https://cloudinary.com/..."
  }
}

Constraints:
- Max 5MB per image
- Formats: JPG, PNG, WebP
- Resized & optimized automatically
```

---

### 4.5 SKILLS & TEMPLATES ENDPOINTS

#### GET /areas
```
Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vận động thô",
      "description": "Kỹ năng chuyển động cơ thể",
      "color_code": "#FF6B6B",
      "icon_name": "directions_run",
      "skills_count": 10
    },
    { ... }
  ]
}
```

#### GET /areas/:id/skills
```
Query Params:
- limit: 20
- offset: 0

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ngồi lăn bóng...",
      "instruction_text": "Cô chuẩn bị...",
      "teaching_method": "1. Cô làm mẫu...",
      "images_count": 2,
      "created_by": "Võ Thị Thanh Thúy"
    }
  ]
}
```

#### GET /skills/:id
```
Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "area_id": 1,
    "area_name": "Vận động thô",
    "name": "Ngồi lăn bóng...",
    "instruction_text": "Cô chuẩn bị 1 quả bóng...",
    "teaching_method": "1. Cô làm mẫu để trẻ quan sát\n2. Cô hỗ trợ khi...\n3. Từ từ giảm dần",
    "learning_objectives": "Phát triển kỹ năng vận động thô",
    "images": [
      {
        "id": 1,
        "image_url": "https://...",
        "alt_text": "Trẻ lăn bóng"
      },
      {
        "id": 2,
        "image_url": "https://...",
        "alt_text": "Cô làm mẫu"
      }
    ],
    "created_by": "Võ Thị Thanh Thúy",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

#### GET /templates
```
Query Params:
- age_group: "4-5 tuổi"
- month: 4
- year: 2026

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mẫu KH Tháng 4-5/2026 cho trẻ 4-5 tuổi",
      "description": "Mẫu kế hoạch chuẩn...",
      "age_group": "4-5 tuổi",
      "month": 4,
      "year": 2026,
      "skills_count": 14,
      "is_default": true,
      "created_by": "Võ Thị Thanh Thúy",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

#### GET /templates/:id
```
Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Mẫu KH Tháng 4-5/2026",
    "description": "...",
    "skills": [
      {
        "template_skill_id": 1,
        "skill_id": 1,
        "skill_name": "Ngồi lăn bóng...",
        "skill_order": 1,
        "is_required": true,
        "custom_notes": null
      }
    ],
    "created_at": "2026-02-01T00:00:00Z"
  }
}
```

---

## 5. ERROR HANDLING

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": [
      {
        "field": "email",
        "message": "Email already exists"
      }
    ],
    "timestamp": "2026-04-13T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET request successful |
| 201 | Created | New resource created |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 422 | Validation Error | Invalid data format |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Unexpected error |
| 503 | Service Unavailable | Maintenance mode |

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| INVALID_CREDENTIALS | 401 | Email/password wrong |
| TOKEN_EXPIRED | 401 | JWT token expired |
| UNAUTHORIZED | 401 | No token provided |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 422 | Input validation failed |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 6. PAGINATION

### Standard Pagination Format

All list endpoints support:
```
Query: ?limit=20&offset=0

Response includes:
{
  "data": [...],
  "pagination": {
    "total": 150,        // Total records
    "limit": 20,         // Items per page
    "offset": 0,         // Current offset
    "pages": 8,          // Total pages
    "current_page": 1    // Current page
  }
}

Defaults:
- limit: 20 (max 100)
- offset: 0

Example:
GET /children?limit=20&offset=0
GET /plans?limit=50&offset=100
```

---

## 7. FILTERING & SEARCHING

### Query Parameters

```
Basic Filtering:
- GET /children?is_active=true
- GET /plans?status=draft
- GET /plans?month=4&year=2026

Wildcard Search:
- GET /children?search=Yến
- GET /plans?search=nhi

Combined:
- GET /plans?month=4&year=2026&status=submitted&limit=20&offset=0

Sorting:
- GET /children?sort_by=fullName&sort_order=asc
- GET /plans?sort_by=created_at&sort_order=desc
```

---

## 8. RATE LIMITING

```
Headers Returned:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2026-04-13T11:00:00Z

Limits:
- Anonymous: 10 req/min
- Authenticated: 100 req/min
- Admin: 500 req/min

Exceeded Response (429):
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 45 seconds.",
    "retry_after": 45
  }
}
```

---

## 9. API VERSIONING

```
URL-based versioning:
- /v1/children (current)
- /v2/children (future)

Deprecation:
- X-API-Deprecated: true
- X-API-Sunset: 2026-12-31T00:00:00Z

Breaking Changes:
- Switch major version (/v2)
- Provide migration guide
- Support old version for 6 months
```

---

## 10. REQUEST/RESPONSE VALIDATION

### Request Validation
```js
// All POST/PUT requests validated against schema
// Fields are sanitized & trimmed
// Types are enforced
// Dates validated in ISO 8601 format
// Emails validated with RFC 5322
// URLs validated for proper format

Example: POST /children
{
  "fullName": "Nguyễn Thị Thu",  // Required, string, max 255
  "date_of_birth": "2021-11-15", // Required, date (YYYY-MM-DD)
  "gender": "female",             // Required, enum: male|female|other
  "teacher_id": 2,               // Required, integer, must exist
  "parent_phone": "0912666666",  // Optional, string, 10-11 chars
  "parent_email": "p@school.com" // Optional, valid email
}
```

### Response Content-Type
```
- JSON: application/json; charset=utf-8
- PDF: application/pdf
- Excel: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- CSV: text/csv; charset=utf-8
```

---

## 11. CACHING STRATEGY

### Cacheable Endpoints
```
GET /areas                    → Cache: 1 hour
GET /areas/:id/skills         → Cache: 1 hour
GET /skills/:id               → Cache: 30 minutes
GET /templates                → Cache: 30 minutes
GET /templates/:id            → Cache: 30 minutes
GET /kindergartens/:id        → Cache: 1 hour

Cache Headers:
Cache-Control: public, max-age=3600
ETag: "12345678"
Last-Modified: 2026-04-13T10:00:00Z
```

### Cache Invalidation
```
On POST/PUT/DELETE:
- Invalidate related GET endpoints
- Example: POST /children → Invalidate /children
- Example: PUT /plans/:id → Invalidate /plans/:id
```

---

## 12. SECURITY HEADERS

All responses include:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 13. SUMMARY

| Feature | Details |
|---------|---------|
| **Total Endpoints** | 40+ |
| **Authentication** | JWT Bearer tokens |
| **Response Format** | JSON |
| **Rate Limit** | 100 req/min (auth), 10 req/min (anon) |
| **Pagination** | limit, offset |
| **Filtering** | Query params |
| **Sorting** | sort_by, sort_order |
| **Versioning** | URL-based (/v1, /v2) |
| **Caching** | HTTP + custom headers |
| **Error Handling** | Standard format + codes |
| **Security** | HTTPS, CORS, CSRF protection |

---

**Next**: Implement backend with Node.js/Express  
**Files Needed**: API routes, controllers, middleware, validators
