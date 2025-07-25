/**
 * Address Model
 * Represents user saved addresses for delivery and billing
 */

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    // e.g., 'Home', 'Office', 'Parents House'
  },
  type: {
    type: String,
    enum: ['HOME', 'OFFICE', 'OTHER', 'BILLING', 'SHIPPING'],
    default: 'HOME',
    required: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[+]?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  address_line_1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  address_line_2: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  postal_code: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Support various postal code formats (US, UK, India, etc.)
        return /^[A-Za-z0-9\s\-]{3,10}$/.test(v);
      },
      message: 'Invalid postal code format'
    }
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'India'
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  is_default: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  delivery_instructions: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  // Address validation status
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_source: {
    type: String,
    enum: ['MANUAL', 'GOOGLE_MAPS', 'USER_CONFIRMED'],
    default: 'MANUAL'
  },
  // Usage tracking
  last_used_at: {
    type: Date,
    default: null
  },
  usage_count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
addressSchema.index({ user_id: 1, is_active: 1 });
addressSchema.index({ user_id: 1, is_default: 1 });
addressSchema.index({ user_id: 1, type: 1 });
addressSchema.index({ createdAt: -1 });

// Virtual for formatted address
addressSchema.virtual('formatted_address').get(function() {
  const parts = [
    this.address_line_1,
    this.address_line_2,
    this.landmark,
    this.city,
    this.state,
    this.postal_code,
    this.country
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ');
});

// Pre-save middleware to ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.is_default && this.isModified('is_default')) {
    // Remove default flag from all other addresses of this user
    await this.constructor.updateMany(
      { 
        user_id: this.user_id, 
        _id: { $ne: this._id },
        is_active: true 
      },
      { is_default: false }
    );
  }
  next();
});

// Static methods
addressSchema.statics.getUserAddresses = function(userId, options = {}) {
  const { 
    includeInactive = false, 
    type = null, 
    limit = 20,
    sort = { is_default: -1, updatedAt: -1 }
  } = options;

  const query = { user_id: userId };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  if (type) {
    query.type = type;
  }

  return this.find(query)
    .sort(sort)
    .limit(limit)
    .lean();
};

addressSchema.statics.getUserDefaultAddress = function(userId) {
  return this.findOne({ 
    user_id: userId, 
    is_default: true, 
    is_active: true 
  }).lean();
};

addressSchema.statics.setDefaultAddress = async function(userId, addressId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove default from all addresses
    await this.updateMany(
      { user_id: userId, is_active: true },
      { is_default: false },
      { session }
    );

    // Set new default
    const result = await this.findOneAndUpdate(
      { _id: addressId, user_id: userId, is_active: true },
      { is_default: true },
      { new: true, session }
    );

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Instance methods
addressSchema.methods.markAsUsed = function() {
  this.last_used_at = new Date();
  this.usage_count += 1;
  return this.save();
};

addressSchema.methods.softDelete = function() {
  this.is_active = false;
  this.is_default = false;
  return this.save();
};

// Transform output
addressSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
