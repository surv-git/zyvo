/**
 * Cart Items Seeder
 * Adds items to existing shopping carts
 * Designed to work with existing carts without modifying cart records
 */

const mongoose = require('mongoose');
const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const ProductVariant = require('../../models/ProductVariant');

/**
 * Generate cart items for existing carts
 */
const generateCartItemsData = async () => {
  try {
    console.log('🛒 Generating cart items for existing carts...');

    // Get existing carts
    const carts = await Cart.find({}, '_id user_id').lean();
    const productVariants = await ProductVariant.find(
      { is_active: true }, 
      '_id price'
    ).lean();

    if (carts.length === 0) {
      throw new Error('No carts found. Please create carts first.');
    }

    if (productVariants.length === 0) {
      throw new Error('No active product variants found. Please seed product variants first.');
    }

    console.log(`📊 Found ${carts.length} carts and ${productVariants.length} product variants`);

    // Cart item generation parameters
    const EMPTY_CART_RATE = 0.25; // 25% of carts remain empty (abandoned)
    const MIN_ITEMS_PER_CART = 1;
    const MAX_ITEMS_PER_CART = 6;

    const cartItems = [];
    const cartUpdates = []; // Track which carts need total recalculation

    for (const cart of carts) {
      // Decide if this cart should remain empty (abandoned)
      if (Math.random() < EMPTY_CART_RATE) {
        continue; // Skip this cart, keep it empty
      }

      // Generate number of items for this cart
      const numItems = Math.floor(Math.random() * (MAX_ITEMS_PER_CART - MIN_ITEMS_PER_CART + 1)) + MIN_ITEMS_PER_CART;
      const selectedVariants = new Set();
      let cartSubtotal = 0;

      // Generate creation time (within last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      for (let i = 0; i < numItems; i++) {
        let selectedVariant;
        
        // Ensure no duplicate variants in same cart
        do {
          selectedVariant = productVariants[Math.floor(Math.random() * productVariants.length)];
        } while (selectedVariants.has(selectedVariant._id.toString()) && selectedVariants.size < productVariants.length);
        
        selectedVariants.add(selectedVariant._id.toString());

        // Generate realistic quantity (bias toward 1-2 items)
        const quantity = Math.random() < 0.8 ? 
          Math.floor(Math.random() * 2) + 1 : // 1-2 items (80% chance)
          Math.floor(Math.random() * 4) + 3;  // 3-6 items (20% chance)

        // Generate item added date (random within last 7 days)
        const itemAddedAt = new Date(
          sevenDaysAgo.getTime() + 
          Math.random() * (now.getTime() - sevenDaysAgo.getTime())
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

      // Track cart for total update
      if (cartSubtotal > 0) {
        cartUpdates.push({
          cart_id: cart._id,
          new_total: Math.round(cartSubtotal * 100) / 100
        });
      }
    }

    console.log(`✅ Generated ${cartItems.length} cart items for ${cartUpdates.length} carts`);
    console.log(`📊 Empty carts: ${carts.length - cartUpdates.length} (${Math.round((carts.length - cartUpdates.length) / carts.length * 100)}%)`);

    return { cartItems, cartUpdates };

  } catch (error) {
    console.error('❌ Error generating cart items data:', error.message);
    throw error;
  }
};

/**
 * Seed cart items into existing carts
 */
const seedCartItems = async () => {
  try {
    console.log('🛒 Starting cart items seeding...');

    // Generate data
    const { cartItems, cartUpdates } = await generateCartItemsData();

    if (cartItems.length === 0) {
      console.log('⚠️  No cart items to seed');
      return {
        count: 0,
        summary: 'No cart items created'
      };
    }

    // Insert cart items
    console.log('💾 Inserting cart items...');
    const createdCartItems = await CartItem.insertMany(cartItems, { ordered: false });
    console.log(`✅ Successfully inserted ${createdCartItems.length} cart items`);

    // Update cart totals
    console.log('💰 Updating cart totals...');
    for (const update of cartUpdates) {
      await Cart.findByIdAndUpdate(cartId, {
        cart_total_amount: totalAmount,
        last_updated_at: new Date()
      });
    }
    console.log(`✅ Updated totals for ${cartUpdates.length} carts`);

    // Generate summary statistics
    const totalValue = cartUpdates.reduce((sum, update) => sum + update.new_total, 0);
    const avgCartValue = cartUpdates.length > 0 ? totalValue / cartUpdates.length : 0;
    const avgItemsPerCart = cartItems.length / cartUpdates.length;

    console.log('\n📊 Cart Items Seeding Summary:');
    console.log(`   Total Cart Items: ${cartItems.length}`);
    console.log(`   Carts with Items: ${cartUpdates.length}`);
    console.log(`   Empty Carts: ${53 - cartUpdates.length}`);
    console.log(`   Total Cart Value: $${totalValue.toFixed(2)}`);
    console.log(`   Average Cart Value: $${avgCartValue.toFixed(2)}`);
    console.log(`   Average Items per Active Cart: ${avgItemsPerCart.toFixed(1)}`);

    return {
      count: cartItems.length,
      summary: `${cartItems.length} cart items created across ${cartUpdates.length} carts, total value: $${totalValue.toFixed(2)}`
    };

  } catch (error) {
    console.error('❌ Cart items seeding failed:', error.message);
    throw error;
  }
};

/**
 * Clean cart items
 */
const cleanCartItems = async () => {
  try {
    console.log('🧹 Cleaning cart items...');
    
    const cartItemsDeleted = await CartItem.deleteMany({});
    
    // Reset all cart totals to 0
    await Cart.updateMany({}, { 
      cart_total_amount: 0,
      updated_at: new Date()
    });
    
    console.log(`✅ Cleaned ${cartItemsDeleted.deletedCount} cart items`);
    console.log(`✅ Reset cart totals for all carts`);
    
    return {
      count: cartItemsDeleted.deletedCount,
      summary: `${cartItemsDeleted.deletedCount} cart items removed and cart totals reset`
    };
  } catch (error) {
    console.error('❌ Cart items cleaning failed:', error.message);
    throw error;
  }
};

module.exports = {
  seed: seedCartItems,
  clean: cleanCartItems,
  generateData: generateCartItemsData
};
