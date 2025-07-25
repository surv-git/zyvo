/**
 * Wallet and Wallet Transaction Seeder
 * Seeds wallets for all users and creates realistic transaction history
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
require('dotenv').config();

// Configuration
const INITIAL_BALANCE_RANGE = { min: 0, max: 5000 };
const TRANSACTIONS_PER_WALLET_RANGE = { min: 3, max: 15 };
const CURRENCY = 'INR';

// Transaction types and their details
const TRANSACTION_TYPES = {
  CREDIT: [
    {
      description: 'Payment gateway credit - successful payment',
      reference_type: 'PAYMENT_GATEWAY',
      payment_method: 'UPI',
      initiated_by_actor: 'USER',
      amount_range: { min: 100, max: 2000 }
    },
    {
      description: 'Refund processed for cancelled order',
      reference_type: 'REFUND',
      initiated_by_actor: 'SYSTEM',
      amount_range: { min: 50, max: 1500 }
    },
    {
      description: 'Admin wallet adjustment - bonus credit',
      reference_type: 'ADMIN_ADJUSTMENT',
      initiated_by_actor: 'ADMIN',
      amount_range: { min: 25, max: 500 }
    },
    {
      description: 'Payment gateway credit - card payment',
      reference_type: 'PAYMENT_GATEWAY',
      payment_method: 'CARD',
      initiated_by_actor: 'USER',
      amount_range: { min: 200, max: 3000 }
    },
    {
      description: 'Payment gateway credit - net banking',
      reference_type: 'PAYMENT_GATEWAY',
      payment_method: 'NET_BANKING',
      initiated_by_actor: 'USER',
      amount_range: { min: 300, max: 2500 }
    }
  ],
  DEBIT: [
    {
      description: 'Order payment deducted from wallet',
      reference_type: 'ORDER',
      initiated_by_actor: 'USER',
      amount_range: { min: 50, max: 1200 }
    },
    {
      description: 'Withdrawal to bank account',
      reference_type: 'WITHDRAWAL',
      initiated_by_actor: 'USER',
      amount_range: { min: 100, max: 2000 }
    },
    {
      description: 'Admin adjustment - penalty deduction',
      reference_type: 'ADMIN_ADJUSTMENT',
      initiated_by_actor: 'ADMIN',
      amount_range: { min: 10, max: 200 }
    },
    {
      description: 'Order payment for premium service',
      reference_type: 'ORDER',
      initiated_by_actor: 'USER',
      amount_range: { min: 200, max: 800 }
    }
  ]
};

// Helper functions
function getRandomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateObjectId() {
  return new mongoose.Types.ObjectId();
}

function getRandomDate(daysBack = 90) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000));
  return pastDate;
}

// Generate gateway transaction ID
function generateGatewayTransactionId(paymentMethod) {
  const prefixes = {
    'UPI': 'UPI',
    'CARD': 'CRD',
    'NET_BANKING': 'NBK'
  };
  const prefix = prefixes[paymentMethod] || 'TXN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

async function seedWallets() {
  try {
    console.log('🚀 Starting wallet and transaction seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find().select('_id email');
    console.log(`📊 Found ${users.length} users to create wallets for`);

    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    // Clear existing data
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    console.log('🧹 Cleared existing wallet data');

    const wallets = [];
    const allTransactions = [];
    let totalTransactions = 0;

    // Create wallets and transactions for each user
    for (const user of users) {
      // Create wallet with random initial balance
      const initialBalance = getRandomFloat(
        INITIAL_BALANCE_RANGE.min,
        INITIAL_BALANCE_RANGE.max
      );

      const wallet = {
        user_id: user._id,
        balance: initialBalance,
        currency: CURRENCY,
        status: 'ACTIVE',
        last_transaction_at: new Date(),
        total_credited_amount: 0,
        total_debited_amount: 0,
        total_transactions_count: 0
      };

      wallets.push(wallet);

      // Generate transaction history for this wallet
      const transactionCount = getRandomInt(
        TRANSACTIONS_PER_WALLET_RANGE.min,
        TRANSACTIONS_PER_WALLET_RANGE.max
      );

      let currentBalance = 0; // Start from 0 and build up to final balance
      const walletTransactions = [];

      // Generate transactions in chronological order
      const transactionDates = [];
      for (let i = 0; i < transactionCount; i++) {
        transactionDates.push(getRandomDate(60)); // Last 60 days
      }
      transactionDates.sort((a, b) => a - b); // Sort chronologically

      let totalCredited = 0;
      let totalDebited = 0;

      for (let i = 0; i < transactionCount; i++) {
        // Decide transaction type - favor credits early to build balance
        const shouldCredit = i < transactionCount * 0.6 || currentBalance < 100;
        const transactionType = shouldCredit && Math.random() > 0.3 ? 'CREDIT' : 'DEBIT';
        
        // Skip debit if it would make balance negative
        if (transactionType === 'DEBIT' && currentBalance < 50) {
          continue;
        }

        const typeConfig = getRandomElement(TRANSACTION_TYPES[transactionType]);
        const amount = getRandomFloat(typeConfig.amount_range.min, typeConfig.amount_range.max);

        // Update balance
        if (transactionType === 'CREDIT') {
          currentBalance += amount;
          totalCredited += amount;
        } else {
          if (currentBalance >= amount) {
            currentBalance -= amount;
            totalDebited += amount;
          } else {
            continue; // Skip this transaction
          }
        }

        const transaction = {
          wallet_id: null, // Will be updated after wallet creation
          user_id: user._id,
          transaction_type: transactionType,
          amount: amount,
          currency: CURRENCY,
          description: typeConfig.description,
          reference_type: typeConfig.reference_type,
          reference_id: typeConfig.reference_type === 'ORDER' ? generateObjectId() : 
                        typeConfig.reference_type === 'REFUND' ? generateObjectId() : null,
          current_balance_after_transaction: currentBalance,
          status: Math.random() > 0.05 ? 'COMPLETED' : 'FAILED', // 95% success rate
          initiated_by_actor: typeConfig.initiated_by_actor,
          failure_reason: null,
          payment_method: typeConfig.payment_method || null,
          gateway_transaction_id: typeConfig.payment_method ? 
                                 generateGatewayTransactionId(typeConfig.payment_method) : null,
          gateway_response: typeConfig.payment_method ? {
            status: 'SUCCESS',
            provider: typeConfig.payment_method === 'UPI' ? 'PAYTM' : 
                     typeConfig.payment_method === 'CARD' ? 'RAZORPAY' : 'HDFC_BANK',
            transaction_fee: getRandomFloat(1, 10),
            processing_time_ms: getRandomInt(1000, 5000)
          } : null,
          metadata: {
            ip_address: `192.168.1.${getRandomInt(1, 254)}`,
            user_agent: 'Mozilla/5.0 (compatible; ZyvoApp/1.0)',
            device_type: getRandomElement(['mobile', 'desktop', 'tablet'])
          },
          createdAt: transactionDates[i],
          updatedAt: transactionDates[i]
        };

        // Handle failed transactions
        if (transaction.status === 'FAILED') {
          transaction.failure_reason = getRandomElement([
            'Insufficient funds',
            'Payment gateway timeout',
            'Invalid payment method',
            'Bank declined transaction',
            'Network error'
          ]);
          // Revert balance for failed transactions
          if (transactionType === 'CREDIT') {
            currentBalance -= amount;
            totalCredited -= amount;
          } else {
            currentBalance += amount;
            totalDebited -= amount;
          }
          transaction.current_balance_after_transaction = currentBalance;
        }

        walletTransactions.push(transaction);
        totalTransactions++;
      }

      // Adjust final wallet balance to match last transaction
      wallet.balance = currentBalance;
      wallet.total_credited_amount = totalCredited;
      wallet.total_debited_amount = totalDebited;
      wallet.total_transactions_count = walletTransactions.length;
      wallet.last_transaction_at = walletTransactions.length > 0 ? 
                                   walletTransactions[walletTransactions.length - 1].createdAt : 
                                   new Date();

      allTransactions.push(...walletTransactions);
    }

    // Insert wallets first
    console.log('💰 Creating wallets...');
    const insertedWallets = await Wallet.insertMany(wallets);
    console.log(`✅ Created ${insertedWallets.length} wallets`);

    // Update transaction wallet_ids and insert transactions
    if (allTransactions.length > 0) {
      console.log('💸 Creating wallet transactions...');
      
      // Map user_id to wallet_id for quick lookup
      const userWalletMap = {};
      insertedWallets.forEach(wallet => {
        userWalletMap[wallet.user_id.toString()] = wallet._id;
      });

      // Update wallet_id in all transactions
      allTransactions.forEach(transaction => {
        transaction.wallet_id = userWalletMap[transaction.user_id.toString()];
      });

      const insertedTransactions = await WalletTransaction.insertMany(allTransactions);
      console.log(`✅ Created ${insertedTransactions.length} wallet transactions`);
    }

    // Generate summary statistics
    const stats = await generateSummaryStats();
    console.log('\n📈 SEEDING SUMMARY:');
    console.log('==================');
    console.log(`👥 Total wallets created: ${stats.totalWallets}`);
    console.log(`💳 Total transactions created: ${stats.totalTransactions}`);
    console.log(`💰 Total wallet balance: ₹${stats.totalBalance.toLocaleString()}`);
    console.log(`📊 Average balance per wallet: ₹${stats.averageBalance.toLocaleString()}`);
    console.log(`📈 Total credited amount: ₹${stats.totalCredited.toLocaleString()}`);
    console.log(`📉 Total debited amount: ₹${stats.totalDebited.toLocaleString()}`);
    console.log(`✅ Success rate: ${stats.successRate}%`);
    console.log('\n🎯 Transaction distribution:');
    Object.entries(stats.transactionTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} transactions`);
    });

    console.log('\n🎉 Wallet seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding wallets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function generateSummaryStats() {
  const wallets = await Wallet.find();
  const transactions = await WalletTransaction.find();

  const totalWallets = wallets.length;
  const totalTransactions = transactions.length;
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const averageBalance = totalBalance / totalWallets;
  
  const totalCredited = wallets.reduce((sum, wallet) => sum + wallet.total_credited_amount, 0);
  const totalDebited = wallets.reduce((sum, wallet) => sum + wallet.total_debited_amount, 0);
  
  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED').length;
  const successRate = ((completedTransactions / totalTransactions) * 100).toFixed(1);

  const transactionTypes = {};
  transactions.forEach(t => {
    const key = `${t.transaction_type} - ${t.reference_type || 'N/A'}`;
    transactionTypes[key] = (transactionTypes[key] || 0) + 1;
  });

  return {
    totalWallets,
    totalTransactions,
    totalBalance: Math.round(totalBalance * 100) / 100,
    averageBalance: Math.round(averageBalance * 100) / 100,
    totalCredited: Math.round(totalCredited * 100) / 100,
    totalDebited: Math.round(totalDebited * 100) / 100,
    successRate,
    transactionTypes
  };
}

// Run seeder if called directly
if (require.main === module) {
  seedWallets();
}

module.exports = { seedWallets };
