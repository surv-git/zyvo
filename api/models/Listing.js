/**
 * Listing Model
 * Mongoose schema and model for product variant listing management
 * Handles specific details, pricing, and fees for ProductVariants on different platforms
 */

const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  // Core References
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: [true, 'Product variant ID is required'],
    index: true
  },
  platform_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    required: [true, 'Platform ID is required'],
    index: true
  },

  // Platform-Specific Identifiers
  platform_sku: {
    type: String,
    trim: true,
    maxlength: [100, 'Platform SKU cannot exceed 100 characters'],
    default: null,
    index: true
  },
  platform_product_id: {
    type: String,
    trim: true,
    maxlength: [150, 'Platform product ID cannot exceed 150 characters'],
    default: null,
    index: true
  },

  // Listing Management
  listing_status: {
    type: String,
    enum: {
      values: ['Draft', 'Pending Review', 'Live', 'Rejected', 'Deactivated'],
      message: 'Listing status must be one of: Draft, Pending Review, Live, Rejected, Deactivated'
    },
    default: 'Draft',
    index: true
  },

  // Pricing Information
  platform_price: {
    type: Number,
    min: [0, 'Platform price cannot be negative'],
    default: null,
    validate: {
      validator: function(value) {
        // If price is provided, it should be a reasonable amount
        if (value !== null && value !== undefined && value > 1000000) {
          return false;
        }
        return true;
      },
      message: 'Platform price seems unreasonably high'
    }
  },

  // Platform Fees
  platform_commission_percentage: {
    type: Number,
    min: [0, 'Commission percentage cannot be negative'],
    max: [100, 'Commission percentage cannot exceed 100'],
    default: null,
    validate: {
      validator: function(value) {
        // Commission should be a reasonable percentage
        if (value !== null && value !== undefined && value < 0) {
          return false;
        }
        return true;
      },
      message: 'Commission percentage must be between 0 and 100'
    }
  },
  platform_fixed_fee: {
    type: Number,
    min: [0, 'Fixed fee cannot be negative'],
    default: null
  },
  platform_shipping_fee: {
    type: Number,
    min: [0, 'Shipping fee cannot be negative'],
    default: null
  },

  // Synchronization
  last_synced_at: {
    type: Date,
    default: null,
    index: true
  },

  // Platform-Specific Data
  platform_specific_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    validate: {
      validator: function(value) {
        // If platform_specific_data is provided, ensure it's not too large
        if (value && JSON.stringify(value).length > 10000) {
          return false;
        }
        return true;
      },
      message: 'Platform specific data is too large (max 10KB)'
    }
  },

  // Status Management
  is_active_on_platform: {
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

// Compound unique index to ensure one listing per variant per platform
listingSchema.index({ product_variant_id: 1, platform_id: 1 }, { unique: true });

// Additional indexes for efficient querying
listingSchema.index({ platform_id: 1, listing_status: 1 });
listingSchema.index({ product_variant_id: 1, listing_status: 1 });
listingSchema.index({ listing_status: 1, is_active_on_platform: 1 });
listingSchema.index({ platform_id: 1, is_active_on_platform: 1 });
listingSchema.index({ is_active_on_platform: 1, last_synced_at: -1 });
listingSchema.index({ platform_sku: 1, platform_id: 1 });
listingSchema.index({ platform_product_id: 1, platform_id: 1 });

// Virtual for total platform fees
listingSchema.virtual('total_platform_fees').get(function() {
  let total = 0;
  
  if (this.platform_fixed_fee) {
    total += this.platform_fixed_fee;
  }
  
  if (this.platform_shipping_fee) {
    total += this.platform_shipping_fee;
  }
  
  // Commission is percentage-based, so we calculate it if platform_price exists
  if (this.platform_commission_percentage && this.platform_price) {
    total += (this.platform_price * this.platform_commission_percentage) / 100;
  }
  
  return parseFloat(total.toFixed(2));
});

// Virtual for net revenue (price minus fees)
listingSchema.virtual('estimated_net_revenue').get(function() {
  if (!this.platform_price) return null;
  
  const totalFees = this.total_platform_fees;
  const netRevenue = this.platform_price - totalFees;
  
  return parseFloat(Math.max(0, netRevenue).toFixed(2));
});

// Virtual for listing display name
listingSchema.virtual('listing_display_name').get(function() {
  const status = this.listing_status || 'Unknown';
  const sku = this.platform_sku || 'No SKU';
  return `${sku} - ${status}`;
});

// Virtual to check if listing is live and active
listingSchema.virtual('is_live_and_active').get(function() {
  return this.listing_status === 'Live' && this.is_active_on_platform === true;
});

// Virtual to check if listing needs sync
listingSchema.virtual('needs_sync').get(function() {
  if (!this.last_synced_at) return true;
  
  // Consider needing sync if not synced in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.last_synced_at < oneDayAgo;
});

// Pre-save middleware to update timestamps and validate business logic
listingSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Validate that variant and platform exist (basic reference check)
    if (this.isModified('product_variant_id') && this.product_variant_id) {
      const ProductVariant = mongoose.model('ProductVariant');
      const variant = await ProductVariant.findById(this.product_variant_id);
      if (!variant) {
        const error = new Error('Referenced product variant does not exist');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    if (this.isModified('platform_id') && this.platform_id) {
      const Platform = mongoose.model('Platform');
      const platform = await Platform.findById(this.platform_id);
      if (!platform) {
        const error = new Error('Referenced platform does not exist');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    // Business logic: If status is Live, ensure required fields are present
    if (this.listing_status === 'Live') {
      if (!this.platform_price || this.platform_price <= 0) {
        const error = new Error('Live listings must have a valid platform price');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    // Auto-update sync timestamp when certain fields change
    const syncFields = ['platform_price', 'listing_status', 'platform_sku', 'platform_product_id'];
    if (syncFields.some(field => this.isModified(field))) {
      this.last_synced_at = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find active listings
listingSchema.statics.findActive = function() {
  return this.find({ is_active_on_platform: true });
};

// Static method to find listings by platform
listingSchema.statics.findByPlatform = function(platformId) {
  return this.find({ platform_id: platformId });
};

// Static method to find listings by product variant
listingSchema.statics.findByProductVariant = function(variantId) {
  return this.find({ product_variant_id: variantId });
};

// Static method to find live listings
listingSchema.statics.findLive = function() {
  return this.find({ 
    listing_status: 'Live',
    is_active_on_platform: true 
  });
};

// Static method to find listings needing sync
listingSchema.statics.findNeedingSync = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.find({
    $or: [
      { last_synced_at: null },
      { last_synced_at: { $lt: oneDayAgo } }
    ],
    is_active_on_platform: true
  });
};

// Static method to search listings
listingSchema.statics.search = function(searchTerm) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { platform_sku: searchRegex },
      { platform_product_id: searchRegex }
    ]
  });
};

// Instance method to soft delete listing
listingSchema.methods.softDelete = function() {
  this.is_active_on_platform = false;
  this.listing_status = 'Deactivated';
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to activate listing
listingSchema.methods.activate = function() {
  this.is_active_on_platform = true;
  if (this.listing_status === 'Deactivated') {
    this.listing_status = 'Draft';
  }
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to mark as synced
listingSchema.methods.markAsSynced = function() {
  this.last_synced_at = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to update listing status
listingSchema.methods.updateStatus = function(newStatus) {
  this.listing_status = newStatus;
  this.updatedAt = new Date();
  return this.save();
};

// Query helpers for common operations
listingSchema.query.active = function() {
  return this.where({ is_active_on_platform: true });
};

listingSchema.query.inactive = function() {
  return this.where({ is_active_on_platform: false });
};

listingSchema.query.byPlatform = function(platformId) {
  return this.where({ platform_id: platformId });
};

listingSchema.query.byProductVariant = function(variantId) {
  return this.where({ product_variant_id: variantId });
};

listingSchema.query.byStatus = function(status) {
  return this.where({ listing_status: status });
};

listingSchema.query.live = function() {
  return this.where({ 
    listing_status: 'Live',
    is_active_on_platform: true 
  });
};

listingSchema.query.needingSync = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.where({
    $or: [
      { last_synced_at: null },
      { last_synced_at: { $lt: oneDayAgo } }
    ],
    is_active_on_platform: true
  });
};

listingSchema.query.withPrice = function() {
  return this.where({ 
    platform_price: { $exists: true, $ne: null, $gt: 0 } 
  });
};

// Export the model
module.exports = mongoose.model('Listing', listingSchema);
