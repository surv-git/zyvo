/**
 * Brand Controller
 * Handles all brand-related operations for the e-commerce API
 * Manages brand information that can be linked to products
 */

const Brand = require('../models/Brand');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new brand
 * @route POST /api/v1/brands
 * @access Admin only
 */
const createBrand = async (req, res, next) => {
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
      name,
      description,
      logo_url,
      website,
      contact_email
    } = req.body;

    // Create new brand
    const brand = new Brand({
      name,
      description: description || null,
      logo_url: logo_url || null,
      website: website || null,
      contact_email: contact_email || null
    });

    const savedBrand = await brand.save();

    // Log admin action
    adminAuditLogger.info('Brand created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'Brand',
      resource_id: savedBrand._id,
      changes: {
        name: savedBrand.name,
        slug: savedBrand.slug,
        description: savedBrand.description,
        logo_url: savedBrand.logo_url,
        website: savedBrand.website,
        contact_email: savedBrand.contact_email
      }
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: savedBrand
    });

  } catch (error) {
    // Handle duplicate name/slug errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Brand with this ${field} already exists`,
        field: field
      });
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
 * Get all brands with pagination, filtering, and search
 * @route GET /api/v1/brands
 * @access Public
 */
const getAllBrands = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      is_active,
      search,
      sort = 'name',
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
      // Admin can see all brands
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
    } else {
      // Non-admin users only see active brands
      query.is_active = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const brands = await Brand.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalItems = await Brand.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Log user activity for public access
    if (!req.user || req.user.role !== 'admin') {
      userActivityLogger.info('Brands list viewed', {
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        action_type: 'VIEW',
        resource_type: 'Brand',
        query_params: {
          page: pageNum,
          limit: limitNum,
          search,
          sort,
          order
        }
      });
    }

    res.json({
      success: true,
      data: brands,
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
 * Get a single brand by ID or slug
 * @route GET /api/v1/brands/:identifier
 * @access Public
 */
const getBrandByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    // Build query - try to find by ID first, then by slug
    let query;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      query = { _id: identifier };
    } else {
      // Assume it's a slug
      query = { slug: identifier };
    }

    // Only show active brands to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.is_active = true;
    }

    const brand = await Brand.findOne(query);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Brand viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'Brand',
      resource_id: brand._id
    });

    res.json({
      success: true,
      data: brand
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a brand
 * @route PATCH /api/v1/brands/:id
 * @access Admin only
 */
const updateBrand = async (req, res, next) => {
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

    // Find the brand
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      name: brand.name,
      description: brand.description,
      logo_url: brand.logo_url,
      website: brand.website,
      contact_email: brand.contact_email,
      is_active: brand.is_active
    };

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'logo_url', 'website', 'contact_email', 'is_active'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        brand[field] = updates[field];
      }
    });

    const updatedBrand = await brand.save();

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

    adminAuditLogger.info('Brand updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'Brand',
      resource_id: updatedBrand._id,
      changes
    });

    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand
    });

  } catch (error) {
    // Handle duplicate name/slug errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Brand with this ${field} already exists`,
        field: field
      });
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
 * Soft delete a brand
 * @route DELETE /api/v1/brands/:id
 * @access Admin only
 */
const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Perform soft delete
    await brand.softDelete();

    // Log admin action
    adminAuditLogger.info('Brand deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'Brand',
      resource_id: brand._id,
      changes: {
        is_active: {
          from: true,
          to: false
        }
      }
    });

    res.status(204).json({
      success: true,
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get brand statistics (Admin only)
 * @route GET /api/v1/brands/stats
 * @access Admin only
 */
const getBrandStats = async (req, res, next) => {
  try {
    const totalBrands = await Brand.countDocuments();
    const activeBrands = await Brand.countDocuments({ is_active: true });
    const inactiveBrands = await Brand.countDocuments({ is_active: false });
    
    // Get brands with most products (placeholder - would need Product model integration)
    const brandsWithLogos = await Brand.countDocuments({ 
      logo_url: { $ne: null, $ne: '' },
      is_active: true 
    });
    
    const brandsWithWebsites = await Brand.countDocuments({ 
      website: { $ne: null, $ne: '' },
      is_active: true 
    });

    res.json({
      success: true,
      data: {
        totalBrands,
        activeBrands,
        inactiveBrands,
        brandsWithLogos,
        brandsWithWebsites,
        logoPercentage: activeBrands > 0 ? ((brandsWithLogos / activeBrands) * 100).toFixed(1) : 0,
        websitePercentage: activeBrands > 0 ? ((brandsWithWebsites / activeBrands) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandByIdOrSlug,
  updateBrand,
  deleteBrand,
  getBrandStats
};
