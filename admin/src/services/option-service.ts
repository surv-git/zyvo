// Option service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { Option, OptionListResponse, OptionTableFilters, OptionUpdateRequest, OptionCreateRequest, OptionServiceError } from '@/types/option';

// Generic API request function for options
async function optionApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new OptionServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  try {
    const headers = getHeaders({ authToken });
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new OptionServiceError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    
    // Network or other errors
    throw new OptionServiceError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Backend response structure
interface BackendOptionListResponse {
  success: boolean;
  data: Option[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Get list of options with pagination and filters
export async function getOptionList(filters: OptionTableFilters): Promise<OptionListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Basic filters
    queryParams.append('page', filters.page.toString());
    queryParams.append('limit', filters.limit.toString());
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.option_type) queryParams.append('option_type', filters.option_type);
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.order) queryParams.append('order', filters.order);
    if (filters.include_inactive) queryParams.append('include_inactive', filters.include_inactive.toString());

    const endpoint = buildUrl(`${API_ENDPOINTS.OPTIONS.LIST}?${queryParams.toString()}`);
    const response = await optionApiRequest<BackendOptionListResponse>(endpoint);

    return {
      options: response.data,
      total: response.pagination.totalItems,
      page: response.pagination.currentPage,
      limit: response.pagination.itemsPerPage,
      totalPages: response.pagination.totalPages,
      pagination: response.pagination
    };
  } catch (error) {
    console.error('Failed to fetch options:', error);
    throw error;
  }
}

// Get single option by ID
export async function getOptionById(id: string): Promise<Option> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.BY_ID(id));
    const response = await optionApiRequest<{ success: boolean; data: Option }>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch option details:', error);
    throw error;
  }
}

// Create option
export async function createOption(optionData: OptionCreateRequest): Promise<Option> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.CREATE);
    const response = await optionApiRequest<{ success: boolean; data: Option }>(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optionData),
      }
    );
    
    return response.data;
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    throw new OptionServiceError('Failed to create option. Please try again.', 500);
  }
}

// Update option
export async function updateOption(id: string, optionData: OptionUpdateRequest): Promise<Option> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.UPDATE(id));
    const response = await optionApiRequest<{ success: boolean; data: Option }>(
      endpoint,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optionData),
      }
    );
    
    return response.data;
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    throw new OptionServiceError('Failed to update option. Please try again.', 500);
  }
}

// Activate option
export async function activateOption(id: string): Promise<void> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.MANAGE(id));
    await optionApiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'activate' }),
    });
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    throw new OptionServiceError('Failed to activate option. Please try again.', 500);
  }
}

// Deactivate option
export async function deactivateOption(id: string): Promise<void> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.MANAGE(id));
    await optionApiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'deactivate' }),
    });
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    throw new OptionServiceError('Failed to deactivate option. Please try again.', 500);
  }
}

// Delete option
export async function deleteOption(id: string): Promise<void> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.OPTIONS.DELETE(id));
    await optionApiRequest(endpoint, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof OptionServiceError) {
      throw error;
    }
    throw new OptionServiceError('Failed to delete option. Please try again.', 500);
  }
}

// Get user-friendly error message
export function getOptionServiceErrorMessage(error: unknown): string {
  if (error instanceof OptionServiceError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
