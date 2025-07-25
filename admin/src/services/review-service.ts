/**
 * Review Service
 * API integration for admin review management
 */

import { API_CONFIG, API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';
import { 
  Review, 
  ReviewListRequest, 
  ReviewListResponse, 
  ReviewDetailResponse,
  ReviewServiceError,
  ReviewTableFilters,
  ReviewStatus 
} from '@/types/review';

/**
 * Generic API request function with authentication
 */
async function reviewApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authToken = sessionStorage.getItem('auth_token');
  
  if (!authToken) {
    throw new ReviewServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const url = buildUrl(endpoint);
  const headers = getHeaders({ authToken });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReviewServiceError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      throw error;
    }
    throw new ReviewServiceError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}

/**
 * Get paginated list of reviews for admin management
 */
export async function getAdminReviewList(filters: ReviewTableFilters): Promise<ReviewListResponse> {
  const params = new URLSearchParams();
  
  // Add pagination parameters
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  
  // Add filter parameters
  if (filters.search.trim()) {
    params.append('search', filters.search.trim());
  }
  
  if (filters.status !== 'all') {
    params.append('status', filters.status);
  }
  
  if (filters.product_id.trim()) {
    params.append('product_id', filters.product_id.trim());
  }
  
  // Add sorting parameters
  params.append('sort', filters.sort);
  params.append('order', filters.order);

  const endpoint = `${API_ENDPOINTS.REVIEWS.ADMIN_LIST}?${params.toString()}`;
  
  return await reviewApiRequest<ReviewListResponse>(endpoint);
}

/**
 * Get single review by ID
 */
export async function getReviewById(id: string): Promise<ReviewDetailResponse> {
  const endpoint = API_ENDPOINTS.REVIEWS.BY_ID(id);
  return await reviewApiRequest<ReviewDetailResponse>(endpoint);
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  id: string, 
  status: ReviewStatus, 
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const endpoint = API_ENDPOINTS.REVIEWS.ADMIN_UPDATE_STATUS(id);
  
  const body: { status: ReviewStatus; reason?: string } = { status };
  if (reason) {
    body.reason = reason;
  }
  
  return await reviewApiRequest<{ success: boolean; message: string }>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Approve a review (convenience function)
 */
export async function approveReview(id: string): Promise<{ success: boolean; message: string }> {
  return updateReviewStatus(id, ReviewStatus.APPROVED);
}

/**
 * Reject a review (convenience function)
 */
export async function rejectReview(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return updateReviewStatus(id, ReviewStatus.REJECTED, reason);
}

/**
 * Get review statistics (optional - for dashboard cards)
 */
export async function getReviewStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  try {
    // This would be a separate endpoint if available
    // For now, we'll return mock data or derive from the main list
    const response = await getAdminReviewList({
      search: '',
      status: 'all',
      product_id: '',
      page: 1,
      limit: 1,
      sort: 'createdAt',
      order: 'desc'
    });
    
    return {
      total: response.pagination.total_items,
      pending: 0, // Would need separate API calls or endpoint
      approved: 0,
      rejected: 0,
    };
  } catch (error) {
    console.error('Failed to fetch review stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  }
}
