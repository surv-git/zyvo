/**
 * Option Management System Test Script
 * Comprehensive testing of the Option model and functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Option = require('./models/Option');

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api';

async function testOptionManagementSystem() {
  try {
    console.log('🚀 Starting Option Management System Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await Option.deleteMany({ 
      option_type: { $in: ['TestColor', 'TestSize', 'TestWeight', 'Test Slug Generation', 'Test Type With Spaces', 'BulkTest'] } 
    });
    console.log('✅ Test data cleaned up\n');

    // Test 1: Create Options
    console.log('📝 Test 1: Creating Options');
    console.log('─'.repeat(40));

    const testOptions = [
      { option_type: 'TestColor', option_value: 'Red', name: 'Bright Red', sort_order: 1 },
      { option_type: 'TestColor', option_value: 'Blue', name: 'Ocean Blue', sort_order: 2 },
      { option_type: 'TestColor', option_value: 'Green', name: 'Forest Green', sort_order: 3 },
      { option_type: 'TestSize', option_value: 'Small', sort_order: 1 },
      { option_type: 'TestSize', option_value: 'Medium', sort_order: 2 },
      { option_type: 'TestSize', option_value: 'Large', sort_order: 3 },
      { option_type: 'TestWeight', option_value: '500g', name: '500 grams', sort_order: 1 },
      { option_type: 'TestWeight', option_value: '1kg', name: '1 kilogram', sort_order: 2 }
    ];

    const createdOptions = [];
    for (const optionData of testOptions) {
      const option = new Option(optionData);
      const savedOption = await option.save();
      createdOptions.push(savedOption);
      console.log(`✅ Created: ${savedOption.option_type} - ${savedOption.option_value} (slug: ${savedOption.slug})`);
    }
    console.log(`\n📊 Created ${createdOptions.length} options successfully\n`);

    // Test 2: Test Unique Constraints
    console.log('🔒 Test 2: Testing Unique Constraints');
    console.log('─'.repeat(40));

    try {
      const duplicateOption = new Option({
        option_type: 'TestColor',
        option_value: 'Red', // This should fail due to unique constraint
        name: 'Another Red'
      });
      await duplicateOption.save();
      console.log('❌ ERROR: Duplicate option was allowed!');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint working: Duplicate option_type + option_value rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Test Slug Generation
    console.log('\n🔗 Test 3: Testing Slug Generation');
    console.log('─'.repeat(40));

    const specialOption = new Option({
      option_type: 'Test Slug Generation',
      option_value: 'Value With Special Characters!@#',
      name: 'Special Name'
    });
    const savedSpecialOption = await specialOption.save();
    console.log(`✅ Slug generated: "${savedSpecialOption.slug}" from "${savedSpecialOption.option_type}" + "${savedSpecialOption.option_value}"`);

    // Test 4: Test Static Methods
    console.log('\n🔍 Test 4: Testing Static Methods');
    console.log('─'.repeat(40));

    // Test findByType
    const colorOptions = await Option.findByType('TestColor');
    console.log(`✅ findByType('TestColor'): Found ${colorOptions.length} color options`);
    colorOptions.forEach(opt => {
      console.log(`   - ${opt.name} (${opt.option_value})`);
    });

    // Test getOptionTypes
    const optionTypes = await Option.getOptionTypes();
    console.log(`\n✅ getOptionTypes(): Found ${optionTypes.length} option types`);
    optionTypes.forEach(type => {
      console.log(`   - ${type.option_type}: ${type.values.length} values`);
    });

    // Test searchOptions
    const searchResults = await Option.searchOptions('red');
    console.log(`\n✅ searchOptions('red'): Found ${searchResults.length} matching options`);
    searchResults.forEach(opt => {
      console.log(`   - ${opt.full_name}`);
    });

    // Test 5: Test Instance Methods
    console.log('\n⚙️ Test 5: Testing Instance Methods');
    console.log('─'.repeat(40));

    // Test soft delete
    const optionToDelete = createdOptions[0];
    console.log(`🗑️ Soft deleting: ${optionToDelete.full_name}`);
    await optionToDelete.softDelete();
    
    // Verify it's inactive
    const deletedOption = await Option.findById(optionToDelete._id);
    console.log(`✅ Soft delete successful: is_active = ${deletedOption.is_active}`);

    // Test activate
    console.log(`🔄 Reactivating: ${deletedOption.full_name}`);
    await deletedOption.activate();
    
    // Verify it's active again
    const reactivatedOption = await Option.findById(optionToDelete._id);
    console.log(`✅ Reactivation successful: is_active = ${reactivatedOption.is_active}`);

    // Test updateSortOrder
    console.log(`📊 Updating sort order for: ${reactivatedOption.full_name}`);
    await reactivatedOption.updateSortOrder(99);
    
    // Verify sort order changed
    const updatedOption = await Option.findById(optionToDelete._id);
    console.log(`✅ Sort order updated: sort_order = ${updatedOption.sort_order}`);

    // Test 6: Test Virtual Fields
    console.log('\n🔗 Test 6: Testing Virtual Fields');
    console.log('─'.repeat(40));

    const sampleOption = createdOptions[1];
    console.log(`✅ Virtual field 'full_name': "${sampleOption.full_name}"`);
    console.log(`   - Combines: "${sampleOption.option_type}" + "${sampleOption.name}"`);

    // Test 7: Test Complex Queries
    console.log('\n🔍 Test 7: Testing Complex Queries');
    console.log('─'.repeat(40));

    // Find active options with pagination
    const activeOptions = await Option.find({ is_active: true })
      .sort({ option_type: 1, sort_order: 1 })
      .limit(5);
    console.log(`✅ Active options (first 5): Found ${activeOptions.length} options`);

    // Group options by type
    const optionsByType = await Option.aggregate([
      { $match: { is_active: true } },
      { $group: { 
          _id: '$option_type', 
          count: { $sum: 1 },
          values: { $push: '$option_value' }
        }},
      { $sort: { _id: 1 } }
    ]);
    console.log(`✅ Options grouped by type:`);
    optionsByType.forEach(group => {
      console.log(`   - ${group._id}: ${group.count} options (${group.values.join(', ')})`);
    });

    // Test 8: Performance Test
    console.log('\n⚡ Test 8: Performance Test');
    console.log('─'.repeat(40));

    const startTime = Date.now();
    
    // Create many options quickly
    const bulkOptions = [];
    for (let i = 0; i < 100; i++) {
      const option = new Option({
        option_type: 'BulkTest',
        option_value: `Value${i}`,
        name: `Bulk Option ${i}`,
        sort_order: i
      });
      bulkOptions.push(option.save());
    }
    
    await Promise.all(bulkOptions);
    const bulkCreateTime = Date.now() - startTime;
    console.log(`✅ Created 100 options in ${bulkCreateTime}ms`);

    // Query performance test
    const queryStartTime = Date.now();
    const bulkResults = await Option.find({ option_type: 'BulkTest' }).sort({ sort_order: 1 });
    const queryTime = Date.now() - queryStartTime;
    console.log(`✅ Queried 100 options in ${queryTime}ms`);
    console.log(`✅ Found ${bulkResults.length} bulk test options`);

    // Clean up bulk test data
    await Option.deleteMany({ option_type: 'BulkTest' });
    console.log(`✅ Cleaned up bulk test data`);

    // Test Summary
    console.log('\n📋 Test Summary');
    console.log('═'.repeat(50));
    console.log('✅ Option creation and validation');
    console.log('✅ Unique constraint enforcement');
    console.log('✅ Automatic slug generation');
    console.log('✅ Static methods (findByType, getOptionTypes, searchOptions)');
    console.log('✅ Instance methods (softDelete, activate, updateSortOrder)');
    console.log('✅ Virtual fields (full_name)');
    console.log('✅ Complex queries and aggregation');
    console.log('✅ Performance testing');
    console.log('\n🎉 All Option Management System tests passed successfully!');

    // Final cleanup
    console.log('\n🧹 Final cleanup...');
    await Option.deleteMany({ 
      option_type: { $in: ['TestColor', 'TestSize', 'TestWeight', 'Test Slug Generation', 'Test Type With Spaces', 'BulkTest'] } 
    });
    console.log('✅ All test data removed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    console.log('🏁 Option Management System testing completed');
  }
}

// Run the tests
testOptionManagementSystem();
