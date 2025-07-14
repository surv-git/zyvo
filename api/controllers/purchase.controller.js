/**
 * Purchase Controller
 * Handles all purchase management operations including planning and actual purchases
 * Restricted to administrators only
 */

const Purchase = require('../models/Purchase');
const ProductVariant = require('../models/ProductVariant');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const { getVariantPackDetails } = require('./inventory.controller');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Create a new purchase record
 * POST /api/v1/purchases
 */
const createPurchase = async (req, res) => {
  try {
    const {
      product_variant_id,
      supplier_id,
      purchase_order_number,
      purchase_date,
      quantity,
      unit_price_at_purchase,
      packaging_cost = 0,
      shipping_cost = 0,
      status = 'Planned',
      notes,
      expected_delivery_date
    } = req.body;

    // Input validation
    if (!product_variant_id || !supplier_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product variant ID, supplier ID, and quantity are required'
      });
    }

    // Validate quantity is a positive integer
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    // Validate numerical values for costs
    const numericFields = { packaging_cost, shipping_cost };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field.replace('_', ' ')} must be a non-negative number`
        });
      }
    }

    // Validate status if provided
    const validStatuses = ['Planned', 'Pending', 'Completed', 'Cancelled', 'Partially Received'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate date formats if provided
    if (purchase_date && isNaN(new Date(purchase_date).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Purchase date must be a valid date'
      });
    }

    if (expected_delivery_date && isNaN(new Date(expected_delivery_date).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Expected delivery date must be a valid date'
      });
    }

    // Verify product variant exists
    const productVariant = await ProductVariant.findById(product_variant_id).select('price sku_code');
    if (!productVariant) {
      return res.status(400).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Verify supplier exists
    const supplier = await Supplier.findById(supplier_id).select('name is_active');
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (!supplier.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create purchase from inactive supplier'
      });
    }

    // Use current product variant price if unit price not provided
    const finalUnitPrice = unit_price_at_purchase !== undefined ? 
      unit_price_at_purchase : productVariant.price;

    if (finalUnitPrice === undefined || finalUnitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price at purchase must be provided or product variant must have a valid price'
      });
    }

    // Validate unit price has at most 2 decimal places
    if (Math.round(finalUnitPrice * 100) !== finalUnitPrice * 100) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must have at most 2 decimal places'
      });
    }

    // Calculate landing price
    const landingPrice = Purchase.calculateLandingPrice(
      finalUnitPrice,
      quantity,
      packaging_cost,
      shipping_cost
    );

    // Check for duplicate purchase order number if provided
    if (purchase_order_number) {
      const existingPurchase = await Purchase.findOne({ 
        purchase_order_number: purchase_order_number.trim() 
      });
      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order number already exists'
        });
      }
    }

    // Create purchase record
    const purchaseData = {
      product_variant_id,
      supplier_id,
      purchase_order_number: purchase_order_number ? purchase_order_number.trim() : null,
      purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
      quantity,
      unit_price_at_purchase: finalUnitPrice,
      packaging_cost,
      shipping_cost,
      landing_price: landingPrice,
      status,
      notes: notes ? notes.trim() : null,
      expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : null
    };

    const purchase = new Purchase(purchaseData);
    await purchase.save();

    // Populate references for response
    await purchase.populate([
      {
        path: 'product_variant_id',
        select: 'sku_code price option_values'
      },
      {
        path: 'supplier_id',
        select: 'name email'
      }
    ]);

    // Log admin action
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      request_id: req.correlationId
    };

    adminAuditLogger.logResourceCreation(
      adminInfo,
      'purchase',
      purchase._id,
      {
        product_variant: productVariant.sku_code,
        supplier: supplier.name,
        purchase_order_number: purchase.purchase_order_number,
        quantity: purchase.quantity,
        landing_price: purchase.landing_price,
        status: purchase.status
      }
    );

    res.status(201).json({
      success: true,
      message: 'Purchase record created successfully',
      data: purchase
    });

  } catch (error) {
    console.error('Error creating purchase:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key error for purchase_order_number
    if (error.code === 11000 && error.keyPattern?.purchase_order_number) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating purchase'
    });
  }
};

/**
 * Get all purchases with pagination, filtering, and search
 * GET /api/v1/purchases
 */
const getAllPurchases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      product_variant_id,
      supplier_id,
      status,
      start_date,
      end_date,
      include_inactive = 'false',
      search,
      sort = 'purchase_date',
      order = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100

    // Build filter object
    const filter = {};

    // Active/inactive filter
    if (include_inactive !== 'true') {
      filter.is_active = true;
    }

    // Product variant filter
    if (product_variant_id) {
      if (!product_variant_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product variant ID format'
        });
      }
      filter.product_variant_id = product_variant_id;
    }

    // Supplier filter
    if (supplier_id) {
      if (!supplier_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID format'
        });
      }
      filter.supplier_id = supplier_id;
    }

    // Status filter
    if (status) {
      const validStatuses = ['Planned', 'Pending', 'Completed', 'Cancelled', 'Partially Received'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      filter.status = status;
    }

    // Date range filter
    if (start_date || end_date) {
      filter.purchase_date = {};
      if (start_date) {
        const startDateObj = new Date(start_date);
        if (isNaN(startDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date format'
          });
        }
        filter.purchase_date.$gte = startDateObj;
      }
      if (end_date) {
        const endDateObj = new Date(end_date);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date format'
          });
        }
        filter.purchase_date.$lte = endDateObj;
      }
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (search.toLowerCase() === 'null' || search.toLowerCase() === 'no order') {
        // Search for purchases without purchase order numbers
        filter.purchase_order_number = null;
      } else {
        // Search in purchase order number (excluding null values)
        filter.purchase_order_number = {
          $regex: searchRegex,
          $ne: null
        };
      }
    }

    // Build sort object
    const validSortFields = ['purchase_date', 'landing_price', 'status', 'quantity', 'createdAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'purchase_date';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: sortOrder };

    // Execute query with pagination
    const skip = (pageNum - 1) * limitNum;

    const [purchases, totalItems] = await Promise.all([
      Purchase.find(filter)
        .populate([
          {
            path: 'product_variant_id',
            select: 'sku_code price option_values',
            populate: {
              path: 'product_id',
              select: 'name'
            }
          },
          {
            path: 'supplier_id',
            select: 'name email rating'
          }
        ])
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Purchase.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      filters: {
        product_variant_id,
        supplier_id,
        status,
        start_date,
        end_date,
        include_inactive: include_inactive === 'true',
        search
      }
    });

  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching purchases'
    });
  }
};

/**
 * Get purchase by ID
 * GET /api/v1/purchases/:id
 */
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase ID format'
      });
    }

    const purchase = await Purchase.findById(id)
      .populate([
        {
          path: 'product_variant_id',
          select: 'sku_code price option_values',
          populate: {
            path: 'product_id',
            select: 'name description'
          }
        },
        {
          path: 'supplier_id',
          select: 'name email website address rating payment_terms delivery_terms'
        }
      ]);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching purchase'
    });
  }
};

/**
 * Update purchase
 * PATCH /api/v1/purchases/:id
 */
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchase_order_number,
      quantity,
      packaging_cost,
      shipping_cost,
      status,
      notes,
      expected_delivery_date,
      received_date,
      is_active
    } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase ID format'
      });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Store original values for audit log
    const originalValues = {
      purchase_order_number: purchase.purchase_order_number,
      quantity: purchase.quantity,
      packaging_cost: purchase.packaging_cost,
      shipping_cost: purchase.shipping_cost,
      landing_price: purchase.landing_price,
      status: purchase.status,
      is_active: purchase.is_active
    };

    const updates = {};
    let needsLandingPriceRecalc = false;

    // Validate and set purchase order number
    if (purchase_order_number !== undefined) {
      if (purchase_order_number === null || purchase_order_number === '') {
        updates.purchase_order_number = null;
      } else {
        const trimmedPON = purchase_order_number.trim();
        // Check for duplicate if changing to a new value
        if (trimmedPON !== purchase.purchase_order_number) {
          const existingPurchase = await Purchase.findOne({ 
            purchase_order_number: trimmedPON,
            _id: { $ne: id }
          });
          if (existingPurchase) {
            return res.status(400).json({
              success: false,
              message: 'Purchase order number already exists'
            });
          }
        }
        updates.purchase_order_number = trimmedPON;
      }
    }

    // Validate and set quantity
    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer'
        });
      }
      updates.quantity = quantity;
      needsLandingPriceRecalc = true;
    }

    // Validate and set costs
    if (packaging_cost !== undefined) {
      if (isNaN(packaging_cost) || packaging_cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Packaging cost must be a non-negative number'
        });
      }
      if (Math.round(packaging_cost * 100) !== packaging_cost * 100) {
        return res.status(400).json({
          success: false,
          message: 'Packaging cost must have at most 2 decimal places'
        });
      }
      updates.packaging_cost = packaging_cost;
      needsLandingPriceRecalc = true;
    }

    if (shipping_cost !== undefined) {
      if (isNaN(shipping_cost) || shipping_cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Shipping cost must be a non-negative number'
        });
      }
      if (Math.round(shipping_cost * 100) !== shipping_cost * 100) {
        return res.status(400).json({
          success: false,
          message: 'Shipping cost must have at most 2 decimal places'
        });
      }
      updates.shipping_cost = shipping_cost;
      needsLandingPriceRecalc = true;
    }

    // Validate and set status
    if (status !== undefined) {
      const validStatuses = ['Planned', 'Pending', 'Completed', 'Cancelled', 'Partially Received'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updates.status = status;

      // INVENTORY INTEGRATION: Update stock when purchase is completed
      const oldStatus = purchase.status;
      const isStatusChangingToCompleted = (status === 'Completed' || status === 'Partially Received') && 
                                         oldStatus !== 'Completed' && oldStatus !== 'Partially Received';
      
      if (isStatusChangingToCompleted && !purchase.inventory_updated_on_completion) {
        try {
          await updateInventoryFromPurchase(purchase, updates.quantity || purchase.quantity);
          updates.inventory_updated_on_completion = true;
          
          console.log(`Inventory updated for purchase ${purchase._id}: ${updates.quantity || purchase.quantity} units`);
        } catch (inventoryError) {
          console.error('Error updating inventory from purchase:', inventoryError);
          // Don't fail the purchase update, but log the error
          console.error(`Failed to update inventory for purchase ${purchase._id}:`, inventoryError.message);
        }
      }
    }

    // Validate and set dates
    if (expected_delivery_date !== undefined) {
      if (expected_delivery_date === null) {
        updates.expected_delivery_date = null;
      } else {
        const expectedDate = new Date(expected_delivery_date);
        if (isNaN(expectedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Expected delivery date must be a valid date'
          });
        }
        updates.expected_delivery_date = expectedDate;
      }
    }

    if (received_date !== undefined) {
      if (received_date === null) {
        updates.received_date = null;
      } else {
        const receivedDateObj = new Date(received_date);
        if (isNaN(receivedDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Received date must be a valid date'
          });
        }
        updates.received_date = receivedDateObj;
      }
    }

    // Set other fields
    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    // Recalculate landing price if needed
    if (needsLandingPriceRecalc) {
      const newQuantity = updates.quantity !== undefined ? updates.quantity : purchase.quantity;
      const newPackagingCost = updates.packaging_cost !== undefined ? updates.packaging_cost : purchase.packaging_cost;
      const newShippingCost = updates.shipping_cost !== undefined ? updates.shipping_cost : purchase.shipping_cost;
      
      updates.landing_price = Purchase.calculateLandingPrice(
        purchase.unit_price_at_purchase,
        newQuantity,
        newPackagingCost,
        newShippingCost
      );
    }

    // Update timestamp
    updates.updatedAt = new Date();

    // Apply updates
    Object.assign(purchase, updates);
    await purchase.save();

    // Populate for response
    await purchase.populate([
      {
        path: 'product_variant_id',
        select: 'sku_code price option_values'
      },
      {
        path: 'supplier_id',
        select: 'name email'
      }
    ]);

    // Log admin action
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      request_id: req.correlationId
    };

    const changedFields = Object.keys(updates).filter(key => 
      key !== 'updatedAt' && originalValues[key] !== updates[key]
    );

    if (changedFields.length > 0) {
      const changeData = changedFields.reduce((acc, field) => {
        acc[field] = {
          from: originalValues[field],
          to: updates[field]
        };
        return acc;
      }, {});

      adminAuditLogger.logResourceUpdate(
        adminInfo,
        'purchase',
        purchase._id,
        originalValues,
        changeData
      );
    }

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });

  } catch (error) {
    console.error('Error updating purchase:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000 && error.keyPattern?.purchase_order_number) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating purchase'
    });
  }
};

/**
 * Delete purchase (soft delete)
 * DELETE /api/v1/purchases/:id
 */
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase ID format'
      });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Soft delete
    purchase.is_active = false;
    purchase.updatedAt = new Date();
    await purchase.save();

    // Log admin action
    const adminInfo = {
      admin_id: req.user.id,
      admin_username: req.user.username,
      admin_role: req.user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID,
      request_id: req.correlationId
    };

    adminAuditLogger.logResourceDeletion(
      adminInfo,
      'purchase',
      purchase._id,
      {
        purchase_order_number: purchase.purchase_order_number,
        status: purchase.status,
        landing_price: purchase.landing_price
      }
    );

    res.status(204).json();

  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting purchase'
    });
  }
};

/**
 * Helper function to update inventory when a purchase is completed
 * Handles both base unit and pack variants correctly
 * @param {Object} purchase - The purchase document
 * @param {Number} purchasedQuantity - Quantity purchased
 */
const updateInventoryFromPurchase = async (purchase, purchasedQuantity) => {
  try {
    // Get pack details for the purchased variant
    const packDetails = await getVariantPackDetails(purchase.product_variant_id.toString());
    
    let targetBaseVariantId;
    let quantityToAdd;
    
    if (packDetails.is_base_unit) {
      // Purchased a base unit directly
      targetBaseVariantId = purchase.product_variant_id.toString();
      quantityToAdd = purchasedQuantity;
    } else {
      // Purchased a pack, need to convert to base units
      targetBaseVariantId = packDetails.base_unit_variant_id;
      quantityToAdd = purchasedQuantity * packDetails.pack_unit_multiplier;
    }
    
    // Find or create inventory record for the base unit
    let inventoryRecord = await Inventory.findOne({
      product_variant_id: targetBaseVariantId,
      is_active: true
    });
    
    if (!inventoryRecord) {
      // Create new inventory record for this base unit
      inventoryRecord = new Inventory({
        product_variant_id: targetBaseVariantId,
        stock_quantity: quantityToAdd,
        last_restock_date: new Date(),
        notes: `Initial stock from purchase ${purchase._id || 'unknown'}`
      });
      
      console.log(`Creating new inventory record for variant ${targetBaseVariantId} with ${quantityToAdd} units`);
    } else {
      // Update existing inventory record
      inventoryRecord.stock_quantity += quantityToAdd;
      inventoryRecord.last_restock_date = new Date();
      inventoryRecord.updatedAt = new Date();
      
      // Update notes to include purchase reference
      const purchaseNote = `Restocked ${quantityToAdd} units from purchase ${purchase._id || 'unknown'}`;
      if (inventoryRecord.notes) {
        inventoryRecord.notes += `; ${purchaseNote}`;
      } else {
        inventoryRecord.notes = purchaseNote;
      }
      
      console.log(`Updated inventory for variant ${targetBaseVariantId}: +${quantityToAdd} units (total: ${inventoryRecord.stock_quantity})`);
    }
    
    await inventoryRecord.save();
    
    return {
      success: true,
      targetBaseVariantId,
      quantityAdded: quantityToAdd,
      newStockLevel: inventoryRecord.stock_quantity
    };
    
  } catch (error) {
    console.error('Error in updateInventoryFromPurchase:', error);
    throw error;
  }
};

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
};
