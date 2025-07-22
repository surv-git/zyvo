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
 * @route GET /api/v1/analytics/products/overview
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

/**
 * Get comprehensive product analytics overview
 * @route GET /api/v1/analytics/products/overview
 * @access Admin only
 */
const getProductAnalyticsOverview = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $facet: {
          // Product counts by status
          statusCounts: [
            {
              $group: {
                _id: '$is_active',
                count: { $sum: 1 }
              }
            }
          ],
          
          // Category distribution
          categoryDistribution: [
            {
              $match: { is_active: true }
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'category_id',
                foreignField: '_id',
                as: 'category'
              }
            },
            {
              $unwind: '$category'
            },
            {
              $group: {
                _id: '$category._id',
                categoryName: { $first: '$category.name' },
                productCount: { $sum: 1 },
                avgScore: { $avg: '$score' }
              }
            },
            {
              $sort: { productCount: -1 }
            }
          ],
          
          // Score distribution
          scoreDistribution: [
            {
              $match: { is_active: true }
            },
            {
              $bucket: {
                groupBy: '$score',
                boundaries: [0, 2, 4, 6, 8, 10],
                default: 'other',
                output: {
                  count: { $sum: 1 },
                  averageScore: { $avg: '$score' }
                }
              }
            }
          ],
          
          // Overall statistics
          overallStats: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activeProducts: {
                  $sum: {
                    $cond: [{ $eq: ['$is_active', true] }, 1, 0]
                  }
                },
                averageScore: { $avg: '$score' },
                productsWithImages: {
                  $sum: {
                    $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0]
                  }
                }
              }
            }
          ]
        }
      }
    ];

    const [analytics] = await Product.aggregate(pipeline);
    
    const statusMap = {};
    analytics.statusCounts.forEach(item => {
      statusMap[item._id ? 'active' : 'inactive'] = item.count;
    });

    const response = {
      overview: {
        total_products: analytics.overallStats[0]?.totalProducts || 0,
        active_products: statusMap.active || 0,
        inactive_products: statusMap.inactive || 0,
        average_score: Math.round((analytics.overallStats[0]?.averageScore || 0) * 10) / 10,
        products_with_images: analytics.overallStats[0]?.productsWithImages || 0,
        image_completion_rate: Math.round(((analytics.overallStats[0]?.productsWithImages || 0) / (analytics.overallStats[0]?.totalProducts || 1)) * 100)
      },
      category_distribution: analytics.categoryDistribution.map(cat => ({
        category_id: cat._id,
        category_name: cat.categoryName,
        product_count: cat.productCount,
        average_score: Math.round(cat.avgScore * 10) / 10,
        percentage: Math.round((cat.productCount / (analytics.overallStats[0]?.activeProducts || 1)) * 100)
      })),
      score_distribution: analytics.scoreDistribution.map(bucket => ({
        score_range: bucket._id === 'other' ? '10+' : `${bucket._id}-${bucket._id + 2}`,
        count: bucket.count,
        percentage: Math.round((bucket.count / (analytics.overallStats[0]?.totalProducts || 1)) * 100)
      }))
    };

    res.json({
      success: true,
      message: 'Product analytics overview retrieved successfully',
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product performance metrics
 * @route GET /api/v1/analytics/products/performance
 * @access Admin only
 */
const getProductPerformance = async (req, res, next) => {
  try {
    const { period = '30d', metric = 'views', limit = 10 } = req.query;
    
    // Calculate date range
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // For now, we'll simulate performance data based on product scores and creation dates
    // In a real implementation, you'd track actual views, purchases, etc.
    const pipeline = [
      {
        $match: { 
          is_active: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $addFields: {
          // Simulate performance metrics based on score and recency
          estimated_views: {
            $multiply: [
              '$score',
              { $rand: {} },
              100
            ]
          },
          estimated_conversions: {
            $multiply: [
              '$score',
              { $rand: {} },
              10
            ]
          },
          days_since_creation: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          performance_score: {
            $divide: [
              { $add: ['$estimated_views', { $multiply: ['$estimated_conversions', 10] }] },
              { $add: ['$days_since_creation', 1] }
            ]
          }
        }
      },
      {
        $sort: { performance_score: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          score: 1,
          category: '$category.name',
          estimated_views: { $round: '$estimated_views' },
          estimated_conversions: { $round: '$estimated_conversions' },
          performance_score: { $round: ['$performance_score', 2] },
          days_active: { $round: '$days_since_creation' }
        }
      }
    ];

    const topPerformers = await Product.aggregate(pipeline);

    res.json({
      success: true,
      message: 'Product performance metrics retrieved successfully',
      data: {
        period: period,
        metric: metric,
        top_performers: topPerformers,
        insights: {
          avg_performance_score: topPerformers.reduce((sum, p) => sum + p.performance_score, 0) / topPerformers.length || 0,
          best_performing_category: topPerformers[0]?.category || 'N/A',
          total_estimated_views: topPerformers.reduce((sum, p) => sum + p.estimated_views, 0),
          total_estimated_conversions: topPerformers.reduce((sum, p) => sum + p.estimated_conversions, 0)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product trends analysis
 * @route GET /api/v1/analytics/products/trends
 * @access Admin only
 */
const getProductTrends = async (req, res, next) => {
  try {
    const { period = 'monthly', category_id } = req.query;
    
    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }

    const matchConditions = {};
    if (category_id) {
      matchConditions.category_id = new mongoose.Types.ObjectId(category_id);
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: groupBy,
          total_created: { $sum: 1 },
          active_created: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
          },
          avg_score: { $avg: '$score' },
          with_images: {
            $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          period_label: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              },
              {
                $cond: {
                  if: '$_id.day',
                  then: {
                    $concat: [
                      '-',
                      {
                        $cond: {
                          if: { $lt: ['$_id.day', 10] },
                          then: { $concat: ['0', { $toString: '$_id.day' }] },
                          else: { $toString: '$_id.day' }
                        }
                      }
                    ]
                  },
                  else: ''
                }
              }
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];

    const trends = await Product.aggregate(pipeline);

    // Calculate growth rates
    const trendsWithGrowth = trends.map((current, index) => {
      const previous = trends[index - 1];
      const growth_rate = previous ? 
        Math.round(((current.total_created - previous.total_created) / previous.total_created) * 100) : 0;

      return {
        period: current.period_label,
        total_created: current.total_created,
        active_created: current.active_created,
        avg_score: Math.round(current.avg_score * 10) / 10,
        products_with_images: current.with_images,
        growth_rate: growth_rate
      };
    });

    res.json({
      success: true,
      message: 'Product trends analysis retrieved successfully',
      data: {
        period: period,
        category_filter: category_id || 'all',
        trends: trendsWithGrowth,
        summary: {
          total_periods: trends.length,
          avg_products_per_period: Math.round(trends.reduce((sum, t) => sum + t.total_created, 0) / trends.length || 0),
          peak_creation_period: trendsWithGrowth.reduce((max, current) => 
            current.total_created > max.total_created ? current : max, trendsWithGrowth[0] || {})?.period
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get low-performing products analysis
 * @route GET /api/v1/analytics/products/low-performers
 * @access Admin only
 */
const getLowPerformingProducts = async (req, res, next) => {
  try {
    const { min_score = 3, days_old = 30, limit = 20 } = req.query;
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - parseInt(days_old));

    const pipeline = [
      {
        $match: {
          is_active: true,
          score: { $lt: parseFloat(min_score) },
          createdAt: { $lt: thresholdDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $addFields: {
          days_since_creation: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          },
          has_images: { $gt: [{ $size: '$images' }, 0] },
          has_description: { $ne: ['$description', ''] }
        }
      },
      {
        $sort: { score: 1, createdAt: 1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          score: 1,
          category_name: '$category.name',
          days_since_creation: { $round: '$days_since_creation' },
          has_images: 1,
          has_description: 1,
          image_count: { $size: '$images' },
          needs_attention: {
            $or: [
              { $eq: ['$has_images', false] },
              { $eq: ['$has_description', false] },
              { $lt: ['$score', 2] }
            ]
          }
        }
      }
    ];

    const lowPerformers = await Product.aggregate(pipeline);

    // Get category breakdown of low performers
    const categoryBreakdown = {};
    lowPerformers.forEach(product => {
      if (!categoryBreakdown[product.category_name]) {
        categoryBreakdown[product.category_name] = 0;
      }
      categoryBreakdown[product.category_name]++;
    });

    const recommendations = lowPerformers.map(product => {
      const issues = [];
      const suggestions = [];

      if (!product.has_images) {
        issues.push('No product images');
        suggestions.push('Add high-quality product images');
      }
      if (!product.has_description) {
        issues.push('Missing description');
        suggestions.push('Add detailed product description');
      }
      if (product.score < 2) {
        issues.push('Very low score');
        suggestions.push('Review and improve product listing quality');
      }

      return {
        product_id: product._id,
        product_name: product.name,
        issues,
        suggestions,
        priority: issues.length > 2 ? 'high' : issues.length > 1 ? 'medium' : 'low'
      };
    });

    res.json({
      success: true,
      message: 'Low-performing products analysis completed',
      data: {
        criteria: {
          min_score: parseFloat(min_score),
          days_old: parseInt(days_old),
          limit: parseInt(limit)
        },
        low_performers: lowPerformers,
        category_breakdown: Object.entries(categoryBreakdown).map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / lowPerformers.length) * 100)
        })),
        recommendations: recommendations.filter(r => r.priority === 'high').slice(0, 5),
        summary: {
          total_low_performers: lowPerformers.length,
          avg_score: Math.round((lowPerformers.reduce((sum, p) => sum + p.score, 0) / lowPerformers.length || 0) * 10) / 10,
          products_needing_images: lowPerformers.filter(p => !p.has_images).length,
          products_needing_descriptions: lowPerformers.filter(p => !p.has_description).length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product catalog health report
 * @route GET /api/v1/analytics/products/catalog-health
 * @access Admin only
 */
const getCatalogHealthReport = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $facet: {
          // Content completeness analysis
          contentCompleteness: [
            {
              $project: {
                has_name: { $ne: ['$name', ''] },
                has_description: { $ne: ['$description', ''] },
                has_short_description: { $ne: ['$short_description', ''] },
                has_images: { $gt: [{ $size: '$images' }, 0] },
                has_multiple_images: { $gt: [{ $size: '$images' }, 1] },
                has_seo_title: { $ne: ['$seo_details.title', ''] },
                has_seo_description: { $ne: ['$seo_details.description', ''] },
                is_active: 1
              }
            },
            {
              $group: {
                _id: null,
                total_products: { $sum: 1 },
                with_description: { $sum: { $cond: ['$has_description', 1, 0] } },
                with_short_description: { $sum: { $cond: ['$has_short_description', 1, 0] } },
                with_images: { $sum: { $cond: ['$has_images', 1, 0] } },
                with_multiple_images: { $sum: { $cond: ['$has_multiple_images', 1, 0] } },
                with_seo_title: { $sum: { $cond: ['$has_seo_title', 1, 0] } },
                with_seo_description: { $sum: { $cond: ['$has_seo_description', 1, 0] } },
                active_products: { $sum: { $cond: ['$is_active', 1, 0] } }
              }
            }
          ],

          // Score distribution analysis
          scoreAnalysis: [
            {
              $match: { is_active: true }
            },
            {
              $group: {
                _id: null,
                avg_score: { $avg: '$score' },
                min_score: { $min: '$score' },
                max_score: { $max: '$score' },
                zero_score_count: { $sum: { $cond: [{ $eq: ['$score', 0] }, 1, 0] } },
                low_score_count: { $sum: { $cond: [{ $and: [{ $gt: ['$score', 0] }, { $lt: ['$score', 3] }] }, 1, 0] } },
                medium_score_count: { $sum: { $cond: [{ $and: [{ $gte: ['$score', 3] }, { $lt: ['$score', 7] }] }, 1, 0] } },
                high_score_count: { $sum: { $cond: [{ $gte: ['$score', 7] }, 1, 0] } }
              }
            }
          ],

          // Recent activity
          recentActivity: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: null,
                products_created_last_30_days: { $sum: 1 },
                avg_score_recent: { $avg: '$score' }
              }
            }
          ]
        }
      }
    ];

    const [healthData] = await Product.aggregate(pipeline);
    
    const completeness = healthData.contentCompleteness[0] || {};
    const scores = healthData.scoreAnalysis[0] || {};
    const recent = healthData.recentActivity[0] || {};

    const totalProducts = completeness.total_products || 0;

    const calculatePercentage = (count) => totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;

    const healthScore = Math.round(
      (calculatePercentage(completeness.with_description) +
       calculatePercentage(completeness.with_images) +
       calculatePercentage(completeness.active_products) +
       (scores.avg_score || 0) * 10) / 4
    );

    const recommendations = [];
    
    if (calculatePercentage(completeness.with_description) < 80) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        message: `${totalProducts - completeness.with_description} products missing descriptions`,
        action: 'Add detailed product descriptions'
      });
    }
    
    if (calculatePercentage(completeness.with_images) < 90) {
      recommendations.push({
        type: 'media',
        priority: 'high',
        message: `${totalProducts - completeness.with_images} products missing images`,
        action: 'Upload product images'
      });
    }

    if (scores.zero_score_count > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: `${scores.zero_score_count} products have zero score`,
        action: 'Review and score products'
      });
    }

    res.json({
      success: true,
      message: 'Catalog health report generated successfully',
      data: {
        health_score: healthScore,
        health_grade: healthScore >= 90 ? 'A' : healthScore >= 80 ? 'B' : healthScore >= 70 ? 'C' : 'D',
        content_completeness: {
          description_rate: calculatePercentage(completeness.with_description),
          short_description_rate: calculatePercentage(completeness.with_short_description),
          image_rate: calculatePercentage(completeness.with_images),
          multiple_images_rate: calculatePercentage(completeness.with_multiple_images),
          seo_optimization_rate: Math.round((calculatePercentage(completeness.with_seo_title) + calculatePercentage(completeness.with_seo_description)) / 2)
        },
        quality_metrics: {
          average_score: Math.round((scores.avg_score || 0) * 10) / 10,
          score_distribution: {
            zero_score: scores.zero_score_count || 0,
            low_score: scores.low_score_count || 0,
            medium_score: scores.medium_score_count || 0,
            high_score: scores.high_score_count || 0
          }
        },
        activity_metrics: {
          products_created_last_30_days: recent.products_created_last_30_days || 0,
          active_products: completeness.active_products || 0,
          inactive_products: (completeness.total_products || 0) - (completeness.active_products || 0)
        },
        recommendations: recommendations,
        summary: {
          total_products: totalProducts,
          immediate_actions_needed: recommendations.filter(r => r.priority === 'high').length,
          optimization_opportunities: recommendations.filter(r => r.priority === 'medium').length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product category comparison analytics
 * @route GET /api/v1/analytics/products/category-comparison
 * @access Admin only
 */
const getCategoryComparison = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $match: { is_active: true }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category._id',
          category_name: { $first: '$category.name' },
          total_products: { $sum: 1 },
          avg_score: { $avg: '$score' },
          min_score: { $min: '$score' },
          max_score: { $max: '$score' },
          products_with_images: {
            $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
          },
          products_with_descriptions: {
            $sum: { $cond: [{ $ne: ['$description', ''] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          image_completion_rate: {
            $round: [
              { $multiply: [{ $divide: ['$products_with_images', '$total_products'] }, 100] },
              1
            ]
          },
          description_completion_rate: {
            $round: [
              { $multiply: [{ $divide: ['$products_with_descriptions', '$total_products'] }, 100] },
              1
            ]
          },
          quality_score: {
            $round: [
              {
                $multiply: [
                  {
                    $add: [
                      { $divide: ['$avg_score', 10] },
                      { $divide: ['$products_with_images', '$total_products'] },
                      { $divide: ['$products_with_descriptions', '$total_products'] }
                    ]
                  },
                  33.33
                ]
              },
              1
            ]
          }
        }
      },
      {
        $sort: { quality_score: -1 }
      }
    ];

    const categoryStats = await Product.aggregate(pipeline);
    const rankedCategories = categoryStats.map((category, index) => ({
      ...category,
      rank: index + 1,
      avg_score: Math.round(category.avg_score * 10) / 10
    }));

    res.json({
      success: true,
      message: 'Category comparison analytics retrieved successfully',
      data: {
        category_comparison: rankedCategories,
        insights: {
          total_categories: rankedCategories.length,
          best_performing_category: rankedCategories[0]?.category_name || 'N/A',
          categories_needing_improvement: rankedCategories.filter(cat => cat.quality_score < 50).length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get content optimization opportunities
 * @route GET /api/v1/analytics/products/content-optimization
 * @access Admin only
 */
const getContentOptimization = async (req, res, next) => {
  try {
    const { priority = 'all', limit = 50 } = req.query;

    const pipeline = [
      {
        $match: { is_active: true }
      },
      {
        $addFields: {
          issues: {
            $concatArrays: [
              {
                $cond: [
                  { $eq: [{ $size: '$images' }, 0] },
                  ['missing_images'],
                  []
                ]
              },
              {
                $cond: [
                  { $eq: ['$description', ''] },
                  ['missing_description'],
                  []
                ]
              },
              {
                $cond: [
                  { $eq: ['$score', 0] },
                  ['needs_scoring'],
                  []
                ]
              }
            ]
          }
        }
      },
      {
        $addFields: {
          issue_count: { $size: '$issues' },
          priority_score: {
            $switch: {
              branches: [
                {
                  case: { $gte: [{ $size: '$issues' }, 3] },
                  then: 'critical'
                },
                {
                  case: { $gte: [{ $size: '$issues' }, 2] },
                  then: 'high'
                },
                {
                  case: { $eq: [{ $size: '$issues' }, 1] },
                  then: 'medium'
                }
              ],
              default: 'low'
            }
          }
        }
      },
      {
        $match: priority === 'all' ? { issue_count: { $gt: 0 } } : { priority_score: priority }
      },
      {
        $sort: { issue_count: -1, score: 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const products = await Product.aggregate(pipeline);

    res.json({
      success: true,
      message: 'Content optimization opportunities identified',
      data: {
        optimization_opportunities: products,
        summary: {
          total_products_needing_work: products.length,
          critical_issues: products.filter(p => p.priority_score === 'critical').length,
          high_priority: products.filter(p => p.priority_score === 'high').length
        }
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
  getProductStats,
  getProductAnalyticsOverview,
  getProductPerformance,
  getProductTrends,
  getLowPerformingProducts,
  getCatalogHealthReport,
  getCategoryComparison,
  getContentOptimization
};
