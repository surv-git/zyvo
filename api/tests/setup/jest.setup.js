/**
 * Jest Setup for All Tests
 * Centralized test configuration and setup
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Global test configuration
global.testConfig = {
  timeout: 30000,
  mongoServer: null,
  mongoUri: null
};

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Increase timeout for all tests
  jest.setTimeout(global.testConfig.timeout);
  
  console.log('Global test setup completed');
});

// Cleanup after all tests
afterAll(async () => {
  // Close any remaining connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('Global test cleanup completed');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock console methods to reduce noise in tests (optional)
if (process.env.JEST_SILENT === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
