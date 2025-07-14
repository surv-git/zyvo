/**
 * User Activity Audit Logger Middleware
 * 
 * Provides logging for user activities within the application.
 * Integrates with the user audit logging system to track user actions.
 * 
 * @author Zyvo Development Team
 * @version 1.0.0
 */

/**
 * Logs user activity for audit purposes
 * @param {string} userId - The ID of the user performing the action
 * @param {string} action - The action being performed
 * @param {Object} context - Additional context about the action
 * @param {Object} context.metadata - Optional metadata about the action
 * @param {string} context.resource - Resource being acted upon
 * @param {Object} context.changes - Changes made (for update operations)
 * @returns {Promise<void>}
 */
const logActivity = async (userId, action, context = {}) => {
  try {
    // In a real implementation, this would write to a database or external logging service
    // For now, we'll use console logging with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      context,
      ip: context.ip || 'unknown',
      userAgent: context.userAgent || 'unknown'
    };

    // In development/test environments, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('User Activity:', JSON.stringify(logEntry, null, 2));
    }

    // TODO: In production, implement proper audit logging:
    // - Write to audit database table
    // - Send to external logging service (e.g., CloudWatch, ELK stack)
    // - Implement log rotation and retention policies
    
  } catch (error) {
    // Audit logging should not break the main application flow
    console.error('User audit logging error:', error);
  }
};

/**
 * Express middleware for automatic user activity logging
 * @param {string} action - The action to log
 * @param {Function} contextExtractor - Function to extract context from req/res
 * @returns {Function} Express middleware function
 */
const createAuditMiddleware = (action, contextExtractor = () => ({})) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        ...contextExtractor(req, res)
      };

      await logActivity(userId, action, context);
    } catch (error) {
      console.error('Audit middleware error:', error);
    }
    
    next();
  };
};

module.exports = {
  logActivity,
  createAuditMiddleware
};
