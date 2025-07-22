// User types for admin dashboard

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  address?: string;
  loginCount?: number;
  isEmailVerified?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface UserManageRequest {
  action: 'suspend' | 'activate' | 'delete';
  reason?: string;
}

export interface UserManageResponse {
  success: boolean;
  message: string;
  user?: User;
}

export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface UserTableFilters {
  search?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
  min_createdAt?: string;
  max_createdAt?: string;
  min_lastLoginAt?: string;
  max_lastLoginAt?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}
