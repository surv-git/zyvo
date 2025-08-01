/**
 * Utility functions for generating and handling URL slugs
 */

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

/**
 * Generate a unique product slug that includes the full product ID for uniqueness
 */
export function generateProductSlug(productName: string, productId: string): string {
  const nameSlug = generateSlug(productName)
  // Use the full product ID instead of just last 8 characters
  return `${nameSlug}-${productId}`
}

/**
 * Extract product ID from a product slug
 */
export function extractProductIdFromSlug(slug: string): string | null {
  // Find the last part that looks like a MongoDB ObjectId (24 hex characters)
  // or any ID that's at least 8 characters long
  const parts = slug.split('-')
  
  // Look for the product ID - it should be the last part and look like an ID
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    // Check if this looks like a MongoDB ObjectId (24 hex chars) or other valid ID
    if (part.length >= 8 && /^[a-f0-9]+$/i.test(part)) {
      return part
    }
  }
  
  return null
}

/**
 * Create a product URL with slug
 */
export function createProductUrl(productName: string, productId: string): string {
  const slug = generateProductSlug(productName, productId)
  return `/product/${slug}`
}

/**
 * Check if current URL matches a product details page
 */
export function isProductDetailsUrl(pathname: string): boolean {
  return pathname.startsWith('/product/')
}

/**
 * Extract slug from product details URL
 */
export function extractSlugFromUrl(pathname: string): string | null {
  const match = pathname.match(/^\/product\/(.+)$/)
  return match ? match[1] : null
}
