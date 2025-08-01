// Category Types
export interface Category {
  _id: string
  name: string
  slug: string
  description: string
  parent_category: {
    _id: string
    name: string
    slug: string
  } | null
  image_url: string | null
  is_active: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CategoriesResponse {
  success: boolean
  message: string
  data: Category[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Product Types
export interface Brand {
  _id: string
  name: string
  logo_url: string
  slug: string
}

export interface ProductCategory {
  _id: string
  name: string
  slug: string
}

export interface RatingDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
  _id: string
}

export interface SEODetails {
  meta_title: string
  meta_description: string
  meta_keywords: string[]
}

export interface ProductVariant {
  _id: string
  sku_code: string
  slug: string
  price: number
  discount_details: {
    price: number | null
    percentage: number | null
    end_date: string | null
    is_on_sale: boolean
  }
  calculated_discount_price: number | null
  weight: {
    value: number
    unit: string
  }
  dimensions: {
    length: number
    width: number
    height: number
    unit: string
  }
  images: string[]
  option_values: string[]
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id: string
  category_id: ProductCategory
  name: string
  description: string
  short_description: string
  images: string[]
  brand_id: Brand
  score: number
  seo_details: SEODetails
  average_rating: number
  reviews_count: number
  rating_distribution: RatingDistribution
  min_price: number
  min_discounted_price: number | null
  variants?: ProductVariant[]
  is_active: boolean
  createdAt: string
  updatedAt: string
  slug: string
  __v: number
}

export interface FeaturedProductsResponse {
  success: boolean
  message: string
  count: number
  data: Product[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Favorites Types
export interface Favorite {
  _id: string
  user_id: string
  product_variant_id: {
    _id: string
    id: string
    product_id: {
      _id: string
      id: string
      category_id: string
      name: string
      description: string
      brand_id: string
      primary_image: string | null
    } | string
    option_values: string[]
    sku_code: string
    price: number
    discount_details: {
      price: number | null
      percentage: number | null
      end_date: string | null
      is_on_sale: boolean
    }
    images: string[]
    is_active: boolean
    average_rating: number
    reviews_count: number
    effective_price: number
    savings: number
    discount_percentage_calculated: number
  } | string
  added_at: string
  user_notes: string | null
  is_active: boolean
  createdAt: string
  updatedAt: string
  is_favorited: boolean
  days_since_added: number
  id: string
}

export interface FavoritesResponse {
  success: boolean
  message: string
  data: Favorite[]
}

export interface FavoriteActionResponse {
  success: boolean
  message: string
  data?: Favorite
}

export interface FavoriteCheckResponse {
  success: boolean
  message: string
  data: {
    is_favorited: boolean
    product_variant_id: string
  }
}
