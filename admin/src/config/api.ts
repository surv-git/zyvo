/**
 * Centralized API Configuration
 * All API endpoints, prefixes, and variables are defined here
 */

// Environment-based configuration
const getBaseUrl = (): string => {
  // Check for environment-specific URLs
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback based on environment
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://api.zyvo.com';
    case 'development':
    default:
      return 'http://localhost:3100';
  }
};

// API Configuration Object
export const API_CONFIG = {
  // Base Configuration
  BASE_URL: getBaseUrl(),
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  
  // API Version and Prefix
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',
  
  // Request Configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // CSRF Configuration
  CSRF_HEADER: 'X-CSRF-Token',
  
  // Authentication Configuration
  AUTH_HEADER: 'Authorization',
  AUTH_TYPE: 'Bearer',
  
  // Environment Flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // CSRF Token
  CSRF: {
    TOKEN: '/csrf-token',
  },
  
  // User Management
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DELETE_ACCOUNT: '/users/account',
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  
  // Admin Endpoints
  ADMIN: {
    BASE: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/users',
    MANAGE_USERS: '/admin/users',
    SETTINGS: '/admin/settings',
    ANALYTICS: '/admin/analytics',
  },
  
  // Product Management
  PRODUCTS: {
    BASE: '/products',
    LIST: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
  },
  
  // Product Variants
  PRODUCT_VARIANTS: {
    BASE: '/product-variants',
    LIST: '/product-variants',
    BY_ID: (id: string) => `/product-variants/${id}`,
    BY_PRODUCT: (productId: string) => `/products/${productId}/variants`,
    CREATE: '/product-variants',
    UPDATE: (id: string) => `/product-variants/${id}`,
    DELETE: (id: string) => `/product-variants/${id}`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    LIST: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
    TREE: '/categories/tree',
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    LIST: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    STATUS: (id: string) => `/orders/${id}/status`,
    HISTORY: '/orders/history',
  },
  
  // Cart
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (id: string) => `/cart/items/${id}`,
    REMOVE_ITEM: (id: string) => `/cart/items/${id}`,
    CLEAR: '/cart/clear',
  },
  
  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    LIST: '/reviews',
    BY_ID: (id: string) => `/reviews/${id}`,
    BY_PRODUCT: (productId: string) => `/products/${productId}/reviews`,
    CREATE: '/reviews',
    UPDATE: (id: string) => `/reviews/${id}`,
    DELETE: (id: string) => `/reviews/${id}`,
  },
  
  // Favorites/Wishlist
  FAVORITES: {
    BASE: '/favorites',
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: (id: string) => `/favorites/${id}`,
    CHECK: (productId: string) => `/favorites/check/${productId}`,
  },
  
  // Inventory
  INVENTORY: {
    BASE: '/inventory',
    LIST: '/inventory',
    BY_ID: (id: string) => `/inventory/${id}`,
    UPDATE: (id: string) => `/inventory/${id}`,
    BULK_UPDATE: '/inventory/bulk',
  },
  
  // Suppliers
  SUPPLIERS: {
    BASE: '/suppliers',
    LIST: '/suppliers',
    BY_ID: (id: string) => `/suppliers/${id}`,
    CREATE: '/suppliers',
    UPDATE: (id: string) => `/suppliers/${id}`,
    DELETE: (id: string) => `/suppliers/${id}`,
  },

  // Purchases
  PURCHASES: {
    BASE: '/purchases',
    LIST: '/purchases',
    BY_ID: (id: string) => `/purchases/${id}`,
    CREATE: '/purchases',
    UPDATE: (id: string) => `/purchases/${id}`,
    DELETE: (id: string) => `/purchases/${id}`,
  },

  // Supplier Contact Numbers
  SUPPLIER_CONTACT_NUMBERS: {
    BASE: '/supplier-contact-numbers',
    LIST: '/supplier-contact-numbers',
    BY_ID: (id: string) => `/supplier-contact-numbers/${id}`,
    CREATE: '/supplier-contact-number',
    UPDATE: (id: string) => `/supplier-contact-numbers/${id}`,
    DELETE: (id: string) => `/supplier-contact-numbers/${id}`,
  },
  
  // Brands
  BRANDS: {
    BASE: '/brands',
    LIST: '/brands',
    BY_ID: (id: string) => `/brands/${id}`,
    CREATE: '/brands',
    UPDATE: (id: string) => `/brands/${id}`,
    DELETE: (id: string) => `/brands/${id}`,
    MANAGE: (id: string) => `/brands/${id}/manage`,
  },
  
  // Options (Product Options)
  OPTIONS: {
    BASE: '/options',
    LIST: '/options',
    BY_ID: (id: string) => `/options/${id}`,
    CREATE: '/options',
    UPDATE: (id: string) => `/options/${id}`,
    DELETE: (id: string) => `/options/${id}`,
    MANAGE: (id: string) => `/options/${id}/manage`,
  },
  
  // Platforms
  PLATFORMS: {
    BASE: '/platforms',
    LIST: '/platforms',
    BY_ID: (id: string) => `/platforms/${id}`,
    CREATE: '/platforms',
    UPDATE: (id: string) => `/platforms/${id}`,
    DELETE: (id: string) => `/platforms/${id}`,
    ACTIVATE: (id: string) => `/platforms/${id}/activate`,
    DEACTIVATE: (id: string) => `/platforms/${id}/deactivate`,
  },
  
  // Listings
  LISTINGS: {
    BASE: '/listings',
    LIST: '/listings',
    BY_ID: (id: string) => `/listings/${id}`,
    CREATE: '/listings',
    UPDATE: (id: string) => `/listings/${id}`,
    DELETE: (id: string) => `/listings/${id}`,
    SYNC: (id: string) => `/listings/${id}/sync`,
    BY_PLATFORM: (platformId: string) => `/platforms/${platformId}/listings`,
  },
  
  // Reports
  REPORTS: {
    BASE: '/reports',
    SALES: '/reports/sales',
    INVENTORY: '/reports/inventory',
    USERS: '/reports/users',
    PRODUCTS: '/reports/products',
    CUSTOM: '/reports/custom',
  },
  
  // Health Check
  HEALTH: {
    CHECK: '/health',
    STATUS: '/health/status',
    METRICS: '/health/metrics',
  },
} as const;

// Helper Functions
export const buildUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${cleanEndpoint}`;
};

export const buildFullUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Get authorization header
export const getAuthHeader = (token: string): Record<string, string> => {
  return {
    [API_CONFIG.AUTH_HEADER]: `${API_CONFIG.AUTH_TYPE} ${token}`,
  };
};

// Get CSRF header
export const getCSRFHeader = (token: string): Record<string, string> => {
  return {
    [API_CONFIG.CSRF_HEADER]: token,
  };
};

// Get default headers with optional auth and CSRF
export const getHeaders = (options?: {
  authToken?: string;
  csrfToken?: string;
  customHeaders?: Record<string, string>;
}): Record<string, string> => {
  const headers = { ...API_CONFIG.DEFAULT_HEADERS };
  
  if (options?.authToken) {
    Object.assign(headers, getAuthHeader(options.authToken));
  }
  
  if (options?.csrfToken) {
    Object.assign(headers, getCSRFHeader(options.csrfToken));
  }
  
  if (options?.customHeaders) {
    Object.assign(headers, options.customHeaders);
  }
  
  return headers;
};

// Export commonly used combinations
export const API_URLS = {
  // Authentication URLs
  LOGIN: buildUrl(API_ENDPOINTS.AUTH.LOGIN),
  LOGOUT: buildUrl(API_ENDPOINTS.AUTH.LOGOUT),
  REGISTER: buildUrl(API_ENDPOINTS.AUTH.REGISTER),
  VERIFY: buildUrl(API_ENDPOINTS.AUTH.VERIFY),
  CSRF_TOKEN: buildUrl(API_ENDPOINTS.CSRF.TOKEN),
  
  // Admin URLs
  ADMIN_DASHBOARD: buildUrl(API_ENDPOINTS.ADMIN.DASHBOARD),
  ADMIN_USERS: buildUrl(API_ENDPOINTS.ADMIN.USERS),
  
  // Product URLs
  PRODUCTS: buildUrl(API_ENDPOINTS.PRODUCTS.LIST),
  CATEGORIES: buildUrl(API_ENDPOINTS.CATEGORIES.LIST),
  
  // User URLs
  PROFILE: buildUrl(API_ENDPOINTS.USERS.PROFILE),
  
  // Health Check
  HEALTH: buildUrl(API_ENDPOINTS.HEALTH.CHECK),
} as const;

// Type definitions for better TypeScript support
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
export type ApiUrl = keyof typeof API_URLS;

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    enableLogging: true,
    enableDebug: true,
    apiTimeout: 10000,
  },
  production: {
    enableLogging: false,
    enableDebug: false,
    apiTimeout: 20000,
  },
} as const;

// Get current environment config
export const getCurrentEnvConfig = () => {
  const env = process.env.NODE_ENV as keyof typeof ENV_CONFIG;
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};
