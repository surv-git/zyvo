import { API_CONFIG, buildUrl, getHeaders } from '@/config/api';

// Enums
export enum DiscountType {
  Amount = "AMOUNT",
  FreeShipping = "FREE_SHIPPING",
  Percentage = "PERCENTAGE",
}

export enum CampaignStatus {
  Active = "ACTIVE",
  Expired = "EXPIRED",
  Inactive = "INACTIVE",
  Scheduled = "SCHEDULED",
}

export enum EligibilityCriteria {
  AllUsers = "ALL_USERS",
  FirstOrder = "FIRST_ORDER",
  NewUser = "NEW_USER", 
  None = "NONE",
  Referral = "REFERRAL",
  SpecificUserGroup = "SPECIFIC_USER_GROUP",
}

// Interfaces
export interface CouponCampaign {
  _id: string;
  name: string;
  slug: string;
  description: string;
  code_prefix: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_coupon_discount: number | null;
  valid_from: string;
  valid_until: string;
  max_global_usage: number;
  current_global_usage: number;
  max_usage_per_user: number;
  is_unique_per_user: boolean;
  eligibility_criteria: EligibilityCriteria[];
  applicable_category_ids: string[];
  applicable_product_variant_ids: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  validity_period: {
    from: string;
    until: string;
    is_currently_valid: boolean;
  };
  usage_stats: {
    current_usage: number;
    max_usage: number;
    usage_percentage: number;
    remaining_usage: number;
  };
  id: string;
}

export interface CampaignTableFilters {
  search: string;
  status: 'all' | CampaignStatus;
  discount_type: 'all' | DiscountType;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface CampaignStats {
  total: number;
  active: number;
  inactive: number;
  scheduled: number;
  expired: number;
}

export interface CampaignResponse {
  success: boolean;
  message: string;
  data: CouponCampaign[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters_applied: Record<string, string | number | boolean>;
}

export interface CampaignDetailResponse {
  success: boolean;
  message?: string;
  data: CouponCampaign;
}

export interface CampaignStatsResponse {
  success: boolean;
  message: string;
  data: CampaignStats;
}

export interface CreateCampaignData {
  name: string;
  description: string;
  code_prefix: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_coupon_discount: number | null;
  valid_from: string;
  valid_until: string;
  max_global_usage: number;
  max_usage_per_user: number;
  is_unique_per_user: boolean;
  eligibility_criteria: EligibilityCriteria[];
  applicable_category_ids: string[];
  applicable_product_variant_ids: string[];
  is_active: boolean;
}

export interface UpdateCampaignData extends CreateCampaignData {
  _id: string;
}

// Get campaigns with filters and pagination
export async function getCouponCampaigns(filters: CampaignTableFilters): Promise<CampaignResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.status !== 'all') params.append('status', filters.status);
  if (filters.discount_type !== 'all') params.append('discount_type', filters.discount_type);
  
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  
  if (filters.sort) {
    params.append('sort', filters.sort);
    params.append('order', filters.order);
  }

  const url = params.toString() 
    ? buildUrl(`/admin/coupon-campaigns?${params.toString()}`)
    : buildUrl('/admin/coupon-campaigns');
  
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

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Get campaign stats
export async function getCampaignStats(): Promise<CampaignStatsResponse> {
  const url = buildUrl('/admin/coupon-campaigns?stats_only=true');
  
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

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Get campaign by ID
export async function getCampaignById(id: string): Promise<CampaignDetailResponse> {
  const url = buildUrl(`/admin/coupon-campaigns/${id}`);
  
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
        return data as CampaignDetailResponse;
      } else {
        // If it's raw campaign data, wrap it in expected format
        return {
          success: true,
          data: data as CouponCampaign
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

// Create campaign
export async function createCampaign(campaignData: CreateCampaignData): Promise<CampaignDetailResponse> {
  const url = buildUrl('/admin/coupon-campaigns');
  
  const authToken = sessionStorage.getItem('auth_token');
  const headers = getHeaders({ authToken: authToken || undefined });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(campaignData),
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

// Update campaign
export async function updateCampaign(id: string, campaignData: Partial<CreateCampaignData>): Promise<CampaignDetailResponse> {
  const url = buildUrl(`/admin/coupon-campaigns/${id}`);
  
  const authToken = sessionStorage.getItem('auth_token');
  const headers = getHeaders({ authToken: authToken || undefined });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(campaignData),
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

// Delete campaign
export async function deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
  const url = buildUrl(`/admin/coupon-campaigns/${id}`);
  
  const authToken = sessionStorage.getItem('auth_token');
  const headers = getHeaders({ authToken: authToken || undefined });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
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
