import { API_ENDPOINTS, buildUrl, getHeaders } from '@/config/api';

// Enums
export enum BlogStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  PendingReview = 'PENDING_REVIEW',
  Archived = 'ARCHIVED',
}

// Interfaces
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

export interface BlogTableFilters {
  search?: string;
  status?: BlogStatus | 'all';
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  category_id?: string;
  is_featured?: boolean;
  tags?: string;
  author_id?: string;
}

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

// Service Error Class
export class BlogServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'BlogServiceError';
  }
}

// Generic API request function for blogs
async function blogApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Check authentication
  const authToken = sessionStorage.getItem('auth_token');
  if (!authToken) {
    throw new BlogServiceError(
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  const headers = getHeaders({ authToken });
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new BlogServiceError('Authentication required. Please log in to access this resource.', 401);
    }
    if (response.status === 403) {
      throw new BlogServiceError('Access denied. You do not have permission to access this resource.', 403);
    }
    if (response.status === 404) {
      throw new BlogServiceError('Blog post not found.', 404);
    }
    throw new BlogServiceError(`Request failed: ${response.statusText}`, response.status);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new BlogServiceError(data.message || 'Request failed');
  }

  return data;
}

// API Functions
export const getBlogPosts = async (filters: BlogTableFilters = {}): Promise<BlogListResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Basic pagination and search parameters
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    
    // Additional filter parameters
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.author_id) params.append('author_id', filters.author_id);

    const url = `${buildUrl(API_ENDPOINTS.BLOG.LIST)}?${params.toString()}`;
    
    return await blogApiRequest<BlogListResponse>(url);
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getBlogById = async (id: string): Promise<BlogDetailResponse> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.BY_ID(id));
    
    return await blogApiRequest<BlogDetailResponse>(url);
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const createBlogPost = async (blogData: CreateBlogData): Promise<BlogDetailResponse> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.CREATE);
    
    return await blogApiRequest<BlogDetailResponse>(url, {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateBlogPost = async (id: string, blogData: UpdateBlogData): Promise<BlogDetailResponse> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.UPDATE(id));
    
    return await blogApiRequest<BlogDetailResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteBlogPost = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.DELETE(id));
    
    return await blogApiRequest<{ success: boolean; message?: string }>(url, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const archiveBlogPost = async (id: string): Promise<BlogDetailResponse> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.ARCHIVE(id));
    
    return await blogApiRequest<BlogDetailResponse>(url, {
      method: 'PATCH',
    });
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const publishBlogPost = async (id: string): Promise<BlogDetailResponse> => {
  try {
    const url = buildUrl(API_ENDPOINTS.BLOG.PUBLISH(id));
    
    return await blogApiRequest<BlogDetailResponse>(url, {
      method: 'PATCH',
    });
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }
    throw new BlogServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Utility functions
export const getStatusBadgeVariant = (status: BlogStatus) => {
  switch (status) {
    case BlogStatus.Published:
      return 'default';
    case BlogStatus.Draft:
      return 'secondary';
    case BlogStatus.PendingReview:
      return 'outline';
    case BlogStatus.Archived:
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const getStatusLabel = (status: BlogStatus) => {
  switch (status) {
    case BlogStatus.Published:
      return 'Published';
    case BlogStatus.Draft:
      return 'Draft';
    case BlogStatus.PendingReview:
      return 'Pending Review';
    case BlogStatus.Archived:
      return 'Archived';
    default:
      return status;
  }
};

export const formatReadTime = (minutes: number | null): string => {
  if (!minutes) return 'Unknown';
  return `${minutes} min${minutes !== 1 ? 's' : ''}`;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
