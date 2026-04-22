# 📋 PHASE 2: USER MANAGEMENT - IMPLEMENTATION COMPLETE

**Status**: ✅ COMPLETE  
**Date**: April 13, 2026  
**Endpoints Implemented**: 7  
**Test Cases**: 30+

---

## 🎯 PHASE 2 OVERVIEW

**Objective**: Implement user management endpoints (CRUD + activation/deactivation)

**Files Created**:
- [src/services/userService.js](../src/services/userService.js) - Database layer (320 lines)
- [src/controllers/userController.js](../src/controllers/userController.js) - HTTP handlers (270 lines)
- [src/routes/users.js](../src/routes/users.js) - Route definitions (updated from stub)
- [tests/integration/users.test.js](../tests/integration/users.test.js) - Test suite (480+ lines)

---

## 📌 ENDPOINTS IMPLEMENTED

### 1️⃣ GET /api/v1/users
**List all users with filters**

**Authorization**: Admin only  
**Query Parameters**:
- `limit` (optional, default: 20, max: 100) - Results per page
- `offset` (optional, default: 0) - Pagination offset
- `search` (optional) - Search by name or email (case-insensitive)
- `role` (optional) - Filter by role (admin|principal|teacher|parent)

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "teacher@example.com",
        "name": "Võ Thị Thanh Thúy",
        "role": "teacher",
        "kindergarten_id": "uuid",
        "phone": "+84-123-456-789",
        "is_active": true,
        "created_at": "2026-04-13T10:00:00Z",
        "updated_at": "2026-04-13T10:00:00Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45
    }
  },
  "timestamp": "2026-04-13T10:00:00Z"
}
```

**Error Responses**:
- 401 NOT_AUTHENTICATED - Missing authentication token
- 403 FORBIDDEN - Insufficient permissions (non-admin)

---

### 2️⃣ POST /api/v1/users
**Create new user**

**Authorization**: Admin or Principal  
**Request Body**:
```json
{
  "email": "newteacher@example.com",
  "name": "New Teacher",
  "password": "SecurePassword123!",
  "role": "teacher",
  "kindergarten_id": "uuid",
  "phone": "+84-123-456-789"
}
```

**Validation**:
- `email`: Valid email format, unique (not already exists)
- `name`: 2-100 characters
- `password`: 8+ chars, uppercase, lowercase, number, special char
- `role`: One of (admin, principal, teacher, parent)
- `kindergarten_id`: Valid UUID
- `phone`: Optional, valid phone pattern
- `unknown fields`: Stripped (security)

**Response** (201 Created):
```json
{
  "code": "USER_CREATED",
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440014",
    "email": "newteacher@example.com",
    "name": "New Teacher",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-123-456-789",
    "is_active": true,
    "created_at": "2026-04-13T10:15:00Z",
    "updated_at": "2026-04-13T10:15:00Z"
  },
  "timestamp": "2026-04-13T10:15:00Z"
}
```

**Error Responses**:
- 400 VALIDATION_ERROR - Invalid input
- 401 NOT_AUTHENTICATED - Missing authentication
- 403 FORBIDDEN - Non-admin/principal user
- 409 EMAIL_ALREADY_EXISTS - Email already registered

**Side Effects**:
- Password is hashed with bcryptjs (10-round salt)
- User is created with `is_active = true`
- Activity logged to `activity_logs` table

---

### 3️⃣ GET /api/v1/users/:id
**Get single user details**

**Authorization**: 
- User can view own profile
- Admin can view any user

**Response** (200 OK):
```json
{
  "code": "SUCCESS",
  "message": "User retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "email": "teacher@example.com",
    "name": "Võ Thị Thanh Thúy",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-123-456-789",
    "is_active": true,
    "created_at": "2026-04-13T09:00:00Z",
    "updated_at": "2026-04-13T10:00:00Z"
  },
  "timestamp": "2026-04-13T10:20:00Z"
}
```

**Error Responses**:
- 401 NOT_AUTHENTICATED - Missing authentication
- 403 FORBIDDEN - User trying to view another user's profile (non-admin)
- 404 USER_NOT_FOUND - User doesn't exist

---

### 4️⃣ PUT /api/v1/users/:id
**Update user profile**

**Authorization**:
- User can update own profile
- Admin can update any user

**Request Body** (all optional):
```json
{
  "name": "Updated Name",
  "phone": "+84-999-999-999",
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Validation**:
- If `new_password` provided, `current_password` is required
- `current_password` must match existing password
- `new_password`: 8+ chars, uppercase, lowercase, number, special char
- `name`: 2-100 characters if provided
- `phone`: Valid pattern if provided

**Response** (200 OK):
```json
{
  "code": "USER_UPDATED",
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "email": "teacher@example.com",
    "name": "Updated Name",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-999-999-999",
    "is_active": true,
    "created_at": "2026-04-13T09:00:00Z",
    "updated_at": "2026-04-13T10:25:00Z"
  },
  "timestamp": "2026-04-13T10:25:00Z"
}
```

**Error Responses**:
- 400 VALIDATION_ERROR - Invalid input
- 401 NOT_AUTHENTICATED - Missing authentication
- 401 INVALID_PASSWORD - Wrong current password
- 403 FORBIDDEN - User trying to update another user's profile
- 404 USER_NOT_FOUND - User doesn't exist

**Side Effects**:
- If password changed, hashed with bcryptjs
- Activity logged to `activity_logs` table
- `updated_at` timestamp updated

---

### 5️⃣ DELETE /api/v1/users/:id
**Delete user (soft delete)**

**Authorization**: Admin only  
**Business Rules**:
- Cannot delete own account (admin cannot delete self)
- Uses soft delete (sets `deleted_at` timestamp)
- User data is preserved

**Response** (200 OK):
```json
{
  "code": "USER_DELETED",
  "message": "User deleted successfully",
  "timestamp": "2026-04-13T10:30:00Z"
}
```

**Error Responses**:
- 400 CANNOT_DELETE_SELF - Admin trying to delete own account
- 401 NOT_AUTHENTICATED - Missing authentication
- 403 FORBIDDEN - Non-admin user
- 404 USER_NOT_FOUND - User doesn't exist

**Side Effects**:
- Sets `deleted_at = CURRENT_TIMESTAMP`
- User won't appear in queries (WHERE deleted_at IS NULL)
- Activity logged to `activity_logs` table

---

### 6️⃣ PATCH /api/v1/users/:id/deactivate
**Deactivate user account**

**Authorization**: Admin only  
**Effect**: Sets `is_active = false` (user can't login)

**Response** (200 OK):
```json
{
  "code": "USER_DEACTIVATED",
  "message": "User deactivated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "email": "teacher@example.com",
    "name": "Võ Thị Thanh Thúy",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-123-456-789",
    "is_active": false,
    "created_at": "2026-04-13T09:00:00Z",
    "updated_at": "2026-04-13T10:35:00Z"
  },
  "timestamp": "2026-04-13T10:35:00Z"
}
```

**Error Responses**:
- 401 NOT_AUTHENTICATED - Missing authentication
- 403 FORBIDDEN - Non-admin user
- 404 USER_NOT_FOUND - User doesn't exist

---

### 7️⃣ PATCH /api/v1/users/:id/activate
**Activate deactivated user**

**Authorization**: Admin only  
**Effect**: Sets `is_active = true` (user can login again)

**Response** (200 OK):
```json
{
  "code": "USER_ACTIVATED",
  "message": "User activated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "email": "teacher@example.com",
    "name": "Võ Thị Thanh Thúy",
    "role": "teacher",
    "kindergarten_id": "uuid",
    "phone": "+84-123-456-789",
    "is_active": true,
    "created_at": "2026-04-13T09:00:00Z",
    "updated_at": "2026-04-13T10:40:00Z"
  },
  "timestamp": "2026-04-13T10:40:00Z"
}
```

**Error Responses**:
- 401 NOT_AUTHENTICATED - Missing authentication
- 403 FORBIDDEN - Non-admin user
- 404 USER_NOT_FOUND - User doesn't exist

---

## 🔐 SECURITY FEATURES

### Authentication
- All endpoints require valid JWT token
- Token in `Authorization: Bearer {token}` header
- Tokens generated at login

### Authorization
- Role-based access control (RBAC)
- Admin: All endpoints
- Principal: Create users only
- Teacher/Parent: View own profile, update own profile
- Unauthorized requests return 403 FORBIDDEN

### Password Security
- Passwords never stored in plain text
- Hashed with bcryptjs (10-round salt)
- Password strength validation (8+ chars, mixed case, numbers, special chars)
- Current password required to change password
- Password field never returned in responses

### SQL Injection Prevention
- All database queries use parameterized statements
- User input never directly inserted into SQL
- Parameters array: `$1, $2, $3...`

### Data Validation
- Email format and uniqueness validation
- Phone number pattern validation
- Role enum validation
- Name length validation (2-100 chars)
- Unknown fields stripped from requests

### Soft Delete
- `deleted_at` timestamp instead of permanent deletion
- Users with `deleted_at IS NULL` in all queries
- Historical data preserved for auditing

---

## 🗄️ DATABASE SCHEMA

**Table**: `users`

```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
name VARCHAR(100) NOT NULL
password_hash TEXT NOT NULL
role VARCHAR(20) NOT NULL (admin|principal|teacher|parent)
kindergarten_id UUID NOT NULL FOREIGN KEY
phone VARCHAR(20) DEFAULT ''
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted_at TIMESTAMP DEFAULT NULL
```

**Related Tables**:
- `activity_logs` - Every user operation logged
  - user_id, action (user_created|user_updated|user_deleted), details, created_at

---

## 📊 TEST COVERAGE

### Total Test Cases: 30+

**GET /users** (6 tests)
- ✅ List all users (admin)
- ✅ Reject non-admin
- ✅ Reject unauthenticated
- ✅ Search by name
- ✅ Filter by role
- ✅ Pagination works

**GET /users/:id** (5 tests)
- ✅ Get own profile
- ✅ Admin get any profile
- ✅ Reject cross-user access
- ✅ Return 404 for non-existent
- ✅ Require authentication

**POST /users** (8 tests)
- ✅ Create as admin
- ✅ Create as principal
- ✅ Reject non-admin/principal
- ✅ Reject duplicate email
- ✅ Validate required fields
- ✅ Validate email format
- ✅ Validate password strength
- ✅ Validate role

**PUT /users/:id** (7 tests)
- ✅ Update own profile
- ✅ Admin update any
- ✅ Reject cross-user update
- ✅ Change password with verification
- ✅ Reject wrong password
- ✅ Require current password
- ✅ Return 404 for non-existent

**DELETE /users/:id** (4 tests)
- ✅ Delete as admin
- ✅ Reject non-admin
- ✅ Prevent self-deletion
- ✅ Return 404 for non-existent

**PATCH /users/:id/deactivate** (2 tests)
- ✅ Deactivate user
- ✅ Reject non-admin

**PATCH /users/:id/activate** (2 tests)
- ✅ Activate user
- ✅ Reject non-admin

---

## ⚙️ IMPLEMENTATION PATTERNS

### Service Layer Pattern
```javascript
// Controller calls service
const user = await userService.createUser(userData);

// Service handles all business logic and database operations
exports.createUser = async (data) => {
  // Validate
  // Hash password
  // Insert to database
  // Log activity
  // Return result
}
```

### Middleware Chain
```
Route → Authenticate → Authorize → Validate → Controller → Response
```

Example:
```javascript
router.post(
  '/',
  authenticate,           // Verify JWT token
  authorize(['admin']),   // Check role permission
  validate(schema),       // Validate request body
  controller.create       // Execute handler
);
```

### Error Handling
```javascript
// Consistent error response format
{
  "code": "ERROR_CODE",  // Machine-readable
  "message": "User-friendly message",
  "errors": [            // Optional validation details
    { "field": "email", "message": "Already exists" }
  ],
  "timestamp": "ISO-8601"
}
```

### Database Transaction Pattern
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Multiple operations
  await client.query('UPDATE users...');
  await client.query('INSERT activity_logs...');
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 🚀 READY FOR PHASE 3

Phase 2 (User Management) is **100% COMPLETE**. The following patterns are now established and can be replicated for remaining phases:

✅ Service layer (database operations)
✅ Controller layer (HTTP logic)
✅ Route integration
✅ Middleware application
✅ Validation schemas
✅ Error handling
✅ Integration testing
✅ Authorization rules
✅ Activity logging

### Next Phase: Phase 3 - Children Management
- Same patterns as Phase 2
- 5 endpoints for children CRUD
- Estimated: 2-3 hours to implement following this template

---

**Created**: April 13, 2026  
**Last Updated**: April 13, 2026  
**Status**: ✅ Ready for Production Testing
