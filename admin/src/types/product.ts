export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category_id: {
    _id: string;
    name: string;
  };
  brand_id: {
    _id: string;
    name: string;
  };
  min_price: number;
  min_discounted_price?: number;
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  min_price: number;
  min_discounted_price?: number;
  is_active: boolean;
  images: string[];
}

export interface ProductTableFilters {
  page: number;
  limit: number;
  search: string;
  category_id?: string;
  brand_id?: string;
  sort: 'name' | 'createdAt' | 'score' | 'updatedAt';
  order: 'asc' | 'desc';
  include_inactive: boolean;
}

export interface ProductListResponse {
  products: Product[];
  totalPages: number;
  total: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ProductStatus = 'Active' | 'Inactive';
