/**
 * Jest Configuration - Clean & Organized
 * Supports unit, integration, performance, and e2e tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '.',
  
  // Test directories and patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: false, // Enable only when needed
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Transform files
  transform: {},
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/__tests__/',
    '/tests/',
    '\\.old\\.',
    '\\.backup\\.',
    '\\.temp\\.'
  ],
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/unit.setup.js'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/database/**/*.test.js',
        '<rootDir>/tests/integration/services/**/*.test.js'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/integration.setup.js'
      ],
      testEnvironment: 'node',
      testTimeout: 60000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/integration.setup.js'
      ],
      testEnvironment: 'node',
      testTimeout: 120000
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/integration.setup.js'
      ],
      testEnvironment: 'node',
      testTimeout: 180000
    }
  ],
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  
  // Verbose output
  verbose: true,
  
  // Detect open handles
  detectOpenHandles: true,
  forceExit: true,
  
  // Silent mode for cleaner output
  silent: false
};
