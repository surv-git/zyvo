"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react'
import { FavoritesService, FAVORITES_CONFIG } from '@/services/favorites-service'

interface FavoritesContextType {
  favorites: Set<string>
  loading: boolean
  error: string | null
  addToFavorites: (productVariantId: string, useProductId?: boolean) => Promise<void>
  removeFromFavorites: (productVariantId: string, useProductId?: boolean) => Promise<void>
  toggleFavorite: (productVariantId: string, useProductId?: boolean) => Promise<void>
  isFavorite: (productVariantId: string) => boolean
  refreshFavorites: () => Promise<void>
  checkIndividualFavoriteStatus: (productVariantId: string) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

// Custom hook with truly isolated re-renders using event system
export const useFavoriteStatus = (productVariantId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID) => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavoriteStatus must be used within a FavoritesProvider')
  }
  
  const [isFavorite, setIsFavorite] = useState(() => context.favorites.has(productVariantId))
  const [isLoading, setIsLoading] = useState(false)
  
  // Listen for changes only to this specific product
  useEffect(() => {
    const handleFavoriteChange = (event: CustomEvent) => {
      if (event.detail.productId === productVariantId) {
        setIsFavorite(event.detail.isFavorite)
      }
    }
    
    window.addEventListener('favoriteChanged', handleFavoriteChange as EventListener)
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange as EventListener)
    }
  }, [productVariantId])
  
  // Initial sync
  useEffect(() => {
    setIsFavorite(context.favorites.has(productVariantId))
  }, [context.favorites.has(productVariantId)])
  
  const toggleFavorite = useCallback(async () => {
    setIsLoading(true)
    const wasCurrentlyFavorite = isFavorite
    
    try {
      // Optimistically update UI
      setIsFavorite(!wasCurrentlyFavorite)
      
      // Perform the actual toggle
      await context.toggleFavorite(productVariantId, useProductId)
      
      // Emit event for this specific product
      window.dispatchEvent(new CustomEvent('favoriteChanged', {
        detail: { productId: productVariantId, isFavorite: !wasCurrentlyFavorite }
      }))
    } catch (error) {
      console.error('toggleFavorite error for:', productVariantId, error)
      // Revert optimistic update
      setIsFavorite(wasCurrentlyFavorite)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [context.toggleFavorite, productVariantId, useProductId, isFavorite])
  
  return {
    isFavorite,
    toggleFavorite,
    loading: isLoading // Return individual loading state instead of global
  }
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

interface FavoritesProviderProps {
  children: ReactNode
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const favoriteIds = await FavoritesService.getFavorites()
      setFavorites(new Set(favoriteIds))
    } catch (err) {
      console.error('Error refreshing favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkIndividualFavoriteStatus = useCallback(async (productVariantId: string) => {
    try {
      const isFavorite = await FavoritesService.checkFavoriteStatus(productVariantId)
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (isFavorite) {
          newFavorites.add(productVariantId)
        } else {
          newFavorites.delete(productVariantId)
        }
        return newFavorites
      })
      return isFavorite
    } catch (err) {
      console.error('Error checking individual favorite status:', err)
      throw err
    }
  }, [])

  const addToFavorites = useCallback(async (productVariantId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID) => {
    try {
      await FavoritesService.addToFavorites(productVariantId, useProductId)
      // Don't update global state here - let the hook handle it optimistically
    } catch (err) {
      console.error('Error adding to favorites:', err)
      throw err
    }
  }, [])

  const removeFromFavorites = useCallback(async (productVariantId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID) => {
    try {
      await FavoritesService.removeFromFavorites(productVariantId, useProductId)
      // Don't update global state here - let the hook handle it optimistically
    } catch (err) {
      console.error('Error removing from favorites:', err)
      throw err
    }
  }, [])

  const toggleFavorite = useCallback(async (productVariantId: string, useProductId: boolean = FAVORITES_CONFIG.USE_PRODUCT_ID) => {
    const isCurrentlyFavorite = favorites.has(productVariantId)
    
    try {
      if (isCurrentlyFavorite) {
        await removeFromFavorites(productVariantId, useProductId)
        // Update global state after successful removal
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          newFavorites.delete(productVariantId)
          return newFavorites
        })
      } else {
        await addToFavorites(productVariantId, useProductId)
        // Update global state after successful addition
        setFavorites(prev => new Set([...prev, productVariantId]))
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error)
      throw error
    }
  }, [favorites, addToFavorites, removeFromFavorites])

  const isFavorite = useCallback((productVariantId: string) => {
    return favorites.has(productVariantId)
  }, [favorites])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  const value = useMemo<FavoritesContextType>(() => ({
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    checkIndividualFavoriteStatus,
  }), [
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    checkIndividualFavoriteStatus,
  ])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
