/**
 * Platform Model
 * Mongoose schema and model for e-commerce platform management
 * Handles various platforms like Amazon, Flipkart, Myntra, etc.
 */

const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  // Platform Identification
  name: {
    type: String,
    required: [true, 'Platform name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Platform name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    required: [true, 'Platform slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [120, 'Platform slug cannot exceed 120 characters'],
    index: true,
    validate: {
      validator: function(value) {
        // Slug should only contain lowercase letters, numbers, and hyphens
        return /^[a-z0-9-]+$/.test(value);
      },
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
  },

  // Platform Details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  base_url: {
    type: String,
    trim: true,
    maxlength: [200, 'Base URL cannot exceed 200 characters'],
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null/empty values
        // Basic URL validation
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Base URL must be a valid URL'
    }
  },
  logo_url: {
    type: String,
    trim: true,
    maxlength: [300, 'Logo URL cannot exceed 300 characters'],
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null/empty values
        // Basic URL validation
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Logo URL must be a valid URL'
    }
  },

  // API Integration
  api_credentials_placeholder: {
    type: String,
    trim: true,
    maxlength: [200, 'API credentials placeholder cannot exceed 200 characters'],
    default: null,
    // Note: This is just a placeholder. In production, sensitive credentials
    // should be stored in encrypted form or in a secure vault service
  },

  // Status Management
  is_active: {
    type: Boolean,
    default: true,
    index: true
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
  }
}, {
  timestamps: false, // We manage timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
platformSchema.index({ name: 1, is_active: 1 });
platformSchema.index({ slug: 1, is_active: 1 });
platformSchema.index({ is_active: 1, createdAt: -1 });

// Virtual for formatted display name
platformSchema.virtual('display_name').get(function() {
  return this.name || 'Unknown Platform';
});

// Virtual for checking if platform has API credentials configured
platformSchema.virtual('has_api_credentials').get(function() {
  return Boolean(this.api_credentials_placeholder && this.api_credentials_placeholder.length > 0);
});

// Pre-save middleware to generate slug and update timestamps
platformSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Generate slug from name if not provided or if name changed
    if (this.isModified('name') || !this.slug) {
      let baseSlug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      // Ensure slug uniqueness
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingPlatform = await this.constructor.findOne({ 
          slug: slug,
          _id: { $ne: this._id } // Exclude current document if updating
        });
        
        if (!existingPlatform) {
          this.slug = slug;
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find active platforms
platformSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Static method to search platforms by name or description
platformSchema.statics.search = function(searchTerm) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex }
    ]
  });
};

// Instance method to soft delete platform
platformSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to activate platform
platformSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

// Query helpers for common operations
platformSchema.query.active = function() {
  return this.where({ is_active: true });
};

platformSchema.query.inactive = function() {
  return this.where({ is_active: false });
};

platformSchema.query.byName = function(name) {
  return this.where({ name: new RegExp(name, 'i') });
};

platformSchema.query.bySlug = function(slug) {
  return this.where({ slug: slug });
};

// Export the model
module.exports = mongoose.model('Platform', platformSchema);
