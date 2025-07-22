/**
 * Product Controller Unit Tests
 * Comprehensive test suite for product.controller.js
 */

const productController = require('../../controllers/product.controller');
const Product = require('../../models/Product');
const userActivityLogger = require('../../loggers/userActivity.logger');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Mock the Product model, loggers, and validation
jest.mock('../../models/Product', () => jest.fn());
jest.mock('../../loggers/userActivity.logger');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');
jest.mock('mongoose');

describe('Product Controller', () => {
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

    // Mock mongoose ObjectId
    mongoose.Types = {
      ObjectId: jest.fn().mockImplementation((id) => id)
    };
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

    // Setup Product model mock methods
    Product.find = jest.fn();
    Product.findOne = jest.fn();
    Product.findById = jest.fn();
    Product.aggregate = jest.fn();
    Product.countDocuments = jest.fn();
    Product.mockClear();
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with Pro features',
      short_description: 'Apple iPhone 15 Pro',
      category_id: 'cat123',
      brand_id: 'brand123',
      images: ['https://example.com/iphone.jpg'],
      score: 4.5,
      seo_details: {
        title: 'iPhone 15 Pro',
        description: 'Buy iPhone 15 Pro online',
        keywords: ['iphone', 'apple', 'smartphone']
      }
    };

    it('should create a new product successfully', async () => {
      mockReq.body = validProductData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const populatedProduct = {
        _id: 'prod123',
        ...validProductData,
        slug: 'iphone-15-pro',
        is_active: true,
        category_id: { _id: 'cat123', name: 'Electronics' },
        brand_id: { _id: 'brand123', name: 'Apple' }
      };

      const savedProduct = {
        _id: 'prod123',
        ...validProductData,
        slug: 'iphone-15-pro',
        is_active: true,
        populate: jest.fn().mockImplementation(() => {
          // Modify savedProduct to have populated fields
          Object.assign(savedProduct, populatedProduct);
          return Promise.resolve(savedProduct);
        })
      };

      const mockProduct = {
        _id: 'prod123',
        ...validProductData,
        slug: 'iphone-15-pro',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(savedProduct),
        populate: jest.fn().mockResolvedValue(savedProduct)
      };

      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(mockReq, mockRes, mockNext);

      expect(Product).toHaveBeenCalledWith({
        name: validProductData.name,
        description: validProductData.description,
        short_description: validProductData.short_description,
        category_id: validProductData.category_id,
        images: validProductData.images,
        brand_id: validProductData.brand_id,
        score: validProductData.score,
        seo_details: validProductData.seo_details
      });
      expect(mockProduct.save).toHaveBeenCalled();
      expect(savedProduct.populate).toHaveBeenCalledWith('category_id');
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product created', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: savedProduct
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = validProductData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'Name is required' },
          { msg: 'Description is required' }
        ])
      });

      await productController.createProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [
          { msg: 'Name is required' },
          { msg: 'Description is required' }
        ]
      });
    });

    it('should handle duplicate name error', async () => {
      mockReq.body = validProductData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { name: 'iPhone 15 Pro' };

      const mockProduct = {
        save: jest.fn().mockRejectedValue(duplicateError)
      };

      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product with this name already exists',
        field: 'name'
      });
    });

    it('should handle validation model errors', async () => {
      mockReq.body = validProductData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        name: { message: 'Name is required' },
        price: { message: 'Price must be positive' }
      };

      const mockProduct = {
        save: jest.fn().mockRejectedValue(validationError)
      };

      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Name is required', 'Price must be positive']
      });
    });

    it('should call next with unexpected errors', async () => {
      mockReq.body = validProductData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const unexpectedError = new Error('Database connection failed');
      const mockProduct = {
        save: jest.fn().mockRejectedValue(unexpectedError)
      };

      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('getAllProducts', () => {
    const mockProducts = [
      {
        _id: 'prod1',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone',
        is_active: true,
        category_id: { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
        brand_id: { _id: 'brand1', name: 'Apple', slug: 'apple' }
      },
      {
        _id: 'prod2',
        name: 'MacBook Pro',
        description: 'Professional laptop',
        is_active: true,
        category_id: { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
        brand_id: { _id: 'brand1', name: 'Apple', slug: 'apple' }
      }
    ];

    beforeEach(() => {
      // Mock aggregate method to return the expected facet structure
      const aggregateResult = [{
        paginatedResults: mockProducts,
        totalCount: [{ count: 25 }]
      }];
      
      Product.aggregate.mockResolvedValue(aggregateResult);
      Product.countDocuments.mockResolvedValue(25);
    });

    it('should get all products with default pagination', async () => {
      mockReq.query = {};

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(userActivityLogger.info).toHaveBeenCalledWith('Products list viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 25,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    it('should apply pagination correctly', async () => {
      mockReq.query = { page: '2', limit: '5' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.objectContaining({
          currentPage: 2,
          itemsPerPage: 5
        })
      });
    });

    it('should apply category filter', async () => {
      mockReq.query = { category_id: 'cat123' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.any(Object)
      });
    });

    it('should apply brand filter', async () => {
      mockReq.query = { brand_id: 'brand123' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.any(Object)
      });
    });

    it('should apply search filter', async () => {
      mockReq.query = { search: 'iPhone' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.any(Object)
      });
    });

    it('should allow admin to see inactive products', async () => {
      mockReq.query = { include_inactive: 'true', is_active: 'false' };
      mockReq.user = { role: 'admin' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.any(Object)
      });
    });

    it('should apply sorting', async () => {
      mockReq.query = { sort: 'name', order: 'desc' };

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        pagination: expect.any(Object)
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Product.aggregate.mockRejectedValue(error);

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductByIdOrSlug', () => {
    const mockProduct = {
      _id: 'prod123',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone',
      is_active: true,
      category_id: { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
      brand_id: { _id: 'brand1', name: 'Apple', slug: 'apple' }
    };

    beforeEach(() => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockProduct)
      };
      Product.findOne = jest.fn().mockReturnValue(mockQuery);
      
      // Reset logger mocks
      userActivityLogger.info = jest.fn();
    });

    it('should get product by valid ObjectId', async () => {
      mockReq.params = { identifier: '507f1f77bcf86cd799439011' };

      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Product.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        is_active: true
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(userActivityLogger.info).toHaveBeenCalledWith('Product viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProduct
      });
    });

    it('should get product by slug', async () => {
      mockReq.params = { identifier: 'iphone-15-pro' };

      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Product.findOne).toHaveBeenCalledWith({
        slug: 'iphone-15-pro',
        is_active: true
      });
    });

    it('should allow admin to see inactive products', async () => {
      mockReq.params = { identifier: 'iphone-15-pro' };
      mockReq.user = { role: 'admin' };

      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Product.findOne).toHaveBeenCalledWith({
        slug: 'iphone-15-pro'
      });
    });

    it('should return 404 if product not found', async () => {
      mockReq.params = { identifier: 'non-existent' };
      
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };
      Product.findOne.mockReturnValue(mockQuery);

      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { identifier: 'test' };
      const error = new Error('Database error');
      Product.findOne.mockImplementation(() => {
        throw error;
      });

      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct', () => {
    const updateData = {
      name: 'iPhone 15 Pro Updated',
      description: 'Updated description',
      price: 999.99
    };

    const mockProduct = {
      _id: 'prod123',
      name: 'iPhone 15 Pro',
      description: 'Original description',
      short_description: 'iPhone Pro',
      category_id: 'cat123',
      brand_id: 'brand123',
      score: 4.5,
      is_active: true,
      save: jest.fn().mockImplementation(function() {
        // Update the properties directly on this object
        this.name = 'iPhone 15 Pro Updated';
        this.description = 'Updated description';
        return Promise.resolve(this);
      })
    };

    beforeEach(() => {
      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      // Reset logger mocks
      adminAuditLogger.info = jest.fn();
    });

    it('should update product successfully', async () => {
      // Setup specific mocks for this test
      const testProduct = {
        _id: 'prod123',
        name: 'iPhone 15 Pro',
        description: 'Original description',
        short_description: 'iPhone Pro',
        category_id: 'cat123',
        brand_id: 'brand123',
        score: 4.5,
        is_active: true,
        save: jest.fn().mockResolvedValue({
          _id: 'prod123',
          name: 'iPhone 15 Pro Updated',
          description: 'Updated description',
          short_description: 'iPhone Pro',
          category_id: 'cat123',
          brand_id: 'brand123',
          score: 4.5,
          is_active: true
        })
      };
      
      Product.findById = jest.fn().mockResolvedValue(testProduct);
      adminAuditLogger.info = jest.fn();
      
      mockReq.params = { id: 'prod123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await productController.updateProduct(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('prod123');
      expect(testProduct.save).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product updated', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 if product not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = updateData;
      Product.findById.mockResolvedValue(null);

      await productController.updateProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'prod123' };
      mockReq.body = updateData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Invalid data' }])
      });

      await productController.updateProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ msg: 'Invalid data' }]
      });
    });

    it('should handle duplicate errors', async () => {
      mockReq.params = { id: 'prod123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { name: 'iPhone 15 Pro Updated' };

      mockProduct.save.mockRejectedValue(duplicateError);

      await productController.updateProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product with this name already exists',
        field: 'name'
      });
    });
  });

  describe('deleteProduct', () => {
    const mockProduct = {
      _id: 'prod123',
      name: 'iPhone 15 Pro',
      softDelete: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      Product.findById = jest.fn().mockResolvedValue(mockProduct);
    });

    it('should soft delete product successfully', async () => {
      mockReq.params = { id: 'prod123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await productController.deleteProduct(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('prod123');
      expect(mockProduct.softDelete).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Product deleted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully'
      });
    });

    it('should return 404 if product not found', async () => {
      mockReq.params = { id: 'non-existent' };
      Product.findById.mockResolvedValue(null);

      await productController.deleteProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'prod123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const error = new Error('Database error');
      mockProduct.softDelete.mockRejectedValue(error);

      await productController.deleteProduct(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      Product.countDocuments = jest.fn()
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // active
        .mockResolvedValueOnce(20); // inactive

      await productController.getProductStats(mockReq, mockRes, mockNext);

      expect(Product.countDocuments).toHaveBeenCalledTimes(3);
      expect(Product.countDocuments).toHaveBeenNthCalledWith(1);
      expect(Product.countDocuments).toHaveBeenNthCalledWith(2, { is_active: true });
      expect(Product.countDocuments).toHaveBeenNthCalledWith(3, { is_active: false });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalProducts: 100,
          activeProducts: 80,
          inactiveProducts: 20
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Product.countDocuments.mockRejectedValue(error);

      await productController.getProductStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
