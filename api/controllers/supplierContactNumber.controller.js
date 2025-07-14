/**
 * SupplierContactNumber Controller
 * Handles all supplier contact number operations for the e-commerce API
 * Manages multiple contact numbers per supplier with primary contact logic
 */

const mongoose = require('mongoose');
const SupplierContactNumber = require('../models/SupplierContactNumber');
const Supplier = require('../models/Supplier');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new supplier contact number
 * @route POST /api/v1/supplier-contact-numbers
 * @access Admin only
 */
const createSupplierContactNumber = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      supplier_id,
      contact_number,
      contact_name,
      type,
      extension,
      is_primary,
      notes
    } = req.body;

    // Validate supplier exists
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Create new supplier contact number
    const supplierContactNumber = new SupplierContactNumber({
      supplier_id,
      contact_number,
      contact_name,
      type: type || 'Mobile', // Default to Mobile as requested
      extension,
      is_primary: is_primary || false,
      notes
    });

    const savedContactNumber = await supplierContactNumber.save();
    
    // Populate supplier information for response
    await savedContactNumber.populate('supplier_id', 'name slug email');

    // Log admin action
    adminAuditLogger.info('Supplier contact number created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'SupplierContactNumber',
      resource_id: savedContactNumber._id,
      changes: {
        supplier_id: savedContactNumber.supplier_id._id,
        supplier_name: savedContactNumber.supplier_id.name,
        contact_number: savedContactNumber.contact_number,
        contact_name: savedContactNumber.contact_name,
        type: savedContactNumber.type,
        is_primary: savedContactNumber.is_primary
      }
    });

    res.status(201).json({
      success: true,
      message: 'Supplier contact number created successfully',
      data: savedContactNumber
    });

  } catch (error) {
    // Handle duplicate contact number for same supplier
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This contact number already exists for this supplier'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    next(error);
  }
};

/**
 * Get all supplier contact numbers with pagination, filtering, and search
 * @route GET /api/v1/supplier-contact-numbers
 * @access Admin only
 */
const getAllSupplierContactNumbers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      supplier_id,
      is_primary,
      type,
      is_active,
      search,
      sort = 'supplier_id',
      order = 'asc',
      include_inactive = false
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Active status filter
    if (include_inactive !== 'true') {
      query.is_active = true;
    } else if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    // Supplier filter
    if (supplier_id) {
      query.supplier_id = new mongoose.Types.ObjectId(supplier_id);
    }

    // Primary contact filter
    if (is_primary !== undefined) {
      query.is_primary = is_primary === 'true';
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { contact_number: { $regex: search, $options: 'i' } },
        { contact_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object with default sorting logic
    let sortObj = {};
    if (sort === 'supplier_id') {
      sortObj = { 
        supplier_id: order === 'desc' ? -1 : 1,
        is_primary: -1, // Primary contacts first
        createdAt: -1   // Newest first
      };
    } else if (sort === 'is_primary') {
      sortObj = { 
        is_primary: order === 'desc' ? -1 : 1,
        supplier_id: 1,
        createdAt: -1
      };
    } else {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const contactNumbers = await SupplierContactNumber.find(query)
      .populate('supplier_id', 'name slug email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalItems = await SupplierContactNumber.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: contactNumbers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get a single supplier contact number by ID
 * @route GET /api/v1/supplier-contact-numbers/:id
 * @access Admin only
 */
const getSupplierContactNumberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contactNumber = await SupplierContactNumber.findById(id)
      .populate('supplier_id', 'name slug email');

    if (!contactNumber) {
      return res.status(404).json({
        success: false,
        message: 'Supplier contact number not found'
      });
    }

    res.json({
      success: true,
      data: contactNumber
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a supplier contact number
 * @route PATCH /api/v1/supplier-contact-numbers/:id
 * @access Admin only
 */
const updateSupplierContactNumber = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find contact number
    const contactNumber = await SupplierContactNumber.findById(id);
    if (!contactNumber) {
      return res.status(404).json({
        success: false,
        message: 'Supplier contact number not found'
      });
    }

    // Store original data for audit log
    const originalData = {
      contact_number: contactNumber.contact_number,
      contact_name: contactNumber.contact_name,
      type: contactNumber.type,
      is_primary: contactNumber.is_primary,
      extension: contactNumber.extension,
      notes: contactNumber.notes
    };

    // Apply updates
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        contactNumber[key] = updateData[key];
      }
    });

    // Save updated contact number (pre-save hook will handle primary logic)
    const updatedContactNumber = await contactNumber.save();
    
    // Populate supplier information for response
    await updatedContactNumber.populate('supplier_id', 'name slug email');

    // Log admin action
    adminAuditLogger.info('Supplier contact number updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'SupplierContactNumber',
      resource_id: updatedContactNumber._id,
      changes: {
        supplier_id: updatedContactNumber.supplier_id._id,
        supplier_name: updatedContactNumber.supplier_id.name,
        before: originalData,
        after: {
          contact_number: updatedContactNumber.contact_number,
          contact_name: updatedContactNumber.contact_name,
          type: updatedContactNumber.type,
          is_primary: updatedContactNumber.is_primary,
          extension: updatedContactNumber.extension,
          notes: updatedContactNumber.notes
        }
      }
    });

    res.json({
      success: true,
      message: 'Supplier contact number updated successfully',
      data: updatedContactNumber
    });

  } catch (error) {
    // Handle duplicate contact number for same supplier
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This contact number already exists for this supplier'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    next(error);
  }
};

/**
 * Soft delete a supplier contact number
 * @route DELETE /api/v1/supplier-contact-numbers/:id
 * @access Admin only
 */
const deleteSupplierContactNumber = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contactNumber = await SupplierContactNumber.findById(id)
      .populate('supplier_id', 'name slug email');
    
    if (!contactNumber) {
      return res.status(404).json({
        success: false,
        message: 'Supplier contact number not found'
      });
    }

    // Perform soft delete
    await contactNumber.softDelete();

    // Log admin action
    adminAuditLogger.info('Supplier contact number soft deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'SupplierContactNumber',
      resource_id: contactNumber._id,
      changes: {
        supplier_id: contactNumber.supplier_id._id,
        supplier_name: contactNumber.supplier_id.name,
        contact_number: contactNumber.contact_number,
        contact_name: contactNumber.contact_name,
        is_active: false
      }
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * Get contact numbers for a specific supplier
 * @route GET /api/v1/supplier-contact-numbers/supplier/:supplierId
 * @access Admin only
 */
const getContactNumbersBySupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { include_inactive = false } = req.query;

    // Validate supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const contactNumbers = await SupplierContactNumber.findBySupplier(
      supplierId, 
      include_inactive === 'true'
    );

    res.json({
      success: true,
      data: contactNumbers,
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        slug: supplier.slug,
        email: supplier.email
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Set a contact number as primary for a supplier
 * @route PATCH /api/v1/supplier-contact-numbers/:id/set-primary
 * @access Admin only
 */
const setPrimaryContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contactNumber = await SupplierContactNumber.findById(id)
      .populate('supplier_id', 'name slug email');
    
    if (!contactNumber) {
      return res.status(404).json({
        success: false,
        message: 'Supplier contact number not found'
      });
    }

    // Set as primary (method handles setting others to non-primary)
    await contactNumber.setPrimary();

    // Log admin action
    adminAuditLogger.info('Supplier contact number set as primary', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'SupplierContactNumber',
      resource_id: contactNumber._id,
      changes: {
        supplier_id: contactNumber.supplier_id._id,
        supplier_name: contactNumber.supplier_id.name,
        contact_number: contactNumber.contact_number,
        is_primary: true
      }
    });

    res.json({
      success: true,
      message: 'Contact number set as primary successfully',
      data: contactNumber
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContactNumber: createSupplierContactNumber,
  getAllContactNumbers: getAllSupplierContactNumbers,
  getContactNumberById: getSupplierContactNumberById,
  updateContactNumber: updateSupplierContactNumber,
  deleteContactNumber: deleteSupplierContactNumber,
  getContactNumbersBySupplier,
  setPrimaryContactNumber: setPrimaryContact
};
