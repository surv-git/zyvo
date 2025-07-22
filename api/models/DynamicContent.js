/**
 * DynamicContent Model
 * Mongoose schema for managing dynamic visual and textual content elements
 * Supports carousels, marquee text, advertisements, offers, and promos
 */

const mongoose = require('mongoose');

const dynamicContentSchema = new mongoose.Schema({
  // Core identification
  name: {
    type: String,
    required: [true, 'Content name is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Content name cannot exceed 200 characters']
  },

  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: {
      values: ['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO'],
      message: 'Type must be one of: CAROUSEL, MARQUEE, ADVERTISEMENT, OFFER, PROMO'
    },
    index: true
  },

  location_key: {
    type: String,
    required: [true, 'Location key is required'],
    trim: true,
    maxlength: [100, 'Location key cannot exceed 100 characters'],
    index: true
  },

  // Display control
  content_order: {
    type: Number,
    default: 0,
    min: [0, 'Content order cannot be negative']
  },

  is_active: {
    type: Boolean,
    default: false,
    index: true
  },

  display_start_date: {
    type: Date,
    default: null,
    index: true
  },

  display_end_date: {
    type: Date,
    default: null,
    index: true,
    validate: {
      validator: function(value) {
        // If both dates are provided, end date should be after start date
        if (value && this.display_start_date) {
          return value > this.display_start_date;
        }
        return true;
      },
      message: 'Display end date must be after start date'
    }
  },

  // Content specific fields
  primary_image_url: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true;
        // Basic URL validation
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(value);
      },
      message: 'Primary image URL must be a valid URL'
    }
  },

  mobile_image_url: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true;
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(value);
      },
      message: 'Mobile image URL must be a valid URL'
    }
  },

  alt_text: {
    type: String,
    trim: true,
    maxlength: [250, 'Alt text cannot exceed 250 characters'],
    default: null
  },

  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters'],
    default: null
  },

  main_text_content: {
    type: String,
    trim: true,
    maxlength: [1000, 'Main text content cannot exceed 1000 characters'],
    default: null
  },

  link_url: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true;
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(value);
      },
      message: 'Link URL must be a valid URL'
    }
  },

  call_to_action_text: {
    type: String,
    trim: true,
    maxlength: [50, 'Call to action text cannot exceed 50 characters'],
    default: null
  },

  // Advanced/Flexible fields
  target_audience_tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.every(tag => tag.length <= 50);
      },
      message: 'Each target audience tag cannot exceed 50 characters'
    }
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Audit fields
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },

  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
dynamicContentSchema.index({ name: 1 });
dynamicContentSchema.index({ type: 1, location_key: 1 });
dynamicContentSchema.index({ is_active: 1, display_start_date: 1, display_end_date: 1 });
dynamicContentSchema.index({ location_key: 1, type: 1, is_active: 1, content_order: 1 });

// Virtual for checking if content is currently active based on dates
dynamicContentSchema.virtual('is_currently_active').get(function() {
  if (!this.is_active) return false;
  
  const now = new Date();
  
  // Check start date
  if (this.display_start_date && this.display_start_date > now) {
    return false;
  }
  
  // Check end date
  if (this.display_end_date && this.display_end_date <= now) {
    return false;
  }
  
  return true;
});

// Pre-save middleware
dynamicContentSchema.pre('save', function(next) {
  // Update updatedAt on modifications
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Content type validation
  this.validateContentByType();
  
  next();
});

// Instance methods
dynamicContentSchema.methods.validateContentByType = function() {
  switch (this.type) {
    case 'MARQUEE':
      if (!this.main_text_content) {
        throw new Error('MARQUEE content must have main_text_content');
      }
      break;
      
    case 'CAROUSEL':
    case 'ADVERTISEMENT':
    case 'OFFER':
    case 'PROMO':
      if (!this.primary_image_url) {
        throw new Error(`${this.type} content must have primary_image_url`);
      }
      break;
  }
};

dynamicContentSchema.methods.isCurrentlyActive = function() {
  return this.is_currently_active;
};

dynamicContentSchema.methods.activate = function() {
  this.is_active = true;
  return this.save();
};

dynamicContentSchema.methods.deactivate = function() {
  this.is_active = false;
  return this.save();
};

dynamicContentSchema.methods.getPublicFields = function() {
  return {
    _id: this._id,
    name: this.name,
    type: this.type,
    location_key: this.location_key,
    content_order: this.content_order,
    primary_image_url: this.primary_image_url,
    mobile_image_url: this.mobile_image_url,
    alt_text: this.alt_text,
    caption: this.caption,
    main_text_content: this.main_text_content,
    link_url: this.link_url,
    call_to_action_text: this.call_to_action_text,
    target_audience_tags: this.target_audience_tags,
    metadata: this.metadata
  };
};

// Static methods
dynamicContentSchema.statics.getActiveContent = function(locationKey, type, options = {}) {
  const now = new Date();
  
  const query = {
    location_key: locationKey,
    type: type,
    is_active: true,
    $or: [
      { display_start_date: null },
      { display_start_date: { $lte: now } }
    ],
    $or: [
      { display_end_date: null },
      { display_end_date: { $gt: now } }
    ]
  };

  // Add target audience filtering if provided
  if (options.targetAudience && options.targetAudience.length > 0) {
    query.$or = [
      { target_audience_tags: { $size: 0 } }, // No targeting
      { target_audience_tags: { $in: options.targetAudience } } // Matches audience
    ];
  }

  return this.find(query)
    .sort({ content_order: 1, createdAt: 1 })
    .select('-created_by -updated_by -createdAt -updatedAt -__v');
};

dynamicContentSchema.statics.getAvailableLocations = function() {
  const now = new Date();
  
  return this.aggregate([
    {
      $match: {
        is_active: true,
        $or: [
          { display_start_date: null },
          { display_start_date: { $lte: now } }
        ],
        $or: [
          { display_end_date: null },
          { display_end_date: { $gt: now } }
        ]
      }
    },
    {
      $group: {
        _id: {
          location_key: '$location_key',
          type: '$type'
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        location_key: '$_id.location_key',
        type: '$_id.type',
        count: 1
      }
    },
    {
      $sort: { location_key: 1, type: 1 }
    }
  ]);
};

dynamicContentSchema.statics.findByLocationAndType = function(locationKey, type, includeInactive = false) {
  const query = { location_key: locationKey, type: type };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .sort({ content_order: 1, createdAt: 1 });
};

dynamicContentSchema.statics.getContentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$is_active', true] }, 1, 0]
          }
        },
        inactive: {
          $sum: {
            $cond: [{ $eq: ['$is_active', false] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        total: 1,
        active: 1,
        inactive: 1
      }
    },
    {
      $sort: { type: 1 }
    }
  ]);
};

module.exports = mongoose.model('DynamicContent', dynamicContentSchema);
