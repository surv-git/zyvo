/**
 * Unit Test Setup
 * Mocks all external dependencies for isolated unit testing
 */

// Import mongoose mock first to prevent Schema errors
require('./mongoose-mock');

// Mock mongoose for unit tests
jest.mock('mongoose', () => ({
  startSession: jest.fn().mockResolvedValue({
    withTransaction: jest.fn().mockImplementation(async (callback) => {
      return await callback();
    }),
    startTransaction: jest.fn().mockResolvedValue(),
    commitTransaction: jest.fn().mockResolvedValue(),
    abortTransaction: jest.fn().mockResolvedValue(),
    endSession: jest.fn().mockResolvedValue()
  }),
  Schema: function(definition) {
    this.definition = definition;
    this.methods = {};
    this.statics = {};
    this.pre = jest.fn();
    this.index = jest.fn();
    this.virtual = jest.fn().mockReturnValue({ get: jest.fn() });
    this.set = jest.fn();
    return this;
  },
  model: jest.fn().mockReturnValue({}),
  connection: {
    readyState: 0,
    close: jest.fn().mockResolvedValue()
  }
}));

// Mock common loggers
jest.mock('../../loggers/userActivity.logger', () => ({
  logUserActivity: jest.fn()
}));

jest.mock('../../loggers/adminAudit.logger', () => ({
  logAdminActivity: jest.fn()
}));

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockReturnValue({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([])
  })
}));

console.log('Unit test setup completed - All dependencies mocked');
