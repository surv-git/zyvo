# API Configuration Guide

This document explains how to use the centralized API configuration system in the admin dashboard.

## Overview

All API endpoints, prefixes, and variables are centrally defined in `/src/config/api.ts`. This provides:

- **Single source of truth** for all API configurations
- **Easy environment switching** between development, staging, and production
- **Consistent URL building** across the application
- **Type safety** with TypeScript definitions
- **Maintainable codebase** with centralized configuration

## Configuration Files

### Main Configuration: `/src/config/api.ts`

Contains all API-related configurations:

```typescript
import { API_CONFIG, API_ENDPOINTS, API_URLS, buildUrl, getHeaders } from '@/config/api';
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000

# Environment
NODE_ENV=development
```

## Usage Examples

### 1. Basic API Calls

```typescript
import { API_URLS, buildUrl, getHeaders } from '@/config/api';

// Using pre-built URLs
const response = await fetch(API_URLS.LOGIN, {
  method: 'POST',
  headers: getHeaders({ csrfToken }),
  body: JSON.stringify(credentials),
});

// Building custom URLs
const productUrl = buildUrl(API_ENDPOINTS.PRODUCTS.BY_ID('123'));
```

### 2. Authentication

```typescript
import { API_URLS, getHeaders } from '@/config/api';

// Login
const loginResponse = await fetch(API_URLS.LOGIN, {
  method: 'POST',
  headers: getHeaders({ csrfToken }),
  body: JSON.stringify({ email, password }),
});

// Logout
const logoutResponse = await fetch(API_URLS.LOGOUT, {
  method: 'POST',
  headers: getHeaders({ csrfToken }),
});
```

### 3. Authenticated Requests

```typescript
import { buildUrl, getHeaders } from '@/config/api';

// Get user profile
const profileResponse = await fetch(API_URLS.PROFILE, {
  headers: getHeaders({ authToken }),
});

// Update product
const updateResponse = await fetch(buildUrl(API_ENDPOINTS.PRODUCTS.BY_ID('123')), {
  method: 'PATCH',
  headers: getHeaders({ authToken, csrfToken }),
  body: JSON.stringify(productData),
});
```

### 4. Using the API Client

```typescript
import { apiClient } from '@/utils/api-client';

// Login
const loginResult = await apiClient.login(credentials, csrfToken);

// Get products
const products = await apiClient.getProducts();

// Get specific product
const product = await apiClient.getProduct('123');
```

### 5. Service Functions

```typescript
import { authService, productService, userService } from '@/utils/api-client';

// Authentication
const csrfToken = await authService.fetchCSRFToken();
const loginResult = await authService.login(credentials, csrfToken);

// Products
const products = await productService.getAll();
const product = await productService.getById('123');
const searchResults = await productService.search('laptop');

// User profile
const profile = await userService.getProfile(authToken);
```

## Available Endpoints

### Authentication
- `API_URLS.LOGIN` - `/api/v1/auth/login`
- `API_URLS.LOGOUT` - `/api/v1/auth/logout`
- `API_URLS.REGISTER` - `/api/v1/auth/register`
- `API_URLS.VERIFY` - `/api/v1/auth/verify`
- `API_URLS.CSRF_TOKEN` - `/api/v1/csrf-token`

### Products
- `API_ENDPOINTS.PRODUCTS.LIST` - `/products`
- `API_ENDPOINTS.PRODUCTS.BY_ID(id)` - `/products/{id}`
- `API_ENDPOINTS.PRODUCTS.CREATE` - `/products`
- `API_ENDPOINTS.PRODUCTS.SEARCH` - `/products/search`

### Users
- `API_ENDPOINTS.USERS.PROFILE` - `/users/profile`
- `API_ENDPOINTS.USERS.BY_ID(id)` - `/users/{id}`
- `API_ENDPOINTS.USERS.LIST` - `/users`

### Orders
- `API_ENDPOINTS.ORDERS.LIST` - `/orders`
- `API_ENDPOINTS.ORDERS.BY_ID(id)` - `/orders/{id}`
- `API_ENDPOINTS.ORDERS.CREATE` - `/orders`

### Cart
- `API_ENDPOINTS.CART.BASE` - `/cart`
- `API_ENDPOINTS.CART.ADD_ITEM` - `/cart/items`
- `API_ENDPOINTS.CART.UPDATE_ITEM(id)` - `/cart/items/{id}`

### Admin
- `API_ENDPOINTS.ADMIN.DASHBOARD` - `/admin/dashboard`
- `API_ENDPOINTS.ADMIN.USERS` - `/admin/users`
- `API_ENDPOINTS.ADMIN.SETTINGS` - `/admin/settings`

## Environment Configuration

### Development
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production
```bash
NEXT_PUBLIC_API_URL=https://api.zyvo.com
```

### Custom Server
```bash
NEXT_PUBLIC_API_URL=https://your-custom-api.com
```

## Helper Functions

### URL Building
```typescript
import { buildUrl, buildApiUrl } from '@/config/api';

// Basic URL building
const url = buildUrl('/products/123');
// Result: http://localhost:3000/api/v1/products/123

// URL with query parameters
const searchUrl = buildApiUrl('/products/search', { q: 'laptop', limit: '10' });
// Result: http://localhost:3000/api/v1/products/search?q=laptop&limit=10
```

### Headers
```typescript
import { getHeaders } from '@/config/api';

// Basic headers
const headers = getHeaders();

// With authentication
const authHeaders = getHeaders({ authToken: 'your-token' });

// With CSRF token
const csrfHeaders = getHeaders({ csrfToken: 'csrf-token' });

// With both
const fullHeaders = getHeaders({ 
  authToken: 'your-token', 
  csrfToken: 'csrf-token',
  customHeaders: { 'X-Custom': 'value' }
});
```

## Best Practices

### 1. Always Use Centralized Configuration
```typescript
// ✅ Good
import { API_URLS } from '@/config/api';
const response = await fetch(API_URLS.LOGIN);

// ❌ Bad
const response = await fetch('http://localhost:3000/api/v1/auth/login');
```

### 2. Use Helper Functions
```typescript
// ✅ Good
import { getHeaders } from '@/config/api';
const headers = getHeaders({ authToken, csrfToken });

// ❌ Bad
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`,
  'X-CSRF-Token': csrfToken,
};
```

### 3. Environment-Specific Behavior
```typescript
import { API_CONFIG } from '@/config/api';

if (API_CONFIG.IS_DEVELOPMENT) {
  console.log('API call:', url);
}
```

### 4. Type Safety
```typescript
import type { ApiEndpoint, ApiUrl } from '@/config/api';

function makeApiCall(endpoint: ApiEndpoint) {
  // TypeScript will ensure endpoint is valid
}
```

## Switching Environments

### Quick Switch Script
Create a script to quickly switch between environments:

```bash
# Switch to local development
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Switch to production
echo "NEXT_PUBLIC_API_URL=https://api.zyvo.com" > .env.local

# Switch to custom server
echo "NEXT_PUBLIC_API_URL=https://staging-api.zyvo.com" > .env.local
```

### Runtime Configuration
```typescript
import { useApiConfig } from '@/utils/api-client';

function MyComponent() {
  const { baseUrl, isDevelopment } = useApiConfig();
  
  return (
    <div>
      <p>API URL: {baseUrl}</p>
      {isDevelopment && <p>Development Mode</p>}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API server allows requests from your frontend domain
2. **404 Errors**: Check that your API endpoints match the configuration
3. **Authentication Errors**: Verify that tokens are being sent correctly

### Debug Mode
```typescript
import { API_CONFIG } from '@/config/api';

if (API_CONFIG.IS_DEVELOPMENT) {
  console.log('API Configuration:', API_CONFIG);
  console.log('Available Endpoints:', API_ENDPOINTS);
}
```

This centralized configuration system makes it easy to manage all API-related settings and ensures consistency across your entire application.
