/**
 * Validation Middleware
 * Express-validator middleware for request validation
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation results
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} - Express middleware function
 */
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => validation.run(req)));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    next();
  };
};

/**
 * Middleware to sanitize request data
 * Removes undefined fields and trims strings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeRequest = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'string') {
          sanitized[key] = value.trim();
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  validateRequest,
  sanitizeRequest
};
