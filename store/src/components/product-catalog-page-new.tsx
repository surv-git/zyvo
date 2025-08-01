"use client"

// 🚨 DEBUG: Component file is being loaded
console.log('🚨 ProductCatalogPage file is being imported/loaded')

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import ProductCatalogSidebar from './product-catalog-sidebar'
import ProductCatalogHeader from './product-catalog-header'
import ProductCatalogGrid from './product-catalog-grid'
import ProductQuickViewModal from './product-quick-view-modal'
import ProductQuickViewVanillaManager from './product-quick-view-vanilla-manager'
import ProductDetailsPage from './product-details-page'
import FooterSection from './footer-one'
import { CompactPageHeader } from '@/components/ui/compact-page-header'
import { CatalogProduct, CatalogService, CatalogFilters } from '@/services/catalog-service'
import { CategoryService } from '@/services/category-service'
import { useCart } from '@/contexts/cart-context'
import { getProductImage } from '@/lib/product-utils'
import { 
  extractProductIdFromSlug, 
  isProductDetailsUrl, 
  extractSlugFromUrl, 
  createProductUrl 
} from '@/lib/slug-utils'
import { Category } from '@/types/api'
import { favoritesManager } from '@/lib/isolated-favorites-manager'
import { toast } from 'sonner'

// Memoize child components to prevent unnecessary re-renders with custom comparison
const MemoizedProductCatalogSidebar = memo(ProductCatalogSidebar, (prevProps, nextProps) => {
  // Custom comparison - only re-render if actual props changed
  const propsEqual = 
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.filtersLoading === nextProps.filtersLoading &&
    JSON.stringify(prevProps.availableCategories) === JSON.stringify(nextProps.availableCategories) &&
    JSON.stringify(prevProps.availableBrands) === JSON.stringify(nextProps.availableBrands) &&
    JSON.stringify(prevProps.brandCounts) === JSON.stringify(nextProps.brandCounts) &&
    JSON.stringify(prevProps.categoryCounts) === JSON.stringify(nextProps.categoryCounts) &&
    JSON.stringify(prevProps.priceRange) === JSON.stringify(nextProps.priceRange)
  
  console.log('🔍 MemoizedProductCatalogSidebar props comparison:', propsEqual ? 'EQUAL - skipping re-render' : 'DIFFERENT - re-rendering')
  return propsEqual
})

const MemoizedProductCatalogHeader = memo(ProductCatalogHeader, (prevProps, nextProps) => {
  // Custom comparison with detailed logging
  const changes = []
  if (JSON.stringify(prevProps.filters) !== JSON.stringify(nextProps.filters)) changes.push('filters')
  if (prevProps.totalProducts !== nextProps.totalProducts) changes.push('totalProducts')
  if (prevProps.currentPage !== nextProps.currentPage) changes.push('currentPage')
  if (prevProps.isLoading !== nextProps.isLoading) changes.push('isLoading')
  if (prevProps.searchQuery !== nextProps.searchQuery) changes.push('searchQuery')
  if (prevProps.onFilterChange !== nextProps.onFilterChange) changes.push('onFilterChange')
  if (prevProps.onClearFilters !== nextProps.onClearFilters) changes.push('onClearFilters')
  if (prevProps.onSidebarToggle !== nextProps.onSidebarToggle) changes.push('onSidebarToggle')
  if (prevProps.onSearchChange !== nextProps.onSearchChange) changes.push('onSearchChange')
  if (JSON.stringify(prevProps.availableCategories) !== JSON.stringify(nextProps.availableCategories)) changes.push('availableCategories')
  
  const propsEqual = changes.length === 0
  console.log('🔍 MemoizedProductCatalogHeader props comparison:', propsEqual ? 'EQUAL - skipping re-render' : `DIFFERENT - re-rendering due to: ${changes.join(', ')}`)
  return propsEqual
})

const MemoizedProductCatalogGrid = memo(ProductCatalogGrid, (prevProps, nextProps) => {
  // Custom comparison with detailed logging
  const changes = []
  if (JSON.stringify(prevProps.products) !== JSON.stringify(nextProps.products)) changes.push('products')
  if (JSON.stringify(prevProps.filters) !== JSON.stringify(nextProps.filters)) changes.push('filters')
  if (prevProps.isLoading !== nextProps.isLoading) changes.push('isLoading')
  if (prevProps.error !== nextProps.error) changes.push('error')
  if (prevProps.totalProducts !== nextProps.totalProducts) changes.push('totalProducts')
  if (prevProps.currentPage !== nextProps.currentPage) changes.push('currentPage')
  if (prevProps.totalPages !== nextProps.totalPages) changes.push('totalPages')
  if (JSON.stringify(prevProps.wishlistItems) !== JSON.stringify(nextProps.wishlistItems)) changes.push('wishlistItems')
  if (prevProps.onPageChange !== nextProps.onPageChange) changes.push('onPageChange')
  if (prevProps.onProductClick !== nextProps.onProductClick) changes.push('onProductClick')
  if (prevProps.onAddToCart !== nextProps.onAddToCart) changes.push('onAddToCart')
  if (prevProps.onToggleWishlist !== nextProps.onToggleWishlist) changes.push('onToggleWishlist')
  
  const propsEqual = changes.length === 0
  console.log('🔍 MemoizedProductCatalogGrid props comparison:', propsEqual ? 'EQUAL - skipping re-render' : `DIFFERENT - re-rendering due to: ${changes.join(', ')}`)
  return propsEqual
})

// Add display names for debugging
MemoizedProductCatalogSidebar.displayName = 'MemoizedProductCatalogSidebar'
MemoizedProductCatalogHeader.displayName = 'MemoizedProductCatalogHeader'
MemoizedProductCatalogGrid.displayName = 'MemoizedProductCatalogGrid'

// Helper function to create a stable key for product comparison
const createProductKey = (product: CatalogProduct): string => {
  const variantsKey = product.variants ? product.variants.map(v => `${v._id}-${v.price}-${v.is_active}`).join('|') : 'no-variants'
  return `${product._id}-${product.updatedAt}-${product.min_price}-${product.min_discounted_price || 'null'}-${variantsKey}`
}

// Helper function to compare catalog products arrays by content, not reference
const catalogProductsEqual = (prev: CatalogProduct[], next: CatalogProduct[]): boolean => {
  console.log('🔍 Comparing products:', { prevLength: prev.length, nextLength: next.length })
  
  if (prev.length !== next.length) {
    console.log('❌ Product arrays different lengths')
    return false
  }
  
  for (let i = 0; i < prev.length; i++) {
    const prevKey = createProductKey(prev[i])
    const nextKey = createProductKey(next[i])
    
    if (prevKey !== nextKey) {
      console.log('❌ Product difference found at index', i, { prevKey, nextKey })
      return false
    }
  }
  
  console.log('✅ Products are identical')
  return true
}

// Transform Catalog Product to Grid Product with Indian Rupees
const transformProduct = (catalogProduct: CatalogProduct): GridProduct => {
  // Use real variants from the API response
  const realVariants = catalogProduct.variants && catalogProduct.variants.length > 0 ? 
    catalogProduct.variants.map(variant => {
      // Create a better display name from SKU code
      let displayName = variant.sku_code || variant.slug || 'Default'
      
      // Extract meaningful parts from SKU (e.g., "LGOLEDC3-SIL-WIF" -> "Silver WiFi")
      if (variant.sku_code) {
        const parts = variant.sku_code.split('-')
        const meaningfulParts = parts.slice(1) // Skip the product code part
        
        // Map common abbreviations to readable names
        const mappings: { [key: string]: string } = {
          'SIL': 'Silver',
          'BLU': 'Blue', 
          'RED': 'Red',
          'WHI': 'White',
          'BLA': 'Black',
          'WIF': 'WiFi',
          'WIR': 'Wired',
          'USB': 'USB',
          'BT': 'Bluetooth'
        }
        
        const readableParts = meaningfulParts.map(part => 
          mappings[part.toUpperCase()] || part
        )
        
        if (readableParts.length > 0) {
          displayName = readableParts.join(' ')
        }
      }
      
      return {
        id: variant._id, // Use the actual variant ID from database
        name: displayName, // Use formatted name
        price: variant.calculated_discount_price || variant.price,
        inStock: variant.is_active // Use is_active as stock status
      }
    }) : undefined

  return {
    id: catalogProduct._id,
    name: catalogProduct.name,
    description: catalogProduct.description,
    price: catalogProduct.min_discounted_price || catalogProduct.min_price,
    originalPrice: catalogProduct.min_discounted_price ? catalogProduct.min_price : undefined,
    rating: catalogProduct.score,
    reviewCount: Math.floor(Math.random() * 100) + 10, // Mock review count
    image: getProductImage(catalogProduct.images, catalogProduct._id),
    images: catalogProduct.images || [], // Include the full images array
    category: typeof catalogProduct.category_id === 'object' && catalogProduct.category_id && 'name' in catalogProduct.category_id
      ? catalogProduct.category_id.name
      : typeof catalogProduct.category_id === 'string' 
      ? catalogProduct.category_id 
      : 'Unknown',
    brand: typeof catalogProduct.brand_id === 'object' && catalogProduct.brand_id && 'name' in catalogProduct.brand_id
      ? catalogProduct.brand_id.name
      : typeof catalogProduct.brand_id === 'string' 
      ? catalogProduct.brand_id 
      : 'Unknown',
    inStock: catalogProduct.variants ? catalogProduct.variants.some(v => v.is_active) : true, // Check if any variant is active
    onSale: !!catalogProduct.min_discounted_price || catalogProduct.variants?.some(v => v.discount_details.is_on_sale),
    isNew: new Date(catalogProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    variants: realVariants // Now includes real variant data from API
  }
}

interface GridProduct {
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
  category: string | null // Store category ID, but for display use category name when needed
  subcategory: string | null
  brand: string[]
  priceRange: [number, number]
  rating: number | null
  inStock: boolean
  onSale: boolean
  sortBy: string
  viewMode: 'grid' | 'list'
}

const ProductCatalogPage: React.FC = memo(() => {
  // Re-render counter to track unnecessary re-renders
  const renderCount = useRef(0)
  renderCount.current += 1
  
  // 🚨 VERY FIRST LINE - Component function is executing
  console.log('🚨🚨🚨 ProductCatalogPage COMPONENT FUNCTION IS EXECUTING - THIS SHOULD ALWAYS SHOW')
  console.log('🎬 ProductCatalogPage component is mounting/rendering - Render #', renderCount.current)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Cart context
  const { addToCart } = useCart()
  
  // Raw catalog products from API (for memoization)
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Favorites - use isolated manager instead of context
  const [wishlistItems, setWishlistItems] = useState<string[]>(() => favoritesManager.getAllFavorites())
  
  // Update wishlist when favorites change
  useEffect(() => {
    const updateWishlist = () => {
      setWishlistItems(favoritesManager.getAllFavorites())
    }
    
    // Listen for any favorite changes
    const handleFavoriteChange = () => {
      updateWishlist()
    }
    
    // Use a simple event listener approach
    window.addEventListener('favoriteChanged', handleFavoriteChange)
    updateWishlist() // Initial sync
    
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange)
    }
  }, [])
  
  // Product details view state (keep this as it's for full page navigation)
  const [detailsProduct, setDetailsProduct] = useState<GridProduct | null>(null)
  const [showDetailsPage, setShowDetailsPage] = useState(false)
  
  // Quick view modal state
  const [quickViewProduct, setQuickViewProduct] = useState<GridProduct | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  
  // Dynamic filter options
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [brandCounts, setBrandCounts] = useState<{ [key: string]: number }>({})
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({})
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 })
  const [filtersLoading, setFiltersLoading] = useState(true)
  
  // Brand ID mapping - to convert brand names to brand IDs for API calls
  const [brandIdMap, setBrandIdMap] = useState<{ [brandName: string]: string }>({})
  
  // Ref to track current products for comparison without causing re-renders
  const currentProductsRef = useRef<CatalogProduct[]>([])
  
  const totalPages = Math.ceil(totalProducts / 20)

  // Memoized products transformation - now stable since we prevent unnecessary updates
  const products = useMemo(() => {
    console.log('🔄 Transforming products (memoized):', catalogProducts.length, 'products')
    
    // Create a stable hash of the products for debugging
    const productHash = catalogProducts.map(createProductKey).join('|')
    console.log('📝 Product hash:', productHash.substring(0, 100) + '...')
    
    return catalogProducts.map(transformProduct)
  }, [catalogProducts])
  
  // Stabilize products array to prevent child re-renders
  const stableProducts = useMemo(() => products, [products])

  // Track when products actually change vs when React thinks they changed
  const previousProductsRef = useRef<string>('')
  const previousProductsLengthRef = useRef<number>(0)
  
  useEffect(() => {
    const currentHash = catalogProducts.map(p => `${p._id}-${p.updatedAt}-${p.min_price}-${p.min_discounted_price}`).join('|')
    const currentLength = catalogProducts.length
    
    if (previousProductsRef.current !== currentHash || previousProductsLengthRef.current !== currentLength) {
      console.log('✅ Products actually changed:', {
        lengthChanged: previousProductsLengthRef.current !== currentLength,
        contentChanged: previousProductsRef.current !== currentHash,
        previousLength: previousProductsLengthRef.current,
        currentLength: currentLength
      })
      previousProductsRef.current = currentHash
      previousProductsLengthRef.current = currentLength
    } else {
      console.log('⚠️ Products data identical, but React re-rendered component')
    }
  }, [catalogProducts])

  const [filters, setFilters] = useState<FilterState>({
    category: null, // Will be set after categories are loaded from URL
    subcategory: searchParams.get('subcategory'),
    brand: [],
    priceRange: [0, 100000],
    rating: null,
    inStock: false,
    onSale: false,
    sortBy: 'relevance',
    viewMode: 'grid'
  })

  // Handle URL routing for product details
  useEffect(() => {
    if (isProductDetailsUrl(pathname)) {
      const slug = extractSlugFromUrl(pathname)
      if (slug) {
        const productId = extractProductIdFromSlug(slug)
        if (productId && stableProducts.length > 0) {
          // Find product by ID (using the short ID match)
          const product = stableProducts.find(p => p.id.endsWith(productId))
          if (product) {
            setDetailsProduct(product)
            setShowDetailsPage(true)
          } else {
            // Product not found, redirect to catalog
            router.push('/products')
          }
        }
      }
    } else {
      // Not a product details URL, ensure we're showing catalog
      if (showDetailsPage) {
        setShowDetailsPage(false)
        setDetailsProduct(null)
      }
    }
  }, [pathname, stableProducts, router, showDetailsPage])

  // Update search query from URL params
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search')
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery)
    }
  }, [searchParams])

  // Debug: Log all state values to identify what's causing re-renders
  console.log('📊 Current state snapshot:', {
    catalogProductsLength: catalogProducts.length,
    loading,
    error: !!error,
    totalProducts,
    currentPage,
    filtersCategory: filters.category,
    filtersBrandLength: filters.brand.length,
    availableCategoriesLength: availableCategories.length,
    brandIdMapLength: Object.keys(brandIdMap).length,
    showDetailsPage,
    filtersLoading
  })

  // 🎯 DETAILED RE-RENDER ANALYSIS
  const previousStateRef = useRef<Record<string, string | number | boolean>>({})
  const currentState = {
    catalogProductsLength: catalogProducts.length,
    loading,
    error: !!error,
    totalProducts,
    currentPage,
    filtersStr: JSON.stringify(filters),
    availableCategoriesLength: availableCategories.length,
    brandIdMapLength: Object.keys(brandIdMap).length,
    showDetailsPage,
    filtersLoading,
    sidebarOpen,
    searchQuery,
    wishlistItemsLength: wishlistItems.length
  }
  
  // Compare with previous state to see what changed
  const stateChanges = []
  for (const [key, value] of Object.entries(currentState)) {
    if (previousStateRef.current[key] !== value) {
      stateChanges.push(`${key}: ${previousStateRef.current[key]} → ${value}`)
    }
  }
  
  if (stateChanges.length > 0) {
    console.log('🔄 State changes causing this re-render:', stateChanges)
  } else {
    console.log('⚠️ Re-render occurred but NO state changes detected - this indicates a React optimization issue')
  }
  
  previousStateRef.current = currentState

  // Fetch dynamic filter options
  useEffect(() => {
    console.log('🔄 STARTING fetchFilterOptions useEffect')
    
    const fetchFilterOptions = async () => {
      try {
        console.log('🚀 fetchFilterOptions function called')
        setFiltersLoading(true)
        
        // Fetch categories
        console.log('📂 Fetching categories...')
        const categories = await CategoryService.getAllCategories()
        console.log('📂 Categories fetched:', categories)
        setAvailableCategories(categories)

        // Build basic filter for counts - use max allowed limit
        const basicFilters: CatalogFilters = {
          limit: 50, // Maximum allowed by API
          page: 1,
        }
        
        console.log('🔍 About to fetch products with filters:', basicFilters)

        // Fetch products to calculate brand counts (using max allowed sample)
        const response = await CatalogService.getProducts(basicFilters)
        
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.error('Invalid API response structure:', response)
          throw new Error('Invalid API response structure')
        }
        
        const allProducts = response.data
        
        if (allProducts.length === 0) {
          console.warn('No products returned from API')
          // Set empty states but don't throw error
          setAvailableBrands([])
          setBrandCounts({})
          setCategoryCounts({})
          setPriceRange({ min: 0, max: 100000 })
          return
        }
        
        console.log('Debug: API Response for filters (sample):', {
          totalProducts: allProducts.length,
          firstProduct: allProducts[0],
          sampleProductStructure: allProducts[0] ? {
            brand_id: allProducts[0].brand_id,
            category_id: allProducts[0].category_id,
            brand_id_type: typeof allProducts[0].brand_id,
            category_id_type: typeof allProducts[0].category_id
          } : null
        })
        
        // Extract unique brands and calculate counts
        const brandMap = new Map<string, number>()
        const categoryMap = new Map<string, number>()
        const brandIdMapping = new Map<string, string>() // Map brand names to brand IDs
        let minPrice = Infinity
        let maxPrice = 0

        allProducts.forEach((product, index) => {
          // Log every product to see what's happening
          console.log(`Processing product ${index + 1}:`, {
            name: product.name,
            brand_id: product.brand_id,
            category_id: product.category_id,
            brand_id_type: typeof product.brand_id,
            category_id_type: typeof product.category_id,
            brand_id_keys: product.brand_id && typeof product.brand_id === 'object' ? Object.keys(product.brand_id) : 'not-object',
            category_id_keys: product.category_id && typeof product.category_id === 'object' ? Object.keys(product.category_id) : 'not-object',
            full_product: index === 0 ? product : 'skipped' // Show full first product
          })
          
          // Brand processing - handle multiple possible structures and extract ID
          let brand = 'Unknown'
          let brandId = ''
          if (product.brand_id) {
            console.log(`Product ${index + 1} brand_id processing:`, {
              brand_id: product.brand_id,
              isString: typeof product.brand_id === 'string',
              isObject: typeof product.brand_id === 'object',
              isNull: product.brand_id === null,
              hasName: product.brand_id && typeof product.brand_id === 'object' && 'name' in product.brand_id
            })
            
            // Try different possible structures
            if (typeof product.brand_id === 'string') {
              brandId = product.brand_id
              brand = product.brand_id // If it's already a string ID, use it as the name too
              console.log(`Product ${index + 1} brand from string:`, brand)
            } else if (typeof product.brand_id === 'object' && product.brand_id !== null) {
              // Use the known structure from the interface
              brand = product.brand_id.name || 'Unknown'
              brandId = product.brand_id._id || ''
              console.log(`Product ${index + 1} brand from object:`, { name: brand, id: brandId })
            }
          } else {
            console.log(`Product ${index + 1} has no brand_id`)
          }
          
          console.log(`Product ${index + 1} final extracted brand:`, { name: brand, id: brandId })
          
          if (brand && brand !== 'Unknown' && brand.trim() !== '') {
            brandMap.set(brand, (brandMap.get(brand) || 0) + 1)
            // Store the brand name to ID mapping
            if (brandId) {
              brandIdMapping.set(brand, brandId)
              console.log(`Product ${index + 1} brand ID mapping stored:`, { name: brand, id: brandId })
            }
            console.log(`Product ${index + 1} added to brandMap:`, brand, 'count:', brandMap.get(brand))
          } else {
            console.log(`Product ${index + 1} brand not added:`, { brand, isUnknown: brand === 'Unknown', isEmpty: brand.trim() === '' })
          }

          // Category processing - handle multiple possible structures
          let category = 'Unknown'
          if (product.category_id) {
            console.log(`Product ${index + 1} category_id processing:`, {
              category_id: product.category_id,
              isString: typeof product.category_id === 'string',
              isObject: typeof product.category_id === 'object',
              isNull: product.category_id === null,
              hasName: product.category_id && typeof product.category_id === 'object' && 'name' in product.category_id
            })
            
            // Try different possible structures
            if (typeof product.category_id === 'string') {
              category = product.category_id
              console.log(`Product ${index + 1} category from string:`, category)
            } else if (typeof product.category_id === 'object' && product.category_id !== null) {
              // Use the known structure from the interface
              category = product.category_id.name || 'Unknown'
              console.log(`Product ${index + 1} category from object:`, category, 'raw name:', product.category_id.name)
            }
          } else {
            console.log(`Product ${index + 1} has no category_id`)
          }
          
          console.log(`Product ${index + 1} final extracted category:`, category)
          
          if (category && category !== 'Unknown' && category.trim() !== '') {
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
            console.log(`Product ${index + 1} added to categoryMap:`, category, 'count:', categoryMap.get(category))
          } else {
            console.log(`Product ${index + 1} category not added:`, { category, isUnknown: category === 'Unknown', isEmpty: category.trim() === '' })
          }

          // Price range processing - use the known price fields
          const price = product.min_discounted_price || product.min_price || 0
          console.log(`Product ${index + 1} price:`, { price, min_discounted_price: product.min_discounted_price, min_price: product.min_price })
                       
          if (price > 0) {
            if (price < minPrice) minPrice = price
            if (price > maxPrice) maxPrice = price
          }
        })

        console.log('Debug: Final counts and arrays:', {
          brandMapSize: brandMap.size,
          categoryMapSize: categoryMap.size,
          brandMapEntries: Object.fromEntries(brandMap),
          categoryMapEntries: Object.fromEntries(categoryMap),
          brandMapKeys: Array.from(brandMap.keys()),
          categoryMapKeys: Array.from(categoryMap.keys()),
          brandIdMappingSize: brandIdMapping.size,
          brandIdMappingEntries: Object.fromEntries(brandIdMapping),
          priceRange: { minPrice, maxPrice },
          uniqueBrandsLength: Array.from(brandMap.keys()).length,
          uniqueCategoriesLength: Array.from(categoryMap.keys()).length
        })

        // Convert to arrays and objects
        const uniqueBrands = Array.from(brandMap.keys()).sort()
        const brandCounts = Object.fromEntries(brandMap)
        const categoryCounts = Object.fromEntries(categoryMap)
        const brandNameToIdMap = Object.fromEntries(brandIdMapping)

        console.log('Debug: About to set state with:', {
          uniqueBrands,
          uniqueBrandsLength: uniqueBrands.length,
          brandCounts,
          brandCountsKeys: Object.keys(brandCounts),
          categoryCounts,
          categoryCountsKeys: Object.keys(categoryCounts),
          brandNameToIdMap,
          brandIdMapSize: Object.keys(brandNameToIdMap).length,
          priceRange: { 
            min: minPrice === Infinity ? 0 : Math.floor(minPrice),
            max: maxPrice === 0 ? 100000 : Math.ceil(maxPrice)
          }
        })

        setAvailableBrands(uniqueBrands)
        setBrandCounts(brandCounts)
        setCategoryCounts(categoryCounts)
        setBrandIdMap(brandNameToIdMap)
        setPriceRange({ 
          min: minPrice === Infinity ? 0 : Math.floor(minPrice),
          max: maxPrice === 0 ? 100000 : Math.ceil(maxPrice)
        })

      } catch (error) {
        console.error('❌ Failed to fetch filter options:', error)
      } finally {
        console.log('✅ fetchFilterOptions completed, setting filtersLoading to false')
        setFiltersLoading(false)
      }
    }

    console.log('🎯 About to call fetchFilterOptions()')
    fetchFilterOptions()
  }, []) // Run only on mount to avoid infinite loops

  // Map URL category name to ID once categories are loaded
  useEffect(() => {
    if (availableCategories.length > 0) {
      const categoryFromUrl = searchParams.get('category')
      
      console.log('🔧 Category mapping check:', {
        categoryFromUrl,
        currentCategory: filters.category,
        availableCategoriesCount: availableCategories.length
      })
      
      // If we have a category name from URL but no category ID set yet
      if (categoryFromUrl && !filters.category) {
        console.log('🔧 Processing URL category:', categoryFromUrl)
        
        // Find the category by name (case insensitive)
        const selectedCategory = availableCategories.find(cat => 
          cat.name.toLowerCase() === categoryFromUrl.toLowerCase()
        )
        
        if (selectedCategory) {
          console.log('🔧 ✅ Mapping URL category name to ID:', { name: categoryFromUrl, id: selectedCategory._id })
          setFilters(prev => ({ 
            ...prev, 
            category: selectedCategory._id
          }))
        } else {
          console.warn('⚠️ ❌ URL category name not found in available categories:', categoryFromUrl)
          console.warn('⚠️ Available category names:', availableCategories.map(cat => cat.name))
          // Clear invalid category
          setFilters(prev => ({ ...prev, category: null }))
        }
      } else if (categoryFromUrl && filters.category) {
        console.log('🔧 Category already set from URL:', { categoryFromUrl, currentCategory: filters.category })
      } else if (!categoryFromUrl && filters.category) {
        console.log('🔧 No URL category but filter category exists:', filters.category)
      }
    }
  }, [availableCategories, filters.category, searchParams])

  // Detailed change tracking for debugging
  useEffect(() => {
    const currentHash = catalogProducts.map(p => `${p._id}-${p.updatedAt}-${p.min_price}-${p.min_discounted_price}`).join('|')
    const currentLength = catalogProducts.length
    
    console.log('📊 CatalogProducts changed:', {
      length: currentLength,
      hash: currentHash.substring(0, 50) + '...',
      firstProduct: catalogProducts[0]?.name || 'none'
    })
    
    // Check if this is actually different from the last time
    if (currentHash === previousHash.current && currentLength === previousLength.current) {
      console.log('⚠️ Products data identical, but React re-rendered component - this indicates a reference change issue')
    } else {
      console.log('✅ Products data actually changed')
      previousHash.current = currentHash
      previousLength.current = currentLength
    }
  }, [catalogProducts])

  // Store previous values for comparison  
  const previousHash = useRef('')
  const previousLength = useRef(0)

  // Fetch products when filters change
  useEffect(() => {
    console.log('🎯 fetchProducts useEffect triggered by dependency change')
    console.log('🎯 Current dependencies:', { 
      filters, 
      currentPage, 
      searchQuery, 
      availableCategoriesLength: availableCategories.length,
      brandIdMapKeys: Object.keys(brandIdMap).length
    })
    
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const catalogFilters: CatalogFilters = {
          // Only include basic pagination and supported filters
          limit: 20,
          page: currentPage,
        }

        // Add search query if provided (if API supports it)
        if (searchQuery) {
          catalogFilters.search = searchQuery
        }

        // Add category filter - map category name to category ID
        if (filters.category) {
          console.log('🏷️ Attempting to map category:', filters.category)
          console.log('🏷️ Available categories:', availableCategories.map(cat => ({ name: cat.name, id: cat._id })))
          
          // Check if it's already an ID format
          const isIdFormat = filters.category.match(/^[a-f\d]{24}$/i)
          if (isIdFormat) {
            // Already an ID, use directly
            catalogFilters.category = filters.category
            console.log('🏷️ ✅ Using category ID directly:', filters.category)
          } else {
            // It's a name, need to map to ID
            const selectedCategory = availableCategories.find(cat => cat.name === filters.category)
            if (selectedCategory) {
              catalogFilters.category = selectedCategory._id
              console.log('🏷️ ✅ Mapped category name to ID:', { name: filters.category, id: selectedCategory._id })
            } else {
              console.warn('⚠️ ❌ Category not found in availableCategories:', filters.category)
              console.warn('⚠️ Available category names:', availableCategories.map(cat => cat.name))
              // Don't add the category filter if we can't map it - this prevents API errors
              console.log('🚫 Skipping category filter to prevent API error')
            }
          }
        }

        // Add brand filter - map multiple brand names to brand IDs
        if (filters.brand.length > 0) {
          // Find the brand IDs from the brand name mapping for all selected brands
          const brandIds = filters.brand.map(brandName => {
            const brandId = brandIdMap[brandName]
            if (brandId) {
              console.log('🏷️ Mapped brand name to ID:', { name: brandName, id: brandId })
              return brandId
            } else {
              console.warn('⚠️ Brand ID not found for brand name:', brandName, 'Available mappings:', brandIdMap)
              return null
            }
          }).filter(Boolean) as string[]
          
          if (brandIds.length > 0) {
            catalogFilters.brand = brandIds // Send as array - service will join with commas
            console.log('🏷️ Sending brand IDs to API:', brandIds)
          }
        }

        // REMOVED: All unsupported parameters that might cause API inconsistencies
        // - subcategory, minPrice, maxPrice, rating, inStock, onSale, sortBy, sortOrder
        // The API endpoint only accepts category_id and brand_id according to user feedback

        // Debug: Log the filters being applied
        console.log('Applied filters (UI):', filters)
        console.log('Catalog filters sent to API (cleaned):', catalogFilters)

        // Validate that we have valid parameters before making the API call
        if (catalogFilters.category && !catalogFilters.category.match(/^[a-f\d]{24}$/i)) {
          console.error('❌ Invalid category ID format:', catalogFilters.category)
          throw new Error('Invalid category ID - expected MongoDB ObjectId format')
        }

        const response = await CatalogService.getProducts(catalogFilters)
        
        // Debug: Log the API response
        console.log('API Response:', {
          totalItems: response.pagination.totalItems,
          currentPage: response.pagination.currentPage,
          productsCount: response.data.length,
          firstProduct: response.data[0]?.name
        })
        
        // Only update catalog products if content actually changed
        if (!catalogProductsEqual(currentProductsRef.current, response.data)) {
          console.log('📦 API returned different products - updating state')
          setCatalogProducts(response.data)
          currentProductsRef.current = response.data
        } else {
          console.log('📦 API returned identical products - skipping state update')
        }
        
        setTotalProducts(response.pagination.totalItems)

      } catch (error) {
        console.error('Failed to fetch products:', error)
        setError('Failed to load products. Please try again.')
        
        // On error, don't update products - keep current state to prevent unnecessary re-renders
        console.log('📦 API error occurred - keeping current products to prevent re-render')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters, currentPage, searchQuery, availableCategories, brandIdMap]) // Back to original dependencies

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    console.log('Filter change requested:', newFilters)
    
    setFilters(prev => {
      console.log('Previous filters:', prev)
      const updated = { ...prev, ...newFilters }
      console.log('Updated filters:', updated)
      
      // Check if filters actually changed by content, not reference
      const filtersChanged = JSON.stringify(prev) !== JSON.stringify(updated)
      if (!filtersChanged) {
        console.log('🔄 Filters content identical, returning previous reference to prevent re-render')
        return prev // Return previous reference if content is the same
      }
      
      console.log('🔄 Filters content changed, returning new filters object')
      return updated
    })
    setCurrentPage(1)
  }, []) // Stable reference - access filters via prev parameter

  const clearFilters = useCallback(() => {
    setFilters({
      category: null,
      subcategory: null,
      brand: [],
      priceRange: [priceRange.min, priceRange.max],
      rating: null,
      inStock: false,
      onSale: false,
      sortBy: 'relevance',
      viewMode: 'grid'
    })
    setCurrentPage(1)
  }, [priceRange.min, priceRange.max])

  // Stabilize sidebar toggle callback
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // Stabilize page change callback  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Stabilize search change callback
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleProductClick = useCallback((product: GridProduct, viewType: 'quickView' | 'details' = 'quickView') => {
    if (viewType === 'details') {
      const productUrl = createProductUrl(product.name, product.id)
      router.push(productUrl)
    } else {
      // Open quick view modal
      setQuickViewProduct(product)
      setShowQuickView(true)
    }
  }, [router])

  const handleDetailsBack = useCallback(() => {
    router.push('/products')
  }, [router])

  const handleViewDetails = useCallback((product: GridProduct) => {
    const productUrl = createProductUrl(product.name, product.id)
    router.push(productUrl)
  }, [router])

  const handleCloseQuickView = useCallback(() => {
    setShowQuickView(false)
    setQuickViewProduct(null)
  }, [])

  const handleQuickViewDetails = useCallback((product: GridProduct) => {
    const productUrl = createProductUrl(product.name, product.id)
    router.push(productUrl)
  }, [router])

  const handleAddToCart = useCallback(async (product: GridProduct, variant?: { id: string; name?: string }, quantity: number = 1) => {
    try {
      // Only proceed if we have a valid variant ID from actual product variants
      if (!variant?.id) {
        console.error('No valid variant ID provided for adding to cart')
        toast.error('Unable to add to cart', {
          description: 'Please select a valid product variant.'
        })
        return
      }
      
      // Use cart context to add to cart (this will update the cart state and count)
      await addToCart({
        product_variant_id: variant.id,
        quantity
      })
      
      // Show success toast
      toast.success('Added to cart!', {
        description: `${product.name}${variant.name ? ` (${variant.name})` : ''} × ${quantity}`
      })
      
      console.log('Added to cart:', { 
        product: product.name, 
        variant: variant.name || 'Default', 
        quantity 
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart', {
        description: 'Please try again later.'
      })
    }
  }, [addToCart])

  const handleToggleWishlist = useCallback(async (productId: string) => {
    try {
      await favoritesManager.toggleFavorite(productId, true) // Always use product_id for catalog
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [])

  // Wrapper functions for ProductQuickViewVanillaManager
  const handleVanillaAddToCart = useCallback((productId: string, variantId: string, quantity: number) => {
    // Find the product from our current products state
    const product = stableProducts.find(p => p.id === productId)
    if (product) {
      handleAddToCart(product, { id: variantId }, quantity)
    }
  }, [stableProducts, handleAddToCart])

  const handleVanillaViewDetails = useCallback((productId: string) => {
    // Find the product from our current products state
    const product = stableProducts.find(p => p.id === productId)
    if (product) {
      handleViewDetails(product)
    }
  }, [stableProducts, handleViewDetails])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 relative">
      {/* Conditional rendering: Show either catalog or product details */}
      {showDetailsPage && detailsProduct ? (
        <ProductDetailsPage
          product={detailsProduct}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlistItems={wishlistItems}
          onBack={handleDetailsBack}
          recommendedProducts={stableProducts.slice(0, 4)} // Show first 4 products as recommendations
          onProductClick={(product) => handleProductClick(product, 'details')}
        />
      ) : (
        <>
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-100/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Page Header Section - Compact for non-home pages with proper margin for sticky header */}
          <section className="pt-24 pb-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 relative z-10">
            <div className="max-w-full mx-auto text-center lg:px-36 px-4">
              <CompactPageHeader
                badge="Discover & Shop"
                title="Product Catalog"
                subtitle="Explore our extensive collection of premium products with advanced filters and search"
              />
            </div>
          </section>

          {/* Main Catalog Content */}
          <section className="pt-8 pb-20 relative z-10">
            <div className="max-w-full mx-auto lg:px-36 px-4">
              <div className="flex gap-8">
                {/* Sidebar */}
                <div className="hidden lg:block w-80 shrink-0">
                  <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-neutral-200/50 overflow-hidden backdrop-blur-sm bg-white/90">
                    <MemoizedProductCatalogSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={clearFilters}
                      isOpen={sidebarOpen}
                      onToggle={handleSidebarToggle}
                      availableCategories={availableCategories}
                      availableBrands={availableBrands}
                      brandCounts={brandCounts}
                      categoryCounts={categoryCounts}
                      priceRange={priceRange}
                      filtersLoading={filtersLoading}
                    />
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-[calc(100vh-12rem)]">
                  {/* Header */}
                  <div className="bg-white rounded-2xl shadow-lg border border-neutral-200/50 mb-6 overflow-hidden backdrop-blur-sm bg-white/95">
                    <MemoizedProductCatalogHeader
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={clearFilters}
                      totalProducts={totalProducts}
                      currentPage={currentPage}
                      isLoading={loading}
                      onSidebarToggle={handleSidebarToggle}
                      searchQuery={searchQuery}
                      onSearchChange={handleSearchChange}
                      availableCategories={availableCategories}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl shadow-lg border border-neutral-200/50 overflow-hidden backdrop-blur-sm bg-white/95">
                    <div className="p-6">
                      <MemoizedProductCatalogGrid
                        products={stableProducts}
                        filters={filters}
                        isLoading={loading}
                        error={error}
                        totalProducts={totalProducts}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onProductClick={handleProductClick}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        wishlistItems={wishlistItems}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Footer */}
          <FooterSection />
        </>
      )}

      {/* Vanilla Modal Manager - Sets up global modal system without React state */}
      <ProductQuickViewVanillaManager
        onAddToCart={handleVanillaAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onViewDetails={handleVanillaViewDetails}
        wishlistItems={wishlistItems}
      />

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={showQuickView}
        onClose={handleCloseQuickView}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onViewDetails={handleQuickViewDetails}
        wishlistItems={wishlistItems}
      />
    </div>
  )
})

ProductCatalogPage.displayName = 'ProductCatalogPage'

export default ProductCatalogPage
