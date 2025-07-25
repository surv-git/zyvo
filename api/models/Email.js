/**
 * Email Model
 * Handles email sending, templates, tracking, and analytics for admin dashboard
 */

const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  // Basic email information
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  content: {
    html: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: false // Auto-generated from HTML if not provided
    }
  },

  // Sender information
  sender: {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },

  // Recipients
  recipients: {
    type: {
      type: String,
      enum: ['INDIVIDUAL', 'BROADCAST', 'SEGMENT'],
      required: true,
      default: 'INDIVIDUAL'
    },
    
    // For individual emails
    to: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: {
        type: String,
        required: true
      },
      name: String,
      status: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'],
        default: 'PENDING'
      },
      sent_at: Date,
      delivered_at: Date,
      opened_at: Date,
      clicked_at: Date,
      bounce_reason: String,
      failure_reason: String
    }],

    // For broadcast emails
    broadcast_criteria: {
      user_roles: [{
        type: String,
        enum: ['user', 'admin', 'superadmin']
      }],
      user_status: [{
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending']
      }],
      registration_date_range: {
        start: Date,
        end: Date
      },
      last_login_range: {
        start: Date,
        end: Date
      },
      custom_filters: {
        has_orders: Boolean,
        order_count_min: Number,
        order_count_max: Number,
        total_spent_min: Number,
        total_spent_max: Number,
        location: String,
        tags: [String]
      }
    },

    // Estimated and actual recipient counts
    estimated_count: {
      type: Number,
      default: 0
    },
    actual_count: {
      type: Number,
      default: 0
    }
  },

  // Email template and design
  template: {
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    },
    template_name: String,
    variables: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },

  // Email type and category
  email_type: {
    type: String,
    enum: [
      'PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART',
      'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY',
      'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM'
    ],
    required: true,
    default: 'CUSTOM'
  },

  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },

  // Scheduling
  scheduling: {
    send_type: {
      type: String,
      enum: ['IMMEDIATE', 'SCHEDULED', 'RECURRING'],
      default: 'IMMEDIATE'
    },
    scheduled_at: Date,
    timezone: {
      type: String,
      default: 'UTC'
    },
    recurring: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']
      },
      interval: {
        type: Number,
        default: 1
      },
      days_of_week: [Number], // 0-6, Sunday is 0
      day_of_month: Number,   // 1-31
      end_date: Date,
      max_occurrences: Number
    }
  },

  // Email status and tracking
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED', 'PAUSED'],
    default: 'DRAFT',
    index: true
  },

  // Delivery statistics
  stats: {
    total_recipients: {
      type: Number,
      default: 0
    },
    sent_count: {
      type: Number,
      default: 0
    },
    delivered_count: {
      type: Number,
      default: 0
    },
    opened_count: {
      type: Number,
      default: 0
    },
    clicked_count: {
      type: Number,
      default: 0
    },
    bounced_count: {
      type: Number,
      default: 0
    },
    failed_count: {
      type: Number,
      default: 0
    },
    unsubscribed_count: {
      type: Number,
      default: 0
    },
    
    // Rates (calculated)
    delivery_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    open_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    click_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    bounce_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Email service provider details
  provider: {
    service: {
      type: String,
      enum: ['SENDGRID', 'MAILGUN', 'AWS_SES', 'SMTP', 'POSTMARK'],
      default: 'SMTP'
    },
    message_id: String,
    provider_response: mongoose.Schema.Types.Mixed
  },

  // A/B Testing
  ab_test: {
    enabled: {
      type: Boolean,
      default: false
    },
    variant: {
      type: String,
      enum: ['A', 'B']
    },
    test_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },

  // Personalization and segmentation
  personalization: {
    enabled: {
      type: Boolean,
      default: false
    },
    merge_tags: {
      type: Map,
      of: String
    },
    dynamic_content: [{
      condition: String,
      content: String
    }]
  },

  // Email settings
  settings: {
    track_opens: {
      type: Boolean,
      default: true
    },
    track_clicks: {
      type: Boolean,
      default: true
    },
    allow_unsubscribe: {
      type: Boolean,
      default: true
    },
    reply_to: String,
    custom_headers: {
      type: Map,
      of: String
    }
  },

  // Attachments
  attachments: [{
    filename: String,
    path: String,
    size: Number,
    mime_type: String,
    is_inline: {
      type: Boolean,
      default: false
    }
  }],

  // Campaign association
  campaign: {
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCampaign'
    },
    campaign_name: String
  },

  // Error handling
  errors: [{
    error_type: {
      type: String,
      enum: ['VALIDATION', 'SENDING', 'DELIVERY', 'TEMPLATE', 'PROVIDER']
    },
    error_message: String,
    error_code: String,
    occurred_at: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],

  // Audit trail
  audit: {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved_at: Date
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  sent_at: Date,
  completed_at: Date
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for performance
emailSchema.index({ 'sender.admin_id': 1, created_at: -1 });
emailSchema.index({ status: 1, created_at: -1 });
emailSchema.index({ email_type: 1, created_at: -1 });
emailSchema.index({ 'scheduling.scheduled_at': 1, status: 1 });
emailSchema.index({ 'recipients.type': 1, status: 1 });
emailSchema.index({ 'campaign.campaign_id': 1 });

// Virtual properties
emailSchema.virtual('display_name').get(function() {
  return `${this.subject} - ${this.email_type}`;
});

emailSchema.virtual('is_scheduled').get(function() {
  return this.scheduling.send_type === 'SCHEDULED' && this.scheduling.scheduled_at > new Date();
});

emailSchema.virtual('is_recurring').get(function() {
  return this.scheduling.send_type === 'RECURRING' && this.scheduling.recurring.enabled;
});

emailSchema.virtual('performance_summary').get(function() {
  const stats = this.stats;
  return {
    total_sent: stats.sent_count,
    delivery_rate: stats.delivery_rate,
    open_rate: stats.open_rate,
    click_rate: stats.click_rate,
    success_score: (stats.delivery_rate + stats.open_rate + stats.click_rate) / 3
  };
});

// Static methods
emailSchema.statics.getEmailsByAdmin = function(adminId, options = {}) {
  const query = { 'sender.admin_id': adminId };
  
  if (options.status) query.status = options.status;
  if (options.email_type) query.email_type = options.email_type;
  if (options.start_date && options.end_date) {
    query.created_at = {
      $gte: new Date(options.start_date),
      $lte: new Date(options.end_date)
    };
  }

  return this.find(query)
    .populate('sender.admin_id', 'name email')
    .populate('template.template_id', 'name')
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

emailSchema.statics.getEmailAnalytics = function(period = '30d') {
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  return this.aggregate([
    {
      $match: {
        created_at: { $gte: startDate },
        status: { $nin: ['DRAFT', 'CANCELLED'] }
      }
    },
    {
      $group: {
        _id: null,
        total_emails: { $sum: 1 },
        total_sent: { $sum: '$stats.sent_count' },
        total_delivered: { $sum: '$stats.delivered_count' },
        total_opened: { $sum: '$stats.opened_count' },
        total_clicked: { $sum: '$stats.clicked_count' },
        total_bounced: { $sum: '$stats.bounced_count' },
        avg_delivery_rate: { $avg: '$stats.delivery_rate' },
        avg_open_rate: { $avg: '$stats.open_rate' },
        avg_click_rate: { $avg: '$stats.click_rate' }
      }
    }
  ]);
};

emailSchema.statics.getTopPerformingEmails = function(limit = 10) {
  return this.find({
    status: 'SENT',
    'stats.sent_count': { $gt: 0 }
  })
  .select('subject email_type stats created_at sender')
  .populate('sender.admin_id', 'name')
  .sort({ 'stats.open_rate': -1, 'stats.click_rate': -1 })
  .limit(limit);
};

// Instance methods
emailSchema.methods.calculateStats = function() {
  const recipients = this.recipients.to || [];
  const total = recipients.length;
  
  if (total === 0) return;

  const sent = recipients.filter(r => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(r.status)).length;
  const delivered = recipients.filter(r => ['DELIVERED', 'OPENED', 'CLICKED'].includes(r.status)).length;
  const opened = recipients.filter(r => ['OPENED', 'CLICKED'].includes(r.status)).length;
  const clicked = recipients.filter(r => r.status === 'CLICKED').length;
  const bounced = recipients.filter(r => r.status === 'BOUNCED').length;
  const failed = recipients.filter(r => r.status === 'FAILED').length;

  this.stats.total_recipients = total;
  this.stats.sent_count = sent;
  this.stats.delivered_count = delivered;
  this.stats.opened_count = opened;
  this.stats.clicked_count = clicked;
  this.stats.bounced_count = bounced;
  this.stats.failed_count = failed;

  // Calculate rates
  this.stats.delivery_rate = sent > 0 ? (delivered / sent) * 100 : 0;
  this.stats.open_rate = delivered > 0 ? (opened / delivered) * 100 : 0;
  this.stats.click_rate = opened > 0 ? (clicked / opened) * 100 : 0;
  this.stats.bounce_rate = sent > 0 ? (bounced / sent) * 100 : 0;
};

emailSchema.methods.updateRecipientStatus = function(email, status, additionalData = {}) {
  const recipient = this.recipients.to.find(r => r.email === email);
  if (recipient) {
    recipient.status = status;
    
    // Update timestamp based on status
    const timestamp = new Date();
    switch (status) {
      case 'SENT':
        recipient.sent_at = timestamp;
        break;
      case 'DELIVERED':
        recipient.delivered_at = timestamp;
        break;
      case 'OPENED':
        recipient.opened_at = timestamp;
        break;
      case 'CLICKED':
        recipient.clicked_at = timestamp;
        break;
      case 'BOUNCED':
        recipient.bounce_reason = additionalData.reason;
        break;
      case 'FAILED':
        recipient.failure_reason = additionalData.reason;
        break;
    }
    
    // Recalculate stats
    this.calculateStats();
    return true;
  }
  return false;
};

emailSchema.methods.canEdit = function() {
  return ['DRAFT', 'SCHEDULED'].includes(this.status);
};

emailSchema.methods.canSend = function() {
  return ['DRAFT', 'SCHEDULED'].includes(this.status) && 
         this.recipients.to.length > 0 &&
         this.subject.trim() !== '' &&
         this.content.html.trim() !== '';
};

emailSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove sensitive information
  delete obj.provider.provider_response;
  
  // Add computed fields
  obj.display_name = this.display_name;
  obj.is_scheduled = this.is_scheduled;
  obj.is_recurring = this.is_recurring;
  obj.performance_summary = this.performance_summary;
  obj.can_edit = this.canEdit();
  obj.can_send = this.canSend();
  
  return obj;
};

// Pre-save middleware
emailSchema.pre('save', function(next) {
  if (this.isModified('recipients.to')) {
    this.calculateStats();
  }
  
  // Auto-generate text content from HTML if not provided
  if (this.content.html && !this.content.text) {
    // Simple HTML to text conversion (you might want to use a proper library)
    this.content.text = this.content.html.replace(/<[^>]*>/g, '').trim();
  }
  
  next();
});

module.exports = mongoose.model('Email', emailSchema);
