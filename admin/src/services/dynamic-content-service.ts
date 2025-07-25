import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

// Enums
export enum DynamicContentType {
  Advertisement = "ADVERTISEMENT",
  Carousel = "CAROUSEL",
  Marquee = "MARQUEE",
  Offer = "OFFER",
  Promo = "PROMO",
}

// Interfaces
export interface DynamicContentCreatedBy {
  _id: string;
  name: string;
  email: string;
  fullName: string;
  id: string;
}

export interface DynamicContent {
  _id: string;
  name: string;
  type: DynamicContentType;
  location_key: string;
  content_order: number;
  is_active: boolean;
  display_start_date: string | null;
  display_end_date: string | null;
  primary_image_url: string | null;
  mobile_image_url: string | null;
  alt_text: string | null;
  caption: string | null;
  main_text_content: string | null;
  link_url: string | null;
  call_to_action_text: string | null;
  target_audience_tags: string[];
  created_by: DynamicContentCreatedBy;
  updated_by: DynamicContentCreatedBy | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  is_currently_active: boolean;
  id: string;
}

export interface DynamicContentTableFilters {
  search?: string;
  type?: DynamicContentType | 'all';
  location_key?: string;
  is_active?: boolean | 'all';
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DynamicContentListResponse {
  success: boolean;
  data: DynamicContent[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface DynamicContentDetailResponse {
  success: boolean;
  data: DynamicContent;
  message?: string;
}

export interface CreateDynamicContentData {
  name: string;
  type: DynamicContentType;
  location_key: string;
  content_order: number;
  is_active: boolean;
  display_start_date?: string | null;
  display_end_date?: string | null;
  primary_image_url?: string | null;
  mobile_image_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  main_text_content?: string | null;
  link_url?: string | null;
  call_to_action_text?: string | null;
  target_audience_tags?: string[];
}

export interface UpdateDynamicContentData extends CreateDynamicContentData {
  id?: string;
}

export class DynamicContentServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'DynamicContentServiceError';
  }
}

// Helper function to build query string
const buildQueryString = (filters: DynamicContentTableFilters): string => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.location_key) params.append('location_key', filters.location_key);
  if (filters.is_active !== undefined && filters.is_active !== 'all') {
    params.append('is_active', filters.is_active.toString());
  }
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.order) params.append('order', filters.order);
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

// Generic API request function
async function dynamicContentApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new DynamicContentServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const headers = getHeaders({ 
    authToken,
    customHeaders: options.headers as Record<string, string>
  });
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the default error message
    }

    if (response.status === 401) {
      throw new DynamicContentServiceError('Authentication required. Please log in to access this resource.', 401);
    }
    if (response.status === 403) {
      throw new DynamicContentServiceError('Access denied. You do not have permission to access this resource.', 403);
    }
    if (response.status === 404) {
      throw new DynamicContentServiceError('Dynamic content not found.', 404);
    }
    
    throw new DynamicContentServiceError(errorMessage, response.status);
  }

  return response.json();
}

// Service Functions
export async function getDynamicContent(filters: DynamicContentTableFilters = {}): Promise<DynamicContentListResponse> {
  const queryString = buildQueryString(filters);
  const endpoint = `${buildUrl(API_ENDPOINTS.DYNAMIC_CONTENT.LIST)}${queryString}`;
  
  try {
    const response = await dynamicContentApiRequest<DynamicContentListResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch dynamic content:', error);
    throw error;
  }
}

export async function getDynamicContentById(id: string): Promise<DynamicContentDetailResponse> {
  const endpoint = buildUrl(API_ENDPOINTS.DYNAMIC_CONTENT.BY_ID(id));
  
  try {
    const response = await dynamicContentApiRequest<DynamicContentDetailResponse>(endpoint);
    return response;
  } catch (error) {
    console.error(`Failed to fetch dynamic content ${id}:`, error);
    throw error;
  }
}

export async function createDynamicContent(contentData: CreateDynamicContentData): Promise<DynamicContentDetailResponse> {
  const endpoint = buildUrl(API_ENDPOINTS.DYNAMIC_CONTENT.CREATE);
  
  try {
    const response = await dynamicContentApiRequest<DynamicContentDetailResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(contentData),
    });
    return response;
  } catch (error) {
    console.error('Failed to create dynamic content:', error);
    throw error;
  }
}

export async function updateDynamicContent(id: string, contentData: Partial<UpdateDynamicContentData>): Promise<DynamicContentDetailResponse> {
  const endpoint = buildUrl(API_ENDPOINTS.DYNAMIC_CONTENT.UPDATE(id));
  
  try {
    const response = await dynamicContentApiRequest<DynamicContentDetailResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(contentData),
    });
    return response;
  } catch (error) {
    console.error(`Failed to update dynamic content ${id}:`, error);
    throw error;
  }
}

export async function deleteDynamicContent(id: string): Promise<{ success: boolean; message: string }> {
  const endpoint = buildUrl(API_ENDPOINTS.DYNAMIC_CONTENT.DELETE(id));
  
  try {
    const response = await dynamicContentApiRequest<{ success: boolean; message: string }>(endpoint, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error(`Failed to delete dynamic content ${id}:`, error);
    throw error;
  }
}
