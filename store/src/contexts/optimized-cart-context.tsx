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

export const OptimizedCartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use refs to track ongoing updates and prevent excessive re-renders
  const pendingUpdatesRef = useRef<Set<string>>(new Set())
  const lastUpdateRef = useRef<number>(0)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart?.cart_total_amount || 0

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await CartService.getCart()
      setCart(response.data.cart)
      setCartItems(response.data.items)
      lastUpdateRef.current = Date.now()
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Failed to load cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimized update quantity that batches updates
  const updateQuantity = useCallback(async (productVariantId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(productVariantId)
      return
    }

    // Prevent duplicate updates
    if (pendingUpdatesRef.current.has(productVariantId)) {
      return
    }

    try {
      pendingUpdatesRef.current.add(productVariantId)
      
      // Optimistically update local state immediately
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.product_variant_id.id === productVariantId 
            ? { ...item, quantity }
            : item
        )
      )

      // Update total amount optimistically if possible
      if (cart) {
        const item = cartItems.find(item => item.product_variant_id.id === productVariantId)
        if (item) {
          const quantityDiff = quantity - item.quantity
          const priceDiff = quantityDiff * item.product_variant_id.price
          setCart(prevCart => prevCart ? {
            ...prevCart,
            cart_total_amount: prevCart.cart_total_amount + priceDiff
          } : null)
        }
      }

      await CartService.updateCartItem(productVariantId, { quantity })
      
      // Only refresh if this is the most recent update and some time has passed
      const currentTime = Date.now()
      if (currentTime - lastUpdateRef.current > 1000) {
        await refreshCart()
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      setError('Failed to update item quantity. Please try again.')
      // Revert optimistic update on error
      await refreshCart()
      throw error
    } finally {
      pendingUpdatesRef.current.delete(productVariantId)
    }
  }, [cartItems, cart, refreshCart])

  const removeItem = useCallback(async (productVariantId: string) => {
    try {
      // Optimistically remove from local state
      setCartItems(prevItems => 
        prevItems.filter(item => item.product_variant_id.id !== productVariantId)
      )

      await CartService.removeCartItem(productVariantId)
      await refreshCart() // Always refresh after removal
    } catch (error) {
      console.error('Error removing item:', error)
      setError('Failed to remove item. Please try again.')
      await refreshCart() // Revert on error
      throw error
    }
  }, [refreshCart])

  const addToCart = useCallback(async (request: AddToCartRequest) => {
    try {
      setLoading(true)
      setError(null)
      await CartService.addToCart(request)
      await refreshCart()
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError('Failed to add item to cart. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [refreshCart])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initial cart load
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useOptimizedCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useOptimizedCart must be used within an OptimizedCartProvider')
  }
  return context
}

export default OptimizedCartProvider
