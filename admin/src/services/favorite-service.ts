import { 
  Favorite, 
  FavoriteResponse, 
  FavoriteTableFilters,
  CreateFavoriteData,
  UpdateFavoriteData
} from '@/types/favorite';
import { apiClient } from '@/utils/api-client';
import { API_ENDPOINTS } from '@/config/api';

export class FavoriteServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FavoriteServiceError';
  }
}

// Get all favorites with filters and pagination
export async function getFavorites(filters: FavoriteTableFilters = {}): Promise<FavoriteResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
    if (filters.user_id) queryParams.append('user_id', filters.user_id);
    if (filters.product_variant_id) queryParams.append('product_variant_id', filters.product_variant_id);
    if (filters.include_inactive !== undefined) queryParams.append('include_inactive', filters.include_inactive.toString());
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);

    const endpoint = `${API_ENDPOINTS.FAVORITES.ADMIN_LIST}?${queryParams.toString()}`;
    console.log('🌐 Making API request to endpoint:', endpoint);
    console.log('🔑 Auth token exists:', !!sessionStorage.getItem('auth_token'));

    const response = await apiClient.request<FavoriteResponse>(endpoint);
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to fetch favorites');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error fetching favorites:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorites';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Get favorite by ID
export async function getFavoriteById(id: string): Promise<{ data: Favorite }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Favorite }>(API_ENDPOINTS.FAVORITES.ADMIN_BY_ID(id));
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to fetch favorite');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error fetching favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Create new favorite
export async function createFavorite(data: CreateFavoriteData): Promise<{ data: Favorite }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Favorite }>(API_ENDPOINTS.FAVORITES.ADMIN_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to create favorite');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error creating favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Update favorite
export async function updateFavorite(id: string, data: UpdateFavoriteData): Promise<{ data: Favorite }> {
  try {
    const response = await apiClient.request<{ success: boolean; data: Favorite }>(API_ENDPOINTS.FAVORITES.ADMIN_UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to update favorite');
    }

    return response;
  } catch (error: unknown) {
    console.error('Error updating favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Delete favorite
export async function deleteFavorite(id: string): Promise<void> {
  try {
    const response = await apiClient.request<{ success: boolean }>(API_ENDPOINTS.FAVORITES.ADMIN_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to delete favorite');
    }
  } catch (error: unknown) {
    console.error('Error deleting favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Activate favorite
export async function activateFavorite(id: string): Promise<void> {
  try {
    const response = await apiClient.request<{ success: boolean }>(API_ENDPOINTS.FAVORITES.ADMIN_ACTIVATE(id), {
      method: 'PATCH',
    });
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to activate favorite');
    }
  } catch (error: unknown) {
    console.error('Error activating favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Deactivate favorite
export async function deactivateFavorite(id: string): Promise<void> {
  try {
    const response = await apiClient.request<{ success: boolean }>(API_ENDPOINTS.FAVORITES.ADMIN_DEACTIVATE(id), {
      method: 'PATCH',
    });
    
    if (!response.success) {
      throw new FavoriteServiceError('Failed to deactivate favorite');
    }
  } catch (error: unknown) {
    console.error('Error deactivating favorite:', error);
    if (error instanceof FavoriteServiceError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate favorite';
    throw new FavoriteServiceError(errorMessage);
  }
}

// Utility functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function getStatusBadgeVariant(isActive: boolean): 'default' | 'secondary' {
  return isActive ? 'default' : 'secondary';
}

export function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
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
