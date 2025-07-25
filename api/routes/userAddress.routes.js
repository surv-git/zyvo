/**
 * User Address Routes
 * Routes for user address management
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

const { 
  validateAddress, 
  validateAddressUpdate, 
  validateAddressId, 
  validateGetAddressesQuery 
} = require('../middleware/addressValidation');

// Apply authentication middleware
router.use(authMiddleware);

/**
 * GET /api/v1/user/addresses
 * Get all addresses for authenticated user
 */
router.get(
  '/', 
  validateGetAddressesQuery,
  addressController.getUserAddresses
);

/**
 * GET /api/v1/user/addresses/:addressId
 * Get specific address for authenticated user
 */
router.get(
  '/:addressId',
  validateAddressId,
  addressController.getUserAddress
);

/**
 * POST /api/v1/user/addresses
 * Create new address for authenticated user
 */
router.post(
  '/',
  validateAddress,
  addressController.createUserAddress
);

/**
 * PUT /api/v1/user/addresses/:addressId
 * Update specific address for authenticated user
 */
router.put(
  '/:addressId',
  validateAddressId,
  validateAddressUpdate,
  addressController.updateUserAddress
);

/**
 * DELETE /api/v1/user/addresses/:addressId
 * Delete specific address for authenticated user
 */
router.delete(
  '/:addressId',
  validateAddressId,
  addressController.deleteUserAddress
);

/**
 * PATCH /api/v1/user/addresses/:addressId/default
 * Set specific address as default for authenticated user
 */
router.patch(
  '/:addressId/default',
  validateAddressId,
  addressController.setDefaultAddress
);

module.exports = router;
