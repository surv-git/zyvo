/**
 * Product Variant Seeder
 * Seeds comprehensive product variants (SKUs) for all products with realistic combinations
 */

/**
 * Seed product variants
 */
const seed = async (ProductVariantModel) => {
  try {
    // Get reference models for relationships
    const Product = require('../../models/Product');
    const Option = require('../../models/Option');
    
    // Get all products
    const products = await Product.find({}).populate('category_id', 'name');
    console.log(`📦 Found ${products.length} products to create variants for`);
    
    if (products.length === 0) {
      throw new Error('Products must be seeded before product variants. Please run: node seeders/seeder.js seed products');
    }
    
    // Get all options organized by type
    const allOptions = await Option.find({});
    const optionsByType = {};
    
    allOptions.forEach(option => {
      if (!optionsByType[option.option_type]) {
        optionsByType[option.option_type] = [];
      }
      optionsByType[option.option_type].push(option);
    });
    
    console.log(`🎛️ Found options for ${Object.keys(optionsByType).length} option types`);
    
    if (Object.keys(optionsByType).length === 0) {
      throw new Error('Options must be seeded before product variants. Please run: node seeders/seeder.js seed options');
    }
    
    // Helper function to get random options by type
    const getRandomOptions = (type, count = 1) => {
      if (!optionsByType[type]) return [];
      const shuffled = [...optionsByType[type]].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    
    // Helper function to generate SKU
    const generateSKU = (productName, options) => {
      const productCode = productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8);
      const optionCodes = options.map(opt => 
        opt.option_value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3)
      ).join('-');
      return `${productCode}-${optionCodes}`;
    };
    
    // Helper function to calculate price variation
    const calculatePrice = (basePrice, options) => {
      let priceMultiplier = 1;
      
      options.forEach(option => {
        // Price adjustments based on option types
        switch (option.option_type) {
          case 'Storage':
            if (option.option_value.includes('1TB')) priceMultiplier += 0.3;
            else if (option.option_value.includes('2TB')) priceMultiplier += 0.5;
            else if (option.option_value.includes('4TB')) priceMultiplier += 0.8;
            else if (option.option_value.includes('512GB')) priceMultiplier += 0.15;
            break;
          case 'RAM':
            if (option.option_value.includes('32GB')) priceMultiplier += 0.25;
            else if (option.option_value.includes('64GB')) priceMultiplier += 0.4;
            else if (option.option_value.includes('16GB')) priceMultiplier += 0.1;
            break;
          case 'Color':
            if (option.option_value === 'Gold') priceMultiplier += 0.05;
            break;
          case 'Size':
            if (['XXL', 'XXXL'].includes(option.option_value)) priceMultiplier += 0.1;
            break;
        }
      });
      
      return Math.round(basePrice * priceMultiplier * 100) / 100;
    };
    
    const productVariantData = [];
    
    // Create variants for each product based on category
    for (const product of products) {
      const categoryName = product.category_id?.name;
      let variantConfigs = [];
      
      switch (categoryName) {
        case 'Smartphones':
          // Storage + Color variants
          const storageOptions = getRandomOptions('Storage', 3);
          const phoneColors = getRandomOptions('Color', 4);
          
          storageOptions.forEach((storage, i) => {
            phoneColors.forEach((color, j) => {
              variantConfigs.push({
                options: [storage, color],
                basePrice: 899 + (i * 200), // Varies by storage
                sort_order: (i * 10) + j + 1
              });
            });
          });
          break;
          
        case 'Laptops':
          // RAM + Storage + Color variants
          const ramOptions = getRandomOptions('RAM', 2);
          const laptopStorage = getRandomOptions('Storage', 2);
          const laptopColors = getRandomOptions('Color', 2);
          
          ramOptions.forEach((ram, i) => {
            laptopStorage.forEach((storage, j) => {
              laptopColors.forEach((color, k) => {
                variantConfigs.push({
                  options: [ram, storage, color],
                  basePrice: 1299 + (i * 400) + (j * 300), // Varies by specs
                  sort_order: (i * 100) + (j * 10) + k + 1
                });
              });
            });
          });
          break;
          
        case 'Electronics':
          // Color + Connectivity variants
          const electronicsColors = getRandomOptions('Color', 3);
          const connectivity = getRandomOptions('Connectivity', 2);
          
          electronicsColors.forEach((color, i) => {
            connectivity.forEach((conn, j) => {
              variantConfigs.push({
                options: [color, conn],
                basePrice: 299 + (i * 50), // Base electronics price
                sort_order: (i * 10) + j + 1
              });
            });
          });
          break;
          
        case 'Headphones':
          // Color variants
          const headphoneColors = getRandomOptions('Color', 3);
          
          headphoneColors.forEach((color, i) => {
            variantConfigs.push({
              options: [color],
              basePrice: 349, // Standard headphone price
              sort_order: i + 1
            });
          });
          break;
          
        case 'Clothing':
        case "Men's Clothing":
        case "Women's Clothing":
          // Size + Color + Material variants
          const sizes = getRandomOptions('Size', 4);
          const clothingColors = getRandomOptions('Color', 3);
          const materials = getRandomOptions('Material', 2);
          
          sizes.forEach((size, i) => {
            clothingColors.forEach((color, j) => {
              materials.forEach((material, k) => {
                variantConfigs.push({
                  options: [size, color, material],
                  basePrice: 29.99 + (i * 5), // Varies by size
                  sort_order: (i * 100) + (j * 10) + k + 1
                });
              });
            });
          });
          break;
          
        case 'Home & Garden':
          // Color + Material variants
          const homeColors = getRandomOptions('Color', 3);
          const homeMaterials = getRandomOptions('Material', 2);
          
          homeColors.forEach((color, i) => {
            homeMaterials.forEach((material, j) => {
              variantConfigs.push({
                options: [color, material],
                basePrice: 199 + (i * 25), // Base furniture price
                sort_order: (i * 10) + j + 1
              });
            });
          });
          break;
          
        default:
          // Default: Color variants only
          const defaultColors = getRandomOptions('Color', 2);
          defaultColors.forEach((color, i) => {
            variantConfigs.push({
              options: [color],
              basePrice: 99.99,
              sort_order: i + 1
            });
          });
      }
      
      // Create variant data for this product
      variantConfigs.forEach((config, index) => {
        const price = calculatePrice(config.basePrice, config.options);
        const sku = generateSKU(product.name, config.options);
        const optionValues = config.options.map(opt => opt.option_value).join('-').toLowerCase();
        const slug = `${product.slug}-${optionValues}`.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        
        // Add discount for some variants
        const isOnSale = Math.random() < 0.3; // 30% chance of being on sale
        const discountDetails = isOnSale ? {
          price: Math.round(price * 0.85 * 100) / 100, // 15% off
          percentage: 15,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          is_on_sale: true
        } : {};
        
        productVariantData.push({
          product_id: product._id,
          option_values: config.options.map(opt => opt._id),
          sku_code: sku,
          price: price,
          discount_details: discountDetails,
          slug: slug,
          dimensions: {
            length: 20 + Math.random() * 30, // Random dimensions
            width: 15 + Math.random() * 20,
            height: 5 + Math.random() * 15,
            unit: 'cm'
          },
          weight: {
            value: Math.round((100 + Math.random() * 1900) * 100) / 100, // 100g to 2kg
            unit: 'g'
          },
          packaging_cost: Math.round((5 + Math.random() * 45) * 100) / 100, // $5-50
          shipping_cost: Math.round((5 + Math.random() * 25) * 100) / 100, // $5-30
          images: [
            `https://example.com/images/${product.slug}-${config.options[0].option_value.toLowerCase()}.jpg`
          ],
          is_active: true,
          sort_order: config.sort_order,
          // Add some ratings
          average_rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5-5.0
          reviews_count: Math.floor(Math.random() * 100), // 0-99 reviews
          rating_distribution: {
            '1': Math.floor(Math.random() * 5),
            '2': Math.floor(Math.random() * 8),
            '3': Math.floor(Math.random() * 15),
            '4': Math.floor(Math.random() * 25),
            '5': Math.floor(Math.random() * 40)
          }
        });
      });
    }
    
    console.log(`🏷️ Generated ${productVariantData.length} product variants`);
    
    // Save variants individually to trigger middleware
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const variantData of productVariantData) {
      try {
        // Check if variant already exists
        const existingVariant = await ProductVariantModel.findOne({
          sku_code: variantData.sku_code
        });
        
        if (existingVariant) {
          skippedCount++;
          continue;
        }
        
        const variant = new ProductVariantModel(variantData);
        await variant.save();
        createdCount++;
        
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - skip this variant
          skippedCount++;
        } else {
          console.error(`Error creating variant: ${error.message}`);
          throw error;
        }
      }
    }
    
    // Get statistics by product
    const variantStats = await ProductVariantModel.aggregate([
      { $lookup: { from: 'products', localField: 'product_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`\n📊 Variants created by product:`);
    variantStats.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.count} variants`);
    });
    
    // Count on-sale variants
    const onSaleCount = await ProductVariantModel.countDocuments({
      'discount_details.is_on_sale': true
    });
    
    console.log(`\n💰 ${onSaleCount} variants are currently on sale`);
    
    return {
      count: createdCount,
      summary: `${createdCount} variants created across ${variantStats.length} products, ${skippedCount} duplicates skipped, ${onSaleCount} on sale`
    };
    
  } catch (error) {
    console.error('❌ Error in productVariant seeder:', error.message);
    throw error;
  }
};

module.exports = { seed };
