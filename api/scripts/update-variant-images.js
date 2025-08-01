#!/usr/bin/env node

/**
 * Script to update product variant images with valid Unsplash URLs
 * This script will replace ALL product variant images with high-quality Unsplash images
 */

const mongoose = require('mongoose');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

// High-quality Unsplash image URLs for different product categories and variants
const VARIANT_IMAGE_MAPPINGS = {
  // Electronics & Technology
  'electronics': [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'smartphones': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'laptops': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'computers': [
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559526324-593bc073d938?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'headphones': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'audio': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Fashion & Clothing
  'clothing': [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'mens': [
    'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'womens': [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'shoes': [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Home & Living
  'home': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'furniture': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'garden': [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Business & Professional
  'business': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'technology': [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'mobile': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Default fallback images
  'default': [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ]
};

/**
 * Find the best matching images for a product variant
 */
function findBestImagesForVariant(productName, categoryName = '', variantSku = '', imageCount = 2) {
  const productLower = productName.toLowerCase();
  const categoryLower = categoryName.toLowerCase();
  const skuLower = variantSku.toLowerCase();
  
  // Try to find images based on SKU first (most specific)
  for (const [key, images] of Object.entries(VARIANT_IMAGE_MAPPINGS)) {
    if (skuLower.includes(key) || key.includes(skuLower)) {
      return images.slice(0, imageCount);
    }
  }
  
  // Try to find images based on product name
  for (const [key, images] of Object.entries(VARIANT_IMAGE_MAPPINGS)) {
    if (productLower.includes(key) || key.includes(productLower)) {
      return images.slice(0, imageCount);
    }
  }
  
  // Try to find images based on category name
  for (const [key, images] of Object.entries(VARIANT_IMAGE_MAPPINGS)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return images.slice(0, imageCount);
    }
  }
  
  // Return default images
  return VARIANT_IMAGE_MAPPINGS.default.slice(0, imageCount);
}

/**
 * Main function to update product variant images
 */
async function updateVariantImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📋 Fetching all product variants with product and category info...');
    const variants = await ProductVariant.find({})
      .populate({
        path: 'product_id',
        select: 'name category_id',
        populate: {
          path: 'category_id',
          select: 'name'
        }
      });
    
    console.log(`📊 Found ${variants.length} product variants`);

    let updatedCount = 0;

    for (const variant of variants) {
      const productName = variant.product_id?.name || '';
      const categoryName = variant.product_id?.category_id?.name || '';
      const variantSku = variant.sku_code || '';
      const oldImages = variant.images || [];
      
      // Find best matching images for this variant (2 images per variant)
      const newImages = findBestImagesForVariant(productName, categoryName, variantSku, 2);
      
      // Update variant with new Unsplash images
      await ProductVariant.findByIdAndUpdate(variant._id, {
        images: newImages,
        updatedAt: new Date()
      });

      console.log(`✅ Updated variant "${variantSku}"`);
      console.log(`   Product: ${productName}`);
      console.log(`   Category: ${categoryName}`);
      console.log(`   Old: ${oldImages.length} images`);
      console.log(`   New: ${newImages.length} images`);
      console.log('');
      updatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} product variants`);
    console.log(`📋 Total: ${variants.length} variants processed`);
    console.log('\n🎉 Product variant images updated successfully!');

  } catch (error) {
    console.error('❌ Error updating product variant images:', error);
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

    console.log('📋 Fetching all product variants with product and category info...');
    const variants = await ProductVariant.find({})
      .populate({
        path: 'product_id',
        select: 'name category_id',
        populate: {
          path: 'category_id',
          select: 'name'
        }
      });
    
    console.log(`📊 Found ${variants.length} product variants`);

    console.log('\n📋 Preview of updates:');
    console.log('='.repeat(80));

    let wouldUpdateCount = 0;

    for (const variant of variants) {
      const productName = variant.product_id?.name || '';
      const categoryName = variant.product_id?.category_id?.name || '';
      const variantSku = variant.sku_code || '';
      const oldImages = variant.images || [];
      const newImages = findBestImagesForVariant(productName, categoryName, variantSku, 2);
      
      console.log(`🔄 "${variantSku}" - Will update:`);
      console.log(`   Product: ${productName}`);
      console.log(`   Category: ${categoryName}`);
      console.log(`   Current: ${oldImages.length} images`);
      console.log(`   New: ${newImages.length} images`);
      console.log('');
      wouldUpdateCount++;
    }

    console.log('\n📊 Preview Summary:');
    console.log(`🔄 Will update: ${wouldUpdateCount} product variants`);
    console.log(`📋 Total: ${variants.length} variants`);
    console.log('\n⚠️  All product variant images will be replaced with Unsplash URLs');

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
  console.log('🚀 Update Mode - Product variants will be updated\n');
  updateVariantImages();
} else {
  console.log('Usage:');
  console.log('  node scripts/update-variant-images.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  preview, -p, --preview    Preview what would be updated (no changes)');
  console.log('  update, -u, --update      Update variant images (default)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/update-variant-images.js preview');
  console.log('  node scripts/update-variant-images.js update');
  process.exit(0);
}
