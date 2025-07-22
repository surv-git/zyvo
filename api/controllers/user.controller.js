/**
 * User Controller
 * Handles all user-related operations including CRUD, search, filtering, pagination
 * and admin dashboard insights for e-commerce application
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');
const { sendVerificationEmail, generateEmailVerificationToken } = require('../utils/sendVerificationEmail');
const { sendVerificationSMS, generateOTP } = require('../utils/sendVerificationSMS');
// const { userActivityLogger } = require('../utils/logger'); // Uncomment when logger is available

/**
 * Create a new user (Registration)
 * @route POST /api/users
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createUser = async (req, res, next) => {
  try {
    // TODO: Add input validation (Joi/express-validator)
    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const userData = {
      name,
      email,
      password,
      role: role || 'user', // Default to 'user' role
      phone,
      address
    };

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with advanced search, filtering, and pagination
 * @route GET /api/users
 * @access Private (authenticated users, admin can see all)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      role,
      is_active,
      min_createdAt,
      max_createdAt,
      min_lastLoginAt,
      max_lastLoginAt,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Convert page and limit to integers with validation
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    // Build dynamic query object
    const query = {};

    // Search functionality - case-insensitive partial match across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { address: searchRegex }
      ];
    }

    // Role filtering
    if (role && role.trim()) {
      query.role = role.trim();
    }

    // Activity status filtering (admin only for inactive users)
    if (is_active !== undefined) {
      // Only admin can filter by is_active=false (soft-deleted users)
      if (is_active === 'false' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required to view inactive users.'
        });
      }
      query.isActive = is_active === 'true';
    } else {
      // Default: only show active users for non-admin
      if (req.user.role !== 'admin') {
        query.isActive = true;
      }
    }

    // Date range filtering for createdAt
    if ((min_createdAt && min_createdAt.trim()) || (max_createdAt && max_createdAt.trim())) {
      query.createdAt = {};
      if (min_createdAt && min_createdAt.trim()) {
        const minDate = new Date(min_createdAt.trim());
        if (!isNaN(minDate.getTime())) {
          query.createdAt.$gte = minDate;
        }
      }
      if (max_createdAt && max_createdAt.trim()) {
        const maxDate = new Date(max_createdAt.trim());
        if (!isNaN(maxDate.getTime())) {
          query.createdAt.$lte = maxDate;
        }
      }
    }

    // Date range filtering for lastLogin
    if ((min_lastLoginAt && min_lastLoginAt.trim()) || (max_lastLoginAt && max_lastLoginAt.trim())) {
      query.lastLogin = {};
      if (min_lastLoginAt && min_lastLoginAt.trim()) {
        const minDate = new Date(min_lastLoginAt.trim());
        if (!isNaN(minDate.getTime())) {
          query.lastLogin.$gte = minDate;
        }
      }
      if (max_lastLoginAt && max_lastLoginAt.trim()) {
        const maxDate = new Date(max_lastLoginAt.trim());
        if (!isNaN(maxDate.getTime())) {
          query.lastLogin.$lte = maxDate;
        }
      }
    }

    // Build sort object with validation
    const validSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'role', 'lastLogin'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = validSortOrders.includes(order) ? order : 'desc';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    
    const sortObj = {};
    sortObj[sortField] = sortDirection;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNumber);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: totalUsers,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter format'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message
      });
    }
    
    // Default error response
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users'
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private (user can get own profile, admin can get any)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Authorization check: user can only get their own profile, admin can get any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/users/:id
 * @access Private (user can update own profile, admin can update any)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Authorization check: user can only update their own profile, admin can update any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Get current user data
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Add input validation (Joi/express-validator)
    const allowedUpdates = ['name', 'email', 'phone', 'address'];
    const updates = {};
    let emailChanged = false;
    let phoneChanged = false;

    // Only allow specified fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
        
        // Check if email or phone is being changed
        if (key === 'email' && req.body[key] !== currentUser.email) {
          emailChanged = true;
        }
        if (key === 'phone' && req.body[key] !== currentUser.phone) {
          phoneChanged = true;
        }
      }
    });

    // Admin can also update role and isActive status
    if (req.user.role === 'admin') {
      if (req.body.role) updates.role = req.body.role;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    }

    // Handle email change
    if (emailChanged) {
      updates.is_email_verified = false;
      updates.email_verification_token = undefined;
      updates.email_verification_token_expires = undefined;
      
      // Trigger new email verification
      try {
        const emailToken = generateEmailVerificationToken();
        updates.email_verification_token = emailToken;
        updates.email_verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Send verification email after update
        setTimeout(async () => {
          try {
            await sendVerificationEmail(updates.email, emailToken);
            
            // Log email verification request
            // userActivityLogger.info('Email verification sent after email update', {
            //   userId: id,
            //   oldEmail: currentUser.email,
            //   newEmail: updates.email,
            //   timestamp: new Date()
            // });
          } catch (error) {
            console.error('Failed to send email verification after update:', error.message);
          }
        }, 1000);
      } catch (error) {
        console.error('Failed to prepare email verification after update:', error.message);
      }
    }

    // Handle phone change
    if (phoneChanged) {
      updates.is_phone_verified = false;
      updates.phone_otp_code = undefined;
      updates.phone_otp_expires = undefined;
      
      // Note: We don't automatically send SMS here as it should be user-initiated
      // The user will need to call the phone verification request endpoint
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare response message
    let message = 'User updated successfully';
    if (emailChanged || phoneChanged) {
      const changedFields = [];
      if (emailChanged) changedFields.push('email');
      if (phoneChanged) changedFields.push('phone');
      message += `. Your ${changedFields.join(' and ')} verification status has been reset. Please verify your new ${changedFields.join(' and ')}.`;
    }

    res.status(200).json({
      success: true,
      message,
      data: user,
      verificationReset: {
        emailChanged,
        phoneChanged,
        ...(emailChanged && { emailVerificationRequired: true }),
        ...(phoneChanged && { phoneVerificationRequired: true })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete by default, hard delete option for admin)
 * @route DELETE /api/users/:id
 * @access Private (user can delete own account, admin can delete any)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    // Authorization check: user can only delete their own account, admin can delete any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own account.'
      });
    }

    // Hard delete is only allowed for admin
    if (hard_delete === 'true' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Hard delete requires admin privileges.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (hard_delete === 'true') {
      // Hard delete: permanently remove user from database
      await User.findByIdAndDelete(id);
    } else {
      // Soft delete: set isActive to false and add deleted_at timestamp
      await User.findByIdAndUpdate(id, {
        isActive: false,
        deleted_at: new Date()
      });
    }

    res.status(204).json({
      success: true,
      message: hard_delete === 'true' ? 'User permanently deleted' : 'User deactivated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request email verification
 * @route POST /api/v1/auth/request-email-verification
 * @access Public
 * @description Initiates the email verification process by sending a verification link/code to the user's registered email address.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requestEmailVerification = async (req, res, next) => {
  try {
    // TODO: Add input validation (Joi/express-validator) for email
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with the provided email not found.'
      });
    }

    // Check if email is already verified
    if (user.is_email_verified) {
      return res.status(409).json({
        success: false,
        message: 'This email address has already been verified.'
      });
    }

    // TODO: Implement rate limiting to prevent abuse
    // For example, using express-rate-limit middleware on this route

    // Generate a new verification token and expiry
    const emailToken = generateEmailVerificationToken();
    user.email_verification_token = emailToken;
    user.email_verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send the verification email
    await sendVerificationEmail(user.email, emailToken);

    res.status(200).json({
      success: true,
      message: 'Email verification link sent successfully. Please check your inbox.'
    });

  } catch (error) {
    // Log the error for debugging, especially for email sending failures
    console.error('Error in requestEmailVerification:', error);
    next(error);
  }
};

/**
 * Get user registration trends (Admin only)
 * @route GET /api/admin/users/trends/registrations
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserRegistrationTrends = async (req, res, next) => {
  try {
    // Admin access check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { period = 'daily', startDate, endDate } = req.query;

    // Build date range
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);

    // Define grouping format based on period
    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
        break;
      case 'monthly':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'yearly':
        groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // Build aggregation pipeline
    const pipeline = [];

    // Match date range if provided
    if (Object.keys(dateRange).length > 0) {
      pipeline.push({ $match: { createdAt: dateRange } });
    }

    // Group by period and count
    pipeline.push({
      $group: {
        _id: groupFormat,
        count: { $sum: 1 }
      }
    });

    // Sort by date
    pipeline.push({ $sort: { _id: 1 } });

    // Format output
    pipeline.push({
      $project: {
        _id: 0,
        date: '$_id',
        count: 1
      }
    });

    const trends = await User.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active users count (Admin only)
 * @route GET /api/admin/users/trends/active
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getActiveUsersCount = async (req, res, next) => {
  try {
    const { lastActivityDays = 30 } = req.query;

    // Validate and parse lastActivityDays parameter
    const activityDays = parseInt(lastActivityDays, 10);
    if (isNaN(activityDays) || activityDays < 1 || activityDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'lastActivityDays must be a valid number between 1 and 365'
      });
    }

    // Calculate date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - activityDays);

    const activeUsers = await User.countDocuments({
      isActive: true,
      lastLogin: { $gte: thresholdDate }
    });

    res.status(200).json({
      success: true,
      data: {
        activeUsers,
        period: `${activityDays} days`,
        thresholdDate
      }
    });
  } catch (error) {
    console.error('Error in getActiveUsersCount:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching active users count'
    });
  }
};

/**
 * Get top users by activity (Admin only)
 * @route GET /api/admin/users/trends/top-activity
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTopUsersByActivity = async (req, res, next) => {
  try {
    const { type = 'logins', limit = 10 } = req.query;

    // Note: This is a placeholder implementation
    // In a real application, you would join with orders, reviews, or other activity collections
    let pipeline;

    switch (type) {
      case 'logins':
        // For logins, we can use lastLogin frequency (this is simplified)
        pipeline = [
          { $match: { isActive: true, lastLogin: { $exists: true } } },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              lastLogin: 1,
              loginCount: 1 // Assuming you have a loginCount field
            }
          },
          { $sort: { loginCount: -1 } },
          { $limit: parseInt(limit, 10) }
        ];
        break;
      case 'orders':
        // This would typically involve aggregating from an Orders collection
        // For now, return a placeholder message
        return res.status(200).json({
          success: true,
          message: 'Orders activity tracking requires integration with Orders collection',
          data: []
        });
      case 'reviews':
        // This would typically involve aggregating from a Reviews collection
        // For now, return a placeholder message
        return res.status(200).json({
          success: true,
          message: 'Reviews activity tracking requires integration with Reviews collection',
          data: []
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid activity type. Supported types: logins, orders, reviews'
        });
    }

    const topUsers = await User.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user role distribution (Admin only)
 * @route GET /api/admin/users/trends/roles
 * @access Private (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserRoleDistribution = async (req, res, next) => {
  try {
    const roleDistribution = await User.aggregate([
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

    const result = roleDistribution.length > 0 ? roleDistribution[0].distribution : {};

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
