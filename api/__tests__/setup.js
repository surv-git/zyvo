/**
 * Global Test Setup Configuration
 * 
 * This file is loaded by Jest before any tests run.
 * It configures the test environment, database connections,
 * and provides global utilities and mocks.
 */

// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');

// Load required models for tests
require('../models/User');
require('../models/Product');
require('../models/ProductVariant');
require('../models/Cart');
require('../models/CartItem');
require('../models/Option');
require('../models/Inventory');  // Required for ProductVariant populate

// Ensure we're in test environment
process.env.NODE_ENV = 'test';

// Use test database
const MONGODB_TEST_URI = process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace('/zyvo', '/zyvo_test') : 
  'mongodb://localhost:27017/zyvo_test';

// Set test timeout
jest.setTimeout(30000);

// Database connection setup
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to test database
  try {
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Clear all collections first (if connected)
    if (mongoose.connection.readyState === 1) {
      // Get all collection names from the database
      const collectionNames = await mongoose.connection.db.listCollections().toArray();
      
      // Clear each collection individually
      for (const collectionInfo of collectionNames) {
        try {
          await mongoose.connection.db.collection(collectionInfo.name).deleteMany({});
        } catch (deleteError) {
          console.warn(`Failed to clear collection ${collectionInfo.name}:`, deleteError.message);
        }
      }
    }
    
    // Close database connection properly
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Additional cleanup for any hanging processes
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  try {
    // Reset global mocks
    // Clear specific global mocks that don't auto-clear
    if (global.mockNext && typeof global.mockNext === 'function') {
      // mockNext returns fresh functions, so no need to clear
    }
    
    // Only clean up if connected
    if (mongoose.connection.readyState === 1) {
      // Get all collection names from the database
      const collectionNames = await mongoose.connection.db.listCollections().toArray();
      
      // Clear each collection individually
      for (const collectionInfo of collectionNames) {
        try {
          await mongoose.connection.db.collection(collectionInfo.name).deleteMany({});
        } catch (deleteError) {
          // Some collections might not exist or have issues, continue cleanup
          console.warn(`Failed to clear collection ${collectionInfo.name}:`, deleteError.message);
        }
      }
    }
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to hide logs during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Global test utilities
global.mockReq = (overrides = {}) => {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    },
    ip: '127.0.0.1',
    get: jest.fn((header) => {
      const headers = {
        'user-agent': 'Jest Test Agent',
        'content-type': 'application/json',
        ...overrides.headers
      };
      return headers[header.toLowerCase()];
    }),
    ...overrides
  };
};

global.mockRes = (overrides = {}) => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    ...overrides
  };
  return res;
};

global.mockNext = () => jest.fn();

// Global test data generators
global.createTestUser = () => ({
  _id: new mongoose.Types.ObjectId(),
  email: `test${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  isEmailVerified: true
});

global.createTestProductVariant = () => ({
  _id: new mongoose.Types.ObjectId(),
  product_id: new mongoose.Types.ObjectId(),
  sku: `TEST-SKU-${Date.now()}`,
  price: 19.99,
  stock_quantity: 100,
  is_active: true,
  option_values: {}
});

global.createTestCart = (userId) => ({
  _id: new mongoose.Types.ObjectId(),
  user_id: userId || new mongoose.Types.ObjectId(),
  items: [],
  total_amount: 0,
  coupon_applied: null,
  discount_amount: 0,
  final_amount: 0
});

// Ensure clean exit
process.on('exit', () => {
  if (mongoose.connection.readyState !== 0) {
    mongoose.connection.close();
  }
});
