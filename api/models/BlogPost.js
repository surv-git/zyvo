/**
 * BlogPost Model
 * Mongoose schema for blog posts integrated with existing ProductCategory system
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const blogPostSchema = new mongoose.Schema({
  // Primary identification
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Content fields
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  excerpt: {
    type: String,
    maxlength: 500,
    trim: true,
    default: null
  },

  content: {
    type: String,
    required: true
  },

  // Media fields
  featured_image_url: {
    type: String,
    default: null
  },

  featured_image_alt_text: {
    type: String,
    trim: true,
    default: null
  },

  // Categorization (using existing Category)
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },

  tags: {
    type: [String],
    default: [],
    index: true
  },

  // Metadata
  read_time_minutes: {
    type: Number,
    min: 1,
    default: null
  },

  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'PUBLISHED', 'PENDING_REVIEW', 'ARCHIVED'],
    default: 'DRAFT',
    index: true
  },

  published_at: {
    type: Date,
    default: null,
    index: true
  },

  views_count: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },

  // SEO fields
  seo_title: {
    type: String,
    maxlength: 70,
    trim: true,
    default: null
  },

  meta_description: {
    type: String,
    maxlength: 160,
    trim: true,
    default: null
  },

  // Feature flags
  is_featured: {
    type: Boolean,
    default: false,
    index: true
  },

  comments_enabled: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Soft deletion
  deleted_at: {
    type: Date,
    default: null,
    index: true
  }
});

// Compound indexes for common queries
blogPostSchema.index({ status: 1, published_at: -1 });
blogPostSchema.index({ category_id: 1, status: 1 });
blogPostSchema.index({ is_featured: 1, status: 1 });
blogPostSchema.index({ deleted_at: 1, status: 1 });

/**
 * Generate unique slug from title
 */
blogPostSchema.methods.generateSlug = async function(title) {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  let slug = baseSlug;
  let counter = 1;

  // Check for existing slugs and ensure uniqueness
  while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Calculate estimated reading time based on content
 */
blogPostSchema.methods.calculateReadTime = function() {
  if (!this.content) return 1;
  
  // Remove HTML tags and count words
  const plainText = this.content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.trim().split(/\s+/).length;
  
  // Average reading speed: 225 words per minute
  const readTime = Math.ceil(wordCount / 225);
  return Math.max(1, readTime);
};

/**
 * Pre-save middleware
 */
blogPostSchema.pre('save', async function(next) {
  try {
    // Generate slug if title changed or new document
    if (this.isModified('title') || this.isNew) {
      this.slug = await this.generateSlug(this.title);
    }

    // Calculate read time if content changed
    if (this.isModified('content')) {
      this.read_time_minutes = this.calculateReadTime();
    }

    // Set published_at when status changes to PUBLISHED for the first time
    if (this.isModified('status') && this.status === 'PUBLISHED' && !this.published_at) {
      this.published_at = new Date();
    }

    // Clear published_at if status changes from PUBLISHED
    if (this.isModified('status') && this.status !== 'PUBLISHED' && this.published_at) {
      this.published_at = null;
    }

    // Update updatedAt timestamp
    if (this.isModified() && !this.isNew) {
      this.updatedAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-validate middleware
 */
blogPostSchema.pre('validate', async function(next) {
  try {
    // Generate slug if not present and title exists
    if (!this.slug && this.title) {
      this.slug = await this.generateSlug(this.title);
    }

    // Calculate read time if not present and content exists
    if (!this.read_time_minutes && this.content) {
      this.read_time_minutes = this.calculateReadTime();
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Static methods
 */

// Get popular tags
blogPostSchema.statics.getPopularTags = async function(limit = 20) {
  return this.aggregate([
    {
      $match: {
        status: 'PUBLISHED',
        deleted_at: null,
        tags: { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        tag: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Increment view count atomically
blogPostSchema.statics.incrementViews = async function(postId) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { views_count: 1 } },
    { new: true }
  );
};

// Find published posts
blogPostSchema.statics.findPublished = function(conditions = {}) {
  return this.find({
    ...conditions,
    status: 'PUBLISHED',
    deleted_at: null
  });
};

/**
 * Virtual fields
 */
blogPostSchema.virtual('isPublished').get(function() {
  return this.status === 'PUBLISHED' && !this.deleted_at;
});

blogPostSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Ensure virtual fields are serialized
blogPostSchema.set('toJSON', { virtuals: true });
blogPostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);
