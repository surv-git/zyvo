/**
 * Blog Posts Seeder
 * Seeds the database with sample blog posts for testing and development
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const Category = require('../models/Category');
const User = require('../models/User');

// Sample blog post data
const blogPostsData = [
  {
    title: 'The Future of E-commerce: Trends to Watch in 2025',
    excerpt: 'Explore the latest trends shaping the e-commerce landscape and how they will impact online businesses in the coming year.',
    content: `
      <h2>Introduction</h2>
      <p>The e-commerce industry continues to evolve at a rapid pace, with new technologies and consumer behaviors reshaping how we shop online. As we move through 2025, several key trends are emerging that will define the future of digital commerce.</p>
      
      <h2>1. AI-Powered Personalization</h2>
      <p>Artificial intelligence is revolutionizing the way online stores interact with customers. From personalized product recommendations to dynamic pricing, AI is enabling retailers to create more tailored shopping experiences.</p>
      
      <h2>2. Sustainable Commerce</h2>
      <p>Consumers are increasingly conscious about environmental impact. E-commerce platforms are responding with eco-friendly packaging, carbon-neutral delivery options, and sustainable product lines.</p>
      
      <h2>3. Social Commerce Integration</h2>
      <p>Social media platforms are becoming powerful sales channels. Features like Instagram Shopping and TikTok Commerce are blurring the lines between social interaction and online shopping.</p>
      
      <h2>Conclusion</h2>
      <p>These trends represent just the beginning of what promises to be an exciting year for e-commerce innovation. Stay tuned for more insights on how these developments will shape our digital future.</p>
    `,
    category_name: 'Technology',
    tags: ['e-commerce', 'trends', 'AI', 'sustainability', 'social commerce'],
    read_time_minutes: 5,
    status: 'PUBLISHED',
    is_featured: true,
    seo_title: 'E-commerce Trends 2025: AI, Sustainability & Social Commerce',
    meta_description: 'Discover the top e-commerce trends for 2025 including AI personalization, sustainable commerce, and social media integration.'
  },
  {
    title: 'Building Your First Online Store: A Complete Guide',
    excerpt: 'Step-by-step guide to creating your first e-commerce website, from choosing a platform to launching your store.',
    content: `
      <h2>Getting Started</h2>
      <p>Starting an online store can seem overwhelming, but with the right approach, you can build a successful e-commerce business. This comprehensive guide will walk you through every step.</p>
      
      <h2>Step 1: Choose Your Niche</h2>
      <p>Before you start building, you need to decide what you'll sell. Research market demand, competition, and profit margins to find your perfect niche.</p>
      
      <h2>Step 2: Select an E-commerce Platform</h2>
      <p>Popular options include Shopify, WooCommerce, and Magento. Consider factors like ease of use, customization options, and pricing when making your choice.</p>
      
      <h2>Step 3: Design Your Store</h2>
      <p>Your store's design should be clean, professional, and mobile-friendly. Focus on user experience and make sure your checkout process is simple and secure.</p>
      
      <h2>Step 4: Add Products and Content</h2>
      <p>Write compelling product descriptions, take high-quality photos, and organize your products into logical categories.</p>
      
      <h2>Step 5: Launch and Market</h2>
      <p>Once your store is ready, it's time to go live! Develop a marketing strategy that includes SEO, social media, and email marketing.</p>
    `,
    category_name: 'Business',
    tags: ['online store', 'e-commerce', 'business', 'startup', 'guide'],
    read_time_minutes: 8,
    status: 'PUBLISHED',
    is_featured: false,
    seo_title: 'How to Build Your First Online Store - Complete Beginner Guide',
    meta_description: 'Learn how to build your first online store with our step-by-step guide covering platform selection, design, and launch strategies.'
  },
  {
    title: 'Mobile Commerce: Optimizing for the Smartphone Era',
    excerpt: 'Learn how to optimize your e-commerce site for mobile users and capitalize on the growing mobile commerce trend.',
    content: `
      <h2>The Mobile Revolution</h2>
      <p>Mobile commerce, or m-commerce, now accounts for over 50% of all e-commerce sales. If your store isn't optimized for mobile, you're missing out on a huge opportunity.</p>
      
      <h2>Key Mobile Optimization Strategies</h2>
      <h3>Responsive Design</h3>
      <p>Ensure your website automatically adapts to different screen sizes and orientations.</p>
      
      <h3>Fast Loading Times</h3>
      <p>Mobile users expect pages to load in 3 seconds or less. Optimize images and streamline your code.</p>
      
      <h3>Simplified Navigation</h3>
      <p>Use clear menus, large buttons, and intuitive search functionality designed for touch interfaces.</p>
      
      <h3>Mobile Payment Options</h3>
      <p>Integrate mobile wallets like Apple Pay and Google Pay for faster, more secure checkouts.</p>
      
      <h2>Testing and Analytics</h2>
      <p>Regularly test your mobile experience and use analytics to understand how mobile users interact with your site.</p>
    `,
    category_name: 'Technology',
    tags: ['mobile commerce', 'm-commerce', 'responsive design', 'UX', 'mobile optimization'],
    read_time_minutes: 6,
    status: 'PUBLISHED',
    is_featured: true,
    seo_title: 'Mobile Commerce Optimization: Complete Guide for 2025',
    meta_description: 'Master mobile commerce optimization with our comprehensive guide covering responsive design, speed, and mobile payment integration.'
  },
  {
    title: 'Customer Service Excellence in E-commerce',
    excerpt: 'Discover how exceptional customer service can set your online store apart and build lasting customer relationships.',
    content: `
      <h2>Why Customer Service Matters</h2>
      <p>In the competitive world of e-commerce, exceptional customer service can be your biggest differentiator. It's not just about solving problems—it's about creating memorable experiences.</p>
      
      <h2>Building a Customer-Centric Culture</h2>
      <p>Start by training your team to think from the customer's perspective. Every interaction should add value and leave customers feeling heard and appreciated.</p>
      
      <h2>Essential Customer Service Channels</h2>
      <h3>Live Chat</h3>
      <p>Offer real-time support for immediate assistance during the shopping process.</p>
      
      <h3>Email Support</h3>
      <p>Provide detailed, thoughtful responses to complex inquiries.</p>
      
      <h3>Phone Support</h3>
      <p>Sometimes customers need to talk to a real person for urgent issues.</p>
      
      <h3>Self-Service Options</h3>
      <p>Create comprehensive FAQs and knowledge bases for common questions.</p>
      
      <h2>Measuring Success</h2>
      <p>Track metrics like response time, resolution rate, and customer satisfaction scores to continuously improve your service.</p>
    `,
    category_name: 'Business',
    tags: ['customer service', 'customer experience', 'support', 'retention', 'satisfaction'],
    read_time_minutes: 7,
    status: 'PUBLISHED',
    is_featured: false,
    seo_title: 'E-commerce Customer Service Excellence: Best Practices Guide',
    meta_description: 'Learn how to deliver exceptional customer service in e-commerce with proven strategies for support channels and customer satisfaction.'
  },
  {
    title: 'Understanding E-commerce Analytics and KPIs',
    excerpt: 'Learn which metrics matter most for your online store and how to use data to drive business growth.',
    content: `
      <h2>The Power of Data</h2>
      <p>E-commerce generates vast amounts of data. The key is knowing which metrics to track and how to interpret them to make informed business decisions.</p>
      
      <h2>Essential E-commerce KPIs</h2>
      <h3>Conversion Rate</h3>
      <p>The percentage of visitors who make a purchase. This is arguably the most important metric for any e-commerce business.</p>
      
      <h3>Average Order Value (AOV)</h3>
      <p>The average amount customers spend per transaction. Increasing AOV can significantly boost revenue.</p>
      
      <h3>Customer Lifetime Value (CLV)</h3>
      <p>The total revenue you can expect from a customer over their entire relationship with your business.</p>
      
      <h3>Cart Abandonment Rate</h3>
      <p>The percentage of shoppers who add items to their cart but don't complete the purchase.</p>
      
      <h2>Tools and Platforms</h2>
      <p>Google Analytics, Shopify Analytics, and specialized e-commerce platforms provide insights into customer behavior and sales performance.</p>
      
      <h2>Making Data-Driven Decisions</h2>
      <p>Use your analytics to identify trends, optimize marketing campaigns, and improve the customer experience.</p>
    `,
    category_name: 'Business',
    tags: ['analytics', 'KPIs', 'data', 'metrics', 'optimization', 'ROI'],
    read_time_minutes: 9,
    status: 'DRAFT',
    is_featured: false,
    seo_title: 'E-commerce Analytics Guide: Essential KPIs and Metrics',
    meta_description: 'Master e-commerce analytics with our guide to essential KPIs including conversion rate, AOV, CLV, and cart abandonment metrics.'
  },
  {
    title: 'The Psychology of Online Shopping',
    excerpt: 'Explore the psychological factors that influence buying decisions and how to apply them to your e-commerce strategy.',
    content: `
      <h2>Understanding Consumer Psychology</h2>
      <p>Online shopping behavior is driven by complex psychological factors. Understanding these can help you design more effective e-commerce experiences.</p>
      
      <h2>Key Psychological Principles</h2>
      <h3>Social Proof</h3>
      <p>Customers look to others for validation. Reviews, testimonials, and "bestseller" labels can significantly influence purchase decisions.</p>
      
      <h3>Scarcity and Urgency</h3>
      <p>Limited-time offers and low-stock alerts create urgency that can motivate immediate action.</p>
      
      <h3>The Paradox of Choice</h3>
      <p>Too many options can overwhelm customers. Curate your product selection and use filters to simplify decision-making.</p>
      
      <h3>Loss Aversion</h3>
      <p>People hate losing things more than they like gaining them. Frame your offers in terms of what customers might miss out on.</p>
      
      <h2>Applying Psychology to Design</h2>
      <p>Use colors, layouts, and copy that align with psychological principles to guide customers toward conversion.</p>
      
      <h2>Ethical Considerations</h2>
      <p>While these techniques are powerful, always use them ethically and in your customers' best interests.</p>
    `,
    category_name: 'Marketing',
    tags: ['psychology', 'consumer behavior', 'conversion optimization', 'UX', 'persuasion'],
    read_time_minutes: 8,
    status: 'PENDING_REVIEW',
    is_featured: false,
    seo_title: 'Psychology of Online Shopping: Influencing Buyer Behavior',
    meta_description: 'Discover the psychological principles that drive online shopping behavior and learn how to apply them ethically to boost conversions.'
  }
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Create categories if they don't exist
 */
const ensureCategories = async () => {
  const categoryNames = ['Technology', 'Business', 'Marketing'];
  const categories = {};

  for (const categoryName of categoryNames) {
    let category = await Category.findOne({ name: categoryName });
    
    if (!category) {
      category = await Category.create({
        name: categoryName,
        slug: categoryName.toLowerCase(),
        description: `${categoryName} related blog posts and articles`,
        is_active: true
      });
      console.log(`✅ Created category: ${categoryName}`);
    } else {
      console.log(`📁 Category already exists: ${categoryName}`);
    }
    
    categories[categoryName] = category._id;
  }

  return categories;
};

/**
 * Get or create admin user for blog posts
 */
const getAdminUser = async () => {
  let adminUser = await User.findOne({ role: 'admin' });
  
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Blog Admin',
      email: 'admin@zyvo.com',
      password: 'admin123', // This will be hashed by the User model
      role: 'admin',
      isActive: true
    });
    console.log('✅ Created admin user for blog posts');
  } else {
    console.log('👤 Using existing admin user');
  }

  return adminUser._id;
};

/**
 * Seed blog posts
 */
const seedBlogPosts = async () => {
  try {
    console.log('🌱 Starting blog posts seeding...');

    // Connect to database
    await connectDB();

    // Ensure categories exist
    const categories = await ensureCategories();

    // Get admin user
    const adminUserId = await getAdminUser();

    // Clear existing blog posts (optional - remove if you want to keep existing data)
    const existingCount = await BlogPost.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing blog posts. Skipping seeding to avoid duplicates.`);
      console.log('💡 To force re-seed, manually delete existing blog posts first.');
      return;
    }

    // Create blog posts
    const blogPosts = [];
    for (const postData of blogPostsData) {
      const blogPost = {
        ...postData,
        author_id: adminUserId,
        category_id: categories[postData.category_name],
        // Remove category_name as it's not part of the schema
        category_name: undefined
      };

      // Set published_at for published posts
      if (blogPost.status === 'PUBLISHED') {
        blogPost.published_at = new Date();
      }

      blogPosts.push(blogPost);
    }

    // Insert blog posts
    const createdPosts = await BlogPost.insertMany(blogPosts);
    console.log(`✅ Successfully seeded ${createdPosts.length} blog posts`);

    // Log summary
    const statusCounts = await BlogPost.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Blog Posts Summary:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} posts`);
    });

    const featuredCount = await BlogPost.countDocuments({ is_featured: true });
    console.log(`   Featured: ${featuredCount} posts`);

  } catch (error) {
    console.error('❌ Error seeding blog posts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

/**
 * Clear all blog posts (utility function)
 */
const clearBlogPosts = async () => {
  try {
    await connectDB();
    const deletedCount = await BlogPost.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} blog posts`);
  } catch (error) {
    console.error('❌ Error clearing blog posts:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearBlogPosts();
} else {
  seedBlogPosts();
}

module.exports = {
  seedBlogPosts,
  clearBlogPosts
};
