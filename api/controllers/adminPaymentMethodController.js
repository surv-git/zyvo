/**
 * Admin Payment Methods Controller
 * Handles admin operations for payment methods management
 */

const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Get all payment methods with advanced filtering and pagination
 * @route GET /api/v1/admin/payment-methods
 * @access Private (Admin only)
 */
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object for filtering
    let query = {};
    
    // Filter by payment method type
    if (req.query.method_type) {
      query.method_type = req.query.method_type.toUpperCase();
    }
    
    // Filter by active status
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    // Filter by default status
    if (req.query.is_default !== undefined) {
      query.is_default = req.query.is_default === 'true';
    }
    
    // Filter by user
    if (req.query.user_id) {
      query.user_id = req.query.user_id;
    }
    
    // Search by alias
    if (req.query.search) {
      query.alias = { $regex: req.query.search, $options: 'i' };
    }
    
    // Date range filtering
    if (req.query.start_date || req.query.end_date) {
      query.created_at = {};
      if (req.query.start_date) {
        query.created_at.$gte = new Date(req.query.start_date);
      }
      if (req.query.end_date) {
        query.created_at.$lte = new Date(req.query.end_date);
      }
    }

    // Sort options
    let sortOption = {};
    if (req.query.sort_by) {
      const sortField = req.query.sort_by;
      const sortOrder = req.query.sort_order === 'desc' ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      sortOption = { created_at: -1 }; // Default sort by newest first
    }

    // Execute query with pagination
    const paymentMethods = await PaymentMethod.find(query)
      .populate('user_id', 'name email phone role')
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await PaymentMethod.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get summary statistics
    const stats = await PaymentMethod.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_methods: { $sum: 1 },
          active_methods: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
          },
          default_methods: {
            $sum: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
          },
          credit_cards: {
            $sum: { $cond: [{ $eq: ['$method_type', 'CREDIT_CARD'] }, 1, 0] }
          },
          debit_cards: {
            $sum: { $cond: [{ $eq: ['$method_type', 'DEBIT_CARD'] }, 1, 0] }
          },
          upi_methods: {
            $sum: { $cond: [{ $eq: ['$method_type', 'UPI'] }, 1, 0] }
          },
          wallets: {
            $sum: { $cond: [{ $eq: ['$method_type', 'WALLET'] }, 1, 0] }
          },
          netbanking: {
            $sum: { $cond: [{ $eq: ['$method_type', 'NETBANKING'] }, 1, 0] }
          }
        }
      }
    ]);

    // Convert to safe objects (removes encrypted tokens)
    const safePaymentMethods = paymentMethods.map(method => {
      const paymentMethod = new PaymentMethod(method);
      return paymentMethod.toSafeObject();
    });

    const response = {
      success: true,
      message: 'Payment methods retrieved successfully',
      data: {
        payment_methods: safePaymentMethods,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        summary: stats.length > 0 ? stats[0] : {
          total_methods: 0,
          active_methods: 0,
          default_methods: 0,
          credit_cards: 0,
          debit_cards: 0,
          upi_methods: 0,
          wallets: 0,
          netbanking: 0
        },
        filters_applied: {
          method_type: req.query.method_type || null,
          is_active: req.query.is_active || null,
          is_default: req.query.is_default || null,
          user_id: req.query.user_id || null,
          search: req.query.search || null,
          date_range: {
            start: req.query.start_date || null,
            end: req.query.end_date || null
          }
        }
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get all payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment methods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Get payment method by ID
 * @route GET /api/v1/admin/payment-methods/:id
 * @access Private (Admin only)
 */
exports.getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id)
      .populate('user_id', 'name email phone role created_at')
      .lean();

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Convert to safe object (removes encrypted tokens)
    const safePaymentMethod = new PaymentMethod(paymentMethod).toSafeObject();

    // Get user's other payment methods count
    const userMethodsCount = await PaymentMethod.countDocuments({
      user_id: paymentMethod.user_id._id,
      _id: { $ne: id }
    });

    // Get usage statistics if available
    const usageStats = {
      user_total_payment_methods: userMethodsCount + 1,
      is_user_default: paymentMethod.is_default,
      method_age_days: Math.floor((new Date() - new Date(paymentMethod.created_at)) / (1000 * 60 * 60 * 24))
    };

    const response = {
      success: true,
      message: 'Payment method retrieved successfully',
      data: {
        payment_method: safePaymentMethod,
        user_info: paymentMethod.user_id,
        usage_stats: usageStats
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get payment method by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Update payment method
 * @route PUT /api/v1/admin/payment-methods/:id
 * @access Private (Admin only)
 */
exports.updatePaymentMethod = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.user_id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // Find the payment method
    const paymentMethod = await PaymentMethod.findById(id);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Store original values for audit
    const originalValues = {
      alias: paymentMethod.alias,
      is_active: paymentMethod.is_active,
      is_default: paymentMethod.is_default
    };

    // If setting as default, ensure no other payment method for this user is default
    if (updateData.is_default === true && !paymentMethod.is_default) {
      await PaymentMethod.updateMany(
        { user_id: paymentMethod.user_id, _id: { $ne: id } },
        { is_default: false }
      );
    }

    // Update the payment method
    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updated_at: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('user_id', 'name email phone');

    // Create audit entry
    const auditEntry = {
      action: 'payment_method_updated',
      admin_id: req.user.id,
      admin_email: req.user.email,
      target_payment_method_id: id,
      target_user_id: paymentMethod.user_id,
      changes: {},
      timestamp: new Date()
    };

    // Track what changed
    if (originalValues.alias !== updatedPaymentMethod.alias) {
      auditEntry.changes.alias = { from: originalValues.alias, to: updatedPaymentMethod.alias };
    }
    if (originalValues.is_active !== updatedPaymentMethod.is_active) {
      auditEntry.changes.is_active = { from: originalValues.is_active, to: updatedPaymentMethod.is_active };
    }
    if (originalValues.is_default !== updatedPaymentMethod.is_default) {
      auditEntry.changes.is_default = { from: originalValues.is_default, to: updatedPaymentMethod.is_default };
    }

    console.log('Payment method updated by admin:', auditEntry);

    const response = {
      success: true,
      message: 'Payment method updated successfully',
      data: {
        payment_method: updatedPaymentMethod.toSafeObject(),
        changes_made: auditEntry.changes
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Update payment method error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        })),
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Delete payment method (soft delete)
 * @route DELETE /api/v1/admin/payment-methods/:id
 * @access Private (Admin only)
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const paymentMethod = await PaymentMethod.findById(id)
      .populate('user_id', 'name email');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    // Check if this is the user's default payment method
    const isDefault = paymentMethod.is_default;
    let newDefaultSet = false;

    if (permanent === 'true') {
      // Permanent deletion
      if (isDefault) {
        // Set another payment method as default if available
        const anotherMethod = await PaymentMethod.findOne({
          user_id: paymentMethod.user_id,
          _id: { $ne: id },
          is_active: true
        });
        
        if (anotherMethod) {
          anotherMethod.is_default = true;
          await anotherMethod.save();
          newDefaultSet = true;
        }
      }

      await PaymentMethod.findByIdAndDelete(id);
    } else {
      // Soft delete
      paymentMethod.is_active = false;
      paymentMethod.deleted_at = new Date();
      
      if (isDefault) {
        paymentMethod.is_default = false;
        
        // Set another active payment method as default
        const anotherMethod = await PaymentMethod.findOne({
          user_id: paymentMethod.user_id,
          _id: { $ne: id },
          is_active: true
        });
        
        if (anotherMethod) {
          anotherMethod.is_default = true;
          await anotherMethod.save();
          newDefaultSet = true;
        }
      }
      
      await paymentMethod.save();
    }

    // Create audit entry
    const auditEntry = {
      action: permanent === 'true' ? 'payment_method_permanently_deleted' : 'payment_method_soft_deleted',
      admin_id: req.user.id,
      admin_email: req.user.email,
      target_payment_method_id: id,
      target_user_id: paymentMethod.user_id._id,
      payment_method_details: {
        method_type: paymentMethod.method_type,
        alias: paymentMethod.alias,
        was_default: isDefault
      },
      new_default_set: newDefaultSet,
      timestamp: new Date()
    };

    console.log('Payment method deleted by admin:', auditEntry);

    const response = {
      success: true,
      message: `Payment method ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} successfully`,
      data: {
        deleted_payment_method: {
          id: paymentMethod._id,
          method_type: paymentMethod.method_type,
          alias: paymentMethod.alias,
          was_default: isDefault
        },
        new_default_assigned: newDefaultSet,
        deletion_type: permanent === 'true' ? 'permanent' : 'soft'
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delete payment method error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format',
        timestamp: new Date().toISOString(),
        request_id: req.id
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};

/**
 * Get payment methods analytics
 * @route GET /api/v1/admin/payment-methods/analytics
 * @access Private (Admin only)
 */
exports.getPaymentMethodsAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get comprehensive analytics
    const analytics = await PaymentMethod.aggregate([
      {
        $facet: {
          // Overall statistics
          overall_stats: [
            {
              $group: {
                _id: null,
                total_methods: { $sum: 1 },
                active_methods: {
                  $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                inactive_methods: {
                  $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] }
                },
                default_methods: {
                  $sum: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
                }
              }
            }
          ],
          
          // Method type distribution
          method_type_distribution: [
            {
              $group: {
                _id: '$method_type',
                count: { $sum: 1 },
                active_count: {
                  $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                default_count: {
                  $sum: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
                }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Recent additions
          recent_additions: [
            { $match: { created_at: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' }
                },
                count: { $sum: 1 },
                methods: {
                  $push: {
                    method_type: '$method_type',
                    alias: '$alias'
                  }
                }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
          ],
          
          // User payment method counts
          user_method_counts: [
            {
              $group: {
                _id: '$user_id',
                method_count: { $sum: 1 },
                active_count: {
                  $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
                },
                has_default: {
                  $max: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
                }
              }
            },
            {
              $group: {
                _id: null,
                avg_methods_per_user: { $avg: '$method_count' },
                max_methods_per_user: { $max: '$method_count' },
                users_with_multiple_methods: {
                  $sum: { $cond: [{ $gt: ['$method_count', 1] }, 1, 0] }
                },
                users_without_default: {
                  $sum: { $cond: [{ $eq: ['$has_default', 0] }, 1, 0] }
                },
                total_users: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const result = analytics[0];

    const response = {
      success: true,
      message: 'Payment methods analytics retrieved successfully',
      data: {
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overall_statistics: result.overall_stats[0] || {
          total_methods: 0,
          active_methods: 0,
          inactive_methods: 0,
          default_methods: 0
        },
        method_type_distribution: result.method_type_distribution,
        recent_activity: result.recent_additions,
        user_statistics: result.user_method_counts[0] || {
          avg_methods_per_user: 0,
          max_methods_per_user: 0,
          users_with_multiple_methods: 0,
          users_without_default: 0,
          total_users: 0
        }
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get payment methods analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  }
};
