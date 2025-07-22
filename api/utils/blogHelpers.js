/**
 * Blog Helper Utilities
 * Common functions for blog post management
 */

const slugify = require('slugify');

/**
 * Generate SEO-friendly slug from title
 * @param {string} title - The title to convert to slug
 * @param {Object} BlogPost - The BlogPost model for uniqueness check
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (title, BlogPost, excludeId = null) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  let slug = baseSlug;
  let counter = 1;

  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // Check for existing slugs and ensure uniqueness
  while (await BlogPost.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    query.slug = slug;
  }

  return slug;
};

/**
 * Calculate estimated reading time based on content
 * @param {string} content - The content to analyze
 * @returns {number} - Estimated reading time in minutes
 */
const calculateReadingTime = (content) => {
  if (!content || typeof content !== 'string') return 1;
  
  // Remove HTML tags and count words
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Average reading speed: 225 words per minute
  const readTime = Math.ceil(wordCount / 225);
  return Math.max(1, readTime);
};

/**
 * Extract excerpt from content if not provided
 * @param {string} content - The full content
 * @param {number} maxLength - Maximum length of excerpt (default: 300)
 * @returns {string} - Generated excerpt
 */
const generateExcerpt = (content, maxLength = 300) => {
  if (!content || typeof content !== 'string') return '';
  
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Trim and truncate
  const trimmed = plainText.trim();
  if (trimmed.length <= maxLength) return trimmed;
  
  // Find the last complete word within the limit
  const truncated = trimmed.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

/**
 * Sanitize and validate tags
 * @param {Array} tags - Array of tag strings
 * @returns {Array} - Cleaned and validated tags
 */
const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => tag.trim().toLowerCase())
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
    .slice(0, 20); // Limit to 20 tags
};

/**
 * Build search query for blog posts
 * @param {Object} filters - Filter parameters
 * @returns {Object} - MongoDB query object
 */
const buildSearchQuery = (filters = {}) => {
  const query = {};
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Category filter
  if (filters.category_id) {
    query.category_id = filters.category_id;
  }
  
  // Author filter
  if (filters.author_id) {
    query.author_id = filters.author_id;
  }
  
  // Featured filter
  if (filters.is_featured !== undefined) {
    query.is_featured = filters.is_featured;
  }
  
  // Tags filter (match any of the provided tags)
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  // Text search (title, excerpt, content)
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { content: searchRegex }
    ];
  }
  
  // Date range filters
  if (filters.published_after || filters.published_before) {
    query.published_at = {};
    if (filters.published_after) {
      query.published_at.$gte = new Date(filters.published_after);
    }
    if (filters.published_before) {
      query.published_at.$lte = new Date(filters.published_before);
    }
  }
  
  // Exclude soft-deleted posts by default
  if (filters.include_deleted !== true) {
    query.deleted_at = null;
  }
  
  return query;
};

/**
 * Build sort options for blog posts
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} - MongoDB sort object
 */
const buildSortOptions = (sortBy = 'published_at', sortOrder = 'desc') => {
  const validSortFields = [
    'createdAt', 'updatedAt', 'published_at', 'views_count', 'title'
  ];
  
  const field = validSortFields.includes(sortBy) ? sortBy : 'published_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  
  return { [field]: order };
};

/**
 * Rate limiting helper for view counting
 * Simple in-memory store for demo purposes
 * In production, use Redis or similar
 */
const viewTracker = new Map();

const shouldIncrementView = (postId, clientId) => {
  const key = `${postId}_${clientId}`;
  const now = Date.now();
  const lastView = viewTracker.get(key);
  
  // Allow increment if no previous view or last view was more than 30 minutes ago
  if (!lastView || (now - lastView) > 30 * 60 * 1000) {
    viewTracker.set(key, now);
    return true;
  }
  
  return false;
};

/**
 * Clean up old view tracking entries (call periodically)
 */
const cleanupViewTracker = () => {
  const now = Date.now();
  const cutoff = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, timestamp] of viewTracker.entries()) {
    if (now - timestamp > cutoff) {
      viewTracker.delete(key);
    }
  }
};

module.exports = {
  generateUniqueSlug,
  calculateReadingTime,
  generateExcerpt,
  sanitizeTags,
  buildSearchQuery,
  buildSortOptions,
  shouldIncrementView,
  cleanupViewTracker
};
