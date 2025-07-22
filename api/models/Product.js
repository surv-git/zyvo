/**
 * Product Model
 * Represents the conceptual product in the e-commerce system
 * Product variants with specific prices and stock are handled separately
 */

const mongoose = require('mongoose');

// SEO Details sub-schema
const seoDetailsSchema = new mongoose.Schema({
  meta_title: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  meta_description: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  meta_keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { _id: false });

// Main Product Schema
const productSchema = new mongoose.Schema({
  // Core Product Information
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    minlength: [2, 'Product name must be at least 2 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  short_description: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },

  // Media and Branding
  images: [{
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  }],
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    index: true
  },

  // Scoring and SEO
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [5, 'Score cannot exceed 5'],
    default: 0
  },
  seo_details: {
    type: seoDetailsSchema,
    default: () => ({})
  },

  // Rating and review fields (aggregated from ProductVariant)
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true
  },
  
  reviews_count: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  
  rating_distribution: {
    type: {
      '1': { type: Number, default: 0, min: 0 },
      '2': { type: Number, default: 0, min: 0 },
      '3': { type: Number, default: 0, min: 0 },
      '4': { type: Number, default: 0, min: 0 },
      '5': { type: Number, default: 0, min: 0 }
    },
    default: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  },

  // Status and Timestamps
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're managing timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ brand_id: 1 });
productSchema.index({ is_active: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ score: -1 });

// Compound indexes for common query patterns
productSchema.index({ category_id: 1, is_active: 1 });
productSchema.index({ brand_id: 1, is_active: 1 });
productSchema.index({ is_active: 1, createdAt: -1 });

// Virtual fields
productSchema.virtual('primary_image').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Pre-save middleware to handle slug generation and uniqueness
productSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Generate slug from name if name is modified or this is a new document
    if (this.isModified('name') || this.isNew) {
      let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check for slug uniqueness
      while (await this.constructor.findOne({ 
        slug: slug, 
        _id: { $ne: this._id } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
    }
    
    // Auto-generate SEO details if not provided
    if (!this.seo_details.meta_title && this.name) {
      this.seo_details.meta_title = this.name.length > 60 
        ? this.name.substring(0, 57) + '...'
        : this.name;
    }
    
    if (!this.seo_details.meta_description && this.description) {
      this.seo_details.meta_description = this.description.length > 160
        ? this.description.substring(0, 157) + '...'
        : this.description;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods for common queries
productSchema.statics.findByCategory = function(categoryId, includeInactive = false) {
  const query = { category_id: categoryId };
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.find(query).populate('category_id');
};

productSchema.statics.findByBrand = function(brandId, includeInactive = false) {
  const query = { brand_id: brandId };
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.find(query).populate('category_id');
};

productSchema.statics.searchProducts = function(searchTerm, includeInactive = false) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { short_description: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).populate('category_id');
};

productSchema.statics.findActiveProducts = function() {
  return this.find({ is_active: true }).populate('category_id');
};

// Instance methods
productSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

productSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

productSchema.methods.updateScore = function(newScore) {
  this.score = Math.max(0, Math.min(5, newScore));
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
