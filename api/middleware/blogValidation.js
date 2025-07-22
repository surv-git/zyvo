/**
 * Blog Post Validation Middleware
 * Express-validator rules for blog post operations
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for creating a blog post
 */
const validateCreateBlogPost = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),

  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('author_id')
    .notEmpty()
    .withMessage('Author ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid author ID format');
      }
      return true;
    }),

  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    }),

  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters')
    .trim(),

  body('featured_image_url')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be a valid URL'),

  body('featured_image_alt_text')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Featured image alt text must not exceed 200 characters')
    .trim(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 50) {
          throw new Error('Each tag must not exceed 50 characters');
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'])
    .withMessage('Invalid status value'),

  body('seo_title')
    .optional()
    .isLength({ max: 70 })
    .withMessage('SEO title must not exceed 70 characters')
    .trim(),

  body('meta_description')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters')
    .trim(),

  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean'),

  body('comments_enabled')
    .optional()
    .isBoolean()
    .withMessage('comments_enabled must be a boolean')
];

/**
 * Validation for updating a blog post
 */
const validateUpdateBlogPost = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid blog post ID format');
      }
      return true;
    }),

  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),

  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('author_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid author ID format');
      }
      return true;
    }),

  body('category_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    }),

  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters')
    .trim(),

  body('featured_image_url')
    .optional()
    .isURL()
    .withMessage('Featured image URL must be a valid URL'),

  body('featured_image_alt_text')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Featured image alt text must not exceed 200 characters')
    .trim(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 50) {
          throw new Error('Each tag must not exceed 50 characters');
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'])
    .withMessage('Invalid status value'),

  body('seo_title')
    .optional()
    .isLength({ max: 70 })
    .withMessage('SEO title must not exceed 70 characters')
    .trim(),

  body('meta_description')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters')
    .trim(),

  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean'),

  body('comments_enabled')
    .optional()
    .isBoolean()
    .withMessage('comments_enabled must be a boolean')
];

/**
 * Validation for updating blog post status
 */
const validateUpdateBlogPostStatus = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid blog post ID format');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'])
    .withMessage('Invalid status value')
];

/**
 * Validation for blog post ID parameter
 */
const validateBlogPostId = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid blog post ID format');
      }
      return true;
    })
];

/**
 * Validation for blog post identifier (ID or slug)
 */
const validateBlogPostIdentifier = [
  param('identifier')
    .notEmpty()
    .withMessage('Blog post identifier is required')
    .trim()
];

/**
 * Validation for blog post slug
 */
const validateBlogPostSlug = [
  param('slug')
    .notEmpty()
    .withMessage('Blog post slug is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Slug must be between 1 and 200 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .trim()
];

/**
 * Validation for query parameters
 */
const validateBlogPostQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'])
    .withMessage('Invalid status value'),

  query('category_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID format');
      }
      return true;
    }),

  query('author_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid author ID format');
      }
      return true;
    }),

  query('is_featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_featured must be true or false'),

  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'published_at', 'views_count', 'title'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),

  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.length > 10) {
          throw new Error('Maximum 10 tags allowed in filter');
        }
        for (const tag of tags) {
          if (tag.trim().length === 0) {
            throw new Error('Tag names cannot be empty');
          }
        }
      }
      return true;
    }),

  query('include_deleted')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_deleted must be true or false')
];

/**
 * Validation for popular tags query
 */
const validatePopularTagsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

module.exports = {
  validateCreateBlogPost,
  validateUpdateBlogPost,
  validateUpdateBlogPostStatus,
  validateBlogPostId,
  validateBlogPostIdentifier,
  validateBlogPostSlug,
  validateBlogPostQuery,
  validatePopularTagsQuery
};
