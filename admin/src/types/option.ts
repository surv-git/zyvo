// Option types for admin dashboard

export interface Option {
  _id: string;
  option_type: string;
  option_value: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
  slug: string;
  __v: number;
  full_name: string;
  id: string;
}

export interface OptionTableFilters {
  page: number;
  limit: number;
  search?: string;
  option_type?: string;
  is_active?: boolean;
  sort?: 'name' | 'option_type' | 'sort_order' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  include_inactive?: boolean;
}

export interface OptionListResponse {
  options: Option[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OptionUpdateRequest {
  option_type?: string;
  option_value?: string;
  name?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface OptionCreateRequest {
  option_type: string;
  option_value: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
}

export type OptionStatus = 'Active' | 'Inactive';

export class OptionServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'OptionServiceError';
  }
}
