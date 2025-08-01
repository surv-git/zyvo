/**
 * Utility functions for product handling
 */

import { UnsplashService } from '@/services/unsplash-service'

/**
 * Gets a consistent fallback product image based on product ID
 * Uses carousel images as fallbacks for products without images
 */
export const getFallbackProductImage = (productId: string): string => {
  // Use the product ID to generate a consistent image number (1-10)
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const imageNumber = String((hash % 10) + 1).padStart(2, '0')
  return `/images/carousel-image-${imageNumber}.jpg`
}

/**
 * Gets an Unsplash fallback image for a product
 * Returns a promise that resolves to an Unsplash image URL or null
 */
export const getUnsplashFallbackImage = async (productId: string): Promise<string | null> => {
  try {
    const image = await UnsplashService.getRandomProductImage(productId)
    if (image) {
      // Use the 'url' size (1080px) for good quality
      return UnsplashService.getBestImageUrl(image, 'url')
    }
    return null
  } catch (error) {
    console.error('Error getting Unsplash fallback image:', error)
    return null
  }
}

/**
 * Gets the best available image for a product
 * Returns the first product image if available, otherwise a fallback carousel image
 * Skips invalid/placeholder URLs to avoid 404/504 errors
 */
export const getProductImage = (productImages: string[] | undefined, productId: string, index: number = 0): string => {
  console.log('🔍 getProductImage called with:', { productImages, productId, index })
  
  // Check if product images exist and are valid
  if (productImages && productImages.length > 0) {
    const targetImage = productImages[index] || productImages[0]
    
    // Skip invalid/placeholder URLs that will cause 404/504 errors
    const isValidUrl = targetImage && 
      !targetImage.includes('example.com') && 
      !targetImage.includes('placeholder') &&
      !targetImage.includes('dummy') &&
      targetImage.startsWith('http') &&
      !targetImage.includes('localhost') // Skip local test URLs in production
    
    if (isValidUrl) {
      console.log('🖼️ Using product image:', targetImage)
      return targetImage
    } else {
      console.log('🚫 Skipping invalid product image:', targetImage, 'falling back to carousel image')
    }
  } else {
    console.log('🚫 No product images available, using carousel fallback')
  }
  
  // Return consistent fallback image based on product ID
  const fallbackImage = getFallbackProductImage(productId)
  console.log('🖼️ Using fallback image:', fallbackImage)
  return fallbackImage
}

/**
 * Gets all valid images for a product for thumbnail gallery use
 * Returns all product images plus fallback images as needed
 */
export const getProductThumbnails = (productImages: string[] | undefined, productId: string, minCount: number = 5): string[] => {
  console.log('🖼️ getProductThumbnails called with:', { productImages, productId, minCount })
  
  const validImages: string[] = []
  
  // Add valid product images first
  if (productImages && productImages.length > 0) {
    productImages.forEach((image, index) => {
      const isValidUrl = image && 
        !image.includes('example.com') && 
        !image.includes('placeholder') &&
        !image.includes('dummy') &&
        image.startsWith('http') &&
        !image.includes('localhost')
      
      if (isValidUrl) {
        console.log(`✅ Adding valid product image ${index + 1}:`, image)
        validImages.push(image)
      } else {
        console.log(`❌ Skipping invalid product image ${index + 1}:`, image)
      }
    })
  }
  
  // Add carousel fallback images if we need more
  if (validImages.length < minCount) {
    const fallbacksNeeded = minCount - validImages.length
    console.log(`📸 Adding ${fallbacksNeeded} fallback images to reach minimum count of ${minCount}`)
    
    for (let i = 0; i < fallbacksNeeded && i < CAROUSEL_FALLBACK_IMAGES.length; i++) {
      validImages.push(CAROUSEL_FALLBACK_IMAGES[i])
    }
  }
  
  console.log(`🎯 Final thumbnail gallery has ${validImages.length} images:`, validImages)
  return validImages
}

/**
 * Available carousel fallback images
 */
export const CAROUSEL_FALLBACK_IMAGES = [
  '/images/carousel-image-01.jpg',
  '/images/carousel-image-02.jpg',
  '/images/carousel-image-03.jpg',
  '/images/carousel-image-04.jpg',
  '/images/carousel-image-05.jpg',
] as const
