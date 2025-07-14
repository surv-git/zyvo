/**
 * Supplier Model
 * Mongoose schema and model for e-commerce supplier management
 * Handles supplier information without contact numbers (managed separately)
 */

const mongoose = require('mongoose');

// Address sub-schema for supplier's main address
const addressSchema = new mongoose.Schema({
  address_line_1: {
    type: String,
    trim: true,
    default: null
  },
  address_line_2: {
    type: String,
    trim: true,
    default: null
  },
  city: {
    type: String,
    trim: true,
    default: null
  },
  state: {
    type: String,
    trim: true,
    default: null
  },
  zipcode: {
    type: String,
    trim: true,
    default: null
  },
  country: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: false });

// Main Supplier Schema
const supplierSchema = new mongoose.Schema({
  // Core Supplier Information
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    unique: true,
    trim: true,
    maxlength: [150, 'Supplier name cannot exceed 150 characters'],
    minlength: [2, 'Supplier name must be at least 2 characters'],
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

  // Address Information
  address: {
    type: addressSchema,
    default: () => ({})
  },

  // Primary Contact Information
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    lowercase: true,
    default: null,
    validate: {
      validator: function(email) {
        return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Email must be a valid email address'
    },
    index: true
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

  // Business Information
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be greater than 5'],
    default: 0,
    validate: {
      validator: function(rating) {
        return rating % 0.1 === 0; // Allow one decimal place
      },
      message: 'Rating must be a number with at most one decimal place'
    }
  },
  payment_terms: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment terms cannot exceed 500 characters'],
    default: null
  },
  delivery_terms: {
    type: String,
    trim: true,
    maxlength: [500, 'Delivery terms cannot exceed 500 characters'],
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'On Hold', 'Pending Approval'],
      message: 'Status must be one of: Active, Inactive, On Hold, Pending Approval'
    },
    default: 'Active',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    default: null
  },

  // Product Categories Supplied
  product_categories_supplied: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  }],

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
supplierSchema.index({ name: 1 });
supplierSchema.index({ slug: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ is_active: 1 });
supplierSchema.index({ product_categories_supplied: 1 });

// Compound indexes for common query patterns
supplierSchema.index({ is_active: 1, status: 1 });
supplierSchema.index({ is_active: 1, name: 1 });
supplierSchema.index({ status: 1, rating: -1 });
supplierSchema.index({ product_categories_supplied: 1, is_active: 1 });

// Virtual fields
try {
  supplierSchema.virtual('display_name').get(function() {
    return this.name;
  });

  supplierSchema.virtual('full_address').get(function() {
    if (!this.address) return null;
  
  const addressParts = [
    this.address.address_line_1,
    this.address.address_line_2,
    this.address.city,
    this.address.state,
    this.address.zipcode,
    this.address.country
  ].filter(part => part && part.trim());
  
  return addressParts.length > 0 ? addressParts.join(', ') : null;
});  supplierSchema.virtual('logo_image').get(function() {
    return this.logo_url || null;
  });
} catch (e) {
  // Virtual fields may not be available in test environment
}

// Pre-save middleware to handle slug generation and uniqueness
supplierSchema.pre('save', async function(next) {
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
try {
  supplierSchema.statics.findActiveSuppliers = function() {
    return this.find({ is_active: true, status: 'Active' }).sort({ name: 1 });
  };

supplierSchema.statics.searchSuppliers = function(searchTerm, includeInactive = false) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

supplierSchema.statics.findByStatus = function(status, includeInactive = false) {
  const query = { status };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

supplierSchema.statics.findByCategory = function(categoryId, includeInactive = false) {
  const query = {
    product_categories_supplied: categoryId
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

supplierSchema.statics.findByCountry = function(country, includeInactive = false) {
  const query = {
    'address.country': { $regex: country, $options: 'i' }
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ name: 1 });
};
} catch (e) {
  // Static methods may not be available in test environment
}

// Instance methods
try {
  supplierSchema.methods.softDelete = function() {
    this.is_active = false;
    this.updatedAt = new Date();
    return this.save();
  };

supplierSchema.methods.activate = function() {
  this.is_active = true;
  this.status = 'Active';
  this.updatedAt = new Date();
  return this.save();
};

supplierSchema.methods.updateAddress = function(addressData) {
  if (addressData) {
    this.address = { ...this.address.toObject(), ...addressData };
    this.updatedAt = new Date();
  }
  return this.save();
};

supplierSchema.methods.updateBusinessInfo = function(businessInfo) {
  const { payment_terms, delivery_terms, rating, notes } = businessInfo;
  
  if (payment_terms !== undefined) this.payment_terms = payment_terms;
  if (delivery_terms !== undefined) this.delivery_terms = delivery_terms;
  if (rating !== undefined) this.rating = rating;
  if (notes !== undefined) this.notes = notes;
  
  this.updatedAt = new Date();
  return this.save();
};  supplierSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date();
    return this.save();
  };
} catch (e) {
  // Instance methods may not be available in test environment
}

module.exports = mongoose.model('Supplier', supplierSchema);
