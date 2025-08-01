"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

interface ImageContextType {
  imageLoadingStates: Map<string, boolean>
  imageErrorStates: Map<string, boolean>
  setImageLoading: (src: string, loading: boolean) => void
  setImageError: (src: string, error: boolean) => void
}

const ImageContext = createContext<ImageContextType | undefined>(undefined)

export const useImageState = (src: string) => {
  const context = useContext(ImageContext)
  if (!context) {
    throw new Error('useImageState must be used within ImageProvider')
  }
  
  const { imageLoadingStates, imageErrorStates, setImageLoading, setImageError } = context
  
  return {
    loading: imageLoadingStates.get(src) || false,
    error: imageErrorStates.get(src) || false,
    setLoading: useCallback((loading: boolean) => setImageLoading(src, loading), [src, setImageLoading]),
    setError: useCallback((error: boolean) => setImageError(src, error), [src, setImageError])
  }
}

interface ImageProviderProps {
  children: ReactNode
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [imageLoadingStates] = useState(() => new Map<string, boolean>())
  const [imageErrorStates] = useState(() => new Map<string, boolean>())

  const setImageLoading = useCallback((src: string, loading: boolean) => {
    imageLoadingStates.set(src, loading)
  }, [imageLoadingStates])

  const setImageError = useCallback((src: string, error: boolean) => {
    imageErrorStates.set(src, error)
  }, [imageErrorStates])

  const value = useMemo<ImageContextType>(() => ({
    imageLoadingStates,
    imageErrorStates,
    setImageLoading,
    setImageError,
  }), [imageLoadingStates, imageErrorStates, setImageLoading, setImageError])

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  )
}
