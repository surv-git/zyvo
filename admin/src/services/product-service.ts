// Product service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { Product, ProductListResponse, ProductTableFilters, CreateProductData } from '@/types/product';

// Custom error class for product service
export class ProductServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

// Generic API request function for product service
async function productApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  // Get auth token from session storage
  const authToken = sessionStorage.getItem('auth_token');
  
  // Check if user is authenticated
  if (!authToken) {
    throw new ProductServiceError(
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
      throw new ProductServiceError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ProductServiceError) {
      throw error;
    }
    
    // Network or other errors
    throw new ProductServiceError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Backend response structure
interface BackendProductListResponse {
  success: boolean;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Get list of products with pagination and filters
export async function getProductList(filters: ProductTableFilters): Promise<ProductListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Basic filters
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.brand_id) queryParams.append('brand_id', filters.brand_id);
    queryParams.append('include_inactive', filters.include_inactive.toString());
    
    // Pagination
    queryParams.append('page', filters.page.toString());
    queryParams.append('limit', filters.limit.toString());
    
    // Sorting
    queryParams.append('sort', filters.sort);
    queryParams.append('order', filters.order);

    const endpoint = `${API_ENDPOINTS.PRODUCTS.LIST}?${queryParams}`;
    const backendResponse = await productApiRequest<BackendProductListResponse>(endpoint);
    
    // Transform backend response to frontend format
    return {
      products: backendResponse.data,
      totalPages: backendResponse.pagination.totalPages,
      total: backendResponse.pagination.totalItems,
      currentPage: backendResponse.pagination.currentPage,
      hasNextPage: backendResponse.pagination.hasNextPage,
      hasPrevPage: backendResponse.pagination.hasPreviousPage,
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product> {
  try {
    const endpoint = API_ENDPOINTS.PRODUCTS.BY_ID(id);
    const response = await productApiRequest<{ success: boolean; data: Product }>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// Create new product
export async function createProduct(productData: CreateProductData): Promise<Product> {
  try {
    const response = await productApiRequest<{ success: boolean; data: Product }>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Update product
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  try {
    const endpoint = API_ENDPOINTS.PRODUCTS.UPDATE(id);
    const response = await productApiRequest<{ success: boolean; data: Product }>(
      endpoint,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Toggle product active status
export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
  try {
    const endpoint = API_ENDPOINTS.PRODUCTS.UPDATE(id);
    const response = await productApiRequest<{ success: boolean; data: Product }>(
      endpoint,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw error;
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const endpoint = API_ENDPOINTS.PRODUCTS.DELETE(id);
    await productApiRequest<{ success: boolean }>(endpoint, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Error message helper
export function getProductServiceErrorMessage(error: unknown): string {
  if (error instanceof ProductServiceError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
