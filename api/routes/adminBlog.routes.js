/**
 * Admin Blog Routes
 * Routes for blog post management (Admin only)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  createBlogPost,
  getAllBlogPostsAdmin,
  getBlogPostAdmin,
  updateBlogPost,
  deleteBlogPost,
  updateBlogPostStatus
} = require('../controllers/blogPost.controller');

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Import validation
const {
  validateCreateBlogPost,
  validateUpdateBlogPost,
  validateUpdateBlogPostStatus,
  validateBlogPostId,
  validateBlogPostIdentifier,
  validateBlogPostQuery
} = require('../middleware/blogValidation');

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   POST /api/v1/admin/blog/posts
 * @desc    Create a new blog post
 * @access  Admin only
 */
router.post('/posts', validateCreateBlogPost, createBlogPost);

/**
 * @route   GET /api/v1/admin/blog/posts
 * @desc    Get all blog posts (admin view with all statuses)
 * @access  Admin only
 */
router.get('/posts', validateBlogPostQuery, getAllBlogPostsAdmin);

/**
 * @route   GET /api/v1/admin/blog/posts/:identifier
 * @desc    Get single blog post by ID or slug (admin view)
 * @access  Admin only
 */
router.get('/posts/:identifier', validateBlogPostIdentifier, getBlogPostAdmin);

/**
 * @route   PATCH /api/v1/admin/blog/posts/:id
 * @desc    Update a blog post
 * @access  Admin only
 */
router.patch('/posts/:id', validateUpdateBlogPost, updateBlogPost);

/**
 * @route   DELETE /api/v1/admin/blog/posts/:id
 * @desc    Delete a blog post (soft delete)
 * @access  Admin only
 */
router.delete('/posts/:id', validateBlogPostId, deleteBlogPost);

/**
 * @route   PATCH /api/v1/admin/blog/posts/:id/status
 * @desc    Update blog post status (publish/unpublish)
 * @access  Admin only
 */
router.patch('/posts/:id/status', validateUpdateBlogPostStatus, updateBlogPostStatus);

module.exports = router;
