/**
 * Database Seeder
 * Command-line tool for seeding and cleaning database tables
 * 
 * Usage:
 *   node seeders/seeder.js seed users
 *   node seeders/seeder.js clean products
 *   node seeders/seeder.js seed all
 *   node seeders/seeder.js clean all
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Option = require('../models/Option');
const ProductVariant = require('../models/ProductVariant');
const ProductReview = require('../models/ProductReview');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');
const SupplierContactNumber = require('../models/SupplierContactNumber');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Platform = require('../models/Platform');
const Listing = require('../models/Listing');
const CouponCampaign = require('../models/CouponCampaign');
const UserCoupon = require('../models/UserCoupon');
const DynamicContent = require('../models/DynamicContent');
const BlogPost = require('../models/BlogPost');
const Favorite = require('../models/Favorite');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const SupportTicket = require('../models/SupportTicket');

// Import individual seeders
const userSeeder = require('./data/userSeeder');
const categorySeeder = require('./data/categorySeeder');
const brandSeeder = require('./brandSeeder');
const productSeeder = require('./data/productSeeder');
const optionSeeder = require('./data/optionSeeder');
const productVariantSeeder = require('./data/productVariantSeeder');
const productReviewSeeder = require('./data/productReviewSeeder');
const orderSeeder = require('./data/orderSeeder');
const orderItemSeeder = require('./data/orderItemSeeder');
const supplierSeeder = require('./data/supplierSeeder');
const supplierContactNumberSeeder = require('./data/supplierContactNumberSeeder');
const purchaseSeeder = require('./data/purchaseSeeder');
const inventorySeeder = require('./data/inventorySeeder');
const listingSeeder = require('./data/listingSeeder');
const couponSeeder = require('./data/couponSeeder');
const dynamicContentSeeder = require('./data/dynamicContentSeeder');
const blogPostSeeder = require('./data/blogPostSeeder');
const favoriteSeeder = require('./data/favoriteSeeder');
const cartSeeder = require('./data/cartSeeder');
const cartItemSeeder = require('./data/cartItemSeeder');
const supportTicketSeeder = require('./data/supportTicketSeeder');

/**
 * Seeder configuration
 * Defines available seeders and their dependencies
 */
const SEEDERS = [
  userSeeder,
  categorySeeder,
  productSeeder,
  orderSeeder,
  orderItemSeeder,
  dynamicContentSeeder,
  blogPostSeeder,
  favoriteSeeder,
  cartSeeder,
  cartItemSeeder
];

/**
 * Database connection
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from database
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📊 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
};

/**
 * Get seeder by name
 */
const getSeeder = (name) => {
  if (!SEEDERS[name]) {
    console.error(`❌ Seeder '${name}' not found`);
    console.log('Available seeders:', Object.keys(SEEDERS).join(', '));
    return null;
  }
  return SEEDERS[name];
};

/**
 * Validate dependencies for a seeder
 */
const validateDependencies = async (seederName, operation = 'seed') => {
  const seeder = getSeeder(seederName);
  if (!seeder) return false;

  const { dependencies } = seeder;
  
  if (operation === 'seed' && dependencies.length > 0) {
    for (const dep of dependencies) {
      const depSeeder = getSeeder(dep);
      if (!depSeeder) continue;
      
      const count = await depSeeder.model.countDocuments();
      if (count === 0) {
        console.warn(`⚠️  Dependency '${dep}' has no data. Consider seeding it first.`);
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Get seeding order based on dependencies
 */
const getSeederOrder = (seederNames) => {
  const order = [];
  const visited = new Set();
  const visiting = new Set();
  
  const visit = (name) => {
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected involving '${name}'`);
    }
    
    if (visited.has(name)) return;
    
    visiting.add(name);
    
    const seeder = getSeeder(name);
    if (seeder) {
      for (const dep of seeder.dependencies) {
        if (seederNames.includes(dep)) {
          visit(dep);
        }
      }
    }
    
    visiting.delete(name);
    visited.add(name);
    order.push(name);
  };
  
  for (const name of seederNames) {
    visit(name);
  }
  
  return order;
};

/**
 * Seed a specific table
 */
const seedTable = async (tableName, options = {}) => {
  const { force = false, verbose = true, append = false } = options;
  
  const seeder = getSeeder(tableName);
  if (!seeder) return false;
  
  const { model, seeder: seederModule, description } = seeder;
  
  try {
    // Check if table already has data
    const existingCount = await model.countDocuments();
    if (existingCount > 0 && !force && !append) {
      console.log(`⚠️  Table '${tableName}' already has ${existingCount} records. Use --force to overwrite or --append to add more.`);
      return false;
    }
    
    // Validate dependencies
    const depsValid = await validateDependencies(tableName, 'seed');
    if (!depsValid) {
      console.log(`❌ Dependencies not met for '${tableName}'`);
      return false;
    }
    
    if (verbose) {
      if (append && existingCount > 0) {
        console.log(`🌱 Appending to ${tableName} (${description})... ${existingCount} existing records`);
      } else {
        console.log(`🌱 Seeding ${tableName} (${description})...`);
      }
    }
    
    // Clear existing data if force is true (but not when appending)
    if (force && existingCount > 0 && !append) {
      await model.deleteMany({});
      if (verbose) {
        console.log(`🗑️  Cleared ${existingCount} existing records`);
      }
    }
    
    // Run the seeder
    const result = await seederModule.seed(model);
    
    if (verbose) {
      console.log(`✅ Successfully seeded ${tableName}: ${result.count} records created`);
      if (result.summary) {
        console.log(`   ${result.summary}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error seeding ${tableName}:`, error.message);
    if (verbose && error.details) {
      console.error('   Details:', error.details);
    }
    return false;
  }
};

/**
 * Clean a specific table
 */
const cleanTable = async (tableName, options = {}) => {
  const { verbose = true } = options;
  
  const seeder = getSeeder(tableName);
  if (!seeder) return false;
  
  const { model, description } = seeder;
  
  try {
    const count = await model.countDocuments();
    
    if (count === 0) {
      if (verbose) {
        console.log(`ℹ️  Table '${tableName}' is already empty`);
      }
      return true;
    }
    
    if (verbose) {
      console.log(`🗑️  Cleaning ${tableName} (${description})...`);
    }
    
    await model.deleteMany({});
    
    if (verbose) {
      console.log(`✅ Successfully cleaned ${tableName}: ${count} records removed`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error cleaning ${tableName}:`, error.message);
    return false;
  }
};

/**
 * Seed all tables
 */
const seedAll = async (options = {}) => {
  const { force = false, verbose = true } = options;
  
  if (verbose) {
    console.log('🌱 Seeding all tables...\n');
  }
  
  const seederNames = Object.keys(SEEDERS);
  const order = getSeederOrder(seederNames);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tableName of order) {
    const success = await seedTable(tableName, { force, verbose });
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    if (verbose && order.indexOf(tableName) < order.length - 1) {
      console.log(); // Add spacing between tables
    }
  }
  
  if (verbose) {
    console.log(`\n📊 Seeding summary: ${successCount} successful, ${failCount} failed`);
  }
  
  return failCount === 0;
};

/**
 * Clean all tables
 */
const cleanAll = async (options = {}) => {
  const { verbose = true } = options;
  
  if (verbose) {
    console.log('🗑️  Cleaning all tables...\n');
  }
  
  const seederNames = Object.keys(SEEDERS);
  // Clean in reverse dependency order
  const order = getSeederOrder(seederNames).reverse();
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tableName of order) {
    const success = await cleanTable(tableName, { verbose });
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    if (verbose && order.indexOf(tableName) < order.length - 1) {
      console.log(); // Add spacing between tables
    }
  }
  
  if (verbose) {
    console.log(`\n📊 Cleaning summary: ${successCount} successful, ${failCount} failed`);
  }
  
  return failCount === 0;
};

/**
 * Show status of all tables
 */
const showStatus = async () => {
  console.log('📊 Database Status\n');
  
  const tableInfo = [];
  
  for (const [name, config] of Object.entries(SEEDERS)) {
    try {
      const count = await config.model.countDocuments();
      const lastRecord = await config.model.findOne().sort({ createdAt: -1 }).select('createdAt');
      
      tableInfo.push({
        name,
        description: config.description,
        count,
        lastUpdate: lastRecord?.createdAt || 'Never',
        dependencies: config.dependencies.length > 0 ? config.dependencies.join(', ') : 'None'
      });
    } catch (error) {
      tableInfo.push({
        name,
        description: config.description,
        count: 'Error',
        lastUpdate: 'Error',
        dependencies: config.dependencies.length > 0 ? config.dependencies.join(', ') : 'None'
      });
    }
  }
  
  // Display table
  console.table(tableInfo);
};

/**
 * Main execution function
 */
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🌱 Database Seeder

Usage:
  node seeders/seeder.js <command> <table> [options]

Commands:
  seed <table>     Seed a specific table
  clean <table>    Clean a specific table  
  seed all         Seed all tables
  clean all        Clean all tables
  status           Show database status
  list             List available seeders

Options:
  --force          Force operation (overwrite existing data)
  --append         Add to existing data without clearing
  --quiet          Suppress verbose output

Examples:
  node seeders/seeder.js seed users
  node seeders/seeder.js seed users --append
  node seeders/seeder.js clean products --force
  node seeders/seeder.js seed all
  node seeders/seeder.js status
    `);
    process.exit(0);
  }
  
  const command = args[0];
  const table = args[1];
  const force = args.includes('--force');
  const append = args.includes('--append');
  const quiet = args.includes('--quiet');
  const verbose = !quiet;
  
  try {
    await connectDB();
    
    let success = false;
    
    switch (command) {
      case 'seed':
        if (table === 'all') {
          success = await seedAll({ force, verbose });
        } else if (table) {
          success = await seedTable(table, { force, append, verbose });
        } else {
          console.error('❌ Table name required for seed command');
          process.exit(1);
        }
        break;
        
      case 'clean':
        if (table === 'all') {
          success = await cleanAll({ verbose });
        } else if (table) {
          success = await cleanTable(table, { verbose });
        } else {
          console.error('❌ Table name required for clean command');
          process.exit(1);
        }
        break;
        
      case 'status':
        await showStatus();
        success = true;
        break;
        
      case 'list':
        console.log('📋 Available Seeders:\n');
        for (const [name, config] of Object.entries(SEEDERS)) {
          console.log(`• ${name}: ${config.description}`);
          if (config.dependencies.length > 0) {
            console.log(`  Dependencies: ${config.dependencies.join(', ')}`);
          }
        }
        success = true;
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    
    if (!success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

// Run the seeder if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedTable,
  cleanTable,
  seedAll,
  cleanAll,
  showStatus,
  SEEDERS
};
