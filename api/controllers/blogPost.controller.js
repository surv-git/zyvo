/**
 * BlogPost Controller
 * Handles all blog post operations for both admin and public APIs
 */

const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const Category = require('../models/Category');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const userActivityLogger = require('../loggers/userActivity.logger');
const { validationResult } = require('express-validator');
const {
  generateUniqueSlug,
  calculateReadingTime,
  generateExcerpt,
  sanitizeTags,
  buildSearchQuery,
  buildSortOptions,
  shouldIncrementView
} = require('../utils/blogHelpers');

/**
 * ADMIN CONTROLLERS
 */

/**
 * Create a new blog post
 * @route POST /api/v1/admin/blog/posts
 * @access Admin only
 */
const createBlogPost = async (req, res, next) => {
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
      title,
      content,
      author_id,
      category_id,
      tags,
      excerpt,
      featured_image_url,
      featured_image_alt_text,
      status = 'DRAFT',
      seo_title,
      meta_description,
      is_featured = false,
      comments_enabled = true
    } = req.body;

    // Validate category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Generate slug and calculate read time
    const slug = await generateUniqueSlug(title, BlogPost);
    const read_time_minutes = calculateReadingTime(content);
    const sanitizedTags = sanitizeTags(tags);
    const finalExcerpt = excerpt || generateExcerpt(content);

    // Create blog post
    const blogPost = new BlogPost({
      title,
      slug,
      content,
      excerpt: finalExcerpt,
      author_id,
      category_id,
      tags: sanitizedTags,
      read_time_minutes,
      featured_image_url,
      featured_image_alt_text,
      status,
      seo_title,
      meta_description,
      is_featured,
      comments_enabled
    });

    const savedPost = await blogPost.save();

    // Populate references for response
    await savedPost.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'category_id', select: 'name slug' }
    ]);

    // Log admin action
    adminAuditLogger.info('Blog post created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'BlogPost',
      resource_id: savedPost._id,
      details: {
        title: savedPost.title,
        status: savedPost.status,
        category: category.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: savedPost
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog post with this slug already exists'
      });
    }
    next(error);
  }
};

/**
 * Get all blog posts (Admin view)
 * @route GET /api/v1/admin/blog/posts
 * @access Admin only
 */
const getAllBlogPostsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category_id,
      author_id,
      is_featured,
      search,
      sort_by = 'createdAt',
      sort_order = 'desc',
      include_deleted = false
    } = req.query;

    // Build query
    const query = buildSearchQuery({
      status,
      category_id,
      author_id,
      is_featured: is_featured !== undefined ? is_featured === 'true' : undefined,
      search,
      include_deleted: include_deleted === 'true'
    });

    // Build sort options
    const sortOptions = buildSortOptions(sort_by, sort_order);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author_id', 'name email')
        .populate('category_id', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      BlogPost.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: posts,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single blog post (Admin view)
 * @route GET /api/v1/admin/blog/posts/:identifier
 * @access Admin only
 */
const getBlogPostAdmin = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    // Try to find by ID first, then by slug
    let query;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier };
    }

    const post = await BlogPost.findOne(query)
      .populate('author_id', 'name email')
      .populate('category_id', 'name slug description');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update blog post
 * @route PATCH /api/v1/admin/blog/posts/:id
 * @access Admin only
 */
const updateBlogPost = async (req, res, next) => {
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

    // Find the post
    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      title: post.title,
      status: post.status,
      category_id: post.category_id
    };

    // Validate category if being updated
    if (updates.category_id && updates.category_id !== post.category_id.toString()) {
      const category = await Category.findById(updates.category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    // Handle slug generation if title is being updated
    if (updates.title && updates.title !== post.title) {
      updates.slug = await generateUniqueSlug(updates.title, BlogPost, id);
    }

    // Recalculate read time if content is being updated
    if (updates.content) {
      updates.read_time_minutes = calculateReadingTime(updates.content);
    }

    // Sanitize tags if provided
    if (updates.tags) {
      updates.tags = sanitizeTags(updates.tags);
    }

    // Generate excerpt if content changed but no excerpt provided
    if (updates.content && !updates.excerpt) {
      updates.excerpt = generateExcerpt(updates.content);
    }

    // Update the post
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate([
      { path: 'author_id', select: 'name email' },
      { path: 'category_id', select: 'name slug' }
    ]);

    // Prepare changes for audit log
    const changes = {};
    Object.keys(updates).forEach(key => {
      if (originalValues[key] !== undefined && originalValues[key] !== updates[key]) {
        changes[key] = {
          from: originalValues[key],
          to: updates[key]
        };
      }
    });

    // Log admin action
    adminAuditLogger.info('Blog post updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'BlogPost',
      resource_id: updatedPost._id,
      changes
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog post with this slug already exists'
      });
    }
    next(error);
  }
};

/**
 * Delete blog post (Soft delete)
 * @route DELETE /api/v1/admin/blog/posts/:id
 * @access Admin only
 */
const deleteBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Soft delete
    post.deleted_at = new Date();
    post.status = 'ARCHIVED';
    await post.save();

    // Log admin action
    adminAuditLogger.info('Blog post deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'BlogPost',
      resource_id: post._id,
      details: {
        title: post.title,
        soft_delete: true
      }
    });

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update blog post status
 * @route PATCH /api/v1/admin/blog/posts/:id/status
 * @access Admin only
 */
const updateBlogPostStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const originalStatus = post.status;
    post.status = status;

    // Handle published_at timestamp
    if (status === 'PUBLISHED' && !post.published_at) {
      post.published_at = new Date();
    } else if (status !== 'PUBLISHED' && post.published_at) {
      post.published_at = null;
    }

    await post.save();

    // Log admin action
    adminAuditLogger.info('Blog post status updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'BlogPost',
      resource_id: post._id,
      changes: {
        status: {
          from: originalStatus,
          to: status
        }
      }
    });

    res.json({
      success: true,
      message: 'Blog post status updated successfully',
      data: {
        id: post._id,
        status: post.status,
        published_at: post.published_at
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUBLIC CONTROLLERS
 */

/**
 * Get all published blog posts
 * @route GET /api/v1/blog/posts
 * @access Public
 */
const getAllPublishedBlogPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      tags,
      is_featured,
      search,
      sort_by = 'published_at',
      sort_order = 'desc'
    } = req.query;

    // Build query for published posts only
    const query = buildSearchQuery({
      status: 'PUBLISHED',
      category_id,
      tags: tags ? tags.split(',') : undefined,
      is_featured: is_featured !== undefined ? is_featured === 'true' : undefined,
      search,
      include_deleted: false
    });

    // Build sort options
    const sortOptions = buildSortOptions(sort_by, sort_order);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author_id', 'name')
        .populate('category_id', 'name slug')
        .select('-content') // Exclude full content for listing
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      BlogPost.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: posts,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single published blog post by slug
 * @route GET /api/v1/blog/posts/:slug
 * @access Public
 */
const getSinglePublishedBlogPost = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({
      slug,
      status: 'PUBLISHED',
      deleted_at: null
    })
      .populate('author_id', 'name')
      .populate('category_id', 'name slug description');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count (with rate limiting)
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    if (shouldIncrementView(post._id.toString(), clientId)) {
      await BlogPost.incrementViews(post._id);
      post.views_count += 1; // Update the current object for response
    }

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get popular tags
 * @route GET /api/v1/blog/tags/popular
 * @access Public
 */
const getPopularTags = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const tags = await BlogPost.getPopularTags(parseInt(limit));

    res.json({
      success: true,
      data: tags
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Admin controllers
  createBlogPost,
  getAllBlogPostsAdmin,
  getBlogPostAdmin,
  updateBlogPost,
  deleteBlogPost,
  updateBlogPostStatus,
  
  // Public controllers
  getAllPublishedBlogPosts,
  getSinglePublishedBlogPost,
  getPopularTags
};
