/**
 * Debug Script for Favorites Authentication
 * Use this script to test the favorites endpoint and debug authentication issues
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3100'; // Adjust if your server runs on a different port
const TEST_EMAIL = 'skumarv@gmail.com'; // Replace with a valid test user email
const TEST_PASSWORD = 'Password@123!'; // Replace with the test user password

async function debugFavoritesAuth() {
  try {
    console.log('🔍 Starting Favorites Authentication Debug...\n');

    // Step 1: Login to get token
    console.log('Step 1: Attempting login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('📝 User:', loginResponse.data.data.user.name);
      console.log('🔑 Token received:', loginResponse.data.data.accessToken ? 'Yes' : 'No');
      
      const token = loginResponse.data.data.accessToken;
      console.log('🔍 Token preview:', token.substring(0, 20) + '...\n');

      // Step 2: Test favorites endpoint
      console.log('Step 2: Testing favorites endpoint...');
      
      const favoritesResponse = await axios.get(`${BASE_URL}/api/v1/user/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (favoritesResponse.data.success) {
        console.log('✅ Favorites endpoint successful');
        console.log('📊 Favorites count:', favoritesResponse.data.data.length);
        console.log('📄 Response structure:', Object.keys(favoritesResponse.data));
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error status
      console.log('🔴 Status:', error.response.status);
      console.log('📝 Message:', error.response.data.message || 'No message');
      console.log('📄 Full response:', JSON.stringify(error.response.data, null, 2));
      
      // Specific debugging for 401 errors
      if (error.response.status === 401) {
        console.log('\n🔍 401 Debugging Information:');
        console.log('- Check if Authorization header is present');
        console.log('- Verify token format: "Bearer <token>"');
        console.log('- Ensure token is not expired');
        console.log('- Confirm user exists and is active');
        
        // Check request headers
        if (error.config && error.config.headers) {
          console.log('📋 Request headers sent:');
          console.log('  Authorization:', error.config.headers.Authorization ? 'Present' : 'Missing');
          console.log('  Content-Type:', error.config.headers['Content-Type']);
        }
      }
    } else if (error.request) {
      // Network error
      console.log('🌐 Network error - server not responding');
      console.log('📝 Check if server is running on', BASE_URL);
    } else {
      // Other error
      console.log('⚠️ Unexpected error:', error.message);
    }
  }
}

// Additional helper function to test token validation
async function testTokenValidation(token) {
  try {
    console.log('\n🔍 Testing token validation directly...');
    
    const response = await axios.get(`${BASE_URL}/api/v1/user/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Token is valid');
    return true;
  } catch (error) {
    console.log('❌ Token validation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Manual token testing function
async function testWithManualToken() {
  console.log('\n🔧 Manual Token Testing');
  console.log('If you have a token, you can test it directly:');
  
  // Replace with your actual token for testing
  const MANUAL_TOKEN = 'your-jwt-token-here';
  
  if (MANUAL_TOKEN !== 'your-jwt-token-here') {
    await testTokenValidation(MANUAL_TOKEN);
  } else {
    console.log('💡 Replace MANUAL_TOKEN with your actual JWT token to test');
  }
}

// Run the debug script
console.log('🚀 Favorites Authentication Debugger\n');
console.log('📋 Configuration:');
console.log('  Server URL:', BASE_URL);
console.log('  Test Email:', TEST_EMAIL);
console.log('  Test Password:', TEST_PASSWORD ? '[HIDDEN]' : 'Not set');
console.log('');

debugFavoritesAuth().then(() => {
  testWithManualToken();
});
