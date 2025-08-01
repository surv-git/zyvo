"use client"

import React, { memo, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useFavoriteStatus } from '@/contexts/optimized-favorites-context'

interface FavoriteButtonProps {
  productVariantId: string
  productId?: string // Optional product ID for when no variant is selected
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onClick?: (e: React.MouseEvent) => void
}

const FavoriteButton: React.FC<FavoriteButtonProps> = memo(({
  productVariantId,
  productId,
  className = "",
  style,
  size = 'md',
  showText = false,
  onClick
}) => {
  // If productId is provided, use product_id (true), otherwise use product_variant_id (false)
  const useProductId = !!productId
  const idToUse = productId || productVariantId
  
  const { isFavorite, toggleFavorite, loading } = useFavoriteStatus(idToUse, useProductId)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    
    if (onClick) {
      onClick(e)
    }
    
    try {
      const wasAlreadyFavorite = isFavorite
      await toggleFavorite()
      
      // Show success toast with appropriate message
      if (wasAlreadyFavorite) {
        toast.success('Removed from favorites', {
          description: 'Product has been removed from your favorites',
          icon: '💔',
          duration: 2000,
        })
      } else {
        toast.success('Added to favorites!', {
          description: 'Product has been added to your favorites',
          icon: '❤️',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast.error('Something went wrong', {
        description: 'Failed to update favorites. Please try again.',
        icon: '⚠️',
        duration: 3000,
      })
    }
  }, [toggleFavorite, onClick, loading, isFavorite])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`group relative overflow-hidden transition-all duration-300 ${className}`}
      style={style}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <div className="flex items-center justify-center">
        <Heart 
          className={`${sizeClasses[size]} transition-all duration-300 ${
            isFavorite 
              ? 'text-red-500 fill-red-500 scale-110' 
              : 'text-neutral-600 hover:text-red-500 group-hover:scale-110'
          }`} 
        />
        {showText && (
          <span className={`ml-2 font-medium transition-colors duration-300 ${
            isFavorite ? 'text-red-500' : 'text-neutral-700 group-hover:text-red-500'
          }`}>
            {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
          </span>
        )}
      </div>
      
      {/* Trendy background effect */}
      {showText && (
        <div className={`absolute inset-0 transition-all duration-300 -z-10 ${
          isFavorite 
            ? 'bg-red-50 border-red-200' 
            : 'bg-white border-neutral-300 group-hover:bg-red-50 group-hover:border-red-200'
        } border rounded-lg`} />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}
    </button>
  )
})

FavoriteButton.displayName = 'FavoriteButton'

export default FavoriteButton
