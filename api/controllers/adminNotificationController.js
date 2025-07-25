/**
 * Admin Notification Controller
 * Handles admin notification operations including CRUD and broadcast
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Get all notifications with advanced filtering and pagination
 * @route GET /api/v1/admin/notifications
 * @access Private (Admin only)
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query object for filtering
    let query = {};
    
    // Filter by target type
    if (req.query.target_type) {
      query.target_type = req.query.target_type.toUpperCase();
    }
    
    // Filter by notification type
    if (req.query.type) {
      query.type = req.query.type.toUpperCase();
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    }
    
    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority.toUpperCase();
    }
    
    // Filter by read status
    if (req.query.is_read !== undefined) {
      query.is_read = req.query.is_read === 'true';
    }
    
    // Filter by active status
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    // Filter by recipient
    if (req.query.user_id) {
      query['recipient.user_id'] = req.query.user_id;
    }
    
    // Filter by broadcast
    if (req.query.is_broadcast !== undefined) {
      query['recipient.is_broadcast'] = req.query.is_broadcast === 'true';
    }
    
    // Search in title or message
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { message: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Date range filtering
    if (req.query.start_date || req.query.end_date) {
      query.created_at = {};
      if (req.query.start_date) {
        query.created_at.$gte = new Date(req.query.start_date);
      }
      if (req.query.end_date) {
        query.created_at.$lte = new Date(req.query.end_date);
      }
    }

    // Sort options
    let sortOption = {};
    if (req.query.sort_by) {
      const sortField = req.query.sort_by;
      const sortOrder = req.query.sort_order === 'desc' ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      sortOption = { created_at: -1 }; // Default sort by newest first
    }

    // Execute query with pagination
    const notifications = await Notification.find(query)
      .populate('recipient.user_id', 'name email phone role')
      .populate('recipient.admin_id', 'name email role')
      .populate('metadata.sender.id', 'name email role')
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get summary statistics
    const stats = await Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_notifications: { $sum: 1 },
          unread_count: {
            $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
          },
          pending_count: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          sent_count: {
            $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] }
          },
          urgent_count: {
            $sum: { $cond: [{ $eq: ['$priority', 'URGENT'] }, 1, 0] }
          },
          broadcast_count: {
            $sum: { $cond: [{ $eq: ['$recipient.is_broadcast', true] }, 1, 0] }
          },
          user_notifications: {
            $sum: { $cond: [{ $eq: ['$target_type', 'USER'] }, 1, 0] }
          },
          admin_notifications: {
            $sum: { $cond: [{ $eq: ['$target_type', 'ADMIN'] }, 1, 0] }
          }
        }
      }
    ]);

    const response = {
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: notifications,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        summary: stats.length > 0 ? stats[0] : {
          total_notifications: 0,
          unread_count: 0,
          pending_count: 0,
          sent_count: 0,
          urgent_count: 0,
          broadcast_count: 0,
          user_notifications: 0,
          admin_notifications: 0
        },
        filters_applied: {
          target_type: req.query.target_type || null,
          type: req.query.type || null,
          status: req.query.status || null,
          priority: req.query.priority || null,
          is_read: req.query.is_read || null,
          is_active: req.query.is_active || null,
          user_id: req.query.user_id || null,
          is_broadcast: req.query.is_broadcast || null,
          search: req.query.search || null,
          date_range: {
            start: req.query.start_date || null,
            end: req.query.end_date || null
          }
        }
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Get notification by ID
 * @route GET /api/v1/admin/notifications/:id
 * @access Private (Admin only)
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate('recipient.user_id', 'name email phone role created_at')
      .populate('recipient.admin_id', 'name email role created_at')
      .populate('metadata.sender.id', 'name email role')
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Get related notifications count
    const relatedCount = await Notification.countDocuments({
      'metadata.related_entity.type': notification.metadata?.related_entity?.type,
      'metadata.related_entity.id': notification.metadata?.related_entity?.id,
      _id: { $ne: id }
    });

    const response = {
      success: true,
      message: 'Notification retrieved successfully',
      data: {
        notification: notification,
        related_notifications_count: relatedCount
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get notification by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Create new notification
 * @route POST /api/v1/admin/notifications
 * @access Private (Admin only)
 */
exports.createNotification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    const notificationData = {
      ...req.body,
      metadata: {
        ...req.body.metadata,
        sender: {
          type: 'ADMIN',
          id: req.user.id,
          name: req.user.name || req.user.email
        }
      }
    };

    // Handle broadcast notifications
    if (req.body.recipient?.is_broadcast) {
      notificationData.recipient = {
        is_broadcast: true,
        target_roles: req.body.recipient.target_roles || ['user']
      };
    }

    const notification = new Notification(notificationData);
    await notification.save();

    // Populate the response
    await notification.populate([
      { path: 'recipient.user_id', select: 'name email phone role' },
      { path: 'recipient.admin_id', select: 'name email role' }
    ]);

    // Create audit entry
    const auditEntry = {
      action: 'notification_created',
      admin_id: req.user.id,
      admin_email: req.user.email,
      notification_id: notification._id,
      notification_type: notification.type,
      target_type: notification.target_type,
      is_broadcast: notification.recipient.is_broadcast,
      timestamp: new Date()
    };

    console.log('Notification created by admin:', auditEntry);

    const response = {
      success: true,
      message: 'Notification created successfully',
      data: {
        notification: notification.toObject()
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Create notification error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        })),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Update notification
 * @route PUT /api/v1/admin/notifications/:id
 * @access Private (Admin only)
 */
exports.updateNotification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.created_at;
    delete updateData.delivery;

    // Find the notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Store original values for audit
    const originalValues = {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      status: notification.status,
      priority: notification.priority,
      is_active: notification.is_active
    };

    // Update the notification
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updated_at: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: 'recipient.user_id', select: 'name email phone role' },
      { path: 'recipient.admin_id', select: 'name email role' }
    ]);

    // Create audit entry
    const auditEntry = {
      action: 'notification_updated',
      admin_id: req.user.id,
      admin_email: req.user.email,
      notification_id: id,
      changes: {},
      timestamp: new Date()
    };

    // Track what changed
    Object.keys(originalValues).forEach(key => {
      if (originalValues[key] !== updatedNotification[key]) {
        auditEntry.changes[key] = { 
          from: originalValues[key], 
          to: updatedNotification[key] 
        };
      }
    });

    console.log('Notification updated by admin:', auditEntry);

    const response = {
      success: true,
      message: 'Notification updated successfully',
      data: {
        notification: updatedNotification.toObject(),
        changes_made: auditEntry.changes
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Update notification error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        })),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Delete notification (soft delete)
 * @route DELETE /api/v1/admin/notifications/:id
 * @access Private (Admin only)
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    if (permanent === 'true') {
      // Permanent deletion
      await Notification.findByIdAndDelete(id);
    } else {
      // Soft delete
      notification.is_active = false;
      notification.deleted_at = new Date();
      await notification.save();
    }

    // Create audit entry
    const auditEntry = {
      action: permanent === 'true' ? 'notification_permanently_deleted' : 'notification_soft_deleted',
      admin_id: req.user.id,
      admin_email: req.user.email,
      notification_id: id,
      notification_details: {
        title: notification.title,
        type: notification.type,
        target_type: notification.target_type
      },
      timestamp: new Date()
    };

    console.log('Notification deleted by admin:', auditEntry);

    const response = {
      success: true,
      message: `Notification ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} successfully`,
      data: {
        deleted_notification: {
          id: notification._id,
          title: notification.title,
          type: notification.type,
          target_type: notification.target_type
        },
        deletion_type: permanent === 'true' ? 'permanent' : 'soft'
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delete notification error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Create broadcast notification
 * @route POST /api/v1/admin/notifications/broadcast
 * @access Private (Admin only)
 */
exports.createBroadcastNotification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    const broadcastData = {
      ...req.body,
      target_type: req.body.target_type || 'USER',
      recipient: {
        is_broadcast: true,
        target_roles: req.body.target_roles || ['user']
      },
      metadata: {
        ...req.body.metadata,
        sender: {
          type: 'ADMIN',
          id: req.user.id,
          name: req.user.name || req.user.email
        }
      }
    };

    const notification = await Notification.createBroadcast(broadcastData);

    // Get estimated recipient count
    const roleQuery = {};
    if (req.body.target_roles) {
      roleQuery.role = { $in: req.body.target_roles };
    }
    
    const estimatedRecipients = await User.countDocuments(roleQuery);

    // Create audit entry
    const auditEntry = {
      action: 'broadcast_notification_created',
      admin_id: req.user.id,
      admin_email: req.user.email,
      notification_id: notification._id,
      target_roles: req.body.target_roles,
      estimated_recipients: estimatedRecipients,
      timestamp: new Date()
    };

    console.log('Broadcast notification created by admin:', auditEntry);

    const response = {
      success: true,
      message: 'Broadcast notification created successfully',
      data: {
        notification: notification.toObject(),
        estimated_recipients: estimatedRecipients
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Create broadcast notification error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        })),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating broadcast notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Get notifications analytics
 * @route GET /api/v1/admin/notifications/analytics
 * @access Private (Admin only)
 */
exports.getNotificationsAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get comprehensive analytics
    const analytics = await Notification.aggregate([
      {
        $facet: {
          // Overall statistics
          overall_stats: [
            {
              $group: {
                _id: null,
                total_notifications: { $sum: 1 },
                active_notifications: {
                  $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                unread_notifications: {
                  $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                },
                urgent_notifications: {
                  $sum: { $cond: [{ $eq: ['$priority', 'URGENT'] }, 1, 0] }
                },
                broadcast_notifications: {
                  $sum: { $cond: [{ $eq: ['$recipient.is_broadcast', true] }, 1, 0] }
                }
              }
            }
          ],
          
          // Type distribution
          type_distribution: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                unread_count: {
                  $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Target type distribution
          target_distribution: [
            {
              $group: {
                _id: '$target_type',
                count: { $sum: 1 },
                unread_count: {
                  $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                }
              }
            }
          ],
          
          // Recent activity
          recent_activity: [
            { $match: { created_at: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
          ],
          
          // Priority distribution
          priority_distribution: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
                unread_count: {
                  $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = analytics[0];

    const response = {
      success: true,
      message: 'Notification analytics retrieved successfully',
      data: {
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overall_statistics: result.overall_stats[0] || {
          total_notifications: 0,
          active_notifications: 0,
          unread_notifications: 0,
          urgent_notifications: 0,
          broadcast_notifications: 0
        },
        type_distribution: result.type_distribution,
        target_distribution: result.target_distribution,
        priority_distribution: result.priority_distribution,
        recent_activity: result.recent_activity
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get notifications analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};
