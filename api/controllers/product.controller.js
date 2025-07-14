/**
 * Product Controller
 * Handles all product-related operations for the e-commerce API
 * Manages conceptual products (variants handled separately)
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new product
 * @route POST /api/v1/products
 * @access Admin only
 */
const createProduct = async (req, res, next) => {
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
      short_description,
      category_id,
      images,
      brand_id,
      score,
      seo_details
    } = req.body;

    // Create new product
    const product = new Product({
      name,
      description,
      short_description,
      category_id,
      images: images || [],
      brand_id,
      score: score || 0,
      seo_details: seo_details || {}
    });

    const savedProduct = await product.save();
    
    // Populate referenced fields for response
    await savedProduct.populate('category_id');

    // Log admin action
    adminAuditLogger.info('Product created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'Product',
      resource_id: savedProduct._id,
      changes: {
        name: savedProduct.name,
        category_id: savedProduct.category_id,
        brand_id: savedProduct.brand_id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });

  } catch (error) {
    // Handle duplicate name/slug errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Product with this ${field} already exists`,
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
 * Get all products with pagination, filtering, and search
 * @route GET /api/v1/products
 * @access Public
 */
const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      brand_id,
      is_active,
      search,
      sort = 'createdAt',
      order = 'desc',
      include_inactive = false
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build initial match query for products
    const matchQuery = {};

    // Active status filter
    if (req.user?.role === 'admin' && include_inactive === 'true') {
      // Admin can see all products
      if (is_active !== undefined) {
        matchQuery.is_active = is_active === 'true';
      }
    } else {
      // Non-admin users only see active products
      matchQuery.is_active = true;
    }

    // Category filter
    if (category_id) {
      matchQuery.category_id = new mongoose.Types.ObjectId(category_id);
    }

    // Brand filter
    if (brand_id) {
      matchQuery.brand_id = new mongoose.Types.ObjectId(brand_id);
    }

    // Search functionality
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // MongoDB Aggregation Pipeline to compute min prices from product variants
    const aggregationPipeline = [
      // Stage 1: Initial match to filter products based on query parameters
      {
        $match: matchQuery
      },

      // Stage 2: Lookup product variants from the productvariants collection
      {
        $lookup: {
          from: 'productvariants', // Collection name for ProductVariant
          localField: '_id',
          foreignField: 'product_id',
          as: 'product_variants'
        }
      },

      // Stage 3: Unwind product variants array (preserve products with no variants)
      {
        $unwind: {
          path: '$product_variants',
          preserveNullAndEmptyArrays: true
        }
      },

      // Stage 4: Match only active variants (and handle null variants from preserveNullAndEmptyArrays)
      {
        $match: {
          $or: [
            { 'product_variants.is_active': true },
            { 'product_variants': null }
          ]
        }
      },

      // Stage 5: Add calculated discount price field for variants
      {
        $addFields: {
          'product_variants.calculated_discount_price': {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$product_variants', null] },
                  { $eq: ['$product_variants.discount_details.is_on_sale', true] },
                  { $ne: ['$product_variants.discount_details.price', null] }
                ]
              },
              then: '$product_variants.discount_details.price',
              else: null
            }
          }
        }
      },

      // Stage 6: Group back by product to calculate min prices
      {
        $group: {
          _id: '$_id',
          // Reconstruct product fields using $first
          name: { $first: '$name' },
          slug: { $first: '$slug' },
          description: { $first: '$description' },
          short_description: { $first: '$short_description' },
          category_id: { $first: '$category_id' },
          brand_id: { $first: '$brand_id' },
          images: { $first: '$images' },
          score: { $first: '$score' },
          seo_details: { $first: '$seo_details' },
          is_active: { $first: '$is_active' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          
          // Calculate minimum prices from variants
          min_price: { 
            $min: {
              $cond: {
                if: { $ne: ['$product_variants', null] },
                then: '$product_variants.price',
                else: null
              }
            }
          },
          min_discounted_price: { 
            $min: '$product_variants.calculated_discount_price'
          }
        }
      },

      // Stage 7: Clean up null/undefined min_discounted_price values
      {
        $addFields: {
          min_discounted_price: {
            $cond: {
              if: { 
                $or: [
                  { $eq: ['$min_discounted_price', null] },
                  { $eq: [{ $type: '$min_discounted_price' }, 'missing'] }
                ]
              },
              then: null,
              else: '$min_discounted_price'
            }
          }
        }
      },

      // Stage 8: Lookup category details for populated response
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category_id'
        }
      },

      // Stage 9: Unwind category (should always exist due to required field)
      {
        $unwind: {
          path: '$category_id',
          preserveNullAndEmptyArrays: true
        }
      },

      // Stage 10: Project only needed category fields
      {
        $addFields: {
          'category_id': {
            _id: '$category_id._id',
            name: '$category_id.name',
            slug: '$category_id.slug'
          }
        }
      },

      // Stage 11: Sort the results
      {
        $sort: sortObj
      }
    ];

    // Use $facet to get both paginated results and total count in one query
    const facetPipeline = [
      ...aggregationPipeline,
      {
        $facet: {
          // Get paginated results
          paginatedResults: [
            { $skip: skip },
            { $limit: limitNum }
          ],
          // Get total count
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    // Execute aggregation
    const [result] = await Product.aggregate(facetPipeline);
    
    const products = result.paginatedResults || [];
    const totalItems = result.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Log user activity for public access
    if (!req.user || req.user.role !== 'admin') {
      userActivityLogger.info('Products list viewed', {
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        action_type: 'VIEW',
        resource_type: 'Product',
        query_params: {
          page: pageNum,
          limit: limitNum,
          category_id,
          brand_id,
          search
        }
      });
    }

    res.json({
      success: true,
      data: products,
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
 * Get a single product by ID or slug
 * @route GET /api/v1/products/:identifier
 * @access Public
 */
const getProductByIdOrSlug = async (req, res, next) => {
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

    // Only show active products to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.is_active = true;
    }

    const product = await Product.findOne(query)
      .populate('category_id', 'name slug description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Log user activity
    userActivityLogger.info('Product viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'Product',
      resource_id: product._id
    });

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a product
 * @route PATCH /api/v1/products/:id
 * @access Admin only
 */
const updateProduct = async (req, res, next) => {
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

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      category_id: product.category_id,
      brand_id: product.brand_id,
      score: product.score,
      is_active: product.is_active
    };

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'short_description', 'category_id', 
      'images', 'brand_id', 'score', 'seo_details', 'is_active'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        product[field] = updates[field];
      }
    });

    const updatedProduct = await product.save();
    await updatedProduct.populate('category_id');

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

    adminAuditLogger.info('Product updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'Product',
      resource_id: updatedProduct._id,
      changes
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    // Handle duplicate name/slug errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Product with this ${field} already exists`,
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
 * Soft delete a product
 * @route DELETE /api/v1/products/:id
 * @access Admin only
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Perform soft delete
    await product.softDelete();

    // Log admin action
    adminAuditLogger.info('Product deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'Product',
      resource_id: product._id,
      changes: {
        is_active: {
          from: true,
          to: false
        }
      }
    });

    res.status(204).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product statistics (Admin only)
 * @route GET /api/v1/products/stats
 * @access Admin only
 */
const getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ is_active: true });
    const inactiveProducts = await Product.countDocuments({ is_active: false });

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
  updateProduct,
  deleteProduct,
  getProductStats
};
