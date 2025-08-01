/**
 * Razorpay Order Controller
 * Handles Razorpay payment integration for order processing
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
const razorpayService = require('../services/razorpay.service');
const userAuditLogger = require('../middleware/userAuditLogger');
const mongoose = require('mongoose');

/**
 * Create Razorpay order for payment
 * POST /api/v1/user/orders/razorpay/create
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping_address, billing_address, payment_method_id } = req.body;

    // Validate required addresses
    if (!shipping_address || !billing_address) {
      return res.status(400).json({
        success: false,
        message: 'Both shipping and billing addresses are required'
      });
    }

    // Get user's cart with items
    const cartData = await Cart.getCartWithItems(userId);
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const { cart, items: cartItems } = cartData;

    // Calculate order totals
    const subtotalAmount = await CartItem.getCartSubtotal(cart._id);
    const shippingCost = calculateShippingCost(cartItems, shipping_address);
    const taxAmount = calculateTaxAmount(subtotalAmount, shipping_address);
    const grandTotalAmount = subtotalAmount + shippingCost + taxAmount - cart.coupon_discount_amount;

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Create Razorpay order
    const razorpayOrderData = {
      amount: razorpayService.convertToPaise(grandTotalAmount), // Convert to paise
      currency: 'INR',
      receipt: razorpayService.generateReceiptId(orderNumber),
      notes: {
        order_number: orderNumber,
        user_id: userId.toString(),
        cart_id: cart._id.toString(),
        item_count: cartItems.length
      }
    };

    const razorpayResult = await razorpayService.createOrder(razorpayOrderData);

    if (!razorpayResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order',
        error: razorpayResult.error
      });
    }

    // Store order details temporarily (you might want to create a pending order record)
    const orderData = {
      user_id: userId,
      order_number: orderNumber,
      shipping_address,
      billing_address,
      payment_method_id,
      payment_gateway: 'RAZORPAY',
      razorpay_order_id: razorpayResult.data.id,
      subtotal_amount: subtotalAmount,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      discount_amount: cart.coupon_discount_amount,
      applied_coupon_code: cart.applied_coupon_code,
      grand_total_amount: grandTotalAmount,
      payment_status: 'PENDING',
      order_status: 'PENDING'
    };

    userAuditLogger.logActivity(userId, 'RAZORPAY_ORDER_CREATED', {
      razorpay_order_id: razorpayResult.data.id,
      order_number: orderNumber,
      amount: grandTotalAmount
    });

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        razorpay_order_id: razorpayResult.data.id,
        order_number: orderNumber,
        amount: razorpayResult.data.amount,
        currency: razorpayResult.data.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        order_details: {
          subtotal: subtotalAmount,
          shipping: shippingCost,
          tax: taxAmount,
          discount: cart.coupon_discount_amount,
          total: grandTotalAmount
        }
      }
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify payment and complete order
 * POST /api/v1/user/orders/razorpay/verify
 */
const verifyRazorpayPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        shipping_address,
        billing_address,
        payment_method_id
      } = req.body;

      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing required payment verification data');
      }

      // Verify payment signature
      const isValidSignature = razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isValidSignature) {
        throw new Error('Invalid payment signature');
      }

      // Get payment details from Razorpay
      const paymentResult = await razorpayService.getPaymentDetails(razorpay_payment_id);
      if (!paymentResult.success) {
        throw new Error('Failed to fetch payment details');
      }

      const paymentDetails = paymentResult.data;

      // Verify payment status
      if (paymentDetails.status !== 'captured') {
        throw new Error('Payment not captured successfully');
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
      const grandTotalAmount = subtotalAmount + shippingCost + taxAmount - finalDiscountAmount;

      // Verify payment amount matches order total
      const expectedAmountInPaise = razorpayService.convertToPaise(grandTotalAmount);
      if (paymentDetails.amount !== expectedAmountInPaise) {
        throw new Error('Payment amount mismatch');
      }

      // Inventory check and deduction
      const inventoryUpdates = [];
      for (const cartItem of cartItems) {
        const variantId = cartItem.product_variant_id._id;
        const requestedQuantity = cartItem.quantity;

        // Get pack details for inventory calculation
        const packDetails = await getVariantPackDetails(variantId);
        const requiredInventoryQuantity = requestedQuantity * packDetails.items_per_pack;

        // Check inventory availability
        const inventory = await Inventory.findOne({ product_variant_id: variantId });
        if (!inventory || inventory.available_quantity < requiredInventoryQuantity) {
          throw new Error(`Insufficient inventory for ${cartItem.product_variant_id.sku_code}`);
        }

        inventoryUpdates.push({
          variantId,
          requiredQuantity: requiredInventoryQuantity,
          currentQuantity: inventory.available_quantity
        });
      }

      // Generate order number from Razorpay order notes or create new one
      const orderNumber = paymentDetails.notes?.order_number || await Order.generateOrderNumber();

      // Create order
      const order = new Order({
        user_id: userId,
        order_number: orderNumber,
        shipping_address,
        billing_address,
        payment_method_id,
        payment_gateway: 'RAZORPAY',
        payment_status: 'PAID',
        order_status: 'PROCESSING',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_transaction_id: razorpay_payment_id,
        payment_method_details: {
          method: paymentDetails.method,
          bank: paymentDetails.bank,
          wallet: paymentDetails.wallet,
          vpa: paymentDetails.vpa,
          card_network: paymentDetails.card?.network,
          card_type: paymentDetails.card?.type
        },
        subtotal_amount: subtotalAmount,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        discount_amount: finalDiscountAmount,
        applied_coupon_code: cart.applied_coupon_code,
        grand_total_amount: grandTotalAmount
      });

      await order.save({ session });

      // Create order items
      const orderItems = [];
      for (const cartItem of cartItems) {
        const orderItem = new OrderItem({
          order_id: order._id,
          product_variant_id: cartItem.product_variant_id._id,
          quantity: cartItem.quantity,
          unit_price: cartItem.product_variant_id.current_price || cartItem.price_at_addition,
          total_price: (cartItem.product_variant_id.current_price || cartItem.price_at_addition) * cartItem.quantity
        });

        orderItems.push(orderItem);
      }

      await OrderItem.insertMany(orderItems, { session });

      // Update inventory
      for (const update of inventoryUpdates) {
        await Inventory.findOneAndUpdate(
          { product_variant_id: update.variantId },
          {
            $inc: { available_quantity: -update.requiredQuantity },
            $set: { updatedAt: new Date() }
          },
          { session }
        );
      }

      // Mark coupon as redeemed if applied
      if (cart.applied_coupon_code) {
        await UserCoupon.findOneAndUpdate(
          {
            user_id: userId,
            coupon_code: cart.applied_coupon_code,
            is_redeemed: false
          },
          {
            $set: {
              is_redeemed: true,
              redeemed_at: new Date(),
              order_id: order._id
            }
          },
          { session }
        );
      }

      // Clear cart
      await CartItem.deleteMany({ cart_id: cart._id }, { session });
      await Cart.findByIdAndUpdate(
        cart._id,
        {
          $set: {
            cart_total_amount: 0,
            applied_coupon_code: null,
            coupon_discount_amount: 0,
            last_updated_at: new Date()
          }
        },
        { session }
      );

      userAuditLogger.logActivity(userId, 'RAZORPAY_ORDER_COMPLETED', {
        order_id: order._id,
        order_number: order.order_number,
        razorpay_payment_id,
        amount: grandTotalAmount
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully with Razorpay payment',
        data: {
          order_id: order._id,
          order_number: order.order_number,
          payment_status: order.payment_status,
          order_status: order.order_status,
          grand_total_amount: order.grand_total_amount,
          razorpay_payment_id: order.razorpay_payment_id
        }
      });
    });

  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    
    userAuditLogger.logActivity(req.user.id, 'RAZORPAY_PAYMENT_FAILED', {
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      error: error.message
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Handle payment failure
 * POST /api/v1/user/orders/razorpay/failure
 */
const handlePaymentFailure = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, error } = req.body;

    userAuditLogger.logActivity(userId, 'RAZORPAY_PAYMENT_FAILED', {
      razorpay_order_id,
      razorpay_payment_id,
      error: error?.description || 'Payment failed'
    });

    res.status(200).json({
      success: false,
      message: 'Payment failed',
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        error: error?.description || 'Payment was not completed'
      }
    });

  } catch (error) {
    console.error('Payment failure handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper functions (same as in order.controller.js)
const calculateShippingCost = (cartItems, shippingAddress) => {
  // Basic shipping calculation - replace with actual logic
  const baseShippingCost = 50;
  const totalWeight = cartItems.reduce((total, item) => {
    const weight = item.product_variant_id.weight?.value || 0.5;
    return total + (weight * item.quantity);
  }, 0);

  // Weight-based shipping
  const weightBasedCost = Math.ceil(totalWeight / 1000) * 25;
  
  // Distance-based shipping (simplified)
  const distanceMultiplier = shippingAddress.state === 'Maharashtra' ? 1 : 1.5;
  
  return Math.round((baseShippingCost + weightBasedCost) * distanceMultiplier);
};

const calculateTaxAmount = (subtotal, shippingAddress) => {
  // GST calculation - 18% for most products
  const gstRate = 0.18;
  return Math.round(subtotal * gstRate * 100) / 100;
};

const getVariantPackDetails = async (variantId) => {
  // Default pack details - replace with actual logic
  return {
    items_per_pack: 1,
    pack_type: 'unit'
  };
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handlePaymentFailure
};
