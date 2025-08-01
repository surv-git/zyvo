"use client"

import React, { memo, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import ProductImage from '@/components/ui/product-image'
import FavoriteButton from '@/components/ui/favorite-button'
import ProductQuickViewModal from '@/components/product-quick-view-modal'
import { useCart } from '@/contexts/cart-context'
import { Star, ShoppingCart, Eye, Crown, Sparkles, Calendar, TrendingUp, Target, Award, Flame } from 'lucide-react'
import { toast } from 'sonner'

export interface ProductCardProps {
  product: Product
  variant?: 'featured' | 'bestseller' | 'latest' | 'recommended' | 'deal' | 'default'
  showRank?: boolean
  rank?: number
  onQuickView?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onProductClick?: (product: Product) => void
  className?: string
}

interface VariantConfig {
  theme: {
    primary: string
    secondary: string
    gradient: string
    overlay: string
    badge: string
  }
  badge: {
    icon: React.ComponentType<{ className?: string }>
    text: string
    position: 'top-left' | 'top-right'
  }
  iconBadge?: {
    icon: React.ComponentType<{ className?: string }>
    gradient: string
  }
  specialLabel?: {
    text: string
    gradient: string
    icon?: React.ComponentType<{ className?: string }>
  }
  ctaText: string
}

// Modal product type to match ProductQuickViewModal expectations
interface ModalProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
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

const variantConfigs: Record<string, VariantConfig> = {
  featured: {
    theme: {
      primary: 'primary-500',
      secondary: 'secondary-500',
      gradient: 'from-primary-50 to-secondary-50',
      overlay: 'rgba(99, 102, 241, 0.15)',
      badge: 'from-primary-500 to-primary-600'
    },
    badge: {
      icon: Sparkles,
      text: 'FEATURED',
      position: 'top-left'
    },
    iconBadge: {
      icon: Sparkles,
      gradient: 'from-yellow-400 to-orange-500'
    },
    specialLabel: {
      text: 'Editor\'s Pick',
      gradient: 'from-primary-500 to-secondary-500'
    },
    ctaText: 'View Details'
  },
  bestseller: {
    theme: {
      primary: 'accent-500',
      secondary: 'accent-600',
      gradient: 'from-accent-50 to-primary-50',
      overlay: 'rgba(16, 185, 129, 0.15)',
      badge: 'from-accent-500 to-accent-600'
    },
    badge: {
      icon: Crown,
      text: 'BESTSELLER',
      position: 'top-left'
    },
    iconBadge: {
      icon: Crown,
      gradient: 'from-yellow-400 to-yellow-500'
    },
    specialLabel: {
      text: 'Trending',
      gradient: 'from-yellow-400 to-orange-500',
      icon: TrendingUp
    },
    ctaText: 'Buy Now'
  },
  latest: {
    theme: {
      primary: 'secondary-500',
      secondary: 'secondary-600',
      gradient: 'from-secondary-50 to-accent-50',
      overlay: 'rgba(168, 85, 247, 0.15)',
      badge: 'from-secondary-500 to-secondary-600'
    },
    badge: {
      icon: Calendar,
      text: 'NEW',
      position: 'top-left'
    },
    iconBadge: {
      icon: Sparkles,
      gradient: 'from-green-400 to-blue-500'
    },
    specialLabel: {
      text: 'Just Added',
      gradient: 'from-green-400 to-blue-500'
    },
    ctaText: 'Explore'
  },
  recommended: {
    theme: {
      primary: 'blue-500',
      secondary: 'purple-500',
      gradient: 'from-blue-50 to-purple-50',
      overlay: 'rgba(59, 130, 246, 0.15)',
      badge: 'from-blue-500 to-purple-500'
    },
    badge: {
      icon: Target,
      text: 'RECOMMENDED',
      position: 'top-left'
    },
    iconBadge: {
      icon: Award,
      gradient: 'from-pink-400 to-purple-500'
    },
    specialLabel: {
      text: 'For You',
      gradient: 'from-pink-400 to-purple-500'
    },
    ctaText: 'Check Out'
  },
  deal: {
    theme: {
      primary: 'red-500',
      secondary: 'orange-500',
      gradient: 'from-red-50 to-orange-50',
      overlay: 'rgba(239, 68, 68, 0.15)',
      badge: 'from-red-500 to-orange-500'
    },
    badge: {
      icon: Flame,
      text: 'HOT DEAL',
      position: 'top-left'
    },
    iconBadge: {
      icon: Flame,
      gradient: 'from-red-400 to-orange-500'
    },
    specialLabel: {
      text: 'Limited Time',
      gradient: 'from-red-400 to-orange-500'
    },
    ctaText: 'Grab Now'
  },
  default: {
    theme: {
      primary: 'neutral-500',
      secondary: 'neutral-600',
      gradient: 'from-neutral-50 to-gray-50',
      overlay: 'rgba(107, 114, 128, 0.15)',
      badge: 'from-neutral-500 to-neutral-600'
    },
    badge: {
      icon: Eye,
      text: 'PRODUCT',
      position: 'top-left'
    },
    ctaText: 'View Product'
  }
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  variant = 'default',
  showRank = false,
  rank,
  onQuickView,
  onAddToCart,
  onProductClick,
  className = ''
}) => {
  const config = variantConfigs[variant] || variantConfigs.default
  const BadgeIcon = config.badge.icon
  const IconBadgeIcon = config.iconBadge?.icon
  const SpecialLabelIcon = config.specialLabel?.icon
  
  // State for quick view modal
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  
  // Cart context
  const { addToCart } = useCart()

  // Convert Product to the modal's expected format
  const convertToModalProduct = (product: Product) => {
    // Use variants from the product if available
    const variants = product.variants?.map(variant => ({
      id: variant._id,
      name: variant.sku_code || `Variant ${variant._id}`, // Use SKU code as name
      price: variant.price,
      inStock: variant.is_active
    })) || []

    return {
      id: product._id,
      name: product.name,
      description: product.description || product.short_description || '',
      price: variants.length > 0 ? variants[0].price : product.min_price || 999,
      originalPrice: undefined,
      rating: product.average_rating,
      reviewCount: product.reviews_count,
      image: ProductService.getProductImageUrl(product),
      images: product.images || [], // Include the full images array
      category: product.category_id?.name || '',
      brand: product.brand_id?.name || '',
      inStock: variants.length > 0 ? variants.some(v => v.inStock) : true,
      onSale: false,
      isNew: false,
      variants
    }
  }

  const handleModalAddToCart = async (modalProduct: ModalProduct, variant: { id: string; name?: string }, quantity: number = 1) => {
    try {
      await addToCart({
        product_variant_id: variant.id,
        quantity
      })
      
      toast.success(`${modalProduct.name} added to cart!`, {
        description: `${quantity} item(s) added successfully.`,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart', {
        description: 'Please try again later.',
      })
    }
  }

  const handleModalClose = () => {
    setIsQuickViewOpen(false)
  }

  const handleModalViewDetails = (modalProduct: ModalProduct) => {
    setIsQuickViewOpen(false)
    // Navigate to product details page
    window.location.href = `/product/${modalProduct.name.toLowerCase().replace(/\s+/g, '-')}-${modalProduct.id}`
  }

  const renderStars = (rating: number) => {
    const { fullStars, hasHalfStar, emptyStars } = ProductService.getStarRating(rating)
    
    const starColorClass = variant === 'featured' ? 'text-primary-400 fill-primary-400' :
                          variant === 'bestseller' ? 'text-accent-400 fill-accent-400' :
                          variant === 'latest' ? 'text-secondary-400 fill-secondary-400' :
                          variant === 'recommended' ? 'text-blue-400 fill-blue-400' :
                          variant === 'deal' ? 'text-red-400 fill-red-400' :
                          'text-neutral-400 fill-neutral-400'
    
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`w-4 h-4 ${starColorClass}`} />
        ))}
        {hasHalfStar && (
          <Star className={`w-4 h-4 ${starColorClass.replace('fill-', 'fill-').replace('-400', '-400/50')}`} />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-neutral-300" />
        ))}
      </div>
    )
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsQuickViewOpen(true)
    onQuickView?.(product)
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await addToCart({
        product_variant_id: product._id, // Using product ID as variant ID for now
        quantity: 1
      })
      
      toast.success(`${product.name} added to cart!`, {
        description: 'Product has been added to your cart successfully.',
      })
      
      onAddToCart?.(product)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart', {
        description: 'Please try again later.',
      })
    }
  }

  const handleProductClick = () => {
    onProductClick?.(product)
  }

  const productUrl = `/product/${product.slug}-${product._id}`

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative ${className}`}
      style={{
        transform: 'translateY(0px) rotate(0deg)',
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: '1rem' // 16px for better consistency
      }}
        onMouseEnter={(e) => {
        const rotation = variant === 'featured' ? '-1deg' : variant === 'bestseller' ? '1deg' : '0deg'
        e.currentTarget.style.transform = `translateY(-12px) rotate(${rotation})`
        e.currentTarget.style.boxShadow = variant === 'featured' ? '0 25px 50px -12px rgba(99, 102, 241, 0.25)' : 
                                          variant === 'bestseller' ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)' :
                                          variant === 'latest' ? '0 25px 50px -12px rgba(168, 85, 247, 0.25)' :
                                          variant === 'recommended' ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' :
                                          variant === 'deal' ? '0 25px 50px -12px rgba(239, 68, 68, 0.25)' : 
                                          '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        
        const iconBadge = e.currentTarget.querySelector('.icon-badge') as HTMLElement
        const mainBadge = e.currentTarget.querySelector('.main-badge') as HTMLElement
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement
        const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement
        
        if (iconBadge) iconBadge.style.transform = 'scale(1.05)'
        if (mainBadge) mainBadge.style.transform = 'scale(1.02)'
        if (overlay) overlay.style.opacity = '1'
        if (wishlistBtn) wishlistBtn.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px) rotate(0deg)'
        e.currentTarget.style.boxShadow = ''
        
        const iconBadge = e.currentTarget.querySelector('.icon-badge') as HTMLElement
        const mainBadge = e.currentTarget.querySelector('.main-badge') as HTMLElement
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement
        const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement
        
        if (iconBadge) iconBadge.style.transform = 'scale(1)'
        if (mainBadge) mainBadge.style.transform = 'scale(1)'
        if (overlay) overlay.style.opacity = '0'
        if (wishlistBtn) wishlistBtn.style.opacity = '0'
      }}
    >
      {/* Rank Badge (for bestsellers) */}
      {showRank && rank && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`main-badge bg-white/30 backdrop-blur-md text-neutral-800 px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm border border-white/30 transition-all duration-300`}>
            #{rank}
          </div>
        </div>
      )}

      {/* Main Badge */}
      {!showRank && (
        <div className={`absolute top-3 ${config.badge.position === 'top-left' ? 'left-3' : 'right-3'} z-10`}>
          <div className={`main-badge bg-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm border border-white/30 transition-all duration-300 flex items-center space-x-1 ${
            variant === 'featured' ? 'text-blue-800' :
            variant === 'bestseller' ? 'text-emerald-800' :
            variant === 'latest' ? 'text-purple-800' :
            variant === 'recommended' ? 'text-indigo-800' :
            variant === 'deal' ? 'text-red-800' :
            'text-neutral-800'
          }`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{config.badge.text}</span>
          </div>
        </div>
      )}

      {/* Icon Badge */}
      {config.iconBadge && IconBadgeIcon && (
        <div className={`absolute top-3 ${showRank ? 'right-3' : config.badge.position === 'top-left' ? 'right-3' : 'left-3'} z-10`}>
          <div className={`icon-badge w-10 h-10 bg-white/30 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm border border-white/30 transition-all duration-300 ${
            variant === 'featured' ? 'text-blue-700' :
            variant === 'bestseller' ? 'text-emerald-700' :
            variant === 'latest' ? 'text-purple-700' :
            variant === 'recommended' ? 'text-indigo-700' :
            variant === 'deal' ? 'text-red-700' :
            'text-neutral-700'
          }`}>
            <IconBadgeIcon className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${config.theme.gradient} cursor-pointer`} style={{ height: '280px', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }} onClick={handleProductClick}>
        
        {/* Favorite Button */}
        <div className="wishlist-btn absolute bottom-3 right-3 z-10 opacity-0 transition-all duration-300">
          <FavoriteButton
            productVariantId={product._id}
            productId={product._id}
            className="w-9 h-9 bg-white/30 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm border border-white/30 hover:bg-white/50 transform hover:scale-110"
            size="sm"
          />
        </div>
        <ProductImage
          src={ProductService.getProductImageUrl(product)}
          alt={product.name}
          productId={product._id}
          fill
          className="transition-all duration-700 group-hover:scale-110 object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlay Actions */}
        <div 
          className="product-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-center justify-center space-x-3"
          style={{ backgroundColor: config.theme.overlay }}
        >
          <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg" onClick={handleQuickView}>
            <Eye className="w-4 h-4 mr-2" />
            Quick View
          </Button>
          <Button 
            size="sm" 
            className={`shadow-lg ${
              variant === 'featured' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
              variant === 'bestseller' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
              variant === 'latest' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
              variant === 'recommended' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
              variant === 'deal' ? 'bg-red-600 hover:bg-red-700 text-white' :
              'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div 
        className={`p-6 bg-gradient-to-br ${
          variant === 'featured' ? 'from-white to-primary-50/20' :
          variant === 'bestseller' ? 'from-white to-accent-50/20' :
          variant === 'latest' ? 'from-white to-secondary-50/20' :
          variant === 'recommended' ? 'from-white to-blue-50/20' :
          variant === 'deal' ? 'from-white to-red-50/20' :
          'from-white to-neutral-50/20'
        }`}
        style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}
      >
        {/* Brand & Special Label */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium uppercase tracking-wider ${
            variant === 'featured' ? 'text-primary-600' :
            variant === 'bestseller' ? 'text-accent-600' :
            variant === 'latest' ? 'text-secondary-600' :
            variant === 'recommended' ? 'text-blue-600' :
            variant === 'deal' ? 'text-red-600' :
            'text-neutral-600'
          }`}>
            {product.brand_id.name}
          </span>
          {config.specialLabel && (
            <span className={`text-xs text-white bg-gradient-to-r ${config.specialLabel.gradient} px-2 py-1 rounded-full font-semibold flex items-center space-x-1`}>
              {SpecialLabelIcon && <SpecialLabelIcon className="w-3 h-3" />}
              <span>{config.specialLabel.text}</span>
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 
          className={`text-lg font-bold text-neutral-900 mb-2 transition-colors cursor-pointer group-hover:${
            variant === 'featured' ? 'text-primary-600' :
            variant === 'bestseller' ? 'text-accent-600' :
            variant === 'latest' ? 'text-secondary-600' :
            variant === 'recommended' ? 'text-blue-600' :
            variant === 'deal' ? 'text-red-600' :
            'text-neutral-600'
          }`}
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          onClick={handleProductClick}
        >
          {product.name}
        </h3>

        {/* Product Description - Only for featured and recommended */}
        {(variant === 'featured' || variant === 'recommended') && product.short_description && (
          <p className="text-sm text-neutral-600 mb-3 leading-relaxed" 
             style={{ 
               display: '-webkit-box',
               WebkitLineClamp: 2,
               WebkitBoxOrient: 'vertical',
               overflow: 'hidden'
             }}>
            {product.short_description}
          </p>
        )}

        {/* Deal-specific discount highlight */}
        {variant === 'deal' && product.min_discounted_price && product.min_discounted_price < product.min_price && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-red-600">
                    ${product.min_discounted_price.toLocaleString()}
                  </span>
                  <span className="text-lg text-neutral-500 line-through">
                    ${product.min_price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-red-600 font-semibold mt-1">
                  You save ${(product.min_price - product.min_discounted_price).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {Math.round(((product.min_price - product.min_discounted_price) / product.min_price) * 100)}% OFF
                </span>
                <p className="text-xs text-red-600 mt-1">Limited time</p>
              </div>
            </div>
          </div>
        )}

        {/* Regular Price Section - For non-deal variants */}
        {variant !== 'deal' && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`text-xl font-bold ${
                variant === 'featured' ? 'text-primary-600' :
                variant === 'bestseller' ? 'text-accent-600' :
                variant === 'latest' ? 'text-secondary-600' :
                variant === 'recommended' ? 'text-blue-600' :
                'text-neutral-900'
              }`}>
                ${product.min_price?.toLocaleString() || '999'}
              </span>
              {product.min_discounted_price && product.min_discounted_price < product.min_price && (
                <span className="text-sm text-neutral-500 line-through">
                  ${product.min_discounted_price.toLocaleString()}
                </span>
              )}
            </div>
            {variant === 'latest' && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold">
                New
              </span>
            )}
          </div>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {renderStars(product.average_rating)}
            <span className="text-sm font-medium text-neutral-700">
              {ProductService.formatRating(product.average_rating)}
            </span>
          </div>
          <span className="text-xs text-neutral-500">
            ({product.reviews_count} reviews)
          </span>
        </div>

        {/* Variant-Specific Features/Stats */}
        <div className="mb-4">
          {variant === 'bestseller' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-accent-500" />
                <span className="text-xs text-accent-600 font-medium">
                  #{Math.floor(Math.random() * 10) + 1} Bestseller
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-neutral-600">
                  {Math.floor(Math.random() * 1000) + 500}+ sold
                </span>
              </div>
              <div className="flex items-center space-x-1 col-span-2">
                <div className="w-2 h-2 rounded-full bg-accent-400"></div>
                <span className="text-xs text-neutral-600">
                  Top seller in {product.category_id?.name}
                </span>
              </div>
            </div>
          )}

          {variant === 'featured' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Award className="w-3 h-3 text-primary-500" />
                <span className="text-xs text-primary-600 font-medium">
                  Editor&apos;s Choice
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  product.score >= 4 ? 'bg-green-400' : 
                  product.score >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-xs text-neutral-600">
                  Score: {product.score.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center space-x-1 col-span-2">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-neutral-600">
                  Recommended by experts
                </span>
              </div>
            </div>
          )}

          {variant === 'latest' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  Just Added
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-secondary-400"></div>
                <span className="text-xs text-neutral-600">
                  {product.variants?.length || 1} option{(product.variants?.length || 1) > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-1 col-span-2">
                <Sparkles className="w-3 h-3 text-secondary-500" />
                <span className="text-xs text-neutral-600">
                  Latest in {product.category_id?.name}
                </span>
              </div>
            </div>
          )}

          {variant === 'recommended' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">
                  Personalized
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  product.average_rating >= 4 ? 'bg-green-400' : 
                  product.average_rating >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-xs text-neutral-600">
                  {ProductService.formatRating(product.average_rating)} rated
                </span>
              </div>
              <div className="flex items-center space-x-1 col-span-2">
                <Award className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-neutral-600">
                  Matches your preferences
                </span>
              </div>
            </div>
          )}

          {variant === 'deal' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Flame className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600 font-medium">
                  Hot Deal
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span className="text-xs text-neutral-600">
                  {Math.floor(Math.random() * 24) + 1}h left
                </span>
              </div>
              <div className="flex items-center space-x-1 col-span-2">
                <Target className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600">
                  Limited stock - {Math.floor(Math.random() * 20) + 5} left
                </span>
              </div>
            </div>
          )}

          {variant === 'default' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                <span className="text-xs text-neutral-600">
                  {product.variants?.length || 1} variant{(product.variants?.length || 1) > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  product.score >= 4 ? 'bg-green-400' : 
                  product.score >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-xs text-neutral-600">
                  Score: {product.score.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="space-y-3">
          {/* Variant-Specific Bottom Info */}
          <div className="flex items-center justify-between text-xs">
            {variant === 'bestseller' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-green-600 font-medium">In Stock</span>
                  </div>
                  <span className="text-white bg-accent-500 px-2 py-1 rounded-full font-semibold">
                    Hot seller
                  </span>
                </div>
                <span className="text-accent-600 font-medium">Fast shipping</span>
              </>
            )}

            {variant === 'featured' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-green-600 font-medium">Premium Quality</span>
                  </div>
                </div>
                <span className="text-primary-600 font-medium">Premium support</span>
              </>
            )}

            {variant === 'latest' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-green-600 font-medium">Available Now</span>
                  </div>
                  <span className="text-white bg-green-500 px-2 py-1 rounded-full font-semibold">
                    New
                  </span>
                </div>
                <span className="text-green-600 font-medium">Latest model</span>
              </>
            )}

            {variant === 'recommended' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-blue-600 font-medium">For You</span>
                  </div>
                  <span className="text-white bg-blue-500 px-2 py-1 rounded-full font-semibold">
                    Matched
                  </span>
                </div>
                <span className="text-blue-600 font-medium">Personalized</span>
              </>
            )}

            {variant === 'deal' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-red-500" />
                    <span className="text-red-600 font-medium">Deal Ends Soon</span>
                  </div>
                  <span className="text-white bg-red-500 px-2 py-1 rounded-full font-semibold animate-pulse">
                    Save Now
                  </span>
                </div>
                <span className="text-red-600 font-medium">Limited time</span>
              </>
            )}

            {variant === 'default' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-green-600 font-medium">In Stock</span>
                  </div>
                </div>
                <span className="text-neutral-500">Free shipping</span>
              </>
            )}
          </div>
          
          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {variant === 'deal' && (
                <span className="text-xs text-red-600 font-semibold animate-pulse">
                  ⚡ Limited stock
                </span>
              )}
              {variant === 'bestseller' && (
                <span className="text-xs text-accent-600 font-semibold">
                  🔥 Trending now
                </span>
              )}
              {variant === 'latest' && (
                <span className="text-xs text-green-600 font-semibold">
                  ✨ Just released
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              className={`shadow-lg transition-all duration-200 border-0 ${
                variant === 'featured' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' :
                variant === 'bestseller' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' :
                variant === 'latest' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' :
                variant === 'recommended' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white' :
                variant === 'deal' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse' :
                'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
              }`}
              asChild
            >
              <Link href={productUrl}>
                {config.ctaText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={convertToModalProduct(product)}
        isOpen={isQuickViewOpen}
        onClose={handleModalClose}
        onAddToCart={handleModalAddToCart}
        onToggleWishlist={() => {}} // TODO: Implement wishlist toggle
        onViewDetails={handleModalViewDetails}
        wishlistItems={[]} // TODO: Get from wishlist context
      />
    </div>
  )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
