// Blog Status Enum
export enum BlogStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  PendingReview = 'PENDING_REVIEW',
  Archived = 'ARCHIVED',
}

// Basic Types
export interface BlogAuthor {
  _id: string;
  name: string;
  email: string;
  fullName: string;
  id: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  id: string;
}

// Main Blog Post Interface
export interface BlogPost {
  _id: string;
  id: string;
  author_id: BlogAuthor;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  featured_image_alt_text: string | null;
  category_id: BlogCategory;
  tags: string[];
  read_time_minutes: number | null;
  status: BlogStatus;
  published_at: Date | null;
  views_count: number;
  seo_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  comments_enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deleted_at: Date | null;
  __v?: number;
  isPublished: boolean;
  url: string;
}

// API Response Types
export interface BlogListResponse {
  success: boolean;
  message?: string;
  data: BlogPost[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface BlogDetailResponse {
  success: boolean;
  message?: string;
  data: BlogPost;
}

// Table and Filter Types
export interface BlogTableFilters {
  search?: string;
  status?: BlogStatus | 'all';
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Form Data Types
export interface CreateBlogData {
  title: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  featured_image_alt_text?: string;
  category_id: string;
  tags?: string[];
  read_time_minutes?: number;
  status?: BlogStatus;
  seo_title?: string;
  meta_description?: string;
  is_featured?: boolean;
  comments_enabled?: boolean;
}

export interface UpdateBlogData extends Partial<CreateBlogData> {
  published_at?: Date;
}
