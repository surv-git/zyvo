/**
 * SMS Verification Utility
 * Handles sending SMS verification messages
 * This is a placeholder implementation that can be extended with actual SMS services
 */

const crypto = require('crypto');

/**
 * Generate secure numeric OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Numeric OTP code
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Send SMS verification message
 * @param {string} toNumber - Recipient phone number
 * @param {string} otpCode - OTP code to send
 * @returns {Promise} Promise resolving to send result
 */
const sendVerificationSMS = async (toNumber, otpCode) => {
  try {
    // Validate inputs
    if (!toNumber || !otpCode) {
      throw new Error('Phone number and OTP code are required');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(toNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    // SMS content
    const message = `Your Zyvo verification code is: ${otpCode}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this message.

- Zyvo Team`;

    // For development: Log the SMS content instead of sending
    console.log('📱 SMS VERIFICATION SENT');
    console.log('To:', toNumber);
    console.log('OTP Code:', otpCode);
    console.log('Message:', message);
    console.log('Expires in: 5 minutes');
    console.log('---');

    // In production, you would use an actual SMS service here
    // Examples:
    // - Twilio: await twilioClient.messages.create({...})
    // - AWS SNS: await sns.publish({...}).promise()
    // - Nexmo/Vonage: await nexmo.message.sendSms(...)
    // - Firebase: await admin.messaging().send({...})

    // Simulate async SMS sending
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      message: 'SMS verification sent successfully',
      phoneNumber: toNumber,
      otpLength: otpCode.length,
      expiresIn: '5 minutes'
    };
  } catch (error) {
    console.error('❌ SMS verification sending failed:', {
      error: error.message,
      to: toNumber,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send SMS verification: ${error.message}`);
  }
};

/**
 * Send SMS verification confirmation
 * @param {string} toNumber - Recipient phone number
 * @returns {Promise} Promise resolving to send result
 */
const sendSMSVerificationConfirmation = async (toNumber) => {
  try {
    const message = `✅ Your phone number has been successfully verified with Zyvo!

Your account is now fully activated and you can enjoy all features.

Thank you for choosing Zyvo!

- Zyvo Team`;

    // For development: Log the confirmation
    console.log('📱 SMS VERIFICATION CONFIRMATION SENT');
    console.log('To:', toNumber);
    console.log('Message:', message);
    console.log('Status: Phone successfully verified');
    console.log('---');

    // Simulate async SMS sending
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      message: 'SMS verification confirmation sent'
    };
  } catch (error) {
    console.error('❌ SMS verification confirmation failed:', {
      error: error.message,
      to: toNumber,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send SMS verification confirmation: ${error.message}`);
  }
};

/**
 * Validate OTP code format
 * @param {string} otp - OTP code to validate
 * @param {number} expectedLength - Expected OTP length
 * @returns {boolean} True if valid format
 */
const validateOTPFormat = (otp, expectedLength = 6) => {
  if (!otp || typeof otp !== 'string') {
    return false;
  }

  // Check if OTP is numeric and has correct length
  const numericRegex = /^\d+$/;
  return numericRegex.test(otp) && otp.length === expectedLength;
};

/**
 * Hash OTP for secure storage (optional for added security)
 * @param {string} otp - Plain text OTP
 * @returns {string} Hashed OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Format phone number for display (mask middle digits)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneForDisplay = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length < 4) return phoneNumber;
  
  // Show first 2 and last 2 digits, mask the middle
  const firstPart = digits.slice(0, 2);
  const lastPart = digits.slice(-2);
  const middlePart = '*'.repeat(Math.max(0, digits.length - 4));
  
  return `+${firstPart}${middlePart}${lastPart}`;
};

module.exports = {
  sendVerificationSMS,
  sendSMSVerificationConfirmation,
  generateOTP,
  validateOTPFormat,
  hashOTP,
  formatPhoneForDisplay
};
