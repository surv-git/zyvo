/**
 * Platform Fee Controller
 * Handles CRUD operations for platform fee management
 * All operations require admin authentication and include audit logging
 */

const PlatformFee = require('../models/PlatformFee');
const Platform = require('../models/Platform');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Create a new platform fee
 * POST /api/v1/platform-fees
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPlatformFee = async (req, res) => {
  try {
    const {
      platform_id,
      fee_type,
      description,
      value,
      is_percentage,
      effective_date,
      end_date
    } = req.body;

    // Validate platform exists
    const platform = await Platform.findById(platform_id);
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform ID provided',
        error: 'Platform not found'
      });
    }

    // Check if platform is active
    if (!platform.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create fee for inactive platform',
        error: 'Platform is not active'
      });
    }

    // Additional validation for percentage values
    if (is_percentage && value > 100) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Percentage value cannot exceed 100'
      });
    }

    // Date validation
    const effectiveDate = effective_date ? new Date(effective_date) : new Date();
    const endDate = end_date ? new Date(end_date) : null;

    if (endDate && endDate <= effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'End date must be after effective date'
      });
    }

    // Create new platform fee
    const platformFeeData = {
      platform_id,
      fee_type,
      value,
      is_percentage: is_percentage || false,
      effective_date: effectiveDate,
      end_date: endDate
    };

    if (description) {
      platformFeeData.description = description;
    }

    const platformFee = new PlatformFee(platformFeeData);
    await platformFee.save();

    // Populate platform details for response
    await platformFee.populate('platform_id', 'name slug');

    // Log admin action
    adminAuditLogger.logResourceCreation(
      req.user?.id,
      'PlatformFee',
      platformFee._id,
      {
        platform_id,
        fee_type,
        value,
        is_percentage: platformFee.is_percentage
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(201).json({
      success: true,
      message: 'Platform fee created successfully',
      data: platformFee
    });

  } catch (error) {
    console.error('Error creating platform fee:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create platform fee'
    });
  }
};

/**
 * Get all platform fees with pagination and filtering
 * GET /api/v1/platform-fees
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllPlatformFees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      platform_id,
      fee_type,
      is_active,
      effective_date_from,
      effective_date_to,
      end_date_from,
      end_date_to,
      is_currently_active,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};

    if (platform_id) {
      filter.platform_id = platform_id;
    }

    if (fee_type) {
      filter.fee_type = fee_type;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }

    // Date range filters
    if (effective_date_from || effective_date_to) {
      filter.effective_date = {};
      if (effective_date_from) {
        filter.effective_date.$gte = new Date(effective_date_from);
      }
      if (effective_date_to) {
        filter.effective_date.$lte = new Date(effective_date_to);
      }
    }

    if (end_date_from || end_date_to) {
      filter.end_date = {};
      if (end_date_from) {
        filter.end_date.$gte = new Date(end_date_from);
      }
      if (end_date_to) {
        filter.end_date.$lte = new Date(end_date_to);
      }
    }

    // Filter for currently active fees (within date range)
    if (is_currently_active === 'true') {
      const now = new Date();
      filter.is_active = true;
      filter.effective_date = { $lte: now };
      filter.$or = [
        { end_date: null },
        { end_date: { $gt: now } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [platformFees, total] = await Promise.all([
      PlatformFee.find(filter)
        .populate('platform_id', 'name slug base_url is_active')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PlatformFee.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: 'Platform fees retrieved successfully',
      data: platformFees,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error retrieving platform fees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve platform fees'
    });
  }
};

/**
 * Get platform fee by ID
 * GET /api/v1/platform-fees/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlatformFeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const platformFee = await PlatformFee.findById(id)
      .populate('platform_id', 'name slug base_url is_active');

    if (!platformFee) {
      return res.status(404).json({
        success: false,
        message: 'Platform fee not found',
        error: 'No platform fee found with the provided ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Platform fee retrieved successfully',
      data: platformFee
    });

  } catch (error) {
    console.error('Error retrieving platform fee:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform fee ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve platform fee'
    });
  }
};

/**
 * Update platform fee
 * PATCH /api/v1/platform-fees/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePlatformFee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;

    // Find existing platform fee
    const existingPlatformFee = await PlatformFee.findById(id);
    if (!existingPlatformFee) {
      return res.status(404).json({
        success: false,
        message: 'Platform fee not found',
        error: 'No platform fee found with the provided ID'
      });
    }

    // Validate platform_id if provided
    if (updates.platform_id) {
      const platform = await Platform.findById(updates.platform_id);
      if (!platform) {
        return res.status(400).json({
          success: false,
          message: 'Invalid platform ID provided',
          error: 'Platform not found'
        });
      }
    }

    // Additional validation for percentage values
    if (updates.is_percentage && updates.value && updates.value > 100) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Percentage value cannot exceed 100'
      });
    }

    // Date validation
    const effectiveDate = updates.effective_date ? new Date(updates.effective_date) : existingPlatformFee.effective_date;
    const endDate = updates.end_date ? new Date(updates.end_date) : existingPlatformFee.end_date;

    if (endDate && endDate <= effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'End date must be after effective date'
      });
    }

    // Update platform fee
    const platformFee = await PlatformFee.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('platform_id', 'name slug base_url is_active');

    // Log admin action
    adminAuditLogger.logResourceUpdate(
      req.user?.id,
      'PlatformFee',
      platformFee._id,
      {
        updated_fields: Object.keys(updates),
        changes: updates
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      message: 'Platform fee updated successfully',
      data: platformFee
    });

  } catch (error) {
    console.error('Error updating platform fee:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform fee ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update platform fee'
    });
  }
};

/**
 * Delete platform fee (soft delete)
 * DELETE /api/v1/platform-fees/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deletePlatformFee = async (req, res) => {
  try {
    const { id } = req.params;

    const platformFee = await PlatformFee.findById(id);
    if (!platformFee) {
      return res.status(404).json({
        success: false,
        message: 'Platform fee not found',
        error: 'No platform fee found with the provided ID'
      });
    }

    // Soft delete by setting is_active to false
    await platformFee.softDelete();

    // Log admin action
    adminAuditLogger.logResourceDeletion(
      req.user?.id,
      'PlatformFee',
      platformFee._id,
      {
        platform_id: platformFee.platform_id,
        fee_type: platformFee.fee_type,
        soft_delete: true
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(204).json({
      success: true,
      message: 'Platform fee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting platform fee:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform fee ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to delete platform fee'
    });
  }
};

module.exports = {
  createPlatformFee,
  getAllPlatformFees,
  getPlatformFeeById,
  updatePlatformFee,
  deletePlatformFee
};
