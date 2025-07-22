/**
 * Real Auth Controller Tests
 * Tests actual controller functions with proper mocking
 */

const authController = require('../../../controllers/auth.controller');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../../../utils/sendVerificationEmail');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../../utils/sendVerificationEmail');

describe('Auth Controller - Real Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      user: { id: 'user123' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        is_email_verified: false,
        save: jest.fn()
      });
      jwt.sign.mockReturnValue('mockToken');
      sendVerificationEmail.mockResolvedValue(true);

      // Act
      await authController.registerUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(User.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return error if user already exists', async () => {
      // Arrange
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      // Act
      await authController.registerUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should handle registration errors', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      await authController.registerUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        is_email_verified: true,
        name: 'Test User'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      // Act
      await authController.loginUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      User.findOne.mockResolvedValue(null);

      // Act
      await authController.loginUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return error for unverified email', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        is_email_verified: false
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await authController.loginUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Act
      await authController.logoutUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out successfully'
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Arrange
      mockReq.body = { token: 'validToken' };
      
      const mockUser = {
        _id: 'user123',
        is_email_verified: false,
        email_verification_token: 'validToken',
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);

      // Act
      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({
        email_verification_token: 'validToken',
        email_verification_token_expires: { $gt: expect.any(Date) }
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for invalid token', async () => {
      // Arrange
      mockReq.body = { token: 'invalidToken' };
      User.findOne.mockResolvedValue(null);

      // Act
      await authController.completeEmailVerification(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email', async () => {
      // Arrange
      mockReq.body = { email: 'test@example.com' };
      
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('resetToken');

      // Act
      await authController.forgotPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for non-existent email', async () => {
      // Arrange
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      // Act
      await authController.forgotPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      mockReq.params = { token: 'validResetToken' };
      mockReq.body = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      const mockUser = {
        _id: 'user123',
        resetPasswordToken: 'hashedToken',
        resetPasswordExpires: Date.now() + 10 * 60 * 1000,
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // Act
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for invalid or expired token', async () => {
      // Arrange
      mockReq.params = { token: 'invalidToken' };
      mockReq.body = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      User.findOne.mockResolvedValue(null);

      // Act
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
