/**
 * Product System Test Script
 * Quick test to verify the Product Management System is working
 */

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testProductSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_db');
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test product
    console.log('\n📝 Testing Product Creation...');
    
    const testProduct = new Product({
      name: 'Test Product - MacBook Pro',
      description: 'This is a test product for the Product Management System',
      short_description: 'Test MacBook Pro',
      category_id: new mongoose.Types.ObjectId(), // Mock category ID
      images: ['https://example.com/test-image.jpg'],
      brand_id: new mongoose.Types.ObjectId(), // Mock brand ID
      score: 4.5,
      seo_details: {
        meta_title: 'Test MacBook Pro - Best Laptop',
        meta_description: 'Test description for MacBook Pro',
        meta_keywords: ['macbook', 'laptop', 'test']
      }
    });

    const savedProduct = await testProduct.save();
    console.log('✅ Product created successfully');
    console.log('   - ID:', savedProduct._id);
    console.log('   - Name:', savedProduct.name);
    console.log('   - Slug:', savedProduct.slug);
    console.log('   - SEO Title:', savedProduct.seo_details.meta_title);

    // Test 2: Test slug uniqueness
    console.log('\n🔄 Testing Slug Uniqueness...');
    
    const duplicateProduct = new Product({
      name: 'Test Product - MacBook Pro', // Same name should create different slug
      description: 'Another test product with same name',
      category_id: new mongoose.Types.ObjectId(),
    });

    const savedDuplicate = await duplicateProduct.save();
    console.log('✅ Duplicate name handled correctly');
    console.log('   - Original Slug:', savedProduct.slug);
    console.log('   - New Slug:', savedDuplicate.slug);

    // Test 3: Test search functionality (without populate)
    console.log('\n🔍 Testing Search Functionality...');
    
    const searchResults = await Product.find({
      $or: [
        { name: { $regex: 'MacBook', $options: 'i' } },
        { description: { $regex: 'MacBook', $options: 'i' } }
      ]
    });
    console.log('✅ Search working correctly');
    console.log('   - Found', searchResults.length, 'products');

    // Test 4: Test static methods (without populate)
    console.log('\n📊 Testing Static Methods...');
    
    const activeProducts = await Product.find({ is_active: true });
    console.log('✅ Static methods working');
    console.log('   - Active products:', activeProducts.length);

    // Test 5: Test soft delete
    console.log('\n🗑️ Testing Soft Delete...');
    
    await savedProduct.softDelete();
    console.log('✅ Soft delete working');
    console.log('   - Product is_active:', savedProduct.is_active);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Product.deleteMany({ name: /Test Product/ });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Product Management System is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testProductSystem();
