/**
 * Listing Controller
 * Handles CRUD operations for product variant listing management
 * All operations require admin authentication and include audit logging
 */

const Listing = require('../models/Listing');
const ProductVariant = require('../models/ProductVariant');
const Platform = require('../models/Platform');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Create a new listing
 * POST /api/v1/listings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createListing = async (req, res) => {
  try {
    const {
      product_variant_id,
      platform_id,
      platform_sku,
      platform_product_id,
      listing_status,
      platform_price,
      platform_commission_percentage,
      platform_fixed_fee,
      platform_shipping_fee,
      platform_specific_data,
      is_active_on_platform
    } = req.body;

    // Validate product variant exists
    const productVariant = await ProductVariant.findById(product_variant_id);
    if (!productVariant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID provided',
        error: 'Product variant not found'
      });
    }

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
        message: 'Cannot create listing for inactive platform',
        error: 'Platform is not active'
      });
    }

    // Check for existing listing for this variant-platform combination
    const existingListing = await Listing.findOne({
      product_variant_id,
      platform_id
    });

    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: 'Listing already exists for this variant on this platform',
        error: 'Duplicate variant-platform combination'
      });
    }

    // Validation for live listings
    if (listing_status === 'Live' && (!platform_price || platform_price <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Live listings must have a valid platform price',
        error: 'Invalid price for live listing'
      });
    }

    // Create new listing
    const listingData = {
      product_variant_id,
      platform_id,
      listing_status: listing_status || 'Draft',
      is_active_on_platform: is_active_on_platform !== undefined ? is_active_on_platform : true
    };

    // Add optional fields if provided
    if (platform_sku) listingData.platform_sku = platform_sku;
    if (platform_product_id) listingData.platform_product_id = platform_product_id;
    if (platform_price !== undefined) listingData.platform_price = platform_price;
    if (platform_commission_percentage !== undefined) listingData.platform_commission_percentage = platform_commission_percentage;
    if (platform_fixed_fee !== undefined) listingData.platform_fixed_fee = platform_fixed_fee;
    if (platform_shipping_fee !== undefined) listingData.platform_shipping_fee = platform_shipping_fee;
    if (platform_specific_data) listingData.platform_specific_data = platform_specific_data;

    const listing = new Listing(listingData);
    await listing.save();

    // Populate references for response
    await listing.populate([
      {
        path: 'product_variant_id',
        select: 'sku_code product_id option_values price'
      },
      {
        path: 'platform_id',
        select: 'name slug base_url is_active'
      }
    ]);

    // Log admin action
    adminAuditLogger.logResourceCreation(
      req.user?.id,
      'Listing',
      listing._id,
      {
        product_variant_id,
        platform_id,
        listing_status: listing.listing_status,
        platform_price: listing.platform_price
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error creating listing:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key error (compound unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Listing already exists for this variant on this platform',
        error: 'Duplicate variant-platform combination'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create listing'
    });
  }
};

/**
 * Get all listings with pagination and filtering
 * GET /api/v1/listings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      platform_id,
      product_variant_id,
      listing_status,
      is_active_on_platform,
      platform_sku,
      platform_product_id,
      needs_sync,
      has_price,
      search,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};

    if (platform_id) {
      filter.platform_id = platform_id;
    }

    if (product_variant_id) {
      filter.product_variant_id = product_variant_id;
    }

    if (listing_status) {
      filter.listing_status = listing_status;
    }

    if (is_active_on_platform !== undefined) {
      filter.is_active_on_platform = is_active_on_platform === 'true';
    }

    if (platform_sku) {
      filter.platform_sku = new RegExp(platform_sku, 'i');
    }

    if (platform_product_id) {
      filter.platform_product_id = new RegExp(platform_product_id, 'i');
    }

    // Search across multiple fields
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { platform_sku: searchRegex },
        { platform_product_id: searchRegex }
      ];
    }

    // Filter for listings needing sync
    if (needs_sync === 'true') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filter.$or = [
        { last_synced_at: null },
        { last_synced_at: { $lt: oneDayAgo } }
      ];
      filter.is_active_on_platform = true;
    }

    // Filter for listings with valid price
    if (has_price === 'true') {
      filter.platform_price = { $exists: true, $ne: null, $gt: 0 };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('product_variant_id', 'sku_code product_id option_values price')
        .populate('platform_id', 'name slug base_url is_active')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: 'Listings retrieved successfully',
      data: listings,
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
    console.error('Error retrieving listings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve listings'
    });
  }
};

/**
 * Get listing by ID
 * GET /api/v1/listings/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate('product_variant_id', 'sku_code product_id option_values price')
      .populate('platform_id', 'name slug base_url is_active');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        error: 'No listing found with the provided ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Listing retrieved successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error retrieving listing:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve listing'
    });
  }
};

/**
 * Update listing
 * PATCH /api/v1/listings/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;
    delete updates.product_variant_id; // Don't allow changing variant reference
    delete updates.platform_id; // Don't allow changing platform reference

    // Find existing listing
    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        error: 'No listing found with the provided ID'
      });
    }

    // Validation for live listings
    const newStatus = updates.listing_status || existingListing.listing_status;
    const newPrice = updates.platform_price !== undefined ? updates.platform_price : existingListing.platform_price;
    
    if (newStatus === 'Live' && (!newPrice || newPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Live listings must have a valid platform price',
        error: 'Invalid price for live listing'
      });
    }

    // Update listing
    const listing = await Listing.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'product_variant_id',
        select: 'sku_code product_id option_values price'
      },
      {
        path: 'platform_id',
        select: 'name slug base_url is_active'
      }
    ]);

    // Log admin action
    adminAuditLogger.logResourceUpdate(
      req.user?.id,
      'Listing',
      listing._id,
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
      message: 'Listing updated successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error updating listing:', error);

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
        message: 'Invalid listing ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update listing'
    });
  }
};

/**
 * Delete listing (soft delete)
 * DELETE /api/v1/listings/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        error: 'No listing found with the provided ID'
      });
    }

    // Soft delete by setting is_active_on_platform to false and status to Deactivated
    await listing.softDelete();

    // Log admin action
    adminAuditLogger.logResourceDeletion(
      req.user?.id,
      'Listing',
      listing._id,
      {
        product_variant_id: listing.product_variant_id,
        platform_id: listing.platform_id,
        soft_delete: true
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(204).json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting listing:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to delete listing'
    });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing
};
