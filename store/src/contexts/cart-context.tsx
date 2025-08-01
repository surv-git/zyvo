"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { CartService } from '@/services/cart-service'
import { CartItem, Cart, AddToCartRequest } from '@/types/cart'

interface CartContextValue {
  cart: Cart | null
  cartItems: CartItem[]
  totalItems: number
  totalAmount: number
  loading: boolean
  error: string | null
  addToCart: (request: AddToCartRequest) => Promise<void>
  updateQuantity: (productVariantId: string, quantity: number) => Promise<void>
  removeItem: (productVariantId: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearError: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use refs to prevent unnecessary re-renders during batch updates
  const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart?.cart_total_amount || 0

  // Batched cart refresh to prevent multiple rapid updates
  const refreshCartBatched = useCallback(async () => {
    if (isUpdatingRef.current) return
    
    // Clear any pending batch update
    if (batchUpdateTimeoutRef.current) {
      clearTimeout(batchUpdateTimeoutRef.current)
    }

    // Batch the update to prevent rapid successive calls
    batchUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        isUpdatingRef.current = true
        const response = await CartService.getCart()
        
        // Use React's automatic batching for state updates
        React.startTransition(() => {
          setCart(response.data.cart)
          setCartItems(response.data.items)
          setError(null)
        })
      } catch (error) {
        console.error('Error fetching cart:', error)
        React.startTransition(() => {
          setError('Failed to load cart. Please try again.')
        })
      } finally {
        isUpdatingRef.current = false
      }
    }, 100) // Small delay to batch rapid successive calls
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await CartService.getCart()
      setCart(response.data.cart)
      setCartItems(response.data.items)
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Failed to load cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimistic add to cart with minimal re-renders
  const addToCart = async (request: AddToCartRequest) => {
    try {
      // Don't set loading for add to cart to prevent page re-render
      // The modal will handle its own loading state
      setError(null)
      
      await CartService.addToCart(request)
      
      // Use batched refresh to prevent immediate re-render
      await refreshCartBatched()
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError('Failed to add item to cart. Please try again.')
      throw error
    }
  }

  const updateQuantity = async (productVariantId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(productVariantId)
      return
    }

    try {
      setLoading(true)
      setError(null)
      await CartService.updateCartItem(productVariantId, { quantity })
      await refreshCartBatched()
    } catch (error) {
      console.error('Error updating quantity:', error)
      setError('Failed to update item quantity. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (productVariantId: string) => {
    try {
      setLoading(true)
      setError(null)
      await CartService.removeCartItem(productVariantId)
      await refreshCartBatched()
    } catch (error) {
      console.error('Error removing item:', error)
      setError('Failed to remove item from cart. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initial cart load
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchUpdateTimeoutRef.current) {
        clearTimeout(batchUpdateTimeoutRef.current)
      }
    }
  }, [])

  const value: CartContextValue = {
    cart,
    cartItems,
    totalItems,
    totalAmount,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart,
    clearError
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
