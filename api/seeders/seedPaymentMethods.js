/**
 * Seed script for Payment Methods
 * Creates sample payment methods for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');

// Sample payment method data
const samplePaymentMethods = [
  // Credit Cards
  {
    method_type: 'CREDIT_CARD',
    alias: 'Primary Visa',
    is_default: true,
    details: {
      card_brand: 'Visa',
      last4_digits: '4242',
      expiry_month: '12',
      expiry_year: '2028',
      card_holder_name: 'John Doe',
      token: 'tok_visa_4242424242424242'
    }
  },
  {
    method_type: 'CREDIT_CARD',
    alias: 'Business MasterCard',
    is_default: false,
    details: {
      card_brand: 'MasterCard',
      last4_digits: '5555',
      expiry_month: '10',
      expiry_year: '2027',
      card_holder_name: 'John Doe',
      token: 'tok_mc_5555555555554444'
    }
  },
  // Debit Cards
  {
    method_type: 'DEBIT_CARD',
    alias: 'SBI Debit',
    is_default: false,
    details: {
      card_brand: 'RuPay',
      last4_digits: '6789',
      expiry_month: '06',
      expiry_year: '2026',
      card_holder_name: 'John Doe',
      token: 'tok_rupay_6073849000000016'
    }
  },
  {
    method_type: 'DEBIT_CARD',
    alias: 'HDFC Platinum',
    is_default: false,
    details: {
      card_brand: 'Visa',
      last4_digits: '1234',
      expiry_month: '03',
      expiry_year: '2029',
      card_holder_name: 'John Doe',
      token: 'tok_hdfc_4000000000000002'
    }
  },
  // UPI
  {
    method_type: 'UPI',
    alias: 'Primary UPI',
    is_default: false,
    details: {
      upi_id: 'john.doe@okaxis',
      account_holder_name: 'John Doe'
    }
  },
  {
    method_type: 'UPI',
    alias: 'Google Pay',
    is_default: false,
    details: {
      upi_id: 'johndoe@paytm',
      account_holder_name: 'John Doe'
    }
  },
  // Wallets
  {
    method_type: 'WALLET',
    alias: 'Paytm Wallet',
    is_default: false,
    details: {
      wallet_provider: 'Paytm',
      linked_account_identifier: '+919876543210'
    }
  },
  {
    method_type: 'WALLET',
    alias: 'PhonePe Wallet',
    is_default: false,
    details: {
      wallet_provider: 'PhonePe',
      linked_account_identifier: '+919876543210'
    }
  },
  // Net Banking
  {
    method_type: 'NETBANKING',
    alias: 'SBI NetBanking',
    is_default: false,
    details: {
      bank_name: 'State Bank of India',
      account_holder_name: 'John Doe',
      token: 'nb_sbi_12345678901234567890'
    }
  },
  {
    method_type: 'NETBANKING',
    alias: 'HDFC NetBanking',
    is_default: false,
    details: {
      bank_name: 'HDFC Bank',
      account_holder_name: 'John Doe',
      token: 'nb_hdfc_09876543210987654321'
    }
  }
];

// Additional payment methods for different users
const morePaymentMethods = [
  // Alice Johnson's payment methods
  {
    method_type: 'CREDIT_CARD',
    alias: 'Alice Amex Gold',
    is_default: true,
    details: {
      card_brand: 'Amex',
      last4_digits: '1005',
      expiry_month: '04',
      expiry_year: '2028',
      card_holder_name: 'Alice Johnson',
      token: 'tok_amex_378282246310005'
    }
  },
  {
    method_type: 'UPI',
    alias: 'Alice UPI',
    is_default: false,
    details: {
      upi_id: 'alice.johnson@okicici',
      account_holder_name: 'Alice Johnson'
    }
  },
  {
    method_type: 'WALLET',
    alias: 'GooglePay Wallet',
    is_default: false,
    details: {
      wallet_provider: 'GooglePay',
      linked_account_identifier: '+918765432109'
    }
  },
  // Bob Smith's payment methods
  {
    method_type: 'DEBIT_CARD',
    alias: 'Bob Chase Debit',
    is_default: true,
    details: {
      card_brand: 'Visa',
      last4_digits: '0019',
      expiry_month: '08',
      expiry_year: '2027',
      card_holder_name: 'Bob Smith',
      token: 'tok_visa_4000000000000010'
    }
  },
  {
    method_type: 'NETBANKING',
    alias: 'ICICI NetBanking',
    is_default: false,
    details: {
      bank_name: 'ICICI Bank',
      account_holder_name: 'Bob Smith',
      token: 'nb_icici_11111111111111111111'
    }
  },
  // Carol Williams's payment methods
  {
    method_type: 'CREDIT_CARD',
    alias: 'Carol Discover',
    is_default: true,
    details: {
      card_brand: 'Discover',
      last4_digits: '1117',
      expiry_month: '09',
      expiry_year: '2026',
      card_holder_name: 'Carol Williams',
      token: 'tok_discover_6011111111111117'
    }
  },
  {
    method_type: 'UPI',
    alias: 'Carol PhonePe UPI',
    is_default: false,
    details: {
      upi_id: 'carol.williams@ybl',
      account_holder_name: 'Carol Williams'
    }
  }
];

/**
 * Seed payment methods for existing users
 */
const seedPaymentMethods = async () => {
  try {
    console.log('💳 Starting payment methods seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing payment methods
    const deleteResult = await PaymentMethod.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing payment methods`);

    // Get some users to assign payment methods to
    const users = await User.find({ role: 'user' }).limit(5);
    console.log(`👥 Found ${users.length} users for payment method assignment`);

    if (users.length === 0) {
      console.log('❌ No users found. Please run user seeding first.');
      return;
    }

    let paymentMethodCount = 0;
    let allPaymentMethods = [...samplePaymentMethods, ...morePaymentMethods];
    
    // Assign payment methods to users
    for (let i = 0; i < users.length && i < allPaymentMethods.length; i++) {
      const user = users[i];
      
      // Give each user 2-4 payment methods
      const numPaymentMethods = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < numPaymentMethods && (i * 4 + j) < allPaymentMethods.length; j++) {
        const paymentMethodData = { ...allPaymentMethods[i * 3 + j] };
        paymentMethodData.user_id = user._id;
        
        // Ensure only one default per user
        if (j > 0) {
          paymentMethodData.is_default = false;
        }
        
        const paymentMethod = new PaymentMethod(paymentMethodData);
        await paymentMethod.save();
        paymentMethodCount++;
        
        console.log(`💳 Created ${paymentMethodData.method_type} payment method "${paymentMethodData.alias}" for user ${user.name}`);
      }
    }

    console.log(`\n🎉 Payment methods seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Created ${paymentMethodCount} payment methods`);
    console.log(`   - Assigned to ${users.length} users`);
    console.log(`   - Payment types: CREDIT_CARD, DEBIT_CARD, UPI, WALLET, NETBANKING`);
    console.log(`   - Includes encrypted sensitive data and secure tokens`);

    // Display some statistics
    const stats = await PaymentMethod.aggregate([
      {
        $group: {
          _id: '$method_type',
          count: { $sum: 1 },
          default_count: {
            $sum: { $cond: [{ $eq: ['$is_default', true] }, 1, 0] }
          }
        }
      }
    ]);

    console.log(`\n📈 Payment Method Statistics:`);
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} methods (${stat.default_count} default)`);
    });

    const totalActive = await PaymentMethod.countDocuments({ is_active: true });
    const totalDefault = await PaymentMethod.countDocuments({ is_default: true });
    
    console.log(`   - Active payment methods: ${totalActive}`);
    console.log(`   - Default payment methods: ${totalDefault}`);

    // Show sample payment methods with display names
    console.log(`\n💳 Sample Payment Methods:`);
    const sampleMethods = await PaymentMethod.find({}).limit(5).populate('user_id', 'name email');
    sampleMethods.forEach(method => {
      console.log(`   - ${method.display_name} (${method.method_type}) - ${method.user_id.name}`);
    });

  } catch (error) {
    console.error('❌ Error seeding payment methods:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedPaymentMethods();
}

module.exports = { seedPaymentMethods };
