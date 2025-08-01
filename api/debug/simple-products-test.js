/**
 * Debug script to test products pagination directly with MongoDB
 * This bypasses the API and tests the aggregation pipeline directly
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('../models/Product');

async function testProductsPagination() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test different pagination scenarios
    const tests = [
      { page: 1, limit: 5 },
      { page: 1, limit: 10 },
      { page: 1, limit: 1 },
      { page: 2, limit: 10 },
      { page: 1, limit: 20 }
    ];

    for (const test of tests) {
      console.log(`\n🧪 Testing page=${test.page}, limit=${test.limit}`);
      
      const pageNum = parseInt(test.page);
      const limitNum = parseInt(test.limit);
      const skip = (pageNum - 1) * limitNum;
      
      console.log(`   Calculated skip: ${skip}, limit: ${limitNum}`);

      // Simple aggregation pipeline (similar to the one in controller)
      const pipeline = [
        // Match active products only
        { $match: { is_active: true } },
        
        // Use facet for pagination and count
        {
          $facet: {
            paginatedResults: [
              { $skip: skip },
              { $limit: limitNum }
            ],
            totalCount: [
              { $count: 'count' }
            ]
          }
        }
      ];

      const [result] = await Product.aggregate(pipeline);
      const products = result.paginatedResults || [];
      const totalItems = result.totalCount[0]?.count || 0;

      console.log(`   📊 Results: ${products.length} products returned`);
      console.log(`   📈 Total products in DB: ${totalItems}`);
      
      if (products.length !== limitNum && products.length !== totalItems) {
        console.log(`   ⚠️  POTENTIAL ISSUE: Expected ${limitNum} products, got ${products.length}`);
      }
    }

    // Test the exact same aggregation as in the controller
    console.log('\n🔍 Testing with full aggregation pipeline...');
    
    const fullPipeline = [
      { $match: { is_active: true } },
      {
        $lookup: {
          from: 'productvariants',
          localField: '_id',
          foreignField: 'product_id',
          as: 'product_variants'
        }
      },
      {
        $unwind: {
          path: '$product_variants',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { 'product_variants.is_active': true },
            { 'product_variants': null }
          ]
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          slug: { $first: '$slug' },
          is_active: { $first: '$is_active' },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          paginatedResults: [
            { $skip: 0 },
            { $limit: 5 }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const [fullResult] = await Product.aggregate(fullPipeline);
    console.log(`   📊 Full pipeline results: ${fullResult.paginatedResults?.length || 0} products`);
    console.log(`   📈 Full pipeline total: ${fullResult.totalCount[0]?.count || 0} products`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testProductsPagination();
