import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { InventoryListResponse, InventoryQueryParams, InventoryRecord, InventoryUpdateRequest } from '@/types/inventory';

// Custom error class for inventory service
export class InventoryServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'InventoryServiceError';
  }
}

// Generic API request function for inventory service
async function inventoryApiRequest<T>(
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
    throw new InventoryServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      ...getHeaders({ authToken }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (response.status === 401) {
      // Handle token expiration - this will trigger automatic redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      throw new InventoryServiceError(
        'Session expired. Please log in again.',
        401
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Unknown error occurred' };
      }
      
      throw new InventoryServiceError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.errors
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InventoryServiceError) {
      throw error;
    }
    
    console.error('Inventory service request failed:', error);
    throw new InventoryServiceError(
      'Network error or server unavailable',
      0
    );
  }
}

/**
 * Inventory Service
 * Handles all inventory-related API operations
 */

/**
 * Get all inventory records with optional filtering and pagination
 */
export async function getAllInventoryRecords(params: InventoryQueryParams = {}): Promise<InventoryListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    // Add filter parameters
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.stock_status) queryParams.append('stock_status', params.stock_status);
    if (params.location) queryParams.append('location', params.location);
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.include_computed_packs !== undefined) {
      queryParams.append('include_computed_packs', params.include_computed_packs.toString());
    }
    
    // Add sorting parameters
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const endpoint = `${API_ENDPOINTS.INVENTORY.LIST}?${queryParams.toString()}`;
    
    return await inventoryApiRequest<InventoryListResponse>(endpoint);
  } catch (error) {
    console.error('Failed to fetch inventory records:', error);
    throw error;
  }
}

/**
 * Get inventory record by ID
 */
export async function getInventoryRecordById(id: string): Promise<InventoryRecord> {
  try {
    const response = await inventoryApiRequest<{ success: boolean; data: InventoryRecord }>(
      API_ENDPOINTS.INVENTORY.BY_ID(id)
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch inventory record ${id}:`, error);
    throw error;
  }
}

/**
 * Update inventory record
 */
export async function updateInventoryRecord(id: string, data: InventoryUpdateRequest): Promise<InventoryRecord> {
  try {
    const response = await inventoryApiRequest<{ success: boolean; data: InventoryRecord }>(
      API_ENDPOINTS.INVENTORY.UPDATE(id),
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update inventory record ${id}:`, error);
    throw error;
  }
}

/**
 * Bulk update inventory records
 */
export async function bulkUpdateInventoryRecords(updates: Array<{ id: string; data: InventoryUpdateRequest }>): Promise<void> {
  try {
    await inventoryApiRequest(API_ENDPOINTS.INVENTORY.BULK_UPDATE, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  } catch (error) {
    console.error('Failed to bulk update inventory records:', error);
    throw error;
  }
}

/**
 * Get inventory service error message
 */
export function getInventoryServiceErrorMessage(error: unknown): string {
  if (error instanceof InventoryServiceError) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  return 'An unexpected error occurred while processing inventory data';
}
