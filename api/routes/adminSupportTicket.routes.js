/**
 * Admin Support Ticket Routes
 * Routes for admin-side support ticket management in admin dashboard
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Import controller
const adminSupportTicketController = require('../controllers/adminSupportTicket.controller');

// Import validation schemas
const {
  createAdminSupportTicketValidation,
  updateAdminSupportTicketValidation,
  addAdminMessageValidation,
  assignTicketValidation,
  escalateTicketValidation,
  addInternalNoteValidation,
  bulkUpdateValidation,
  adminTicketFiltersValidation,
  paginationValidation
} = require('../validations/adminSupportTicket.validation');

/**
 * @route GET /api/v1/admin/support-tickets/analytics
 * @desc Get support ticket analytics and insights
 * @access Private (admin only)
 */
router.get(
  '/analytics',
  authenticate,
  authorize(['admin', 'support']),
  adminSupportTicketController.getSupportTicketAnalytics
);

/**
 * @route GET /api/v1/admin/support-tickets/overdue
 * @desc Get overdue support tickets
 * @access Private (admin only)
 */
router.get(
  '/overdue',
  authenticate,
  authorize(['admin', 'support']),
  adminSupportTicketController.getOverdueTickets
);

/**
 * @route POST /api/v1/admin/support-tickets/bulk-update
 * @desc Bulk update multiple support tickets
 * @access Private (admin only)
 */
router.post(
  '/bulk-update',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(bulkUpdateValidation),
  adminSupportTicketController.bulkUpdateTickets
);

/**
 * @route GET /api/v1/admin/support-tickets
 * @desc Get all support tickets with advanced filtering, search, and pagination
 * @access Private (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(paginationValidation),
  validateRequest(adminTicketFiltersValidation),
  adminSupportTicketController.getAllSupportTickets
);

/**
 * @route POST /api/v1/admin/support-tickets
 * @desc Create a new support ticket (admin-created)
 * @access Private (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(createAdminSupportTicketValidation),
  adminSupportTicketController.createSupportTicket
);

/**
 * @route GET /api/v1/admin/support-tickets/:id
 * @desc Get a specific support ticket by ID (full admin view)
 * @access Private (admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'support']),
  adminSupportTicketController.getSupportTicketById
);

/**
 * @route PATCH /api/v1/admin/support-tickets/:id
 * @desc Update a support ticket
 * @access Private (admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(updateAdminSupportTicketValidation),
  adminSupportTicketController.updateSupportTicket
);

/**
 * @route DELETE /api/v1/admin/support-tickets/:id
 * @desc Delete a support ticket (admin only, with confirmation)
 * @access Private (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  adminSupportTicketController.deleteSupportTicket
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/messages
 * @desc Add a message/reply to a support ticket
 * @access Private (admin only)
 */
router.post(
  '/:id/messages',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(addAdminMessageValidation),
  adminSupportTicketController.addMessageToTicket
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/assign
 * @desc Assign a support ticket to an admin
 * @access Private (admin only)
 */
router.post(
  '/:id/assign',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(assignTicketValidation),
  adminSupportTicketController.assignSupportTicket
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/escalate
 * @desc Escalate a support ticket
 * @access Private (admin only)
 */
router.post(
  '/:id/escalate',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(escalateTicketValidation),
  adminSupportTicketController.escalateSupportTicket
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/internal-notes
 * @desc Add internal note to a support ticket
 * @access Private (admin only)
 */
router.post(
  '/:id/internal-notes',
  authenticate,
  authorize(['admin', 'support']),
  validateRequest(addInternalNoteValidation),
  adminSupportTicketController.addInternalNote
);

module.exports = router;
