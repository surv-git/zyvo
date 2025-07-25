/**
 * Order Controller
 * Handles order management operations with transaction safety
 * Includes inventory deduction, coupon usage tracking, and payment processing
 */

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const UserCoupon = require('../models/UserCoupon');
const CouponCampaign = require('../models/CouponCampaign');
const PaymentMethod = require('../models/PaymentMethod');
const userAuditLogger = require('../middleware/userAuditLogger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const mongoose = require('mongoose');

/**
 * Place order from cart
 * POST /api/v1/user/orders
 */
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { shipping_address, billing_address, payment_method_id, is_cod = false } = req.body;
      
      // Validate required addresses
      if (!shipping_address || !billing_address) {
        throw new Error('Both shipping and billing addresses are required');
      }
      
      // Validate payment method if not COD
      if (!is_cod && !payment_method_id) {
        throw new Error('Payment method is required for non-COD orders');
      }
      
      // Validate payment method exists if provided
      if (payment_method_id) {
        const paymentMethod = await PaymentMethod.findOne({
          _id: payment_method_id,
          user_id: userId
        });
        if (!paymentMethod) {
          throw new Error('Invalid payment method');
        }
      }
      
      // Get user's cart with items
      const cartData = await Cart.getCartWithItems(userId);
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      const { cart, items: cartItems } = cartData;
      
      // Re-validate coupon if applied
      let finalDiscountAmount = cart.coupon_discount_amount;
      if (cart.applied_coupon_code) {
        const userCoupon = await UserCoupon.findOne({
          user_id: userId,
          coupon_code: cart.applied_coupon_code,
          is_redeemed: false
        }).populate('campaign_id');
        
        if (!userCoupon) {
          throw new Error('Applied coupon is no longer valid');
        }
        
        // Prepare order data for coupon validation
        const orderForValidation = {
          user_id: userId,
          items: cartItems.map(item => ({
            product_variant_id: item.product_variant_id._id,
            quantity: item.quantity,
            price: item.product_variant_id.current_price || item.price_at_addition,
            product: item.product_variant_id.product_id
          })),
          subtotal_amount: await CartItem.getCartSubtotal(cart._id)
        };
        
        const isValid = await userCoupon.validateCouponApplicability(orderForValidation);
        if (!isValid.valid) {
          throw new Error(`Coupon validation failed: ${isValid.reason}`);
        }
      }
      
      // Calculate order totals
      const subtotalAmount = await CartItem.getCartSubtotal(cart._id);
      const shippingCost = calculateShippingCost(cartItems, shipping_address);
      const taxAmount = calculateTaxAmount(subtotalAmount, shipping_address);
      
      // Inventory check and deduction (atomic transaction)
      const inventoryUpdates = [];
      
      for (const cartItem of cartItems) {
        // Get variant pack details for inventory calculation
        const { base_unit_variant_id, pack_unit_multiplier } = await getVariantPackDetails(cartItem.product_variant_id._id);
        const requiredStock = cartItem.quantity * pack_unit_multiplier;
        
        // Find and check inventory
        const inventory = await Inventory.findOne({ product_variant_id: base_unit_variant_id });
        
        if (!inventory || inventory.stock_quantity < requiredStock) {
          throw new Error(`Insufficient stock for ${cartItem.product_variant_id.product_id?.name}. Available: ${inventory ? inventory.stock_quantity : 0}, Required: ${requiredStock}`);
        }
        
        // Prepare inventory update
        inventoryUpdates.push({
          inventory: inventory,
          deduction: requiredStock
        });
      }
      
      // Create order
      const order = new Order({
        user_id: userId,
        shipping_address: shipping_address,
        billing_address: billing_address,
        payment_method_id: is_cod ? null : payment_method_id,
        payment_status: is_cod ? 'PENDING' : 'PENDING',
        subtotal_amount: subtotalAmount,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        discount_amount: finalDiscountAmount,
        applied_coupon_code: cart.applied_coupon_code
      });
      
      await order.save({ session });
      
      // Create order items with data snapshotting
      const orderItems = await OrderItem.createFromCartItems(order._id, cartItems);
      
      // Deduct inventory within transaction
      for (const update of inventoryUpdates) {
        update.inventory.stock_quantity -= update.deduction;
        update.inventory.last_sold_date = new Date();
        await update.inventory.save({ session });
      }
      
      // Update coupon usage if applied
      if (cart.applied_coupon_code) {
        const userCoupon = await UserCoupon.findOne({
          user_id: userId,
          coupon_code: cart.applied_coupon_code,
          is_redeemed: false
        }).populate('campaign_id');
        
        if (userCoupon) {
          // Update user coupon
          userCoupon.current_usage_count += 1;
          userCoupon.is_redeemed = true;
          userCoupon.redeemed_at = new Date();
          await userCoupon.save({ session });
          
          // Update campaign global usage
          const campaign = userCoupon.campaign_id;
          campaign.current_global_usage += 1;
          await campaign.save({ session });
        }
      }
      
      // Clear cart
      await CartItem.clearCartItems(cart._id);
      cart.clearCoupon();
      cart.cart_total_amount = 0;
      await cart.save({ session });
      
      userAuditLogger.logActivity(userId, 'ORDER_PLACED', {
        order_id: order._id,
        order_number: order.order_number,
        grand_total_amount: order.grand_total_amount,
        item_count: cartItems.length,
        payment_method: is_cod ? 'COD' : 'ONLINE',
        applied_coupon: cart.applied_coupon_code
      });
    });
    
    // Get the created order with items
    const orderData = await Order.getOrderWithItems(
      await Order.findOne({ user_id: req.user.id }).sort({ createdAt: -1 }).select('_id')
    );
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: orderData
    });
    
  } catch (error) {
    console.error('Error placing order:', error);
    
    let statusCode = 400;
    if (error.message.includes('Insufficient stock')) {
      statusCode = 412; // Precondition Failed
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to place order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Get user's orders
 * GET /api/v1/user/orders
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;
    
    // Build query for filtering
    const query = { user_id: userId };
    if (status) query.order_status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };
    
    // Get orders with the same query used for counting
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .skip(options.skip);
    
    // Get order items for each order
    const ordersWithItems = [];
    for (const order of orders) {
      const orderItems = await OrderItem.findByOrder(order._id);
      ordersWithItems.push({
        order: order.toObject(),
        items: orderItems
      });
    }
    
    // Get total count for pagination - use the same query with filters
    const totalCount = await Order.countDocuments(query);
    
    userAuditLogger.logActivity(userId, 'ORDERS_VIEWED', {
      page: page,
      limit: limit,
      filter_status: status
    });
    
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: ordersWithItems,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          total_count: totalCount,
          per_page: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single order details
 * GET /api/v1/user/orders/:orderId
 */
const getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    // Get order with items
    const orderData = await Order.getOrderWithItems(orderId, userId);
    
    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    userAuditLogger.logActivity(userId, 'ORDER_DETAIL_VIEWED', {
      order_id: orderId,
      order_number: orderData.order.order_number
    });
    
    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: orderData
    });
    
  } catch (error) {
    console.error('Error retrieving order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Cancel order
 * PATCH /api/v1/user/orders/:orderId/cancel
 */
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { reason = 'Customer cancellation' } = req.body;
      
      // Find order
      const order = await Order.findOne({ _id: orderId, user_id: userId });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (!order.canBeCancelled()) {
        throw new Error('Order cannot be cancelled. Only PENDING and PROCESSING orders can be cancelled.');
      }
      
      // Get order items for inventory reversal
      const orderItems = await OrderItem.findByOrder(orderId);
      
      // Reverse inventory deduction
      for (const orderItem of orderItems) {
        const { base_unit_variant_id, pack_unit_multiplier } = await getVariantPackDetails(orderItem.product_variant_id);
        const stockToRestore = orderItem.quantity * pack_unit_multiplier;
        
        const inventory = await Inventory.findOne({ product_variant_id: base_unit_variant_id });
        if (inventory) {
          inventory.stock_quantity += stockToRestore;
          await inventory.save({ session });
        }
      }
      
      // Reverse coupon usage if applicable
      if (order.applied_coupon_code) {
        const userCoupon = await UserCoupon.findOne({
          user_id: userId,
          coupon_code: order.applied_coupon_code,
          is_redeemed: true
        }).populate('campaign_id');
        
        if (userCoupon) {
          // Reverse user coupon
          userCoupon.current_usage_count = Math.max(0, userCoupon.current_usage_count - 1);
          userCoupon.is_redeemed = false;
          userCoupon.redeemed_at = null;
          await userCoupon.save({ session });
          
          // Reverse campaign global usage
          const campaign = userCoupon.campaign_id;
          campaign.current_global_usage = Math.max(0, campaign.current_global_usage - 1);
          await campaign.save({ session });
        }
      }
      
      // Update order status
      order.order_status = 'CANCELLED';
      order.notes = order.notes ? `${order.notes}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`;
      await order.save({ session });
      
      userAuditLogger.logActivity(userId, 'ORDER_CANCELLED', {
        order_id: orderId,
        order_number: order.order_number,
        reason: reason
      });
    });
    
    // Get updated order data
    const updatedOrderData = await Order.getOrderWithItems(orderId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrderData
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Get all orders (Admin)
 * GET /api/v1/admin/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { 
      user_id, 
      order_status, 
      payment_status, 
      order_number, 
      page = 1, 
      limit = 20,
      startDate,
      endDate
    } = req.query;
    
    // Build query
    const query = {};
    if (user_id) query.user_id = user_id;
    if (order_status) query.order_status = order_status;
    if (payment_status) query.payment_status = payment_status;
    if (order_number) query.order_number = { $regex: order_number, $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Debug logging
    console.log('Admin Orders Debug:');
    console.log('Query params:', req.query);
    console.log('Built query:', JSON.stringify(query, null, 2));
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };
    
    // Get orders with items
    const orders = await Order.find(query)
      .populate('user_id', 'first_name last_name email phone_number')
      .populate('payment_method_id', 'method_type last_four')
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .skip(options.skip);
    
    const ordersWithItems = [];
    for (const order of orders) {
      const orderItems = await OrderItem.findByOrder(order._id);
      ordersWithItems.push({
        order: order.toObject(),
        items: orderItems
      });
    }
    
    // Get total count
    const totalCount = await Order.countDocuments(query);
    
    console.log('Total count from query:', totalCount);
    console.log('Orders returned:', orders.length);
    
    adminAuditLogger.logAdminActivity({
      admin_id: req.user.id,
      action_type: 'ADMIN_ORDERS_VIEWED',
      resource_type: 'orders',
      details: {
        filters: { user_id, order_status, payment_status, order_number },
        page: page,
        limit: limit
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: ordersWithItems,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          total_count: totalCount,
          per_page: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error retrieving all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single order details (Admin)
 * GET /api/v1/admin/orders/:orderId
 */
const getAdminOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Get order with items (no user restriction for admin)
    const orderData = await Order.getOrderWithItems(orderId);
    
    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Populate additional admin fields
    await Order.populate(orderData.order, [
      { path: 'user_id', select: 'first_name last_name email phone_number' },
      { path: 'payment_method_id', select: 'method_type last_four' }
    ]);
    
    adminAuditLogger.logAdminActivity({
      admin_id: req.user.id,
      action_type: 'ADMIN_ORDER_DETAIL_VIEWED',
      resource_type: 'order',
      resource_id: orderId,
      details: {
        order_number: orderData.order.order_number,
        user_id: orderData.order.user_id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: orderData
    });
    
  } catch (error) {
    console.error('Error retrieving admin order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update order status (Admin)
 * PATCH /api/v1/admin/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { new_status, tracking_number, shipping_carrier, notes } = req.body;
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const oldStatus = order.order_status;
    
    // Update order status
    await order.updateStatus(new_status, tracking_number, shipping_carrier);
    
    // Add notes if provided
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n\n${notes}` : notes;
      await order.save();
    }
    
    adminAuditLogger.logAdminActivity({
      admin_id: req.user.id,
      action_type: 'ADMIN_ORDER_STATUS_UPDATED',
      resource_type: 'order',
      resource_id: orderId,
      details: {
        order_number: order.order_number,
        old_status: oldStatus,
        new_status: new_status,
        tracking_number: tracking_number,
        shipping_carrier: shipping_carrier
      }
    });
    
    // Get updated order data
    const updatedOrderData = await Order.getOrderWithItems(orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrderData
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
};

/**
 * Process refund (Admin - Conceptual)
 * POST /api/v1/admin/orders/:orderId/refund
 */
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason = 'Admin refund' } = req.body;
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : order.grand_total_amount;
    
    if (refundAmount <= 0 || refundAmount > order.grand_total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund amount'
      });
    }
    
    // Update payment status
    if (refundAmount === order.grand_total_amount) {
      order.payment_status = 'REFUNDED';
    } else {
      order.payment_status = 'PARTIALLY_REFUNDED';
    }
    
    // Add refund notes
    const refundNote = `Refund processed: $${refundAmount}. Reason: ${reason}`;
    order.notes = order.notes ? `${order.notes}\n\n${refundNote}` : refundNote;
    
    await order.save();
    
    // TODO: Integrate with actual payment gateway for refund processing
    // This would involve calling the payment gateway API to process the refund
    
    adminAuditLogger.logAdminActivity({
      admin_id: req.user.id,
      action_type: 'ADMIN_ORDER_REFUND_PROCESSED',
      resource_type: 'order',
      resource_id: orderId,
      details: {
        order_number: order.order_number,
        refund_amount: refundAmount,
        reason: reason
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order_id: orderId,
        refund_amount: refundAmount,
        new_payment_status: order.payment_status
      }
    });
    
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
};

/**
 * Helper function to calculate shipping cost
 * This should be replaced with actual shipping calculation logic
 */
const calculateShippingCost = (cartItems, shippingAddress) => {
  // Placeholder implementation
  // In a real system, this would calculate based on:
  // - Item weight/dimensions
  // - Shipping address/distance
  // - Shipping method selected
  // - Carrier rates
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Free shipping for orders over certain amount or quantity
  if (totalItems >= 5) {
    return 0;
  }
  
  // Basic shipping rate
  return 50; // ₹50 shipping
};

/**
 * Helper function to calculate tax amount
 * This should be replaced with actual tax calculation logic
 */
const calculateTaxAmount = (subtotal, shippingAddress) => {
  // Placeholder implementation
  // In a real system, this would calculate based on:
  // - Shipping address state/region
  // - Product categories
  // - Applicable tax rates
  
  const taxRate = 0.18; // 18% GST for India
  return Math.round(subtotal * taxRate * 100) / 100;
};

/**
 * Helper function to get variant pack details for inventory calculation
 * This should integrate with your existing inventory system
 */
const getVariantPackDetails = async (variantId) => {
  try {
    // Placeholder implementation
    // Replace with your actual inventory system logic
    const variant = await ProductVariant.findById(variantId);
    
    // For now, assume each variant is its own base unit
    return {
      base_unit_variant_id: variantId,
      pack_unit_multiplier: 1
    };
  } catch (error) {
    console.error('Error getting variant pack details:', error);
    return {
      base_unit_variant_id: variantId,
      pack_unit_multiplier: 1
    };
  }
};

/**
 * Update order details (Admin)
 * PUT /api/v1/admin/orders/:orderId
 */
const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const {
      shipping_address,
      billing_address,
      payment_method_id,
      order_status,
      payment_status,
      shipping_cost,
      tax_amount,
      discount_amount,
      tracking_number,
      shipping_carrier,
      notes
    } = req.body;

    console.log('Admin Order Update Debug:', {
      orderId,
      updateFields: Object.keys(req.body),
      adminId: req.user?.id
    });

    // Validate order exists
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    
    if (shipping_address) {
      // Validate shipping address structure
      const requiredAddressFields = ['full_name', 'address_line1', 'city', 'state', 'pincode', 'country', 'phone_number'];
      for (const field of requiredAddressFields) {
        if (!shipping_address[field]) {
          return res.status(400).json({
            success: false,
            message: `Shipping address ${field} is required`
          });
        }
      }
      updateData.shipping_address = shipping_address;
    }

    if (billing_address) {
      // Validate billing address structure
      const requiredAddressFields = ['full_name', 'address_line1', 'city', 'state', 'pincode', 'country', 'phone_number'];
      for (const field of requiredAddressFields) {
        if (!billing_address[field]) {
          return res.status(400).json({
            success: false,
            message: `Billing address ${field} is required`
          });
        }
      }
      updateData.billing_address = billing_address;
    }

    if (payment_method_id !== undefined) updateData.payment_method_id = payment_method_id;
    
    if (order_status) {
      const validOrderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];
      if (!validOrderStatuses.includes(order_status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }
      updateData.order_status = order_status;
    }

    if (payment_status) {
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }
      updateData.payment_status = payment_status;
    }

    if (shipping_cost !== undefined) {
      if (shipping_cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Shipping cost cannot be negative'
        });
      }
      updateData.shipping_cost = shipping_cost;
    }

    if (tax_amount !== undefined) {
      if (tax_amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Tax amount cannot be negative'
        });
      }
      updateData.tax_amount = tax_amount;
    }

    if (discount_amount !== undefined) {
      if (discount_amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount cannot be negative'
        });
      }
      updateData.discount_amount = discount_amount;
    }

    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    if (shipping_carrier !== undefined) updateData.shipping_carrier = shipping_carrier;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate grand total if financial fields are updated
    if (shipping_cost !== undefined || tax_amount !== undefined || discount_amount !== undefined) {
      const currentOrder = await Order.findById(orderId);
      const newShippingCost = shipping_cost !== undefined ? shipping_cost : currentOrder.shipping_cost;
      const newTaxAmount = tax_amount !== undefined ? tax_amount : currentOrder.tax_amount;
      const newDiscountAmount = discount_amount !== undefined ? discount_amount : currentOrder.discount_amount;
      
      updateData.grand_total_amount = currentOrder.subtotal_amount + newShippingCost + newTaxAmount - newDiscountAmount;
    }

    // Update timestamp
    updateData.updatedAt = new Date();

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user_id', 'email first_name last_name')
     .populate('payment_method_id');

    // Log admin activity
    await adminAuditLogger.logAdminActivity(
      req.user.id,
      'ADMIN_ORDER_UPDATED',
      'Order',
      orderId,
      {
        updated_fields: Object.keys(updateData),
        order_number: updatedOrder.order_number,
        user_email: updatedOrder.user_id.email
      }
    );

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: {
        order: updatedOrder
      }
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  processRefund,
  updateOrder
};
