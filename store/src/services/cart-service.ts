import { API_CONFIG, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-config'
import { 
  CartResponse, 
  AddToCartRequest, 
  AddToCartResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse 
} from '@/types/cart'

export class CartService {
  static async getCart(): Promise<CartResponse> {
    try {
      return await apiGet<CartResponse>(API_CONFIG.ENDPOINTS.CART.GET, true)
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  }

  static async addToCart(request: AddToCartRequest): Promise<AddToCartResponse> {
    try {
      return await apiPost<AddToCartResponse>(API_CONFIG.ENDPOINTS.CART.ADD_ITEM, request, true)
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  static async updateCartItem(productVariantId: string, request: UpdateCartItemRequest): Promise<UpdateCartItemResponse> {
    try {
      return await apiPatch<UpdateCartItemResponse>(
        API_CONFIG.ENDPOINTS.CART.UPDATE_ITEM(productVariantId), 
        request,
        true
      )
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  }

  static async removeCartItem(productVariantId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiDelete<{ success: boolean; message: string }>(
        API_CONFIG.ENDPOINTS.CART.REMOVE_ITEM(productVariantId),
        true
      )
    } catch (error) {
      console.error('Error removing cart item:', error)
      throw error
    }
  }
}
