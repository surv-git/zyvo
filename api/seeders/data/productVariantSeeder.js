/**
 * Product Variant Seeder
 * Seeds sample product variants (SKUs) for products
 */

/**
 * Seed product variants
 */
const seed = async (ProductVariantModel) => {
  try {
    // Get reference models for relationships
    const Product = require('../../models/Product');
    const Option = require('../../models/Option');
    
    // Get some products and options to reference
    const macbookPro = await Product.findOne({ slug: 'macbook-pro-16-inch' });
    const sonyHeadphones = await Product.findOne({ slug: 'sony-wh-1000xm5-wireless-headphones' });
    const iphone15Pro = await Product.findOne({ slug: 'iphone-15-pro' });
    const cottonTshirt = await Product.findOne({ slug: 'premium-cotton-t-shirt' });
    const smartWatch = await Product.findOne({ slug: 'smart-watch-series-9' });
    
    if (!macbookPro) {
      throw new Error('Products must be seeded before product variants. Please run: node seeders/seeder.js seed products');
    }
    
    // Get options
    const silverColor = await Option.findOne({ option_type: 'Color', option_value: 'Silver' });
    const blackColor = await Option.findOne({ option_type: 'Color', option_value: 'Black' });
    const whiteColor = await Option.findOne({ option_type: 'Color', option_value: 'White' });
    const redColor = await Option.findOne({ option_type: 'Color', option_value: 'Red' });
    const blueColor = await Option.findOne({ option_type: 'Color', option_value: 'Blue' });
    
    const storage512GB = await Option.findOne({ option_type: 'Storage', option_value: '512GB' });
    const storage1TB = await Option.findOne({ option_type: 'Storage', option_value: '1TB' });
    const storage256GB = await Option.findOne({ option_type: 'Storage', option_value: '256GB' });
    const storage128GB = await Option.findOne({ option_type: 'Storage', option_value: '128GB' });
    
    const ram16GB = await Option.findOne({ option_type: 'RAM', option_value: '16GB' });
    const ram32GB = await Option.findOne({ option_type: 'RAM', option_value: '32GB' });
    
    const sizeS = await Option.findOne({ option_type: 'Size', option_value: 'S' });
    const sizeM = await Option.findOne({ option_type: 'Size', option_value: 'M' });
    const sizeL = await Option.findOne({ option_type: 'Size', option_value: 'L' });
    const sizeXL = await Option.findOne({ option_type: 'Size', option_value: 'XL' });
    
    if (!silverColor) {
      throw new Error('Options must be seeded before product variants. Please run: node seeders/seeder.js seed options');
    }
    
    const productVariantData = [
      // MacBook Pro variants
      {
        product_id: macbookPro._id,
        option_values: [silverColor._id, storage512GB._id, ram16GB._id],
        sku_code: 'MBP-16-SLV-512-16',
        price: 2499.00,
        slug: 'macbook-pro-16-silver-512gb-16gb',
        dimensions: {
          length: 35.57,
          width: 24.81,
          height: 1.68,
          unit: 'cm'
        },
        weight: {
          value: 2100,
          unit: 'g'
        },
        packaging_cost: 25.00,
        shipping_cost: 29.99,
        images: ['https://example.com/images/macbook-pro-16-silver.jpg'],
        is_active: true,
        sort_order: 1
      },
      {
        product_id: macbookPro._id,
        option_values: [silverColor._id, storage1TB._id, ram32GB._id],
        sku_code: 'MBP-16-SLV-1TB-32',
        price: 3299.00,
        slug: 'macbook-pro-16-silver-1tb-32gb',
        dimensions: {
          length: 35.57,
          width: 24.81,
          height: 1.68,
          unit: 'cm'
        },
        weight: {
          value: 2100,
          unit: 'g'
        },
        packaging_cost: 25.00,
        shipping_cost: 29.99,
        images: ['https://example.com/images/macbook-pro-16-silver.jpg'],
        is_active: true,
        sort_order: 2
      },
      
      // Sony Headphones variants - add different options to avoid conflicts
      {
        product_id: sonyHeadphones._id,
        option_values: [blackColor._id],
        sku_code: 'SONY-WH1000XM5-BLK',
        price: 399.99,
        slug: 'sony-wh1000xm5-black',
        dimensions: {
          length: 25.4,
          width: 21.0,
          height: 8.9,
          unit: 'cm'
        },
        weight: {
          value: 250,
          unit: 'g'
        },
        packaging_cost: 15.00,
        shipping_cost: 9.99,
        images: ['https://example.com/images/sony-wh1000xm5-black.jpg'],
        is_active: true,
        sort_order: 1
      },
      {
        product_id: sonyHeadphones._id,
        option_values: [whiteColor._id], // Changed from silver to white to avoid conflicts
        sku_code: 'SONY-WH1000XM5-WHT',
        price: 399.99,
        slug: 'sony-wh1000xm5-white',
        dimensions: {
          length: 25.4,
          width: 21.0,
          height: 8.9,
          unit: 'cm'
        },
        weight: {
          value: 250,
          unit: 'g'
        },
        packaging_cost: 15.00,
        shipping_cost: 9.99,
        images: ['https://example.com/images/sony-wh1000xm5-white.jpg'],
        is_active: true,
        sort_order: 2
      },
      
      // iPhone 15 Pro variants
      {
        product_id: iphone15Pro._id,
        option_values: [storage256GB._id, blackColor._id],
        sku_code: 'IP15P-256-BLK',
        price: 999.00,
        slug: 'iphone-15-pro-256gb-black',
        dimensions: {
          length: 14.67,
          width: 7.08,
          height: 0.83,
          unit: 'cm'
        },
        weight: {
          value: 187,
          unit: 'g'
        },
        packaging_cost: 12.00,
        shipping_cost: 15.99,
        images: ['https://example.com/images/iphone-15-pro-black.jpg'],
        is_active: true,
        sort_order: 1
      },
      {
        product_id: iphone15Pro._id,
        option_values: [storage512GB._id, blackColor._id],
        sku_code: 'IP15P-512-BLK',
        price: 1199.00,
        slug: 'iphone-15-pro-512gb-black',
        dimensions: {
          length: 14.67,
          width: 7.08,
          height: 0.83,
          unit: 'cm'
        },
        weight: {
          value: 187,
          unit: 'g'
        },
        packaging_cost: 12.00,
        shipping_cost: 15.99,
        images: ['https://example.com/images/iphone-15-pro-black.jpg'],
        is_active: true,
        sort_order: 2
      },
      {
        product_id: iphone15Pro._id,
        option_values: [storage256GB._id, whiteColor._id],
        sku_code: 'IP15P-256-WHT',
        price: 999.00,
        slug: 'iphone-15-pro-256gb-white',
        dimensions: {
          length: 14.67,
          width: 7.08,
          height: 0.83,
          unit: 'cm'
        },
        weight: {
          value: 187,
          unit: 'g'
        },
        packaging_cost: 12.00,
        shipping_cost: 15.99,
        images: ['https://example.com/images/iphone-15-pro-white.jpg'],
        is_active: true,
        sort_order: 3
      },
      
      // Cotton T-Shirt variants
      {
        product_id: cottonTshirt._id,
        option_values: [sizeS._id, redColor._id],
        sku_code: 'TSH-COT-S-RED',
        price: 29.99,
        slug: 'premium-cotton-tshirt-small-red',
        dimensions: {
          length: 66,
          width: 51,
          height: 1,
          unit: 'cm'
        },
        weight: {
          value: 150,
          unit: 'g'
        },
        packaging_cost: 2.50,
        shipping_cost: 5.99,
        images: ['https://example.com/images/cotton-tshirt-red-s.jpg'],
        is_active: true,
        sort_order: 1
      },
      {
        product_id: cottonTshirt._id,
        option_values: [sizeM._id, redColor._id],
        sku_code: 'TSH-COT-M-RED',
        price: 29.99,
        slug: 'premium-cotton-tshirt-medium-red',
        dimensions: {
          length: 71,
          width: 56,
          height: 1,
          unit: 'cm'
        },
        weight: {
          value: 160,
          unit: 'g'
        },
        packaging_cost: 2.50,
        shipping_cost: 5.99,
        images: ['https://example.com/images/cotton-tshirt-red-m.jpg'],
        is_active: true,
        sort_order: 2
      },
      {
        product_id: cottonTshirt._id,
        option_values: [sizeL._id, blueColor._id],
        sku_code: 'TSH-COT-L-BLU',
        price: 29.99,
        slug: 'premium-cotton-tshirt-large-blue',
        dimensions: {
          length: 76,
          width: 61,
          height: 1,
          unit: 'cm'
        },
        weight: {
          value: 170,
          unit: 'g'
        },
        packaging_cost: 2.50,
        shipping_cost: 5.99,
        images: ['https://example.com/images/cotton-tshirt-blue-l.jpg'],
        is_active: true,
        sort_order: 3
      },
      
      // Smart Watch variants - add different colors
      {
        product_id: smartWatch._id,
        option_values: [blackColor._id],
        sku_code: 'SW9-BLK',
        price: 399.00,
        slug: 'smart-watch-series-9-black',
        dimensions: {
          length: 4.5,
          width: 3.8,
          height: 1.08,
          unit: 'cm'
        },
        weight: {
          value: 38,
          unit: 'g'
        },
        packaging_cost: 8.00,
        shipping_cost: 7.99,
        images: ['https://example.com/images/smart-watch-black.jpg'],
        is_active: true,
        sort_order: 1
      },
      {
        product_id: smartWatch._id,
        option_values: [whiteColor._id], // Changed from silver to white
        sku_code: 'SW9-WHT',
        price: 399.00,
        slug: 'smart-watch-series-9-white',
        dimensions: {
          length: 4.5,
          width: 3.8,
          height: 1.08,
          unit: 'cm'
        },
        weight: {
          value: 38,
          unit: 'g'
        },
        packaging_cost: 8.00,
        shipping_cost: 7.99,
        images: ['https://example.com/images/smart-watch-white.jpg'],
        is_active: true,
        sort_order: 2
      }
    ];
    
    const createdVariants = [];
    let skippedCount = 0;
    
    // Insert variants one by one to handle duplicates gracefully
    for (const variantData of productVariantData) {
      try {
        const createdVariant = await ProductVariantModel.create(variantData);
        createdVariants.push(createdVariant);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - skip this variant and continue
          skippedCount++;
          console.log(`⚠️  Skipped duplicate variant: ${variantData.sku_code}`);
        } else {
          // Other errors should still throw
          throw error;
        }
      }
    }
    
    // Group by product for summary
    const productCount = {};
    for (const variant of createdVariants) {
      const product = await Product.findById(variant.product_id);
      const productName = product ? product.name : 'Unknown';
      productCount[productName] = (productCount[productName] || 0) + 1;
    }
    
    const summary = Object.entries(productCount)
      .map(([product, count]) => `${product}: ${count} variants`)
      .join(', ');
    
    const finalSummary = `Created variants for products (${summary})${skippedCount > 0 ? `. Skipped ${skippedCount} duplicates` : ''}`;
    
    return {
      count: createdVariants.length,
      summary: finalSummary
    };
    
  } catch (error) {
    throw new Error(`Failed to seed product variants: ${error.message}`);
  }
};

module.exports = {
  seed
};
