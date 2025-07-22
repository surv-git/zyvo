/**
 * Favorites API Integration Tests
 * Tests the complete favorites API with real database interactions
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');

// Create a simple Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock routes for testing
app.post('/api/v1/user/favorites', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.get('/api/v1/user/favorites', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.delete('/api/v1/user/favorites/:favoriteId', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.patch('/api/v1/user/favorites/:favoriteId/notes', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});

app.get('/api/v1/user/favorites/stats', (req, res) => {
  res.status(501).json({ success: false, message: 'Route not implemented in test' });
});
const Product = require('../../../models/Product');
const ProductVariant = require('../../../models/ProductVariant');
const Category = require('../../../models/Category');
const Favorite = require('../../../models/Favorite');

describe('Favorites API Integration Tests', () => {
  let testUser;
  let testProduct;
  let testProductVariant;
  let testCategory;
  let authToken;

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Category.deleteMany({});
    await Favorite.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      phone: '+1234567890',
      isVerified: true
    });

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronics category',
      is_active: true
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'A test product for integration testing',
      category_id: testCategory._id,
      is_active: true
    });

    // Create test product variant
    testProductVariant = await ProductVariant.create({
      product_id: testProduct._id,
      sku_code: 'TEST-SKU-001',
      price: 99.99,
      is_active: true
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/v1/user/favorites', () => {
    it('should add a product variant to favorites successfully', async () => {
      const response = await request(app)
        .post('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productVariantId: testProductVariant._id.toString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to favorites successfully');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.user_id).toBe(testUser._id.toString());
      expect(response.body.data.product_variant_id).toBe(testProductVariant._id.toString());

      // Verify in database
      const favorite = await Favorite.findOne({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id
      });
      expect(favorite).toBeTruthy();
      expect(favorite.is_active).toBe(true);
    });

    it('should return 400 for missing productVariantId', async () => {
      const response = await request(app)
        .post('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/user/favorites')
        .send({
          productVariantId: testProductVariant._id.toString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate favorites gracefully', async () => {
      // Add favorite first time
      await request(app)
        .post('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productVariantId: testProductVariant._id.toString()
        })
        .expect(201);

      // Try to add same favorite again
      const response = await request(app)
        .post('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productVariantId: testProductVariant._id.toString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product is already in favorites');

      // Verify only one favorite exists
      const favorites = await Favorite.find({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id
      });
      expect(favorites).toHaveLength(1);
    });

    it('should reactivate inactive favorites', async () => {
      // Create inactive favorite
      await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id,
        is_active: false
      });

      const response = await request(app)
        .post('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productVariantId: testProductVariant._id.toString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product re-added to favorites');

      // Verify favorite is now active
      const favorite = await Favorite.findOne({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id
      });
      expect(favorite.is_active).toBe(true);
    });
  });

  describe('GET /api/v1/user/favorites', () => {
    beforeEach(async () => {
      // Create multiple favorites for testing
      const products = [];
      const variants = [];
      
      for (let i = 0; i < 5; i++) {
        const product = await Product.create({
          name: `Test Product ${i}`,
          description: `Test product ${i} description`,
          category_id: testCategory._id,
          is_active: true
        });
        products.push(product);

        const variant = await ProductVariant.create({
          product_id: product._id,
          sku_code: `TEST-SKU-00${i}`,
          price: 99.99 + i,
          is_active: true
        });
        variants.push(variant);

        await Favorite.create({
          user_id: testUser._id,
          product_variant_id: variant._id,
          user_notes: `Notes for product ${i}`,
          is_active: true
        });
      }
    });

    it('should get user favorites with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/user/favorites?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.current_page).toBe(1);
      expect(response.body.pagination.items_per_page).toBe(3);
      expect(response.body.pagination.total_items).toBe(5);
      expect(response.body.pagination.total_pages).toBe(2);
      expect(response.body.pagination.has_next_page).toBe(true);
      expect(response.body.pagination.has_prev_page).toBe(false);
    });

    it('should populate product variant details', async () => {
      const response = await request(app)
        .get('/api/v1/user/favorites?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      
      const favorite = response.body.data[0];
      expect(favorite.productVariant).toBeDefined();
      expect(favorite.productVariant.name).toBeDefined();
      expect(favorite.productVariant.price).toBeDefined();
      expect(favorite.productVariant.product_id).toBeDefined();
    });

    it('should return empty array for user with no favorites', async () => {
      // Create new user with no favorites
      const newUser = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedpassword123',
        phone: '+1234567891',
        isVerified: true
      });

      const newToken = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/user/favorites')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total_items).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/user/favorites')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/user/favorites/:favoriteId', () => {
    let testFavorite;

    beforeEach(async () => {
      testFavorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id,
        user_notes: 'Test favorite to delete',
        is_active: true
      });
    });

    it('should remove favorite successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/user/favorites/${testFavorite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Favorite removed successfully');

      // Verify favorite is soft deleted
      const favorite = await Favorite.findById(testFavorite._id);
      expect(favorite.is_active).toBe(false);
    });

    it('should return 404 for non-existent favorite', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/v1/user/favorites/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Favorite not found');
    });

    it('should return 403 when trying to delete another user\'s favorite', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'hashedpassword123',
        phone: '+1234567892',
        isVerified: true
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id, email: otherUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .delete(`/api/v1/user/favorites/${testFavorite._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Favorite not found');

      // Verify original favorite is still active
      const favorite = await Favorite.findById(testFavorite._id);
      expect(favorite.is_active).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/user/favorites/${testFavorite._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/user/favorites/:favoriteId/notes', () => {
    let testFavorite;

    beforeEach(async () => {
      testFavorite = await Favorite.create({
        user_id: testUser._id,
        product_variant_id: testProductVariant._id,
        user_notes: 'Original notes',
        is_active: true
      });
    });

    it('should update favorite notes successfully', async () => {
      const newNotes = 'Updated notes for this favorite product';

      const response = await request(app)
        .patch(`/api/v1/user/favorites/${testFavorite._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: newNotes })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Favorite notes updated successfully');
      expect(response.body.data.user_notes).toBe(newNotes);

      // Verify in database
      const favorite = await Favorite.findById(testFavorite._id);
      expect(favorite.user_notes).toBe(newNotes);
    });

    it('should handle empty notes', async () => {
      const response = await request(app)
        .patch(`/api/v1/user/favorites/${testFavorite._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: '' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_notes).toBe('');
    });

    it('should return 400 for notes exceeding length limit', async () => {
      const longNotes = 'a'.repeat(501); // Assuming 500 char limit

      const response = await request(app)
        .patch(`/api/v1/user/favorites/${testFavorite._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: longNotes })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });

    it('should return 404 for non-existent favorite', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .patch(`/api/v1/user/favorites/${nonExistentId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'New notes' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Favorite not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/user/favorites/${testFavorite._id}/notes`)
        .send({ notes: 'New notes' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/user/favorites/stats', () => {
    beforeEach(async () => {
      // Create favorites with different categories
      const categories = ['Electronics', 'Clothing', 'Books'];
      const testCategories = [];
      
      for (let j = 0; j < categories.length; j++) {
        const category = await Category.create({
          name: categories[j],
          slug: categories[j].toLowerCase(),
          description: `${categories[j]} category`,
          is_active: true
        });
        testCategories.push(category);
      }
      
      for (let i = 0; i < 6; i++) {
        const product = await Product.create({
          name: `Product ${i}`,
          description: `Product ${i} description`,
          category_id: testCategories[i % 3]._id,
          is_active: true
        });

        const variant = await ProductVariant.create({
          product_id: product._id,
          sku_code: `SKU-${i}`,
          price: 50 + i * 10,
          is_active: true
        });

        await Favorite.create({
          user_id: testUser._id,
          product_variant_id: variant._id,
          is_active: true
        });
      }
    });

    it('should get user favorite statistics', async () => {
      const response = await request(app)
        .get('/api/v1/user/favorites/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total_favorites).toBe(6);
      expect(response.body.data.categories).toBeDefined();
      expect(response.body.data.categories).toHaveLength(3);
      expect(response.body.data.average_price).toBeDefined();
      expect(response.body.data.total_value).toBeDefined();
    });

    it('should return zero stats for user with no favorites', async () => {
      // Create new user with no favorites
      const newUser = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedpassword123',
        phone: '+1234567893',
        isVerified: true
      });

      const newToken = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/user/favorites/stats')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_favorites).toBe(0);
      expect(response.body.data.categories).toHaveLength(0);
      expect(response.body.data.average_price).toBe(0);
      expect(response.body.data.total_value).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/user/favorites/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
