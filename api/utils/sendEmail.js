/**
 * Email Service Utility
 * Handles sending emails for authentication-related operations
 * This is a placeholder implementation that can be extended with actual email services
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 * @returns {Object} Nodemailer transporter instance
 */
const createTransporter = () => {
  // Environment-based configuration
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.pass'
    }
  };

  // Create transporter
  const transporter = nodemailer.createTransport(emailConfig);

  return transporter;
};

/**
 * Send email using configured transporter
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message content
 * @param {string} options.html - HTML email content (optional)
 * @returns {Promise} Promise resolving to email send result
 */
const sendEmail = async (options) => {
  try {
    // Validate required options
    if (!options.email || !options.subject || !options.message) {
      throw new Error('Email, subject, and message are required');
    }

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@zyvo.com',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Log success (in production, use proper logging)
    console.log('Email sent successfully:', {
      messageId: result.messageId,
      to: options.email,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    // Log error (in production, use proper logging)
    console.error('Email sending failed:', {
      error: error.message,
      to: options.email,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.resetUrl - Password reset URL
 * @param {string} options.userName - User's name
 * @returns {Promise} Promise resolving to email send result
 */
const sendPasswordResetEmail = async (options) => {
  const { email, resetUrl, userName } = options;

  const subject = 'Password Reset Request - Zyvo';
  
  const message = `
Hello ${userName || 'User'},

You are receiving this email because you (or someone else) has requested a password reset for your account.

Please click on the following link to reset your password:
${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.

Important: This link will expire in 10 minutes for security reasons.

Best regards,
The Zyvo Team
  `.trim();

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
      
      <p>Hello ${userName || 'User'},</p>
      
      <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      
      <p style="color: #d32f2f; font-weight: bold;">⚠️ Important: This link will expire in 10 minutes for security reasons.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Best regards,<br>
        The Zyvo Team
      </p>
    </div>
  `;

  return await sendEmail({
    email,
    subject,
    message,
    html
  });
};

/**
 * Send welcome email to new users
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.userName - User's name
 * @returns {Promise} Promise resolving to email send result
 */
const sendWelcomeEmail = async (options) => {
  const { email, userName } = options;

  const subject = 'Welcome to Zyvo - Your Account is Ready!';
  
  const message = `
Hello ${userName || 'User'},

Welcome to Zyvo! Your account has been successfully created.

You can now start exploring our platform and enjoy all the features we have to offer.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Zyvo Team
  `.trim();

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333; text-align: center;">Welcome to Zyvo! 🎉</h2>
      
      <p>Hello ${userName || 'User'},</p>
      
      <p>Welcome to Zyvo! Your account has been successfully created.</p>
      
      <p>You can now start exploring our platform and enjoy all the features we have to offer.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">What's next?</h3>
        <ul style="color: #666;">
          <li>Complete your profile</li>
          <li>Browse our products</li>
          <li>Start shopping</li>
          <li>Join our community</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Best regards,<br>
        The Zyvo Team
      </p>
    </div>
  `;

  return await sendEmail({
    email,
    subject,
    message,
    html
  });
};

/**
 * Send email verification email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.verificationUrl - Email verification URL
 * @param {string} options.userName - User's name
 * @returns {Promise} Promise resolving to email send result
 */
const sendVerificationEmail = async (options) => {
  const { email, verificationUrl, userName } = options;

  const subject = 'Please Verify Your Email - Zyvo';
  
  const message = `
Hello ${userName || 'User'},

Thank you for registering with Zyvo! To complete your registration, please verify your email address.

Please click on the following link to verify your email:
${verificationUrl}

This link will expire in 24 hours for security reasons.

Best regards,
The Zyvo Team
  `.trim();

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
      
      <p>Hello ${userName || 'User'},</p>
      
      <p>Thank you for registering with Zyvo! To complete your registration, please verify your email address.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      
      <p style="color: #d32f2f; font-weight: bold;">⚠️ This link will expire in 24 hours for security reasons.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Best regards,<br>
        The Zyvo Team
      </p>
    </div>
  `;

  return await sendEmail({
    email,
    subject,
    message,
    html
  });
};

/**
 * Test email configuration
 * @returns {Promise} Promise resolving to test result
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    
    console.log('Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  testEmailConfig
};
