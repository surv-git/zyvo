/**
 * Unsplash Service
 * Handles integration with Unsplash API for fetching product and category images
 */

const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');

class UnsplashService {
  constructor() {
    this.unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      fetch: fetch,
    });
    
    this.isConfigured = !!process.env.UNSPLASH_ACCESS_KEY;
    
    if (!this.isConfigured) {
      console.warn('⚠️  Unsplash API not configured. Set UNSPLASH_ACCESS_KEY in .env file');
    }
  }

  /**
   * Search for images based on query
   * @param {string} query - Search query
   * @param {number} count - Number of images to fetch (default: 5)
   * @param {string} orientation - Image orientation (landscape, portrait, squarish)
   * @returns {Promise<Array>} Array of image objects
   */
  async searchImages(query, count = 5, orientation = 'landscape') {
    if (!this.isConfigured) {
      console.warn('Unsplash not configured, returning empty array');
      return [];
    }

    try {
      const result = await this.unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: count,
        orientation,
        orderBy: 'relevant',
      });

      if (result.errors) {
        console.error('Unsplash API errors:', result.errors);
        return [];
      }

      return result.response.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        small: photo.urls.small,
        full: photo.urls.full,
        alt_description: photo.alt_description || query,
        photographer: photo.user.name,
        photographer_url: photo.user.links.html,
        download_url: photo.links.download_location,
        width: photo.width,
        height: photo.height,
      }));
    } catch (error) {
      console.error('Error fetching images from Unsplash:', error);
      return [];
    }
  }

  /**
   * Get images for a product based on product name and category
   * @param {string} productName - Product name
   * @param {string} categoryName - Category name (optional)
   * @param {number} count - Number of images to fetch
   * @returns {Promise<Array>} Array of image URLs
   */
  async getProductImages(productName, categoryName = '', count = 3) {
    // Create search query combining product name and category
    const searchTerms = [productName, categoryName].filter(Boolean);
    const query = searchTerms.join(' ');
    
    const images = await this.searchImages(query, count, 'landscape');
    return images.map(img => img.url);
  }

  /**
   * Get images for a category
   * @param {string} categoryName - Category name
   * @param {number} count - Number of images to fetch
   * @returns {Promise<Array>} Array of image URLs
   */
  async getCategoryImages(categoryName, count = 1) {
    // Add generic terms to get better category images
    const query = `${categoryName} products collection`;
    
    const images = await this.searchImages(query, count, 'landscape');
    return images.map(img => img.url);
  }

  /**
   * Get a single hero image for a category
   * @param {string} categoryName - Category name
   * @returns {Promise<string|null>} Image URL or null
   */
  async getCategoryHeroImage(categoryName) {
    const images = await this.getCategoryImages(categoryName, 1);
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Download and trigger download tracking for Unsplash (required by API terms)
   * @param {string} downloadUrl - Download URL from Unsplash
   */
  async triggerDownload(downloadUrl) {
    if (!this.isConfigured || !downloadUrl) return;

    try {
      await this.unsplash.photos.trackDownload({
        downloadLocation: downloadUrl,
      });
    } catch (error) {
      console.error('Error tracking Unsplash download:', error);
    }
  }

  /**
   * Get curated images for specific product categories
   * @param {string} categoryName - Category name
   * @param {number} count - Number of images
   * @returns {Promise<Array>} Array of image URLs
   */
  async getCuratedCategoryImages(categoryName, count = 5) {
    // Map common categories to better search terms
    const categoryMappings = {
      'electronics': 'modern electronics devices gadgets',
      'clothing': 'fashion clothing apparel style',
      'shoes': 'footwear sneakers boots shoes',
      'accessories': 'fashion accessories jewelry watches',
      'home': 'home decor interior design furniture',
      'books': 'books reading literature education',
      'sports': 'sports equipment fitness athletic',
      'beauty': 'beauty cosmetics skincare makeup',
      'toys': 'toys games children kids play',
      'automotive': 'cars automotive vehicles transportation',
      'food': 'food cuisine cooking ingredients',
      'health': 'health wellness fitness medical',
      'music': 'music instruments audio sound',
      'art': 'art creative design artistic',
      'garden': 'garden plants flowers outdoor',
    };

    const searchQuery = categoryMappings[categoryName.toLowerCase()] || `${categoryName} products`;
    const images = await this.searchImages(searchQuery, count, 'landscape');
    return images.map(img => img.url);
  }

  /**
   * Check if Unsplash service is properly configured
   * @returns {boolean} True if configured
   */
  isReady() {
    return this.isConfigured;
  }
}

// Export singleton instance
module.exports = new UnsplashService();
