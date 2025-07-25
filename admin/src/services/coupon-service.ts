import { API_CONFIG, API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

export interface UserCoupon {
  _id: string;
  coupon_code: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    fullName: string;
    id: string;
  };
  coupon_campaign_id: {
    _id: string;
    name: string;
    slug: string;
    discount_type: string;
    discount_value: number;
    usage_stats: {
      usage_percentage: number;
      remaining_usage: number | null;
    };
    id: string;
  };
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  current_usage_count: number;
  remaining_usage: number | null;
  expires_at: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface CouponStats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

export interface CouponTableFilters {
  search: string;
  status: 'all' | 'ACTIVE' | 'USED' | 'EXPIRED';
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface CouponResponse {
  success: boolean;
  message: string;
  data: UserCoupon[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters_applied: Record<string, unknown>;
}

export interface CouponDetailResponse {
  success: boolean;
  message?: string;
  data: UserCoupon;
}

// Get user coupons with filters and pagination
export async function getUserCoupons(filters: CouponTableFilters): Promise<CouponResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.status !== 'all') params.append('status', filters.status);
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  params.append('sort', filters.sort);
  params.append('order', filters.order);

  const url = buildUrl(API_ENDPOINTS.COUPONS.ADMIN_USER_COUPONS) + '?' + params.toString();
  
  const authToken = sessionStorage.getItem('auth_token');
  console.log('🔐 Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
  
  const headers = getHeaders({ authToken: authToken || undefined });
  console.log('📤 Request URL:', url);
  console.log('📋 Request Headers:', headers);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Get coupon statistics
export async function getCouponStats(): Promise<CouponStats> {
  const url = buildUrl(API_ENDPOINTS.COUPONS.ADMIN_USER_COUPONS) + '?stats_only=true';
  
  const authToken = sessionStorage.getItem('auth_token');
  console.log('🔐 Auth Token (Stats):', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
  
  const headers = getHeaders({ authToken: authToken || undefined });
  console.log('📤 Stats Request URL:', url);
  console.log('📋 Stats Request Headers:', headers);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.stats;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Get coupon by ID
export async function getCouponById(id: string): Promise<CouponDetailResponse> {
  const url = buildUrl(API_ENDPOINTS.COUPONS.BY_ID(id));
  
  const authToken = sessionStorage.getItem('auth_token');
  const headers = getHeaders({ authToken: authToken || undefined });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (typeof data === 'object' && data !== null) {
      // Check if it's already in the expected format
      if ('success' in data && 'data' in data) {
        return data as CouponDetailResponse;
      } else {
        // If it's raw coupon data, wrap it in expected format
        return {
          success: true,
          data: data as UserCoupon
        };
      }
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Deactivate coupon
export async function deactivateCoupon(id: string): Promise<{ success: boolean; message: string }> {
  const url = buildUrl(API_ENDPOINTS.COUPONS.ADMIN_DEACTIVATE(id));
  
  const authToken = sessionStorage.getItem('auth_token');
  console.log('🔐 Auth Token (Deactivate):', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
  
  const headers = getHeaders({ authToken: authToken || undefined });
  console.log('📤 Deactivate Request URL:', url);
  console.log('📋 Deactivate Request Headers:', headers);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
