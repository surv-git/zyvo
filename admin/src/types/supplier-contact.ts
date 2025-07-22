// Supplier contact number types for admin dashboard

export interface SupplierContact {
  _id: string;
  id: string;
  supplier_id: {
    _id: string;
    name: string;
    slug: string;
    email: string;
    display_name: string;
    full_address: string | null;
    logo_image: string | null;
    id: string;
  } | string;
  contact_number: string;
  contact_name: string;
  type: 'Mobile' | 'Landline' | 'Fax' | 'Whatsapp' | 'Toll-Free' | 'Other';
  extension?: string | null;
  is_primary: boolean;
  notes?: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  formatted_number: string;
  full_contact_info: string;
}

export interface SupplierContactListResponse {
  success: boolean;
  data: SupplierContact[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SupplierContactCreateRequest {
  supplier_id: string;
  contact_number: string;
  contact_name: string;
  type: 'Mobile' | 'Landline' | 'Fax' | 'Whatsapp' | 'Toll-Free' | 'Other';
  extension?: string;
  is_primary?: boolean;
  notes?: string;
  is_active?: boolean;
}

export interface SupplierContactUpdateRequest extends Partial<SupplierContactCreateRequest> {
  id?: string;
}

export interface SupplierContactTableFilters {
  page: number;
  limit: number;
  supplier_id?: string;
  is_primary?: boolean;
  type?: 'Mobile' | 'Landline' | 'Fax' | 'Whatsapp' | 'Toll-Free' | 'Other';
  search?: string;
  sort?: 'supplier_id' | 'contact_name' | 'is_primary' | 'createdAt' | 'type';
  order?: 'asc' | 'desc';
  include_inactive?: boolean;
}
