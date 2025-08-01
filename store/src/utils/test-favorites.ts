/**
 * Test utility for simulating favorites in localStorage
 * Use this in the browser console to test the persistence functionality
 */

export const testFavorites = {
  // Add some test favorites to localStorage
  addTestFavorites: () => {
    const testFavoriteIds = [
      '687b33690a7b4450b3133b7b', // LG OLED TV
      '687b33690a7b4450b3133a3e', // Zara Blazer
      '687b33680a7b4450b3133559', // iPad Pro
      '687b33680a7b4450b3133618', // Sony Headphones
    ]
    
    localStorage.setItem('favorites', JSON.stringify(testFavoriteIds))
    console.log('✅ Test favorites added to localStorage:', testFavoriteIds)
    
    // Trigger a page refresh to test persistence
    console.log('🔄 Refresh the page to test persistence!')
  },

  // Clear favorites from localStorage
  clearFavorites: () => {
    localStorage.removeItem('favorites')
    console.log('🗑️ Favorites cleared from localStorage')
  },

  // Show current favorites in localStorage
  showFavorites: () => {
    const stored = localStorage.getItem('favorites')
    if (stored) {
      const favorites = JSON.parse(stored)
      console.log('📱 Current favorites in localStorage:', favorites)
      return favorites
    } else {
      console.log('📱 No favorites found in localStorage')
      return []
    }
  },

  // Add a valid auth token for testing (replace with actual token)
  addAuthToken: (token: string) => {
    localStorage.setItem('accessToken', token)
    console.log('🔑 Auth token added to localStorage')
    console.log('🔄 Refresh the page to test API functionality!')
  },

  // Remove auth token
  clearAuthToken: () => {
    localStorage.removeItem('accessToken')
    console.log('🗑️ Auth token removed from localStorage')
  }
}

// Expose to window for browser console usage
if (typeof window !== 'undefined') {
  (window as any).testFavorites = testFavorites
}
