// Address interface for shipping and billing addresses
export interface Address {
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone_number: string;
}

// Product variant interface for order items
export interface ProductVariant {
  _id: string;
  product_id: {
    _id: string;
    name: string;
    description: string;
    images: string[];
    brand_id: string;
    primary_image: string;
    id: string;
  };
  option_values: string[];
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
    [key: string]: number;
  } & {
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

// Order item interface
export interface OrderItem {
  _id: string;
  order_id: string;
  product_variant_id: ProductVariant;
  sku_code: string;
  product_name: string;
  variant_options: string[];
  quantity: number;
  price: number;
  subtotal: number;
  __v: number;
  formatted_options: string;
  total_value: number;
  id: string;
}

// Order status types
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

// User interface for order customer information
export interface User {
  _id: string;
  email: string;
  id: string;
}

// Main Order interface
export interface Order {
  _id: string;
  user_id: string | User;
  order_number: string;
  shipping_address: Address;
  billing_address: Address;
  payment_method_id: string | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  applied_coupon_code: string | null;
  grand_total_amount: number;
  tracking_number: string | null;
  shipping_carrier: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  formatted_order_number: string;
  id: string;
}

// Order with items interface
export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

// Order table filters interface
export interface OrderTableFilters {
  page?: number;
  limit?: number;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: string;
  order_number?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  sort_by?: 'createdAt' | 'updatedAt' | 'grand_total_amount' | 'order_number';
  sort_order?: 'asc' | 'desc';
  include_stats?: boolean;
}

// API response interfaces
export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: OrderWithItems[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: OrderWithItems;
}

// Create and update order data interfaces
export interface CreateOrderData {
  user_id: string;
  shipping_address: Address;
  billing_address: Address;
  payment_method_id?: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  applied_coupon_code?: string;
  grand_total_amount: number;
  tracking_number?: string;
  shipping_carrier?: string;
  notes?: string;
}

export interface UpdateOrderData {
  shipping_address?: Address;
  billing_address?: Address;
  payment_method_id?: string;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  subtotal_amount?: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  applied_coupon_code?: string;
  grand_total_amount?: number;
  tracking_number?: string;
  shipping_carrier?: string;
  notes?: string;
}

// Service error interface
export interface OrderServiceError extends Error {
  status?: number;
  code?: string;
}
