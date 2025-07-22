/**
 * Admin Review Reports Routes
 * Routes for admin review report management (Admin authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllReportsAdmin,
  getReportAdmin,
  updateReportStatus,
  bulkUpdateReportStatus,
  getReportStats,
  getPendingReports,
  deleteReportAdmin,
  getReportsForReview
} = require('../controllers/reviewReport.controller');

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Import validation
const {
  validateReportId,
  validateUpdateReportStatus,
  validateBulkUpdateReportStatus,
  validateReportQuery,
  validateReviewId
} = require('../middleware/reviewValidation');

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/reports
 * @desc    Get all reports (admin view)
 * @access  Admin only
 */
router.get('/', validateReportQuery, getAllReportsAdmin);

/**
 * @route   GET /api/v1/admin/reports/pending
 * @desc    Get pending reports (prioritized)
 * @access  Admin only
 */
router.get('/pending', validateReportQuery, getPendingReports);

/**
 * @route   GET /api/v1/admin/reports/stats
 * @desc    Get report statistics
 * @access  Admin only
 */
router.get('/stats', getReportStats);

/**
 * @route   PATCH /api/v1/admin/reports/bulk-update
 * @desc    Bulk update report statuses
 * @access  Admin only
 */
router.patch('/bulk-update', validateBulkUpdateReportStatus, bulkUpdateReportStatus);

/**
 * @route   GET /api/v1/admin/reports/review/:reviewId
 * @desc    Get reports for a specific review
 * @access  Admin only
 */
router.get('/review/:reviewId', validateReviewId, getReportsForReview);

/**
 * @route   GET /api/v1/admin/reports/:reportId
 * @desc    Get single report (admin view)
 * @access  Admin only
 */
router.get('/:reportId', validateReportId, getReportAdmin);

/**
 * @route   PATCH /api/v1/admin/reports/:reportId/status
 * @desc    Update report status (resolve/reject)
 * @access  Admin only
 */
router.patch('/:reportId/status', validateUpdateReportStatus, updateReportStatus);

/**
 * @route   DELETE /api/v1/admin/reports/:reportId
 * @desc    Delete report (admin)
 * @access  Admin only
 */
router.delete('/:reportId', validateReportId, deleteReportAdmin);

module.exports = router;
