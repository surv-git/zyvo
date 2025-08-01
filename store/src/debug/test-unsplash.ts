// Test script to debug Unsplash service
import { UnsplashService } from '../services/unsplash-service'

async function testUnsplashService() {
  console.log('🔍 Testing Unsplash Service...')
  
  // Test with a sample product ID
  const testProductId = '507f1f77bcf86cd799439011'
  
  try {
    console.log(`Testing with product ID: ${testProductId}`)
    
    const suggestions = await UnsplashService.getProductImageSuggestions(testProductId)
    console.log('✅ Raw suggestions response:', suggestions)
    
    if (suggestions.length > 0) {
      console.log(`✅ Found ${suggestions.length} suggestions`)
      
      const randomImage = await UnsplashService.getRandomProductImage(testProductId)
      console.log('✅ Random image:', randomImage)
      
      if (randomImage) {
        const bestUrl = UnsplashService.getBestImageUrl(randomImage, 'url')
        console.log('✅ Best URL:', bestUrl)
      }
    } else {
      console.log('❌ No suggestions found')
    }
  } catch (error) {
    console.error('❌ Error testing Unsplash service:', error)
  }
}

// Test the fallback function
import { getUnsplashFallbackImage } from '../lib/product-utils'

async function testFallbackFunction() {
  console.log('🔍 Testing fallback function...')
  
  const testProductId = '507f1f77bcf86cd799439011'
  
  try {
    const fallbackImage = await getUnsplashFallbackImage(testProductId)
    console.log('✅ Fallback image result:', fallbackImage)
  } catch (error) {
    console.error('❌ Error testing fallback function:', error)
  }
}

// Run tests
testUnsplashService()
testFallbackFunction()
