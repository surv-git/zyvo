/**
 * Test Database Utilities
 * Helper functions for database testing with proper cleanup
 */

const mongoose = require('mongoose');

/**
 * Connect to test database
 */
const connectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_test';
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

/**
 * Disconnect from test database
 */
const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/**
 * Clear all collections in test database
 */
const clearTestDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Get all collection names from the database
      const collectionNames = await mongoose.connection.db.listCollections().toArray();
      
      // Drop each collection individually
      for (const collectionInfo of collectionNames) {
        try {
          await mongoose.connection.db.collection(collectionInfo.name).deleteMany({});
        } catch (deleteError) {
          console.warn(`Failed to clear collection ${collectionInfo.name}:`, deleteError.message);
        }
      }
    }
  } catch (error) {
    console.error('Clear test DB error:', error);
  }
};

/**
 * Clear specific collection in test database
 */
const clearCollection = async (collectionName) => {
  const collection = mongoose.connection.collections[collectionName.toLowerCase()];
  if (collection) {
    await collection.deleteMany({});
  }
};

/**
 * Create test user
 */
const createTestUser = async (userData = {}) => {
  const User = require('../../models/User');
  
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    is_verified: true,
    verification_status: {
      email_verified: true,
      phone_verified: true
    }
  };
  
  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

/**
 * Create test admin user
 */
const createTestAdmin = async (userData = {}) => {
  const User = require('../../models/User');
  
  const defaultAdmin = {
    first_name: 'Test',
    last_name: 'Admin',
    email: 'admin@example.com',
    password: 'password123',
    phone_number: '1234567891',
    role: 'admin',
    is_verified: true,
    verification_status: {
      email_verified: true,
      phone_verified: true
    }
  };
  
  const admin = new User({ ...defaultAdmin, ...userData });
  await admin.save();
  return admin;
};

/**
 * Create test product variant
 */
const createTestProductVariant = async (variantData = {}) => {
  const ProductVariant = require('../../models/ProductVariant');
  const Product = require('../../models/Product');
  const Inventory = require('../../models/Inventory');
  
  // Create a test product first if not provided
  if (!variantData.product_id) {
    const product = new Product({
      name: 'Test Product',
      description: 'Test product description',
      brand_id: new mongoose.Types.ObjectId(),
      category_id: new mongoose.Types.ObjectId()
    });
    await product.save();
    variantData.product_id = product._id;
  }
  
  const defaultVariant = {
    sku_code: 'TEST-SKU-001',
    price: 100.00,  // Required field - changed from current_price
    stock_quantity: 50, // Add sufficient stock for tests
    option_values: []
  };
  
  const variant = new ProductVariant({ ...defaultVariant, ...variantData });
  await variant.save();
  
  // Create corresponding inventory record
  const inventory = new Inventory({
    product_variant_id: variant._id,
    stock_quantity: variantData.stock_quantity || 50
  });
  await inventory.save();
  
  return variant;
};

/**
 * Create test cart for user
 */
const createTestCart = async (userId, cartData = {}) => {
  const Cart = require('../../models/Cart');
  
  const defaultCart = {
    user_id: userId,
    cart_total_amount: 0,
    coupon_discount_amount: 0
  };
  
  const cart = new Cart({ ...defaultCart, ...cartData });
  await cart.save();
  return cart;
};

/**
 * Create test cart item
 */
const createTestCartItem = async (cartId, variantId, itemData = {}) => {
  const CartItem = require('../../models/CartItem');
  
  const defaultItem = {
    cart_id: cartId,
    product_variant_id: variantId,
    quantity: 1,
    price_at_addition: 100.00
  };
  
  const cartItem = new CartItem({ ...defaultItem, ...itemData });
  await cartItem.save();
  return cartItem;
};

/**
 * Mock authentication middleware for testing
 */
const mockAuthMiddleware = (user) => {
  return (req, res, next) => {
    req.user = user;
    next();
  };
};

/**
 * Generate mock request with user
 */
const mockReqWithUser = (user, overrides = {}) => {
  return {
    user: user,
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers: {},
    ...overrides
  };
};

/**
 * Generate mock response
 */
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Generate mock next function
 */
const mockNext = () => jest.fn();

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  clearCollection,
  createTestUser,
  createTestAdmin,
  createTestProductVariant,
  createTestCart,
  createTestCartItem,
  mockAuthMiddleware,
  mockReqWithUser,
  mockRes,
  mockNext
};
