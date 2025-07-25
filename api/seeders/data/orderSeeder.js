/**
 * Order Seeder
 * Seeds orders with references to users and product variants
 */

const { faker } = require('@faker-js/faker');
const User = require('../../models/User');
const ProductVariant = require('../../models/ProductVariant');
const Order = require('../../models/Order');

/**
 * Generate realistic address
 */
const generateAddress = () => ({
  full_name: faker.person.fullName(),
  address_line1: faker.location.streetAddress(),
  address_line2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
  city: faker.location.city(),
  state: faker.location.state(),
  pincode: faker.string.numeric(6),
  country: 'India',
  phone_number: faker.phone.number('+91 ##########')
});

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

/**
 * Seed orders
 */
const seed = async () => {
  try {
    console.log('🛍️ Starting order seeding...');
    
    const userCount = await User.countDocuments({ isActive: true });
    const variantCount = await ProductVariant.countDocuments({ is_active: true });
    
    if (userCount === 0) {
      throw new Error('No active users found. Please seed users first.');
    }
    
    if (variantCount === 0) {
      throw new Error('No active product variants found. Please seed products first.');
    }
    
    console.log(`✅ Found ${userCount} users and ${variantCount} product variants`);
    
    // Clean existing orders
    const existingCount = await Order.countDocuments();
    if (existingCount > 0) {
      console.log(`🧹 Cleaning ${existingCount} existing orders...`);
      await Order.deleteMany({});
    }
    
    // Get users and product variants
    const users = await User.find({ isActive: true });
    const productVariants = await ProductVariant.find({ is_active: true });
    
    const orders = [];
    const orderCount = 50;
    
    for (let i = 0; i < orderCount; i++) {
      const user = faker.helpers.arrayElement(users);
      const shippingAddress = generateAddress();
      const billingAddress = faker.helpers.maybe(() => generateAddress(), { probability: 0.3 }) || shippingAddress;
      
      // Calculate amounts
      const subtotal = faker.number.float({ min: 50, max: 500, multipleOf: 0.01 });
      const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
      const shippingCost = subtotal > 100 ? 0 : 15;
      const discountAmount = faker.helpers.maybe(() => faker.number.float({ min: 5, max: 50, multipleOf: 0.01 }), { probability: 0.2 }) || 0;
      const grandTotal = Math.round((subtotal + taxAmount + shippingCost - discountAmount) * 100) / 100;
      
      const orderNumber = generateOrderNumber();
      console.log(`Generated order number: ${orderNumber}`);
      
      const orderData = {
        user_id: user._id,
        order_number: orderNumber,
        shipping_address: shippingAddress,
        billing_address: faker.datatype.boolean(0.7) ? shippingAddress : billingAddress,
        payment_method_id: null, // Will be set when payment methods are implemented
        payment_status: faker.helpers.arrayElement(['PENDING', 'PAID', 'FAILED']),
        order_status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
        subtotal_amount: subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        grand_total_amount: grandTotal,
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        tracking_number: faker.datatype.boolean(0.6) ? faker.string.alphanumeric(12).toUpperCase() : null
      };
      
      orders.push(orderData);
    }
    
    console.log('💾 Inserting orders into database...');
    const result = [];
    
    for (const orderData of orders) {
      try {
        const order = new Order(orderData);
        const savedOrder = await order.save();
        result.push(savedOrder);
      } catch (error) {
        console.log(`⚠️ Skipping duplicate order: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully seeded ${result.length} orders`);
    
    return { count: result.length };
    
  } catch (error) {
    console.error('❌ Error seeding orders:', error.message);
    throw error;
  }
};

/**
 * Clean orders
 */
const clean = async () => {
  try {
    const count = await Order.countDocuments();
    await Order.deleteMany({});
    console.log(`🧹 Cleaned ${count} orders`);
    return { count };
  } catch (error) {
    console.error('❌ Error cleaning orders:', error.message);
    throw error;
  }
};

module.exports = {
  seed,
  clean
};
