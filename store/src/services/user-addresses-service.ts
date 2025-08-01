import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api-config';

export interface UserAddress {
  _id: string
  user_id: string
  title: string
  type: 'HOME' | 'WORK' | 'OTHER'
  full_name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  landmark?: string
  city: string
  state: string
  postal_code: string
  country: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  is_default: boolean
  is_active: boolean
  delivery_instructions?: string
  is_verified: boolean
  verification_source?: string
  last_used_at?: string
  usage_count: number
  createdAt: string
  updatedAt: string
}

export interface AddressesResponse {
  success: boolean
  data: UserAddress[]
  meta: {
    total: number
    include_inactive: boolean
  }
}

export interface CreateAddressData {
  title: string
  type: 'HOME' | 'WORK' | 'OTHER'
  full_name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  landmark?: string
  city: string
  state: string
  postal_code: string
  country: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  is_default?: boolean
  delivery_instructions?: string
}

export interface UpdateAddressData extends CreateAddressData {
  is_active?: boolean
}

export class UserAddressesService {
  private static endpoint = '/api/v1/user/addresses';

  /**
   * Get user's addresses
   */
  static async getAddresses(includeInactive: boolean = false): Promise<AddressesResponse> {
    try {
      const queryParams = includeInactive ? '?include_inactive=true' : '';
      const data = await apiGet<AddressesResponse>(`${this.endpoint}${queryParams}`, true);
      return data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  /**
   * Create a new address
   */
  static async createAddress(addressData: CreateAddressData): Promise<{ success: boolean; data: UserAddress; message: string }> {
    try {
      const data = await apiPost<{ success: boolean; data: UserAddress; message: string }>(
        this.endpoint,
        addressData,
        true
      );
      return data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Update an existing address
   */
  static async updateAddress(addressId: string, addressData: UpdateAddressData): Promise<{ success: boolean; data: UserAddress; message: string }> {
    try {
      const data = await apiPut<{ success: boolean; data: UserAddress; message: string }>(
        `${this.endpoint}/${addressId}`,
        addressData,
        true
      );
      return data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  static async deleteAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiDelete<{ success: boolean; message: string }>(
        `${this.endpoint}/${addressId}`,
        true
      );
      return data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  /**
   * Set an address as default
   */
  static async setDefaultAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiPut<{ success: boolean; message: string }>(
        `${this.endpoint}/${addressId}/set-default`,
        {},
        true
      );
      return data;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
}
