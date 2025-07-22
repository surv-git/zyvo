/**
 * Supplier Controller
 * Handles all supplier-related operations for the e-commerce API
 * Manages supplier information without contact numbers (managed separately)
 */

const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const SupplierContactNumber = require('../models/SupplierContactNumber');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

/**
 * Create a new supplier
 * @route POST /api/v1/suppliers
 * @access Admin only
 */
const createSupplier = async (req, res, next) => {
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
      name,
      description,
      logo_url,
      address,
      email,
      website,
      payment_terms,
      delivery_terms,
      status,
      notes,
      product_categories_supplied
    } = req.body;

    // Create new supplier
    const supplier = new Supplier({
      name,
      description,
      logo_url,
      address: address || {},
      email,
      website,
      payment_terms,
      delivery_terms,
      status: status || 'Active',
      notes,
      product_categories_supplied: product_categories_supplied || []
    });

    const savedSupplier = await supplier.save();
    
    // Populate referenced fields for response
    await savedSupplier.populate('product_categories_supplied', 'name slug');

    // Log admin action
    adminAuditLogger.info('Supplier created', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'CREATE',
      resource_type: 'Supplier',
      resource_id: savedSupplier._id,
      changes: {
        name: savedSupplier.name,
        email: savedSupplier.email,
        status: savedSupplier.status,
        product_categories_supplied: savedSupplier.product_categories_supplied?.map(cat => cat._id)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: savedSupplier
    });

  } catch (error) {
    // Handle duplicate name/slug/email errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Supplier with this ${field} already exists`,
        field: field
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
 * Get all suppliers with pagination, filtering, and search
 * @route GET /api/v1/suppliers
 * @access Admin (with option for public access to active suppliers)
 */
const getAllSuppliers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      country,
      product_categories_supplied,
      is_active,
      search,
      sort = 'createdAt',
      order = 'desc',
      include_inactive = false
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Active status filter
    if (req.user?.role === 'admin' && include_inactive === 'true') {
      // Admin can see all suppliers
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
    } else {
      // Non-admin users only see active suppliers
      query.is_active = true;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Country filter
    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' };
    }

    // Product categories filter
    if (product_categories_supplied) {
      query.product_categories_supplied = {
        $in: Array.isArray(product_categories_supplied) 
          ? product_categories_supplied.map(id => new mongoose.Types.ObjectId(id))
          : [new mongoose.Types.ObjectId(product_categories_supplied)]
      };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.country': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const suppliers = await Supplier.find(query)
      .populate('product_categories_supplied', 'name slug description')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Fetch contact numbers for each supplier
    const supplierIds = suppliers.map(supplier => supplier._id);
    const contactNumbers = await SupplierContactNumber.find({
      supplier_id: { $in: supplierIds },
      is_active: true
    }).select('supplier_id contact_number contact_name type is_primary extension notes');

    // Group contact numbers by supplier_id
    const contactNumbersBySupplier = contactNumbers.reduce((acc, contact) => {
      const supplierId = contact.supplier_id.toString();
      if (!acc[supplierId]) {
        acc[supplierId] = [];
      }
      acc[supplierId].push(contact);
      return acc;
    }, {});

    // Add contact numbers to each supplier
    const suppliersWithContacts = suppliers.map(supplier => {
      const supplierObj = supplier.toObject();
      supplierObj.contact_numbers = contactNumbersBySupplier[supplier._id.toString()] || [];
      return supplierObj;
    });

    // Get total count for pagination
    const totalItems = await Supplier.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Log user activity for public access
    if (!req.user || req.user.role !== 'admin') {
      userActivityLogger.info('Suppliers list viewed', {
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        action_type: 'VIEW',
        resource_type: 'Supplier',
        query_params: {
          page: pageNum,
          limit: limitNum,
          status,
          country,
          search
        }
      });
    }

    res.json({
      success: true,
      data: suppliersWithContacts,
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
 * Get a single supplier by ID or slug
 * @route GET /api/v1/suppliers/:identifier
 * @access Public (active suppliers) / Admin (all suppliers)
 */
const getSupplierByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    // Build query - try to find by ID first, then by slug
    let query;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      query = { _id: identifier };
    } else {
      // Assume it's a slug
      query = { slug: identifier };
    }

    // Only show active suppliers to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.is_active = true;
    }

    const supplier = await Supplier.findOne(query)
      .populate('product_categories_supplied', 'name slug description');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Fetch contact numbers for this supplier
    const contactNumbers = await SupplierContactNumber.find({
      supplier_id: supplier._id,
      is_active: true
    }).select('contact_number contact_name type is_primary extension notes');

    // Add contact numbers to supplier object
    const supplierWithContacts = supplier.toObject();
    supplierWithContacts.contact_numbers = contactNumbers;

    // Log user activity
    userActivityLogger.info('Supplier viewed', {
      user_id: req.user?.id || 'anonymous',
      user_email: req.user?.email || 'anonymous',
      action_type: 'VIEW',
      resource_type: 'Supplier',
      resource_id: supplier._id
    });

    res.json({
      success: true,
      data: supplierWithContacts
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a supplier
 * @route PATCH /api/v1/suppliers/:id
 * @access Admin only
 */
const updateSupplier = async (req, res, next) => {
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

    // Find supplier
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Store original data for audit log
    const originalData = {
      name: supplier.name,
      email: supplier.email,
      status: supplier.status,
      address: supplier.address,
      product_categories_supplied: supplier.product_categories_supplied
    };

    // Handle nested address updates
    if (updateData.address) {
      supplier.address = { ...supplier.address.toObject(), ...updateData.address };
      delete updateData.address;
    }

    // Apply other updates
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        supplier[key] = updateData[key];
      }
    });

    // Save updated supplier
    const updatedSupplier = await supplier.save();
    
    // Populate referenced fields for response
    await updatedSupplier.populate('product_categories_supplied', 'name slug description');

    // Log admin action
    adminAuditLogger.info('Supplier updated', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'UPDATE',
      resource_type: 'Supplier',
      resource_id: updatedSupplier._id,
      changes: {
        before: originalData,
        after: {
          name: updatedSupplier.name,
          email: updatedSupplier.email,
          status: updatedSupplier.status,
          address: updatedSupplier.address,
          product_categories_supplied: updatedSupplier.product_categories_supplied?.map(cat => cat._id)
        }
      }
    });

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updatedSupplier
    });

  } catch (error) {
    // Handle duplicate name/slug/email errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Supplier with this ${field} already exists`,
        field: field
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
 * Soft delete a supplier
 * @route DELETE /api/v1/suppliers/:id
 * @access Admin only
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Perform soft delete
    await supplier.softDelete();

    // Log admin action
    adminAuditLogger.info('Supplier soft deleted', {
      admin_id: req.user.id,
      admin_email: req.user.email,
      action_type: 'DELETE',
      resource_type: 'Supplier',
      resource_id: supplier._id,
      changes: {
        name: supplier.name,
        email: supplier.email,
        is_active: false
      }
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier statistics
 * @route GET /api/v1/suppliers/stats
 * @access Admin only
 */
const getSupplierStats = async (req, res, next) => {
  try {
    const stats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
          },
          inactiveSuppliers: {
            $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] }
          },
          averageRating: { $avg: '$rating' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSuppliers: 1,
          activeSuppliers: 1,
          inactiveSuppliers: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    // Get status breakdown
    const statusStats = await Supplier.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get country breakdown
    const countryStats = await Supplier.aggregate([
      { $match: { is_active: true, 'address.country': { $ne: null } } },
      {
        $group: {
          _id: '$address.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSuppliers: 0,
          activeSuppliers: 0,
          inactiveSuppliers: 0,
          averageRating: 0
        },
        statusBreakdown: statusStats,
        topCountries: countryStats
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierByIdOrSlug,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
};
