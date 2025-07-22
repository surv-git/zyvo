/**
 * User Wallet Routes
 * Routes for user wallet management (User authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getWalletBalance,
  getWalletTransactions,
  initiateTopup,
  getWalletSummary
} = require('../controllers/wallet.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Import validation
const {
  validateInitiateTopup,
  validateTransactionQuery,
  validateSummaryQuery
} = require('../middleware/walletValidation');

// Apply user authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/user/wallet/balance
 * @desc    Get user's wallet balance
 * @access  User only
 */
router.get('/balance', getWalletBalance);

/**
 * @route   GET /api/v1/user/wallet/transactions
 * @desc    Get user's wallet transactions with filtering and pagination
 * @access  User only
 */
router.get('/transactions', validateTransactionQuery, getWalletTransactions);

/**
 * @route   GET /api/v1/user/wallet/summary
 * @desc    Get user's wallet transaction summary
 * @access  User only
 */
router.get('/summary', validateSummaryQuery, getWalletSummary);

/**
 * @route   POST /api/v1/user/wallet/topup/initiate
 * @desc    Initiate wallet top-up process
 * @access  User only
 */
router.post('/topup/initiate', validateInitiateTopup, initiateTopup);

module.exports = router;
