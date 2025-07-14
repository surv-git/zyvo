/**
 * Inventory Model
 * Mongoose schema and model for inventory management
 * Stores physical stock only for "base unit" product variants
 * Pack variants have computed stock based on their base unit relationship
 */

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  // Core Reference - Must be a base unit variant
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: [true, 'Product variant ID is required'],
    unique: true,
    index: true
  },

  // Physical Stock Information
  stock_quantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0,
    index: true
  },

  // Stock Management Dates
  last_restock_date: {
    type: Date,
    default: null,
    index: true
  },
  last_sold_date: {
    type: Date,
    default: null,
    index: true
  },

  // Stock Management
  min_stock_level: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock level cannot be negative'],
    validate: {
      validator: function(value) {
        // Min stock level should be reasonable
        if (value > 10000) {
          return false;
        }
        return true;
      },
      message: 'Minimum stock level seems unreasonably high'
    }
  },

  // Location and Notes
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
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

// Additional indexes for efficient querying
inventorySchema.index({ is_active: 1, stock_quantity: 1 });
inventorySchema.index({ stock_quantity: 1, min_stock_level: 1 });
inventorySchema.index({ last_restock_date: -1 });
inventorySchema.index({ last_sold_date: -1 });

// Virtual for stock status
inventorySchema.virtual('stock_status').get(function() {
  if (this.stock_quantity <= 0) {
    return 'Out of Stock';
  } else if (this.stock_quantity <= this.min_stock_level) {
    return 'Low Stock';
  } else if (this.stock_quantity <= this.min_stock_level * 2) {
    return 'Medium Stock';
  } else {
    return 'High Stock';
  }
});

// Virtual for low stock warning
inventorySchema.virtual('is_low_stock').get(function() {
  return this.stock_quantity <= this.min_stock_level && this.min_stock_level > 0;
});

// Virtual for out of stock
inventorySchema.virtual('is_out_of_stock').get(function() {
  return this.stock_quantity <= 0;
});

// Virtual for days since last restock
inventorySchema.virtual('days_since_restock').get(function() {
  if (!this.last_restock_date) return null;
  
  const now = new Date();
  const diffTime = Math.abs(now - this.last_restock_date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for days since last sale
inventorySchema.virtual('days_since_sale').get(function() {
  if (!this.last_sold_date) return null;
  
  const now = new Date();
  const diffTime = Math.abs(now - this.last_sold_date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Pre-save middleware to validate base unit constraint and update timestamps
inventorySchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Only validate base unit constraint if product_variant_id is new or modified
    if (this.isNew || this.isModified('product_variant_id')) {
      // Import ProductVariant model to avoid circular dependency
      const ProductVariant = mongoose.model('ProductVariant');
      
      // Fetch the referenced ProductVariant
      const productVariant = await ProductVariant.findById(this.product_variant_id).lean();
      if (!productVariant) {
        const error = new Error('Referenced product variant does not exist');
        error.name = 'ValidationError';
        return next(error);
      }
      
      // Check if this variant is a base unit by analyzing option_values
      const isBaseUnit = this.isVariantBaseUnit(productVariant.option_values);
      
      if (!isBaseUnit) {
        const error = new Error('Cannot create inventory record for a pack variant. Only base units track physical stock.');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    // Update restock date when stock is increased
    if (this.isModified('stock_quantity') && !this.isNew) {
      const originalStock = this.$__original ? this.$__original.stock_quantity : 0;
      if (this.stock_quantity > originalStock) {
        this.last_restock_date = new Date();
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to determine if a variant is a base unit
inventorySchema.methods.isVariantBaseUnit = function(optionValues) {
  if (!optionValues || !Array.isArray(optionValues)) {
    return true; // No pack option means it's a base unit
  }
  
  // Look for 'pack' option type
  const packOption = optionValues.find(option => 
    option.option_type === 'pack'
  );
  
  if (!packOption) {
    return true; // No pack option means it's a base unit
  }
  
  // Convert pack value to number and check if it's 1
  const packMultiplier = Number(packOption.option_value);
  
  // If pack value is invalid (NaN) or 1, it's a base unit
  return isNaN(packMultiplier) || packMultiplier === 1;
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = function() {
  return this.find({
    is_active: true,
    $expr: {
      $and: [
        { $gt: ['$min_stock_level', 0] },
        { $lte: ['$stock_quantity', '$min_stock_level'] }
      ]
    }
  });
};

// Static method to find out of stock items
inventorySchema.statics.findOutOfStock = function() {
  return this.find({
    is_active: true,
    stock_quantity: { $lte: 0 }
  });
};

// Static method to find items by location
inventorySchema.statics.findByLocation = function(location) {
  const locationRegex = new RegExp(location, 'i');
  return this.find({
    is_active: true,
    location: locationRegex
  });
};

// Static method to find recently restocked items
inventorySchema.statics.findRecentlyRestocked = function(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    is_active: true,
    last_restock_date: { $gte: cutoffDate }
  });
};

// Instance method to add stock
inventorySchema.methods.addStock = function(quantity, updateRestockDate = true) {
  if (quantity < 0) {
    throw new Error('Cannot add negative stock quantity');
  }
  
  this.stock_quantity += quantity;
  
  if (updateRestockDate) {
    this.last_restock_date = new Date();
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to remove stock
inventorySchema.methods.removeStock = function(quantity, updateSoldDate = true) {
  if (quantity < 0) {
    throw new Error('Cannot remove negative stock quantity');
  }
  
  if (this.stock_quantity < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.stock_quantity -= quantity;
  
  if (updateSoldDate) {
    this.last_sold_date = new Date();
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to set stock level
inventorySchema.methods.setStock = function(quantity, updateRestockDate = true) {
  if (quantity < 0) {
    throw new Error('Stock quantity cannot be negative');
  }
  
  const isIncrease = quantity > this.stock_quantity;
  this.stock_quantity = quantity;
  
  if (updateRestockDate && isIncrease) {
    this.last_restock_date = new Date();
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to soft delete
inventorySchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to activate
inventorySchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

// Query helpers for common operations
inventorySchema.query.active = function() {
  return this.where({ is_active: true });
};

inventorySchema.query.inactive = function() {
  return this.where({ is_active: false });
};

inventorySchema.query.lowStock = function() {
  return this.where({
    is_active: true,
    $expr: {
      $and: [
        { $gt: ['$min_stock_level', 0] },
        { $lte: ['$stock_quantity', '$min_stock_level'] }
      ]
    }
  });
};

inventorySchema.query.outOfStock = function() {
  return this.where({
    is_active: true,
    stock_quantity: { $lte: 0 }
  });
};

inventorySchema.query.withStock = function() {
  return this.where({
    is_active: true,
    stock_quantity: { $gt: 0 }
  });
};

inventorySchema.query.byLocation = function(location) {
  const locationRegex = new RegExp(location, 'i');
  return this.where({
    is_active: true,
    location: locationRegex
  });
};

// Export the model
module.exports = mongoose.model('Inventory', inventorySchema);
