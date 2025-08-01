#!/usr/bin/env node

/**
 * Test Category Filtering in Products API
 * Tests different parameter formats to verify filtering behavior
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3100/api/v1';

async function testCategoryFiltering() {
  console.log('🧪 Testing Category Filtering in Products API\n');

  try {
    // Test 1: Get all products (no filtering)
    console.log('1️⃣ Testing: Get all products (no filtering)');
    const allProducts = await axios.get(`${API_BASE}/products?page=1&limit=5`);
    console.log(`   ✅ Total products: ${allProducts.data.pagination.totalItems}`);
    console.log(`   📊 Returned: ${allProducts.data.data.length} products\n`);

    // Test 2: Current request format (should fail validation)
    console.log('2️⃣ Testing: category=Clothing (current format - should fail)');
    try {
      const clothingTest = await axios.get(`${API_BASE}/products?category=Clothing&page=1&limit=5`);
      console.log(`   ❌ Unexpected success: ${clothingTest.data.data.length} products returned`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`   ✅ Expected validation error: ${error.response.data.message}`);
        console.log(`   📝 Errors: ${JSON.stringify(error.response.data.errors, null, 2)}`);
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}`);
      }
    }
    console.log('');

    // Test 3: Get a sample category ID for testing
    console.log('3️⃣ Getting sample category for testing...');
    try {
      const categories = await axios.get(`${API_BASE}/categories?page=1&limit=5`);
      if (categories.data.data && categories.data.data.length > 0) {
        const sampleCategory = categories.data.data[0];
        console.log(`   📂 Sample category: ${sampleCategory.name} (ID: ${sampleCategory._id})`);
        
        // Test 4: Correct format with category_id
        console.log('\n4️⃣ Testing: category_id with ObjectId (correct format)');
        const correctTest = await axios.get(`${API_BASE}/products?category_id=${sampleCategory._id}&page=1&limit=5`);
        console.log(`   ✅ Success: ${correctTest.data.data.length} products returned`);
        console.log(`   📊 Total in category: ${correctTest.data.pagination.totalItems}`);
        
        // Show sample products
        if (correctTest.data.data.length > 0) {
          console.log(`   📦 Sample products:`);
          correctTest.data.data.slice(0, 3).forEach((product, index) => {
            console.log(`      ${index + 1}. ${product.name} (Category: ${product.category_id?.name || 'N/A'})`);
          });
        }
      } else {
        console.log('   ❌ No categories found for testing');
      }
    } catch (error) {
      console.log(`   ❌ Error getting categories: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCategoryFiltering();
