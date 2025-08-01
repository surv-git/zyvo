"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/ui/product-card'
import SectionHeader from '@/components/ui/section-header'
import { Crown, TrendingUp, Award } from 'lucide-react'

const BestSellers: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Assuming we have a getBestSellers method
        const fetchedProducts = await ProductService.getFeaturedProducts(6) // Placeholder
        setProducts(fetchedProducts)
      } catch (err) {
        console.error('Error fetching best sellers:', err)
        setError('Failed to load best sellers')
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
      <section className="py-20 bg-gradient-to-br from-secondary-50 via-white to-orange-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Top Rated"
            title="Best Sellers"
            subtitle="Most popular products loved by our customers worldwide"
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
      <section className="py-20 bg-gradient-to-br from-secondary-50 via-white to-orange-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Top Rated"
            title="Best Sellers"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-secondary-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No Best Sellers Yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Check back soon for our most popular products!'}
            </p>
            {error && (
              <Button onClick={() => window.location.reload()} className="bg-secondary-600 hover:bg-secondary-700 text-white">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-secondary-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.03'%3E%3Cpath d='M40 40c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16-16-7.163-16-16zm-16 0c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16s16-7.163-16-16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Top Rated"
          title="Best Sellers"
          subtitle="Most popular products loved by our customers worldwide"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Crown className="w-4 h-4 text-secondary-500" />
            <span>Customer Favorites</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Award className="w-4 h-4 text-orange-500" />
            <span>Top Rated</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              variant="bestseller"
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white bg-opacity-90 rounded-3xl p-8 shadow-lg border-2 border-secondary-100" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-secondary-500 mr-3" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Explore More Best Sellers
              </h3>
            </div>
            <p className="text-neutral-600 mb-6">
              Discover our complete collection of customer-favorite products.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white px-8 py-3 shadow-lg transition-all duration-200 border-0"
              asChild
            >
              <Link href="/products?filter=bestsellers">
                View All Best Sellers
                <TrendingUp className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BestSellers
