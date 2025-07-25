/**
 * Test admin addresses endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100';

// Admin credentials (assuming this admin exists)
const adminCredentials = {
  email: 'skumarv@gmail.com',
  password: 'password123' // You might need to adjust this
};

async function testAdminAddresses() {
  try {
    console.log('🔐 Attempting admin login...');
    
    // First, login as admin to get token
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, adminCredentials);
    const token = loginResponse.data.token;
    
    console.log('✅ Admin login successful');
    
    // Test the admin addresses endpoint
    console.log('📍 Testing admin addresses endpoint...');
    
    const addressResponse = await axios.get(`${BASE_URL}/api/v1/admin/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin addresses endpoint successful');
    console.log('📊 Response:', JSON.stringify(addressResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Try updating the admin password or check admin credentials');
    }
  }
}

testAdminAddresses();
