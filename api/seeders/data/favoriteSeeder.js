/**
 * Favorites Seeder
 * Seeds the database with sample user favorites for testing and development
 */

const Favorite = require('../../models/Favorite');
const User = require('../../models/User');
const ProductVariant = require('../../models/ProductVariant');

/**
 * Sample user notes for favorites
 */
const sampleNotes = [
  'Love this product! Great quality.',
  'Considering this for my next purchase.',
  'Perfect for my home office setup.',
  'Waiting for this to go on sale.',
  'Recommended by a friend.',
  'This matches my room decor perfectly.',
  'Great reviews on this item.',
  'Added to my wishlist for later.',
  'Comparing with similar products.',
  'Gift idea for someone special.'
];

/**
 * Create sample favorites data
 */
const createFavoritesData = async () => {
  try {
    // Get all active users
    const users = await User.find({ isActive: true }).limit(50);
    
    if (users.length === 0) {
      throw new Error('No active users found. Please seed users first.');
    }

    // Get all active product variants
    const productVariants = await ProductVariant.find({ is_active: true }).limit(200);
    
    if (productVariants.length === 0) {
      throw new Error('No active product variants found. Please seed products first.');
    }

    const favoritesData = [];
    const userFavoriteCounts = {}; // Track how many favorites each user has

    // Generate favorites for each user (random number between 3-15 favorites per user)
    for (const user of users) {
      const favoriteCount = Math.floor(Math.random() * 13) + 3; // 3-15 favorites
      userFavoriteCounts[user._id] = favoriteCount;
      
      // Get random product variants for this user
      const shuffledProducts = [...productVariants].sort(() => 0.5 - Math.random());
      const userProductVariants = shuffledProducts.slice(0, favoriteCount);
      
      for (let i = 0; i < userProductVariants.length; i++) {
        const productVariant = userProductVariants[i];
        
        // Create favorite with random added_at date (last 6 months)
        const randomDaysAgo = Math.floor(Math.random() * 180); // 0-180 days ago
        const addedAt = new Date();
        addedAt.setDate(addedAt.getDate() - randomDaysAgo);
        
        // Random chance for user notes (60% chance)
        const hasNotes = Math.random() < 0.6;
        const userNotes = hasNotes ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : null;
        
        // Random chance for inactive favorites (5% chance)
        const isActive = Math.random() > 0.05;
        
        const favorite = {
          user_id: user._id,
          product_variant_id: productVariant._id,
          added_at: addedAt,
          user_notes: userNotes,
          is_active: isActive,
          createdAt: addedAt,
          updatedAt: addedAt
        };
        
        favoritesData.push(favorite);
      }
    }

    // Add some additional random favorites to create variety in the data
    const additionalFavorites = Math.floor(users.length * 0.3); // 30% more random favorites
    
    for (let i = 0; i < additionalFavorites; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct = productVariants[Math.floor(Math.random() * productVariants.length)];
      
      // Check if this combination already exists
      const exists = favoritesData.some(fav => 
        fav.user_id.toString() === randomUser._id.toString() && 
        fav.product_variant_id.toString() === randomProduct._id.toString()
      );
      
      if (!exists) {
        const randomDaysAgo = Math.floor(Math.random() * 180);
        const addedAt = new Date();
        addedAt.setDate(addedAt.getDate() - randomDaysAgo);
        
        const hasNotes = Math.random() < 0.4; // Lower chance for additional favorites
        const userNotes = hasNotes ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : null;
        const isActive = Math.random() > 0.05;
        
        const favorite = {
          user_id: randomUser._id,
          product_variant_id: randomProduct._id,
          added_at: addedAt,
          user_notes: userNotes,
          is_active: isActive,
          createdAt: addedAt,
          updatedAt: addedAt
        };
        
        favoritesData.push(favorite);
      }
    }

    return favoritesData;

  } catch (error) {
    console.error('   ❌ Error creating favorites data:', error.message);
    throw error;
  }
};

/**
 * Seed favorites
 */
const seedFavorites = async () => {
  try {
    console.log('🌱 Seeding favorites...');

    // Create favorites data
    const favoritesData = await createFavoritesData();
    
    if (favoritesData.length === 0) {
      console.log('   ⚠️  No favorites data to seed');
      return [];
    }

    // Insert favorites in batches to avoid memory issues
    const batchSize = 100;
    const createdFavorites = [];
    
    for (let i = 0; i < favoritesData.length; i += batchSize) {
      const batch = favoritesData.slice(i, i + batchSize);
      try {
        const batchResult = await Favorite.insertMany(batch, { ordered: false });
        createdFavorites.push(...batchResult);
        console.log(`   📦 Inserted batch ${Math.floor(i/batchSize) + 1}: ${batchResult.length} favorites`);
      } catch (error) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`   ⚠️  Batch ${Math.floor(i/batchSize) + 1}: Some duplicates skipped`);
        } else {
          throw error;
        }
      }
    }

    console.log(`   ✅ Created ${createdFavorites.length} favorites`);

    // Generate summary statistics
    const stats = await generateFavoriteStats();
    console.log('   📊 Favorites Summary:');
    console.log(`      Total Favorites: ${stats.total}`);
    console.log(`      Active Favorites: ${stats.active}`);
    console.log(`      Inactive Favorites: ${stats.inactive}`);
    console.log(`      Users with Favorites: ${stats.usersWithFavorites}`);
    console.log(`      Product Variants Favorited: ${stats.uniqueProducts}`);
    console.log(`      Favorites with Notes: ${stats.withNotes}`);
    console.log(`      Average Favorites per User: ${stats.avgPerUser}`);

    return createdFavorites;

  } catch (error) {
    console.error('   ❌ Error seeding favorites:', error.message);
    throw error;
  }
};

/**
 * Generate favorite statistics
 */
const generateFavoriteStats = async () => {
  const [
    total,
    active,
    inactive,
    uniqueUsers,
    uniqueProducts,
    withNotes
  ] = await Promise.all([
    Favorite.countDocuments(),
    Favorite.countDocuments({ is_active: true }),
    Favorite.countDocuments({ is_active: false }),
    Favorite.distinct('user_id'),
    Favorite.distinct('product_variant_id'),
    Favorite.countDocuments({ user_notes: { $exists: true, $ne: null, $ne: '' } })
  ]);

  return {
    total,
    active,
    inactive,
    usersWithFavorites: uniqueUsers.length,
    uniqueProducts: uniqueProducts.length,
    withNotes,
    avgPerUser: uniqueUsers.length > 0 ? Math.round((active / uniqueUsers.length) * 100) / 100 : 0
  };
};

/**
 * Clean favorites
 */
const cleanFavorites = async () => {
  try {
    console.log('🧹 Cleaning favorites...');
    const result = await Favorite.deleteMany({});
    console.log(`   ✅ Deleted ${result.deletedCount} favorites`);
    return result;
  } catch (error) {
    console.error('   ❌ Error cleaning favorites:', error.message);
    throw error;
  }
};

/**
 * Create some featured/popular favorites for demo purposes
 */
const createPopularFavorites = async () => {
  try {
    // Get a few popular products and make them favorites for many users
    const popularProducts = await ProductVariant.find({ is_active: true })
      .populate('product_id')
      .limit(5);
    
    if (popularProducts.length === 0) return;

    const users = await User.find({ isActive: true }).limit(30);
    if (users.length === 0) return;

    const popularFavorites = [];
    
    for (const product of popularProducts) {
      // Make each popular product a favorite for 60-90% of users
      const favoritePercentage = 0.6 + Math.random() * 0.3; // 60-90%
      const numberOfFavorites = Math.floor(users.length * favoritePercentage);
      
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const selectedUsers = shuffledUsers.slice(0, numberOfFavorites);
      
      for (const user of selectedUsers) {
        // Check if this combination already exists
        const exists = await Favorite.findOne({
          user_id: user._id,
          product_variant_id: product._id
        });
        
        if (!exists) {
          const randomDaysAgo = Math.floor(Math.random() * 90); // Last 3 months
          const addedAt = new Date();
          addedAt.setDate(addedAt.getDate() - randomDaysAgo);
          
          const popularNotes = [
            'This is so popular!',
            'Everyone is buying this.',
            'Trending item - must have!',
            'Saw this on social media.',
            'Highly rated product.',
            null
          ];
          
          const hasNotes = Math.random() < 0.7; // Higher chance for popular items
          const userNotes = hasNotes ? popularNotes[Math.floor(Math.random() * popularNotes.length)] : null;
          
          popularFavorites.push({
            user_id: user._id,
            product_variant_id: product._id,
            added_at: addedAt,
            user_notes: userNotes,
            is_active: true,
            createdAt: addedAt,
            updatedAt: addedAt
          });
        }
      }
    }
    
    if (popularFavorites.length > 0) {
      await Favorite.insertMany(popularFavorites, { ordered: false });
      console.log(`   ⭐ Created ${popularFavorites.length} popular favorites`);
    }
    
  } catch (error) {
    // Silently handle errors for popular favorites as they're optional
    console.log('   ℹ️  Popular favorites creation completed with some skips');
  }
};

module.exports = {
  seed: seedFavorites,
  clean: cleanFavorites,
  createPopularFavorites
};
