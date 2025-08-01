"use client"

import React, { memo, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useFavoriteStatus } from '@/contexts/optimized-favorites-context'

interface CatalogFavoriteButtonLargeProps {
  productId: string
  className?: string
}

const CatalogFavoriteButtonLarge = memo<CatalogFavoriteButtonLargeProps>(function CatalogFavoriteButtonLarge({
  productId,
  className = ''
}) {
  const { isFavorite, toggleFavorite, loading } = useFavoriteStatus(productId)

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
        className={`w-5 h-5 ${
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-neutral-400'
        }`} 
      />
    </button>
  )
}, (prevProps, nextProps) => {
  return prevProps.productId === nextProps.productId && prevProps.className === nextProps.className
})

export default CatalogFavoriteButtonLarge
