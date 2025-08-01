const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017'; // Update with your MongoDB URI
const DB_NAME = 'zyvo'; // Update with your database name

// Unsplash image collections for different product categories
const UNSPLASH_IMAGES = {
  // Electronics & Tech
  iphone: [
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&h=800&fit=crop',
  ],
  macbook: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&h=800&fit=crop',
  ],
  ipad: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=800&h=800&fit=crop',
  ],
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&h=800&fit=crop',
  ],
  tv: [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
  ],
  playstation: [
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1564052387807-75f719b8cda9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop',
  ],
  
  // Fashion & Clothing
  shoes: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
  ],
  hoodie: [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop',
  ],
  blazer: [
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598984267641-d9c0ee33f94c?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=800&fit=crop',
  ],
  
  // Furniture & Home
  bed: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
  ],
  
  // Default fallback images
  default: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
  ]
};

// Function to get relevant images based on product name and category
function getProductImages(productName, categoryName, variantIndex = 0) {
  const name = productName.toLowerCase();
  const category = categoryName?.toLowerCase() || '';
  
  let imageSet;
  
  // Match product type
  if (name.includes('iphone')) {
    imageSet = UNSPLASH_IMAGES.iphone;
  } else if (name.includes('macbook')) {
    imageSet = UNSPLASH_IMAGES.macbook;
  } else if (name.includes('ipad')) {
    imageSet = UNSPLASH_IMAGES.ipad;
  } else if (name.includes('headphones') || name.includes('sony wh')) {
    imageSet = UNSPLASH_IMAGES.headphones;
  } else if (name.includes('tv') || name.includes('oled') || name.includes('qled') || name.includes('samsung') || name.includes('lg')) {
    imageSet = UNSPLASH_IMAGES.tv;
  } else if (name.includes('playstation') || name.includes('ps5')) {
    imageSet = UNSPLASH_IMAGES.playstation;
  } else if (name.includes('ultraboost') || name.includes('shoes') || name.includes('adidas')) {
    imageSet = UNSPLASH_IMAGES.shoes;
  } else if (name.includes('hoodie') || name.includes('h&m')) {
    imageSet = UNSPLASH_IMAGES.hoodie;
  } else if (name.includes('blazer') || name.includes('zara')) {
    imageSet = UNSPLASH_IMAGES.blazer;
  } else if (name.includes('bed') || name.includes('malm') || name.includes('ikea')) {
    imageSet = UNSPLASH_IMAGES.bed;
  } else {
    imageSet = UNSPLASH_IMAGES.default;
  }
  
  // Return 3-5 images for variety, starting from different positions for variants
  const startIndex = variantIndex % imageSet.length;
  const imageCount = 3 + (variantIndex % 3); // 3-5 images
  const selectedImages = [];
  
  for (let i = 0; i < imageCount; i++) {
    selectedImages.push(imageSet[(startIndex + i) % imageSet.length]);
  }
  
  return selectedImages;
}

async function seedProductVariantImages() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    const variantsCollection = db.collection('productvariants');
    
    // Get all product variants with their product information
    const variants = await variantsCollection.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).toArray();
    
    console.log(`📦 Found ${variants.length} product variants to update`);
    
    let updatedCount = 0;
    
    for (const [index, variant] of variants.entries()) {
      const productName = variant.product.name;
      const categoryName = variant.category?.name || '';
      
      // Get appropriate images for this product variant
      const images = getProductImages(productName, categoryName, index);
      
      // Update the variant with new images
      await variantsCollection.updateOne(
        { _id: variant._id },
        { 
          $set: { 
            images: images,
            updatedAt: new Date()
          } 
        }
      );
      
      updatedCount++;
      console.log(`✅ Updated variant ${updatedCount}/${variants.length}: ${productName} (${variant.sku_code})`);
      console.log(`   📸 Added ${images.length} images`);
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} product variants with Unsplash images!`);
    
  } catch (error) {
    console.error('❌ Error seeding product variant images:', error);
  } finally {
    await client.close();
    console.log('🔐 Disconnected from MongoDB');
  }
}

// Run the seeding script
if (require.main === module) {
  seedProductVariantImages();
}

module.exports = { seedProductVariantImages };
