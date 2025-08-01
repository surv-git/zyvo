"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmblaOptionsType } from 'embla-carousel'
import { useDotButton } from './carousel-dot-buttons'
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './carousel-arrow-buttons'
import useCategoryCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { Category } from '@/types/api'
import { CategoryService } from '@/services/category-service'
import SectionHeader from '@/components/ui/section-header'

type PropType = {
  options?: EmblaOptionsType
}

const CategoryCarousel: React.FC<PropType> = (props) => {
  const { options } = props
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Default options to show 5 slides per view
  const defaultOptions: EmblaOptionsType = {
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    ...options
  }
  
  const [emblaRef, emblaApi] = useCategoryCarousel(defaultOptions)

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  // Handle category click navigation
  const handleCategoryClick = (category: Category) => {
    const categoryName = encodeURIComponent(category.name)
    router.push(`/catalog?category=${categoryName}`)
  }

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Starting to fetch categories...')
        setLoading(true)
        setError(null)
        const fetchedCategories = await CategoryService.getAllCategories()
        console.log('Fetched categories:', fetchedCategories)
        setCategories(fetchedCategories)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Loading state
  if (loading) {
    return (
      <section className="embla category-carousel mx-auto py-20 relative lg:px-36 px-4">
        <SectionHeader
          badge="Discover Our Collections"
          title="Shop By Category"
          subtitle="Explore our carefully curated categories and find exactly what you're looking for"
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-neutral-600">Loading categories...</span>
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="embla category-carousel mx-auto py-20 relative overflow-hidden lg:px-36 px-4">
        <SectionHeader
          badge="Discover Our Collections"
          title="Shop By Category"
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="embla category-carousel mx-auto px-36 py-20 relative">
        <SectionHeader
          badge="Discover Our Collections"
          title="Shop By Category"
        />
        <div className="flex justify-center items-center h-64">
          <p className="text-neutral-600">No categories available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="embla category-carousel mx-auto py-16 relative w-full">
      {/* Section Header with improved spacing */}
      <div className="lg:px-36 px-4 mb-12">
        <SectionHeader
          badge="Discover Our Collections"
          title="Shop By Category"
          subtitle="Explore our carefully curated categories and find exactly what you're looking for"
        />
      </div>

      {/* Carousel Container with enhanced visual design */}
      <div className="w-full relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50/30 to-transparent pointer-events-none"></div>
        
        <div className="embla__viewport w-full" ref={emblaRef}>
          <div className="embla__container flex gap-8 py-12 lg:px-36 px-4">
          {categories.map((category, index) => (
            <div 
              className="embla__slide flex-shrink-0 group cursor-pointer transition-all duration-500 hover:scale-105" 
              key={category._id} 
              style={{ flex: '0 0 auto', width: '22rem', minWidth: '22rem' }}
              onClick={() => handleCategoryClick(category)}
            >                
              <div className="category-card relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-neutral-50 border border-neutral-200/50 w-full h-80">
                {/* Background Image with improved aspect ratio */}
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    className="w-full h-full transition-all duration-700 group-hover:scale-110"
                    src={CategoryService.getImageUrl(category, index)}
                    alt={category.name}
                    width={352}
                    height={320}
                    quality={95}
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>
                
                {/* Enhanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-500"></div>
                
                {/* Content Overlay with better positioning */}
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  {/* Category Badge with modern design */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-2 animate-pulse"></div>
                      {category.parent_category ? `${category.parent_category.name} • ${category.name}` : category.name}
                    </span>
                  </div>
                  
                  {/* Category Name with enhanced typography */}
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary-200 transition-colors duration-300 leading-tight" style={{ 
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.8)'
                  }}>
                    {category.name}
                  </h3>
                  
                  {/* Category Description with better readability */}
                  <p className="text-sm mb-6 text-white/90 leading-relaxed" style={{ 
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}>
                    {category.description || `Discover premium ${category.name.toLowerCase()} products`}
                  </p>
                  
                  {/* Enhanced Action Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                      <span className="text-sm font-semibold text-white">
                        Explore Collection
                      </span>
                      <svg 
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Modern Corner Accent */}
                <div className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Enhanced Navigation Controls */}
      <div className="flex justify-center items-center mt-12 space-x-8 lg:px-36 px-4">
        {/* Previous Button */}
        <div className="flex-shrink-0">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        </div>
        
        {/* Modern Lines Indicator - More elegant than conventional dots */}
        <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-neutral-200/50">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex 
                  ? 'bg-primary-600 shadow-md border-2 border-primary-600' 
                  : 'bg-neutral-300 hover:bg-neutral-400 border border-neutral-300'
              }`}
              style={{
                height: '2px',
                minHeight: '2px',
                width: index === selectedIndex ? '48px' : '24px',
                borderRadius: '2px'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Next Button */}
        <div className="flex-shrink-0">
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>
    </section>
  )
}

export default CategoryCarousel
