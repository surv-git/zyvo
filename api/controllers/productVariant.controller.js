/**
 * Product Variant Controller
 * Handles all product variant-related operations for the e-commerce API
 * Manages unique SKUs and purchasable versions of products
 */

const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Option = require('../models/Option');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new product variant
 * @route POST /api/product-variants
 * @access Admin only
 */
const createProductVariant = async (req, res, next) => {
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
      product_id,
      option_values,
      sku_code,
      price,
      discount_details,
      slug,
      dimensions,
      weight,
      packaging_cost,
      shipping_cost,
      images,
      is_active,
      sort_order
    } = req.body;

    // Validate that product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Validate that all option values exist
    if (option_values && option_values.length > 0) {
      const options = await Option.find({ _id: { $in: option_values } });
      if (options.length !== option_values.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid option values'
        });
      }
    }

    // Create new product variant
    const productVariant = new ProductVariant({
      product_id,
      option_values: option_values || [],
      sku_code,
      price,
      discount_details: discount_details || {},
      slug,
      dimensions: dimensions || {},
      weight: weight || {},
      packaging_cost: packaging_cost || 0,
      shipping_cost: shipping_cost || 0,
      images: images || [],
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0
    });

    const savedVariant = await productVariant.save();
    
    // Populate references for response
    await savedVariant.populate('product_id', 'name slug');
    await savedVariant.populate('option_values', 'option_type option_value name slug');

    // Log admin action
    adminAuditLogger.info('Product variant created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'ProductVariant',
      resource_id: savedVariant._id,
      changes: {
        product_id: savedVariant.product_id._id,
        sku_code: savedVariant.sku_code,
        price: savedVariant.price,
        option_values: savedVariant.option_values.map(opt => opt._id)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: savedVariant
    });

  } catch (error) {
    // Handle duplicate SKU code
    if (error.code === 11000) {
      if (error.keyValue.sku_code) {
        return res.status(400).json({
          success: false,
          message: `Product variant with SKU '${error.keyValue.sku_code}' already exists`
        });
      }
      
      // Handle duplicate product + option values combination
      if (error.keyValue.product_id) {
        return res.status(400).json({
          success: false,
          message: 'A variant with this option combination already exists for this product'
        });
      }

      // Handle duplicate slug
      if (error.keyValue.slug) {
        return res.status(400).json({
          success: false,
          message: `Product variant with slug '${error.keyValue.slug}' already exists`
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
 * Get all product variants with pagination, filtering, and search
 * @route GET /api/product-variants
 * @access Public
 */
const getAllProductVariants = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      product_id,
      is_active,
      is_on_sale,
      min_price,
      max_price,
      search,
      sort = 'createdAt',
      order = 'desc',
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
      // Admin can see all variants
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
    } else {
      // Non-admin users only see active variants
      query.is_active = true;
    }

    // Product filter
    if (product_id) {
      query.product_id = product_id;
    }

    // Sale status filter
    if (is_on_sale === 'true') {
      query['discount_details.is_on_sale'] = true;
    }

    // Price range filter
    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = parseFloat(min_price);
      if (max_price) query.price.$lte = parseFloat(max_price);
    }

    // Search functionality
    if (search) {
      query.sku_code = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'price') {
      sortObj.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'sku_code') {
      sortObj.sku_code = order === 'desc' ? -1 : 1;
    } else if (sort === 'sort_order') {
      sortObj.sort_order = order === 'desc' ? -1 : 1;
      sortObj.createdAt = 1; // Secondary sort
    } else {
      sortObj.createdAt = order === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const variants = await ProductVariant.find(query)
      .populate('product_id', 'name slug description')
      .populate('option_values', 'option_type option_value name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalItems = await ProductVariant.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Log user activity for public access
    if (!req.user || req.user.role !== 'admin') {
      userActivityLogger.info('Product variants list viewed', {
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        action_type: 'VIEW',
        resource_type: 'ProductVariant',
        query_params: {
          page: pageNum,
          limit: limitNum,
          product_id,
          is_on_sale,
          search
        }
      });
    }

    res.json({
      success: true,
      data: variants,
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
 * Get a single product variant by ID or SKU code
 * @route GET /api/product-variants/:identifier
 * @access Public
 */
const getProductVariantByIdOrSKU = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    let variant;
    
    // Try to find by ID first, then by SKU code
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      const query = { _id: identifier };
      
      // Only show active variants to non-admin users
      if (!req.user || req.user.role !== 'admin') {
        query.is_active = true;
      }
      
      variant = await ProductVariant.findOne(query)
        .populate('product_id', 'name slug description category_id brand_id')
        .populate('option_values', 'option_type option_value name slug');
    } else {
      // Assume it's a SKU code
      variant = await ProductVariant.findBySKU(
        identifier, 
        req.user?.role === 'admin'
      );
    }

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Product variant viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'ProductVariant',
      resource_id: variant._id
    });

    res.json({
      success: true,
      data: variant
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a product variant
 * @route PATCH /api/product-variants/:id
 * @access Admin only
 */
const updateProductVariant = async (req, res, next) => {
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

    // Find the variant
    const variant = await ProductVariant.findById(id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      sku_code: variant.sku_code,
      price: variant.price,
      discount_details: variant.discount_details?.toObject(),
      dimensions: variant.dimensions?.toObject(),
      weight: variant.weight?.toObject(),
      packaging_cost: variant.packaging_cost,
      shipping_cost: variant.shipping_cost,
      is_active: variant.is_active,
      sort_order: variant.sort_order
    };

    // Validate product_id if being updated
    if (updates.product_id && updates.product_id !== variant.product_id.toString()) {
      const product = await Product.findById(updates.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }
    }

    // Validate option_values if being updated
    if (updates.option_values && updates.option_values.length > 0) {
      const options = await Option.find({ _id: { $in: updates.option_values } });
      if (options.length !== updates.option_values.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid option values'
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'product_id', 'option_values', 'sku_code', 'price', 'discount_details',
      'slug', 'dimensions', 'weight', 'packaging_cost', 'shipping_cost',
      'images', 'is_active', 'sort_order'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'discount_details' && typeof updates[field] === 'object') {
          // Merge discount details
          variant.discount_details = {
            ...variant.discount_details.toObject(),
            ...updates[field]
          };
        } else {
          variant[field] = updates[field];
        }
      }
    });

    const updatedVariant = await variant.save();
    await updatedVariant.populate('product_id', 'name slug');
    await updatedVariant.populate('option_values', 'option_type option_value name slug');

    // Log admin action with changes
    const changes = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'discount_details') {
          const newDiscountDetails = updatedVariant.discount_details?.toObject();
          if (JSON.stringify(newDiscountDetails) !== JSON.stringify(originalValues[field])) {
            changes[field] = {
              from: originalValues[field],
              to: newDiscountDetails
            };
          }
        } else if (typeof updates[field] === 'object' && originalValues[field]) {
          if (JSON.stringify(updates[field]) !== JSON.stringify(originalValues[field])) {
            changes[field] = {
              from: originalValues[field],
              to: updates[field]
            };
          }
        } else if (updates[field] !== originalValues[field]) {
          changes[field] = {
            from: originalValues[field],
            to: updates[field]
          };
        }
      }
    });

    adminAuditLogger.info('Product variant updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'ProductVariant',
      resource_id: updatedVariant._id,
      changes
    });

    res.json({
      success: true,
      message: 'Product variant updated successfully',
      data: updatedVariant
    });

  } catch (error) {
    // Handle duplicate SKU code
    if (error.code === 11000) {
      if (error.keyValue.sku_code) {
        return res.status(400).json({
          success: false,
          message: `Product variant with SKU '${error.keyValue.sku_code}' already exists`
        });
      }
      
      // Handle duplicate product + option values combination
      if (error.keyValue.product_id) {
        return res.status(400).json({
          success: false,
          message: 'A variant with this option combination already exists for this product'
        });
      }

      // Handle duplicate slug
      if (error.keyValue.slug) {
        return res.status(400).json({
          success: false,
          message: `Product variant with slug '${error.keyValue.slug}' already exists`
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
 * Soft delete a product variant
 * @route DELETE /api/product-variants/:id
 * @access Admin only
 */
const deleteProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const variant = await ProductVariant.findById(id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Perform soft delete
    await variant.softDelete();

    // Log admin action
    adminAuditLogger.info('Product variant deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'ProductVariant',
      resource_id: variant._id,
      changes: {
        is_active: {
          from: true,
          to: false
        }
      }
    });

    res.status(204).json({
      success: true,
      message: 'Product variant deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product variant statistics (Admin only)
 * @route GET /api/product-variants/stats
 * @access Admin only
 */
const getProductVariantStats = async (req, res, next) => {
  try {
    const totalVariants = await ProductVariant.countDocuments();
    const activeVariants = await ProductVariant.countDocuments({ is_active: true });
    const inactiveVariants = await ProductVariant.countDocuments({ is_active: false });
    const onSaleVariants = await ProductVariant.countDocuments({ 
      'discount_details.is_on_sale': true,
      is_active: true 
    });

    // Average price statistics
    const priceStats = await ProductVariant.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    // Top products by variant count
    const topProductsByVariants = await ProductVariant.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$product_id', variantCount: { $sum: 1 } } },
      { $sort: { variantCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          product_name: { $arrayElemAt: ['$product.name', 0] },
          variant_count: '$variantCount'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalVariants,
        activeVariants,
        inactiveVariants,
        onSaleVariants,
        priceStatistics: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 },
        topProductsByVariants
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProductVariant,
  getAllProductVariants,
  getProductVariantByIdOrSKU,
  updateProductVariant,
  deleteProductVariant,
  getProductVariantStats
};
