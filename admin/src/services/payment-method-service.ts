import { apiClient } from '@/utils/api-client';
import { 
  PaymentMethod, 
  PaymentMethodWithUser, 
  PaymentMethodTableFilters, 
  PaymentMethodListResponse, 
  PaymentMethodCreateData, 
  PaymentMethodUpdateData,
  PaymentMethodType,
  PaymentMethodDetails
} from '@/types/payment-method';

const API_BASE = 'admin/payment-methods';

// Interface for the raw API response
interface PaymentMethodApiResponse {
  _id: string;
  id: string;
  user_id: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | string;
  method_type: PaymentMethodType;
  alias: string;
  display_name: string;
  is_default: boolean;
  details: PaymentMethodDetails;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

/**
 * Get list of payment methods with filtering and pagination
 */
export const getPaymentMethods = async (filters: PaymentMethodTableFilters = {}): Promise<PaymentMethodListResponse> => {
  const params = new URLSearchParams();
  
  // Add pagination params
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  // Add sorting params
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  
  // Add filter params
  if (filters.search) params.append('search', filters.search);
  if (filters.method_type) params.append('method_type', filters.method_type);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.is_default !== undefined) params.append('is_default', filters.is_default.toString());
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  
  const response = await apiClient.request<PaymentMethodListResponse>(url);
  return response;
};

/**
 * Get payment method by ID
 */
export const getPaymentMethodById = async (id: string): Promise<PaymentMethodWithUser> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethodApiResponse }>(`${API_BASE}/${id}`);
  const paymentMethodData = response.data;
  
  // Transform the response to match our interface
  // The API returns user_id as an object, but our interface expects user_id as string and user as object
  const transformedPaymentMethod: PaymentMethodWithUser = {
    ...paymentMethodData,
    user_id: typeof paymentMethodData.user_id === 'object' ? paymentMethodData.user_id._id : paymentMethodData.user_id,
    user: typeof paymentMethodData.user_id === 'object' ? paymentMethodData.user_id : { _id: paymentMethodData.user_id, email: '' }
  };
  
  return transformedPaymentMethod;
};

/**
 * Create new payment method
 */
export const createPaymentMethod = async (data: PaymentMethodCreateData): Promise<PaymentMethod> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethod }>(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (id: string, data: PaymentMethodUpdateData): Promise<PaymentMethod> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethod }>(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Delete payment method
 */
export const deletePaymentMethod = async (id: string): Promise<void> => {
  await apiClient.request<{ success: boolean; message: string }>(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Activate payment method
 */
export const activatePaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethod }>(`${API_BASE}/${id}/activate`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Deactivate payment method
 */
export const deactivatePaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethod }>(`${API_BASE}/${id}/deactivate`, {
    method: 'PATCH',
  });
  return response.data;
};

/**
 * Set payment method as default
 */
export const setDefaultPaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const response = await apiClient.request<{ success: boolean; data: PaymentMethod }>(`${API_BASE}/${id}/set-default`, {
    method: 'PATCH',
  });
  return response.data;
};
