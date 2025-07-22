import { buildUrl, getHeaders, API_ENDPOINTS } from '@/config/api';
import { 
  Listing, 
  ListingResponse, 
  ListingTableFilters, 
  ListingCreateData, 
  ListingUpdateData,
  Platform
} from '@/types/listing';

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

// Listing service error class
class ListingServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ListingServiceError';
  }
}

// API request function with authentication
async function listingApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const authToken = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
    
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      headers: {
        ...getHeaders({ authToken: authToken || undefined }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      handleTokenExpiration();
      throw new ListingServiceError('Authentication failed', 401);
    }

    if (!response.ok) {
      throw new ListingServiceError(`Request failed: ${response.statusText}`, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ListingServiceError) {
      throw error;
    }
    throw new ListingServiceError(error instanceof Error ? error.message : 'Request failed');
  }
}

export async function getListingList(filters: ListingTableFilters): Promise<{
  listings: Listing[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    
    // Add optional filter parameters
    if (filters.platform_id) params.append('platform_id', filters.platform_id);
    if (filters.product_variant_id) params.append('product_variant_id', filters.product_variant_id);
    if (filters.listing_status) params.append('listing_status', filters.listing_status);
    if (filters.is_active_on_platform !== undefined) params.append('is_active_on_platform', filters.is_active_on_platform.toString());
    if (filters.platform_sku) params.append('platform_sku', filters.platform_sku);
    if (filters.platform_product_id) params.append('platform_product_id', filters.platform_product_id);
    if (filters.needs_sync !== undefined) params.append('needs_sync', filters.needs_sync.toString());
    if (filters.has_price !== undefined) params.append('has_price', filters.has_price.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await listingApiRequest<ListingResponse>(`${API_ENDPOINTS.LISTINGS.LIST}?${params.toString()}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch listings');
    }

    return {
      listings: response.data,
      total: response.pagination.total_items,
      totalPages: response.pagination.total_pages,
      currentPage: response.pagination.current_page,
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
}

export async function getAvailablePlatforms(): Promise<Platform[]> {
  try {
    const response = await listingApiRequest<{ success: boolean; data: Platform[]; message?: string }>(API_ENDPOINTS.PLATFORMS.LIST);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch platforms');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching platforms:', error);
    throw error;
  }
}

export async function getListingsByPlatform(platformId: string, filters?: Partial<ListingTableFilters>): Promise<{
  listings: Listing[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const params = new URLSearchParams();
    
    // Add pagination parameters with defaults
    params.append('page', (filters?.page || 1).toString());
    params.append('limit', (filters?.limit || 10).toString());
    
    // Add optional filter parameters
    if (filters?.product_variant_id) params.append('product_variant_id', filters.product_variant_id);
    if (filters?.listing_status) params.append('listing_status', filters.listing_status);
    if (filters?.is_active_on_platform !== undefined) params.append('is_active_on_platform', filters.is_active_on_platform.toString());
    if (filters?.platform_sku) params.append('platform_sku', filters.platform_sku);
    if (filters?.platform_product_id) params.append('platform_product_id', filters.platform_product_id);
    if (filters?.needs_sync !== undefined) params.append('needs_sync', filters.needs_sync.toString());
    if (filters?.has_price !== undefined) params.append('has_price', filters.has_price.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const response = await listingApiRequest<ListingResponse>(`${API_ENDPOINTS.LISTINGS.BY_PLATFORM(platformId)}?${params.toString()}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch listings by platform');
    }

    return {
      listings: response.data,
      total: response.pagination.total_items,
      totalPages: response.pagination.total_pages,
      currentPage: response.pagination.current_page,
    };
  } catch (error) {
    console.error('Error fetching listings by platform:', error);
    throw error;
  }
}

export async function getListingsByPlatformName(platformName: string, filters?: Partial<ListingTableFilters>): Promise<{
  listings: Listing[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    // First get all platforms to find the ID by name
    const platforms = await getAvailablePlatforms();
    const platform = platforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
    
    if (!platform) {
      throw new ListingServiceError(`Platform '${platformName}' not found`);
    }
    
    // Use the platform ID to get listings
    return await getListingsByPlatform(platform._id, filters);
  } catch (error) {
    console.error('Error fetching listings by platform name:', error);
    throw error;
  }
}

export async function getListingById(id: string): Promise<Listing> {
  try {
    const response = await listingApiRequest<{ success: boolean; data: Listing; message?: string }>(API_ENDPOINTS.LISTINGS.BY_ID(id));
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch listing');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching listing by ID:', error);
    throw error;
  }
}

export async function createListing(data: ListingCreateData): Promise<Listing> {
  try {
    const response = await listingApiRequest<{ success: boolean; data: Listing; message: string }>(API_ENDPOINTS.LISTINGS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to create listing');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

export async function updateListing(id: string, data: Partial<ListingUpdateData>): Promise<Listing> {
  try {
    const response = await listingApiRequest<{ success: boolean; data: Listing; message: string }>(API_ENDPOINTS.LISTINGS.UPDATE(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update listing');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

export async function deleteListing(id: string): Promise<void> {
  try {
    const response = await listingApiRequest<{ success: boolean; message: string }>(API_ENDPOINTS.LISTINGS.DELETE(id), {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete listing');
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

export async function syncListing(id: string): Promise<Listing> {
  try {
    const response = await listingApiRequest<{ success: boolean; data: Listing; message: string }>(API_ENDPOINTS.LISTINGS.SYNC(id), {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to sync listing');
    }

    return response.data;
  } catch (error) {
    console.error('Error syncing listing:', error);
    throw error;
  }
}

// Export the error class for use in components
export { ListingServiceError };

// Helper function to format service errors for display
export function getListingServiceErrorMessage(error: unknown): string {
  if (error instanceof ListingServiceError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
