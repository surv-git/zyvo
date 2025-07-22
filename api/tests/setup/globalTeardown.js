/**
 * Global Teardown
 * Cleanup after all tests complete
 */

const mongoose = require('mongoose');

module.exports = async () => {
  try {
    // Close any remaining mongoose connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Close all mongoose connections
    await mongoose.disconnect();
    
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Global teardown error:', error);
  }
};
