/**
 * CartItem Model
 * Manages individual items within shopping carts
 * Separate collection for enhanced scalability and analytics
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  // Cart Reference
  cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: [true, 'Cart ID is required'],
    index: true
  },
  
  // Product Variant Reference
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: [true, 'Product variant ID is required'],
    index: true
  },
  
  // Quantity
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  
  // Historical price context
  price_at_addition: {
    type: Number,
    required: [true, 'Price at addition is required'],
    min: [0, 'Price cannot be negative']
  },
  
  // Timestamp
  added_at: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to ensure one variant per cart
cartItemSchema.index(
  { cart_id: 1, product_variant_id: 1 }, 
  { unique: true, name: 'cart_variant_unique' }
);

// Additional indexes for performance
cartItemSchema.index({ cart_id: 1, added_at: -1 });
cartItemSchema.index({ product_variant_id: 1 });

// Pre-save validation
cartItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Validate that the cart exists
    const Cart = mongoose.model('Cart');
    const cartExists = await Cart.findById(this.cart_id);
    if (!cartExists) {
      return next(new Error('Referenced cart does not exist'));
    }
    
    // Validate that the product variant exists
    const ProductVariant = mongoose.model('ProductVariant');
    const variantExists = await ProductVariant.findById(this.product_variant_id);
    if (!variantExists) {
      return next(new Error('Referenced product variant does not exist'));
    }
    
    // Set price_at_addition if not provided
    if (!this.price_at_addition && variantExists.current_price) {
      this.price_at_addition = variantExists.current_price;
    }
  }
  
  next();
});

// Post-save hook to update cart total
cartItemSchema.post('save', async function(doc) {
  try {
    const Cart = mongoose.model('Cart');
    const cart = await Cart.findById(doc.cart_id);
    if (cart) {
      await cart.calculateTotal();
      await cart.save();
    }
  } catch (error) {
    console.error('Error updating cart total after cart item save:', error);
  }
});

// Post-remove hook to update cart total
cartItemSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    const Cart = mongoose.model('Cart');
    const cart = await Cart.findById(doc.cart_id);
    if (cart) {
      await cart.calculateTotal();
      await cart.save();
    }
  } catch (error) {
    console.error('Error updating cart total after cart item removal:', error);
  }
});

// Instance methods
cartItemSchema.methods.getCurrentSubtotal = async function() {
  try {
    const ProductVariant = mongoose.model('ProductVariant');
    const variant = await ProductVariant.findById(this.product_variant_id, 'current_price');
    
    if (variant && variant.current_price) {
      return this.quantity * variant.current_price;
    }
    
    // Fallback to price at addition
    return this.quantity * this.price_at_addition;
  } catch (error) {
    console.error('Error calculating current subtotal:', error);
    return this.quantity * this.price_at_addition;
  }
};

cartItemSchema.methods.updateQuantity = async function(newQuantity) {
  if (newQuantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  this.quantity = newQuantity;
  return await this.save();
};

cartItemSchema.methods.incrementQuantity = async function(amount = 1) {
  this.quantity += amount;
  return await this.save();
};

// Static methods
cartItemSchema.statics.findByCartAndVariant = async function(cartId, variantId) {
  return await this.findOne({
    cart_id: cartId,
    product_variant_id: variantId
  });
};

cartItemSchema.statics.getCartItems = async function(cartId) {
  return await this.find({ cart_id: cartId })
    .populate({
      path: 'product_variant_id',
      populate: [
        {
          path: 'product_id',
          select: 'name description brand_id category_id images'
        },
        {
          path: 'option_values.option_id',
          select: 'name'
        }
      ]
    })
    .sort({ added_at: 1 });
};

cartItemSchema.statics.clearCartItems = async function(cartId) {
  return await this.deleteMany({ cart_id: cartId });
};

cartItemSchema.statics.getCartItemCount = async function(cartId) {
  return await this.countDocuments({ cart_id: cartId });
};

cartItemSchema.statics.getCartSubtotal = async function(cartId) {
  const items = await this.find({ cart_id: cartId })
    .populate('product_variant_id', 'current_price');
  
  let subtotal = 0;
  for (const item of items) {
    if (item.product_variant_id && item.product_variant_id.current_price) {
      subtotal += item.quantity * item.product_variant_id.current_price;
    } else {
      subtotal += item.quantity * item.price_at_addition;
    }
  }
  
  return Math.round(subtotal * 100) / 100; // Round to 2 decimal places
};

// Virtual for subtotal using current price
cartItemSchema.virtual('current_subtotal').get(function() {
  if (this.product_variant_id && this.product_variant_id.current_price) {
    return this.quantity * this.product_variant_id.current_price;
  }
  return this.quantity * this.price_at_addition;
});

// Virtual for subtotal using historical price
cartItemSchema.virtual('historical_subtotal').get(function() {
  return this.quantity * this.price_at_addition;
});

// Ensure virtuals are included in JSON output
cartItemSchema.set('toJSON', { virtuals: true });
cartItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
