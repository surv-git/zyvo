/**
 * Jest Setup File
 * Global configurations and mo// Clean up after each test
afterEach(async () => {
  try {
    // Only clean up if connected
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        try {
          await collection.deleteMany({});
        } catch (deleteError) {
          // Some collections might not exist or have issues, continue cleanup
          console.warn(`Failed to clear collection ${key}:`, deleteError.message);
        }
      }
    }
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});ng
 */

const mongoose = require('mongoose');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/zyvo_test';

// Global test timeout
jest.setTimeout(30000);

// Database connection setup
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to test database
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error('Failed to connect to test database:', error);
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
    body: {},
    params: {},
    query: {},
    user: null,
    cookies: {},
    headers: {},
    ...overrides
  };
};

global.mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

global.mockNext = () => jest.fn();

// Mock external modules
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-random-string')
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-token')
  })
}));

// Mock utility functions
jest.mock('../utils/sendVerificationEmail', () => ({
  sendVerificationEmail: jest.fn(),
  generateEmailVerificationToken: jest.fn().mockReturnValue('mocked-email-token')
}));

jest.mock('../utils/sendVerificationSMS', () => ({
  sendVerificationSMS: jest.fn(),
  generateOTP: jest.fn().mockReturnValue('123456'),
  validateOTPFormat: jest.fn().mockReturnValue(true)
}));

jest.mock('../utils/sendEmail', () => ({
  sendEmail: jest.fn()
}));

jest.mock('../utils/generateTokens', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mocked-access-token',
    refreshToken: 'mocked-refresh-token'
  })
}));

// Mock logger (when available)
jest.mock('../utils/logger', () => ({
  userActivityLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  },
  adminAuditLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}), { virtual: true });

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockReturnValue({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([])
  })
}));
