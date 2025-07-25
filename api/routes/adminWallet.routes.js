/**
 * Admin Wallet Routes
 * Routes for admin wallet management (Admin authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllWalletsAdmin,
  getAdminUserWallet,
  getWalletByIdAdmin,
  getAllWalletTransactionsAdmin,
  adjustWalletBalance,
  updateWalletStatus,
  getWalletStatsAdmin
} = require('../controllers/wallet.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

// Import validation
const {
  validateAdjustBalance,
  validateUpdateWalletStatus,
  validateUserId,
  validateAdminTransactionQuery,
  validateGetAllWalletsAdmin,
  validateWalletId
} = require('../middleware/walletValidation');

// Apply authentication middleware first, then admin check
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @route   GET /api/v1/admin/wallet
 * @desc    Get all wallets with filtering and pagination
 * @access  Admin only
 */
router.get('/', validateGetAllWalletsAdmin, getAllWalletsAdmin);

/**
 * @route   GET /api/v1/admin/wallet/stats
 * @desc    Get wallet statistics (admin overview)
 * @access  Admin only
 */
router.get('/stats', getWalletStatsAdmin);

/**
 * @route   GET /api/v1/admin/wallets/transactions
 * @desc    Get all wallet transactions (admin view)
 * @access  Admin only
 */
router.get('/transactions', validateAdminTransactionQuery, getAllWalletTransactionsAdmin);

/**
 * @route   GET /api/v1/admin/wallets/user/:userId
 * @desc    Get specific user's wallet details
 * @access  Admin only
 */
router.get('/user/:userId', validateUserId, getAdminUserWallet);

/**
 * @route   GET /api/v1/admin/wallets/:walletId
 * @desc    Get wallet details by wallet ID
 * @access  Admin only
 */
router.get('/:walletId', validateWalletId, getWalletByIdAdmin);

/**
 * @route   POST /api/v1/admin/wallets/user/:userId/adjust
 * @desc    Adjust user's wallet balance (credit/debit)
 * @access  Admin only
 */
router.post('/user/:userId/adjust', validateAdjustBalance, adjustWalletBalance);

/**
 * @route   PATCH /api/v1/admin/wallets/user/:userId/status
 * @desc    Update user's wallet status (active/blocked/inactive)
 * @access  Admin only
 */
router.patch('/user/:userId/status', validateUpdateWalletStatus, updateWalletStatus);

module.exports = router;
