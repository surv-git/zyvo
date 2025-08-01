"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductImage from '@/components/ui/product-image'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import SectionHeader from '@/components/ui/section-header'
import { Star, Heart, ShoppingCart, Eye, Sparkles, Calendar, Plus, Layers } from 'lucide-react'

const LatestProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Assuming we have a getLatestProducts method
        const fetchedProducts = await ProductService.getFeaturedProducts(6) // Placeholder
        setProducts(fetchedProducts)
      } catch (err) {
        console.error('Error fetching latest products:', err)
        setError('Failed to load latest products')
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

  const generateDaysAgo = () => {
    return Math.floor(Math.random() * 30) + 1 // 1-30 days ago
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Fresh Arrivals"
            title="Latest Products"
            subtitle="Discover the newest additions to our collection - cutting-edge products just for you"
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
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Fresh Arrivals"
            title="Latest Products"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No New Products Yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Stay tuned for exciting new product launches!'}
            </p>
            {error && (
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700 text-white">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5cf6' fill-opacity='0.08'%3E%3Cpath d='M30 0l30 30-30 30L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Fresh Arrivals"
          title="Latest Products"
          subtitle="Discover the newest additions to our collection - cutting-edge products just for you"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Just Launched</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Plus className="w-4 h-4 text-secondary-500" />
            <span>Brand New</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => {
            const daysAgo = generateDaysAgo()
            
            return (
              <div
                key={product._id}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative transform perspective-1000"
                style={{
                  transform: 'translateY(0px)',
                  transformOrigin: 'center center',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) rotateX(5deg)';
                  const newBadge = e.currentTarget.querySelector('.new-badge') as HTMLElement;
                  const shimmer = e.currentTarget.querySelector('.shimmer-effect') as HTMLElement;
                  const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                  const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                  
                  if (newBadge) newBadge.style.transform = 'scale(1.1) rotate(-2deg)';
                  if (shimmer) shimmer.style.opacity = '1';
                  if (overlay) overlay.style.opacity = '1';
                  if (wishlistBtn) wishlistBtn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) rotateX(0deg)';
                  const newBadge = e.currentTarget.querySelector('.new-badge') as HTMLElement;
                  const shimmer = e.currentTarget.querySelector('.shimmer-effect') as HTMLElement;
                  const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                  const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                  
                  if (newBadge) newBadge.style.transform = 'scale(1) rotate(0deg)';
                  if (shimmer) shimmer.style.opacity = '0';
                  if (overlay) overlay.style.opacity = '0';
                  if (wishlistBtn) wishlistBtn.style.opacity = '0';
                }}
              >
                {/* New Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="new-badge bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg transition-transform duration-300 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>NEW</span>
                  </div>
                </div>

                {/* Date Added Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-white bg-opacity-90 text-purple-600 px-3 py-1 text-xs font-semibold rounded-full shadow-lg flex items-center space-x-1" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                    <Calendar className="w-3 h-3" />
                    <span>{daysAgo}d ago</span>
                  </div>
                </div>

                {/* Wishlist Button */}
                <button className="wishlist-btn absolute top-16 right-4 z-20 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg opacity-0 transition-all duration-300 hover:bg-white transform hover:scale-110" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  <Heart className="w-5 h-5 text-neutral-600 hover:text-purple-500 transition-colors" />
                </button>

                {/* Product Image */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50" style={{ height: '280px' }}>
                  <ProductImage
                    src={ProductService.getProductImageUrl(product)}
                    alt={product.name}
                    productId={product._id}
                    fill
                    className="transition-all duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Shimmer Effect */}
                  <div 
                    className="shimmer-effect absolute inset-0 opacity-0 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                      transform: 'translateX(-100%)',
                      animation: 'shimmer 2s infinite'
                    }}
                  ></div>
                  
                  {/* Overlay Actions */}
                  <div className="product-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-center justify-center space-x-3" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                    <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg">
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6 bg-gradient-to-br from-white to-purple-50/30 relative">
                  {/* Brand & Category */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
                      {product.brand_id.name}
                    </span>
                    <span className="text-xs text-white bg-gradient-to-r from-purple-500 to-blue-500 px-2 py-1 rounded-full font-semibold">
                      {product.category_id.name}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-purple-600 transition-colors" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    <Link href={`/products/${product.slug}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>

                  {/* Innovation Badge */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <Layers className="w-3 h-3" />
                      <span>Latest Tech</span>
                    </div>
                  </div>

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

                  {/* Fresh Badge & Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-purple-400 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Fresh</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm" 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 border-0"
                      asChild
                    >
                      <Link href={`/products/${product.slug}`}>
                        Explore
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-white opacity-10"></div>
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M50 0l50 50-50 50L0 50z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white mr-3" />
                <h3 className="text-2xl font-bold">
                  Stay Ahead of the Curve
                </h3>
              </div>
              <p className="mb-6 text-purple-100">
                Be the first to discover and experience our latest innovations and product launches.
              </p>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-3 shadow-lg transition-all duration-200 font-semibold"
                asChild
              >
                <Link href="/products?filter=latest">
                  View All New Products
                  <Calendar className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  )
}

export default LatestProducts
