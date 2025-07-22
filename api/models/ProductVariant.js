/**
 * ProductVariant Model
 * Represents unique Stock Keeping Units (SKUs) for products
 * Each variant is defined by a specific combination of option values
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Discount details sub-schema
const discountDetailsSchema = new Schema({
  price: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    default: null
  },
  percentage: {
    type: Number,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100'],
    default: null
  },
  end_date: {
    type: Date,
    default: null
  },
  is_on_sale: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  _id: false // Disable _id for subdocument
});

// Dimensions sub-schema
const dimensionsSchema = new Schema({
  length: {
    type: Number,
    min: [0, 'Length cannot be negative'],
    default: 0
  },
  width: {
    type: Number,
    min: [0, 'Width cannot be negative'],
    default: 0
  },
  height: {
    type: Number,
    min: [0, 'Height cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: {
      values: ['cm', 'in'],
      message: 'Unit must be either cm or in'
    },
    default: 'cm'
  }
}, {
  _id: false // Disable _id for subdocument
});

// Weight sub-schema
const weightSchema = new Schema({
  value: {
    type: Number,
    min: [0, 'Weight value cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: {
      values: ['g', 'kg', 'lb', 'oz'],
      message: 'Weight unit must be g, kg, lb, or oz'
    },
    default: 'g'
  }
}, {
  _id: false // Disable _id for subdocument
});

// Main ProductVariant schema
const productVariantSchema = new Schema({
  // Core identification
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  
  // Option values that define this variant
  option_values: [{
    type: Schema.Types.ObjectId,
    ref: 'Option',
    required: true
  }],
  
  // Unique SKU code for inventory tracking
  sku_code: {
    type: String,
    required: [true, 'SKU code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'SKU code cannot exceed 50 characters'],
    minlength: [3, 'SKU code must be at least 3 characters'],
    index: true
  },
  
  // Pricing information
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    index: true
  },
  
  // Discount details
  discount_details: {
    type: discountDetailsSchema,
    default: () => ({})
  },
  
  // URL-friendly identifier
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Physical properties
  dimensions: {
    type: dimensionsSchema,
    default: () => ({})
  },
  
  weight: {
    type: weightSchema,
    default: () => ({})
  },
  
  // Cost information
  packaging_cost: {
    type: Number,
    default: 0,
    min: [0, 'Packaging cost cannot be negative']
  },
  
  shipping_cost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  
  // Media
  images: [{
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        // Basic URL validation
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Invalid image URL format'
    }
  }],
  
  // Status and ordering
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  sort_order: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Rating and review fields (denormalized from ProductReview)
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
  timestamps: false, // We're managing timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
productVariantSchema.index({ product_id: 1, is_active: 1 });
productVariantSchema.index({ is_active: 1, 'discount_details.is_on_sale': 1 });
productVariantSchema.index({ price: 1, is_active: 1 });
productVariantSchema.index({ createdAt: -1 });
productVariantSchema.index({ sort_order: 1, createdAt: 1 });

// Compound unique index to prevent duplicate variants for the same product with same options
// Note: This works for arrays by comparing the entire array
productVariantSchema.index(
  { product_id: 1, option_values: 1 }, 
  { 
    unique: true,
    name: 'unique_product_option_combination'
  }
);

// Virtual fields
productVariantSchema.virtual('effective_price').get(function() {
  // Return discounted price if on sale, otherwise regular price
  if (this.discount_details?.is_on_sale && this.discount_details?.price) {
    return this.discount_details.price;
  }
  return this.price;
});

productVariantSchema.virtual('savings').get(function() {
  // Calculate savings if on sale
  if (this.discount_details?.is_on_sale && this.discount_details?.price) {
    return this.price - this.discount_details.price;
  }
  return 0;
});

productVariantSchema.virtual('discount_percentage_calculated').get(function() {
  // Calculate actual discount percentage
  if (this.discount_details?.is_on_sale && this.discount_details?.price) {
    return Math.round(((this.price - this.discount_details.price) / this.price) * 100);
  }
  return 0;
});

// Pre-save middleware for validation, slug generation and timestamp updates
productVariantSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Check for duplicate product + option values combination
    if (this.isNew || this.isModified('product_id') || this.isModified('option_values')) {
      // Sort option_values to ensure consistent comparison
      const sortedOptionValues = [...this.option_values].sort().map(id => id.toString());
      
      const duplicateCheck = await this.constructor.findOne({
        product_id: this.product_id,
        option_values: { $all: this.option_values, $size: this.option_values.length },
        _id: { $ne: this._id }
      });
      
      if (duplicateCheck) {
        const error = new Error('A variant with this combination of options already exists for this product');
        error.code = 11000; // MongoDB duplicate key error code
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    // Generate slug if not provided or if product_id/option_values changed
    if (!this.slug || this.isModified('product_id') || this.isModified('option_values') || this.isNew) {
      await this.populate('product_id', 'slug');
      await this.populate('option_values', 'option_value');
      
      let baseSlug = this.product_id?.slug || 'variant';
      
      // Add option values to slug
      if (this.option_values?.length > 0) {
        const optionValues = this.option_values
          .map(opt => opt.option_value || 'unknown')
          .join('-');
        baseSlug += `-${optionValues}`;
      }
      
      // Sanitize slug
      baseSlug = baseSlug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
      
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness
      while (await this.constructor.findOne({ 
        slug: slug, 
        _id: { $ne: this._id } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
    }
    
    // Update sale status based on discount end date
    if (this.discount_details?.end_date && this.discount_details.end_date < new Date()) {
      this.discount_details.is_on_sale = false;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
productVariantSchema.statics.findByProductId = function(productId, includeInactive = false) {
  const query = { product_id: productId };
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .populate('option_values', 'option_type option_value name slug')
    .populate('product_id', 'name slug')
    .sort({ sort_order: 1, createdAt: 1 });
};

productVariantSchema.statics.findBySKU = function(skuCode, includeInactive = false) {
  const query = { sku_code: skuCode.toUpperCase() };
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.findOne(query)
    .populate('option_values', 'option_type option_value name slug')
    .populate('product_id', 'name slug description');
};

productVariantSchema.statics.findOnSale = function(includeInactive = false) {
  const query = { 'discount_details.is_on_sale': true };
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .populate('option_values', 'option_type option_value name slug')
    .populate('product_id', 'name slug')
    .sort({ 'discount_details.percentage': -1, price: 1 });
};

productVariantSchema.statics.searchBySKU = function(searchTerm, includeInactive = false) {
  const query = {
    sku_code: { $regex: searchTerm, $options: 'i' }
  };
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .populate('option_values', 'option_type option_value name slug')
    .populate('product_id', 'name slug')
    .sort({ sku_code: 1 });
};

// Instance methods
productVariantSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

productVariantSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

productVariantSchema.methods.updateDiscount = function(discountData) {
  this.discount_details = {
    ...this.discount_details.toObject(),
    ...discountData,
    is_on_sale: discountData.price > 0 || discountData.percentage > 0
  };
  this.updatedAt = new Date();
  return this.save();
};

productVariantSchema.methods.clearDiscount = function() {
  this.discount_details = {
    price: null,
    percentage: null,
    end_date: null,
    is_on_sale: false
  };
  this.updatedAt = new Date();
  return this.save();
};

// Create and export the model
const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = ProductVariant;
