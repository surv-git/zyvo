/**
 * Real Cart Controller Tests
 * Tests actual controller functions with proper mocking
 */

const cartController = require('../../../controllers/cart.controller');
const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const ProductVariant = require('../../../models/ProductVariant');

// Mock dependencies
jest.mock('../../../models/Cart');
jest.mock('../../../models/CartItem');
jest.mock('../../../models/ProductVariant');

describe('Cart Controller - Real Tests', () => {
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

  describe('getCart', () => {
    it('should get user cart successfully', async () => {
      // Arrange
      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 199.98
      };

      const mockCartItems = [
        {
          _id: 'item1',
          cart_id: 'cart123',
          product_variant_id: {
            _id: 'variant1',
            sku_code: 'SKU001',
            price: 99.99,
            product_id: {
              name: 'Test Product 1'
            }
          },
          quantity: 2,
          price_at_addition: 99.99
        }
      ];

      Cart.findOne.mockResolvedValue(mockCart);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCartItems)
      };

      CartItem.find.mockReturnValue(mockQuery);

      // Act
      await cartController.getCart(mockReq, mockRes);

      // Assert
      expect(Cart.findOne).toHaveBeenCalledWith({ user_id: 'user123' });
      expect(CartItem.find).toHaveBeenCalledWith({ cart_id: 'cart123' });
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'product_variant_id',
        populate: {
          path: 'product_id',
          select: 'name description primary_image'
        }
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            cart: mockCart,
            items: mockCartItems
          }
        })
      );
    });

    it('should create new cart if none exists', async () => {
      // Arrange
      Cart.findOne.mockResolvedValue(null);
      
      const newCart = {
        _id: 'newcart123',
        user_id: 'user123',
        cart_total_amount: 0
      };

      Cart.create.mockResolvedValue(newCart);
      CartItem.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      // Act
      await cartController.getCart(mockReq, mockRes);

      // Assert
      expect(Cart.create).toHaveBeenCalledWith({
        user_id: 'user123',
        cart_total_amount: 0
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      // Arrange
      Cart.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      await cartController.getCart(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      // Arrange
      mockReq.body = {
        product_variant_id: 'variant123',
        quantity: 2
      };

      const mockVariant = {
        _id: 'variant123',
        price: 99.99,
        is_active: true,
        product_id: {
          is_active: true
        }
      };

      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 0,
        save: jest.fn()
      };

      const mockCartItem = {
        _id: 'item123',
        cart_id: 'cart123',
        product_variant_id: 'variant123',
        quantity: 2,
        price_at_addition: 99.99
      };

      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariant)
      });

      Cart.findOne.mockResolvedValue(mockCart);
      CartItem.findOne.mockResolvedValue(null); // Item doesn't exist
      CartItem.create.mockResolvedValue(mockCartItem);

      // Act
      await cartController.addToCart(mockReq, mockRes);

      // Assert
      expect(ProductVariant.findById).toHaveBeenCalledWith('variant123');
      expect(Cart.findOne).toHaveBeenCalledWith({ user_id: 'user123' });
      expect(CartItem.create).toHaveBeenCalledWith({
        cart_id: 'cart123',
        product_variant_id: 'variant123',
        quantity: 2,
        price_at_addition: 99.99
      });
      expect(mockCart.cart_total_amount).toBe(199.98);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should update quantity if item already exists', async () => {
      // Arrange
      mockReq.body = {
        product_variant_id: 'variant123',
        quantity: 1
      };

      const mockVariant = {
        _id: 'variant123',
        price: 99.99,
        is_active: true,
        product_id: { is_active: true }
      };

      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 199.98,
        save: jest.fn()
      };

      const mockExistingItem = {
        _id: 'item123',
        cart_id: 'cart123',
        product_variant_id: 'variant123',
        quantity: 2,
        price_at_addition: 99.99,
        save: jest.fn()
      };

      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariant)
      });

      Cart.findOne.mockResolvedValue(mockCart);
      CartItem.findOne.mockResolvedValue(mockExistingItem);

      // Act
      await cartController.addToCart(mockReq, mockRes);

      // Assert
      expect(mockExistingItem.quantity).toBe(3); // 2 + 1
      expect(mockExistingItem.save).toHaveBeenCalled();
      expect(mockCart.cart_total_amount).toBe(299.97); // 199.98 + 99.99
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if product variant not found', async () => {
      // Arrange
      mockReq.body = {
        product_variant_id: 'nonexistent',
        quantity: 1
      };

      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });

      // Act
      await cartController.addToCart(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product variant not found'
        })
      );
    });

    it('should return error if product variant is inactive', async () => {
      // Arrange
      mockReq.body = {
        product_variant_id: 'variant123',
        quantity: 1
      };

      const mockVariant = {
        _id: 'variant123',
        price: 99.99,
        is_active: false
      };

      ProductVariant.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariant)
      });

      // Act
      await cartController.addToCart(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product is not available'
        })
      );
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity successfully', async () => {
      // Arrange
      mockReq.params = { itemId: 'item123' };
      mockReq.body = { quantity: 3 };

      const mockCartItem = {
        _id: 'item123',
        cart_id: 'cart123',
        product_variant_id: 'variant123',
        quantity: 2,
        price_at_addition: 99.99,
        save: jest.fn()
      };

      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 199.98,
        save: jest.fn()
      };

      CartItem.findById.mockResolvedValue(mockCartItem);
      Cart.findById.mockResolvedValue(mockCart);

      // Act
      await cartController.updateCartItem(mockReq, mockRes);

      // Assert
      expect(CartItem.findById).toHaveBeenCalledWith('item123');
      expect(mockCartItem.quantity).toBe(3);
      expect(mockCartItem.save).toHaveBeenCalled();
      expect(mockCart.cart_total_amount).toBe(99.99); // Recalculated: 199.98 - 199.98 + 299.97
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if cart item not found', async () => {
      // Arrange
      mockReq.params = { itemId: 'nonexistent' };
      mockReq.body = { quantity: 3 };

      CartItem.findById.mockResolvedValue(null);

      // Act
      await cartController.updateCartItem(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cart item not found'
        })
      );
    });

    it('should return error for invalid quantity', async () => {
      // Arrange
      mockReq.params = { itemId: 'item123' };
      mockReq.body = { quantity: 0 };

      // Act
      await cartController.updateCartItem(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Quantity must be at least 1'
        })
      );
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      // Arrange
      mockReq.params = { itemId: 'item123' };

      const mockCartItem = {
        _id: 'item123',
        cart_id: 'cart123',
        quantity: 2,
        price_at_addition: 99.99
      };

      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 199.98,
        save: jest.fn()
      };

      CartItem.findById.mockResolvedValue(mockCartItem);
      CartItem.findByIdAndDelete.mockResolvedValue(mockCartItem);
      Cart.findById.mockResolvedValue(mockCart);

      // Act
      await cartController.removeFromCart(mockReq, mockRes);

      // Assert
      expect(CartItem.findById).toHaveBeenCalledWith('item123');
      expect(CartItem.findByIdAndDelete).toHaveBeenCalledWith('item123');
      expect(mockCart.cart_total_amount).toBe(0); // 199.98 - 199.98
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if cart item not found', async () => {
      // Arrange
      mockReq.params = { itemId: 'nonexistent' };

      CartItem.findById.mockResolvedValue(null);

      // Act
      await cartController.removeFromCart(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cart item not found'
        })
      );
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      // Arrange
      const mockCart = {
        _id: 'cart123',
        user_id: 'user123',
        cart_total_amount: 199.98,
        save: jest.fn()
      };

      Cart.findOne.mockResolvedValue(mockCart);
      CartItem.deleteMany.mockResolvedValue({ deletedCount: 3 });

      // Act
      await cartController.clearCart(mockReq, mockRes);

      // Assert
      expect(Cart.findOne).toHaveBeenCalledWith({ user_id: 'user123' });
      expect(CartItem.deleteMany).toHaveBeenCalledWith({ cart_id: 'cart123' });
      expect(mockCart.cart_total_amount).toBe(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cart cleared successfully'
        })
      );
    });

    it('should return error if cart not found', async () => {
      // Arrange
      Cart.findOne.mockResolvedValue(null);

      // Act
      await cartController.clearCart(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cart not found'
        })
      );
    });
  });
});
