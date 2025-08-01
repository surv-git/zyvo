"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import ProductImage from '@/components/ui/product-image'
import SectionHeader from '@/components/ui/section-header'
import { Star, Heart, ShoppingCart, Eye, Sparkles, Zap, Target, TrendingUp } from 'lucide-react'

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedProducts = await ProductService.getFeaturedProducts(6)
        setProducts(fetchedProducts)
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setError('Failed to load featured products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const renderStars = (rating: number) => {
    const { fullStars, hasHalfStar, emptyStars } = ProductService.getStarRating(rating)
    
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-primary-400 text-primary-400" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 fill-primary-400/50 text-primary-400" />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-neutral-300" />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Hand-Picked"
            title="Featured Products"
            subtitle="Carefully selected premium products that define excellence and innovation"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-full h-64 bg-neutral-200 rounded-xl mb-4"></div>
                <div className="w-3/4 h-6 bg-neutral-200 rounded mb-2"></div>
                <div className="w-full h-4 bg-neutral-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="w-20 h-4 bg-neutral-200 rounded"></div>
                  <div className="w-16 h-8 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Hand-Picked"
            title="Featured Products"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No Featured Products Yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Check back soon for our specially curated featured products!'}
            </p>
            {error && (
              <Button onClick={() => window.location.reload()} className="bg-primary-600 hover:bg-primary-700 text-white">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M40 40c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16-16-7.163-16-16zm-16 0c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16-16-7.163-16-16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Hand-Picked"
          title="Featured Products"
          subtitle="Carefully selected premium products that define excellence and innovation"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span>Premium Selection</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Target className="w-4 h-4 text-secondary-500" />
            <span>Editor&apos;s Choice</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product._id}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative border-2 border-transparent hover:border-primary-200"
              style={{
                transform: 'translateY(0px) rotate(0deg)',
                transformOrigin: 'center center',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) rotate(-1deg)';
                const sparkle = e.currentTarget.querySelector('.sparkle-badge') as HTMLElement;
                const featuredBadge = e.currentTarget.querySelector('.featured-badge') as HTMLElement;
                const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                
                if (sparkle) sparkle.style.transform = 'scale(1.2) rotate(15deg)';
                if (featuredBadge) featuredBadge.style.transform = 'scale(1.1)';
                if (overlay) overlay.style.opacity = '1';
                if (wishlistBtn) wishlistBtn.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) rotate(0deg)';
                const sparkle = e.currentTarget.querySelector('.sparkle-badge') as HTMLElement;
                const featuredBadge = e.currentTarget.querySelector('.featured-badge') as HTMLElement;
                const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                
                if (sparkle) sparkle.style.transform = 'scale(1) rotate(0deg)';
                if (featuredBadge) featuredBadge.style.transform = 'scale(1)';
                if (overlay) overlay.style.opacity = '0';
                if (wishlistBtn) wishlistBtn.style.opacity = '0';
              }}
            >
              {/* Featured Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="featured-badge bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-2 text-sm font-bold rounded-full shadow-lg border-2 border-white transition-transform duration-300">
                  FEATURED
                </div>
              </div>

              {/* Sparkle Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="sparkle-badge w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Wishlist Button */}
              <button className="wishlist-btn absolute top-16 right-4 z-10 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg opacity-0 transition-all duration-300 hover:bg-white transform hover:scale-110" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <Heart className="w-5 h-5 text-neutral-600 hover:text-primary-500 transition-colors" />
              </button>

              {/* Product Image */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50" style={{ height: '280px' }}>
                <ProductImage
                  src={ProductService.getProductImageUrl(product)}
                  alt={product.name}
                  productId={product._id}
                  fill
                  className="transition-all duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Overlay Actions */}
                <div className="product-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-center justify-center space-x-3" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                  <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg">
                    <Eye className="w-4 h-4 mr-2" />
                    Quick View
                  </Button>
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 bg-gradient-to-br from-white to-primary-50/20">
                {/* Brand & Featured Label */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
                    {product.brand_id.name}
                  </span>
                  <span className="text-xs text-white bg-gradient-to-r from-primary-500 to-secondary-500 px-2 py-1 rounded-full font-semibold">
                    Editor&apos;s Pick
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors" style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  <Link href={`/product/${product.slug}-${product._id}`} className="hover:underline">
                    {product.name}
                  </Link>
                </h3>

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

                {/* Premium Badge & Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Premium</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg transition-all duration-200 border-0"
                    asChild
                  >
                    <Link href={`/product/${product.slug}-${product._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white bg-opacity-90 rounded-3xl p-8 shadow-lg border-2 border-primary-100" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary-500 mr-3" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Explore More Featured Products
              </h3>
            </div>
            <p className="text-neutral-600 mb-6">
              Discover our complete collection of handpicked premium products.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 shadow-lg transition-all duration-200 border-0"
              asChild
            >
              <Link href="/products?filter=featured">
                View All Featured Products
                <TrendingUp className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts
