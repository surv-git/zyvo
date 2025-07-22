// Purchase service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { 
  PurchaseListResponse, 
  PurchaseResponse, 
  PurchaseCreateRequest, 
  PurchaseUpdateRequest, 
  PurchaseTableFilters 
} from '@/types/purchase';

// Custom error class for purchase service
export class PurchaseServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'PurchaseServiceError';
  }
}

// Generic API request function for purchase service
async function purchaseApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  // Get auth token from session storage
  const authToken = sessionStorage.getItem('auth_token');
  
  // Check if user is authenticated
  if (!authToken) {
    // Handle missing token - this will trigger automatic redirect
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    throw new PurchaseServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders({ authToken }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Handle token expiration - this will trigger automatic redirect
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    throw new PurchaseServiceError(
      'Session expired. Please log in again.',
      401
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errors: Array<{ field: string; message: string }> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errors = errorData.errors;
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new PurchaseServiceError(errorMessage, response.status, errors);
  }

  return response.json();
}

// Get list of purchases with optional filters
export async function getPurchases(filters: PurchaseTableFilters = {}): Promise<PurchaseListResponse> {
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const endpoint = queryParams.toString() 
    ? `${API_ENDPOINTS.PURCHASES.LIST}?${queryParams.toString()}`
    : API_ENDPOINTS.PURCHASES.LIST;

  return purchaseApiRequest<PurchaseListResponse>(endpoint);
}

// Get a single purchase by ID
export async function getPurchase(id: string): Promise<PurchaseResponse> {
  return purchaseApiRequest<PurchaseResponse>(API_ENDPOINTS.PURCHASES.BY_ID(id));
}

// Create a new purchase
export async function createPurchase(purchaseData: PurchaseCreateRequest): Promise<PurchaseResponse> {
  return purchaseApiRequest<PurchaseResponse>(API_ENDPOINTS.PURCHASES.CREATE, {
    method: 'POST',
    body: JSON.stringify(purchaseData),
  });
}

// Update an existing purchase
export async function updatePurchase(id: string, purchaseData: PurchaseUpdateRequest): Promise<PurchaseResponse> {
  return purchaseApiRequest<PurchaseResponse>(API_ENDPOINTS.PURCHASES.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(purchaseData),
  });
}

// Delete a purchase
export async function deletePurchase(id: string): Promise<{ success: boolean; message: string }> {
  return purchaseApiRequest<{ success: boolean; message: string }>(API_ENDPOINTS.PURCHASES.DELETE(id), {
    method: 'DELETE',
  });
}

// Get purchase statistics (if needed)
export async function getPurchaseStats(): Promise<{
  total: number;
  planned: number;
  pending: number;
  completed: number;
  cancelled: number;
  partiallyReceived: number;
}> {
  return purchaseApiRequest<{
    total: number;
    planned: number;
    pending: number;
    completed: number;
    cancelled: number;
    partiallyReceived: number;
  }>(`${API_ENDPOINTS.PURCHASES.BASE}/stats`);
}
