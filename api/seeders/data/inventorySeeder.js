/**
 * Inventory Seeder
 * Seeds inventory records for existing product variants
 * Creates realistic stock levels based on product categories and characteristics
 */

/**
 * Generate random stock quantity based on product category and price
 */
const generateStockQuantity = (category, price) => {
  // Base stock ranges by category type
  const stockRanges = {
    'Electronics': { min: 15, max: 150 },
    'Fashion': { min: 25, max: 200 },
    'Books': { min: 50, max: 300 },
    'Sports': { min: 20, max: 180 },
    'Home & Garden': { min: 10, max: 120 },
    'Beauty': { min: 30, max: 250 },
    'Toys': { min: 40, max: 200 },
    'Automotive': { min: 5, max: 50 },
    'Health': { min: 25, max: 150 },
    'Default': { min: 20, max: 150 }
  };

  const range = stockRanges[category] || stockRanges['Default'];
  
  // Adjust stock based on price - higher priced items typically have lower stock
  let adjustedRange = { ...range };
  if (price > 500) {
    adjustedRange.min = Math.max(1, Math.floor(range.min * 0.3));
    adjustedRange.max = Math.floor(range.max * 0.4);
  } else if (price > 100) {
    adjustedRange.min = Math.floor(range.min * 0.7);
    adjustedRange.max = Math.floor(range.max * 0.7);
  }
  
  return Math.floor(Math.random() * (adjustedRange.max - adjustedRange.min + 1)) + adjustedRange.min;
};

/**
 * Generate minimum stock level (typically 10-25% of current stock)
 */
const generateMinStockLevel = (currentStock) => {
  const percentage = 0.1 + Math.random() * 0.15; // 10-25%
  return Math.max(1, Math.floor(currentStock * percentage));
};

/**
 * Generate random warehouse location
 */
const generateLocation = () => {
  const warehouses = ['A', 'B', 'C', 'D'];
  const sections = ['1', '2', '3', '4', '5'];
  const shelves = ['A', 'B', 'C', 'D', 'E', 'F'];
  const levels = ['1', '2', '3', '4'];
  
  const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
  const section = sections[Math.floor(Math.random() * sections.length)];
  const shelf = shelves[Math.floor(Math.random() * shelves.length)];
  const level = levels[Math.floor(Math.random() * levels.length)];
  
  return `WH-${warehouse}-${section}${shelf}${level}`;
};

/**
 * Generate random restock date (within last 6 months)
 */
const generateRestockDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

/**
 * Generate random sold date (within last 3 months, 70% chance of having been sold)
 */
const generateSoldDate = () => {
  if (Math.random() > 0.7) return null; // 30% chance of never being sold
  
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (3 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
};

/**
 * Generate inventory notes based on stock level and product characteristics
 */
const generateNotes = (stockQuantity, minStockLevel, productName) => {
  const notes = [];
  
  if (stockQuantity <= minStockLevel) {
    notes.push('LOW STOCK - Reorder needed');
  }
  
  if (stockQuantity > 200) {
    notes.push('High inventory - Monitor for slow movement');
  }
  
  if (productName.toLowerCase().includes('seasonal')) {
    notes.push('Seasonal item - Adjust stock based on demand cycles');
  }
  
  if (Math.random() < 0.2) { // 20% chance of special notes
    const specialNotes = [
      'Fast-moving item',
      'Bulk discount available',
      'Premium storage required',
      'Temperature controlled storage',
      'Fragile - handle with care',
      'Popular item - high turnover',
      'New arrival',
      'Customer favorite',
      'Limited edition'
    ];
    notes.push(specialNotes[Math.floor(Math.random() * specialNotes.length)]);
  }
  
  return notes.length > 0 ? notes.join('; ') : null;
};

/**
 * Seed inventory data
 */
const seed = async (InventoryModel) => {
  try {
    // Get reference models
    const ProductVariant = require('../../models/ProductVariant');
    const Product = require('../../models/Product');
    const Category = require('../../models/Category');
    
    // Get all product variants with their product and category information
    const productVariants = await ProductVariant.find({})
      .populate({
        path: 'product_id',
        populate: {
          path: 'category_id',
          select: 'name'
        }
      })
      .select('_id product_id sku_code price');
    
    console.log(`📦 Found ${productVariants.length} product variants to create inventory for`);
    
    if (productVariants.length === 0) {
      throw new Error('Product variants must be seeded before inventory. Please run: node seeders/seeder.js seed productVariants');
    }
    
    const inventoryRecords = [];
    
    for (const variant of productVariants) {
      if (!variant.product_id || !variant.product_id.category_id) {
        console.warn(`⚠️ Skipping variant ${variant.sku_code} - missing product or category data`);
        continue;
      }
      
      const categoryName = variant.product_id.category_id.name;
      const productName = variant.product_id.name;
      const price = variant.price || 0;
      
      // Generate stock quantity
      const stockQuantity = generateStockQuantity(categoryName, price);
      const minStockLevel = generateMinStockLevel(stockQuantity);
      
      // Generate dates
      const lastRestockDate = generateRestockDate();
      const lastSoldDate = generateSoldDate();
      
      // Generate location and notes
      const location = generateLocation();
      const notes = generateNotes(stockQuantity, minStockLevel, productName);
      
      const inventoryRecord = {
        product_variant_id: variant._id,
        stock_quantity: stockQuantity,
        last_restock_date: lastRestockDate,
        last_sold_date: lastSoldDate,
        min_stock_level: minStockLevel,
        location: location,
        notes: notes,
        is_active: true
      };
      
      inventoryRecords.push(inventoryRecord);
    }
    
    console.log(`🏭 Creating ${inventoryRecords.length} inventory records...`);
    
    // Insert inventory records in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < inventoryRecords.length; i += batchSize) {
      const batch = inventoryRecords.slice(i, i + batchSize);
      await InventoryModel.insertMany(batch);
      insertedCount += batch.length;
      console.log(`📊 Inserted ${insertedCount}/${inventoryRecords.length} inventory records`);
    }
    
    // Generate summary statistics
    const totalStock = inventoryRecords.reduce((sum, record) => sum + record.stock_quantity, 0);
    const averageStock = Math.round(totalStock / inventoryRecords.length);
    const lowStockCount = inventoryRecords.filter(record => 
      record.stock_quantity <= record.min_stock_level
    ).length;
    
    console.log(`
📊 Inventory Seeding Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total inventory records created: ${inventoryRecords.length}
📦 Total stock across all variants: ${totalStock.toLocaleString()} units
📊 Average stock per variant: ${averageStock} units
⚠️  Low stock items (at or below min level): ${lowStockCount}
🏭 Warehouse locations assigned: ${new Set(inventoryRecords.map(r => r.location)).size} unique locations
📅 Restock dates: Last 6 months
🛒 Sale dates: Last 3 months (70% of items have sales history)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    return {
      totalRecords: inventoryRecords.length,
      totalStock,
      averageStock,
      lowStockCount
    };
    
  } catch (error) {
    console.error('❌ Error seeding inventory:', error.message);
    throw error;
  }
};

/**
 * Clean inventory data
 */
const clean = async (InventoryModel) => {
  try {
    const result = await InventoryModel.deleteMany({});
    console.log(`🧹 Cleaned ${result.deletedCount} inventory records`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning inventory:', error.message);
    throw error;
  }
};

module.exports = {
  seed,
  clean
};
