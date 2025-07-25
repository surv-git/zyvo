/**
 * Email Template Model
 * Handles reusable email templates for admin dashboard
 */

const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  // Template identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Template content
  subject_template: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  html_template: {
    type: String,
    required: true
  },

  text_template: {
    type: String
  },

  // Template category and type
  category: {
    type: String,
    enum: [
      'PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART',
      'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY',
      'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM'
    ],
    required: true,
    default: 'CUSTOM'
  },

  // Template variables/placeholders
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
      default: 'string'
    },
    required: {
      type: Boolean,
      default: false
    },
    default_value: mongoose.Schema.Types.Mixed
  }],

  // Template design settings
  design: {
    layout: {
      type: String,
      enum: ['SINGLE_COLUMN', 'TWO_COLUMN', 'THREE_COLUMN', 'CUSTOM'],
      default: 'SINGLE_COLUMN'
    },
    theme: {
      primary_color: {
        type: String,
        default: '#007bff'
      },
      secondary_color: {
        type: String,
        default: '#6c757d'
      },
      background_color: {
        type: String,
        default: '#ffffff'
      },
      text_color: {
        type: String,
        default: '#333333'
      },
      font_family: {
        type: String,
        default: 'Arial, sans-serif'
      }
    },
    header: {
      include_logo: {
        type: Boolean,
        default: true
      },
      logo_url: String,
      header_text: String,
      header_color: String
    },
    footer: {
      include_unsubscribe: {
        type: Boolean,
        default: true
      },
      company_info: String,
      social_links: [{
        platform: String,
        url: String,
        icon_url: String
      }]
    }
  },

  // Template status and visibility
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  },

  visibility: {
    type: String,
    enum: ['PUBLIC', 'PRIVATE', 'SHARED'],
    default: 'PRIVATE'
  },

  // Usage tracking
  usage_stats: {
    total_uses: {
      type: Number,
      default: 0
    },
    last_used: Date,
    success_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avg_open_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avg_click_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Template validation
  validation: {
    is_valid: {
      type: Boolean,
      default: true
    },
    validation_errors: [{
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['ERROR', 'WARNING', 'INFO'],
        default: 'ERROR'
      }
    }],
    last_validated: Date
  },

  // Version control
  version: {
    type: Number,
    default: 1
  },
  
  parent_template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },

  // Template tags for organization
  tags: [String],

  // Creator and permissions
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  shared_with: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['VIEW', 'EDIT', 'ADMIN'],
      default: 'VIEW'
    }
  }],

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
emailTemplateSchema.index({ name: 1, status: 1 });
emailTemplateSchema.index({ category: 1, status: 1 });
emailTemplateSchema.index({ created_by: 1, created_at: -1 });
emailTemplateSchema.index({ tags: 1 });

// Virtual properties
emailTemplateSchema.virtual('variable_names').get(function() {
  return this.variables.map(v => v.name);
});

emailTemplateSchema.virtual('is_shared').get(function() {
  return this.visibility === 'SHARED' || this.shared_with.length > 0;
});

emailTemplateSchema.virtual('performance_rating').get(function() {
  const stats = this.usage_stats;
  if (stats.total_uses === 0) return 'NEW';
  
  const score = (stats.success_rate + stats.avg_open_rate + stats.avg_click_rate) / 3;
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'AVERAGE';
  return 'POOR';
});

// Static methods
emailTemplateSchema.statics.getActiveTemplates = function(category = null) {
  const query = { status: 'ACTIVE', visibility: { $in: ['PUBLIC', 'SHARED'] } };
  if (category) query.category = category;
  
  return this.find(query)
    .populate('created_by', 'name email')
    .sort({ 'usage_stats.total_uses': -1, 'created_at': -1 });
};

emailTemplateSchema.statics.getTemplatesByUser = function(userId) {
  return this.find({
    $or: [
      { created_by: userId },
      { 'shared_with.user_id': userId },
      { visibility: 'PUBLIC' }
    ],
    status: { $ne: 'ARCHIVED' }
  })
  .populate('created_by', 'name email')
  .sort({ created_at: -1 });
};

emailTemplateSchema.statics.getPopularTemplates = function(limit = 10) {
  return this.find({ 
    status: 'ACTIVE',
    'usage_stats.total_uses': { $gt: 0 }
  })
  .select('name description category usage_stats created_by')
  .populate('created_by', 'name')
  .sort({ 'usage_stats.total_uses': -1, 'usage_stats.avg_open_rate': -1 })
  .limit(limit);
};

// Instance methods
emailTemplateSchema.methods.validateTemplate = function() {
  const errors = [];
  
  // Check for required variables in templates
  const subjectVars = this.subject_template.match(/\{\{(\w+)\}\}/g) || [];
  const htmlVars = this.html_template.match(/\{\{(\w+)\}\}/g) || [];
  const allTemplateVars = [...new Set([...subjectVars, ...htmlVars])];
  
  const definedVars = this.variables.map(v => `{{${v.name}}}`);
  
  for (const templateVar of allTemplateVars) {
    if (!definedVars.includes(templateVar)) {
      errors.push({
        type: 'MISSING_VARIABLE',
        message: `Variable ${templateVar} used in template but not defined`,
        severity: 'ERROR'
      });
    }
  }
  
  // Check for undefined variables
  for (const variable of this.variables) {
    const varPattern = `{{${variable.name}}}`;
    if (!this.html_template.includes(varPattern) && !this.subject_template.includes(varPattern)) {
      errors.push({
        type: 'UNUSED_VARIABLE',
        message: `Variable {{${variable.name}}} is defined but not used`,
        severity: 'WARNING'
      });
    }
  }
  
  // Check HTML validity (basic)
  if (!this.html_template.includes('<html') && !this.html_template.includes('<body')) {
    errors.push({
      type: 'HTML_STRUCTURE',
      message: 'Template should include proper HTML structure',
      severity: 'WARNING'
    });
  }
  
  this.validation.validation_errors = errors;
  this.validation.is_valid = errors.filter(e => e.severity === 'ERROR').length === 0;
  this.validation.last_validated = new Date();
  
  return this.validation.is_valid;
};

emailTemplateSchema.methods.renderTemplate = function(variables = {}) {
  let renderedSubject = this.subject_template;
  let renderedHtml = this.html_template;
  let renderedText = this.text_template || '';
  
  // Replace variables in templates
  for (const variable of this.variables) {
    const placeholder = `{{${variable.name}}}`;
    const value = variables[variable.name] || variable.default_value || '';
    
    renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
    renderedHtml = renderedHtml.replace(new RegExp(placeholder, 'g'), value);
    if (renderedText) {
      renderedText = renderedText.replace(new RegExp(placeholder, 'g'), value);
    }
  }
  
  return {
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText
  };
};

emailTemplateSchema.methods.incrementUsage = function() {
  this.usage_stats.total_uses += 1;
  this.usage_stats.last_used = new Date();
  return this.save();
};

emailTemplateSchema.methods.updatePerformanceStats = function(openRate, clickRate, successRate) {
  const stats = this.usage_stats;
  const totalUses = stats.total_uses;
  
  if (totalUses > 0) {
    // Calculate running average
    stats.avg_open_rate = ((stats.avg_open_rate * (totalUses - 1)) + openRate) / totalUses;
    stats.avg_click_rate = ((stats.avg_click_rate * (totalUses - 1)) + clickRate) / totalUses;
    stats.success_rate = ((stats.success_rate * (totalUses - 1)) + successRate) / totalUses;
  } else {
    stats.avg_open_rate = openRate;
    stats.avg_click_rate = clickRate;
    stats.success_rate = successRate;
  }
  
  return this.save();
};

emailTemplateSchema.methods.createVersion = function() {
  const newTemplate = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: `${this.name} v${this.version + 1}`,
    version: this.version + 1,
    parent_template: this._id,
    usage_stats: {
      total_uses: 0,
      success_rate: 0,
      avg_open_rate: 0,
      avg_click_rate: 0
    },
    created_at: new Date(),
    updated_at: new Date()
  });
  
  return newTemplate.save();
};

emailTemplateSchema.methods.canUserAccess = function(userId, permission = 'VIEW') {
  // Template creator has full access
  if (this.created_by.toString() === userId.toString()) {
    return true;
  }
  
  // Public templates can be viewed by anyone
  if (this.visibility === 'PUBLIC' && permission === 'VIEW') {
    return true;
  }
  
  // Check shared permissions
  const sharedPermission = this.shared_with.find(s => s.user_id.toString() === userId.toString());
  if (sharedPermission) {
    const permissionHierarchy = { 'VIEW': 1, 'EDIT': 2, 'ADMIN': 3 };
    return permissionHierarchy[sharedPermission.permission] >= permissionHierarchy[permission];
  }
  
  return false;
};

emailTemplateSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Add computed fields
  obj.variable_names = this.variable_names;
  obj.is_shared = this.is_shared;
  obj.performance_rating = this.performance_rating;
  
  return obj;
};

// Pre-save middleware
emailTemplateSchema.pre('save', function(next) {
  if (this.isModified('html_template') || this.isModified('subject_template') || this.isModified('variables')) {
    this.validateTemplate();
  }
  
  // Auto-generate text template from HTML if not provided
  if (this.html_template && !this.text_template) {
    this.text_template = this.html_template.replace(/<[^>]*>/g, '').trim();
  }
  
  next();
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
