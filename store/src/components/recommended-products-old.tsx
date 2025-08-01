"use client"

import React, { useEffect, useState, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import RecommendedProductCard from '@/components/ui/recommended-product-card'
import { Product } from '@/types/api'
import { ProductService } from '@/services/product-service'
import { Button } from '@/components/ui/button'
import SectionHeader from '@/components/ui/section-header'
import { Target, Users, Cpu } from 'lucide-react'

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

  const generateMatchPercentage = () => {
    return Math.floor(Math.random() * 25) + 75 // 75-99% match
  }

  const getRecommendationReason = (index: number) => {
    const reasons = [
      "Based on your interests",
      "Similar to your purchases",
      "Trending in your area",
      "Highly rated by similar users",
      "Perfect for your needs",
      "Recommended by experts"
    ]
    return reasons[index % reasons.length]
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
        <div className="max-w-full mx-auto lg:px-36 px-4">
          <SectionHeader
            badge="Personalized for You"
            title="Recommended Products"
            subtitle="Handpicked recommendations based on your preferences and browsing history"
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
      <section className="py-20 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <SectionHeader
            badge="Personalized for You"
            title="Recommended Products"
          />
          <div className="bg-white rounded-2xl p-12 shadow-lg">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              {error ? 'Something went wrong' : 'No Recommendations Yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || 'Browse some products to get personalized recommendations!'}
            </p>
            {error && (
              <Button onClick={() => window.location.reload()} className="bg-amber-600 hover:bg-amber-700 text-white">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='25' cy='25' r='10'/%3E%3Ccircle cx='25' cy='25' r='20' stroke='%2310b981' stroke-opacity='0.05' fill='none'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-full mx-auto relative lg:px-36 px-4">
        <SectionHeader
          badge="Personalized for You"
          title="Recommended Products"
          subtitle="Handpicked recommendations based on your preferences and browsing history"
        />
        
        <div className="flex items-center justify-center space-x-6 mb-16">
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Cpu className="w-4 h-4 text-amber-500" />
            <span>AI Powered</span>
          </div>
          <div className="w-px h-4 bg-neutral-300"></div>
          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <Target className="w-4 h-4 text-yellow-500" />
            <span>Personalized</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => {
            const matchPercentage = generateMatchPercentage()
            const reason = getRecommendationReason(index)
            
            return (
              <RecommendedProductCard
                key={product._id}
                product={product}
                index={index}
                matchPercentage={matchPercentage}
                reason={reason}
              />
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-white opacity-10"></div>
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='15'/%3E%3Ccircle cx='30' cy='30' r='25' stroke='%23ffffff' stroke-opacity='0.05' fill='none'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-bold">
                    Get More Personalized Recommendations
                  </h3>
                </div>
              </div>
              <p className="mb-6 text-amber-100">
                The more you browse and interact, the better our AI gets at understanding your preferences.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-amber-50 px-6 py-3 shadow-lg transition-all duration-200 font-semibold"
                  asChild
                >
                  <Link href="/recommendations">
                    View All Recommendations
                    <Users className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-amber-600 px-6 py-3 transition-all duration-200 font-semibold"
                  asChild
                >
                  <Link href="/preferences">
                    Update Preferences
                    <Target className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

RecommendedProducts.displayName = 'RecommendedProducts'

export default RecommendedProducts
