# Authentication Middleware Documentation

## Overview
This authentication system provides comprehensive JWT-based authentication and authorization for the LegalConnect API.

## Middleware Functions

### 1. `authenticate`
**Purpose**: Verifies JWT tokens and adds user information to the request object.

**Usage**:
```typescript
import { authenticate } from '../middlewares/Auth.middleware';

router.get('/protected-route', authenticate, (req, res) => {
  // req.user is now available with user information
  res.json({ user: req.user });
});
```

**What it does**:
- Extracts JWT token from Authorization header (`Bearer <token>`)
- Verifies token signature and expiration
- Checks if user exists and is active in database
- Adds user info to `req.user`

**Response on failure**:
- 401: Missing token, invalid format, expired token, user not found, or inactive account
- 500: Internal server error

### 2. `authorize(...roles)`
**Purpose**: Restricts access based on user roles.

**Usage**:
```typescript
import { authenticate, authorize } from '../middlewares/Auth.middleware';

// Only admins can access
router.get('/admin-only', authenticate, authorize('ADMIN'), controller.method);

// Lawyers and admins can access
router.get('/lawyer-route', authenticate, authorize('LAWYER', 'ADMIN'), controller.method);
```

**Available roles**: `CLIENT`, `LAWYER`, `ADMIN`

**Response on failure**:
- 401: Authentication required (if used without authenticate)
- 403: Insufficient permissions

### 3. `optionalAuth`
**Purpose**: Adds user info if token is provided, but doesn't require authentication.

**Usage**:
```typescript
import { optionalAuth } from '../middlewares/Auth.middleware';

router.get('/public-with-user-context', optionalAuth, (req, res) => {
  if (req.user) {
    // User is authenticated
    res.json({ message: 'Hello ' + req.user.firstName });
  } else {
    // Anonymous user
    res.json({ message: 'Hello anonymous user' });
  }
});
```

### 4. `requireOwnership`
**Purpose**: Ensures users can only access their own resources (admins can access all).

**Usage**:
```typescript
import { authenticate, requireOwnership } from '../middlewares/Auth.middleware';

// User can only access their own profile (/users/:id where id matches their user ID)
router.get('/users/:id', authenticate, requireOwnership, controller.getUser);

// Also works with userId parameter
router.get('/profiles/:userId', authenticate, requireOwnership, controller.getProfile);
```

**How it works**:
- Compares `req.user.id` with `req.params.id` or `req.params.userId`
- Admins bypass this check
- Returns 403 if user tries to access someone else's resource

### 5. `rateLimit(maxRequests, windowMs)`
**Purpose**: Limits the number of requests per user/IP within a time window.

**Usage**:
```typescript
import { rateLimit } from '../middlewares/Auth.middleware';

// 100 requests per 15 minutes (default)
router.post('/api/data', rateLimit(), controller.method);

// 5 requests per 15 minutes (for sensitive operations)
router.post('/register', rateLimit(5, 15 * 60 * 1000), controller.register);

// 10 requests per minute
router.post('/login', rateLimit(10, 60 * 1000), controller.login);
```

**Response on limit exceeded**:
- 429: Too many requests with `retryAfter` indicating when to try again

## Request Object Extension

When using `authenticate` or `optionalAuth`, the following is added to the request:

```typescript
req.user = {
  id: string;           // User's unique ID
  email: string;        // User's email
  role: string;         // User's role (CLIENT, LAWYER, ADMIN)
  firstName?: string;   // User's first name (if available)
  lastName?: string;    // User's last name (if available)
}
```

## Complete Route Examples

### Public Routes
```typescript
// Registration with rate limiting
router.post('/register', 
  rateLimit(5, 15 * 60 * 1000),
  validateSchema(registerDto),
  controller.register
);

// Login with rate limiting
router.post('/login', 
  rateLimit(10, 15 * 60 * 1000),
  validateSchema(loginDto),
  controller.login
);
```

### Protected Routes
```typescript
// Get current user profile
router.get('/profile/me', 
  authenticate,
  controller.getCurrentUser
);

// Update own profile
router.put('/profile/:id', 
  authenticate,
  requireOwnership,
  validateSchema(updateUserDto),
  controller.updateUser
);

// Admin only - get all users
router.get('/users', 
  authenticate,
  authorize('ADMIN'),
  controller.getAllUsers
);

// Lawyer and Admin - access legal documents
router.get('/documents', 
  authenticate,
  authorize('LAWYER', 'ADMIN'),
  controller.getDocuments
);
```

### Mixed Access Routes
```typescript
// Public endpoint that shows different content for authenticated users
router.get('/lawyers', 
  optionalAuth,
  controller.getLawyers  // Controller can check req.user to customize response
);
```

## Error Handling

All middleware functions return standardized error responses:

```typescript
{
  success: false,
  message: "Error description"
}
```

Common status codes:
- **401 Unauthorized**: Invalid/missing token, user not found, account inactive
- **403 Forbidden**: Insufficient permissions, ownership violation
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server errors

## Environment Variables

Make sure to set these environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

## Usage Patterns

### Basic Authentication
```typescript
router.get('/protected', authenticate, controller.method);
```

### Role-Based Access
```typescript
router.get('/admin', authenticate, authorize('ADMIN'), controller.method);
```

### Resource Ownership
```typescript
router.put('/users/:id', authenticate, requireOwnership, controller.method);
```

### Combined Middleware
```typescript
router.delete('/users/:id', 
  authenticate,              // Must be logged in
  authorize('ADMIN'),        // Must be admin
  rateLimit(5, 60000),      // Max 5 deletes per minute
  controller.deleteUser
);
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Set strong JWT_SECRET** in environment variables
3. **Use rate limiting** on sensitive endpoints (login, register, password reset)
4. **Validate all inputs** using validation middleware
5. **Log authentication failures** for security monitoring
6. **Use requireOwnership** for user-specific resources
7. **Implement proper role-based access control** using authorize middleware

## Frontend Integration

When making API requests from the frontend, include the JWT token:

```typescript
// In your API calls
const token = localStorage.getItem('authToken');

fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

The token should be obtained from the login endpoint and stored securely in your frontend application.
