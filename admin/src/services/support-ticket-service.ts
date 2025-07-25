// Support Ticket Service - API calls for support ticket management

import { 
  SupportTicket, 
  SupportTicketFilters, 
  GetSupportTicketsResponse,
  SupportTicketUpdateData,
  TicketResponseData
} from '@/types/support-ticket';
import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

// Error handling helper
export function getSupportTicketServiceErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Get auth token from sessionStorage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('auth_token');
  }
  return null;
}

// Get support tickets list with filters and pagination
export async function getSupportTicketList(filters: SupportTicketFilters = {}): Promise<GetSupportTicketsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
        queryParams.append(key, String(value));
      }
    });

    const url = `${buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.LIST)}?${queryParams.toString()}`;
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch support tickets:', error);
    throw error;
  }
}

// Get single support ticket by ID
export async function getSupportTicketById(id: string): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.BY_ID(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to fetch support ticket ${id}:`, error);
    throw error;
  }
}

// Update support ticket
export async function updateSupportTicket(id: string, updateData: SupportTicketUpdateData): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.UPDATE(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to update support ticket ${id}:`, error);
    throw error;
  }
}

// Respond to support ticket
export async function respondToSupportTicket(id: string, responseData: TicketResponseData): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.RESPOND(id));
    const authToken = getAuthToken();

    // If there are attachments, use FormData
    let body: string | FormData;
    let headers = getHeaders({
      authToken: authToken || undefined,
    });

    if (responseData.attachments && responseData.attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', responseData.message);
      formData.append('is_internal', String(responseData.is_internal || false));
      formData.append('notify_user', String(responseData.notify_user !== false));
      
      if (responseData.status_update) {
        formData.append('status_update', responseData.status_update);
      }

      responseData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      body = formData;
      // Remove Content-Type header to let browser set it with boundary
      const headersWithoutContentType = { ...headers };
      delete headersWithoutContentType['Content-Type'];
      headers = headersWithoutContentType;
    } else {
      body = JSON.stringify({
        message: responseData.message,
        is_internal: responseData.is_internal || false,
        notify_user: responseData.notify_user !== false,
        status_update: responseData.status_update,
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to respond to support ticket ${id}:`, error);
    throw error;
  }
}

// Assign support ticket to admin
export async function assignSupportTicket(id: string, adminId: string): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.ASSIGN(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
      body: JSON.stringify({ admin_id: adminId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to assign support ticket ${id}:`, error);
    throw error;
  }
}

// Escalate support ticket
export async function escalateSupportTicket(id: string, reason?: string): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.ESCALATE(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
      body: JSON.stringify({ escalation_reason: reason }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to escalate support ticket ${id}:`, error);
    throw error;
  }
}

// Close support ticket
export async function closeSupportTicket(id: string, resolutionNote: string, resolutionType?: string): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.CLOSE(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
      body: JSON.stringify({ 
        resolution_note: resolutionNote,
        resolution_type: resolutionType || 'SYSTEM_FIX'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to close support ticket ${id}:`, error);
    throw error;
  }
}

// Reopen support ticket
export async function reopenSupportTicket(id: string, reason?: string): Promise<SupportTicket> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.REOPEN(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
      body: JSON.stringify({ reopen_reason: reason }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to reopen support ticket ${id}:`, error);
    throw error;
  }
}

// Delete support ticket
export async function deleteSupportTicket(id: string): Promise<void> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.DELETE(id));
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete support ticket ${id}:`, error);
    throw error;
  }
}

// Get support ticket dashboard stats
export async function getSupportTicketStats(): Promise<Record<string, unknown>> {
  try {
    const url = buildUrl(API_ENDPOINTS.SUPPORT_TICKETS.STATS);
    const authToken = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders({
        authToken: authToken || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch support ticket stats:', error);
    throw error;
  }
}
