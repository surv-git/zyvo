/**
 * Seed script for Address Management System
 * Creates sample addresses for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Address = require('../models/Address');
const User = require('../models/User');

// Sample address data
const sampleAddresses = [
  {
    title: 'Home Sweet Home',
    type: 'HOME',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '123 Main Street',
    address_line_2: 'Apt 4B',
    landmark: 'Near Central Park',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'United States',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    is_default: true,
    delivery_instructions: 'Ring the doorbell twice',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  },
  {
    title: 'Office Address',
    type: 'OFFICE',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '456 Business Ave',
    address_line_2: 'Floor 12, Suite 1201',
    landmark: 'Near Wall Street',
    city: 'New York',
    state: 'NY',
    postal_code: '10005',
    country: 'United States',
    coordinates: {
      latitude: 40.7074,
      longitude: -74.0113
    },
    is_default: false,
    delivery_instructions: 'Ask for John at reception',
    is_verified: true,
    verification_source: 'MANUAL'
  },
  {
    title: 'Parents House',
    type: 'HOME',
    full_name: 'John Doe',
    phone: '+1987654321',
    address_line_1: '789 Oak Street',
    city: 'Brooklyn',
    state: 'NY',
    postal_code: '11201',
    country: 'United States',
    coordinates: {
      latitude: 40.6892,
      longitude: -73.9442
    },
    is_default: false,
    delivery_instructions: 'Leave with neighbor if not home',
    is_verified: false,
    verification_source: 'USER_CONFIRMED'
  },
  {
    title: 'Vacation Home',
    type: 'OTHER',
    full_name: 'John Doe',
    phone: '+1555123456',
    address_line_1: '321 Beach Road',
    address_line_2: 'Unit 7A',
    landmark: 'Ocean view building',
    city: 'Miami Beach',
    state: 'FL',
    postal_code: '33139',
    country: 'United States',
    coordinates: {
      latitude: 25.7907,
      longitude: -80.1300
    },
    is_default: false,
    delivery_instructions: 'Call before delivery',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  },
  {
    title: 'Billing Address',
    type: 'BILLING',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '100 Finance Street',
    address_line_2: 'Suite 400',
    city: 'New York',
    state: 'NY',
    postal_code: '10004',
    country: 'United States',
    coordinates: {
      latitude: 40.7054,
      longitude: -74.0113
    },
    is_default: false,
    delivery_instructions: 'For billing correspondence only',
    is_verified: true,
    verification_source: 'MANUAL'
  },
  {
    title: 'Primary Shipping',
    type: 'SHIPPING',
    full_name: 'John Doe',
    phone: '+1234567890',
    address_line_1: '123 Main Street',
    address_line_2: 'Apt 4B',
    landmark: 'Near Central Park',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'United States',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    is_default: false,
    delivery_instructions: 'Ring the doorbell twice',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  }
];

// Additional sample addresses for different users
const moreAddresses = [
  {
    title: 'Home Base',
    type: 'HOME',
    full_name: 'Alice Johnson',
    phone: '+1555987654',
    address_line_1: '555 Pine Street',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'United States',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    is_default: true,
    delivery_instructions: 'Buzz apartment 12',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  },
  {
    title: 'Work Place',
    type: 'OFFICE',
    full_name: 'Alice Johnson',
    phone: '+1555987654',
    address_line_1: '777 Tech Blvd',
    address_line_2: 'Building C, 3rd Floor',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'United States',
    coordinates: {
      latitude: 37.7849,
      longitude: -122.4094
    },
    is_default: false,
    delivery_instructions: 'Reception desk',
    is_verified: true,
    verification_source: 'MANUAL'
  },
  {
    title: 'Temporary Stay',
    type: 'OTHER',
    full_name: 'Bob Smith',
    phone: '+1777123456',
    address_line_1: '999 Hotel Drive',
    address_line_2: 'Room 501',
    city: 'Los Angeles',
    state: 'CA',
    postal_code: '90210',
    country: 'United States',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    },
    is_default: false,
    delivery_instructions: 'Leave at front desk',
    is_verified: false,
    verification_source: 'USER_CONFIRMED'
  },
  {
    title: 'Family Home',
    type: 'HOME',
    full_name: 'Carol Williams',
    phone: '+1888765432',
    address_line_1: '111 Maple Avenue',
    landmark: 'Red brick house',
    city: 'Austin',
    state: 'TX',
    postal_code: '73301',
    country: 'United States',
    coordinates: {
      latitude: 30.2672,
      longitude: -97.7431
    },
    is_default: true,
    delivery_instructions: 'Side door if no answer',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  },
  {
    title: 'Studio Apartment',
    type: 'HOME',
    full_name: 'David Brown',
    phone: '+1999654321',
    address_line_1: '222 Artist Lane',
    address_line_2: 'Studio 3B',
    landmark: 'Above coffee shop',
    city: 'Portland',
    state: 'OR',
    postal_code: '97201',
    country: 'United States',
    coordinates: {
      latitude: 45.5152,
      longitude: -122.6784
    },
    is_default: true,
    delivery_instructions: 'Ring buzzer for 3B',
    is_verified: false,
    verification_source: 'USER_CONFIRMED'
  },
  {
    title: 'Corporate Billing',
    type: 'BILLING',
    full_name: 'Emily Davis - Finance',
    phone: '+1333444555',
    address_line_1: '500 Corporate Drive',
    address_line_2: 'Finance Department',
    city: 'Chicago',
    state: 'IL',
    postal_code: '60601',
    country: 'United States',
    coordinates: {
      latitude: 41.8781,
      longitude: -87.6298
    },
    is_default: false,
    delivery_instructions: 'Attention: Accounts Payable',
    is_verified: true,
    verification_source: 'MANUAL'
  },
  {
    title: 'Express Shipping Hub',
    type: 'SHIPPING',
    full_name: 'Michael Wilson',
    phone: '+1666777888',
    address_line_1: '789 Logistics Blvd',
    address_line_2: 'Warehouse C, Dock 12',
    landmark: 'Blue building with loading docks',
    city: 'Phoenix',
    state: 'AZ',
    postal_code: '85001',
    country: 'United States',
    coordinates: {
      latitude: 33.4484,
      longitude: -112.0740
    },
    is_default: false,
    delivery_instructions: 'Use commercial entrance, ask for receiving dept',
    is_verified: true,
    verification_source: 'GOOGLE_MAPS'
  }
];

/**
 * Seed addresses for existing users
 */
const seedAddresses = async () => {
  try {
    console.log('🌱 Starting address seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing addresses
    const deleteResult = await Address.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing addresses`);

    // Get some users to assign addresses to
    const users = await User.find({ role: 'user' }).limit(5);
    console.log(`👥 Found ${users.length} users for address assignment`);

    if (users.length === 0) {
      console.log('❌ No users found. Please run user seeding first.');
      return;
    }

    let addressCount = 0;
    let allAddresses = [...sampleAddresses, ...moreAddresses];
    
    // Assign addresses to users
    for (let i = 0; i < users.length && i < allAddresses.length; i++) {
      const user = users[i];
      
      // Give each user 1-3 addresses
      const numAddresses = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numAddresses && (i * 3 + j) < allAddresses.length; j++) {
        const addressData = { ...allAddresses[i * 2 + j] };
        addressData.user_id = user._id;
        
        // Randomize some properties
        addressData.usage_count = Math.floor(Math.random() * 10);
        addressData.last_used_at = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
        
        const address = new Address(addressData);
        await address.save();
        addressCount++;
        
        console.log(`📍 Created address "${addressData.title}" for user ${user.name}`);
      }
    }

    console.log(`\n🎉 Address seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Created ${addressCount} addresses`);
    console.log(`   - Assigned to ${users.length} users`);
    console.log(`   - Address types: HOME, OFFICE, OTHER`);
    console.log(`   - Includes coordinates, verification, and usage data`);

    // Display some statistics
    const stats = await Address.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgUsage: { $avg: '$usage_count' }
        }
      }
    ]);

    console.log(`\n📈 Address Statistics:`);
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} addresses (avg usage: ${stat.avgUsage.toFixed(1)})`);
    });

    const verifiedCount = await Address.countDocuments({ is_verified: true });
    const defaultCount = await Address.countDocuments({ is_default: true });
    
    console.log(`   - Verified addresses: ${verifiedCount}`);
    console.log(`   - Default addresses: ${defaultCount}`);

  } catch (error) {
    console.error('❌ Error seeding addresses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAddresses();
}

module.exports = { seedAddresses };
