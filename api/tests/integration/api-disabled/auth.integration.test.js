/**
 * Authentication API Integration Tests
 * Tests the complete authentication flow with real database interactions
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');

// Create a simple Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock routes for testing
app.post('/api/v1/auth/register', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.post('/api/v1/auth/login', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.post('/api/v1/auth/refresh-token', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.post('/api/v1/auth/forgot-password', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.post('/api/v1/auth/reset-password', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

describe('Authentication API Integration Tests', () => {
  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.phone).toBe(userData.phone);
      expect(user.is_email_verified).toBe(false); // Should be false initially
      
      // Verify password was hashed
      expect(user.password).not.toBe(userData.password);
      const isPasswordValid = await bcrypt.compare(userData.password, user.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          // Missing email, password, phone
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123', // Too short
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      // Register user first time
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          name: 'Jane Doe',
          phone: '+1234567891'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;
    const testPassword = 'password123';

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '+1234567890',
        is_email_verified: true
      });
    });

    it('should login user successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify token is valid
      const decoded = jwt.verify(
        response.body.data.token,
        process.env.JWT_SECRET || 'test-secret'
      );
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for unverified user', async () => {
      // Create unverified user
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      const unverifiedUser = await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: hashedPassword,
        phone: '+1234567891',
        is_email_verified: false
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: unverifiedUser.email,
          password: testPassword
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please verify your email before logging in');
    });

    it('should update last login timestamp', async () => {
      const originalLastLogin = testUser.lastLogin;

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testPassword
        })
        .expect(200);

      // Check if lastLogin was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin).not.toEqual(originalLastLogin);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      // Create test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        is_email_verified: true
      });

      // Generate valid token
      validToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should refresh token successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');

      // Verify new token is valid and different
      expect(response.body.data.token).not.toBe(validToken);
      const decoded = jwt.verify(
        response.body.data.token,
        process.env.JWT_SECRET || 'test-secret'
      );
      expect(decoded.userId).toBe(testUser._id.toString());
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 401 with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token expired');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        is_email_verified: true
      });
    });

    it('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');

      // Verify reset token was set in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeInstanceOf(Date);
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found with this email');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let testUser;
    let resetToken;

    beforeEach(async () => {
      // Create reset token
      resetToken = 'test-reset-token-123';
      const hashedResetToken = await bcrypt.hash(resetToken, 12);

      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        is_email_verified: true,
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      });
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successful');

      // Verify password was changed and reset fields cleared
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isNewPasswordValid).toBe(true);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for expired token', async () => {
      // Update user with expired token
      await User.findByIdAndUpdate(testUser._id, {
        resetPasswordExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: '123' // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        is_email_verified: true
      });

      authToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user._id).toBe(testUser._id.toString());
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});
