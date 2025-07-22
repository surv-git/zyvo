/**
 * Listing Seeder
 * Seeds realistic product variant listings for different platforms
 * Creates diverse listing statuses, pricing, and platform-specific data
 */

/**
 * Platform-specific SKU generation patterns
 */
const platformSkuPatterns = {
  'Amazon': (variantSku) => `AMZ-${variantSku}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
  'Flipkart': (variantSku) => `FK-${variantSku.replace('-', '')}-${Date.now().toString().slice(-4)}`,
  'Myntra': (variantSku) => `MYN-${variantSku.split('-')[0]}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
  'Nykaa': (variantSku) => `NYK-${variantSku}-${Math.floor(Math.random() * 1000)}`,
  'Swiggy': (variantSku) => `SWG-${variantSku.substring(0, 8)}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`
};

/**
 * Platform-specific commission rates (percentage)
 */
const platformCommissions = {
  'Amazon': { min: 8, max: 15 },
  'Flipkart': { min: 7, max: 12 },
  'Myntra': { min: 12, max: 20 },
  'Nykaa': { min: 10, max: 18 },
  'Swiggy': { min: 15, max: 25 }
};

/**
 * Platform-specific fixed fees (in currency)
 */
const platformFixedFees = {
  'Amazon': { min: 5, max: 15 },
  'Flipkart': { min: 3, max: 12 },
  'Myntra': { min: 8, max: 20 },
  'Nykaa': { min: 6, max: 16 },
  'Swiggy': { min: 10, max: 25 }
};

/**
 * Platform-specific shipping fees
 */
const platformShippingFees = {
  'Amazon': { min: 0, max: 5 },   // Amazon often offers free shipping
  'Flipkart': { min: 0, max: 8 },
  'Myntra': { min: 2, max: 10 },
  'Nykaa': { min: 3, max: 12 },
  'Swiggy': { min: 15, max: 50 }  // Food delivery has higher fees
};

/**
 * Listing status distribution (realistic e-commerce patterns)
 */
const statusDistribution = {
  'Live': 0.70,           // 70% - most listings are live
  'Draft': 0.15,          // 15% - work in progress
  'Pending Review': 0.08, // 8% - awaiting approval
  'Deactivated': 0.05,    // 5% - temporarily disabled
  'Rejected': 0.02        // 2% - failed review
};

/**
 * Generate platform-specific metadata
 */
const generatePlatformSpecificData = (platformName, variantSku) => {
  switch (platformName) {
    case 'Amazon':
      return {
        asin: `B${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        fulfillment_method: Math.random() > 0.3 ? 'FBA' : 'FBM',
        category_rank: Math.floor(Math.random() * 100000) + 1,
        buy_box_eligible: Math.random() > 0.2,
        prime_eligible: Math.random() > 0.4,
        amazon_choice: Math.random() > 0.9
      };
    
    case 'Flipkart':
      return {
        flipkart_product_id: `FLK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        assured_program: Math.random() > 0.6,
        plus_member_discount: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 5 : null,
        flipkart_advantage: Math.random() > 0.5,
        category: 'Electronics'
      };
    
    case 'Myntra':
      return {
        myntra_style_id: `MYN${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        brand_partnership: Math.random() > 0.8,
        fashion_category: 'Clothing',
        size_chart_available: Math.random() > 0.7,
        try_and_buy_eligible: Math.random() > 0.8
      };
    
    case 'Nykaa':
      return {
        nykaa_product_code: `NYK${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
        beauty_category: 'Skincare',
        ingredient_list_verified: Math.random() > 0.6,
        dermatologist_tested: Math.random() > 0.7,
        cruelty_free: Math.random() > 0.8
      };
    
    case 'Swiggy':
      return {
        restaurant_partner_id: `SWG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        cuisine_type: 'Multi-Cuisine',
        delivery_time_estimate: Math.floor(Math.random() * 30) + 20,
        packaging_charges: Math.floor(Math.random() * 10) + 5,
        minimum_order_value: Math.floor(Math.random() * 100) + 100
      };
    
    default:
      return {
        platform_internal_id: Math.random().toString(36).substr(2, 8).toUpperCase(),
        last_updated: new Date(),
        sync_status: 'active'
      };
  }
};

/**
 * Calculate platform price with markup/discount
 */
const calculatePlatformPrice = (basePrice, platformName) => {
  const markupFactors = {
    'Amazon': { min: 0.95, max: 1.15 },    // -5% to +15%
    'Flipkart': { min: 0.92, max: 1.18 },  // -8% to +18%
    'Myntra': { min: 1.05, max: 1.25 },    // +5% to +25%
    'Nykaa': { min: 1.02, max: 1.22 },     // +2% to +22%
    'Swiggy': { min: 1.10, max: 1.30 }     // +10% to +30%
  };
  
  const factor = markupFactors[platformName] || { min: 0.95, max: 1.15 };
  const multiplier = Math.random() * (factor.max - factor.min) + factor.min;
  
  return Math.round(basePrice * multiplier * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate random date within the last 6 months
 */
const getRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

/**
 * Get random value from range
 */
const getRandomValue = (range) => {
  return Math.random() * (range.max - range.min) + range.min;
};

/**
 * Determine listing status based on distribution
 */
const getRandomStatus = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [status, probability] of Object.entries(statusDistribution)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return status;
    }
  }
  
  return 'Live'; // Default fallback
};

/**
 * Main seeding function
 */
const seed = async (ListingModel) => {
  try {
    console.log('🔍 Starting Listing seeding...');
    
    // Get required models
    const Platform = require('../../models/Platform');
    const ProductVariant = require('../../models/ProductVariant');
    
    // Get all platforms and product variants
    const [platforms, productVariants] = await Promise.all([
      Platform.find({ is_active: true }).lean(),
      ProductVariant.find({ is_active: true }).lean()
    ]);
    
    console.log(`📊 Found ${platforms.length} active platforms and ${productVariants.length} active product variants`);
    
    if (platforms.length === 0) {
      throw new Error('❌ No active platforms found. Please seed platforms first.');
    }
    
    if (productVariants.length === 0) {
      throw new Error('❌ No active product variants found. Please seed product variants first.');
    }
    
    // Check existing listings to avoid duplicates
    const existingListings = await ListingModel.find({}, 'platform_id product_variant_id').lean();
    const existingPairs = new Set(existingListings.map(l => `${l.platform_id}_${l.product_variant_id}`));
    
    console.log(`📋 Found ${existingListings.length} existing listings`);
    
    // Calculate target listings (60-80% coverage of possible combinations)
    const maxPossibleListings = platforms.length * productVariants.length;
    const targetListingCount = Math.floor(maxPossibleListings * (0.6 + Math.random() * 0.2));
    const listingsToCreate = Math.max(0, targetListingCount - existingListings.length);
    
    console.log(`🎯 Target: ${targetListingCount} total listings, creating ${listingsToCreate} new listings`);
    
    if (listingsToCreate <= 0) {
      return {
        count: 0,
        summary: 'No new listings needed - target coverage already achieved'
      };
    }
    
    const listingData = [];
    const usedPairs = new Set(existingPairs);
    let createdCount = 0;
    let skipCount = 0;
    
    // Generate listings
    while (createdCount < listingsToCreate && skipCount < listingsToCreate * 3) {
      // Random platform and product variant
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const variant = productVariants[Math.floor(Math.random() * productVariants.length)];
      
      const pairKey = `${platform._id}_${variant._id}`;
      
      // Skip if this platform-variant pair already exists
      if (usedPairs.has(pairKey)) {
        skipCount++;
        continue;
      }
      
      usedPairs.add(pairKey);
      
      // Generate platform-specific SKU
      const platformSku = platformSkuPatterns[platform.name] ? 
        platformSkuPatterns[platform.name](variant.sku_code) : 
        `${platform.name.toUpperCase()}-${variant.sku_code}`;
      
      // Generate platform product ID
      const platformProductId = `${platform.name.toLowerCase()}_${variant.sku_code.toLowerCase()}_${Date.now().toString().slice(-6)}`;
      
      // Determine listing status
      const listingStatus = getRandomStatus();
      
      // Calculate platform-specific pricing
      const platformPrice = calculatePlatformPrice(variant.price, platform.name);
      
      // Get platform-specific fees
      const commissionRange = platformCommissions[platform.name] || { min: 8, max: 15 };
      const fixedFeeRange = platformFixedFees[platform.name] || { min: 5, max: 15 };
      const shippingFeeRange = platformShippingFees[platform.name] || { min: 2, max: 10 };
      
      const platformCommissionPercentage = Math.round(getRandomValue(commissionRange) * 100) / 100;
      const platformFixedFee = Math.round(getRandomValue(fixedFeeRange) * 100) / 100;
      const platformShippingFee = Math.round(getRandomValue(shippingFeeRange) * 100) / 100;
      
      // Generate platform-specific data
      const platformSpecificData = generatePlatformSpecificData(platform.name, variant.sku_code);
      
      // Random creation and sync dates
      const createdAt = getRandomDate();
      const lastSyncedAt = listingStatus === 'Live' ? 
        new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())) :
        null;
      
      // Determine if active on platform
      const isActiveOnPlatform = listingStatus === 'Live' && Math.random() > 0.1; // 90% of live listings are active
      
      const listingObj = {
        product_variant_id: variant._id,
        platform_id: platform._id,
        platform_sku: platformSku,
        platform_product_id: platformProductId,
        listing_status: listingStatus,
        platform_price: platformPrice,
        platform_commission_percentage: platformCommissionPercentage,
        platform_fixed_fee: platformFixedFee,
        platform_shipping_fee: platformShippingFee,
        last_synced_at: lastSyncedAt,
        platform_specific_data: platformSpecificData,
        is_active_on_platform: isActiveOnPlatform,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      
      listingData.push(listingObj);
      createdCount++;
      
      // Progress logging
      if (createdCount % 50 === 0) {
        console.log(`📝 Generated ${createdCount}/${listingsToCreate} listings...`);
      }
    }
    
    // Bulk insert listings
    console.log(`💾 Inserting ${listingData.length} listings...`);
    const insertedListings = await ListingModel.insertMany(listingData, { ordered: false });
    
    // Generate statistics
    const stats = {
      total: insertedListings.length,
      byPlatform: {},
      byStatus: {},
      activePlatformCount: 0,
      avgPlatformPrice: 0,
      avgCommission: 0
    };
    
    let totalPrice = 0;
    let totalCommission = 0;
    
    insertedListings.forEach(listing => {
      // Platform distribution
      const platformName = platforms.find(p => p._id.toString() === listing.platform_id.toString())?.name || 'Unknown';
      stats.byPlatform[platformName] = (stats.byPlatform[platformName] || 0) + 1;
      
      // Status distribution
      stats.byStatus[listing.listing_status] = (stats.byStatus[listing.listing_status] || 0) + 1;
      
      // Other metrics
      if (listing.is_active_on_platform) stats.activePlatformCount++;
      if (listing.platform_price) totalPrice += listing.platform_price;
      if (listing.platform_commission_percentage) totalCommission += listing.platform_commission_percentage;
    });
    
    stats.avgPlatformPrice = (totalPrice / stats.total).toFixed(2);
    stats.avgCommission = (totalCommission / stats.total).toFixed(2);
    
    // Log statistics
    console.log(`\n📊 Listing Seeding Summary:`);
    console.log(`   📝 Total listings created: ${stats.total}`);
    console.log(`   🏢 Platform distribution:`);
    Object.entries(stats.byPlatform).forEach(([platform, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`      ${platform}: ${count} (${percentage}%)`);
    });
    console.log(`   📋 Status distribution:`);
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`      ${status}: ${count} (${percentage}%)`);
    });
    console.log(`   ✅ Active on platform: ${stats.activePlatformCount} (${((stats.activePlatformCount / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   💰 Average platform price: $${stats.avgPlatformPrice}`);
    console.log(`   📊 Average commission: ${stats.avgCommission}%`);
    
    return {
      count: stats.total,
      summary: `${stats.total} listings created across ${Object.keys(stats.byPlatform).length} platforms, ${stats.activePlatformCount} active, avg price $${stats.avgPlatformPrice}`
    };
    
  } catch (error) {
    console.error('❌ Error seeding listings:', error.message);
    throw error;
  }
};

module.exports = { seed };
