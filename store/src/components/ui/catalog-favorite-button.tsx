"use client"

import React, { memo, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useFavoriteStatus } from '@/contexts/optimized-favorites-context'

interface CatalogFavoriteButtonProps {
  productId: string
  className?: string
}

const CatalogFavoriteButton = memo<CatalogFavoriteButtonProps>(function CatalogFavoriteButton({
  productId,
  className = ''
}) {
  // Catalog should always use product_id (not product_variant_id)
  const { isFavorite, toggleFavorite, loading } = useFavoriteStatus(productId, true)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    
    try {
      await toggleFavorite()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [toggleFavorite, loading])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      <Heart 
        className={`w-3 h-3 ${
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-neutral-600'
        }`} 
      />
    </button>
  )
}, (prevProps, nextProps) => {
  return prevProps.productId === nextProps.productId && prevProps.className === nextProps.className
})

export default CatalogFavoriteButton
