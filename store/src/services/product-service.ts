import { FeaturedProductsResponse, Product } from '@/types/api'
import { API_CONFIG, apiGet } from '@/lib/api-config'
import { getProductImage } from '@/lib/product-utils'

export class ProductService {
  /**
   * Fetches featured products from the API
   */
  static async getFeaturedProducts(limit: number = 5): Promise<Product[]> {
    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS.FEATURED}?limit=${limit}`
      const data = await apiGet<FeaturedProductsResponse>(endpoint)
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch featured products')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching featured products:', error)
      throw error
    }
  }

  /**
   * Generates a fallback image URL for products without images
   */
  static getProductImageUrl(product: Product, index: number = 0): string {
    return getProductImage(product.images, product._id, index)
  }

  /**
   * Formats the product rating for display
   */
  static formatRating(rating: number): string {
    return rating.toFixed(1)
  }

  /**
   * Generates star rating display
   */
  static getStarRating(rating: number): { fullStars: number; hasHalfStar: boolean; emptyStars: number } {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    return { fullStars, hasHalfStar, emptyStars }
  }
}
