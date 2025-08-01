# Products API Pagination Debug Guide

## Issue
The `/api/v1/products` endpoint always returns 17 products regardless of query parameters like `page` and `limit`.

## Debugging Steps Added

### 1. Enhanced Logging
Added comprehensive debug logging to the `getAllProducts` controller:
- Original query parameters
- Raw parameter values and types
- Parsed pagination values
- Aggregation results
- Validation errors

### 2. Validation Error Handling
Added proper validation error handling to catch and log any parameter validation issues.

### 3. Robust Parameter Parsing
Improved parameter parsing with bounds checking:
- `page`: minimum 1, defaults to 1
- `limit`: minimum 1, maximum 100, defaults to 10

## Testing Scripts Created

### 1. API Test Script (when server is running)
```bash
./debug/test-products-pagination.sh
```

### 2. Node.js API Test
```bash
node debug/test-products-simple.js
```

### 3. Direct MongoDB Test
```bash
node debug/simple-products-test.js
```

## How to Debug

### Step 1: Start the server and check logs
1. Start your API server
2. Make a request to `/api/v1/products?limit=5`
3. Check the console logs for debug output

### Step 2: Run the test scripts
```bash
# Test with different parameters
curl "http://localhost:3000/api/v1/products?limit=5" | jq '.data | length'
curl "http://localhost:3000/api/v1/products?limit=1" | jq '.data | length'
curl "http://localhost:3000/api/v1/products?page=2&limit=10" | jq '.data | length'
```

### Step 3: Check for common issues

#### A. Parameter Type Issues
Look for debug logs showing parameter types. Query parameters are always strings, so ensure proper parsing.

#### B. Validation Errors
Check if validation middleware is rejecting requests with error messages.

#### C. Aggregation Pipeline Issues
The complex aggregation pipeline might have issues. The debug logs will show:
- Expected skip/limit values
- Actual results returned
- Total count from database

#### D. Database Issues
Run the direct MongoDB test to see if the issue is in the aggregation logic or API layer.

## Potential Root Causes

### 1. Middleware Issues
- Validation middleware rejecting requests
- Caching middleware returning cached results
- Rate limiting affecting requests

### 2. Aggregation Pipeline Issues
- Complex pipeline with multiple stages might have bugs
- `$facet` stage not working as expected
- Grouping logic affecting pagination

### 3. Parameter Parsing Issues
- Query parameters not being parsed correctly
- Default values overriding provided parameters

### 4. Database/Model Issues
- MongoDB aggregation not working as expected
- Model configuration issues

## Expected Debug Output

When you make a request, you should see logs like:
```
🔍 Products API Debug: {
  originalQuery: { limit: '5', page: '1' },
  rawValues: { page: '1', limit: '5' },
  parsedParams: { page: 1, limit: 5, skip: 0 },
  types: { pageType: 'string', limitType: 'string', pageNumType: 'number', limitNumType: 'number' }
}

📊 Products API Results: {
  productsCount: 5,
  totalItems: 50,
  totalPages: 10,
  expectedSkip: 0,
  expectedLimit: 5,
  facetResult: { paginatedResultsLength: 5, totalCountResult: [{ count: 50 }] }
}
```

If the `productsCount` doesn't match `expectedLimit`, there's an issue with the aggregation pipeline.

## Next Steps

1. Start the server and make test requests
2. Check the debug logs in the console
3. Run the test scripts to identify the exact issue
4. Based on the logs, we can pinpoint whether it's:
   - Parameter parsing issue
   - Validation issue
   - Aggregation pipeline issue
   - Database/model issue

The debug logs will help us identify exactly where the issue is occurring.
