'use client'

import { useState, useEffect, useCallback } from 'react'
import { favoritesManager } from '@/lib/isolated-favorites-manager'

/**
 * Completely isolated favorites hook that doesn't depend on React Context
 * This prevents cascade re-renders when other favorites change
 */
export function useIsolatedFavoriteStatus(productId: string, useProductId: boolean = true) {
  const [isFavorite, setIsFavorite] = useState(() => favoritesManager.isFavorite(productId))
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to changes for only this specific product
  useEffect(() => {
    // Ensure manager is initialized before we subscribe
    const initializeAndSubscribe = async () => {
      await favoritesManager.initialize()
      
      const unsubscribe = favoritesManager.subscribe(productId, (changedProductId, newFavoriteState) => {
        if (changedProductId === productId) {
          console.log(`🔄 Favorite status changed for ${productId}:`, newFavoriteState)
          setIsFavorite(newFavoriteState)
        }
      })

      // Sync initial state after initialization
      const initialState = favoritesManager.isFavorite(productId)
      console.log(`🎯 Initial favorite state for ${productId}:`, initialState)
      setIsFavorite(initialState)

      return unsubscribe
    }

    let cleanup: (() => void) | undefined

    initializeAndSubscribe().then((unsubscribe) => {
      cleanup = unsubscribe
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [productId])

  const toggleFavorite = useCallback(async () => {
    try {
      setIsLoading(true)
      await favoritesManager.toggleFavorite(productId, useProductId)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [productId, useProductId])

  return {
    isFavorite,
    isLoading,
    toggleFavorite
  }
}
