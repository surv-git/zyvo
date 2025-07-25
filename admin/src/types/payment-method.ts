// Payment Method Types and Interfaces

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'WALLET' | 'NETBANKING';

export interface PaymentMethodDetails {
  // Credit/Debit Card details
  card_brand?: string;
  last4_digits?: string | null;
  expiry_month?: string;
  expiry_year?: string;
  card_holder_name?: string;
  
  // UPI details
  upi_id?: string;
  
  // Wallet details
  wallet_provider?: string;
  wallet_number?: string;
  
  // Netbanking details
  bank_name?: string;
  account_holder_name?: string;
}

export interface PaymentMethod {
  _id: string;
  id: string;
  user_id: string;
  method_type: PaymentMethodType;
  alias: string;
  display_name: string;
  is_default: boolean;
  details: PaymentMethodDetails;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface PaymentMethodWithUser extends PaymentMethod {
  user: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface PaymentMethodTableFilters {
  page?: number;
  limit?: number;
  method_type?: PaymentMethodType;
  is_active?: boolean;
  is_default?: boolean;
  user_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'updated_at' | 'alias' | 'method_type' | 'is_active' | 'is_default';
  sort_order?: 'asc' | 'desc';
}

export interface PaymentMethodSummary {
  _id: null;
  total_methods: number;
  active_methods: number;
  default_methods: number;
  credit_cards: number;
  debit_cards: number;
  upi_methods: number;
  wallets: number;
  netbanking: number;
}

export interface PaymentMethodPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaymentMethodListResponse {
  success: boolean;
  message: string;
  data: {
    payment_methods: PaymentMethod[];
    pagination: PaymentMethodPagination;
    summary: PaymentMethodSummary;
    filters_applied: {
      method_type: PaymentMethodType | null;
      is_active: boolean | null;
      is_default: boolean | null;
      user_id: string | null;
      search: string | null;
      date_range: {
        start: string | null;
        end: string | null;
      };
    };
  };
  timestamp: string;
}

export interface PaymentMethodCreateData {
  user_id: string;
  method_type: PaymentMethodType;
  alias: string;
  is_default: boolean;
  details: PaymentMethodDetails;
  is_active: boolean;
}

export interface PaymentMethodUpdateData {
  method_type: PaymentMethodType;
  alias: string;
  is_default: boolean;
  details: PaymentMethodDetails;
  is_active: boolean;
}

// Helper functions
export const getPaymentMethodTypeLabel = (type: PaymentMethodType): string => {
  switch (type) {
    case 'CREDIT_CARD':
      return 'Credit Card';
    case 'DEBIT_CARD':
      return 'Debit Card';
    case 'UPI':
      return 'UPI';
    case 'WALLET':
      return 'Wallet';
    case 'NETBANKING':
      return 'Net Banking';
    default:
      return type;
  }
};

export const getPaymentMethodTypeColor = (type: PaymentMethodType): string => {
  switch (type) {
    case 'CREDIT_CARD':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'DEBIT_CARD':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'UPI':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'WALLET':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'NETBANKING':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const formatPaymentMethodDetails = (method: PaymentMethod): string => {
  const { method_type, details } = method;
  
  switch (method_type) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return `${details.card_brand || 'Card'} ending in ${details.last4_digits || '****'}`;
    case 'UPI':
      return details.upi_id || 'UPI ID';
    case 'WALLET':
      return `${details.wallet_provider || 'Wallet'} - ${details.wallet_number || 'N/A'}`;
    case 'NETBANKING':
      return details.bank_name || 'Bank Account';
    default:
      return 'Payment Method';
  }
};

export const getUserDisplayName = (user?: { email?: string; first_name?: string; last_name?: string }): string => {
  if (!user) return 'Unknown User';
  
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
};

export const formatLastUsed = (lastUsed: string | null): string => {
  if (!lastUsed) return 'Never';
  return new Date(lastUsed).toLocaleDateString();
};
