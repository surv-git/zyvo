/**
 * Purchase Model
 * Mongoose schema and model for purchase management system
 * Handles both purchase planning and actual purchase records
 */

const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  // Foreign Key References
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: [true, 'Product variant ID is required'],
    index: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required'],
    index: true
  },

  // Purchase Identification
  purchase_order_number: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values while enforcing uniqueness for non-null values
    trim: true,
    default: null,
    maxlength: [50, 'Purchase order number cannot exceed 50 characters'],
    index: { sparse: true } // Sparse index for optional unique field
  },

  // Purchase Timing
  purchase_date: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now,
    index: true
  },
  expected_delivery_date: {
    type: Date,
    default: null,
    validate: {
      validator: function(date) {
        // If provided, expected delivery date should be after purchase date
        return !date || !this.purchase_date || date >= this.purchase_date;
      },
      message: 'Expected delivery date must be after purchase date'
    }
  },
  received_date: {
    type: Date,
    default: null,
    validate: {
      validator: function(date) {
        // If provided, received date should be after purchase date
        return !date || !this.purchase_date || date >= this.purchase_date;
      },
      message: 'Received date must be after purchase date'
    }
  },

  // Quantity and Pricing
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Quantity must be a whole number'
    }
  },
  unit_price_at_purchase: {
    type: Number,
    required: [true, 'Unit price at purchase is required'],
    min: [0, 'Unit price cannot be negative'],
    validate: {
      validator: function(value) {
        // Allow up to 2 decimal places for currency
        return Math.round(value * 100) === value * 100;
      },
      message: 'Unit price must have at most 2 decimal places'
    }
  },
  packaging_cost: {
    type: Number,
    required: [true, 'Packaging cost is required'],
    min: [0, 'Packaging cost cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        return Math.round(value * 100) === value * 100;
      },
      message: 'Packaging cost must have at most 2 decimal places'
    }
  },
  shipping_cost: {
    type: Number,
    required: [true, 'Shipping cost is required'],
    min: [0, 'Shipping cost cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        return Math.round(value * 100) === value * 100;
      },
      message: 'Shipping cost must have at most 2 decimal places'
    }
  },
  landing_price: {
    type: Number,
    required: [true, 'Landing price is required'],
    min: [0, 'Landing price cannot be negative'],
    validate: {
      validator: function(value) {
        return Math.round(value * 100) === value * 100;
      },
      message: 'Landing price must have at most 2 decimal places'
    }
  },

  // Status and Management
  status: {
    type: String,
    enum: {
      values: ['Planned', 'Pending', 'Completed', 'Cancelled', 'Partially Received'],
      message: 'Status must be one of: Planned, Pending, Completed, Cancelled, Partially Received'
    },
    default: 'Planned',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  },
  
  // Inventory Integration
  inventory_updated_on_completion: {
    type: Boolean,
    default: false,
    index: true
  },
  
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

// Indexes for efficient querying
purchaseSchema.index({ product_variant_id: 1, supplier_id: 1 });
purchaseSchema.index({ purchase_date: -1 });
purchaseSchema.index({ status: 1, purchase_date: -1 });
purchaseSchema.index({ supplier_id: 1, status: 1 });
purchaseSchema.index({ is_active: 1, purchase_date: -1 });

// Virtual for calculating total cost per unit (landing price / quantity)
purchaseSchema.virtual('unit_landing_cost').get(function() {
  return this.quantity > 0 ? this.landing_price / this.quantity : 0;
});

// Virtual for checking if purchase is overdue
purchaseSchema.virtual('is_overdue').get(function() {
  if (!this.expected_delivery_date || this.received_date || 
      ['Completed', 'Cancelled'].includes(this.status)) {
    return false;
  }
  return new Date() > this.expected_delivery_date;
});

// Pre-save middleware to update timestamps and validate landing price
purchaseSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Calculate and validate landing price
  const calculatedLandingPrice = (this.unit_price_at_purchase * this.quantity) + 
                                this.packaging_cost + this.shipping_cost;
  
  // Allow small floating point differences (within 1 cent)
  if (Math.abs(this.landing_price - calculatedLandingPrice) > 0.01) {
    return next(new Error('Landing price does not match calculated value'));
  }
  
  next();
});

// Static method to calculate landing price
purchaseSchema.statics.calculateLandingPrice = function(unitPrice, quantity, packagingCost, shippingCost) {
  return (unitPrice * quantity) + packagingCost + shippingCost;
};

// Instance method to update landing price
purchaseSchema.methods.updateLandingPrice = function() {
  this.landing_price = this.constructor.calculateLandingPrice(
    this.unit_price_at_purchase,
    this.quantity,
    this.packaging_cost,
    this.shipping_cost
  );
  return this.landing_price;
};

// Instance method to mark as received
purchaseSchema.methods.markAsReceived = function(receivedDate = new Date()) {
  this.received_date = receivedDate;
  this.status = 'Completed';
  this.updatedAt = new Date();
  
  // TODO: Future integration point - Update inventory levels
  // When this method is called, trigger inventory update:
  // - Find inventory record for this product_variant_id
  // - Increase stock_quantity by this.quantity
  // - Update average_cost if needed
  // - Log inventory transaction
};

// Instance method to mark as partially received
purchaseSchema.methods.markAsPartiallyReceived = function(receivedDate = new Date()) {
  this.received_date = receivedDate;
  this.status = 'Partially Received';
  this.updatedAt = new Date();
  
  // TODO: Future integration point - Partial inventory update
  // This would require additional logic to track partial quantities
};

// Query helpers for common operations
purchaseSchema.query.active = function() {
  return this.where({ is_active: true });
};

purchaseSchema.query.byStatus = function(status) {
  return this.where({ status });
};

purchaseSchema.query.bySupplier = function(supplierId) {
  return this.where({ supplier_id: supplierId });
};

purchaseSchema.query.byProductVariant = function(variantId) {
  return this.where({ product_variant_id: variantId });
};

purchaseSchema.query.byDateRange = function(startDate, endDate) {
  const query = {};
  if (startDate) query.$gte = new Date(startDate);
  if (endDate) query.$lte = new Date(endDate);
  
  return Object.keys(query).length > 0 ? this.where({ purchase_date: query }) : this;
};

// Export the model
module.exports = mongoose.model('Purchase', purchaseSchema);
