// User interface for cart user_id population
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

// Cart item interface (if needed for detailed view)
export interface CartItem {
  _id: string;
  product_variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Add other cart item fields as needed
}

// Main Cart interface
export interface Cart {
  _id: string;
  user_id: User;
  applied_coupon_code: string | null;
  coupon_discount_amount: number;
  cart_total_amount: number;
  last_updated_at: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  items: CartItem[];
  item_count: number;
  has_items: boolean;
}

// Cart table filters interface
export interface CartTableFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'cart_total_amount' | 'user_id';
  sort_order?: 'asc' | 'desc';
  user_id?: string;
  has_items?: 'true' | 'false';
  has_coupon?: 'true' | 'false';
  min_total?: number;
  max_total?: number;
  date_from?: string;
  date_to?: string;
}

// API response interfaces
export interface CartResponse {
  success: boolean;
  data: Cart[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters: {
    user_id: string | null;
    has_items: string | null;
    has_coupon: string | null;
    min_total: number | null;
    max_total: number | null;
    date_from: string | null;
    date_to: string | null;
  };
}

// Create and update cart data interfaces
export interface CreateCartData {
  user_id: string;
  applied_coupon_code?: string | null;
  coupon_discount_amount?: number;
  cart_total_amount?: number;
}

export interface UpdateCartData {
  applied_coupon_code?: string | null;
  coupon_discount_amount?: number;
  cart_total_amount?: number;
  user_id?: string;
}

// Service error class
export class CartServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'CartServiceError';
  }
}
