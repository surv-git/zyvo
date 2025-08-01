/**
 * Razorpay Webhook Controller
 * Handles Razorpay webhook events for payment status updates
 */

const Order = require('../models/Order');
const razorpayService = require('../services/razorpay.service');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Handle Razorpay webhook events
 * POST /api/v1/webhooks/razorpay
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook configuration error'
      });
    }

    // Validate webhook signature
    const isValidSignature = razorpayService.validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event, payload } = req.body;
    
    // Log webhook event
    adminAuditLogger.logActivity('system', 'RAZORPAY_WEBHOOK_RECEIVED', {
      event,
      payment_id: payload.payment?.entity?.id,
      order_id: payload.payment?.entity?.order_id
    });

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      case 'payment.authorized':
        await handlePaymentAuthorized(payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload.order.entity);
        break;
        
      case 'refund.created':
        await handleRefundCreated(payload.refund.entity);
        break;
        
      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    
    adminAuditLogger.logActivity('system', 'RAZORPAY_WEBHOOK_ERROR', {
      error: error.message,
      event: req.body?.event
    });

    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

/**
 * Handle payment captured event
 */
const handlePaymentCaptured = async (payment) => {
  try {
    const order = await Order.findOne({ razorpay_order_id: payment.order_id });
    
    if (!order) {
      console.error(`Order not found for Razorpay order ID: ${payment.order_id}`);
      return;
    }

    // Update order with payment details
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        payment_status: 'PAID',
        razorpay_payment_id: payment.id,
        payment_transaction_id: payment.id,
        payment_method_details: {
          method: payment.method,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
          card_network: payment.card?.network,
          card_type: payment.card?.type
        },
        updatedAt: new Date()
      }
    });

    adminAuditLogger.logActivity('system', 'PAYMENT_CAPTURED_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      payment_id: payment.id,
      amount: payment.amount
    });

    console.log(`Payment captured for order ${order.order_number}: ${payment.id}`);
    
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
};

/**
 * Handle payment failed event
 */
const handlePaymentFailed = async (payment) => {
  try {
    const order = await Order.findOne({ razorpay_order_id: payment.order_id });
    
    if (!order) {
      console.error(`Order not found for Razorpay order ID: ${payment.order_id}`);
      return;
    }

    // Update order payment status
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        payment_status: 'FAILED',
        razorpay_payment_id: payment.id,
        payment_transaction_id: payment.id,
        updatedAt: new Date()
      }
    });

    adminAuditLogger.logActivity('system', 'PAYMENT_FAILED_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      payment_id: payment.id,
      error_code: payment.error_code,
      error_description: payment.error_description
    });

    console.log(`Payment failed for order ${order.order_number}: ${payment.id}`);
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

/**
 * Handle payment authorized event
 */
const handlePaymentAuthorized = async (payment) => {
  try {
    const order = await Order.findOne({ razorpay_order_id: payment.order_id });
    
    if (!order) {
      console.error(`Order not found for Razorpay order ID: ${payment.order_id}`);
      return;
    }

    // Update order with authorization details
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        payment_status: 'PENDING', // Still pending until captured
        razorpay_payment_id: payment.id,
        payment_transaction_id: payment.id,
        updatedAt: new Date()
      }
    });

    adminAuditLogger.logActivity('system', 'PAYMENT_AUTHORIZED_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      payment_id: payment.id,
      amount: payment.amount
    });

    console.log(`Payment authorized for order ${order.order_number}: ${payment.id}`);
    
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
};

/**
 * Handle order paid event
 */
const handleOrderPaid = async (razorpayOrder) => {
  try {
    const order = await Order.findOne({ razorpay_order_id: razorpayOrder.id });
    
    if (!order) {
      console.error(`Order not found for Razorpay order ID: ${razorpayOrder.id}`);
      return;
    }

    // Update order status if not already updated
    if (order.payment_status !== 'PAID') {
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          payment_status: 'PAID',
          order_status: 'PROCESSING',
          updatedAt: new Date()
        }
      });
    }

    adminAuditLogger.logActivity('system', 'ORDER_PAID_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount
    });

    console.log(`Order paid webhook for order ${order.order_number}`);
    
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
};

/**
 * Handle refund created event
 */
const handleRefundCreated = async (refund) => {
  try {
    const order = await Order.findOne({ razorpay_payment_id: refund.payment_id });
    
    if (!order) {
      console.error(`Order not found for payment ID: ${refund.payment_id}`);
      return;
    }

    // Update order refund status
    const refundStatus = refund.amount === order.grand_total_amount * 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        payment_status: refundStatus,
        updatedAt: new Date()
      }
    });

    adminAuditLogger.logActivity('system', 'REFUND_CREATED_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      refund_id: refund.id,
      refund_amount: refund.amount,
      refund_status: refundStatus
    });

    console.log(`Refund created for order ${order.order_number}: ${refund.id}`);
    
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
};

/**
 * Handle refund processed event
 */
const handleRefundProcessed = async (refund) => {
  try {
    const order = await Order.findOne({ razorpay_payment_id: refund.payment_id });
    
    if (!order) {
      console.error(`Order not found for payment ID: ${refund.payment_id}`);
      return;
    }

    adminAuditLogger.logActivity('system', 'REFUND_PROCESSED_WEBHOOK', {
      order_id: order._id,
      order_number: order.order_number,
      refund_id: refund.id,
      refund_amount: refund.amount,
      refund_status: refund.status
    });

    console.log(`Refund processed for order ${order.order_number}: ${refund.id}`);
    
  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
};

module.exports = {
  handleRazorpayWebhook
};
