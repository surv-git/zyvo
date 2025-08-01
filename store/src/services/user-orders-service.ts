import { API_CONFIG, apiGet } from '../lib/api-config';

export interface OrderAddress {
  full_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  phone_number: string
}

export interface OrderItemVariant {
  _id: string
  product_id: {
    _id: string
    category_id: string
    name: string
    description: string
    images: string[]
    brand_id: string
    primary_image: string
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
  slug: string
  dimensions: {
    length: number
    width: number
    height: number
    unit: string
  }
  weight: {
    value: number
    unit: string
  }
  packaging_cost: number
  shipping_cost: number
  images: string[]
  is_active: boolean
  sort_order: number
  average_rating: number
  reviews_count: number
  rating_distribution: {
    [key: string]: number | string
  }
  createdAt: string
  updatedAt: string
  __v: number
  effective_price: number
  savings: number
  discount_percentage_calculated: number
  id: string
}

export interface OrderItem {
  _id: string
  order_id: string
  product_variant_id: OrderItemVariant
  sku_code: string
  product_name: string
  variant_options: string[]
  quantity: number
  price: number
  subtotal: number
  __v: number
  formatted_options: string
  total_value: number
  id: string
}

export interface Order {
  _id: string
  user_id: string
  order_number: string
  shipping_address: OrderAddress
  billing_address: OrderAddress
  payment_method_id: string | null
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  subtotal_amount: number
  shipping_cost: number
  tax_amount: number
  discount_amount: number
  applied_coupon_code: string | null
  grand_total_amount: number
  tracking_number: string | null
  shipping_carrier: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  __v: number
  formatted_order_number: string
  id: string
}

export interface UserOrderData {
  order: Order
  items: OrderItem[]
}

export interface UserOrdersResponse {
  success: boolean
  message: string
  data: {
    orders: UserOrderData[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      per_page: number
    }
  }
}

export interface OrdersFilters {
  page?: number
  limit?: number
  status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
}

export class UserOrdersService {
  private static endpoint = API_CONFIG.ENDPOINTS.USER.ORDERS;

  /**
   * Get user's orders
   */
  static async getUserOrders(filters: OrdersFilters = {}): Promise<UserOrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page !== undefined) {
        queryParams.append('page', filters.page.toString());
      }
      
      if (filters.limit !== undefined) {
        queryParams.append('limit', filters.limit.toString());
      }
      
      if (filters.status !== undefined) {
        queryParams.append('status', filters.status);
      }

      const url = `${this.endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiGet<UserOrdersResponse>(url, true);
      return data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Get single order details
   */
  static async getOrderDetails(orderId: string): Promise<{ success: boolean; data: UserOrderData; message: string }> {
    try {
      const data = await apiGet<{ success: boolean; data: UserOrderData; message: string }>(
        `${this.endpoint}/${orderId}`,
        true
      );
      return data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }
}
