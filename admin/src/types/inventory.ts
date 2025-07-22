// Inventory types based on API specification

export interface ProductVariantInfo {
  _id: string;
  product_id: string;
  option_values: string[];
  sku_code: string;
  price: number;
}

export interface InventoryRecord {
  _id: string;
  product_variant_id: ProductVariantInfo;
  stock_quantity: number;
  last_restock_date: string | null;
  last_sold_date: string | null;
  min_stock_level: number;
  location: string;
  notes: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface InventoryListResponse {
  success: boolean;
  message: string;
  data: InventoryRecord[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
  stock_status?: 'out_of_stock' | 'low_stock' | 'in_stock';
  location?: string;
  product_id?: string;
  search?: string;
  include_computed_packs?: boolean;
  sort_by?: 'createdAt' | 'updatedAt' | 'stock_quantity' | 'min_stock_level' | 'last_restock_date';
  sort_order?: 'asc' | 'desc';
}

export interface InventoryUpdateRequest {
  stock_quantity?: number;
  min_stock_level?: number;
  location?: string;
  notes?: string;
  is_active?: boolean;
}

// Stock status helper
export const getStockStatus = (stockQuantity: number, minStockLevel: number): 'out_of_stock' | 'low_stock' | 'in_stock' => {
  if (stockQuantity === 0) return 'out_of_stock';
  if (stockQuantity <= minStockLevel) return 'low_stock';
  return 'in_stock';
};

// Stock status colors for UI
export const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'out_of_stock':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800';
    case 'low_stock':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800';
    case 'in_stock':
      return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/20 dark:border-gray-800';
  }
};
