export type ListingStatus = 'Draft' | 'Pending Review' | 'Live' | 'Rejected' | 'Deactivated';

export type SortBy = 'createdAt' | 'updatedAt' | 'platform_price' | 'listing_status' | 'last_synced_at';

export type SortOrder = 'asc' | 'desc';

export interface ProductVariant {
  _id: string;
  product_id: string;
  option_values: string[];
  sku_code: string;
  price: number;
}

export interface Platform {
  _id: string;
  name: string;
  slug: string;
  base_url: string;
  is_active: boolean;
}

export interface Listing {
  _id: string;
  product_variant_id: ProductVariant;
  platform_id: Platform;
  platform_sku: string;
  platform_product_id: string;
  listing_status: ListingStatus;
  platform_price: number;
  platform_commission_percentage: number;
  platform_fixed_fee: number;
  platform_shipping_fee: number;
  last_synced_at: string | null;
  platform_specific_data: Record<string, unknown>;
  is_active_on_platform: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ListingTableFilters {
  page: number;
  limit: number;
  platform_id?: string;
  product_variant_id?: string;
  listing_status?: ListingStatus;
  is_active_on_platform?: boolean;
  platform_sku?: string;
  platform_product_id?: string;
  needs_sync?: boolean;
  has_price?: boolean;
  search?: string;
  sort_by?: SortBy;
  sort_order?: SortOrder;
}

export interface ListingResponse {
  success: boolean;
  message: string;
  data: Listing[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface ListingCreateData {
  product_variant_id: string;
  platform_id: string;
  platform_sku: string;
  platform_product_id: string;
  listing_status: ListingStatus;
  platform_price: number;
  platform_commission_percentage?: number;
  platform_fixed_fee?: number;
  platform_shipping_fee?: number;
  platform_specific_data?: Record<string, unknown>;
  is_active_on_platform?: boolean;
}

export interface ListingUpdateData extends Partial<ListingCreateData> {
  _id: string;
}
