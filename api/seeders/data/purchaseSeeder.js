/**
 * Purchase Data Seeder
 * Seeds the database with sample purchase records
 */

const mongoose = require('mongoose');

/**
 * Generate sample purchase data
 */
const generatePurchaseData = async () => {
  // We'll need to get existing product variants and suppliers
  const ProductVariant = mongoose.model('ProductVariant');
  const Supplier = mongoose.model('Supplier');
  
  // Get some existing product variants and suppliers to reference
  const productVariants = await ProductVariant.find().limit(20);
  const suppliers = await Supplier.find().limit(10);
  
  if (productVariants.length === 0) {
    throw new Error('No product variants found. Please seed product variants first.');
  }
  
  if (suppliers.length === 0) {
    throw new Error('No suppliers found. Please seed suppliers first.');
  }
  
  const purchases = [];
  const statuses = ['Planned', 'Pending', 'Completed', 'Cancelled', 'Partially Received'];
  
  // Generate 50 sample purchases
  for (let i = 0; i < 50; i++) {
    const productVariant = productVariants[Math.floor(Math.random() * productVariants.length)];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate random dates
    const purchaseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const expectedDeliveryDate = new Date(purchaseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // 0-30 days after purchase
    
    // Received date only if status is Completed or Partially Received
    let receivedDate = null;
    if (status === 'Completed' || status === 'Partially Received') {
      receivedDate = new Date(purchaseDate.getTime() + Math.random() * 35 * 24 * 60 * 60 * 1000);
    }
    
    const quantity = Math.floor(Math.random() * 100) + 1; // 1-100 units
    
    // Use simple values that definitely pass validation
    const unitPrice = Math.floor(Math.random() * 500) + 10; // $10-$509 (whole dollars)
    const packagingCost = Math.floor(Math.random() * 50); // $0-$49 (whole dollars)
    const shippingCost = Math.floor(Math.random() * 100); // $0-$99 (whole dollars)
    
    const landingPrice = (unitPrice * quantity) + packagingCost + shippingCost;
    
    const purchase = {
      product_variant_id: productVariant._id,
      supplier_id: supplier._id,
      purchase_order_number: `PO-${Date.now()}-${i.toString().padStart(3, '0')}`,
      purchase_date: purchaseDate,
      expected_delivery_date: expectedDeliveryDate,
      received_date: receivedDate,
      quantity: quantity,
      unit_price_at_purchase: unitPrice,
      packaging_cost: packagingCost,
      shipping_cost: shippingCost,
      landing_price: landingPrice,
      status: status,
      notes: generateRandomNotes(),
      inventory_updated_on_completion: status === 'Completed' ? Math.random() > 0.3 : false,
      is_active: Math.random() > 0.1, // 90% active
      createdAt: purchaseDate,
      updatedAt: receivedDate || purchaseDate
    };
    
    purchases.push(purchase);
  }
  
  return purchases;
};

/**
 * Generate random notes for purchases
 */
const generateRandomNotes = () => {
  const notes = [
    'Standard purchase order processed without issues',
    'Bulk discount applied - 10% off total order',
    'Express shipping requested due to stock shortage',
    'Quality check required upon delivery',
    'Seasonal inventory replenishment',
    'Emergency stock order - rush delivery',
    'First-time supplier - monitor quality closely',
    'Regular monthly restocking order',
    'Special promotion item - limited quantity',
    'Replacement for defective batch',
    null, // Some purchases have no notes
    null,
    null
  ];
  
  return notes[Math.floor(Math.random() * notes.length)];
};

/**
 * Seed purchase data
 */
const seed = async (Purchase) => {
  try {
    console.log('📦 Generating purchase data...');
    
    const purchaseData = await generatePurchaseData();
    
    console.log(`📦 Inserting ${purchaseData.length} purchase records...`);
    
    // Insert purchases in batches to handle large datasets
    const batchSize = 10;
    let inserted = 0;
    
    for (let i = 0; i < purchaseData.length; i += batchSize) {
      const batch = purchaseData.slice(i, i + batchSize);
      await Purchase.insertMany(batch);
      inserted += batch.length;
      console.log(`   Inserted ${inserted}/${purchaseData.length} purchases...`);
    }
    
    // Generate summary statistics
    const totalPurchases = await Purchase.countDocuments();
    const statusCounts = await Purchase.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const statusSummary = statusCounts.map(item => `${item._id}: ${item.count}`).join(', ');
    
    return {
      count: inserted,
      summary: `Total: ${totalPurchases} purchases (${statusSummary})`
    };
    
  } catch (error) {
    throw new Error(`Purchase seeding failed: ${error.message}`);
  }
};

module.exports = {
  seed,
  generatePurchaseData
};
