/**
 * Direct test of getAllReviewsAdmin function
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const ProductVariant = require('./models/ProductVariant');
const ProductReview = require('./models/ProductReview');
const { getAllReviewsAdmin } = require('./controllers/productReview.controller');

async function testDirectly() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/zyvo');
    console.log('✅ Connected to MongoDB');

    // Mock request and response objects
    const req = {
      query: {
        page: 1,
        limit: 5
      }
    };

    const res = {
      json: (data) => {
        console.log('✅ Response:', JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log('Status:', code);
        return res;
      }
    };

    const next = (error) => {
      console.error('❌ Error:', error);
    };

    console.log('🧪 Testing getAllReviewsAdmin directly...');
    await getAllReviewsAdmin(req, res, next);

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDirectly();
