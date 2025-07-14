const PaymentMethod = require('../models/PaymentMethod');
const { validationResult } = require('express-validator');
const userActivityLogger = require('../loggers/userActivity.logger');

/**
 * Payment Method Controller
 * Handles secure management of user payment methods
 * 
 * Security Features:
 * - All sensitive data is encrypted at model level
 * - Payment gateway tokens never exposed in responses
 * - Comprehensive input validation
 * - User activity logging for audit trails
 */

/**
 * Add a new payment method for the authenticated user
 * POST /api/v1/user/payment-methods
 */
const addPaymentMethod = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { method_type, alias, is_default = false, details } = req.body;
    const user_id = req.user.id;

    // Validate details structure based on method type
    const validationError = validateDetailsForMethodType(method_type, details);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Check for duplicate UPI ID or tokens for the same user
    const duplicateCheck = await checkForDuplicates(user_id, method_type, details);
    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        success: false,
        message: duplicateCheck.message
      });
    }

    // Create new payment method
    const paymentMethod = new PaymentMethod({
      user_id,
      method_type,
      alias: alias || null,
      is_default,
      details
    });

    await paymentMethod.save();

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'add_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: paymentMethod._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        method_type,
        is_default,
        alias: alias || null
      }
    });

    // Return sanitized response (without sensitive tokens)
    const responseData = paymentMethod.toSafeObject();

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error adding payment method:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    next(error);
  }
};

/**
 * Get all payment methods for the authenticated user
 * GET /api/v1/user/payment-methods
 */
const getAllPaymentMethods = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { include_inactive = false } = req.query;

    // Build query filter
    const filter = { user_id };
    if (!include_inactive || include_inactive === 'false') {
      filter.is_active = true;
    }

    // Find payment methods
    const paymentMethods = await PaymentMethod.find(filter)
      .sort({ is_default: -1, createdAt: -1 });

    // Sanitize response data (remove sensitive tokens)
    const sanitizedMethods = paymentMethods.map(method => method.toSafeObject());

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'view_payment_methods',
      resource_type: 'PaymentMethod',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        count: sanitizedMethods.length,
        include_inactive: include_inactive === 'true'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: sanitizedMethods,
      pagination: {
        total: sanitizedMethods.length,
        active: sanitizedMethods.filter(method => method.is_active).length,
        default: sanitizedMethods.find(method => method.is_default)?._id || null
      }
    });

  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    next(error);
  }
};

/**
 * Get a specific payment method by ID
 * GET /api/v1/user/payment-methods/:id
 */
const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Find payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id,
      is_active: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'view_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Return sanitized response
    const responseData = paymentMethod.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Payment method retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error retrieving payment method:', error);
    next(error);
  }
};

/**
 * Update a payment method (non-sensitive details only)
 * PATCH /api/v1/user/payment-methods/:id
 */
const updatePaymentMethod = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const user_id = req.user.id;
    const { alias, is_default, details } = req.body;

    // Find payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id,
      is_active: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Track changes for audit logging
    const changes = {};

    // Update allowed fields
    if (alias !== undefined) {
      changes.alias = { from: paymentMethod.alias, to: alias };
      paymentMethod.alias = alias;
    }

    if (is_default !== undefined) {
      changes.is_default = { from: paymentMethod.is_default, to: is_default };
      paymentMethod.is_default = is_default;
    }

    // Update non-sensitive details fields only
    if (details) {
      const allowedUpdates = getAllowedDetailsUpdates(paymentMethod.method_type, details);
      if (allowedUpdates.error) {
        return res.status(400).json({
          success: false,
          message: allowedUpdates.error
        });
      }

      if (Object.keys(allowedUpdates.updates).length > 0) {
        changes.details = allowedUpdates.updates;
        Object.assign(paymentMethod.details, allowedUpdates.updates);
        paymentMethod.markModified('details');
      }
    }

    await paymentMethod.save();

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'update_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: { changes }
    });

    // Return sanitized response
    const responseData = paymentMethod.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    next(error);
  }
};

/**
 * Delete a payment method (soft delete)
 * DELETE /api/v1/user/payment-methods/:id
 */
const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { hard_delete = false } = req.query;

    // Find payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    if (!paymentMethod.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Payment method already deactivated'
      });
    }

    const wasDefault = paymentMethod.is_default;

    if (hard_delete === 'true') {
      // Hard delete - completely remove from database
      await PaymentMethod.deleteOne({ _id: id });
    } else {
      // Soft delete - set as inactive
      paymentMethod.is_active = false;
      paymentMethod.is_default = false;
      await paymentMethod.save();
    }

    // If deleted method was default, optionally set another as default
    if (wasDefault && hard_delete !== 'true') {
      const nextMethod = await PaymentMethod.findOne({
        user_id,
        is_active: true,
        _id: { $ne: id }
      }).sort({ createdAt: -1 });

      if (nextMethod) {
        nextMethod.is_default = true;
        await nextMethod.save();
      }
    }

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: hard_delete === 'true' ? 'hard_delete_payment_method' : 'delete_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      details: {
        was_default: wasDefault,
        method_type: paymentMethod.method_type
      }
    });

    res.status(204).json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    next(error);
  }
};

/**
 * Set a payment method as default
 * PATCH /api/v1/user/payment-methods/:id/default
 */
const setAsDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Use the static method to ensure atomicity
    await PaymentMethod.setAsDefault(id, user_id);

    // Verify the update was successful
    const updatedMethod = await PaymentMethod.findOne({
      _id: id,
      user_id,
      is_active: true
    });

    if (!updatedMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'set_default_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Return sanitized response
    const responseData = updatedMethod.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Default payment method updated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    next(error);
  }
};

/**
 * Get user's default payment method
 * GET /api/v1/user/payment-methods/default
 */
const getDefaultPaymentMethod = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const defaultMethod = await PaymentMethod.findDefaultForUser(user_id);

    if (!defaultMethod) {
      return res.status(404).json({
        success: false,
        message: 'No default payment method found'
      });
    }

    // Log user activity
    await userActivityLogger.log({
      user_id,
      action: 'view_default_payment_method',
      resource_type: 'PaymentMethod',
      resource_id: defaultMethod._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Return sanitized response
    const responseData = defaultMethod.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Default payment method retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error retrieving default payment method:', error);
    next(error);
  }
};

// Helper Functions

/**
 * Validate details object structure based on method type
 */
const validateDetailsForMethodType = (methodType, details) => {
  if (!details || typeof details !== 'object') {
    return 'Details object is required';
  }

  switch (methodType) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      if (!details.card_brand || !details.last4_digits || 
          !details.expiry_month || !details.expiry_year || 
          !details.card_holder_name || !details.token) {
        return 'Card details must include card_brand, last4_digits, expiry_month, expiry_year, card_holder_name, and token';
      }
      break;

    case 'UPI':
      if (!details.upi_id || !details.account_holder_name) {
        return 'UPI details must include upi_id and account_holder_name';
      }
      break;

    case 'WALLET':
      if (!details.wallet_provider) {
        return 'Wallet details must include wallet_provider';
      }
      break;

    case 'NETBANKING':
      if (!details.bank_name || !details.account_holder_name) {
        return 'Net Banking details must include bank_name and account_holder_name';
      }
      break;
  }

  return null; // No validation error
};

/**
 * Check for duplicate payment methods
 */
const checkForDuplicates = async (userId, methodType, details) => {
  try {
    let duplicateQuery = { user_id: userId, is_active: true };

    switch (methodType) {
      case 'UPI':
        // Check for duplicate UPI ID
        const existingUPI = await PaymentMethod.findOne({
          ...duplicateQuery,
          method_type: 'UPI'
        });
        
        if (existingUPI && existingUPI.details.upi_id === details.upi_id) {
          return {
            isDuplicate: true,
            message: 'This UPI ID is already registered'
          };
        }
        break;

      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        // Check for duplicate card tokens
        const existingCard = await PaymentMethod.findOne({
          ...duplicateQuery,
          method_type: { $in: ['CREDIT_CARD', 'DEBIT_CARD'] }
        });

        if (existingCard && existingCard.details.token === details.token) {
          return {
            isDuplicate: true,
            message: 'This card is already registered'
          };
        }
        break;
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false };
  }
};

/**
 * Get allowed updates for details fields (non-sensitive only)
 */
const getAllowedDetailsUpdates = (methodType, details) => {
  const updates = {};

  switch (methodType) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      // Only allow card holder name updates
      if (details.card_holder_name !== undefined) {
        updates.card_holder_name = details.card_holder_name;
      }
      
      // Reject attempts to update sensitive card data
      if (details.last4_digits || details.token || details.expiry_month || details.expiry_year) {
        return { error: 'Card sensitive details cannot be updated. Please add a new payment method.' };
      }
      break;

    case 'UPI':
      // Only allow account holder name updates
      if (details.account_holder_name !== undefined) {
        updates.account_holder_name = details.account_holder_name;
      }
      
      // Reject UPI ID changes
      if (details.upi_id) {
        return { error: 'UPI ID cannot be updated. Please add a new payment method.' };
      }
      break;

    case 'WALLET':
      // Allow wallet provider updates and account identifier
      if (details.wallet_provider !== undefined) {
        updates.wallet_provider = details.wallet_provider;
      }
      if (details.linked_account_identifier !== undefined) {
        updates.linked_account_identifier = details.linked_account_identifier;
      }
      break;

    case 'NETBANKING':
      // Allow account holder name and bank name updates
      if (details.account_holder_name !== undefined) {
        updates.account_holder_name = details.account_holder_name;
      }
      if (details.bank_name !== undefined) {
        updates.bank_name = details.bank_name;
      }
      
      // Reject token changes
      if (details.token) {
        return { error: 'Net Banking token cannot be updated. Please add a new payment method.' };
      }
      break;
  }

  return { updates };
};

module.exports = {
  addPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  setAsDefaultPaymentMethod,
  getDefaultPaymentMethod
};
