// Supplier types for admin dashboard

import { SupplierContact } from './supplier-contact';

export interface SupplierAddress {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface Supplier {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  address: SupplierAddress;
  email: string;
  website?: string | null;
  rating: number;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  status: 'Active' | 'Inactive' | 'On Hold' | 'Pending Approval';
  notes?: string | null;
  product_categories_supplied: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  display_name: string;
  full_address: string;
  logo_image?: string | null;
  contact_numbers?: SupplierContact[];
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SupplierCreateRequest {
  name: string;
  description?: string;
  logo_url?: string;
  address: SupplierAddress;
  email: string;
  website?: string;
  payment_terms?: string;
  delivery_terms?: string;
  status: 'Active' | 'Inactive' | 'On Hold' | 'Pending Approval';
  notes?: string;
  product_categories_supplied?: string[];
}

export interface SupplierUpdateRequest extends Partial<SupplierCreateRequest> {
  is_active?: boolean;
}

export interface SupplierTableFilters {
  page: number;
  limit: number;
  status?: 'Active' | 'Inactive' | 'On Hold' | 'Pending Approval';
  country?: string;
  product_categories_supplied?: string;
  search?: string;
  sort?: 'name' | 'createdAt' | 'rating' | 'status';
  order?: 'asc' | 'desc';
  include_inactive?: boolean;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  onHold: number;
  pendingApproval: number;
  averageRating: number;
}
