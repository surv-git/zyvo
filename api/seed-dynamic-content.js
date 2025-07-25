/**
 * Standalone Dynamic Content Seeder Script
 * Run this script directly to seed dynamic content
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dynamicContentSeeder = require('./seeders/data/dynamicContentSeeder');

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Run the seeder
    await dynamicContentSeeder.seed();

    console.log('🎉 Dynamic content seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
