"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProductDetailsPage from './product-details-page'
import { CatalogService } from '@/services/catalog-service'
import { getProductImage } from '@/lib/product-utils'

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
    details?: {
      sku: string
      slug: string
      weight: {
        value: number
        unit: string
      }
      dimensions: {
        length: number
        width: number
        height: number
        unit: string
      }
      images: string[]
      discountDetails: {
        price: number | null
        percentage: number | null
        end_date: string | null
        is_on_sale: boolean
      }
    }
  }>
}

interface ProductDetailsWrapperProps {
  productId: string
  slug: string
}

const ProductDetailsWrapper: React.FC<ProductDetailsWrapperProps> = ({ productId, slug }) => {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [wishlistItems, setWishlistItems] = useState<string[]>([])

  useEffect(() => {
    fetchProduct()
    fetchRecommendedProducts()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Looking for product with ID:', productId)
      
      // Use the new getProductById method
      const response = await CatalogService.getProductById(productId)
      
      console.log('API response:', response)
      
      if (response.success && response.data) {
        const catalogProduct = response.data
        console.log('Product found:', catalogProduct.name)
        console.log('Raw prices:', {
          min_price: catalogProduct.min_price, 
          min_discounted_price: catalogProduct.min_discounted_price,
          min_price_type: typeof catalogProduct.min_price,
          min_discounted_price_type: typeof catalogProduct.min_discounted_price
        })
        
        // Parse prices safely
        const minPrice = parseFloat(String(catalogProduct.min_price)) || 0
        const minDiscountedPrice = catalogProduct.min_discounted_price ? parseFloat(String(catalogProduct.min_discounted_price)) : null
        
        console.log('Parsed prices:', { minPrice, minDiscountedPrice })
        console.log('Variants data:', catalogProduct.variants)
        
        // Helper function to generate variant name from SKU
        const generateVariantName = (sku: string): string => {
          // Extract meaningful parts from SKU like "LGOLEDC3-SIL-WIF" or "LGOLEDC3-BLU-WIR"
          const parts = sku.split('-')
          if (parts.length >= 3) {
            const color = parts[1]?.toLowerCase()
            const connectivity = parts[2]?.toLowerCase()
            
            const colorMap: { [key: string]: string } = {
              'sil': 'Silver',
              'blu': 'Blue',
              'blk': 'Black',
              'wht': 'White',
              'red': 'Red',
              'gry': 'Gray'
            }
            
            const connectivityMap: { [key: string]: string } = {
              'wif': 'WiFi',
              'wir': 'Wired',
              'eth': 'Ethernet',
              'blu': 'Bluetooth'
            }
            
            const colorName = colorMap[color] || color?.toUpperCase() || ''
            const connectivityName = connectivityMap[connectivity] || connectivity?.toUpperCase() || ''
            
            return `${colorName} ${connectivityName}`.trim() || sku
          }
          return sku
        }
        
        // Transform variants from API data
        const transformedVariants = catalogProduct.variants?.map(variant => ({
          id: variant._id,
          name: generateVariantName(variant.sku_code),
          price: parseFloat(String(variant.price)) || 0,
          inStock: variant.is_active,
          details: {
            sku: variant.sku_code,
            slug: variant.slug,
            weight: variant.weight,
            dimensions: variant.dimensions,
            images: variant.images,
            discountDetails: variant.discount_details
          }
        })) || []
        
        console.log('Transformed variants:', transformedVariants)
        
        // Transform catalog product to our Product interface
        const transformedProduct: Product = {
            id: catalogProduct._id,
            name: catalogProduct.name,
            description: catalogProduct.description,
            price: minDiscountedPrice || minPrice,
            originalPrice: minDiscountedPrice ? minPrice : undefined,
            rating: catalogProduct.score,
            reviewCount: Math.floor(Math.random() * 100) + 10, // Mock review count
            image: getProductImage(catalogProduct.images, catalogProduct._id),
            images: catalogProduct.images || [], // Include the full images array
            category: catalogProduct.category_id.name,
            brand: typeof catalogProduct.brand_id === 'object' && catalogProduct.brand_id?.name 
              ? catalogProduct.brand_id.name 
              : typeof catalogProduct.brand_id === 'string' 
              ? catalogProduct.brand_id 
              : 'Unknown',
            inStock: transformedVariants.some(v => v.inStock) || Math.random() > 0.1, // In stock if any variant is active
            onSale: !!minDiscountedPrice || transformedVariants.some(v => v.details?.discountDetails?.is_on_sale),
            isNew: new Date(catalogProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            variants: transformedVariants
          }
          
          setProduct(transformedProduct)
      } else {
        setError('Product not found')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendedProducts = async () => {
    try {
      // Fetch a few products as recommendations
      const response = await CatalogService.getProducts({ limit: 4 })
      
      if (response.success && response.data) {
        const transformedProducts = response.data.map(catalogProduct => ({
          id: catalogProduct._id,
          name: catalogProduct.name,
          description: catalogProduct.description,
          price: catalogProduct.min_discounted_price || catalogProduct.min_price,
          originalPrice: catalogProduct.min_discounted_price ? catalogProduct.min_price : undefined,
          rating: catalogProduct.score,
          reviewCount: Math.floor(Math.random() * 100) + 10,
          image: getProductImage(catalogProduct.images, catalogProduct._id),
          images: catalogProduct.images || [], // Include the full images array
          category: catalogProduct.category_id.name,
          brand: typeof catalogProduct.brand_id === 'object' && catalogProduct.brand_id?.name 
            ? catalogProduct.brand_id.name 
            : typeof catalogProduct.brand_id === 'string' 
            ? catalogProduct.brand_id 
            : 'Unknown',
          inStock: Math.random() > 0.1,
          onSale: !!catalogProduct.min_discounted_price,
          isNew: new Date(catalogProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }))
        
        setRecommendedProducts(transformedProducts)
      }
    } catch (err) {
      console.error('Error fetching recommended products:', err)
    }
  }

  const handleAddToCart = (product: Product, variant?: NonNullable<Product['variants']>[number], quantity: number = 1) => {
    console.log('Add to cart:', { 
      product: product.name, 
      variant: variant?.name || 'Default', 
      quantity 
    })
    // TODO: Implement actual cart functionality
  }

  const handleToggleWishlist = (productId: string) => {
    setWishlistItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleBack = () => {
    router.push('/catalog')
  }

  const handleProductClick = (product: Product) => {
    // Navigate to another product
    const productUrl = `/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.id.slice(-8)}`
    router.push(productUrl)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center pt-32 px-4 sm:px-6 lg:px-36">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-neutral-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center pt-32 px-4 sm:px-6 lg:px-36">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Product Not Found</h1>
          <p className="text-neutral-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProductDetailsPage
      product={product}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      wishlistItems={wishlistItems}
      onBack={handleBack}
      recommendedProducts={recommendedProducts}
      onProductClick={handleProductClick}
    />
  )
}

export default ProductDetailsWrapper
