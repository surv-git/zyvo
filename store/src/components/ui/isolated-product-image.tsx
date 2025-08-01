"use client"

import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getFallbackProductImage } from '@/lib/product-utils'

interface IsolatedProductImageProps {
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

// Pure component with no external dependencies except the image itself
const IsolatedProductImage = memo<IsolatedProductImageProps>(function IsolatedProductImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  productId
}) {
  // Internal state only - no context dependencies
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const errorHandledRef = useRef(false)

  // Reset error state when src changes
  useEffect(() => {
    if (src !== imageSrc && !hasError) {
      setImageSrc(src)
      errorHandledRef.current = false
    }
  }, [src, imageSrc, hasError])

  // Stable error handler with guard against multiple calls
  const handleImageError = useCallback(() => {
    if (!errorHandledRef.current && !hasError) {
      errorHandledRef.current = true
      setHasError(true)
      const fallbackSrc = getFallbackProductImage(productId || alt)
      setImageSrc(fallbackSrc)
    }
  }, [productId, alt, hasError])

  // Build props object only once unless dependencies change
  const imageProps = {
    src: imageSrc,
    alt,
    className,
    onError: handleImageError,
    priority,
    ...(fill 
      ? { fill: true, ...(sizes && { sizes }) }
      : { width: width || 400, height: height || 400 }
    )
  }

  return <Image {...imageProps} />
}, (prevProps, nextProps) => {
  // Only compare the props that actually matter for rendering
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

export default IsolatedProductImage
