/**
 * User Support Ticket Controller
 * Handles user-side support ticket operations for e-commerce portal
 */

const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

/**
 * Create a new support ticket
 * @route POST /api/v1/user/support-tickets
 * @access Private (authenticated users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createSupportTicket = async (req, res, next) => {
  try {
    const {
      subject,
      description,
      category,
      priority,
      related_order,
      related_product,
      attachments = [],
      communication_preferences = {}
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    // Get user information
    const user = await User.findById(req.user.id).select('name email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set SLA due dates based on priority
    const now = new Date();
    const sla = {
      response_due: new Date(now.getTime() + (priority === 'URGENT' ? 1 : priority === 'HIGH' ? 4 : 24) * 60 * 60 * 1000),
      resolution_due: new Date(now.getTime() + (priority === 'URGENT' ? 4 : priority === 'HIGH' ? 24 : 72) * 60 * 60 * 1000)
    };

    // Create ticket data
    const ticketData = {
      subject: subject.trim(),
      description: description.trim(),
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      sla,
      source: 'WEB_PORTAL',
      communication_preferences: {
        preferred_method: communication_preferences.preferred_method || 'EMAIL',
        notify_on_updates: communication_preferences.notify_on_updates !== false
      }
    };

    // Add related order information if provided
    if (related_order) {
      ticketData.related_order = {
        order_id: related_order.order_id,
        order_number: related_order.order_number
      };
    }

    // Add related product information if provided
    if (related_product) {
      ticketData.related_product = {
        product_id: related_product.product_id,
        product_name: related_product.product_name,
        sku: related_product.sku
      };
    }

    // Add attachments if provided
    if (attachments.length > 0) {
      ticketData.attachments = attachments.map(attachment => ({
        filename: attachment.filename,
        file_url: attachment.file_url,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type
      }));
    }

    // Create the support ticket
    const supportTicket = new SupportTicket(ticketData);
    await supportTicket.save();

    // Add initial message from user
    await supportTicket.addMessage(
      {
        user_id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      },
      description,
      'MESSAGE',
      false,
      attachments
    );

    // TODO: Send notification to support team
    // TODO: Send confirmation email to user

    const responseTicket = supportTicket.toPublicObject();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: responseTicket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    next(error);
  }
};

/**
 * Get user's support tickets with pagination and filtering
 * @route GET /api/v1/user/support-tickets
 * @access Private (authenticated users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserSupportTickets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Convert page and limit to integers with validation
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    // Build query for user's tickets
    const query = { 'user.user_id': req.user.id };

    // Apply filters
    if (status) {
      query.status = status.toUpperCase();
    }

    if (category) {
      query.category = category.toUpperCase();
    }

    if (priority) {
      query.priority = priority.toUpperCase();
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { subject: searchRegex },
        { description: searchRegex },
        { ticket_number: searchRegex },
        { 'messages.message': searchRegex }
      ];
    }

    // Build sort object
    const validSortFields = ['created_at', 'updated_at', 'last_activity_at', 'priority', 'status'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;

    // Execute query
    const tickets = await SupportTicket.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber)
      .populate('assigned_to.admin_id', 'name email')
      .lean();

    // Convert to public objects
    const publicTickets = tickets.map(ticket => {
      const publicTicket = { ...ticket };
      // Remove internal information
      delete publicTicket.internal_notes;
      publicTicket.messages = publicTicket.messages?.filter(msg => !msg.is_internal) || [];
      
      // Remove sensitive admin information
      if (publicTicket.assigned_to && publicTicket.assigned_to.admin_id) {
        publicTicket.assigned_to = {
          name: publicTicket.assigned_to.name,
          assigned_at: publicTicket.assigned_to.assigned_at
        };
      }
      
      return publicTicket;
    });

    // Get total count for pagination
    const totalTickets = await SupportTicket.countDocuments(query);
    const totalPages = Math.ceil(totalTickets / limitNumber);

    res.status(200).json({
      success: true,
      data: publicTickets,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: totalTickets,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    next(error);
  }
};

/**
 * Get a specific support ticket by ID
 * @route GET /api/v1/user/support-tickets/:id
 * @access Private (authenticated users - own tickets only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSupportTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find ticket and verify ownership
    const ticket = await SupportTicket.findOne({
      _id: id,
      'user.user_id': req.user.id
    }).populate('assigned_to.admin_id', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Update view metrics
    ticket.metrics.view_count += 1;
    ticket.metrics.last_viewed_by_user = new Date();
    await ticket.save();

    // Convert to public object
    const publicTicket = ticket.toPublicObject();

    res.status(200).json({
      success: true,
      data: publicTicket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    next(error);
  }
};

/**
 * Add a message/reply to a support ticket
 * @route POST /api/v1/user/support-tickets/:id/messages
 * @access Private (authenticated users - own tickets only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addMessageToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find ticket and verify ownership
    const ticket = await SupportTicket.findOne({
      _id: id,
      'user.user_id': req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add messages to a closed ticket. Please create a new ticket if you need further assistance.'
      });
    }

    // Get user information
    const user = await User.findById(req.user.id).select('name email');

    // Add message to ticket
    await ticket.addMessage(
      {
        user_id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      },
      message.trim(),
      'MESSAGE',
      false,
      attachments
    );

    // Update ticket status if it was resolved/pending
    if (['RESOLVED', 'PENDING_USER'].includes(ticket.status)) {
      await ticket.updateStatus('OPEN', {
        user_id: user._id,
        name: user.name,
        email: user.email,
        role: 'user'
      }, 'Ticket reopened by user response');
      ticket.metrics.reopened_count += 1;
    }

    // TODO: Send notification to assigned admin
    // TODO: Update SLA timers if needed

    const publicTicket = ticket.toPublicObject();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: publicTicket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    next(error);
  }
};

/**
 * Update a support ticket (limited fields for users)
 * @route PATCH /api/v1/user/support-tickets/:id
 * @access Private (authenticated users - own tickets only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { communication_preferences, tags } = req.body;

    // Find ticket and verify ownership
    const ticket = await SupportTicket.findOne({
      _id: id,
      'user.user_id': req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Users can only update limited fields
    const updates = {};
    
    if (communication_preferences) {
      updates.communication_preferences = {
        preferred_method: communication_preferences.preferred_method || ticket.communication_preferences.preferred_method,
        notify_on_updates: communication_preferences.notify_on_updates !== undefined 
          ? communication_preferences.notify_on_updates 
          : ticket.communication_preferences.notify_on_updates
      };
    }

    if (tags && Array.isArray(tags)) {
      updates.tags = tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim());
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      Object.assign(ticket, updates);
      await ticket.save();
    }

    const publicTicket = ticket.toPublicObject();

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: publicTicket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    next(error);
  }
};

/**
 * Close a support ticket (user satisfaction)
 * @route POST /api/v1/user/support-tickets/:id/close
 * @access Private (authenticated users - own tickets only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.closeSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { satisfaction_rating, feedback } = req.body;

    // Find ticket and verify ownership
    const ticket = await SupportTicket.findOne({
      _id: id,
      'user.user_id': req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Check if ticket can be closed
    if (!['RESOLVED', 'PENDING_USER'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only resolved tickets can be closed by users'
      });
    }

    // Update ticket status
    const user = await User.findById(req.user.id).select('name email');
    await ticket.updateStatus('CLOSED', {
      user_id: user._id,
      name: user.name,
      email: user.email,
      role: 'user'
    }, 'Ticket closed by user');

    // Add user satisfaction rating if provided
    if (satisfaction_rating) {
      ticket.resolution.user_satisfaction = {
        rating: Math.max(1, Math.min(5, parseInt(satisfaction_rating))),
        feedback: feedback ? feedback.trim() : '',
        rated_at: new Date()
      };
      await ticket.save();
    }

    const publicTicket = ticket.toPublicObject();

    res.status(200).json({
      success: true,
      message: 'Support ticket closed successfully. Thank you for your feedback!',
      data: publicTicket
    });
  } catch (error) {
    console.error('Error closing support ticket:', error);
    next(error);
  }
};

/**
 * Get user's ticket statistics
 * @route GET /api/v1/user/support-tickets/stats
 * @access Private (authenticated users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserTicketStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await SupportTicket.aggregate([
      {
        $match: { 'user.user_id': userId }
      },
      {
        $group: {
          _id: null,
          total_tickets: { $sum: 1 },
          open_tickets: {
            $sum: {
              $cond: [
                { $in: ['$status', ['OPEN', 'IN_PROGRESS', 'PENDING_USER']] },
                1,
                0
              ]
            }
          },
          resolved_tickets: {
            $sum: {
              $cond: [
                { $in: ['$status', ['RESOLVED', 'CLOSED']] },
                1,
                0
              ]
            }
          },
          avg_satisfaction: {
            $avg: '$resolution.user_satisfaction.rating'
          },
          avg_resolution_time_hours: {
            $avg: {
              $divide: ['$sla.resolution_time_minutes', 60]
            }
          }
        }
      }
    ]);

    // Get category breakdown
    const categoryStats = await SupportTicket.aggregate([
      {
        $match: { 'user.user_id': userId }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const result = {
      summary: stats[0] || {
        total_tickets: 0,
        open_tickets: 0,
        resolved_tickets: 0,
        avg_satisfaction: null,
        avg_resolution_time_hours: null
      },
      by_category: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user ticket stats:', error);
    next(error);
  }
};

/**
 * Get available ticket categories and priorities
 * @route GET /api/v1/user/support-tickets/options
 * @access Private (authenticated users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTicketOptions = async (req, res, next) => {
  try {
    const options = {
      categories: [
        { value: 'ORDER_ISSUE', label: 'Order Issue' },
        { value: 'PAYMENT_PROBLEM', label: 'Payment Problem' },
        { value: 'PRODUCT_INQUIRY', label: 'Product Inquiry' },
        { value: 'SHIPPING_DELIVERY', label: 'Shipping & Delivery' },
        { value: 'RETURNS_REFUNDS', label: 'Returns & Refunds' },
        { value: 'ACCOUNT_ACCESS', label: 'Account Access' },
        { value: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
        { value: 'BILLING_INQUIRY', label: 'Billing Inquiry' },
        { value: 'PRODUCT_DEFECT', label: 'Product Defect' },
        { value: 'WEBSITE_BUG', label: 'Website Bug' },
        { value: 'FEATURE_REQUEST', label: 'Feature Request' },
        { value: 'COMPLAINT', label: 'Complaint' },
        { value: 'OTHER', label: 'Other' }
      ],
      priorities: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' }
      ],
      statuses: [
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'PENDING_USER', label: 'Pending Your Response' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' }
      ],
      communication_methods: [
        { value: 'EMAIL', label: 'Email' },
        { value: 'PHONE', label: 'Phone' },
        { value: 'SMS', label: 'SMS' },
        { value: 'IN_APP', label: 'In-App Notification' }
      ]
    };

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching ticket options:', error);
    next(error);
  }
};
