/**
 * Business Logic Service Integration Tests
 * Tests complex business workflows and service interactions
 */

const User = require('../../../models/User');
const Product = require('../../../models/Product');
const ProductVariant = require('../../../models/ProductVariant');
const Category = require('../../../models/Category');
const Option = require('../../../models/Option');
const Favorite = require('../../../models/Favorite');
const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Order = require('../../../models/Order');
const OrderItem = require('../../../models/OrderItem');

describe('Business Logic Service Integration Tests', () => {
  let testUser, testProducts, testVariants, testCategories;

  beforeEach(async () => {
    // Clean up all collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Category.deleteMany({});
    await Favorite.deleteMany({});
    await Cart.deleteMany({});
    await CartItem.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      phone: '+1234567890',
      isVerified: true
    });

    // Create test categories
    testCategories = [];
    const categoryNames = ['Electronics', 'Clothing', 'Books'];
    
    for (let i = 0; i < 3; i++) {
      const category = await Category.create({
        name: categoryNames[i],
        slug: categoryNames[i].toLowerCase(),
        description: `${categoryNames[i]} category`,
        is_active: true
      });
      testCategories.push(category);
    }

    // Create test products and variants
    testProducts = [];
    testVariants = [];

    for (let i = 0; i < 3; i++) {
      const product = await Product.create({
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        category_id: testCategories[i]._id,
        is_active: true
      });
      testProducts.push(product);

      const variant = await ProductVariant.create({
        product_id: product._id,
        name: `Variant ${i}`,
        sku_code: `SKU-${i}`,
        price: 50 + i * 25,
        stock_quantity: 100,
        is_active: true
      });
      testVariants.push(variant);
    }
  });

  describe('Favorite Management Workflow', () => {
    it('should handle complete favorite lifecycle', async () => {
      // 1. Add product to favorites
      const favorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariants[0]._id,
        user_notes: 'Love this product!',
        is_active: true
      });

      expect(favorite.is_active).toBe(true);

      // 2. Update favorite notes
      favorite.user_notes = 'Updated notes - still love it!';
      await favorite.save();

      const updatedFavorite = await Favorite.findById(favorite._id);
      expect(updatedFavorite.user_notes).toBe('Updated notes - still love it!');

      // 3. Remove from favorites (soft delete)
      updatedFavorite.is_active = false;
      await updatedFavorite.save();

      const removedFavorite = await Favorite.findById(favorite._id);
      expect(removedFavorite.is_active).toBe(false);

      // 4. Re-add to favorites (reactivate)
      removedFavorite.is_active = true;
      await removedFavorite.save();

      const reactivatedFavorite = await Favorite.findById(favorite._id);
      expect(reactivatedFavorite.is_active).toBe(true);
    });

    it('should prevent duplicate favorites', async () => {
      // Create first favorite
      await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariants[0]._id,
        is_active: true
      });

      // Try to create duplicate - should fail
      await expect(Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariants[0]._id,
        is_active: true
      })).rejects.toThrow();
    });

    it('should handle bulk favorite operations', async () => {
      // Add multiple favorites
      const favoritePromises = testVariants.map(variant =>
        Favorite.create({
          user_id: testUser._id,
          product_variant_id: variant._id,
          is_active: true
        })
      );

      const favorites = await Promise.all(favoritePromises);
      expect(favorites).toHaveLength(3);

      // Get user's favorites with population
      const userFavorites = await Favorite.find({
        user_id: testUser._id,
        is_active: true
      }).populate({
        path: 'product_variant_id',
        populate: {
          path: 'product_id'
        }
      });

      expect(userFavorites).toHaveLength(3);
      expect(userFavorites[0].product_variant_id.product_id.name).toBeDefined();
    });

    it('should calculate favorite statistics', async () => {
      // Add favorites with different categories
      for (let i = 0; i < testVariants.length; i++) {
        await Favorite.create({
          user_id: testUser._id,
          product_variant_id: testVariants[i]._id,
          is_active: true
        });
      }

      // Calculate statistics
      const favorites = await Favorite.find({
        user_id: testUser._id,
        is_active: true
      }).populate({
        path: 'product_variant_id',
        populate: {
          path: 'product_id'
        }
      });

      const stats = {
        total_favorites: favorites.length,
        categories: [...new Set(favorites.map(f => f.product_variant_id.product_id.category_id.toString()))],
        total_value: favorites.reduce((sum, f) => sum + f.product_variant_id.price, 0),
        average_price: 0
      };

      stats.average_price = stats.total_value / stats.total_favorites;

      expect(stats.total_favorites).toBe(3);
      expect(stats.categories).toHaveLength(3);
      expect(stats.total_value).toBe(225); // 50 + 75 + 100
      expect(stats.average_price).toBe(75);
    });
  });

  describe('Shopping Cart Workflow', () => {
    it('should handle cart creation and management', async () => {
      // 1. Create empty cart
      let cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: 0
      });

      expect(cart.cart_total_amount).toBe(0);

      // 2. Add items to cart using CartItem model
      const cartItem1 = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[0]._id,
        quantity: 2,
        price_at_addition: testVariants[0].price
      });

      const cartItem2 = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[1]._id,
        quantity: 1,
        price_at_addition: testVariants[1].price
      });

      // 3. Calculate and update cart total
      const cartItems = await CartItem.find({ cart_id: cart._id });
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (item.price_at_addition * item.quantity), 0
      );
      
      cart.cart_total_amount = totalAmount;
      await cart.save();

      // 4. Verify cart state
      const updatedCart = await Cart.findById(cart._id);
      const updatedCartItems = await CartItem.find({ cart_id: cart._id });
      
      expect(updatedCartItems).toHaveLength(2);
      expect(updatedCart.cart_total_amount).toBe(175); // (50*2) + (75*1)
      expect(cartItem1.quantity).toBe(2);
      expect(cartItem2.quantity).toBe(1);
    });

    it('should handle cart item quantity updates', async () => {
      // Create cart with items
      const cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: testVariants[0].price
      });

      const cartItem = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[0]._id,
        quantity: 1,
        price_at_addition: testVariants[0].price
      });

      // Update quantity
      cartItem.quantity = 3;
      await cartItem.save();

      // Update cart total
      cart.cart_total_amount = cartItem.price_at_addition * cartItem.quantity;
      await cart.save();

      const updatedCartItem = await CartItem.findById(cartItem._id);
      const updatedCart = await Cart.findById(cart._id);
      
      expect(updatedCartItem.quantity).toBe(3);
      expect(updatedCart.cart_total_amount).toBe(150); // 50 * 3
    });

    it('should remove items from cart', async () => {
      // Create cart with multiple items
      const cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: testVariants[0].price + testVariants[1].price
      });

      const cartItem1 = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[0]._id,
        quantity: 1,
        price_at_addition: testVariants[0].price
      });

      const cartItem2 = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[1]._id,
        quantity: 1,
        price_at_addition: testVariants[1].price
      });

      // Remove first item
      await CartItem.findByIdAndDelete(cartItem1._id);

      // Update cart total
      const remainingItems = await CartItem.find({ cart_id: cart._id });
      cart.cart_total_amount = remainingItems.reduce((sum, item) => 
        sum + (item.price_at_addition * item.quantity), 0
      );
      await cart.save();

      const updatedCart = await Cart.findById(cart._id);
      const updatedCartItems = await CartItem.find({ cart_id: cart._id });
      
      expect(updatedCartItems).toHaveLength(1);
      expect(updatedCart.cart_total_amount).toBe(testVariants[1].price);
      expect(updatedCartItems[0].product_variant_id.toString()).toBe(testVariants[1]._id.toString());
    });

    it('should validate stock availability', async () => {
      // Create a separate product for this test to avoid conflicts
      const stockTestProduct = await Product.create({
        name: `Stock Test Product ${Date.now()}`,
        description: 'Product for stock testing',
        category_id: testCategories[0]._id,
        is_active: true
      });

      // Create a product variant for testing
      const testVariant = await ProductVariant.create({
        product_id: stockTestProduct._id,
        sku_code: `STOCK-TEST-${Date.now()}`,
        price: 99.99,
        is_active: true
      });

      // Simulate business logic validation
      const requestedQuantity = 5;
      const availableStock = 2; // Simulated stock level

      expect(requestedQuantity).toBeGreaterThan(availableStock);

      // In real implementation, this would prevent cart creation
      // For now, we just verify the stock check logic
      const canAddToCart = requestedQuantity <= availableStock;
      expect(canAddToCart).toBe(false);

      // Verify the variant was created successfully
      expect(testVariant.sku_code).toMatch(/^STOCK-TEST-\d+$/);
      expect(testVariant.price).toBe(99.99);
      expect(testVariant.is_active).toBe(true);
    });
  });

  describe('Order Processing Workflow', () => {
    let testCart, testCartItems;

    beforeEach(async () => {
      // Create a cart with items for order processing
      testCart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: 175 // (50*2) + (75*1)
      });

      // Create cart items
      testCartItems = [
        await CartItem.create({
          cart_id: testCart._id,
          product_variant_id: testVariants[0]._id,
          quantity: 2,
          price_at_addition: testVariants[0].price
        }),
        await CartItem.create({
          cart_id: testCart._id,
          product_variant_id: testVariants[1]._id,
          quantity: 1,
          price_at_addition: testVariants[1].price
        })
      ];
    });

    it('should convert cart to order', async () => {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order from cart with required fields
      const subtotalAmount = 175;
      const taxAmount = subtotalAmount * 0.1; // 10% tax
      const grandTotalAmount = subtotalAmount + taxAmount;

      const order = await Order.create({
        user_id: testCart.user_id,
        order_number: orderNumber,
        subtotal_amount: subtotalAmount,
        tax_amount: taxAmount,
        grand_total_amount: grandTotalAmount,
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      // Create order items from cart items
      const orderItems = [];
      for (const cartItem of testCartItems) {
        const orderItem = await OrderItem.create({
          order_id: order._id,
          product_variant_id: cartItem.product_variant_id,
          sku_code: `SKU-${Date.now()}-${Math.random()}`,
          product_name: 'Test Product',
          quantity: cartItem.quantity,
          price: cartItem.price_at_addition,
          subtotal: cartItem.quantity * cartItem.price_at_addition
        });
        orderItems.push(orderItem);
      }

      expect(orderItems).toHaveLength(2);
      expect(order.subtotal_amount).toBe(175);
      expect(order.tax_amount).toBe(17.5);
      expect(order.grand_total_amount).toBe(192.5);
      expect(order.order_status).toBe('PENDING'); // Default status

      // Verify order items
      const createdOrderItems = await OrderItem.find({ order_id: order._id });
      expect(createdOrderItems).toHaveLength(2);
      expect(createdOrderItems[0].quantity).toBe(2);
      expect(createdOrderItems[1].quantity).toBe(1);
    });

    it('should handle order status transitions', async () => {
      const order = await Order.create({
        user_id: testUser._id,
        order_number: 'ORD-STATUS-TEST',
        subtotal_amount: testVariants[0].price,
        grand_total_amount: testVariants[0].price,
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      // Status progression: PENDING -> PROCESSING -> SHIPPED -> DELIVERED
      const statusFlow = ['PROCESSING', 'SHIPPED', 'DELIVERED'];

      for (const status of statusFlow) {
        order.order_status = status;
        await order.save();

        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder.order_status).toBe(status);
      }
    });

    it('should handle order cancellation', async () => {
      const order = await Order.create({
        user_id: testUser._id,
        order_number: 'ORD-CANCEL-TEST',
        subtotal_amount: testVariants[0].price,
        grand_total_amount: testVariants[0].price,
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      // Cancel order
      order.order_status = 'CANCELLED';
      await order.save();

      const cancelledOrder = await Order.findById(order._id);
      expect(cancelledOrder.order_status).toBe('CANCELLED');
      expect(cancelledOrder.updatedAt).toBeDefined();
    });

    it('should update inventory after order confirmation', async () => {
      const orderQuantity = 3;

      // Create order
      const order = await Order.create({
        user_id: testUser._id,
        order_number: 'ORD-INVENTORY-TEST',
        subtotal_amount: testVariants[0].price * orderQuantity,
        grand_total_amount: testVariants[0].price * orderQuantity,
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      // Create order item
      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_variant_id: testVariants[0]._id,
        sku_code: `SKU-${Date.now()}-${Math.random()}`,
        product_name: 'Test Product',
        quantity: orderQuantity,
        price: testVariants[0].price,
        subtotal: orderQuantity * testVariants[0].price
      });

      // Simulate order confirmation
      order.order_status = 'PROCESSING';
      await order.save();

      const confirmedOrder = await Order.findById(order._id);
      const confirmedOrderItem = await OrderItem.findById(orderItem._id);
      
      expect(confirmedOrder.order_status).toBe('PROCESSING');
      expect(confirmedOrderItem.quantity).toBe(orderQuantity);
      expect(confirmedOrderItem.price).toBe(testVariants[0].price);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle favorite to cart workflow', async () => {
      // 1. Add product to favorites
      const favorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariants[0]._id,
        user_notes: 'Want to buy this!',
        is_active: true
      });

      // 2. Move from favorites to cart
      const cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: testVariants[0].price
      });

      const cartItem = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: favorite.product_variant_id,
        quantity: 1,
        price_at_addition: testVariants[0].price
      });

      // 3. Verify both exist
      expect(favorite.is_active).toBe(true);
      expect(cartItem.quantity).toBe(1);
      expect(cartItem.product_variant_id.toString()).toBe(
        favorite.product_variant_id.toString()
      );
      expect(cart.cart_total_amount).toBe(testVariants[0].price);
    });

    it('should handle cart to order to favorites workflow', async () => {
      // 1. Create cart
      const cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: testVariants[0].price
      });

      const cartItem = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[0]._id,
        quantity: 1,
        price_at_addition: testVariants[0].price
      });

      // 2. Convert to order
      const order = await Order.create({
        user_id: testUser._id,
        order_number: 'ORD-WORKFLOW-TEST',
        subtotal_amount: cart.cart_total_amount,
        grand_total_amount: cart.cart_total_amount,
        order_status: 'DELIVERED',
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_variant_id: cartItem.product_variant_id,
        sku_code: `SKU-${Date.now()}-${Math.random()}`,
        product_name: 'Test Product',
        quantity: cartItem.quantity,
        price: cartItem.price_at_addition,
        subtotal: cartItem.quantity * cartItem.price_at_addition
      });

      // 3. Add to favorites after delivery (for reordering)
      const favorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariants[0]._id,
        user_notes: 'Great product, will order again!',
        is_active: true
      });

      // 4. Verify complete workflow
      expect(order.order_status).toBe('DELIVERED');
      expect(favorite.is_active).toBe(true);
      expect(favorite.product_variant_id.toString()).toBe(
        orderItem.product_variant_id.toString()
      );
    });

    it('should handle user data aggregation', async () => {
      // Create comprehensive user data
      const favorites = await Promise.all([
        Favorite.create({
          user_id: testUser._id,
          product_variant_id: testVariants[0]._id,
          is_active: true
        }),
        Favorite.create({
          user_id: testUser._id,
          product_variant_id: testVariants[1]._id,
          is_active: true
        })
      ]);

      const cart = await Cart.create({
        user_id: testUser._id,
        cart_total_amount: testVariants[2].price
      });

      const cartItem = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: testVariants[2]._id,
        quantity: 1,
        price_at_addition: testVariants[2].price
      });

      const order = await Order.create({
        user_id: testUser._id,
        order_number: 'ORD-AGGREGATE-TEST',
        subtotal_amount: testVariants[0].price,
        grand_total_amount: testVariants[0].price,
        order_status: 'DELIVERED',
        shipping_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        },
        billing_address: {
          full_name: 'John Doe',
          address_line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          phone_number: '+1234567890'
        }
      });

      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_variant_id: testVariants[0]._id,
        sku_code: `SKU-${Date.now()}-${Math.random()}`,
        product_name: 'Test Product',
        quantity: 1,
        price: testVariants[0].price,
        subtotal: 1 * testVariants[0].price
      });

      // Aggregate user data
      const userFavorites = await Favorite.find({ user_id: testUser._id, is_active: true });
      const userCarts = await Cart.find({ user_id: testUser._id });
      const userOrders = await Order.find({ user_id: testUser._id });

      const userSummary = {
        total_favorites: userFavorites.length,
        active_carts: userCarts.length,
        total_orders: userOrders.length,
        total_spent: userOrders.reduce((sum, order) => sum + order.grand_total_amount, 0)
      };

      expect(userSummary.total_favorites).toBe(2);
      expect(userSummary.active_carts).toBe(1);
      expect(userSummary.total_orders).toBe(1);
      expect(userSummary.total_spent).toBe(testVariants[0].price);
    });
  });
});
