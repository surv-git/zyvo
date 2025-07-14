/**
 * Platform Controller
 * Handles CRUD operations for e-commerce platform management
 * Includes admin authentication and comprehensive audit logging
 */

const Platform = require('../models/Platform');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const mongoose = require('mongoose');

/**
 * Create a new platform
 * POST /api/v1/platforms
 * Admin access required
 */
const createPlatform = async (req, res) => {
  try {
    // Input validation placeholder
    // TODO: Implement comprehensive input validation using express-validator
    const { name, description, base_url, logo_url, api_credentials_placeholder } = req.body;

    // Basic validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Platform name is required'
      });
    }

    // Check for duplicate platform name
    const existingPlatform = await Platform.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingPlatform) {
      return res.status(400).json({
        success: false,
        message: 'Platform with this name already exists'
      });
    }

    // Create new platform
    const platformData = {
      name: name.trim(),
      description: description?.trim() || null,
      base_url: base_url?.trim() || null,
      logo_url: logo_url?.trim() || null,
      api_credentials_placeholder: api_credentials_placeholder?.trim() || null
    };

    const platform = new Platform(platformData);
    await platform.save();

    // Populate for response
    const savedPlatform = await Platform.findById(platform._id);

    // Admin audit logging
    adminAuditLogger.logResourceCreation(
      req.user.id,
      'Platform',
      platform._id,
      {
        name: platform.name,
        slug: platform.slug,
        is_active: platform.is_active
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(201).json({
      success: true,
      message: 'Platform created successfully',
      data: savedPlatform
    });

  } catch (error) {
    console.error('Error creating platform:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Platform with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating platform'
    });
  }
};

/**
 * Get all platforms with pagination and filtering
 * GET /api/v1/platforms
 * Admin access required
 */
const getAllPlatforms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      is_active,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Filter by active status
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { slug: searchRegex }
      ];
    }

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sort setup
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    // Execute queries
    const [platforms, totalCount] = await Promise.all([
      Platform.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Platform.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: platforms,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        is_active,
        search: search?.trim() || null
      }
    });

  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching platforms'
    });
  }
};

/**
 * Get platform by ID or slug
 * GET /api/v1/platforms/:identifier
 * Admin access required
 */
const getPlatformByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Platform identifier is required'
      });
    }

    let platform;

    // Check if identifier is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      platform = await Platform.findById(identifier);
    } 
    
    // If not found by ID or not a valid ObjectId, try finding by slug
    if (!platform) {
      platform = await Platform.findOne({ slug: identifier.toLowerCase() });
    }

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    res.status(200).json({
      success: true,
      data: platform
    });

  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching platform'
    });
  }
};

/**
 * Update platform
 * PATCH /api/v1/platforms/:id
 * Admin access required
 */
const updatePlatform = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform ID format'
      });
    }

    // Find platform
    const platform = await Platform.findById(id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    // Extract updatable fields
    const allowedUpdates = ['name', 'description', 'base_url', 'logo_url', 'api_credentials_placeholder', 'is_active'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string') {
          updates[field] = req.body[field].trim() || null;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // If no valid updates provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided'
      });
    }

    // Check for name uniqueness if name is being updated
    if (updates.name && updates.name !== platform.name) {
      const existingPlatform = await Platform.findOne({ 
        name: { $regex: new RegExp(`^${updates.name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingPlatform) {
        return res.status(400).json({
          success: false,
          message: 'Platform with this name already exists'
        });
      }
    }

    // Store original values for audit logging
    const originalValues = {};
    Object.keys(updates).forEach(field => {
      originalValues[field] = platform[field];
    });

    // Apply updates
    Object.assign(platform, updates);
    await platform.save();

    // Admin audit logging
    adminAuditLogger.logResourceUpdate(
      req.user.id,
      'Platform',
      platform._id,
      originalValues,
      updates,
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      message: 'Platform updated successfully',
      data: platform
    });

  } catch (error) {
    console.error('Error updating platform:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Platform with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating platform'
    });
  }
};

/**
 * Delete platform (soft delete)
 * DELETE /api/v1/platforms/:id
 * Admin access required
 */
const deletePlatform = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform ID format'
      });
    }

    // Find platform
    const platform = await Platform.findById(id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    // Soft delete (set is_active to false)
    platform.is_active = false;
    platform.updatedAt = new Date();
    await platform.save();

    // Admin audit logging
    adminAuditLogger.logResourceDeletion(
      req.user.id,
      'Platform',
      platform._id,
      {
        name: platform.name,
        slug: platform.slug,
        soft_delete: true
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting platform:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting platform'
    });
  }
};

module.exports = {
  createPlatform,
  getAllPlatforms,
  getPlatformByIdOrSlug,
  updatePlatform,
  deletePlatform
};
