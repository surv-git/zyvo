/**
 * Cart Model
 * Manages user shopping carts with coupon integration
 * Each authenticated user has one cart
 */

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // User Reference
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  
  // Coupon Information
  applied_coupon_code: {
    type: String,
    default: null,
    trim: true,
    uppercase: true
  },
  
  coupon_discount_amount: {
    type: Number,
    default: 0,
    min: [0, 'Coupon discount amount cannot be negative']
  },
  
  // Cart Total
  cart_total_amount: {
    type: Number,
    default: 0,
    min: [0, 'Cart total amount cannot be negative']
  },
  
  // Timestamps
  last_updated_at: {
    type: Date,
    default: Date.now
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

// Indexes for optimal query performance
cartSchema.index({ user_id: 1 }, { unique: true });
cartSchema.index({ last_updated_at: -1 });

// Pre-save hook to update timestamps
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.last_updated_at = new Date();
  next();
});

// Instance methods
cartSchema.methods.calculateTotal = async function() {
  const CartItem = mongoose.model('CartItem');
  const ProductVariant = mongoose.model('ProductVariant');
  
  try {
    // Get all cart items
    const cartItems = await CartItem.find({ cart_id: this._id })
      .populate('product_variant_id', 'price');
    
    // Calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.product_variant_id && item.product_variant_id.price) {
        subtotal += item.quantity * item.product_variant_id.price;
      }
    }
    
    // Apply coupon discount
    const finalTotal = Math.max(0, subtotal - this.coupon_discount_amount);
    
    // Update cart total
    this.cart_total_amount = Math.round(finalTotal * 100) / 100; // Round to 2 decimal places
    
    return this.cart_total_amount;
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return this.cart_total_amount;
  }
};

cartSchema.methods.getItemCount = async function() {
  const CartItem = mongoose.model('CartItem');
  try {
    const count = await CartItem.countDocuments({ cart_id: this._id });
    return count;
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
};

cartSchema.methods.clearCoupon = function() {
  this.applied_coupon_code = null;
  this.coupon_discount_amount = 0;
};

cartSchema.methods.applyCoupon = function(couponCode, discountAmount) {
  this.applied_coupon_code = couponCode;
  this.coupon_discount_amount = discountAmount;
};

// Static methods
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ user_id: userId });
  
  if (!cart) {
    cart = new this({
      user_id: userId,
      cart_total_amount: 0,
      coupon_discount_amount: 0
    });
    await cart.save();
  }
  
  return cart;
};

cartSchema.statics.getCartWithItems = async function(userId) {
  const CartItem = mongoose.model('CartItem');
  
  const cart = await this.findOne({ user_id: userId });
  if (!cart) {
    return null;
  }
  
  const cartItems = await CartItem.find({ cart_id: cart._id })
    .populate({
      path: 'product_variant_id',
      populate: [
        {
          path: 'product_id',
          select: 'name description brand_id category_id'
        },
        {
          path: 'option_values',
          select: 'option_type name option_value'
        }
      ]
    })
    .sort({ added_at: 1 });
  
  return {
    cart: cart,
    items: cartItems
  };
};

// Virtual for item count
cartSchema.virtual('item_count', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cart_id',
  count: true
});

// Ensure virtuals are included in JSON output
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
