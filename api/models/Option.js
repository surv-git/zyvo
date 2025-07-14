/**
 * Option Model
 * Represents product options (types and values) in the e-commerce system
 * Combines OptionType and OptionValue concepts into a single document
 */

const mongoose = require('mongoose');

// Main Option Schema
const optionSchema = new mongoose.Schema({
  // Core Option Information
  option_type: {
    type: String,
    required: [true, 'Option type is required'],
    trim: true,
    maxlength: [50, 'Option type cannot exceed 50 characters'],
    minlength: [2, 'Option type must be at least 2 characters'],
    index: true
  },
  option_value: {
    type: String,
    required: [true, 'Option value is required'],
    trim: true,
    maxlength: [100, 'Option value cannot exceed 100 characters'],
    minlength: [1, 'Option value must be at least 1 character']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [150, 'Display name cannot exceed 150 characters'],
    minlength: [1, 'Display name must be at least 1 character']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // Status and Ordering
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  sort_order: {
    type: Number,
    default: 0,
    min: [0, 'Sort order cannot be negative']
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
optionSchema.index({ option_type: 1 });
optionSchema.index({ slug: 1 });
optionSchema.index({ is_active: 1 });
optionSchema.index({ sort_order: 1 });

// Compound indexes for common query patterns
optionSchema.index({ option_type: 1, is_active: 1 });
optionSchema.index({ option_type: 1, sort_order: 1 });
optionSchema.index({ is_active: 1, sort_order: 1 });

// Unique compound index to prevent duplicate option type + value combinations
optionSchema.index({ option_type: 1, option_value: 1 }, { unique: true });

// Virtual fields
optionSchema.virtual('full_name').get(function() {
  return `${this.option_type}: ${this.name}`;
});

// Pre-save middleware to handle slug generation and uniqueness
optionSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Set name to option_value if name is not provided
    if (!this.name || this.name.trim() === '') {
      this.name = this.option_value;
    }
    
    // Generate slug from option_type and option_value if they are modified or this is a new document
    if (this.isModified('option_type') || this.isModified('option_value') || this.isNew) {
      let baseSlug = `${this.option_type}-${this.option_value}`
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
    
    // Auto-generate display name if not provided or if it matches the option_value
    if (!this.name || this.name === this.option_value) {
      this.name = this.option_value;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods for common queries
optionSchema.statics.findByType = function(optionType, includeInactive = false) {
  const query = { option_type: optionType };
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.find(query).sort({ sort_order: 1, name: 1 });
};

optionSchema.statics.findActiveOptions = function() {
  return this.find({ is_active: true }).sort({ option_type: 1, sort_order: 1 });
};

optionSchema.statics.getOptionTypes = function(includeInactive = false) {
  const matchStage = includeInactive ? {} : { is_active: true };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$option_type',
        count: { $sum: 1 },
        values: { $push: { _id: '$_id', option_value: '$option_value', name: '$name', slug: '$slug', sort_order: '$sort_order' } }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        option_type: '$_id',
        count: 1,
        values: { $sortArray: { input: '$values', sortBy: { sort_order: 1, name: 1 } } }
      }
    }
  ]);
};

optionSchema.statics.searchOptions = function(searchTerm, includeInactive = false) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { option_value: { $regex: searchTerm, $options: 'i' } },
      { option_type: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query).sort({ option_type: 1, sort_order: 1 });
};

// Instance methods
optionSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

optionSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

optionSchema.methods.updateSortOrder = function(newSortOrder) {
  this.sort_order = Math.max(0, newSortOrder);
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Option', optionSchema);
