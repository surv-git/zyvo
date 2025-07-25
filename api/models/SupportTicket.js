/**
 * Support Ticket Model
 * Handles support tickets from users to be managed by admins
 */

const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Basic ticket information
  ticket_number: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // User information
  user: {
    user_id: {
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
    },
    phone: String
  },
  
  // Ticket categorization
  category: {
    type: String,
    enum: [
      'ORDER_ISSUE', 'PAYMENT_PROBLEM', 'PRODUCT_INQUIRY', 'SHIPPING_DELIVERY',
      'RETURNS_REFUNDS', 'ACCOUNT_ACCESS', 'TECHNICAL_SUPPORT', 'BILLING_INQUIRY',
      'PRODUCT_DEFECT', 'WEBSITE_BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'OTHER'
    ],
    required: true,
    default: 'OTHER'
  },
  
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
    index: true
  },
  
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'],
    default: 'OPEN',
    index: true
  },
  
  // Assignment and handling
  assigned_to: {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    name: String,
    email: String,
    assigned_at: Date
  },
  
  // Related order/product information
  related_order: {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    order_number: String
  },
  
  related_product: {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    product_name: String,
    sku: String
  },
  
  // Ticket timeline and responses
  messages: [{
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    sender: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ['user', 'admin', 'support'],
        required: true
      }
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000
    },
    message_type: {
      type: String,
      enum: ['MESSAGE', 'STATUS_UPDATE', 'ASSIGNMENT', 'INTERNAL_NOTE', 'RESOLUTION'],
      default: 'MESSAGE'
    },
    is_internal: {
      type: Boolean,
      default: false // Internal notes visible only to admins
    },
    attachments: [{
      filename: String,
      file_url: String,
      file_size: Number,
      mime_type: String,
      uploaded_at: {
        type: Date,
        default: Date.now
      }
    }],
    created_at: {
      type: Date,
      default: Date.now
    },
    edited_at: Date,
    is_edited: {
      type: Boolean,
      default: false
    }
  }],
  
  // Attachments from initial ticket
  attachments: [{
    filename: String,
    file_url: String,
    file_size: Number,
    mime_type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution information
  resolution: {
    resolved_by: {
      admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String
    },
    resolved_at: Date,
    resolution_note: String,
    resolution_type: {
      type: String,
      enum: ['SOLVED', 'WORKAROUND', 'DUPLICATE', 'INVALID', 'WONT_FIX', 'USER_ERROR']
    },
    user_satisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      rated_at: Date
    }
  },
  
  // SLA and timing
  sla: {
    response_due: Date,
    resolution_due: Date,
    first_response_at: Date,
    response_time_minutes: Number,
    resolution_time_minutes: Number,
    is_sla_breached: {
      type: Boolean,
      default: false
    }
  },
  
  // Tags and labels
  tags: [{
    type: String,
    trim: true
  }],
  
  // Internal tracking
  internal_notes: [{
    note_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    admin_name: String,
    note: {
      type: String,
      required: true,
      maxlength: 2000
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Escalation tracking
  escalation: {
    is_escalated: {
      type: Boolean,
      default: false
    },
    escalated_at: Date,
    escalated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalation_reason: String,
    escalation_level: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    }
  },
  
  // Customer communication preferences
  communication_preferences: {
    preferred_method: {
      type: String,
      enum: ['EMAIL', 'PHONE', 'SMS', 'IN_APP'],
      default: 'EMAIL'
    },
    notify_on_updates: {
      type: Boolean,
      default: true
    }
  },
  
  // Metrics and analytics
  metrics: {
    view_count: {
      type: Number,
      default: 0
    },
    last_viewed_by_user: Date,
    last_viewed_by_admin: Date,
    response_count: {
      type: Number,
      default: 0
    },
    reopened_count: {
      type: Number,
      default: 0
    }
  },
  
  // System tracking
  source: {
    type: String,
    enum: ['WEB_PORTAL', 'MOBILE_APP', 'EMAIL', 'PHONE', 'CHAT', 'ADMIN_CREATED'],
    default: 'WEB_PORTAL'
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
  last_activity_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  closed_at: Date
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for performance
supportTicketSchema.index({ 'user.user_id': 1, status: 1, created_at: -1 });
supportTicketSchema.index({ 'assigned_to.admin_id': 1, status: 1, created_at: -1 });
supportTicketSchema.index({ category: 1, priority: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1, created_at: -1 });
supportTicketSchema.index({ last_activity_at: -1 });
supportTicketSchema.index({ 'sla.response_due': 1, status: 1 });
supportTicketSchema.index({ 'sla.resolution_due': 1, status: 1 });

// Generate unique ticket number
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticket_number) {
    const currentYear = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      created_at: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1)
      }
    });
    this.ticket_number = `TKT-${currentYear}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Update last_activity_at on any change
  this.last_activity_at = new Date();
  
  next();
});

// Calculate SLA times when status changes
supportTicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    // Set first response time
    if (this.status === 'IN_PROGRESS' && !this.sla.first_response_at) {
      this.sla.first_response_at = now;
      this.sla.response_time_minutes = Math.floor((now - this.created_at) / (1000 * 60));
    }
    
    // Set resolution time
    if (['RESOLVED', 'CLOSED'].includes(this.status) && !this.resolution.resolved_at) {
      this.resolution.resolved_at = now;
      this.sla.resolution_time_minutes = Math.floor((now - this.created_at) / (1000 * 60));
    }
    
    // Set closed_at timestamp
    if (this.status === 'CLOSED') {
      this.closed_at = now;
    }
  }
  
  next();
});

// Virtual properties
supportTicketSchema.virtual('age_in_hours').get(function() {
  return Math.floor((new Date() - this.created_at) / (1000 * 60 * 60));
});

supportTicketSchema.virtual('is_overdue').get(function() {
  const now = new Date();
  return (this.sla.response_due && now > this.sla.response_due) ||
         (this.sla.resolution_due && now > this.sla.resolution_due);
});

supportTicketSchema.virtual('time_to_resolution').get(function() {
  if (this.resolution.resolved_at) {
    return Math.floor((this.resolution.resolved_at - this.created_at) / (1000 * 60 * 60));
  }
  return null;
});

supportTicketSchema.virtual('public_messages').get(function() {
  return this.messages.filter(msg => !msg.is_internal);
});

// Static methods
supportTicketSchema.statics.getTicketsByUser = function(userId, options = {}) {
  const query = { 'user.user_id': userId };
  
  if (options.status) query.status = options.status;
  if (options.category) query.category = options.category;
  
  return this.find(query)
    .populate('user.user_id', 'name email')
    .populate('assigned_to.admin_id', 'name email')
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

supportTicketSchema.statics.getTicketsByAdmin = function(adminId, options = {}) {
  const query = { 'assigned_to.admin_id': adminId };
  
  if (options.status) query.status = options.status;
  if (options.priority) query.priority = options.priority;
  
  return this.find(query)
    .populate('user.user_id', 'name email')
    .sort({ priority: -1, created_at: -1 })
    .limit(options.limit || 50);
};

supportTicketSchema.statics.getOverdueTickets = function() {
  const now = new Date();
  return this.find({
    status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
    $or: [
      { 'sla.response_due': { $lt: now } },
      { 'sla.resolution_due': { $lt: now } }
    ]
  }).sort({ priority: -1, created_at: 1 });
};

supportTicketSchema.statics.getTicketAnalytics = function(period = '30d') {
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  return this.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total_tickets: { $sum: 1 },
        open_tickets: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
        resolved_tickets: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
        avg_resolution_time: { $avg: '$sla.resolution_time_minutes' },
        high_priority_tickets: { $sum: { $cond: [{ $in: ['$priority', ['HIGH', 'URGENT']] }, 1, 0] } }
      }
    }
  ]);
};

// Instance methods
supportTicketSchema.methods.addMessage = function(senderData, messageText, messageType = 'MESSAGE', isInternal = false, attachments = []) {
  this.messages.push({
    sender: senderData,
    message: messageText,
    message_type: messageType,
    is_internal: isInternal,
    attachments: attachments
  });
  
  this.metrics.response_count += 1;
  return this.save();
};

supportTicketSchema.methods.assignTo = function(adminData) {
  this.assigned_to = {
    admin_id: adminData.admin_id,
    name: adminData.name,
    email: adminData.email,
    assigned_at: new Date()
  };
  
  // Add assignment message
  this.messages.push({
    sender: {
      user_id: adminData.admin_id,
      name: adminData.name,
      email: adminData.email,
      role: 'admin'
    },
    message: `Ticket assigned to ${adminData.name}`,
    message_type: 'ASSIGNMENT',
    is_internal: true
  });
  
  return this.save();
};

supportTicketSchema.methods.updateStatus = function(newStatus, adminData, note = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add status update message
  let message = `Status changed from ${oldStatus} to ${newStatus}`;
  if (note) {
    message += `. Note: ${note}`;
  }
  
  this.messages.push({
    sender: {
      user_id: adminData.user_id,
      name: adminData.name,
      email: adminData.email,
      role: adminData.role
    },
    message: message,
    message_type: 'STATUS_UPDATE',
    is_internal: false
  });
  
  return this.save();
};

supportTicketSchema.methods.escalate = function(escalationReason, adminData) {
  this.escalation.is_escalated = true;
  this.escalation.escalated_at = new Date();
  this.escalation.escalated_by = adminData.user_id;
  this.escalation.escalation_reason = escalationReason;
  this.escalation.escalation_level += 1;
  
  // Increase priority if not already urgent
  if (this.priority !== 'URGENT') {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const currentIndex = priorities.indexOf(this.priority);
    if (currentIndex < priorities.length - 1) {
      this.priority = priorities[currentIndex + 1];
    }
  }
  
  return this.save();
};

supportTicketSchema.methods.toPublicObject = function() {
  const obj = this.toObject();
  
  // Remove internal information for user view
  delete obj.internal_notes;
  obj.messages = obj.messages.filter(msg => !msg.is_internal);
  
  // Remove sensitive admin information
  if (obj.assigned_to && obj.assigned_to.admin_id) {
    obj.assigned_to = {
      name: obj.assigned_to.name,
      assigned_at: obj.assigned_to.assigned_at
    };
  }
  
  return obj;
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
