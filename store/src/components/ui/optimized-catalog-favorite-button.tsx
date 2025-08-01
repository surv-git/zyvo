"use client"

import React, { memo, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useIsolatedFavoriteStatus } from '@/hooks/use-isolated-favorite-status'

interface OptimizedCatalogFavoriteButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const OptimizedCatalogFavoriteButton = memo<OptimizedCatalogFavoriteButtonProps>(function OptimizedCatalogFavoriteButton({
  productId,
  className = '',
  size = 'sm'
}) {
  // Catalog should always use product_id (not product_variant_id)
  const { isFavorite, toggleFavorite, isLoading } = useIsolatedFavoriteStatus(productId, true)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    try {
      await toggleFavorite()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [toggleFavorite, isLoading])

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${sizeClasses[size]} ${
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-neutral-600'
        } ${isLoading ? 'opacity-50 animate-pulse' : ''}`} 
      />
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.className === nextProps.className &&
    prevProps.size === nextProps.size
  )
})

export default OptimizedCatalogFavoriteButton
