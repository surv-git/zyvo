/**
 * Authentication Controller Unit Tests
 * Comprehensive test suite for auth.controller.js
 */

const authController = require('../../controllers/auth.controller');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { generateTokens } = require('../../utils/generateTokens');
const { sendEmail } = require('../../utils/sendEmail');
const { sendVerificationEmail, generateEmailVerificationToken } = require('../../utils/sendVerificationEmail');
const { sendVerificationSMS, generateOTP, validateOTPFormat } = require('../../utils/sendVerificationSMS');

// Mock the User model
jest.mock('../../models/User');

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mock utility functions
jest.mock('../../utils/generateTokens');
jest.mock('../../utils/sendEmail');
jest.mock('../../utils/sendVerificationEmail');
jest.mock('../../utils/sendVerificationSMS', () => ({
  sendVerificationSMS: jest.fn(),
  generateOTP: jest.fn(),
  validateOTPFormat: jest.fn()
}));

// Mock bcrypt
jest.mock('bcryptjs');

// Mock jwt
jest.mock('jsonwebtoken');

// Mock crypto
jest.mock('crypto');

describe('Authentication Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = global.mockReq();
    mockRes = global.mockRes();
    mockNext = global.mockNext();
  });

  describe('registerUser', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    };

    it('should register a new user successfully', async () => {
      mockReq.body = validRegistrationData;

      // Mock validation result
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);

      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock user save
      const mockUser = {
        _id: 'user123',
        ...validRegistrationData,
        password: 'hashedPassword',
        is_email_verified: false,
        is_phone_verified: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: 'user123',
          name: validRegistrationData.name,
          email: validRegistrationData.email,
          role: 'user',
          is_email_verified: false,
          is_phone_verified: false
        })
      };

      // Mock User constructor
      User.mockImplementation(() => mockUser);

      // Mock token generation
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      await authController.registerUser(mockReq, mockRes, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.password, 12);
      expect(mockUser.save).toHaveBeenCalledTimes(2); // Once for user creation, once for verification token
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', {
        httpOnly: true,
        secure: false, // NODE_ENV is test
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        accessToken: 'mock-access-token',
        user: expect.objectContaining({
          name: validRegistrationData.name,
          email: validRegistrationData.email
        }),
        verificationStatus: {
          emailVerified: false,
          phoneVerified: false,
          emailVerificationRequired: true
        }
      });
    });

    it('should return 400 for validation errors', async () => {
      mockReq.body = { email: 'invalid-email' };

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid email format' }]
      });

      await authController.registerUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ msg: 'Invalid email format' }]
      });
    });

    it('should return 400 if user with email already exists', async () => {
      mockReq.body = validRegistrationData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      User.findOne.mockResolvedValue({
        email: validRegistrationData.email.toLowerCase()
      });

      await authController.registerUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });

    it('should return 400 if username already taken', async () => {
      mockReq.body = validRegistrationData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      User.findOne.mockResolvedValue({
        name: validRegistrationData.name.toLowerCase(),
        email: 'different@example.com'
      });

      await authController.registerUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username already taken'
      });
    });

    it('should continue registration even if email verification fails', async () => {
      mockReq.body = validRegistrationData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const mockUser = {
        _id: 'user123',
        ...validRegistrationData,
        password: 'hashedPassword',
        is_email_verified: false,
        is_phone_verified: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: 'user123', name: validRegistrationData.name })
      };

      User.mockImplementation(() => mockUser);
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });
      generateEmailVerificationToken.mockReturnValue('mock-email-token');
      sendVerificationEmail.mockRejectedValue(new Error('Email service down'));

      await authController.registerUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.'
      }));
    });
  });

  describe('loginUser', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'SecurePass123!'
    };

    it('should login successfully and return access token', async () => {
      mockReq.body = validLoginData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: validLoginData.email.toLowerCase(),
        password: 'hashedPassword',
        isActive: true,
        is_email_verified: true,
        is_phone_verified: false,
        lastLogin: null,
        loginCount: 0,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: 'user123',
          email: validLoginData.email,
          name: 'John Doe',
          role: 'user'
        })
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(true);

      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      await authController.loginUser(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: validLoginData.email.toLowerCase() });
      expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token',
        user: expect.any(Object),
        verification: {
          is_email_verified: true,
          is_phone_verified: false
        },
        verificationMessage: 'Please verify your phone to access all features.'
      });
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      mockReq.body = validLoginData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authController.loginUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      mockReq.body = validLoginData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: validLoginData.email.toLowerCase(),
        password: 'hashedPassword',
        isActive: true
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(false);

      await authController.loginUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 401 for inactive user', async () => {
      mockReq.body = validLoginData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: validLoginData.email.toLowerCase(),
        password: 'hashedPassword',
        isActive: false
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.loginUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated'
      });
    });

    it('should update lastLogin and loginCount', async () => {
      mockReq.body = validLoginData;

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: validLoginData.email.toLowerCase(),
        password: 'hashedPassword',
        isActive: true,
        is_email_verified: true,
        is_phone_verified: true,
        lastLogin: null,
        loginCount: 5,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: 'user123' })
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(true);
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      await authController.loginUser(mockReq, mockRes, mockNext);

      expect(mockUser.lastLogin).toBeInstanceOf(Date);
      expect(mockUser.loginCount).toBe(6);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('logoutUser', () => {
    it('should clear refresh token cookie and return success', async () => {
      mockReq.user = { _id: 'user123', email: 'john@example.com' };

      await authController.logoutUser(mockReq, mockRes, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });

    it('should handle logout without user context', async () => {
      mockReq.user = null;

      await authController.logoutUser(mockReq, mockRes, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      mockReq.cookies = { refreshToken };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        isActive: true
      };

      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(mockUser);

      generateTokens.mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

      await authController.refreshAccessToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: 'new-access-token'
      });
    });

    it('should return 401 if refresh token not provided', async () => {
      mockReq.cookies = {};

      await authController.refreshAccessToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token not provided'
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      mockReq.cookies = { refreshToken: 'invalid-token' };

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshAccessToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token'
      });
    });

    it('should return 401 if user not found or inactive', async () => {
      mockReq.cookies = { refreshToken: 'valid-token' };

      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(null);

      await authController.refreshAccessToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found or inactive'
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for valid email', async () => {
      mockReq.body = { email: 'john@example.com' };
      mockReq.protocol = 'https';
      mockReq.get = jest.fn().mockReturnValue('example.com');

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('random-token')
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token')
      });

      sendEmail.mockResolvedValue(true);

      await authController.forgotPassword(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockUser.resetPasswordToken).toBe('hashed-token');
      expect(mockUser.resetPasswordExpires).toEqual(expect.any(Number));
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith({
        email: 'john@example.com',
        subject: 'Password Reset Request',
        message: expect.stringContaining('random-token')
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset email sent'
      });
    });

    it('should return success even if email not found (security)', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      User.findOne.mockResolvedValue(null);

      await authController.forgotPassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    });

    it('should handle email sending failure', async () => {
      mockReq.body = { email: 'john@example.com' };
      mockReq.protocol = 'https';
      mockReq.get = jest.fn().mockReturnValue('example.com');

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('random-token')
      });
      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token')
      });

      sendEmail.mockRejectedValue(new Error('Email service down'));

      await authController.forgotPassword(mockReq, mockRes, mockNext);

      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpires).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email could not be sent'
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = { password: 'NewPassword123!', confirmPassword: 'NewPassword123!' };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        resetPasswordToken: 'hashed-token',
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token')
      });

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      await authController.resetPassword(mockReq, mockRes, mockNext);

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'hashed-token',
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
      expect(mockUser.password).toBe('newHashedPassword');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password has been reset successfully'
      });
    });

    it('should return 400 if passwords do not match', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = { password: 'NewPassword123!', confirmPassword: 'DifferentPassword123!' };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      await authController.resetPassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Passwords do not match'
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockReq.params = { token: 'invalid-token' };
      mockReq.body = { password: 'NewPassword123!', confirmPassword: 'NewPassword123!' };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      crypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-invalid-token')
      });

      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      };

      mockReq.user = mockUser;

      await authController.getProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });
  });

  describe('requestEmailVerification', () => {
    it('should send email verification successfully', async () => {
      mockReq.user = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false
      };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false,
        email_verification_token: undefined,
        email_verification_token_expires: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      generateEmailVerificationToken.mockReturnValue('verification-token');
      sendVerificationEmail.mockResolvedValue(true);

      await authController.requestEmailVerification(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(generateEmailVerificationToken).toHaveBeenCalled();
      expect(mockUser.email_verification_token).toBe('verification-token');
      expect(mockUser.email_verification_token_expires).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith('john@example.com', 'verification-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email sent successfully'
      });
    });

    it('should return 400 if email already verified', async () => {
      mockReq.user = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: true
      };

      await authController.requestEmailVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email is already verified'
      });
    });

    it('should handle rate limiting', async () => {
      mockReq.user = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false
      };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false,
        email_verification_token_expires: new Date(Date.now() + 10 * 60 * 1000) // Future date
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.requestEmailVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please wait before requesting another verification email'
      });
    });

    it('should clear token if email sending fails', async () => {
      mockReq.user = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false
      };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false,
        email_verification_token: undefined,
        email_verification_token_expires: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      generateEmailVerificationToken.mockReturnValue('verification-token');
      sendVerificationEmail.mockRejectedValue(new Error('Email service down'));

      await authController.requestEmailVerification(mockReq, mockRes, mockNext);

      expect(mockUser.email_verification_token).toBeUndefined();
      expect(mockUser.email_verification_token_expires).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('completeEmailVerification', () => {
    it('should complete email verification successfully', async () => {
      mockReq.body = { token: 'valid-token' };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: false,
        email_verification_token: 'valid-token',
        email_verification_token_expires: new Date(Date.now() + 10 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        email_verification_token: 'valid-token',
        email_verification_token_expires: { $gt: expect.any(Date) }
      });
      expect(mockUser.is_email_verified).toBe(true);
      expect(mockUser.email_verification_token).toBeUndefined();
      expect(mockUser.email_verification_token_expires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully'
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockReq.body = { token: 'invalid-token' };

      User.findOne.mockResolvedValue(null);

      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired verification token'
      });
    });

    it('should return 400 if email already verified', async () => {
      mockReq.body = { token: 'valid-token' };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        is_email_verified: true,
        email_verification_token: 'valid-token',
        email_verification_token_expires: new Date(Date.now() + 10 * 60 * 1000)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email is already verified'
      });
    });

    it('should return 400 if token is missing', async () => {
      mockReq.body = {};

      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Verification token is required'
      });
    });
  });

  describe('requestPhoneVerification', () => {
    it('should send phone verification successfully', async () => {
      mockReq.user = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false
      };

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false,
        phone_otp_code: undefined,
        phone_otp_expires: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      generateOTP.mockReturnValue('123456');
      sendVerificationSMS.mockResolvedValue(true);

      await authController.requestPhoneVerification(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(generateOTP).toHaveBeenCalledWith(6);
      expect(mockUser.phone_otp_code).toBe('123456');
      expect(mockUser.phone_otp_expires).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendVerificationSMS).toHaveBeenCalledWith('+1234567890', '123456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification code sent successfully'
      });
    });

    it('should return 400 if phone number is missing', async () => {
      mockReq.user = {
        _id: 'user123',
        phone: null,
        is_phone_verified: false
      };

      await authController.requestPhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Phone number is required for verification'
      });
    });

    it('should return 400 if phone already verified', async () => {
      mockReq.user = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: true
      };

      await authController.requestPhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Phone number is already verified'
      });
    });

    it('should handle rate limiting', async () => {
      mockReq.user = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false
      };

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false,
        phone_otp_expires: new Date(Date.now() + 5 * 60 * 1000) // Future date
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.requestPhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please wait before requesting another verification code'
      });
    });
  });

  describe('completePhoneVerification', () => {
    it('should complete phone verification successfully', async () => {
      mockReq.body = { otp_code: '123456' };
      mockReq.user = { _id: 'user123' };

      validateOTPFormat.mockReturnValue(true);

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false,
        phone_otp_code: '123456',
        phone_otp_expires: new Date(Date.now() + 5 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.completePhoneVerification(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.is_phone_verified).toBe(true);
      expect(mockUser.phone_otp_code).toBeUndefined();
      expect(mockUser.phone_otp_expires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Phone number verified successfully'
      });
    });

    it('should return 400 for invalid OTP', async () => {
      mockReq.body = { otp_code: '654321' };
      mockReq.user = { _id: 'user123' };

      validateOTPFormat.mockReturnValue(true);

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false,
        phone_otp_code: '123456',
        phone_otp_expires: new Date(Date.now() + 5 * 60 * 1000)
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.completePhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired OTP code'
      });
    });

    it('should return 400 for expired OTP', async () => {
      mockReq.body = { otp_code: '123456' };
      mockReq.user = { _id: 'user123' };

      validateOTPFormat.mockReturnValue(true);

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: false,
        phone_otp_code: '123456',
        phone_otp_expires: new Date(Date.now() - 5 * 60 * 1000) // Past date
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.completePhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired OTP code'
      });
    });

    it('should return 400 if phone already verified', async () => {
      mockReq.body = { otp_code: '123456' };
      mockReq.user = { _id: 'user123' };

      validateOTPFormat.mockReturnValue(true);

      const mockUser = {
        _id: 'user123',
        phone: '+1234567890',
        is_phone_verified: true,
        phone_otp_code: '123456',
        phone_otp_expires: new Date(Date.now() + 5 * 60 * 1000)
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.completePhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Phone number is already verified'
      });
    });

    it('should return 400 if user not found', async () => {
      mockReq.body = { otp_code: '123456' };
      mockReq.user = { _id: 'user123' };

      validateOTPFormat.mockReturnValue(true);

      User.findById.mockResolvedValue(null);

      await authController.completePhoneVerification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });
});
