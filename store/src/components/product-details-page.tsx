"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import ProductImage from '@/components/ui/product-image'
import FavoriteButton from '@/components/ui/favorite-button'
import FooterSection from '@/components/footer-one'
import { formatIndianRupees } from '@/lib/currency-utils'
import { getProductThumbnails } from '@/lib/product-utils'
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Package,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Zap,
  Share2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ProductVariant {
  id: string
  name: string
  price: number
  inStock: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  images?: string[] // Add images array for Unsplash URLs
  category: string
  brand: string
  inStock: boolean
  onSale: boolean
  isNew: boolean
  variants?: ProductVariant[]
  specifications?: { [key: string]: string }
  features?: string[]
  reviews?: Review[]
}

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
  images?: string[]
}

interface ProductDetailsPageProps {
  product: Product
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void
  onToggleWishlist?: (productId: string) => void // Made optional for backward compatibility
  wishlistItems?: string[] // Made optional for backward compatibility
  onBack: () => void
  recommendedProducts: Product[]
  onProductClick: (product: Product) => void
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  wishlistItems = [],
  onBack,
  recommendedProducts,
  onProductClick
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [imageSrc, setImageSrc] = useState<string>(product.image)
  const [imageError, setImageError] = useState(false)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  // Get all thumbnail images (product images + fallbacks as needed)
  const thumbnailImages = getProductThumbnails(product.images, product.id, 6)

  // Generate fallback image based on product ID
  const getFallbackImage = (productId: string) => {
    const imageNumber = Math.abs(productId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 6 + 1
    return `/images/carousel-image-${imageNumber.toString().padStart(2, '0')}.jpg`
  }

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageSrc(getFallbackImage(product.id))
    }
  }

  const hasVariants = product.variants && product.variants.length > 0
  const discount = product.originalPrice ? 
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const isAvailable = hasVariants ? 
    (selectedVariant ? selectedVariant.inStock : product.variants!.some(v => v.inStock)) : 
    product.inStock

  const handleAddToCart = () => {
    try {
      onAddToCart(product, selectedVariant || undefined, quantity)
      
      // Show success toast
      const variantText = selectedVariant ? ` (${selectedVariant.name})` : ''
      const quantityText = quantity > 1 ? ` × ${quantity}` : ''
      
      toast.success('Added to cart!', {
        description: `${product.name}${variantText}${quantityText} has been added to your cart`,
        icon: '🛒',
        duration: 3000,
        action: {
          label: 'View Cart',
          onClick: () => {
            // TODO: Navigate to cart page
            console.log('Navigate to cart')
          }
        }
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add to cart', {
        description: 'Something went wrong. Please try again.',
        icon: '⚠️',
        duration: 3000,
      })
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Mock reviews if none provided
  const reviews = product.reviews || [
    {
      id: '1',
      userId: 'user1',
      userName: 'Rajesh Kumar',
      rating: 5,
      title: 'Excellent product!',
      comment: 'Really happy with this purchase. Quality is top-notch and delivery was quick. Highly recommended!',
      date: '2024-01-15',
      verified: true,
      helpful: 12,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Priya Sharma',
      rating: 4,
      title: 'Good value for money',
      comment: 'The product is good but could be better. Overall satisfied with the purchase.',
      date: '2024-01-10',
      verified: true,
      helpful: 8,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Amit Singh',
      rating: 5,
      title: 'Amazing quality',
      comment: 'Exceeded my expectations. The build quality is excellent and it works perfectly.',
      date: '2024-01-08',
      verified: false,
      helpful: 15,
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-50 pt-24">
      {/* Header with back button */}
      <div className="bg-white border-b border-neutral-200">
        <div className="w-full px-4 sm:px-6 lg:px-36 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Products</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-36 py-8">
        {/* Product Overview */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            {/* Thumbnails - horizontal on mobile, vertical on desktop */}
            <div className="flex sm:block overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
              <div className="flex sm:flex-col space-x-4 sm:space-x-0 sm:space-y-4 lg:space-y-5 sm:w-32 lg:w-[120px]">
                <ScrollArea className="hidden sm:block h-[384px] sm:h-[480px] lg:h-[576px]">
                  <div className="flex flex-col space-y-4 lg:space-y-5 pr-6">
                    {/* All product thumbnail images */}
                    {thumbnailImages.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setImageSrc(imageUrl)
                          setImageError(false)
                        }}
                        className={`flex-shrink-0 w-20 h-20 lg:w-[100px] lg:h-[100px] rounded-lg overflow-hidden border-2 transition-colors ${
                          imageSrc === imageUrl
                            ? 'border-neutral-900'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <ProductImage
                          src={imageUrl}
                          alt={`${product.name} view ${index + 1}`}
                          productId={`${product.id}-${index}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Mobile horizontal thumbnails */}
                <div className="flex sm:hidden space-x-4">
                  {/* All product thumbnail images */}
                  {thumbnailImages.slice(0, 4).map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setImageSrc(imageUrl)
                        setImageError(false)
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        imageSrc === imageUrl
                          ? 'border-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <ProductImage
                        src={imageUrl}
                        alt={`${product.name} view ${index + 1}`}
                        productId={`${product.id}-mobile-${index}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main image - increased size by 20% */}
            <div className="flex-1 sm:max-w-2xl">
              <div className="relative aspect-square max-h-[384px] sm:max-h-[480px] lg:max-h-[646px] rounded-lg overflow-hidden bg-neutral-100">
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
                
                {/* Badges */}
                {product.onSale && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="relative bg-red-600 text-white px-4 py-3 text-center shadow-lg">
                      <div className="text-xs font-bold uppercase tracking-wide">SALE</div>
                      <div className="text-2xl font-black">{discount}%</div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-700" style={{ top: 'calc(100% - 1px)' }}></div>
                    </div>
                  </div>
                )}

                {product.isNew && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-full shadow-md">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-bold">NEW</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" className="text-sm">
                  {product.category}
                </Badge>
                <span className="text-neutral-600">{product.brand}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-neutral-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-secondary-400 text-secondary-400' 
                            : 'text-neutral-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-neutral-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-neutral-900">
                  {formatIndianRupees(currentPrice)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-neutral-500 line-through">
                    {formatIndianRupees(product.originalPrice)}
                  </span>
                )}
              </div>
              
              {product.onSale && (
                <div className="flex items-center space-x-3">
                  <Badge variant="destructive">
                    {discount}% OFF
                  </Badge>
                  <span className="text-green-600 font-medium">
                    You save {formatIndianRupees((product.originalPrice || 0) - currentPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Variants */}
            {hasVariants && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-900">Options:</h3>
                <ScrollArea className="w-full">
                  <div className="flex space-x-3 pb-2">
                    {product.variants!.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variant.inStock}
                        className={`flex-shrink-0 p-4 border rounded-lg text-left transition-colors min-w-[140px] ${
                          selectedVariant?.id === variant.id
                            ? 'border-neutral-900 bg-neutral-100'
                            : variant.inStock
                            ? 'border-neutral-200 hover:border-neutral-300'
                            : 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-neutral-600">
                          {formatIndianRupees(variant.price)}
                        </div>
                        {!variant.inStock && (
                          <div className="text-sm text-red-600 mt-1">Out of Stock</div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">Quantity:</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-3 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                  className="p-3 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stock Status & Shipping */}
            <div className="space-y-3 p-4 bg-neutral-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isAvailable ? 'text-accent-600' : 'text-red-600'}`}>
                  <Package className="w-5 h-5 mr-2" />
                  {isAvailable ? 'In Stock' : 'Out of Stock'}
                </div>
                <div className="flex items-center text-neutral-600">
                  <Truck className="w-5 h-5 mr-2" />
                  Free Shipping
                </div>
              </div>
              
              <div className="flex items-center justify-between text-neutral-600">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  1 Year Warranty
                </div>
                <div className="flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  30 Day Returns
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className="group relative flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none overflow-hidden"
                size="lg"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                
                <ShoppingCart className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative z-10">
                  {!isAvailable ? 'Out of Stock' : `Add to Cart ${quantity > 1 ? `(${quantity})` : ''}`}
                </span>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-full group-hover:top-full bg-gradient-to-b from-transparent via-white/20 to-transparent transition-all duration-700 transform skew-y-12" />
              </Button>
              
              <FavoriteButton
                productVariantId={selectedVariant?.id || product.id}
                productId={selectedVariant ? undefined : product.id}
                showText={true}
                className="flex-1 py-4 text-lg relative"
              />
            </div>
          </div>
        </div>

        {/* Product Details - Continuous Layout */}
        <div className="mb-12 space-y-16">
          {/* Description Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Product Description</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">
                {product.description}
              </p>
            </div>
            
            {product.features && (
              <div>
                <h4 className="text-xl font-semibold mb-4">Key Features</h4>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span className="text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Specifications Section */}
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Product Specifications</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {(product.specifications || {
                'Brand': product.brand,
                'Category': product.category,
                'In Stock': isAvailable ? 'Yes' : 'No',
                'Warranty': '1 Year',
                'Return Policy': '30 Days',
                'Shipping': 'Free'
              }) && Object.entries(product.specifications || {
                'Brand': product.brand,
                'Category': product.category,
                'In Stock': isAvailable ? 'Yes' : 'No',
                'Warranty': '1 Year',
                'Return Policy': '30 Days',
                'Shipping': 'Free'
              }).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-neutral-200">
                  <span className="font-medium text-neutral-900">{key}:</span>
                  <span className="text-neutral-600">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-neutral-900">Customer Reviews ({reviews.length})</h3>
              <Button variant="outline">Write a Review</Button>
            </div>
            
            {/* Reviews Summary - Split into 2 columns */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Review Distribution */}
              <div className="bg-neutral-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Review Distribution</h4>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neutral-900">{product.rating}</div>
                    <div className="flex items-center justify-center mb-1">
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
                    <div className="text-sm text-neutral-600">{product.reviewCount} reviews</div>
                  </div>
                  
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => Math.floor(r.rating) === rating).length
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={rating} className="flex items-center space-x-3 mb-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-secondary-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-neutral-600 w-8">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - AI Review Summary */}
              <div className="bg-neutral-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Review Summary</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-neutral-900 mb-2">What customers love:</h5>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Excellent build quality and durability</li>
                      <li>• Fast and reliable delivery service</li>
                      <li>• Great value for money</li>
                      <li>• Outstanding customer support</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-neutral-900 mb-2">Areas for improvement:</h5>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Some users noted minor packaging issues</li>
                      <li>• Limited color options mentioned</li>
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium">Overall sentiment:</span> Customers are highly satisfied with this product, 
                      praising its quality and performance. {Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}% of reviewers 
                      rated it 4 stars or higher.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-neutral-900">{review.userName}</h4>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'fill-secondary-400 text-secondary-400' 
                                  : 'text-neutral-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-600">{review.date}</span>
                      </div>
                      <h5 className="font-medium text-neutral-900 mb-2">{review.title}</h5>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <p className={`text-neutral-600 leading-relaxed ${
                      expandedReview === review.id ? '' : 'line-clamp-3'
                    }`}>
                      {review.comment}
                    </p>
                    {review.comment.length > 200 && (
                      <button
                        onClick={() => setExpandedReview(
                          expandedReview === review.id ? null : review.id
                        )}
                        className="text-primary-600 text-sm mt-2 hover:underline"
                      >
                        {expandedReview === review.id ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-neutral-800">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-neutral-800">
                      <ThumbsDown className="w-4 h-4" />
                      <span>Not helpful</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">Recommended Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.slice(0, 4).map((recommendedProduct) => (
                <div key={recommendedProduct.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square overflow-hidden">
                    <ProductImage
                      src={recommendedProduct.image}
                      alt={recommendedProduct.name}
                      productId={recommendedProduct.id}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <FavoriteButton
                      productVariantId={recommendedProduct.id}
                      productId={recommendedProduct.id}
                      className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-sm"
                      size="sm"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 
                      className="font-medium text-neutral-900 hover:text-primary-600 cursor-pointer truncate mb-2"
                      onClick={() => onProductClick(recommendedProduct)}
                    >
                      {recommendedProduct.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">{recommendedProduct.brand}</p>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${
                            i < Math.floor(recommendedProduct.rating) 
                              ? 'fill-secondary-400 text-secondary-400' 
                              : 'text-neutral-300'
                          }`} 
                        />
                      ))}
                      <span className="text-xs text-neutral-600 ml-1">
                        ({recommendedProduct.reviewCount})
                      </span>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <span className="text-lg font-bold text-neutral-900">
                        {formatIndianRupees(recommendedProduct.price)}
                      </span>
                      {recommendedProduct.originalPrice && (
                        <>
                          <span className="text-sm text-neutral-500 line-through">
                            {formatIndianRupees(recommendedProduct.originalPrice)}
                          </span>
                          {recommendedProduct.onSale && (
                            <>
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                                {Math.round(((recommendedProduct.originalPrice - recommendedProduct.price) / recommendedProduct.originalPrice) * 100)}% OFF
                              </Badge>
                              <span className="text-yellow-600 font-medium text-xs">
                                You save {formatIndianRupees(recommendedProduct.originalPrice - recommendedProduct.price)}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onProductClick(recommendedProduct)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  )
}

export default ProductDetailsPage
