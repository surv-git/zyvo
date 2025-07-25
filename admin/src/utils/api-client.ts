/**
 * API Client Utility - Examples of using centralized API configuration
 * This file demonstrates how to use the centralized API config throughout the app
 */

import { API_CONFIG, API_ENDPOINTS, API_URLS, buildUrl, getHeaders } from '@/config/api';

// Example: Generic API client class
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  // Generic request method
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildUrl(endpoint);
    const method = options.method || 'GET';
    
    // Get auth token from sessionStorage and add to headers
    const authToken = sessionStorage.getItem('auth_token');
    const authHeaders: Record<string, string> = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    console.log('🔐 API Client - Auth token exists:', !!authToken);
    console.log('🔐 API Client - Making request to:', url);
    console.log('🔄 API Client - HTTP Method (UPDATED VERSION):', method);
    console.log('🔄 API Client - Request options (UPDATED):', options);
    
    // Force PATCH for order updates - explicit override
    if (endpoint.includes('/admin/orders/') && method === 'PATCH') {
      console.log('🔄 API Client - FORCING PATCH for order update');
    }
    
    const fetchOptions = {
      ...options,
      method, // Explicitly set the method
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
      credentials: 'include' as RequestCredentials,
    };
    
    console.log('🔄 API Client - Final fetch options (UPDATED):', fetchOptions);
    
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        console.log('🔐 Auth Debug - 401 Unauthorized received');
        console.log('🔐 Auth Debug - Auth token:', sessionStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
        console.log('🔐 Auth Debug - User data:', sessionStorage.getItem('user_data') ? 'EXISTS' : 'MISSING');
        console.log('🔐 Auth Debug - Refresh token:', sessionStorage.getItem('refresh_token') ? 'EXISTS' : 'MISSING');
        console.log('🔐 Auth Debug - Not redirecting to login for debugging purposes');
        // this.handleTokenExpiration(); // Commented out to prevent redirect
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Handle token expiration by clearing auth data and redirecting to login
  private handleTokenExpiration(): void {
    // Clear all stored authentication data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      // Redirect to login page
      window.location.href = '/login';
    }
  }

  // Authentication methods
  async login(credentials: { email: string; password: string }, csrfToken: string) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: getHeaders({ csrfToken }),
      body: JSON.stringify(credentials),
    });
  }

  async logout(csrfToken?: string) {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      headers: csrfToken ? getHeaders({ csrfToken }) : {},
    });
  }

  // Product methods
  async getProducts() {
    return this.request(API_ENDPOINTS.PRODUCTS.LIST);
  }

  async getProduct(id: string) {
    return this.request(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  }

  async createProduct(data: any, authToken: string) {
    return this.request(API_ENDPOINTS.PRODUCTS.CREATE, {
      method: 'POST',
      headers: getHeaders({ authToken }),
      body: JSON.stringify(data),
    });
  }

  // User methods
  async getProfile(authToken: string) {
    return this.request(API_ENDPOINTS.USERS.PROFILE, {
      headers: getHeaders({ authToken }),
    });
  }

  async updateProfile(data: any, authToken: string) {
    return this.request(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: 'PATCH',
      headers: getHeaders({ authToken }),
      body: JSON.stringify(data),
    });
  }

  // Order methods
  async getOrders(authToken: string) {
    return this.request(API_ENDPOINTS.ORDERS.LIST, {
      headers: getHeaders({ authToken }),
    });
  }

  async getOrder(id: string, authToken: string) {
    return this.request(API_ENDPOINTS.ORDERS.BY_ID(id), {
      headers: getHeaders({ authToken }),
    });
  }

  // Cart methods
  async getCart(authToken: string) {
    return this.request(API_ENDPOINTS.CART.BASE, {
      headers: getHeaders({ authToken }),
    });
  }

  async addToCart(data: any, authToken: string) {
    return this.request(API_ENDPOINTS.CART.ADD_ITEM, {
      method: 'POST',
      headers: getHeaders({ authToken }),
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Example: Specific service functions using centralized config
export const authService = {
  async fetchCSRFToken() {
    const response = await fetch(API_URLS.CSRF_TOKEN, {
      credentials: 'include',
    });
    return response.json();
  },

  async login(credentials: any, csrfToken: string) {
    const response = await fetch(API_URLS.LOGIN, {
      method: 'POST',
      headers: getHeaders({ csrfToken }),
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    return response.json();
  },

  async logout(csrfToken?: string) {
    const response = await fetch(API_URLS.LOGOUT, {
      method: 'POST',
      headers: csrfToken ? getHeaders({ csrfToken }) : API_CONFIG.DEFAULT_HEADERS,
      credentials: 'include',
    });
    return response.json();
  },
};

export const productService = {
  async getAll() {
    const response = await fetch(API_URLS.PRODUCTS);
    return response.json();
  },

  async getById(id: string) {
    const url = buildUrl(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    const response = await fetch(url);
    return response.json();
  },

  async search(query: string) {
    const url = buildUrl(`${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`);
    const response = await fetch(url);
    return response.json();
  },
};

export const userService = {
  async getProfile(authToken: string) {
    const response = await fetch(API_URLS.PROFILE, {
      headers: getHeaders({ authToken }),
    });
    return response.json();
  },

  async updateProfile(data: any, authToken: string) {
    const response = await fetch(API_URLS.PROFILE, {
      method: 'PATCH',
      headers: getHeaders({ authToken }),
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Example: React hook for API calls
export const useApiConfig = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    isDevelopment: API_CONFIG.IS_DEVELOPMENT,
    isProduction: API_CONFIG.IS_PRODUCTION,
    endpoints: API_ENDPOINTS,
    urls: API_URLS,
  };
};

// Example: Environment-specific behavior
export const getApiTimeout = () => {
  return API_CONFIG.IS_DEVELOPMENT ? 5000 : API_CONFIG.TIMEOUT;
};

export const shouldLogApiCalls = () => {
  return API_CONFIG.IS_DEVELOPMENT;
};

// Example: URL builders for different scenarios
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  let url = buildUrl(endpoint);
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export const buildAdminUrl = (path: string) => {
  return buildUrl(`${API_ENDPOINTS.ADMIN.BASE}${path}`);
};

export const buildUserUrl = (userId: string, action?: string) => {
  const base = API_ENDPOINTS.USERS.BY_ID(userId);
  return buildUrl(action ? `${base}/${action}` : base);
};
