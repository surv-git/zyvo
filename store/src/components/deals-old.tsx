"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import ProductImage from '@/components/ui/product-image'
import SectionHeader from '@/components/ui/section-header'
import { Star, Heart, ShoppingCart, Eye, Zap, Tag, Percent, Clock, Gift } from 'lucide-react'

const Deals: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Assuming we have a getDeals method
        const fetchedProducts = await ProductService.getFeaturedProducts(6) // Placeholder
        setProducts(fetchedProducts)
      } catch (err) {
        console.error('Error fetching deals:', err)
        setError('Failed to load deals')
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

  const generateDiscountPercentage = () => {
    return Math.floor(Math.random() * 50) + 10 // 10-60% discount
  }

  const generateTimeLeft = () => {
    const hours = Math.floor(Math.random() * 24) + 1
    const minutes = Math.floor(Math.random() * 60)
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Limited Time Offers"
            title="Hot Deals"
            subtitle="Unbeatable prices on premium products - grab them before they're gone!"
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
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Limited Time Offers"
            title="Hot Deals"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No Deals Available'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Check back soon for amazing deals and discounts!'}
            </p>
            {error && (
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.1'%3E%3Cpath d='M20 20l20-20H20v20zM0 40l20-20v20H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Limited Time Offers"
          title="Hot Deals"
          subtitle="Unbeatable prices on premium products - grab them before they're gone!"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Zap className="w-4 h-4 text-red-500" />
            <span>Flash Sales</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Percent className="w-4 h-4 text-orange-500" />
            <span>Up to 60% Off</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => {
            const discount = generateDiscountPercentage()
            const timeLeft = generateTimeLeft()
            
            return (
              <div
                key={product._id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative border-l-4 border-red-500"
                style={{
                  transform: 'translateY(0px)',
                  transformOrigin: 'center center',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  const flashBadge = e.currentTarget.querySelector('.flash-badge') as HTMLElement;
                  const timerBadge = e.currentTarget.querySelector('.timer-badge') as HTMLElement;
                  const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                  const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                  
                  if (flashBadge) flashBadge.style.animation = 'pulse 1s infinite';
                  if (timerBadge) timerBadge.style.transform = 'scale(1.1)';
                  if (overlay) overlay.style.opacity = '1';
                  if (wishlistBtn) wishlistBtn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  const flashBadge = e.currentTarget.querySelector('.flash-badge') as HTMLElement;
                  const timerBadge = e.currentTarget.querySelector('.timer-badge') as HTMLElement;
                  const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
                  const wishlistBtn = e.currentTarget.querySelector('.wishlist-btn') as HTMLElement;
                  
                  if (flashBadge) flashBadge.style.animation = '';
                  if (timerBadge) timerBadge.style.transform = 'scale(1)';
                  if (overlay) overlay.style.opacity = '0';
                  if (wishlistBtn) wishlistBtn.style.opacity = '0';
                }}
              >
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="flash-badge bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-lg font-bold rounded-full shadow-lg transform -rotate-12">
                    -{discount}%
                  </div>
                </div>

                {/* Timer Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="timer-badge bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg flex items-center space-x-1 transition-transform duration-300">
                    <Clock className="w-3 h-3" />
                    <span>{timeLeft}</span>
                  </div>
                </div>

                {/* Wishlist Button */}
                <button className="wishlist-btn absolute top-16 right-4 z-10 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg opacity-0 transition-all duration-300 hover:bg-white transform hover:scale-110" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  <Heart className="w-5 h-5 text-neutral-600 hover:text-red-500 transition-colors" />
                </button>

                {/* Product Image */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50" style={{ height: '280px' }}>
                  <ProductImage
                    src={ProductService.getProductImageUrl(product)}
                    alt={product.name}
                    productId={product._id}
                    fill
                    className="transition-all duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Flash Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 group-hover:from-red-500/20 group-hover:to-orange-500/20 transition-all duration-300"></div>
                  
                  {/* Overlay Actions */}
                  <div className="product-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-center justify-center space-x-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                    <Button size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg">
                      <Eye className="w-4 h-4 mr-2" />
                      Quick View
                    </Button>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6 bg-gradient-to-br from-white to-red-50/30">
                  {/* Brand & Deal Type */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wider">
                      {product.brand_id.name}
                    </span>
                    <span className="text-xs text-white bg-gradient-to-r from-red-500 to-orange-500 px-2 py-1 rounded-full font-semibold">
                      Flash Deal
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-red-600 transition-colors" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    <Link href={`/products/${product.slug}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xl font-bold text-red-600">
                      ${(product.score * (100 - discount) / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-neutral-500 line-through">
                      ${product.score}
                    </span>
                    <span className="text-sm text-red-600 font-semibold">
                      Save ${(product.score * discount / 100).toFixed(2)}
                    </span>
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

                  {/* Deal Badge & Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Gift className="w-3 h-3" />
                        <span>Limited</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transition-all duration-200 border-0"
                      asChild
                    >
                      <Link href={`/products/${product.slug}`}>
                        Grab Deal
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
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white mr-3" />
                <h3 className="text-2xl font-bold">
                  Don't Miss Out!
                </h3>
              </div>
              <p className="mb-6 text-red-100">
                More amazing deals are waiting for you. Limited time offers end soon!
              </p>
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-red-50 px-8 py-3 shadow-lg transition-all duration-200 font-semibold"
                asChild
              >
                <Link href="/deals">
                  View All Deals
                  <Tag className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Deals
