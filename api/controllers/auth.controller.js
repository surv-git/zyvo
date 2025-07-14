/**
 * Authentication Controller
 * Handles comprehensive user authentication including registration, login, logout,
 * token refresh, and password reset functionality
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens } = require('../utils/generateTokens');
const { sendEmail } = require('../utils/sendEmail');
const { sendVerificationEmail, generateEmailVerificationToken } = require('../utils/sendVerificationEmail');
const { sendVerificationSMS, generateOTP, validateOTPFormat } = require('../utils/sendVerificationSMS');
// const { userActivityLogger } = require('../utils/logger'); // Uncomment when logger is available

/**
 * User Registration
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const registerUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { name: name.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'User with this email already exists'
          : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      is_email_verified: false,
      is_phone_verified: false
    };

    const user = new User(userData);
    await user.save();

    // Generate tokens for immediate login after registration
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Automatically trigger email verification
    try {
      const emailToken = generateEmailVerificationToken();
      user.email_verification_token = emailToken;
      user.email_verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      await sendVerificationEmail(user.email, emailToken);
      
      // Log email verification request
      // userActivityLogger.info('Email verification sent after registration', {
      //   userId: user._id,
      //   email: user.email,
      //   timestamp: new Date()
      // });
    } catch (error) {
      console.error('Failed to send email verification after registration:', error.message);
      // Continue with registration even if email fails
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log successful registration
    // userActivityLogger.info('User registered successfully', {
    //   userId: user._id,
    //   email: user.email,
    //   role: user.role,
    //   timestamp: new Date()
    // });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      accessToken,
      user: userResponse,
      verificationStatus: {
        emailVerified: user.is_email_verified,
        phoneVerified: user.is_phone_verified,
        emailVerificationRequired: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Login
 * @route POST /api/auth/login
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const loginUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Check verification status and add to response
    const verificationStatus = {
      is_email_verified: user.is_email_verified,
      is_phone_verified: user.is_phone_verified
    };

    let verificationMessage = '';
    if (!user.is_email_verified || !user.is_phone_verified) {
      const pending = [];
      if (!user.is_email_verified) pending.push('email');
      if (!user.is_phone_verified) pending.push('phone');
      verificationMessage = `Please verify your ${pending.join(' and ')} to access all features.`;
    }

    // Log successful login
    // userActivityLogger.info('User logged in successfully', {
    //   userId: user._id,
    //   email: user.email,
    //   timestamp: new Date()
    // });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: userResponse,
      verification: verificationStatus,
      ...(verificationMessage && { verificationMessage })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Logout
 * @route POST /api/auth/logout
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logoutUser = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Log logout
    // userActivityLogger.info('User logged out successfully', {
    //   userId: req.user?._id,
    //   email: req.user?.email,
    //   timestamp: new Date()
    // });

    res.status(204).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 * @route POST /api/auth/refresh-token
 * @access Public (requires refresh token cookie)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log token refresh
    // userActivityLogger.info('Access token refreshed', {
    //   userId: user._id,
    //   email: user.email,
    //   timestamp: new Date()
    // });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password Request
 * @route POST /api/auth/forgot-password
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const forgotPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Email content
    const message = `
      You are receiving this email because you (or someone else) has requested a password reset.
      
      Please click on the following link to reset your password:
      ${resetUrl}
      
      If you did not request this, please ignore this email and your password will remain unchanged.
      
      This link will expire in 10 minutes.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message
      });

      // Log password reset request
      // userActivityLogger.info('Password reset requested', {
      //   userId: user._id,
      //   email: user.email,
      //   timestamp: new Date()
      // });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Hash the token from URL
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log password reset success
    // userActivityLogger.info('Password reset successful', {
    //   userId: user._id,
    //   email: user.email,
    //   timestamp: new Date()
    // });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    // User is already attached to req by auth middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Email Verification
 * @route POST /api/auth/verify-email/request
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Check if email is already verified
    if (req.user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check for rate limiting (basic implementation)
    const user = await User.findById(userId);
    if (user.email_verification_token_expires && 
        user.email_verification_token_expires > new Date()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification email'
      });
    }

    // Generate verification token
    const verificationToken = generateEmailVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with token
    user.email_verification_token = verificationToken;
    user.email_verification_token_expires = tokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(userEmail, verificationToken);
      
      // Log verification request
      // userActivityLogger.info('Email verification requested', {
      //   userId: userId,
      //   email: userEmail,
      //   timestamp: new Date()
      // });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      // Clear token if email fails
      user.email_verification_token = undefined;
      user.email_verification_token_expires = undefined;
      await user.save();

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Email Verification
 * @route POST /api/auth/verify-email/complete
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const completeEmailVerification = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by token
    const user = await User.findOne({
      email_verification_token: token,
      email_verification_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if already verified
    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Mark email as verified and clear token
    user.is_email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_token_expires = undefined;
    await user.save();

    // Log successful verification
    // userActivityLogger.info('Email verified successfully', {
    //   userId: user._id,
    //   email: user.email,
    //   timestamp: new Date()
    // });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Phone Verification
 * @route POST /api/auth/verify-phone/request
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestPhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userPhone = req.user.phone;

    // Check if phone number exists
    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for verification'
      });
    }

    // Check if phone is already verified
    if (req.user.is_phone_verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Check for rate limiting (basic implementation)
    const user = await User.findById(userId);
    if (user.phone_otp_expires && user.phone_otp_expires > new Date()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification code'
      });
    }

    // Generate OTP
    const otpCode = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with OTP
    user.phone_otp_code = otpCode;
    user.phone_otp_expires = otpExpiry;
    await user.save();

    // Send verification SMS
    try {
      await sendVerificationSMS(userPhone, otpCode);
      
      // Log verification request
      // userActivityLogger.info('Phone verification requested', {
      //   userId: userId,
      //   phone: userPhone,
      //   timestamp: new Date()
      // });

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      // Clear OTP if SMS fails
      user.phone_otp_code = undefined;
      user.phone_otp_expires = undefined;
      await user.save();

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Phone Verification
 * @route POST /api/auth/verify-phone/complete
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const completePhoneVerification = async (req, res, next) => {
  try {
    const { otp_code } = req.body;
    const userId = req.user._id;

    if (!otp_code) {
      return res.status(400).json({
        success: false,
        message: 'OTP code is required'
      });
    }

    // Validate OTP format
    if (!validateOTPFormat(otp_code, 6)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }

    // Find user and check OTP
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP is valid and not expired
    if (!user.phone_otp_code || 
        user.phone_otp_code !== otp_code || 
        !user.phone_otp_expires || 
        user.phone_otp_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code'
      });
    }

    // Check if already verified
    if (user.is_phone_verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Mark phone as verified and clear OTP
    user.is_phone_verified = true;
    user.phone_otp_code = undefined;
    user.phone_otp_expires = undefined;
    await user.save();

    // Log successful verification
    // userActivityLogger.info('Phone verified successfully', {
    //   userId: user._id,
    //   phone: user.phone,
    //   timestamp: new Date()
    // });

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getProfile,
  requestEmailVerification,
  completeEmailVerification,
  requestPhoneVerification,
  completePhoneVerification
};
