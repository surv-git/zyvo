/**
 * User Activity Logger Configuration
 * 
 * This logger captures general user interactions with public-facing or non-admin API endpoints.
 * It's designed to track user behavior patterns, API usage, and general activity for analytics
 * and monitoring purposes.
 * 
 * Features:
 * - Daily log rotation for file management
 * - JSON format for structured logging
 * - Console output during development
 * - Detailed user context tracking
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.USER_ACTIVITY_LOG_LEVEL || 'info';

/**
 * Custom format for user activity logs
 * Ensures consistent structure across all user activity entries
 */
const userActivityFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Ensure required fields are present with defaults
    const logEntry = {
      timestamp: info.timestamp,
      level: info.level,
      user_id: info.user_id || 'guest',
      session_id: info.session_id || null,
      ip_address: info.ip_address || 'unknown',
      method: info.method || 'unknown',
      url: info.url || 'unknown',
      user_agent: info.user_agent || 'unknown',
      event_type: info.event_type || 'general_activity',
      details: info.details || {},
      response_time: info.response_time || null,
      status_code: info.status_code || null,
      ...info // Include any additional fields
    };
    
    return JSON.stringify(logEntry);
  })
);

/**
 * Daily rotating file transport configuration
 * Automatically rotates logs daily to prevent large files
 */
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs/user_activity-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress old log files
  maxSize: '20m', // Rotate when file reaches 20MB
  maxFiles: '14d', // Keep logs for 14 days
  format: userActivityFormat,
  level: LOG_LEVEL
});

/**
 * Console transport for development
 * Provides colorized output for easier debugging
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info) => {
      const { timestamp, level, user_id, method, url, event_type, details } = info;
      const userId = user_id === 'guest' ? 'guest' : `user:${user_id}`;
      const detailsStr = Object.keys(details || {}).length > 0 ? JSON.stringify(details) : '';
      
      return `${timestamp} [${level}] [${userId}] ${method} ${url} - ${event_type} ${detailsStr}`;
    })
  ),
  level: LOG_LEVEL
});

/**
 * Configure transports based on environment
 * Development: Console + File
 * Production: File only (for performance)
 */
const transports = [dailyRotateFileTransport];

if (NODE_ENV === 'development') {
  transports.push(consoleTransport);
}

/**
 * Create and configure the user activity logger
 */
const userActivityLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: userActivityFormat,
  transports: transports,
  exitOnError: false, // Don't exit on handled exceptions
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/user_activity_exceptions.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/user_activity_rejections.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

/**
 * Helper methods for common user activity logging patterns
 */
userActivityLogger.logUserActivity = function(activityData) {
  const {
    user_id = 'guest',
    session_id = null,
    ip_address,
    method,
    url,
    user_agent,
    event_type,
    details = {},
    response_time = null,
    status_code = null,
    level = 'info'
  } = activityData;

  this.log(level, {
    user_id,
    session_id,
    ip_address,
    method,
    url,
    user_agent,
    event_type,
    details,
    response_time,
    status_code
  });
};

/**
 * Convenience methods for common user activities
 */
userActivityLogger.logProductView = function(userId, productId, ip, userAgent) {
  this.logUserActivity({
    user_id: userId,
    event_type: 'product_viewed',
    details: { productId },
    ip_address: ip,
    user_agent: userAgent
  });
};

userActivityLogger.logSearch = function(userId, query, results, ip, userAgent) {
  this.logUserActivity({
    user_id: userId,
    event_type: 'search_performed',
    details: { query, resultCount: results },
    ip_address: ip,
    user_agent: userAgent
  });
};

userActivityLogger.logCartAction = function(userId, action, productId, ip, userAgent) {
  this.logUserActivity({
    user_id: userId,
    event_type: `cart_${action}`,
    details: { productId, action },
    ip_address: ip,
    user_agent: userAgent
  });
};

// Log successful logger initialization
userActivityLogger.info('User Activity Logger initialized', {
  event_type: 'logger_initialized',
  details: { 
    logLevel: LOG_LEVEL,
    environment: NODE_ENV,
    transports: transports.length
  }
});

module.exports = userActivityLogger;
