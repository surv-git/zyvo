/**
 * User Coupon Controller
 * Handles user-facing coupon operations and admin management
 * Includes complex validation logic for applying coupons
 */

const { validationResult } = require('express-validator');
const UserCoupon = require('../models/UserCoupon');
const CouponCampaign = require('../models/CouponCampaign');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Get user's coupons (User-facing)
 * GET /api/v1/user/coupons
 */
const getMyCoupons = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      is_redeemed,
      status = 'active' // active, expired, redeemed, all
    } = req.query;

    const userId = req.user.id;
    
    // Build filter
    const filter = { user_id: userId };
    
    if (is_redeemed !== undefined) {
      filter.is_redeemed = is_redeemed === 'true';
    }
    
    // Status-based filtering
    const now = new Date();
    switch (status) {
      case 'active':
        filter.is_active = true;
        filter.is_redeemed = false;
        filter.expires_at = { $gte: now };
        break;
      case 'expired':
        filter.expires_at = { $lt: now };
        break;
      case 'redeemed':
        filter.is_redeemed = true;
        break;
      case 'all':
        // No additional filters
        break;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [coupons, totalCount] = await Promise.all([
      UserCoupon.find(filter)
        .populate({
          path: 'coupon_campaign_id',
          select: 'name description discount_type discount_value min_purchase_amount max_coupon_discount valid_from valid_until'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserCoupon.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    // Transform coupons for safe response
    const safeCoupons = coupons.map(coupon => coupon.toSafeObject());
    
    res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: safeCoupons,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_count: totalCount,
        limit: parseInt(limit),
        has_next_page: parseInt(page) < totalPages,
        has_prev_page: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error getting user coupons:', error);
    next(error);
  }
};

/**
 * Get specific coupon by code (User-facing)
 * GET /api/v1/user/coupons/:code
 */
const getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;
    
    const coupon = await UserCoupon.findByCodeAndUser(code, userId);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon retrieved successfully',
      data: coupon.toSafeObject()
    });

  } catch (error) {
    console.error('Error getting coupon by code:', error);
    next(error);
  }
};

/**
 * Apply coupon to cart/order (User-facing)
 * POST /api/v1/user/apply-coupon
 */
const applyCoupon = async (req, res, next) => {
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
      coupon_code,
      cart_total_amount,
      cart_item_details // Array of {product_variant_id, category_id, quantity, price}
    } = req.body;

    const userId = req.user.id;

    // Find the user coupon
    const userCoupon = await UserCoupon.findByCodeAndUser(coupon_code, userId);
    
    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found or does not belong to you'
      });
    }

    // Check if coupon can be used
    const canUseResult = await userCoupon.canBeUsed();
    if (!canUseResult.valid) {
      return res.status(400).json({
        success: false,
        message: canUseResult.reason
      });
    }

    const campaign = canUseResult.campaign;

    // Validate minimum purchase amount
    if (cart_total_amount < campaign.min_purchase_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${campaign.min_purchase_amount} required`
      });
    }

    // Check applicable categories and products
    const applicabilityCheck = await validateCouponApplicability(
      campaign,
      cart_item_details
    );

    if (!applicabilityCheck.valid) {
      return res.status(400).json({
        success: false,
        message: applicabilityCheck.message
      });
    }

    // Check eligibility criteria
    const eligibilityCheck = await validateUserEligibility(
      campaign.eligibility_criteria,
      userId
    );

    if (!eligibilityCheck.valid) {
      return res.status(403).json({
        success: false,
        message: eligibilityCheck.message
      });
    }

    // Calculate discount amount
    const applicableAmount = applicabilityCheck.applicable_amount || cart_total_amount;
    let discountAmount = campaign.calculateDiscount(applicableAmount);

    // Ensure discount doesn't exceed cart total
    if (discountAmount > cart_total_amount) {
      discountAmount = cart_total_amount;
    }

    // Log user activity
    await userActivityLogger.log({
      user_id: userId,
      action: 'apply_coupon',
      resource_type: 'UserCoupon',
      resource_id: userCoupon._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        coupon_code,
        campaign_name: campaign.name,
        cart_total: cart_total_amount,
        discount_calculated: discountAmount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon_code,
        campaign_name: campaign.name,
        discount_type: campaign.discount_type,
        discount_amount: discountAmount,
        cart_total_amount,
        final_amount: cart_total_amount - discountAmount,
        savings: discountAmount,
        applicable_items: applicabilityCheck.applicable_items || cart_item_details.length
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    next(error);
  }
};

/**
 * Admin: Get all user coupons
 * GET /api/v1/admin/user-coupons
 */
const getAllUserCoupons = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      coupon_campaign_id,
      coupon_code,
      is_redeemed,
      is_active,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    if (user_id) filter.user_id = user_id;
    if (coupon_campaign_id) filter.coupon_campaign_id = coupon_campaign_id;
    if (coupon_code) filter.coupon_code = new RegExp(coupon_code, 'i');
    if (is_redeemed !== undefined) filter.is_redeemed = is_redeemed === 'true';
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const sortObj = { [sort_by]: sortOrder };

    // Execute query
    const [coupons, totalCount] = await Promise.all([
      UserCoupon.find(filter)
        .populate({
          path: 'coupon_campaign_id',
          select: 'name slug discount_type discount_value'
        })
        .populate({
          path: 'user_id',
          select: 'name email'
        })
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      UserCoupon.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'User coupons retrieved successfully',
      data: coupons,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_count: totalCount,
        limit: parseInt(limit),
        has_next_page: parseInt(page) < totalPages,
        has_prev_page: parseInt(page) > 1
      },
      filters_applied: filter
    });

  } catch (error) {
    console.error('Error getting all user coupons:', error);
    next(error);
  }
};

/**
 * Admin: Update user coupon
 * PATCH /api/v1/admin/user-coupons/:id
 */
const updateUserCoupon = async (req, res, next) => {
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
    delete updateData.coupon_campaign_id;
    delete updateData.user_id;
    delete updateData.coupon_code;

    const userCoupon = await UserCoupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('coupon_campaign_id user_id');

    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'User coupon not found'
      });
    }

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.admin.id,
      action: 'update_user_coupon',
      resource_type: 'UserCoupon',
      resource_id: userCoupon._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        updated_fields: Object.keys(updateData),
        coupon_code: userCoupon.coupon_code
      }
    });

    res.status(200).json({
      success: true,
      message: 'User coupon updated successfully',
      data: userCoupon
    });

  } catch (error) {
    console.error('Error updating user coupon:', error);
    next(error);
  }
};

/**
 * Admin: Delete user coupon (soft delete)
 * DELETE /api/v1/admin/user-coupons/:id
 */
const deleteUserCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userCoupon = await UserCoupon.findByIdAndUpdate(
      id,
      { is_active: false, updatedAt: new Date() },
      { new: true }
    );

    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'User coupon not found'
      });
    }

    // Log admin activity
    await adminAuditLogger.log({
      admin_id: req.admin.id,
      action: 'delete_user_coupon',
      resource_type: 'UserCoupon',
      resource_id: userCoupon._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        coupon_code: userCoupon.coupon_code,
        soft_delete: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User coupon deleted successfully',
      data: userCoupon
    });

  } catch (error) {
    console.error('Error deleting user coupon:', error);
    next(error);
  }
};

/**
 * Helper function to validate coupon applicability to cart items
 */
const validateCouponApplicability = async (campaign, cartItems) => {
  // If no specific categories or products are set, coupon applies to all items
  if (
    (!campaign.applicable_category_ids || campaign.applicable_category_ids.length === 0) &&
    (!campaign.applicable_product_variant_ids || campaign.applicable_product_variant_ids.length === 0)
  ) {
    return { valid: true };
  }

  let applicableItems = 0;
  let applicableAmount = 0;

  for (const item of cartItems) {
    let itemApplicable = false;

    // Check product variant applicability
    if (campaign.applicable_product_variant_ids && campaign.applicable_product_variant_ids.length > 0) {
      if (campaign.applicable_product_variant_ids.some(id => id.toString() === item.product_variant_id)) {
        itemApplicable = true;
      }
    }

    // Check category applicability
    if (!itemApplicable && campaign.applicable_category_ids && campaign.applicable_category_ids.length > 0) {
      if (campaign.applicable_category_ids.some(id => id.toString() === item.category_id)) {
        itemApplicable = true;
      }
    }

    if (itemApplicable) {
      applicableItems++;
      applicableAmount += item.price * item.quantity;
    }
  }

  if (applicableItems === 0) {
    return {
      valid: false,
      message: 'This coupon is not applicable to any items in your cart'
    };
  }

  return {
    valid: true,
    applicable_items: applicableItems,
    applicable_amount: applicableAmount
  };
};

/**
 * Helper function to validate user eligibility
 */
const validateUserEligibility = async (eligibilityCriteria, userId) => {
  // If no specific criteria or only 'NONE', allow all users
  if (!eligibilityCriteria || eligibilityCriteria.length === 0 || 
      (eligibilityCriteria.length === 1 && eligibilityCriteria[0] === 'NONE')) {
    return { valid: true };
  }

  const User = require('../models/User');
  const Order = require('../models/Order');

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { valid: false, message: 'User not found' };
    }

    for (const criteria of eligibilityCriteria) {
      switch (criteria) {
        case 'NEW_USER':
          // Check if user was created recently (e.g., within last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (user.createdAt < thirtyDaysAgo) {
            return { valid: false, message: 'This coupon is only for new users' };
          }
          break;

        case 'FIRST_ORDER':
          // Check if user has any completed orders
          const orderCount = await Order.countDocuments({
            user_id: userId,
            status: 'COMPLETED'
          });
          if (orderCount > 0) {
            return { valid: false, message: 'This coupon is only for first-time buyers' };
          }
          break;

        case 'REFERRAL':
          // Check if user came through referral (assuming there's a referral field)
          if (!user.referred_by) {
            return { valid: false, message: 'This coupon is only for referred users' };
          }
          break;

        case 'SPECIFIC_USER_GROUP':
          // Check if user belongs to specific group (implement based on your user grouping logic)
          if (!user.user_group || !['PREMIUM', 'VIP'].includes(user.user_group)) {
            return { valid: false, message: 'This coupon is only for premium users' };
          }
          break;
      }
    }

    return { valid: true };

  } catch (error) {
    console.error('Error validating user eligibility:', error);
    return { valid: false, message: 'Unable to validate user eligibility' };
  }
};

module.exports = {
  getMyCoupons,
  getCouponByCode,
  applyCoupon,
  getAllUserCoupons,
  updateUserCoupon,
  deleteUserCoupon,
  validateCouponApplicability,
  validateUserEligibility
};
