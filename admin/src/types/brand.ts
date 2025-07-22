export interface Brand {
  _id: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  contact_email: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  slug: string;
  __v: number;
  display_name: string;
  logo_image: string;
  id: string;
}

export interface BrandTableFilters {
  search?: string;
  sort?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  is_active?: boolean;
  include_inactive?: boolean;
  page: number;
  limit: number;
}

export interface BrandListResponse {
  brands: Brand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BrandStatus = 'Active' | 'Inactive';

export class BrandServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'BrandServiceError';
  }
}
