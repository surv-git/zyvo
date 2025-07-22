/**
 * Wallet Helper Utilities
 * Common functions for wallet and transaction management
 */

const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Perform atomic wallet transaction with MongoDB session
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} - Transaction result
 */
const performAtomicWalletTransaction = async (transactionData) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const {
      userId,
      amount,
      transactionType,
      description,
      referenceType = null,
      referenceId = null,
      initiatedByActor = 'USER',
      paymentMethod = null,
      gatewayTransactionId = null,
      metadata = {}
    } = transactionData;

    // Get or create user wallet
    const wallet = await Wallet.findOrCreateUserWallet(userId);
    
    if (!wallet.canTransact()) {
      throw new Error('Wallet is not active for transactions');
    }

    // Check sufficient balance for debit transactions
    if (transactionType === 'DEBIT' && !wallet.hasSufficientBalance(amount)) {
      throw new Error('Insufficient wallet balance');
    }

    // Create pending transaction record
    const transaction = await WalletTransaction.createTransaction({
      wallet_id: wallet._id,
      user_id: userId,
      transaction_type: transactionType,
      amount,
      currency: wallet.currency,
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      initiated_by_actor: initiatedByActor,
      payment_method: paymentMethod,
      gateway_transaction_id: gatewayTransactionId,
      metadata
    });

    // Perform atomic balance update
    const updatedWallet = await Wallet.atomicBalanceUpdate(
      wallet._id,
      amount,
      transactionType,
      session
    );

    // Update transaction with new balance and mark as completed
    transaction.current_balance_after_transaction = updatedWallet.balance;
    transaction.status = 'COMPLETED';
    transaction.completedAt = new Date();
    await transaction.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      transaction,
      wallet: updatedWallet,
      newBalance: updatedWallet.getBalance()
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process wallet top-up completion
 * @param {string} gatewayTransactionId - Gateway transaction ID
 * @param {Object} gatewayResponse - Gateway response data
 * @param {boolean} isSuccess - Whether the payment was successful
 * @returns {Promise<Object>} - Processing result
 */
const processTopupCompletion = async (gatewayTransactionId, gatewayResponse, isSuccess) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Find the pending transaction
    const transaction = await WalletTransaction.findOne({
      gateway_transaction_id: gatewayTransactionId,
      status: 'PENDING',
      transaction_type: 'CREDIT'
    });

    if (!transaction) {
      throw new Error('Pending transaction not found');
    }

    // Get the wallet
    const wallet = await Wallet.findById(transaction.wallet_id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (isSuccess) {
      // Update wallet balance atomically
      const updatedWallet = await Wallet.atomicBalanceUpdate(
        wallet._id,
        transaction.getAmount(),
        'CREDIT',
        session
      );

      // Mark transaction as completed
      transaction.status = 'COMPLETED';
      transaction.current_balance_after_transaction = updatedWallet.balance;
      transaction.completedAt = new Date();
      transaction.gateway_response = gatewayResponse;
      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        transaction,
        wallet: updatedWallet,
        newBalance: updatedWallet.getBalance()
      };

    } else {
      // Mark transaction as failed
      transaction.status = 'FAILED';
      transaction.failure_reason = gatewayResponse.failure_reason || 'Payment failed';
      transaction.failedAt = new Date();
      transaction.gateway_response = gatewayResponse;
      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: false,
        transaction,
        error: transaction.failure_reason
      };
    }

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process order payment from wallet
 * @param {string} userId - User ID
 * @param {number} amount - Payment amount
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Payment result
 */
const processOrderPayment = async (userId, amount, orderId) => {
  return performAtomicWalletTransaction({
    userId,
    amount,
    transactionType: 'DEBIT',
    description: `Payment for Order #${orderId}`,
    referenceType: 'ORDER',
    referenceId: orderId,
    initiatedByActor: 'USER'
  });
};

/**
 * Process order refund to wallet
 * @param {string} userId - User ID
 * @param {number} amount - Refund amount
 * @param {string} orderId - Order ID
 * @param {string} refundId - Refund ID
 * @returns {Promise<Object>} - Refund result
 */
const processOrderRefund = async (userId, amount, orderId, refundId) => {
  return performAtomicWalletTransaction({
    userId,
    amount,
    transactionType: 'CREDIT',
    description: `Refund for Order #${orderId}`,
    referenceType: 'REFUND',
    referenceId: refundId,
    initiatedByActor: 'SYSTEM',
    metadata: { original_order_id: orderId }
  });
};

/**
 * Process admin wallet adjustment
 * @param {string} userId - User ID
 * @param {number} amount - Adjustment amount
 * @param {string} transactionType - CREDIT or DEBIT
 * @param {string} description - Adjustment reason
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} - Adjustment result
 */
const processAdminAdjustment = async (userId, amount, transactionType, description, adminId) => {
  return performAtomicWalletTransaction({
    userId,
    amount,
    transactionType,
    description: `Admin Adjustment: ${description}`,
    referenceType: 'ADMIN_ADJUSTMENT',
    referenceId: adminId,
    initiatedByActor: 'ADMIN',
    metadata: { admin_id: adminId }
  });
};

/**
 * Validate transaction amount
 * @param {number} amount - Amount to validate
 * @param {string} currency - Currency code
 * @returns {Object} - Validation result
 */
const validateTransactionAmount = (amount, currency = 'INR') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be a positive number'
    };
  }

  if (numAmount < 0.01) {
    return {
      isValid: false,
      error: 'Amount must be at least 0.01'
    };
  }

  // Currency-specific limits
  const limits = {
    INR: { min: 1, max: 100000 },
    USD: { min: 0.01, max: 1000 },
    EUR: { min: 0.01, max: 1000 },
    GBP: { min: 0.01, max: 1000 }
  };

  const currencyLimit = limits[currency] || limits.INR;
  
  if (numAmount < currencyLimit.min) {
    return {
      isValid: false,
      error: `Amount must be at least ${currencyLimit.min} ${currency}`
    };
  }

  if (numAmount > currencyLimit.max) {
    return {
      isValid: false,
      error: `Amount cannot exceed ${currencyLimit.max} ${currency}`
    };
  }

  return {
    isValid: true,
    amount: numAmount
  };
};

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted amount
 */
const formatCurrency = (amount, currency = 'INR') => {
  const locales = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'en-EU',
    GBP: 'en-GB'
  };

  const locale = locales[currency] || 'en-IN';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Generate transaction description based on type and reference
 * @param {string} transactionType - CREDIT or DEBIT
 * @param {string} referenceType - Reference type
 * @param {string} referenceId - Reference ID
 * @returns {string} - Generated description
 */
const generateTransactionDescription = (transactionType, referenceType, referenceId) => {
  const descriptions = {
    CREDIT: {
      PAYMENT_GATEWAY: 'Wallet Top-up',
      REFUND: `Refund for Order #${referenceId}`,
      ADMIN_ADJUSTMENT: 'Admin Credit Adjustment',
      WITHDRAWAL: 'Withdrawal Reversal'
    },
    DEBIT: {
      ORDER: `Payment for Order #${referenceId}`,
      WITHDRAWAL: 'Wallet Withdrawal',
      ADMIN_ADJUSTMENT: 'Admin Debit Adjustment'
    }
  };

  return descriptions[transactionType]?.[referenceType] || 
         `${transactionType} Transaction`;
};

/**
 * Check wallet transaction limits
 * @param {string} userId - User ID
 * @param {number} amount - Transaction amount
 * @param {string} transactionType - CREDIT or DEBIT
 * @returns {Promise<Object>} - Limit check result
 */
const checkTransactionLimits = async (userId, amount, transactionType) => {
  // Daily limits
  const dailyLimits = {
    CREDIT: 50000, // INR
    DEBIT: 25000   // INR
  };

  // Get today's transactions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayTransactions = await WalletTransaction.find({
    user_id: userId,
    transaction_type: transactionType,
    status: 'COMPLETED',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const todayTotal = todayTransactions.reduce((sum, txn) => 
    sum + txn.getAmount(), 0);

  const dailyLimit = dailyLimits[transactionType];
  const remainingLimit = dailyLimit - todayTotal;

  if (amount > remainingLimit) {
    return {
      allowed: false,
      error: `Daily ${transactionType.toLowerCase()} limit exceeded. Remaining: ${formatCurrency(remainingLimit, 'INR')}`,
      dailyLimit,
      todayTotal,
      remainingLimit
    };
  }

  return {
    allowed: true,
    dailyLimit,
    todayTotal,
    remainingLimit
  };
};

/**
 * Get wallet transaction summary for a date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Transaction summary
 */
const getTransactionSummary = async (userId, startDate, endDate) => {
  const transactions = await WalletTransaction.find({
    user_id: userId,
    status: 'COMPLETED',
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const summary = {
    totalTransactions: transactions.length,
    totalCredit: 0,
    totalDebit: 0,
    creditCount: 0,
    debitCount: 0,
    byReferenceType: {}
  };

  transactions.forEach(txn => {
    const amount = txn.getAmount();
    
    if (txn.transaction_type === 'CREDIT') {
      summary.totalCredit += amount;
      summary.creditCount++;
    } else {
      summary.totalDebit += amount;
      summary.debitCount++;
    }

    // Group by reference type
    const refType = txn.reference_type || 'OTHER';
    if (!summary.byReferenceType[refType]) {
      summary.byReferenceType[refType] = {
        count: 0,
        totalAmount: 0,
        credit: 0,
        debit: 0
      };
    }
    
    summary.byReferenceType[refType].count++;
    summary.byReferenceType[refType].totalAmount += amount;
    
    if (txn.transaction_type === 'CREDIT') {
      summary.byReferenceType[refType].credit += amount;
    } else {
      summary.byReferenceType[refType].debit += amount;
    }
  });

  return summary;
};

module.exports = {
  performAtomicWalletTransaction,
  processTopupCompletion,
  processOrderPayment,
  processOrderRefund,
  processAdminAdjustment,
  validateTransactionAmount,
  formatCurrency,
  generateTransactionDescription,
  checkTransactionLimits,
  getTransactionSummary
};
