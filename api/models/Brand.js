/**
 * Brand Model
 * Mongoose schema and model for e-commerce brand management
 * Handles brand information that can be linked to products
 */

const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  // Core Brand Information
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
    minlength: [2, 'Brand name must be at least 2 characters'],
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: null
  },

  // Brand Assets and Contact
  logo_url: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
      },
      message: 'Logo URL must be a valid image URL (jpg, jpeg, png, gif, webp, svg)'
    }
  },
  website: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/.+\..+/.test(url);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },
  contact_email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
    validate: {
      validator: function(email) {
        return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Contact email must be a valid email address'
    }
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
brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });
brandSchema.index({ is_active: 1 });
brandSchema.index({ createdAt: -1 });

// Compound indexes for common query patterns
brandSchema.index({ is_active: 1, name: 1 });
brandSchema.index({ is_active: 1, createdAt: -1 });

// Virtual fields
brandSchema.virtual('display_name').get(function() {
  return this.name;
});

brandSchema.virtual('logo_image').get(function() {
  return this.logo_url || null;
});

// Pre-save middleware to handle slug generation and uniqueness
brandSchema.pre('save', async function(next) {
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
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods for common queries
brandSchema.statics.findByCategory = function(includeInactive = false) {
  const query = {};
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.find(query).sort({ name: 1 });
};

brandSchema.statics.searchBrands = function(searchTerm, includeInactive = false) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

brandSchema.statics.findActiveBrands = function() {
  return this.find({ is_active: true }).sort({ name: 1 });
};

brandSchema.statics.findByWebsite = function(websiteDomain, includeInactive = false) {
  const query = {
    website: { $regex: websiteDomain, $options: 'i' }
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

// Instance methods
brandSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

brandSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

brandSchema.methods.updateContactInfo = function(email, website) {
  if (email !== undefined) this.contact_email = email;
  if (website !== undefined) this.website = website;
  this.updatedAt = new Date();
  return this.save();
};

brandSchema.methods.updateLogo = function(logoUrl) {
  this.logo_url = logoUrl;
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Brand', brandSchema);
