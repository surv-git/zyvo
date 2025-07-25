/**
 * User Support Ticket Routes
 * Routes for user-side support ticket operations in e-commerce portal
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');

// Import controller
const userSupportTicketController = require('../controllers/userSupportTicket.controller');

// Import validation schemas
const {
  createSupportTicketValidation,
  addMessageValidation,
  updateSupportTicketValidation,
  closeSupportTicketValidation,
  paginationValidation,
  supportTicketFiltersValidation
} = require('../validations/supportTicket.validation');

/**
 * @route GET /api/v1/user/support-tickets/options
 * @desc Get available ticket categories, priorities, and statuses
 * @access Private (authenticated users)
 */
router.get(
  '/options',
  authenticate,
  userSupportTicketController.getTicketOptions
);

/**
 * @route GET /api/v1/user/support-tickets/stats
 * @desc Get user's ticket statistics
 * @access Private (authenticated users)
 */
router.get(
  '/stats',
  authenticate,
  userSupportTicketController.getUserTicketStats
);

/**
 * @route GET /api/v1/user/support-tickets
 * @desc Get user's support tickets with pagination and filtering
 * @access Private (authenticated users)
 */
router.get(
  '/',
  authenticate,
  validateRequest(paginationValidation),
  validateRequest(supportTicketFiltersValidation),
  userSupportTicketController.getUserSupportTickets
);

/**
 * @route POST /api/v1/user/support-tickets
 * @desc Create a new support ticket
 * @access Private (authenticated users)
 */
router.post(
  '/',
  authenticate,
  validateRequest(createSupportTicketValidation),
  userSupportTicketController.createSupportTicket
);

/**
 * @route GET /api/v1/user/support-tickets/:id
 * @desc Get a specific support ticket by ID
 * @access Private (authenticated users - own tickets only)
 */
router.get(
  '/:id',
  authenticate,
  userSupportTicketController.getSupportTicketById
);

/**
 * @route PATCH /api/v1/user/support-tickets/:id
 * @desc Update a support ticket (limited fields for users)
 * @access Private (authenticated users - own tickets only)
 */
router.patch(
  '/:id',
  authenticate,
  validateRequest(updateSupportTicketValidation),
  userSupportTicketController.updateSupportTicket
);

/**
 * @route POST /api/v1/user/support-tickets/:id/messages
 * @desc Add a message/reply to a support ticket
 * @access Private (authenticated users - own tickets only)
 */
router.post(
  '/:id/messages',
  authenticate,
  validateRequest(addMessageValidation),
  userSupportTicketController.addMessageToTicket
);

/**
 * @route POST /api/v1/user/support-tickets/:id/close
 * @desc Close a support ticket with optional satisfaction rating
 * @access Private (authenticated users - own tickets only)
 */
router.post(
  '/:id/close',
  authenticate,
  validateRequest(closeSupportTicketValidation),
  userSupportTicketController.closeSupportTicket
);

module.exports = router;
