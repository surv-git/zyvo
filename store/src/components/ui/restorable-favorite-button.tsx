"use client"

import React, { memo, useState, useCallback, useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { FavoritesService } from '@/services/favorites-service'

interface RestorableFavoriteButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// Self-contained favorite button that restores its own status
const RestorableFavoriteButton = memo<RestorableFavoriteButtonProps>(function RestorableFavoriteButton({
  productId,
  className = '',
  size = 'sm'
}) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const mountedRef = useRef(true)

  // Restore favorite status on mount
  useEffect(() => {
    let mounted = true
    
    const restoreStatus = async () => {
      try {
        setLoading(true)
        const status = await FavoritesService.checkFavoriteStatus(productId)
        
        if (mounted && mountedRef.current) {
          setIsFavorite(status)
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error restoring favorite status:', error)
        if (mounted && mountedRef.current) {
          setInitialized(true)
        }
      } finally {
        if (mounted && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    restoreStatus()
    
    return () => {
      mounted = false
    }
  }, [productId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    
    try {
      setLoading(true)
      
      if (isFavorite) {
        await FavoritesService.removeFromFavorites(productId)
        if (mountedRef.current) {
          setIsFavorite(false)
        }
      } else {
        await FavoritesService.addToFavorites(productId)
        if (mountedRef.current) {
          setIsFavorite(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [productId, isFavorite, loading])

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  }

  // Show loading state until initialized
  if (!initialized) {
    return (
      <button disabled className={className}>
        <Heart className={`${sizeClasses[size]} text-neutral-300 animate-pulse`} />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      <Heart 
        className={`${sizeClasses[size]} ${
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-neutral-600'
        } ${loading ? 'opacity-50' : ''}`} 
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

export default RestorableFavoriteButton
