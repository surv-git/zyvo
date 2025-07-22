// Purchase types for admin dashboard

export interface PurchaseProductVariant {
  _id: string;
  product_id: {
    _id: string;
    name: string;
  };
  option_values: string[];
  sku_code: string;
  price: number;
}

export interface PurchaseSupplier {
  _id: string;
  name: string;
  email: string;
  rating: number;
}

export interface Purchase {
  _id: string;
  id: string;
  product_variant_id: PurchaseProductVariant;
  supplier_id: PurchaseSupplier;
  purchase_order_number: string;
  purchase_date: string;
  expected_delivery_date: string;
  received_date: string | null;
  quantity: number;
  unit_price_at_purchase: number;
  packaging_cost: number;
  shipping_cost: number;
  landing_price: number;
  status: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received';
  notes: string | null;
  inventory_updated_on_completion: boolean;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PurchaseListResponse {
  success: boolean;
  data: Purchase[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters: {
    include_inactive: boolean;
  };
}

export interface PurchaseTableFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received';
  supplier_id?: string;
  product_variant_id?: string;
  purchase_date_from?: string;
  purchase_date_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  include_inactive?: boolean;
}

export interface PurchaseCreateRequest {
  product_variant_id: string;
  supplier_id: string;
  purchase_order_number: string;
  purchase_date: string;
  expected_delivery_date: string;
  quantity: number;
  unit_price_at_purchase: number;
  packaging_cost?: number;
  shipping_cost?: number;
  landing_price: number;
  status: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received';
  notes?: string;
}

export interface PurchaseUpdateRequest {
  product_variant_id?: string;
  supplier_id?: string;
  purchase_order_number?: string;
  purchase_date?: string;
  expected_delivery_date?: string;
  received_date?: string;
  quantity?: number;
  unit_price_at_purchase?: number;
  packaging_cost?: number;
  shipping_cost?: number;
  landing_price?: number;
  status?: 'Planned' | 'Pending' | 'Completed' | 'Cancelled' | 'Partially Received';
  notes?: string;
  inventory_updated_on_completion?: boolean;
}

export interface PurchaseResponse {
  success: boolean;
  data: Purchase;
}
