import { Category, CategoryTableFilters, CategoryListResponse, CategoryServiceError } from '@/types/category';
import { API_CONFIG, API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

// Backend response interface (matches actual API response structure)
interface BackendCategoryListResponse {
  success: boolean;
  message: string;
  data: Category[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Generic API request function for categories
async function categoryApiRequest<T>(endpoint: string): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new CategoryServiceError(
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
      throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
    }
    if (response.status === 403) {
      throw new CategoryServiceError('Access denied. You do not have permission to access this resource.', 403);
    }
    if (response.status === 404) {
      throw new CategoryServiceError('Resource not found.', 404);
    }
    throw new CategoryServiceError(`Request failed with status ${response.status}`, response.status);
  }

  return response.json();
}

// Get categories list with filters
export async function getCategoryList(filters: CategoryTableFilters): Promise<CategoryListResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.parent_id) params.append('parent_id', filters.parent_id);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.include_inactive !== undefined) params.append('include_inactive', filters.include_inactive.toString());
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());

    const endpoint = `${buildUrl(API_ENDPOINTS.CATEGORIES.LIST)}?${params.toString()}`;
    
    const backendResponse = await categoryApiRequest<BackendCategoryListResponse>(endpoint);
    
    // Transform backend response to frontend expected structure
    const response: CategoryListResponse = {
      categories: backendResponse.data || [],
      total: backendResponse.pagination?.totalItems || backendResponse.data?.length || 0,
      page: backendResponse.pagination?.currentPage || filters.page,
      limit: backendResponse.pagination?.itemsPerPage || filters.limit,
      totalPages: backendResponse.pagination?.totalPages || Math.ceil((backendResponse.data?.length || 0) / filters.limit)
    };

    return response;
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to fetch categories. Please try again.', 500);
  }
}

// Get single category by ID
export async function getCategoryById(id: string): Promise<Category> {
  try {
    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.BY_ID(id));
    const response = await categoryApiRequest<{ success: boolean; data: Category }>(endpoint);
    return response.data;
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to fetch category details. Please try again.', 500);
  }
}

// Activate category
export async function activateCategory(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
    }

    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.UPDATE(id));
    const headers = getHeaders({ authToken });

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: true }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      throw new CategoryServiceError(`Failed to activate category. Status: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to activate category. Please try again.', 500);
  }
}

// Deactivate category
export async function deactivateCategory(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
    }

    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.UPDATE(id));
    const headers = getHeaders({ authToken });

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: false }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      throw new CategoryServiceError(`Failed to deactivate category. Status: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to deactivate category. Please try again.', 500);
  }
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  try {
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
    }

    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.DELETE(id));
    const headers = getHeaders({ authToken });

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      throw new CategoryServiceError(`Failed to delete category. Status: ${response.status}`, response.status);
    }
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to delete category. Please try again.', 500);
  }
}

// Create new category
export async function createCategory(categoryData: {
  name: string;
  slug: string;
  description: string;
  parent_category?: string;
  image_url: string;
  is_active: boolean;
}): Promise<Category> {
  try {
    // Check authentication
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new CategoryServiceError(
        'Authentication required. Please log in to access this resource.',
        401
      );
    }

    const headers = getHeaders({ authToken });
    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.CREATE);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      if (response.status === 403) {
        throw new CategoryServiceError('Access denied. You do not have permission to create categories.', 403);
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new CategoryServiceError(errorData.message || 'Invalid category data provided.', 400);
      }
      throw new CategoryServiceError(`Failed to create category. Status: ${response.status}`, response.status);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to create category. Please try again.', 500);
  }
}

// Update existing category
export async function updateCategory(id: string, categoryData: {
  name: string;
  slug: string;
  description: string;
  parent_category?: string;
  image_url: string;
  is_active: boolean;
}): Promise<Category> {
  try {
    // Check authentication
    const authToken = sessionStorage.getItem('auth_token');
    if (!authToken) {
      throw new CategoryServiceError(
        'Authentication required. Please log in to access this resource.',
        401
      );
    }

    const headers = getHeaders({ authToken });
    const endpoint = buildUrl(API_ENDPOINTS.CATEGORIES.UPDATE(id));
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new CategoryServiceError('Authentication required. Please log in to access this resource.', 401);
      }
      if (response.status === 403) {
        throw new CategoryServiceError('Access denied. You do not have permission to update categories.', 403);
      }
      if (response.status === 404) {
        throw new CategoryServiceError('Category not found.', 404);
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new CategoryServiceError(errorData.message || 'Invalid category data provided.', 400);
      }
      throw new CategoryServiceError(`Failed to update category. Status: ${response.status}`, response.status);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to update category. Please try again.', 500);
  }
}

// Get all active categories for dropdowns
export async function getAllActiveCategories(): Promise<Category[]> {
  try {
    const endpoint = `${buildUrl(API_ENDPOINTS.CATEGORIES.LIST)}?is_active=true&limit=1000`;
    const response = await categoryApiRequest<BackendCategoryListResponse>(endpoint);
    return response.data || [];
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      throw error;
    }
    throw new CategoryServiceError('Failed to fetch categories. Please try again.', 500);
  }
}

// Get error message from category service error
export function getCategoryServiceErrorMessage(error: any): string {
  if (error instanceof CategoryServiceError) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
