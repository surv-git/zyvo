"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatIndianRupees } from '@/lib/currency-utils'
import { getProductThumbnails } from '@/lib/product-utils'
import { 
  X, 
  Heart, 
  Star, 
  ShoppingCart, 
  Eye,
  Plus,
  Minus,
  Check,
  Zap
} from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  images?: string[] // Add images array for Unsplash URLs
  category: string
  brand: string
  inStock: boolean
  onSale: boolean
  isNew: boolean
  variants?: Array<{
    id: string
    name: string
    price: number
    inStock: boolean
  }>
}

interface ProductQuickViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, variant: { id: string; name?: string }, quantity?: number) => void
  onToggleWishlist: (productId: string) => void
  onViewDetails: (product: Product) => void
  wishlistItems: string[]
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  wishlistItems
}) => {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '')

  // Get all thumbnail images (product images + fallbacks as needed)
  const thumbnailImages = product ? getProductThumbnails(product.images, product.id, 5) : []

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants?.[0]?.id || null)
      setQuantity(1)
      setSelectedImage(product.image)
    }
  }, [product])

  if (!product) return null

  const isInWishlist = wishlistItems.includes(product.id)
  const currentVariant = product.variants?.find(v => v.id === selectedVariant)
  const displayPrice = currentVariant?.price || product.price
  const isVariantInStock = currentVariant?.inStock ?? product.inStock
  
  // Check if we have a valid variant ID available
  const hasValidVariant = selectedVariant || (product.variants && product.variants.length > 0)

  const handleAddToCart = () => {
    // Always use a valid variant ID - never fallback to product ID
    const variantToUse = selectedVariant 
      ? { id: selectedVariant, name: currentVariant?.name }
      : product.variants?.[0] 
        ? { id: product.variants[0].id, name: product.variants[0].name }
        : null // Don't add to cart if no valid variant exists
    
    if (variantToUse) {
      onAddToCart(product, variantToUse, quantity)
    } else {
      console.error('No valid variant ID available for adding to cart')
    }
  }

  const handleViewDetails = () => {
    onViewDetails(product)
    onClose()
  }

  // Calculate discount percentage for sale banner
  const discount = product.originalPrice && product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  // Debug: Log variants to console
  if (product.variants) {
    console.log('🔍 Quick View Variants:', product.variants.map(v => ({
      id: v.id,
      name: v.name,
      price: v.price,
      inStock: v.inStock
    })))
    console.log('🎯 Selected Variant ID:', selectedVariant)
    
    // Show which options are currently selected
    const selectedVariantData = product.variants.find(v => v.id === selectedVariant)
    if (selectedVariantData) {
      // Parse the variant name to extract actual color and connection values
      const variantName = selectedVariantData.name.toLowerCase()
      const colorSelected = variantName.includes('silver') ? 'Silver' : 
                           variantName.includes('blue') ? 'Blue' : 
                           variantName.includes('red') ? 'Red' : 
                           variantName.includes('white') ? 'White' : 
                           variantName.includes('black') ? 'Black' : 'Unknown'
      const connectionSelected = variantName.includes('wifi') ? 'WiFi' : 
                                variantName.includes('wired') ? 'Wired' : 'Unknown'
      
      console.log('📋 Current Selection Details:', {
        variantId: selectedVariantData.id,
        variantName: selectedVariantData.name,
        price: selectedVariantData.price,
        colorSelected,
        connectionSelected
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-none sm:max-w-none max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View: {product.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Sale Banner - permanent location top left (same as catalog) */}
              {product.onSale && (
                <div className="absolute top-0 left-2 z-10">
                  <div className="relative bg-red-600 text-white px-2 py-3 text-center shadow-lg">
                    <div className="text-[9px] font-bold uppercase tracking-wide">SALE</div>
                    <div className="text-[8px] font-medium">UP TO</div>
                    <div className="text-[14px] font-black slashed-zero tabular-nums md:normal-nums">{discount}%</div>
                    {/* Banner tail/arrow - centered and positioned lower */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-700" style={{ top: 'calc(100% - 1px)' }}></div>
                  </div>
                </div>
              )}

              {/* New Badge - permanent location top right (same as catalog) */}
              {product.isNew && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1 py-0.5 rounded-full shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 z-10">
                  <div className="flex items-center space-x-0.5">
                    <Zap className="w-1.5 h-1.5" />
                    <span className="text-[9px] font-bold leading-none">NEW</span>
                  </div>
                </div>
              )}

              {/* Wishlist Button - permanent location bottom right (same as catalog) */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-sm z-10"
                onClick={() => onToggleWishlist(product.id)}
              >
                <Heart 
                  className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-600'}`} 
                />
              </Button>
            </div>
            
            {/* Thumbnails */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {thumbnailImages.map((imageUrl, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === imageUrl
                        ? 'border-primary-500'
                        : 'border-neutral-200 hover:border-neutral-300'
                    } bg-neutral-100`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${product.name} view ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <span>{product.brand}</span>
                <span>•</span>
                <span>{product.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-3">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-neutral-900">
                {formatIndianRupees(displayPrice)}
              </span>
              {product.originalPrice && product.originalPrice > displayPrice && (
                <span className="text-lg text-neutral-500 line-through">
                  {formatIndianRupees(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-neutral-600 leading-relaxed">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">
                  Options ({product.variants.length} available)
                </h3>
                
                {/* Group variants by option type */}
                {(() => {
                  // Create a map to group variants by their option types
                  interface VariantGroup {
                    variant: {
                      id: string
                      name: string
                      price: number
                      inStock: boolean
                    }
                    optionValue: string
                  }
                  
                  const variantGroups: { [key: string]: Array<VariantGroup> } = {}
                  
                  // Find the currently selected variant to determine which options are selected
                  const selectedVariantData = product.variants.find(v => v.id === selectedVariant)
                  
                  product.variants.forEach(variant => {
                    // Try to extract meaningful option values from variant name
                    // Examples: "LGOLEDC3-SIL-WIF" -> Color: "Silver", Connection: "WiFi"
                    const variantName = variant.name || variant.id || ''
                    
                    // Simple parsing logic - you can enhance this based on your data structure
                    if (variantName.includes('SIL') || variantName.includes('Silver')) {
                      const colorGroup = 'Color'
                      if (!variantGroups[colorGroup]) variantGroups[colorGroup] = []
                      variantGroups[colorGroup].push({ variant, optionValue: 'Silver' })
                    } else if (variantName.includes('BLU') || variantName.includes('Blue')) {
                      const colorGroup = 'Color'
                      if (!variantGroups[colorGroup]) variantGroups[colorGroup] = []
                      variantGroups[colorGroup].push({ variant, optionValue: 'Blue' })
                    } else if (variantName.includes('RED') || variantName.includes('Red')) {
                      const colorGroup = 'Color'
                      if (!variantGroups[colorGroup]) variantGroups[colorGroup] = []
                      variantGroups[colorGroup].push({ variant, optionValue: 'Red' })
                    } else if (variantName.includes('WHI') || variantName.includes('White')) {
                      const colorGroup = 'Color'
                      if (!variantGroups[colorGroup]) variantGroups[colorGroup] = []
                      variantGroups[colorGroup].push({ variant, optionValue: 'White' })
                    } else if (variantName.includes('BLA') || variantName.includes('Black')) {
                      const colorGroup = 'Color'
                      if (!variantGroups[colorGroup]) variantGroups[colorGroup] = []
                      variantGroups[colorGroup].push({ variant, optionValue: 'Black' })
                    }
                    
                    // Check for connection types
                    if (variantName.includes('WIF') || variantName.includes('WiFi')) {
                      const connectionGroup = 'Connection'
                      if (!variantGroups[connectionGroup]) variantGroups[connectionGroup] = []
                      variantGroups[connectionGroup].push({ variant, optionValue: 'WiFi' })
                    } else if (variantName.includes('WIR') || variantName.includes('Wired')) {
                      const connectionGroup = 'Connection'
                      if (!variantGroups[connectionGroup]) variantGroups[connectionGroup] = []
                      variantGroups[connectionGroup].push({ variant, optionValue: 'Wired' })
                    }
                    
                    // If no specific grouping found, use generic variant group
                    const hasBeenGrouped = Object.values(variantGroups).some(group => 
                      group.some(item => item.variant.id === variant.id)
                    )
                    
                    if (!hasBeenGrouped) {
                      const optionType = "Options"
                      if (!variantGroups[optionType]) variantGroups[optionType] = []
                      // Extract a clean display name
                      const displayName = variantName.split('-').pop() || variantName
                      variantGroups[optionType].push({ variant, optionValue: displayName })
                    }
                  })
                  
                  // Helper function to determine if an option should be selected
                  const isOptionSelected = (optionType: string, optionValue: string) => {
                    if (!selectedVariantData) return false
                    
                    // Check if the selected variant matches this option
                    const selectedVariantName = selectedVariantData.name
                    
                    let isSelected = false
                    
                    if (optionType === 'Color') {
                      isSelected = selectedVariantName.includes(optionValue) || 
                             (optionValue === 'Silver' && selectedVariantName.includes('SIL')) ||
                             (optionValue === 'Blue' && selectedVariantName.includes('BLU')) ||
                             (optionValue === 'Red' && selectedVariantName.includes('RED')) ||
                             (optionValue === 'White' && selectedVariantName.includes('WHI')) ||
                             (optionValue === 'Black' && selectedVariantName.includes('BLA'))
                    } else if (optionType === 'Connection') {
                      isSelected = selectedVariantName.includes(optionValue) ||
                             (optionValue === 'WiFi' && selectedVariantName.includes('WIF')) ||
                             (optionValue === 'Wired' && selectedVariantName.includes('WIR'))
                    } else {
                      isSelected = selectedVariantName.includes(optionValue)
                    }
                    
                    // Debug logging
                    if (isSelected) {
                      console.log(`✅ ${optionType} "${optionValue}" is selected (variant: ${selectedVariantName})`)
                    }
                    
                    return isSelected
                  }
                  
                  // Helper function to find variant that matches selected options from other groups
                  const findMatchingVariant = (currentGroup: string, selectedOption: string) => {
                    // Get current selections from other groups (preserve existing selections)
                    const currentSelections: { [key: string]: string } = {}
                    
                    Object.entries(variantGroups).forEach(([groupType, variants]) => {
                      if (groupType !== currentGroup) {
                        // Find the selected option in this group
                        const selectedInGroup = variants.find(item => 
                          isOptionSelected(groupType, item.optionValue)
                        )
                        if (selectedInGroup) {
                          currentSelections[groupType] = selectedInGroup.optionValue
                        }
                      }
                    })
                    
                    // Add the newly selected option
                    currentSelections[currentGroup] = selectedOption
                    
                    console.log('🔍 Finding variant for selections:', currentSelections)
                    
                    // Find a variant that matches all selected options
                    const matchingVariant = product.variants?.find(variant => {
                      const variantName = variant.name
                      
                      // Check if this variant matches ALL current selections
                      const matches = Object.entries(currentSelections).every(([groupType, optionValue]) => {
                        if (groupType === 'Color') {
                          return variantName.includes(optionValue) || 
                                 (optionValue === 'Silver' && variantName.includes('SIL')) ||
                                 (optionValue === 'Blue' && variantName.includes('BLU')) ||
                                 (optionValue === 'Red' && variantName.includes('RED')) ||
                                 (optionValue === 'White' && variantName.includes('WHI')) ||
                                 (optionValue === 'Black' && variantName.includes('BLA'))
                        }
                        if (groupType === 'Connection') {
                          return variantName.includes(optionValue) ||
                                 (optionValue === 'WiFi' && variantName.includes('WIF')) ||
                                 (optionValue === 'Wired' && variantName.includes('WIR'))
                        }
                        return variantName.includes(optionValue)
                      })
                      
                      return matches
                    })
                    
                    console.log('🎯 Found matching variant:', matchingVariant?.name || 'none')
                    return matchingVariant
                  }
                  
                  return Object.entries(variantGroups).map(([optionType, variants]) => {
                    // Remove duplicates within each group (same option value)
                    const uniqueVariants = variants.reduce((acc, current) => {
                      const existing = acc.find(item => item.optionValue === current.optionValue)
                      if (!existing) {
                        acc.push(current)
                      }
                      return acc
                    }, [] as Array<VariantGroup>)
                    
                    return (
                      <div key={optionType} className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">
                          {optionType} ({uniqueVariants.length} options)
                        </h4>
                        <ScrollArea className="w-full">
                          <div className="flex gap-2 pb-2">
                            {uniqueVariants.map(({ variant, optionValue }) => {
                              const isSelected = isOptionSelected(optionType, optionValue)
                              
                              return (
                                <button
                                  key={`${optionType}-${optionValue}`}
                                  onClick={() => {
                                    console.log(`🎯 Clicked ${optionType}: ${optionValue}`)
                                    
                                    // Find the variant that matches this option selection
                                    const matchingVariant = findMatchingVariant(optionType, optionValue)
                                    
                                    if (matchingVariant) {
                                      setSelectedVariant(matchingVariant.id)
                                      console.log(`✅ Perfect match found: ${matchingVariant.name}`)
                                    } else {
                                      // Smart fallback: try to preserve as many existing selections as possible
                                      console.log('🔍 No perfect match, trying smart fallback...')
                                      
                                      // Get all variants that have the clicked option
                                      const variantsWithClickedOption = product.variants?.filter(v => {
                                        const variantName = v.name
                                        if (optionType === 'Color') {
                                          return variantName.includes(optionValue) || 
                                                 (optionValue === 'Silver' && variantName.includes('SIL')) ||
                                                 (optionValue === 'Blue' && variantName.includes('BLU')) ||
                                                 (optionValue === 'Red' && variantName.includes('RED')) ||
                                                 (optionValue === 'White' && variantName.includes('WHI')) ||
                                                 (optionValue === 'Black' && variantName.includes('BLA'))
                                        }
                                        if (optionType === 'Connection') {
                                          return variantName.includes(optionValue) ||
                                                 (optionValue === 'WiFi' && variantName.includes('WIF')) ||
                                                 (optionValue === 'Wired' && variantName.includes('WIR'))
                                        }
                                        return variantName.includes(optionValue)
                                      }) || []
                                      
                                      console.log(`🎯 Found ${variantsWithClickedOption.length} variants with ${optionType}: ${optionValue}`)
                                      
                                      if (variantsWithClickedOption.length > 0) {
                                        // Smart selection: prefer variants that preserve other attributes
                                        const currentSelectedVariant = product.variants?.find(v => v.id === selectedVariant)
                                        let bestVariant = variantsWithClickedOption[0] // Default fallback
                                        
                                        if (currentSelectedVariant && variantsWithClickedOption.length > 1) {
                                          // Try to find a variant that shares other attributes with the current selection
                                          const currentName = currentSelectedVariant.name.toLowerCase()
                                          
                                          for (const candidate of variantsWithClickedOption) {
                                            const candidateName = candidate.name.toLowerCase()
                                            // Count how many attributes this candidate shares with current selection
                                            let sharedAttributes = 0
                                            
                                            // Check for shared color (if we're not changing color)
                                            if (optionType !== 'Color') {
                                              if ((currentName.includes('silver') && candidateName.includes('silver')) ||
                                                  (currentName.includes('blue') && candidateName.includes('blue')) ||
                                                  (currentName.includes('red') && candidateName.includes('red')) ||
                                                  (currentName.includes('white') && candidateName.includes('white')) ||
                                                  (currentName.includes('black') && candidateName.includes('black'))) {
                                                sharedAttributes++
                                              }
                                            }
                                            
                                            // Check for shared connection (if we're not changing connection)
                                            if (optionType !== 'Connection') {
                                              if ((currentName.includes('wifi') && candidateName.includes('wifi')) ||
                                                  (currentName.includes('wired') && candidateName.includes('wired'))) {
                                                sharedAttributes++
                                              }
                                            }
                                            
                                            // If this candidate preserves more attributes, use it
                                            if (sharedAttributes > 0) {
                                              bestVariant = candidate
                                              console.log(`🎯 Found better fallback preserving ${sharedAttributes} attributes: ${candidate.name}`)
                                              break
                                            }
                                          }
                                        }
                                        
                                        setSelectedVariant(bestVariant.id)
                                        console.log(`🔄 Smart fallback variant used: ${bestVariant.name}`)
                                      } else {
                                        // Last resort: use the clicked variant
                                        setSelectedVariant(variant.id)
                                        console.log(`⚠️ No match found, using clicked variant: ${variant.name}`)
                                      }
                                    }
                                  }}
                                  disabled={!variant.inStock}
                                  className={`flex-shrink-0 min-w-[80px] px-3 py-2 rounded-lg border text-center text-sm transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 text-primary font-medium'
                                      : variant.inStock
                                      ? 'border-neutral-200 hover:border-primary/30 text-neutral-700 hover:bg-neutral-50'
                                      : 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                                  }`}
                                >
                                  <div className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                                    {optionValue}
                                  </div>
                                  <div className={`text-xs mt-1 ${isSelected ? 'text-primary/70' : 'text-neutral-500'}`}>
                                    {formatIndianRupees(variant.price)}
                                  </div>
                                  {!variant.inStock && (
                                    <div className="text-xs text-red-500 mt-1">Out of Stock</div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isVariantInStock ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">In Stock</span>
                </>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={!isVariantInStock || !hasValidVariant}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={handleViewDetails}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductQuickViewModal
