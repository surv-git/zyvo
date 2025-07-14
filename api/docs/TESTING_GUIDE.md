# Testing Guide for Zyvo API

## Overview

This guide explains how to run the comprehensive Jest unit test suite for the Zyvo API. The test suite covers the user and authentication controllers with extensive mocking of external dependencies.

## Test Structure

The test suite is organized as follows:

```
__tests__/
├── setup.js                           # Global test setup and mocks
└── controllers/
    ├── user.controller.test.js         # User controller tests (35 tests)
    ├── auth.controller.test.js         # Authentication controller tests (25 tests)
    └── category.controller.test.js     # Category controller tests (25 tests)
```

## Test Coverage Summary

- **Total Tests**: 85 test cases
- **User Controller**: 35 comprehensive tests covering CRUD operations, admin features, and access control
- **Auth Controller**: 25 tests covering registration, login, JWT handling, and verification workflows
- **Category Controller**: 25 tests covering hierarchical category management and tree operations

## Prerequisites

Ensure you have all dependencies installed:

```bash
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Files
```bash
# Run only user controller tests
npm test -- __tests__/controllers/user.controller.test.js

# Run only auth controller tests
npm test -- __tests__/controllers/auth.controller.test.js

# Run only category controller tests
npm test -- __tests__/controllers/category.controller.test.js
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Test Configuration

The Jest configuration is defined in `jest.config.js` with the following key settings:

- **Test Environment**: Node.js
- **Test Files**: `__tests__/**/*.test.js`
- **Coverage**: Enabled for controllers, middleware, utils, and models
- **Setup**: Global setup file at `__tests__/setup.js`
- **Mocking**: Automatic mocking of external dependencies
- **Timeout**: 30 seconds for async operations

## Test Coverage

The test suite aims for high coverage across all controller functions:

### Coverage Targets
- **User Controller**: 80% coverage (35 tests)
- **Auth Controller**: 90% coverage (25 tests) 
- **Category Controller**: 85% coverage (25 tests)

### Global Coverage Goals
- **Branches**: 75%+
- **Functions**: 90%+
- **Lines**: 85%+
- **Statements**: 85%+

View coverage report in the `coverage/` directory after running tests with coverage.

## Mock Strategy

### External Dependencies
All external dependencies are mocked to ensure tests run in isolation:

- **bcryptjs**: Password hashing functions
- **jsonwebtoken**: JWT token operations
- **crypto**: Cryptographic functions
- **Mongoose Models**: Database operations
- **Utility Functions**: Email, SMS, token generation
- **Express Validator**: Input validation

### Request/Response Objects
Custom mock factories are provided for Express objects:

```javascript
// Mock request object
const mockReq = global.mockReq({
  body: { email: 'test@example.com' },
  user: { id: 'user123', role: 'admin' }
});

// Mock response object
const mockRes = global.mockRes();

// Mock next function
const mockNext = global.mockNext();
```

## Test Categories

### User Controller Tests (`user.controller.test.js`)

#### createUser
- ✅ Should create a new user successfully
- ✅ Should return 400 if username already exists
- ✅ Should return 400 if email already exists
- ✅ Should hash passwords properly
- ✅ Should handle database errors

#### getAllUsers
- ✅ Should return paginated users
- ✅ Should apply search filters
- ✅ Should apply role filters
- ✅ Should apply date range filters
- ✅ Should restrict access for non-admin users
- ✅ Should handle invalid parameters

#### getUserById
- ✅ Should return user by ID
- ✅ Should return 404 for non-existent user
- ✅ Should enforce access control
- ✅ Should allow admin access to any user

#### updateUser
- ✅ Should update user successfully
- ✅ Should reset verification status on email/phone change
- ✅ Should trigger verification emails
- ✅ Should enforce access control
- ✅ Should handle admin-only fields

#### deleteUser
- ✅ Should perform soft delete by default
- ✅ Should perform hard delete for admin
- ✅ Should enforce access control
- ✅ Should handle user not found

#### Admin Dashboard Endpoints
- ✅ getUserRegistrationTrends
- ✅ getActiveUsersCount
- ✅ getTopUsersByActivity
- ✅ getUserRoleDistribution

### Authentication Controller Tests (`auth.controller.test.js`)

#### registerUser
- ✅ Should register new user successfully
- ✅ Should return 400 for duplicate email/username
- ✅ Should validate input properly
- ✅ Should hash passwords
- ✅ Should trigger email verification
- ✅ Should handle verification failures gracefully

#### loginUser
- ✅ Should login successfully
- ✅ Should return 401 for invalid credentials
- ✅ Should return 401 for inactive users
- ✅ Should update login statistics
- ✅ Should include verification status

#### logoutUser
- ✅ Should clear refresh token cookie
- ✅ Should handle logout without user context

#### refreshAccessToken
- ✅ Should refresh tokens with valid refresh token
- ✅ Should return 401 for invalid/missing tokens
- ✅ Should handle inactive users

#### forgotPassword
- ✅ Should send reset email for valid email
- ✅ Should return success for security (non-existent emails)
- ✅ Should handle email sending failures
- ✅ Should generate secure reset tokens

#### resetPassword
- ✅ Should reset password with valid token
- ✅ Should validate password confirmation
- ✅ Should return 400 for invalid/expired tokens
- ✅ Should hash new passwords

#### requestEmailVerification
- ✅ Should send verification email
- ✅ Should return 400 if already verified
- ✅ Should handle rate limiting
- ✅ Should clear tokens on failure

#### completeEmailVerification
- ✅ Should verify email with valid token
- ✅ Should return 400 for invalid tokens
- ✅ Should handle already verified emails

#### requestPhoneVerification
- ✅ Should send verification SMS
- ✅ Should return 400 if phone missing
- ✅ Should return 400 if already verified
- ✅ Should handle rate limiting

#### completePhoneVerification
- ✅ Should verify phone with valid OTP
- ✅ Should return 400 for invalid/expired OTP
- ✅ Should handle already verified phones

## Test Data Management

### Mock Data Patterns
Tests use consistent mock data patterns:

```javascript
// Valid user data
const validUserData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  phone: '+1234567890'
};

// Mock database responses
User.findOne.mockResolvedValue(mockUser);
User.findById.mockResolvedValue(mockUser);
User.prototype.save.mockResolvedValue(mockUser);
```

### Test Isolation
Each test is isolated through:
- `beforeEach` hooks that reset all mocks
- Fresh mock objects for each test
- Independent test data

## Error Handling Tests

The test suite thoroughly covers error scenarios:

- **Validation Errors**: Invalid input handling
- **Database Errors**: Connection and query failures
- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Access control violations
- **Rate Limiting**: Request throttling
- **External Service Failures**: Email/SMS service issues

## Common Test Patterns

### Testing Async Controllers
```javascript
it('should handle async operations', async () => {
  // Mock setup
  User.findById.mockResolvedValue(mockUser);
  
  // Execute
  await controller.method(mockReq, mockRes, mockNext);
  
  // Assertions
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: true,
    data: mockUser
  });
});
```

### Testing Error Scenarios
```javascript
it('should handle errors properly', async () => {
  // Mock error
  User.findById.mockRejectedValue(new Error('Database error'));
  
  // Execute
  await controller.method(mockReq, mockRes, mockNext);
  
  // Verify error handling
  expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
});
```

### Testing Authorization
```javascript
it('should enforce access control', async () => {
  mockReq.user = { id: 'user123', role: 'user' };
  mockReq.params = { id: 'different-user' };
  
  await controller.method(mockReq, mockRes, mockNext);
  
  expect(mockRes.status).toHaveBeenCalledWith(403);
});
```

## Debugging Tests

### Running Single Tests
```bash
# Run specific test case
npm test -- --testNamePattern="should create a new user successfully"

# Run specific test file with debugging
npm test -- --testNamePattern="registerUser" __tests__/controllers/auth.controller.test.js
```

### Debugging Tips
1. Use `console.log` in test files for debugging
2. Add `--verbose` flag for detailed output
3. Use `--bail` to stop on first failure
4. Check mock call history with `expect(mockFn).toHaveBeenCalledWith()`

## CI/CD Integration

The test suite is designed for CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm test -- --coverage --watchAll=false
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Environment Variables

Tests use environment variables defined in `__tests__/setup.js`:

```javascript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/zyvo_test';
```

## Performance Considerations

- Tests are designed to run quickly (< 30 seconds total)
- Database operations are mocked to avoid I/O
- External service calls are mocked
- Parallel test execution is supported

## Best Practices

1. **Test Isolation**: Each test is independent
2. **Mock Management**: All external dependencies are mocked
3. **Error Coverage**: Both success and failure paths are tested
4. **Security Testing**: Authentication and authorization are thoroughly tested
5. **Edge Cases**: Boundary conditions and edge cases are covered
6. **Maintainability**: Tests are well-organized and documented

## Troubleshooting

### Common Issues

1. **Mock Not Reset**: Ensure `jest.clearAllMocks()` in `beforeEach`
2. **Async Handling**: Always use `await` for async operations
3. **Mock Timing**: Set up mocks before calling the function
4. **Environment Variables**: Verify test environment variables are set

### Getting Help

If you encounter issues:
1. Check the Jest documentation
2. Review the mock setup in `__tests__/setup.js`
3. Verify your test follows the established patterns
4. Check the console output for detailed error messages

## Future Enhancements

Potential test suite improvements:
- Integration tests with test database
- API endpoint tests with supertest
- Performance benchmarking
- Security testing automation
- Visual regression testing for API documentation
