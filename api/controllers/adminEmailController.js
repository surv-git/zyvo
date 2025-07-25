/**
 * Admin Email Controller
 * Handles email sending, management, and analytics for admin dashboard
 */

const Email = require('../models/Email');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get all emails with filtering and pagination
 * GET /api/v1/admin/emails
 */
const getAllEmails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      email_type,
      recipients_type,
      priority,
      search,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc',
      admin_id
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (email_type) query.email_type = email_type;
    if (recipients_type) query['recipients.type'] = recipients_type;
    if (priority) query.priority = priority;
    if (admin_id) query['sender.admin_id'] = admin_id;
    
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'content.html': { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (start_date && end_date) {
      query.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    // Build sort object
    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortObject = { [sort_by]: sortOrder };

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [emails, totalCount] = await Promise.all([
      Email.find(query)
        .populate('sender.admin_id', 'name email role')
        .populate('template.template_id', 'name category')
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Email.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    // Get summary statistics
    const summary = await Email.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_emails: { $sum: 1 },
          draft_count: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
          sent_count: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          scheduled_count: { $sum: { $cond: [{ $eq: ['$status', 'SCHEDULED'] }, 1, 0] } },
          failed_count: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          total_recipients: { $sum: '$stats.total_recipients' },
          total_delivered: { $sum: '$stats.delivered_count' },
          total_opened: { $sum: '$stats.opened_count' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Emails retrieved successfully',
      data: {
        emails,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          per_page: parseInt(limit),
          has_next: hasNext,
          has_prev: hasPrev
        },
        summary: summary[0] || {
          total_emails: 0,
          draft_count: 0,
          sent_count: 0,
          scheduled_count: 0,
          failed_count: 0,
          total_recipients: 0,
          total_delivered: 0,
          total_opened: 0
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emails',
      error: error.message
    });
  }
};

/**
 * Get email by ID
 * GET /api/v1/admin/emails/:id
 */
const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email ID format'
      });
    }

    const email = await Email.findById(id)
      .populate('sender.admin_id', 'name email role')
      .populate('template.template_id', 'name category variables')
      .populate('recipients.to.user_id', 'name email')
      .lean();

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Get related emails count (same campaign or similar type)
    const relatedEmailsCount = await Email.countDocuments({
      _id: { $ne: id },
      $or: [
        { 'campaign.campaign_id': email.campaign?.campaign_id },
        { email_type: email.email_type, 'sender.admin_id': email.sender.admin_id }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Email retrieved successfully',
      data: {
        email,
        related_emails_count: relatedEmailsCount
      }
    });

  } catch (error) {
    console.error('Error retrieving email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email',
      error: error.message
    });
  }
};

/**
 * Create new email
 * POST /api/v1/admin/emails
 */
const createEmail = async (req, res) => {
  try {
    const {
      subject,
      content,
      email_type,
      recipients,
      priority = 'MEDIUM',
      template,
      scheduling,
      settings,
      attachments,
      campaign
    } = req.body;

    // Validate required fields
    if (!subject || !content?.html || !email_type || !recipients) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, content.html, email_type, recipients'
      });
    }

    // Process recipients based on type
    let processedRecipients = { type: recipients.type, to: [] };
    
    if (recipients.type === 'INDIVIDUAL') {
      // Validate individual recipients
      if (!recipients.to || !Array.isArray(recipients.to)) {
        return res.status(400).json({
          success: false,
          message: 'Individual emails require recipients.to array'
        });
      }

      for (const emailData of recipients.to) {
        processedRecipients.to.push({
          email: emailData.email,
          name: emailData.name,
          user_id: emailData.user_id,
          status: 'PENDING'
        });
      }
    } else if (recipients.type === 'BROADCAST') {
      // For broadcast, we'll resolve recipients later when sending
      processedRecipients.broadcast_criteria = recipients.broadcast_criteria;
      processedRecipients.estimated_count = recipients.estimated_count || 0;
    }

    // Create email object
    const emailData = {
      subject,
      content,
      email_type,
      priority,
      recipients: processedRecipients,
      sender: {
        admin_id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      template,
      scheduling: scheduling || { send_type: 'IMMEDIATE' },
      settings: settings || {},
      attachments: attachments || [],
      campaign,
      audit: {
        created_by: req.user._id
      }
    };

    const email = new Email(emailData);
    await email.save();

    // Populate the created email
    await email.populate('sender.admin_id', 'name email role');
    if (email.template?.template_id) {
      await email.populate('template.template_id', 'name category');
    }

    // Auto-send if scheduling type is IMMEDIATE
    if (scheduling?.send_type === 'IMMEDIATE') {
      // Update status to SENDING
      email.status = 'SENDING';
      email.sent_at = new Date();
      await email.save();

      // Send email asynchronously
      setTimeout(async () => {
        try {
          const { sendAdminEmail, sendTemplatedEmail } = require('../utils/adminEmailService');
          
          if (email.template?.template_id) {
            await sendTemplatedEmail(email);
          } else {
            await sendAdminEmail(email);
          }
        } catch (error) {
          console.error('Error in auto-sending email:', error);
        }
      }, 1000);
    }

    res.status(201).json({
      success: true,
      message: scheduling?.send_type === 'IMMEDIATE' 
        ? 'Email created and is being sent'
        : 'Email created successfully',
      data: {
        email: email.toSafeObject()
      }
    });

  } catch (error) {
    console.error('Error creating email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email',
      error: error.message
    });
  }
};

/**
 * Update email
 * PUT /api/v1/admin/emails/:id
 */
const updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email ID format'
      });
    }

    const email = await Email.findById(id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Check if email can be edited
    if (!email.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Email cannot be edited in current status',
        current_status: email.status
      });
    }

    // Track what changes were made
    const changesMade = {};
    const allowedUpdates = [
      'subject', 'content', 'email_type', 'priority', 'recipients', 
      'template', 'scheduling', 'settings', 'attachments', 'campaign'
    ];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        changesMade[field] = {
          from: email[field],
          to: updates[field]
        };
        email[field] = updates[field];
      }
    }

    // Update audit trail
    email.audit.updated_by = req.user._id;
    
    await email.save();

    // Populate the updated email
    await email.populate('sender.admin_id', 'name email role');
    if (email.template?.template_id) {
      await email.populate('template.template_id', 'name category');
    }

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      data: {
        email: email.toSafeObject(),
        changes_made: changesMade
      }
    });

  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email',
      error: error.message
    });
  }
};

/**
 * Delete email
 * DELETE /api/v1/admin/emails/:id
 */
const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email ID format'
      });
    }

    const email = await Email.findById(id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    let deletedEmail;
    let deletionType;

    if (permanent === 'true') {
      // Permanent deletion
      deletedEmail = await Email.findByIdAndDelete(id);
      deletionType = 'permanent';
    } else {
      // Soft deletion (mark as cancelled)
      email.status = 'CANCELLED';
      email.audit.updated_by = req.user._id;
      deletedEmail = await email.save();
      deletionType = 'soft';
    }

    res.status(200).json({
      success: true,
      message: 'Email deleted successfully',
      data: {
        deleted_email: {
          id: deletedEmail._id,
          subject: deletedEmail.subject,
          email_type: deletedEmail.email_type,
          status: deletedEmail.status
        },
        deletion_type: deletionType
      }
    });

  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email',
      error: error.message
    });
  }
};

/**
 * Send email (individual or broadcast)
 * POST /api/v1/admin/emails/:id/send
 */
const sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { send_immediately = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email ID format'
      });
    }

    const email = await Email.findById(id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Check if email can be sent
    if (!email.canSend()) {
      return res.status(400).json({
        success: false,
        message: 'Email cannot be sent',
        reasons: {
          current_status: email.status,
          has_recipients: email.recipients.to.length > 0,
          has_subject: email.subject.trim() !== '',
          has_content: email.content.html.trim() !== ''
        }
      });
    }

    // If it's a broadcast email, resolve recipients
    if (email.recipients.type === 'BROADCAST') {
      const recipients = await resolveeBroadcastRecipients(email.recipients.broadcast_criteria);
      email.recipients.to = recipients.map(user => ({
        user_id: user._id,
        email: user.email,
        name: user.name,
        status: 'PENDING'
      }));
      email.recipients.actual_count = recipients.length;
    }

    // Update email status
    if (send_immediately || email.scheduling.send_type === 'IMMEDIATE') {
      email.status = 'SENDING';
      email.sent_at = new Date();
    } else {
      email.status = 'SCHEDULED';
    }

    email.audit.updated_by = req.user._id;
    await email.save();

    // Here you would integrate with your email service provider
    // Using the actual email service
    if (send_immediately || email.scheduling.send_type === 'IMMEDIATE') {
      // Send email using the real email service
      setTimeout(async () => {
        try {
          const { sendAdminEmail, sendTemplatedEmail } = require('../utils/adminEmailService');
          
          if (email.template?.template_id) {
            await sendTemplatedEmail(email);
          } else {
            await sendAdminEmail(email);
          }
        } catch (error) {
          console.error('Error in email sending:', error);
        }
      }, 1000);
    }

    res.status(200).json({
      success: true,
      message: send_immediately ? 'Email is being sent' : 'Email scheduled for sending',
      data: {
        email_id: email._id,
        status: email.status,
        recipients_count: email.recipients.to.length,
        scheduled_at: email.scheduling.scheduled_at,
        estimated_completion: new Date(Date.now() + (email.recipients.to.length * 100)) // Rough estimate
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

/**
 * Get email analytics
 * GET /api/v1/admin/emails/analytics
 */
const getEmailAnalytics = async (req, res) => {
  try {
    const { period = '30d', admin_id, email_type } = req.query;

    // Build base query
    const baseQuery = {};
    if (admin_id) baseQuery['sender.admin_id'] = admin_id;
    if (email_type) baseQuery.email_type = email_type;

    // Get overall analytics
    const overallAnalytics = await Email.getEmailAnalytics(period);
    
    // Get type distribution
    const typeDistribution = await Email.aggregate([
      { $match: { ...baseQuery, status: { $nin: ['DRAFT', 'CANCELLED'] } } },
      {
        $group: {
          _id: '$email_type',
          count: { $sum: 1 },
          total_sent: { $sum: '$stats.sent_count' },
          total_delivered: { $sum: '$stats.delivered_count' },
          total_opened: { $sum: '$stats.opened_count' },
          avg_open_rate: { $avg: '$stats.open_rate' },
          avg_click_rate: { $avg: '$stats.click_rate' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority distribution
    const priorityDistribution = await Email.aggregate([
      { $match: { ...baseQuery, status: { $nin: ['DRAFT', 'CANCELLED'] } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          avg_open_rate: { $avg: '$stats.open_rate' }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const recentActivity = await Email.aggregate([
      {
        $match: {
          ...baseQuery,
          created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          emails_created: { $sum: 1 },
          emails_sent: {
            $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top performing emails
    const topPerformingEmails = await Email.getTopPerformingEmails(5);

    res.status(200).json({
      success: true,
      message: 'Email analytics retrieved successfully',
      data: {
        period,
        overall_statistics: overallAnalytics[0] || {},
        type_distribution: typeDistribution,
        priority_distribution: priorityDistribution,
        recent_activity: recentActivity,
        top_performing_emails: topPerformingEmails
      }
    });

  } catch (error) {
    console.error('Error retrieving email analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email analytics',
      error: error.message
    });
  }
};

/**
 * Create broadcast email
 * POST /api/v1/admin/emails/broadcast
 */
const createBroadcastEmail = async (req, res) => {
  try {
    const {
      subject,
      content,
      email_type,
      broadcast_criteria,
      priority = 'MEDIUM',
      template,
      scheduling
    } = req.body;

    // Validate required fields
    if (!subject || !content?.html || !email_type || !broadcast_criteria) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, content.html, email_type, broadcast_criteria'
      });
    }

    // Estimate recipient count
    const estimatedRecipients = await resolveeBroadcastRecipients(broadcast_criteria);
    const estimatedCount = estimatedRecipients.length;

    if (estimatedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients match the broadcast criteria'
      });
    }

    // Create broadcast email
    const emailData = {
      subject,
      content,
      email_type,
      priority,
      recipients: {
        type: 'BROADCAST',
        broadcast_criteria,
        estimated_count: estimatedCount,
        to: [] // Will be populated when sending
      },
      sender: {
        admin_id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      template,
      scheduling: scheduling || { send_type: 'IMMEDIATE' },
      audit: {
        created_by: req.user._id
      }
    };

    const email = new Email(emailData);
    await email.save();

    // Populate the created email
    await email.populate('sender.admin_id', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Broadcast email created successfully',
      data: {
        email: email.toSafeObject(),
        estimated_recipients: estimatedCount
      }
    });

  } catch (error) {
    console.error('Error creating broadcast email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create broadcast email',
      error: error.message
    });
  }
};

// Helper function to resolve broadcast recipients
const resolveeBroadcastRecipients = async (criteria) => {
  try {
    const query = {};
    
    // User roles filter
    if (criteria.user_roles && criteria.user_roles.length > 0) {
      query.role = { $in: criteria.user_roles };
    }
    
    // User status filter
    if (criteria.user_status && criteria.user_status.length > 0) {
      query.status = { $in: criteria.user_status };
    }
    
    // Registration date range
    if (criteria.registration_date_range) {
      query.created_at = {};
      if (criteria.registration_date_range.start) {
        query.created_at.$gte = new Date(criteria.registration_date_range.start);
      }
      if (criteria.registration_date_range.end) {
        query.created_at.$lte = new Date(criteria.registration_date_range.end);
      }
    }
    
    // Last login range
    if (criteria.last_login_range) {
      query.last_login = {};
      if (criteria.last_login_range.start) {
        query.last_login.$gte = new Date(criteria.last_login_range.start);
      }
      if (criteria.last_login_range.end) {
        query.last_login.$lte = new Date(criteria.last_login_range.end);
      }
    }

    // Custom filters would require additional logic based on your user model
    // For now, we'll implement basic filters

    const recipients = await User.find(query)
      .select('name email role status created_at last_login')
      .lean();

    return recipients;
  } catch (error) {
    console.error('Error resolving broadcast recipients:', error);
    return [];
  }
};

// Helper function to simulate email sending (replace with actual email service)
const simulateEmailSending = async (email) => {
  try {
    // Simulate processing each recipient
    for (let i = 0; i < email.recipients.to.length; i++) {
      const recipient = email.recipients.to[i];
      
      // Simulate random outcomes
      const outcomes = ['DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'];
      const weights = [0.85, 0.25, 0.05, 0.05, 0.05]; // Probability weights
      
      let randomValue = Math.random();
      let selectedOutcome = 'DELIVERED';
      
      for (let j = 0; j < outcomes.length; j++) {
        if (randomValue < weights[j]) {
          selectedOutcome = outcomes[j];
          break;
        }
        randomValue -= weights[j];
      }
      
      email.updateRecipientStatus(recipient.email, selectedOutcome);
      
      // Small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Update email status
    email.status = 'SENT';
    email.completed_at = new Date();
    await email.save();
    
    console.log(`Email ${email._id} sent successfully to ${email.recipients.to.length} recipients`);
  } catch (error) {
    console.error('Error in email simulation:', error);
    email.status = 'FAILED';
    email.errors.push({
      error_type: 'SENDING',
      error_message: error.message,
      error_code: 'SIMULATION_ERROR'
    });
    await email.save();
  }
};

module.exports = {
  getAllEmails,
  getEmailById,
  createEmail,
  updateEmail,
  deleteEmail,
  sendEmail,
  getEmailAnalytics,
  createBroadcastEmail
};
