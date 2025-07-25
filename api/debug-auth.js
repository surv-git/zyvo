#!/usr/bin/env node

/**
 * Authentication Debug Tool
 * Tests authentication middleware to identify why requests are failing
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('./utils/generateTokens');
const User = require('./models/User');

require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function debugAuth() {
  await connectDB();
  
  // Find an admin user
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('❌ No admin user found. Please create one first.');
    process.exit(1);
  }
  
  console.log('👤 Found admin user:', {
    id: adminUser._id,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive
  });
  
  // Generate token
  const payload = {
    userId: adminUser._id,
    role: adminUser.role,
    email: adminUser.email
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log('🔑 Generated token:', token.substring(0, 50) + '...');
  
  // Test token verification
  try {
    const decoded = verifyAccessToken(token);
    console.log('✅ Token verification successful:', {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    });
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ User not found in database');
    } else if (!user.isActive) {
      console.log('❌ User account is inactive');
    } else {
      console.log('✅ User validation successful:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    }
    
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
  }
  
  // Generate test command
  const curlCommand = `curl -X GET "http://localhost:3100/api/v1/admin/user-coupons?page=1&limit=5" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -w "\\nStatus Code: %{http_code}\\nResponse Time: %{time_total}s\\n" \\
  -v`;
  
  console.log('\n🧪 Test this exact command:');
  console.log('='.repeat(80));
  console.log(curlCommand);
  console.log('='.repeat(80));
  
  // Test simulated middleware
  console.log('\n🔍 Simulating auth middleware...');
  
  // Simulate the request headers
  const authHeader = `Bearer ${token}`;
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth header validation failed');
  } else {
    const extractedToken = authHeader.substring(7);
    console.log('✅ Extracted token:', extractedToken.substring(0, 50) + '...');
    console.log('Token match:', extractedToken === token ? '✅ Yes' : '❌ No');
  }
  
  await mongoose.disconnect();
  console.log('📊 Disconnected from MongoDB');
}

debugAuth().catch(console.error);
