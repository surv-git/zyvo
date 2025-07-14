/**
 * Logging Middleware
 * 
 * This module provides Express middleware for capturing user activity and admin audit logs.
 * It integrates with the Winston loggers to provide structured logging throughout the application.
 * 
 * Features:
 * - Automatic request/response logging
 * - User context detection
 * - Admin context detection
 * - Response time tracking
 * - Error logging integration
 */

const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Extract IP address from request
 * Handles various proxy configurations and forwarded headers
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Extract session ID from request
 * Supports various session implementations
 */
function getSessionID(req) {
  return req.sessionID || 
         req.session?.id || 
         req.headers['x-session-id'] ||
         null;
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestID() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * User Activity Logging Middleware
 * 
 * Captures general user interactions with public-facing API endpoints.
 * This middleware should be applied to all user-facing routes.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.defaultEventType - Default event type if not specified
 * @param {boolean} options.logResponseTime - Whether to log response time
 * @param {Array} options.excludePaths - Paths to exclude from logging
 */
function logUserActivityMiddleware(options = {}) {
  const {
    defaultEventType = 'api_request',
    logResponseTime = true,
    excludePaths = ['/health', '/favicon.ico']
  } = options;

  return (req, res, next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = generateRequestID();
    
    // Attach request ID to request for correlation
    req.requestId = requestId;

    // Extract request information
    const requestInfo = {
      request_id: requestId,
      user_id: req.user?.id || req.user?._id || 'guest',
      session_id: getSessionID(req),
      ip_address: getClientIP(req),
      method: req.method,
      url: req.originalUrl || req.url,
      user_agent: req.get('User-Agent') || 'unknown',
      event_type: defaultEventType,
      details: {
        query: req.query,
        params: req.params,
        body_size: req.get('Content-Length') || 0,
        referrer: req.get('Referrer') || null,
        origin: req.get('Origin') || null
      }
    };

    // Store request info on res.locals for use in controllers
    res.locals.requestInfo = requestInfo;

    // Hook into response to log completion
    const originalSend = res.send;
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      // Log the completed request
      userActivityLogger.logUserActivity({
        ...requestInfo,
        response_time: logResponseTime ? responseTime : null,
        status_code: res.statusCode,
        details: {
          ...requestInfo.details,
          response_size: body ? body.length : 0,
          cache_hit: res.get('X-Cache-Status') === 'HIT'
        }
      });

      // Call original send
      originalSend.call(this, body);
    };

    // Handle response errors
    const originalStatus = res.status;
    res.status = function(code) {
      if (code >= 400) {
        // Log error response
        userActivityLogger.logUserActivity({
          ...requestInfo,
          response_time: logResponseTime ? Date.now() - startTime : null,
          status_code: code,
          event_type: 'api_error',
          level: code >= 500 ? 'error' : 'warn'
        });
      }
      return originalStatus.call(this, code);
    };

    next();
  };
}

/**
 * Admin Activity Logging Middleware
 * 
 * Captures administrative actions and audit trail for admin endpoints.
 * This middleware should be applied specifically to admin routes.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.logAllRequests - Whether to log all admin requests
 * @param {Array} options.sensitiveFields - Fields to exclude from logging
 */
function logAdminActivityMiddleware(options = {}) {
  const {
    logAllRequests = true,
    sensitiveFields = ['password', 'token', 'secret']
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestID();
    
    // Attach request ID to request for correlation
    req.requestId = requestId;

    // Extract admin information
    const adminInfo = {
      request_id: requestId,
      admin_id: req.user?.id || req.user?._id || req.adminUser?.id || 'unknown',
      admin_username: req.user?.username || req.user?.email || req.adminUser?.username || 'unknown',
      admin_role: req.user?.role || req.adminUser?.role || 'admin',
      ip_address: getClientIP(req),
      user_agent: req.get('User-Agent') || 'unknown',
      session_id: getSessionID(req),
      method: req.method,
      url: req.originalUrl || req.url,
      action_type: 'admin_request',
      resource_type: 'admin_endpoint',
      status: 'initiated'
    };

    // Store admin info on res.locals for use in controllers
    res.locals.adminInfo = adminInfo;

    // Log all admin requests if enabled
    if (logAllRequests) {
      adminAuditLogger.logAdminActivity({
        ...adminInfo,
        changes: {
          query: req.query,
          params: req.params,
          // Filter sensitive fields from body
          body: filterSensitiveFields(req.body, sensitiveFields)
        }
      });
    }

    // Hook into response to log completion
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      
      // Log admin action completion
      adminAuditLogger.logAdminActivity({
        ...adminInfo,
        action_type: 'admin_request_completed',
        status: res.statusCode >= 400 ? 'failure' : 'success',
        duration,
        changes: {
          status_code: res.statusCode,
          response_size: body ? body.length : 0
        },
        level: res.statusCode >= 400 ? 'warn' : 'info'
      });

      // Call original send
      originalSend.call(this, body);
    };

    // Handle errors
    const originalStatus = res.status;
    res.status = function(code) {
      if (code >= 400) {
        adminAuditLogger.logAdminActivity({
          ...adminInfo,
          action_type: 'admin_request_error',
          status: 'failure',
          duration: Date.now() - startTime,
          error_message: `HTTP ${code} Error`,
          level: code >= 500 ? 'error' : 'warn'
        });
      }
      return originalStatus.call(this, code);
    };

    next();
  };
}

/**
 * Filter sensitive fields from objects
 * Recursively removes sensitive data from request bodies
 */
function filterSensitiveFields(obj, sensitiveFields) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        filtered[key] = '[FILTERED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        filtered[key] = filterSensitiveFields(obj[key], sensitiveFields);
      } else {
        filtered[key] = obj[key];
      }
    }
  }
  
  return filtered;
}

/**
 * Error Logging Middleware
 * 
 * Captures and logs application errors to appropriate loggers
 * Should be used as the final error handling middleware
 */
function logErrorMiddleware(err, req, res, next) {
  const isAdminRoute = req.originalUrl.includes('/admin');
  const logger = isAdminRoute ? adminAuditLogger : userActivityLogger;
  
  const errorInfo = {
    error_message: err.message,
    error_stack: err.stack,
    request_id: req.requestId,
    ip_address: getClientIP(req),
    method: req.method,
    url: req.originalUrl || req.url,
    user_agent: req.get('User-Agent') || 'unknown',
    status_code: err.statusCode || 500,
    level: 'error'
  };

  if (isAdminRoute) {
    // Log admin errors with audit context
    logger.logAdminActivity({
      ...errorInfo,
      admin_id: req.user?.id || req.adminUser?.id || 'unknown',
      admin_username: req.user?.username || req.adminUser?.username || 'unknown',
      action_type: 'admin_error',
      resource_type: 'admin_endpoint',
      status: 'failure',
      error_message: err.message
    });
  } else {
    // Log user errors
    logger.logUserActivity({
      ...errorInfo,
      user_id: req.user?.id || 'guest',
      session_id: getSessionID(req),
      event_type: 'application_error',
      details: {
        error_type: err.name,
        error_code: err.code
      }
    });
  }

  next(err);
}

/**
 * Request Correlation Middleware
 * 
 * Adds correlation IDs to requests for tracing across services
 */
function requestCorrelationMiddleware(req, res, next) {
  const correlationId = req.get('X-Correlation-ID') || generateRequestID();
  
  req.correlationId = correlationId;
  res.set('X-Correlation-ID', correlationId);
  
  next();
}

module.exports = {
  logUserActivityMiddleware,
  logAdminActivityMiddleware,
  logErrorMiddleware,
  requestCorrelationMiddleware,
  getClientIP,
  getSessionID,
  generateRequestID,
  filterSensitiveFields
};
