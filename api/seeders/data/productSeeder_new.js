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
    
    // Get categories and brands
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
      {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.',
        short_description: 'Premium noise-canceling wireless headphones',
        category_id: getCategoryBySlug('headphones')?._id,
        brand_id: getBrandBySlug('sony')?._id,
        images: [
          'https://example.com/images/sony-wh1000xm5-1.jpg',
          'https://example.com/images/sony-wh1000xm5-2.jpg'
        ],
        score: 4.8,
        seo_details: {
          meta_title: 'Sony WH-1000XM5 - Premium Noise Canceling Headphones',
          meta_description: 'Experience superior audio with Sony WH-1000XM5 featuring industry-leading noise cancellation.',
          meta_keywords: ['sony', 'headphones', 'wireless', 'noise canceling', 'wh1000xm5']
        },
        is_active: true
      },
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
};
