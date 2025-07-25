/**
 * Notification Model
 * Handles both user and admin notifications
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Notification Type
  type: {
    type: String,
    enum: {
      values: [
        'INFO', 'SUCCESS', 'WARNING', 'ERROR',
        'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
        'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
        'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT',
        'ADMIN_ALERT', 'USER_ACTIVITY', 'INVENTORY_ALERT'
      ],
      message: 'Invalid notification type'
    },
    required: [true, 'Notification type is required']
  },
  
  // Target Audience
  target_type: {
    type: String,
    enum: {
      values: ['USER', 'ADMIN', 'BOTH'],
      message: 'Target type must be USER, ADMIN, or BOTH'
    },
    required: [true, 'Target type is required']
  },
  
  // Recipients
  recipient: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // For broadcast notifications
    is_broadcast: {
      type: Boolean,
      default: false
    },
    // Role-based targeting for broadcast
    target_roles: [{
      type: String,
      enum: ['user', 'admin', 'superadmin']
    }]
  },
  
  // Status and Interaction
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      message: 'Invalid notification status'
    },
    default: 'PENDING'
  },
  
  priority: {
    type: String,
    enum: {
      values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      message: 'Invalid priority level'
    },
    default: 'MEDIUM'
  },
  
  // Read Status
  is_read: {
    type: Boolean,
    default: false
  },
  
  read_at: {
    type: Date,
    default: null
  },
  
  // Action and Navigation
  action: {
    type: {
      type: String,
      enum: ['NONE', 'NAVIGATE', 'EXTERNAL_LINK', 'MODAL', 'API_CALL'],
      default: 'NONE'
    },
    url: {
      type: String,
      default: null
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  // Metadata
  metadata: {
    // Related entities
    related_entity: {
      type: {
        type: String,
        enum: ['ORDER', 'PAYMENT', 'USER', 'PRODUCT', 'COUPON', 'REVIEW', 'CART'],
        default: null
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    },
    
    // Channel information
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
      default: 'IN_APP'
    },
    
    // Sender information
    sender: {
      type: {
        type: String,
        enum: ['SYSTEM', 'ADMIN', 'USER'],
        default: 'SYSTEM'
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      name: {
        type: String,
        default: 'System'
      }
    },
    
    // Additional data
    extra_data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  // Scheduling
  schedule: {
    send_at: {
      type: Date,
      default: Date.now
    },
    expires_at: {
      type: Date,
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Delivery tracking
  delivery: {
    attempts: {
      type: Number,
      default: 0
    },
    last_attempt_at: {
      type: Date,
      default: null
    },
    delivered_at: {
      type: Date,
      default: null
    },
    failure_reason: {
      type: String,
      default: null
    }
  },
  
  // Soft delete
  is_active: {
    type: Boolean,
    default: true
  },
  
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display title
NotificationSchema.virtual('display_title').get(function() {
  return this.title || `${this.type} Notification`;
});

// Virtual for time ago
NotificationSchema.virtual('time_ago').get(function() {
  const now = new Date();
  const diff = now - this.created_at;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Virtual for is expired
NotificationSchema.virtual('is_expired').get(function() {
  if (!this.schedule.expires_at) return false;
  return new Date() > this.schedule.expires_at;
});

// Indexes for performance
NotificationSchema.index({ 'recipient.user_id': 1, created_at: -1 });
NotificationSchema.index({ 'recipient.admin_id': 1, created_at: -1 });
NotificationSchema.index({ target_type: 1, created_at: -1 });
NotificationSchema.index({ type: 1, created_at: -1 });
NotificationSchema.index({ status: 1, created_at: -1 });
NotificationSchema.index({ priority: 1, created_at: -1 });
NotificationSchema.index({ is_read: 1, created_at: -1 });
NotificationSchema.index({ 'recipient.is_broadcast': 1 });
NotificationSchema.index({ 'schedule.send_at': 1 });
NotificationSchema.index({ 'schedule.expires_at': 1 });
NotificationSchema.index({ is_active: 1 });

// Compound indexes
NotificationSchema.index({ 
  'recipient.user_id': 1, 
  is_read: 1, 
  is_active: 1, 
  created_at: -1 
});
NotificationSchema.index({ 
  target_type: 1, 
  status: 1, 
  created_at: -1 
});

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  // Set read_at when marking as read
  if (this.isModified('is_read') && this.is_read && !this.read_at) {
    this.read_at = new Date();
  }
  
  // Set delivered_at when status changes to DELIVERED
  if (this.isModified('status') && this.status === 'DELIVERED' && !this.delivery.delivered_at) {
    this.delivery.delivered_at = new Date();
  }
  
  // Update last_attempt_at when attempting delivery
  if (this.isModified('delivery.attempts')) {
    this.delivery.last_attempt_at = new Date();
  }
  
  // Set deleted_at when marking as inactive
  if (this.isModified('is_active') && !this.is_active && !this.deleted_at) {
    this.deleted_at = new Date();
  }
  
  next();
});

// Static methods

// Get notifications for a user
NotificationSchema.statics.getForUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'recipient.user_id': userId },
      { 
        'recipient.is_broadcast': true,
        'recipient.target_roles': 'user'
      }
    ],
    is_active: true
  };
  
  if (options.unread_only) {
    query.is_read = false;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

// Get notifications for an admin
NotificationSchema.statics.getForAdmin = function(adminId, options = {}) {
  const query = {
    $or: [
      { 'recipient.admin_id': adminId },
      { 
        'recipient.is_broadcast': true,
        'recipient.target_roles': { $in: ['admin', 'superadmin'] }
      }
    ],
    is_active: true
  };
  
  if (options.unread_only) {
    query.is_read = false;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

// Mark as read
NotificationSchema.statics.markAsRead = function(notificationIds, userId = null) {
  const query = { _id: { $in: notificationIds } };
  
  if (userId) {
    query.$or = [
      { 'recipient.user_id': userId },
      { 'recipient.admin_id': userId }
    ];
  }
  
  return this.updateMany(query, {
    is_read: true,
    read_at: new Date()
  });
};

// Create broadcast notification
NotificationSchema.statics.createBroadcast = function(data) {
  return this.create({
    ...data,
    recipient: {
      is_broadcast: true,
      target_roles: data.target_roles || ['user']
    }
  });
};

// Get unread count
NotificationSchema.statics.getUnreadCount = function(userId, isAdmin = false) {
  const query = {
    is_read: false,
    is_active: true
  };
  
  if (isAdmin) {
    query.$or = [
      { 'recipient.admin_id': userId },
      { 
        'recipient.is_broadcast': true,
        'recipient.target_roles': { $in: ['admin', 'superadmin'] }
      }
    ];
  } else {
    query.$or = [
      { 'recipient.user_id': userId },
      { 
        'recipient.is_broadcast': true,
        'recipient.target_roles': 'user'
      }
    ];
  }
  
  return this.countDocuments(query);
};

// Instance methods

// Mark as read
NotificationSchema.methods.markAsRead = function() {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

// Check if user can access this notification
NotificationSchema.methods.canUserAccess = function(userId, userRole = 'user') {
  // Direct recipient
  if (this.recipient.user_id && this.recipient.user_id.toString() === userId.toString()) {
    return true;
  }
  
  if (this.recipient.admin_id && this.recipient.admin_id.toString() === userId.toString()) {
    return true;
  }
  
  // Broadcast notification
  if (this.recipient.is_broadcast && this.recipient.target_roles.includes(userRole)) {
    return true;
  }
  
  return false;
};

// Convert to safe object (for API responses)
NotificationSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove sensitive information
  delete obj.__v;
  
  return {
    id: obj._id,
    title: obj.title,
    message: obj.message,
    type: obj.type,
    target_type: obj.target_type,
    status: obj.status,
    priority: obj.priority,
    is_read: obj.is_read,
    read_at: obj.read_at,
    action: obj.action,
    metadata: {
      ...obj.metadata,
      // Remove sensitive sender info for non-admin users
      sender: {
        type: obj.metadata.sender.type,
        name: obj.metadata.sender.name
      }
    },
    schedule: {
      send_at: obj.schedule.send_at,
      expires_at: obj.schedule.expires_at
    },
    display_title: obj.display_title,
    time_ago: obj.time_ago,
    is_expired: obj.is_expired,
    created_at: obj.created_at,
    updated_at: obj.updated_at
  };
};

module.exports = mongoose.model('Notification', NotificationSchema);
