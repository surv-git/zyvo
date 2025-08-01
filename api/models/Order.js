/**
 * Order Model
 * Manages customer orders with comprehensive order tracking
 * Includes payment, shipping, and status management
 * Uses separate OrderItem collection for enhanced scalability
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// Address schema for shipping and billing
const addressSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  address_line1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot exceed 200 characters']
  },
  address_line2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
    default: null
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be 6 digits']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters'],
    default: 'India'
  },
  phone_number: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[\d\s-()]{10,15}$/, 'Please provide a valid phone number']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // User Reference
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Order Identification
  order_number: {
    type: String,
    unique: true,
    required: false, // Generated automatically by pre-save middleware
    trim: true,
    uppercase: true,
    index: true
  },
  
  // Addresses
  shipping_address: {
    type: addressSchema,
    required: [true, 'Shipping address is required']
  },
  
  billing_address: {
    type: addressSchema,
    required: [true, 'Billing address is required']
  },
  
  // Payment Information
  payment_method_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    default: null
  },
  
  payment_status: {
    type: String,
    enum: {
      values: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      message: 'Payment status must be one of: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED'
    },
    default: 'PENDING',
    index: true
  },
  
  // Payment Gateway Information
  payment_gateway: {
    type: String,
    enum: {
      values: ['COD', 'RAZORPAY', 'WALLET', 'UPI', 'NETBANKING', 'CARD'],
      message: 'Payment gateway must be one of: COD, RAZORPAY, WALLET, UPI, NETBANKING, CARD'
    },
    default: 'COD',
    index: true
  },
  
  // Razorpay specific fields
  razorpay_order_id: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  
  razorpay_payment_id: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  
  razorpay_signature: {
    type: String,
    trim: true,
    default: null
  },
  
  // Payment transaction details
  payment_transaction_id: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  
  payment_method_details: {
    type: {
      method: {
        type: String,
        enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'paylater'],
        default: null
      },
      bank: {
        type: String,
        default: null
      },
      wallet: {
        type: String,
        default: null
      },
      vpa: {
        type: String,
        default: null
      },
      card_network: {
        type: String,
        default: null
      },
      card_type: {
        type: String,
        enum: ['credit', 'debit', 'prepaid'],
        default: null
      }
    },
    default: null
  },
  
  // Order Status
  order_status: {
    type: String,
    enum: {
      values: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'],
      message: 'Order status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED'
    },
    default: 'PENDING',
    index: true
  },
  
  // Financial Information
  subtotal_amount: {
    type: Number,
    required: [true, 'Subtotal amount is required'],
    min: [0, 'Subtotal amount cannot be negative']
  },
  
  shipping_cost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  
  tax_amount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  
  discount_amount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  
  // Coupon Information
  applied_coupon_code: {
    type: String,
    default: null,
    trim: true,
    uppercase: true
  },
  
  grand_total_amount: {
    type: Number,
    required: false, // Calculated automatically by pre-save middleware
    min: [0, 'Grand total amount cannot be negative']
  },
  
  // Shipping Information
  tracking_number: {
    type: String,
    trim: true,
    default: null,
    maxlength: [100, 'Tracking number cannot exceed 100 characters']
  },
  
  shipping_carrier: {
    type: String,
    trim: true,
    default: null,
    maxlength: [100, 'Shipping carrier cannot exceed 100 characters']
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    default: null,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Compound indexes for optimal query performance
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ order_status: 1, createdAt: -1 });
orderSchema.index({ payment_status: 1, createdAt: -1 });
orderSchema.index({ user_id: 1, order_status: 1 });

/**
 * Generate unique order number
 * Format: YYYYMMDD + 6 random alphanumeric characters
 */
function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  return `${dateStr}${randomStr}`;
}

// Pre-save hooks
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate order number if not provided
  if (this.isNew && !this.order_number) {
    this.order_number = generateOrderNumber();
  }
  
  // Calculate grand total
  this.grand_total_amount = this.subtotal_amount + this.shipping_cost + this.tax_amount - this.discount_amount;
  
  next();
});

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['PENDING', 'PROCESSING'].includes(this.order_status);
};

orderSchema.methods.canBeShipped = function() {
  return this.order_status === 'PROCESSING' && this.payment_status === 'PAID';
};

orderSchema.methods.canBeDelivered = function() {
  return this.order_status === 'SHIPPED';
};

orderSchema.methods.canBeReturned = function() {
  return this.order_status === 'DELIVERED';
};

orderSchema.methods.updateStatus = function(newStatus, trackingNumber = null, shippingCarrier = null) {
  this.order_status = newStatus;
  
  if (newStatus === 'SHIPPED') {
    if (trackingNumber) this.tracking_number = trackingNumber;
    if (shippingCarrier) this.shipping_carrier = shippingCarrier;
  }
  
  return this.save();
};

orderSchema.methods.updatePaymentStatus = function(newPaymentStatus) {
  this.payment_status = newPaymentStatus;
  return this.save();
};

orderSchema.methods.calculateTotals = function() {
  this.grand_total_amount = this.subtotal_amount + this.shipping_cost + this.tax_amount - this.discount_amount;
  return this.grand_total_amount;
};

orderSchema.methods.getOrderSummary = function() {
  return {
    order_number: this.order_number,
    order_status: this.order_status,
    payment_status: this.payment_status,
    grand_total_amount: this.grand_total_amount,
    createdAt: this.createdAt,
    tracking_number: this.tracking_number,
    shipping_carrier: this.shipping_carrier
  };
};

// Static methods
orderSchema.statics.generateOrderNumber = function() {
  return generateOrderNumber();
};

orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ order_number: orderNumber.toUpperCase() });
};

orderSchema.statics.findUserOrders = function(userId, options = {}) {
  const query = { user_id: userId };
  
  // Add status filter if provided
  if (options.status) {
    query.order_status = options.status;
  }
  
  // Add date range filter if provided
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
    if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

orderSchema.statics.getOrderStats = async function(userId = null) {
  const matchStage = userId ? { $match: { user_id: new mongoose.Types.ObjectId(userId) } } : { $match: {} };
  
  const stats = await this.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        total_amount: { $sum: '$grand_total_amount' },
        pending_orders: {
          $sum: { $cond: [{ $eq: ['$order_status', 'PENDING'] }, 1, 0] }
        },
        completed_orders: {
          $sum: { $cond: [{ $eq: ['$order_status', 'DELIVERED'] }, 1, 0] }
        },
        cancelled_orders: {
          $sum: { $cond: [{ $eq: ['$order_status', 'CANCELLED'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total_orders: 0,
    total_amount: 0,
    pending_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0
  };
};

orderSchema.statics.getOrderWithItems = async function(orderId, userId = null) {
  const OrderItem = mongoose.model('OrderItem');
  
  const query = { _id: orderId };
  if (userId) query.user_id = userId;
  
  const order = await this.findOne(query);
  if (!order) {
    return null;
  }
  
  const orderItems = await OrderItem.find({ order_id: order._id })
    .populate({
      path: 'product_variant_id',
      populate: {
        path: 'product_id',
        select: 'name description brand_id category_id'
      }
    })
    .sort({ _id: 1 });
  
  return {
    order: order.toObject(),
    items: orderItems
  };
};

// Virtual for item count
orderSchema.virtual('item_count', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'order_id',
  count: true
});

// Virtual for formatted order number
orderSchema.virtual('formatted_order_number').get(function() {
  return `ORD-${this.order_number}`;
});

// Ensure virtuals are included in JSON output
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
