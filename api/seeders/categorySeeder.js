/**
 * Category Seeder
 * Populates the database with sample categories for testing and development
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');

// Load environment variables
require('dotenv').config();

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api';

/**
 * Sample categories with hierarchical structure
 * Each category can have a parent_slug to indicate its parent category
 */
const sampleCategories = [
  // Root categories
  {
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    image_url: 'https://example.com/images/electronics.jpg',
    is_active: true
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel for all ages',
    image_url: 'https://example.com/images/clothing.jpg',
    is_active: true
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and gardening supplies',
    image_url: 'https://example.com/images/home-garden.jpg',
    is_active: true
  },
  {
    name: 'Books',
    description: 'Books, magazines, and digital publications',
    image_url: 'https://example.com/images/books.jpg',
    is_active: true
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    image_url: 'https://example.com/images/sports.jpg',
    is_active: true
  },
  {
    name: 'Toys & Games',
    description: 'Toys, games, and entertainment for children',
    image_url: 'https://example.com/images/toys.jpg',
    is_active: true
  },
  {
    name: 'Health & Beauty',
    description: 'Health, beauty, and personal care products',
    image_url: 'https://example.com/images/health-beauty.jpg',
    is_active: true
  },
  {
    name: 'Automotive',
    description: 'Car parts, accessories, and automotive supplies',
    image_url: 'https://example.com/images/automotive.jpg',
    is_active: true
  },

  // Electronics subcategories
  {
    name: 'Computers',
    description: 'Desktop computers, laptops, and computer accessories',
    parent_slug: 'electronics',
    image_url: 'https://example.com/images/computers.jpg',
    is_active: true
  },
  {
    name: 'Mobile Phones',
    description: 'Smartphones, tablets, and mobile accessories',
    parent_slug: 'electronics',
    image_url: 'https://example.com/images/mobile-phones.jpg',
    is_active: true
  },
  {
    name: 'Audio & Video',
    description: 'Headphones, speakers, cameras, and entertainment systems',
    parent_slug: 'electronics',
    image_url: 'https://example.com/images/audio-video.jpg',
    is_active: true
  },
  {
    name: 'Gaming',
    description: 'Video games, consoles, and gaming accessories',
    parent_slug: 'electronics',
    image_url: 'https://example.com/images/gaming.jpg',
    is_active: true
  },
  {
    name: 'Smart Home',
    description: 'Smart home devices and IoT products',
    parent_slug: 'electronics',
    image_url: 'https://example.com/images/smart-home.jpg',
    is_active: true
  },

  // Computers subcategories
  {
    name: 'Laptops',
    description: 'Portable computers and notebooks',
    parent_slug: 'computers',
    image_url: 'https://example.com/images/laptops.jpg',
    is_active: true
  },
  {
    name: 'Desktop Computers',
    description: 'Desktop PCs and workstations',
    parent_slug: 'computers',
    image_url: 'https://example.com/images/desktop-computers.jpg',
    is_active: true
  },
  {
    name: 'Computer Accessories',
    description: 'Keyboards, mice, monitors, and other peripherals',
    parent_slug: 'computers',
    image_url: 'https://example.com/images/computer-accessories.jpg',
    is_active: true
  },
  {
    name: 'Storage Devices',
    description: 'Hard drives, SSDs, and storage solutions',
    parent_slug: 'computers',
    image_url: 'https://example.com/images/storage-devices.jpg',
    is_active: true
  },

  // Clothing subcategories
  {
    name: "Men's Clothing",
    description: 'Clothing and accessories for men',
    parent_slug: 'clothing',
    image_url: 'https://example.com/images/mens-clothing.jpg',
    is_active: true
  },
  {
    name: "Women's Clothing",
    description: 'Clothing and accessories for women',
    parent_slug: 'clothing',
    image_url: 'https://example.com/images/womens-clothing.jpg',
    is_active: true
  },
  {
    name: "Children's Clothing",
    description: 'Clothing for kids and babies',
    parent_slug: 'clothing',
    image_url: 'https://example.com/images/childrens-clothing.jpg',
    is_active: true
  },
  {
    name: 'Shoes',
    description: 'Footwear for all occasions',
    parent_slug: 'clothing',
    image_url: 'https://example.com/images/shoes.jpg',
    is_active: true
  },
  {
    name: 'Accessories',
    description: 'Bags, jewelry, watches, and fashion accessories',
    parent_slug: 'clothing',
    image_url: 'https://example.com/images/accessories.jpg',
    is_active: true
  },

  // Home & Garden subcategories
  {
    name: 'Furniture',
    description: 'Home and office furniture',
    parent_slug: 'home-garden',
    image_url: 'https://example.com/images/furniture.jpg',
    is_active: true
  },
  {
    name: 'Kitchen & Dining',
    description: 'Kitchen appliances and dining essentials',
    parent_slug: 'home-garden',
    image_url: 'https://example.com/images/kitchen-dining.jpg',
    is_active: true
  },
  {
    name: 'Home Decor',
    description: 'Decorative items and home accessories',
    parent_slug: 'home-garden',
    image_url: 'https://example.com/images/home-decor.jpg',
    is_active: true
  },
  {
    name: 'Garden & Outdoor',
    description: 'Gardening tools and outdoor equipment',
    parent_slug: 'home-garden',
    image_url: 'https://example.com/images/garden-outdoor.jpg',
    is_active: true
  },
  {
    name: 'Tools & Hardware',
    description: 'Hand tools, power tools, and hardware',
    parent_slug: 'home-garden',
    image_url: 'https://example.com/images/tools-hardware.jpg',
    is_active: true
  },

  // Books subcategories
  {
    name: 'Fiction',
    description: 'Novels, short stories, and fictional literature',
    parent_slug: 'books',
    image_url: 'https://example.com/images/fiction.jpg',
    is_active: true
  },
  {
    name: 'Non-Fiction',
    description: 'Biographies, history, and educational books',
    parent_slug: 'books',
    image_url: 'https://example.com/images/non-fiction.jpg',
    is_active: true
  },
  {
    name: 'Educational',
    description: 'Textbooks and academic resources',
    parent_slug: 'books',
    image_url: 'https://example.com/images/educational.jpg',
    is_active: true
  },
  {
    name: 'Digital Books',
    description: 'E-books and digital publications',
    parent_slug: 'books',
    image_url: 'https://example.com/images/digital-books.jpg',
    is_active: true
  },

  // Sports & Outdoors subcategories
  {
    name: 'Exercise & Fitness',
    description: 'Fitness equipment and workout gear',
    parent_slug: 'sports-outdoors',
    image_url: 'https://example.com/images/exercise-fitness.jpg',
    is_active: true
  },
  {
    name: 'Team Sports',
    description: 'Equipment for team sports like basketball, soccer, etc.',
    parent_slug: 'sports-outdoors',
    image_url: 'https://example.com/images/team-sports.jpg',
    is_active: true
  },
  {
    name: 'Outdoor Recreation',
    description: 'Camping, hiking, and outdoor adventure gear',
    parent_slug: 'sports-outdoors',
    image_url: 'https://example.com/images/outdoor-recreation.jpg',
    is_active: true
  },
  {
    name: 'Water Sports',
    description: 'Swimming, surfing, and water activity equipment',
    parent_slug: 'sports-outdoors',
    image_url: 'https://example.com/images/water-sports.jpg',
    is_active: true
  },

  // One inactive category for testing
  {
    name: 'Discontinued Items',
    description: 'Items that are no longer available',
    image_url: 'https://example.com/images/discontinued.jpg',
    is_active: false
  }
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Clear existing categories
 */
const clearCategories = async () => {
  try {
    const result = await Category.deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} existing categories`);
  } catch (error) {
    console.error('❌ Error clearing categories:', error);
    throw error;
  }
};

/**
 * Create categories with proper parent-child relationships
 */
const createCategories = async () => {
  try {
    console.log('📝 Creating categories...');
    
    // Create a map to store created categories by their slug
    const categoryMap = new Map();
    
    // First, create all root categories (no parent_slug)
    const rootCategories = sampleCategories.filter(cat => !cat.parent_slug);
    
    for (const categoryData of rootCategories) {
      const category = new Category({
        name: categoryData.name,
        description: categoryData.description,
        image_url: categoryData.image_url,
        is_active: categoryData.is_active
      });
      
      const savedCategory = await category.save();
      categoryMap.set(savedCategory.slug, savedCategory);
      console.log(`✅ Created root category: ${savedCategory.name} (${savedCategory.slug})`);
    }
    
    // Then create subcategories level by level
    let remainingCategories = sampleCategories.filter(cat => cat.parent_slug);
    let maxAttempts = 5; // Prevent infinite loops
    let attempts = 0;
    
    while (remainingCategories.length > 0 && attempts < maxAttempts) {
      attempts++;
      const createdInThisRound = [];
      
      for (const categoryData of remainingCategories) {
        const parentCategory = categoryMap.get(categoryData.parent_slug);
        
        if (parentCategory) {
          const category = new Category({
            name: categoryData.name,
            description: categoryData.description,
            parent_category: parentCategory._id,
            image_url: categoryData.image_url,
            is_active: categoryData.is_active
          });
          
          const savedCategory = await category.save();
          categoryMap.set(savedCategory.slug, savedCategory);
          createdInThisRound.push(categoryData);
          console.log(`✅ Created subcategory: ${savedCategory.name} (${savedCategory.slug}) under ${parentCategory.name}`);
        }
      }
      
      // Remove categories that were created in this round
      remainingCategories = remainingCategories.filter(cat => 
        !createdInThisRound.includes(cat)
      );
      
      if (createdInThisRound.length === 0) {
        console.log('⚠️  No progress made in this round. Stopping to prevent infinite loop.');
        break;
      }
    }
    
    if (remainingCategories.length > 0) {
      console.log(`⚠️  Could not create ${remainingCategories.length} categories due to missing parents:`);
      remainingCategories.forEach(cat => {
        console.log(`   - ${cat.name} (parent: ${cat.parent_slug})`);
      });
    }
    
    // Get final count
    const totalCount = await Category.countDocuments();
    const activeCount = await Category.countDocuments({ is_active: true });
    const inactiveCount = await Category.countDocuments({ is_active: false });
    
    console.log(`\n📊 Categories created successfully:`);
    console.log(`   Total: ${totalCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${inactiveCount}`);
    
    return totalCount;
    
  } catch (error) {
    console.error('❌ Error creating categories:', error);
    throw error;
  }
};

/**
 * Display category tree structure
 */
const displayCategoryTree = async () => {
  try {
    console.log('\n🌳 Category Tree Structure:');
    
    const categoryTree = await Category.getCategoryTree(true); // Include inactive for admin view
    
    const displayTree = (categories, indent = '') => {
      categories.forEach((category, index) => {
        const isLast = index === categories.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const statusIndicator = category.is_active ? '✅' : '❌';
        
        console.log(`${indent}${connector}${statusIndicator} ${category.name} (${category.slug})`);
        
        if (category.children && category.children.length > 0) {
          const childIndent = indent + (isLast ? '    ' : '│   ');
          displayTree(category.children, childIndent);
        }
      });
    };
    
    displayTree(categoryTree);
    
  } catch (error) {
    console.error('❌ Error displaying category tree:', error);
  }
};

/**
 * Main seeder function
 */
const seedCategories = async () => {
  try {
    console.log('🌱 Starting Category Seeder...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing categories
    await clearCategories();
    
    // Create new categories
    const totalCreated = await createCategories();
    
    // Display the tree structure
    await displayCategoryTree();
    
    console.log(`\n🎉 Category seeding completed successfully! Created ${totalCreated} categories.`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed.');
    process.exit(0);
  }
};

/**
 * Run seeder if this file is executed directly
 */
if (require.main === module) {
  seedCategories();
}

module.exports = {
  seedCategories,
  sampleCategories
};
