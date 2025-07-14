/**
 * Admin Controller
 * 
 * Handles administrative operations for the e-commerce API.
 * Includes comprehensive audit logging for all admin activities.
 * 
 * This controller demonstrates how to integrate admin audit logging
 * for compliance, security, and operational monitoring.
 */

const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Get admin dashboard data
 * Log admin dashboard access for security monitoring
 */
const getDashboardData = async (req, res) => {
  try {
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate dashboard data
    const dashboardData = {
      totalProducts: 150,
      totalUsers: 1250,
      totalOrders: 890,
      revenue: 45000.50,
      recentOrders: [
        { id: 1, customer: 'John Doe', total: 299.99, status: 'completed' },
        { id: 2, customer: 'Jane Smith', total: 199.99, status: 'pending' }
      ]
    };

    // Log dashboard access
    adminAuditLogger.logAdminActivity({
      ...adminInfo,
      action_type: 'dashboard_accessed',
      resource_type: 'dashboard',
      status: 'success',
      changes: {
        accessed_sections: ['overview', 'recent_orders', 'revenue'],
        data_summary: {
          total_products: dashboardData.totalProducts,
          total_users: dashboardData.totalUsers,
          total_orders: dashboardData.totalOrders
        }
      }
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    // Log dashboard access error
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'dashboard_access_failed',
      'dashboard',
      null,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

/**
 * Create new product
 * Log product creation with full audit trail
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate product creation
    const newProduct = {
      id: Date.now(),
      name,
      price: parseFloat(price),
      category,
      description,
      stock: parseInt(stock),
      createdAt: new Date(),
      createdBy: req.user.id
    };

    // Log product creation
    adminAuditLogger.logResourceCreation(
      adminInfo,
      'product',
      newProduct.id,
      {
        name: newProduct.name,
        price: newProduct.price,
        category: newProduct.category,
        description: newProduct.description,
        stock: newProduct.stock
      }
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    // Log product creation failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'product_creation_failed',
      'product',
      null,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

/**
 * Update product
 * Log product updates with detailed change tracking
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate existing product data
    const existingProduct = {
      id: parseInt(id),
      name: 'Old Product Name',
      price: 199.99,
      category: 'Electronics',
      description: 'Old description',
      stock: 50
    };

    // Simulate updated product
    const updatedProduct = {
      ...existingProduct,
      ...updateData,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };

    // Log product update with change tracking
    adminAuditLogger.logResourceUpdate(
      adminInfo,
      'product',
      existingProduct.id,
      existingProduct,
      updatedProduct
    );

    // Special logging for price changes (critical for e-commerce)
    if (existingProduct.price !== updatedProduct.price) {
      adminAuditLogger.logAdminActivity({
        ...adminInfo,
        action_type: 'product_price_changed',
        resource_type: 'product',
        resource_id: existingProduct.id,
        changes: {
          field: 'price',
          old_value: existingProduct.price,
          new_value: updatedProduct.price,
          price_change_percentage: ((updatedProduct.price - existingProduct.price) / existingProduct.price * 100).toFixed(2)
        },
        status: 'success',
        level: 'warn' // Price changes are critical events
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    // Log product update failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'product_update_failed',
      'product',
      req.params.id,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

/**
 * Delete product
 * Log product deletion with recovery information
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate existing product data
    const existingProduct = {
      id: parseInt(id),
      name: 'Product to Delete',
      price: 299.99,
      category: 'Electronics',
      description: 'Product description',
      stock: 25
    };

    // Log product deletion
    adminAuditLogger.logResourceDeletion(
      adminInfo,
      'product',
      existingProduct.id,
      {
        ...existingProduct,
        deletion_type: permanent ? 'permanent' : 'soft',
        recoverable: !permanent
      }
    );

    // Additional logging for permanent deletions
    if (permanent) {
      adminAuditLogger.logAdminActivity({
        ...adminInfo,
        action_type: 'product_permanently_deleted',
        resource_type: 'product',
        resource_id: existingProduct.id,
        changes: {
          deletion_type: 'permanent',
          product_data: existingProduct,
          warning: 'This action cannot be undone'
        },
        status: 'success',
        level: 'warn'
      });
    }

    res.json({
      success: true,
      message: permanent ? 'Product permanently deleted' : 'Product deleted successfully'
    });
  } catch (error) {
    // Log product deletion failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'product_deletion_failed',
      'product',
      req.params.id,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

/**
 * Manage user account
 * Log user account modifications by admin
 */
const manageUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'activate', 'deactivate', 'suspend', 'delete'
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate user data
    const targetUser = {
      id: userId,
      username: 'targetuser',
      email: 'user@example.com',
      status: 'active',
      role: 'user'
    };

    // Log user account management
    adminAuditLogger.logUserAction(
      adminInfo,
      userId,
      action,
      {
        previous_status: targetUser.status,
        new_status: action,
        reason: reason || 'No reason provided',
        target_user: {
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role
        }
      }
    );

    // Additional logging for sensitive actions
    if (['suspend', 'delete'].includes(action)) {
      adminAuditLogger.logSecurityEvent(
        adminInfo,
        'user_account_restricted',
        {
          target_user_id: userId,
          target_username: targetUser.username,
          action_taken: action,
          reason: reason,
          severity: action === 'delete' ? 'high' : 'medium'
        }
      );
    }

    res.json({
      success: true,
      message: `User account ${action} successfully`
    });
  } catch (error) {
    // Log user management failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'user_management_failed',
      'user',
      req.params.userId,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to manage user account'
    });
  }
};

/**
 * Update system settings
 * Log system configuration changes
 */
const updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate existing settings
    const existingSettings = {
      maintenanceMode: false,
      allowRegistration: true,
      maxLoginAttempts: 5,
      sessionTimeout: 3600
    };

    // Log system settings update
    adminAuditLogger.logAdminActivity({
      ...adminInfo,
      action_type: 'system_settings_updated',
      resource_type: 'system',
      resource_id: 'global_settings',
      changes: {
        previous_settings: existingSettings,
        new_settings: settings,
        modified_fields: Object.keys(settings)
      },
      status: 'success',
      level: 'warn' // System changes are critical
    });

    // Special logging for security-related settings
    if (settings.hasOwnProperty('maintenanceMode') || settings.hasOwnProperty('allowRegistration')) {
      adminAuditLogger.logSecurityEvent(
        adminInfo,
        'security_settings_modified',
        {
          maintenance_mode: settings.maintenanceMode,
          registration_enabled: settings.allowRegistration,
          impact: 'system_wide'
        }
      );
    }

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    // Log system settings update failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'system_settings_update_failed',
      'system',
      'global_settings',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
};

/**
 * Export sales data
 * Log data export activities for compliance
 */
const exportSalesData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      method: req.method,
      url: req.originalUrl
    };

    // Simulate data export
    const exportData = {
      exportId: Date.now(),
      recordCount: 1250,
      dateRange: { startDate, endDate },
      format: format,
      filePath: `/exports/sales_${Date.now()}.${format}`
    };

    // Log data export
    adminAuditLogger.logAdminActivity({
      ...adminInfo,
      action_type: 'sales_data_exported',
      resource_type: 'sales_data',
      resource_id: exportData.exportId,
      changes: {
        export_parameters: {
          start_date: startDate,
          end_date: endDate,
          format: format,
          record_count: exportData.recordCount
        },
        export_file: exportData.filePath
      },
      status: 'success',
      level: 'info'
    });

    res.json({
      success: true,
      message: 'Sales data exported successfully',
      data: exportData
    });
  } catch (error) {
    // Log data export failure
    adminAuditLogger.logFailedAction(
      {
        admin_id: req.user.id,
        admin_username: req.user.username,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      'sales_data_export_failed',
      'sales_data',
      null,
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to export sales data'
    });
  }
};

module.exports = {
  getDashboardData,
  createProduct,
  updateProduct,
  deleteProduct,
  manageUserAccount,
  updateSystemSettings,
  exportSalesData
};
