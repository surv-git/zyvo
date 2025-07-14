/**
 * Option Seeder
 * Seeds sample options (types and values) for product variants
 */

const optionData = [
  // Color options
  { option_type: 'Color', option_value: 'Red', name: 'Red', slug: 'color-red', sort_order: 1 },
  { option_type: 'Color', option_value: 'Blue', name: 'Blue', slug: 'color-blue', sort_order: 2 },
  { option_type: 'Color', option_value: 'Black', name: 'Black', slug: 'color-black', sort_order: 3 },
  { option_type: 'Color', option_value: 'White', name: 'White', slug: 'color-white', sort_order: 4 },
  { option_type: 'Color', option_value: 'Green', name: 'Green', slug: 'color-green', sort_order: 5 },
  { option_type: 'Color', option_value: 'Silver', name: 'Silver', slug: 'color-silver', sort_order: 6 },
  { option_type: 'Color', option_value: 'Gold', name: 'Gold', slug: 'color-gold', sort_order: 7 },
  
  // Size options
  { option_type: 'Size', option_value: 'XS', name: 'Extra Small', slug: 'size-xs', sort_order: 1 },
  { option_type: 'Size', option_value: 'S', name: 'Small', slug: 'size-s', sort_order: 2 },
  { option_type: 'Size', option_value: 'M', name: 'Medium', slug: 'size-m', sort_order: 3 },
  { option_type: 'Size', option_value: 'L', name: 'Large', slug: 'size-l', sort_order: 4 },
  { option_type: 'Size', option_value: 'XL', name: 'Extra Large', slug: 'size-xl', sort_order: 5 },
  { option_type: 'Size', option_value: 'XXL', name: 'Double Extra Large', slug: 'size-xxl', sort_order: 6 },
  
  // Storage options for electronics
  { option_type: 'Storage', option_value: '128GB', name: '128 GB', slug: 'storage-128gb', sort_order: 1 },
  { option_type: 'Storage', option_value: '256GB', name: '256 GB', slug: 'storage-256gb', sort_order: 2 },
  { option_type: 'Storage', option_value: '512GB', name: '512 GB', slug: 'storage-512gb', sort_order: 3 },
  { option_type: 'Storage', option_value: '1TB', name: '1 TB', slug: 'storage-1tb', sort_order: 4 },
  { option_type: 'Storage', option_value: '2TB', name: '2 TB', slug: 'storage-2tb', sort_order: 5 },
  
  // RAM options for computers
  { option_type: 'RAM', option_value: '8GB', name: '8 GB RAM', slug: 'ram-8gb', sort_order: 1 },
  { option_type: 'RAM', option_value: '16GB', name: '16 GB RAM', slug: 'ram-16gb', sort_order: 2 },
  { option_type: 'RAM', option_value: '32GB', name: '32 GB RAM', slug: 'ram-32gb', sort_order: 3 },
  { option_type: 'RAM', option_value: '64GB', name: '64 GB RAM', slug: 'ram-64gb', sort_order: 4 },
  
  // Screen size options
  { option_type: 'Screen Size', option_value: '13"', name: '13 inch', slug: 'screen-13-inch', sort_order: 1 },
  { option_type: 'Screen Size', option_value: '15"', name: '15 inch', slug: 'screen-15-inch', sort_order: 2 },
  { option_type: 'Screen Size', option_value: '17"', name: '17 inch', slug: 'screen-17-inch', sort_order: 3 },
  
  // Material options
  { option_type: 'Material', option_value: 'Cotton', name: 'Cotton', slug: 'material-cotton', sort_order: 1 },
  { option_type: 'Material', option_value: 'Polyester', name: 'Polyester', slug: 'material-polyester', sort_order: 2 },
  { option_type: 'Material', option_value: 'Wool', name: 'Wool', slug: 'material-wool', sort_order: 3 },
  { option_type: 'Material', option_value: 'Leather', name: 'Leather', slug: 'material-leather', sort_order: 4 },
  { option_type: 'Material', option_value: 'Denim', name: 'Denim', slug: 'material-denim', sort_order: 5 },
  
  // Connectivity options
  { option_type: 'Connectivity', option_value: 'Wired', name: 'Wired Connection', slug: 'connectivity-wired', sort_order: 1 },
  { option_type: 'Connectivity', option_value: 'Wireless', name: 'Wireless', slug: 'connectivity-wireless', sort_order: 2 },
  { option_type: 'Connectivity', option_value: 'Bluetooth', name: 'Bluetooth', slug: 'connectivity-bluetooth', sort_order: 3 },
  
  // Style options
  { option_type: 'Style', option_value: 'Casual', name: 'Casual', slug: 'style-casual', sort_order: 1 },
  { option_type: 'Style', option_value: 'Formal', name: 'Formal', slug: 'style-formal', sort_order: 2 },
  { option_type: 'Style', option_value: 'Sport', name: 'Sport', slug: 'style-sport', sort_order: 3 },
  { option_type: 'Style', option_value: 'Business', name: 'Business', slug: 'style-business', sort_order: 4 }
];

/**
 * Seed options
 */
const seed = async (OptionModel) => {
  try {
    const createdOptions = await OptionModel.insertMany(optionData);
    
    // Group by option type for summary
    const optionTypes = {};
    createdOptions.forEach(option => {
      if (!optionTypes[option.option_type]) {
        optionTypes[option.option_type] = 0;
      }
      optionTypes[option.option_type]++;
    });
    
    const summary = Object.entries(optionTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    
    return {
      count: createdOptions.length,
      summary: `Created options for ${Object.keys(optionTypes).length} types (${summary})`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed options: ${error.message}`);
  }
};

module.exports = {
  seed
};
