/**
 * Support Ticket Seeder Script
 * Standalone script to seed support tickets
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const supportTicketSeeder = require('./data/supportTicketSeeder');

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
 * Main execution function
 */
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';
  const count = parseInt(args[1]) || 50;

  try {
    await connectDB();

    if (command === 'seed') {
      console.log('🎫 Seeding Support Tickets...\n');
      
      // Check if we have users to assign tickets to
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('❌ No users found. Please seed users first.');
        console.log('   Run: node seeders/seeder.js seed users');
        return;
      }

      const result = await supportTicketSeeder.seed(SupportTicket, User);
      console.log(`✅ Successfully seeded ${result.count} support tickets`);
      console.log(`   ${result.summary}`);
      
    } else if (command === 'clean') {
      console.log('🧹 Cleaning Support Tickets...\n');
      
      const result = await supportTicketSeeder.clean(SupportTicket);
      console.log(`✅ Successfully cleaned ${result.count} support tickets`);
      
    } else if (command === 'status') {
      console.log('📊 Support Tickets Status...\n');
      
      const totalCount = await SupportTicket.countDocuments();
      const statusCounts = await SupportTicket.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const priorityCounts = await SupportTicket.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`Total Support Tickets: ${totalCount}`);
      console.log('\nBy Status:');
      statusCounts.forEach(item => {
        console.log(`  ${item._id}: ${item.count}`);
      });
      
      console.log('\nBy Priority:');
      priorityCounts.forEach(item => {
        console.log(`  ${item._id}: ${item.count}`);
      });
      
    } else {
      console.log('❌ Invalid command. Use: seed, clean, or status');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await disconnectDB();
  }
};

// Show help if no arguments
if (process.argv.length <= 2) {
  console.log(`
🎫 Support Ticket Seeder

Usage: node seeders/seedSupportTickets.js <command> [count]

Commands:
  seed [count]     Seed support tickets (default: 50)
  clean            Remove all support tickets
  status           Show support ticket statistics

Examples:
  node seeders/seedSupportTickets.js seed
  node seeders/seedSupportTickets.js seed 100
  node seeders/seedSupportTickets.js clean
  node seeders/seedSupportTickets.js status
`);
  process.exit(0);
}

main().catch(console.error);
