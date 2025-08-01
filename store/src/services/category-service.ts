import { API_CONFIG, apiGet } from '@/lib/api-config'
import { Category, CategoriesResponse } from '@/types/api'

export class CategoryService {
  // Fetch all categories with pagination handling
  static async getAllCategories(): Promise<Category[]> {
    console.log('CategoryService.getAllCategories called')
    const allCategories: Category[] = []
    let currentPage = 1
    let hasNextPage = true

    while (hasNextPage) {
      try {
        console.log(`Fetching page ${currentPage}...`)
        const response = await apiGet<CategoriesResponse>(
          `${API_CONFIG.ENDPOINTS.CATEGORIES.LIST}?page=${currentPage}&limit=10`
        )
        console.log(`Page ${currentPage} response:`, response)

        if (response.success && response.data) {
          // Filter only active categories
          const activeCategories = response.data.filter((cat: Category) => cat.is_active)
          allCategories.push(...activeCategories)
          
          // Check if there are more pages
          hasNextPage = response.pagination?.hasNextPage || false
          currentPage++
        } else {
          hasNextPage = false
        }
      } catch (error) {
        console.error(`Error fetching categories page ${currentPage}:`, error)
        hasNextPage = false
      }
    }

    console.log('Final categories:', allCategories)
    return allCategories
  }

  // Fetch categories with pagination (for direct use)
  static async getCategories(page: number = 1, limit: number = 10): Promise<CategoriesResponse> {
    try {
      const response = await apiGet<CategoriesResponse>(
        `${API_CONFIG.ENDPOINTS.CATEGORIES.LIST}?page=${page}&limit=${limit}`
      )
      return response
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  // Fetch single category by ID
  static async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await apiGet<{ success: boolean; data: Category }>(
        API_CONFIG.ENDPOINTS.CATEGORIES.DETAIL(id)
      )
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error)
      return null
    }
  }

  // Helper method to get category image URL with fallbacks
  static getImageUrl(category: Category, index: number = 0): string {
    // First try to use the actual category image URL if available
    if (category.image_url && category.image_url.trim() !== '') {
      console.log('🖼️ Using category image URL:', category.image_url)
      return category.image_url
    }
    
    // Fall back to carousel images if no valid URL
    console.log('🔄 Using fallback image for category:', category.name)
    return this.getFallbackImage(index)
  }

  // Get fallback image for carousel
  static getFallbackImage(index: number): string {
    const imageNumber = (index % 5) + 1 // Cycle through 1-5
    return `/images/carousel-image-0${imageNumber}.jpg`
  }

  // Get category slug for URLs
  static getCategorySlug(category: Category): string {
    return category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Check if category has subcategories
  static hasSubcategories(): boolean {
    // Since the API doesn't provide subcategories in the current type, return false
    return false
  }

  // Get category hierarchy path
  static getCategoryPath(category: Category): string {
    if (category.parent_category) {
      return `${category.parent_category} > ${category.name}`
    }
    return category.name
  }
}
