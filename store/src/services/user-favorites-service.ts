import { API_CONFIG, apiGet, apiPost, apiDelete } from '../lib/api-config';

export interface FavoriteProduct {
  _id: string
  user_id: string
  product_variant_id: {
    _id: string
    product_id: {
      _id: string
      category_id: string
      name: string
      description: string
      brand_id: string
      primary_image: string | null
      id: string
    }
    option_values: string[]
    sku_code: string
    price: number
    discount_details: {
      price: number | null
      percentage: number | null
      end_date: string | null
      is_on_sale: boolean
    }
    images: string[]
    is_active: boolean
    average_rating: number
    reviews_count: number
    effective_price: number
    savings: number
    discount_percentage_calculated: number
    id: string
  }
  user_notes: string | null
  is_active: boolean
  added_at: string
  createdAt: string
  updatedAt: string
  __v: number
  is_favorited: boolean
  days_since_added: number
  id: string
}

export interface FavoritesResponse {
  success: boolean
  data: FavoriteProduct[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next_page: boolean
    has_prev_page: boolean
  }
}

export interface FavoritesFilters {
  page?: number
  page_size?: number
  category_id?: string
  brand_id?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort_by?: 'created_at' | 'name' | 'price'
  sort_order?: 'asc' | 'desc'
}

export class UserFavoritesService {
  /**
   * Get user's favorite products with optional filters
   */
  static async getFavorites(filters: FavoritesFilters = {}): Promise<FavoritesResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `${API_CONFIG.ENDPOINTS.USER.FAVORITES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    try {
      const data = await apiGet<FavoritesResponse>(endpoint, true); // includeAuth = true
      return data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Remove a product from favorites
   */
  static async removeFavorite(productVariantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.USER.FAVORITES}/${productVariantId}`;
      const data = await apiDelete<{ success: boolean; message: string }>(endpoint, true); // includeAuth = true
      return data;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Add a product to favorites
   */
  static async addFavorite(productVariantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiPost<{ success: boolean; message: string }>(
        API_CONFIG.ENDPOINTS.USER.FAVORITES,
        { product_variant_id: productVariantId },
        true // includeAuth = true
      );
      return data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }
}
