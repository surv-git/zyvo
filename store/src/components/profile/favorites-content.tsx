'use client'

import { Heart, Grid, List, Search, Filter, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserFavoritesService, FavoriteProduct, FavoritesFilters } from '@/services/user-favorites-service'
import { useState, useEffect } from 'react'
import ProductImage from '@/components/ui/product-image'
import Link from 'next/link'

type ViewMode = 'grid' | 'list'

export default function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  // Fetch favorites from API
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Fetching favorites...')
        
        const filters: FavoritesFilters = {
          page: currentPage,
          page_size: 12,
          sort_by: 'created_at',
          sort_order: 'desc'
        }

        const response = await UserFavoritesService.getFavorites(filters)
        console.log('✅ Favorites response:', response)
        
        if (response.success) {
          console.log('📦 Setting favorites data:', response.data)
          setFavorites(response.data)
          setTotalPages(response.pagination.total_pages)
        } else {
          console.error('❌ API returned success: false', response)
          setError('Failed to load favorites')
        }
      } catch (err) {
        console.error('❌ Error fetching favorites:', err)
        setError('Failed to load favorites. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [currentPage])

  // Handle remove favorite
  const handleRemoveFavorite = async (productVariantId: string) => {
    try {
      setRemovingIds(prev => new Set(prev).add(productVariantId))
      
      const response = await UserFavoritesService.removeFavorite(productVariantId)
      
      if (response.success) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.product_variant_id._id !== productVariantId))
      } else {
        setError('Failed to remove from favorites')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      setError('Failed to remove from favorites')
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productVariantId)
        return newSet
      })
    }
  }

  // Filter favorites based on search term
  const filteredFavorites = favorites.filter(favorite =>
    favorite.product_variant_id.product_id.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">My Favorites</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search favorites..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none border-l"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Favorites Content */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">Items you favorite will appear here for easy access.</p>
            <Button asChild>
              <Link href="/catalog">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredFavorites.length} item{filteredFavorites.length > 1 ? 's' : ''} in your favorites
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((favorite: FavoriteProduct) => {
                  const product = favorite.product_variant_id.product_id
                  const variant = favorite.product_variant_id
                  const productImage = variant.images?.[0] || product.primary_image || ''
                  const isRemoving = removingIds.has(variant._id)
                  
                  return (
                    <div key={favorite.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden">
                        <ProductImage
                          src={productImage}
                          alt={product.name}
                          productId={product.id}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <Link href={`/product/${product.id}`} className="block">
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        
                        {/* Stock Badge */}
                        <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                          {variant.is_active ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg">${variant.effective_price}</span>
                            {variant.discount_details.is_on_sale && variant.price > variant.effective_price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${variant.price}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" disabled={!variant.is_active}>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Add to Cart
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFavorite(variant._id)}
                              disabled={isRemoving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFavorites.map((favorite: FavoriteProduct) => {
                  const product = favorite.product_variant_id.product_id
                  const variant = favorite.product_variant_id
                  const productImage = variant.images?.[0] || product.primary_image || ''
                  const isRemoving = removingIds.has(variant._id)
                  
                  return (
                    <div key={favorite.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        <ProductImage
                          src={productImage}
                          alt={product.name}
                          productId={product.id}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Link href={`/product/${product.id}`} className="block">
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                        <Badge variant={variant.is_active ? 'default' : 'secondary'} className="mt-1">
                          {variant.is_active ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="space-y-1 mb-2">
                          <div className="font-semibold text-lg">${variant.effective_price}</div>
                          {variant.discount_details.is_on_sale && variant.price > variant.effective_price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${variant.price}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={!variant.is_active}>
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFavorite(variant._id)}
                            disabled={isRemoving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
