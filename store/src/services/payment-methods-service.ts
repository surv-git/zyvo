import { API_CONFIG, apiGet, apiPost, apiPut, apiDelete } from '../lib/api-config';

export interface PaymentMethodDetails {
  // Credit/Debit Card details
  card_brand?: string
  last4_digits?: string | null
  expiry_month?: string
  expiry_year?: string
  card_holder_name?: string
  
  // UPI details
  upi_id?: string | null
  account_holder_name?: string
  
  // Wallet details
  wallet_provider?: string
  linked_account_identifier?: string | null
  
  // NetBanking details
  bank_name?: string
}

export interface PaymentMethod {
  _id: string
  user_id: string
  method_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'WALLET' | 'NETBANKING'
  alias: string
  is_default: boolean
  details: PaymentMethodDetails
  is_active: boolean
  createdAt: string
  updatedAt: string
  __v: number
  display_name: string
  id: string
}

export interface PaymentMethodsResponse {
  success: boolean
  message: string
  data: PaymentMethod[]
  pagination: {
    total: number
    active: number
    default: string | null
  }
}

export interface PaymentMethodFilters {
  include_inactive?: boolean
}

export interface CreatePaymentMethodData {
  method_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'WALLET' | 'NETBANKING'
  alias: string
  details: PaymentMethodDetails
  is_default?: boolean
}

export interface UpdatePaymentMethodData extends CreatePaymentMethodData {
  is_active?: boolean
}

export class PaymentMethodsService {
  private static endpoint = API_CONFIG.ENDPOINTS.PAYMENT_METHODS;

  /**
   * Get user's payment methods
   */
  static async getPaymentMethods(filters: PaymentMethodFilters = {}): Promise<PaymentMethodsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.include_inactive !== undefined) {
        queryParams.append('include_inactive', filters.include_inactive.toString());
      }

      const url = `${this.endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiGet<PaymentMethodsResponse>(url, true);
      return data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Create a new payment method
   */
  static async createPaymentMethod(methodData: CreatePaymentMethodData): Promise<{ success: boolean; data: PaymentMethod; message: string }> {
    try {
      const data = await apiPost<{ success: boolean; data: PaymentMethod; message: string }>(
        this.endpoint,
        methodData,
        true
      );
      return data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  /**
   * Update an existing payment method
   */
  static async updatePaymentMethod(methodId: string, methodData: UpdatePaymentMethodData): Promise<{ success: boolean; data: PaymentMethod; message: string }> {
    try {
      const data = await apiPut<{ success: boolean; data: PaymentMethod; message: string }>(
        `${this.endpoint}/${methodId}`,
        methodData,
        true
      );
      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(methodId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiDelete<{ success: boolean; message: string }>(
        `${this.endpoint}/${methodId}`,
        true
      );
      return data;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  /**
   * Set a payment method as default
   */
  static async setDefaultPaymentMethod(methodId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiPut<{ success: boolean; message: string }>(
        `${this.endpoint}/${methodId}/set-default`,
        {},
        true
      );
      return data;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }
}
