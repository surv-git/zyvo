/**
 * Wallet Callback Routes
 * Routes for payment gateway callbacks (Internal/Protected)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const { handleTopupCallback } = require('../controllers/wallet.controller');

// Import validation
const { validatePaymentCallback } = require('../middleware/walletValidation');

/**
 * Payment Gateway Signature Verification Middleware
 * In a real implementation, this would verify the webhook signature
 * from your payment gateway (Razorpay, Stripe, PayU, etc.)
 */
const verifyGatewaySignature = (req, res, next) => {
  // Mock signature verification
  // In production, implement actual signature verification based on your gateway
  
  const signature = req.headers['x-gateway-signature'];
  const timestamp = req.headers['x-gateway-timestamp'];
  
  // For demo purposes, we'll accept any request
  // In production, verify the signature using your gateway's secret key
  if (!signature) {
    console.warn('Missing gateway signature in webhook request');
  }
  
  // Log the callback for debugging
  console.log('Payment gateway callback received:', {
    signature,
    timestamp,
    body: req.body,
    ip: req.ip
  });
  
  next();
};

/**
 * @route   POST /api/v1/wallet/topup/callback
 * @desc    Handle payment gateway callback for wallet top-up
 * @access  Internal (Payment Gateway only)
 * @note    This endpoint should be secured with signature verification
 */
router.post('/topup/callback', 
  verifyGatewaySignature,
  validatePaymentCallback,
  handleTopupCallback
);

/**
 * @route   GET /api/v1/wallet/callback/health
 * @desc    Health check endpoint for payment gateway
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Wallet callback service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
