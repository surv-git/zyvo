/**
 * Category Model
 * Mongoose schema and model for e-commerce categories with hierarchical support
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image_url: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, 'Please provide a valid image URL'],
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent_category: 1 });
categorySchema.index({ is_active: 1 });
categorySchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual field to get subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent_category'
});

/**
 * Generate unique slug from name
 * @param {string} name - Category name
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {string} - Unique slug
 */
categorySchema.statics.generateUniqueSlug = async function(name, excludeId = null) {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCategory = await this.findOne(query);
    if (!existingCategory) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

/**
 * Pre-validate middleware to generate slug before validation
 * Automatically generates slug from name before validation runs
 */
categorySchema.pre('validate', async function(next) {
  try {
    // Only generate slug if name exists and (name is modified or this is a new document, or if slug is missing)
    if (this.name && (this.isModified('name') || this.isNew || !this.slug)) {
      this.slug = await this.constructor.generateUniqueSlug(
        this.name, 
        this.isNew ? null : this._id
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-save middleware to generate slug
 * Automatically generates slug from name before saving
 */
categorySchema.pre('save', async function(next) {
  try {
    // Ensure slug exists before saving
    if (!this.slug && this.name) {
      this.slug = await this.constructor.generateUniqueSlug(
        this.name, 
        this.isNew ? null : this._id
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-update middleware to generate slug on name updates
 */
categorySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function(next) {
  try {
    const update = this.getUpdate();
    
    // Check if name is being updated
    if (update.name || (update.$set && update.$set.name)) {
      const newName = update.name || update.$set.name;
      const docId = this.getQuery()._id;
      
      const newSlug = await this.model.generateUniqueSlug(newName, docId);
      
      if (update.$set) {
        update.$set.slug = newSlug;
      } else {
        update.slug = newSlug;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to check if category has children
 * @returns {Promise<boolean>} - True if category has subcategories
 */
categorySchema.methods.hasChildren = async function() {
  const childCount = await this.constructor.countDocuments({
    parent_category: this._id,
    is_active: true
  });
  return childCount > 0;
};

/**
 * Instance method to get category path (breadcrumb)
 * @returns {Promise<Array>} - Array of category objects from root to current
 */
categorySchema.methods.getCategoryPath = async function() {
  const path = [];
  let currentCategory = this;

  while (currentCategory) {
    path.unshift({
      _id: currentCategory._id,
      name: currentCategory.name,
      slug: currentCategory.slug
    });

    if (currentCategory.parent_category) {
      currentCategory = await this.constructor.findById(currentCategory.parent_category);
    } else {
      currentCategory = null;
    }
  }

  return path;
};

/**
 * Static method to get category tree
 * @param {boolean} includeInactive - Include inactive categories
 * @returns {Promise<Array>} - Hierarchical category tree
 */
categorySchema.statics.getCategoryTree = async function(includeInactive = false) {
  const filter = includeInactive ? {} : { is_active: true };
  
  const categories = await this.find(filter)
    .populate('parent_category', 'name slug')
    .sort({ name: 1 })
    .lean();

  // Create a map for quick lookup
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map and identify root categories
  categories.forEach(category => {
    categoryMap.set(category._id.toString(), { ...category, children: [] });
    
    if (!category.parent_category) {
      rootCategories.push(category._id.toString());
    }
  });

  // Second pass: build the tree structure
  categories.forEach(category => {
    if (category.parent_category) {
      const parentId = category.parent_category._id.toString();
      const parent = categoryMap.get(parentId);
      
      if (parent) {
        parent.children.push(categoryMap.get(category._id.toString()));
      }
    }
  });

  // Return only root categories with their children
  return rootCategories.map(id => categoryMap.get(id));
};

/**
 * Static method to find by ID or slug
 * @param {string} identifier - Category ID or slug
 * @param {boolean} includeInactive - Include inactive categories
 * @returns {Promise<Object|null>} - Category document or null
 */
categorySchema.statics.findByIdOrSlug = async function(identifier, includeInactive = false) {
  const filter = includeInactive ? {} : { is_active: true };

  // Try to find by ID first
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const category = await this.findOne({ _id: identifier, ...filter })
      .populate('parent_category', 'name slug');
    if (category) return category;
  }

  // If not found by ID, try by slug
  return await this.findOne({ slug: identifier, ...filter })
    .populate('parent_category', 'name slug');
};

/**
 * Validation: Prevent circular parent references
 */
categorySchema.pre('save', async function(next) {
  try {
    if (this.parent_category && this.parent_category.toString() === this._id.toString()) {
      throw new Error('Category cannot be its own parent');
    }

    // Check for circular references in the hierarchy
    if (this.parent_category) {
      let currentParent = await this.constructor.findById(this.parent_category);
      const visited = new Set([this._id.toString()]);

      while (currentParent) {
        if (visited.has(currentParent._id.toString())) {
          throw new Error('Circular parent reference detected');
        }
        
        visited.add(currentParent._id.toString());
        
        if (currentParent.parent_category) {
          currentParent = await this.constructor.findById(currentParent.parent_category);
        } else {
          break;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema);
