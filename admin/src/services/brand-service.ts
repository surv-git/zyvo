import { Brand, BrandTableFilters, BrandListResponse, BrandServiceError } from '@/types/brand';
import { API_CONFIG, API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

// Backend response interface (matches actual API response structure)
interface BackendBrandListResponse {
  success: boolean;
  data: Brand[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Generic API request function for brands
async function brandApiRequest<T>(endpoint: string): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new BrandServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const headers = getHeaders({ authToken });
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new BrandServiceError('Authentication required. Please log in to access this resource.', 401);
    }
    if (response.status === 403) {
      throw new BrandServiceError('Access denied. You do not have permission to access this resource.', 403);
    }
    if (response.status === 404) {
      throw new BrandServiceError('Resource not found.', 404);
    }
    throw new BrandServiceError(`Request failed with status ${response.status}`, response.status);
  }

  return response.json();
}

// Get brands list with filters
export async function getBrandList(filters: BrandTableFilters): Promise<BrandListResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.include_inactive !== undefined) params.append('include_inactive', filters.include_inactive.toString());
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());

    const endpoint = `${buildUrl(API_ENDPOINTS.BRANDS.LIST)}?${params.toString()}`;
    
    const backendResponse = await brandApiRequest<BackendBrandListResponse>(endpoint);
    
    // Transform backend response to frontend expected structure
    const response: BrandListResponse = {
      brands: backendResponse.data || [],
      total: backendResponse.pagination?.totalItems || backendResponse.data?.length || 0,
      page: backendResponse.pagination?.currentPage || filters.page,
      limit: backendResponse.pagination?.itemsPerPage || filters.limit,
      totalPages: backendResponse.pagination?.totalPages || Math.ceil((backendResponse.data?.length || 0) / filters.limit)
    };

    return response;
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to fetch brands. Please try again.', 500);
  }
}

// Get single brand by ID
export async function getBrandById(id: string): Promise<Brand> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.BRANDS.BY_ID(id));
    const response = await brandApiRequest<{ success: boolean; data: Brand }>(endpoint);
    return response.data;
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to fetch brand details. Please try again.', 500);
  }
}

// Activate brand
export async function activateBrand(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new BrandServiceError('Authentication required. Please log in to access this resource.', 401);
    }

    const endpoint = buildUrl(API_ENDPOINTS.BRANDS.MANAGE(id));
    const headers = getHeaders({ authToken });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'activate' }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new BrandServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      throw new BrandServiceError(`Failed to activate brand. Status: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to activate brand. Please try again.', 500);
  }
}

// Deactivate brand
export async function deactivateBrand(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new BrandServiceError('Authentication required. Please log in to access this resource.', 401);
    }

    const endpoint = buildUrl(API_ENDPOINTS.BRANDS.MANAGE(id));
    const headers = getHeaders({ authToken });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'deactivate' }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new BrandServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      throw new BrandServiceError(`Failed to deactivate brand. Status: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to deactivate brand. Please try again.', 500);
  }
}

// Create brand
export async function createBrand(brandData: {
  name: string;
  description: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  is_active?: boolean;
}): Promise<Brand> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new BrandServiceError('Authentication required', 401);
    }

    const headers = getHeaders({ authToken });
    
    const response = await fetch(buildUrl(API_ENDPOINTS.BRANDS.CREATE), {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new BrandServiceError('Authentication required', 401);
      }
      if (response.status === 403) {
        throw new BrandServiceError('Access denied', 403);
      }
      if (response.status === 400) {
        throw new BrandServiceError(errorData.message || 'Invalid brand data', 400);
      }
      throw new BrandServiceError(`Failed to create brand: ${response.status}`, response.status);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to create brand. Please try again.', 500);
  }
}

// Update brand
export async function updateBrand(id: string, brandData: {
  name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  is_active?: boolean;
}): Promise<Brand> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new BrandServiceError('Authentication required', 401);
    }

    const headers = getHeaders({ authToken });
    
    const response = await fetch(buildUrl(API_ENDPOINTS.BRANDS.UPDATE(id)), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new BrandServiceError('Authentication required', 401);
      }
      if (response.status === 403) {
        throw new BrandServiceError('Access denied', 403);
      }
      if (response.status === 404) {
        throw new BrandServiceError('Brand not found', 404);
      }
      if (response.status === 400) {
        throw new BrandServiceError(errorData.message || 'Invalid brand data', 400);
      }
      throw new BrandServiceError(`Failed to update brand: ${response.status}`, response.status);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to update brand. Please try again.', 500);
  }
}

// Delete brand
export async function deleteBrand(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new BrandServiceError('Authentication required', 401);
    }

    const headers = getHeaders({ authToken });
    
    const response = await fetch(buildUrl(API_ENDPOINTS.BRANDS.DELETE(id)), {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new BrandServiceError('Authentication required', 401);
      }
      if (response.status === 403) {
        throw new BrandServiceError('Access denied', 403);
      }
      if (response.status === 404) {
        throw new BrandServiceError('Brand not found', 404);
      }
      throw new BrandServiceError(`Failed to delete brand: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to delete brand. Please try again.', 500);
  }
}

// Get all active brands for dropdowns
export async function getAllActiveBrands(): Promise<Brand[]> {
  try {
    const endpoint = `${buildUrl(API_ENDPOINTS.BRANDS.LIST)}?is_active=true&limit=1000`;
    const response = await brandApiRequest<BackendBrandListResponse>(endpoint);
    return response.data || [];
  } catch (error) {
    if (error instanceof BrandServiceError) {
      throw error;
    }
    throw new BrandServiceError('Failed to fetch brands. Please try again.', 500);
  }
}

// Get error message from brand service error
export function getBrandServiceErrorMessage(error: any): string {
  if (error instanceof BrandServiceError) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
