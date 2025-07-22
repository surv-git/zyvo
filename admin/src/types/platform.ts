export interface Platform {
  _id: string;
  name: string;
  slug: string;
  description: string;
  base_url: string;
  logo_url: string;
  api_credentials_placeholder: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PlatformListParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
  sort?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface PlatformListResponse {
  success: boolean;
  data: Platform[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string | null;
  };
}

export interface PlatformCreateRequest {
  name: string;
  description: string;
  base_url: string;
  logo_url?: string;
  api_credentials_placeholder?: string;
  is_active?: boolean;
}

export interface PlatformUpdateRequest {
  name?: string;
  description?: string;
  base_url?: string;
  logo_url?: string;
  api_credentials_placeholder?: string;
  is_active?: boolean;
}
