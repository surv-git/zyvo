// User service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { User, UserListResponse, UserUpdateRequest, UserManageRequest, UserManageResponse, UserTableFilters } from '@/types/user';

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

// Custom error class for user service
export class UserServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

// Generic API request function for user service
async function userApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  // Get auth token from session storage
  const authToken = sessionStorage.getItem('auth_token');
  
  // Check if user is authenticated
  if (!authToken) {
    // Handle missing token - this will trigger automatic redirect
    handleTokenExpiration();
    throw new UserServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }
  
  const defaultHeaders = getHeaders({ 
    authToken,
    customHeaders: options.headers as Record<string, string> | undefined
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        handleTokenExpiration();
      }
      throw new UserServiceError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }
    
    // Network or other errors
    throw new UserServiceError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Backend response structure
interface BackendUserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Get list of users with pagination and filters
export async function getUserList(filters: UserTableFilters): Promise<UserListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Basic filters
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    
    // Date filters
    if (filters.min_createdAt) queryParams.append('min_createdAt', filters.min_createdAt);
    if (filters.max_createdAt) queryParams.append('max_createdAt', filters.max_createdAt);
    if (filters.min_lastLoginAt) queryParams.append('min_lastLoginAt', filters.min_lastLoginAt);
    if (filters.max_lastLoginAt) queryParams.append('max_lastLoginAt', filters.max_lastLoginAt);
    
    // Sorting
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.order) queryParams.append('order', filters.order);
    
    // Pagination
    queryParams.append('page', filters.page.toString());
    queryParams.append('limit', filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.ADMIN.USERS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const backendResponse = await userApiRequest<BackendUserListResponse>(endpoint);
    
    // Transform backend response to frontend expected structure
    const response: UserListResponse = {
      users: backendResponse.data,
      total: backendResponse.pagination.totalItems,
      page: backendResponse.pagination.currentPage,
      limit: backendResponse.pagination.itemsPerPage,
      totalPages: backendResponse.pagination.totalPages
    };
    
    return response;
  } catch (error) {
    console.error('Failed to fetch user list:', error);
    throw error;
  }
}

// Get single user details
export async function getUserDetails(userId: string): Promise<User> {
  try {
    const response = await userApiRequest<{ success: boolean; data: any }>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`);
    
    // Transform backend response to frontend format
    const backendUser = response.data;
    const user: User = {
      _id: backendUser._id,
      name: backendUser.name,
      email: backendUser.email,
      role: backendUser.role,
      isActive: backendUser.isActive,
      lastLogin: backendUser.lastLogin,
      createdAt: backendUser.createdAt,
      updatedAt: backendUser.updatedAt,
      phone: backendUser.phone,
      address: backendUser.address,
      loginCount: backendUser.loginCount,
      isEmailVerified: backendUser.is_email_verified || false
    };
    
    return user;
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw error;
  }
}

// Update user information
export async function updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
  try {
    const response = await userApiRequest<{ success: boolean; data: any }>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    // Transform backend response to frontend format
    const backendUser = response.data;
    const user: User = {
      _id: backendUser._id,
      name: backendUser.name,
      email: backendUser.email,
      role: backendUser.role,
      isActive: backendUser.isActive,
      lastLogin: backendUser.lastLogin,
      createdAt: backendUser.createdAt,
      updatedAt: backendUser.updatedAt,
      phone: backendUser.phone,
      address: backendUser.address,
      loginCount: backendUser.loginCount,
      isEmailVerified: backendUser.is_email_verified || false
    };
    
    return user;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

// Manage user (suspend, activate, delete)
export async function manageUser(userId: string, action: UserManageRequest): Promise<UserManageResponse> {
  try {
    const response = await userApiRequest<UserManageResponse>(`${API_ENDPOINTS.ADMIN.MANAGE_USERS}/${userId}/manage`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
    return response;
  } catch (error) {
    console.error('Failed to manage user:', error);
    throw error;
  }
}

// Suspend user
export async function suspendUser(userId: string, reason?: string): Promise<UserManageResponse> {
  return manageUser(userId, { action: 'suspend', reason });
}

// Activate user
export async function activateUser(userId: string, reason?: string): Promise<UserManageResponse> {
  return manageUser(userId, { action: 'activate', reason });
}

// Create new user
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  isActive?: boolean;
}): Promise<User> {
  try {
    const response = await userApiRequest<{ success: boolean; data: any }>(
      API_ENDPOINTS.USERS.CREATE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }
    );
    
    // Transform backend response to frontend format
    const backendUser = response.data;
    const user: User = {
      _id: backendUser._id,
      name: backendUser.name,
      email: backendUser.email,
      role: backendUser.role,
      isActive: backendUser.isActive,
      lastLogin: backendUser.lastLogin,
      createdAt: backendUser.createdAt,
      updatedAt: backendUser.updatedAt,
      phone: backendUser.phone,
      address: backendUser.address,
      loginCount: backendUser.loginCount,
      isEmailVerified: backendUser.is_email_verified || false
    };
    
    return user;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }
    throw new UserServiceError('Failed to create user. Please try again.', 500);
  }
}

export async function deleteUser(userId: string, reason?: string): Promise<UserManageResponse> {
  return manageUser(userId, { action: 'delete', reason });
}

// Get user-friendly error message
export function getUserServiceErrorMessage(error: unknown): string {
  if (error instanceof UserServiceError) {
    switch (error.status) {
      case 400:
        return error.errors?.length 
          ? error.errors.map(e => e.message).join(', ')
          : 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized to perform this action.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'User not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
