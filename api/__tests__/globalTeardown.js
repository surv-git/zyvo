/**
 * Global teardown for Jest tests
 * Ensures all resources are properly cleaned up after test suite completion
 */

const mongoose = require('mongoose');

module.exports = async () => {
  try {
    // Force close any remaining mongoose connections
    await mongoose.disconnect();
    
    // Clean up any other global resources
    if (global.gc) {
      global.gc();
    }
    
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Global teardown error:', error);
  }
};
