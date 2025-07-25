/**
 * Cart Seeder
 * Creates realistic shopping cart data with cart items
 * Includes various cart states: active, abandoned, with/without coupons
 */

const mongoose = require('mongoose');
const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const User = require('../../models/User');
const ProductVariant = require('../../models/ProductVariant');
const CouponCampaign = require('../../models/CouponCampaign');

/**
 * Generate realistic cart data
 */
const generateCartData = async () => {
  try {
    console.log('🛒 Generating cart seed data...');

    // Get existing data for references
    const users = await User.find({}, '_id email').lean();
    const productVariants = await ProductVariant.find(
      { is_active: true }, 
      '_id price'
    ).lean();
    const activeCoupons = await CouponCampaign.find(
      { 
        is_active: true,
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() }
      }, 
      '_id code discount_amount discount_percentage minimum_order_amount'
    ).lean();

    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    if (productVariants.length === 0) {
      throw new Error('No product variants found. Please seed product variants first.');
    }

    console.log(`📊 Found ${users.length} users and ${productVariants.length} product variants`);
    console.log(`🎫 Found ${activeCoupons.length} active coupons`);

    // Cart generation parameters
    const TOTAL_CARTS = Math.min(150, users.length); // Can't have more carts than users
    const ABANDONED_CART_RATE = 0.3; // 30% abandoned carts
    const COUPON_USAGE_RATE = 0.15; // 15% of carts use coupons
    const MIN_ITEMS_PER_CART = 1;
    const MAX_ITEMS_PER_CART = 8;

    const carts = [];
    const cartItems = [];
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5); // Shuffle users array

    for (let i = 0; i < TOTAL_CARTS; i++) {
      // Select the next user (ensure no duplicates)
      const selectedUser = shuffledUsers[i];

      // Determine cart characteristics
      const isAbandoned = Math.random() < ABANDONED_CART_RATE;
      const usesCoupon = !isAbandoned && Math.random() < COUPON_USAGE_RATE && activeCoupons.length > 0;
      
      // Generate creation date (last 3 months, more recent activity)
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const createdAt = new Date(
        threeMonthsAgo.getTime() + 
        Math.random() * (now.getTime() - threeMonthsAgo.getTime())
      );

      // Generate updated date (between created and now, bias toward recent)
      const timeSinceCreation = now.getTime() - createdAt.getTime();
      const updatedAt = new Date(
        createdAt.getTime() + 
        Math.random() * timeSinceCreation * (isAbandoned ? 0.1 : 0.9) // Abandoned carts updated less recently
      );

      // Create cart object
      const cart = {
        _id: new mongoose.Types.ObjectId(),
        user_id: selectedUser._id,
        applied_coupon_code: null,
        coupon_discount_amount: 0,
        cart_total_amount: 0, // Will be calculated after adding items
        created_at: createdAt,
        updated_at: updatedAt
      };

      // Generate cart items
      const numItems = Math.floor(Math.random() * (MAX_ITEMS_PER_CART - MIN_ITEMS_PER_CART + 1)) + MIN_ITEMS_PER_CART;
      const selectedVariants = new Set();
      let cartSubtotal = 0;

      for (let j = 0; j < numItems; j++) {
        let selectedVariant;
        
        // Ensure no duplicate variants in same cart
        do {
          selectedVariant = productVariants[Math.floor(Math.random() * productVariants.length)];
        } while (selectedVariants.has(selectedVariant._id.toString()) && selectedVariants.size < productVariants.length);
        
        selectedVariants.add(selectedVariant._id.toString());

        // Generate realistic quantity (bias toward 1-3 items)
        const quantity = Math.random() < 0.7 ? 
          Math.floor(Math.random() * 3) + 1 : // 1-3 items (70% chance)
          Math.floor(Math.random() * 5) + 4;  // 4-8 items (30% chance)

        // Generate item added date (between cart creation and cart update)
        const itemAddedAt = new Date(
          createdAt.getTime() + 
          Math.random() * (updatedAt.getTime() - createdAt.getTime())
        );

        const itemSubtotal = quantity * selectedVariant.price;
        cartSubtotal += itemSubtotal;

        const cartItem = {
          _id: new mongoose.Types.ObjectId(),
          cart_id: cart._id,
          product_variant_id: selectedVariant._id,
          quantity: quantity,
          price_at_addition: selectedVariant.price,
          added_at: itemAddedAt
        };

        cartItems.push(cartItem);
      }

      // Apply coupon if selected
      if (usesCoupon) {
        const eligibleCoupons = activeCoupons.filter(coupon => 
          !coupon.minimum_order_amount || cartSubtotal >= coupon.minimum_order_amount
        );

        if (eligibleCoupons.length > 0) {
          const selectedCoupon = eligibleCoupons[Math.floor(Math.random() * eligibleCoupons.length)];
          cart.applied_coupon_code = selectedCoupon.code;
          
          // Calculate discount
          if (selectedCoupon.discount_amount) {
            cart.coupon_discount_amount = Math.min(selectedCoupon.discount_amount, cartSubtotal);
          } else if (selectedCoupon.discount_percentage) {
            cart.coupon_discount_amount = Math.round((cartSubtotal * selectedCoupon.discount_percentage / 100) * 100) / 100;
          }
        }
      }

      // Calculate final cart total
      cart.cart_total_amount = Math.max(0, cartSubtotal - cart.coupon_discount_amount);
      cart.cart_total_amount = Math.round(cart.cart_total_amount * 100) / 100; // Round to 2 decimal places

      carts.push(cart);
    }

    console.log(`✅ Generated ${carts.length} carts with ${cartItems.length} total items`);
    console.log(`🛒 Active carts: ${carts.filter(c => c.cart_total_amount > 0).length}`);
    console.log(`⏰ Abandoned carts: ${carts.filter(c => c.cart_total_amount === 0 || Math.random() < ABANDONED_CART_RATE).length}`);
    console.log(`🎫 Carts with coupons: ${carts.filter(c => c.applied_coupon_code).length}`);

    return { carts, cartItems };

  } catch (error) {
    console.error('❌ Error generating cart data:', error.message);
    throw error;
  }
};

/**
 * Seed carts and cart items
 */
const seedCarts = async () => {
  try {
    console.log('🛒 Starting cart seeding...');

    // Generate data
    const { carts, cartItems } = await generateCartData();

    // Insert carts first
    console.log('💾 Inserting carts...');
    const createdCarts = await Cart.insertMany(carts, { ordered: false });
    console.log(`✅ Successfully inserted ${carts.length} carts`);

    // Insert cart items
    console.log('💾 Inserting cart items...');
    const createdCartItems = await CartItem.insertMany(cartItems, { ordered: false });
    console.log(`✅ Successfully inserted ${cartItems.length} cart items`);

    // Generate summary statistics
    const totalValue = carts.reduce((sum, cart) => sum + cart.cart_total_amount, 0);
    const avgCartValue = totalValue / carts.length;
    const avgItemsPerCart = cartItems.length / carts.length;

    console.log('\n📊 Cart Seeding Summary:');
    console.log(`   Total Carts: ${carts.length}`);
    console.log(`   Total Cart Items: ${cartItems.length}`);
    console.log(`   Total Cart Value: $${totalValue.toFixed(2)}`);
    console.log(`   Average Cart Value: $${avgCartValue.toFixed(2)}`);
    console.log(`   Average Items per Cart: ${avgItemsPerCart.toFixed(1)}`);
    console.log(`   Carts with Coupons: ${carts.filter(c => c.applied_coupon_code).length}`);

    return {
      count: carts.length,
      summary: `${carts.length} carts with ${cartItems.length} items created, total value: $${totalValue.toFixed(2)}`
    };

  } catch (error) {
    console.error('❌ Cart seeding failed:', error.message);
    throw error;
  }
};

/**
 * Clean carts and cart items
 */
const cleanCarts = async () => {
  try {
    console.log('🧹 Cleaning cart data...');
    
    const cartItemsDeleted = await CartItem.deleteMany({});
    const cartsDeleted = await Cart.deleteMany({});
    
    console.log(`✅ Cleaned ${cartItemsDeleted.deletedCount} cart items`);
    console.log(`✅ Cleaned ${cartsDeleted.deletedCount} carts`);
    
    return {
      count: cartItemsDeleted.deletedCount + cartsDeleted.deletedCount,
      summary: `${cartsDeleted.deletedCount} carts and ${cartItemsDeleted.deletedCount} cart items removed`
    };
  } catch (error) {
    console.error('❌ Cart cleaning failed:', error.message);
    throw error;
  }
};

module.exports = {
  seed: seedCarts,
  clean: cleanCarts,
  generateData: generateCartData
};
