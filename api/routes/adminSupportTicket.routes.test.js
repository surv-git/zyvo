/**
 * Admin Support Ticket Routes - Test Version
 * Routes for admin-side support ticket management in admin dashboard
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Import controller
const adminSupportTicketController = require('../controllers/adminSupportTicket.controller');

// Inline authorization helper
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

/**
 * @route GET /api/v1/admin/support-tickets
 * @desc Get all support tickets with filters and pagination for admin
 * @access Private (admin only)
 */
router.get(
  '/',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.getAllSupportTickets
);

/**
 * @route GET /api/v1/admin/support-tickets/analytics
 * @desc Get support ticket analytics and insights
 * @access Private (admin only)
 */
router.get(
  '/analytics',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.getSupportTicketAnalytics
);

/**
 * @route GET /api/v1/admin/support-tickets/overdue
 * @desc Get overdue tickets
 * @access Private (admin only)
 */
router.get(
  '/overdue',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.getOverdueTickets
);

/**
 * @route GET /api/v1/admin/support-tickets/:id
 * @desc Get single support ticket by ID for admin
 * @access Private (admin only)
 */
router.get(
  '/:id',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.getSupportTicketById
);

/**
 * @route PUT /api/v1/admin/support-tickets/:id
 * @desc Update support ticket
 * @access Private (admin only)
 */
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.updateSupportTicket
);

/**
 * @route PUT /api/v1/admin/support-tickets/:id/assign
 * @desc Assign ticket to admin
 * @access Private (admin only)
 */
router.put(
  '/:id/assign',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.assignTicket
);

/**
 * @route PUT /api/v1/admin/support-tickets/:id/status
 * @desc Update ticket status
 * @access Private (admin only)
 */
router.put(
  '/:id/status',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.updateTicketStatus
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/messages
 * @desc Add message/response to ticket
 * @access Private (admin only)
 */
router.post(
  '/:id/messages',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.addMessageToTicket
);

/**
 * @route POST /api/v1/admin/support-tickets/:id/notes
 * @desc Add internal note to ticket
 * @access Private (admin only)
 */
router.post(
  '/:id/notes',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.addInternalNote
);

/**
 * @route PUT /api/v1/admin/support-tickets/:id/escalate
 * @desc Escalate ticket
 * @access Private (admin only)
 */
router.put(
  '/:id/escalate',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.escalateTicket
);

/**
 * @route DELETE /api/v1/admin/support-tickets/:id
 * @desc Delete support ticket (soft delete)
 * @access Private (admin only)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.deleteSupportTicket
);

/**
 * @route PUT /api/v1/admin/support-tickets/bulk/status
 * @desc Bulk update ticket status
 * @access Private (admin only)
 */
router.put(
  '/bulk/status',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.bulkUpdateStatus
);

/**
 * @route PUT /api/v1/admin/support-tickets/bulk/assign
 * @desc Bulk assign tickets
 * @access Private (admin only)
 */
router.put(
  '/bulk/assign',
  authMiddleware,
  requireAdmin,
  adminSupportTicketController.bulkAssignTickets
);

module.exports = router;
