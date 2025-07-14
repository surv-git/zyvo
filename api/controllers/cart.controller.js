/**
 * Cart Controller
 * Handles cart management operations with separate CartItem collection
 * Includes inventory checks and coupon integration
 */

const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const UserCoupon = require('../models/UserCoupon');
const CouponCampaign = require('../models/CouponCampaign');
const userAuditLogger = require('../middleware/userAuditLogger');
const mongoose = require('mongoose');

// Helper function to execute with or without transactions based on environment
const executeWithOptionalTransaction = async (operation) => {
  // In test environment or standalone MongoDB, skip transactions
  if (process.env.NODE_ENV === 'test' || !mongoose.connection.db.admin) {
    return await operation();
  }
  
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Get user's cart with all items
 * GET /api/v1/user/cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get cart with items
    const cartData = await Cart.getCartWithItems(userId);
    
    if (!cartData) {
      // Create empty cart for user
      const cart = await Cart.findOrCreateForUser(userId);
      return res.status(200).json({
        success: true,
        message: 'Cart retrieved successfully',
        data: {
          cart: cart.toObject(),
          items: []
        }
      });
    }
    
    // Recalculate total to ensure accuracy
    const cartDoc = await Cart.findById(cartData.cart._id);
    await cartDoc.calculateTotal();
    await cartDoc.save();
    cartData.cart = cartDoc.toObject();
    
    userAuditLogger.logActivity(userId, 'CART_VIEWED', {
      cart_id: cartData.cart._id,
      item_count: cartData.items.length,
      total_amount: cartData.cart.cart_total_amount
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cartData
    });
    
  } catch (error) {
    console.error('Error retrieving cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Add item to cart
 * POST /api/v1/user/cart/items
 */
const addItemToCart = async (req, res) => {
  try {
    const result = await executeWithOptionalTransaction(async (session) => {
      const userId = req.user.id;
      const { product_variant_id, quantity = 1 } = req.body;
      
      // Validate input
      if (!product_variant_id) {
        throw new Error('Product variant ID is required');
      }
      
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be a positive integer');
      }
      
      // Find or create cart
      const cart = await Cart.findOrCreateForUser(userId);
      
      // Fetch product variant details
      const productVariant = await ProductVariant.findById(product_variant_id)
        .populate('product_id', 'name');
      
      if (!productVariant) {
        throw new Error('Product variant not found');
      }
      
      // Check inventory using the existing inventory system
      // Get variant pack details for inventory calculation
      const { base_unit_variant_id, pack_unit_multiplier } = await getVariantPackDetails(product_variant_id);
      const requiredStock = quantity * pack_unit_multiplier;
      
      const inventory = await Inventory.findOne({ product_variant_id: base_unit_variant_id });
      
      if (!inventory || inventory.stock_quantity < requiredStock) {
        throw new Error(`Insufficient stock. Available: ${inventory ? inventory.stock_quantity : 0}, Required: ${requiredStock}`);
      }
      
      // Check if item already exists in cart
      let cartItem = await CartItem.findByCartAndVariant(cart._id, product_variant_id);
      
      if (cartItem) {
        // Update existing item quantity
        const newQuantity = cartItem.quantity + quantity;
        const newRequiredStock = newQuantity * pack_unit_multiplier;
        
        if (inventory.stock_quantity < newRequiredStock) {
          throw new Error(`Insufficient stock for updated quantity. Available: ${inventory.stock_quantity}, Required: ${newRequiredStock}`);
        }
        
        cartItem.quantity = newQuantity;
        await cartItem.save(session ? { session } : undefined);
      } else {
        // Create new cart item
        cartItem = new CartItem({
          cart_id: cart._id,
          product_variant_id: product_variant_id,
          quantity: quantity,
          price_at_addition: productVariant.price
        });
        await cartItem.save(session ? { session } : undefined);
      }
      
      // Recalculate cart total
      await cart.calculateTotal();
      await cart.save(session ? { session } : undefined);
      
      userAuditLogger.logActivity(userId, 'ITEM_ADDED_TO_CART', {
        cart_id: cart._id,
        product_variant_id: product_variant_id,
        quantity: quantity,
        price: productVariant.price,
        product_name: productVariant.product_id?.name
      });
      
      return userId; // Return something for the transaction
    });
    
    // Get updated cart data
    const updatedCartData = await Cart.getCartWithItems(result);
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: updatedCartData
    });
    
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
};

/**
 * Update cart item quantity
 * PATCH /api/v1/user/cart/items/:productVariantId
 */
const updateCartItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { productVariantId } = req.params;
      const { quantity } = req.body;
      
      // Validate input
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error('Quantity must be a non-negative integer');
      }
      
      // Find user's cart
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Find cart item
      const cartItem = await CartItem.findByCartAndVariant(cart._id, productVariantId);
      if (!cartItem) {
        throw new Error('Item not found in cart');
      }
      
      if (quantity === 0) {
        // Remove item from cart
        await CartItem.deleteOne({ _id: cartItem._id }, { session });
      } else {
        // Check inventory for new quantity
        const { base_unit_variant_id, pack_unit_multiplier } = await getVariantPackDetails(productVariantId);
        const requiredStock = quantity * pack_unit_multiplier;
        
        const inventory = await Inventory.findOne({ product_variant_id: base_unit_variant_id });
        
        if (!inventory || inventory.stock_quantity < requiredStock) {
          throw new Error(`Insufficient stock. Available: ${inventory ? inventory.stock_quantity : 0}, Required: ${requiredStock}`);
        }
        
        // Update quantity
        cartItem.quantity = quantity;
        await cartItem.save({ session });
      }
      
      // Recalculate cart total
      await cart.calculateTotal();
      await cart.save({ session });
      
      userAuditLogger.logActivity(userId, 'CART_ITEM_QUANTITY_UPDATED', {
        cart_id: cart._id,
        product_variant_id: productVariantId,
        old_quantity: cartItem.quantity,
        new_quantity: quantity
      });
    });
    
    // Get updated cart data
    const updatedCartData = await Cart.getCartWithItems(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart item quantity updated successfully',
      data: updatedCartData
    });
    
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update cart item quantity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Remove item from cart
 * DELETE /api/v1/user/cart/items/:productVariantId
 */
const removeItemFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { productVariantId } = req.params;
      
      // Find user's cart
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Find and remove cart item
      const cartItem = await CartItem.findByCartAndVariant(cart._id, productVariantId);
      if (!cartItem) {
        throw new Error('Item not found in cart');
      }
      
      await CartItem.deleteOne({ _id: cartItem._id }, { session });
      
      // Recalculate cart total
      await cart.calculateTotal();
      await cart.save({ session });
      
      userAuditLogger.logActivity(userId, 'ITEM_REMOVED_FROM_CART', {
        cart_id: cart._id,
        product_variant_id: productVariantId,
        quantity: cartItem.quantity
      });
    });
    
    // Get updated cart data
    const updatedCartData = await Cart.getCartWithItems(userId);
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: updatedCartData
    });
    
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Apply coupon to cart
 * POST /api/v1/user/cart/apply-coupon
 */
const applyCouponToCart = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { coupon_code } = req.body;
      
      if (!coupon_code) {
        throw new Error('Coupon code is required');
      }
      
      // Find user's cart
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Get cart items for validation
      const cartItems = await CartItem.getCartItems(cart._id);
      
      if (cartItems.length === 0) {
        throw new Error('Cannot apply coupon to empty cart');
      }
      
      // Calculate cart subtotal
      const cartSubtotal = await CartItem.getCartSubtotal(cart._id);
      
      // Prepare cart data for coupon validation (similar to order structure)
      const cartForValidation = {
        user_id: userId,
        items: cartItems.map(item => ({
          product_variant_id: item.product_variant_id._id,
          quantity: item.quantity,
          price: item.product_variant_id.price || item.price_at_addition,
          product: item.product_variant_id.product_id
        })),
        subtotal_amount: cartSubtotal
      };
      
      // Use the coupon system validation logic
      const userCoupon = await UserCoupon.findOne({
        user_id: userId,
        coupon_code: coupon_code.toUpperCase(),
        is_redeemed: false
      }).populate('campaign_id');
      
      if (!userCoupon) {
        throw new Error('Invalid or already used coupon code');
      }
      
      // Validate coupon applicability using existing validation method
      const isValid = await userCoupon.validateCouponApplicability(cartForValidation);
      if (!isValid.valid) {
        throw new Error(isValid.reason || 'Coupon is not applicable to this cart');
      }
      
      // Calculate discount amount
      const campaign = userCoupon.campaign_id;
      let discountAmount = 0;
      
      if (campaign.discount_type === 'PERCENTAGE') {
        discountAmount = (cartSubtotal * campaign.discount_value) / 100;
        if (campaign.max_discount_amount > 0) {
          discountAmount = Math.min(discountAmount, campaign.max_discount_amount);
        }
      } else if (campaign.discount_type === 'AMOUNT') {
        discountAmount = Math.min(campaign.discount_value, cartSubtotal);
      }
      
      // Apply coupon to cart
      cart.applyCoupon(coupon_code.toUpperCase(), discountAmount);
      await cart.calculateTotal();
      await cart.save({ session });
      
      userAuditLogger.logActivity(userId, 'COUPON_APPLIED_TO_CART', {
        cart_id: cart._id,
        coupon_code: coupon_code.toUpperCase(),
        discount_amount: discountAmount,
        cart_total_before: cartSubtotal,
        cart_total_after: cart.cart_total_amount
      });
    });
    
    // Get updated cart data
    const updatedCartData = await Cart.getCartWithItems(userId);
    
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: updatedCartData
    });
    
  } catch (error) {
    console.error('Error applying coupon to cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to apply coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Remove coupon from cart
 * DELETE /api/v1/user/cart/remove-coupon
 */
const removeCouponFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      
      // Find user's cart
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      const removedCoupon = cart.applied_coupon_code;
      
      // Remove coupon
      cart.clearCoupon();
      await cart.calculateTotal();
      await cart.save({ session });
      
      userAuditLogger.logActivity(userId, 'COUPON_REMOVED_FROM_CART', {
        cart_id: cart._id,
        removed_coupon_code: removedCoupon,
        cart_total_after: cart.cart_total_amount
      });
    });
    
    // Get updated cart data
    const updatedCartData = await Cart.getCartWithItems(userId);
    
    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      data: updatedCartData
    });
    
  } catch (error) {
    console.error('Error removing coupon from cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Clear entire cart
 * DELETE /api/v1/user/cart
 */
const clearCart = async (req, res) => {
  try {
    await executeWithOptionalTransaction(async (session) => {
      const userId = req.user.id;
      
      // Find user's cart
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Delete all cart items
      await CartItem.clearCartItems(cart._id);
      
      // Reset cart totals and coupon
      cart.clearCoupon();
      cart.cart_total_amount = 0;
      await cart.save(session ? { session } : undefined);
      
      userAuditLogger.logActivity(userId, 'CART_CLEARED', {
        cart_id: cart._id
      });
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: {
          _id: null,
          user_id: req.user.id,
          applied_coupon_code: null,
          coupon_discount_amount: 0,
          cart_total_amount: 0
        },
        items: []
      }
    });
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
};

/**
 * Helper function to get variant pack details for inventory calculation
 * This should integrate with your existing inventory system
 */
const getVariantPackDetails = async (variantId) => {
  try {
    // This is a placeholder implementation
    // Replace with your actual inventory system logic
    const variant = await ProductVariant.findById(variantId);
    
    // For now, assume each variant is its own base unit
    // In a real system, you might have pack size relationships
    return {
      base_unit_variant_id: variantId,
      pack_unit_multiplier: 1
    };
  } catch (error) {
    console.error('Error getting variant pack details:', error);
    return {
      base_unit_variant_id: variantId,
      pack_unit_multiplier: 1
    };
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  applyCouponToCart,
  removeCouponFromCart,
  clearCart
};
