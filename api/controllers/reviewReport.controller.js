/**
 * ReviewReport Controller
 * Handles all review report management operations for admin APIs
 */

const mongoose = require('mongoose');
const ReviewReport = require('../models/ReviewReport');
const ProductReview = require('../models/ProductReview');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Get all reports (Admin view)
 * @route GET /api/v1/admin/reports
 * @access Admin only
 */
const getAllReportsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'PENDING',
      review_id,
      reporter_user_id,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    if (review_id) query.review_id = review_id;
    if (reporter_user_id) query.reporter_user_id = reporter_user_id;

    // Build sort options
    const validSortFields = ['createdAt', 'resolved_at', 'status'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
    const sortOptions = { [sortField]: sort_order === 'asc' ? 1 : -1 };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const [reports, total] = await Promise.all([
      ReviewReport.find(query)
        .populate({
          path: 'review_id',
          select: 'rating title review_text product_variant_id user_id status',
          populate: [
            { path: 'product_variant_id', select: 'name' },
            { path: 'user_id', select: 'name email' }
          ]
        })
        .populate('reporter_user_id', 'name email')
        .populate('resolved_by', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      ReviewReport.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reports,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single report (Admin view)
 * @route GET /api/v1/admin/reports/:reportId
 * @access Admin only
 */
const getReportAdmin = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await ReviewReport.findById(reportId)
      .populate({
        path: 'review_id',
        select: 'rating title review_text product_variant_id user_id status reported_count',
        populate: [
          { path: 'product_variant_id', select: 'name images' },
          { path: 'user_id', select: 'name email' }
        ]
      })
      .populate('reporter_user_id', 'name email')
      .populate('resolved_by', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get all reports for the same review for context
    const relatedReports = await ReviewReport.find({
      review_id: report.review_id._id,
      _id: { $ne: reportId }
    })
      .populate('reporter_user_id', 'name email')
      .populate('resolved_by', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        report,
        related_reports: relatedReports
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update report status
 * @route PATCH /api/v1/admin/reports/:reportId/status
 * @access Admin only
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reportId } = req.params;
    const { status, resolution_notes } = req.body;
    const adminId = req.user.id;

    if (!['RESOLVED', 'REJECTED_REPORT'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be RESOLVED or REJECTED_REPORT'
      });
    }

    const report = await ReviewReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.canBeResolved()) {
      return res.status(400).json({
        success: false,
        message: 'Report cannot be resolved in current status'
      });
    }

    const originalStatus = report.status;

    // Resolve or reject the report
    if (status === 'RESOLVED') {
      await report.resolve(adminId, resolution_notes);
    } else {
      await report.reject(adminId, resolution_notes);
    }

    // Log admin action
    adminAuditLogger.info('Report status updated', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'UPDATE_REPORT_STATUS',
      resource_type: 'ReviewReport',
      resource_id: reportId,
      changes: {
        status: {
          from: originalStatus,
          to: status
        }
      },
      details: {
        review_id: report.review_id,
        resolution_notes
      }
    });

    res.json({
      success: true,
      message: `Report ${status === 'RESOLVED' ? 'resolved' : 'rejected'} successfully`,
      data: {
        id: report._id,
        status: report.status,
        resolved_at: report.resolved_at,
        resolved_by: report.resolved_by,
        resolution_notes: report.resolution_notes
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update report statuses
 * @route PATCH /api/v1/admin/reports/bulk-update
 * @access Admin only
 */
const bulkUpdateReportStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { report_ids, status, resolution_notes } = req.body;
    const adminId = req.user.id;

    if (!['RESOLVED', 'REJECTED_REPORT'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be RESOLVED or REJECTED_REPORT'
      });
    }

    if (!Array.isArray(report_ids) || report_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'report_ids must be a non-empty array'
      });
    }

    // Process bulk update
    const results = await ReviewReport.bulkResolve(report_ids, adminId, resolution_notes);

    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log admin action
    adminAuditLogger.info('Bulk report status update', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'BULK_UPDATE_REPORT_STATUS',
      resource_type: 'ReviewReport',
      details: {
        total_reports: report_ids.length,
        successful_updates: successful,
        failed_updates: failed,
        target_status: status,
        resolution_notes
      }
    });

    res.json({
      success: true,
      message: `Bulk update completed: ${successful} successful, ${failed} failed`,
      data: {
        total: report_ids.length,
        successful,
        failed,
        results
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get report statistics
 * @route GET /api/v1/admin/reports/stats
 * @access Admin only
 */
const getReportStats = async (req, res, next) => {
  try {
    const [reportStats, reasonStats] = await Promise.all([
      ReviewReport.getReportStats(),
      ReviewReport.getReportReasons()
    ]);

    // Get pending reports by age
    const pendingByAge = await ReviewReport.aggregate([
      {
        $match: { status: 'PENDING' }
      },
      {
        $addFields: {
          daysSinceReported: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$daysSinceReported',
          boundaries: [0, 1, 3, 7, 30, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Get most reported reviews
    const mostReported = await ProductReview.find({
      reported_count: { $gt: 0 }
    })
      .select('_id rating title review_text reported_count product_variant_id user_id')
      .populate('product_variant_id', 'name')
      .populate('user_id', 'name')
      .sort({ reported_count: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        report_stats: reportStats,
        reason_stats: reasonStats,
        pending_by_age: pendingByAge,
        most_reported_reviews: mostReported
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get pending reports (prioritized)
 * @route GET /api/v1/admin/reports/pending
 * @access Admin only
 */
const getPendingReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sort_by,
      sortOrder: sort_order
    };

    const [reports, total] = await Promise.all([
      ReviewReport.getPendingReports(options),
      ReviewReport.countDocuments({ status: 'PENDING' })
    ]);

    const totalPages = Math.ceil(total / options.limit);

    res.json({
      success: true,
      data: reports,
      pagination: {
        current_page: options.page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: options.limit,
        has_next_page: options.page < totalPages,
        has_prev_page: options.page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete report (Admin)
 * @route DELETE /api/v1/admin/reports/:reportId
 * @access Admin only
 */
const deleteReportAdmin = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const adminId = req.user.id;

    const report = await ReviewReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const reviewId = report.review_id;
    const wasPending = report.status === 'PENDING';

    // Delete the report
    await ReviewReport.findByIdAndDelete(reportId);

    // The post-remove middleware will handle updating the review's reported_count

    // Log admin action
    adminAuditLogger.info('Report deleted by admin', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'DELETE_REPORT',
      resource_type: 'ReviewReport',
      resource_id: reportId,
      details: {
        review_id: reviewId,
        was_pending: wasPending
      }
    });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get reports for a specific review
 * @route GET /api/v1/admin/reports/review/:reviewId
 * @access Admin only
 */
const getReportsForReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Verify review exists
    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const reports = await ReviewReport.getReportsForReview(reviewId);

    res.json({
      success: true,
      data: {
        review_id: reviewId,
        total_reports: reports.length,
        reports
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReportsAdmin,
  getReportAdmin,
  updateReportStatus,
  bulkUpdateReportStatus,
  getReportStats,
  getPendingReports,
  deleteReportAdmin,
  getReportsForReview
};
