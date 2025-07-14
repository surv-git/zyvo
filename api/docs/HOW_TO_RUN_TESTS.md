# How to Run the Jest Unit Tests

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test Files
```bash
# Run only user controller tests
npm test -- __tests__/controllers/user.controller.test.js

# Run only auth controller tests
npm test -- __tests__/controllers/auth.controller.test.js
```

## Test Structure

The Jest testing framework has been configured with:

- **Jest Configuration**: `jest.config.js` - Defines test environment, file patterns, and coverage settings
- **Global Setup**: `__tests__/setup.js` - Mock configurations and global utilities
- **Test Files**: 
  - `__tests__/controllers/user.controller.test.js` - User controller tests
  - `__tests__/controllers/auth.controller.test.js` - Authentication controller tests

## What's Tested

### User Controller Tests
- ✅ User creation with validation
- ✅ User retrieval with pagination and filtering
- ✅ User updates with verification status management
- ✅ User deletion (soft and hard delete)
- ✅ Admin dashboard analytics endpoints
- ✅ Access control and authorization

### Authentication Controller Tests
- ✅ User registration with email verification
- ✅ User login with verification status
- ✅ JWT token management (access and refresh)
- ✅ Password reset functionality
- ✅ Email verification workflow
- ✅ Phone verification workflow
- ✅ Rate limiting and security features

## Mock Strategy

All external dependencies are mocked to ensure tests run in isolation:

- **Database**: Mongoose User model operations
- **Security**: bcrypt, JWT, crypto operations
- **External Services**: Email, SMS verification services
- **Express Objects**: Request, response, and next function mocks

## Test Coverage

The test suite aims for comprehensive coverage:

- **Branches**: 80% target
- **Functions**: 80% target
- **Lines**: 80% target
- **Statements**: 80% target

## Key Features Tested

### Security Features
- Password hashing and validation
- JWT token generation and validation
- Input validation and sanitization
- Rate limiting protection
- Access control enforcement

### Business Logic
- User registration and verification workflows
- Email and phone verification processes
- Admin dashboard analytics
- Soft and hard delete operations
- Pagination and filtering logic

### Error Handling
- Validation errors
- Database errors
- Authentication failures
- Authorization violations
- External service failures

## Common Commands

```bash
# Run all tests
npm test

# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage report
npm test -- --coverage

# Run tests and watch for changes
npm test -- --watch

# Run specific test pattern
npm test -- --testNamePattern="should register"

# Run tests in a specific file
npm test -- __tests__/controllers/auth.controller.test.js

# Run tests with debugging
npm test -- --detectOpenHandles --forceExit
```

## Test Output

The tests will output:
- ✅ Passing tests with execution time
- ❌ Failing tests with detailed error messages
- 📊 Coverage report showing tested vs untested code
- 🔍 Mock call verification and assertion details

## Understanding Test Results

### Passing Tests
When tests pass, you'll see green checkmarks and the test description.

### Failing Tests
When tests fail, you'll see:
- Red X marks
- Expected vs actual values
- Stack traces showing where the assertion failed
- Mock call history and verification failures

### Coverage Report
The coverage report shows:
- **Statements**: Individual code statements executed
- **Branches**: Conditional code paths taken
- **Functions**: Functions that were called
- **Lines**: Lines of code executed

## Troubleshooting

### Common Issues

1. **Mock Setup Issues**: Check `__tests__/setup.js` for proper mock configurations
2. **Path Issues**: Ensure all file paths are correct relative to project root
3. **Async Issues**: Make sure all async operations use `await`
4. **Mock Timing**: Set up mocks before calling the functions under test

### Debug Tips

1. Add `console.log` statements in tests to debug values
2. Use `--verbose` flag for detailed test output
3. Check mock call history with `expect(mockFn).toHaveBeenCalledWith()`
4. Verify async operations complete with proper error handling

## Environment

The tests run in a Node.js environment with:
- Test environment variables set in `__tests__/setup.js`
- Isolated database mocking
- No external service dependencies
- Fast execution times

## Next Steps

1. Run the tests to see current status
2. Review any failing tests and fix issues
3. Add more test cases as needed
4. Integrate with CI/CD pipeline
5. Set up automated coverage reporting

The test suite provides a solid foundation for ensuring code quality and preventing regressions as the API evolves.
