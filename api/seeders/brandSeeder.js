/**
 * Brand Seeder
 * Seeds brand data for e-commerce platform testing and development
 */

// Sample brand data covering various industries and categories
const sampleBrands = [
  // Technology & Electronics
  {
    name: 'Apple',
    description: 'Innovative technology company known for consumer electronics, software, and online services',
    logo_url: 'https://example.com/logos/apple.png',
    website: 'https://www.apple.com',
    contact_email: 'contact@apple.com',
    is_active: true
  },
  {
    name: 'Samsung',
    description: 'Global leader in technology, semiconductors, and consumer electronics',
    logo_url: 'https://example.com/logos/samsung.png',
    website: 'https://www.samsung.com',
    contact_email: 'info@samsung.com',
    is_active: true
  },
  {
    name: 'Sony',
    description: 'Japanese multinational conglomerate specializing in electronics, gaming, and entertainment',
    logo_url: 'https://example.com/logos/sony.png',
    website: 'https://www.sony.com',
    contact_email: 'support@sony.com',
    is_active: true
  },
  {
    name: 'LG',
    description: 'South Korean multinational electronics company and home appliance manufacturer',
    logo_url: 'https://example.com/logos/lg.png',
    website: 'https://www.lg.com',
    contact_email: 'info@lg.com',
    is_active: true
  },
  {
    name: 'Microsoft',
    description: 'Technology corporation known for software, hardware, and cloud services',
    logo_url: 'https://example.com/logos/microsoft.png',
    website: 'https://www.microsoft.com',
    contact_email: 'support@microsoft.com',
    is_active: true
  },

  // Fashion & Apparel
  {
    name: 'Nike',
    description: 'Global athletic footwear and apparel corporation',
    logo_url: 'https://example.com/logos/nike.png',
    website: 'https://www.nike.com',
    contact_email: 'info@nike.com',
    is_active: true
  },
  {
    name: 'Adidas',
    description: 'German multinational corporation that designs and manufactures athletic shoes, clothing and accessories',
    logo_url: 'https://example.com/logos/adidas.png',
    website: 'https://www.adidas.com',
    contact_email: 'contact@adidas.com',
    is_active: true
  },
  {
    name: 'H&M',
    description: 'Swedish multinational clothing retail company known for fast-fashion clothing',
    logo_url: 'https://example.com/logos/hm.png',
    website: 'https://www.hm.com',
    contact_email: 'info@hm.com',
    is_active: true
  },
  {
    name: 'Zara',
    description: 'Spanish apparel retailer known for fast fashion and trendy clothing',
    logo_url: 'https://example.com/logos/zara.png',
    website: 'https://www.zara.com',
    contact_email: 'contact@zara.com',
    is_active: true
  },
  {
    name: 'Uniqlo',
    description: 'Japanese casual wear designer, manufacturer and retailer',
    logo_url: 'https://example.com/logos/uniqlo.png',
    website: 'https://www.uniqlo.com',
    contact_email: 'info@uniqlo.com',
    is_active: true
  },

  // Automotive
  {
    name: 'Toyota',
    description: 'Japanese multinational automotive manufacturer known for reliable vehicles',
    logo_url: 'https://example.com/logos/toyota.png',
    website: 'https://www.toyota.com',
    contact_email: 'info@toyota.com',
    is_active: true
  },
  {
    name: 'BMW',
    description: 'German multinational corporation producing luxury vehicles and motorcycles',
    logo_url: 'https://example.com/logos/bmw.png',
    website: 'https://www.bmw.com',
    contact_email: 'contact@bmw.com',
    is_active: true
  },
  {
    name: 'Tesla',
    description: 'American electric vehicle and clean energy company',
    logo_url: 'https://example.com/logos/tesla.png',
    website: 'https://www.tesla.com',
    contact_email: 'info@tesla.com',
    is_active: true
  },

  // Home & Garden
  {
    name: 'IKEA',
    description: 'Swedish-founded multinational group that designs and sells ready-to-assemble furniture',
    logo_url: 'https://example.com/logos/ikea.png',
    website: 'https://www.ikea.com',
    contact_email: 'info@ikea.com',
    is_active: true
  },
  {
    name: 'Home Depot',
    description: 'American home improvement retail corporation',
    logo_url: 'https://example.com/logos/homedepot.png',
    website: 'https://www.homedepot.com',
    contact_email: 'contact@homedepot.com',
    is_active: true
  },

  // Beauty & Personal Care
  {
    name: "L'Oréal",
    description: 'French personal care company specializing in cosmetics, skin care, and hair care',
    logo_url: 'https://example.com/logos/loreal.png',
    website: 'https://www.loreal.com',
    contact_email: 'info@loreal.com',
    is_active: true
  },
  {
    name: 'Nivea',
    description: 'German personal care brand specializing in skin and body care products',
    logo_url: 'https://example.com/logos/nivea.png',
    website: 'https://www.nivea.com',
    contact_email: 'contact@nivea.com',
    is_active: true
  },

  // Food & Beverage
  {
    name: 'Coca-Cola',
    description: 'American multinational beverage corporation and manufacturer',
    logo_url: 'https://example.com/logos/cocacola.png',
    website: 'https://www.coca-cola.com',
    contact_email: 'info@coca-cola.com',
    is_active: true
  },
  {
    name: 'Nestlé',
    description: 'Swiss multinational food and drink processing conglomerate',
    logo_url: 'https://example.com/logos/nestle.png',
    website: 'https://www.nestle.com',
    contact_email: 'contact@nestle.com',
    is_active: true
  },

  // Sports & Outdoors
  {
    name: 'The North Face',
    description: 'American outdoor recreation product company specializing in outerwear, fleece, and equipment',
    logo_url: 'https://example.com/logos/northface.png',
    website: 'https://www.thenorthface.com',
    contact_email: 'info@thenorthface.com',
    is_active: true
  },
  {
    name: 'Patagonia',
    description: 'American clothing company that markets and sells outdoor clothing',
    logo_url: 'https://example.com/logos/patagonia.png',
    website: 'https://www.patagonia.com',
    contact_email: 'contact@patagonia.com',
    is_active: true
  },

  // Luxury Brands
  {
    name: 'Louis Vuitton',
    description: 'French fashion house known for luxury leather goods, handbags, and accessories',
    logo_url: 'https://example.com/logos/louisvuitton.png',
    website: 'https://www.louisvuitton.com',
    contact_email: 'info@louisvuitton.com',
    is_active: true
  },
  {
    name: 'Gucci',
    description: 'Italian luxury fashion house known for leather goods, fashion, and accessories',
    logo_url: 'https://example.com/logos/gucci.png',
    website: 'https://www.gucci.com',
    contact_email: 'contact@gucci.com',
    is_active: true
  },

  // Gaming & Entertainment
  {
    name: 'Nintendo',
    description: 'Japanese multinational video game company and consumer electronics manufacturer',
    logo_url: 'https://example.com/logos/nintendo.png',
    website: 'https://www.nintendo.com',
    contact_email: 'support@nintendo.com',
    is_active: true
  },
  {
    name: 'PlayStation',
    description: 'Video gaming brand consisting of consoles, games, and online services',
    logo_url: 'https://example.com/logos/playstation.png',
    website: 'https://www.playstation.com',
    contact_email: 'info@playstation.com',
    is_active: true
  },

  // Health & Wellness
  {
    name: 'Johnson & Johnson',
    description: 'American multinational corporation specializing in pharmaceuticals and consumer goods',
    logo_url: 'https://example.com/logos/jnj.png',
    website: 'https://www.jnj.com',
    contact_email: 'info@jnj.com',
    is_active: true
  },

  // Test/Inactive Brand
  {
    name: 'Test Brand Inactive',
    description: 'This is a test brand that is inactive for testing purposes',
    logo_url: 'https://example.com/logos/test.png',
    website: 'https://www.testbrand.com',
    contact_email: 'test@testbrand.com',
    is_active: false
  }
];

/**
 * Seed brands table
 */
const seed = async (BrandModel) => {
  try {
    console.log('   📝 Generating brand data...');
    
    // Insert brands one by one to trigger pre-save middleware
    const insertedBrands = [];
    for (const brandData of sampleBrands) {
      try {
        const brand = new BrandModel(brandData);
        const savedBrand = await brand.save();
        insertedBrands.push(savedBrand);
      } catch (error) {
        console.error(`   ❌ Failed to create brand ${brandData.name}:`, error.message);
      }
    }

    // Count by status
    const activeCount = insertedBrands.filter(b => b.is_active).length;
    const inactiveCount = insertedBrands.filter(b => !b.is_active).length;

    return {
      count: insertedBrands.length,
      summary: `${activeCount} active brands, ${inactiveCount} inactive brands`
    };

  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new Error(`Duplicate ${duplicateField} found. Some brands may already exist.`);
    }
    throw error;
  }
};

/**
 * Clean brands table
 */
const clean = async (BrandModel) => {
  try {
    const result = await BrandModel.deleteMany({});
    return {
      count: result.deletedCount,
      summary: `Removed ${result.deletedCount} brands`
    };
  } catch (error) {
    throw new Error(`Failed to clean brands: ${error.message}`);
  }
};

// Export functions for use in seeder system
module.exports = {
  seed,
  clean,
  sampleBrands
};
