/**
 * Public Blog Routes
 * Routes for public blog post access
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllPublishedBlogPosts,
  getSinglePublishedBlogPost,
  getPopularTags
} = require('../controllers/blogPost.controller');

// Import validation
const {
  validateBlogPostSlug,
  validateBlogPostQuery,
  validatePopularTagsQuery
} = require('../middleware/blogValidation');

/**
 * @route   GET /api/v1/blog/posts
 * @desc    Get all published blog posts
 * @access  Public
 */
router.get('/posts', validateBlogPostQuery, getAllPublishedBlogPosts);

/**
 * @route   GET /api/v1/blog/posts/:slug
 * @desc    Get single published blog post by slug
 * @access  Public
 */
router.get('/posts/:slug', validateBlogPostSlug, getSinglePublishedBlogPost);

/**
 * @route   GET /api/v1/blog/tags/popular
 * @desc    Get popular tags from published blog posts
 * @access  Public
 */
router.get('/tags/popular', validatePopularTagsQuery, getPopularTags);

module.exports = router;
