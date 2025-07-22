/**
 * WalletTransaction Model
 * Mongoose schema for wallet transaction history
 * Stores every transaction associated with wallets for complete audit trail
 */

const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  // Core identification
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Transaction details
  transaction_type: {
    type: String,
    required: true,
    enum: ['CREDIT', 'DEBIT'],
    index: true
  },

  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: [0.01, 'Amount must be at least 0.01'],
    get: function(value) {
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    uppercase: true
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [250, 'Description cannot exceed 250 characters']
  },

  // Reference details for linking to other entities
  reference_type: {
    type: String,
    enum: ['ORDER', 'REFUND', 'PAYMENT_GATEWAY', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL'],
    default: null,
    index: true
  },

  reference_id: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    default: null,
    index: true
  },

  // Balance tracking for audit trail
  current_balance_after_transaction: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    get: function(value) {
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  // Transaction status
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'],
    default: 'PENDING',
    index: true
  },

  // Actor tracking
  initiated_by_actor: {
    type: String,
    required: true,
    enum: ['USER', 'ADMIN', 'SYSTEM'],
    index: true
  },

  // Failure handling
  failure_reason: {
    type: String,
    trim: true,
    default: null
  },

  // Payment method for gateway transactions
  payment_method: {
    type: String,
    trim: true,
    default: null
  },

  // Gateway specific fields
  gateway_transaction_id: {
    type: String,
    trim: true,
    default: null,
    index: true
  },

  gateway_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  completedAt: {
    type: Date,
    default: null
  },

  failedAt: {
    type: Date,
    default: null
  }
});

// Compound indexes for efficient querying
walletTransactionSchema.index({ wallet_id: 1, createdAt: -1 });
walletTransactionSchema.index({ user_id: 1, createdAt: -1 });
walletTransactionSchema.index({ user_id: 1, status: 1 });
walletTransactionSchema.index({ reference_type: 1, reference_id: 1 });
walletTransactionSchema.index({ status: 1, createdAt: -1 });
walletTransactionSchema.index({ transaction_type: 1, status: 1 });

/**
 * Pre-save middleware
 */
walletTransactionSchema.pre('save', function(next) {
  // Set completion/failure timestamps based on status changes
  if (this.isModified('status')) {
    if (this.status === 'COMPLETED' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === 'FAILED' && !this.failedAt) {
      this.failedAt = new Date();
    }
  }

  next();
});

/**
 * Instance methods
 */

// Check if transaction belongs to a specific user
walletTransactionSchema.methods.belongsToUser = function(userId) {
  return this.user_id.toString() === userId.toString();
};

// Get amount as a number (handles Decimal128 conversion)
walletTransactionSchema.methods.getAmount = function() {
  return this.amount ? parseFloat(this.amount.toString()) : 0;
};

// Get balance after transaction as a number
walletTransactionSchema.methods.getBalanceAfter = function() {
  return this.current_balance_after_transaction ? 
    parseFloat(this.current_balance_after_transaction.toString()) : 0;
};

// Format amount for display
walletTransactionSchema.methods.getFormattedAmount = function() {
  const amount = this.getAmount();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Mark transaction as completed
walletTransactionSchema.methods.markCompleted = function(balanceAfter, metadata = {}) {
  this.status = 'COMPLETED';
  this.current_balance_after_transaction = mongoose.Types.Decimal128.fromString(balanceAfter.toString());
  this.completedAt = new Date();
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

// Mark transaction as failed
walletTransactionSchema.methods.markFailed = function(reason, metadata = {}) {
  this.status = 'FAILED';
  this.failure_reason = reason;
  this.failedAt = new Date();
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

// Mark transaction as rolled back
walletTransactionSchema.methods.markRolledBack = function(reason, metadata = {}) {
  this.status = 'ROLLED_BACK';
  this.failure_reason = reason;
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

/**
 * Static methods
 */

// Create a new transaction
walletTransactionSchema.statics.createTransaction = async function(transactionData) {
  const {
    wallet_id,
    user_id,
    transaction_type,
    amount,
    currency,
    description,
    reference_type = null,
    reference_id = null,
    initiated_by_actor,
    payment_method = null,
    gateway_transaction_id = null,
    metadata = {}
  } = transactionData;

  const transaction = new this({
    wallet_id,
    user_id,
    transaction_type,
    amount: mongoose.Types.Decimal128.fromString(amount.toString()),
    currency: currency.toUpperCase(),
    description,
    reference_type,
    reference_id,
    initiated_by_actor,
    payment_method,
    gateway_transaction_id,
    metadata,
    current_balance_after_transaction: mongoose.Types.Decimal128.fromString('0') // Will be updated when completed
  });

  return transaction.save();
};

// Get user transactions with filtering and pagination
walletTransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    transaction_type,
    status,
    reference_type,
    start_date,
    end_date,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { user_id: userId };

  // Apply filters
  if (transaction_type) query.transaction_type = transaction_type;
  if (status) query.status = status;
  if (reference_type) query.reference_type = reference_type;

  // Date range filter
  if (start_date || end_date) {
    query.createdAt = {};
    if (start_date) query.createdAt.$gte = new Date(start_date);
    if (end_date) query.createdAt.$lte = new Date(end_date);
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find(query)
    .populate('wallet_id', 'currency status')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count user transactions with filters
walletTransactionSchema.statics.countUserTransactions = function(userId, filters = {}) {
  const query = { user_id: userId, ...filters };
  return this.countDocuments(query);
};

// Get transaction statistics for a user
walletTransactionSchema.statics.getUserTransactionStats = async function(userId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const stats = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: '$transaction_type',
        count: { $sum: 1 },
        total_amount: { $sum: { $toDouble: '$amount' } }
      }
    }
  ]);

  const result = {
    CREDIT: { count: 0, total_amount: 0 },
    DEBIT: { count: 0, total_amount: 0 }
  };

  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      total_amount: stat.total_amount
    };
  });

  return result;
};

// Find transactions by reference
walletTransactionSchema.statics.findByReference = function(referenceType, referenceId) {
  return this.find({
    reference_type: referenceType,
    reference_id: referenceId
  }).populate('wallet_id user_id');
};

// Get pending transactions
walletTransactionSchema.statics.getPendingTransactions = function(options = {}) {
  const { limit = 100, olderThan } = options;
  const query = { status: 'PENDING' };

  if (olderThan) {
    query.createdAt = { $lt: new Date(Date.now() - olderThan * 60 * 1000) }; // olderThan in minutes
  }

  return this.find(query)
    .populate('wallet_id user_id')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Get transaction summary for admin
walletTransactionSchema.statics.getTransactionSummary = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.start_date || filters.end_date) {
    matchStage.createdAt = {};
    if (filters.start_date) matchStage.createdAt.$gte = new Date(filters.start_date);
    if (filters.end_date) matchStage.createdAt.$lte = new Date(filters.end_date);
  }

  if (filters.status) matchStage.status = filters.status;
  if (filters.transaction_type) matchStage.transaction_type = filters.transaction_type;

  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$transaction_type',
          status: '$status'
        },
        count: { $sum: 1 },
        total_amount: { $sum: { $toDouble: '$amount' } }
      }
    },
    {
      $group: {
        _id: null,
        transactions: {
          $push: {
            type: '$_id.type',
            status: '$_id.status',
            count: '$count',
            total_amount: '$total_amount'
          }
        },
        total_transactions: { $sum: '$count' },
        total_amount: { $sum: '$total_amount' }
      }
    }
  ]);

  return summary.length > 0 ? summary[0] : {
    transactions: [],
    total_transactions: 0,
    total_amount: 0
  };
};

/**
 * Virtual fields
 */
walletTransactionSchema.virtual('amount_formatted').get(function() {
  return this.getFormattedAmount();
});

walletTransactionSchema.virtual('is_completed').get(function() {
  return this.status === 'COMPLETED';
});

walletTransactionSchema.virtual('is_pending').get(function() {
  return this.status === 'PENDING';
});

walletTransactionSchema.virtual('is_failed').get(function() {
  return this.status === 'FAILED';
});

walletTransactionSchema.virtual('processing_time_minutes').get(function() {
  if (!this.completedAt || !this.createdAt) return null;
  return Math.round((this.completedAt.getTime() - this.createdAt.getTime()) / (1000 * 60));
});

// Ensure virtual fields are serialized
walletTransactionSchema.set('toJSON', { 
  virtuals: true,
  getters: true,
  transform: function(doc, ret) {
    // Convert Decimal128 to number for JSON response
    if (ret.amount && ret.amount.$numberDecimal) {
      ret.amount = parseFloat(ret.amount.$numberDecimal);
    }
    if (ret.current_balance_after_transaction && ret.current_balance_after_transaction.$numberDecimal) {
      ret.current_balance_after_transaction = parseFloat(ret.current_balance_after_transaction.$numberDecimal);
    }
    return ret;
  }
});

walletTransactionSchema.set('toObject', { 
  virtuals: true,
  getters: true 
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
