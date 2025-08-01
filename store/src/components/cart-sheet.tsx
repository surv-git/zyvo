"use client"

import React, { memo, useCallback, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CartItem, Cart } from '@/types/cart'
import { formatIndianRupees } from '@/lib/currency-utils'
import { getProductImage } from '@/lib/product-utils'
import { useCart } from '@/contexts/cart-context'
import { CartService } from '@/services/cart-service'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Package,
  CreditCard,
  Trash2
} from 'lucide-react'

interface CartSheetPerformantProps {
  children: React.ReactNode
}

// Isolated cart item that manages its own state to prevent parent re-renders
const IsolatedCartItem = memo<{ 
  item: CartItem
  onUpdate: (productVariantId: string, quantity: number) => void
  onRemove: (productVariantId: string) => void
}>(({ item: initialItem, onUpdate, onRemove }) => {
  const [item, setItem] = useState(initialItem)
  const [isUpdating, setIsUpdating] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Update internal state when prop changes (from external updates)
  useEffect(() => {
    setItem(initialItem)
  }, [initialItem])

  const product = item.product_variant_id.product_id
  const variant = item.product_variant_id
  const productImage = getProductImage(variant.images, variant.id)

  const getCarouselFallback = () => {
    const imageNumber = (parseInt(product.id.slice(-2), 16) % 10) + 1
    return `/images/carousel-image-${imageNumber.toString().padStart(2, '0')}.jpg`
  }

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove()
      return
    }

    // Optimistically update local state
    setItem(prev => ({ ...prev, quantity: newQuantity }))
    setIsUpdating(true)

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Debounce the API call
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await CartService.updateCartItem(variant.id, { quantity: newQuantity })
        onUpdate(variant.id, newQuantity)
      } catch (error) {
        // Revert on error
        setItem(initialItem)
        console.error('Error updating quantity:', error)
      } finally {
        setIsUpdating(false)
      }
    }, 500) // Longer debounce to prevent excessive API calls
  }, [variant.id, initialItem, onUpdate])

  const handleRemove = useCallback(async () => {
    setIsUpdating(true)
    try {
      await CartService.removeCartItem(variant.id)
      onRemove(variant.id)
    } catch (error) {
      setIsUpdating(false)
      console.error('Error removing item:', error)
    }
  }, [variant.id, onRemove])

  return (
    <div className="flex gap-3 py-3" style={{ opacity: isUpdating ? 0.7 : 1 }}>
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = getCarouselFallback()
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-sm truncate pr-2">{product.name}</h4>
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        
        {variant.sku_code && variant.sku_code !== product.name && (
          <p className="text-xs text-neutral-600 mb-1">{variant.sku_code}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {formatIndianRupees(variant.price)}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="w-8 h-8 rounded-md border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 10 || isUpdating}
              className="w-8 h-8 rounded-md border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

IsolatedCartItem.displayName = 'IsolatedCartItem'

const CartSheetPerformant: React.FC<CartSheetPerformantProps> = memo(({ children }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [internalCartItems, setInternalCartItems] = useState<CartItem[]>([])
  const [internalTotalAmount, setInternalTotalAmount] = useState(0)
  const cartDataRef = useRef<{ cart: Cart | null, items: CartItem[] }>({ cart: null, items: [] })
  
  const { 
    cart, 
    cartItems, 
    totalAmount,
    loading, 
    error, 
    refreshCart 
  } = useCart()

  // Update internal state when cart data changes
  useEffect(() => {
    setInternalCartItems(cartItems)
    setInternalTotalAmount(totalAmount)
    cartDataRef.current = { cart, items: cartItems }
  }, [cart, cartItems, totalAmount])

  // Handle sheet open change - optimized to prevent delays
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    // Only refresh if we're opening and have no cart data yet
    // Don't refresh if we already have cart items to prevent delays
    if (open && !cart && !loading && cartItems.length === 0) {
      refreshCart()
    }
  }, [cart, loading, refreshCart, cartItems.length])

  // Optimized handlers that don't trigger full context re-renders
  const handleItemUpdate = useCallback((productVariantId: string, quantity: number) => {
    // Update internal state immediately for better UX
    setInternalCartItems(prev => 
      prev.map(item => 
        item.product_variant_id.id === productVariantId 
          ? { ...item, quantity }
          : item
      )
    )

    // Update total amount optimistically
    const item = cartDataRef.current.items.find(item => item.product_variant_id.id === productVariantId)
    if (item) {
      const quantityDiff = quantity - item.quantity
      const priceDiff = quantityDiff * item.product_variant_id.price
      setInternalTotalAmount(prev => prev + priceDiff)
    }

    // Refresh context data in background (debounced)
    setTimeout(() => refreshCart(), 1000)
  }, [refreshCart])

  const handleItemRemove = useCallback((productVariantId: string) => {
    // Remove from internal state immediately
    setInternalCartItems(prev => 
      prev.filter(item => item.product_variant_id.id !== productVariantId)
    )

    // Refresh context data
    setTimeout(() => refreshCart(), 500)
  }, [refreshCart])

  const handleProceedToCheckout = useCallback(() => {
    setIsOpen(false)
    router.push('/checkout')
  }, [router])

  const internalTotalItems = internalCartItems.reduce((sum, item) => sum + item.quantity, 0)
  const isEmpty = internalCartItems.length === 0

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-12 z-999">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {internalTotalItems > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {internalTotalItems} {internalTotalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {isEmpty ? 'Your cart is empty' : 'Review your items before checkout'}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-shrink-0">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Show loading only if we're actually loading and have no data */}
        {loading && isEmpty && !error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Package className="w-12 h-12 text-neutral-400 mb-4" />
            <p className="text-neutral-600 text-center mb-4">
              Your cart is empty
            </p>
            <Button onClick={() => setIsOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-1">
                {internalCartItems.map((item) => (
                  <IsolatedCartItem
                    key={item.product_variant_id.id}
                    item={item}
                    onUpdate={handleItemUpdate}
                    onRemove={handleItemRemove}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold">
                  {formatIndianRupees(internalTotalAmount)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleProceedToCheckout}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
})

CartSheetPerformant.displayName = 'CartSheetPerformant'

export default CartSheetPerformant
