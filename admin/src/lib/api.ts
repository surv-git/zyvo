// API utility functions for authentication

import { LoginRequest, AuthResponse, CSRFResponse, AuthError } from '@/types/auth';
import { API_CONFIG, API_URLS, buildUrl, getHeaders } from '@/config/api';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Use centralized URL building
  const url = endpoint.startsWith('http') ? endpoint : buildUrl(endpoint);
  
  const defaultHeaders = {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      credentials: 'include', // Include cookies for CSRF and session management
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as AuthError;
      
      // Handle token expiration
      if (response.status === 401) {
        handleTokenExpiration();
      }
      
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new APIError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Handle token expiration by clearing auth data and redirecting to login
function handleTokenExpiration(): void {
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

// Fetch CSRF token
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await apiRequest<CSRFResponse>(API_URLS.CSRF_TOKEN);
    return response.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
}

// Login API call
export async function loginUser(
  credentials: LoginRequest,
  csrfToken: string
): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>(API_URLS.LOGIN, {
      method: 'POST',
      headers: getHeaders({ csrfToken }),
      body: JSON.stringify(credentials),
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Logout API call
export async function logoutUser(csrfToken?: string): Promise<void> {
  try {
    const headers = csrfToken ? getHeaders({ csrfToken }) : {};

    await apiRequest(API_URLS.LOGOUT, {
      method: 'POST',
      headers,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    // Don't throw error for logout - we'll clear local state anyway
  }
}

// Verify token and get user info
export async function verifyToken(): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>(API_URLS.VERIFY);
    return response;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

// Get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        return error.errors?.length 
          ? error.errors.map(e => e.message).join(', ')
          : 'Invalid input. Please check your information.';
      case 401:
        return 'Invalid email or password. Please try again.';
      case 429:
        return 'Too many login attempts. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
