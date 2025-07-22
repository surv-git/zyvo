/**
 * Supplier Contact Number Routes
 * Defines all API endpoints for supplier contact number management
 * Base path: /api/v1/supplier-contact-numbers
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const supplierContactNumberController = require('../controllers/supplierContactNumber.controller');

// Input validation rules
const contactNumberValidationRules = {
  create: [
    body('supplier_id')
      .notEmpty()
      .withMessage('Supplier ID is required')
      .isMongoId()
      .withMessage('Supplier ID must be a valid ObjectId'),
    
    body('contact_number')
      .notEmpty()
      .withMessage('Contact number is required')
      .trim()
      .isLength({ min: 7, max: 20 })
      .withMessage('Contact number must be between 7 and 20 characters')
      .matches(/^[\+]?[1-9][\d\s\-\(\)\.]{6,19}$/)
      .withMessage('Contact number must be a valid phone number'),
    
    body('contact_name')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Contact name cannot exceed 100 characters'),
    
    body('type')
      .optional()
      .isIn(['Mobile', 'Landline', 'Fax', 'Whatsapp', 'Toll-Free', 'Other'])
      .withMessage('Type must be one of: Mobile, Landline, Fax, Whatsapp, Toll-Free, Other'),
    
    body('extension')
      .optional({ nullable: true })
      .trim()
      .matches(/^\d*$/)
      .withMessage('Extension must contain only numbers')
      .isLength({ max: 10 })
      .withMessage('Extension cannot exceed 10 characters'),
    
    body('is_primary')
      .optional()
      .isBoolean()
      .withMessage('Is primary must be a boolean'),
    
    body('notes')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  
  update: [
    body('contact_number')
      .optional()
      .trim()
      .isLength({ min: 7, max: 20 })
      .withMessage('Contact number must be between 7 and 20 characters')
      .matches(/^[\+]?[1-9][\d\s\-\(\)\.]{6,19}$/)
      .withMessage('Contact number must be a valid phone number'),
    
    body('contact_name')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Contact name cannot exceed 100 characters'),
    
    body('type')
      .optional()
      .isIn(['Mobile', 'Landline', 'Fax', 'Whatsapp', 'Toll-Free', 'Other'])
      .withMessage('Type must be one of: Mobile, Landline, Fax, Whatsapp, Toll-Free, Other'),
    
    body('extension')
      .optional({ nullable: true })
      .trim()
      .matches(/^\d*$/)
      .withMessage('Extension must contain only numbers')
      .isLength({ max: 10 })
      .withMessage('Extension cannot exceed 10 characters'),
    
    body('is_primary')
      .optional()
      .isBoolean()
      .withMessage('Is primary must be a boolean'),
    
    body('notes')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
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
    
    query('supplier_id')
      .optional()
      .isMongoId()
      .withMessage('Supplier ID must be a valid ObjectId'),
    
    query('is_primary')
      .optional()
      .isBoolean()
      .withMessage('Is primary must be a boolean'),
    
    query('type')
      .optional()
      .isIn(['Mobile', 'Landline', 'Fax', 'Whatsapp', 'Toll-Free', 'Other'])
      .withMessage('Type must be one of: Mobile, Landline, Fax, Whatsapp, Toll-Free, Other'),
    
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    
    query('sort')
      .optional()
      .isIn(['supplier_id', 'contact_name', 'is_primary', 'createdAt', 'type'])
      .withMessage('Sort must be one of: supplier_id, contact_name, is_primary, createdAt, type'),
    
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either asc or desc'),
    
    query('include_inactive')
      .optional()
      .isBoolean()
      .withMessage('Include inactive must be a boolean')
  ],
  
  params: [
    param('id')
      .isMongoId()
      .withMessage('ID must be a valid ObjectId'),
    
    param('supplierId')
      .isMongoId()
      .withMessage('Supplier ID must be a valid ObjectId')
  ]
};

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierContactNumber:
 *       type: object
 *       required:
 *         - supplier_id
 *         - contact_number
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the contact number
 *         supplier_id:
 *           type: string
 *           description: Reference to the supplier
 *         contact_number:
 *           type: string
 *           description: The actual phone number
 *           minLength: 7
 *           maxLength: 20
 *         contact_name:
 *           type: string
 *           description: Name of the person associated with this number
 *           maxLength: 100
 *         type:
 *           type: string
 *           enum: [Mobile, Landline, Fax, Whatsapp, Toll-Free, Other]
 *           default: Mobile
 *           description: Type of contact number
 *         extension:
 *           type: string
 *           description: Phone extension if applicable
 *           maxLength: 10
 *         is_primary:
 *           type: boolean
 *           default: false
 *           description: Whether this is the primary contact number
 *         notes:
 *           type: string
 *           description: Additional notes about this contact number
 *           maxLength: 500
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the contact number is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         supplier_id: "60b5d5f5e8b5e5001f8b4567"
 *         contact_number: "+1-555-123-4567"
 *         contact_name: "John Doe"
 *         type: "Mobile"
 *         extension: "123"
 *         is_primary: true
 *         notes: "Primary contact for urgent matters"
 */

/**
 * @swagger
 * /api/v1/supplier-contact-numbers:
 *   post:
 *     summary: Create a new supplier contact number
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierContactNumber'
 *     responses:
 *       201:
 *         description: Supplier contact number created successfully
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
 *                   $ref: '#/components/schemas/SupplierContactNumber'
 *       400:
 *         description: Validation error or duplicate contact number
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.post('/', 
  authMiddleware,
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.create, 
  supplierContactNumberController.createContactNumber
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers:
 *   get:
 *     summary: Get all supplier contact numbers with pagination and filtering
 *     tags: [Supplier Contact Numbers]
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
 *         name: supplier_id
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *       - in: query
 *         name: is_primary
 *         schema:
 *           type: boolean
 *         description: Filter by primary contact flag
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Mobile, Landline, Fax, Whatsapp, Toll-Free, Other]
 *         description: Filter by contact type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in contact number or contact name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [supplier_id, contact_name, is_primary, createdAt, type]
 *           default: supplier_id
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive contact numbers
 *     responses:
 *       200:
 *         description: Contact numbers retrieved successfully
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
 *                     $ref: '#/components/schemas/SupplierContactNumber'
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
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.get('/', 
  authMiddleware,
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.query, 
  supplierContactNumberController.getAllContactNumbers
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers/supplier/{supplierId}:
 *   get:
 *     summary: Get contact numbers for a specific supplier
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive contact numbers
 *     responses:
 *       200:
 *         description: Contact numbers retrieved successfully
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
 *                     $ref: '#/components/schemas/SupplierContactNumber'
 *                 supplier:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Supplier not found
 */
router.get('/supplier/:supplierId', 
  authMiddleware,
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.params, 
  supplierContactNumberController.getContactNumbersBySupplier
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers/{id}:
 *   get:
 *     summary: Get a supplier contact number by ID
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact number ID
 *     responses:
 *       200:
 *         description: Contact number retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupplierContactNumber'
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Contact number not found
 */
router.get('/:id', 
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.params, 
  supplierContactNumberController.getContactNumberById
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers/{id}:
 *   patch:
 *     summary: Update a supplier contact number
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact number ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierContactNumber'
 *     responses:
 *       200:
 *         description: Contact number updated successfully
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
 *                   $ref: '#/components/schemas/SupplierContactNumber'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Contact number not found
 */
router.patch('/:id', 
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.params, 
  contactNumberValidationRules.update, 
  supplierContactNumberController.updateContactNumber
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers/{id}/set-primary:
 *   patch:
 *     summary: Set a contact number as primary for its supplier
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact number ID
 *     responses:
 *       200:
 *         description: Contact number set as primary successfully
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
 *                   $ref: '#/components/schemas/SupplierContactNumber'
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Contact number not found
 */
router.patch('/:id/set-primary', 
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.params, 
  supplierContactNumberController.setPrimaryContactNumber
);

/**
 * @swagger
 * /api/v1/supplier-contact-numbers/{id}:
 *   delete:
 *     summary: Soft delete a supplier contact number
 *     tags: [Supplier Contact Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact number ID
 *     responses:
 *       204:
 *         description: Contact number deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Contact number not found
 */
router.delete('/:id', 
  authMiddleware,
  adminAuthMiddleware, 
  contactNumberValidationRules.params, 
  supplierContactNumberController.deleteContactNumber
);

module.exports = router;
