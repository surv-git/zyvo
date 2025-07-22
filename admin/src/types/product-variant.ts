export interface ProductVariant {
  _id: string;
  product_id: {
    _id: string;
    name: string;
    description: string;
    slug: string;
    primary_image: string | null;
    id: string;
  };
  option_values: OptionValue[];
  sku_code: string;
  price: number;
  discount_details: {
    price: number | null;
    percentage: number | null;
    end_date: string | null;
    is_on_sale: boolean;
  };
  slug: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weight: {
    value: number;
    unit: string;
  };
  packaging_cost: number;
  shipping_cost: number;
  images: string[];
  is_active: boolean;
  sort_order: number;
  average_rating: number;
  reviews_count: number;
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
    _id: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  effective_price: number;
  savings: number;
  discount_percentage_calculated: number;
  id: string;
}

export interface OptionValue {
  _id: string;
  option_type: string;
  option_value: string;
  name: string;
  slug: string;
  full_name: string;
  id: string;
}

export interface ProductVariantTableFilters {
  page?: number;
  limit?: number;
  product_id?: string;
  is_active?: boolean;
  is_on_sale?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort?: 'price' | 'sku_code' | 'createdAt' | 'sort_order';
  order?: 'asc' | 'desc';
  include_inactive?: boolean;
}

export interface ProductVariantListResponse {
  success: boolean;
  data: ProductVariant[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ProductVariantCreateRequest {
  product_id: string;
  option_values: string[];
  sku_code: string;
  price: number;
  discount_details?: {
    price?: number;
    percentage?: number;
    end_date?: string;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight?: {
    value?: number;
    unit?: string;
  };
  packaging_cost?: number;
  shipping_cost?: number;
  images?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductVariantUpdateRequest {
  product_id?: string;
  option_values?: string[];
  sku_code?: string;
  price?: number;
  discount_details?: {
    price?: number;
    percentage?: number;
    end_date?: string;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight?: {
    value?: number;
    unit?: string;
  };
  packaging_cost?: number;
  shipping_cost?: number;
  images?: string[];
  is_active?: boolean;
  sort_order?: number;
}
