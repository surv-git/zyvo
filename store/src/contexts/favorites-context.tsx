"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { FavoritesService } from '@/services/favorites-service'

interface FavoritesContextType {
  favorites: Set<string>
  loading: boolean
  error: string | null
  addToFavorites: (productVariantId: string) => Promise<void>
  removeFromFavorites: (productVariantId: string) => Promise<void>
  toggleFavorite: (productVariantId: string) => Promise<void>
  isFavorite: (productVariantId: string) => boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

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

  const addToFavorites = useCallback(async (productVariantId: string) => {
    try {
      await FavoritesService.addToFavorites(productVariantId)
      setFavorites(prev => new Set([...prev, productVariantId]))
    } catch (err) {
      console.error('Error adding to favorites:', err)
      throw err
    }
  }, [])

  const removeFromFavorites = useCallback(async (productVariantId: string) => {
    try {
      await FavoritesService.removeFromFavorites(productVariantId)
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        newFavorites.delete(productVariantId)
        return newFavorites
      })
    } catch (err) {
      console.error('Error removing from favorites:', err)
      throw err
    }
  }, [])

  const toggleFavorite = useCallback(async (productVariantId: string) => {
    const isCurrentlyFavorite = favorites.has(productVariantId)
    
    if (isCurrentlyFavorite) {
      await removeFromFavorites(productVariantId)
    } else {
      await addToFavorites(productVariantId)
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
  }), [
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  ])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
