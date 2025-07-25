// Address Types and Interfaces

export type AddressType = 'HOME' | 'OFFICE' | 'OTHER' | 'BILLING' | 'SHIPPING';
export type VerificationSource = 'MANUAL' | 'GOOGLE_MAPS' | 'USER_CONFIRMED';

export interface Address {
  _id: string;
  user_id: string;
  title: string;
  type: AddressType;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  is_default: boolean;
  is_active: boolean;
  delivery_instructions?: string;
  is_verified: boolean;
  verification_source: VerificationSource;
  last_used_at?: string | null;
  usage_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddressWithUser extends Address {
  user: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface AddressTableFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: AddressType;
  is_active?: boolean;
  city?: string;
  state?: string;
  country?: string;
  user_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AddressListResponse {
  success: boolean;
  message: string;
  data: {
    addresses: AddressWithUser[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
    summary: {
      total_addresses: number;
      active_addresses: number;
      inactive_addresses: number;
      default_addresses: number;
      verified_addresses: number;
      average_usage_count: number;
    };
    filters_applied: Record<string, string | boolean | number>;
  };
}

export interface AddressCreateData {
  user_id: string;
  title: string;
  type: AddressType;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
  is_active?: boolean;
  delivery_instructions?: string;
}

export interface AddressUpdateData {
  title?: string;
  type?: AddressType;
  full_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
  is_active?: boolean;
  delivery_instructions?: string;
  is_verified?: boolean;
}

// Helper functions
export const getAddressTypeColor = (type: AddressType): string => {
  switch (type) {
    case 'HOME':
      return 'bg-blue-100 text-blue-800';
    case 'OFFICE':
      return 'bg-purple-100 text-purple-800';
    case 'BILLING':
      return 'bg-green-100 text-green-800';
    case 'SHIPPING':
      return 'bg-orange-100 text-orange-800';
    case 'OTHER':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getAddressTypeLabel = (type: AddressType): string => {
  switch (type) {
    case 'HOME':
      return 'Home';
    case 'OFFICE':
      return 'Office';
    case 'BILLING':
      return 'Billing';
    case 'SHIPPING':
      return 'Shipping';
    case 'OTHER':
      return 'Other';
    default:
      return type;
  }
};

export const getVerificationSourceLabel = (source: VerificationSource): string => {
  switch (source) {
    case 'MANUAL':
      return 'Manual';
    case 'GOOGLE_MAPS':
      return 'Google Maps';
    case 'USER_CONFIRMED':
      return 'User Confirmed';
    default:
      return source;
  }
};

export const formatAddressLine = (address: Address): string => {
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.landmark,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
};

export const getUserDisplayName = (user: AddressWithUser['user']): string => {
  if (!user) {
    return 'Unknown User';
  }
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) {
    return user.first_name;
  }
  return user.email || 'Unknown User';
};
