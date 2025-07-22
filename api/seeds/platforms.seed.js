/**
 * Platform Seeder
 * Seeds the database with major e-commerce platforms
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const Platform = require('../models/Platform');

// Platform data to seed
const platformsData = [
  {
    name: 'Amazon',
    slug: 'amazon',
    description: 'Global e-commerce and cloud computing giant with marketplace for millions of products',
    base_url: 'https://www.amazon.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    api_credentials_placeholder: 'Amazon MWS/SP-API credentials required',
    is_active: true
  },
  {
    name: 'Myntra',
    slug: 'myntra',
    description: 'Leading fashion and lifestyle e-commerce platform in India',
    base_url: 'https://www.myntra.com',
    logo_url: 'https://logos-world.net/wp-content/uploads/2020/11/Myntra-Logo.png',
    api_credentials_placeholder: 'Myntra Partner API credentials required',
    is_active: true
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    description: 'One of India\'s largest e-commerce marketplaces offering diverse product categories',
    base_url: 'https://www.flipkart.com',
    logo_url: 'https://logos-world.net/wp-content/uploads/2020/11/Flipkart-Logo.png',
    api_credentials_placeholder: 'Flipkart Marketplace API credentials required',
    is_active: true
  },
  {
    name: 'Meesho',
    slug: 'meesho',
    description: 'Social commerce platform enabling individuals to start online businesses',
    base_url: 'https://www.meesho.com',
    logo_url: 'https://static.meesho.com/web/images/logos/meesho-logo-dark.png',
    api_credentials_placeholder: 'Meesho Partner API credentials required',
    is_active: true
  },
  {
    name: 'Zyvo',
    slug: 'zyvo',
    description: 'Modern e-commerce platform providing comprehensive marketplace solutions',
    base_url: 'https://www.zyvo.com',
    logo_url: 'https://zyvo.com/logo.png',
    api_credentials_placeholder: 'Internal platform - no external API credentials needed',
    is_active: true
  }
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Seed platforms
 */
const seedPlatforms = async () => {
  try {
    console.log('🌱 Starting platform seeding...');

    // Clear existing platforms (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing platforms...');
    await Platform.deleteMany({});

    // Insert new platforms
    console.log('📦 Inserting platform data...');
    
    for (const platformData of platformsData) {
      try {
        const platform = new Platform(platformData);
        await platform.save();
        console.log(`✅ Created platform: ${platform.name} (slug: ${platform.slug})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Platform ${platformData.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating platform ${platformData.name}:`, error.message);
        }
      }
    }

    // Display summary
    const totalPlatforms = await Platform.countDocuments();
    const activePlatforms = await Platform.countDocuments({ is_active: true });
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Total platforms: ${totalPlatforms}`);
    console.log(`   Active platforms: ${activePlatforms}`);
    
    // Display all platforms
    console.log('\n🏪 Seeded Platforms:');
    const platforms = await Platform.find().sort({ name: 1 });
    platforms.forEach(platform => {
      console.log(`   • ${platform.name} (${platform.slug}) - ${platform.is_active ? 'Active' : 'Inactive'}`);
    });

    console.log('\n🎉 Platform seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during platform seeding:', error);
    throw error;
  }
};

/**
 * Main execution function
 */
const main = async () => {
  try {
    await connectDB();
    await seedPlatforms();
    console.log('✨ Seeding process completed. Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedPlatforms, platformsData };
