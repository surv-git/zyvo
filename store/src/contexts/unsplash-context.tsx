import React, { createContext, useContext, useState, ReactNode } from 'react'
import { UnsplashService } from '@/services/unsplash-service'

interface UnsplashContextType {
  getImageForProduct: (productId: string) => Promise<string | null>
  isLoading: (productId: string) => boolean
  preloadImages: (productIds: string[]) => Promise<void>
}

const UnsplashContext = createContext<UnsplashContextType | undefined>(undefined)

interface UnsplashProviderProps {
  children: ReactNode
}

export const UnsplashProvider: React.FC<UnsplashProviderProps> = ({ children }) => {
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set())
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map())

  const getImageForProduct = async (productId: string): Promise<string | null> => {
    // Check cache first
    const cached = imageCache.get(productId)
    if (cached) {
      return cached
    }

    // Check if already loading
    if (loadingProducts.has(productId)) {
      return null
    }

    // Start loading
    setLoadingProducts(prev => new Set(prev).add(productId))

    try {
      const image = await UnsplashService.getRandomProductImage(productId)
      
      if (image) {
        const imageUrl = UnsplashService.getBestImageUrl(image, 'url')
        
        // Update cache
        setImageCache(prev => new Map(prev).set(productId, imageUrl))
        
        return imageUrl
      }
      
      return null
    } catch (error) {
      console.error('Error getting Unsplash image:', error)
      return null
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const isLoading = (productId: string): boolean => {
    return loadingProducts.has(productId)
  }

  const preloadImages = async (productIds: string[]): Promise<void> => {
    const promises = productIds.map(async (productId) => {
      if (!imageCache.has(productId) && !loadingProducts.has(productId)) {
        await getImageForProduct(productId)
      }
    })
    
    await Promise.allSettled(promises)
  }

  const value: UnsplashContextType = {
    getImageForProduct,
    isLoading,
    preloadImages
  }

  return (
    <UnsplashContext.Provider value={value}>
      {children}
    </UnsplashContext.Provider>
  )
}

export const useUnsplash = (): UnsplashContextType => {
  const context = useContext(UnsplashContext)
  if (context === undefined) {
    throw new Error('useUnsplash must be used within an UnsplashProvider')
  }
  return context
}
