#!/usr/bin/env node

/**
 * Script to update product images with valid Unsplash URLs
 * This script will replace ALL product images with high-quality Unsplash images
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

// High-quality Unsplash image URLs for different product categories
const PRODUCT_IMAGE_MAPPINGS = {
  // Electronics & Technology
  'electronics': [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'smartphones': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'laptops': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'computers': [
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'headphones': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'audio': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'clothing': [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'mens': [
    'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'womens': [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'home': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'garden': [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'business': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'technology': [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'mobile': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ],
  'default': [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  ]
};

/**
 * Find the best matching images for a product
 */
function findBestImagesForProduct(productName, categoryName = '', imageCount = 3) {
  const productLower = productName.toLowerCase();
  const categoryLower = categoryName.toLowerCase();
  
  // Try to find images based on product name first
  for (const [key, images] of Object.entries(PRODUCT_IMAGE_MAPPINGS)) {
    if (productLower.includes(key) || key.includes(productLower)) {
      return images.slice(0, imageCount);
    }
  }
  
  // Try to find images based on category name
  for (const [key, images] of Object.entries(PRODUCT_IMAGE_MAPPINGS)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return images.slice(0, imageCount);
    }
  }
  
  // Return default images
  return PRODUCT_IMAGE_MAPPINGS.default.slice(0, imageCount);
}

/**
 * Main function to update product images
 */
async function updateProductImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📋 Fetching all products...');
    const products = await Product.find({}).populate('category_id', 'name');
    console.log(`📊 Found ${products.length} products`);

    let updatedCount = 0;

    for (const product of products) {
      const categoryName = product.category_id?.name || '';
      const oldImages = product.images || [];
      
      const newImages = findBestImagesForProduct(product.name, categoryName, 3);
      
      await Product.findByIdAndUpdate(product._id, {
        images: newImages,
        updatedAt: new Date()
      });

      console.log(`✅ Updated "${product.name}"`);
      console.log(`   Category: ${categoryName}`);
      console.log(`   Old: ${oldImages.length} images`);
      console.log(`   New: ${newImages.length} images`);
      console.log('');
      updatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} products`);
    console.log(`📋 Total: ${products.length} products processed`);
    console.log('\n🎉 Product images updated successfully!');

  } catch (error) {
    console.error('❌ Error updating product images:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Preview function to show what would be updated
 */
async function previewUpdates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📋 Fetching all products...');
    const products = await Product.find({}).populate('category_id', 'name');
    console.log(`📊 Found ${products.length} products`);

    console.log('\n📋 Preview of updates:');
    console.log('='.repeat(80));

    let wouldUpdateCount = 0;

    for (const product of products) {
      const categoryName = product.category_id?.name || '';
      const oldImages = product.images || [];
      const newImages = findBestImagesForProduct(product.name, categoryName, 3);
      
      console.log(`🔄 "${product.name}" - Will update:`);
      console.log(`   Category: ${categoryName}`);
      console.log(`   Current: ${oldImages.length} images`);
      console.log(`   New: ${newImages.length} images`);
      console.log('');
      wouldUpdateCount++;
    }

    console.log('\n📊 Preview Summary:');
    console.log(`🔄 Will update: ${wouldUpdateCount} products`);
    console.log(`📋 Total: ${products.length} products`);
    console.log('\n⚠️  All product images will be replaced with Unsplash URLs');

  } catch (error) {
    console.error('❌ Error previewing updates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'preview' || command === '--preview' || command === '-p') {
  console.log('👀 Preview Mode - No changes will be made\n');
  previewUpdates();
} else if (command === 'update' || command === '--update' || command === '-u' || !command) {
  console.log('🚀 Update Mode - Products will be updated\n');
  updateProductImages();
} else {
  console.log('Usage:');
  console.log('  node scripts/update-product-images.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  preview, -p, --preview    Preview what would be updated (no changes)');
  console.log('  update, -u, --update      Update product images (default)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/update-product-images.js preview');
  console.log('  node scripts/update-product-images.js update');
  process.exit(0);
}
