const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * PaymentMethod Model
 * Secure storage of user payment methods with encryption for sensitive data
 * 
 * Security Features:
 * - Encryption for sensitive fields (UPI ID, last 4 digits, tokens)
 * - Never stores full card numbers, CVV, or complete expiry dates
 * - PCI DSS compliant token-based storage
 * - Automatic encryption/decryption via pre/post hooks
 */

// Encryption configuration
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

// Encryption helper functions
const encrypt = (text) => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  if (!encryptedData || typeof encryptedData === 'string') {
    return encryptedData; // Return as-is if not encrypted object
  }
  
  try {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
};

// Card details sub-schema
const CardDetailsSchema = new mongoose.Schema({
  card_brand: {
    type: String,
    required: true,
    enum: ['Visa', 'MasterCard', 'RuPay', 'Amex', 'Discover', 'Other']
  },
  last4_digits: {
    type: mongoose.Schema.Types.Mixed, // Will store encrypted data
    required: true,
    validate: {
      validator: function(value) {
        // Validate that it's either a 4-digit string or encrypted object
        if (typeof value === 'string') {
          return /^\d{4}$/.test(value);
        }
        return value && value.encrypted; // Encrypted object
      },
      message: 'Last 4 digits must be exactly 4 digits'
    }
  },
  expiry_month: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return /^(0[1-9]|1[0-2])$/.test(value);
      },
      message: 'Expiry month must be in MM format (01-12)'
    }
  },
  expiry_year: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        return /^\d{4}$/.test(value) && year >= currentYear && year <= currentYear + 20;
      },
      message: 'Expiry year must be valid YYYY format and not expired'
    }
  },
  card_holder_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  token: {
    type: mongoose.Schema.Types.Mixed, // Encrypted payment gateway token
    required: true
  }
}, { _id: false });

// UPI details sub-schema
const UPIDetailsSchema = new mongoose.Schema({
  upi_id: {
    type: mongoose.Schema.Types.Mixed, // Will store encrypted data
    required: true,
    validate: {
      validator: function(value) {
        // Validate UPI ID format if not encrypted
        if (typeof value === 'string') {
          return /^[\w.-]+@[\w.-]+$/.test(value);
        }
        return value && value.encrypted; // Encrypted object
      },
      message: 'Invalid UPI ID format'
    }
  },
  account_holder_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }
}, { _id: false });

// Wallet details sub-schema
const WalletDetailsSchema = new mongoose.Schema({
  wallet_provider: {
    type: String,
    required: true,
    enum: ['Paytm', 'PhonePe', 'GooglePay', 'Mobikwik', 'JioMoney', 'Other']
  },
  linked_account_identifier: {
    type: mongoose.Schema.Types.Mixed, // Will store encrypted data
    trim: true,
    maxlength: 100
  }
}, { _id: false });

// Net Banking details sub-schema
const NetBankingDetailsSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  account_holder_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  token: {
    type: mongoose.Schema.Types.Mixed, // Encrypted token if available
    default: null
  }
}, { _id: false });

// Main PaymentMethod schema
const PaymentMethodSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  method_type: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING', 'OTHER'],
    index: true
  },
  
  alias: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null
  },
  
  is_default: {
    type: Boolean,
    default: false,
    index: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(value) {
        // Validate details structure based on method_type
        switch (this.method_type) {
          case 'CREDIT_CARD':
          case 'DEBIT_CARD':
            return value.card_brand && value.last4_digits && 
                   value.expiry_month && value.expiry_year && 
                   value.card_holder_name && value.token;
          case 'UPI':
            return value.upi_id && value.account_holder_name;
          case 'WALLET':
            return value.wallet_provider;
          case 'NETBANKING':
            return value.bank_name && value.account_holder_name;
          default:
            return true; // Allow flexibility for OTHER type
        }
      },
      message: 'Details object structure invalid for method type'
    }
  },
  
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for better query performance
PaymentMethodSchema.index({ user_id: 1, is_default: 1 });
PaymentMethodSchema.index({ user_id: 1, is_active: 1 });
PaymentMethodSchema.index({ user_id: 1, method_type: 1 });

// Pre-save middleware for encryption and default payment method logic
PaymentMethodSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Handle default payment method logic
    if (this.is_default && this.isModified('is_default')) {
      // Unset other default payment methods for this user
      await this.constructor.updateMany(
        { 
          user_id: this.user_id, 
          _id: { $ne: this._id }, 
          is_active: true 
        },
        { $set: { is_default: false } }
      );
    }
    
    // Encrypt sensitive fields based on method type
    if (this.isModified('details')) {
      switch (this.method_type) {
        case 'CREDIT_CARD':
        case 'DEBIT_CARD':
          if (typeof this.details.last4_digits === 'string') {
            this.details.last4_digits = encrypt(this.details.last4_digits);
          }
          if (typeof this.details.token === 'string') {
            this.details.token = encrypt(this.details.token);
          }
          break;
          
        case 'UPI':
          if (typeof this.details.upi_id === 'string') {
            this.details.upi_id = encrypt(this.details.upi_id);
          }
          break;
          
        case 'WALLET':
          if (this.details.linked_account_identifier && 
              typeof this.details.linked_account_identifier === 'string') {
            this.details.linked_account_identifier = encrypt(this.details.linked_account_identifier);
          }
          break;
          
        case 'NETBANKING':
          if (this.details.token && typeof this.details.token === 'string') {
            this.details.token = encrypt(this.details.token);
          }
          break;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-find middleware for decryption
PaymentMethodSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  if (!docs) return;
  
  const decryptDocument = (doc) => {
    if (!doc || !doc.details) return;
    
    switch (doc.method_type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        if (doc.details.last4_digits && typeof doc.details.last4_digits === 'object') {
          doc.details.last4_digits = decrypt(doc.details.last4_digits);
        }
        // Note: We decrypt tokens only for internal use, never for API responses
        if (doc.details.token && typeof doc.details.token === 'object') {
          doc.details.token = decrypt(doc.details.token);
        }
        break;
        
      case 'UPI':
        if (doc.details.upi_id && typeof doc.details.upi_id === 'object') {
          doc.details.upi_id = decrypt(doc.details.upi_id);
        }
        break;
        
      case 'WALLET':
        if (doc.details.linked_account_identifier && 
            typeof doc.details.linked_account_identifier === 'object') {
          doc.details.linked_account_identifier = decrypt(doc.details.linked_account_identifier);
        }
        break;
        
      case 'NETBANKING':
        if (doc.details.token && typeof doc.details.token === 'object') {
          doc.details.token = decrypt(doc.details.token);
        }
        break;
    }
  };
  
  if (Array.isArray(docs)) {
    docs.forEach(decryptDocument);
  } else {
    decryptDocument(docs);
  }
});

// Instance method to sanitize for API response (remove sensitive tokens)
PaymentMethodSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove sensitive payment gateway tokens from API responses
  if (obj.details) {
    switch (obj.method_type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        delete obj.details.token; // Never expose payment gateway tokens
        break;
      case 'NETBANKING':
        delete obj.details.token; // Never expose payment gateway tokens
        break;
    }
  }
  
  return obj;
};

// Static method to find user's default payment method
PaymentMethodSchema.statics.findDefaultForUser = function(userId) {
  return this.findOne({ 
    user_id: userId, 
    is_default: true, 
    is_active: true 
  });
};

// Static method to ensure only one default per user
PaymentMethodSchema.statics.setAsDefault = async function(paymentMethodId, userId) {
  // Start transaction to ensure atomicity
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Unset all existing defaults for user
      await this.updateMany(
        { user_id: userId, is_active: true },
        { $set: { is_default: false } },
        { session }
      );
      
      // Set the specified payment method as default
      await this.updateOne(
        { _id: paymentMethodId, user_id: userId },
        { $set: { is_default: true } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
};

// Virtual for display name
PaymentMethodSchema.virtual('display_name').get(function() {
  if (this.alias) {
    return this.alias;
  }
  
  switch (this.method_type) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return `${this.details.card_brand} ****${this.details.last4_digits}`;
    case 'UPI':
      return this.details.upi_id;
    case 'WALLET':
      return `${this.details.wallet_provider} Wallet`;
    case 'NETBANKING':
      return `${this.details.bank_name} Net Banking`;
    default:
      return this.method_type;
  }
});

// Ensure virtual fields are serialized
PaymentMethodSchema.set('toJSON', { virtuals: true });
PaymentMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
