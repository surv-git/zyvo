export interface ParentCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  parent_category: ParentCategory | null;
  image_url: string;
  is_active: boolean;
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTableFilters {
  search?: string;
  parent_id?: string;
  sort_by?: 'name' | 'createdAt' | 'updatedAt';
  sort_order?: 'asc' | 'desc';
  include_inactive?: boolean;
  page: number;
  limit: number;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CategoryStatus = 'Active' | 'Inactive';

export class CategoryServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'CategoryServiceError';
  }
}
