/**
 * Order Item Seeder
 * Creates individual order items for existing orders
 * Uses separate OrderItem collection for enhanced scalability and analytics
 */

const { faker } = require('@faker-js/faker');
const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const Product = require('../../models/Product');
const ProductVariant = require('../../models/ProductVariant');

/**
 * Generate order items for existing orders
 */
const generateOrderItemsData = async () => {
  try {
    console.log('🛍️ Generating order items for existing orders...');
    
    // Get all orders
    const orders = await Order.find({});
    console.log(`📊 Found ${orders.length} orders`);
    
    if (orders.length === 0) {
      console.log('⚠️ No orders found. Please seed orders first.');
      return [];
    }
    
    // Get product variants for order items (with product names)
    const productVariants = await ProductVariant.find({ is_active: true }).populate('product_id', 'name');
    console.log(`📦 Found ${productVariants.length} product variants`);
    
    if (productVariants.length === 0) {
      throw new Error('No active product variants found. Please seed products first.');
    }
    
    const orderItems = [];
    
    for (const order of orders) {
      // Generate 1-5 items per order
      const itemCount = faker.number.int({ min: 1, max: Math.min(5, productVariants.length) });
      const selectedVariants = faker.helpers.arrayElements(productVariants, itemCount);
      
      for (const variant of selectedVariants) {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const priceAtOrder = variant.price;
        
        // Create realistic price variations (historical pricing)
        const priceVariation = faker.helpers.maybe(
          () => faker.number.float({ min: 0.8, max: 1.2, precision: 0.01 }),
          { probability: 0.3 }
        ) || 1;
        
        const historicalPrice = priceAtOrder * priceVariation;
        
        orderItems.push({
          order_id: order._id,
          product_variant_id: variant._id,
          sku_code: variant.sku_code,
          product_name: variant.product_id?.name || 'Unknown Product',
          variant_options: variant.options || [],
          quantity: quantity,
          price: historicalPrice,
          subtotal: quantity * historicalPrice
        });
      }
    }
    
    console.log(`✅ Generated ${orderItems.length} order items for ${orders.length} orders`);
    return orderItems;
    
  } catch (error) {
    console.error('❌ Error generating order items data:', error.message);
    throw error;
  }
};

/**
 * Seed order items
 */
const seedOrderItems = async () => {
  try {
    console.log('🛍️ Starting order items seeding...');
    
    // Check if order items already exist
    const existingCount = await OrderItem.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing order items. Cleaning first...`);
      await OrderItem.deleteMany({});
    }
    
    // Generate order items data
    const orderItemsData = await generateOrderItemsData();
    
    if (orderItemsData.length === 0) {
      console.log('⚠️ No order items data generated. Skipping seeding.');
      return;
    }
    
    // Insert order items
    console.log('💾 Inserting order items...');
    console.log('Sample order item data:', JSON.stringify(orderItemsData[0], null, 2));
    let insertedItems = [];
    
    try {
      insertedItems = await OrderItem.insertMany(orderItemsData, { ordered: false });
      console.log(`✅ Successfully inserted ${insertedItems.length} order items`);
    } catch (error) {
      console.error('❌ Error inserting order items:', error.message);
      console.log('Error details:', error);
      throw error;
    }
    
    // Update order totals based on order items
    console.log('💰 Updating order totals...');
    await updateOrderTotals();
    
    // Generate summary
    const stats = await generateOrderItemsStats();
    console.log('\n📊 Order Items Seeding Summary:');
    console.log(`   Total Order Items: ${stats.total_items}`);
    console.log(`   Orders with Items: ${stats.orders_with_items}`);
    console.log(`   Total Order Value: $${stats.total_value.toFixed(2)}`);
    console.log(`   Average Order Value: $${stats.average_order_value.toFixed(2)}`);
    console.log(`   Average Items per Order: ${stats.average_items_per_order.toFixed(1)}`);
    
  } catch (error) {
    console.error('❌ Error seeding order items:', error.message);
    throw error;
  }
};

/**
 * Update order totals based on order items
 */
const updateOrderTotals = async () => {
  try {
    const orders = await Order.find({});
    
    for (const order of orders) {
      const orderItems = await OrderItem.find({ order_id: order._id });
      
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.08; // 8% tax
      const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
      const discount = order.discount_amount || 0;
      const total = subtotal + tax + shipping - discount;
      
      await Order.findByIdAndUpdate(order._id, {
        subtotal_amount: subtotal,
        tax_amount: tax,
        shipping_cost: shipping,
        grand_total_amount: total,
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Updated totals for ${orders.length} orders`);
    
  } catch (error) {
    console.error('❌ Error updating order totals:', error.message);
    throw error;
  }
};

/**
 * Generate order items statistics
 */
const generateOrderItemsStats = async () => {
  try {
    const totalItems = await OrderItem.countDocuments();
    const ordersWithItems = await OrderItem.distinct('order_id').then(ids => ids.length);
    
    const valueStats = await OrderItem.aggregate([
      {
        $group: {
          _id: null,
          total_value: { $sum: '$subtotal' },
          avg_item_value: { $avg: '$subtotal' }
        }
      }
    ]);
    
    const orderStats = await OrderItem.aggregate([
      {
        $group: {
          _id: '$order_id',
          item_count: { $sum: 1 },
          order_value: { $sum: '$total_price' }
        }
      },
      {
        $group: {
          _id: null,
          avg_items_per_order: { $avg: '$item_count' },
          avg_order_value: { $avg: '$order_value' }
        }
      }
    ]);
    
    return {
      total_items: totalItems,
      orders_with_items: ordersWithItems,
      total_value: valueStats[0]?.total_value || 0,
      average_item_value: valueStats[0]?.avg_item_value || 0,
      average_items_per_order: orderStats[0]?.avg_items_per_order || 0,
      average_order_value: orderStats[0]?.avg_order_value || 0
    };
    
  } catch (error) {
    console.error('❌ Error generating order items stats:', error.message);
    return {
      total_items: 0,
      orders_with_items: 0,
      total_value: 0,
      average_item_value: 0,
      average_items_per_order: 0,
      average_order_value: 0
    };
  }
};

/**
 * Clean order items
 */
const cleanOrderItems = async () => {
  try {
    const count = await OrderItem.countDocuments();
    await OrderItem.deleteMany({});
    console.log(`🧹 Cleaned ${count} order items`);
    
    // Reset order totals
    await Order.updateMany({}, {
      subtotal_amount: 0,
      tax_amount: 0,
      shipping_amount: 0,
      total_amount: 0
    });
    
    console.log('🧹 Reset order totals');
    return { count };
    
  } catch (error) {
    console.error('❌ Error cleaning order items:', error.message);
    throw error;
  }
};

module.exports = {
  seed: seedOrderItems,
  clean: cleanOrderItems,
  generateData: generateOrderItemsData
};
