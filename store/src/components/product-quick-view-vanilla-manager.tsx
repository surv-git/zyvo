"use client"

import React, { useEffect } from 'react'

interface ProductQuickViewVanillaManagerProps {
  onAddToCart: (productId: string, variantId: string, quantity: number) => void
  onToggleWishlist: (productId: string) => void
  onViewDetails: (productId: string) => void
  wishlistItems: string[]
}

const ProductQuickViewVanillaManager: React.FC<ProductQuickViewVanillaManagerProps> = ({
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  // wishlistItems - available for future use
}) => {
  useEffect(() => {
    // Set up global event listeners for vanilla modal interactions
    const handleAddToCart = (event: CustomEvent) => {
      const { productId, variantId, quantity } = event.detail
      onAddToCart(productId, variantId, quantity || 1)
    }

    const handleToggleWishlist = (event: CustomEvent) => {
      const { productId } = event.detail
      onToggleWishlist(productId)
    }

    const handleViewDetails = (event: CustomEvent) => {
      const { productId } = event.detail
      onViewDetails(productId)
    }

    // Add event listeners
    window.addEventListener('quick-view-add-to-cart', handleAddToCart as EventListener)
    window.addEventListener('quick-view-toggle-wishlist', handleToggleWishlist as EventListener)
    window.addEventListener('quick-view-view-details', handleViewDetails as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('quick-view-add-to-cart', handleAddToCart as EventListener)
      window.removeEventListener('quick-view-toggle-wishlist', handleToggleWishlist as EventListener)
      window.removeEventListener('quick-view-view-details', handleViewDetails as EventListener)
    }
  }, [onAddToCart, onToggleWishlist, onViewDetails])

  // This component doesn't render anything visible - it just manages global events
  return null
}

export default ProductQuickViewVanillaManager
