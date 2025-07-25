/**
 * Support Ticket Validation Schemas
 * Express-validator validation schemas for support ticket operations
 */

const { body, query, param } = require('express-validator');

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const ticketCategories = [
  'ORDER_ISSUE', 'PAYMENT_PROBLEM', 'PRODUCT_INQUIRY', 'SHIPPING_DELIVERY',
  'RETURNS_REFUNDS', 'ACCOUNT_ACCESS', 'TECHNICAL_SUPPORT', 'BILLING_INQUIRY',
  'PRODUCT_DEFECT', 'WEBSITE_BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'OTHER'
];
const ticketPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const messageTypes = ['MESSAGE', 'STATUS_UPDATE', 'ASSIGNMENT', 'INTERNAL_NOTE', 'RESOLUTION'];
const communicationMethods = ['EMAIL', 'PHONE', 'SMS', 'IN_APP'];

// User Support Ticket Validations

/**
 * Validation for creating a new support ticket (user)
 */
const createSupportTicketValidation = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters long'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters long'),
  
  body('category')
    .optional()
    .isIn(ticketCategories)
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  body('priority')
    .optional()
    .isIn(ticketPriorities)
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  body('related_order.order_id')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid order ID format'),
  
  body('related_order.order_number')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Order number cannot be empty'),
  
  body('related_product.product_id')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid product ID format'),
  
  body('related_product.product_name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Product name cannot be empty'),
  
  body('related_product.sku')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('SKU cannot be empty'),
  
  body('attachments')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 attachments allowed'),
  
  body('attachments.*.filename')
    .if(body('attachments').exists())
    .notEmpty()
    .withMessage('Attachment filename is required'),
  
  body('attachments.*.file_url')
    .if(body('attachments').exists())
    .isURL()
    .withMessage('Attachment file URL must be valid'),
  
  body('communication_preferences.preferred_method')
    .optional()
    .isIn(communicationMethods)
    .withMessage(`Preferred method must be one of: ${communicationMethods.join(', ')}`),
  
  body('communication_preferences.notify_on_updates')
    .optional()
    .isBoolean()
    .withMessage('Notify on updates must be a boolean value')
];

/**
 * Validation for updating a support ticket (user)
 */
const updateSupportTicketValidation = [
  body('communication_preferences.preferred_method')
    .optional()
    .isIn(communicationMethods)
    .withMessage(`Preferred method must be one of: ${communicationMethods.join(', ')}`),
  
  body('communication_preferences.notify_on_updates')
    .optional()
    .isBoolean()
    .withMessage('Notify on updates must be a boolean value'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .if(body('tags').exists())
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

/**
 * Validation for adding a message to a ticket
 */
const addMessageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters long'),
  
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 attachments allowed per message'),
  
  body('attachments.*.filename')
    .if(body('attachments').exists())
    .notEmpty()
    .withMessage('Attachment filename is required'),
  
  body('attachments.*.file_url')
    .if(body('attachments').exists())
    .isURL()
    .withMessage('Attachment file URL must be valid')
];

/**
 * Validation for closing a support ticket with satisfaction rating
 */
const closeSupportTicketValidation = [
  body('satisfaction_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Satisfaction rating must be between 1 and 5'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters')
];

/**
 * Validation for support ticket filters
 */
const supportTicketFiltersValidation = [
  query('status')
    .optional()
    .isIn(ticketStatuses)
    .withMessage(`Status must be one of: ${ticketStatuses.join(', ')}`),
  
  query('category')
    .optional()
    .isIn(ticketCategories)
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  query('priority')
    .optional()
    .isIn(ticketPriorities)
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
  
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'last_activity_at', 'priority', 'status'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
];

// Admin Support Ticket Validations

/**
 * Validation for creating a support ticket (admin)
 */
const createAdminSupportTicketValidation = [
  body('user_id')
    .matches(objectIdPattern)
    .withMessage('Invalid user ID format'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters long'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters long'),
  
  body('category')
    .optional()
    .isIn(ticketCategories)
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  body('priority')
    .optional()
    .isIn(ticketPriorities)
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  body('assigned_to')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid admin ID format'),
  
  body('related_order.order_id')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid order ID format'),
  
  body('related_order.order_number')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Order number cannot be empty'),
  
  body('related_product.product_id')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid product ID format'),
  
  body('related_product.product_name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Product name cannot be empty'),
  
  body('related_product.sku')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('SKU cannot be empty'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .if(body('tags').exists())
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  body('internal_note')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Internal note cannot exceed 2000 characters')
];

/**
 * Validation for updating a support ticket (admin)
 */
const updateAdminSupportTicketValidation = [
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters long'),
  
  body('category')
    .optional()
    .isIn(ticketCategories)
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  body('priority')
    .optional()
    .isIn(ticketPriorities)
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  body('status')
    .optional()
    .isIn(ticketStatuses)
    .withMessage(`Status must be one of: ${ticketStatuses.join(', ')}`),
  
  body('assigned_to')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      return objectIdPattern.test(value);
    })
    .withMessage('Invalid admin ID format'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .if(body('tags').exists())
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  body('resolution_note')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Resolution note cannot exceed 2000 characters'),
  
  body('resolution_type')
    .optional()
    .isIn(['SOLVED', 'WORKAROUND', 'DUPLICATE', 'INVALID', 'WONT_FIX', 'USER_ERROR'])
    .withMessage('Invalid resolution type'),
  
  body('internal_note')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Internal note cannot exceed 2000 characters')
];

/**
 * Validation for adding a message (admin)
 */
const addAdminMessageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters long'),
  
  body('message_type')
    .optional()
    .isIn(messageTypes)
    .withMessage(`Message type must be one of: ${messageTypes.join(', ')}`),
  
  body('is_internal')
    .optional()
    .isBoolean()
    .withMessage('is_internal must be a boolean value'),
  
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 attachments allowed per message'),
  
  body('attachments.*.filename')
    .if(body('attachments').exists())
    .notEmpty()
    .withMessage('Attachment filename is required'),
  
  body('attachments.*.file_url')
    .if(body('attachments').exists())
    .isURL()
    .withMessage('Attachment file URL must be valid')
];

/**
 * Validation for assigning a ticket
 */
const assignTicketValidation = [
  body('admin_id')
    .matches(objectIdPattern)
    .withMessage('Invalid admin ID format')
];

/**
 * Validation for escalating a ticket
 */
const escalateTicketValidation = [
  body('escalation_reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Escalation reason must be between 10 and 500 characters long')
];

/**
 * Validation for adding internal notes
 */
const addInternalNoteValidation = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Note must be between 1 and 2000 characters long')
];

/**
 * Validation for admin ticket filters
 */
const adminTicketFiltersValidation = [
  query('status')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(v => ticketStatuses.includes(v));
      }
      return ticketStatuses.includes(value);
    })
    .withMessage(`Status must be one of: ${ticketStatuses.join(', ')}`),
  
  query('category')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(v => ticketCategories.includes(v));
      }
      return ticketCategories.includes(value);
    })
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  query('priority')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(v => ticketPriorities.includes(v));
      }
      return ticketPriorities.includes(value);
    })
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  query('assigned_to')
    .optional()
    .custom((value) => {
      if (value === 'unassigned') return true;
      return objectIdPattern.test(value);
    })
    .withMessage('Invalid admin ID format'),
  
  query('user_id')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid user ID format'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for date_from'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for date_to'),
  
  query('overdue_only')
    .optional()
    .isBoolean()
    .withMessage('overdue_only must be a boolean value'),
  
  query('escalated_only')
    .optional()
    .isBoolean()
    .withMessage('escalated_only must be a boolean value'),
  
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'last_activity_at', 'priority', 'status', 'ticket_number', 'user.name', 'assigned_to.assigned_at'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
];

/**
 * Validation for bulk update operations
 */
const bulkUpdateValidation = [
  body('ticket_ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('ticket_ids must be an array with 1-100 items'),
  
  body('ticket_ids.*')
    .matches(objectIdPattern)
    .withMessage('Invalid ticket ID format'),
  
  body('updates')
    .isObject()
    .withMessage('Updates must be an object'),
  
  body('updates.status')
    .optional()
    .isIn(ticketStatuses)
    .withMessage(`Status must be one of: ${ticketStatuses.join(', ')}`),
  
  body('updates.priority')
    .optional()
    .isIn(ticketPriorities)
    .withMessage(`Priority must be one of: ${ticketPriorities.join(', ')}`),
  
  body('updates.category')
    .optional()
    .isIn(ticketCategories)
    .withMessage(`Category must be one of: ${ticketCategories.join(', ')}`),
  
  body('updates.assigned_to')
    .optional()
    .matches(objectIdPattern)
    .withMessage('Invalid admin ID format'),
  
  body('updates.tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('updates.tags.*')
    .if(body('updates.tags').exists())
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

/**
 * Common pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Parameter validation for ticket ID
 */
const ticketIdValidation = [
  param('id')
    .matches(objectIdPattern)
    .withMessage('Invalid ticket ID format')
];

module.exports = {
  // User validations
  createSupportTicketValidation,
  updateSupportTicketValidation,
  addMessageValidation,
  closeSupportTicketValidation,
  supportTicketFiltersValidation,
  
  // Admin validations
  createAdminSupportTicketValidation,
  updateAdminSupportTicketValidation,
  addAdminMessageValidation,
  assignTicketValidation,
  escalateTicketValidation,
  addInternalNoteValidation,
  adminTicketFiltersValidation,
  bulkUpdateValidation,
  
  // Common validations
  paginationValidation,
  ticketIdValidation
};
