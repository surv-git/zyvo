/**
 * Option Controller
 * Handles all option-related operations for the e-commerce API
 * Manages product options (types and values) for ProductVariants
 */

const Option = require('../models/Option');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new option
 * @route POST /api/options
 * @access Admin only
 */
const createOption = async (req, res, next) => {
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

    const {
      option_type,
      option_value,
      name,
      sort_order
    } = req.body;

    // Create new option
    const option = new Option({
      option_type,
      option_value,
      name: name || option_value, // Use option_value as name if not provided
      sort_order: sort_order || 0
    });

    const savedOption = await option.save();

    // Log admin action
    adminAuditLogger.info('Option created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'Option',
      resource_id: savedOption._id,
      changes: {
        option_type: savedOption.option_type,
        option_value: savedOption.option_value,
        name: savedOption.name,
        slug: savedOption.slug
      }
    });

    res.status(201).json({
      success: true,
      message: 'Option created successfully',
      data: savedOption
    });

  } catch (error) {
    // Handle duplicate option_type + option_value combination
    if (error.code === 11000) {
      if (error.keyValue.option_type && error.keyValue.option_value) {
        return res.status(400).json({
          success: false,
          message: `Option '${error.keyValue.option_type}: ${error.keyValue.option_value}' already exists`
        });
      }
      // Handle duplicate slug
      if (error.keyValue.slug) {
        return res.status(400).json({
          success: false,
          message: `Option with slug '${error.keyValue.slug}' already exists`
        });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    next(error);
  }
};

/**
 * Get all options with pagination, filtering, and search
 * @route GET /api/options
 * @access Public
 */
const getAllOptions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      option_type,
      is_active,
      search,
      sort = 'option_type',
      order = 'asc',
      include_inactive = false
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Active status filter
    if (req.user?.role === 'admin' && include_inactive === 'true') {
      // Admin can see all options
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
    } else {
      // Non-admin users only see active options
      query.is_active = true;
    }

    // Option type filter
    if (option_type) {
      query.option_type = { $regex: option_type, $options: 'i' };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { option_value: { $regex: search, $options: 'i' } },
        { option_type: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'option_type') {
      sortObj.option_type = order === 'desc' ? -1 : 1;
      sortObj.sort_order = 1; // Secondary sort by sort_order
    } else if (sort === 'name') {
      sortObj.name = order === 'desc' ? -1 : 1;
    } else if (sort === 'sort_order') {
      sortObj.sort_order = order === 'desc' ? -1 : 1;
      sortObj.name = 1; // Secondary sort by name
    } else {
      sortObj.option_type = 1;
      sortObj.sort_order = 1;
    }

    // Execute query with pagination
    const options = await Option.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalItems = await Option.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Log user activity for public access
    if (!req.user || req.user.role !== 'admin') {
      userActivityLogger.info('Options list viewed', {
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        action_type: 'VIEW',
        resource_type: 'Option',
        query_params: {
          page: pageNum,
          limit: limitNum,
          option_type,
          search
        }
      });
    }

    res.json({
      success: true,
      data: options,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get a single option by ID
 * @route GET /api/options/:id
 * @access Public
 */
const getOptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Build query
    const query = { _id: id };

    // Only show active options to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.is_active = true;
    }

    const option = await Option.findOne(query);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Option viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'Option',
      resource_id: option._id
    });

    res.json({
      success: true,
      data: option
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update an option
 * @route PATCH /api/options/:id
 * @access Admin only
 */
const updateOption = async (req, res, next) => {
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

    const { id } = req.params;
    const updates = req.body;

    // Find the option
    const option = await Option.findById(id);
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      option_type: option.option_type,
      option_value: option.option_value,
      name: option.name,
      is_active: option.is_active,
      sort_order: option.sort_order
    };

    // Update allowed fields
    const allowedUpdates = [
      'option_type', 'option_value', 'name', 'is_active', 'sort_order'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        option[field] = updates[field];
      }
    });

    const updatedOption = await option.save();

    // Log admin action with changes
    const changes = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== originalValues[field]) {
        changes[field] = {
          from: originalValues[field],
          to: updates[field]
        };
      }
    });

    // Note: Slug change detection temporarily disabled for debugging
    // if (updatedOption.slug && option.slug && updatedOption.slug !== option.slug) {
    //   changes.slug = {
    //     from: option.slug,
    //     to: updatedOption.slug
    //   };
    // }

    adminAuditLogger.info('Option updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'Option',
      resource_id: updatedOption._id,
      changes
    });

    res.json({
      success: true,
      message: 'Option updated successfully',
      data: updatedOption
    });

  } catch (error) {
    // Handle duplicate option_type + option_value combination
    if (error.code === 11000) {
      if (error.keyValue.option_type && error.keyValue.option_value) {
        return res.status(400).json({
          success: false,
          message: `Option '${error.keyValue.option_type}: ${error.keyValue.option_value}' already exists`
        });
      }
      // Handle duplicate slug
      if (error.keyValue.slug) {
        return res.status(400).json({
          success: false,
          message: `Option with slug '${error.keyValue.slug}' already exists`
        });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    next(error);
  }
};

/**
 * Soft delete an option
 * @route DELETE /api/options/:id
 * @access Admin only
 */
const deleteOption = async (req, res, next) => {
  try {
    const { id } = req.params;

    const option = await Option.findById(id);
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    // Perform soft delete
    await option.softDelete();

    // Log admin action
    adminAuditLogger.info('Option deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'Option',
      resource_id: option._id,
      changes: {
        is_active: {
          from: true,
          to: false
        }
      }
    });

    res.status(204).json({
      success: true,
      message: 'Option deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get option types with their values (Admin and Public)
 * @route GET /api/options/types
 * @access Public
 */
const getOptionTypes = async (req, res, next) => {
  try {
    const { include_inactive = false } = req.query;
    
    // Only admins can see inactive options
    const includeInactive = req.user?.role === 'admin' && include_inactive === 'true';
    
    const optionTypes = await Option.getOptionTypes(includeInactive);

    // Log user activity
    userActivityLogger.info('Option types viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'OptionType',
      query_params: {
        include_inactive: includeInactive
      }
    });

    res.json({
      success: true,
      data: optionTypes
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get option statistics (Admin only)
 * @route GET /api/options/stats
 * @access Admin only
 */
const getOptionStats = async (req, res, next) => {
  try {
    const totalOptions = await Option.countDocuments();
    const activeOptions = await Option.countDocuments({ is_active: true });
    const inactiveOptions = await Option.countDocuments({ is_active: false });

    // Get option types count
    const optionTypes = await Option.distinct('option_type');
    const totalOptionTypes = optionTypes.length;

    // Get most used option types
    const topOptionTypes = await Option.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$option_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          option_type: '$_id',
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOptions,
        activeOptions,
        inactiveOptions,
        totalOptionTypes,
        topOptionTypes
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOption,
  getAllOptions,
  getOptionById,
  updateOption,
  deleteOption,
  getOptionTypes,
  getOptionStats
};
