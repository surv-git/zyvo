import { API_CONFIG, apiPost } from '../lib/api-config';

export interface CouponDetails {
  code: string
  discount_amount: number
  discount_type: 'PERCENTAGE' | 'FIXED'
  description: string
  minimum_order_value?: number
  maximum_discount_amount?: number
  valid_from: string
  valid_until: string
  usage_count: number
  max_usage_count: number
  is_active: boolean
}

export interface ValidateCouponRequest {
  coupon_code: string
  cart_total: number
}

export interface ValidateCouponResponse {
  success: boolean
  message: string
  data?: {
    coupon: CouponDetails
    applicable_discount: number
    final_amount: number
  }
}

export interface PlaceOrderRequest {
  shipping_address_id: string
  payment_method_id: string
  coupon_code?: string
  notes?: string
}

export interface PlaceOrderResponse {
  success: boolean
  message: string
  data: {
    order_id: string
    order_number: string
    payment_intent_id?: string
    redirect_url?: string
  }
}

export class CheckoutService {
  private static couponEndpoint = `${API_CONFIG.BASE_URL}/api/v1/coupons/validate`;
  private static orderEndpoint = `${API_CONFIG.BASE_URL}/api/v1/orders`;

  /**
   * Validate a coupon code
   */
  static async validateCoupon(request: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    try {
      const data = await apiPost<ValidateCouponResponse>(
        this.couponEndpoint,
        request,
        true
      );
      return data;
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }

  /**
   * Place an order
   */
  static async placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    try {
      const data = await apiPost<PlaceOrderResponse>(
        this.orderEndpoint,
        request,
        true
      );
      return data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
}
