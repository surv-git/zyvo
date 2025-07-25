/**
 * Address Controller
 * Handles user saved addresses for both user and admin operations
 */

const mongoose = require('mongoose');
const Address = require('../models/Address');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * USER CONTROLLERS
 */

/**
 * Get User's Addresses
 * @route GET /api/v1/user/addresses
 * @access User only
 */
const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      type, 
      include_inactive = 'false',
      limit = 20 
    } = req.query;

    const addresses = await Address.getUserAddresses(userId, {
      type: type || null,
      includeInactive: include_inactive === 'true',
      limit: parseInt(limit)
    });

    // Log user activity
    userActivityLogger.info('User addresses viewed', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'VIEW_ADDRESSES',
      resource_type: 'Address',
      resource_id: null,
      details: {
        total_addresses: addresses.length,
        type_filter: type,
        include_inactive: include_inactive === 'true'
      }
    });

    res.json({
      success: true,
      data: addresses,
      meta: {
        total: addresses.length,
        type_filter: type,
        include_inactive: include_inactive === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching user addresses:', error);
    next(error);
  }
};

/**
 * Get Single Address
 * @route GET /api/v1/user/addresses/:addressId
 * @access User only
 */
const getUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user_id: userId,
      is_active: true
    }).lean();

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: address
    });

  } catch (error) {
    console.error('Error fetching user address:', error);
    next(error);
  }
};

/**
 * Create New Address
 * @route POST /api/v1/user/addresses
 * @access User only
 */
const createUserAddress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const addressData = {
      ...req.body,
      user_id: userId
    };

    const address = new Address(addressData);
    await address.save();

    // Log user activity
    userActivityLogger.info('Address created', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'CREATE_ADDRESS',
      resource_type: 'Address',
      resource_id: address._id,
      details: {
        title: address.title,
        type: address.type,
        city: address.city,
        is_default: address.is_default
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address
    });

  } catch (error) {
    console.error('Error creating address:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate address entry'
      });
    }
    next(error);
  }
};

/**
 * Update Address
 * @route PUT /api/v1/user/addresses/:addressId
 * @access User only
 */
const updateUserAddress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const updateData = { ...req.body };
    delete updateData.user_id; // Prevent user_id modification

    const address = await Address.findOneAndUpdate(
      { _id: addressId, user_id: userId, is_active: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Address updated', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'UPDATE_ADDRESS',
      resource_type: 'Address',
      resource_id: address._id,
      details: {
        title: address.title,
        type: address.type,
        city: address.city,
        is_default: address.is_default
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });

  } catch (error) {
    console.error('Error updating address:', error);
    next(error);
  }
};

/**
 * Delete Address (Soft Delete)
 * @route DELETE /api/v1/user/addresses/:addressId
 * @access User only
 */
const deleteUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user_id: userId,
      is_active: true
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.softDelete();

    // Log user activity
    userActivityLogger.info('Address deleted', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'DELETE_ADDRESS',
      resource_type: 'Address',
      resource_id: address._id,
      details: {
        title: address.title,
        type: address.type,
        city: address.city
      }
    });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    next(error);
  }
};

/**
 * Set Default Address
 * @route PATCH /api/v1/user/addresses/:addressId/default
 * @access User only
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const address = await Address.setDefaultAddress(userId, addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Default address set', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'SET_DEFAULT_ADDRESS',
      resource_type: 'Address',
      resource_id: address._id,
      details: {
        title: address.title,
        type: address.type,
        city: address.city
      }
    });

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: address
    });

  } catch (error) {
    console.error('Error setting default address:', error);
    next(error);
  }
};

/**
 * ADMIN CONTROLLERS
 */

/**
 * Get All Addresses (Admin)
 * @route GET /api/v1/admin/addresses
 * @access Admin only
 */
const getAllAddressesAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'createdAt',
      sort_order = 'desc',
      user_id,
      type,
      city,
      state,
      country = 'India',
      is_active,
      is_default,
      search
    } = req.query;

    // Build filter query
    const filter = {};

    if (user_id) {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      filter.user_id = user_id;
    }

    if (type) filter.type = type;
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (country) filter.country = new RegExp(country, 'i');
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (is_default !== undefined) filter.is_default = is_default === 'true';

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'city', 'last_used_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
    const sortDirection = sort_order === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: sortDirection };

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter }
    ];

    // Add user lookup for search and population
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    });

    pipeline.push({
      $unwind: '$user'
    });

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { full_name: { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { address_line_1: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting
    pipeline.push({ $sort: sortObj });

    // Get total count for pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Address.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $skip: skip },
      { $limit: limitNum }
    );

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        user_id: 1,
        title: 1,
        type: 1,
        full_name: 1,
        phone: 1,
        address_line_1: 1,
        address_line_2: 1,
        landmark: 1,
        city: 1,
        state: 1,
        postal_code: 1,
        country: 1,
        coordinates: 1,
        is_default: 1,
        is_active: 1,
        delivery_instructions: 1,
        is_verified: 1,
        verification_source: 1,
        last_used_at: 1,
        usage_count: 1,
        createdAt: 1,
        updatedAt: 1,
        'user._id': 1,
        'user.email': 1,
        'user.first_name': 1,
        'user.last_name': 1,
        'user.phone': 1
      }
    });

    // Execute aggregation
    const addresses = await Address.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate summary statistics
    const statsResult = await Address.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_addresses: { $sum: 1 },
          active_addresses: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
          },
          inactive_addresses: {
            $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] }
          },
          default_addresses: {
            $sum: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
          },
          verified_addresses: {
            $sum: { $cond: [{ $eq: ['$is_verified', true] }, 1, 0] }
          },
          avg_usage_count: { $avg: '$usage_count' }
        }
      }
    ]);

    const stats = statsResult[0] || {
      total_addresses: 0,
      active_addresses: 0,
      inactive_addresses: 0,
      default_addresses: 0,
      verified_addresses: 0,
      avg_usage_count: 0
    };

    // Log admin activity
    adminAuditLogger.info('Admin addresses viewed', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'VIEW_ALL_ADDRESSES',
      resource_type: 'Address',
      resource_id: null,
      details: {
        filter_applied: filter,
        total_results: total,
        page: pageNum,
        limit: limitNum
      }
    });

    res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: {
        addresses,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_count: total,
          per_page: limitNum,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        },
        summary: {
          total_addresses: stats.total_addresses,
          active_addresses: stats.active_addresses,
          inactive_addresses: stats.inactive_addresses,
          default_addresses: stats.default_addresses,
          verified_addresses: stats.verified_addresses,
          average_usage_count: parseFloat(stats.avg_usage_count.toFixed(1))
        },
        filters_applied: {
          user_id,
          type,
          city,
          state,
          country,
          is_active,
          is_default,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error getting all addresses (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve addresses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get User Addresses (Admin)
 * @route GET /api/v1/admin/addresses/user/:userId
 * @access Admin only
 */
const getUserAddressesAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { include_inactive = 'false' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const user = await User.findById(userId).select('email first_name last_name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const addresses = await Address.getUserAddresses(userId, {
      includeInactive: include_inactive === 'true'
    });

    // Log admin activity
    adminAuditLogger.info('User addresses viewed by admin', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'VIEW_USER_ADDRESSES',
      resource_type: 'Address',
      resource_id: null,
      details: {
        target_user_id: userId,
        target_user_email: user.email,
        total_addresses: addresses.length,
        include_inactive: include_inactive === 'true'
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim()
        },
        addresses
      },
      meta: {
        total: addresses.length,
        include_inactive: include_inactive === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching user addresses (admin):', error);
    next(error);
  }
};

/**
 * Get Single Address (Admin)
 * @route GET /api/v1/admin/addresses/:addressId
 * @access Admin only
 */
const getAddressAdmin = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const address = await Address.findById(addressId)
      .populate('user_id', 'email first_name last_name phone')
      .lean();

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Log admin activity
    adminAuditLogger.info('Address viewed by admin', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'VIEW_ADDRESS',
      resource_type: 'Address',
      resource_id: addressId,
      details: {
        address_title: address.title,
        address_city: address.city,
        user_email: address.user_id?.email
      }
    });

    res.json({
      success: true,
      data: address
    });

  } catch (error) {
    console.error('Error fetching address (admin):', error);
    next(error);
  }
};

/**
 * Update Address (Admin)
 * @route PUT /api/v1/admin/addresses/:addressId
 * @access Admin only
 */
const updateAddressAdmin = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const updateData = { ...req.body };
    delete updateData.user_id; // Prevent user_id modification

    const address = await Address.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user_id', 'email first_name last_name');

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Log admin activity
    adminAuditLogger.info('Address updated by admin', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE_ADDRESS',
      resource_type: 'Address',
      resource_id: addressId,
      details: {
        address_title: address.title,
        address_city: address.city,
        user_email: address.user_id?.email,
        changes: updateData
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });

  } catch (error) {
    console.error('Error updating address (admin):', error);
    next(error);
  }
};

/**
 * Delete Address (Admin)
 * @route DELETE /api/v1/admin/addresses/:addressId
 * @access Admin only
 */
const deleteAddressAdmin = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { permanent = 'false' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }

    const address = await Address.findById(addressId)
      .populate('user_id', 'email first_name last_name');

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    let message;
    if (permanent === 'true') {
      // Permanent deletion
      await Address.findByIdAndDelete(addressId);
      message = 'Address permanently deleted';
    } else {
      // Soft deletion
      await address.softDelete();
      message = 'Address deactivated successfully';
    }

    // Log admin activity
    adminAuditLogger.info(`Address ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} by admin`, {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: permanent === 'true' ? 'DELETE_ADDRESS_PERMANENT' : 'DELETE_ADDRESS_SOFT',
      resource_type: 'Address',
      resource_id: addressId,
      details: {
        address_title: address.title,
        address_city: address.city,
        user_email: address.user_id?.email,
        permanent_deletion: permanent === 'true'
      }
    });

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error deleting address (admin):', error);
    next(error);
  }
};

module.exports = {
  // User controllers
  getUserAddresses,
  getUserAddress,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,

  // Admin controllers
  getAllAddressesAdmin,
  getUserAddressesAdmin,
  getAddressAdmin,
  updateAddressAdmin,
  deleteAddressAdmin
};
