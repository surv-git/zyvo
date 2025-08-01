/**
 * Completely isolated favorites manager that doesn't use React Context
 * This prevents any cascade re-renders when favorites change
 */

import { FavoritesService } from '@/services/favorites-service'

// Import test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@/utils/test-favorites')
}

type FavoriteChangeListener = (productId: string, isFavorite: boolean) => void

class IsolatedFavoritesManager {
  private favorites = new Set<string>()
  private listeners = new Map<string, Set<FavoriteChangeListener>>()
  private loadingStates = new Map<string, boolean>()
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  // Public method to force re-initialization (useful after login/logout)
  async forceReinitialize(): Promise<void> {
    console.log('🔄 Force re-initializing favorites manager...')
    this.initialized = false
    this.initializationPromise = null
    this.favorites.clear()
    await this.initialize()
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔄 Favorites manager already initialized')
      return
    }
    
    // If already initializing, wait for that promise
    if (this.initializationPromise) {
      console.log('⏳ Waiting for existing initialization to complete...')
      return this.initializationPromise
    }
    
    // Start initialization
    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }
  
  private async _doInitialize(): Promise<void> {
    console.log('🚀 Starting favorites manager initialization...')
    
    // First, try to load from localStorage as a fallback
    this.loadFromLocalStorage()
    const localStorageFavorites = new Set(this.favorites)
    console.log('📱 Loaded from localStorage:', Array.from(localStorageFavorites))
    
    // Then try to get fresh data from API
    try {
      console.log('📡 Attempting to fetch favorites from API...')
      const favoriteIds = await FavoritesService.getFavorites()
      this.favorites = new Set(favoriteIds)
      console.log('✅ Favorites initialized from API with', favoriteIds.length, 'items:', favoriteIds)
      // Save fresh API data to localStorage as backup
      this.saveToLocalStorage()
      this.initialized = true
      console.log('🎉 Favorites manager successfully initialized with API data')
    } catch (error) {
      console.warn('⚠️ Failed to initialize favorites from API, using localStorage fallback:', error)
      // Keep the localStorage data we loaded earlier
      this.favorites = localStorageFavorites
      console.log('📱 Using localStorage favorites:', Array.from(this.favorites))
      this.initialized = true
      console.log('🎉 Favorites manager initialized with localStorage fallback')
    }
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('favorites')
        if (stored) {
          const favoriteIds = JSON.parse(stored)
          this.favorites = new Set(favoriteIds)
          console.log('📱 Loaded favorites from localStorage:', favoriteIds)
        }
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error)
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const favoriteIds = Array.from(this.favorites)
        localStorage.setItem('favorites', JSON.stringify(favoriteIds))
        console.log('💾 Saved favorites to localStorage:', favoriteIds)
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error)
      }
    }
  }

  isFavorite(productId: string): boolean {
    // Ensure we're initialized before checking
    if (!this.initialized) {
      console.log('⚠️ Favorites not yet initialized, returning false for', productId)
      return false
    }
    return this.favorites.has(productId)
  }

  isLoading(productId: string): boolean {
    return this.loadingStates.get(productId) || false
  }

  subscribe(productId: string, listener: FavoriteChangeListener): () => void {
    if (!this.listeners.has(productId)) {
      this.listeners.set(productId, new Set())
    }
    
    this.listeners.get(productId)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      const productListeners = this.listeners.get(productId)
      if (productListeners) {
        productListeners.delete(listener)
        if (productListeners.size === 0) {
          this.listeners.delete(productId)
        }
      }
    }
  }

  private notifyListeners(productId: string, isFavorite: boolean) {
    const productListeners = this.listeners.get(productId)
    if (productListeners) {
      productListeners.forEach(listener => {
        try {
          listener(productId, isFavorite)
        } catch (error) {
          console.error('Error in favorite listener:', error)
        }
      })
    }
  }

  async toggleFavorite(productId: string, useProductId: boolean = true): Promise<void> {
    if (this.loadingStates.get(productId)) {
      console.log('⏳ Already processing favorite toggle for', productId)
      return // Already processing
    }

    console.log('🚀 Starting favorite toggle for', productId, 'useProductId:', useProductId)
    this.loadingStates.set(productId, true)
    const wasCurrentlyFavorite = this.favorites.has(productId)
    const newFavoriteState = !wasCurrentlyFavorite
    
    console.log('📊 Current state:', wasCurrentlyFavorite, '→ New state:', newFavoriteState)

    // Optimistically update local state
    if (newFavoriteState) {
      this.favorites.add(productId)
      console.log('➕ Added to local favorites set')
    } else {
      this.favorites.delete(productId)
      console.log('➖ Removed from local favorites set')
    }

    // Notify listeners immediately (optimistic update)
    console.log('📢 Notifying listeners of state change')
    this.notifyListeners(productId, newFavoriteState)

    try {
      // Make API call
      if (wasCurrentlyFavorite) {
        console.log('🗑️ Calling API to remove from favorites')
        await FavoritesService.removeFromFavorites(productId, useProductId)
        console.log('✅ Successfully removed from favorites via API')
      } else {
        console.log('❤️ Calling API to add to favorites')
        await FavoritesService.addToFavorites(productId, useProductId)
        console.log('✅ Successfully added to favorites via API')
      }
      
      // Save to localStorage after successful API call
      this.saveToLocalStorage()
      
    } catch (error) {
      console.log('❌ API call failed, reverting optimistic update')
      // Revert optimistic update on error
      if (wasCurrentlyFavorite) {
        this.favorites.add(productId)
      } else {
        this.favorites.delete(productId)
      }
      
      // Notify listeners of the revert
      this.notifyListeners(productId, wasCurrentlyFavorite)
      
      // Still save to localStorage even if API failed (for offline persistence)
      this.saveToLocalStorage()
      
      console.error('Failed to toggle favorite:', error)
      throw error
    } finally {
      this.loadingStates.set(productId, false)
      console.log('🏁 Finished processing favorite toggle for', productId)
    }
  }

  // Get all favorites (for other components that need the full list)
  getAllFavorites(): string[] {
    return Array.from(this.favorites)
  }

  // For testing/debugging - manually set favorites
  setFavorites(favoriteIds: string[]) {
    this.favorites = new Set(favoriteIds)
    console.log('🔄 Manually set favorites to:', favoriteIds)
  }

  // For testing/debugging - manually add a favorite
  addToLocalSet(productId: string) {
    this.favorites.add(productId)
    this.notifyListeners(productId, true)
    console.log('➕ Manually added to local favorites:', productId)
  }

  // For testing/debugging - manually remove a favorite  
  removeFromLocalSet(productId: string) {
    this.favorites.delete(productId)
    this.notifyListeners(productId, false)
    console.log('➖ Manually removed from local favorites:', productId)
  }
}

// Singleton instance
export const favoritesManager = new IsolatedFavoritesManager()

// Initialize eagerly but don't block module loading
if (typeof window !== 'undefined') {
  // Initialize in next tick to avoid blocking
  setTimeout(() => {
    favoritesManager.initialize()
  }, 0)
}

// Expose utility functions for debugging and auth integration
if (typeof window !== 'undefined') {
  // Expose refresh function for auth integration
  (window as any).refreshFavorites = () => {
    console.log('🔄 Manually refreshing favorites...')
    return favoritesManager.forceReinitialize()
  }
  
  // Expose manager methods for debugging
  (window as any).debugFavorites = {
    manager: favoritesManager,
    refresh: () => favoritesManager.forceReinitialize(),
    check: (id: string) => favoritesManager.isFavorite(id),
    list: () => Array.from((favoritesManager as any).favorites)
  }
}
