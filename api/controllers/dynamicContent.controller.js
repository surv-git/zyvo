/**
 * Dynamic Content Controller
 * Handles CRUD operations for dynamic content management
 * Supports both admin and public API endpoints
 */

const DynamicContent = require('../models/DynamicContent');
const { validationResult } = require('express-validator');

/**
 * Admin Controllers
 */

/**
 * @desc    Create new dynamic content item
 * @route   POST /api/v1/admin/dynamic-content
 * @access  Admin
 */
const createDynamicContent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const contentData = {
      ...req.body,
      created_by: req.user.id
    };

    // Create and validate content
    const content = new DynamicContent(contentData);
    
    // Additional validation based on type
    try {
      content.validateContentByType();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    await content.save();

    // Populate creator information
    await content.populate('created_by', 'name email');

    // Log admin action
    if (req.adminAuditLogger) {
      req.adminAuditLogger.log('CREATE_DYNAMIC_CONTENT', {
        contentId: content._id,
        contentName: content.name,
        contentType: content.type,
        locationKey: content.location_key
      });
    }

    res.status(201).json({
      success: true,
      message: 'Dynamic content created successfully',
      data: content
    });

  } catch (error) {
    console.error('Create dynamic content error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Content with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create dynamic content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all dynamic content items (Admin view)
 * @route   GET /api/v1/admin/dynamic-content
 * @access  Admin
 */
const getAllDynamicContentAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      location_key,
      is_active,
      name,
      start_date,
      end_date,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (type) query.type = type;
    if (location_key) query.location_key = location_key;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    if (name) query.name = { $regex: name, $options: 'i' };
    
    // Date range filtering
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) query.createdAt.$gte = new Date(start_date);
      if (end_date) query.createdAt.$lte = new Date(end_date);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const sortObj = { [sort_by]: sortOrder };

    // Execute query
    const [content, totalCount] = await Promise.all([
      DynamicContent.find(query)
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      DynamicContent.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: content,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: parseInt(limit),
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get all dynamic content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dynamic content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single dynamic content item (Admin view)
 * @route   GET /api/v1/admin/dynamic-content/:id
 * @access  Admin
 */
const getDynamicContentAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await DynamicContent.findById(id)
      .populate('created_by', 'name email createdAt')
      .populate('updated_by', 'name email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Dynamic content not found'
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Get dynamic content error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid content ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dynamic content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update dynamic content item
 * @route   PATCH /api/v1/admin/dynamic-content/:id
 * @access  Admin
 */
const updateDynamicContent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const content = await DynamicContent.findById(id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Dynamic content not found'
      });
    }

    // Apply updates
    Object.assign(content, updateData);

    // Validate content based on type if type or content fields changed
    try {
      content.validateContentByType();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    await content.save();

    // Populate user information
    await content.populate('created_by', 'name email');
    await content.populate('updated_by', 'name email');

    // Log admin action
    if (req.adminAuditLogger) {
      req.adminAuditLogger.log('UPDATE_DYNAMIC_CONTENT', {
        contentId: content._id,
        contentName: content.name,
        changes: Object.keys(updateData)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dynamic content updated successfully',
      data: content
    });

  } catch (error) {
    console.error('Update dynamic content error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid content ID format'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Content with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update dynamic content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete dynamic content item (soft delete)
 * @route   DELETE /api/v1/admin/dynamic-content/:id
 * @access  Admin
 */
const deleteDynamicContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await DynamicContent.findById(id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Dynamic content not found'
      });
    }

    // Soft delete by setting is_active to false
    content.is_active = false;
    content.updated_by = req.user.id;
    await content.save();

    // Log admin action
    if (req.adminAuditLogger) {
      req.adminAuditLogger.log('DELETE_DYNAMIC_CONTENT', {
        contentId: content._id,
        contentName: content.name,
        contentType: content.type
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dynamic content deleted successfully'
    });

  } catch (error) {
    console.error('Delete dynamic content error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid content ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete dynamic content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Public Controllers
 */

/**
 * @desc    Get active content by location and type
 * @route   GET /api/v1/content/:locationKey/:type
 * @access  Public
 */
const getActiveContent = async (req, res) => {
  try {
    const { locationKey, type } = req.params;
    const { audience } = req.query;

    // Validate type
    const validTypes = ['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    // Parse target audience if provided
    const targetAudience = audience ? audience.split(',').map(tag => tag.trim()) : [];

    // Get active content
    const content = await DynamicContent.getActiveContent(
      locationKey, 
      type.toUpperCase(),
      { targetAudience }
    );

    if (!content || content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active content found for the specified location and type'
      });
    }

    // Return only public fields
    const publicContent = content.map(item => item.getPublicFields());

    res.status(200).json({
      success: true,
      data: publicContent,
      count: publicContent.length
    });

  } catch (error) {
    console.error('Get active content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all available content locations/types
 * @route   GET /api/v1/content/locations
 * @access  Public
 */
const getAvailableContentLocations = async (req, res) => {
  try {
    const locations = await DynamicContent.getAvailableLocations();

    res.status(200).json({
      success: true,
      data: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('Get available locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get content statistics (Admin)
 * @route   GET /api/v1/admin/dynamic-content/stats
 * @access  Admin
 */
const getContentStats = async (req, res) => {
  try {
    const stats = await DynamicContent.getContentStats();
    
    // Calculate totals
    const totals = stats.reduce((acc, stat) => {
      acc.total += stat.total;
      acc.active += stat.active;
      acc.inactive += stat.inactive;
      return acc;
    }, { total: 0, active: 0, inactive: 0 });

    res.status(200).json({
      success: true,
      data: {
        by_type: stats,
        totals
      }
    });

  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  // Admin controllers
  createDynamicContent,
  getAllDynamicContentAdmin,
  getDynamicContentAdmin,
  updateDynamicContent,
  deleteDynamicContent,
  getContentStats,
  
  // Public controllers
  getActiveContent,
  getAvailableContentLocations
};
