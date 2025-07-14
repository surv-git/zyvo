# Authentication System Documentation

## Overview

The Authentication System provides comprehensive user authentication and authorization for the e-commerce API, including user registration, login, logout, token refresh, and password reset functionality. The system implements industry best practices for security and follows JWT-based authentication with refresh tokens.

## Features

### Core Authentication
- **User Registration**: Secure user account creation with validation
- **User Login**: JWT-based authentication with access and refresh tokens
- **User Logout**: Secure token invalidation
- **Token Refresh**: Automatic token renewal without re-authentication
- **Password Reset**: Secure password reset via email

### Security Features
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Separate access and refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **HttpOnly Cookies**: Secure refresh token storage

### Email Integration
- **Password Reset Emails**: Automated password reset links
- **Welcome Emails**: User onboarding emails
- **Email Verification**: Account verification system
- **Template Support**: HTML and text email templates

## API Endpoints

### Authentication Endpoints

#### User Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

#### User Logout
```bash
POST /api/auth/logout
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Token Refresh
```bash
POST /api/auth/refresh-token
# Note: Refresh token is automatically sent via HttpOnly cookie
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password
```bash
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

#### Get Profile
```bash
GET /api/auth/profile
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "loginCount": 5
  }
}
```

## Token System

### Access Tokens
- **Purpose**: API access authentication
- **Expiration**: 15 minutes (configurable)
- **Storage**: Client-side (localStorage/memory)
- **Usage**: Bearer token in Authorization header

### Refresh Tokens
- **Purpose**: Access token renewal
- **Expiration**: 7 days (configurable)
- **Storage**: HttpOnly cookies
- **Usage**: Automatic inclusion in requests

### Token Structure
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "role": "user",
  "iat": 1642243800,
  "exp": 1642244700,
  "iss": "zyvo-api",
  "aud": "zyvo-users"
}
```

## Security Implementation

### Password Requirements
- **Minimum Length**: 8 characters
- **Maximum Length**: 128 characters
- **Complexity**: Must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character (@$!%*?&)

### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour
- **Registration**: Standard rate limiting

### Input Validation
```javascript
// Registration validation
name: {
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z\s]+$/
}

email: {
  format: 'email',
  normalized: true
}

password: {
  minLength: 8,
  maxLength: 128,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
}
```

### Cookie Security
```javascript
{
  httpOnly: true,           // Prevent XSS attacks
  secure: true,            // HTTPS only in production
  sameSite: 'strict',      // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

## Email Configuration

### Environment Variables
```bash
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@zyvo.com
```

### Email Templates
- **Password Reset**: Professional HTML template with expiration warning
- **Welcome Email**: User onboarding with next steps
- **Email Verification**: Account verification links

## Error Handling

### Common Error Responses

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

#### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

## Middleware Usage

### Authentication Middleware
```javascript
const { authMiddleware } = require('./middleware/auth.middleware');

// Protected route
router.get('/protected', authMiddleware, (req, res) => {
  // req.user contains authenticated user data
  res.json({ user: req.user });
});
```

### Optional Authentication
```javascript
const { optionalAuthMiddleware } = require('./middleware/auth.middleware');

// Route with optional authentication
router.get('/public', optionalAuthMiddleware, (req, res) => {
  // req.user exists if user is authenticated, undefined otherwise
  const message = req.user ? 'Authenticated' : 'Anonymous';
  res.json({ message });
});
```

### Admin Authorization
```javascript
const { adminAuthMiddleware } = require('./middleware/admin.middleware');

// Admin-only route
router.get('/admin', authMiddleware, adminAuthMiddleware, (req, res) => {
  // User is authenticated and has admin role
  res.json({ message: 'Admin access granted' });
});
```

## Database Schema

### User Model Extensions
```javascript
{
  // ... existing fields
  resetPasswordToken: String,      // Hashed reset token
  resetPasswordExpires: Date,      // Token expiration time
  loginCount: Number,              // Login attempt counter
  lastLogin: Date                  // Last successful login
}
```

### Indexes
```javascript
// Performance optimization
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ resetPasswordExpires: 1 });
```

## Testing

### Unit Tests
```javascript
describe('Authentication Controller', () => {
  test('should register new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBeDefined();
  });
});
```

### Integration Tests
```javascript
describe('Authentication Flow', () => {
  test('should complete full auth flow', async () => {
    // Register -> Login -> Access Protected Route -> Logout
    const user = await registerUser();
    const loginResponse = await loginUser(user);
    const token = loginResponse.body.accessToken;
    
    await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## Client-Side Integration

### JavaScript Example
```javascript
class AuthService {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Include cookies
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.accessToken;
      localStorage.setItem('accessToken', this.token);
    }
    
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.accessToken;
      localStorage.setItem('accessToken', this.token);
    }
    
    return data;
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.accessToken;
      localStorage.setItem('accessToken', this.token);
    }
    
    return data;
  }

  async logout() {
    await fetch(`${this.baseURL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      credentials: 'include',
    });

    this.token = null;
    localStorage.removeItem('accessToken');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }
}
```

## Production Deployment

### Environment Variables
```bash
# Required for production
JWT_SECRET=your-256-bit-secret-key
JWT_REFRESH_SECRET=your-different-256-bit-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email service (choose one)
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Enable CORS for specific origins
- [ ] Use strong JWT secrets (256-bit)
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits
- [ ] Implement CSP headers

## Troubleshooting

### Common Issues

#### Token Validation Errors
```bash
# Check if JWT secrets are set
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET

# Verify token format
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/auth/profile
```

#### Email Service Issues
```bash
# Test email configuration
npm run setup:auth

# Check SMTP settings
node -e "console.log(process.env.SMTP_HOST)"
```

#### Cookie Issues
```bash
# Check if cookies are being set
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zyvo.com","password":"Admin123!@#"}'

# Use cookies for refresh
curl -b cookies.txt -X POST http://localhost:3000/api/auth/refresh-token
```

## Future Enhancements

### Planned Features
- Multi-factor authentication (MFA)
- Social authentication (Google, Facebook)
- Session management dashboard
- Advanced password policies
- Account lockout mechanisms
- Audit logging
- Device management
- Single sign-on (SSO)

### Extension Points
- Custom authentication providers
- Additional password complexity rules
- Custom email templates
- Integration with external user stores
- Advanced rate limiting strategies
- Biometric authentication support

## API Documentation

The complete API documentation is available at `/api/docs` when the server is running. It includes:

- Interactive API testing
- Request/response examples
- Authentication requirements
- Rate limiting information
- Error code explanations

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Test with the provided examples
- Verify environment configuration
- Check server logs for detailed error messages
