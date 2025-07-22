/**
 * Real Product Controller Tests
 * Tests actual controller functions with proper mocking
 */

const productController = require('../../../controllers/product.controller');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const ProductVariant = require('../../../models/ProductVariant');

// Mock dependencies
jest.mock('../../../models/Product');
jest.mock('../../../models/Category');
jest.mock('../../../models/ProductVariant');

describe('Product Controller - Real Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('getAllProducts', () => {
    it('should get all products with pagination', async () => {
      // Arrange
      mockReq.query = {
        page: '1',
        limit: '10',
        category: 'electronics'
      };

      const mockProducts = [
        {
          _id: 'product1',
          name: 'Test Product 1',
          description: 'Test Description 1',
          category_id: 'category1',
          is_active: true
        },
        {
          _id: 'product2',
          name: 'Test Product 2',
          description: 'Test Description 2',
          category_id: 'category1',
          is_active: true
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(25);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          category_id: 'electronics'
        })
      );
      expect(mockQuery.populate).toHaveBeenCalledWith('category_id', 'name slug');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProducts,
          pagination: expect.objectContaining({
            current_page: 1,
            items_per_page: 10,
            total_items: 25,
            total_pages: 3
          })
        })
      );
    });

    it('should handle search query', async () => {
      // Arrange
      mockReq.query = {
        search: 'laptop',
        page: '1',
        limit: '10'
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          $or: [
            { name: { $regex: 'laptop', $options: 'i' } },
            { description: { $regex: 'laptop', $options: 'i' } }
          ]
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      // Arrange
      Product.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProductByIdOrSlug', () => {
    it('should get product by id successfully', async () => {
      // Arrange
      mockReq.params = { id: 'product123' };

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        category_id: {
          _id: 'category1',
          name: 'Electronics'
        },
        is_active: true
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct)
      };

      Product.findById.mockReturnValue(mockQuery);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockQuery.populate).toHaveBeenCalledWith('category_id', 'name slug description');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProduct
        })
      );
    });

    it('should return error if product not found', async () => {
      // Arrange
      mockReq.params = { id: 'nonexistent' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      };

      Product.findById.mockReturnValue(mockQuery);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product not found'
        })
      );
    });

    it('should return error for inactive product', async () => {
      // Arrange
      mockReq.params = { id: 'product123' };

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        is_active: false
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct)
      };

      Product.findById.mockReturnValue(mockQuery);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product not available'
        })
      );
    });
  });

  describe('getProductVariants', () => {
    it('should get product variants successfully', async () => {
      // Arrange
      mockReq.params = { id: 'product123' };

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        is_active: true
      };

      const mockVariants = [
        {
          _id: 'variant1',
          product_id: 'product123',
          sku_code: 'SKU001',
          price: 99.99,
          is_active: true
        },
        {
          _id: 'variant2',
          product_id: 'product123',
          sku_code: 'SKU002',
          price: 149.99,
          is_active: true
        }
      ];

      Product.findById.mockResolvedValue(mockProduct);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariants)
      };

      ProductVariant.find.mockReturnValue(mockQuery);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(ProductVariant.find).toHaveBeenCalledWith({
        product_id: 'product123',
        is_active: true
      });
      expect(mockQuery.populate).toHaveBeenCalledWith('option_values', 'option_type option_value');
      expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockVariants
        })
      );
    });

    it('should return error if product not found', async () => {
      // Arrange
      mockReq.params = { id: 'nonexistent' };
      Product.findById.mockResolvedValue(null);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      // Arrange
      mockReq.query = {
        q: 'laptop',
        category: 'electronics',
        minPrice: '500',
        maxPrice: '2000',
        page: '1',
        limit: '10'
      };

      const mockProducts = [
        {
          _id: 'product1',
          name: 'Gaming Laptop',
          description: 'High performance laptop',
          is_active: true
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(1);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          $or: [
            { name: { $regex: 'laptop', $options: 'i' } },
            { description: { $regex: 'laptop', $options: 'i' } }
          ],
          category_id: 'electronics'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return empty results for no matches', async () => {
      // Arrange
      mockReq.query = { q: 'nonexistent' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          pagination: expect.objectContaining({
            total_items: 0
          })
        })
      );
    });
  });

  describe('getProductsByCategory', () => {
    it('should get products by category successfully', async () => {
      // Arrange
      mockReq.params = { categoryId: 'category123' };
      mockReq.query = { page: '1', limit: '10' };

      const mockCategory = {
        _id: 'category123',
        name: 'Electronics',
        is_active: true
      };

      const mockProducts = [
        {
          _id: 'product1',
          name: 'Product 1',
          category_id: 'category123',
          is_active: true
        }
      ];

      Category.findById.mockResolvedValue(mockCategory);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(1);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findById).toHaveBeenCalledWith('category123');
      expect(Product.find).toHaveBeenCalledWith({
        category_id: 'category123',
        is_active: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if category not found', async () => {
      // Arrange
      mockReq.params = { categoryId: 'nonexistent' };
      Category.findById.mockResolvedValue(null);

      // Act
      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not found'
        })
      );
    });
  });
});
