#!/usr/bin/env node

/**
 * Authentication System Setup Script
 * Sets up the complete authentication system with sample data and configuration
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail, testEmailConfig } = require('../utils/sendEmail');
const { generateTokens } = require('../utils/generateTokens');

async function setupAuthentication() {
  try {
    console.log('🔐 Setting up Authentication System...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api');
    console.log('✅ Connected to MongoDB');

    // Test email configuration
    console.log('📧 Testing email configuration...');
    const emailTest = await testEmailConfig();
    if (emailTest.success) {
      console.log('✅ Email configuration is valid');
    } else {
      console.log('⚠️  Email configuration test failed:', emailTest.message);
      console.log('   You can continue setup, but email features may not work');
    }

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@zyvo.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: 'Admin123!@#', // Will be hashed automatically
        role: 'admin',
        phone: '+1234567890',
        address: 'Admin Office, Main Street'
      });

      await adminUser.save();
      console.log('✅ Created admin user:');
      console.log('   Email: admin@zyvo.com');
      console.log('   Password: Admin123!@#');
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
        password: 'User123!@#', // Will be hashed automatically
        role: 'user',
        phone: '+1987654321',
        address: '123 User Street, City'
      });

      await regularUser.save();
      console.log('✅ Created regular user:');
      console.log('   Email: user@zyvo.com');
      console.log('   Password: User123!@#');
      console.log('   Role: user');
    } else {
      console.log('ℹ️  Regular user already exists');
    }

    // Test token generation
    console.log('\n🔑 Testing token generation...');
    const testUser = await User.findOne({ email: adminEmail });
    try {
      const tokens = generateTokens(testUser);
      console.log('✅ Token generation successful');
      console.log('   Access token length:', tokens.accessToken.length);
      console.log('   Refresh token length:', tokens.refreshToken.length);
    } catch (error) {
      console.log('❌ Token generation failed:', error.message);
    }

    // Display setup summary
    console.log('\n🎉 Authentication System Setup Complete!');
    console.log('\n📋 Environment Variables Required:');
    console.log('   ✅ JWT_SECRET');
    console.log('   ✅ JWT_REFRESH_SECRET');
    console.log('   ⚠️  SMTP_* (for email features)');
    
    console.log('\n🔗 Available Endpoints:');
    console.log('   POST /api/auth/register     - User registration');
    console.log('   POST /api/auth/login        - User login');
    console.log('   POST /api/auth/logout       - User logout');
    console.log('   POST /api/auth/refresh-token - Token refresh');
    console.log('   POST /api/auth/forgot-password - Password reset request');
    console.log('   POST /api/auth/reset-password/:token - Password reset');
    console.log('   GET  /api/auth/profile      - Get user profile');

    console.log('\n📝 Next Steps:');
    console.log('1. Install new dependencies: npm install');
    console.log('2. Update your .env file with the new variables');
    console.log('3. Start the server: npm run dev');
    console.log('4. Test login with the created accounts');
    console.log('5. Check API documentation at /api/docs');

    console.log('\n🧪 Test Commands:');
    console.log('# Register new user');
    console.log('curl -X POST http://localhost:3000/api/auth/register \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"name":"Test User","email":"test@example.com","password":"Test123!@#"}\'');
    
    console.log('\n# Login');
    console.log('curl -X POST http://localhost:3000/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"admin@zyvo.com","password":"Admin123!@#"}\'');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAuthentication();
}

module.exports = setupAuthentication;
