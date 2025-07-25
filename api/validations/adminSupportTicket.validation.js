/**
 * Admin Support Ticket Validation Schemas
 * Joi validation schemas for admin support ticket operations
 */

const Joi = require('joi');

// Re-export all validations from supportTicket.validation.js for admin use
const {
  createAdminSupportTicketValidation,
  updateAdminSupportTicketValidation,
  addAdminMessageValidation,
  assignTicketValidation,
  escalateTicketValidation,
  addInternalNoteValidation,
  adminTicketFiltersValidation,
  bulkUpdateValidation,
  paginationValidation
} = require('./supportTicket.validation');

module.exports = {
  createAdminSupportTicketValidation,
  updateAdminSupportTicketValidation,
  addAdminMessageValidation,
  assignTicketValidation,
  escalateTicketValidation,
  addInternalNoteValidation,
  adminTicketFiltersValidation,
  bulkUpdateValidation,
  paginationValidation
};
