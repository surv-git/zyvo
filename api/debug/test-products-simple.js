/**
 * Simple Node.js script to test products API pagination
 * Run this when the server is running: node debug/test-products-simple.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/products';

async function testProductsPagination() {
  console.log('🧪 Testing Products API Pagination\n');

  const tests = [
    { name: 'Default (no params)', params: {} },
    { name: 'Limit 5', params: { limit: 5 } },
    { name: 'Limit 1', params: { limit: 1 } },
    { name: 'Limit 20', params: { limit: 20 } },
    { name: 'Page 2, Limit 10', params: { page: 2, limit: 10 } },
    { name: 'Page 1, Limit 3', params: { page: 1, limit: 3 } }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 Test: ${test.name}`);
      console.log(`   URL: ${BASE_URL}?${new URLSearchParams(test.params).toString()}`);
      
      const response = await axios.get(BASE_URL, { params: test.params });
      const data = response.data;
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Items returned: ${data.data?.length || 0}`);
      console.log(`   📄 Pagination:`, data.pagination);
      
      if (data.data?.length !== (test.params.limit || 10)) {
        console.log(`   ⚠️  ISSUE: Expected ${test.params.limit || 10} items, got ${data.data?.length || 0}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
  
  console.log('\n🏁 Testing completed');
}

// Run the test
testProductsPagination().catch(console.error);
