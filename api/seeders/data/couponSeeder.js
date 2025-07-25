/**
 * Coupon Campaign and User Coupon Seeder
 * Seeds coupon campaigns and individual user coupons for testing
 */

const CouponCampaign = require('../../models/CouponCampaign');
const UserCoupon = require('../../models/UserCoupon');
const User = require('../../models/User');

/**
 * Sample coupon campaigns for testing
 */
const couponCampaignSeedData = [
  {
    name: 'Welcome New Users',
    slug: 'welcome-new-users',
    description: 'Special discount for new customers',
    code_prefix: 'WELCOME',
    discount_type: 'PERCENTAGE',
    discount_value: 15,
    min_purchase_amount: 50,
    max_coupon_discount: 100,
    max_usage_per_user: 1,
    max_global_usage: 1000,
    is_unique_per_user: true,
    eligibility_criteria: ['NEW_USER'],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    valid_from: new Date('2024-01-01'),
    valid_until: new Date('2024-12-31'),
    is_active: true
  },
  {
    name: 'Summer Sale 2024',
    slug: 'summer-sale-2024',
    description: 'Big summer discount for all products',
    code_prefix: 'SUMMER',
    discount_type: 'PERCENTAGE',
    discount_value: 25,
    min_purchase_amount: 100,
    max_coupon_discount: 200,
    max_usage_per_user: 2,
    max_global_usage: 500,
    is_unique_per_user: true,
    eligibility_criteria: ['NONE'],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    valid_from: new Date('2024-06-01'),
    valid_until: new Date('2024-08-31'),
    is_active: true
  },
  {
    name: 'Free Shipping Weekend',
    slug: 'free-shipping-weekend',
    description: 'Free shipping on all orders',
    code_prefix: 'FREESHIP',
    discount_type: 'FREE_SHIPPING',
    discount_value: 0,
    min_purchase_amount: 25,
    max_coupon_discount: null,
    max_usage_per_user: 1,
    max_global_usage: 2000,
    is_unique_per_user: true,
    eligibility_criteria: ['NONE'],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    valid_from: new Date('2024-01-01'),
    valid_until: new Date('2024-12-31'),
    is_active: true
  },
  {
    name: 'VIP Customer Bonus',
    slug: 'vip-customer-bonus',
    description: 'Exclusive discount for VIP customers',
    code_prefix: 'VIP',
    discount_type: 'AMOUNT',
    discount_value: 50,
    min_purchase_amount: 200,
    max_coupon_discount: null,
    max_usage_per_user: 5,
    max_global_usage: 100,
    is_unique_per_user: true,
    eligibility_criteria: ['SPECIFIC_USER_GROUP'],
    applicable_category_ids: [],
    applicable_product_variant_ids: [],
    valid_from: new Date('2024-01-01'),
    valid_until: new Date('2024-12-31'),
    is_active: true
  }
];

/**
 * Generate sample user coupons for testing
 */
function generateUserCouponCodes(campaign, count = 10) {
  const codes = [];
  const prefix = campaign.code_prefix || 'COUPON';
  
  for (let i = 1; i <= count; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(`${prefix}-${randomSuffix}`);
  }
  
  return codes;
}

/**
 * Seed coupon campaigns
 */
async function seedCouponCampaigns() {
  try {
    console.log('🎟️ Seeding coupon campaigns...');
    
    // Clear existing campaigns
    await CouponCampaign.deleteMany({});
    
    // Insert campaigns
    const campaigns = await CouponCampaign.insertMany(couponCampaignSeedData);
    
    console.log(`✅ Successfully seeded ${campaigns.length} coupon campaigns`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Error seeding coupon campaigns:', error.message);
    throw error;
  }
}

/**
 * Seed user coupons
 */
async function seedUserCoupons() {
  try {
    console.log('🎫 Seeding user coupons...');
    
    // Clear existing user coupons
    await UserCoupon.deleteMany({});
    
    // Get campaigns and users
    const campaigns = await CouponCampaign.find({});
    const users = await User.find({}).limit(20); // Get first 20 users
    
    if (users.length === 0) {
      console.log('⚠️ No users found. Please seed users first.');
      return [];
    }
    
    const userCoupons = [];
    
    // Create user coupons for each campaign
    for (const campaign of campaigns) {
      const codes = generateUserCouponCodes(campaign, Math.min(users.length, 15));
      
      for (let i = 0; i < codes.length && i < users.length; i++) {
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 6); // 6 months from now
        
        userCoupons.push({
          coupon_campaign_id: campaign._id,
          user_id: users[i]._id,
          coupon_code: codes[i],
          current_usage_count: Math.random() > 0.7 ? 1 : 0, // 30% chance of being used
          expires_at: expirationDate,
          is_active: true,
          assigned_at: new Date(),
          last_usage_at: Math.random() > 0.7 ? new Date() : null
        });
      }
    }
    
    // Insert user coupons
    const insertedCoupons = await UserCoupon.insertMany(userCoupons);
    
    console.log(`✅ Successfully seeded ${insertedCoupons.length} user coupons`);
    return insertedCoupons;
    
  } catch (error) {
    console.error('❌ Error seeding user coupons:', error.message);
    throw error;
  }
}

/**
 * Clean coupon data
 */
async function cleanCoupons() {
  try {
    console.log('🧹 Cleaning coupon data...');
    
    await UserCoupon.deleteMany({});
    await CouponCampaign.deleteMany({});
    
    console.log('✅ Successfully cleaned coupon data');
    
  } catch (error) {
    console.error('❌ Error cleaning coupon data:', error.message);
    throw error;
  }
}

/**
 * Seed all coupon data
 */
async function seedCoupons() {
  try {
    const campaigns = await seedCouponCampaigns();
    const userCoupons = await seedUserCoupons();
    
    return {
      campaigns,
      userCoupons
    };
    
  } catch (error) {
    console.error('❌ Error seeding coupons:', error.message);
    throw error;
  }
}

module.exports = {
  seedCouponCampaigns,
  seedUserCoupons,
  seedCoupons,
  cleanCoupons
};
