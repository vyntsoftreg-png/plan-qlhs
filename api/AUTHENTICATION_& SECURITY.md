# 🔐 API Authentication & Security

## 1. AUTHENTICATION FLOW

```
┌──────────────┐                                    ┌──────────────┐
│   Frontend   │                                    │   Backend    │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │─── POST /auth/login ────────────────────────────>│
       │  {email, password}                               │
       │                                                  │
       │                    [Verify credentials]          │
       │                    [Generate tokens]             │
       │                                                  │
       │<─── 200 OK + tokens ──────────────────────────── │
       │  {accessToken, refreshToken}                     │
       │                                                  │
       │  [Store in localStorage/sessionStorage]          │
       │                                                  │
       │─── GET /children ─────────────────────────────> │
       │  Authorization: Bearer {accessToken}            │
       │                                                  │
       │                  [Verify JWT signature]          │
       │                  [Check expiration]              │
       │                  [Check permissions]             │
       │                                                  │
       │<─── 200 OK + children data ────────────────────│
       │                                                  │
       │ [After 1 hour: token expires]                    │
       │                                                  │
       │─── POST /auth/refresh-token ──────────────────>│
       │  {refreshToken}                                 │
       │                                                  │
       │<─── 200 OK + new accessToken ──────────────── │
       │                                                  │
       │─── GET /children ─────────────────────────────>│
       │  Authorization: Bearer {newAccessToken}         │
       │                                                  │
       │<─── 200 OK ───────────────────────────────────│
       │                                                  │
       │─── POST /auth/logout ──────────────────────────>│
       │  Authorization: Bearer {accessToken}            │
       │                                                  │
       │                [Blacklist token]                │
       │                [Clear refresh]                  │
       │                                                  │
       │<─── 200 OK ───────────────────────────────────│
       │                                                  │
```

---

## 2. JWT TOKEN DETAILS

### Token Structure

```
Header (mã hóa base64):
{
  "alg": "HS256",           // Algorithm
  "typ": "JWT"              // Type
}

Payload (mã hóa base64):
{
  "sub": "1",               // User ID (subject)
  "email": "teacher@qlhs.com",
  "fullName": "Võ Thị Thanh Thúy",
  "role": "teacher",        // teacher|admin|principal|parent
  "kindergarten_id": 1,
  "permissions": [
    "read:children",
    "write:plans",
    "read:skills"
  ],
  "iat": 1681561200,        // Issued at
  "exp": 1681647600,        // Expires at (3600 sec = 1 hour)
  "iss": "qlhs.local",      // Issuer
  "aud": "qlhs-app"         // Audience
}

Signature (HMAC SHA256):
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

### Sample Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZWFjaGVyQHFsaHMuY29tIiwiZnVsbE5hbWUiOiJWw7Abb0TDoSBJ
Iiwicm9sZSI6InRlYWNoZXIiLCJraW5kZXJnYXJ0ZW5faWQiOjEsImlhdCI6MTY4MTU2MTIwMCwiZXhwI
joxNjgxNjQ3NjAwfQ.
WDd1qmkAYE1x6Xq-xCGZvWZSRVEj7Bvq7jK6x8vP0sE
```

### Token Expiration Strategy

```
Access Token:
- Duration: 1 hour
- Used for API requests
- Stored in memory (secure)
- Expires frequently for security

Refresh Token:
- Duration: 7 days
- Used to get new access token
- Stored in httpOnly cookie or localStorage
- Auto-refresh before expiration
- Can be revoked on logout

Token Refresh Timeline:
Hour 0:55:00    → Frontend detects expiration soon
               → Auto-call /auth/refresh-token
               → Get new accessToken
               → Continue requests seamlessly
```

---

## 3. PERMISSION MATRIX

### Role-Based Access Control (RBAC)

#### Admin
```
✅ Users: Create, Read, Update, Delete (all)
✅ Children: Create, Read, Update, Delete (all)
✅ Plans: Create, Read, Update, Delete (all), Approve
✅ Skills: Create, Read, Update, Delete
✅ Templates: Create, Read, Update, Delete
✅ Kindergartens: Create, Read, Update, Delete
✅ Reports: Access all
✅ Settings: Full access
```

#### Principal
```
✅ Children: Read (own kindergarten)
✅ Plans: Read, Update, Approve (own kindergarten)
✅ Teachers: Read (own kindergarten)
✅ Reports: View (own kindergarten)
✅ Templates: Read, Use
❌ Cannot create users
❌ Cannot delete plans
```

#### Teacher
```
✅ Own Profile: Read, Update
✅ Children: Read (assigned), Create, Update
✅ Plans: Create (own), Read, Update, Submit
✅ Evaluations: Write (own plans)
✅ Skills: Read
✅ Templates: Read, Use
❌ Cannot approve plans
❌ Cannot edit other teacher's plans
❌ Cannot access other children
```

#### Parent (Read-only)
```
✅ Own Child: Read
✅ Own Child's Plans: Read
✅ Own Child's Progress: Read
✅ Skills: Read (informational)
❌ Cannot create/edit
❌ Cannot see other children
```

### Permission Checking Middleware

```js
// Example: Check if teacher can edit plan
async function canEditPlan(userId, planId) {
  const plan = await Plan.findById(planId);
  const user = await User.findById(userId);
  
  // Admin can do anything
  if (user.role === 'admin') return true;
  
  // Principal can edit plans in own kindergarten
  if (user.role === 'principal') {
    return plan.kindergarten_id === user.kindergarten_id;
  }
  
  // Teacher can only edit own plans
  if (user.role === 'teacher') {
    return plan.teacher_id === userId;
  }
  
  return false;
}
```

---

## 4. SECURITY BEST PRACTICES

### Password Requirements
```
Minimum 8 characters
Must contain:
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

Examples:
✅ SecurePass123!
✅ TeacherQ#2026
✅ QLhs@Demo789
❌ password123 (no uppercase/special)
❌ Pass123 (too short)
```

### Password Storage
```
1. Generate random salt: cost = 10
2. Hash password with bcrypt: hash = bcrypt(password, salt)
3. Store only hash in database
4. Never store plain password

Example:
bcrypt.hash('SecurePass123!', 10)
→ $2b$10$KIXxPfxQDQTJ5r3DslW4Ne3YPzgPqqDq6P/p4VL/JC7T7N4cPB8qe
```

### Credential Validation
```js
// On login
async function validateLogin(email, passwordAttempt) {
  const user = await User.findByEmail(email);
  
  if (!user) {
    // Generic error - don't reveal user doesn't exist
    throw new AuthError('Invalid email or password');
  }
  
  const passwordMatches = await bcrypt.compare(
    passwordAttempt,
    user.password_hash
  );
  
  if (!passwordMatches) {
    throw new AuthError('Invalid email or password');
    // Log failed attempt for security
    logFailedLogin(email, req.ip);
  }
  
  // Update last_login
  user.last_login = new Date();
  await user.save();
  
  return user;
}
```

### HTTPS & Transport Security
```
✅ All API endpoints use HTTPS only
✅ HTTP redirects to HTTPS
✅ HSTS header: Strict-Transport-Security: max-age=31536000

Policy:
- Staging: Self-signed cert for testing
- Production: Valid SSL/TLS certificate
- Annual renewal before expiration
```

### CORS Configuration
```js
const corsOptions = {
  origin: [
    'http://localhost:3000',      // Dev
    'https://app.qlhs.local',     // Staging
    'https://qlhs.vn'             // Production
  ],
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### SQL Injection Prevention
```js
// ❌ VULNERABLE: Never do this
const plan = await db.query(
  `SELECT * FROM plans WHERE id = ${planId}`
);

// ✅ SAFE: Use parameterized queries
const plan = await db.query(
  'SELECT * FROM plans WHERE id = $1',
  [planId]
);

// ✅ SAFE: Use ORM (Sequelize, Prisma)
const plan = await Plan.findByPk(planId);
```

### XSS Prevention
```js
// ✅ Auto-escaped by JSON serialization
res.json({
  notes: '<script>alert("xss")</script>'
  // Will be: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
});

// ✅ Sanitize user input
const sanitize = (input) => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 255);
};

const notes = sanitize(req.body.notes);
```

### CSRF Protection
```
CSRF Token Flow:
1. GET /initialize → Return CSRF token in response
2. Frontend stores token
3. POST /plans → Include token in X-CSRF-Token header
4. Backend verifies token matches session

Implementation:
- Use csrf npm package
- Read token from form/header
- Verify against session
- Regenerate after login
```

---

## 5. ERROR RESPONSES

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header is missing",
    "timestamp": "2026-04-13T10:30:00Z"
  }
}
```

### Invalid Token (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token",
    "timestamp": "2026-04-13T10:30:00Z"
  }
}
```

### Token Expired (401)
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Your session has expired. Please login again.",
    "timestamp": "2026-04-13T10:30:00Z"
  }
}
```

### Forbidden / No Permission (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource",
    "detail": "Only admin can delete users"
  }
}
```

---

## 6. LOGOUT & SESSION MANAGEMENT

### Logout Flow
```js
POST /auth/logout
Authorization: Bearer {accessToken}

Backend:
1. Validate token is valid
2. Add token to blacklist (Redis/cache)
   - Key: `blacklist:{token_id}`
   - TTL: token expiration time
3. Remove refresh token from database
4. Clear any session cookies
5. Return success

Frontend:
1. Remove accessToken from memory
2. Remove refreshToken from storage
3. Clear user state
4. Redirect to login page
```

### Refresh Token Rotation
```
Best Practice: Rotate refresh tokens on each use

Flow:
1. User calls /auth/refresh-token with old refresh token
2. Backend validates old refresh token
3. Backend blacklists old refresh token
4. Backend generates new access token
5. Backend generates new refresh token
6. Return both tokens
7. Frontend updates both tokens

This prevents:
- Replay attacks
- Leaked token reuse
- Long-lived exposure
```

### Session Timeout
```
Inactivity Timeout:
- Monitor last API request timestamp
- If > 30 minutes: auto-logout
- Show warning at 25 minutes
- Re-authenticate on next request

Implementation:
- Track lastActivity in session
- Middleware checks: now - lastActivity > 30 min
- Extend session on each request
- Return 401 if expired
```

---

## 7. RATE LIMITING & DDoS PROTECTION

### Rate Limit Strategy
```
Per User:
- Authenticated: 100 requests/minute
- Admin: 500 requests/minute
- Anonymous: 10 requests/minute

Per IP:
- Global: 1000 requests/minute
- Burst: 50 requests/second

Sliding Window Algorithm:
- Current window: now - 60 seconds
- Count requests in window
- Reject if > limit
- Timestamp each request
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1681647600

When Limit Exceeded (429):
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retry_after": 45,
    "reset_at": "2026-04-13T11:00:00Z"
  }
}
```

### Implementation (Redis-based)
```js
const rateLimit = async (userId, limit = 100) => {
  const key = `ratelimit:${userId}`;
  const now = Math.floor(Date.now() / 1000);
  const window = now - 60; // 1 minute window
  
  // Remove old requests
  await redis.zremrangebyscore(key, 0, window);
  
  // Count current window
  const count = await redis.zcard(key);
  
  if (count >= limit) {
    throw new RateLimitError(limit);
  }
  
  // Add current request
  await redis.zadd(key, now, uuid());
  
  // Set expiration
  await redis.expire(key, 60);
  
  return count + 1;
};
```

---

## 8. AUDIT LOGGING

### What Gets Logged
```
✅ Login attempts (success/failure) + IP
✅ Token generation/refresh
✅ Create/Update/Delete operations
✅ File uploads
✅ Plan approvals
✅ Evaluation submissions
✅ Permission checks (failed only)
✅ Admin actions
❌ Password changes (but recorded as event)
❌ Read operations (too much data)
```

### Log Format
```json
{
  "timestamp": "2026-04-13T10:30:00Z",
  "user_id": 2,
  "user_email": "teacher@qlhs.com",
  "action": "UPDATE",
  "entity_type": "EducationPlan",
  "entity_id": 1,
  "old_value": { "status": "draft" },
  "new_value": { "status": "completed" },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "success"
}
```

---

## 9. API SECURITY CHECKLIST

- [ ] All endpoints require authentication (except /auth)
- [ ] All inputs validated & sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (JSON escaping)
- [ ] CSRF protection enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Password hashing (bcrypt)
- [ ] JWT expiration set
- [ ] Refresh token rotation
- [ ] Error messages don't leak info
- [ ] Audit logging enabled
- [ ] Dependencies updated
- [ ] Secrets in environment variables
- [ ] API keys rotated regularly
- [ ] OWASP Top 10 reviewed

---

## 10. COMMON SECURITY MISTAKES TO AVOID

❌ **Never store plain passwords** → Use bcrypt, Argon2
❌ **Never expose user IDs in errors** → Generic messages
❌ **Never log sensitive data** → Redact passwords
❌ **Never trust user input** → Validate everything
❌ **Never hardcode secrets** → Use environment variables
❌ **Never use MD5/SHA1** → Use bcrypt/Argon2
❌ **Never skip HTTPS** → Always use TLS
❌ **Never mix up encoding/hashing** → Hash for security, encode for format
❌ **Never cache sensitive data** → Be careful with JWT in localStorage
❌ **Never disable CORS** → Configure properly

---

**Production Deployment Checklist**:
- [ ] SSL/TLS certificate installed
- [ ] Environment variables configured
- [ ] Rate limiting active
- [ ] Logging enabled
- [ ] Monitoring set up
- [ ] Backups verified
- [ ] Security headers enabled
- [ ] Dependencies audited
