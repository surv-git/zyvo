/**
 * Dynamic Content Seeder
 * Seeds the database with sample dynamic content for various locations and types
 */

const DynamicContent = require('../../models/DynamicContent');

const sampleDynamicContent = [
  // Home Page Hero Carousel
  {
    name: 'Summer Sale Hero Banner',
    type: 'CAROUSEL',
    location_key: 'HOME_HERO_SLIDER',
    content_order: 1,
    is_active: true,
    display_start_date: new Date('2025-01-01'),
    display_end_date: new Date('2025-03-31'),
    primary_image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    alt_text: 'Summer Sale - Up to 70% off on electronics',
    caption: 'Summer Sale - Up to 70% off',
    link_url: 'https://example.com/summer-sale',
    call_to_action_text: 'Shop Now',
    target_audience_tags: ['all_users', 'electronics_shoppers', 'sale_hunters'],
    metadata: {
      campaign_id: 'summer_2025',
      priority: 'high',
      background_color: '#ff6b6b'
    }
  },
  {
    name: 'New Arrivals Showcase',
    type: 'CAROUSEL',
    location_key: 'HOME_HERO_SLIDER',
    content_order: 2,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
    alt_text: 'New arrivals in fashion and lifestyle',
    caption: 'Discover New Arrivals',
    link_url: 'https://example.com/new-arrivals',
    call_to_action_text: 'Explore',
    target_audience_tags: ['fashion_lovers', 'trendsetters', 'new_users'],
    metadata: {
      category: 'lifestyle',
      trending: true
    }
  },
  {
    name: 'Premium Collection Banner',
    type: 'CAROUSEL',
    location_key: 'HOME_HERO_SLIDER',
    content_order: 3,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&h=600&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop',
    alt_text: 'Premium collection - luxury products',
    caption: 'Premium Collection - Luxury Redefined',
    link_url: 'https://example.com/premium',
    call_to_action_text: 'View Collection',
    target_audience_tags: ['premium_members', 'luxury_shoppers'],
    metadata: {
      segment: 'premium',
      price_range: 'high'
    }
  },

  // Top Marquee Messages
  {
    name: 'Free Shipping Announcement',
    type: 'MARQUEE',
    location_key: 'TOP_MARQUEE',
    content_order: 1,
    is_active: true,
    main_text_content: '🚚 FREE SHIPPING on orders above ₹999 | Use code: FREESHIP | Valid till Jan 31st',
    link_url: 'https://example.com/shipping-info',
    target_audience_tags: ['all_users'],
    metadata: {
      promotion_type: 'shipping',
      min_order_value: 999,
      promo_code: 'FREESHIP'
    }
  },
  {
    name: 'Flash Sale Alert',
    type: 'MARQUEE',
    location_key: 'TOP_MARQUEE',
    content_order: 2,
    is_active: true,
    main_text_content: '⚡ FLASH SALE: 24 hours only - Up to 80% off on selected items | Hurry, limited stock!',
    link_url: 'https://example.com/flash-sale',
    target_audience_tags: ['sale_hunters', 'deal_seekers'],
    metadata: {
      sale_type: 'flash',
      duration_hours: 24,
      max_discount: 80
    }
  },

  // Category Page Advertisements
  {
    name: 'Electronics Category Ad',
    type: 'ADVERTISEMENT',
    location_key: 'CATEGORY_ELECTRONICS_BANNER',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    alt_text: 'Latest smartphones and gadgets',
    caption: 'Latest Tech Gadgets',
    link_url: 'https://example.com/electronics/smartphones',
    call_to_action_text: 'Browse Phones',
    target_audience_tags: ['tech_enthusiasts', 'smartphone_users'],
    metadata: {
      category: 'electronics',
      subcategory: 'smartphones'
    }
  },
  {
    name: 'Fashion Category Promo',
    type: 'ADVERTISEMENT',
    location_key: 'CATEGORY_FASHION_BANNER',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    alt_text: 'Trendy fashion collection',
    caption: 'Trendy Fashion Collection',
    link_url: 'https://example.com/fashion/trending',
    call_to_action_text: 'Shop Fashion',
    target_audience_tags: ['fashion_lovers', 'style_conscious'],
    metadata: {
      category: 'fashion',
      season: 'winter'
    }
  },

  // Sidebar Offers
  {
    name: 'First Order Discount',
    type: 'OFFER',
    location_key: 'SIDEBAR_OFFERS',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=300&h=300&fit=crop',
    alt_text: 'First order discount - 20% off',
    caption: '20% OFF First Order',
    main_text_content: 'New customer? Get 20% off on your first purchase above ₹500',
    link_url: 'https://example.com/first-order-discount',
    call_to_action_text: 'Claim Offer',
    target_audience_tags: ['new_users', 'first_time_buyers'],
    metadata: {
      discount_percentage: 20,
      min_order_value: 500,
      user_type: 'new'
    }
  },
  {
    name: 'Loyalty Program Offer',
    type: 'OFFER',
    location_key: 'SIDEBAR_OFFERS',
    content_order: 2,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=300&fit=crop',
    alt_text: 'Loyalty program benefits',
    caption: 'Join Loyalty Program',
    main_text_content: 'Earn points on every purchase and get exclusive member benefits',
    link_url: 'https://example.com/loyalty-program',
    call_to_action_text: 'Join Now',
    target_audience_tags: ['returning_customers', 'frequent_buyers'],
    metadata: {
      program: 'loyalty',
      benefits: ['points', 'exclusive_deals', 'early_access']
    }
  },

  // Product Page Promos
  {
    name: 'Bundle Deal Promo',
    type: 'PROMO',
    location_key: 'PRODUCT_PAGE_PROMO',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=200&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
    alt_text: 'Bundle deal - buy 2 get 1 free',
    caption: 'Special Bundle Deal',
    main_text_content: 'Buy 2 Get 1 FREE on selected accessories',
    link_url: 'https://example.com/bundle-deals',
    call_to_action_text: 'Add to Bundle',
    target_audience_tags: ['value_seekers', 'bulk_buyers'],
    metadata: {
      deal_type: 'bundle',
      offer: 'buy_2_get_1_free',
      category: 'accessories'
    }
  },

  // Footer Promotions
  {
    name: 'Newsletter Signup Promo',
    type: 'PROMO',
    location_key: 'FOOTER_NEWSLETTER',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=500&h=200&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=200&fit=crop',
    alt_text: 'Subscribe to newsletter for exclusive deals',
    caption: 'Stay Updated',
    main_text_content: 'Subscribe to our newsletter and get 10% off your next purchase + exclusive deals',
    link_url: 'https://example.com/newsletter',
    call_to_action_text: 'Subscribe',
    target_audience_tags: ['all_users', 'deal_subscribers'],
    metadata: {
      signup_bonus: 10,
      email_marketing: true
    }
  },

  // Mobile App Promotion
  {
    name: 'Mobile App Download Banner',
    type: 'ADVERTISEMENT',
    location_key: 'MOBILE_APP_BANNER',
    content_order: 1,
    is_active: true,
    primary_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=300&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop',
    alt_text: 'Download our mobile app for better shopping experience',
    caption: 'Shop on the Go',
    main_text_content: 'Download our mobile app for exclusive app-only deals and faster checkout',
    link_url: 'https://example.com/mobile-app',
    call_to_action_text: 'Download App',
    target_audience_tags: ['mobile_users', 'app_downloaders'],
    metadata: {
      platform: 'mobile',
      app_store_url: 'https://apps.apple.com/zyvo',
      play_store_url: 'https://play.google.com/store/apps/zyvo'
    }
  },

  // Seasonal Content
  {
    name: 'Winter Collection Marquee',
    type: 'MARQUEE',
    location_key: 'SEASONAL_BANNER',
    content_order: 1,
    is_active: false, // Seasonal, currently inactive
    display_start_date: new Date('2025-12-01'),
    display_end_date: new Date('2026-02-28'),
    main_text_content: '❄️ Winter Collection Now Live - Cozy up with our warm essentials | Free shipping on winter wear',
    link_url: 'https://example.com/winter-collection',
    target_audience_tags: ['seasonal_shoppers', 'winter_wear'],
    metadata: {
      season: 'winter',
      collection: 'winter_2025'
    }
  }
];

const seedDynamicContent = async () => {
  try {
    console.log('🌱 Starting dynamic content seeding...');
    
    // Clear existing dynamic content
    const deleteResult = await DynamicContent.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing dynamic content items`);
    
    // Get a default admin user to use as created_by
    const User = require('../../models/User');
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please seed users first.');
    }
    
    console.log(`👤 Using admin user: ${adminUser.email} as creator`);
    
    // Add created_by to all content items
    const contentWithCreator = sampleDynamicContent.map(content => ({
      ...content,
      created_by: adminUser._id
    }));
    
    console.log(`📝 Inserting ${contentWithCreator.length} content items...`);
    
    // Insert content items one by one to catch specific errors
    const createdContent = [];
    for (let i = 0; i < contentWithCreator.length; i++) {
      try {
        console.log(`   Creating item ${i + 1}: ${contentWithCreator[i].name}`);
        const created = await DynamicContent.create(contentWithCreator[i]);
        createdContent.push(created);
        console.log(`   ✅ Created: ${created.name}`);
      } catch (itemError) {
        console.error(`   ❌ Error creating item ${i + 1}:`, itemError.message);
        // Continue with next item
      }
    }
    
    console.log(`✅ Successfully seeded ${createdContent.length}/${contentWithCreator.length} dynamic content items`);
    
    // Log summary by type and location
    const summary = {};
    createdContent.forEach(content => {
      const key = `${content.type} - ${content.location_key}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    
    console.log('\n📊 Content Summary:');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} items`);
    });
    
    console.log('\n🎯 Active vs Inactive:');
    const activeCount = createdContent.filter(c => c.is_active).length;
    const inactiveCount = createdContent.length - activeCount;
    console.log(`   Active: ${activeCount} items`);
    console.log(`   Inactive: ${inactiveCount} items`);
    
    return createdContent;
    
  } catch (error) {
    console.error('❌ Error seeding dynamic content:', error.message);
    throw error;
  }
};

const cleanDynamicContent = async () => {
  try {
    console.log('🧹 Cleaning dynamic content...');
    const result = await DynamicContent.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} dynamic content items`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning dynamic content:', error);
    throw error;
  }
};

module.exports = {
  seed: seedDynamicContent,
  clean: cleanDynamicContent,
  data: sampleDynamicContent
};
