// Supplier service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { Supplier, SupplierListResponse, SupplierCreateRequest, SupplierUpdateRequest, SupplierTableFilters, SupplierAddress } from '@/types/supplier';

// Custom error class for supplier service
export class SupplierServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'SupplierServiceError';
  }
}

// Generic API request function for supplier service
async function supplierApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  // Get auth token from session storage
  const authToken = sessionStorage.getItem('auth_token');
  
  // Check if user is authenticated
  if (!authToken) {
    // Handle missing token - this will trigger automatic redirect
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    throw new SupplierServiceError(
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
      
      throw new SupplierServiceError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SupplierServiceError) {
      throw error;
    }
    
    // Network or other errors
    throw new SupplierServiceError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Build query string from filters
function buildQueryString(filters: SupplierTableFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.country) params.append('country', filters.country);
  if (filters.product_categories_supplied) params.append('product_categories_supplied', filters.product_categories_supplied);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.order) params.append('order', filters.order);
  if (filters.include_inactive !== undefined) params.append('include_inactive', filters.include_inactive.toString());

  return params.toString();
}

// Get suppliers with filters and pagination
export async function getSuppliers(filters: SupplierTableFilters): Promise<SupplierListResponse> {
  const queryString = buildQueryString(filters);
  const endpoint = `${API_ENDPOINTS.SUPPLIERS.LIST}${queryString ? `?${queryString}` : ''}`;
  
  return supplierApiRequest<SupplierListResponse>(endpoint);
}

// Get a single supplier by ID
export async function getSupplier(id: string): Promise<{ success: boolean; data: Supplier }> {
  return supplierApiRequest<{ success: boolean; data: Supplier }>(`${API_ENDPOINTS.SUPPLIERS.BY_ID(id)}`);
}

// Create a new supplier
export async function createSupplier(supplierData: SupplierCreateRequest): Promise<{ success: boolean; data: Supplier }> {
  return supplierApiRequest<{ success: boolean; data: Supplier }>(API_ENDPOINTS.SUPPLIERS.CREATE, {
    method: 'POST',
    body: JSON.stringify(supplierData),
  });
}

// Update a supplier
export async function updateSupplier(id: string, supplierData: SupplierUpdateRequest): Promise<{ success: boolean; data: Supplier }> {
  return supplierApiRequest<{ success: boolean; data: Supplier }>(API_ENDPOINTS.SUPPLIERS.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(supplierData),
  });
}

// Delete a supplier
export async function deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
  return supplierApiRequest<{ success: boolean; message: string }>(API_ENDPOINTS.SUPPLIERS.DELETE(id), {
    method: 'DELETE',
  });
}

// Helper function to get supplier status badge variant
export function getSupplierStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'success' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Inactive':
      return 'secondary';
    case 'On Hold':
      return 'destructive';
    case 'Pending Approval':
      return 'default';
    default:
      return 'default';
  }
}

// Helper function to format supplier display name
export function formatSupplierName(supplier: Supplier): string {
  return supplier.display_name || supplier.name;
}

// Helper function to format supplier address
export function formatSupplierAddress(address: SupplierAddress): string {
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.zipcode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
}
