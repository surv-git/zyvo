# Winston Logging System Implementation

## Overview

This document provides a comprehensive guide to the Winston-based logging system implemented for the Zyvo e-commerce API server. The system provides structured logging for user activities and admin audit trails with automatic log rotation, filtering, and monitoring capabilities.

## System Architecture

### Core Components

1. **User Activity Logger** (`loggers/userActivityLogger.js`)
   - Tracks customer interactions and API usage
   - Focuses on user behavior analytics
   - Provides insights for business intelligence

2. **Admin Audit Logger** (`loggers/adminAuditLogger.js`)
   - Tracks administrative actions and system changes
   - Provides compliance and security audit trails
   - Maintains immutable records of critical operations

3. **Logging Middleware** (`middleware/loggingMiddleware.js`)
   - Automatic request/response logging
   - Context extraction and enrichment
   - Error handling integration

### Features

- **Structured JSON Logging**: All logs use consistent JSON format for easy parsing
- **Automatic Log Rotation**: Daily rotation with compression for long-term storage
- **Environment-Aware**: Different output formats for development vs production
- **Error Handling**: Comprehensive error logging with stack traces
- **Request Correlation**: Unique request IDs for tracing across services
- **Security**: Sensitive data filtering and audit trails

## Configuration

### Environment Variables

```env
# User Activity Logger
USER_ACTIVITY_LOG_LEVEL=info

# Admin Audit Logger
ADMIN_AUDIT_LOG_LEVEL=info

# General logging
NODE_ENV=development
```

### Log Levels

- **info**: General information, successful operations
- **warn**: Warning conditions, security events
- **error**: Error conditions, failed operations
- **debug**: Debug information (development only)

## User Activity Logger

### Purpose
Tracks user interactions with public-facing API endpoints for:
- Business analytics and insights
- User behavior analysis
- Performance monitoring
- Customer journey tracking

### Log Structure

```json
{
  "timestamp": "2025-07-12 10:30:00",
  "level": "info",
  "user_id": "user123",
  "session_id": "sess_abc123",
  "ip_address": "192.168.1.100",
  "method": "GET",
  "url": "/api/v1/products/123",
  "user_agent": "Mozilla/5.0...",
  "event_type": "product_viewed",
  "details": {
    "product_id": "123",
    "category": "electronics",
    "price": 299.99
  },
  "response_time": 150,
  "status_code": 200
}
```

### Usage Examples

#### Basic Activity Logging
```javascript
const userActivityLogger = require('../loggers/userActivityLogger');

// Log user activity
userActivityLogger.logUserActivity({
  user_id: req.user?.id || 'guest',
  ip_address: req.ip,
  method: req.method,
  url: req.originalUrl,
  user_agent: req.get('User-Agent'),
  event_type: 'product_viewed',
  details: { productId: req.params.id }
});
```

#### Convenience Methods
```javascript
// Product view tracking
userActivityLogger.logProductView(userId, productId, ip, userAgent);

// Search tracking
userActivityLogger.logSearch(userId, query, resultsCount, ip, userAgent);

// Cart actions
userActivityLogger.logCartAction(userId, 'add', productId, ip, userAgent);
```

### Event Types

- `product_viewed`: User viewed a product
- `search_performed`: User performed a search
- `cart_item_added`: User added item to cart
- `cart_item_removed`: User removed item from cart
- `checkout_initiated`: User started checkout process
- `order_completed`: User completed an order
- `api_error`: API error occurred

## Admin Audit Logger

### Purpose
Tracks administrative actions for:
- Compliance and regulatory requirements
- Security monitoring
- Change management
- Forensic analysis

### Log Structure

```json
{
  "timestamp": "2025-07-12 10:30:00",
  "level": "info",
  "admin_id": "admin123",
  "admin_username": "admin",
  "admin_role": "admin",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "action_type": "product_price_updated",
  "resource_type": "product",
  "resource_id": "123",
  "changes": {
    "price": {
      "old_value": 299.99,
      "new_value": 349.99
    }
  },
  "status": "success",
  "request_id": "req_123abc",
  "duration": 250
}
```

### Usage Examples

#### Basic Audit Logging
```javascript
const adminAuditLogger = require('../loggers/adminAuditLogger');

// Log admin activity
adminAuditLogger.logAdminActivity({
  admin_id: req.user.id,
  admin_username: req.user.username,
  ip_address: req.ip,
  action_type: 'product_created',
  resource_type: 'product',
  resource_id: newProduct.id,
  changes: { created: newProduct },
  status: 'success'
});
```

#### Convenience Methods
```javascript
// Resource creation
adminAuditLogger.logResourceCreation(adminData, 'product', productId, productData);

// Resource updates with change tracking
adminAuditLogger.logResourceUpdate(adminData, 'product', productId, oldData, newData);

// Resource deletion
adminAuditLogger.logResourceDeletion(adminData, 'product', productId, deletedData);

// User management actions
adminAuditLogger.logUserAction(adminData, targetUserId, 'suspend', { reason: 'policy violation' });

// Security events
adminAuditLogger.logSecurityEvent(adminData, 'unauthorized_access', { details });

// Failed actions
adminAuditLogger.logFailedAction(adminData, 'product_update', 'product', productId, errorMessage);
```

### Action Types

- `product_created`: New product created
- `product_updated`: Product information updated
- `product_deleted`: Product deleted
- `user_suspended`: User account suspended
- `user_activated`: User account activated
- `system_settings_updated`: System configuration changed
- `data_exported`: Data exported for reporting
- `security_breach_detected`: Security incident detected

## Middleware Integration

### User Activity Middleware

Applied to all user-facing routes to automatically capture request/response data:

```javascript
const { logUserActivityMiddleware } = require('../middleware/loggingMiddleware');

app.use('/api/v1', logUserActivityMiddleware({
  defaultEventType: 'api_request',
  logResponseTime: true,
  excludePaths: ['/health', '/csrf-token']
}));
```

### Admin Audit Middleware

Applied to admin routes for comprehensive audit logging:

```javascript
const { logAdminActivityMiddleware } = require('../middleware/loggingMiddleware');

app.use('/api/v1/admin', logAdminActivityMiddleware({
  logAllRequests: true,
  sensitiveFields: ['password', 'token', 'secret']
}));
```

## File Structure

```
project/
├── loggers/
│   ├── userActivityLogger.js    # User activity logging configuration
│   └── adminAuditLogger.js      # Admin audit logging configuration
├── middleware/
│   └── loggingMiddleware.js     # Express middleware for logging
├── controllers/
│   ├── productController.js     # Example user activity logging
│   └── adminController.js       # Example admin audit logging
├── routes/
│   ├── productRoutes.js         # Demo routes with logging
│   └── adminRoutes.js           # Admin routes with audit logging
├── logs/
│   ├── user_activity-2025-07-12.log
│   ├── admin_audit-2025-07-12.log
│   ├── user_activity_exceptions.log
│   └── admin_audit_exceptions.log
└── app.js                       # Main application with logging integration
```

## Log File Management

### Rotation Strategy

- **Daily Rotation**: New log files created daily
- **Compression**: Old files are compressed to save space
- **Retention**: 
  - User activity logs: 14 days
  - Admin audit logs: 365 days (compliance requirement)
- **Max Size**: Files rotate when they reach size limit
  - User activity: 20MB
  - Admin audit: 50MB

### Storage Locations

- **User Activity**: `logs/user_activity-YYYY-MM-DD.log`
- **Admin Audit**: `logs/admin_audit-YYYY-MM-DD.log`
- **Exceptions**: `logs/*_exceptions.log`
- **Rejections**: `logs/*_rejections.log`

## Security Considerations

### Data Protection

- **Sensitive Fields**: Automatically filtered from logs
- **IP Anonymization**: Optional IP address anonymization
- **Token Filtering**: Authentication tokens are never logged
- **PII Protection**: Personal information is handled according to privacy policies

### Access Control

- **Log File Permissions**: Restricted access to log files
- **Admin Audit Integrity**: Tamper-evident logging for compliance
- **Correlation IDs**: Request tracing without exposing sensitive data

## Performance Considerations

### Optimization

- **Asynchronous Logging**: Non-blocking log operations
- **Batch Processing**: Logs are buffered for efficiency
- **Conditional Logging**: Environment-based log levels
- **Stream Management**: Efficient file handle management

### Monitoring

- **Log Volume**: Monitor log file sizes and growth
- **Error Rates**: Track error log frequency
- **Performance Impact**: Monitor logging overhead
- **Disk Usage**: Monitor storage consumption

## Integration Examples

### Controller Integration

```javascript
// Product Controller Example
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    
    // Log successful product retrieval
    userActivityLogger.logUserActivity({
      user_id: req.user?.id || 'guest',
      ip_address: req.ip,
      method: req.method,
      url: req.originalUrl,
      user_agent: req.get('User-Agent'),
      event_type: 'products_browsed',
      details: { 
        count: products.length,
        filters: req.query 
      }
    });
    
    res.json({ success: true, data: products });
  } catch (error) {
    // Log error
    userActivityLogger.logUserActivity({
      user_id: req.user?.id || 'guest',
      ip_address: req.ip,
      method: req.method,
      url: req.originalUrl,
      user_agent: req.get('User-Agent'),
      event_type: 'products_browse_error',
      details: { error: error.message },
      level: 'error'
    });
    
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};
```

### Admin Controller Integration

```javascript
// Admin Controller Example
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const existingProduct = await Product.findById(id);
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    
    // Log admin action with change tracking
    adminAuditLogger.logResourceUpdate(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'product',
      id,
      existingProduct.toObject(),
      updatedProduct.toObject()
    );
    
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    // Log failed action
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'product_update_failed',
      'product',
      id,
      error.message
    );
    
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};
```

## Testing the Logging System

### Demo Endpoints

The system includes demo endpoints to test logging functionality:

#### User Activity Demo
```bash
# Browse products (logs user activity)
curl -X GET "http://localhost:3000/api/v1/demo/products?category=electronics"

# View specific product (logs product view)
curl -X GET "http://localhost:3000/api/v1/demo/products/123"

# Search products (logs search activity)
curl -X GET "http://localhost:3000/api/v1/demo/products/search?q=laptop"

# Add to cart (logs cart activity)
curl -X POST "http://localhost:3000/api/v1/demo/products/cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{"productId": "123", "quantity": 2}'
```

#### Admin Audit Demo
```bash
# Access admin dashboard (logs admin activity)
curl -X GET "http://localhost:3000/api/v1/demo/admin/dashboard" \
  -H "Authorization: Bearer admin-token"

# Create product (logs resource creation)
curl -X POST "http://localhost:3000/api/v1/demo/admin/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "name": "New Product",
    "price": 299.99,
    "category": "Electronics",
    "description": "A great product",
    "stock": 100
  }'

# Update product (logs resource update with change tracking)
curl -X PUT "http://localhost:3000/api/v1/demo/admin/products/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "price": 349.99,
    "stock": 85
  }'

# Manage user account (logs user management action)
curl -X POST "http://localhost:3000/api/v1/demo/admin/users/user123/manage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "action": "suspend",
    "reason": "Policy violation"
  }'
```

## Troubleshooting

### Common Issues

1. **Log Files Not Created**
   - Check directory permissions
   - Ensure logs directory exists
   - Verify Winston configuration

2. **High Memory Usage**
   - Monitor log buffer sizes
   - Check file handle limits
   - Verify log rotation is working

3. **Missing Log Entries**
   - Check log levels
   - Verify middleware is applied
   - Confirm logger initialization

4. **Performance Issues**
   - Monitor logging overhead
   - Consider async logging
   - Optimize log frequency

### Debug Commands

```bash
# Check log files
ls -la logs/

# Monitor log files in real-time
tail -f logs/user_activity-$(date +%Y-%m-%d).log

# Check log file sizes
du -h logs/

# Search logs for specific events
grep "product_viewed" logs/user_activity-*.log

# Check for errors
grep "error" logs/*.log
```

## Best Practices

### Development

1. **Consistent Logging**: Use standardized event types and field names
2. **Contextual Information**: Include relevant context in log details
3. **Error Handling**: Always log errors with appropriate detail
4. **Performance**: Monitor logging performance impact
5. **Security**: Never log sensitive information

### Production

1. **Log Rotation**: Ensure proper log rotation is configured
2. **Monitoring**: Set up alerts for error rates and disk usage
3. **Backup**: Include log files in backup strategies
4. **Compliance**: Ensure audit logs meet regulatory requirements
5. **Performance**: Monitor and optimize logging overhead

### Security

1. **Access Control**: Restrict access to log files
2. **Data Privacy**: Filter sensitive information
3. **Integrity**: Protect audit logs from tampering
4. **Retention**: Follow data retention policies
5. **Encryption**: Consider encrypting sensitive logs

## Conclusion

This Winston-based logging system provides comprehensive tracking of user activities and admin actions while maintaining high performance and security standards. The system is designed to be scalable, maintainable, and compliant with industry best practices for logging and auditing.

For additional support or customization, refer to the Winston documentation and the specific implementation files in this project.
