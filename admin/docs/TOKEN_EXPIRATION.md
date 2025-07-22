# Token Expiration Handling

This guide explains how the automatic token expiration handling works in the admin panel.

## Overview

When an authentication token expires (HTTP 401 response), the system automatically:
1. Clears all stored authentication data
2. Updates the application state
3. Redirects the user to the login page

## Implementation

### API Layer (`lib/api.ts`)

The `apiRequest` function automatically detects 401 responses and handles token expiration:

```typescript
// In lib/api.ts
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // ... fetch logic ...
  
  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401) {
      handleTokenExpiration();
    }
    // ... error handling ...
  }
}

function handleTokenExpiration(): void {
  // Clear auth data and redirect to login
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  }
}
```

### Auth Context (`contexts/auth-context.tsx`)

The auth context provides a `handleTokenExpiration` method that components can use:

```typescript
const { handleTokenExpiration } = useAuth();

// Use in API calls or error handlers
try {
  const result = await apiCall();
} catch (error) {
  if (error.status === 401) {
    handleTokenExpiration();
  }
}
```

### Custom Hooks

#### `useApi` Hook

For basic API calls that don't require authentication:

```typescript
import { useApi } from '@/hooks/use-api';

function MyComponent() {
  const api = useApi();
  
  const fetchData = async () => {
    try {
      const data = await api.get('/public-endpoint');
      // Handle success
    } catch (error) {
      // Token expiration is handled automatically
    }
  };
}
```

#### `useAuthenticatedApi` Hook

For API calls that require authentication tokens:

```typescript
import { useAuthenticatedApi } from '@/hooks/use-authenticated-api';

function MyComponent() {
  const api = useAuthenticatedApi();
  
  const fetchUserData = async () => {
    try {
      const data = await api.get('/user/profile');
      // Handle success
    } catch (error) {
      // Token expiration and redirect handled automatically
    }
  };
}
```

## Usage Examples

### In Service Files

```typescript
// In a service file
import { useAuthenticatedApi } from '@/hooks/use-authenticated-api';

export const userService = {
  async getProfile() {
    const api = useAuthenticatedApi();
    return api.get('/users/profile');
  },
  
  async updateProfile(data: UpdateProfileData) {
    const api = useAuthenticatedApi();
    return api.patch('/users/profile', data);
  }
};
```

### In Management Tables

```typescript
// In a management table component
import { useAuthenticatedApi } from '@/hooks/use-authenticated-api';

export default function UserManagementTable() {
  const api = useAuthenticatedApi();
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      // Token expiration handled automatically
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };
}
```

## Benefits

1. **Automatic Handling**: No need to manually check for 401 responses in every component
2. **Consistent Behavior**: All API calls behave the same way when tokens expire
3. **Clean State**: Auth data is properly cleared before redirect
4. **User Experience**: Seamless redirect to login page without manual intervention
5. **Security**: Prevents stale tokens from being used

## Testing Token Expiration

To test the token expiration handling:

1. Log in to the application
2. Manually expire the token on the server or wait for natural expiration
3. Make any API call (e.g., navigate to a management page)
4. Verify that you're automatically redirected to the login page
5. Check that all auth data has been cleared from storage
