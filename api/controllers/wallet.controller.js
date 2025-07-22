/**
 * Wallet Controller
 * Handles all wallet operations for users and admins
 */

const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');
const {
  performAtomicWalletTransaction,
  processTopupCompletion,
  processAdminAdjustment,
  validateTransactionAmount,
  formatCurrency,
  checkTransactionLimits,
  getTransactionSummary
} = require('../utils/walletHelpers');

/**
 * USER CONTROLLERS
 */

/**
 * Get Wallet Balance
 * @route GET /api/v1/user/wallet/balance
 * @access User only
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get or create wallet for user
    const wallet = await Wallet.findOrCreateUserWallet(userId);

    // Log user activity
    userActivityLogger.info('Wallet balance viewed', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'VIEW_WALLET_BALANCE',
      resource_type: 'Wallet',
      resource_id: wallet._id,
      details: {
        balance: wallet.getBalance(),
        currency: wallet.currency,
        status: wallet.status
      }
    });

    res.json({
      success: true,
      data: {
        wallet_id: wallet._id,
        balance: wallet.getBalance(),
        currency: wallet.currency,
        formatted_balance: wallet.getFormattedBalance(),
        status: wallet.status,
        last_transaction_at: wallet.last_transaction_at
      }
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    next(error);
  }
};

/**
 * Get Wallet Transactions
 * @route GET /api/v1/user/wallet/transactions
 * @access User only
 */
const getWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      transaction_type,
      status,
      reference_type,
      start_date,
      end_date,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Get transactions with filtering
    const [transactions, totalCount] = await Promise.all([
      WalletTransaction.getUserTransactions(userId, {
        page: pageNum,
        limit: limitNum,
        transaction_type,
        status,
        reference_type,
        start_date,
        end_date,
        sortBy: sort_by,
        sortOrder: sort_order
      }),
      WalletTransaction.countUserTransactions(userId, {
        ...(transaction_type && { transaction_type }),
        ...(status && { status }),
        ...(reference_type && { reference_type }),
        ...(start_date || end_date) && {
          createdAt: {
            ...(start_date && { $gte: new Date(start_date) }),
            ...(end_date && { $lte: new Date(end_date) })
          }
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limitNum,
        has_next_page: pageNum < totalPages,
        has_prev_page: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    next(error);
  }
};

/**
 * Initiate Wallet Top-up
 * @route POST /api/v1/user/wallet/topup/initiate
 * @access User only
 */
const initiateTopup = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, payment_method } = req.body;
    const userId = req.user.id;

    // Validate amount
    const amountValidation = validateTransactionAmount(amount, 'INR');
    if (!amountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.error
      });
    }

    // Check transaction limits
    const limitCheck = await checkTransactionLimits(userId, amountValidation.amount, 'CREDIT');
    if (!limitCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: limitCheck.error,
        limits: {
          daily_limit: limitCheck.dailyLimit,
          today_total: limitCheck.todayTotal,
          remaining_limit: limitCheck.remainingLimit
        }
      });
    }

    // Get or create wallet
    const wallet = await Wallet.findOrCreateUserWallet(userId);

    if (!wallet.canTransact()) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is not active for transactions'
      });
    }

    // Generate gateway transaction ID (simulate)
    const gatewayTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction
    const transaction = await WalletTransaction.createTransaction({
      wallet_id: wallet._id,
      user_id: userId,
      transaction_type: 'CREDIT',
      amount: amountValidation.amount,
      currency: wallet.currency,
      description: 'Wallet Top-up',
      reference_type: 'PAYMENT_GATEWAY',
      reference_id: gatewayTransactionId,
      initiated_by_actor: 'USER',
      payment_method,
      gateway_transaction_id: gatewayTransactionId
    });

    // Log user activity
    userActivityLogger.info('Wallet topup initiated', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'INITIATE_WALLET_TOPUP',
      resource_type: 'WalletTransaction',
      resource_id: transaction._id,
      details: {
        amount: amountValidation.amount,
        currency: wallet.currency,
        payment_method,
        gateway_transaction_id: gatewayTransactionId
      }
    });

    // In a real implementation, you would integrate with actual payment gateway here
    // For now, we'll return mock payment gateway data
    res.status(201).json({
      success: true,
      message: 'Top-up initiated successfully',
      data: {
        transaction_id: transaction._id,
        gateway_transaction_id: gatewayTransactionId,
        amount: amountValidation.amount,
        currency: wallet.currency,
        payment_method,
        status: 'PENDING',
        // Mock payment gateway response
        payment_url: `https://mock-gateway.com/pay/${gatewayTransactionId}`,
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

  } catch (error) {
    console.error('Error initiating wallet topup:', error);
    next(error);
  }
};

/**
 * Handle Top-up Callback (Payment Gateway Webhook)
 * @route POST /api/v1/wallet/topup/callback
 * @access Internal (Payment Gateway)
 */
const handleTopupCallback = async (req, res, next) => {
  try {
    const {
      gateway_transaction_id,
      status,
      amount,
      currency,
      failure_reason,
      gateway_response
    } = req.body;

    // In a real implementation, you would verify the webhook signature here
    // For now, we'll process the callback directly

    const isSuccess = status === 'SUCCESS' || status === 'COMPLETED';

    const result = await processTopupCompletion(
      gateway_transaction_id,
      gateway_response || req.body,
      isSuccess
    );

    if (result.success) {
      // Log successful topup
      userActivityLogger.info('Wallet topup completed', {
        user_id: result.transaction.user_id,
        action_type: 'COMPLETE_WALLET_TOPUP',
        resource_type: 'WalletTransaction',
        resource_id: result.transaction._id,
        details: {
          amount: result.transaction.getAmount(),
          new_balance: result.newBalance,
          gateway_transaction_id
        }
      });

      res.json({
        success: true,
        message: 'Top-up completed successfully',
        data: {
          transaction_id: result.transaction._id,
          new_balance: result.newBalance,
          amount: result.transaction.getAmount()
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Top-up failed',
        error: result.error,
        transaction_id: result.transaction._id
      });
    }

  } catch (error) {
    console.error('Error handling topup callback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error processing callback'
    });
  }
};

/**
 * Get Wallet Transaction Summary
 * @route GET /api/v1/user/wallet/summary
 * @access User only
 */
const getWalletSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [summary, stats] = await Promise.all([
      getTransactionSummary(userId, startDate, endDate),
      WalletTransaction.getUserTransactionStats(userId, parseInt(days))
    ]);

    res.json({
      success: true,
      data: {
        period: {
          days: parseInt(days),
          start_date: startDate,
          end_date: endDate
        },
        summary,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    next(error);
  }
};

/**
 * ADMIN CONTROLLERS
 */

/**
 * Get User Wallet Details (Admin)
 * @route GET /api/v1/admin/wallet/:userId
 * @access Admin only
 */
const getAdminUserWallet = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const wallet = await Wallet.findOne({ user_id: userId })
      .populate('user_id', 'name email phone');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for user'
      });
    }

    // Get recent transactions
    const recentTransactions = await WalletTransaction.find({
      user_id: userId
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        wallet,
        recent_transactions: recentTransactions
      }
    });

  } catch (error) {
    console.error('Error fetching admin user wallet:', error);
    next(error);
  }
};

/**
 * Get All Wallet Transactions (Admin)
 * @route GET /api/v1/admin/wallet/transactions
 * @access Admin only
 */
const getAllWalletTransactionsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      wallet_id,
      transaction_type,
      status,
      reference_type,
      initiated_by_actor,
      start_date,
      end_date,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (user_id) query.user_id = user_id;
    if (wallet_id) query.wallet_id = wallet_id;
    if (transaction_type) query.transaction_type = transaction_type;
    if (status) query.status = status;
    if (reference_type) query.reference_type = reference_type;
    if (initiated_by_actor) query.initiated_by_actor = initiated_by_actor;

    // Date range filter
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) query.createdAt.$gte = new Date(start_date);
      if (end_date) query.createdAt.$lte = new Date(end_date);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sort_by]: sort_order === 'desc' ? -1 : 1 };

    const [transactions, totalCount] = await Promise.all([
      WalletTransaction.find(query)
        .populate('user_id', 'name email')
        .populate('wallet_id', 'currency status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      WalletTransaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limitNum,
        has_next_page: pageNum < totalPages,
        has_prev_page: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching admin wallet transactions:', error);
    next(error);
  }
};

/**
 * Adjust Wallet Balance (Admin)
 * @route POST /api/v1/admin/wallet/:userId/adjust
 * @access Admin only
 */
const adjustWalletBalance = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { amount, type, description } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Validate amount
    const amountValidation = validateTransactionAmount(amount, 'INR');
    if (!amountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.error
      });
    }

    // Process admin adjustment
    const result = await processAdminAdjustment(
      userId,
      amountValidation.amount,
      type,
      description,
      adminId
    );

    // Log admin action
    adminAuditLogger.info('Wallet balance adjusted', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'ADJUST_WALLET_BALANCE',
      resource_type: 'Wallet',
      resource_id: result.wallet._id,
      details: {
        target_user_id: userId,
        adjustment_type: type,
        amount: amountValidation.amount,
        description,
        old_balance: result.wallet.getBalance() - (type === 'CREDIT' ? amountValidation.amount : -amountValidation.amount),
        new_balance: result.wallet.getBalance()
      }
    });

    res.json({
      success: true,
      message: 'Wallet balance adjusted successfully',
      data: {
        transaction_id: result.transaction._id,
        wallet_id: result.wallet._id,
        adjustment_type: type,
        amount: amountValidation.amount,
        new_balance: result.newBalance,
        description
      }
    });

  } catch (error) {
    console.error('Error adjusting wallet balance:', error);
    if (error.message === 'Insufficient wallet balance') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance for debit adjustment'
      });
    }
    next(error);
  }
};

/**
 * Update Wallet Status (Admin)
 * @route PATCH /api/v1/admin/wallet/:userId/status
 * @access Admin only
 */
const updateWalletStatus = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for user'
      });
    }

    const oldStatus = wallet.status;
    wallet.status = status;
    await wallet.save();

    // Log admin action
    adminAuditLogger.info('Wallet status updated', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'UPDATE_WALLET_STATUS',
      resource_type: 'Wallet',
      resource_id: wallet._id,
      details: {
        target_user_id: userId,
        old_status: oldStatus,
        new_status: status
      }
    });

    res.json({
      success: true,
      message: 'Wallet status updated successfully',
      data: {
        wallet_id: wallet._id,
        user_id: userId,
        old_status: oldStatus,
        new_status: status,
        updated_at: wallet.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating wallet status:', error);
    next(error);
  }
};

/**
 * Get Wallet Statistics (Admin)
 * @route GET /api/v1/admin/wallet/stats
 * @access Admin only
 */
const getWalletStatsAdmin = async (req, res, next) => {
  try {
    const [walletStats, transactionSummary] = await Promise.all([
      Wallet.getWalletStats(),
      WalletTransaction.getTransactionSummary()
    ]);

    res.json({
      success: true,
      data: {
        wallet_stats: walletStats,
        transaction_summary: transactionSummary
      }
    });

  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    next(error);
  }
};

module.exports = {
  // User controllers
  getWalletBalance,
  getWalletTransactions,
  initiateTopup,
  handleTopupCallback,
  getWalletSummary,

  // Admin controllers
  getAdminUserWallet,
  getAllWalletTransactionsAdmin,
  adjustWalletBalance,
  updateWalletStatus,
  getWalletStatsAdmin
};
