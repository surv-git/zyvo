/**
 * Product Review Seeder
 * Seeds realistic product reviews for existing product variants and users
 * Includes various rating distributions, review statuses, and verification states
 */

/**
 * Sample review templates organized by rating for realistic content
 */
const reviewTemplates = {
  5: [
    {
      title: "Absolutely Amazing!",
      text: "This product exceeded all my expectations. The quality is outstanding and it arrived exactly as described. Would definitely recommend to anyone looking for this type of product. Great value for money!"
    },
    {
      title: "Perfect Purchase",
      text: "Love everything about this product! The build quality is excellent, shipping was fast, and customer service was very helpful. This is exactly what I was looking for."
    },
    {
      title: "Excellent Quality",
      text: "High-quality product that works perfectly. The design is sleek and modern, and it feels very durable. I'm extremely satisfied with this purchase and will definitely buy from this seller again."
    },
    {
      title: "Highly Recommended",
      text: "Outstanding product with great attention to detail. The packaging was professional and the item arrived in perfect condition. This has become one of my favorite purchases this year."
    },
    {
      title: "Top Notch!",
      text: "Fantastic product that delivers on all promises. The functionality is excellent and it's very user-friendly. I've already recommended this to several friends and family members."
    }
  ],
  4: [
    {
      title: "Very Good Product",
      text: "Really happy with this purchase. The quality is very good and it works as expected. Only minor issue is that it took a bit longer to arrive than expected, but overall great experience."
    },
    {
      title: "Good Value",
      text: "Solid product with good build quality. Does exactly what it's supposed to do. The price point is reasonable for what you get. Would consider buying again."
    },
    {
      title: "Satisfied Customer",
      text: "Good product overall. The quality meets expectations and the functionality is reliable. Packaging could be better but the item itself is in great condition."
    },
    {
      title: "Recommended",
      text: "Nice product with good features. The design is appealing and it works well. Shipping was reasonable and customer service was responsive when I had questions."
    },
    {
      title: "Pretty Good",
      text: "Good quality product that serves its purpose well. Installation/setup was straightforward and it's been working reliably. Good value for the price point."
    }
  ],
  3: [
    {
      title: "Average Product",
      text: "It's an okay product. Does what it's supposed to do but nothing spectacular. The quality is average for the price. There are probably better options available but this works fine."
    },
    {
      title: "Mixed Feelings",
      text: "The product has both pros and cons. Quality is decent but not great. Some features work well while others could be improved. It's usable but not outstanding."
    },
    {
      title: "It's Alright",
      text: "Product is functional and serves its basic purpose. Build quality is average and there are some minor issues but nothing deal-breaking. Might look for alternatives next time."
    },
    {
      title: "Decent for the Price",
      text: "You get what you pay for with this product. It's not the best quality but it's not terrible either. Works as advertised but don't expect premium features."
    }
  ],
  2: [
    {
      title: "Disappointing",
      text: "Expected better quality for this price. The product feels cheap and some features don't work as advertised. Had issues right out of the box. Customer service was slow to respond."
    },
    {
      title: "Not Great",
      text: "Product quality is below expectations. Had several issues with functionality and the build feels flimsy. Would not recommend this to others."
    },
    {
      title: "Poor Quality",
      text: "Very disappointed with this purchase. The product feels cheap and doesn't work properly. Several features are not as described. Definitely not worth the money."
    },
    {
      title: "Below Average",
      text: "Product doesn't meet basic expectations. Quality is poor and it feels like it might break easily. Shipping was delayed and packaging was damaged."
    }
  ],
  1: [
    {
      title: "Terrible Product",
      text: "Worst purchase I've made in a long time. Product broke within days of use. Quality is absolutely terrible and it doesn't work as advertised. Complete waste of money."
    },
    {
      title: "Don't Buy This",
      text: "Save your money and look elsewhere. This product is completely useless and fell apart immediately. Customer service is non-existent. Extremely disappointed."
    },
    {
      title: "Complete Waste",
      text: "Product arrived damaged and doesn't work at all. Tried contacting customer service multiple times with no response. Would give zero stars if possible."
    },
    {
      title: "Awful Experience",
      text: "Horrible product with terrible quality. Nothing works as described and it feels like a cheap knockoff. Definitely returning this if possible."
    }
  ]
};

/**
 * Sample reviewer display names and locations
 */
const reviewerProfiles = [
  { name: "Alex M.", location: "Mumbai, India" },
  { name: "Sarah J.", location: "Delhi, India" },
  { name: "Priya S.", location: "Bangalore, India" },
  { name: "Rahul K.", location: "Chennai, India" },
  { name: "Jessica L.", location: "Kolkata, India" },
  { name: "Amit P.", location: "Pune, India" },
  { name: "Emily R.", location: "Hyderabad, India" },
  { name: "Vikram A.", location: "Ahmedabad, India" },
  { name: "Lisa M.", location: "Surat, India" },
  { name: "Ravi N.", location: "Jaipur, India" },
  { name: "Anna K.", location: "Lucknow, India" },
  { name: "Dev S.", location: "Kanpur, India" },
  { name: "Maya T.", location: "Nagpur, India" },
  { name: "Chris B.", location: "Indore, India" },
  { name: "Neha G.", location: "Thane, India" },
  { name: "Arjun M.", location: "Bhopal, India" },
  { name: "Sophie W.", location: "Visakhapatnam, India" },
  { name: "Kiran L.", location: "Pimpri-Chinchwad, India" },
  { name: "Mike D.", location: "Patna, India" },
  { name: "Anita R.", location: "Vadodara, India" }
];

/**
 * Sample image URLs for reviews (placeholder images)
 */
const sampleImageUrls = [
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
];

/**
 * Generate random helpful/unhelpful votes based on rating
 */
const generateVotes = (rating) => {
  const baseVotes = Math.floor(Math.random() * 20);
  const helpfulRatio = rating >= 4 ? 0.8 : rating >= 3 ? 0.6 : rating >= 2 ? 0.4 : 0.2;
  
  const helpfulVotes = Math.floor(baseVotes * helpfulRatio);
  const unhelpfulVotes = baseVotes - helpfulVotes;
  
  return { helpfulVotes, unhelpfulVotes };
};

/**
 * Generate random date within the last 18 months
 */
const getRandomDate = () => {
  const now = new Date();
  const eighteenMonthsAgo = new Date(now.getTime() - (18 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = eighteenMonthsAgo.getTime() + Math.random() * (now.getTime() - eighteenMonthsAgo.getTime());
  return new Date(randomTime);
};

/**
 * Main seeding function
 */
const seed = async (ProductReviewModel) => {
  try {
    console.log('🔍 Starting Product Review seeding...');
    
    // Get required models
    const User = require('../../models/User');
    const ProductVariant = require('../../models/ProductVariant');
    
    // Get all active users and product variants
    const [users, productVariants] = await Promise.all([
      User.find({ isActive: true }).lean(),
      ProductVariant.find({ is_active: true }).populate('product_id', 'name').lean()
    ]);
    
    console.log(`📊 Found ${users.length} active users and ${productVariants.length} active product variants`);
    
    if (users.length === 0) {
      throw new Error('❌ No active users found. Please seed users first.');
    }
    
    if (productVariants.length === 0) {
      throw new Error('❌ No active product variants found. Please seed product variants first.');
    }
    
    // Check existing reviews to avoid duplicates
    const existingReviews = await ProductReviewModel.find({}, 'user_id product_variant_id').lean();
    const existingPairs = new Set(existingReviews.map(r => `${r.user_id}_${r.product_variant_id}`));
    
    console.log(`📋 Found ${existingReviews.length} existing reviews`);
    
    // Calculate number of reviews to create (aim for 60-80% variant coverage)
    const targetReviewCount = Math.floor(productVariants.length * 0.7);
    const reviewsToCreate = Math.max(0, targetReviewCount - existingReviews.length);
    
    console.log(`🎯 Target: ${targetReviewCount} total reviews, creating ${reviewsToCreate} new reviews`);
    
    if (reviewsToCreate <= 0) {
      return {
        count: 0,
        summary: 'No new reviews needed - target coverage already achieved'
      };
    }
    
    const reviewData = [];
    const usedPairs = new Set(existingPairs);
    let createdCount = 0;
    let skipCount = 0;
    
    // Rating distribution (realistic e-commerce pattern)
    const ratingDistribution = {
      5: 0.45, // 45% - 5 stars
      4: 0.25, // 25% - 4 stars  
      3: 0.15, // 15% - 3 stars
      2: 0.10, // 10% - 2 stars
      1: 0.05  // 5%  - 1 star
    };
    
    // Generate reviews
    while (createdCount < reviewsToCreate && skipCount < reviewsToCreate * 3) {
      // Random user and product variant
      const user = users[Math.floor(Math.random() * users.length)];
      const variant = productVariants[Math.floor(Math.random() * productVariants.length)];
      
      const pairKey = `${user._id}_${variant._id}`;
      
      // Skip if this user-variant pair already exists
      if (usedPairs.has(pairKey)) {
        skipCount++;
        continue;
      }
      
      usedPairs.add(pairKey);
      
      // Determine rating based on distribution
      let rating = 5;
      const rand = Math.random();
      let cumulative = 0;
      
      for (const [r, prob] of Object.entries(ratingDistribution)) {
        cumulative += prob;
        if (rand <= cumulative) {
          rating = parseInt(r);
          break;
        }
      }
      
      // Get random review template for this rating
      const templates = reviewTemplates[rating];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Generate votes
      const votes = generateVotes(rating);
      
      // Random reviewer profile
      const profile = reviewerProfiles[Math.floor(Math.random() * reviewerProfiles.length)];
      
      // Random review date
      const reviewDate = getRandomDate();
      
      // Determine verification status (60% of reviews are from verified buyers)
      const isVerifiedBuyer = Math.random() < 0.6;
      
      // Determine review status
      let status = 'APPROVED';
      const statusRand = Math.random();
      if (statusRand < 0.05) status = 'PENDING_APPROVAL'; // 5%
      else if (statusRand < 0.08) status = 'FLAGGED';     // 3%
      else if (statusRand < 0.10) status = 'REJECTED';    // 2%
      
      // Add images to some reviews (15% chance)
      const hasImages = Math.random() < 0.15;
      const imageCount = hasImages ? Math.floor(Math.random() * 3) + 1 : 0;
      const images = [];
      
      if (hasImages) {
        for (let i = 0; i < imageCount; i++) {
          images.push(sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)]);
        }
      }
      
      // Add video to some reviews (5% chance)
      const hasVideo = Math.random() < 0.05;
      const videoUrl = hasVideo ? "https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4" : null;
      
      // Generate reported count (most reviews have 0, some have 1-2)
      let reportedCount = 0;
      const reportRand = Math.random();
      if (reportRand < 0.05) reportedCount = 1;  // 5% have 1 report
      else if (reportRand < 0.02) reportedCount = 2; // 2% have 2 reports
      
      // Auto-flag if reported count >= 3
      if (reportedCount >= 3) status = 'FLAGGED';
      
      const reviewObj = {
        user_id: user._id,
        product_variant_id: variant._id,
        rating: rating,
        title: template.title,
        review_text: template.text,
        is_verified_buyer: isVerifiedBuyer,
        status: status,
        helpful_votes: votes.helpfulVotes,
        unhelpful_votes: votes.unhelpfulVotes,
        reported_count: reportedCount,
        reviewer_display_name: profile.name,
        reviewer_location: profile.location,
        image_urls: images,
        video_url: videoUrl,
        createdAt: reviewDate,
        updatedAt: reviewDate
      };
      
      // Add moderation details for non-pending reviews
      if (status !== 'PENDING_APPROVAL') {
        // Find an admin user for moderation
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
          reviewObj.moderated_by = adminUser._id;
          reviewObj.moderated_at = new Date(reviewDate.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Within 24 hours
        }
      }
      
      reviewData.push(reviewObj);
      createdCount++;
      
      // Progress logging
      if (createdCount % 50 === 0) {
        console.log(`📝 Generated ${createdCount}/${reviewsToCreate} reviews...`);
      }
    }
    
    // Bulk insert reviews
    console.log(`💾 Inserting ${reviewData.length} product reviews...`);
    const insertedReviews = await ProductReviewModel.insertMany(reviewData, { ordered: false });
    
    // Generate statistics
    const stats = {
      total: insertedReviews.length,
      byRating: {},
      byStatus: {},
      verified: 0,
      withImages: 0,
      withVideos: 0,
      reported: 0
    };
    
    insertedReviews.forEach(review => {
      // Rating distribution
      stats.byRating[review.rating] = (stats.byRating[review.rating] || 0) + 1;
      
      // Status distribution
      stats.byStatus[review.status] = (stats.byStatus[review.status] || 0) + 1;
      
      // Other metrics
      if (review.is_verified_buyer) stats.verified++;
      if (review.image_urls.length > 0) stats.withImages++;
      if (review.video_url) stats.withVideos++;
      if (review.reported_count > 0) stats.reported++;
    });
    
    // Log statistics
    console.log(`\n📊 Product Review Seeding Summary:`);
    console.log(`   📝 Total reviews created: ${stats.total}`);
    console.log(`   ⭐ Rating distribution:`);
    for (let i = 5; i >= 1; i--) {
      const count = stats.byRating[i] || 0;
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`      ${i} stars: ${count} (${percentage}%)`);
    }
    console.log(`   📋 Status distribution:`);
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`      ${status}: ${count} (${percentage}%)`);
    });
    console.log(`   ✅ Verified buyers: ${stats.verified} (${((stats.verified / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   📷 With images: ${stats.withImages} (${((stats.withImages / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   🎥 With videos: ${stats.withVideos} (${((stats.withVideos / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   🚩 Reported: ${stats.reported} (${((stats.reported / stats.total) * 100).toFixed(1)}%)`);
    
    // Calculate average rating
    const totalRatingPoints = Object.entries(stats.byRating).reduce((sum, [rating, count]) => {
      return sum + (parseInt(rating) * count);
    }, 0);
    const avgRating = (totalRatingPoints / stats.total).toFixed(2);
    console.log(`   📊 Average rating: ${avgRating}/5.0`);
    
    return {
      count: stats.total,
      summary: `${stats.total} reviews created with ${avgRating}/5.0 average rating, ${stats.verified} verified buyers, ${stats.withImages} with images`
    };
    
  } catch (error) {
    console.error('❌ Error seeding product reviews:', error.message);
    throw error;
  }
};

module.exports = { seed };
