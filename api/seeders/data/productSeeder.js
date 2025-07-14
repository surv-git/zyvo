/**
 * Product Seeder
 * Seeds sample products for the e-commerce system
 */

/**
 * Seed products
 */
const seed = async (ProductModel) => {
  try {
    // Get reference models for relationships
    const Category = require('../../models/Category');
    
    // Get some categories to reference
    const electronicsCategory = await Category.findOne({ slug: 'electronics' });
    const computersCategory = await Category.findOne({ slug: 'computers' });
    const laptopsCategory = await Category.findOne({ slug: 'laptops' });
    const audioCategory = await Category.findOne({ slug: 'audio' });
    const headphonesCategory = await Category.findOne({ slug: 'headphones' });
    const clothingCategory = await Category.findOne({ slug: 'clothing' });
    const mensClothingCategory = await Category.findOne({ slug: 'mens-clothing' });
    
    if (!electronicsCategory) {
      throw new Error('Categories must be seeded before products. Please run: node seeders/seeder.js seed categories');
    }
    
    const productData = [
      {
        name: 'MacBook Pro 16-inch',
        slug: 'macbook-pro-16-inch',
        description: 'The most powerful MacBook Pro ever, with the M2 Pro or M2 Max chip, up to 22 hours of battery life, and a stunning Liquid Retina XDR display.',
        short_description: 'Powerful 16-inch laptop with M2 Pro chip',
        category_id: laptopsCategory?._id || computersCategory._id,
        images: [
          'https://example.com/images/macbook-pro-16-1.jpg',
          'https://example.com/images/macbook-pro-16-2.jpg',
          'https://example.com/images/macbook-pro-16-3.jpg'
        ],
        brand_id: null, // Would be Apple brand ID if brands were implemented
        score: 4.8,
        seo_details: {
          meta_title: 'MacBook Pro 16-inch - Ultimate Professional Laptop',
          meta_description: 'Experience unmatched performance with the MacBook Pro 16-inch featuring M2 Pro chip and stunning display.',
          meta_keywords: ['macbook', 'laptop', 'apple', 'professional', 'm2']
        },
        is_active: true
      },
      {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        slug: 'sony-wh-1000xm5-wireless-headphones',
        description: 'Industry-leading noise canceling wireless headphones with up to 30 hours of battery life and exceptional sound quality.',
        short_description: 'Premium noise-canceling wireless headphones',
        category_id: headphonesCategory?._id || audioCategory._id,
        images: [
          'https://example.com/images/sony-wh1000xm5-1.jpg',
          'https://example.com/images/sony-wh1000xm5-2.jpg'
        ],
        brand_id: null, // Would be Sony brand ID if brands were implemented
        score: 4.7,
        seo_details: {
          meta_title: 'Sony WH-1000XM5 - Premium Wireless Headphones',
          meta_description: 'Discover the ultimate listening experience with Sony WH-1000XM5 noise-canceling headphones.',
          meta_keywords: ['sony', 'headphones', 'wireless', 'noise-canceling', 'premium']
        },
        is_active: true
      },
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'The most advanced iPhone yet, featuring a titanium design, Action Button, and the powerful A17 Pro chip.',
        short_description: 'Latest iPhone with titanium design and A17 Pro chip',
        category_id: electronicsCategory._id,
        images: [
          'https://example.com/images/iphone-15-pro-1.jpg',
          'https://example.com/images/iphone-15-pro-2.jpg',
          'https://example.com/images/iphone-15-pro-3.jpg',
          'https://example.com/images/iphone-15-pro-4.jpg'
        ],
        brand_id: null, // Would be Apple brand ID if brands were implemented
        score: 4.9,
        seo_details: {
          meta_title: 'iPhone 15 Pro - Revolutionary Smartphone',
          meta_description: 'Experience the future with iPhone 15 Pro featuring titanium design and A17 Pro chip.',
          meta_keywords: ['iphone', 'smartphone', 'apple', 'titanium', 'a17 pro']
        },
        is_active: true
      },
      {
        name: 'Dell XPS 13 Plus',
        slug: 'dell-xps-13-plus',
        description: 'Ultra-thin and light laptop with 13.4-inch InfinityEdge display, 12th Gen Intel processors, and premium build quality.',
        short_description: 'Ultra-portable laptop with premium design',
        category_id: laptopsCategory?._id || computersCategory._id,
        images: [
          'https://example.com/images/dell-xps-13-plus-1.jpg',
          'https://example.com/images/dell-xps-13-plus-2.jpg'
        ],
        brand_id: null, // Would be Dell brand ID if brands were implemented
        score: 4.5,
        seo_details: {
          meta_title: 'Dell XPS 13 Plus - Ultra-Portable Laptop',
          meta_description: 'Experience premium computing with Dell XPS 13 Plus ultra-thin laptop.',
          meta_keywords: ['dell', 'xps', 'laptop', 'ultrabook', 'portable']
        },
        is_active: true
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: 'High-quality 100% organic cotton t-shirt with comfortable fit and sustainable manufacturing.',
        short_description: 'Comfortable organic cotton t-shirt',
        category_id: mensClothingCategory?._id || clothingCategory._id,
        images: [
          'https://example.com/images/cotton-tshirt-1.jpg',
          'https://example.com/images/cotton-tshirt-2.jpg'
        ],
        brand_id: null,
        score: 4.3,
        seo_details: {
          meta_title: 'Premium Cotton T-Shirt - Sustainable Fashion',
          meta_description: 'Comfortable and eco-friendly organic cotton t-shirt for everyday wear.',
          meta_keywords: ['t-shirt', 'cotton', 'organic', 'sustainable', 'clothing']
        },
        is_active: true
      },
      {
        name: 'Wireless Gaming Mouse',
        slug: 'wireless-gaming-mouse',
        description: 'High-precision wireless gaming mouse with customizable RGB lighting, programmable buttons, and long battery life.',
        short_description: 'Professional wireless gaming mouse',
        category_id: computersCategory._id,
        images: [
          'https://example.com/images/gaming-mouse-1.jpg',
          'https://example.com/images/gaming-mouse-2.jpg'
        ],
        brand_id: null,
        score: 4.4,
        seo_details: {
          meta_title: 'Wireless Gaming Mouse - Precision Gaming',
          meta_description: 'Enhance your gaming experience with this high-precision wireless gaming mouse.',
          meta_keywords: ['gaming', 'mouse', 'wireless', 'rgb', 'precision']
        },
        is_active: true
      },
      {
        name: 'Smart Watch Series 9',
        slug: 'smart-watch-series-9',
        description: 'Advanced smart watch with health monitoring, fitness tracking, and seamless connectivity.',
        short_description: 'Advanced smart watch with health features',
        category_id: electronicsCategory._id,
        images: [
          'https://example.com/images/smart-watch-1.jpg',
          'https://example.com/images/smart-watch-2.jpg'
        ],
        brand_id: null,
        score: 4.6,
        seo_details: {
          meta_title: 'Smart Watch Series 9 - Advanced Wearable',
          meta_description: 'Stay connected and healthy with the Smart Watch Series 9.',
          meta_keywords: ['smart watch', 'fitness', 'health', 'wearable', 'connectivity']
        },
        is_active: true
      },
      {
        name: 'Bluetooth Speaker Pro',
        slug: 'bluetooth-speaker-pro',
        description: 'Portable Bluetooth speaker with premium sound quality, waterproof design, and 24-hour battery life.',
        short_description: 'Waterproof portable Bluetooth speaker',
        category_id: audioCategory._id,
        images: [
          'https://example.com/images/bluetooth-speaker-1.jpg',
          'https://example.com/images/bluetooth-speaker-2.jpg'
        ],
        brand_id: null,
        score: 4.2,
        seo_details: {
          meta_title: 'Bluetooth Speaker Pro - Portable Audio',
          meta_description: 'Experience premium portable audio with the waterproof Bluetooth Speaker Pro.',
          meta_keywords: ['bluetooth', 'speaker', 'portable', 'waterproof', 'audio']
        },
        is_active: true
      }
    ];
    
    const createdProducts = await ProductModel.insertMany(productData);
    
    // Group by category for summary
    const categoryCount = {};
    for (const product of createdProducts) {
      const category = await Category.findById(product.category_id);
      const categoryName = category ? category.name : 'Unknown';
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    }
    
    const summary = Object.entries(categoryCount)
      .map(([category, count]) => `${category}: ${count}`)
      .join(', ');
    
    return {
      count: createdProducts.length,
      summary: `Created products across categories (${summary})`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed products: ${error.message}`);
  }
};

module.exports = {
  seed
};
