/**
 * Product Seeder
 * Seeds realistic products for the e-commerce system using actual categories and brands
 */

/**
 * Seed products
 */
const seed = async (ProductModel) => {
  try {
    // Get reference models for relationships
    const Category = require('../../models/Category');
    const Brand = require('../../models/Brand');
    
    // Get categories
    const categories = await Category.find({}).select('_id name slug');
    const brands = await Brand.find({}).select('_id name slug');
    
    if (categories.length === 0) {
      throw new Error('Categories must be seeded before products. Please run: node seeders/seeder.js seed categories');
    }
    
    if (brands.length === 0) {
      throw new Error('Brands must be seeded before products. Please run: node seeders/seeder.js seed brands');
    }
    
    // Helper function to get category by slug
    const getCategoryBySlug = (slug) => categories.find(cat => cat.slug === slug);
    const getBrandBySlug = (slug) => brands.find(brand => brand.slug === slug);
    
    const productData = [
      // Apple Products
      {
        name: 'iPhone 15 Pro',
        description: 'The most advanced iPhone yet with titanium design, A17 Pro chip, and pro camera system with 5x telephoto.',
        short_description: 'Latest iPhone with titanium design and A17 Pro chip',
        category_id: getCategoryBySlug('smartphones')?._id,
        brand_id: getBrandBySlug('apple')?._id,
        images: [
          'https://example.com/images/iphone-15-pro-1.jpg',
          'https://example.com/images/iphone-15-pro-2.jpg'
        ],
        score: 4.8,
        seo_details: {
          meta_title: 'iPhone 15 Pro - Titanium Design | Latest Apple Smartphone',
          meta_description: 'Experience the power of iPhone 15 Pro with titanium build, A17 Pro chip, and advanced camera system.',
          meta_keywords: ['iphone', 'apple', 'smartphone', 'titanium', 'a17']
        },
        is_active: true
      },
      {
        name: 'MacBook Air M2',
        description: 'Supercharged by M2 chip. MacBook Air is incredibly thin and light with a larger 13.6-inch Liquid Retina display.',
        short_description: 'Ultra-thin laptop powered by Apple M2 chip',
        category_id: getCategoryBySlug('laptops')?._id,
        brand_id: getBrandBySlug('apple')?._id,
        images: [
          'https://example.com/images/macbook-air-m2-1.jpg',
          'https://example.com/images/macbook-air-m2-2.jpg'
        ],
        score: 4.7,
        seo_details: {
          meta_title: 'MacBook Air M2 - Ultra-thin Laptop | Apple',
          meta_description: 'Get more done with MacBook Air M2. Featuring powerful M2 chip in an incredibly thin design.',
          meta_keywords: ['macbook', 'air', 'apple', 'laptop', 'm2']
        },
        is_active: true
      },
      {
        name: 'iPad Pro 12.9-inch',
        description: 'The ultimate iPad experience with M2 chip, stunning 12.9-inch Liquid Retina XDR display, and Apple Pencil support.',
        short_description: 'Professional tablet with M2 chip and XDR display',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('apple')?._id,
        images: [
          'https://example.com/images/ipad-pro-12-1.jpg',
          'https://example.com/images/ipad-pro-12-2.jpg'
        ],
        score: 4.6,
        seo_details: {
          meta_title: 'iPad Pro 12.9-inch - Professional Tablet | Apple',
          meta_description: 'Create and work like never before with iPad Pro featuring M2 chip and stunning XDR display.',
          meta_keywords: ['ipad', 'pro', 'apple', 'tablet', 'm2']
        },
        is_active: true
      },

      // Samsung Products
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'The most powerful Galaxy smartphone with S Pen, 200MP camera, and Galaxy AI features for enhanced productivity.',
        short_description: 'Premium Android phone with S Pen and AI features',
        category_id: getCategoryBySlug('smartphones')?._id,
        brand_id: getBrandBySlug('samsung')?._id,
        images: [
          'https://example.com/images/galaxy-s24-ultra-1.jpg',
          'https://example.com/images/galaxy-s24-ultra-2.jpg'
        ],
        score: 4.7,
        seo_details: {
          meta_title: 'Samsung Galaxy S24 Ultra - Premium Android Phone',
          meta_description: 'Unleash creativity with Galaxy S24 Ultra featuring S Pen, 200MP camera, and Galaxy AI.',
          meta_keywords: ['samsung', 'galaxy', 's24', 'ultra', 'android']
        },
        is_active: true
      },
      {
        name: 'Samsung 55" QLED 4K Smart TV',
        description: 'Immersive 4K entertainment with Quantum Dot technology, smart features, and stunning picture quality.',
        short_description: '55-inch QLED 4K smart television',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('samsung')?._id,
        images: [
          'https://example.com/images/samsung-qled-tv-1.jpg',
          'https://example.com/images/samsung-qled-tv-2.jpg'
        ],
        score: 4.5,
        seo_details: {
          meta_title: 'Samsung 55" QLED 4K Smart TV - Premium Entertainment',
          meta_description: 'Experience stunning 4K visuals with Samsung QLED technology and smart TV features.',
          meta_keywords: ['samsung', 'qled', '4k', 'smart tv', 'television']
        },
        is_active: true
      },

      // Sony Products
      ];

    console.log('   📝 Generating product data...');
    
    // Insert products one by one to trigger pre-save middleware for slug generation
    const insertedProducts = [];
    const skippedProducts = [];
    
    for (const productItem of productData) {
      try {
        // Check for duplicate product names
        const existingProduct = await ProductModel.findOne({ 
          name: productItem.name 
        });
        
        if (existingProduct) {
          skippedProducts.push(productItem);
          console.log(`   ⚠️  Skipping duplicate: ${productItem.name}`);
          continue;
        }
        
        const product = new ProductModel(productItem);
        const savedProduct = await product.save();
        insertedProducts.push(savedProduct);
      } catch (error) {
        if (error.code === 11000) {
          skippedProducts.push(productItem);
          console.log(`   ⚠️  Skipping duplicate: ${productItem.name}`);
        } else {
          console.error(`   ❌ Failed to create product ${productItem.name}:`, error.message);
        }
      }
    }
    
    // Group by category for summary
    const categoryGroups = {};
    insertedProducts.forEach(product => {
      const categoryName = categories.find(cat => cat._id.toString() === product.category_id?.toString())?.name || 'Unknown';
      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = 0;
      }
      categoryGroups[categoryName]++;
    });
    
    const summary = Object.entries(categoryGroups)
      .map(([category, count]) => `${category}: ${count}`)
      .join(', ');
    
    return {
      count: insertedProducts.length,
      summary: `Created products across ${Object.keys(categoryGroups).length} categories (${summary}) - ${skippedProducts.length} duplicates skipped`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed products: ${error.message}`);
  }
};

/**
 * Clean products table
 */
const clean = async (ProductModel) => {
  try {
    const result = await ProductModel.deleteMany({});
    return {
      count: result.deletedCount,
      summary: `Removed ${result.deletedCount} products`
    };
  } catch (error) {
    throw new Error(`Failed to clean products: ${error.message}`);
  }
};

module.exports = {
  seed,
  clean
};,
      {
        name: 'Sony Alpha a7 IV Mirrorless Camera',
        description: 'Professional full-frame mirrorless camera with 33MP sensor, 4K video recording, and advanced autofocus.',
        short_description: 'Professional mirrorless camera with 33MP sensor',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('sony')?._id,
        images: [
          'https://example.com/images/sony-a7iv-1.jpg',
          'https://example.com/images/sony-a7iv-2.jpg'
        ],
        score: 4.7,
        seo_details: {
          meta_title: 'Sony Alpha a7 IV - Professional Mirrorless Camera',
          meta_description: 'Capture stunning photos and videos with Sony Alpha a7 IV featuring 33MP full-frame sensor.',
          meta_keywords: ['sony', 'alpha', 'a7iv', 'camera', 'mirrorless']
        },
        is_active: true
      },

      // Nike Products
      {
        name: 'Nike Air Max 270',
        description: 'Lifestyle sneakers featuring Nike\'s largest Max Air unit for all-day comfort and iconic style.',
        short_description: 'Comfortable lifestyle sneakers with Max Air cushioning',
        category_id: getCategoryBySlug('clothing')?._id,
        brand_id: getBrandBySlug('nike')?._id,
        images: [
          'https://example.com/images/nike-air-max-270-1.jpg',
          'https://example.com/images/nike-air-max-270-2.jpg'
        ],
        score: 4.4,
        seo_details: {
          meta_title: 'Nike Air Max 270 - Lifestyle Sneakers | Nike',
          meta_description: 'Step into comfort with Nike Air Max 270 featuring the largest Max Air unit for ultimate cushioning.',
          meta_keywords: ['nike', 'air max', '270', 'sneakers', 'shoes']
        },
        is_active: true
      },
      {
        name: 'Nike Dri-FIT Training T-Shirt',
        description: 'Moisture-wicking training shirt designed for high-intensity workouts with comfortable fit.',
        short_description: 'Moisture-wicking athletic t-shirt for training',
        category_id: getCategoryBySlug('mens-clothing')?._id,
        brand_id: getBrandBySlug('nike')?._id,
        images: [
          'https://example.com/images/nike-dri-fit-tshirt-1.jpg',
          'https://example.com/images/nike-dri-fit-tshirt-2.jpg'
        ],
        score: 4.3,
        seo_details: {
          meta_title: 'Nike Dri-FIT Training T-Shirt - Athletic Wear',
          meta_description: 'Stay dry and comfortable during workouts with Nike Dri-FIT moisture-wicking technology.',
          meta_keywords: ['nike', 'dri-fit', 'training', 't-shirt', 'athletic']
        },
        is_active: true
      },

      // Adidas Products
      {
        name: 'Adidas Ultraboost 22',
        description: 'High-performance running shoes with responsive Boost midsole and Primeknit upper for ultimate comfort.',
        short_description: 'Premium running shoes with Boost technology',
        category_id: getCategoryBySlug('clothing')?._id,
        brand_id: getBrandBySlug('adidas')?._id,
        images: [
          'https://example.com/images/adidas-ultraboost-22-1.jpg',
          'https://example.com/images/adidas-ultraboost-22-2.jpg'
        ],
        score: 4.6,
        seo_details: {
          meta_title: 'Adidas Ultraboost 22 - Premium Running Shoes',
          meta_description: 'Experience incredible energy return with Adidas Ultraboost 22 featuring Boost technology.',
          meta_keywords: ['adidas', 'ultraboost', 'running', 'shoes', 'boost']
        },
        is_active: true
      },

      // Microsoft Products  
      {
        name: 'Microsoft Surface Laptop 5',
        description: 'Sleek and powerful laptop with 12th Gen Intel processors, vibrant touchscreen, and all-day battery life.',
        short_description: 'Premium Windows laptop with touchscreen display',
        category_id: getCategoryBySlug('laptops')?._id,
        brand_id: getBrandBySlug('microsoft')?._id,
        images: [
          'https://example.com/images/surface-laptop-5-1.jpg',
          'https://example.com/images/surface-laptop-5-2.jpg'
        ],
        score: 4.5,
        seo_details: {
          meta_title: 'Microsoft Surface Laptop 5 - Premium Windows Laptop',
          meta_description: 'Work and create with Microsoft Surface Laptop 5 featuring vibrant touchscreen and powerful performance.',
          meta_keywords: ['microsoft', 'surface', 'laptop', 'windows', 'touchscreen']
        },
        is_active: true
      },

      // Nintendo Products
      {
        name: 'Nintendo Switch OLED Model',
        description: 'Enhanced Nintendo Switch with vibrant 7-inch OLED screen, improved audio, and enhanced kickstand.',
        short_description: 'Gaming console with OLED display and enhanced features',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('nintendo')?._id,
        images: [
          'https://example.com/images/nintendo-switch-oled-1.jpg',
          'https://example.com/images/nintendo-switch-oled-2.jpg'
        ],
        score: 4.7,
        seo_details: {
          meta_title: 'Nintendo Switch OLED Model - Enhanced Gaming Console',
          meta_description: 'Experience gaming like never before with Nintendo Switch OLED featuring vibrant 7-inch display.',
          meta_keywords: ['nintendo', 'switch', 'oled', 'gaming', 'console']
        },
        is_active: true
      },

      // H&M Products
      {
        name: 'H&M Conscious Cotton Hoodie',
        description: 'Comfortable hoodie made from organic cotton as part of H&M\'s sustainable fashion initiative.',
        short_description: 'Sustainable organic cotton hoodie',
        category_id: getCategoryBySlug('clothing')?._id,
        brand_id: getBrandBySlug('hm')?._id,
        images: [
          'https://example.com/images/hm-cotton-hoodie-1.jpg',
          'https://example.com/images/hm-cotton-hoodie-2.jpg'
        ],
        score: 4.2,
        seo_details: {
          meta_title: 'H&M Conscious Cotton Hoodie - Sustainable Fashion',
          meta_description: 'Stay comfortable and sustainable with H&M Conscious organic cotton hoodie.',
          meta_keywords: ['hm', 'conscious', 'cotton', 'hoodie', 'sustainable']
        },
        is_active: true
      },

      // Zara Products
      {
        name: 'Zara Tailored Blazer',
        description: 'Modern tailored blazer perfect for professional and casual settings with contemporary design.',
        short_description: 'Modern tailored blazer for versatile styling',
        category_id: getCategoryBySlug('womens-clothing')?._id,
        brand_id: getBrandBySlug('zara')?._id,
        images: [
          'https://example.com/images/zara-blazer-1.jpg',
          'https://example.com/images/zara-blazer-2.jpg'
        ],
        score: 4.3,
        seo_details: {
          meta_title: 'Zara Tailored Blazer - Modern Professional Wear',
          meta_description: 'Elevate your style with Zara\'s modern tailored blazer perfect for any occasion.',
          meta_keywords: ['zara', 'blazer', 'tailored', 'professional', 'womens']
        },
        is_active: true
      },

      // IKEA Products
      {
        name: 'IKEA MALM Bed Frame',
        description: 'Simple and stylish bed frame with clean lines and durable construction, available in multiple finishes.',
        short_description: 'Minimalist bed frame with clean Scandinavian design',
        category_id: getCategoryBySlug('home-garden')?._id,
        brand_id: getBrandBySlug('ikea')?._id,
        images: [
          'https://example.com/images/ikea-malm-bed-1.jpg',
          'https://example.com/images/ikea-malm-bed-2.jpg'
        ],
        score: 4.4,
        seo_details: {
          meta_title: 'IKEA MALM Bed Frame - Scandinavian Design Furniture',
          meta_description: 'Create a peaceful bedroom with IKEA MALM bed frame featuring clean lines and quality construction.',
          meta_keywords: ['ikea', 'malm', 'bed', 'frame', 'furniture']
        },
        is_active: true
      },

      // PlayStation Products
      {
        name: 'PlayStation 5 Console',
        description: 'Next-generation gaming console with lightning-fast SSD, 4K gaming, and innovative DualSense controller.',
        short_description: 'Next-gen gaming console with 4K and SSD',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('playstation')?._id,
        images: [
          'https://example.com/images/ps5-console-1.jpg',
          'https://example.com/images/ps5-console-2.jpg'
        ],
        score: 4.8,
        seo_details: {
          meta_title: 'PlayStation 5 Console - Next-Gen Gaming Experience',
          meta_description: 'Experience the future of gaming with PlayStation 5 featuring lightning-fast loading and 4K graphics.',
          meta_keywords: ['playstation', 'ps5', 'console', 'gaming', '4k']
        },
        is_active: true
      },

      // LG Products
      {
        name: 'LG OLED C3 65" Smart TV',
        description: 'Premium OLED TV with perfect blacks, infinite contrast, and webOS smart platform for ultimate entertainment.',
        short_description: 'Premium 65-inch OLED smart television',
        category_id: getCategoryBySlug('electronics')?._id,
        brand_id: getBrandBySlug('lg')?._id,
        images: [
          'https://example.com/images/lg-oled-c3-1.jpg',
          'https://example.com/images/lg-oled-c3-2.jpg'
        ],
        score: 4.7,
        seo_details: {
          meta_title: 'LG OLED C3 65" Smart TV - Premium Entertainment',
          meta_description: 'Experience cinematic visuals with LG OLED C3 featuring perfect blacks and vibrant colors.',
          meta_keywords: ['lg', 'oled', 'c3', 'smart tv', '65 inch']
        },
        is_active: true
      }
    ];
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
