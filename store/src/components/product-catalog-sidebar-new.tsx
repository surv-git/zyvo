import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from './ui/checkbox'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { Category } from '@/types/api'
import { formatIndianRupees } from '@/lib/currency-utils'
import { 
  X, 
  Filter, 
  Star, 
  Package, 
  Tag, 
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Loader2
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

interface ProductCatalogSidebarProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggle: () => void
  availableCategories: Category[]
  availableBrands: string[]
  priceRange: { min: number; max: number }
  filtersLoading: boolean
}

const ProductCatalogSidebar: React.FC<ProductCatalogSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  isOpen,
  onToggle,
  availableCategories,
  availableBrands,
  priceRange,
  filtersLoading
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true,
    special: true
  })

  // Group categories by parent
  const groupedCategories = React.useMemo(() => {
    const parentCategories = availableCategories.filter(cat => !cat.parent_category)
    const subcategoriesMap = new Map<string, Category[]>()
    
    availableCategories.forEach(cat => {
      if (cat.parent_category) {
        const parentId = cat.parent_category._id || cat.parent_category.name
        if (!subcategoriesMap.has(parentId)) {
          subcategoriesMap.set(parentId, [])
        }
        subcategoriesMap.get(parentId)?.push(cat)
      }
    })

    return parentCategories.map(parent => ({
      parent,
      subcategories: subcategoriesMap.get(parent._id) || []
    }))
  }, [availableCategories])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Calculate active filters count for badge
  const activeFiltersCount = 
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    filters.brand.length +
    (filters.rating ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.priceRange[0] > priceRange.min || filters.priceRange[1] < priceRange.max ? 1 : 0)

  const ratings = [5, 4, 3, 2, 1]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-20 left-0 h-screen lg:h-auto
        w-80 lg:w-72 bg-white border-r border-neutral-200
        transform transition-transform duration-300 ease-in-out
        z-50 lg:z-auto overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {filtersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading filters...</span>
            </div>
          ) : (
            <>
              {/* Categories Section */}
              <div className="border-b border-neutral-200 pb-4">
                <button
                  onClick={() => toggleSection('categories')}
                  className="flex items-center justify-between w-full py-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Categories</span>
                  </div>
                  {expandedSections.categories ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.categories && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {groupedCategories.map((categoryGroup) => (
                      <div key={categoryGroup.parent._id} className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.category === categoryGroup.parent.name}
                            onCheckedChange={(checked) => {
                              onFilterChange({
                                category: checked ? categoryGroup.parent.name : null,
                                subcategory: null // Reset subcategory when category changes
                              })
                            }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {categoryGroup.parent.name}
                          </span>
                        </div>
                        
                        {/* Subcategories */}
                        {categoryGroup.subcategories.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {categoryGroup.subcategories.map((subcategory) => (
                              <div key={subcategory._id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={filters.subcategory === subcategory.name}
                                  onCheckedChange={(checked) => {
                                    onFilterChange({
                                      category: categoryGroup.parent.name,
                                      subcategory: checked ? subcategory.name : null
                                    })
                                  }}
                                />
                                <span className="text-sm text-gray-600">
                                  {subcategory.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands Section */}
              <div className="border-b border-neutral-200 pb-4">
                <button
                  onClick={() => toggleSection('brands')}
                  className="flex items-center justify-between w-full py-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Brands</span>
                  </div>
                  {expandedSections.brands ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.brands && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {availableBrands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.brand.includes(brand)}
                          onCheckedChange={(checked) => {
                            const newBrands = checked
                              ? [...filters.brand, brand]
                              : filters.brand.filter(b => b !== brand)
                            onFilterChange({ brand: newBrands })
                          }}
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="border-b border-neutral-200 pb-4">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full py-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Price Range</span>
                  </div>
                  {expandedSections.price ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.price && (
                  <div className="mt-3 space-y-4">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => onFilterChange({ priceRange: value as [number, number] })}
                      max={priceRange.max}
                      min={priceRange.min}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatIndianRupees(filters.priceRange[0])}</span>
                      <span>{formatIndianRupees(filters.priceRange[1])}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              <div className="border-b border-neutral-200 pb-4">
                <button
                  onClick={() => toggleSection('rating')}
                  className="flex items-center justify-between w-full py-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Rating</span>
                  </div>
                  {expandedSections.rating ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.rating && (
                  <div className="mt-3 space-y-2">
                    {ratings.map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.rating === rating}
                          onCheckedChange={(checked) => {
                            onFilterChange({ rating: checked ? rating : null })
                          }}
                        />
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                          {Array.from({ length: 5 - rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-gray-300" />
                          ))}
                          <span className="text-sm text-gray-600">& above</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Special Filters Section */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection('special')}
                  className="flex items-center justify-between w-full py-2 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Availability & Offers</span>
                  </div>
                  {expandedSections.special ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.special && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.inStock}
                        onCheckedChange={(checked) => {
                          onFilterChange({ inStock: checked })
                        }}
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.onSale}
                        onCheckedChange={(checked) => {
                          onFilterChange({ onSale: checked })
                        }}
                      />
                      <span className="text-sm text-gray-700">On Sale</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ProductCatalogSidebar
