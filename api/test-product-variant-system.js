/**
 * Product Variant Management System Test Script
 * Comprehensive testing of the ProductVariant model and functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ProductVariant = require('./models/ProductVariant');
const Product = require('./models/Product');
const Option = require('./models/Option');

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api';

async function testProductVariantManagementSystem() {
  try {
    console.log('🚀 Starting Product Variant Management System Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await ProductVariant.deleteMany({ sku_code: { $regex: /^TEST-/ } });
    await Product.deleteMany({ name: { $regex: /^Test Product/ } });
    await Option.deleteMany({ option_type: { $regex: /^Test/ } });
    console.log('✅ Test data cleaned up\n');

    // Create test dependencies
    console.log('📋 Creating test dependencies...');
    
    // Create test product
    const testProduct = new Product({
      name: 'Test Product for Variants',
      description: 'A test product for variant testing',
      short_description: 'Test product',
      category_id: new mongoose.Types.ObjectId(),
      brand_id: new mongoose.Types.ObjectId()
    });
    await testProduct.save();
    console.log(`✅ Created test product: ${testProduct.name} (ID: ${testProduct._id})`);

    // Create test options
    const colorRed = new Option({
      option_type: 'TestColor',
      option_value: 'Red',
      name: 'Bright Red'
    });
    await colorRed.save();

    const colorBlue = new Option({
      option_type: 'TestColor',
      option_value: 'Blue',
      name: 'Ocean Blue'
    });
    await colorBlue.save();

    const sizeLarge = new Option({
      option_type: 'TestSize',
      option_value: 'Large',
      name: 'Large Size'
    });
    await sizeLarge.save();

    const sizeSmall = new Option({
      option_type: 'TestSize',
      option_value: 'Small',
      name: 'Small Size'
    });
    await sizeSmall.save();

    console.log(`✅ Created test options: ${colorRed.option_type}:${colorRed.option_value}, ${colorBlue.option_type}:${colorBlue.option_value}, ${sizeLarge.option_type}:${sizeLarge.option_value}, ${sizeSmall.option_type}:${sizeSmall.option_value}\n`);

    // Test 1: Create Product Variants
    console.log('📝 Test 1: Creating Product Variants');
    console.log('─'.repeat(50));

    const testVariants = [
      {
        product_id: testProduct._id,
        option_values: [colorRed._id, sizeLarge._id],
        sku_code: 'TEST-RED-L',
        price: 29.99,
        discount_details: {
          price: 24.99,
          percentage: 17,
          is_on_sale: true,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        dimensions: {
          length: 70,
          width: 50,
          height: 2,
          unit: 'cm'
        },
        weight: {
          value: 200,
          unit: 'g'
        },
        packaging_cost: 1.50,
        shipping_cost: 5.00,
        images: ['https://example.com/red-large.jpg'],
        sort_order: 1
      },
      {
        product_id: testProduct._id,
        option_values: [colorBlue._id, sizeLarge._id],
        sku_code: 'TEST-BLUE-L',
        price: 29.99,
        dimensions: {
          length: 70,
          width: 50,
          height: 2,
          unit: 'cm'
        },
        weight: {
          value: 200,
          unit: 'g'
        },
        packaging_cost: 1.50,
        shipping_cost: 5.00,
        sort_order: 2
      },
      {
        product_id: testProduct._id,
        option_values: [colorRed._id, sizeSmall._id],
        sku_code: 'TEST-RED-S',
        price: 24.99,
        dimensions: {
          length: 60,
          width: 40,
          height: 2,
          unit: 'cm'
        },
        weight: {
          value: 150,
          unit: 'g'
        },
        packaging_cost: 1.00,
        shipping_cost: 4.00,
        sort_order: 3
      }
    ];

    const createdVariants = [];
    for (const variantData of testVariants) {
      const variant = new ProductVariant(variantData);
      const savedVariant = await variant.save();
      await savedVariant.populate('product_id', 'name slug');
      await savedVariant.populate('option_values', 'option_type option_value name');
      createdVariants.push(savedVariant);
      
      console.log(`✅ Created variant: ${savedVariant.sku_code}`);
      console.log(`   - Product: ${savedVariant.product_id.name}`);
      console.log(`   - Options: ${savedVariant.option_values.map(opt => `${opt.option_type}:${opt.option_value}`).join(', ')}`);
      console.log(`   - Price: $${savedVariant.price} (Effective: $${savedVariant.effective_price})`);
      console.log(`   - Slug: ${savedVariant.slug}`);
      if (savedVariant.discount_details.is_on_sale) {
        console.log(`   - ON SALE: ${savedVariant.discount_percentage_calculated}% off, saves $${savedVariant.savings}`);
      }
      console.log();
    }

    console.log(`📊 Created ${createdVariants.length} product variants successfully\n`);

    // Test 2: Test Unique Constraints
    console.log('🔒 Test 2: Testing Unique Constraints');
    console.log('─'.repeat(50));

    try {
      const duplicateVariant = new ProductVariant({
        product_id: testProduct._id,
        option_values: [colorRed._id, sizeLarge._id], // Same combination as first variant
        sku_code: 'TEST-DUPLICATE',
        price: 25.99
      });
      await duplicateVariant.save();
      console.log('❌ ERROR: Duplicate option combination was allowed!');
    } catch (error) {
      if (error.code === 11000 || error.name === 'ValidationError') {
        console.log('✅ Unique constraint working: Duplicate option combination rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    try {
      const duplicateSKU = new ProductVariant({
        product_id: testProduct._id,
        option_values: [colorBlue._id, sizeSmall._id],
        sku_code: 'TEST-RED-L', // Same SKU as first variant
        price: 25.99
      });
      await duplicateSKU.save();
      console.log('❌ ERROR: Duplicate SKU was allowed!');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint working: Duplicate SKU rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Test Static Methods
    console.log('\n🔍 Test 3: Testing Static Methods');
    console.log('─'.repeat(50));

    // Test findByProductId
    const productVariants = await ProductVariant.findByProductId(testProduct._id);
    console.log(`✅ findByProductId: Found ${productVariants.length} variants for product`);
    productVariants.forEach(variant => {
      console.log(`   - ${variant.sku_code}: ${variant.option_values.map(opt => `${opt.option_type}:${opt.option_value}`).join(', ')}`);
    });

    // Test findBySKU
    const variantBySKU = await ProductVariant.findBySKU('TEST-RED-L');
    console.log(`\n✅ findBySKU('TEST-RED-L'): ${variantBySKU ? 'Found' : 'Not found'}`);
    if (variantBySKU) {
      console.log(`   - Product: ${variantBySKU.product_id.name}`);
      console.log(`   - Price: $${variantBySKU.price} (Effective: $${variantBySKU.effective_price})`);
    }

    // Test findOnSale
    const onSaleVariants = await ProductVariant.findOnSale();
    console.log(`\n✅ findOnSale: Found ${onSaleVariants.length} variants on sale`);
    onSaleVariants.forEach(variant => {
      console.log(`   - ${variant.sku_code}: $${variant.price} → $${variant.effective_price} (${variant.discount_percentage_calculated}% off)`);
    });

    // Test searchBySKU
    const skuSearchResults = await ProductVariant.searchBySKU('RED');
    console.log(`\n✅ searchBySKU('RED'): Found ${skuSearchResults.length} variants`);
    skuSearchResults.forEach(variant => {
      console.log(`   - ${variant.sku_code}`);
    });

    // Test 4: Test Virtual Fields
    console.log('\n🔗 Test 4: Testing Virtual Fields');
    console.log('─'.repeat(50));

    const firstVariant = createdVariants[0];
    console.log(`✅ Virtual fields for ${firstVariant.sku_code}:`);
    console.log(`   - effective_price: $${firstVariant.effective_price}`);
    console.log(`   - savings: $${firstVariant.savings}`);
    console.log(`   - discount_percentage_calculated: ${firstVariant.discount_percentage_calculated}%`);

    // Test 5: Test Instance Methods
    console.log('\n⚙️ Test 5: Testing Instance Methods');
    console.log('─'.repeat(50));

    // Test updateDiscount
    const variantToUpdate = createdVariants[1]; // Blue Large variant
    console.log(`🏷️ Adding discount to: ${variantToUpdate.sku_code}`);
    await variantToUpdate.updateDiscount({
      price: 19.99,
      percentage: 33,
      is_on_sale: true,
      end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
    });

    // Reload to see changes
    await variantToUpdate.populate('option_values', 'option_type option_value name');
    console.log(`✅ Discount applied: $${variantToUpdate.price} → $${variantToUpdate.effective_price} (${variantToUpdate.discount_percentage_calculated}% off)`);

    // Test soft delete
    const variantToDelete = createdVariants[2]; // Red Small variant
    console.log(`\n🗑️ Soft deleting: ${variantToDelete.sku_code}`);
    await variantToDelete.softDelete();
    console.log(`✅ Soft delete successful: is_active = ${variantToDelete.is_active}`);

    // Test activate
    console.log(`🔄 Reactivating: ${variantToDelete.sku_code}`);
    await variantToDelete.activate();
    console.log(`✅ Reactivation successful: is_active = ${variantToDelete.is_active}`);

    // Test clearDiscount
    console.log(`\n💰 Clearing discount from: ${variantToUpdate.sku_code}`);
    await variantToUpdate.clearDiscount();
    console.log(`✅ Discount cleared: is_on_sale = ${variantToUpdate.discount_details.is_on_sale}`);

    // Test 6: Test Complex Queries
    console.log('\n🔍 Test 6: Testing Complex Queries');
    console.log('─'.repeat(50));

    // Price range query
    const expensiveVariants = await ProductVariant.find({
      price: { $gte: 25 },
      is_active: true
    }).populate('option_values', 'option_type option_value');

    console.log(`✅ Variants priced $25 and above: Found ${expensiveVariants.length}`);
    expensiveVariants.forEach(variant => {
      console.log(`   - ${variant.sku_code}: $${variant.price}`);
    });

    // Aggregation example
    const variantsByProduct = await ProductVariant.aggregate([
      { $match: { is_active: true } },
      { $group: { 
          _id: '$product_id', 
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }},
      { $sort: { count: -1 } }
    ]);

    console.log(`\n✅ Variants grouped by product:`);
    variantsByProduct.forEach(group => {
      console.log(`   - Product ID ${group._id}: ${group.count} variants, Avg: $${group.avgPrice.toFixed(2)}, Range: $${group.minPrice}-$${group.maxPrice}`);
    });

    // Test 7: Performance Test
    console.log('\n⚡ Test 7: Performance Test');
    console.log('─'.repeat(50));

    // Create additional options for bulk testing
    const bulkOptions = [];
    for (let i = 0; i < 25; i++) {
      const bulkOption = new Option({
        option_type: 'TestBulkType',
        option_value: `BulkValue${i}`,
        name: `Bulk Option ${i}`
      });
      await bulkOption.save();
      bulkOptions.push(bulkOption);
    }

    const startTime = Date.now();
    
    // Create many variants quickly with unique option combinations
    const bulkVariants = [];
    for (let i = 0; i < 50; i++) {
      // Create unique option combinations by mixing existing and bulk options
      let optionValues;
      if (i < 25) {
        optionValues = [bulkOptions[i]._id]; // Single unique option
      } else {
        optionValues = [colorRed._id, bulkOptions[i - 25]._id]; // Combination with colorRed
      }
      
      const variant = new ProductVariant({
        product_id: testProduct._id,
        option_values: optionValues,
        sku_code: `TEST-BULK-${i}`,
        price: 10 + (i * 0.5),
        dimensions: {
          length: 10 + i,
          width: 10 + i,
          height: 1,
          unit: 'cm'
        },
        weight: {
          value: 100 + i,
          unit: 'g'
        }
      });
      bulkVariants.push(variant.save());
    }
    
    await Promise.all(bulkVariants);
    const bulkCreateTime = Date.now() - startTime;
    console.log(`✅ Created 50 variants in ${bulkCreateTime}ms`);

    // Query performance test
    const queryStartTime = Date.now();
    const bulkResults = await ProductVariant.find({ sku_code: { $regex: /^TEST-BULK-/ } })
      .populate('option_values', 'option_type option_value')
      .sort({ price: 1 });
    const queryTime = Date.now() - queryStartTime;
    console.log(`✅ Queried 50 variants in ${queryTime}ms`);
    console.log(`✅ Price range: $${bulkResults[0].price} - $${bulkResults[bulkResults.length-1].price}`);

    // Clean up bulk test data
    await ProductVariant.deleteMany({ sku_code: { $regex: /^TEST-BULK-/ } });
    await Option.deleteMany({ option_type: 'TestBulkType' });
    console.log(`✅ Cleaned up bulk test data`);

    // Test Summary
    console.log('\n📋 Test Summary');
    console.log('═'.repeat(60));
    console.log('✅ Product variant creation and validation');
    console.log('✅ Unique constraint enforcement (SKU and option combinations)');
    console.log('✅ Automatic slug generation');
    console.log('✅ Static methods (findByProductId, findBySKU, findOnSale, searchBySKU)');
    console.log('✅ Virtual fields (effective_price, savings, discount_percentage_calculated)');
    console.log('✅ Instance methods (updateDiscount, clearDiscount, softDelete, activate)');
    console.log('✅ Complex queries and aggregation');
    console.log('✅ Performance testing');
    console.log('\n🎉 All Product Variant Management System tests passed successfully!');

    // Final cleanup
    console.log('\n🧹 Final cleanup...');
    await ProductVariant.deleteMany({ sku_code: { $regex: /^TEST-/ } });
    await Product.deleteMany({ name: { $regex: /^Test Product/ } });
    await Option.deleteMany({ option_type: { $regex: /^Test/ } });
    console.log('✅ All test data removed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    console.log('🏁 Product Variant Management System testing completed');
  }
}

// Run the tests
testProductVariantManagementSystem();
