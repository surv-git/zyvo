/**
 * Category Controller
 * Handles all category-related operations including CRUD operations,
 * hierarchical category management, and tree structure retrieval
 */

const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const unsplashService = require('../services/unsplash.service');

/**
 * Create a new category
 * @route POST /api/v1/categories
 * @access Admin only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createCategory = async (req, res, next) => {
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

    const { name, description, parent_category, image_url } = req.body;

    // Validate parent category exists if provided
    if (parent_category) {
      const parentExists = await Category.findById(parent_category);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      if (!parentExists.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create subcategory under inactive parent category'
        });
      }
    }

    // Auto-fetch image from Unsplash if none provided
    let categoryImageUrl = image_url?.trim();
    
    if ((!image_url || image_url.trim() === '') && unsplashService.isReady()) {
      try {
        // Fetch hero image from Unsplash
        const unsplashImage = await unsplashService.getCategoryHeroImage(name);
        if (unsplashImage) {
          categoryImageUrl = unsplashImage;
          console.log(`✅ Auto-fetched image for category: ${name}`);
        }
      } catch (error) {
        console.warn('⚠️  Failed to fetch Unsplash image for category:', error.message);
        // Continue with empty image_url - don't fail category creation
      }
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      parent_category: parent_category || null,
      image_url: categoryImageUrl
    });

    await category.save();

    // Populate parent category for response
    await category.populate('parent_category', 'name slug');

    // Log admin audit trail
    adminAuditLogger.info('Category created', {
      action_type: 'create',
      resource_type: 'category',
      resource_id: category._id,
      admin_id: req.user?.id,
      admin_email: req.user?.email,
      changes: {
        created: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent_category: category.parent_category?._id,
          image_url: category.image_url
        }
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Category ${field} already exists`
      });
    }

    next(error);
  }
};

/**
 * Get all categories with pagination and filtering
 * @route GET /api/v1/categories
 * @access Public (with admin override for inactive categories)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllCategories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      parent_id,
      is_active,
      search,
      sort_by = 'name',
      sort_order = 'asc',
      include_inactive = false
    } = req.query;

    // Build filter object
    const filter = {};

    // Handle active/inactive filtering
    const isAdmin = req.user?.role === 'admin';
    if (is_active !== undefined && isAdmin) {
      filter.is_active = is_active === 'true';
    } else if (!isAdmin || include_inactive !== 'true') {
      filter.is_active = true;
    }

    // Filter by parent category
    if (parent_id) {
      if (parent_id === 'null' || parent_id === 'root') {
        filter.parent_category = null;
      } else {
        filter.parent_category = parent_id;
      }
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sorting setup
    const sortObject = {};
    const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'name';
    const sortDirection = sort_order === 'desc' ? -1 : 1;
    sortObject[sortField] = sortDirection;

    // Execute queries
    const [categories, totalCount] = await Promise.all([
      Category.find(filter)
        .populate('parent_category', 'name slug')
        .sort(sortObject)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Category.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    // Log user activity
    userActivityLogger.info('Categories list viewed', {
      action_type: 'view',
      resource_type: 'categories',
      user_id: req.user?.id || 'guest',
      user_email: req.user?.email || 'guest',
      filters: filter,
      pagination: { page: pageNum, limit: limitNum },
      results_count: categories.length,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
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
 * Get category by ID or slug
 * @route GET /api/v1/categories/:identifier
 * @access Public (with admin override for inactive categories)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isAdmin = req.user?.role === 'admin';

    // Find category by ID or slug
    const category = await Category.findByIdOrSlug(identifier, isAdmin);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get category path (breadcrumb)
    const categoryPath = await category.getCategoryPath();

    // Get subcategories if any
    const subcategories = await Category.find({
      parent_category: category._id,
      is_active: isAdmin ? undefined : true
    })
    .select('name slug description image_url is_active')
    .sort({ name: 1 });

    // Log user activity
    userActivityLogger.info('Category viewed', {
      action_type: 'view',
      resource_type: 'category',
      resource_id: category._id,
      user_id: req.user?.id || 'guest',
      user_email: req.user?.email || 'guest',
      category_name: category.name,
      category_slug: category.slug,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: {
        ...category.toObject(),
        categoryPath,
        subcategories
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PATCH /api/v1/categories/:id
 * @access Admin only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateCategory = async (req, res, next) => {
  try {
    // Check for validation errors
    // TODO: Implement input validation using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, parent_category, image_url, is_active } = req.body;

    // Find existing category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      name: existingCategory.name,
      description: existingCategory.description,
      parent_category: existingCategory.parent_category,
      image_url: existingCategory.image_url,
      is_active: existingCategory.is_active
    };

    // Validate parent category if being updated
    if (parent_category !== undefined) {
      if (parent_category && parent_category !== existingCategory.parent_category?.toString()) {
        // Check if parent exists
        const parentExists = await Category.findById(parent_category);
        if (!parentExists) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }

        // Prevent self-reference
        if (parent_category === id) {
          return res.status(400).json({
            success: false,
            message: 'Category cannot be its own parent'
          });
        }

        // Check if the new parent would create a circular reference
        let currentParent = parentExists;
        while (currentParent && currentParent.parent_category) {
          if (currentParent.parent_category.toString() === id) {
            return res.status(400).json({
              success: false,
              message: 'Cannot create circular parent reference'
            });
          }
          currentParent = await Category.findById(currentParent.parent_category);
        }
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (parent_category !== undefined) {
      updateData.parent_category = parent_category || null;
    }
    if (image_url !== undefined) updateData.image_url = image_url?.trim();
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent_category', 'name slug');

    // Build changes object for audit log
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (originalValues[key] !== updateData[key]) {
        changes[key] = {
          oldValue: originalValues[key],
          newValue: updateData[key]
        };
      }
    });

    // Log admin audit trail
    adminAuditLogger.info('Category updated', {
      action_type: 'update',
      resource_type: 'category',
      resource_id: updatedCategory._id,
      admin_id: req.user?.id,
      admin_email: req.user?.email,
      changes,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Category ${field} already exists`
      });
    }

    next(error);
  }
};

/**
 * Delete category (soft delete by default, hard delete optional)
 * @route DELETE /api/v1/categories/:id
 * @access Admin only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children (for information purposes)
    const hasChildren = await category.hasChildren();
    const childrenCount = await Category.countDocuments({
      parent_category: id,
      is_active: true
    });

    let deletionResult;
    let deletionType;

    if (hard_delete === 'true') {
      // Hard delete - permanently remove the category
      deletionResult = await Category.findByIdAndDelete(id);
      deletionType = 'hard_delete';

      // Log admin audit trail for hard delete
      adminAuditLogger.warn('Category hard deleted', {
        action_type: 'hard_delete',
        resource_type: 'category',
        resource_id: id,
        admin_id: req.user?.id,
        admin_email: req.user?.email,
        deleted_data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent_category: category.parent_category,
          had_children: hasChildren,
          children_count: childrenCount
        },
        timestamp: new Date()
      });

    } else {
      // Soft delete - set is_active to false
      deletionResult = await Category.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      );
      deletionType = 'soft_delete';

      // Log admin audit trail for soft delete
      adminAuditLogger.info('Category soft deleted', {
        action_type: 'soft_delete',
        resource_type: 'category',
        resource_id: id,
        admin_id: req.user?.id,
        admin_email: req.user?.email,
        changes: {
          is_active: {
            oldValue: true,
            newValue: false
          }
        },
        had_children: hasChildren,
        children_count: childrenCount,
        timestamp: new Date()
      });
    }

    res.status(204).json({
      success: true,
      message: `Category ${deletionType === 'hard_delete' ? 'permanently deleted' : 'deactivated'} successfully`
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get category tree (hierarchical view)
 * @route GET /api/v1/categories/tree
 * @access Public (with admin override for inactive categories)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCategoryTree = async (req, res, next) => {
  try {
    const { include_inactive = false } = req.query;
    const isAdmin = req.user?.role === 'admin';

    // Only admins can include inactive categories
    const includeInactive = isAdmin && include_inactive === 'true';

    // Get category tree
    const categoryTree = await Category.getCategoryTree(includeInactive);

    // Log user activity
    userActivityLogger.info('Category tree viewed', {
      action_type: 'view',
      resource_type: 'category_tree',
      user_id: req.user?.id || 'guest',
      user_email: req.user?.email || 'guest',
      include_inactive: includeInactive,
      tree_root_count: categoryTree.length,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Category tree retrieved successfully',
      data: categoryTree
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get category statistics (Admin only)
 * @route GET /api/v1/categories/stats
 * @access Admin only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCategoryStats = async (req, res, next) => {
  try {
    const [
      totalCategories,
      activeCategories,
      inactiveCategories,
      rootCategories,
      categoriesWithChildren
    ] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ is_active: true }),
      Category.countDocuments({ is_active: false }),
      Category.countDocuments({ parent_category: null, is_active: true }),
      Category.aggregate([
        { $match: { is_active: true } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: 'parent_category',
            as: 'children'
          }
        },
        { $match: { 'children.0': { $exists: true } } },
        { $count: 'count' }
      ])
    ]);

    const stats = {
      totalCategories,
      activeCategories,
      inactiveCategories,
      rootCategories,
      categoriesWithChildren: categoriesWithChildren[0]?.count || 0,
      categoriesWithoutChildren: activeCategories - (categoriesWithChildren[0]?.count || 0)
    };

    // Log admin activity
    adminAuditLogger.info('Category statistics viewed', {
      action_type: 'view',
      resource_type: 'category_stats',
      admin_id: req.user?.id,
      admin_email: req.user?.email,
      stats,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryStats
};
