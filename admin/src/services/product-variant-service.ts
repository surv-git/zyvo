import { buildUrl, getHeaders } from '@/config/api';
import { 
  ProductVariant, 
  ProductVariantListResponse, 
  ProductVariantTableFilters,
  ProductVariantCreateRequest,
  ProductVariantUpdateRequest
} from '@/types/product-variant';

const PRODUCT_VARIANT_ENDPOINTS = {
  LIST: '/product-variants',
  DETAILS: (id: string) => `/product-variants/${id}`,
  CREATE: '/product-variants',
  UPDATE: (id: string) => `/product-variants/${id}`,
  DELETE: (id: string) => `/product-variants/${id}`,
  ACTIVATE: (id: string) => `/product-variants/${id}/activate`,
  DEACTIVATE: (id: string) => `/product-variants/${id}/deactivate`,
} as const;

export class ProductVariantServiceError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ProductVariantServiceError';
  }
}

export const getProductVariantServiceErrorMessage = (error: unknown): string => {
  if (error instanceof ProductVariantServiceError) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred while processing product variant operation';
};

// Generic API request function for product variants
async function productVariantApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new ProductVariantServiceError(
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
      throw new ProductVariantServiceError(
        data.message || `HTTP error! status: ${response.status}`,
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    console.error('Product variant API request failed:', error);
    throw new ProductVariantServiceError(
      'Failed to complete request. Please check your connection and try again.',
      500
    );
  }
}

export const getProductVariantList = async (filters: ProductVariantTableFilters = {}): Promise<ProductVariantListResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to params
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.is_on_sale !== undefined) params.append('is_on_sale', filters.is_on_sale.toString());
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    if (filters.include_inactive !== undefined) params.append('include_inactive', filters.include_inactive.toString());

    const url = buildUrl(`${PRODUCT_VARIANT_ENDPOINTS.LIST}?${params.toString()}`);
    const response = await productVariantApiRequest<ProductVariantListResponse>(url);
    
    return response;
  } catch (error) {
    console.error('Error fetching product variants:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to fetch product variants'
    );
  }
};

export const getProductVariantById = async (id: string): Promise<ProductVariant> => {
  try {
    const response = await productVariantApiRequest<{success: boolean; data: ProductVariant}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.DETAILS(id))
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to fetch product variant'
    );
  }
};

export const createProductVariant = async (data: ProductVariantCreateRequest): Promise<ProductVariant> => {
  try {
    const response = await productVariantApiRequest<{success: boolean; data: ProductVariant}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.CREATE),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to create product variant'
    );
  }
};

export const updateProductVariant = async (id: string, data: ProductVariantUpdateRequest): Promise<ProductVariant> => {
  try {
    const response = await productVariantApiRequest<{success: boolean; data: ProductVariant}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.UPDATE(id)),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to update product variant'
    );
  }
};

export const deleteProductVariant = async (id: string): Promise<void> => {
  try {
    await productVariantApiRequest<{success: boolean}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.DELETE(id)),
      {
        method: 'DELETE',
      }
    );
  } catch (error) {
    console.error('Error deleting product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to delete product variant'
    );
  }
};

export const activateProductVariant = async (id: string): Promise<ProductVariant> => {
  try {
    const response = await productVariantApiRequest<{success: boolean; data: ProductVariant}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.ACTIVATE(id)),
      {
        method: 'POST',
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error activating product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to activate product variant'
    );
  }
};

export const deactivateProductVariant = async (id: string): Promise<ProductVariant> => {
  try {
    const response = await productVariantApiRequest<{success: boolean; data: ProductVariant}>(
      buildUrl(PRODUCT_VARIANT_ENDPOINTS.DEACTIVATE(id)),
      {
        method: 'POST',
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error deactivating product variant:', error);
    
    if (error instanceof ProductVariantServiceError) {
      throw error;
    }
    
    throw new ProductVariantServiceError(
      error instanceof Error ? error.message : 'Failed to deactivate product variant'
    );
  }
};
