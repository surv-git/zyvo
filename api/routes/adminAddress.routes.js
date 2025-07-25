/**
 * Admin Address Routes
 * Routes for admin address management
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

const { 
  validateAddress, 
  validateAddressUpdate, 
  validateAddressId, 
  validateUserId,
  validateGetAddressesQuery 
} = require('../middleware/addressValidation');

// Apply authentication middleware first, then admin check
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * GET /api/v1/admin/addresses
 * Get all addresses with filtering and pagination (Admin only)
 */
router.get(
  '/',
  validateGetAddressesQuery,
  addressController.getAllAddressesAdmin
);

/**
 * GET /api/v1/admin/addresses/user/:userId
 * Get all addresses for specific user (Admin only)
 */
router.get(
  '/user/:userId',
  validateUserId,
  validateGetAddressesQuery,
  addressController.getUserAddressesAdmin
);

/**
 * GET /api/v1/admin/addresses/:addressId
 * Get specific address details (Admin only)
 */
router.get(
  '/:addressId',
  validateAddressId,
  addressController.getAddressAdmin
);

/**
 * PUT /api/v1/admin/addresses/:addressId
 * Update specific address (Admin only)
 */
router.put(
  '/:addressId',
  validateAddressId,
  validateAddressUpdate,
  addressController.updateAddressAdmin
);

/**
 * DELETE /api/v1/admin/addresses/:addressId
 * Delete specific address (Admin only)
 */
router.delete(
  '/:addressId',
  validateAddressId,
  addressController.deleteAddressAdmin
);

module.exports = router;
