export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

export interface Product {
  _id: string;
  category_id: string;
  name: string;
  description: string;
  brand_id: string;
}

export interface DiscountDetails {
  price: number | null;
  percentage: number | null;
  end_date: string | null;
  is_on_sale: boolean;
}

export interface ProductVariant {
  _id: string;
  product_id: Product;
  option_values: string[];
  sku_code: string;
  price: number;
  discount_details: DiscountDetails;
  images: string[];
  is_active: boolean;
  average_rating: number;
  reviews_count: number;
}

export interface Favorite {
  _id: string;
  user_id: User;
  product_variant_id: ProductVariant;
  added_at: string;
  user_notes: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FavoriteTableFilters {
  page?: number;
  limit?: number;
  sort_by?: 'added_at' | 'updated_at' | 'user_id' | 'product_variant_id';
  sort_order?: 'asc' | 'desc';
  user_id?: string;
  product_variant_id?: string;
  include_inactive?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface FavoritePagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface FavoriteFilters {
  user_id: string | null;
  product_variant_id: string | null;
  include_inactive: boolean;
  date_from: string | null;
  date_to: string | null;
}

export interface FavoriteResponse {
  success: boolean;
  data: Favorite[];
  pagination: FavoritePagination;
  filters: FavoriteFilters;
}

export interface CreateFavoriteData {
  user_id: string;
  product_variant_id: string;
  user_notes?: string;
  is_active?: boolean;
}

export interface UpdateFavoriteData {
  user_notes?: string;
  is_active?: boolean;
}
