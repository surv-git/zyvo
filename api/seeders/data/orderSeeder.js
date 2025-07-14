/**
 * Order Seeder
 * Seeds orders with references to users and products
 */

const { faker } = require('@faker-js/faker');
const User = require('../../models/User');
const Product = require('../../models/Product');

/**
 * Payment methods with weights
 */
const PAYMENT_METHODS = [
  { method: 'credit_card', weight: 40 },
  { method: 'debit_card', weight: 25 },
  { method: 'paypal', weight: 20 },
  { method: 'bank_transfer', weight: 10 },
  { method: 'cash_on_delivery', weight: 5 }
];

/**
 * Order statuses with weights
 */
const ORDER_STATUSES = [
  { status: 'pending', weight: 10 },
  { status: 'confirmed', weight: 15 },
  { status: 'processing', weight: 20 },
  { status: 'shipped', weight: 25 },
  { status: 'delivered', weight: 25 },
  { status: 'cancelled', weight: 4 },
  { status: 'refunded', weight: 1 }
];

/**
 * Payment statuses with weights
 */
const PAYMENT_STATUSES = [
  { status: 'pending', weight: 10 },
  { status: 'paid', weight: 85 },
  { status: 'failed', weight: 3 },
  { status: 'refunded', weight: 1 },
  { status: 'partially_refunded', weight: 1 }
];

/**
 * Generate shipping address
 */
const generateAddress = () => ({
  fullName: faker.person.fullName(),
  addressLine1: faker.location.streetAddress(),
  addressLine2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
  city: faker.location.city(),
  state: faker.location.state(),
  postalCode: faker.location.zipCode(),
  country: faker.location.country(),
  phone: faker.phone.number()
});

/**
 * Generate order items from available products
 */
const generateOrderItems = async (maxItems = 5) => {
  const products = await Product.find({ isActive: true, stock: { $gt: 0 } }).limit(50);
  
  if (products.length === 0) {
    throw new Error('No active products with stock found. Please seed products first.');
  }
  
  const itemCount = faker.number.int({ min: 1, max: Math.min(maxItems, products.length) });
  const selectedProducts = faker.helpers.arrayElements(products, itemCount);
  
  return selectedProducts.map(product => {
    const quantity = faker.number.int({ min: 1, max: Math.min(5, product.stock) });
    const unitPrice = product.price;
    const totalPrice = quantity * unitPrice;
    
    return {
      product: product._id,
      productSnapshot: {
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        sku: product.sku
      },
      quantity,
      unitPrice,
      totalPrice
    };
  });
};

/**
 * Generate status history for completed orders
 */
const generateStatusHistory = (currentStatus) => {
  const history = [];
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  
  let currentIndex = statuses.indexOf(currentStatus);
  if (currentIndex === -1) {
    // For cancelled/refunded orders, they could have stopped at any stage
    currentIndex = faker.number.int({ min: 0, max: statuses.length - 1 });
  }
  
  for (let i = 0; i <= currentIndex; i++) {
    history.push({
      status: statuses[i],
      timestamp: faker.date.recent({ days: 30 }),
      notes: `Order ${statuses[i]}`
    });
  }
  
  return history;
};

/**
 * Generate sample orders
 */
const generateOrders = async (count = 200) => {
  const orders = [];
  
  // Get users and products
  const users = await User.find({ isActive: true });
  const products = await Product.find({ isActive: true, stock: { $gt: 0 } });
  
  if (users.length === 0) {
    throw new Error('No active users found. Please seed users first.');
  }
  
  if (products.length === 0) {
    throw new Error('No active products with stock found. Please seed products first.');
  }
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const items = await generateOrderItems();
    
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const discount = faker.helpers.maybe(() => faker.number.float({ min: 5, max: 50, precision: 0.01 }), { probability: 0.2 }) || 0;
    const total = subtotal + tax + shipping - discount;
    
    const paymentMethod = faker.helpers.weightedArrayElement(PAYMENT_METHODS.map(pm => ({ weight: pm.weight, value: pm.method })));
    const orderStatus = faker.helpers.weightedArrayElement(ORDER_STATUSES.map(os => ({ weight: os.weight, value: os.status })));
    const paymentStatus = faker.helpers.weightedArrayElement(PAYMENT_STATUSES.map(ps => ({ weight: ps.weight, value: ps.status })));
    
    const shippingAddress = generateAddress();
    const billingAddress = faker.helpers.maybe(() => generateAddress(), { probability: 0.3 }) || shippingAddress;
    
    const order = {
      user: user._id,
      items,
      status: orderStatus,
      paymentStatus,
      paymentMethod,
      paymentDetails: {
        transactionId: faker.string.alphanumeric(20),
        gateway: faker.helpers.arrayElement(['stripe', 'paypal', 'square']),
        gatewayResponse: {
          success: true,
          timestamp: faker.date.recent({ days: 30 })
        }
      },
      shippingAddress,
      billingAddress,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      currency: 'USD',
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      internalNotes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
      trackingNumber: ['shipped', 'delivered'].includes(orderStatus) ? faker.string.alphanumeric(12).toUpperCase() : undefined,
      shippingCarrier: ['shipped', 'delivered'].includes(orderStatus) ? faker.helpers.arrayElement(['UPS', 'FedEx', 'DHL', 'USPS']) : undefined,
      estimatedDelivery: ['confirmed', 'processing', 'shipped'].includes(orderStatus) ? faker.date.future({ days: 7 }) : undefined,
      actualDelivery: orderStatus === 'delivered' ? faker.date.recent({ days: 7 }) : undefined,
      cancelledAt: orderStatus === 'cancelled' ? faker.date.recent({ days: 14 }) : undefined,
      cancellationReason: orderStatus === 'cancelled' ? faker.helpers.arrayElement(['Customer request', 'Payment failed', 'Out of stock', 'Other']) : undefined,
      refundAmount: orderStatus === 'refunded' ? total : (paymentStatus === 'partially_refunded' ? total * 0.5 : 0),
      refundedAt: ['refunded', 'partially_refunded'].includes(paymentStatus) ? faker.date.recent({ days: 14 }) : undefined,
      statusHistory: generateStatusHistory(orderStatus)
    };
    
    orders.push(order);
  }
  
  return orders;
};

/**
 * Seed orders table
 */
const seed = async (OrderModel) => {
  try {
    console.log('   🔍 Checking for users and products...');
    
    const userCount = await User.countDocuments({ isActive: true });
    const productCount = await Product.countDocuments({ isActive: true, stock: { $gt: 0 } });
    
    if (userCount === 0) {
      throw new Error('No active users found. Please seed users first.');
    }
    
    if (productCount === 0) {
      throw new Error('No active products with stock found. Please seed products first.');
    }
    
    console.log(`   ✅ Found ${userCount} users and ${productCount} products`);
    console.log('   📝 Generating order data...');
    
    const orders = await generateOrders(200);
    
    console.log('   💾 Inserting orders into database...');
    const result = await OrderModel.insertMany(orders);
    
    // Calculate statistics
    const statusStats = {};
    const paymentStats = {};
    let totalRevenue = 0;
    
    result.forEach(order => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
      paymentStats[order.paymentStatus] = (paymentStats[order.paymentStatus] || 0) + 1;
      if (order.paymentStatus === 'paid') {
        totalRevenue += order.total;
      }
    });
    
    const avgOrderValue = totalRevenue / (paymentStats.paid || 1);
    
    return {
      count: result.length,
      summary: `$${totalRevenue.toFixed(2)} revenue, avg $${avgOrderValue.toFixed(2)}. Status: ${Object.entries(statusStats).map(([status, count]) => `${status}(${count})`).join(', ')}`
    };
    
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new Error(`Duplicate ${duplicateField} found. Some orders may already exist.`);
    }
    throw error;
  }
};

/**
 * Clean orders table
 */
const clean = async (OrderModel) => {
  const count = await OrderModel.countDocuments();
  await OrderModel.deleteMany({});
  return { count };
};

/**
 * Get sample order data for testing
 */
const getSampleOrders = () => {
  return [
    {
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      subtotal: 99.99,
      tax: 8.00,
      shipping: 15.00,
      total: 122.99
    },
    {
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'paypal',
      subtotal: 249.99,
      tax: 20.00,
      shipping: 0.00,
      total: 269.99
    },
    {
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'debit_card',
      subtotal: 49.99,
      tax: 4.00,
      shipping: 15.00,
      total: 68.99
    }
  ];
};

module.exports = {
  seed,
  clean,
  getSampleOrders,
  generateOrders
};
