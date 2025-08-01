"use client"

import React, { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/ui/product-card'
import SectionHeader from '@/components/ui/section-header'
import { Target, Users, TrendingUp } from 'lucide-react'

const RecommendedProducts: React.FC = memo(() => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Assuming we have a getRecommendedProducts method
        const fetchedProducts = await ProductService.getFeaturedProducts(6) // Placeholder
        setProducts(fetchedProducts)
      } catch (err) {
        console.error('Error fetching recommended products:', err)
        setError('Failed to load recommended products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleQuickView = (product: Product) => {
    console.log('Quick view:', product.name)
    // TODO: Implement quick view modal
  }

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product.name)
    // TODO: Implement add to cart functionality
  }

  const handleProductClick = (product: Product) => {
    console.log('Product clicked:', product.name)
    // Navigation will be handled by the Link in ProductCard
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Personalized"
            title="Recommended for You"
            subtitle="Handpicked products based on your preferences and interests"
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
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Personalized"
            title="Recommended for You"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No Recommendations Yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Browse our products to get personalized recommendations!'}
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
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5cf6' fill-opacity='0.03'%3E%3Cpath d='M40 40c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16-16-7.163-16-16zm-16 0c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16s16-7.163-16-16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Personalized"
          title="Recommended for You"
          subtitle="Handpicked products based on your preferences and interests"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Target className="w-4 h-4 text-purple-500" />
            <span>Personalized</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>AI Powered</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              variant="recommended"
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white bg-opacity-90 rounded-3xl p-8 shadow-lg border-2 border-purple-100" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Discover More Recommendations
              </h3>
            </div>
            <p className="text-neutral-600 mb-6">
              Explore our AI-powered recommendations tailored just for you.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 shadow-lg transition-all duration-200 border-0"
              asChild
            >
              <Link href="/catalog?filter=recommended">
                View All Recommendations
                <TrendingUp className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
})

RecommendedProducts.displayName = 'RecommendedProducts'

export default RecommendedProducts
