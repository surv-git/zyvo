/**
 * Wallet Model
 * Mongoose schema for user wallet management
 * Each user has one wallet for holding balance and managing transactions
 */

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // Core identification - One-to-one relationship with User
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Financial details - Using Decimal128 for currency precision
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0.00,
    min: [0, 'Balance cannot be negative'],
    get: function(value) {
      // Convert Decimal128 to number for JSON serialization
      return value ? parseFloat(value.toString()) : 0;
    }
  },

  currency: {
    type: String,
    required: true,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    uppercase: true
  },

  // Wallet status for administrative control
  status: {
    type: String,
    enum: ['ACTIVE', 'BLOCKED', 'INACTIVE'],
    default: 'ACTIVE',
    index: true
  },

  // Transaction tracking
  last_transaction_at: {
    type: Date,
    default: null
  },

  // Version field for optimistic concurrency control
  version: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
walletSchema.index({ user_id: 1 }, { unique: true });
walletSchema.index({ status: 1 });
walletSchema.index({ createdAt: -1 });

/**
 * Pre-save middleware
 */
walletSchema.pre('save', function(next) {
  // Update updatedAt timestamp on modifications
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  // Increment version for optimistic concurrency control
  if (this.isModified('balance')) {
    this.version += 1;
  }

  next();
});

/**
 * Instance methods
 */

// Check if wallet belongs to a specific user
walletSchema.methods.belongsToUser = function(userId) {
  return this.user_id.toString() === userId.toString();
};

// Check if wallet is active and can perform transactions
walletSchema.methods.canTransact = function() {
  return this.status === 'ACTIVE';
};

// Get balance as a number (handles Decimal128 conversion)
walletSchema.methods.getBalance = function() {
  return this.balance ? parseFloat(this.balance.toString()) : 0;
};

// Check if wallet has sufficient balance for a transaction
walletSchema.methods.hasSufficientBalance = function(amount) {
  const currentBalance = this.getBalance();
  const requiredAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return currentBalance >= requiredAmount;
};

// Format balance for display
walletSchema.methods.getFormattedBalance = function() {
  const balance = this.getBalance();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(balance);
};

// Block wallet
walletSchema.methods.block = function(reason = 'Administrative action') {
  this.status = 'BLOCKED';
  return this.save();
};

// Unblock wallet
walletSchema.methods.unblock = function() {
  this.status = 'ACTIVE';
  return this.save();
};

// Deactivate wallet
walletSchema.methods.deactivate = function() {
  this.status = 'INACTIVE';
  return this.save();
};

/**
 * Static methods
 */

// Find or create wallet for a user
walletSchema.statics.findOrCreateUserWallet = async function(userId, currency = 'INR') {
  try {
    let wallet = await this.findOne({ user_id: userId });
    
    if (!wallet) {
      wallet = new this({
        user_id: userId,
        balance: mongoose.Types.Decimal128.fromString('0.00'),
        currency: currency.toUpperCase()
      });
      await wallet.save();
    }
    
    return wallet;
  } catch (error) {
    throw error;
  }
};

// Get user wallet with error handling
walletSchema.statics.getUserWallet = async function(userId) {
  const wallet = await this.findOne({ user_id: userId }).populate('user_id', 'name email');
  if (!wallet) {
    throw new Error('Wallet not found for user');
  }
  return wallet;
};

// Atomic balance update with optimistic concurrency control
walletSchema.statics.atomicBalanceUpdate = async function(walletId, amount, transactionType, session = null) {
  const amountDecimal = mongoose.Types.Decimal128.fromString(amount.toString());
  
  let updateOperation;
  if (transactionType === 'CREDIT') {
    updateOperation = { 
      $inc: { 
        balance: amountDecimal,
        version: 1
      },
      $set: {
        last_transaction_at: new Date(),
        updatedAt: new Date()
      }
    };
  } else if (transactionType === 'DEBIT') {
    updateOperation = { 
      $inc: { 
        balance: mongoose.Types.Decimal128.fromString((-amount).toString()),
        version: 1
      },
      $set: {
        last_transaction_at: new Date(),
        updatedAt: new Date()
      }
    };
  } else {
    throw new Error('Invalid transaction type');
  }

  const options = { 
    new: true,
    runValidators: true
  };
  
  if (session) {
    options.session = session;
  }

  const updatedWallet = await this.findByIdAndUpdate(
    walletId,
    updateOperation,
    options
  );

  if (!updatedWallet) {
    throw new Error('Wallet not found or update failed');
  }

  // Check for negative balance after debit
  if (transactionType === 'DEBIT' && updatedWallet.getBalance() < 0) {
    throw new Error('Insufficient balance');
  }

  return updatedWallet;
};

// Get wallet statistics
walletSchema.statics.getWalletStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_wallets: { $sum: 1 },
        active_wallets: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        blocked_wallets: {
          $sum: { $cond: [{ $eq: ['$status', 'BLOCKED'] }, 1, 0] }
        },
        inactive_wallets: {
          $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] }
        },
        total_balance: { $sum: { $toDouble: '$balance' } },
        average_balance: { $avg: { $toDouble: '$balance' } }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    total_wallets: 0,
    active_wallets: 0,
    blocked_wallets: 0,
    inactive_wallets: 0,
    total_balance: 0,
    average_balance: 0
  };
};

// Find wallets by status
walletSchema.statics.findByStatus = function(status, options = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find({ status })
    .populate('user_id', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Find wallets with balance above threshold
walletSchema.statics.findWithBalanceAbove = function(threshold, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    balance: { $gte: mongoose.Types.Decimal128.fromString(threshold.toString()) }
  })
    .populate('user_id', 'name email')
    .sort({ balance: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Virtual fields
 */
walletSchema.virtual('balance_formatted').get(function() {
  return this.getFormattedBalance();
});

walletSchema.virtual('is_active').get(function() {
  return this.status === 'ACTIVE';
});

walletSchema.virtual('is_blocked').get(function() {
  return this.status === 'BLOCKED';
});

walletSchema.virtual('days_since_last_transaction').get(function() {
  if (!this.last_transaction_at) return null;
  return Math.floor((Date.now() - this.last_transaction_at.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
walletSchema.set('toJSON', { 
  virtuals: true,
  getters: true,
  transform: function(doc, ret) {
    // Convert Decimal128 to number for JSON response
    if (ret.balance && ret.balance.$numberDecimal) {
      ret.balance = parseFloat(ret.balance.$numberDecimal);
    }
    return ret;
  }
});

walletSchema.set('toObject', { 
  virtuals: true,
  getters: true 
});

module.exports = mongoose.model('Wallet', walletSchema);
