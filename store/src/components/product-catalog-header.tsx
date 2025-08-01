import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from './ui/badge'
import { formatIndianRupees } from '@/lib/currency-utils'
import { Category } from '@/types/api'
import { 
  Filter, 
  Grid3X3, 
  List, 
  ChevronDown, 
  Search, 
  Menu,
  Home,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react'

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

interface ProductCatalogHeaderProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
  totalProducts: number
  currentPage: number
  isLoading: boolean
  onSidebarToggle: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  availableCategories: Category[]
}

const ProductCatalogHeader: React.FC<ProductCatalogHeaderProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalProducts,
  currentPage,
  isLoading,
  onSidebarToggle,
  searchQuery,
  onSearchChange,
  availableCategories
}) => {
  // Helper function to get category name from ID
  const getCategoryName = (categoryId: string | null): string | null => {
    if (!categoryId) return null
    const category = availableCategories.find(cat => cat._id === categoryId)
    return category ? category.name : categoryId // Fallback to ID if name not found
  }
  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'newest', label: 'Newest First' }
  ]

  const activeFilters = [
    ...(filters.category ? [{ key: 'category', label: `Category: ${getCategoryName(filters.category)}`, value: filters.category }] : []),
    ...filters.brand.map(brand => ({ key: 'brand', label: `Brand: ${brand}`, value: brand })),
    ...(filters.rating ? [{ key: 'rating', label: `${filters.rating}+ Stars`, value: filters.rating }] : []),
    ...(filters.inStock ? [{ key: 'inStock', label: 'In Stock', value: 'inStock' }] : []),
    ...(filters.onSale ? [{ key: 'onSale', label: 'On Sale', value: 'onSale' }] : []),
    ...(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 
      [{ key: 'price', label: `${formatIndianRupees(filters.priceRange[0])} - ${formatIndianRupees(filters.priceRange[1])}`, value: 'price' }] : [])
  ]

  const removeFilter = (filterKey: string, value?: any) => {
    switch (filterKey) {
      case 'category':
        onFilterChange({ category: null })
        break
      case 'brand':
        onFilterChange({ brand: filters.brand.filter(b => b !== value) })
        break
      case 'rating':
        onFilterChange({ rating: null })
        break
      case 'inStock':
        onFilterChange({ inStock: false })
        break
      case 'onSale':
        onFilterChange({ onSale: false })
        break
      case 'price':
        onFilterChange({ priceRange: [0, 1000] })
        break
    }
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    ...(filters.category ? [{ label: getCategoryName(filters.category) || 'Category', href: `/products/${getCategoryName(filters.category)}` }] : []),
    ...(filters.subcategory ? [{ label: filters.subcategory, href: `/products/${getCategoryName(filters.category)}/${filters.subcategory}` }] : [])
  ]

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-20 z-30">
      {/* Breadcrumb */}
      <div className="px-4 lg:px-6 py-3 border-b border-neutral-100">
        <nav className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-neutral-400" />}
              <a
                href={crumb.href}
                className={`${
                  index === breadcrumbs.length - 1
                    ? 'text-neutral-900 font-medium'
                    : 'text-neutral-600 hover:text-primary-600'
                } transition-colors`}
              >
                {index === 0 && <Home className="w-4 h-4 mr-1 inline" />}
                {crumb.label}
              </a>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Header */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onSidebarToggle}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-neutral-900">Products</h1>
              {!isLoading && (
                <Badge variant="secondary">
                  {totalProducts.toLocaleString()} items
                </Badge>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
              <Button
                variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange({ viewMode: 'grid' })}
                className="rounded-none border-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange({ viewMode: 'list' })}
                className="rounded-none border-none border-l border-neutral-300"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-primary-600 focus:border-transparent cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Active Filters:</span>
            </div>
            
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.key}-${index}`}
                variant="outline"
                className="flex items-center space-x-1 pr-1"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.key, filter.value)}
                  className="ml-1 hover:bg-neutral-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            
            {activeFilters.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-neutral-600 hover:text-primary-600"
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalogHeader
