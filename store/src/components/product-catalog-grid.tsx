import React, { memo } from 'react'
import ProductImage from '@/components/ui/isolated-product-image'
import OptimizedCatalogFavoriteButton from '@/components/ui/optimized-catalog-favorite-button'
import { Button } from '@/components/ui/button'
import { formatIndianRupees } from '@/lib/currency-utils'
import { 
  Star, 
  Eye,
  Package,
  Truck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  Sparkles,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  images: string[] // Include the full images array
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

interface FilterState {
  category: string | null
  subcategory: string | null
  brand: string[]
  priceRange: [number, number]
  rating: number | null
  inStock: boolean
  onSale: boolean
  sortBy: string
  viewMode: 'grid' | 'list'
}

interface ProductCatalogGridProps {
  products: Product[]
  filters: FilterState
  isLoading: boolean
  error: string | null
  totalProducts: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onProductClick: (product: Product, viewType?: 'quickView' | 'details') => void
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: string) => void
  wishlistItems: string[]
}

const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  filters,
  isLoading,
  error,
  totalProducts,
  currentPage,
  totalPages,
  onPageChange,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlistItems
}) => {
  const itemsPerPage = 20
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalProducts)

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-neutral-600">Loading products...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load products</h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No products found</h3>
          <p className="text-neutral-600 mb-4">Try adjusting your filters or search terms</p>
          <Button variant="outline" onClick={() => window.location.href = '/products'}>
            Browse All Products
          </Button>
        </div>
      </div>
    )
  }

  // Memoized Product Card Component with custom comparison
    const ProductCard = memo<{
    product: Product
    filters: FilterState
    onProductClick: (product: Product, viewType?: 'quickView' | 'details') => void
    onAddToCart: (product: Product, variant?: any, quantity?: number) => void
  }>(function ProductCard({ product, filters, onProductClick, onAddToCart }) {
    const discount = product.originalPrice ? 
      Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

    // Check if product has variants and calculate availability
    const hasVariants = product.variants && product.variants.length > 0
    const hasAvailableVariants = hasVariants ? product.variants!.some(variant => variant.inStock) : false
    const isAvailable = hasVariants ? hasAvailableVariants : product.inStock

    if (filters.viewMode === 'list') {
      return (
        <div className="flex bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative w-64 h-64 flex-shrink-0 overflow-hidden rounded-l-lg bg-gray-100">
            <ProductImage
              src={product.image}
              alt={product.name}
              productId={product.id}
              fill
              className="object-cover"
            />
            {product.onSale && (
              <div className="absolute top-0 left-2 z-10">
                <div className="relative bg-red-600 text-white px-2 py-2 text-center shadow-lg rounded-b-full">
                  <div className="text-[9px] font-bold uppercase tracking-wide">SALE</div>
                  <div className="text-[8px] font-medium">UP TO</div>
                  <div className="text-[14px] font-black slashed-zero tabular-nums md:normal-nums">{discount}%</div>                  
                </div>
              </div>
            )}
            {product.isNew && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1 py-0.5 rounded-md shadow-md transform rotate-1 flex items-center space-x-0.5">
                <Sparkles className="w-1.5 h-1.5" />
                <span className="text-[9px] font-bold leading-none">NEW</span>
              </div>
            )}
            {/* Wishlist button - permanent location */}
            <OptimizedCatalogFavoriteButton
              productId={product.id}
              size="sm"
              className="absolute bottom-2 right-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-sm"
            />
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 
                    className="font-medium text-neutral-900 hover:text-primary-600 cursor-pointer truncate"
                    onClick={() => onProductClick(product, 'details')}
                  >
                    {product.name}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">{product.brand}</p>
                </div>
                <OptimizedCatalogFavoriteButton
                  productId={product.id}
                  size="lg"
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                />
              </div>
              
              <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{product.description}</p>
              
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) 
                          ? 'fill-secondary-400 text-secondary-400' 
                          : 'text-neutral-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  ({product.reviewCount} reviews)
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold text-neutral-900">
                  {formatIndianRupees(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through">
                    {formatIndianRupees(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isAvailable ? (
                  <div className="flex items-center text-sm text-accent-600">
                    <Package className="w-4 h-4 mr-1" />
                    {hasVariants ? 'Available' : 'In Stock'}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-red-600">
                    <Package className="w-4 h-4 mr-1" />
                    Out of Stock
                  </div>
                )}
                <div className="flex items-center text-sm text-neutral-600">
                  <Truck className="w-4 h-4 mr-1" />
                  Free Shipping
                </div>
              </div>
              
                            <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProductClick(product, 'quickView')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Quick View
                </Button>
                <Button
                  size="sm"
                  onClick={() => onProductClick(product, 'details')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary hover:border-primary/90"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Grid view
    return (
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative aspect-square overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            productId={product.id}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Sale Banner - permanent location top left */}
          {product.onSale && (
            <div className="absolute top-0 left-2 z-10">
              <div className="relative bg-red-600 text-white px-2 py-3 text-center shadow-lg">
                <div className="text-[9px] font-bold uppercase tracking-wide">SALE</div>
                <div className="text-[8px] font-medium">UP TO</div>
                <div className="text-[14px] font-black slashed-zero tabular-nums md:normal-nums">{discount}%</div>
                {/* Banner tail/arrow - centered and positioned lower */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-700" style={{ top: 'calc(100% - 1px)' }}></div>
              </div>
            </div>
          )}
          
          {/* New Badge - permanent location top right */}
          {product.isNew && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1 py-0.5 rounded-full shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-200 z-10">
              <div className="flex items-center space-x-0.5">
                <Zap className="w-1.5 h-1.5" />
                <span className="text-[9px] font-bold leading-none">NEW</span>
              </div>
            </div>
          )}
          
          {/* Wishlist - permanent location bottom right */}
          <OptimizedCatalogFavoriteButton
            productId={product.id}
            size="sm"
            className="absolute bottom-2 right-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-sm z-10"
          />
          
          {/* Quick Actions - center bottom on hover */}
          <div className="absolute bottom-2 left-2 right-12 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onProductClick(product, 'quickView')}
              className="bg-transparent border-white text-white hover:bg-white/20"
            >
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-2">
            <h3 
              className="font-medium text-neutral-900 hover:text-primary-600 cursor-pointer truncate"
              onClick={() => onProductClick(product, 'details')}
            >
              {product.name}
            </h3>
            <p className="text-sm text-neutral-600">{product.brand}</p>
          </div>
          
          <div className="flex items-center space-x-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating) 
                    ? 'fill-secondary-400 text-secondary-400' 
                    : 'text-neutral-300'
                }`} 
              />
            ))}
            <span className="text-xs text-neutral-600 ml-1">
              ({product.reviewCount})
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg font-bold text-neutral-900">
              {formatIndianRupees(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-neutral-500 line-through">
                {formatIndianRupees(product.originalPrice)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className={`text-sm ${isAvailable ? 'text-accent-600' : 'text-red-600'}`}>
              {isAvailable ? (hasVariants ? 'Available' : 'In Stock') : 'Out of Stock'}
            </div>
            <div className="text-xs text-neutral-500">Free Shipping</div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => onProductClick(product, 'quickView')}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Button>
            <Button
              onClick={() => onProductClick(product, 'details')}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-primary hover:border-primary/90"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    )
  }, (prevProps, nextProps) => {
    // Custom comparison: only re-render if product or critical data changes
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.originalPrice === nextProps.product.originalPrice &&
      prevProps.product.image === nextProps.product.image &&
      prevProps.product.inStock === nextProps.product.inStock &&
      prevProps.product.onSale === nextProps.product.onSale &&
      prevProps.product.isNew === nextProps.product.isNew &&
      prevProps.filters.viewMode === nextProps.filters.viewMode
    )
  }) // Close the memo component with custom comparison

  return (
    <div className="flex-1 p-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-600">
          Showing {startItem}-{endItem} of {totalProducts} products
        </p>
      </div>

      {/* Products Grid/List */}
      <div className={
        filters.viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'space-y-4'
      }>
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            filters={filters}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                onClick={() => onPageChange(pageNum)}
                className="w-10"
              >
                {pageNum}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProductCatalogGrid
