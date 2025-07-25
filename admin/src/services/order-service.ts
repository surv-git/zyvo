import { apiClient } from '@/utils/api-client';
import { API_ENDPOINTS } from '@/config/api';
import {
  OrdersResponse,
  OrderResponse,
  OrderTableFilters,
  CreateOrderData,
  UpdateOrderData,
} from '@/types/order';

// Custom error class
class OrderServiceError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'OrderServiceError';
    this.status = status;
    this.code = code;
  }
}

// Get all orders with filtering, pagination, and sorting
export const getOrders = async (filters: OrderTableFilters = {}): Promise<OrdersResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add pagination params
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    // Add filter params
    if (filters.order_status) params.append('order_status', filters.order_status);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.order_number) params.append('order_number', filters.order_number);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.min_amount !== undefined) params.append('min_amount', filters.min_amount.toString());
    if (filters.max_amount !== undefined) params.append('max_amount', filters.max_amount.toString());
    if (filters.search) params.append('search', filters.search);
    
    // Add sorting params
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    
    // Add stats param
    if (filters.include_stats !== undefined) params.append('include_stats', filters.include_stats.toString());

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.ORDERS.ADMIN_LIST}?${queryString}` : API_ENDPOINTS.ORDERS.ADMIN_LIST;
    
    const response = await apiClient.request<OrdersResponse>(url);
    return response;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to fetch orders'
    );
  }
};

// Get order by ID
export const getOrderById = async (id: string): Promise<OrderResponse> => {
  try {
    const response = await apiClient.request<OrderResponse>(API_ENDPOINTS.ORDERS.ADMIN_BY_ID(id));
    return response;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to fetch order'
    );
  }
};

// Create new order
export const createOrder = async (orderData: CreateOrderData): Promise<OrderResponse> => {
  try {
    const response = await apiClient.request<OrderResponse>(API_ENDPOINTS.ORDERS.ADMIN_CREATE, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to create order'
    );
  }
};

// Update order
export const updateOrder = async (id: string, orderData: UpdateOrderData): Promise<OrderResponse> => {
  try {
    console.log('🔄 Order Service - Updating order with PATCH method:', id);
    console.log('🔄 Order Service - Update data:', orderData);
    console.log('🔄 Order Service - Endpoint:', API_ENDPOINTS.ORDERS.ADMIN_UPDATE(id));
    
    const requestOptions = {
      method: 'PATCH', // Back to PATCH
      body: JSON.stringify(orderData),
    };
    
    console.log('🔄 Order Service - Request options (FIXED):', requestOptions);
    
    const response = await apiClient.request<OrderResponse>(
      API_ENDPOINTS.ORDERS.ADMIN_UPDATE(id), 
      requestOptions
    );
    return response;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to update order'
    );
  }
};

// Delete order
export const deleteOrder = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.request<{ success: boolean; message: string }>(
      API_ENDPOINTS.ORDERS.ADMIN_DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to delete order'
    );
  }
};

// Cancel order
export const cancelOrder = async (id: string): Promise<OrderResponse> => {
  try {
    const response = await apiClient.request<OrderResponse>(
      API_ENDPOINTS.ORDERS.ADMIN_CANCEL(id),
      { method: 'PATCH' }
    );
    return response;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to cancel order'
    );
  }
};

// Update order status
export const updateOrderStatus = async (
  id: string, 
  status: string
): Promise<OrderResponse> => {
  try {
    const response = await apiClient.request<OrderResponse>(
      API_ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS(id),
      {
        method: 'PATCH',
        body: JSON.stringify({ order_status: status }),
      }
    );
    return response;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to update order status'
    );
  }
};

// Update payment status
export const updatePaymentStatus = async (
  id: string, 
  status: string
): Promise<OrderResponse> => {
  try {
    const response = await apiClient.request<OrderResponse>(
      API_ENDPOINTS.ORDERS.ADMIN_UPDATE_PAYMENT(id),
      {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: status }),
      }
    );
    return response;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new OrderServiceError(
      error instanceof Error ? error.message : 'Failed to update payment status'
    );
  }
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatOrderNumber = (orderNumber: string): string => {
  return `#${orderNumber}`;
};

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'RETURN_REQUESTED':
      return 'bg-orange-100 text-orange-800';
    case 'RETURNED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-blue-100 text-blue-800';
    case 'PARTIALLY_REFUNDED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
