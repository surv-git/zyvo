import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from './ui/checkbox'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { CategoryService } from '@/services/category-service'
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
  RotateCcw
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
  brandCounts: { [key: string]: number }
  categoryCounts: { [key: string]: number }
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
  brandCounts,
  categoryCounts,
  priceRange,
  filtersLoading
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true,
    features: true
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

  const ratings = [5, 4, 3, 2, 1]

  const activeFiltersCount = 
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    filters.brand.length + 
    (filters.rating ? 1 : 0) + 
    (filters.inStock ? 1 : 0) + 
    (filters.onSale ? 1 : 0) +
    (filters.priceRange[0] > priceRange.min || filters.priceRange[1] < priceRange.max ? 1 : 0)

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
        fixed lg:relative top-20 lg:top-0 bottom-0 lg:inset-y-0 left-0 z-50 lg:z-0
        w-80 bg-white shadow-xl lg:shadow-none border-r border-neutral-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-[calc(100vh-5rem)] lg:h-full
      `}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
              {activeFiltersCount > 0 && (
                <Badge className="bg-primary-600 text-white">
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
                  className="text-neutral-600 hover:text-primary-600"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden text-neutral-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Categories */}
          <div>
            <button
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-primary-600" />
                Categories
              </h3>
              {expandedSections.categories ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {expandedSections.categories && (
              <div className="space-y-2">
                {filtersLoading ? (
                  <div className="text-sm text-neutral-500">Loading categories...</div>
                ) : (
                  groupedCategories.map((categoryGroup) => (
                    <div key={categoryGroup.parent._id}>
                      {/* Parent Category */}
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <Checkbox
                            checked={filters.category === categoryGroup.parent._id}
                            onCheckedChange={(checked: boolean) => {
                              onFilterChange({
                                category: checked ? categoryGroup.parent._id : null
                              })
                            }}
                          />
                          <span className="text-sm font-medium text-neutral-700">{categoryGroup.parent.name}</span>
                        </label>
                        <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                          {categoryCounts[categoryGroup.parent.name] || 0}
                        </Badge>
                      </div>
                      
                      {/* Subcategories */}
                      {categoryGroup.subcategories.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {categoryGroup.subcategories.slice(0, 3).map((subcategory) => (
                            <div key={subcategory._id} className="flex items-center justify-between">
                              <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                <Checkbox
                                  checked={filters.subcategory === subcategory.name}
                                  onCheckedChange={(checked: boolean) => {
                                    onFilterChange({
                                      subcategory: checked ? subcategory.name : null
                                    })
                                  }}
                                />
                                <span className="text-xs text-neutral-600">{subcategory.name}</span>
                              </label>
                              <Badge variant="outline" className="text-xs bg-neutral-50 text-neutral-500 border-neutral-200">
                                {categoryCounts[subcategory.name] || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Brands */}
          <div>
            <button
              onClick={() => toggleSection('brands')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-secondary-600" />
                Brands
              </h3>
              {expandedSections.brands ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {expandedSections.brands && (
              <div className="space-y-2">
                {filtersLoading ? (
                  <div className="text-sm text-neutral-500">Loading brands...</div>
                ) : (
                  availableBrands.map((brand) => (
                    <div key={brand} className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer flex-1">
                        <Checkbox
                          checked={filters.brand.includes(brand)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              onFilterChange({
                                brand: [...filters.brand, brand]
                              })
                            } else {
                              onFilterChange({
                                brand: filters.brand.filter(b => b !== brand)
                              })
                            }
                          }}
                        />
                        <span className="text-sm text-neutral-700">{brand}</span>
                      </label>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100">
                        {brandCounts[brand] || 0}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-accent-600" />
                Price Range
              </h3>
              {expandedSections.price ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value: number[]) => onFilterChange({ priceRange: value as [number, number] })}
                    max={priceRange.max}
                    min={priceRange.min}
                    step={100}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>{formatIndianRupees(filters.priceRange[0])}</span>
                  <span>{formatIndianRupees(filters.priceRange[1])}</span>
                </div>
                <div className="flex items-center justify-center text-xs text-neutral-500">
                  Range: {formatIndianRupees(priceRange.min)} - {formatIndianRupees(priceRange.max)}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center">
                <Star className="w-4 h-4 mr-2 text-secondary-600" />
                Customer Rating
              </h3>
              {expandedSections.rating ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {expandedSections.rating && (
              <div className="space-y-2">
                {ratings.map((rating) => (
                  <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.rating === rating}
                      onCheckedChange={(checked: boolean) => {
                        onFilterChange({
                          rating: checked ? rating : null
                        })
                      }}
                    />
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-secondary-400 text-secondary-400" />
                      ))}
                      {Array.from({ length: 5 - rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-neutral-300" />
                      ))}
                      <span className="text-sm text-neutral-600 ml-1">& Up</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <button
              onClick={() => toggleSection('availability')}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-accent-600" />
                Availability
              </h3>
              {expandedSections.availability ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {expandedSections.availability && (
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.inStock}
                    onCheckedChange={(checked: boolean) => onFilterChange({ inStock: !!checked })}
                  />
                  <span className="text-sm text-neutral-700">In Stock Only</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.onSale}
                    onCheckedChange={(checked: boolean) => onFilterChange({ onSale: !!checked })}
                  />
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-neutral-700">On Sale</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="w-full"
            disabled={activeFiltersCount === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      </div>
    </>
  )
}

export default ProductCatalogSidebar
