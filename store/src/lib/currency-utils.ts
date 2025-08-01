/**
 * Currency formatting utilities
 */

/**
 * Formats price in Indian Rupees
 */
export const formatIndianRupees = (amount: number): string => {
  // Handle NaN, null, undefined, or invalid numbers
  if (isNaN(amount) || amount == null || !isFinite(amount)) {
    return '₹0'
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats price range for display
 */
export const formatPriceRange = (min: number, max: number): string => {
  return `${formatIndianRupees(min)} - ${formatIndianRupees(max)}`
}

/**
 * Formats discount percentage
 */
export const formatDiscount = (originalPrice: number, discountedPrice: number): string => {
  const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
  return `${discount}% OFF`
}
