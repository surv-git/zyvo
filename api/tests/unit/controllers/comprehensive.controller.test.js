/**
 * Comprehensive Real Controller Tests
 * Tests the most critical controller functions to maximize coverage
 */

// Import all critical controllers
const authController = require('../../../controllers/auth.controller');
const userController = require('../../../controllers/user.controller');
const productController = require('../../../controllers/product.controller');
const categoryController = require('../../../controllers/category.controller');
const cartController = require('../../../controllers/cart.controller');
const orderController = require('../../../controllers/order.controller');

// Import models
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Order = require('../../../models/Order');
const OrderItem = require('../../../models/OrderItem');
const ProductVariant = require('../../../models/ProductVariant');

// Import utilities
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock all dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/Product');
jest.mock('../../../models/Category');
jest.mock('../../../models/Cart');
jest.mock('../../../models/CartItem');
jest.mock('../../../models/Order');
jest.mock('../../../models/OrderItem');
jest.mock('../../../models/ProductVariant');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../utils/sendVerificationEmail');
jest.mock('../../../utils/sendEmail');

describe('Comprehensive Controller Tests - Real Coverage', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', _id: 'user123' },
      file: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('Auth Controller - Critical Functions', () => {
    it('should handle user registration flow', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      });
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('mockToken');

      // Act
      await authController.registerUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalled();
    });

    it('should handle user login flow', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        is_email_verified: true
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      // Act
      await authController.loginUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should handle logout', async () => {
      // Act
      await authController.logoutUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.clearCookie).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  describe('User Controller - Critical Functions', () => {
    it('should get user by ID', async () => {
      // Arrange
      mockReq.params = { id: 'user123' };
      
      User.findById.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      });

      // Act
      await userController.getUserById(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('should update user', async () => {
      // Arrange
      mockReq.params = { id: 'user123' };
      mockReq.body = { name: 'Updated Name' };
      
      const mockUser = {
        _id: 'user123',
        name: 'Old Name',
        save: jest.fn()
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await userController.updateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('should delete user', async () => {
      // Arrange
      mockReq.params = { id: 'user123' };
      
      User.findById.mockResolvedValue({
        _id: 'user123',
        name: 'Test User'
      });
      User.findByIdAndDelete.mockResolvedValue({});

      // Act
      await userController.deleteUser(mockReq, mockRes, mockNext);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
    });
  });

  describe('Product Controller - Critical Functions', () => {
    it('should get all products', async () => {
      // Arrange
      mockReq.query = { page: '1', limit: '10' };
      
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
      expect(Product.find).toHaveBeenCalled();
      expect(Product.countDocuments).toHaveBeenCalled();
    });

    it('should get product by ID or slug', async () => {
      // Arrange
      mockReq.params = { id: 'product123' };
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'product123',
          name: 'Test Product',
          is_active: true
        })
      };
      
      Product.findById.mockReturnValue(mockQuery);

      // Act
      await productController.getProductByIdOrSlug(mockReq, mockRes, mockNext);

      // Assert
      expect(Product.findById).toHaveBeenCalledWith('product123');
    });
  });

  describe('Category Controller - Critical Functions', () => {
    it('should get all categories', async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };
      
      Category.find.mockReturnValue(mockQuery);

      // Act
      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.find).toHaveBeenCalled();
    });

    it('should create category', async () => {
      // Arrange
      mockReq.body = {
        name: 'New Category',
        description: 'Test description'
      };
      
      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({
        _id: 'cat123',
        name: 'New Category'
      });

      // Act
      await categoryController.createCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findOne).toHaveBeenCalled();
      expect(Category.create).toHaveBeenCalled();
    });
  });

  describe('Cart Controller - Critical Functions', () => {
    it('should get user cart', async () => {
      // Arrange
      Cart.findOne.mockResolvedValue({
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 0
      });
      
      CartItem.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      // Act
      await cartController.getCart(mockReq, mockRes, mockNext);

      // Assert
      expect(Cart.findOne).toHaveBeenCalledWith({ user_id: 'user123' });
    });

    it('should add item to cart', async () => {
      // Arrange
      mockReq.body = {
        product_variant_id: 'variant123',
        quantity: 1
      };
      
      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'variant123',
          price: 99.99,
          is_active: true,
          product_id: { is_active: true }
        })
      });
      
      Cart.findOne.mockResolvedValue({
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 0,
        save: jest.fn()
      });
      
      CartItem.findOne.mockResolvedValue(null);
      CartItem.create.mockResolvedValue({});

      // Act
      await cartController.addToCart(mockReq, mockRes, mockNext);

      // Assert
      expect(ProductVariant.findById).toHaveBeenCalledWith('variant123');
      expect(Cart.findOne).toHaveBeenCalledWith({ user_id: 'user123' });
    });
  });

  describe('Order Controller - Critical Functions', () => {
    it('should get user orders', async () => {
      // Arrange
      mockReq.query = { page: '1', limit: '10' };
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };
      
      Order.find.mockReturnValue(mockQuery);
      Order.countDocuments.mockResolvedValue(0);

      // Act
      await orderController.getUserOrders(mockReq, mockRes, mockNext);

      // Assert
      expect(Order.find).toHaveBeenCalledWith({ user_id: 'user123' });
    });

    it('should get order by ID', async () => {
      // Arrange
      mockReq.params = { id: 'order123' };
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'order123',
          user_id: 'user123',
          order_status: 'pending'
        })
      };
      
      Order.findById.mockReturnValue(mockQuery);

      // Act
      await orderController.getOrderById(mockReq, mockRes, mockNext);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith('order123');
    });
  });

  describe('Integration Tests - Cross-Controller Flows', () => {
    it('should handle complete user registration and login flow', async () => {
      // Registration
      mockReq.body = {
        name: 'Integration User',
        email: 'integration@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'integration123',
        name: 'Integration User',
        email: 'integration@example.com'
      });
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('integrationToken');

      await authController.registerUser(mockReq, mockRes, mockNext);

      // Login
      mockReq.body = {
        email: 'integration@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({
        _id: 'integration123',
        email: 'integration@example.com',
        password: 'hashedPassword',
        is_email_verified: true
      });
      bcrypt.compare.mockResolvedValue(true);

      await authController.loginUser(mockReq, mockRes, mockNext);

      // Verify both flows executed
      expect(User.create).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should handle product browsing and cart addition flow', async () => {
      // Browse products
      mockReq.query = { page: '1', limit: '5' };
      
      const mockProductQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{
          _id: 'product123',
          name: 'Test Product'
        }])
      };
      
      Product.find.mockReturnValue(mockProductQuery);
      Product.countDocuments.mockResolvedValue(1);

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      // Add to cart
      mockReq.body = {
        product_variant_id: 'variant123',
        quantity: 2
      };
      
      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'variant123',
          price: 49.99,
          is_active: true,
          product_id: { is_active: true }
        })
      });
      
      Cart.findOne.mockResolvedValue({
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 0,
        save: jest.fn()
      });
      
      CartItem.findOne.mockResolvedValue(null);
      CartItem.create.mockResolvedValue({});

      await cartController.addToCart(mockReq, mockRes, mockNext);

      // Verify both flows executed
      expect(Product.find).toHaveBeenCalled();
      expect(CartItem.create).toHaveBeenCalled();
    });
  });
});
