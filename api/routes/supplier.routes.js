/**
 * Supplier Routes
 * Defines all API endpoints for supplier management
 * Base path: /api/v1/suppliers
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const supplierController = require('../controllers/supplier.controller');

// Input validation rules
const supplierValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Supplier name is required')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Supplier name must be between 2 and 150 characters'),
    
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('logo_url')
      .optional({ nullable: true })
      .trim()
      .isURL()
      .withMessage('Logo URL must be a valid URL'),
    
    body('address.address_line_1')
      .optional({ nullable: true })
      .trim(),
    
    body('address.address_line_2')
      .optional({ nullable: true })
      .trim(),
    
    body('address.city')
      .optional({ nullable: true })
      .trim(),
    
    body('address.state')
      .optional({ nullable: true })
      .trim(),
    
    body('address.zipcode')
      .optional({ nullable: true })
      .trim(),
    
    body('address.country')
      .optional({ nullable: true })
      .trim(),
    
    body('email')
      .optional({ nullable: true })
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Email must be a valid email address'),
    
    body('website')
      .optional({ nullable: true })
      .trim()
      .isURL()
      .withMessage('Website must be a valid URL'),
    
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
    
    body('payment_terms')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Payment terms cannot exceed 500 characters'),
    
    body('delivery_terms')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Delivery terms cannot exceed 500 characters'),
    
    body('status')
      .optional()
      .isIn(['Active', 'Inactive', 'On Hold', 'Pending Approval'])
      .withMessage('Status must be one of: Active, Inactive, On Hold, Pending Approval'),
    
    body('notes')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes cannot exceed 2000 characters'),
    
    body('product_categories_supplied')
      .optional()
      .isArray()
      .withMessage('Product categories must be an array'),
    
    body('product_categories_supplied.*')
      .optional()
      .isMongoId()
      .withMessage('Each product category must be a valid ObjectId')
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Supplier name must be between 2 and 150 characters'),
    
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('logo_url')
      .optional({ nullable: true })
      .trim()
      .isURL()
      .withMessage('Logo URL must be a valid URL'),
    
    body('address.address_line_1')
      .optional({ nullable: true })
      .trim(),
    
    body('address.address_line_2')
      .optional({ nullable: true })
      .trim(),
    
    body('address.city')
      .optional({ nullable: true })
      .trim(),
    
    body('address.state')
      .optional({ nullable: true })
      .trim(),
    
    body('address.zipcode')
      .optional({ nullable: true })
      .trim(),
    
    body('address.country')
      .optional({ nullable: true })
      .trim(),
    
    body('email')
      .optional({ nullable: true })
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Email must be a valid email address'),
    
    body('website')
      .optional({ nullable: true })
      .trim()
      .isURL()
      .withMessage('Website must be a valid URL'),
    
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5'),
    
    body('payment_terms')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Payment terms cannot exceed 500 characters'),
    
    body('delivery_terms')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Delivery terms cannot exceed 500 characters'),
    
    body('status')
      .optional()
      .isIn(['Active', 'Inactive', 'On Hold', 'Pending Approval'])
      .withMessage('Status must be one of: Active, Inactive, On Hold, Pending Approval'),
    
    body('notes')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes cannot exceed 2000 characters'),
    
    body('product_categories_supplied')
      .optional()
      .isArray()
      .withMessage('Product categories must be an array'),
    
    body('product_categories_supplied.*')
      .optional()
      .isMongoId()
      .withMessage('Each product category must be a valid ObjectId')
  ],
  
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['Active', 'Inactive', 'On Hold', 'Pending Approval'])
      .withMessage('Status must be one of: Active, Inactive, On Hold, Pending Approval'),
    
    query('country')
      .optional()
      .trim(),
    
    query('product_categories_supplied')
      .optional()
      .custom((value) => {
        // Handle both single ID and array of IDs
        if (typeof value === 'string') {
          return value.match(/^[0-9a-fA-F]{24}$/);
        }
        if (Array.isArray(value)) {
          return value.every(id => id.match(/^[0-9a-fA-F]{24}$/));
        }
        return false;
      })
      .withMessage('Product categories must be valid ObjectId(s)'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    
    query('sort')
      .optional()
      .isIn(['name', 'createdAt', 'rating', 'status'])
      .withMessage('Sort must be one of: name, createdAt, rating, status'),
    
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either asc or desc'),
    
    query('include_inactive')
      .optional()
      .isBoolean()
      .withMessage('Include inactive must be a boolean'),
    
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean')
  ],
  
  params: [
    param('id')
      .isMongoId()
      .withMessage('ID must be a valid ObjectId'),
    
    param('identifier')
      .custom((value) => {
        // Allow either ObjectId or slug format
        return value.match(/^[0-9a-fA-F]{24}$/) || value.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      })
      .withMessage('Identifier must be a valid ObjectId or slug')
  ]
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the supplier
 *         name:
 *           type: string
 *           description: Official name of the supplier company
 *           minLength: 2
 *           maxLength: 150
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (auto-generated)
 *         description:
 *           type: string
 *           description: Brief description of the supplier
 *           maxLength: 1000
 *         logo_url:
 *           type: string
 *           format: uri
 *           description: URL to the supplier's logo
 *         address:
 *           type: object
 *           properties:
 *             address_line_1:
 *               type: string
 *               description: Primary address line
 *             address_line_2:
 *               type: string
 *               description: Secondary address line
 *             city:
 *               type: string
 *               description: City name
 *             state:
 *               type: string
 *               description: State or province
 *             zipcode:
 *               type: string
 *               description: Postal/ZIP code
 *             country:
 *               type: string
 *               description: Country name
 *         email:
 *           type: string
 *           format: email
 *           description: Primary company email
 *         website:
 *           type: string
 *           format: uri
 *           description: Company website URL
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Internal supplier rating
 *         payment_terms:
 *           type: string
 *           description: Payment terms and conditions
 *           maxLength: 500
 *         delivery_terms:
 *           type: string
 *           description: Delivery terms and conditions
 *           maxLength: 500
 *         status:
 *           type: string
 *           enum: [Active, Inactive, On Hold, Pending Approval]
 *           description: Current supplier status
 *         notes:
 *           type: string
 *           description: Internal notes about the supplier
 *           maxLength: 2000
 *         product_categories_supplied:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs this supplier provides
 *         is_active:
 *           type: boolean
 *           description: Whether the supplier is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         name: "TechSupply Corp"
 *         description: "Leading technology supplier for electronics"
 *         email: "contact@techsupply.com"
 *         website: "https://www.techsupply.com"
 *         address:
 *           address_line_1: "123 Tech Street"
 *           city: "San Francisco"
 *           state: "CA"
 *           zipcode: "94102"
 *           country: "USA"
 *         rating: 4.5
 *         status: "Active"
 *         payment_terms: "Net 30 days"
 *         delivery_terms: "FOB destination"
 */

/**
 * @swagger
 * /api/v1/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error or duplicate supplier
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.post('/', 
  adminAuthMiddleware, 
  supplierValidationRules.create, 
  supplierController.createSupplier
);

/**
 * @swagger
 * /api/v1/suppliers:
 *   get:
 *     summary: Get all suppliers with pagination, filtering, and search
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, On Hold, Pending Approval]
 *         description: Filter by supplier status
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: product_categories_supplied
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, email
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt, rating, status]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive suppliers (admin only)
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get('/', 
  supplierValidationRules.query, 
  supplierController.getAllSuppliers
);

/**
 * @swagger
 * /api/v1/suppliers/stats:
 *   get:
 *     summary: Get supplier statistics
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supplier statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalSuppliers:
 *                           type: integer
 *                         activeSuppliers:
 *                           type: integer
 *                         inactiveSuppliers:
 *                           type: integer
 *                         averageRating:
 *                           type: number
 *                     statusBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     topCountries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.get('/stats', 
  adminAuthMiddleware, 
  supplierController.getSupplierStats
);

/**
 * @swagger
 * /api/v1/suppliers/{identifier}:
 *   get:
 *     summary: Get a supplier by ID or slug
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID or slug
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 */
router.get('/:identifier', 
  param('identifier').custom((value) => {
    return value.match(/^[0-9a-fA-F]{24}$/) || value.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }),
  supplierController.getSupplierByIdOrSlug
);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   patch:
 *     summary: Update a supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Supplier not found
 */
router.patch('/:id', 
  adminAuthMiddleware, 
  supplierValidationRules.params, 
  supplierValidationRules.update, 
  supplierController.updateSupplier
);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   delete:
 *     summary: Soft delete a supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       204:
 *         description: Supplier deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Supplier not found
 */
router.delete('/:id', 
  adminAuthMiddleware, 
  supplierValidationRules.params, 
  supplierController.deleteSupplier
);

module.exports = router;
