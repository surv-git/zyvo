export interface Wallet {
  _id: string;
  user_id: string;
  balance: {
    $numberDecimal: string;
  };
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  last_transaction_at: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface WalletWithUser extends Wallet {
  user: {
    _id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface WalletTableFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'balance' | 'last_transaction_at';
  sort_order?: 'asc' | 'desc';
  status?: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';
  user_id?: string;
  min_balance?: number;
  max_balance?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface WalletPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface WalletSummary {
  total_wallets: number;
  total_balance: number;
  average_balance: number;
  active_wallets: number;
  blocked_wallets: number;
  inactive_wallets: number;
}

export interface WalletListResponse {
  success: boolean;
  message: string;
  data: {
    wallets: WalletWithUser[];
    pagination: WalletPagination;
    summary: WalletSummary;
    filters_applied: Record<string, string | number | boolean>;
  };
}

export interface WalletCreateData {
  user_id: string;
  balance: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
}

export interface WalletUpdateData {
  balance?: number;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';
  status?: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
}

export type WalletStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type WalletCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';

// Helper function to get balance as number
export const getWalletBalance = (wallet: Wallet): number => {
  return parseFloat(wallet.balance.$numberDecimal || '0');
};

// Helper function to format currency
export const formatWalletCurrency = (amount: number, currency: WalletCurrency): string => {
  const symbols: Record<WalletCurrency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$'
  };
  
  return `${symbols[currency]}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Helper function to get status color
export const getWalletStatusColor = (status: WalletStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'BLOCKED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};
