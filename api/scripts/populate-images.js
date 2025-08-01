#!/usr/bin/env node

/**
 * Image Population CLI Script
 * Command-line tool to populate images for products and categories using Unsplash
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ImagePopulator = require('../utils/populateImages');

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  overwrite: args.includes('--overwrite') || args.includes('-o'),
  skipProducts: args.includes('--skip-products'),
  skipCategories: args.includes('--skip-categories'),
  productLimit: 0,
  categoryLimit: 0,
  help: args.includes('--help') || args.includes('-h'),
};

// Parse limit arguments
const productLimitIndex = args.findIndex(arg => arg === '--product-limit');
if (productLimitIndex !== -1 && args[productLimitIndex + 1]) {
  options.productLimit = parseInt(args[productLimitIndex + 1]) || 0;
}

const categoryLimitIndex = args.findIndex(arg => arg === '--category-limit');
if (categoryLimitIndex !== -1 && args[categoryLimitIndex + 1]) {
  options.categoryLimit = parseInt(args[categoryLimitIndex + 1]) || 0;
}

// Help text
function showHelp() {
  console.log(`
🖼️  Unsplash Image Population Tool
================================

Usage: node scripts/populate-images.js [options]

Options:
  --help, -h              Show this help message
  --overwrite, -o         Overwrite existing images
  --skip-products         Skip product image population
  --skip-categories       Skip category image population
  --product-limit <num>   Limit number of products to process
  --category-limit <num>  Limit number of categories to process

Examples:
  # Populate images for all products and categories
  node scripts/populate-images.js

  # Overwrite existing images
  node scripts/populate-images.js --overwrite

  # Only populate categories, limit to 10
  node scripts/populate-images.js --skip-products --category-limit 10

  # Only populate products, limit to 50
  node scripts/populate-images.js --skip-categories --product-limit 50

Environment Variables:
  UNSPLASH_ACCESS_KEY     Your Unsplash API access key (required)
  MONGODB_URI            MongoDB connection string

Note: Make sure to set UNSPLASH_ACCESS_KEY in your .env file
  `);
}

async function main() {
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Check for required environment variables
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error('❌ Error: UNSPLASH_ACCESS_KEY not found in environment variables');
    console.error('   Please add UNSPLASH_ACCESS_KEY to your .env file');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in environment variables');
    console.error('   Please add MONGODB_URI to your .env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create image populator instance
    const populator = new ImagePopulator();

    // Show configuration
    console.log('\n⚙️  Configuration:');
    console.log(`   Overwrite existing: ${options.overwrite}`);
    console.log(`   Skip products: ${options.skipProducts}`);
    console.log(`   Skip categories: ${options.skipCategories}`);
    console.log(`   Product limit: ${options.productLimit || 'No limit'}`);
    console.log(`   Category limit: ${options.categoryLimit || 'No limit'}`);

    // Start population
    await populator.populateAllImages(options);

    console.log('\n🎉 Image population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during image population:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Process interrupted. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Process terminated. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
