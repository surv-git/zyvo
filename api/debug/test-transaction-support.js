/**
 * Test script to check if MongoDB supports transactions
 * Run this to verify the transaction detection logic
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Check if MongoDB instance supports transactions
const checkTransactionSupport = async () => {
  try {
    // In test environment, skip transactions
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    
    // Check if we're connected to a replica set or sharded cluster
    const admin = mongoose.connection.db.admin();
    const result = await admin.command({ isMaster: 1 });
    
    console.log('MongoDB isMaster result:', {
      setName: result.setName,
      msg: result.msg,
      ismaster: result.ismaster,
      secondary: result.secondary
    });
    
    // Transactions are supported on replica sets and sharded clusters
    return result.setName || result.msg === 'isdbgrid';
  } catch (error) {
    console.warn('Could not check transaction support, assuming standalone MongoDB:', error.message);
    return false;
  }
};

async function testTransactionSupport() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const supportsTransactions = await checkTransactionSupport();
    
    console.log('\n🔍 Transaction Support Analysis:');
    console.log(`   Supports Transactions: ${supportsTransactions ? '✅ YES' : '❌ NO'}`);
    console.log(`   MongoDB Type: ${supportsTransactions ? 'Replica Set or Sharded Cluster' : 'Standalone Instance'}`);
    
    if (!supportsTransactions) {
      console.log('\n💡 This explains why you were getting transaction errors.');
      console.log('   The cart operations will now work without transactions.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTransactionSupport();
