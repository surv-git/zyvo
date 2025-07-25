import { apiClient } from '@/utils/api-client';
import { 
  Address, 
  AddressWithUser, 
  AddressTableFilters, 
  AddressListResponse, 
  AddressCreateData, 
  AddressUpdateData,
  AddressType,
  VerificationSource,
  formatAddressLine,
  getUserDisplayName
} from '@/types/address';

const API_BASE = 'admin/addresses';

/**
 * Get list of addresses with filtering and pagination
 */
export const getAddresses = async (filters: AddressTableFilters = {}): Promise<AddressListResponse> => {
  const params = new URLSearchParams();
  
  // Add pagination params
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  // Add sorting params
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  
  // Add filter params
  if (filters.search) params.append('search', filters.search);
  if (filters.type) params.append('type', filters.type);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.city) params.append('city', filters.city);
  if (filters.state) params.append('state', filters.state);
  if (filters.country) params.append('country', filters.country);
  if (filters.user_id) params.append('user_id', filters.user_id);

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  
  const response = await apiClient.request<AddressListResponse>(url);
  return response;
};

// Interface for the raw API response
interface AddressApiResponse {
  _id: string;
  user_id: {
    _id: string;
    email: string;
  } | string;
  title: string;
  type: AddressType;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  is_active: boolean;
  delivery_instructions?: string;
  is_verified: boolean;
  verification_source: VerificationSource;
  last_used_at?: string | null;
  usage_count: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get address by ID
 */
export const getAddressById = async (id: string): Promise<AddressWithUser> => {
  const response = await apiClient.request<{ success: boolean; data: AddressApiResponse }>(`${API_BASE}/${id}`);
  const addressData = response.data;
  
  // Transform the response to match our interface
  // The API returns user_id as an object, but our interface expects user_id as string and user as object
  const transformedAddress: AddressWithUser = {
    ...addressData,
    type: addressData.type as AddressType,
    verification_source: addressData.verification_source as VerificationSource,
    user_id: typeof addressData.user_id === 'object' ? addressData.user_id._id : addressData.user_id,
    user: typeof addressData.user_id === 'object' ? addressData.user_id : { _id: addressData.user_id, email: '' }
  };
  
  return transformedAddress;
};

/**
 * Create new address
 */
export const createAddress = async (data: AddressCreateData): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Update address
 */
export const updateAddress = async (id: string, data: AddressUpdateData): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Delete address
 */
export const deleteAddress = async (id: string): Promise<void> => {
  await apiClient.request(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Activate address
 */
export const activateAddress = async (id: string): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}/${id}/activate`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Deactivate address
 */
export const deactivateAddress = async (id: string): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}/${id}/deactivate`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (id: string): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}/${id}/set-default`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Verify address
 */
export const verifyAddress = async (id: string): Promise<Address> => {
  const response = await apiClient.request<{ success: boolean; data: Address }>(`${API_BASE}/${id}/verify`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Get error message for address service errors
 */
export const getAddressServiceErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred with the address service';
};

// Re-export helper functions for convenience
export { formatAddressLine, getUserDisplayName };
