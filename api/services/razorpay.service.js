/**
 * Razorpay Payment Gateway Service
 * Handles Razorpay payment operations for order processing
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    // Initialize Razorpay instance
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order details
   * @param {number} orderData.amount - Amount in smallest currency unit (paise for INR)
   * @param {string} orderData.currency - Currency code (default: INR)
   * @param {string} orderData.receipt - Unique receipt ID
   * @param {Object} orderData.notes - Additional notes
   * @returns {Promise<Object>} Razorpay order object
   */
  async createOrder(orderData) {
    try {
      const options = {
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {},
        payment_capture: 1 // Auto capture payment
      };

      const razorpayOrder = await this.razorpay.orders.create(options);
      return {
        success: true,
        data: razorpayOrder
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment verification data
   * @param {string} paymentData.razorpay_order_id - Razorpay order ID
   * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
   * @param {string} paymentData.razorpay_signature - Razorpay signature
   * @returns {boolean} Verification result
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      // Create signature string
      const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(signatureString)
        .digest('hex');
      
      // Compare signatures
      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Fetch payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        success: true,
        data: payment
      };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Capture payment (if not auto-captured)
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to capture in paise
   * @param {string} currency - Currency code
   * @returns {Promise<Object>} Capture result
   */
  async capturePayment(paymentId, amount, currency = 'INR') {
    try {
      const captureResult = await this.razorpay.payments.capture(paymentId, amount, currency);
      return {
        success: true,
        data: captureResult
      };
    } catch (error) {
      console.error('Payment capture failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {Object} refundData - Refund details
   * @param {number} refundData.amount - Refund amount in paise (optional, full refund if not provided)
   * @param {Object} refundData.notes - Additional notes
   * @returns {Promise<Object>} Refund result
   */
  async createRefund(paymentId, refundData = {}) {
    try {
      const refundOptions = {
        payment_id: paymentId,
        notes: refundData.notes || {}
      };

      // Add amount if partial refund
      if (refundData.amount) {
        refundOptions.amount = refundData.amount;
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      return {
        success: true,
        data: refund
      };
    } catch (error) {
      console.error('Refund creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get refund details
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  async getRefundDetails(refundId) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      return {
        success: true,
        data: refund
      };
    } catch (error) {
      console.error('Failed to fetch refund details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate webhook signature
   * @param {string} body - Raw webhook body
   * @param {string} signature - Webhook signature from headers
   * @param {string} secret - Webhook secret
   * @returns {boolean} Validation result
   */
  validateWebhookSignature(body, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      return false;
    }
  }

  /**
   * Convert amount to paise (smallest currency unit)
   * @param {number} amount - Amount in rupees
   * @returns {number} Amount in paise
   */
  convertToPaise(amount) {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from paise to rupees
   * @param {number} amountInPaise - Amount in paise
   * @returns {number} Amount in rupees
   */
  convertFromPaise(amountInPaise) {
    return amountInPaise / 100;
  }

  /**
   * Generate receipt ID
   * @param {string} orderNumber - Order number
   * @returns {string} Receipt ID
   */
  generateReceiptId(orderNumber) {
    return `receipt_${orderNumber}_${Date.now()}`;
  }
}

module.exports = new RazorpayService();
