/**
 * ProductVariant Controller Unit Tests
 * Comprehensive test suite for productVariant.controller.js
 */

const productVariantController = require('../../controllers/productVariant.controller');
const ProductVariant = require('../../models/ProductVariant');
const Product = require('../../models/Product');
const Option = require('../../models/Option');
const userActivityLogger = require('../../loggers/userActivity.logger');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

// Mock the models, loggers, and validation
jest.mock('../../models/ProductVariant');
jest.mock('../../models/Product');
jest.mock('../../models/Option');
jest.mock('../../loggers/userActivity.logger');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');

describe('ProductVariant Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = global.mockReq();
    mockRes = global.mockRes();
    mockNext = global.mockNext();

    // Mock logger methods
    userActivityLogger.info = jest.fn();
    adminAuditLogger.info = jest.fn();
    adminAuditLogger.warn = jest.fn();

    // Mock validationResult to return no errors by default
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('createProductVariant', () => {
    const validVariantData = {
      product_id: 'prod123',
      option_values: ['opt1', 'opt2'],
      sku_code: 'IPHONE-RED-128GB',
      price: 999.99,
      discount_details: {
        price: 899.99,
        percentage: 10,
        is_on_sale: true,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      dimensions: {
        length: 14.7,
        width: 7.15,
        height: 0.78,
        unit: 'cm'
      },
      weight: {
        value: 206,
        unit: 'g'
      },
      packaging_cost: 5.00,
      shipping_cost: 10.00,
      images: ['https://example.com/iphone-red.jpg'],
      sort_order: 1
    };

    beforeEach(() => {
      Product.findById = jest.fn().mockResolvedValue({ _id: 'prod123', name: 'iPhone 15' });
      Option.find = jest.fn().mockResolvedValue([
        { _id: 'opt1', option_type: 'Color', option_value: 'Red' },
        { _id: 'opt2', option_type: 'Storage', option_value: '128GB' }
      ]);
    });

    it('should create a new product variant successfully', async () => {
      mockReq.body = validVariantData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockVariant = {
        _id: 'var123',
        ...validVariantData,
        slug: 'iphone-15-red-128gb',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockReturnThis()
      };

      mockVariant.populate.mockResolvedValue({
        ...mockVariant,
        product_id: { _id: 'prod123', name: 'iPhone 15', slug: 'iphone-15' },
        option_values: [
          { _id: 'opt1', option_type: 'Color', option_value: 'Red', name: 'Red', slug: 'color-red' },
          { _id: 'opt2', option_type: 'Storage', option_value: '128GB', name: '128GB', slug: 'storage-128gb' }
        ]
      });

      ProductVariant.mockImplementation(() => mockVariant);

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('prod123');
      expect(Option.find).toHaveBeenCalledWith({ _id: { $in: ['opt1', 'opt2'] } });
      expect(ProductVariant).toHaveBeenCalledWith({
        product_id: validVariantData.product_id,
        option_values: validVariantData.option_values,
        sku_code: validVariantData.sku_code,
        price: validVariantData.price,
        discount_details: validVariantData.discount_details,
        slug: undefined,
        dimensions: validVariantData.dimensions,
        weight: validVariantData.weight,
        packaging_cost: validVariantData.packaging_cost,
        shipping_cost: validVariantData.shipping_cost,
        images: validVariantData.images,
        is_active: true,
        sort_order: validVariantData.sort_order
      });
      expect(mockVariant.save).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product variant created', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product variant created successfully',
        data: expect.any(Object)
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = validVariantData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'SKU code is required' },
          { msg: 'Price is required' }
        ])
      });

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [
          { msg: 'SKU code is required' },
          { msg: 'Price is required' }
        ]
      });
    });

    it('should return error for invalid product ID', async () => {
      mockReq.body = validVariantData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      Product.findById.mockResolvedValue(null);

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid product ID'
      });
    });

    it('should return error for invalid option values', async () => {
      mockReq.body = validVariantData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      Option.find.mockResolvedValue([{ _id: 'opt1' }]); // Only one option found instead of two

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'One or more invalid option values'
      });
    });

    it('should handle duplicate SKU error', async () => {
      mockReq.body = validVariantData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { sku_code: 'IPHONE-RED-128GB' };

      const mockVariant = {
        save: jest.fn().mockRejectedValue(duplicateError)
      };

      ProductVariant.mockImplementation(() => mockVariant);

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Product variant with SKU 'IPHONE-RED-128GB' already exists"
      });
    });

    it('should handle validation model errors', async () => {
      mockReq.body = validVariantData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        sku_code: { message: 'SKU code is required' },
        price: { message: 'Price must be positive' }
      };

      const mockVariant = {
        save: jest.fn().mockRejectedValue(validationError)
      };

      ProductVariant.mockImplementation(() => mockVariant);

      await productVariantController.createProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['SKU code is required', 'Price must be positive']
      });
    });
  });

  describe('getAllProductVariants', () => {
    const mockVariants = [
      {
        _id: 'var1',
        sku_code: 'IPHONE-RED-128GB',
        price: 999.99,
        is_active: true,
        product_id: { _id: 'prod1', name: 'iPhone 15', slug: 'iphone-15' },
        option_values: [
          { _id: 'opt1', option_type: 'Color', option_value: 'Red', name: 'Red', slug: 'color-red' }
        ]
      },
      {
        _id: 'var2',
        sku_code: 'IPHONE-BLUE-256GB',
        price: 1199.99,
        is_active: true,
        product_id: { _id: 'prod1', name: 'iPhone 15', slug: 'iphone-15' },
        option_values: [
          { _id: 'opt2', option_type: 'Color', option_value: 'Blue', name: 'Blue', slug: 'color-blue' }
        ]
      }
    ];

    beforeEach(() => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockVariants)
      };

      ProductVariant.find = jest.fn().mockReturnValue(mockQuery);
      ProductVariant.countDocuments = jest.fn().mockResolvedValue(20);
    });

    it('should get all product variants with default pagination', async () => {
      mockReq.query = {};

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({ is_active: true });
      expect(userActivityLogger.info).toHaveBeenCalledWith('Product variants list viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockVariants,
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalItems: 20,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    it('should apply pagination correctly', async () => {
      mockReq.query = { page: '2', limit: '5' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockVariants)
      };

      ProductVariant.find.mockReturnValue(mockQuery);

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should apply product filter', async () => {
      mockReq.query = { product_id: 'prod123' };

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({
        is_active: true,
        product_id: 'prod123'
      });
    });

    it('should apply sale status filter', async () => {
      mockReq.query = { is_on_sale: 'true' };

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({
        is_active: true,
        'discount_details.is_on_sale': true
      });
    });

    it('should apply price range filter', async () => {
      mockReq.query = { min_price: '100', max_price: '500' };

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({
        is_active: true,
        price: { $gte: 100, $lte: 500 }
      });
    });

    it('should apply search filter', async () => {
      mockReq.query = { search: 'IPHONE' };

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({
        is_active: true,
        sku_code: { $regex: 'IPHONE', $options: 'i' }
      });
    });

    it('should allow admin to see inactive variants', async () => {
      mockReq.query = { include_inactive: 'true', is_active: 'false' };
      mockReq.user = { role: 'admin' };

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(ProductVariant.find).toHaveBeenCalledWith({ is_active: false });
    });

    it('should apply sorting by price', async () => {
      mockReq.query = { sort: 'price', order: 'desc' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockVariants)
      };

      ProductVariant.find.mockReturnValue(mockQuery);

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(mockQuery.sort).toHaveBeenCalledWith({ price: -1 });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      ProductVariant.find.mockImplementation(() => {
        throw error;
      });

      await productVariantController.getAllProductVariants(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductVariantByIdOrSKU', () => {
    const mockVariant = {
      _id: 'var123',
      sku_code: 'IPHONE-RED-128GB',
      price: 999.99,
      is_active: true,
      product_id: { _id: 'prod1', name: 'iPhone 15', slug: 'iphone-15' },
      option_values: [
        { _id: 'opt1', option_type: 'Color', option_value: 'Red', name: 'Red', slug: 'color-red' }
      ]
    };

    beforeEach(() => {
      const mockQuery = {
        populate: jest.fn().mockImplementation((field, select) => {
          if (field === 'product_id') {
            return {
              populate: jest.fn().mockResolvedValue(mockVariant)
            };
          }
          return mockQuery;
        })
      };
      ProductVariant.findOne = jest.fn().mockReturnValue(mockQuery);
      
      // Reset logger mocks
      userActivityLogger.info = jest.fn();
    });

    it('should get variant by valid ObjectId', async () => {
      mockReq.params = { identifier: '507f1f77bcf86cd799439011' };

      await productVariantController.getProductVariantByIdOrSKU(mockReq, mockRes, mockNext);

      expect(ProductVariant.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        is_active: true
      });
      expect(userActivityLogger.info).toHaveBeenCalledWith('Product variant viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockVariant
      });
    });

    it('should get variant by SKU', async () => {
      mockReq.params = { identifier: 'IPHONE-RED-128GB' };
      
      const mockVariant = {
        _id: 'var123',
        sku_code: 'IPHONE-RED-128GB',
        product_id: 'prod123',
        is_active: true
      };
      
      ProductVariant.findBySKU = jest.fn().mockResolvedValue(mockVariant);

      await productVariantController.getProductVariantByIdOrSKU(mockReq, mockRes, mockNext);

      expect(ProductVariant.findBySKU).toHaveBeenCalledWith(
        'IPHONE-RED-128GB',
        false
      );
    });

    it('should allow admin to see inactive variants', async () => {
      mockReq.params = { identifier: 'IPHONE-RED-128GB' };
      mockReq.user = { role: 'admin' };
      
      const mockVariant = {
        _id: 'var123',
        sku_code: 'IPHONE-RED-128GB',
        product_id: 'prod123',
        is_active: false
      };
      
      ProductVariant.findBySKU = jest.fn().mockResolvedValue(mockVariant);

      await productVariantController.getProductVariantByIdOrSKU(mockReq, mockRes, mockNext);

      expect(ProductVariant.findBySKU).toHaveBeenCalledWith(
        'IPHONE-RED-128GB',
        true
      );
    });

    it('should return 404 if variant not found', async () => {
      // Use a valid ObjectId format that doesn't exist
      mockReq.params = { identifier: '507f1f77bcf86cd799439011' };
      
      const mockQuery = {
        populate: jest.fn().mockImplementation(() => {
          return {
            populate: jest.fn().mockResolvedValue(null)
          };
        })
      };
      ProductVariant.findOne.mockReturnValue(mockQuery);

      await productVariantController.getProductVariantByIdOrSKU(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product variant not found'
      });
    });

    it('should handle errors', async () => {
      // Use a valid ObjectId format 
      mockReq.params = { identifier: '507f1f77bcf86cd799439011' };
      const error = new Error('Database error');
      
      const mockQuery = {
        populate: jest.fn().mockImplementation(() => {
          return {
            populate: jest.fn().mockRejectedValue(error)
          };
        })
      };
      ProductVariant.findOne.mockReturnValue(mockQuery);

      await productVariantController.getProductVariantByIdOrSKU(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProductVariant', () => {
    const updateData = {
      price: 1099.99,
      discount_details: {
        price: 999.99,
        percentage: 9,
        is_on_sale: true
      }
    };

    // Create a fresh mock variant for each test to avoid interference
    let mockVariant;

    beforeEach(() => {
      // Create a completely fresh mock for each test
      mockVariant = {
        _id: 'var123',
        product_id: { 
          toString: () => 'prod123',
          _id: 'prod123'
        },
        option_values: ['opt1', 'opt2'],
        sku_code: 'IPHONE-RED-128GB',
        price: 999.99,
        discount_details: { 
          is_on_sale: false,
          toObject: jest.fn().mockReturnValue({ is_on_sale: false })
        },
        dimensions: { 
          length: 14.7,
          toObject: jest.fn().mockReturnValue({ length: 14.7, width: 7.15, height: 0.78, unit: 'cm' })
        },
        weight: { 
          value: 206,
          toObject: jest.fn().mockReturnValue({ value: 206, unit: 'g' })
        },
        packaging_cost: 5.00,
        shipping_cost: 10.00,
        is_active: true,
        sort_order: 1,
        save: jest.fn().mockImplementation(function() {
          // Return a new object with all the toObject methods
          return Promise.resolve({
            ...this,
            discount_details: {
              ...this.discount_details,
              toObject: jest.fn(() => ({
                discount_type: 'percentage',
                discount_value: 15,
                start_date: '2024-01-01',
                end_date: '2024-12-31'
              }))
            },
            dimensions: {
              ...this.dimensions,
              toObject: jest.fn(() => ({
                length: 15,
                width: 7,
                height: 0.8,
                unit: 'cm'
              }))
            },
            weight: {
              ...this.weight,
              toObject: jest.fn(() => ({
                value: 200,
                unit: 'g'
              }))
            }
          });
        }),
        populate: jest.fn().mockResolvedValue({
          _id: 'var123',
          product_id: { _id: 'prod123', name: 'iPhone 15', slug: 'iphone-15' },
          option_values: [
            { _id: 'opt1', option_type: 'Color', option_value: 'Red', name: 'Red', slug: 'color-red' }
          ]
        })
      };

      // Reset all mocks
      jest.clearAllMocks();
      
      // Set up default mocks
      ProductVariant.findById = jest.fn().mockResolvedValue(mockVariant);
      adminAuditLogger.info = jest.fn();
      Product.findById = jest.fn().mockResolvedValue({ _id: 'prod123' });
      Option.find = jest.fn().mockResolvedValue([{ _id: 'opt1' }, { _id: 'opt2' }]);
    });

    it('should update product variant successfully', async () => {
      mockReq.params = { id: 'var123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(ProductVariant.findById).toHaveBeenCalledWith('var123');
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockVariant.save).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product variant updated', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product variant updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 if variant not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = updateData;
      ProductVariant.findById.mockResolvedValue(null);

      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product variant not found'
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'var123' };
      mockReq.body = updateData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Invalid data' }])
      });

      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ msg: 'Invalid data' }]
      });
    });

    it('should validate product_id if being updated', async () => {
      const updateWithProduct = { ...updateData, product_id: 'new-prod' };
      mockReq.params = { id: 'var123' };
      mockReq.body = updateWithProduct;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      // Create a test variant with different product_id to trigger validation
      const testVariant = {
        ...mockVariant,
        product_id: { toString: () => 'different-prod' }, // Different from 'new-prod'
        save: jest.fn().mockResolvedValue({})
      };
      ProductVariant.findById.mockResolvedValue(testVariant);
      
      // Mock Product.findById to return null (product not found)
      Product.findById.mockResolvedValue(null);
      
      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('new-prod');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid product ID'
      });
    });

    it('should validate option_values if being updated', async () => {
      const updateWithOptions = { ...updateData, option_values: ['opt1', 'opt2'] };
      mockReq.params = { id: 'var123' };
      mockReq.body = updateWithOptions;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      // Create a test variant with different option_values to trigger validation
      const testVariant = {
        ...mockVariant,
        option_values: ['different-opt'], // Different from ['opt1', 'opt2']
        product_id: { toString: () => 'prod123' }, // Same product_id to skip product validation
        save: jest.fn().mockResolvedValue({})
      };
      ProductVariant.findById.mockResolvedValue(testVariant);
      
      // Mock Product.findById to return a valid product (skip product validation)
      Product.findById.mockResolvedValue({ _id: 'prod123' });
      // Mock Option.find to return only one option (should be 2)
      Option.find.mockResolvedValue([{ _id: 'opt1' }]);

      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(Option.find).toHaveBeenCalledWith({ _id: { $in: ['opt1', 'opt2'] } });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'One or more invalid option values'
      });
    });

    it('should handle duplicate SKU errors', async () => {
      mockReq.params = { id: 'var123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      // Create a test variant that will throw a duplicate error when saved
      const testVariant = {
        ...mockVariant,
        product_id: { toString: () => 'prod123' }, // Same product_id
        option_values: ['opt1'], // Same option_values to avoid validation
        save: jest.fn().mockImplementation(() => {
          const duplicateError = new Error('Duplicate key');
          duplicateError.code = 11000;
          duplicateError.keyValue = { sku_code: 'IPHONE-RED-128GB' };
          return Promise.reject(duplicateError);
        })
      };
      ProductVariant.findById.mockResolvedValue(testVariant);

      await productVariantController.updateProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Product variant with SKU 'IPHONE-RED-128GB' already exists"
      });
    });
  });

  describe('deleteProductVariant', () => {
    const mockVariant = {
      _id: 'var123',
      sku_code: 'IPHONE-RED-128GB',
      softDelete: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      ProductVariant.findById = jest.fn().mockResolvedValue(mockVariant);
    });

    it('should soft delete variant successfully', async () => {
      mockReq.params = { id: 'var123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await productVariantController.deleteProductVariant(mockReq, mockRes, mockNext);

      expect(ProductVariant.findById).toHaveBeenCalledWith('var123');
      expect(mockVariant.softDelete).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product variant deleted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product variant deleted successfully'
      });
    });

    it('should return 404 if variant not found', async () => {
      mockReq.params = { id: 'non-existent' };
      ProductVariant.findById.mockResolvedValue(null);

      await productVariantController.deleteProductVariant(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product variant not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'var123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const error = new Error('Database error');
      mockVariant.softDelete.mockRejectedValue(error);

      await productVariantController.deleteProductVariant(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductVariantStats', () => {
    beforeEach(() => {
      ProductVariant.countDocuments = jest.fn();
      ProductVariant.aggregate = jest.fn();
    });

    it('should return product variant statistics', async () => {
      ProductVariant.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85)  // active
        .mockResolvedValueOnce(15)  // inactive
        .mockResolvedValueOnce(25); // on sale

      ProductVariant.aggregate
        .mockResolvedValueOnce([{
          avgPrice: 599.99,
          minPrice: 99.99,
          maxPrice: 1999.99
        }])
        .mockResolvedValueOnce([
          {
            product_id: 'prod1',
            product_name: 'iPhone 15',
            variant_count: 8
          },
          {
            product_id: 'prod2',
            product_name: 'MacBook Pro',
            variant_count: 6
          }
        ]);

      await productVariantController.getProductVariantStats(mockReq, mockRes, mockNext);

      expect(ProductVariant.countDocuments).toHaveBeenCalledTimes(4);
      expect(ProductVariant.aggregate).toHaveBeenCalledTimes(2);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalVariants: 100,
          activeVariants: 85,
          inactiveVariants: 15,
          onSaleVariants: 25,
          priceStatistics: {
            avgPrice: 599.99,
            minPrice: 99.99,
            maxPrice: 1999.99
          },
          topProductsByVariants: [
            {
              product_id: 'prod1',
              product_name: 'iPhone 15',
              variant_count: 8
            },
            {
              product_id: 'prod2',
              product_name: 'MacBook Pro',
              variant_count: 6
            }
          ]
        }
      });
    });

    it('should handle empty price statistics', async () => {
      ProductVariant.countDocuments
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0) // inactive
        .mockResolvedValueOnce(0); // on sale

      ProductVariant.aggregate
        .mockResolvedValueOnce([]) // empty price stats
        .mockResolvedValueOnce([]); // empty top products

      await productVariantController.getProductVariantStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalVariants: 0,
          activeVariants: 0,
          inactiveVariants: 0,
          onSaleVariants: 0,
          priceStatistics: { avgPrice: 0, minPrice: 0, maxPrice: 0 },
          topProductsByVariants: []
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      ProductVariant.countDocuments.mockRejectedValue(error);

      await productVariantController.getProductVariantStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
