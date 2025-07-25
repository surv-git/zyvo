/**
 * Review Management Types
 * Types for admin review management functionality
 */

export enum ReviewStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FLAGGED = "FLAGGED",
}

export interface ReviewUser {
  _id: string;
  name: string;
  email: string;
  fullName: string;
  id: string;
}

export interface ReviewProductVariant {
  _id: string;
  sku_code: string;
  price: number;
  effective_price: number;
  savings: number;
  discount_percentage_calculated: number;
  id: string;
}

export interface Review {
  _id: string;
  user_id: ReviewUser;
  product_variant_id: ReviewProductVariant;
  rating: number;
  title: string;
  review_text: string;
  is_verified_buyer: boolean;
  status: string;
  helpful_votes: number;
  unhelpful_votes: number;
  reported_count: number;
  reviewer_display_name: string;
  reviewer_location: string;
  image_urls: string[];
  video_url: string | null;
  moderated_at: string | null;
  moderated_by: ReviewUser | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  totalVotes: number;
  helpfulPercentage: number;
  isReported: boolean;
  isFlagged: boolean;
  id: string;
}

export interface ReviewListRequest {
  limit?: number;
  page?: number;
  product_id?: string;
  status?: ReviewStatus;
  [property: string]: any;
}

export interface ReviewPagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface ReviewListResponse {
  success: boolean;
  data: Review[];
  pagination: ReviewPagination;
}

export interface ReviewReport {
  _id: string;
  user_id: ReviewUser;
  review_id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface ReviewDetailResponse {
  success: boolean;
  data: {
    review: Review;
    reports: ReviewReport[];
  };
}

// Frontend-specific types for table management
export interface ReviewTableFilters {
  search: string;
  status: 'all' | ReviewStatus;
  product_id: string;
  page: number;
  limit: number;
  sort: 'createdAt' | 'rating' | 'helpful_votes' | 'status';
  order: 'asc' | 'desc';
}

export interface ReviewServiceError extends Error {
  status?: number;
  code?: string;
}

export class ReviewServiceError extends Error {
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ReviewServiceError';
    this.status = status;
    this.code = code;
  }
}
