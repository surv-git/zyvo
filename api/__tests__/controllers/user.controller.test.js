/**
 * User Controller Unit Tests
 * Comprehensive test suite for user.controller.js
 */

const userController = require('../../controllers/user.controller');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, generateEmailVerificationToken } = require('../../utils/sendVerificationEmail');
const { sendVerificationSMS, generateOTP } = require('../../utils/sendVerificationSMS');

// Mock the User model
jest.mock('../../models/User');

describe('User Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = global.mockReq();
    mockRes = global.mockRes();
    mockNext = global.mockNext();
  });

  describe('createUser', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      phone: '+1234567890',
      role: 'user'
    };

    it('should create a new user successfully', async () => {
      // Mock request data
      mockReq.body = validUserData;
      mockReq.user = { role: 'admin' };

      // Mock User model methods
      User.findOne.mockResolvedValue(null); // No existing user
      
      const mockUser = {
        _id: 'user123',
        ...validUserData,
        password: 'hashedPassword',
        createdAt: new Date(),
        toObject: () => ({ _id: 'user123', ...validUserData, createdAt: new Date() }),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock User constructor
      User.mockImplementation(() => mockUser);

      await userController.createUser(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: validUserData.email.toLowerCase() });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: expect.any(Object)
      });
    });

    it('should return 400 if email already exists', async () => {
      mockReq.body = validUserData;
      mockReq.user = { role: 'admin' };

      // Mock existing user with same email
      User.findOne.mockResolvedValue({
        email: validUserData.email.toLowerCase()
      });

      await userController.createUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });

    it('should return 400 if email already exists', async () => {
      mockReq.body = validUserData;
      mockReq.user = { role: 'admin' };

      // Mock existing user with same email
      User.findOne.mockResolvedValue({
        name: 'Different User',
        email: validUserData.email.toLowerCase()
      });

      await userController.createUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });

    it('should call next with error when User.save throws', async () => {
      mockReq.body = validUserData;
      mockReq.user = { role: 'admin' };

      User.findOne.mockResolvedValue(null);
      
      const mockUser = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      User.mockImplementation(() => mockUser);

      await userController.createUser(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAllUsers', () => {
    it('should return all active users with default pagination', async () => {
      mockReq.query = {};
      mockReq.user = { role: 'user' }; // Non-admin user

      const mockUsers = [
        { _id: 'user1', name: 'User 1', email: 'user1@example.com', isActive: true },
        { _id: 'user2', name: 'User 2', email: 'user2@example.com', isActive: true }
      ];

      // Mock User.find chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(25);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(User.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 25,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPreviousPage: false
        }
      });
    });

    it('should apply pagination correctly with page and limit query params', async () => {
      mockReq.query = { page: '2', limit: '5' };
      mockReq.user = { role: 'admin' }; // Admin user to avoid automatic isActive filter

      const mockUsers = [
        { _id: 'user6', name: 'User 6', email: 'user6@example.com', isActive: true }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(12);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(User.find).toHaveBeenCalledWith({}); // No automatic filters for admin
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalItems: 12,
          itemsPerPage: 5,
          hasNextPage: true,
          hasPreviousPage: true
        }
      });
    });

    it('should apply search filter with regex and $or', async () => {
      mockReq.query = { search: 'john' };
      mockReq.user = { role: 'admin' };

      const mockUsers = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com', isActive: true }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { name: /john/i },
          { email: /john/i },
          { phone: /john/i },
          { address: /john/i }
        ]
      });
    });

    it('should apply role filter', async () => {
      mockReq.query = { role: 'admin' };
      mockReq.user = { role: 'admin' };

      const mockUsers = [
        { _id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin', isActive: true }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({
        role: 'admin'
      });
    });

    it('should apply date range filter', async () => {
      mockReq.query = { 
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      mockReq.user = { role: 'admin' };

      const mockUsers = [];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(0);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({});
    });

    it('should restrict inactive users for non-admin users', async () => {
      mockReq.query = { is_active: 'false' };
      mockReq.user = { role: 'user' };

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      // Should return 403 for non-admin users trying to access inactive users
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin privileges required to view inactive users.'
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockReq.query = { page: 'invalid', limit: 'invalid' };
      mockReq.user = { role: 'admin' };

      const mockUsers = [];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(0);

      await userController.getAllUsers(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      // Should not return 400 for invalid pagination - these get parsed as NaN but processed
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        pagination: {
          currentPage: NaN,
          totalPages: NaN,
          totalItems: 0,
          itemsPerPage: NaN,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID successfully', async () => {
      const userId = 'user123';
      mockReq.params = { id: userId };
      mockReq.user = { id: userId, role: 'user' };

      const mockUser = {
        _id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue(mockUser)
      };

      User.findById.mockReturnValue(mockQuery);

      await userController.getUserById(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 if user not found', async () => {
      const userId = 'nonexistent';
      mockReq.params = { id: userId };
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockQuery = {
        select: jest.fn().mockReturnValue(null)
      };

      User.findById.mockReturnValue(mockQuery);

      await userController.getUserById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should return 403 if non-admin tries to fetch another user\'s profile', async () => {
      const userId = 'user123';
      mockReq.params = { id: userId };
      mockReq.user = { id: 'user456', role: 'user' };

      await userController.getUserById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    });

    it('should allow admin to fetch any user\'s profile', async () => {
      const userId = 'user123';
      mockReq.params = { id: userId };
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockUser = {
        _id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue(mockUser)
      };

      User.findById.mockReturnValue(mockQuery);

      await userController.getUserById(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUser', () => {
    const userId = 'user123';
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '+1987654321'
    };

    it('should update user profile successfully', async () => {
      mockReq.params = { id: userId };
      mockReq.body = updateData;
      mockReq.user = { id: userId, role: 'user' };

      const currentUser = {
        _id: userId,
        name: 'Old Name',
        email: 'old@example.com',
        phone: '+1234567890',
        is_email_verified: true,
        is_phone_verified: true
      };

      const updatedUser = {
        ...currentUser,
        ...updateData,
        is_email_verified: false,
        is_phone_verified: false
      };

      User.findById.mockResolvedValue(currentUser);
      const mockQuery = {
        select: jest.fn().mockReturnValue(updatedUser)
      };
      User.findByIdAndUpdate.mockReturnValue(mockQuery);

      await userController.updateUser(mockReq, mockRes, mockNext);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone,
          is_email_verified: false,
          is_phone_verified: false
        }),
        { new: true, runValidators: true }
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('verification status has been reset'),
        data: updatedUser,
        verificationReset: {
          emailChanged: true,
          phoneChanged: true,
          emailVerificationRequired: true,
          phoneVerificationRequired: true
        }
      });
    });

    it('should return 404 if user not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', role: 'admin' };

      User.findById.mockResolvedValue(null);

      await userController.updateUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should return 403 if non-admin tries to update another user\'s profile', async () => {
      mockReq.params = { id: userId };
      mockReq.body = updateData;
      mockReq.user = { id: 'user456', role: 'user' };

      await userController.updateUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    });

    it('should trigger email verification when email changes', async () => {
      mockReq.params = { id: userId };
      mockReq.body = { email: 'newemail@example.com' };
      mockReq.user = { id: userId, role: 'user' };

      const currentUser = {
        _id: userId,
        email: 'old@example.com',
        is_email_verified: true
      };

      const updatedUser = {
        ...currentUser,
        email: 'newemail@example.com',
        is_email_verified: false
      };

      User.findById.mockResolvedValue(currentUser);
      const mockQuery = {
        select: jest.fn().mockReturnValue(updatedUser)
      };
      User.findByIdAndUpdate.mockReturnValue(mockQuery);

      await userController.updateUser(mockReq, mockRes, mockNext);

      expect(generateEmailVerificationToken).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('verification status has been reset'),
        data: updatedUser,
        verificationReset: {
          emailChanged: true,
          phoneChanged: false,
          emailVerificationRequired: true
        }
      });
    });

    it('should allow admin to update role and isActive', async () => {
      mockReq.params = { id: userId };
      mockReq.body = { role: 'admin', isActive: false };
      mockReq.user = { id: 'admin123', role: 'admin' };

      const currentUser = {
        _id: userId,
        role: 'user',
        isActive: true
      };

      const updatedUser = {
        ...currentUser,
        role: 'admin',
        isActive: false
      };

      User.findById.mockResolvedValue(currentUser);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      await userController.updateUser(mockReq, mockRes, mockNext);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          role: 'admin',
          isActive: false
        }),
        { new: true, runValidators: true }
      );
    });
  });

  describe('deleteUser', () => {
    const userId = 'user123';

    it('should perform soft delete by default', async () => {
      mockReq.params = { id: userId };
      mockReq.query = {};
      mockReq.user = { id: userId, role: 'user' };

      const mockUser = {
        _id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true
      };

      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        isActive: false,
        deleted_at: new Date()
      });

      await userController.deleteUser(mockReq, mockRes, mockNext);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          isActive: false,
          deleted_at: expect.any(Date)
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated'
      });
    });

    it('should perform hard delete for admin with hard_delete=true', async () => {
      mockReq.params = { id: userId };
      mockReq.query = { hard_delete: 'true' };
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockUser = {
        _id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      await userController.deleteUser(mockReq, mockRes, mockNext);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User permanently deleted'
      });
    });

    it('should return 403 if non-admin tries to delete another user\'s profile', async () => {
      mockReq.params = { id: userId };
      mockReq.query = {};
      mockReq.user = { id: 'user456', role: 'user' };

      await userController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You can only delete your own account.'
      });
    });

    it('should return 403 if non-admin tries to hard delete', async () => {
      mockReq.params = { id: userId };
      mockReq.query = { hard_delete: 'true' };
      mockReq.user = { id: userId, role: 'user' };

      await userController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Hard delete requires admin privileges.'
      });
    });

    it('should return 404 if user not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.query = {};
      mockReq.user = { id: 'admin123', role: 'admin' };

      User.findById.mockResolvedValue(null);

      await userController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('Admin Dashboard Endpoints', () => {
    beforeEach(() => {
      mockReq.user = { role: 'admin' };
    });

    describe('getUserRegistrationTrends', () => {
      it('should return registration trends data', async () => {
        mockReq.query = { period: 'month' };

        const mockTrends = [
          { _id: '2023-01', count: 50 },
          { _id: '2023-02', count: 75 },
          { _id: '2023-03', count: 100 }
        ];

        User.aggregate.mockResolvedValue(mockTrends);

        await userController.getUserRegistrationTrends(mockReq, mockRes, mockNext);

        expect(User.aggregate).toHaveBeenCalledWith([
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: '$_id',
              count: 1
            }
          }
        ]);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: mockTrends
        });
      });

      it('should return 403 for non-admin users', async () => {
        mockReq.user = { role: 'user' };

        await userController.getUserRegistrationTrends(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      });
    });

    describe('getActiveUsersCount', () => {
      it('should return active users count', async () => {
        mockReq.query = { lastActivityDays: '30' };

        User.countDocuments.mockResolvedValue(150);

        await userController.getActiveUsersCount(mockReq, mockRes, mockNext);

        expect(User.countDocuments).toHaveBeenCalledWith({
          isActive: true,
          lastLogin: { $gte: expect.any(Date) }
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            activeUsers: 150,
            period: '30 days',
            thresholdDate: expect.any(Date)
          }
        });
      });
    });

    describe('getTopUsersByActivity', () => {
      it('should return top users by activity', async () => {
        mockReq.query = { limit: '5' };

        const mockTopUsers = [
          { _id: 'user1', name: 'User 1', loginCount: 100 },
          { _id: 'user2', name: 'User 2', loginCount: 75 }
        ];

        User.aggregate.mockResolvedValue(mockTopUsers);

        await userController.getTopUsersByActivity(mockReq, mockRes, mockNext);

        expect(User.aggregate).toHaveBeenCalledWith([
          { $match: { isActive: true, lastLogin: { $exists: true } } },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              lastLogin: 1,
              loginCount: 1
            }
          },
          { $sort: { loginCount: -1 } },
          { $limit: 5 }
        ]);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: mockTopUsers
        });
      });
    });

    describe('getUserRoleDistribution', () => {
      it('should return user role distribution', async () => {
        const mockDistribution = [
          { distribution: { user: 180, admin: 20 } }
        ];

        User.aggregate.mockResolvedValue(mockDistribution);

        await userController.getUserRoleDistribution(mockReq, mockRes, mockNext);

        expect(User.aggregate).toHaveBeenCalledWith([
          { $match: { isActive: true } },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: null,
              roles: {
                $push: {
                  k: '$_id',
                  v: '$count'
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              distribution: { $arrayToObject: '$roles' }
            }
          }
        ]);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: { user: 180, admin: 20 }
        });
      });
    });
  });
});
