/**
 * User Support Ticket Routes - Test Version
 * Routes for user-side support ticket operations in e-commerce portal
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Import controller
const userSupportTicketController = require('../controllers/userSupportTicket.controller');

/**
 * @route GET /api/v1/user/support-tickets/options
 * @desc Get available ticket categories, priorities, and statuses
 * @access Private (authenticated users)
 */
router.get(
  '/options',
  authMiddleware,
  userSupportTicketController.getTicketOptions
);

/**
 * @route GET /api/v1/user/support-tickets/stats
 * @desc Get user's ticket statistics
 * @access Private (authenticated users)
 */
router.get(
  '/stats',
  authMiddleware,
  userSupportTicketController.getUserTicketStats
);

/**
 * @route GET /api/v1/user/support-tickets
 * @desc Get user's support tickets with pagination and filtering
 * @access Private (authenticated users)
 */
router.get(
  '/',
  authMiddleware,
  userSupportTicketController.getUserSupportTickets
);

/**
 * @route POST /api/v1/user/support-tickets
 * @desc Create a new support ticket
 * @access Private (authenticated users)
 */
router.post(
  '/',
  authMiddleware,
  userSupportTicketController.createSupportTicket
);

/**
 * @route GET /api/v1/user/support-tickets/:id
 * @desc Get a specific support ticket by ID
 * @access Private (authenticated users - own tickets only)
 */
router.get(
  '/:id',
  authMiddleware,
  userSupportTicketController.getSupportTicketById
);

/**
 * @route PATCH /api/v1/user/support-tickets/:id
 * @desc Update a support ticket (limited fields for users)
 * @access Private (authenticated users - own tickets only)
 */
router.patch(
  '/:id',
  authMiddleware,
  userSupportTicketController.updateSupportTicket
);

/**
 * @route POST /api/v1/user/support-tickets/:id/messages
 * @desc Add a message/reply to a support ticket
 * @access Private (authenticated users - own tickets only)
 */
router.post(
  '/:id/messages',
  authMiddleware,
  userSupportTicketController.addMessageToTicket
);

/**
 * @route POST /api/v1/user/support-tickets/:id/close
 * @desc Close a support ticket with optional satisfaction rating
 * @access Private (authenticated users - own tickets only)
 */
router.post(
  '/:id/close',
  authMiddleware,
  userSupportTicketController.closeSupportTicket
);

module.exports = router;
