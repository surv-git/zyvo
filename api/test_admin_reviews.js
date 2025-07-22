/**
 * Test script for admin reviews endpoint
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAdminReviews() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/zyvo');
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('No admin user found');
    }
    
    console.log('👤 Admin user:', adminUser.email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id,
        email: adminUser.email,
        role: adminUser.role 
      },
      'your-super-secret-jwt-key-here-change-this-in-production',
      { expiresIn: '1h' }
    );

    console.log('🔑 JWT Token generated');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test the endpoint with curl
    const curlCommand = `curl -X GET "http://localhost:3100/api/v1/admin/reviews" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -w "\\nStatus: %{http_code}\\n"`;

    console.log('\n🧪 Test command:');
    console.log(curlCommand);

    await mongoose.disconnect();
    console.log('\n💡 Copy the above curl command and run it to test the endpoint');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAdminReviews();
