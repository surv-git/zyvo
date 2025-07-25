/**
 * Admin Support Ticket Controller
 * Handles admin-side support ticket management for admin dashboard
 */

const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

/**
 * Get all support tickets with advanced filtering, search, and pagination
 * @route GET /api/v1/admin/support-tickets
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllSupportTickets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      assigned_to,
      user_id,
      search,
      date_from,
      date_to,
      overdue_only,
      escalated_only,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Convert page and limit to integers with validation
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    // Build query object
    const query = {};

    // Apply filters
    if (status) {
      query.status = Array.isArray(status) ? { $in: status.map(s => s.toUpperCase()) } : status.toUpperCase();
    }

    if (category) {
      query.category = Array.isArray(category) ? { $in: category.map(c => c.toUpperCase()) } : category.toUpperCase();
    }

    if (priority) {
      query.priority = Array.isArray(priority) ? { $in: priority.map(p => p.toUpperCase()) } : priority.toUpperCase();
    }

    if (assigned_to) {
      if (assigned_to === 'unassigned') {
        query['assigned_to.admin_id'] = { $exists: false };
      } else {
        query['assigned_to.admin_id'] = assigned_to;
      }
    }

    if (user_id) {
      query['user.user_id'] = user_id;
    }

    // Date range filtering
    if (date_from || date_to) {
      query.created_at = {};
      if (date_from) {
        query.created_at.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        query.created_at.$lte = endDate;
      }
    }

    // Overdue tickets filter
    if (overdue_only === 'true') {
      const now = new Date();
      query.$or = [
        { 
          'sla.response_due': { $lt: now },
          status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] }
        },
        { 
          'sla.resolution_due': { $lt: now },
          status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] }
        }
      ];
    }

    // Escalated tickets filter
    if (escalated_only === 'true') {
      query['escalation.is_escalated'] = true;
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticket_number: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { 'user.name': searchRegex },
        { 'user.email': searchRegex },
        { 'messages.message': searchRegex }
      ];
    }

    // Build sort object
    const validSortFields = [
      'created_at', 'updated_at', 'last_activity_at', 'priority', 'status',
      'ticket_number', 'user.name', 'assigned_to.assigned_at'
    ];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;

    // Execute query with population
    const tickets = await SupportTicket.find(query)
      .populate('user.user_id', 'name email phone isActive')
      .populate('assigned_to.admin_id', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Get total count for pagination
    const totalTickets = await SupportTicket.countDocuments(query);
    const totalPages = Math.ceil(totalTickets / limitNumber);

    res.status(200).json({
      success: true,
      data: tickets,
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
    console.error('Error fetching support tickets:', error);
    next(error);
  }
};

/**
 * Get a specific support ticket by ID (full admin view)
 * @route GET /api/v1/admin/support-tickets/:id
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSupportTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone isActive created_at')
      .populate('assigned_to.admin_id', 'name email')
      .populate('messages.sender.user_id', 'name email')
      .populate('internal_notes.admin_id', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Update view metrics
    ticket.metrics.view_count += 1;
    ticket.metrics.last_viewed_by_admin = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    next(error);
  }
};

/**
 * Create a new support ticket (admin-created)
 * @route POST /api/v1/admin/support-tickets
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createSupportTicket = async (req, res, next) => {
  try {
    const {
      user_id,
      subject,
      description,
      category,
      priority,
      assigned_to,
      related_order,
      related_product,
      tags = [],
      internal_note
    } = req.body;

    // Validate required fields
    if (!user_id || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'User ID, subject, and description are required'
      });
    }

    // Get user information
    const user = await User.findById(user_id).select('name email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get admin information
    const admin = await User.findById(req.user.id).select('name email');

    // Set SLA due dates based on priority
    const now = new Date();
    const ticketPriority = priority || 'MEDIUM';
    const sla = {
      response_due: new Date(now.getTime() + (ticketPriority === 'URGENT' ? 1 : ticketPriority === 'HIGH' ? 4 : 24) * 60 * 60 * 1000),
      resolution_due: new Date(now.getTime() + (ticketPriority === 'URGENT' ? 4 : ticketPriority === 'HIGH' ? 24 : 72) * 60 * 60 * 1000)
    };

    // Create ticket data
    const ticketData = {
      subject: subject.trim(),
      description: description.trim(),
      category: category || 'OTHER',
      priority: ticketPriority,
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      sla,
      source: 'ADMIN_CREATED',
      tags: tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim())
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

    // Create the support ticket
    const supportTicket = new SupportTicket(ticketData);

    // Assign ticket if specified
    if (assigned_to) {
      const assignee = await User.findById(assigned_to).select('name email');
      if (assignee) {
        await supportTicket.assignTo({
          admin_id: assignee._id,
          name: assignee.name,
          email: assignee.email
        });
      }
    }

    await supportTicket.save();

    // Add initial message from admin
    await supportTicket.addMessage(
      {
        user_id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      },
      description,
      'MESSAGE',
      false
    );

    // Add internal note if provided
    if (internal_note && internal_note.trim()) {
      supportTicket.internal_notes.push({
        admin_id: admin._id,
        admin_name: admin.name,
        note: internal_note.trim()
      });
      await supportTicket.save();
    }

    // TODO: Send notification to user
    // TODO: Send notification to assigned admin

    const populatedTicket = await SupportTicket.findById(supportTicket._id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: populatedTicket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    next(error);
  }
};

/**
 * Update a support ticket
 * @route PATCH /api/v1/admin/support-tickets/:id
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      subject,
      category,
      priority,
      status,
      assigned_to,
      tags,
      resolution_note,
      resolution_type,
      internal_note
    } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const admin = await User.findById(req.user.id).select('name email');
    let statusChanged = false;
    let assignmentChanged = false;

    // Update basic fields
    if (subject && subject.trim()) {
      ticket.subject = subject.trim();
    }

    if (category) {
      ticket.category = category.toUpperCase();
    }

    if (priority) {
      ticket.priority = priority.toUpperCase();
    }

    if (tags && Array.isArray(tags)) {
      ticket.tags = tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim());
    }

    // Handle status change
    if (status && status !== ticket.status) {
      await ticket.updateStatus(status.toUpperCase(), {
        user_id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }, resolution_note);
      statusChanged = true;

      // Add resolution information if resolving
      if (['RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
        ticket.resolution.resolved_by = {
          admin_id: admin._id,
          name: admin.name,
          email: admin.email
        };
        ticket.resolution.resolved_at = new Date();
        if (resolution_note) {
          ticket.resolution.resolution_note = resolution_note.trim();
        }
        if (resolution_type) {
          ticket.resolution.resolution_type = resolution_type.toUpperCase();
        }
      }
    }

    // Handle assignment
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '') {
        // Unassign ticket
        ticket.assigned_to = {
          admin_id: undefined,
          name: undefined,
          email: undefined,
          assigned_at: undefined
        };
        assignmentChanged = true;
      } else if (assigned_to !== ticket.assigned_to?.admin_id?.toString()) {
        // Assign to new admin
        const assignee = await User.findById(assigned_to).select('name email');
        if (assignee) {
          await ticket.assignTo({
            admin_id: assignee._id,
            name: assignee.name,
            email: assignee.email
          });
          assignmentChanged = true;
        }
      }
    }

    // Add internal note if provided
    if (internal_note && internal_note.trim()) {
      ticket.internal_notes.push({
        admin_id: admin._id,
        admin_name: admin.name,
        note: internal_note.trim()
      });
    }

    await ticket.save();

    // TODO: Send notifications based on changes
    // TODO: Update SLA timers if needed

    const updatedTicket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email');

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: updatedTicket,
      changes: {
        statusChanged,
        assignmentChanged
      }
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    next(error);
  }
};

/**
 * Add a message/reply to a support ticket
 * @route POST /api/v1/admin/support-tickets/:id/messages
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addMessageToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, message_type = 'MESSAGE', is_internal = false, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const admin = await User.findById(req.user.id).select('name email');

    // Add message to ticket
    await ticket.addMessage(
      {
        user_id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      },
      message.trim(),
      message_type.toUpperCase(),
      is_internal,
      attachments
    );

    // Update ticket status if it's first response
    if (ticket.status === 'OPEN' && !is_internal) {
      await ticket.updateStatus('IN_PROGRESS', {
        user_id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      });
    }

    // TODO: Send notification to user if not internal message

    const updatedTicket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email')
      .populate('messages.sender.user_id', 'name email');

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    next(error);
  }
};

/**
 * Assign a support ticket to an admin
 * @route POST /api/v1/admin/support-tickets/:id/assign
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.assignSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const assignee = await User.findOne({ _id: admin_id, role: { $in: ['admin', 'support'] } }).select('name email');
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Assign ticket
    await ticket.assignTo({
      admin_id: assignee._id,
      name: assignee.name,
      email: assignee.email
    });

    // TODO: Send notification to assigned admin

    const updatedTicket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email');

    res.status(200).json({
      success: true,
      message: `Ticket assigned to ${assignee.name}`,
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error assigning support ticket:', error);
    next(error);
  }
};

/**
 * Escalate a support ticket
 * @route POST /api/v1/admin/support-tickets/:id/escalate
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.escalateSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { escalation_reason } = req.body;

    if (!escalation_reason || !escalation_reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const admin = await User.findById(req.user.id).select('name email');

    // Escalate ticket
    await ticket.escalate(escalation_reason.trim(), {
      user_id: admin._id,
      name: admin.name,
      email: admin.email
    });

    // TODO: Send escalation notifications

    const updatedTicket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email');

    res.status(200).json({
      success: true,
      message: 'Support ticket escalated successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error escalating support ticket:', error);
    next(error);
  }
};

/**
 * Add internal note to a support ticket
 * @route POST /api/v1/admin/support-tickets/:id/internal-notes
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.addInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const admin = await User.findById(req.user.id).select('name email');

    // Add internal note
    ticket.internal_notes.push({
      admin_id: admin._id,
      admin_name: admin.name,
      note: note.trim()
    });

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(id)
      .populate('user.user_id', 'name email phone')
      .populate('assigned_to.admin_id', 'name email')
      .populate('internal_notes.admin_id', 'name email');

    res.status(200).json({
      success: true,
      message: 'Internal note added successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error adding internal note:', error);
    next(error);
  }
};

/**
 * Delete a support ticket (admin only, with confirmation)
 * @route DELETE /api/v1/admin/support-tickets/:id
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirm } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Deletion confirmation required. Add ?confirm=true to the request.'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    await SupportTicket.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    next(error);
  }
};

/**
 * Get support ticket analytics and insights
 * @route GET /api/v1/admin/support-tickets/analytics
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSupportTicketAnalytics = async (req, res, next) => {
  try {
    const { period = '30d', admin_id } = req.query;

    const periodDays = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Base match conditions
    const matchConditions = {
      created_at: { $gte: startDate }
    };

    // Filter by admin if specified
    if (admin_id) {
      matchConditions['assigned_to.admin_id'] = admin_id;
    }

    // Overall statistics
    const overallStats = await SupportTicket.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_tickets: { $sum: 1 },
          open_tickets: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
          in_progress_tickets: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          resolved_tickets: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
          avg_resolution_time_hours: { $avg: { $divide: ['$sla.resolution_time_minutes', 60] } },
          avg_response_time_hours: { $avg: { $divide: ['$sla.response_time_minutes', 60] } },
          escalated_tickets: { $sum: { $cond: ['$escalation.is_escalated', 1, 0] } },
          overdue_tickets: { $sum: { $cond: ['$sla.is_sla_breached', 1, 0] } },
          avg_satisfaction: { $avg: '$resolution.user_satisfaction.rating' }
        }
      }
    ]);

    // Category breakdown
    const categoryStats = await SupportTicket.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Priority distribution
    const priorityStats = await SupportTicket.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          avg_resolution_time: { $avg: { $divide: ['$sla.resolution_time_minutes', 60] } }
        }
      }
    ]);

    // Daily ticket creation trend
    const dailyTrends = await SupportTicket.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          created: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Admin performance (if not filtered by specific admin)
    let adminPerformance = [];
    if (!admin_id) {
      adminPerformance = await SupportTicket.aggregate([
        { 
          $match: { 
            ...matchConditions,
            'assigned_to.admin_id': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$assigned_to.admin_id',
            admin_name: { $first: '$assigned_to.name' },
            tickets_assigned: { $sum: 1 },
            tickets_resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
            avg_resolution_time: { $avg: { $divide: ['$sla.resolution_time_minutes', 60] } },
            avg_satisfaction: { $avg: '$resolution.user_satisfaction.rating' }
          }
        },
        { $sort: { tickets_assigned: -1 } },
        { $limit: 10 }
      ]);
    }

    // Current overdue tickets
    const overdueTickets = await SupportTicket.find({
      status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
      $or: [
        { 'sla.response_due': { $lt: new Date() } },
        { 'sla.resolution_due': { $lt: new Date() } }
      ]
    }).countDocuments();

    const analytics = {
      period: `${periodDays} days`,
      overview: overallStats[0] || {},
      by_category: categoryStats,
      by_priority: priorityStats.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          avg_resolution_time_hours: item.avg_resolution_time
        };
        return acc;
      }, {}),
      daily_trends: dailyTrends,
      admin_performance: adminPerformance,
      current_overdue_tickets: overdueTickets
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching support ticket analytics:', error);
    next(error);
  }
};

/**
 * Get overdue support tickets
 * @route GET /api/v1/admin/support-tickets/overdue
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getOverdueTickets = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const overdueTickets = await SupportTicket.getOverdueTickets()
      .populate('user.user_id', 'name email')
      .populate('assigned_to.admin_id', 'name email')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: overdueTickets,
      count: overdueTickets.length
    });
  } catch (error) {
    console.error('Error fetching overdue tickets:', error);
    next(error);
  }
};

/**
 * Bulk update support tickets
 * @route POST /api/v1/admin/support-tickets/bulk-update
 * @access Private (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.bulkUpdateTickets = async (req, res, next) => {
  try {
    const { ticket_ids, updates } = req.body;

    if (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ticket IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    const admin = await User.findById(req.user.id).select('name email');
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Process each ticket
    for (const ticketId of ticket_ids) {
      try {
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
          results.failed++;
          results.errors.push(`Ticket ${ticketId} not found`);
          continue;
        }

        // Apply updates
        if (updates.status && updates.status !== ticket.status) {
          await ticket.updateStatus(updates.status.toUpperCase(), {
            user_id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin'
          }, 'Bulk status update');
        }

        if (updates.priority) {
          ticket.priority = updates.priority.toUpperCase();
        }

        if (updates.category) {
          ticket.category = updates.category.toUpperCase();
        }

        if (updates.assigned_to) {
          const assignee = await User.findById(updates.assigned_to).select('name email');
          if (assignee) {
            await ticket.assignTo({
              admin_id: assignee._id,
              name: assignee.name,
              email: assignee.email
            });
          }
        }

        if (updates.tags) {
          ticket.tags = updates.tags;
        }

        await ticket.save();
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error updating ticket ${ticketId}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed. ${results.updated} tickets updated, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    next(error);
  }
};
