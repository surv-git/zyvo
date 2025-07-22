/**
 * Option Seeder
 * Seeds sample options (types and values) for product variants
 */

const optionData = [
  // Color options
  { option_type: 'Color', option_value: 'Red', name: 'Red', sort_order: 1 },
  { option_type: 'Color', option_value: 'Blue', name: 'Blue', sort_order: 2 },
  { option_type: 'Color', option_value: 'Black', name: 'Black', sort_order: 3 },
  { option_type: 'Color', option_value: 'White', name: 'White', sort_order: 4 },
  { option_type: 'Color', option_value: 'Green', name: 'Green', sort_order: 5 },
  { option_type: 'Color', option_value: 'Silver', name: 'Silver', sort_order: 6 },
  { option_type: 'Color', option_value: 'Gold', name: 'Gold', sort_order: 7 },
  { option_type: 'Color', option_value: 'Pink', name: 'Pink', sort_order: 8 },
  { option_type: 'Color', option_value: 'Purple', name: 'Purple', sort_order: 9 },
  { option_type: 'Color', option_value: 'Orange', name: 'Orange', sort_order: 10 },
  { option_type: 'Color', option_value: 'Yellow', name: 'Yellow', sort_order: 11 },
  { option_type: 'Color', option_value: 'Navy', name: 'Navy Blue', sort_order: 12 },
  { option_type: 'Color', option_value: 'Gray', name: 'Gray', sort_order: 13 },
  { option_type: 'Color', option_value: 'Brown', name: 'Brown', sort_order: 14 },
  
  // Size options
  { option_type: 'Size', option_value: 'XS', name: 'Extra Small', sort_order: 1 },
  { option_type: 'Size', option_value: 'S', name: 'Small', sort_order: 2 },
  { option_type: 'Size', option_value: 'M', name: 'Medium', sort_order: 3 },
  { option_type: 'Size', option_value: 'L', name: 'Large', sort_order: 4 },
  { option_type: 'Size', option_value: 'XL', name: 'Extra Large', sort_order: 5 },
  { option_type: 'Size', option_value: 'XXL', name: 'Double Extra Large', sort_order: 6 },
  { option_type: 'Size', option_value: 'XXXL', name: 'Triple Extra Large', sort_order: 7 },
  
  // Pack options
  { option_type: 'Pack', option_value: '1 Pack', name: 'Single Pack', sort_order: 1 },
  { option_type: 'Pack', option_value: '2 Pack', name: 'Twin Pack', sort_order: 2 },
  { option_type: 'Pack', option_value: '3 Pack', name: 'Triple Pack', sort_order: 3 },
  { option_type: 'Pack', option_value: '4 Pack', name: 'Quad Pack', sort_order: 4 },
  { option_type: 'Pack', option_value: '5 Pack', name: 'Five Pack', sort_order: 5 },
  { option_type: 'Pack', option_value: '6 Pack', name: 'Six Pack', sort_order: 6 },
  { option_type: 'Pack', option_value: '12 Pack', name: 'Dozen Pack', sort_order: 7 },
  { option_type: 'Pack', option_value: '24 Pack', name: 'Bulk Pack', sort_order: 8 },
  
  // Pattern options
  { option_type: 'Pattern', option_value: 'Solid', name: 'Solid Color', sort_order: 1 },
  { option_type: 'Pattern', option_value: 'Stripes', name: 'Striped', sort_order: 2 },
  { option_type: 'Pattern', option_value: 'Polka Dots', name: 'Polka Dots', sort_order: 3 },
  { option_type: 'Pattern', option_value: 'Floral', name: 'Floral Print', sort_order: 4 },
  { option_type: 'Pattern', option_value: 'Geometric', name: 'Geometric', sort_order: 5 },
  { option_type: 'Pattern', option_value: 'Checkered', name: 'Checkered', sort_order: 6 },
  { option_type: 'Pattern', option_value: 'Plaid', name: 'Plaid', sort_order: 7 },
  { option_type: 'Pattern', option_value: 'Animal Print', name: 'Animal Print', sort_order: 8 },
  { option_type: 'Pattern', option_value: 'Abstract', name: 'Abstract', sort_order: 9 },
  { option_type: 'Pattern', option_value: 'Paisley', name: 'Paisley', sort_order: 10 },
  
  // Storage options for electronics
  { option_type: 'Storage', option_value: '64GB', name: '64 GB', sort_order: 1 },
  { option_type: 'Storage', option_value: '128GB', name: '128 GB', sort_order: 2 },
  { option_type: 'Storage', option_value: '256GB', name: '256 GB', sort_order: 3 },
  { option_type: 'Storage', option_value: '512GB', name: '512 GB', sort_order: 4 },
  { option_type: 'Storage', option_value: '1TB', name: '1 TB', sort_order: 5 },
  { option_type: 'Storage', option_value: '2TB', name: '2 TB', sort_order: 6 },
  { option_type: 'Storage', option_value: '4TB', name: '4 TB', sort_order: 7 },
  
  // RAM options for computers
  { option_type: 'RAM', option_value: '4GB', name: '4 GB RAM', sort_order: 1 },
  { option_type: 'RAM', option_value: '8GB', name: '8 GB RAM', sort_order: 2 },
  { option_type: 'RAM', option_value: '16GB', name: '16 GB RAM', sort_order: 3 },
  { option_type: 'RAM', option_value: '32GB', name: '32 GB RAM', sort_order: 4 },
  { option_type: 'RAM', option_value: '64GB', name: '64 GB RAM', sort_order: 5 },
  
  // Screen size options
  { option_type: 'Screen Size', option_value: '11"', name: '11 inch', sort_order: 1 },
  { option_type: 'Screen Size', option_value: '13"', name: '13 inch', sort_order: 2 },
  { option_type: 'Screen Size', option_value: '15"', name: '15 inch', sort_order: 3 },
  { option_type: 'Screen Size', option_value: '17"', name: '17 inch', sort_order: 4 },
  { option_type: 'Screen Size', option_value: '21"', name: '21 inch', sort_order: 5 },
  { option_type: 'Screen Size', option_value: '24"', name: '24 inch', sort_order: 6 },
  { option_type: 'Screen Size', option_value: '27"', name: '27 inch', sort_order: 7 },
  
  // Material options
  { option_type: 'Material', option_value: 'Cotton', name: 'Cotton', sort_order: 1 },
  { option_type: 'Material', option_value: 'Polyester', name: 'Polyester', sort_order: 2 },
  { option_type: 'Material', option_value: 'Wool', name: 'Wool', sort_order: 3 },
  { option_type: 'Material', option_value: 'Leather', name: 'Leather', sort_order: 4 },
  { option_type: 'Material', option_value: 'Denim', name: 'Denim', sort_order: 5 },
  { option_type: 'Material', option_value: 'Silk', name: 'Silk', sort_order: 6 },
  { option_type: 'Material', option_value: 'Linen', name: 'Linen', sort_order: 7 },
  { option_type: 'Material', option_value: 'Canvas', name: 'Canvas', sort_order: 8 },
  { option_type: 'Material', option_value: 'Nylon', name: 'Nylon', sort_order: 9 },
  { option_type: 'Material', option_value: 'Spandex', name: 'Spandex', sort_order: 10 },
  
  // Connectivity options
  { option_type: 'Connectivity', option_value: 'Wired', name: 'Wired Connection', sort_order: 1 },
  { option_type: 'Connectivity', option_value: 'Wireless', name: 'Wireless', sort_order: 2 },
  { option_type: 'Connectivity', option_value: 'Bluetooth', name: 'Bluetooth', sort_order: 3 },
  { option_type: 'Connectivity', option_value: 'WiFi', name: 'WiFi', sort_order: 4 },
  { option_type: 'Connectivity', option_value: 'USB-C', name: 'USB-C', sort_order: 5 },
  { option_type: 'Connectivity', option_value: 'Lightning', name: 'Lightning', sort_order: 6 },
  
  // Style options
  { option_type: 'Style', option_value: 'Casual', name: 'Casual', sort_order: 1 },
  { option_type: 'Style', option_value: 'Formal', name: 'Formal', sort_order: 2 },
  { option_type: 'Style', option_value: 'Sport', name: 'Sport', sort_order: 3 },
  { option_type: 'Style', option_value: 'Business', name: 'Business', sort_order: 4 },
  { option_type: 'Style', option_value: 'Vintage', name: 'Vintage', sort_order: 5 },
  { option_type: 'Style', option_value: 'Modern', name: 'Modern', sort_order: 6 },
  { option_type: 'Style', option_value: 'Classic', name: 'Classic', sort_order: 7 },
  
  // Weight options
  { option_type: 'Weight', option_value: '100g', name: '100 grams', sort_order: 1 },
  { option_type: 'Weight', option_value: '250g', name: '250 grams', sort_order: 2 },
  { option_type: 'Weight', option_value: '500g', name: '500 grams', sort_order: 3 },
  { option_type: 'Weight', option_value: '1kg', name: '1 kilogram', sort_order: 4 },
  { option_type: 'Weight', option_value: '2kg', name: '2 kilograms', sort_order: 5 },
  { option_type: 'Weight', option_value: '5kg', name: '5 kilograms', sort_order: 6 },
  
  // Flavor options (for food/consumables)
  { option_type: 'Flavor', option_value: 'Vanilla', name: 'Vanilla', sort_order: 1 },
  { option_type: 'Flavor', option_value: 'Chocolate', name: 'Chocolate', sort_order: 2 },
  { option_type: 'Flavor', option_value: 'Strawberry', name: 'Strawberry', sort_order: 3 },
  { option_type: 'Flavor', option_value: 'Mint', name: 'Mint', sort_order: 4 },
  { option_type: 'Flavor', option_value: 'Coffee', name: 'Coffee', sort_order: 5 },
  { option_type: 'Flavor', option_value: 'Lemon', name: 'Lemon', sort_order: 6 },
  { option_type: 'Flavor', option_value: 'Orange', name: 'Orange', sort_order: 7 },
  
  // Voltage options (for electrical products)
  { option_type: 'Voltage', option_value: '110V', name: '110 Volts', sort_order: 1 },
  { option_type: 'Voltage', option_value: '220V', name: '220 Volts', sort_order: 2 },
  { option_type: 'Voltage', option_value: '240V', name: '240 Volts', sort_order: 3 },
  
  // Gender options
  { option_type: 'Gender', option_value: 'Unisex', name: 'Unisex', sort_order: 1 },
  { option_type: 'Gender', option_value: 'Men', name: 'Men\'s', sort_order: 2 },
  { option_type: 'Gender', option_value: 'Women', name: 'Women\'s', sort_order: 3 },
  { option_type: 'Gender', option_value: 'Kids', name: 'Kids', sort_order: 4 },
  { option_type: 'Gender', option_value: 'Baby', name: 'Baby', sort_order: 5 }
];

/**
 * Seed options
 */
const seed = async (OptionModel) => {
  try {
    console.log('   📝 Generating option data...');
    
    // Insert options one by one to trigger pre-save middleware for slug generation
    const insertedOptions = [];
    const skippedOptions = [];
    
    for (const optionItem of optionData) {
      try {
        // Check for duplicate option_type + option_value combination
        const existingOption = await OptionModel.findOne({ 
          option_type: optionItem.option_type, 
          option_value: optionItem.option_value 
        });
        
        if (existingOption) {
          skippedOptions.push(optionItem);
          console.log(`   ⚠️  Skipping duplicate: ${optionItem.option_type} - ${optionItem.option_value}`);
          continue;
        }
        
        const option = new OptionModel(optionItem);
        const savedOption = await option.save();
        insertedOptions.push(savedOption);
      } catch (error) {
        if (error.code === 11000) {
          skippedOptions.push(optionItem);
          console.log(`   ⚠️  Skipping duplicate: ${optionItem.option_type} - ${optionItem.option_value}`);
        } else {
          console.error(`   ❌ Failed to create option ${optionItem.option_type} - ${optionItem.option_value}:`, error.message);
        }
      }
    }
    
    // Group by option type for summary
    const optionTypes = {};
    insertedOptions.forEach(option => {
      if (!optionTypes[option.option_type]) {
        optionTypes[option.option_type] = 0;
      }
      optionTypes[option.option_type]++;
    });
    
    const summary = Object.entries(optionTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    
    return {
      count: insertedOptions.length,
      summary: `Created options for ${Object.keys(optionTypes).length} types (${summary}) - ${skippedOptions.length} duplicates skipped`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed options: ${error.message}`);
  }
};

/**
 * Clean options table
 */
const clean = async (OptionModel) => {
  try {
    const result = await OptionModel.deleteMany({});
    return {
      count: result.deletedCount,
      summary: `Removed ${result.deletedCount} options`
    };
  } catch (error) {
    throw new Error(`Failed to clean options: ${error.message}`);
  }
};

module.exports = {
  seed,
  clean
};
