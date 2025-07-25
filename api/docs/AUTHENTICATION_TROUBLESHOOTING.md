# Authentication Troubleshooting Guide

## Issue Summary
You reported getting 401 errors with "[guest]" user logs despite having an auth header. Our debugging revealed that the authentication system is working correctly.

## Root Cause Analysis

### ✅ What's Working
- Authentication middleware is properly configured
- Token generation and validation is functional
- Admin route mounting order is correct (specific routes before general ones)
- The `/api/v1/admin/user-coupons` endpoint works with proper authentication

### 🔍 Likely Causes of 401 Errors

1. **Missing Bearer Prefix**
   ```javascript
   // ❌ Wrong
   headers: { 'Authorization': 'your-token-here' }
   
   // ✅ Correct  
   headers: { 'Authorization': 'Bearer your-token-here' }
   ```

2. **Token Expiration**
   - JWTs expire after 7 days by default
   - Check if your stored token is still valid

3. **Frontend Request Issues**
   ```javascript
   // Common issues in frontend code:
   
   // ❌ Token not being sent
   const token = localStorage.getItem('token');
   if (!token) {
     // Handle missing token
   }
   
   // ❌ Malformed header
   headers: { 'Authorization': `Bearer${token}` } // Missing space
   
   // ✅ Correct implementation
   headers: { 'Authorization': `Bearer ${token}` }
   ```

4. **CORS Preflight Requests**
   - Browser preflight OPTIONS requests don't include auth headers
   - These show as "[guest]" in logs but are normal

## Debugging Steps

### 1. Check Frontend Token Storage
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('Auth header:', `Bearer ${localStorage.getItem('token')}`);
```

### 2. Verify Token Validity
```bash
# Test with curl using a fresh token
curl -X GET "http://localhost:3100/api/v1/admin/user-coupons?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. Check Network Requests
- Open browser DevTools → Network tab
- Look for the actual request headers being sent
- Verify the Authorization header is present and correctly formatted

### 4. Generate Fresh Token
```bash
# Run the debug script to get a fresh token
node debug-auth.js
```

## Quick Fix Checklist

- [ ] Verify token exists in localStorage/sessionStorage
- [ ] Check token has "Bearer " prefix (with space)
- [ ] Confirm token hasn't expired (7 days default)
- [ ] Test with curl to isolate frontend vs backend issues
- [ ] Check browser console for JavaScript errors
- [ ] Verify network request shows correct headers

## Frontend Code Template

```javascript
// Correct way to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    // Redirect to login
  }
  
  return response;
};

// Usage
try {
  const response = await makeAuthenticatedRequest(
    'http://localhost:3100/api/v1/admin/user-coupons?page=1&limit=5'
  );
  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Request failed:', error);
}
```

## Testing Endpoint Confirmed Working

The endpoint `/api/v1/admin/user-coupons` is working correctly:
- ✅ Authentication middleware functional
- ✅ Admin role authorization working  
- ✅ Returns proper user coupon data
- ✅ Pagination and filtering operational

**Test Result**: 200 OK with 60 user coupons across 12 pages
