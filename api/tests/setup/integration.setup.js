/**
 * Integration Test Setup
 * Setup for integration tests with real database
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Import models to register schemas
require('../../models/Option');

let mongoServer;

// Setup before integration tests
beforeAll(async () => {
  try {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Integration test database connected');
  } catch (error) {
    console.error('Integration test setup failed:', error);
    throw error;
  }
});

// Cleanup after integration tests
afterAll(async () => {
  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Stop in-memory MongoDB
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Integration test cleanup completed');
  } catch (error) {
    console.error('Integration test cleanup failed:', error);
  }
});

// Clean database between tests
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

console.log('Integration test setup completed');
