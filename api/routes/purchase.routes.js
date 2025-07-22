/**
 * Purchase Routes
 * RESTful API routes for purchase management system
 * All routes are restricted to administrators only
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

// Import controller functions
const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
} = require('../controllers/purchase.controller');

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @route   POST /api/v1/purchases
 * @desc    Create a new purchase record
 * @access  Admin only
 * @body    {
 *   product_variant_id: ObjectId (required),
 *   supplier_id: ObjectId (required),
 *   purchase_order_number: String (optional, unique if provided),
 *   purchase_date: Date (optional, defaults to now),
 *   quantity: Number (required, positive integer),
 *   unit_price_at_purchase: Number (optional, fetched from ProductVariant if not provided),
 *   packaging_cost: Number (optional, defaults to 0),
 *   shipping_cost: Number (optional, defaults to 0),
 *   status: String (optional, defaults to 'Planned'),
 *   notes: String (optional),
 *   expected_delivery_date: Date (optional)
 * }
 * @response 201 Created Purchase object
 * @response 400 Bad Request - validation errors, invalid IDs, duplicate purchase_order_number
 * @response 401 Unauthorized - not authenticated as admin
 * @response 500 Internal Server Error
 */
router.post('/', createPurchase);

/**
 * @route   GET /api/v1/purchases
 * @desc    Get all purchases with pagination, filtering, and search
 * @access  Admin only
 * @query   {
 *   page: Number (optional, default 1),
 *   limit: Number (optional, default 10, max 100),
 *   product_variant_id: ObjectId (optional),
 *   supplier_id: ObjectId (optional),
 *   status: String (optional, one of: Planned, Pending, Completed, Cancelled, Partially Received),
 *   start_date: Date (optional, filter by purchase_date >= start_date),
 *   end_date: Date (optional, filter by purchase_date <= end_date),
 *   include_inactive: Boolean (optional, default false),
 *   search: String (optional, search purchase_order_number, use 'null' for null values),
 *   sort: String (optional, default 'purchase_date', options: purchase_date, landing_price, status, quantity, createdAt),
 *   order: String (optional, default 'desc', options: asc, desc)
 * }
 * @response 200 OK - Paginated list of purchases with metadata
 * @response 400 Bad Request - invalid query parameters
 * @response 401 Unauthorized - not authenticated as admin
 * @response 500 Internal Server Error
 */
router.get('/', getAllPurchases);

/**
 * @route   GET /api/v1/purchases/:id
 * @desc    Get purchase by ID with full details
 * @access  Admin only
 * @params  id: ObjectId (required) - Purchase ID
 * @response 200 OK - Single Purchase object with populated references
 * @response 400 Bad Request - invalid ID format
 * @response 401 Unauthorized - not authenticated as admin
 * @response 404 Not Found - purchase not found
 * @response 500 Internal Server Error
 */
router.get('/:id', getPurchaseById);

/**
 * @route   PATCH /api/v1/purchases/:id
 * @desc    Update purchase record
 * @access  Admin only
 * @params  id: ObjectId (required) - Purchase ID
 * @body    {
 *   purchase_order_number: String (optional, unique if provided, null to remove),
 *   quantity: Number (optional, positive integer),
 *   packaging_cost: Number (optional, non-negative),
 *   shipping_cost: Number (optional, non-negative),
 *   status: String (optional, one of: Planned, Pending, Completed, Cancelled, Partially Received),
 *   notes: String (optional, null to remove),
 *   expected_delivery_date: Date (optional, null to remove),
 *   received_date: Date (optional, null to remove),
 *   is_active: Boolean (optional)
 * }
 * @response 200 OK - Updated Purchase object
 * @response 400 Bad Request - validation errors, invalid ID, duplicate purchase_order_number
 * @response 401 Unauthorized - not authenticated as admin
 * @response 404 Not Found - purchase not found
 * @response 500 Internal Server Error
 * @note    If quantity, packaging_cost, or shipping_cost are updated, landing_price is recalculated
 * @note    Status updates to 'Completed' or 'Partially Received' should trigger inventory updates (future integration)
 */
router.patch('/:id', updatePurchase);

/**
 * @route   DELETE /api/v1/purchases/:id
 * @desc    Delete purchase record (soft delete)
 * @access  Admin only
 * @params  id: ObjectId (required) - Purchase ID
 * @response 204 No Content - Purchase successfully soft deleted
 * @response 400 Bad Request - invalid ID format
 * @response 401 Unauthorized - not authenticated as admin
 * @response 404 Not Found - purchase not found
 * @response 500 Internal Server Error
 * @note    Sets is_active to false instead of removing the record
 */
router.delete('/:id', deletePurchase);

module.exports = router;
