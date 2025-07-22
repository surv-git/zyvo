import { apiClient } from '@/utils/api-client';
import { getHeaders, API_ENDPOINTS } from '@/config/api';
import type { 
  Platform, 
  PlatformListParams, 
  PlatformListResponse,
  PlatformCreateRequest,
  PlatformUpdateRequest 
} from '@/types/platform';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token');
};

// Helper function to get headers with auth token
const getAuthHeaders = (customHeaders?: Record<string, string>) => {
  const authToken = getAuthToken();
  return getHeaders({
    authToken: authToken || undefined,
    customHeaders
  });
};export const getPlatformList = async (params: PlatformListParams = {}): Promise<PlatformListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);

  const endpoint = `${API_ENDPOINTS.PLATFORMS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient.request<PlatformListResponse>(endpoint, {
    headers: getAuthHeaders()
  });
  return response;
};

export const getPlatformById = async (id: string): Promise<Platform> => {
  const response = await apiClient.request<{data: Platform}>(API_ENDPOINTS.PLATFORMS.BY_ID(id), {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const createPlatform = async (data: PlatformCreateRequest): Promise<Platform> => {
  const response = await apiClient.request<{data: Platform}>(API_ENDPOINTS.PLATFORMS.CREATE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.data;
};

export const updatePlatform = async (id: string, data: PlatformUpdateRequest): Promise<Platform> => {
  const response = await apiClient.request<{data: Platform}>(API_ENDPOINTS.PLATFORMS.UPDATE(id), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.data;
};

export const deletePlatform = async (id: string): Promise<void> => {
  await apiClient.request(API_ENDPOINTS.PLATFORMS.DELETE(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

export const activatePlatform = async (id: string): Promise<Platform> => {
  const response = await apiClient.request<{data: Platform}>(API_ENDPOINTS.PLATFORMS.ACTIVATE(id), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deactivatePlatform = async (id: string): Promise<Platform> => {
  const response = await apiClient.request<{data: Platform}>(API_ENDPOINTS.PLATFORMS.DEACTIVATE(id), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return response.data;
};
