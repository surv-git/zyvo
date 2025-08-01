import { API_CONFIG, apiGet } from '@/lib/api-config'

export interface CatalogProduct {
  _id: string
  name: string
  slug: string
  description: string
  short_description: string
  category_id: {
    _id: string
    name: string
    slug: string
    description: string
    parent_category: string | null
    image_url: string | null
    is_active: boolean
  }
  brand_id: {
    _id: string
    name: string
  } | string
  images: string[]
  score: number
  seo_details: {
    meta_title: string
    meta_description: string
    meta_keywords: string[]
  }
  is_active: boolean
  createdAt: string
  updatedAt: string
  min_price: number
  min_discounted_price: number | null
  variants: Array<{
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
  }>
}

export interface ProductVariant {
  _id: string
  product_id: {
    _id: string
    name: string
    description: string
    slug: string
    primary_image: string | null
  }
  option_values: Array<{
    _id: string
    option_type: string
    option_value: string
    name: string
    slug: string
    full_name: string
  }>
  sku_code: string
  price: number
  discount_details: {
    price: number | null
    percentage: number | null
    end_date: string | null
    is_on_sale: boolean
  }
  slug: string
  dimensions: {
    length: number
    width: number
    height: number
    unit: string
  }
  weight: {
    value: number
    unit: string
  }
  packaging_cost: number
  shipping_cost: number
  images: string[]
  is_active: boolean
  sort_order: number
  average_rating: number
  reviews_count: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
    _id: string
  }
  effective_price: number
  savings: number
  discount_percentage_calculated: number
}

export interface CatalogResponse {
  success: boolean
  data: CatalogProduct[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface VariantsResponse {
  success: boolean
  data: ProductVariant[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CatalogFilters {
  category?: string  // Single category for now
  subcategory?: string
  brand?: string[]     // Multiple brands supported (comma-separated)
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  onSale?: boolean
  sortBy?: string    // Will be mapped to sort_by in API
  sortOrder?: 'asc' | 'desc'  // Will be mapped to sort_order in API
  page?: number
  limit?: number
  search?: string
}

export class CatalogService {
  static async getProducts(filters: CatalogFilters = {}): Promise<CatalogResponse> {
    try {
      const params = new URLSearchParams()
      
      // ONLY send parameters that the API endpoint accepts
      // According to your feedback, the endpoint only accepts category_id and brand_id
      
      if (filters.category) {
        // Single category
        params.append('category_id', filters.category)
      }
      
      if (filters.brand && filters.brand.length > 0) {
        // Join multiple brands with comma
        params.append('brand_id', filters.brand.join(','))
      }
      
      // Add basic pagination parameters (assuming these are accepted)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      // Remove all other parameters that might cause API inconsistencies:
      // - subcategory, minPrice, maxPrice, rating, inStock, onSale, sortBy, sortOrder, search
      // These might be causing the API to return different responses even with same category/brand

      const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS.LIST}?${params.toString()}`
      
      // Debug: Log the constructed URL (simplified)
      console.log('🔗 API Request URL:', endpoint)
      console.log('📋 Filter params (cleaned):', Object.fromEntries(params.entries()))
      
      return await apiGet<CatalogResponse>(endpoint)
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  static async getProductVariants(productId?: string, filters: CatalogFilters = {}): Promise<VariantsResponse> {
    try {
      const params = new URLSearchParams()
      
      if (productId) params.append('productId', productId)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS.VARIANTS}?${params.toString()}`
      return await apiGet<VariantsResponse>(endpoint)
    } catch (error) {
      console.error('Error fetching product variants:', error)
      throw error
    }
  }

  static async searchProducts(query: string, filters: CatalogFilters = {}): Promise<CatalogResponse> {
    return this.getProducts({ ...filters, search: query })
  }

  static async getProductsByCategory(categorySlug: string, filters: CatalogFilters = {}): Promise<CatalogResponse> {
    return this.getProducts({ ...filters, category: categorySlug })
  }

  static async getProductById(identifier: string): Promise<{ success: boolean; data?: CatalogProduct; error?: string }> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PRODUCTS.DETAIL(identifier)
      console.log('Fetching product from endpoint:', endpoint)
      
      const response = await apiGet<{ success: boolean; data?: CatalogProduct }>(endpoint)
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: 'Product not found' }
      }
    } catch (error) {
      console.error('Error fetching product by ID:', error)
      return { success: false, error: 'Failed to fetch product' }
    }
  }
}
