"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductImage from '@/components/ui/product-image'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/contexts/favorites-context'
import { Heart, ShoppingCart, Star } from 'lucide-react'

const FavoritesPage: React.FC = () => {
  const { favorites, loading, error, removeFromFavorites } = useFavorites()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="w-full px-4 sm:px-6 lg:px-36 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Favorites</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-lg animate-pulse">
                <div className="w-full h-48 bg-neutral-200 rounded mb-4"></div>
                <div className="w-3/4 h-4 bg-neutral-200 rounded mb-2"></div>
                <div className="w-full h-3 bg-neutral-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="w-16 h-4 bg-neutral-200 rounded"></div>
                  <div className="w-12 h-8 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="w-full px-4 sm:px-6 lg:px-36 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">My Favorites</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (favorites.size === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="w-full px-4 sm:px-6 lg:px-36 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Favorites</h1>
            <div className="bg-white rounded-lg p-12 shadow-lg max-w-md mx-auto">
              <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                No favorites yet
              </h2>
              <p className="text-neutral-600 mb-6">
                Start browsing and add products to your favorites to see them here.
              </p>
              <Button asChild>
                <Link href="/">
                  Start Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-24">
      <div className="w-full px-4 sm:px-6 lg:px-36 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            My Favorites ({favorites.size})
          </h1>
        </div>

        <div className="text-center py-8">
          <p className="text-neutral-600">
            Note: This page shows favorite product variant IDs. 
            To display actual product details, you would need to fetch product information 
            for each favorite ID from your products API.
          </p>
        </div>

        {/* Placeholder display of favorite IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(favorites).map((favoriteId) => (
            <div key={favoriteId} className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    Product Variant
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    ID: {favoriteId}
                  </p>
                </div>
                <button
                  onClick={() => removeFromFavorites(favoriteId)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove from favorites"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FavoritesPage
