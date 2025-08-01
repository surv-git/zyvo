"use client"

import React, { memo, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { getFallbackProductImage } from '@/lib/product-utils'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
  productId?: string
}

// Stable fallback generator with caching
const fallbackCache = new Map<string, string>()

const getFallbackImage = (src: string, alt: string, productId?: string): string => {
  const cacheKey = `${src}-${productId || alt}`
  
  if (fallbackCache.has(cacheKey)) {
    return fallbackCache.get(cacheKey)!
  }
  
  const fallback = getFallbackProductImage(productId || alt)
  fallbackCache.set(cacheKey, fallback)
  return fallback
}

// Memoized with very specific comparison
const OptimizedProductImage = memo<ProductImageProps>(({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  productId
}) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // Stable error handler
  const handleImageError = useCallback(() => {
    if (!hasError) {
      const fallbackSrc = getFallbackImage(src, alt, productId)
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }, [src, alt, productId, hasError])

  // Memoized image props to prevent object recreation
  const imageProps = useMemo(() => {
    const props: any = {
      src: imageSrc,
      alt,
      className,
      onError: handleImageError,
      priority
    }

    if (fill) {
      props.fill = true
      if (sizes) props.sizes = sizes
    } else {
      props.width = width || 400
      props.height = height || 400
    }

    return props
  }, [imageSrc, alt, className, handleImageError, priority, fill, sizes, width, height])

  return <Image {...imageProps} />
}, (prevProps, nextProps) => {
  // Ultra-specific comparison - only re-render if these exact props change
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.className === nextProps.className &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.fill === nextProps.fill &&
    prevProps.priority === nextProps.priority &&
    prevProps.sizes === nextProps.sizes &&
    prevProps.productId === nextProps.productId
  )
})

OptimizedProductImage.displayName = 'OptimizedProductImage'

export default OptimizedProductImage
