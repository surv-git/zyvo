/**
 * User Notification Controller
 * Handles user-facing notification operations
 */

const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * Get user notifications with filtering and pagination
 * @route GET /api/v1/notifications
 * @access Private (User)
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {
      $or: [
        { 'recipient.user_id': userId },
        { 
          'recipient.is_broadcast': true,
          'recipient.target_roles': 'user'
        }
      ],
      is_active: true
    };

    // Apply filters
    if (req.query.unread_only === 'true') {
      query.is_read = false;
    }

    if (req.query.type) {
      query.type = req.query.type.toUpperCase();
    }

    if (req.query.priority) {
      query.priority = req.query.priority.toUpperCase();
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

    // Execute query
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId, false);

    // Convert to safe objects
    const safeNotifications = notifications.map(notification => {
      const notificationObj = new Notification(notification);
      return notificationObj.toSafeObject();
    });

    const response = {
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: safeNotifications,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        summary: {
          total_notifications: totalCount,
          unread_count: unreadCount,
          page_unread_count: safeNotifications.filter(n => !n.is_read).length
        },
        filters_applied: {
          unread_only: req.query.unread_only === 'true',
          type: req.query.type || null,
          priority: req.query.priority || null,
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
    console.error('Get user notifications error:', error);
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
 * @route GET /api/v1/notifications/:id
 * @access Private (User)
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Check access permission
    if (!notification.canUserAccess(userId, 'user')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Auto-mark as read when viewed
    if (!notification.is_read) {
      await notification.markAsRead();
    }

    const response = {
      success: true,
      message: 'Notification retrieved successfully',
      data: {
        notification: notification.toSafeObject()
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
 * Mark notification as read
 * @route PUT /api/v1/notifications/:id/read
 * @access Private (User)
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Check access permission
    if (!notification.canUserAccess(userId, 'user')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Mark as read
    await notification.markAsRead();

    const response = {
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: notification.toSafeObject()
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Mark notification as read error:', error);
    
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
      message: 'Internal server error while marking notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Mark multiple notifications as read
 * @route PUT /api/v1/notifications/mark-read
 * @access Private (User)
 */
exports.markMultipleAsRead = async (req, res) => {
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

    const { notification_ids } = req.body;
    const userId = req.user.id;

    // Mark notifications as read for this user
    const result = await Notification.markAsRead(notification_ids, userId);

    const response = {
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modified_count: result.modifiedCount,
        matched_count: result.matchedCount
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Mark multiple notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Mark all notifications as read for user
 * @route PUT /api/v1/notifications/mark-all-read
 * @access Private (User)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mark all user notifications as read
    const result = await Notification.updateMany(
      {
        $or: [
          { 'recipient.user_id': userId },
          { 
            'recipient.is_broadcast': true,
            'recipient.target_roles': 'user'
          }
        ],
        is_read: false,
        is_active: true
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    const response = {
      success: true,
      message: `All notifications marked as read`,
      data: {
        modified_count: result.modifiedCount
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Get notification counts and summary
 * @route GET /api/v1/notifications/summary
 * @access Private (User)
 */
exports.getNotificationSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get comprehensive summary
    const summary = await Notification.aggregate([
      {
        $match: {
          $or: [
            { 'recipient.user_id': new mongoose.Types.ObjectId(userId) },
            { 
              'recipient.is_broadcast': true,
              'recipient.target_roles': 'user'
            }
          ],
          is_active: true
        }
      },
      {
        $group: {
          _id: null,
          total_notifications: { $sum: 1 },
          unread_count: {
            $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
          },
          urgent_count: {
            $sum: { $cond: [{ $eq: ['$priority', 'URGENT'] }, 1, 0] }
          },
          high_priority_count: {
            $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] }
          },
          recent_count: {
            $sum: { 
              $cond: [
                { $gte: ['$created_at', new Date(Date.now() - 24 * 60 * 60 * 1000)] }, 
                1, 
                0
              ] 
            }
          }
        }
      }
    ]);

    // Get type distribution
    const typeDistribution = await Notification.aggregate([
      {
        $match: {
          $or: [
            { 'recipient.user_id': new mongoose.Types.ObjectId(userId) },
            { 
              'recipient.is_broadcast': true,
              'recipient.target_roles': 'user'
            }
          ],
          is_active: true
        }
      },
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
    ]);

    const summaryData = summary.length > 0 ? summary[0] : {
      total_notifications: 0,
      unread_count: 0,
      urgent_count: 0,
      high_priority_count: 0,
      recent_count: 0
    };

    const response = {
      success: true,
      message: 'Notification summary retrieved successfully',
      data: {
        summary: summaryData,
        type_distribution: typeDistribution,
        has_urgent: summaryData.urgent_count > 0,
        has_unread: summaryData.unread_count > 0
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get notification summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving notification summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};
