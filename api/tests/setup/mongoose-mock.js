/**
 * Mongoose Mock Setup
 * Prevents mongoose from loading and causing Schema errors
 */

// Mock mongoose completely to prevent Schema errors
jest.mock('mongoose', () => ({
  Schema: class MockSchema {
    constructor(definition) {
      this.definition = definition;
      return this;
    }
    
    static Types = {
      ObjectId: 'ObjectId'
    };
    
    pre() { return this; }
    post() { return this; }
    virtual() { return { get: jest.fn(), set: jest.fn() }; }
    index() { return this; }
    plugin() { return this; }
  },
  
  model: jest.fn(() => ({
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    }),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([])
  })),
  
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    close: jest.fn(),
    on: jest.fn(),
    once: jest.fn()
  },
  disconnect: jest.fn(),
  
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'mock-object-id')
  }
}));

console.log('Mongoose completely mocked to prevent Schema errors');
