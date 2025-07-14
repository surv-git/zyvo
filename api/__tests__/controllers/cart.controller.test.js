/**
 * Cart Controller Tests
 * Tests for cart management functionality with proper database cleanup
 */

const mongoose = require('mongoose');
const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  createTestUser,
  createTestProductVariant,
  createTestCart,
  createTestCartItem,
  mockReqWithUser,
  mockRes,
  mockNext
} = require('../utils/testHelpers');

const {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  applyCouponToCart,
  removeCouponFromCart,
  clearCart
} = require('../../controllers/cart.controller');

const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');

// Mock the audit logger
jest.mock('../../middleware/userAuditLogger', () => ({
  logActivity: jest.fn()
}));

describe('Cart Controller', () => {
  let testUser;
  let testProductVariant;
  let testCart;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create test data
    testUser = await createTestUser();
    testProductVariant = await createTestProductVariant();
    testCart = await createTestCart(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('getCart', () => {
    it('should return empty cart for user with no cart', async () => {
      // Clear the test cart
      await Cart.deleteMany({});
      
      const req = mockReqWithUser(testUser);
      const res = mockRes();
      
      await getCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cart retrieved successfully',
          data: expect.objectContaining({
            cart: expect.any(Object),
            items: []
          })
        })
      );
    });

    it('should return cart with items for user', async () => {
      // Add an item to the cart
      await createTestCartItem(testCart._id, testProductVariant._id);
      
      const req = mockReqWithUser(testUser);
      const res = mockRes();
      
      await getCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cart retrieved successfully',
          data: expect.objectContaining({
            cart: expect.any(Object),
            items: expect.arrayContaining([expect.any(Object)])
          })
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock a database error
      const originalFind = Cart.getCartWithItems;
      Cart.getCartWithItems = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const req = mockReqWithUser(testUser);
      const res = mockRes();
      
      await getCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve cart'
        })
      );
      
      // Restore original method
      Cart.getCartWithItems = originalFind;
    });
  });

  describe('addItemToCart', () => {
    it('should add new item to cart', async () => {
      const req = mockReqWithUser(testUser, {
        body: {
          product_variant_id: testProductVariant._id.toString(),
          quantity: 2
        }
      });
      const res = mockRes();
      
      await addItemToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Item added to cart successfully'
        })
      );
      
      // Verify item was added
      const cartItems = await CartItem.find({ cart_id: testCart._id });
      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].quantity).toBe(2);
    });

    it('should merge quantity for existing item', async () => {
      // Add existing item
      await createTestCartItem(testCart._id, testProductVariant._id, { quantity: 1 });
      
      const req = mockReqWithUser(testUser, {
        body: {
          product_variant_id: testProductVariant._id.toString(),
          quantity: 2
        }
      });
      const res = mockRes();
      
      await addItemToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify quantity was merged
      const cartItems = await CartItem.find({ cart_id: testCart._id });
      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].quantity).toBe(3);
    });

    it('should validate required fields', async () => {
      const req = mockReqWithUser(testUser, {
        body: {} // Missing required fields
      });
      const res = mockRes();
      
      await addItemToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product variant ID is required'
        })
      );
    });

    it('should validate quantity', async () => {
      const req = mockReqWithUser(testUser, {
        body: {
          product_variant_id: testProductVariant._id.toString(),
          quantity: 0 // Invalid quantity
        }
      });
      const res = mockRes();
      
      await addItemToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Quantity must be a positive integer'
        })
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      // Add some items to cart
      await createTestCartItem(testCart._id, testProductVariant._id);
      
      const req = mockReqWithUser(testUser);
      const res = mockRes();
      
      await clearCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cart cleared successfully'
        })
      );
      
      // Verify cart was cleared
      const cartItems = await CartItem.find({ cart_id: testCart._id });
      expect(cartItems).toHaveLength(0);
      
      const updatedCart = await Cart.findById(testCart._id);
      expect(updatedCart.cart_total_amount).toBe(0);
      expect(updatedCart.applied_coupon_code).toBeNull();
    });

    it('should handle non-existent cart', async () => {
      // Delete the cart
      await Cart.deleteMany({});
      
      const req = mockReqWithUser(testUser);
      const res = mockRes();
      
      await clearCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cart not found'
        })
      );
    });
  });
});
