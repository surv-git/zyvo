import { API_CONFIG } from '@/lib/api-config'

export interface UnsplashImage {
  id: string
  url: string
  thumb: string
  small: string
  full: string
  alt_description: string
  photographer: string
  photographer_url: string
  download_url: string
  width: number
  height: number
}

export interface UnsplashResponse {
  success: boolean
  data: UnsplashImage[]
  count: number
}

export class UnsplashService {
  private static cache = new Map<string, UnsplashImage[]>()
  private static cacheExpiry = new Map<string, number>()
  private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  /**
   * Get image suggestions for a product from Unsplash
   */
  static async getProductImageSuggestions(productId: string): Promise<UnsplashImage[]> {
    console.log('🔍 UnsplashService: Getting suggestions for product:', productId)
    
    try {
      // Check cache first
      const cached = this.getCachedImages(productId)
      if (cached) {
        console.log('📦 UnsplashService: Using cached suggestions for product:', productId, 'Count:', cached.length)
        return cached
      }

      console.log('🌐 UnsplashService: Fetching from API for product:', productId)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UNSPLASH.PRODUCT_SUGGESTIONS(productId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 UnsplashService: API response status:', response.status, 'for product:', productId)

      if (!response.ok) {
        throw new Error(`Failed to fetch Unsplash suggestions: ${response.status}`)
      }

      const result: UnsplashResponse = await response.json()
      
      console.log('📋 UnsplashService: API response data:', result, 'for product:', productId)
      
      if (result.success && result.data.length > 0) {
        // Cache the results
        this.cache.set(productId, result.data)
        this.cacheExpiry.set(productId, Date.now() + this.CACHE_DURATION)
        
        console.log('✅ UnsplashService: Successfully cached', result.data.length, 'suggestions for product:', productId)
        return result.data
      }
      
      console.log('❌ UnsplashService: No suggestions found for product:', productId)
      return []
    } catch (error) {
      console.error('❌ UnsplashService: Error fetching suggestions for product:', productId, error)
      return []
    }
  }

  /**
   * Get a random image from the suggestions
   */
  static async getRandomProductImage(productId: string): Promise<UnsplashImage | null> {
    const suggestions = await this.getProductImageSuggestions(productId)
    if (suggestions.length === 0) return null
    
    // Use product ID to get a consistent "random" image
    const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % suggestions.length
    
    return suggestions[index]
  }

  /**
   * Get cached images if they exist and haven't expired
   */
  private static getCachedImages(productId: string): UnsplashImage[] | null {
    const cached = this.cache.get(productId)
    const expiry = this.cacheExpiry.get(productId)
    
    if (cached && expiry && Date.now() < expiry) {
      return cached
    }
    
    // Clean up expired cache
    if (cached) {
      this.cache.delete(productId)
      this.cacheExpiry.delete(productId)
    }
    
    return null
  }

  /**
   * Clear all cached images
   */
  static clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * Get the best quality image URL based on size requirements
   */
  static getBestImageUrl(image: UnsplashImage, preferredSize: 'thumb' | 'small' | 'url' | 'full' = 'url'): string {
    switch (preferredSize) {
      case 'thumb':
        return image.thumb
      case 'small':
        return image.small
      case 'full':
        return image.full
      default:
        return image.url
    }
  }
}
