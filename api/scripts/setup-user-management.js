#!/usr/bin/env node

/**
 * Quick Setup Script for User Management System
 * Creates a sample admin user and demonstrates basic functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function setupUserManagement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api');
    console.log('✅ Connected to MongoDB');

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@zyvo.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: 'admin123', // Will be hashed automatically
        role: 'admin',
        phone: '+1234567890',
        address: 'Admin Office, Main Street'
      });

      await adminUser.save();
      console.log('✅ Created admin user:');
      console.log('   Email: admin@zyvo.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample regular user
    const userEmail = 'user@zyvo.com';
    const existingUser = await User.findOne({ email: userEmail });

    if (!existingUser) {
      const regularUser = new User({
        name: 'John Doe',
        email: userEmail,
        password: 'user123', // Will be hashed automatically
        role: 'user',
        phone: '+1987654321',
        address: '123 User Street, City'
      });

      await regularUser.save();
      console.log('✅ Created regular user:');
      console.log('   Email: user@zyvo.com');
      console.log('   Password: user123');
      console.log('   Role: user');
    } else {
      console.log('ℹ️  Regular user already exists');
    }

    // Display setup summary
    console.log('\n🎉 User Management System Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with admin credentials to get JWT token');
    console.log('3. Use the token to access protected endpoints');
    console.log('4. Check the documentation at /api/docs');
    console.log('\nExample API calls:');
    console.log('POST /api/auth/login - Login to get JWT token');
    console.log('GET /api/users - Get all users (requires auth)');
    console.log('GET /api/admin/users/trends/registrations - Admin analytics');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupUserManagement();
}

module.exports = setupUserManagement;
