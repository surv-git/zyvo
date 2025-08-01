/**
 * OrderItem Model
 * Manages individual items within orders
 * Separate collection for enhanced scalability and analytics
 * Includes data snapshotting for historical accuracy
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  // Order Reference
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    index: true
  },
  
  // Product Variant Reference
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: [true, 'Product variant ID is required'],
    index: true
  },
  
  // Snapshotted Data (for historical accuracy)
  sku_code: {
    type: String,
    required: [true, 'SKU code is required'],
    trim: true,
    index: true
  },
  
  product_name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  variant_options: [{
    option_type: {
      type: String,
      required: true,
      trim: true
    },
    option_value: {
      type: String,
      required: true,
      trim: true
    }
  }],
  
  // Quantity and Pricing
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  }
});

// Indexes for optimal query performance
orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ product_variant_id: 1 });
orderItemSchema.index({ sku_code: 1 });
orderItemSchema.index({ order_id: 1, product_variant_id: 1 });

// Pre-save validation and calculations
orderItemSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.quantity * this.price;
  
  // Round to 2 decimal places
  this.subtotal = Math.round(this.subtotal * 100) / 100;
  this.price = Math.round(this.price * 100) / 100;
  
  next();
});

// Pre-save hook to validate order exists
orderItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Validate that the order exists
    const Order = mongoose.model('Order');
    const orderExists = await Order.findById(this.order_id);
    if (!orderExists) {
      return next(new Error('Referenced order does not exist'));
    }
    
    // Validate that the product variant exists
    const ProductVariant = mongoose.model('ProductVariant');
    const variantExists = await ProductVariant.findById(this.product_variant_id);
    if (!variantExists) {
      return next(new Error('Referenced product variant does not exist'));
    }
  }
  
  next();
});

// Instance methods
orderItemSchema.methods.updateQuantity = function(newQuantity) {
  if (newQuantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  this.quantity = newQuantity;
  this.subtotal = this.quantity * this.price;
  return this.save();
};

orderItemSchema.methods.getFormattedOptions = function() {
  return this.variant_options.map(option => 
    `${option.option_type}: ${option.option_value}`
  ).join(', ');
};

orderItemSchema.methods.getItemSummary = function() {
  return {
    product_name: this.product_name,
    sku_code: this.sku_code,
    options: this.getFormattedOptions(),
    quantity: this.quantity,
    price: this.price,
    subtotal: this.subtotal
  };
};

// Static methods
orderItemSchema.statics.findByOrder = function(orderId) {
  return this.find({ order_id: orderId })
    .populate({
      path: 'product_variant_id',
      populate: {
        path: 'product_id',
        select: 'name description brand_id category_id images'
      }
    })
    .sort({ _id: 1 });
};

orderItemSchema.statics.findByProductVariant = function(variantId) {
  return this.find({ product_variant_id: variantId })
    .populate('order_id', 'order_number order_status user_id createdAt')
    .sort({ createdAt: -1 });
};

orderItemSchema.statics.getOrderSubtotal = async function(orderId) {
  const result = await this.aggregate([
    { $match: { order_id: new mongoose.Types.ObjectId(orderId) } },
    { $group: { _id: null, total: { $sum: '$subtotal' } } }
  ]);
  
  return result[0]?.total || 0;
};

orderItemSchema.statics.getOrderItemCount = async function(orderId) {
  return await this.countDocuments({ order_id: orderId });
};

orderItemSchema.statics.getOrderQuantityTotal = async function(orderId) {
  const result = await this.aggregate([
    { $match: { order_id: new mongoose.Types.ObjectId(orderId) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);
  
  return result[0]?.total || 0;
};

orderItemSchema.statics.createFromCartItems = async function(orderId, cartItems) {
  const orderItems = [];
  
  for (const cartItem of cartItems) {
    // Get product variant details for snapshotting
    const ProductVariant = mongoose.model('ProductVariant');
    const variant = await ProductVariant.findById(cartItem.product_variant_id)
      .populate('product_id', 'name')
      .populate('option_values.option_id', 'name');
    
    if (!variant) {
      throw new Error(`Product variant ${cartItem.product_variant_id} not found`);
    }
    
    // Build variant options array for snapshot
    const variantOptions = variant.option_values?.map(opt => ({
      option_type: opt.option_id?.name || 'Unknown',
      option_value: opt.option_value || 'Unknown'
    })) || [];
    
    // Calculate subtotal
    const price = variant.current_price || cartItem.price_at_addition;
    const subtotal = cartItem.quantity * price;
    
    // Create order item
    const orderItem = new this({
      order_id: orderId,
      product_variant_id: cartItem.product_variant_id,
      sku_code: variant.sku_code || `SKU-${variant._id}`,
      product_name: variant.product_id?.name || 'Unknown Product',
      variant_options: variantOptions,
      quantity: cartItem.quantity,
      price: price,
      subtotal: subtotal
    });
    
    orderItems.push(orderItem);
  }
  
  // Save all order items
  return await this.insertMany(orderItems);
};

orderItemSchema.statics.deleteByOrder = function(orderId) {
  return this.deleteMany({ order_id: orderId });
};

orderItemSchema.statics.getProductSalesStats = async function(productVariantId, startDate = null, endDate = null) {
  const matchConditions = { product_variant_id: new mongoose.Types.ObjectId(productVariantId) };
  
  if (startDate || endDate) {
    // We need to join with Order to get createdAt
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' }
    ];
    
    if (startDate || endDate) {
      const dateMatch = {};
      if (startDate) dateMatch.$gte = new Date(startDate);
      if (endDate) dateMatch.$lte = new Date(endDate);
      pipeline.push({ $match: { 'order.createdAt': dateMatch } });
    }
    
    pipeline.push({
      $group: {
        _id: null,
        total_quantity_sold: { $sum: '$quantity' },
        total_revenue: { $sum: '$subtotal' },
        total_orders: { $sum: 1 },
        average_order_quantity: { $avg: '$quantity' },
        average_price: { $avg: '$price' }
      }
    });
    
    const result = await this.aggregate(pipeline);
    return result[0] || {
      total_quantity_sold: 0,
      total_revenue: 0,
      total_orders: 0,
      average_order_quantity: 0,
      average_price: 0
    };
  } else {
    const result = await this.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_quantity_sold: { $sum: '$quantity' },
          total_revenue: { $sum: '$subtotal' },
          total_orders: { $sum: 1 },
          average_order_quantity: { $avg: '$quantity' },
          average_price: { $avg: '$price' }
        }
      }
    ]);
    
    return result[0] || {
      total_quantity_sold: 0,
      total_revenue: 0,
      total_orders: 0,
      average_order_quantity: 0,
      average_price: 0
    };
  }
};

// Virtual for formatted options display
orderItemSchema.virtual('formatted_options').get(function() {
  return this.getFormattedOptions();
});

// Virtual for total value (alternative name for subtotal)
orderItemSchema.virtual('total_value').get(function() {
  return this.subtotal;
});

// Ensure virtuals are included in JSON output
orderItemSchema.set('toJSON', { virtuals: true });
orderItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
