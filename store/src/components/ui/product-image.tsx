"use client"

import React, { useState, memo, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { getFallbackProductImage, getUnsplashFallbackImage } from '@/lib/product-utils'

interface ProductImageProps {
  src: string
  alt: string
  productId: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
}

const ProductImage: React.FC<ProductImageProps> = memo(({
  src,
  alt,
  productId,
  width,
  height,
  fill,
  className,
  priority,
  sizes
}) => {
  const [imageError, setImageError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [fallbackAttempted, setFallbackAttempted] = useState(false)

  const handleImageError = useCallback(async () => {
    console.log('🚨 Image error triggered for product:', productId, 'Current src:', currentSrc)
    
    if (!imageError && !fallbackAttempted) {
      setImageError(true)
      setFallbackAttempted(true)
      
      console.log('🔄 Attempting Unsplash fallback for product:', productId)
      
      try {
        // Try to get an Unsplash image as fallback
        const unsplashSrc = await getUnsplashFallbackImage(productId)
        
        if (unsplashSrc) {
          console.log('✅ Using Unsplash fallback image for product:', productId, 'URL:', unsplashSrc)
          setCurrentSrc(unsplashSrc)
          return
        } else {
          console.log('❌ No Unsplash image found for product:', productId)
        }
      } catch (error) {
        console.error('❌ Error loading Unsplash fallback:', error)
      }
      
      // Fall back to carousel images if Unsplash fails
      const fallbackSrc = getFallbackProductImage(productId)
      console.log('🖼️ Using carousel fallback image for product:', productId, 'URL:', fallbackSrc)
      setCurrentSrc(fallbackSrc)
    } else {
      console.log('⏭️ Skipping fallback - already attempted for product:', productId)
    }
  }, [imageError, fallbackAttempted, productId, currentSrc])

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc && !imageError) {
      setCurrentSrc(src)
      setImageError(false)
      setFallbackAttempted(false)
    }
  }, [src, currentSrc, imageError])

  const imageProps = {
    src: currentSrc,
    alt: alt || 'Product image',
    onError: handleImageError,
    className,
    priority,
    sizes
  }

  if (fill) {
    return <Image {...imageProps} fill alt={alt || 'Product image'} />
  }

  return (
    <Image
      {...imageProps}
      width={width || 500}
      height={height || 500}
      alt={alt || 'Product image'}
    />
  )
})

ProductImage.displayName = 'ProductImage'

export default ProductImage
