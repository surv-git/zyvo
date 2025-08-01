/**
 * Image Population Utility
 * Automatically populates images for products and categories using Unsplash
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const unsplashService = require('../services/unsplash.service');

class ImagePopulator {
  constructor() {
    this.processedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Populate images for all products that don't have images
   * @param {boolean} overwrite - Whether to overwrite existing images
   * @param {number} limit - Limit number of products to process (0 = no limit)
   */
  async populateProductImages(overwrite = false, limit = 0) {
    if (!unsplashService.isReady()) {
      console.error('❌ Unsplash service not configured. Please set UNSPLASH_ACCESS_KEY in .env');
      return;
    }

    console.log('🖼️  Starting product image population...');
    
    try {
      // Build query - only products without images (unless overwrite is true)
      const query = overwrite ? {} : { 
        $or: [
          { images: { $exists: false } },
          { images: { $size: 0 } },
          { images: null }
        ]
      };

      // Get products that need images
      const products = await Product.find(query)
        .populate('category_id', 'name')
        .limit(limit || 0);

      console.log(`📊 Found ${products.length} products to process`);

      for (const product of products) {
        try {
          console.log(`🔄 Processing: ${product.name}`);
          
          // Get category name for better search results
          const categoryName = product.category_id?.name || '';
          
          // Fetch images from Unsplash
          const imageUrls = await unsplashService.getProductImages(
            product.name, 
            categoryName, 
            3 // Get 3 images per product
          );

          if (imageUrls.length > 0) {
            // Update product with new images
            await Product.findByIdAndUpdate(product._id, {
              images: imageUrls,
              updatedAt: new Date()
            });

            console.log(`✅ Added ${imageUrls.length} images to "${product.name}"`);
            this.processedCount++;
          } else {
            console.log(`⚠️  No images found for "${product.name}"`);
          }

          // Add small delay to respect API rate limits
          await this.delay(100);

        } catch (error) {
          console.error(`❌ Error processing product "${product.name}":`, error.message);
          this.errorCount++;
        }
      }

      console.log(`\n🎉 Product image population completed!`);
      console.log(`✅ Processed: ${this.processedCount} products`);
      console.log(`❌ Errors: ${this.errorCount} products`);

    } catch (error) {
      console.error('❌ Error in product image population:', error);
    }
  }

  /**
   * Populate images for all categories that don't have images
   * @param {boolean} overwrite - Whether to overwrite existing images
   * @param {number} limit - Limit number of categories to process (0 = no limit)
   */
  async populateCategoryImages(overwrite = false, limit = 0) {
    if (!unsplashService.isReady()) {
      console.error('❌ Unsplash service not configured. Please set UNSPLASH_ACCESS_KEY in .env');
      return;
    }

    console.log('🖼️  Starting category image population...');
    
    try {
      // Build query - only categories without images (unless overwrite is true)
      const query = overwrite ? {} : { 
        $or: [
          { image_url: { $exists: false } },
          { image_url: null },
          { image_url: '' }
        ]
      };

      // Get categories that need images
      const categories = await Category.find(query).limit(limit || 0);

      console.log(`📊 Found ${categories.length} categories to process`);

      for (const category of categories) {
        try {
          console.log(`🔄 Processing category: ${category.name}`);
          
          // Fetch hero image from Unsplash
          const imageUrl = await unsplashService.getCategoryHeroImage(category.name);

          if (imageUrl) {
            // Update category with new image
            await Category.findByIdAndUpdate(category._id, {
              image_url: imageUrl,
              updatedAt: new Date()
            });

            console.log(`✅ Added image to category "${category.name}"`);
            this.processedCount++;
          } else {
            console.log(`⚠️  No image found for category "${category.name}"`);
          }

          // Add small delay to respect API rate limits
          await this.delay(100);

        } catch (error) {
          console.error(`❌ Error processing category "${category.name}":`, error.message);
          this.errorCount++;
        }
      }

      console.log(`\n🎉 Category image population completed!`);
      console.log(`✅ Processed: ${this.processedCount} categories`);
      console.log(`❌ Errors: ${this.errorCount} categories`);

    } catch (error) {
      console.error('❌ Error in category image population:', error);
    }
  }

  /**
   * Populate images for both products and categories
   * @param {Object} options - Configuration options
   */
  async populateAllImages(options = {}) {
    const {
      overwrite = false,
      productLimit = 0,
      categoryLimit = 0,
      skipProducts = false,
      skipCategories = false
    } = options;

    console.log('🚀 Starting complete image population...');
    console.log(`Options: overwrite=${overwrite}, productLimit=${productLimit}, categoryLimit=${categoryLimit}`);

    // Reset counters
    this.processedCount = 0;
    this.errorCount = 0;

    if (!skipCategories) {
      console.log('\n📂 Processing categories...');
      await this.populateCategoryImages(overwrite, categoryLimit);
    }

    if (!skipProducts) {
      console.log('\n📦 Processing products...');
      await this.populateProductImages(overwrite, productLimit);
    }

    console.log('\n🎯 Final Summary:');
    console.log(`✅ Total processed: ${this.processedCount}`);
    console.log(`❌ Total errors: ${this.errorCount}`);
  }

  /**
   * Get image suggestions for a specific product
   * @param {string} productId - Product ID
   * @param {number} count - Number of image suggestions
   */
  async getProductImageSuggestions(productId, count = 5) {
    try {
      const product = await Product.findById(productId).populate('category_id', 'name');
      
      if (!product) {
        throw new Error('Product not found');
      }

      const categoryName = product.category_id?.name || '';
      const images = await unsplashService.searchImages(
        `${product.name} ${categoryName}`, 
        count, 
        'landscape'
      );

      return images;
    } catch (error) {
      console.error('Error getting product image suggestions:', error);
      return [];
    }
  }

  /**
   * Get image suggestions for a specific category
   * @param {string} categoryId - Category ID
   * @param {number} count - Number of image suggestions
   */
  async getCategoryImageSuggestions(categoryId, count = 5) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      const images = await unsplashService.getCuratedCategoryImages(category.name, count);
      
      return images.map(url => ({
        url,
        alt_description: `${category.name} category image`,
      }));
    } catch (error) {
      console.error('Error getting category image suggestions:', error);
      return [];
    }
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ImagePopulator;
