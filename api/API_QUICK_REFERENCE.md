# 📚 API Quick Reference Guide

## 1. QUICK START EXAMPLES

### Example 1: User Registration & Login

```bash
# 1. Register
curl -X POST https://api.qlhs.local/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!",
    "fullName": "Võ Thị Thanh Thúy",
    "kindergarten_id": 1,
    "role": "teacher"
  }'

Response:
{
  "success": true,
  "data": { "id": 1, "email": "...", ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# 2. Login
curl -X POST https://api.qlhs.local/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!"
  }'

Response:
{
  "success": true,
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}

# 3. Use Token
curl -X GET https://api.qlhs.local/v1/children \
  -H "Authorization: Bearer eyJ..."
```

---

### Example 2: Create Education Plan (5 minutes)

```bash
# 1. Get available templates
curl -X GET "https://api.qlhs.local/v1/templates?age_group=4-5 tuổi" \
  -H "Authorization: Bearer {token}"

Response:
[
  {
    "id": 1,
    "name": "Mẫu KH Tháng 4-5/2026 cho trẻ 4-5 tuổi",
    "skills_count": 14
  }
]

# 2. Create plan from template (1 click for giáo viên)
curl -X POST https://api.qlhs.local/v1/plans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "month": 4,
    "year": 2026,
    "template_id": 1
  }'

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "child_id": 1,
    "skills_count": 14,
    "status": "draft"
  }
}

# 3. Get plan detail with all skills
curl -X GET https://api.qlhs.local/v1/plans/1 \
  -H "Authorization: Bearer {token}"

Response includes:
- Child info
- All 4 areas with skills
- Instruction text
- Images
- Teaching methods
- Ready to print/view

# 4. Evaluate a skill (30 seconds each × 14 = 7 minutes)
for i in {1..14}; do
  curl -X POST https://api.qlhs.local/v1/plans/1/evaluate \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d "{
      \"plan_skill_id\": $i,
      \"status\": \"achieved\",
      \"notes\": \"Trẻ đạt\"
    }"
done

# 5. Submit for approval
curl -X POST https://api.qlhs.local/v1/plans/1/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Hoàn thành đánh giá tháng 4"
  }'

# 6. Export PDF
curl -X GET https://api.qlhs.local/v1/plans/1/export-pdf \
  -H "Authorization: Bearer {token}" \
  -O KH_Yen_Nhi_4_2026.pdf

# Done! Total: ~15 minutes (vs 1-2 hours by hand)
```

---

## 2. ENDPOINT SUMMARY TABLE

| Method | Endpoint | Purpose | Auth | Roles |
|--------|----------|---------|------|-------|
| POST | /auth/register | Register user | ❌ | - |
| POST | /auth/login | Login | ❌ | - |
| POST | /auth/refresh-token | Refresh token | ❌ | - |
| GET | /children | List children | ✅ | teacher, admin |
| POST | /children | Create child | ✅ | admin, principal |
| GET | /children/:id | Get child | ✅ | teacher, admin |
| PUT | /children/:id | Update child | ✅ | teacher, admin |
| DELETE | /children/:id | Delete child | ✅ | admin |
| GET | /children/:id/progress | Child progress | ✅ | teacher, admin |
| GET | /plans | List plans | ✅ | teacher, admin |
| POST | /plans | Create plan | ✅ | teacher, admin |
| GET | /plans/:id | Get plan | ✅ | teacher, admin |
| PUT | /plans/:id | Update plan | ✅ | teacher, admin |
| DELETE | /plans/:id | Delete plan | ✅ | teacher, admin |
| POST | /plans/:id/submit | Submit plan | ✅ | teacher |
| POST | /plans/:id/approve | Approve plan | ✅ | principal, admin |
| GET | /plans/:id/export-pdf | Export PDF | ✅ | teacher, admin |
| GET | /plans/:id/export-excel | Export Excel | ✅ | teacher, admin |
| POST | /plans/:id/evaluate | Add evaluation | ✅ | teacher |
| GET | /areas | List areas | ✅ | all |
| GET | /areas/:id/skills | List skills | ✅ | all |
| GET | /skills/:id | Get skill detail | ✅ | all |
| GET | /templates | List templates | ✅ | all |
| POST | /templates | Create template | ✅ | admin |
| GET | /templates/:id | Get template | ✅ | all |

---

## 3. ERROR HANDLING EXAMPLES

### Validation Error (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "date_of_birth",
        "message": "Invalid date format. Use YYYY-MM-DD",
        "received": "16/10/2021"
      },
      {
        "field": "email",
        "message": "Email already exists",
        "received": "teacher@school.com"
      }
    ]
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

### Permission Error (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action",
    "detail": "Only admin and principal can approve plans"
  }
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 45,
    "reset_at": "2026-04-13T11:05:00Z"
  }
}
```

---

## 4. RESPONSE FORMATS

### List Response (All GET list endpoints)
```json
{
  "success": true,
  "data": [{ ... }, { ... }],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "pages": 8,
    "current_page": 1
  }
}
```

### Single Record Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Create/Update Response
```json
{
  "success": true,
  "message": "Resource created/updated successfully",
  "data": { ... }
}
```

### Delete Response
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

---

## 5. QUERY PARAMETER EXAMPLES

### Pagination
```
GET /children?limit=50&offset=100
  → Skip first 100, return 50 records
```

### Filtering
```
GET /plans?status=draft
GET /plans?month=4&year=2026
GET /plans?teacher_id=2
GET /children?is_active=true
```

### Searching
```
GET /children?search=Yến
GET /plans?search=nhi
  → Wildcard search on name fields
```

### Sorting
```
GET /children?sort_by=fullName&sort_order=asc
GET /plans?sort_by=created_at&sort_order=desc
```

### Combined
```
GET /plans?month=4&year=2026&status=submitted&limit=20&offset=0
```

---

## 6. HEADERS REFERENCE

### Request Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept: application/json
X-Request-ID: req_123456    (optional, for tracing)
X-API-Version: v1           (optional)
```

### Response Headers
```
Content-Type: application/json; charset=utf-8
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1681647600
X-Request-ID: req_123456
ETag: "12345678"
Cache-Control: public, max-age=300
```

---

## 7. HTTP STATUS CODES

```
2xx Success:
  200 OK - Request successful
  201 Created - Resource created
  204 No Content - Success, no body

4xx Client Error:
  400 Bad Request - Invalid input
  401 Unauthorized - Auth required
  403 Forbidden - No permission
  404 Not Found - Resource doesn't exist
  409 Conflict - Duplicate/conflict
  422 Validation Error - Field validation
  429 Rate Limited - Too many requests

5xx Server Error:
  500 Internal Error - Server error
  503 Service Unavailable - Maintenance
```

---

## 8. COMMON WORKFLOWS

### Workflow 1: Teacher Creates Monthly Plan (5-10 min)

```
1. Login
   POST /auth/login

2. View children
   GET /children

3. View templates
   GET /templates?age_group=4-5

4. Create plan from template
   POST /plans

5. View plan details
   GET /plans/:id

6. Enter evaluations (14 skills)
   POST /plans/:id/evaluate × 14

7. Submit for approval
   POST /plans/:id/submit

8. Export PDF
   GET /plans/:id/export-pdf

Total time: ~5-10 minutes
```

### Workflow 2: Principal Approves Plans

```
1. Login
   POST /auth/login

2. List submitted plans
   GET /plans?status=submitted

3. Review plan
   GET /plans/:id

4. Approve plan
   POST /plans/:id/approve

Notes:
- Only see plans from own kindergarten
- Bulk approval available (future)
```

### Workflow 3: Parent Checks Child Progress

```
1. Login
   POST /auth/login (parent account)

2. View child info
   GET /children/:id

3. Check progress
   GET /children/:id/progress?month=4&year=2026

4. View latest plan (read-only)
   GET /plans/:id (limited access)

Notes:
- Parent can only see own child
- Read-only access
- No evaluation data visible
```

---

## 9. PAYMENT/INTEGRATION POINTS

For future enhancements:

```
Stripe Integration:
POST /payments/create-subscription
POST /payments/update-plan
GET /payments/invoices

File Storage (Cloudinary):
POST /upload/image
DELETE /upload/image/:id
GET /upload/list

Email Notifications:
POST /notifications/email
POST /notifications/sms

Analytics:
GET /analytics/monthly-stats
GET /analytics/teacher-performance
GET /analytics/child-progress
```

---

## 10. API VERSIONING

```
Current: /v1/
  → All current endpoints

Future: /v2/ (if breaking changes)
  → New logic
  → Keep /v1/ for 6 months
  → Provide migration guide

Deprecation Notice (in /v1 responses):
X-API-Deprecated: true
X-API-Sunset: 2026-12-31T00:00:00Z
```

---

## 11. SDK PLACEHOLDER (for future)

```js
// Future SDK for easier integration
import QLHS from '@qlhs/sdk';

const client = new QLHS({
  apiKey: 'sk_live_...',
  baseURL: 'https://api.qlhs.local/v1'
});

// Subscribe to auth events
client.on('login', (user) => {
  console.log('User logged in:', user);
});

client.on('token-refresh', (tokens) => {
  // Auto-save new tokens
});

// Easy API calls
const children = await client.children.list();
const plan = await client.plans.get(1);
await client.plans.submitForApproval(1);
const pdf = await client.plans.exportPDF(1);
```

---

## 12. RATE LIMITS & QUOTAS

```
Per User:
- Authenticated: 100 requests/minute
- Admin: 500 requests/minute
- File uploads: 10 per minute
- Export: 5 per minute

Per Institution:
- Child records: Unlimited
- Plans: Unlimited
- Evaluations: Unlimited
- Storage: 10GB (extensible)

Soft Limits:
- API timeout: 30 seconds
- Response size: 10MB
- Batch operations: 100 items max
```

---

## 13. DEBUGGING & LOGS

### Request ID Tracing
```
Every request gets X-Request-ID header for debugging:

curl -X GET https://api.qlhs.local/v1/plans \
  -H "Authorization: Bearer {token}" \
  -H "X-Request-ID: req_abc123"

Response:
X-Request-ID: req_abc123

All logs tagged with same ID for tracing
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Use /auth/login to get token |
| 403 Forbidden | No permission | Check role & kindergarten_id |
| 404 Not Found | Resource doesn't exist | Verify ID exists |
| 409 Conflict | Duplicate entry | Change email/plan month-year |
| 422 Validation Error | Invalid format | Check date format, required fields |
| 429 Rate Limit | Too many requests | Wait and retry after X seconds |
| 500 Server Error | Backend issue | Report with X-Request-ID |

---

## 14. POSTMAN COLLECTION

Ready-to-import Postman collection (available in repo):
- Pre-configured requests
- Environment variables
- Test scripts
- Mock responses
- Share with team easily

Download: `qlhs-api-postman-collection.json`

---

## 15. CURL EXAMPLES

All examples use curl format:
```bash
curl -X METHOD https://api.qlhs.local/v1/endpoint \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "field": "value" }'
```

Replace:
- `{token}` - Your JWT access token
- `{id}` - Resource ID
- `METHOD` - GET, POST, PUT, DELETE

---

**Documentation URL**: https://docs.qlhs.local  
**API Base URL**: https://api.qlhs.local/v1  
**Support**: support@qlhs.vn  
**Issues**: issues@qlhs.vn
