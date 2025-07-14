/**
 * Email Verification Utility
 * Handles sending email verification messages
 * This is a placeholder implementation that can be extended with actual email services
 */

const crypto = require('crypto');

/**
 * Send email verification email
 * @param {string} toEmail - Recipient email address
 * @param {string} verificationToken - Email verification token
 * @param {string} baseUrl - Base URL for verification link
 * @returns {Promise} Promise resolving to send result
 */
const sendVerificationEmail = async (toEmail, verificationToken, baseUrl = 'https://yourfrontend.com') => {
  try {
    // Validate inputs
    if (!toEmail || !verificationToken) {
      throw new Error('Email and verification token are required');
    }

    // Create verification URL
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Email content
    const subject = 'Please Verify Your Email Address - Zyvo';
    
    const message = `
Hello,

Thank you for registering with Zyvo! To complete your registration and activate your account, please verify your email address.

Click the following link to verify your email:
${verificationUrl}

If you didn't create an account with us, please ignore this email.

Important: This verification link will expire in 24 hours for security reasons.

Best regards,
The Zyvo Team
    `.trim();

    const htmlMessage = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
        
        <p>Hello,</p>
        
        <p>Thank you for registering with Zyvo! To complete your registration and activate your account, please verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        
        <p>If you didn't create an account with us, please ignore this email.</p>
        
        <p style="color: #d32f2f; font-weight: bold;">⚠️ Important: This verification link will expire in 24 hours for security reasons.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          Best regards,<br>
          The Zyvo Team
        </p>
      </div>
    `;

    // Send email using the actual email service
    const { sendEmail } = require('./sendEmail');
    await sendEmail({
      email: toEmail,
      subject,
      message,
      html: htmlMessage
    });

    // Log success for development
    console.log('📧 EMAIL VERIFICATION SENT');
    console.log('To:', toEmail);
    console.log('Subject:', subject);
    console.log('Verification URL:', verificationUrl);
    console.log('Token:', verificationToken);
    console.log('Expires in: 24 hours');
    console.log('---');

    return {
      success: true,
      message: 'Email verification sent successfully',
      verificationUrl,
      expiresIn: '24 hours'
    };
  } catch (error) {
    console.error('❌ Email verification sending failed:', {
      error: error.message,
      to: toEmail,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send email verification: ${error.message}`);
  }
};

/**
 * Generate secure email verification token
 * @returns {string} Secure random token
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash email verification token for database storage
 * @param {string} token - Plain text token
 * @returns {string} Hashed token
 */
const hashEmailVerificationToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Send email verification confirmation
 * @param {string} toEmail - Recipient email address
 * @returns {Promise} Promise resolving to send result
 */
const sendEmailVerificationConfirmation = async (toEmail) => {
  try {
    const subject = 'Email Verified Successfully - Zyvo';
    
    const message = `
Hello,

Great news! Your email address has been successfully verified.

You can now enjoy full access to all Zyvo features and services.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Zyvo Team
    `.trim();

    const htmlMessage = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #28a745; text-align: center;">Email Verified Successfully! ✅</h2>
        
        <p>Hello,</p>
        
        <p>Great news! Your email address has been successfully verified.</p>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>✅ Your account is now fully activated!</strong><br>
            You can now enjoy full access to all Zyvo features and services.
          </p>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          Best regards,<br>
          The Zyvo Team
        </p>
      </div>
    `;

    // Send email using the actual email service
    const { sendEmail } = require('./sendEmail');
    await sendEmail({
      email: toEmail,
      subject,
      message,
      html: htmlMessage
    });

    // Log success for development
    console.log('📧 EMAIL VERIFICATION CONFIRMATION SENT');
    console.log('To:', toEmail);
    console.log('Subject:', subject);
    console.log('Status: Email successfully verified');
    console.log('---');

    return {
      success: true,
      message: 'Email verification confirmation sent'
    };
  } catch (error) {
    console.error('❌ Email verification confirmation failed:', {
      error: error.message,
      to: toEmail,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send email verification confirmation: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail,
  generateEmailVerificationToken,
  hashEmailVerificationToken,
  sendEmailVerificationConfirmation
};
