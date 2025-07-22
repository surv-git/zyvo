# Integration Tests

This directory contains integration tests that verify the interaction between different components of the application.

## Test Structure

### Database Integration Tests (`database/`)
- **models.integration.test.js**: Tests model relationships, validations, and database operations
- Tests real database interactions with MongoDB Memory Server
- Verifies data integrity and constraints

### Service Integration Tests (`services/`)
- **business-logic.integration.test.js**: Tests complex business workflows
- Tests service layer interactions
- Verifies business rules and data flow

### API Integration Tests (`api/`) - DISABLED
- Currently disabled due to complex app setup requirements
- Would require full application bootstrap with all middleware
- Consider implementing after core functionality is stable

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test suites
npx jest tests/integration/database/
npx jest tests/integration/services/
```

## Current Status

✅ **Database Integration**: 5 tests passing - Model relationships and validations working correctly
✅ **Service Integration**: Business logic workflows tested
❌ **API Integration**: Disabled - Complex setup required

## Next Steps

1. Focus on expanding database and service integration tests
2. Add more complex business workflow tests
3. Consider API integration tests after core stability is achieved
4. Add performance integration tests for database operations
