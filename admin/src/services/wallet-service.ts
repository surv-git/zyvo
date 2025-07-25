import { apiClient } from '@/utils/api-client';
import { 
  Wallet, 
  WalletWithUser, 
  WalletTableFilters, 
  WalletListResponse, 
  WalletCreateData, 
  WalletUpdateData,
  WalletStatus,
  WalletCurrency,
  getWalletBalance,
  formatWalletCurrency
} from '@/types/wallet';

const API_BASE = 'admin/wallets';

/**
 * Get list of wallets with filtering and pagination
 */
export const getWallets = async (filters: WalletTableFilters = {}): Promise<WalletListResponse> => {
  const params = new URLSearchParams();
  
  // Add pagination params
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  // Add sorting params
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  
  // Add filter params
  if (filters.status) params.append('status', filters.status);
  if (filters.currency) params.append('currency', filters.currency);
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.min_balance !== undefined) params.append('min_balance', filters.min_balance.toString());
  if (filters.max_balance !== undefined) params.append('max_balance', filters.max_balance.toString());
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  
  const response = await apiClient.request<WalletListResponse>(url);
  return response;
};

/**
 * Get wallet by ID
 */
export const getWalletById = async (walletId: string): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(`${API_BASE}/${walletId}`);
  return response.data.wallet;
};

/**
 * Create new wallet
 */
export const createWallet = async (walletData: WalletCreateData): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(walletData),
  });
  return response.data.wallet;
};

/**
 * Update wallet
 */
export const updateWallet = async (walletId: string, walletData: WalletUpdateData): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(`${API_BASE}/${walletId}`, {
    method: 'PATCH',
    body: JSON.stringify(walletData),
  });
  return response.data.wallet;
};

/**
 * Delete wallet
 */
export const deleteWallet = async (walletId: string): Promise<void> => {
  await apiClient.request<void>(`${API_BASE}/${walletId}`, {
    method: 'DELETE',
  });
};

/**
 * Block wallet
 */
export const blockWallet = async (walletId: string): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(`${API_BASE}/${walletId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'BLOCKED' }),
  });
  return response.data.wallet;
};

/**
 * Activate wallet
 */
export const activateWallet = async (walletId: string): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(`${API_BASE}/${walletId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  return response.data.wallet;
};

/**
 * Deactivate wallet
 */
export const deactivateWallet = async (walletId: string): Promise<WalletWithUser> => {
  const response = await apiClient.request<{ data: { wallet: WalletWithUser } }>(`${API_BASE}/${walletId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'INACTIVE' }),
  });
  return response.data.wallet;
};

/**
 * Format wallet balance with currency
 */
export const formatWalletBalance = (wallet: Wallet): string => {
  const balance = getWalletBalance(wallet);
  return formatWalletCurrency(balance, wallet.currency);
};

/**
 * Get wallet status badge color class
 */
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

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: WalletCurrency): string => {
  const symbols: Record<WalletCurrency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$'
  };
  return symbols[currency] || currency;
};

/**
 * Format date for display
 */
export const formatWalletDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: { email: string; first_name?: string; last_name?: string }): string => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) {
    return user.first_name;
  }
  return user.email;
};

/**
 * Handle wallet service errors
 */
export const getWalletServiceErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message;
  }
  return 'An unexpected error occurred';
};
