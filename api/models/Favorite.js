/**
 * Favorite Model
 * Mongoose schema for user favorites management
 * Allows users to curate a list of their preferred product variants
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // Core identification
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
    index: true
  },

  // Favorite details
  added_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  user_notes: {
    type: String,
    trim: true,
    maxlength: [500, 'User notes cannot exceed 500 characters'],
    default: null
  },

  // Soft deletion support
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate favorites per user
favoriteSchema.index(
  { user_id: 1, product_variant_id: 1 }, 
  { 
    unique: true,
    name: 'unique_user_product_variant_favorite'
  }
);

// Additional indexes for efficient querying
favoriteSchema.index({ user_id: 1, is_active: 1 });
favoriteSchema.index({ user_id: 1, added_at: -1 });
favoriteSchema.index({ product_variant_id: 1, is_active: 1 });

/**
 * Pre-save middleware
 */
favoriteSchema.pre('save', function(next) {
  // Update updatedAt timestamp
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  // Ensure added_at is set when reactivating a favorite
  if (this.isModified('is_active') && this.is_active && !this.added_at) {
    this.added_at = new Date();
  }

  next();
});

/**
 * Instance methods
 */

// Check if favorite belongs to a specific user
favoriteSchema.methods.belongsToUser = function(userId) {
  return this.user_id.toString() === userId.toString();
};

// Activate/reactivate favorite
favoriteSchema.methods.activate = function(userNotes = null) {
  this.is_active = true;
  this.added_at = new Date();
  if (userNotes !== null) {
    this.user_notes = userNotes;
  }
  return this.save();
};

// Deactivate favorite (soft delete)
favoriteSchema.methods.deactivate = function() {
  this.is_active = false;
  return this.save();
};

// Update user notes
favoriteSchema.methods.updateNotes = function(userNotes) {
  this.user_notes = userNotes;
  return this.save();
};

/**
 * Static methods
 */

// Find user's active favorites with pagination
favoriteSchema.statics.findUserFavorites = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'added_at',
    sortOrder = 'desc',
    includeInactive = false
  } = options;

  const query = { user_id: userId };
  if (!includeInactive) {
    query.is_active = true;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find(query)
    .populate({
      path: 'product_variant_id',
      select: 'sku_code price images name option_values is_active discount_details average_rating reviews_count',
      populate: {
        path: 'product_id',
        select: 'name description category_id brand_id'
      }
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count user's active favorites
favoriteSchema.statics.countUserFavorites = function(userId, includeInactive = false) {
  const query = { user_id: userId };
  if (!includeInactive) {
    query.is_active = true;
  }
  return this.countDocuments(query);
};

// Find existing favorite (active or inactive)
favoriteSchema.statics.findExistingFavorite = function(userId, productVariantId) {
  return this.findOne({
    user_id: userId,
    product_variant_id: productVariantId
  });
};

// Check if user has favorited a product variant
favoriteSchema.statics.isUserFavorite = async function(userId, productVariantId) {
  const favorite = await this.findOne({
    user_id: userId,
    product_variant_id: productVariantId,
    is_active: true
  });
  return !!favorite;
};

// Get most favorited product variants
favoriteSchema.statics.getMostFavorited = function(options = {}) {
  const { limit = 10, includeInactive = false } = options;
  
  const matchStage = includeInactive ? {} : { is_active: true };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$product_variant_id',
        favorite_count: { $sum: 1 },
        latest_added: { $max: '$added_at' }
      }
    },
    { $sort: { favorite_count: -1, latest_added: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'productvariants',
        localField: '_id',
        foreignField: '_id',
        as: 'product_variant'
      }
    },
    { $unwind: '$product_variant' },
    {
      $lookup: {
        from: 'products',
        localField: 'product_variant.product_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        favorite_count: 1,
        latest_added: 1,
        product_variant: {
          _id: '$product_variant._id',
          sku_code: '$product_variant.sku_code',
          price: '$product_variant.price',
          images: '$product_variant.images',
          name: '$product_variant.name',
          average_rating: '$product_variant.average_rating',
          reviews_count: '$product_variant.reviews_count'
        },
        product: {
          _id: '$product._id',
          name: '$product.name',
          description: '$product.description'
        }
      }
    }
  ]);
};

// Bulk operations for user favorites
favoriteSchema.statics.bulkAddFavorites = async function(userId, productVariantIds, userNotes = null) {
  const results = [];
  
  for (const productVariantId of productVariantIds) {
    try {
      const result = await this.addOrUpdateFavorite(userId, productVariantId, userNotes);
      results.push({ productVariantId, success: true, result });
    } catch (error) {
      results.push({ productVariantId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Add or update favorite (handles duplicates)
favoriteSchema.statics.addOrUpdateFavorite = async function(userId, productVariantId, userNotes = null) {
  try {
    // Try to create new favorite
    const newFavorite = new this({
      user_id: userId,
      product_variant_id: productVariantId,
      user_notes: userNotes
    });
    
    const savedFavorite = await newFavorite.save();
    return { favorite: savedFavorite, action: 'created' };
    
  } catch (error) {
    // Handle duplicate key error (E11000)
    if (error.code === 11000) {
      // Find existing favorite and update/reactivate it
      const existingFavorite = await this.findOne({
        user_id: userId,
        product_variant_id: productVariantId
      });
      
      if (existingFavorite) {
        if (!existingFavorite.is_active) {
          // Reactivate inactive favorite
          await existingFavorite.activate(userNotes);
          return { favorite: existingFavorite, action: 'reactivated' };
        } else {
          // Update existing active favorite
          if (userNotes !== null && userNotes !== existingFavorite.user_notes) {
            await existingFavorite.updateNotes(userNotes);
            return { favorite: existingFavorite, action: 'updated' };
          }
          return { favorite: existingFavorite, action: 'already_exists' };
        }
      }
    }
    throw error;
  }
};

// Remove user's favorite (soft delete)
favoriteSchema.statics.removeUserFavorite = async function(userId, productVariantId) {
  const favorite = await this.findOne({
    user_id: userId,
    product_variant_id: productVariantId,
    is_active: true
  });
  
  if (!favorite) {
    return null;
  }
  
  await favorite.deactivate();
  return favorite;
};

// Get user's favorite statistics
favoriteSchema.statics.getUserFavoriteStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_favorites: { $sum: 1 },
        active_favorites: {
          $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
        },
        inactive_favorites: {
          $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] }
        },
        oldest_favorite: { $min: '$added_at' },
        newest_favorite: { $max: '$added_at' }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    total_favorites: 0,
    active_favorites: 0,
    inactive_favorites: 0,
    oldest_favorite: null,
    newest_favorite: null
  };
};

/**
 * Virtual fields
 */
favoriteSchema.virtual('is_favorited').get(function() {
  return this.is_active;
});

favoriteSchema.virtual('days_since_added').get(function() {
  if (!this.added_at) return null;
  return Math.floor((Date.now() - this.added_at.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
favoriteSchema.set('toJSON', { virtuals: true });
favoriteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
