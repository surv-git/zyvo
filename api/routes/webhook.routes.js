/**
 * Webhook Routes
 * Handles external service webhooks
 */

const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/razorpayWebhook.controller');

/**
 * @route   POST /api/v1/webhooks/razorpay
 * @desc    Handle Razorpay webhook events
 * @access  Public (Webhook)
 */
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
