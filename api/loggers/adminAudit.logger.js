/**
 * Admin Audit Logger Configuration
 * 
 * This logger captures critical actions performed by authenticated administrators.
 * These logs are designed to be immutable and highly detailed for compliance,
 * security auditing, and forensic analysis.
 * 
 * Features:
 * - Daily log rotation with compression
 * - JSON format for structured logging
 * - Detailed change tracking
 * - Immutable audit trail
 * - Console output during development
 */

const winston = require('winston');
const path = require('path');

// Try to import DailyRotateFile, fallback for test environments
let DailyRotateFile;
try {
  DailyRotateFile = require('winston-daily-rotate-file');
} catch (error) {
  // In test environments or if package not installed, we'll use regular file transport
  console.warn('winston-daily-rotate-file not available, using regular file transport');
}

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.ADMIN_AUDIT_LOG_LEVEL || 'info';

/**
 * Custom format for admin audit logs
 * Ensures consistent structure and includes all required audit fields
 */
const adminAuditFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Ensure required fields are present with defaults
    const logEntry = {
      timestamp: info.timestamp,
      level: info.level,
      admin_id: info.admin_id || 'unknown',
      admin_username: info.admin_username || 'unknown',
      admin_role: info.admin_role || 'unknown',
      ip_address: info.ip_address || 'unknown',
      user_agent: info.user_agent || 'unknown',
      action_type: info.action_type || 'unknown_action',
      resource_type: info.resource_type || 'unknown_resource',
      resource_id: info.resource_id || null,
      changes: info.changes || null,
      status: info.status || 'unknown',
      error_message: info.error_message || null,
      request_id: info.request_id || null,
      session_id: info.session_id || null,
      method: info.method || 'unknown',
      url: info.url || 'unknown',
      duration: info.duration || null,
      ...info // Include any additional fields
    };
    
    return JSON.stringify(logEntry);
  })
);

/**
 * Daily rotating file transport for audit logs
 * Uses strict rotation and compression for long-term storage
 * Falls back to regular file transport in test environments
 */
let fileTransport;
if (DailyRotateFile && NODE_ENV !== 'test') {
  fileTransport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs/admin_audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // Compress old log files
    maxSize: '50m', // Rotate when file reaches 50MB
    maxFiles: '365d', // Keep audit logs for 1 year
    format: adminAuditFormat,
    level: LOG_LEVEL
  });
} else {
  // Fallback for test environments or when DailyRotateFile is not available
  fileTransport = new winston.transports.File({
    filename: path.join(__dirname, '../logs/admin_audit.log'),
    format: adminAuditFormat,
    level: LOG_LEVEL,
    maxsize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5
  });
}

/**
 * Console transport for development
 * Provides colorized output for easier debugging
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info) => {
      const { 
        timestamp, level, admin_username, action_type, 
        resource_type, resource_id, status, changes 
      } = info;
      
      const changesStr = changes ? JSON.stringify(changes) : '';
      const resourceStr = resource_id ? `${resource_type}:${resource_id}` : resource_type;
      
      return `${timestamp} [${level}] [${admin_username}] ${action_type} ${resourceStr} - ${status} ${changesStr}`;
    })
  ),
  level: LOG_LEVEL
});

/**
 * Configure transports based on environment
 * Development: Console + File
 * Production: File only (for performance and security)
 */
const transports = [fileTransport];

if (NODE_ENV === 'development') {
  transports.push(consoleTransport);
}

/**
 * Create and configure the admin audit logger
 */
const adminAuditLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: adminAuditFormat,
  transports: transports,
  exitOnError: false, // Don't exit on handled exceptions
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/admin_audit_exceptions.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/admin_audit_rejections.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

/**
 * Helper methods for common admin audit logging patterns
 */
adminAuditLogger.logAdminActivity = function(auditData) {
  const {
    admin_id,
    admin_username,
    admin_role = 'admin',
    ip_address,
    user_agent,
    action_type,
    resource_type,
    resource_id = null,
    changes = null,
    status = 'success',
    error_message = null,
    request_id = null,
    session_id = null,
    method = 'unknown',
    url = 'unknown',
    duration = null,
    level = 'info'
  } = auditData;

  this.log(level, {
    admin_id,
    admin_username,
    admin_role,
    ip_address,
    user_agent,
    action_type,
    resource_type,
    resource_id,
    changes,
    status,
    error_message,
    request_id,
    session_id,
    method,
    url,
    duration
  });
};

/**
 * Convenience methods for common admin activities
 */
adminAuditLogger.logResourceCreation = function(adminData, resourceType, resourceId, resourceData) {
  this.logAdminActivity({
    ...adminData,
    action_type: `${resourceType}_created`,
    resource_type: resourceType,
    resource_id: resourceId,
    changes: { created: resourceData },
    status: 'success'
  });
};

adminAuditLogger.logResourceUpdate = function(adminData, resourceType, resourceId, oldData, newData) {
  const changes = {};
  
  // Compare old and new data to track specific changes
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        oldValue: oldData[key],
        newValue: newData[key]
      };
    }
  });

  this.logAdminActivity({
    ...adminData,
    action_type: `${resourceType}_updated`,
    resource_type: resourceType,
    resource_id: resourceId,
    changes,
    status: 'success'
  });
};

adminAuditLogger.logResourceDeletion = function(adminData, resourceType, resourceId, deletedData) {
  this.logAdminActivity({
    ...adminData,
    action_type: `${resourceType}_deleted`,
    resource_type: resourceType,
    resource_id: resourceId,
    changes: { deleted: deletedData },
    status: 'success'
  });
};

adminAuditLogger.logUserAction = function(adminData, targetUserId, action, details = {}) {
  this.logAdminActivity({
    ...adminData,
    action_type: `user_${action}`,
    resource_type: 'user',
    resource_id: targetUserId,
    changes: details,
    status: 'success'
  });
};

adminAuditLogger.logSecurityEvent = function(adminData, eventType, details = {}) {
  this.logAdminActivity({
    ...adminData,
    action_type: `security_${eventType}`,
    resource_type: 'security',
    resource_id: null,
    changes: details,
    status: 'success',
    level: 'warn'
  });
};

adminAuditLogger.logFailedAction = function(adminData, actionType, resourceType, resourceId, errorMessage) {
  this.logAdminActivity({
    ...adminData,
    action_type: actionType,
    resource_type: resourceType,
    resource_id: resourceId,
    status: 'failure',
    error_message: errorMessage,
    level: 'error'
  });
};

// Log successful logger initialization
adminAuditLogger.info('Admin Audit Logger initialized', {
  admin_id: 'system',
  admin_username: 'system',
  action_type: 'logger_initialized',
  resource_type: 'system',
  status: 'success',
  changes: { 
    logLevel: LOG_LEVEL,
    environment: NODE_ENV,
    transports: transports.length
  }
});

module.exports = adminAuditLogger;
