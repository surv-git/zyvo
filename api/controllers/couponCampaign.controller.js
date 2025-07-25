/**
 * Coupon Campaign Controller
 * Handles all CRUD operations for coupon campaigns
 * Includes complex logic for generating user-specific coupon codes
 */

const { validationResult } = require('express-validator');
const CouponCampaign = require('../models/CouponCampaign');
const UserCoupon = require('../models/UserCoupon');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const crypto = require('crypto');

/**
 * Create a new coupon campaign
 * POST /api/v1/admin/coupon-campaigns
 */
const createCouponCampaign = async (req, res, next) => {
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
      code_prefix,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_coupon_discount,
      valid_from,
      valid_until,
      max_global_usage,
      max_usage_per_user,
      is_unique_per_user,
      eligibility_criteria,
      applicable_category_ids,
      applicable_product_variant_ids,
      is_active
    } = req.body;

    // Create new coupon campaign
    const couponCampaign = new CouponCampaign({
      name,
      description,
      code_prefix: code_prefix ? code_prefix.toUpperCase() : null,
      discount_type,
      discount_value,
      min_purchase_amount: min_purchase_amount || 0,
      max_coupon_discount,
      valid_from: new Date(valid_from),
      valid_until: new Date(valid_until),
      max_global_usage,
      max_usage_per_user: max_usage_per_user || 1,
      is_unique_per_user: is_unique_per_user !== undefined ? is_unique_per_user : true,
      eligibility_criteria: eligibility_criteria || ['NONE'],
      applicable_category_ids: applicable_category_ids || [],
      applicable_product_variant_ids: applicable_product_variant_ids || [],
      is_active: is_active !== undefined ? is_active : true
    });

    await couponCampaign.save();

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.user._id || req.user.id,
      action: 'create_coupon_campaign',
      resource_type: 'CouponCampaign',
      resource_id: couponCampaign._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        name: couponCampaign.name,
        discount_type: couponCampaign.discount_type,
        discount_value: couponCampaign.discount_value
      }
    });

    res.status(201).json({
      success: true,
      message: 'Coupon campaign created successfully',
      data: couponCampaign
    });

  } catch (error) {
    console.error('Error creating coupon campaign:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A coupon campaign with this ${field} already exists`
      });
    }
    
    next(error);
  }
};

/**
 * Get all coupon campaigns with filtering and pagination
 * GET /api/v1/admin/coupon-campaigns
 */
const getAllCouponCampaigns = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      is_active,
      discount_type,
      eligibility_criteria,
      valid_from_start,
      valid_from_end,
      valid_until_start,
      valid_until_end,
      search,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }

    if (discount_type) {
      filter.discount_type = discount_type;
    }

    if (eligibility_criteria) {
      filter.eligibility_criteria = { $in: eligibility_criteria.split(',') };
    }

    // Date range filters
    if (valid_from_start || valid_from_end) {
      filter.valid_from = {};
      if (valid_from_start) filter.valid_from.$gte = new Date(valid_from_start);
      if (valid_from_end) filter.valid_from.$lte = new Date(valid_from_end);
    }

    if (valid_until_start || valid_until_end) {
      filter.valid_until = {};
      if (valid_until_start) filter.valid_until.$gte = new Date(valid_until_start);
      if (valid_until_end) filter.valid_until.$lte = new Date(valid_until_end);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const sortObj = { [sort_by]: sortOrder };

    // Execute query with population
    const [campaigns, totalCount] = await Promise.all([
      CouponCampaign.find(filter)
        .populate('applicable_category_ids', 'name slug')
        .populate('applicable_product_variant_ids', 'sku product_id')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      CouponCampaign.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Coupon campaigns retrieved successfully',
      data: campaigns,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_count: totalCount,
        limit: parseInt(limit),
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      filters_applied: filter
    });

  } catch (error) {
    console.error('Error getting coupon campaigns:', error);
    next(error);
  }
};

/**
 * Get a specific coupon campaign by ID or slug
 * GET /api/v1/admin/coupon-campaigns/:identifier
 */
const getCouponCampaignById = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const campaign = await CouponCampaign.findBySlugOrId(identifier)
      .populate('applicable_category_ids', 'name slug')
      .populate('applicable_product_variant_ids', 'sku product_id');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Coupon campaign not found'
      });
    }

    // Get related statistics
    const userCouponsCount = await UserCoupon.countDocuments({
      coupon_campaign_id: campaign._id
    });

    const redeemedCouponsCount = await UserCoupon.countDocuments({
      coupon_campaign_id: campaign._id,
      is_redeemed: true
    });

    const campaignData = campaign.toObject();
    campaignData.statistics = {
      total_user_coupons_generated: userCouponsCount,
      total_redeemed_coupons: redeemedCouponsCount,
      redemption_rate: userCouponsCount > 0 ? Math.round((redeemedCouponsCount / userCouponsCount) * 100) : 0
    };

    res.status(200).json({
      success: true,
      message: 'Coupon campaign retrieved successfully',
      data: campaignData
    });

  } catch (error) {
    console.error('Error getting coupon campaign by ID:', error);
    next(error);
  }
};

/**
 * Update a coupon campaign
 * PATCH /api/v1/admin/coupon-campaigns/:id
 */
const updateCouponCampaign = async (req, res, next) => {
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
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.current_global_usage;
    delete updateData.slug; // Slug will be regenerated if name changes

    // Uppercase code_prefix if provided
    if (updateData.code_prefix) {
      updateData.code_prefix = updateData.code_prefix.toUpperCase();
    }

    // Convert date strings to Date objects
    if (updateData.valid_from) {
      updateData.valid_from = new Date(updateData.valid_from);
    }
    if (updateData.valid_until) {
      updateData.valid_until = new Date(updateData.valid_until);
    }

    const campaign = await CouponCampaign.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('applicable_category_ids', 'name slug')
     .populate('applicable_product_variant_ids', 'sku product_id');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Coupon campaign not found'
      });
    }

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.user._id || req.user.id,
      action: 'update_coupon_campaign',
      resource_type: 'CouponCampaign',
      resource_id: campaign._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        updated_fields: Object.keys(updateData),
        name: campaign.name
      }
    });

    res.status(200).json({
      success: true,
      message: 'Coupon campaign updated successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error updating coupon campaign:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    next(error);
  }
};

/**
 * Soft delete a coupon campaign
 * DELETE /api/v1/admin/coupon-campaigns/:id
 */
const deleteCouponCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await CouponCampaign.findByIdAndUpdate(
      id,
      { is_active: false, updatedAt: new Date() },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Coupon campaign not found'
      });
    }

    // Also deactivate all related user coupons
    await UserCoupon.updateMany(
      { coupon_campaign_id: id },
      { is_active: false, updatedAt: new Date() }
    );

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.user._id || req.user.id,
      action: 'delete_coupon_campaign',
      resource_type: 'CouponCampaign',
      resource_id: campaign._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        name: campaign.name,
        soft_delete: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Coupon campaign deleted successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error deleting coupon campaign:', error);
    next(error);
  }
};

/**
 * Generate user-specific coupon codes
 * POST /api/v1/admin/coupon-campaigns/:id/generate-codes
 */
const generateUserCoupons = async (req, res, next) => {
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
    const { user_ids, number_of_codes = 1 } = req.body;

    // Validate input
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids must be a non-empty array'
      });
    }

    // Find the campaign
    const campaign = await CouponCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Coupon campaign not found'
      });
    }

    // Check if campaign is active and valid
    if (!campaign.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate codes for inactive campaign'
      });
    }

    if (!campaign.canGenerateMoreCodes()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign has reached maximum global usage limit'
      });
    }

    const generatedCoupons = [];
    const errors_encountered = [];

    // Generate codes for each user
    for (const user_id of user_ids) {
      try {
        // Check if user already has a coupon for this campaign (if unique_per_user)
        if (campaign.is_unique_per_user) {
          const existingCoupon = await UserCoupon.findOne({
            coupon_campaign_id: id,
            user_id: user_id
          });

          if (existingCoupon) {
            errors_encountered.push({
              user_id,
              error: 'User already has a coupon for this campaign'
            });
            continue;
          }
        }

        // Generate unique coupon code
        let coupon_code;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
          coupon_code = campaign.code_prefix 
            ? `${campaign.code_prefix}${randomString}`
            : `COUPON-${randomString}`;
          attempts++;
        } while (
          await UserCoupon.findOne({ coupon_code }) && 
          attempts < maxAttempts
        );

        if (attempts >= maxAttempts) {
          errors_encountered.push({
            user_id,
            error: 'Failed to generate unique coupon code after multiple attempts'
          });
          continue;
        }

        // Create UserCoupon document
        const userCoupon = new UserCoupon({
          coupon_campaign_id: id,
          user_id,
          coupon_code,
          expires_at: campaign.valid_until
        });

        await userCoupon.save();
        generatedCoupons.push({
          user_id,
          coupon_code,
          user_coupon_id: userCoupon._id
        });

      } catch (error) {
        console.error(`Error generating coupon for user ${user_id}:`, error);
        errors_encountered.push({
          user_id,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.user._id || req.user.id,
      action: 'generate_user_coupons',
      resource_type: 'CouponCampaign',
      resource_id: campaign._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        campaign_name: campaign.name,
        requested_users: user_ids.length,
        successful_generations: generatedCoupons.length,
        failed_generations: errors_encountered.length
      }
    });

    const responseData = {
      success: true,
      message: `Generated ${generatedCoupons.length} coupon codes successfully`,
      data: {
        campaign_id: id,
        campaign_name: campaign.name,
        generated_coupons: generatedCoupons,
        total_generated: generatedCoupons.length,
        total_requested: user_ids.length
      }
    };

    if (errors_encountered.length > 0) {
      responseData.errors = errors_encountered;
      responseData.message += ` (${errors_encountered.length} failed)`;
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error generating user coupons:', error);
    next(error);
  }
};

/**
 * Helper function to generate unique coupon code
 */
const generateUniqueCouponCode = async (prefix = '', length = 8) => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const randomString = crypto.randomBytes(length / 2).toString('hex').toUpperCase();
    const couponCode = prefix ? `${prefix}${randomString}` : randomString;
    
    const existingCoupon = await UserCoupon.findOne({ coupon_code: couponCode });
    if (!existingCoupon) {
      return couponCode;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique coupon code');
};

module.exports = {
  createCouponCampaign,
  getAllCouponCampaigns,
  getCouponCampaignById,
  updateCouponCampaign,
  deleteCouponCampaign,
  generateUserCoupons,
  generateUniqueCouponCode
};
