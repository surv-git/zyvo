/**
 * Real User Controller Tests
 * Tests actual controller functions with proper mocking
 */

const userController = require('../../../controllers/user.controller');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('bcryptjs');

describe('User Controller - Real Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123' },
      file: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('getUserById', () => {
    it('should get user profile successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        is_email_verified: true
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getUserById(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser
        })
      );
    });

    it('should return error if user not found', async () => {
      // Arrange
      User.findById.mockResolvedValue(null);

      // Act
      await userController.getUserById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found'
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      User.findById.mockRejectedValue(new Error('Database error'));

      // Act
      await userController.getUserById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      mockReq.body = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.name).toBe('Updated Name');
      expect(mockUser.phone).toBe('+9876543210');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should not allow email update', async () => {
      // Arrange
      mockReq.body = {
        name: 'Updated Name',
        email: 'newemail@example.com' // Should be ignored
      };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUser.email).toBe('test@example.com'); // Should remain unchanged
      expect(mockUser.name).toBe('Updated Name');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if user not found', async () => {
      // Arrange
      mockReq.body = { name: 'Updated Name' };
      User.findById.mockResolvedValue(null);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUser - Password Change', () => {
    it('should change password successfully', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const mockUser = {
        _id: 'user123',
        password: 'hashedOldPassword',
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for incorrect current password', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const mockUser = {
        _id: 'user123',
        password: 'hashedOldPassword'
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Current password is incorrect'
        })
      );
    });

    it('should return error if user not found', async () => {
      // Arrange
      mockReq.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      User.findById.mockResolvedValue(null);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    it('should delete user account successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      // Act
      await userController.deleteUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Account deleted successfully'
        })
      );
    });

    it('should return error if user not found', async () => {
      // Arrange
      User.findById.mockResolvedValue(null);

      // Act
      await userController.deleteUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        createdAt: new Date('2023-01-01')
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getUserStats(mockReq, mockRes);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: mockUser,
            memberSince: expect.any(Date)
          })
        })
      );
    });

    it('should return error if user not found', async () => {
      // Arrange
      User.findById.mockResolvedValue(null);

      // Act
      await userController.getUserStats(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      // Arrange
      mockReq.file = {
        filename: 'profile-pic.jpg',
        path: '/uploads/profile-pic.jpg'
      };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.uploadProfilePicture(mockReq, mockRes);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.profilePicture).toBe('/uploads/profile-pic.jpg');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if no file uploaded', async () => {
      // Arrange
      mockReq.file = null;

      // Act
      await userController.uploadProfilePicture(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No file uploaded'
        })
      );
    });

    it('should return error if user not found', async () => {
      // Arrange
      mockReq.file = {
        filename: 'profile-pic.jpg',
        path: '/uploads/profile-pic.jpg'
      };

      User.findById.mockResolvedValue(null);

      // Act
      await userController.uploadProfilePicture(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
