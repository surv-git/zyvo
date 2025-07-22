/**
 * Test Helper Functions
 * Common utilities for all test types
 */

/**
 * Create mock request object
 */
const createMockReq = (overrides = {}) => ({
  user: { id: 'user123', username: 'testuser', role: 'user' },
  body: {},
  params: {},
  query: {},
  headers: {},
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('Mozilla/5.0'),
  ...overrides
});

/**
 * Create mock response object
 */
const createMockRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };
  
  // Chain methods
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  
  return res;
};

/**
 * Create mock next function
 */
const createMockNext = () => jest.fn();

/**
 * Create complete mock context
 */
const createMockContext = (reqOverrides = {}, resOverrides = {}) => ({
  req: createMockReq(reqOverrides),
  res: createMockRes(resOverrides),
  next: createMockNext()
});

/**
 * Mock mongoose model with common methods
 */
const createMockModel = (name = 'MockModel') => ({
  modelName: name,
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
  save: jest.fn(),
  prototype: {
    save: jest.fn(),
    remove: jest.fn(),
    deleteOne: jest.fn()
  }
});

/**
 * Mock validation result
 */
const createMockValidationResult = (isEmpty = true, errors = []) => ({
  isEmpty: jest.fn().mockReturnValue(isEmpty),
  array: jest.fn().mockReturnValue(errors)
});

/**
 * Wait for async operations
 */
const waitFor = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate test data
 */
const generateTestData = {
  user: (overrides = {}) => ({
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    isActive: true,
    ...overrides
  }),
  
  product: (overrides = {}) => ({
    _id: 'product123',
    name: 'Test Product',
    description: 'Test Description',
    isActive: true,
    ...overrides
  }),
  
  order: (overrides = {}) => ({
    _id: 'order123',
    user_id: 'user123',
    status: 'pending',
    total_amount: 100,
    ...overrides
  })
};

/**
 * Assert response format
 */
const assertSuccessResponse = (res, expectedData = {}) => {
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      ...expectedData
    })
  );
};

const assertErrorResponse = (res, statusCode, message) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: expect.stringContaining(message)
    })
  );
};

module.exports = {
  createMockReq,
  createMockRes,
  createMockNext,
  createMockContext,
  createMockModel,
  createMockValidationResult,
  waitFor,
  generateTestData,
  assertSuccessResponse,
  assertErrorResponse
};
