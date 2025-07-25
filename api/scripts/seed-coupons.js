#!/usr/bin/env node

/**
 * Quick Coupon Seeder Script
 * A standalone script to quickly seed coupon data for testing
 * 
 * Usage:
 *   npm run seed:coupons
 *   node scripts/seed-coupons.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const couponSeeder = require('../seeders/data/couponSeeder');

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Disconnect from database
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
}

// Main seeding function
async function main() {
  try {
    console.log('🚀 Starting coupon seeding process...\n');
    
    await connectDB();
    
    // Seed coupon data
    const result = await couponSeeder.seedCoupons();
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   📋 Coupon Campaigns: ${result.campaigns.length}`);
    console.log(`   🎫 User Coupons: ${result.userCoupons.length}`);
    console.log('\n✅ Coupon seeding completed successfully!');
    
    // Display some sample data for testing
    console.log('\n🔍 Sample Data for Testing:');
    console.log('\n📋 Available Coupon Campaigns:');
    result.campaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. ${campaign.name} (${campaign.code_prefix})`);
      console.log(`      Type: ${campaign.discount_type}, Value: ${campaign.discount_value}${campaign.discount_type === 'PERCENTAGE' ? '%' : campaign.discount_type === 'AMOUNT' ? ' currency units' : ''}`);
    });
    
    console.log('\n🎫 Sample User Coupon Codes:');
    const sampleCoupons = result.userCoupons.slice(0, 10);
    sampleCoupons.forEach((coupon, index) => {
      console.log(`   ${index + 1}. ${coupon.coupon_code} (${coupon.is_active ? 'Active' : 'Inactive'})`);
    });
    
    console.log('\n📚 API Testing Guidelines:');
    console.log('   🔐 Admin Coupon Management: GET /api/v1/admin/coupon-campaigns');
    console.log('   🔐 User Coupons: GET /api/v1/user/coupons (requires authentication)');
    console.log('   🔐 Admin User Coupons: GET /api/v1/admin/user-coupons');
    
    console.log('\n⚠️  Note: User endpoints require authentication with a valid JWT token');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Process interrupted, cleaning up...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Process terminated, cleaning up...');
  await disconnectDB();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
