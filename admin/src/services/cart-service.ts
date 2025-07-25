import { 
  Cart, 
  CartResponse, 
  CartTableFilters,
  CreateCartData,
  UpdateCartData,
  CartServiceError
} from '@/types/cart';
import { apiClient } from '@/utils/api-client';
import { API_ENDPOINTS } from '@/config/api';

// Get all carts with filters and pagination
export async function getCarts(filters: CartTableFilters = {}): Promise<CartResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
    if (filters.user_id) queryParams.append('user_id', filters.user_id);
    if (filters.has_items) queryParams.append('has_items', filters.has_items);
    if (filters.has_coupon) queryParams.append('has_coupon', filters.has_coupon);
    if (filters.min_total !== undefined) queryParams.append('min_total', filters.min_total.toString());
    if (filters.max_total !== undefined) queryParams.append('max_total', filters.max_total.toString());
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);

    const endpoint = `${API_ENDPOINTS.CART.ADMIN_LIST}?${queryParams.toString()}`;
    console.log('🛒 Making API request to endpoint:', endpoint);

    const response = await apiClient.request<CartResponse>(endpoint);
    
    if (!response.success) {
      throw new CartServiceError('Failed to fetch carts');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error fetching carts:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch carts';
    throw new CartServiceError(errorMessage);
  }
}

// Get cart by ID
export async function getCartById(id: string): Promise<{ data: Cart }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Cart }>(API_ENDPOINTS.CART.ADMIN_BY_ID(id));
    
    if (!response.success) {
      throw new CartServiceError('Failed to fetch cart');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error fetching cart:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
    throw new CartServiceError(errorMessage);
  }
}

// Create new cart
export async function createCart(data: CreateCartData): Promise<{ data: Cart }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Cart }>(API_ENDPOINTS.CART.ADMIN_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new CartServiceError('Failed to create cart');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error creating cart:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create cart';
    throw new CartServiceError(errorMessage);
  }
}

// Update cart
export async function updateCart(id: string, data: UpdateCartData): Promise<{ data: Cart }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Cart }>(API_ENDPOINTS.CART.ADMIN_UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new CartServiceError('Failed to update cart');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error updating cart:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cart';
    throw new CartServiceError(errorMessage);
  }
}

// Delete cart
export async function deleteCart(id: string): Promise<void> {
  try {
    const response = await apiClient.request<{ success: boolean }>(API_ENDPOINTS.CART.ADMIN_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new CartServiceError('Failed to delete cart');
    }
  } catch (error: unknown) {
    console.error('Error deleting cart:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete cart';
    throw new CartServiceError(errorMessage);
  }
}

// Clear cart items
export async function clearCart(id: string): Promise<void> {
  try {
    const response = await apiClient.request<{ success: boolean }>(API_ENDPOINTS.CART.ADMIN_CLEAR(id), {
      method: 'PATCH',
    });
    
    if (!response.success) {
      throw new CartServiceError('Failed to clear cart');
    }
  } catch (error: unknown) {
    console.error('Error clearing cart:', error);
    if (error instanceof CartServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
    throw new CartServiceError(errorMessage);
  }
}

// Utility functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function getStatusBadgeVariant(hasItems: boolean): 'default' | 'secondary' {
  return hasItems ? 'default' : 'secondary';
}

export function getStatusLabel(hasItems: boolean): string {
  return hasItems ? 'Active' : 'Empty';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCartServiceErrorMessage(error: unknown): string {
  if (error instanceof CartServiceError) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
