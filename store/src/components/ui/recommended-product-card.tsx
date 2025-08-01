"use client"

import React, { memo } from 'react'
import Link from 'next/link'
import ProductImage from '@/components/ui/isolated-product-image'
import FavoriteButton from '@/components/ui/favorite-button'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, Eye, Target, Users, ThumbsUp, Cpu, BookOpen } from 'lucide-react'

interface RecommendedProductCardProps {
  product: Product
  index: number
  matchPercentage: number
  reason: string
}

const RecommendedProductCard: React.FC<RecommendedProductCardProps> = ({
  product,
  index,
  matchPercentage,
  reason
}) => {
  const renderStars = (rating: number) => {
    const { fullStars, hasHalfStar, emptyStars } = ProductService.getStarRating(rating)
    
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-secondary-400 text-secondary-400" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 fill-secondary-400/50 text-secondary-400" />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-neutral-300" />
        ))}
      </div>
    )
  }

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative border border-amber-100 hover:border-amber-300"
      style={{
        transform: 'translateY(0px)',
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        const matchBadge = e.currentTarget.querySelector('.match-badge') as HTMLElement;
        const aiIcon = e.currentTarget.querySelector('.ai-icon') as HTMLElement;
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
        const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
        
        if (matchBadge) matchBadge.style.transform = 'scale(1.1)';
        if (aiIcon) aiIcon.style.transform = 'rotate(360deg) scale(1.2)';
        if (overlay) overlay.style.opacity = '1';
        if (wishlistBtn) wishlistBtn.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
        const matchBadge = e.currentTarget.querySelector('.match-badge') as HTMLElement;
        const aiIcon = e.currentTarget.querySelector('.ai-icon') as HTMLElement;
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
        const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
        
        if (matchBadge) matchBadge.style.transform = 'scale(1)';
        if (aiIcon) aiIcon.style.transform = 'rotate(0deg) scale(1)';
        if (overlay) overlay.style.opacity = '0';
        if (wishlistBtn) wishlistBtn.style.opacity = '0';
      }}
    >
      {/* Match Percentage Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="match-badge bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-2 text-sm font-bold rounded-full shadow-lg transition-transform duration-300 flex items-center space-x-1">
          <Target className="w-4 h-4" />
          <span>{matchPercentage}% match</span>
        </div>
      </div>

      {/* AI Recommendation Icon */}
      <div className="absolute top-4 right-4 z-10">
        <div className="ai-icon w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-500 border-2 border-white">
          <Cpu className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Wishlist Button */}
      <FavoriteButton
        productVariantId={product._id}
        className="wishlist-btn absolute top-16 right-4 z-10 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg opacity-0 transition-all duration-300 hover:bg-white transform hover:scale-110"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      />

      {/* Product Image */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50" style={{ height: '280px' }}>
        <ProductImage
          src={ProductService.getProductImageUrl(product)}
          alt={product.name}
          productId={product._id}
          fill
          className="transition-all duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Recommendation Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20 transition-all duration-300"></div>
        
        {/* Overlay Actions */}
        <div className="product-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-center justify-center space-x-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
          <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg">
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6 bg-gradient-to-br from-white to-amber-50/30">
        {/* Recommendation Reason */}
        <div className="mb-3">
          <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>{reason}</span>
          </span>
        </div>

        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-yellow-600 uppercase tracking-wider">
            {product.brand_id.name}
          </span>
          <span className="text-xs text-white bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-1 rounded-full font-semibold">
            {product.category_id.name}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-amber-600 transition-colors" style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="text-sm text-neutral-600 mb-3" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.short_description}
        </p>

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Recommended Badge & Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
              <ThumbsUp className="w-3 h-3" />
              <span>For You</span>
            </div>
          </div>
          
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg transition-all duration-200 border-0"
            asChild
          >
            <Link href={`/products/${product.slug}`}>
              Try It
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Custom comparison to prevent unnecessary re-renders
const arePropsEqual = (prevProps: RecommendedProductCardProps, nextProps: RecommendedProductCardProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.matchPercentage === nextProps.matchPercentage &&
    prevProps.reason === nextProps.reason &&
    prevProps.index === nextProps.index
  )
}

RecommendedProductCard.displayName = 'RecommendedProductCard'

export default memo(RecommendedProductCard, arePropsEqual)
