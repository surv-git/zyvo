module.exports = {
  // Test environment configuration
  testEnvironment: 'node',
  
  // Prevent force exit to allow proper cleanup
  forceExit: false,
  
  // Detect open handles to identify what's keeping Jest running
  detectOpenHandles: true,
  
  // Increase timeout for async operations
  testTimeout: 30000,
  
  // Clear cache between runs
  clearMocks: true,
  
  // Reset modules between tests
  resetMocks: true,
  restoreMocks: true,
  
  // Maximum number of workers for parallel execution
  maxWorkers: 1, // Use single worker to avoid connection issues
  
  // Memory management
  workerIdleMemoryLimit: '512MB',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Global teardown
  globalTeardown: '<rootDir>/__tests__/globalTeardown.js',
  
  // Coverage configuration - focused on tested files
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/admin.controller.js',
    'controllers/auth.controller.js',
    'controllers/brand.controller.js',
    'controllers/cart.controller.js',
    'controllers/category.controller.js',
    'controllers/couponCampaign.controller.js',
    'controllers/inventory.controller.js',
    'controllers/listing.controller.js',
    'controllers/option.controller.js',
    'controllers/order.controller.js',
    'controllers/paymentMethod.controller.js',
    'controllers/platform.controller.js',
    'controllers/platformFee.controller.js',
    'controllers/product.controller.js',
    'controllers/productVariant.controller.js',
    'controllers/purchase.controller.js',
    'controllers/supplier.controller.js',
    'controllers/supplierContactNumber.controller.js',
    'controllers/user.controller.js',
    'controllers/userCoupon.controller.js',
    // 'controllers/purchase.controller.js', // Basic tests in place
    // Add other files as they get tested
    // 'middleware/**/*.js',
    // 'utils/**/*.js',
    // 'models/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds - realistic based on tested files
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 85,
      statements: 85
    },
    // Specific thresholds for tested files
    'controllers/user.controller.js': {
      branches: 70,
      functions: 85,
      lines: 80,
      statements: 80
    },
    'controllers/auth.controller.js': {
      branches: 85,
      functions: 100,
      lines: 90,
      statements: 90
    },
    // In jest.config.js
    'controllers/inventory.controller.js': {
      branches: 30,
      functions: 50,
      lines: 25,
      statements: 25
    },
    'controllers/paymentMethod.controller.js': {
      branches: 80,
      functions: 95,
      lines: 85,
      statements: 85
    },
    'controllers/couponCampaign.controller.js': {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    },
    'controllers/userCoupon.controller.js': {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
    // 'controllers/purchase.controller.js': {
    //   branches: 80,
    //   functions: 95,
    //   lines: 90,
    //   statements: 90
    // }
  },
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Timeout for tests
  testTimeout: 30000
};
