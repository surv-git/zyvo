"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react'
import { FavoritesService } from '@/services/favorites-service'

interface LazyFavoritesContextType {
  isFavorite: (productVariantId: string) => boolean
  toggleFavorite: (productVariantId: string) => Promise<void>
  refreshFavoriteStatus: (productVariantId: string) => Promise<boolean>
  loading: boolean
}

const LazyFavoritesContext = createContext<LazyFavoritesContextType | undefined>(undefined)

// Hook for individual product favorite status with lazy loading
export const useLazyFavoriteStatus = (productVariantId: string) => {
  const context = useContext(LazyFavoritesContext)
  if (context === undefined) {
    throw new Error('useLazyFavoriteStatus must be used within a LazyFavoritesProvider')
  }
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const checkedRef = useRef(false)
  
  // Lazy load favorite status on first access
  const checkStatus = useCallback(async () => {
    if (checkedRef.current) return
    
    try {
      setLoading(true)
      checkedRef.current = true
      const status = await context.refreshFavoriteStatus(productVariantId)
      setIsFavorite(status)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    } finally {
      setLoading(false)
    }
  }, [context, productVariantId])
  
  // Check status on mount
  useEffect(() => {
    checkStatus()
  }, [checkStatus])
  
  const toggleFavorite = useCallback(async () => {
    try {
      setLoading(true)
      await context.toggleFavorite(productVariantId)
      setIsFavorite(prev => !prev)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }, [context, productVariantId])
  
  return {
    isFavorite,
    toggleFavorite,
    loading
  }
}

interface LazyFavoritesProviderProps {
  children: ReactNode
}

export const LazyFavoritesProvider: React.FC<LazyFavoritesProviderProps> = ({ children }) => {
  const [favoriteCache, setFavoriteCache] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(false)

  const isFavorite = useCallback((productVariantId: string) => {
    return favoriteCache.get(productVariantId) || false
  }, [favoriteCache])

  const refreshFavoriteStatus = useCallback(async (productVariantId: string) => {
    try {
      const status = await FavoritesService.checkFavoriteStatus(productVariantId)
      setFavoriteCache(prev => new Map(prev).set(productVariantId, status))
      return status
    } catch (error) {
      console.error('Error refreshing favorite status:', error)
      throw error
    }
  }, [])

  const toggleFavorite = useCallback(async (productVariantId: string) => {
    const currentStatus = favoriteCache.get(productVariantId) || false
    
    try {
      if (currentStatus) {
        await FavoritesService.removeFromFavorites(productVariantId)
      } else {
        await FavoritesService.addToFavorites(productVariantId)
      }
      
      // Update cache
      setFavoriteCache(prev => new Map(prev).set(productVariantId, !currentStatus))
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }, [favoriteCache])

  const value = useMemo<LazyFavoritesContextType>(() => ({
    isFavorite,
    toggleFavorite,
    refreshFavoriteStatus,
    loading,
  }), [isFavorite, toggleFavorite, refreshFavoriteStatus, loading])

  return (
    <LazyFavoritesContext.Provider value={value}>
      {children}
    </LazyFavoritesContext.Provider>
  )
}
