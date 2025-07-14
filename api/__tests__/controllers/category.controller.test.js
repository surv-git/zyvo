/**
 * Category Controller Unit Tests
 * Comprehensive test suite for category.controller.js
 */

const categoryController = require('../../controllers/category.controller');
const Category = require('../../models/Category');
const userActivityLogger = require('../../loggers/userActivity.logger');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

// Mock the Category model, loggers, and validation
jest.mock('../../models/Category');
jest.mock('../../loggers/userActivity.logger');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');

describe('Category Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = global.mockReq();
    mockRes = global.mockRes();
    mockNext = global.mockNext();

    // Mock logger methods
    userActivityLogger.info = jest.fn();
    adminAuditLogger.info = jest.fn();
    adminAuditLogger.warn = jest.fn();

    // Mock validationResult to return no errors by default
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      image_url: 'https://example.com/electronics.jpg'
    };

    it('should create a new category successfully', async () => {
      mockReq.body = validCategoryData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockCategory = {
        _id: 'cat123',
        ...validCategoryData,
        slug: 'electronics',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'cat123',
          ...validCategoryData,
          slug: 'electronics',
          parent_category: null
        })
      };

      Category.mockImplementation(() => mockCategory);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(Category).toHaveBeenCalledWith({
        name: validCategoryData.name,
        description: validCategoryData.description,
        parent_category: null,
        image_url: validCategoryData.image_url
      });
      expect(mockCategory.save).toHaveBeenCalled();
      expect(mockCategory.populate).toHaveBeenCalledWith('parent_category', 'name slug');
      expect(adminAuditLogger.info).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        data: expect.any(Object)
      });
    });

    it('should create a subcategory with parent successfully', async () => {
      const parentId = 'parent123';
      const subcategoryData = {
        ...validCategoryData,
        name: 'Computers',
        parent_category: parentId
      };

      mockReq.body = subcategoryData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockParentCategory = {
        _id: parentId,
        name: 'Electronics',
        is_active: true
      };

      const mockCategory = {
        _id: 'cat456',
        ...subcategoryData,
        slug: 'computers',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'cat456',
          ...subcategoryData,
          slug: 'computers',
          parent_category: { _id: parentId, name: 'Electronics', slug: 'electronics' }
        })
      };

      Category.findById.mockResolvedValue(mockParentCategory);
      Category.mockImplementation(() => mockCategory);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(Category.findById).toHaveBeenCalledWith(parentId);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if parent category not found', async () => {
      const subcategoryData = {
        ...validCategoryData,
        parent_category: 'nonexistent'
      };

      mockReq.body = subcategoryData;
      mockReq.user = { id: 'admin123', role: 'admin' };

      Category.findById.mockResolvedValue(null);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Parent category not found'
      });
    });

    it('should return 400 if parent category is inactive', async () => {
      const parentId = 'parent123';
      const subcategoryData = {
        ...validCategoryData,
        parent_category: parentId
      };

      mockReq.body = subcategoryData;
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockParentCategory = {
        _id: parentId,
        name: 'Electronics',
        is_active: false
      };

      Category.findById.mockResolvedValue(mockParentCategory);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot create subcategory under inactive parent category'
      });
    });

    it('should handle duplicate category name error', async () => {
      mockReq.body = validCategoryData;
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockCategory = {
        save: jest.fn().mockRejectedValue({
          code: 11000,
          keyPattern: { name: 1 },
          message: 'Duplicate key error'
        })
      };

      Category.mockImplementation(() => mockCategory);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category name already exists'
      });
    });

    it('should call next with error for unexpected errors', async () => {
      mockReq.body = validCategoryData;
      mockReq.user = { id: 'admin123', role: 'admin' };

      const mockCategory = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Category.mockImplementation(() => mockCategory);

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 400 if validation fails', async () => {
      mockReq.body = { name: '' }; // Invalid data
      mockReq.user = { role: 'admin' };

      // Mock validation result to return errors
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { field: 'name', message: 'Name is required' }
        ])
      });

      await categoryController.createCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Name is required' }
        ]
      });
    });
  });

  describe('getAllCategories', () => {
    it('should return categories with default pagination', async () => {
      mockReq.query = {};
      mockReq.user = null; // Guest user

      const mockCategories = [
        { _id: 'cat1', name: 'Electronics', slug: 'electronics', is_active: true },
        { _id: 'cat2', name: 'Clothing', slug: 'clothing', is_active: true }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCategories)
      };

      Category.find.mockReturnValue(mockQuery);
      Category.countDocuments.mockResolvedValue(25);

      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      expect(Category.find).toHaveBeenCalledWith({ is_active: true });
      expect(userActivityLogger.info).toHaveBeenCalledWith('Categories list viewed', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Categories retrieved successfully',
        data: mockCategories,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 25,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    it('should apply search filter', async () => {
      mockReq.query = { search: 'electronics' };
      mockReq.user = null;

      const mockCategories = [
        { _id: 'cat1', name: 'Electronics', slug: 'electronics', is_active: true }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCategories)
      };

      Category.find.mockReturnValue(mockQuery);
      Category.countDocuments.mockResolvedValue(1);

      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      expect(Category.find).toHaveBeenCalledWith({
        is_active: true,
        $or: [
          { name: { $regex: 'electronics', $options: 'i' } },
          { description: { $regex: 'electronics', $options: 'i' } }
        ]
      });
    });

    it('should filter by parent_id', async () => {
      mockReq.query = { parent_id: 'parent123' };
      mockReq.user = null;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Category.find.mockReturnValue(mockQuery);
      Category.countDocuments.mockResolvedValue(0);

      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      expect(Category.find).toHaveBeenCalledWith({
        is_active: true,
        parent_category: 'parent123'
      });
    });

    it('should include inactive categories for admin users', async () => {
      mockReq.query = { include_inactive: 'true' };
      mockReq.user = { role: 'admin' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Category.find.mockReturnValue(mockQuery);
      Category.countDocuments.mockResolvedValue(0);

      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      expect(Category.find).toHaveBeenCalledWith({});
    });
  });

  describe('getCategoryTree', () => {
    it('should return category tree for public users', async () => {
      mockReq.query = {};
      mockReq.user = null;

      const mockTree = [
        {
          _id: 'cat1',
          name: 'Electronics',
          slug: 'electronics',
          children: [
            {
              _id: 'cat2',
              name: 'Computers',
              slug: 'computers',
              children: []
            }
          ]
        }
      ];

      Category.getCategoryTree = jest.fn().mockResolvedValue(mockTree);

      await categoryController.getCategoryTree(mockReq, mockRes, mockNext);

      expect(Category.getCategoryTree).toHaveBeenCalledWith(false);
      expect(userActivityLogger.info).toHaveBeenCalledWith('Category tree viewed', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category tree retrieved successfully',
        data: mockTree
      });
    });
  });

  describe('getCategoryStats', () => {
    it('should return category statistics for admin', async () => {
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      Category.countDocuments
        .mockResolvedValueOnce(50)  // total
        .mockResolvedValueOnce(45)  // active
        .mockResolvedValueOnce(5)   // inactive
        .mockResolvedValueOnce(8);  // root

      Category.aggregate.mockResolvedValue([{ count: 12 }]); // with children

      await categoryController.getCategoryStats(mockReq, mockRes, mockNext);

      expect(adminAuditLogger.info).toHaveBeenCalledWith('Category statistics viewed', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category statistics retrieved successfully',
        data: {
          totalCategories: 50,
          activeCategories: 45,
          inactiveCategories: 5,
          rootCategories: 8,
          categoriesWithChildren: 12,
          categoriesWithoutChildren: 33
        }
      });
    });
  });

  describe('getCategoryByIdOrSlug', () => {
    it('should return category by slug successfully', async () => {
      const categorySlug = 'electronics';
      mockReq.params = { identifier: categorySlug };
      mockReq.user = null;

      const mockCategory = {
        _id: 'cat123',
        name: 'Electronics',
        slug: 'electronics',
        is_active: true,
        toObject: jest.fn().mockReturnValue({
          _id: 'cat123',
          name: 'Electronics',
          slug: 'electronics',
          is_active: true
        }),
        getCategoryPath: jest.fn().mockResolvedValue([
          { name: 'Electronics', slug: 'electronics' }
        ])
      };

      const mockSubcategories = [
        { _id: 'sub1', name: 'Computers', slug: 'computers' }
      ];

      Category.findByIdOrSlug = jest.fn().mockResolvedValue(mockCategory);
      Category.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockSubcategories)
      });

      await categoryController.getCategoryByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Category.findByIdOrSlug).toHaveBeenCalledWith(categorySlug, false);
      expect(userActivityLogger.info).toHaveBeenCalledWith('Category viewed', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category retrieved successfully',
        data: expect.objectContaining({
          _id: 'cat123',
          name: 'Electronics',
          slug: 'electronics',
          is_active: true,
          categoryPath: expect.any(Array),
          subcategories: mockSubcategories
        })
      });
    });

    it('should return 404 if category not found', async () => {
      mockReq.params = { identifier: 'nonexistent' };
      mockReq.user = null;

      Category.findByIdOrSlug = jest.fn().mockResolvedValue(null);

      await categoryController.getCategoryByIdOrSlug(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });
  });

  describe('updateCategory', () => {
    const categoryId = 'cat123';
    const updateData = {
      name: 'Updated Electronics',
      description: 'Updated description',
      is_active: false
    };

    it('should update category successfully', async () => {
      mockReq.params = { id: categoryId };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const existingCategory = {
        _id: categoryId,
        name: 'Electronics',
        description: 'Old description',
        parent_category: null,
        image_url: null,
        is_active: true
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateData
      };

      Category.findById.mockResolvedValue(existingCategory);
      Category.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedCategory)
      });

      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      expect(Category.findById).toHaveBeenCalledWith(categoryId);
      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Category updated', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
    });

    it('should return 404 if category not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = updateData;
      mockReq.user = { role: 'admin' };

      Category.findById.mockResolvedValue(null);

      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });

    it('should prevent self-reference when updating parent', async () => {
      mockReq.params = { id: categoryId };
      mockReq.body = { parent_category: categoryId };
      mockReq.user = { role: 'admin' };

      const existingCategory = {
        _id: categoryId,
        name: 'Electronics'
      };

      Category.findById.mockResolvedValue(existingCategory);

      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category cannot be its own parent'
      });
    });

    it('should handle duplicate name error', async () => {
      mockReq.params = { id: categoryId };
      mockReq.body = { name: 'Duplicate Name' };
      mockReq.user = { role: 'admin' };

      const existingCategory = { _id: categoryId, name: 'Electronics' };
      
      const mockPopulateResult = {
        populate: jest.fn().mockRejectedValue({
          code: 11000,
          keyPattern: { name: 1 },
          message: 'Duplicate key error'
        })
      };

      Category.findById.mockResolvedValue(existingCategory);
      Category.findByIdAndUpdate.mockReturnValue(mockPopulateResult);

      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category name already exists'
      });
    });
  });

  describe('deleteCategory', () => {
    const categoryId = 'cat123';

    it('should perform soft delete by default', async () => {
      mockReq.params = { id: categoryId };
      mockReq.query = {};
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockCategory = {
        _id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        hasChildren: jest.fn().mockResolvedValue(false)
      };

      Category.findById.mockResolvedValue(mockCategory);
      Category.countDocuments.mockResolvedValue(0);
      Category.findByIdAndUpdate.mockResolvedValue({
        ...mockCategory,
        is_active: false
      });

      await categoryController.deleteCategory(mockReq, mockRes, mockNext);

      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        { is_active: false },
        { new: true }
      );
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Category soft deleted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should return 404 if category not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.query = {};
      mockReq.user = { role: 'admin' };

      Category.findById.mockResolvedValue(null);

      await categoryController.deleteCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });
  });

  describe('Error Handling', () => {
    it('should call next with error for database errors in getAllCategories', async () => {
      mockReq.query = {};
      mockReq.user = null;

      Category.find.mockImplementation(() => {
        throw new Error('Database connection error');
      });

      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with error for database errors in getCategoryByIdOrSlug', async () => {
      mockReq.params = { identifier: 'test' };
      mockReq.user = null;

      Category.findByIdOrSlug = jest.fn().mockRejectedValue(new Error('Database error'));

      await categoryController.getCategoryByIdOrSlug(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with error for database errors in getCategoryTree', async () => {
      mockReq.query = {};
      mockReq.user = null;

      Category.getCategoryTree = jest.fn().mockRejectedValue(new Error('Database error'));

      await categoryController.getCategoryTree(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with error for database errors in getCategoryStats', async () => {
      mockReq.user = { role: 'admin' };

      Category.countDocuments.mockRejectedValue(new Error('Database error'));

      await categoryController.getCategoryStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
