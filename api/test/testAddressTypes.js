/**
 * Test script for Address Model with Billing/Shipping Types
 * Tests the new BILLING and SHIPPING address types
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Address = require('../models/Address');
const User = require('../models/User');

// Test address data with new types
const testAddresses = [
  {
    title: 'Primary Billing',
    type: 'BILLING',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '123 Finance Street',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'United States',
    is_default: true,
    delivery_instructions: 'For billing purposes only'
  },
  {
    title: 'Main Shipping',
    type: 'SHIPPING',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '456 Delivery Ave',
    address_line_2: 'Loading dock B',
    city: 'New York',
    state: 'NY',
    postal_code: '10002',
    country: 'United States',
    delivery_instructions: 'Use rear entrance for deliveries'
  },
  {
    title: 'Corporate Billing',
    type: 'BILLING',
    full_name: 'Jane Smith - Accounting',
    phone: '+1555123456',
    address_line_1: '789 Corporate Plaza',
    address_line_2: 'Accounting Department, Floor 15',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'United States',
    delivery_instructions: 'Attention: Accounts Payable'
  },
  {
    title: 'Express Shipping',
    type: 'SHIPPING',
    full_name: 'Bob Johnson',
    phone: '+1777888999',
    address_line_1: '321 Quick Street',
    landmark: 'Red building with express mailbox',
    city: 'Austin',
    state: 'TX',
    postal_code: '73301',
    country: 'United States',
    delivery_instructions: 'Expedited delivery location'
  }
];

/**
 * Test the new address types
 */
const testAddressTypes = async () => {
  try {
    console.log('🧪 Testing Address Model with new BILLING and SHIPPING types...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get a test user
    let testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
      // Create a test user if none exists
      testUser = new User({
        name: 'Test User for Addresses',
        email: 'testaddresses@example.com',
        password: 'hashedpassword123',
        role: 'user'
      });
      await testUser.save();
      console.log('👤 Created test user');
    } else {
      console.log('👤 Using existing test user:', testUser.name);
    }

    // Clean up existing test addresses
    await Address.deleteMany({ 
      user_id: testUser._id,
      title: { $in: testAddresses.map(addr => addr.title) }
    });

    console.log('\n🏗️  Creating addresses with new types...');

    const createdAddresses = [];
    for (const addressData of testAddresses) {
      const address = new Address({
        ...addressData,
        user_id: testUser._id
      });

      try {
        await address.save();
        createdAddresses.push(address);
        console.log(`✅ Created ${address.type} address: "${address.title}"`);
      } catch (error) {
        console.error(`❌ Failed to create address "${addressData.title}":`, error.message);
      }
    }

    console.log(`\n📊 Created ${createdAddresses.length} addresses`);

    // Test querying by different types
    console.log('\n🔍 Testing queries by address type:');

    const billingAddresses = await Address.find({ 
      user_id: testUser._id, 
      type: 'BILLING' 
    });
    console.log(`💳 Found ${billingAddresses.length} BILLING addresses`);

    const shippingAddresses = await Address.find({ 
      user_id: testUser._id, 
      type: 'SHIPPING' 
    });
    console.log(`📦 Found ${shippingAddresses.length} SHIPPING addresses`);

    const homeAddresses = await Address.find({ 
      user_id: testUser._id, 
      type: 'HOME' 
    });
    console.log(`🏠 Found ${homeAddresses.length} HOME addresses`);

    const officeAddresses = await Address.find({ 
      user_id: testUser._id, 
      type: 'OFFICE' 
    });
    console.log(`🏢 Found ${officeAddresses.length} OFFICE addresses`);

    const otherAddresses = await Address.find({ 
      user_id: testUser._id, 
      type: 'OTHER' 
    });
    console.log(`📍 Found ${otherAddresses.length} OTHER addresses`);

    // Test the static method with type filtering
    console.log('\n🧪 Testing getUserAddresses with type filtering:');

    const userBillingAddresses = await Address.getUserAddresses(testUser._id, {
      type: 'BILLING'
    });
    console.log(`💳 getUserAddresses found ${userBillingAddresses.length} BILLING addresses`);

    const userShippingAddresses = await Address.getUserAddresses(testUser._id, {
      type: 'SHIPPING'
    });
    console.log(`📦 getUserAddresses found ${userShippingAddresses.length} SHIPPING addresses`);

    // Test validation - try invalid type
    console.log('\n🚫 Testing validation with invalid type:');
    try {
      const invalidAddress = new Address({
        user_id: testUser._id,
        title: 'Invalid Type Test',
        type: 'INVALID_TYPE', // This should fail
        full_name: 'Test User',
        phone: '+1234567890',
        address_line_1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'Test Country'
      });
      await invalidAddress.save();
      console.log('❌ Validation failed - invalid type was accepted');
    } catch (error) {
      console.log('✅ Validation working - invalid type rejected:', error.message);
    }

    // Show formatted addresses
    console.log('\n📋 Sample formatted addresses:');
    for (const address of createdAddresses.slice(0, 2)) {
      console.log(`${address.type}: ${address.formatted_address}`);
    }

    console.log('\n🎉 Address type testing completed successfully!');
    
    // Summary of all address types in the system
    const allTypes = await Address.aggregate([
      { $match: { user_id: testUser._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          titles: { $push: '$title' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📈 Address Type Summary:');
    allTypes.forEach(typeGroup => {
      console.log(`   ${typeGroup._id}: ${typeGroup.count} addresses`);
      typeGroup.titles.forEach(title => {
        console.log(`     - ${title}`);
      });
    });

  } catch (error) {
    console.error('❌ Error testing address types:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testAddressTypes();
}

module.exports = { testAddressTypes };
