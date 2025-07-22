// Supplier contact number service for admin dashboard API calls

import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { 
  SupplierContact, 
  SupplierContactListResponse, 
  SupplierContactCreateRequest, 
  SupplierContactUpdateRequest, 
  SupplierContactTableFilters 
} from '@/types/supplier-contact';

// Custom error class for supplier contact service
export class SupplierContactServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'SupplierContactServiceError';
  }
}

// Generic API request function for supplier contact service
async function supplierContactApiRequest<T>(
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
    throw new SupplierContactServiceError(
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
      // Handle token expiration
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('user_data');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
        }
      }
      
      throw new SupplierContactServiceError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SupplierContactServiceError) {
      throw error;
    }
    
    // Network or other errors
    throw new SupplierContactServiceError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// Build query string from filters
function buildQueryString(filters: SupplierContactTableFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
  if (filters.is_primary !== undefined) params.append('is_primary', filters.is_primary.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.order) params.append('order', filters.order);
  if (filters.include_inactive !== undefined) params.append('include_inactive', filters.include_inactive.toString());

  return params.toString();
}

// Get supplier contact numbers with filters and pagination
export async function getSupplierContacts(filters: SupplierContactTableFilters): Promise<SupplierContactListResponse> {
  const queryString = buildQueryString(filters);
  const endpoint = `${API_ENDPOINTS.SUPPLIER_CONTACT_NUMBERS.LIST}${queryString ? `?${queryString}` : ''}`;
  
  return supplierContactApiRequest<SupplierContactListResponse>(endpoint);
}

// Get a single supplier contact by ID
export async function getSupplierContact(id: string): Promise<{ success: boolean; data: SupplierContact }> {
  return supplierContactApiRequest<{ success: boolean; data: SupplierContact }>(`${API_ENDPOINTS.SUPPLIER_CONTACT_NUMBERS.BY_ID(id)}`);
}

// Create a new supplier contact
export async function createSupplierContact(contactData: SupplierContactCreateRequest): Promise<{ success: boolean; data: SupplierContact }> {
  return supplierContactApiRequest<{ success: boolean; data: SupplierContact }>(API_ENDPOINTS.SUPPLIER_CONTACT_NUMBERS.CREATE, {
    method: 'POST',
    body: JSON.stringify(contactData),
  });
}

// Update a supplier contact
export async function updateSupplierContact(id: string, contactData: SupplierContactUpdateRequest): Promise<{ success: boolean; data: SupplierContact }> {
  return supplierContactApiRequest<{ success: boolean; data: SupplierContact }>(API_ENDPOINTS.SUPPLIER_CONTACT_NUMBERS.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(contactData),
  });
}

// Delete a supplier contact
export async function deleteSupplierContact(id: string): Promise<{ success: boolean; message: string }> {
  return supplierContactApiRequest<{ success: boolean; message: string }>(API_ENDPOINTS.SUPPLIER_CONTACT_NUMBERS.DELETE(id), {
    method: 'DELETE',
  });
}

// Helper function to get contact type badge variant
export function getContactTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'Mobile':
      return 'default';
    case 'Landline':
      return 'secondary';
    case 'Whatsapp':
      return 'default';
    case 'Fax':
    case 'Toll-Free':
    case 'Other':
      return 'outline';
    default:
      return 'outline';
  }
}

// Helper function to format contact number display
export function formatContactDisplay(contact: SupplierContact): string {
  const baseNumber = contact.formatted_number || contact.contact_number;
  return contact.extension ? `${baseNumber} ext. ${contact.extension}` : baseNumber;
}

// Helper function to get contact icon
export function getContactTypeIcon(type: string): string {
  switch (type) {
    case 'Mobile':
      return '📱';
    case 'Landline':
      return '☎️';
    case 'Whatsapp':
      return '💬';
    case 'Fax':
      return '📠';
    case 'Toll-Free':
      return '☎️';
    case 'Other':
    default:
      return '📞';
  }
}
