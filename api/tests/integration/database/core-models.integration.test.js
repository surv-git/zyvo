/**
 * Core Database Models Integration Tests
 * Tests basic model relationships and validations that are working
 */

const mongoose = require('mongoose');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const ProductVariant = require('../../../models/ProductVariant');
const Category = require('../../../models/Category');
const Option = require('../../../models/Option');
const Favorite = require('../../../models/Favorite');

describe('Core Database Models Integration Tests', () => {
  beforeEach(async () => {
    // Clean up all collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Category.deleteMany({});
    await Favorite.deleteMany({});
  });

  describe('User Model', () => {
    it('should create user with all required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        is_email_verified: true
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.is_email_verified).toBe(userData.is_email_verified);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890'
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create({
        ...userData,
        name: 'Jane Doe',
        phone: '+1234567891'
      })).rejects.toThrow();
    });
  });

  describe('Category Model', () => {
    it('should create category with required fields', async () => {
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      };

      const category = await Category.create(categoryData);

      expect(category._id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.description).toBe(categoryData.description);
      expect(category.is_active).toBe(categoryData.isActive);
    });

    it('should enforce unique name constraint', async () => {
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      };

      await Category.create(categoryData);

      // Try to create another category with same name
      await expect(Category.create({
        ...categoryData,
        slug: 'electronics-2'
      })).rejects.toThrow();
    });
  });

  describe('Product and Category Integration', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      });
    });

    it('should create product with valid category reference', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        category_id: testCategory._id,
        isActive: true
      };

      const product = await Product.create(productData);

      expect(product._id).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.category_id.toString()).toBe(testCategory._id.toString());
      expect(product.is_active).toBe(productData.isActive);
    });

    it('should populate category details in product', async () => {
      const product = await Product.create({
        name: 'Test Product',
        description: 'A test product',
        category_id: testCategory._id,
        isActive: true
      });

      const populatedProduct = await Product.findById(product._id)
        .populate('category_id');

      expect(populatedProduct.category_id.name).toBe(testCategory.name);
      expect(populatedProduct.category_id.slug).toBe(testCategory.slug);
    });
  });

  describe('ProductVariant and Product Integration', () => {
    let testCategory, testProduct;

    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      });

      testProduct = await Product.create({
        name: 'Test Product',
        description: 'A test product',
        category_id: testCategory._id,
        isActive: true
      });
    });

    it('should create product variant with valid product reference', async () => {
      const variantData = {
        product_id: testProduct._id,
        sku_code: 'TEST-SKU-001',
        price: 99.99,
        is_active: true
      };

      const variant = await ProductVariant.create(variantData);

      expect(variant._id).toBeDefined();
      // Handle auto-populated product_id field
      const productId = typeof variant.product_id === 'object' ? variant.product_id._id : variant.product_id;
      expect(productId.toString()).toBe(testProduct._id.toString());
      expect(variant.sku_code).toBe(variantData.sku_code);
      expect(variant.price).toBe(variantData.price);
      expect(variant.is_active).toBe(variantData.is_active);
    });

    it('should enforce unique SKU constraint', async () => {
      const variantData = {
        product_id: testProduct._id,
        sku_code: 'UNIQUE-SKU',
        price: 99.99,
        is_active: true
      };

      await ProductVariant.create(variantData);

      // Try to create another variant with same SKU
      await expect(ProductVariant.create({
        ...variantData,
        name: 'Another Variant'
      })).rejects.toThrow();
    });

    it('should validate price is positive', async () => {
      await expect(ProductVariant.create({
        product_id: testProduct._id,
        sku_code: 'TEST-SKU-001',
        price: -10, // Negative price
        is_active: true
      })).rejects.toThrow();
    });
  });

  describe('Favorite Model Integration', () => {
    let testUser, testCategory, testProduct, testVariant;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        isVerified: true
      });

      testCategory = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      });

      testProduct = await Product.create({
        name: 'Test Product',
        description: 'A test product',
        category_id: testCategory._id,
        is_active: true
      });

      testVariant = await ProductVariant.create({
        product_id: testProduct._id,
        sku_code: 'TEST-SKU-001',
        price: 99.99,
        is_active: true
      });
    });

    it('should create favorite with valid references', async () => {
      const favorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariant._id,
        user_notes: 'Great product!',
        is_active: true
      });

      expect(favorite._id).toBeDefined();
      expect(favorite.user_id.toString()).toBe(testUser._id.toString());
      expect(favorite.product_variant_id.toString()).toBe(testVariant._id.toString());
      expect(favorite.user_notes).toBe('Great product!');
      // is_active defaults to true in the model
      expect(favorite.is_active).toBe(true);
    });

    it('should enforce unique constraint for user-variant combination', async () => {
      await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariant._id,
        is_active: true
      });

      // Try to create duplicate favorite
      await expect(Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariant._id,
        is_active: true
      })).rejects.toThrow();
    });

    it('should populate user and product variant details', async () => {
      const favorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testVariant._id,
        is_active: true
      });

      const populatedFavorite = await Favorite.findById(favorite._id)
        .populate('user_id')
        .populate({
          path: 'product_variant_id',
          populate: {
            path: 'product_id',
            populate: {
              path: 'category_id'
            }
          }
        });

      expect(populatedFavorite.user_id.name).toBe(testUser.name);
      expect(populatedFavorite.product_variant_id.name).toBe(testVariant.name);
      expect(populatedFavorite.product_variant_id.product_id.name).toBe(testProduct.name);
      expect(populatedFavorite.product_variant_id.product_id.category_id.name).toBe(testCategory.name);
    });
  });

  describe('Complex Relationships', () => {
    let testUser, testCategory, testProducts, testVariants, testFavorites;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        phone: '+1234567890',
        isVerified: true
      });

      testCategory = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronics category',
        isActive: true
      });

      // Create multiple products and variants
      testProducts = [];
      testVariants = [];
      testFavorites = [];

      for (let i = 0; i < 3; i++) {
        const product = await Product.create({
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          category_id: testCategory._id,
          isActive: true
        });
        testProducts.push(product);

        const variant = await ProductVariant.create({
          product_id: product._id,
          sku_code: `SKU-${i}`,
          price: 50 + i * 25,
          is_active: true
        });
        testVariants.push(variant);

        const favorite = await Favorite.create({
          user_id: testUser._id,
          product_variant_id: variant._id,
          user_notes: `Notes for product ${i}`,
          is_active: true
        });
        testFavorites.push(favorite);
      }
    });

    it('should maintain referential integrity across models', async () => {
      // Verify all relationships exist
      expect(testFavorites).toHaveLength(3);
      
      for (let i = 0; i < 3; i++) {
        expect(testFavorites[i].user_id.toString()).toBe(testUser._id.toString());
        expect(testFavorites[i].product_variant_id.toString()).toBe(testVariants[i]._id.toString());
        
        // Handle auto-populated product_id field
        const productId = typeof testVariants[i].product_id === 'object' ? testVariants[i].product_id._id : testVariants[i].product_id;
        expect(productId.toString()).toBe(testProducts[i]._id.toString());
        
        expect(testProducts[i].category_id.toString()).toBe(testCategory._id.toString());
      }
    });

    it('should find all user favorites with full population', async () => {
      const userFavorites = await Favorite.find({ 
        user_id: testUser._id,
        is_active: true 
      }).populate({
        path: 'product_variant_id',
        populate: {
          path: 'product_id',
          populate: {
            path: 'category_id'
          }
        }
      });

      expect(userFavorites).toHaveLength(3);
      
      // Verify full population chain
      userFavorites.forEach((favorite, index) => {
        expect(favorite.product_variant_id.sku_code).toBe(`SKU-${index}`);
        expect(favorite.product_variant_id.product_id.name).toBe(`Product ${index}`);
        expect(favorite.product_variant_id.product_id.category_id.name).toBe('Electronics');
      });
    });

    it('should calculate user statistics', async () => {
      const userFavorites = await Favorite.find({ 
        user_id: testUser._id,
        is_active: true 
      }).populate('product_variant_id');

      const stats = {
        total_favorites: userFavorites.length,
        total_value: userFavorites.reduce((sum, f) => sum + f.product_variant_id.price, 0),
        average_price: 0
      };

      stats.average_price = stats.total_value / stats.total_favorites;

      expect(stats.total_favorites).toBe(3);
      expect(stats.total_value).toBe(225); // 50 + 75 + 100
      expect(stats.average_price).toBe(75);
    });
  });
});
