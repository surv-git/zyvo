/**
 * Inventory Controller
 * Handles CRUD operations for inventory management with pack logic
 * All operations require admin authentication and include audit logging
 */

const Inventory = require('../models/Inventory');
const ProductVariant = require('../models/ProductVariant');
const adminAuditLogger = require('../loggers/adminAudit.logger');

/**
 * Helper function to get variant pack details
 * Analyzes ProductVariant option_values to determine pack relationships
 * @param {String} productVariantId - MongoDB ObjectId of the ProductVariant
 * @returns {Object} - { is_base_unit, pack_unit_multiplier, base_unit_variant_id }
 */
const getVariantPackDetails = async (productVariantId) => {
  try {
    // Fetch the ProductVariant document
    const productVariant = await ProductVariant.findById(productVariantId).lean();
    if (!productVariant) {
      throw new Error('Product variant not found');
    }

    // Analyze option_values to determine pack details
    const { is_base_unit, pack_unit_multiplier } = analyzePackOptions(productVariant.option_values);

    let base_unit_variant_id = null;

    // If it's not a base unit, find the corresponding base unit variant
    if (!is_base_unit) {
      base_unit_variant_id = await findBaseUnitVariant(productVariant);
    } else {
      base_unit_variant_id = productVariantId;
    }

    return {
      is_base_unit,
      pack_unit_multiplier,
      base_unit_variant_id
    };

  } catch (error) {
    console.error('Error getting variant pack details:', error);
    throw error;
  }
};

/**
 * Analyze option_values to determine pack multiplier and base unit status
 * @param {Array} optionValues - Array of option_value objects
 * @returns {Object} - { is_base_unit, pack_unit_multiplier }
 */
const analyzePackOptions = (optionValues) => {
  if (!optionValues || !Array.isArray(optionValues)) {
    return { is_base_unit: true, pack_unit_multiplier: 1 };
  }

  // Look for 'pack' option type
  const packOption = optionValues.find(option => 
    option.option_type === 'pack'
  );

  if (!packOption) {
    return { is_base_unit: true, pack_unit_multiplier: 1 };
  }

  // Convert pack value to number
  const packMultiplier = Number(packOption.option_value) || 1;
  const isBaseUnit = packMultiplier === 1;

  return {
    is_base_unit: isBaseUnit,
    pack_unit_multiplier: packMultiplier
  };
};

/**
 * Find the base unit variant for a pack variant
 * @param {Object} packVariant - The pack ProductVariant document
 * @returns {String} - ObjectId of the base unit variant
 */
const findBaseUnitVariant = async (packVariant) => {
  try {
    // Create filter for base unit: same product_id, same options except 'pack' option
    const baseUnitFilter = {
      product_id: packVariant.product_id,
      _id: { $ne: packVariant._id } // Exclude the pack variant itself
    };

    // Get all variants for this product
    const candidateVariants = await ProductVariant.find(baseUnitFilter).lean();

    // Find variant with matching option_values (excluding pack option) and pack_multiplier = 1
    for (const candidate of candidateVariants) {
      if (isMatchingBaseUnit(packVariant.option_values, candidate.option_values)) {
        const { is_base_unit } = analyzePackOptions(candidate.option_values);
        if (is_base_unit) {
          return candidate._id.toString();
        }
      }
    }

    throw new Error('Base unit variant not found for pack variant');

  } catch (error) {
    console.error('Error finding base unit variant:', error);
    throw error;
  }
};

/**
 * Check if two option_values arrays match (excluding pack option)
 * @param {Array} packOptions - Pack variant option_values
 * @param {Array} candidateOptions - Candidate base unit option_values
 * @returns {Boolean} - True if they match
 */
const isMatchingBaseUnit = (packOptions, candidateOptions) => {
  // Filter out pack options from both arrays
  const packFiltered = packOptions.filter(opt => opt.option_type !== 'pack');
  const candidateFiltered = candidateOptions.filter(opt => opt.option_type !== 'pack');

  // Must have same number of non-pack options
  if (packFiltered.length !== candidateFiltered.length) {
    return false;
  }

  // Check if all non-pack options match
  return packFiltered.every(packOpt => {
    return candidateFiltered.some(candOpt => 
      candOpt.option_type === packOpt.option_type && 
      candOpt.option_value === packOpt.option_value
    );
  });
};

/**
 * Calculate computed stock for any variant (base unit or pack)
 * @param {String} productVariantId - MongoDB ObjectId of the ProductVariant
 * @returns {Object} - { computed_stock_quantity, inventory_record, pack_details }
 */
const calculateComputedStock = async (productVariantId) => {
  try {
    const packDetails = await getVariantPackDetails(productVariantId);
    
    // Find inventory record for the base unit
    const inventoryRecord = await Inventory.findOne({ 
      product_variant_id: packDetails.base_unit_variant_id,
      is_active: true 
    }).populate('product_variant_id', 'sku_code product_id option_values');

    if (!inventoryRecord) {
      return {
        computed_stock_quantity: 0,
        inventory_record: null,
        pack_details
      };
    }

    // Calculate computed stock based on pack multiplier
    const computedStock = packDetails.is_base_unit 
      ? inventoryRecord.stock_quantity
      : Math.floor(inventoryRecord.stock_quantity / packDetails.pack_unit_multiplier);

    return {
      computed_stock_quantity: computedStock,
      inventory_record,
      pack_details
    };

  } catch (error) {
    console.error('Error calculating computed stock:', error);
    throw error;
  }
};

/**
 * Create a new inventory record
 * POST /api/v1/inventory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createInventory = async (req, res) => {
  try {
    const {
      product_variant_id,
      stock_quantity,
      min_stock_level,
      location,
      notes
    } = req.body;

    // Check if inventory record already exists
    const existingInventory = await Inventory.findOne({
      product_variant_id,
      is_active: true
    });

    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory record already exists for this product variant',
        error: 'Duplicate inventory record'
      });
    }

    // Validate that the variant is a base unit
    const packDetails = await getVariantPackDetails(product_variant_id);
    if (!packDetails.is_base_unit) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create inventory record for a pack variant. Only base units track physical stock.',
        error: 'Invalid variant type for inventory'
      });
    }

    // Create new inventory record
    const inventoryData = {
      product_variant_id,
      stock_quantity: stock_quantity || 0,
      min_stock_level: min_stock_level || 0
    };

    if (location) inventoryData.location = location;
    if (notes) inventoryData.notes = notes;

    const inventory = new Inventory(inventoryData);
    await inventory.save();

    // Populate for response
    await inventory.populate('product_variant_id', 'sku_code product_id option_values price');

    // Log admin action
    adminAuditLogger.logResourceCreation(
      req.user?.id,
      'Inventory',
      inventory._id,
      {
        product_variant_id,
        stock_quantity: inventory.stock_quantity,
        min_stock_level: inventory.min_stock_level
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: inventory
    });

  } catch (error) {
    console.error('Error creating inventory:', error);

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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Inventory record already exists for this product variant',
        error: 'Duplicate inventory record'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create inventory record'
    });
  }
};

/**
 * Get all inventory records with computed stock for packs
 * GET /api/v1/inventory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      is_active,
      stock_status,
      location,
      product_id,
      search,
      sort_by = 'createdAt',
      sort_order = 'desc',
      include_computed_packs = 'false'
    } = req.query;

    // Build filter query
    const filter = {};

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }

    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    // Stock status filtering
    if (stock_status) {
      switch (stock_status) {
        case 'out_of_stock':
          filter.stock_quantity = { $lte: 0 };
          break;
        case 'low_stock':
          filter.$expr = {
            $and: [
              { $gt: ['$min_stock_level', 0] },
              { $lte: ['$stock_quantity', '$min_stock_level'] }
            ]
          };
          break;
        case 'in_stock':
          filter.stock_quantity = { $gt: 0 };
          break;
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Base query with population
    let query = Inventory.find(filter)
      .populate('product_variant_id', 'sku_code product_id option_values price')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Apply additional filters if product_id or search is provided
    if (product_id || search) {
      const populatedResults = await Inventory.find(filter)
        .populate('product_variant_id', 'sku_code product_id option_values price')
        .lean();

      let filteredResults = populatedResults;

      if (product_id) {
        filteredResults = filteredResults.filter(inv => 
          inv.product_variant_id && inv.product_variant_id.product_id.toString() === product_id
        );
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filteredResults = filteredResults.filter(inv => 
          (inv.product_variant_id && searchRegex.test(inv.product_variant_id.sku_code)) ||
          searchRegex.test(inv.location) ||
          searchRegex.test(inv.notes)
        );
      }

      // Apply sorting to filtered results
      filteredResults.sort((a, b) => {
        const aVal = a[sort_by];
        const bVal = b[sort_by];
        const direction = sort_order === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });

      // Apply pagination to filtered results
      const paginatedResults = filteredResults.slice(skip, skip + limitNum);
      const total = filteredResults.length;

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return res.status(200).json({
        success: true,
        message: 'Inventory records retrieved successfully',
        data: paginatedResults,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limitNum,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      });
    }

    // Execute standard query
    const [inventoryRecords, total] = await Promise.all([
      query.lean(),
      Inventory.countDocuments(filter)
    ]);

    // If including computed packs, find and calculate pack variants
    let allResults = inventoryRecords;
    
    if (include_computed_packs === 'true') {
      // For each base unit inventory, find related pack variants
      const packVariants = [];
      
      for (const inventory of inventoryRecords) {
        if (inventory.product_variant_id) {
          // Find pack variants for this product
          const relatedVariants = await ProductVariant.find({
            product_id: inventory.product_variant_id.product_id,
            _id: { $ne: inventory.product_variant_id._id }
          }).lean();

          // Check which ones are packs of this base unit
          for (const variant of relatedVariants) {
            try {
              const packDetails = await getVariantPackDetails(variant._id.toString());
              if (!packDetails.is_base_unit && 
                  packDetails.base_unit_variant_id === inventory.product_variant_id._id.toString()) {
                
                const computedStock = Math.floor(inventory.stock_quantity / packDetails.pack_unit_multiplier);
                
                packVariants.push({
                  _id: `computed_${variant._id}`,
                  product_variant_id: variant,
                  computed_stock_quantity: computedStock,
                  pack_unit_multiplier: packDetails.pack_unit_multiplier,
                  base_inventory_id: inventory._id,
                  is_computed: true,
                  stock_status: computedStock <= 0 ? 'Out of Stock' : 
                               computedStock <= 5 ? 'Low Stock' : 'In Stock'
                });
              }
            } catch (error) {
              console.error('Error calculating pack stock for variant:', variant._id, error);
            }
          }
        }
      }
      
      allResults = [...inventoryRecords, ...packVariants];
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: 'Inventory records retrieved successfully',
      data: allResults,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error retrieving inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve inventory records'
    });
  }
};

/**
 * Get inventory by product variant ID (computed stock)
 * GET /api/v1/inventory/variant/:productVariantId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInventoryByProductVariantId = async (req, res) => {
  try {
    const { productVariantId } = req.params;

    // Calculate computed stock for this variant
    const stockInfo = await calculateComputedStock(productVariantId);

    if (!stockInfo.inventory_record) {
      return res.status(404).json({
        success: false,
        message: 'No inventory record found for this product variant',
        error: 'Inventory not found'
      });
    }

    // Populate variant details for the requested variant
    const requestedVariant = await ProductVariant.findById(productVariantId)
      .select('sku_code product_id option_values price');

    const response = {
      ...stockInfo.inventory_record.toObject(),
      computed_stock_quantity: stockInfo.computed_stock_quantity,
      pack_details: stockInfo.pack_details,
      requested_variant: requestedVariant
    };

    res.status(200).json({
      success: true,
      message: 'Inventory record retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Error retrieving inventory by variant:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve inventory record'
    });
  }
};

/**
 * Get inventory record by ID
 * GET /api/v1/inventory/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find inventory record by ID and populate related data
    const inventory = await Inventory.findById(id)
      .populate({
        path: 'product_variant_id',
        select: 'sku_code product_id option_values price',
        populate: {
          path: 'product_id',
          select: 'name category_id',
          populate: {
            path: 'category_id',
            select: 'name'
          }
        }
      });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
        error: 'No inventory record found with the provided ID'
      });
    }

    // Calculate pack details for the variant
    const packDetails = await getVariantPackDetails(inventory.product_variant_id._id.toString());
    
    // For a base unit, computed stock is the same as physical stock
    // For pack variants, it would be calculated based on base unit stock
    const computedStock = packDetails.is_base_unit 
      ? inventory.stock_quantity 
      : 0; // This would be calculated differently for pack variants

    // Enhanced response with all related information
    const response = {
      ...inventory.toObject(),
      pack_details: packDetails,
      computed_stock_quantity: computedStock,
    };

    // Log admin access for audit trail
    adminAuditLogger.info('inventory_accessed', {
      admin_id: req.user.id,
      inventory_id: id,
      product_variant_id: inventory.product_variant_id._id.toString(),
      sku_code: inventory.product_variant_id.sku_code
    });

    res.status(200).json({
      success: true,
      message: 'Inventory record retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Error retrieving inventory by ID:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve inventory record'
    });
  }
};

/**
 * Update inventory record
 * PATCH /api/v1/inventory/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;
    delete updates.product_variant_id; // Don't allow changing variant reference

    // Find existing inventory record
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
        error: 'No inventory record found with the provided ID'
      });
    }

    // Validate that this is still a base unit (defensive check)
    const packDetails = await getVariantPackDetails(existingInventory.product_variant_id.toString());
    if (!packDetails.is_base_unit) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update inventory for pack variant. Only base units track physical stock.',
        error: 'Invalid variant type for inventory update'
      });
    }

    // Track if stock was updated for audit logging
    const stockUpdated = updates.stock_quantity !== undefined;
    const oldStock = existingInventory.stock_quantity;

    // Update inventory record
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('product_variant_id', 'sku_code product_id option_values price');

    // Log admin action
    adminAuditLogger.logResourceUpdate(
      req.user?.id,
      'Inventory',
      inventory._id,
      {
        updated_fields: Object.keys(updates),
        changes: updates,
        stock_change: stockUpdated ? (inventory.stock_quantity - oldStock) : null
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(200).json({
      success: true,
      message: 'Inventory record updated successfully',
      data: inventory
    });

  } catch (error) {
    console.error('Error updating inventory:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update inventory record'
    });
  }
};

/**
 * Delete inventory record (soft delete)
 * DELETE /api/v1/inventory/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
        error: 'No inventory record found with the provided ID'
      });
    }

    // Soft delete by setting is_active to false
    await inventory.softDelete();

    // Log admin action
    adminAuditLogger.logResourceDeletion(
      req.user?.id,
      'Inventory',
      inventory._id,
      {
        product_variant_id: inventory.product_variant_id,
        final_stock_quantity: inventory.stock_quantity,
        soft_delete: true
      },
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      req.correlationId
    );

    res.status(204).json({
      success: true,
      message: 'Inventory record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting inventory:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID',
        error: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to delete inventory record'
    });
  }
};

module.exports = {
  createInventory,
  getAllInventory,
  getInventoryByProductVariantId,
  getInventoryById,
  updateInventory,
  deleteInventory,
  // Export helper functions for use in other controllers
  getVariantPackDetails,
  calculateComputedStock,
  analyzePackOptions,
  findBaseUnitVariant
};
