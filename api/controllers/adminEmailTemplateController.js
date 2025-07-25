/**
 * Admin Email Template Controller
 * Handles email template management for admin dashboard
 */

const EmailTemplate = require('../models/EmailTemplate');
const mongoose = require('mongoose');

/**
 * Get all email templates with filtering and pagination
 * GET /api/v1/admin/email-templates
 */
const getAllTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      visibility,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortObject = { [sort_by]: sortOrder };

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [templates, totalCount] = await Promise.all([
      EmailTemplate.find(query)
        .populate('created_by', 'name email')
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailTemplate.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    // Get summary statistics
    const summary = await EmailTemplate.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_templates: { $sum: 1 },
          active_count: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          inactive_count: { $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] } },
          public_count: { $sum: { $cond: [{ $eq: ['$visibility', 'PUBLIC'] }, 1, 0] } },
          avg_usage: { $avg: '$usage_stats.total_uses' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Email templates retrieved successfully',
      data: {
        templates,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          per_page: parseInt(limit),
          has_next: hasNext,
          has_prev: hasPrev
        },
        summary: summary[0] || {
          total_templates: 0,
          active_count: 0,
          inactive_count: 0,
          public_count: 0,
          avg_usage: 0
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email templates',
      error: error.message
    });
  }
};

/**
 * Get email template by ID
 * GET /api/v1/admin/email-templates/:id
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const template = await EmailTemplate.findById(id)
      .populate('created_by', 'name email role')
      .populate('shared_with.user_id', 'name email')
      .populate('parent_template', 'name version')
      .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Get template versions (if this is a parent template)
    const versions = await EmailTemplate.find({ 
      parent_template: id 
    })
    .select('name version created_at status')
    .sort({ version: -1 });

    // Get usage statistics from emails using this template
    const Email = require('../models/Email');
    const usageStats = await Email.aggregate([
      { $match: { 'template.template_id': mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          total_emails: { $sum: 1 },
          avg_open_rate: { $avg: '$stats.open_rate' },
          avg_click_rate: { $avg: '$stats.click_rate' },
          total_sent: { $sum: '$stats.sent_count' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Email template retrieved successfully',
      data: {
        template,
        versions,
        usage_statistics: usageStats[0] || {
          total_emails: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          total_sent: 0
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email template',
      error: error.message
    });
  }
};

/**
 * Create new email template
 * POST /api/v1/admin/email-templates
 */
const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      subject_template,
      html_template,
      text_template,
      category,
      variables = [],
      design,
      visibility = 'PRIVATE',
      tags = []
    } = req.body;

    // Validate required fields
    if (!name || !subject_template || !html_template || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, subject_template, html_template, category'
      });
    }

    // Check if template name already exists
    const existingTemplate = await EmailTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }

    // Create template
    const templateData = {
      name,
      description,
      subject_template,
      html_template,
      text_template,
      category,
      variables,
      design: design || {},
      visibility,
      tags,
      created_by: req.user._id
    };

    const template = new EmailTemplate(templateData);
    
    // Validate template (this will also auto-generate text_template if needed)
    template.validateTemplate();
    
    await template.save();

    // Populate the created template
    await template.populate('created_by', 'name email');

    res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      data: {
        template: template.toSafeObject()
      }
    });

  } catch (error) {
    console.error('Error creating email template:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create email template',
      error: error.message
    });
  }
};

/**
 * Update email template
 * PUT /api/v1/admin/email-templates/:id
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const template = await EmailTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can edit this template
    if (!template.canUserAccess(req.user._id, 'EDIT')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this template'
      });
    }

    // Track what changes were made
    const changesMade = {};
    const allowedUpdates = [
      'name', 'description', 'subject_template', 'html_template', 'text_template',
      'category', 'variables', 'design', 'visibility', 'status', 'tags'
    ];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        changesMade[field] = {
          from: template[field],
          to: updates[field]
        };
        template[field] = updates[field];
      }
    }

    // Re-validate template if content changed
    if (updates.subject_template || updates.html_template || updates.variables) {
      template.validateTemplate();
    }

    await template.save();

    // Populate the updated template
    await template.populate('created_by', 'name email');

    res.status(200).json({
      success: true,
      message: 'Email template updated successfully',
      data: {
        template: template.toSafeObject(),
        changes_made: changesMade,
        validation_status: {
          is_valid: template.validation.is_valid,
          errors: template.validation.validation_errors
        }
      }
    });

  } catch (error) {
    console.error('Error updating email template:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
};

/**
 * Delete email template
 * DELETE /api/v1/admin/email-templates/:id
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const template = await EmailTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can delete this template
    if (!template.canUserAccess(req.user._id, 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this template'
      });
    }

    // Check if template is being used by any emails
    const Email = require('../models/Email');
    const emailsUsingTemplate = await Email.countDocuments({ 
      'template.template_id': id,
      status: { $nin: ['CANCELLED', 'FAILED'] }
    });

    if (emailsUsingTemplate > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot permanently delete template. ${emailsUsingTemplate} emails are still using this template.`
      });
    }

    let deletedTemplate;
    let deletionType;

    if (permanent === 'true') {
      // Permanent deletion
      deletedTemplate = await EmailTemplate.findByIdAndDelete(id);
      deletionType = 'permanent';
    } else {
      // Soft deletion (archive)
      template.status = 'ARCHIVED';
      deletedTemplate = await template.save();
      deletionType = 'soft';
    }

    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully',
      data: {
        deleted_template: {
          id: deletedTemplate._id,
          name: deletedTemplate.name,
          category: deletedTemplate.category,
          status: deletedTemplate.status
        },
        deletion_type: deletionType,
        emails_affected: emailsUsingTemplate
      }
    });

  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email template',
      error: error.message
    });
  }
};

/**
 * Preview email template with variables
 * POST /api/v1/admin/email-templates/:id/preview
 */
const previewTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const template = await EmailTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can access this template
    if (!template.canUserAccess(req.user._id, 'VIEW')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this template'
      });
    }

    // Render template with provided variables
    const renderedContent = template.renderTemplate(variables);

    // Check for missing required variables
    const missingVariables = [];
    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name] && !variable.default_value) {
        missingVariables.push(variable.name);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Template preview generated successfully',
      data: {
        template_info: {
          id: template._id,
          name: template.name,
          category: template.category
        },
        rendered_content: renderedContent,
        variables_used: Object.keys(variables),
        missing_required_variables: missingVariables,
        validation_status: {
          is_valid: template.validation.is_valid,
          errors: template.validation.validation_errors
        }
      }
    });

  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview email template',
      error: error.message
    });
  }
};

/**
 * Clone email template
 * POST /api/v1/admin/email-templates/:id/clone
 */
const cloneTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    const originalTemplate = await EmailTemplate.findById(id);
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can access the original template
    if (!originalTemplate.canUserAccess(req.user._id, 'VIEW')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to clone this template'
      });
    }

    // Generate unique name if not provided
    const cloneName = name || `${originalTemplate.name} (Copy)`;
    
    // Check if clone name already exists
    const existingTemplate = await EmailTemplate.findOne({ name: cloneName });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists'
      });
    }

    // Create cloned template
    const clonedTemplate = new EmailTemplate({
      name: cloneName,
      description: description || `Cloned from ${originalTemplate.name}`,
      subject_template: originalTemplate.subject_template,
      html_template: originalTemplate.html_template,
      text_template: originalTemplate.text_template,
      category: originalTemplate.category,
      variables: originalTemplate.variables,
      design: originalTemplate.design,
      visibility: 'PRIVATE', // Clones are always private initially
      tags: [...originalTemplate.tags, 'cloned'],
      created_by: req.user._id,
      parent_template: originalTemplate._id
    });

    await clonedTemplate.save();
    await clonedTemplate.populate('created_by', 'name email');

    res.status(201).json({
      success: true,
      message: 'Email template cloned successfully',
      data: {
        cloned_template: clonedTemplate.toSafeObject(),
        original_template: {
          id: originalTemplate._id,
          name: originalTemplate.name
        }
      }
    });

  } catch (error) {
    console.error('Error cloning email template:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to clone email template',
      error: error.message
    });
  }
};

/**
 * Get template analytics
 * GET /api/v1/admin/email-templates/analytics
 */
const getTemplateAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Get popular templates
    const popularTemplates = await EmailTemplate.getPopularTemplates(10);

    // Get category distribution
    const categoryDistribution = await EmailTemplate.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avg_usage: { $avg: '$usage_stats.total_uses' },
          avg_performance: { $avg: '$usage_stats.avg_open_rate' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent template activity
    const recentActivity = await EmailTemplate.aggregate([
      {
        $match: {
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          templates_created: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get overall statistics
    const overallStats = await EmailTemplate.aggregate([
      {
        $group: {
          _id: null,
          total_templates: { $sum: 1 },
          active_templates: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          avg_usage: { $avg: '$usage_stats.total_uses' },
          avg_open_rate: { $avg: '$usage_stats.avg_open_rate' },
          total_usage: { $sum: '$usage_stats.total_uses' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Template analytics retrieved successfully',
      data: {
        period,
        overall_statistics: overallStats[0] || {},
        popular_templates: popularTemplates,
        category_distribution: categoryDistribution,
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    console.error('Error retrieving template analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  cloneTemplate,
  getTemplateAnalytics
};
