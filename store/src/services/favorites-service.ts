import { FavoritesResponse, FavoriteActionResponse, FavoriteCheckResponse } from '@/types/api'
import { API_CONFIG, apiGet, apiPost, apiDelete } from '@/lib/api-config'

// Configuration for favorites API - set to true to use product_id, false for product_variant_id
export const FAVORITES_CONFIG = {
  USE_PRODUCT_ID: false // Default to product_variant_id, but can be overridden per call
}

export class FavoritesService {
  /**
   * Fetches user's favorite products
   */
  static async getFavorites(): Promise<string[]> {
    try {
      console.log('Fetching all favorites...') // Debug log
      const endpoint = API_CONFIG.ENDPOINTS.USER.FAVORITES
      const data = await apiGet<FavoritesResponse>(endpoint, true) // Include auth
      console.log('Raw favorites response:', data) // Debug log
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch favorites')
      }

      // Extract both product IDs and variant IDs from the nested structure
      const favoriteProductIds = new Set<string>()
      const favoriteVariantIds = new Set<string>()
      
      data.data.forEach(favorite => {
        // Extract variant ID
        const variantId = typeof favorite.product_variant_id === 'string' 
          ? favorite.product_variant_id 
          : favorite.product_variant_id._id || favorite.product_variant_id.id;
        
        // Extract product ID from nested structure  
        let productId = null
        if (typeof favorite.product_variant_id === 'object' && favorite.product_variant_id.product_id) {
          productId = typeof favorite.product_variant_id.product_id === 'string'
            ? favorite.product_variant_id.product_id
            : favorite.product_variant_id.product_id._id || favorite.product_variant_id.product_id.id
        }
        
        if (variantId) favoriteVariantIds.add(variantId)
        if (productId) favoriteProductIds.add(productId)
      })
      
      // Combine both sets - this allows checking for both product IDs and variant IDs
      const allFavoriteIds = Array.from(new Set([...favoriteProductIds, ...favoriteVariantIds]))
      
      console.log('Extracted favorite product IDs:', Array.from(favoriteProductIds))
      console.log('Extracted favorite variant IDs:', Array.from(favoriteVariantIds))
      console.log('Combined favorite IDs:', allFavoriteIds)
      
      return allFavoriteIds
    } catch (error) {
      console.error('Error fetching favorites:', error)
      throw error
    }
  }

  /**
   * Adds a product to favorites
   * @param productId - The product ID (can be product_id or product_variant_id)
   * @param useProductId - If true, sends as product_id; if false, sends as product_variant_id (default: uses FAVORITES_CONFIG.USE_PRODUCT_ID)
   */
  static async addToFavorites(productId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID): Promise<void> {
    try {
      console.log('Adding to favorites:', productId, 'useProductId:', useProductId) // Debug log
      const endpoint = API_CONFIG.ENDPOINTS.USER.FAVORITES
      console.log('POST endpoint:', endpoint) // Debug log
      
      // Create request body based on the useProductId flag
      const requestBody = useProductId 
        ? { product_id: productId }
        : { product_variant_id: productId }
      
      console.log('Request body:', requestBody) // Debug log
      
      const data = await apiPost<FavoriteActionResponse>(endpoint, requestBody, true) // Include auth
      console.log('Add to favorites response:', data) // Debug log
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to add to favorites')
      }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  /**
   * Removes a product from favorites
   * @param productId - The product ID (can be product_id or product_variant_id)
   * @param useProductId - If true, uses type=product; if false, uses type=variant (default: uses FAVORITES_CONFIG.USE_PRODUCT_ID)
   */
  static async removeFromFavorites(productId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID): Promise<void> {
    try {
      console.log('Removing from favorites:', productId, 'useProductId:', useProductId) // Debug log
      
      // Create endpoint with product ID in path and type as query parameter
      const type = useProductId ? 'product' : 'variant'
      const endpoint = `${API_CONFIG.ENDPOINTS.USER.FAVORITES}/${productId}?type=${type}`
      
      console.log('DELETE endpoint:', endpoint) // Debug log
      const data = await apiDelete<FavoriteActionResponse>(endpoint, true) // Include auth
      console.log('Remove from favorites response:', data) // Debug log
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to remove from favorites')
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  /**
   * Checks if a specific product variant is in favorites
   */
  static async checkFavoriteStatus(productVariantId: string): Promise<boolean> {
    try {
      console.log('Checking favorite status for:', productVariantId) // Debug log
      const endpoint = `${API_CONFIG.ENDPOINTS.USER.FAVORITES}/${productVariantId}/check`
      console.log('Using endpoint:', endpoint) // Debug log
      const data = await apiGet<FavoriteCheckResponse>(endpoint, true) // Include auth
      console.log('Check favorite response:', data) // Debug log
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to check favorite status')
      }

      return data.data.is_favorited
    } catch (error) {
      console.error('Error checking favorite status:', error)
      throw error
    }
  }

  /**
   * Toggles a product's favorite status
   * @param productId - The product ID (can be product_id or product_variant_id)
   * @param isFavorite - Current favorite status
   * @param useProductId - If true, sends as product_id; if false, sends as product_variant_id (default: uses FAVORITES_CONFIG.USE_PRODUCT_ID)
   */
  static async toggleFavorite(productId: string, isFavorite: boolean, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID): Promise<void> {
    if (isFavorite) {
      await this.removeFromFavorites(productId, useProductId)
    } else {
      await this.addToFavorites(productId, useProductId)
    }
  }
}
