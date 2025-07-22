/**
 * Real Category Controller Tests
 * Tests actual controller functions with proper mocking
 */

const categoryController = require('../../../controllers/category.controller');
const Category = require('../../../models/Category');

// Mock dependencies
jest.mock('../../../models/Category');

describe('Category Controller - Real Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('getAllCategories', () => {
    it('should get all categories successfully', async () => {
      // Arrange
      const mockCategories = [
        {
          _id: 'cat1',
          name: 'Electronics',
          slug: 'electronics',
          is_active: true,
          parent_category_id: null
        },
        {
          _id: 'cat2',
          name: 'Clothing',
          slug: 'clothing',
          is_active: true,
          parent_category_id: null
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories)
      };

      Category.find.mockReturnValue(mockQuery);

      // Act
      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.find).toHaveBeenCalledWith({ is_active: true });
      expect(mockQuery.populate).toHaveBeenCalledWith('parent_category_id', 'name slug');
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategories
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      Category.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await categoryController.getAllCategories(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCategoryById', () => {
    it('should get category by id successfully', async () => {
      // Arrange
      mockReq.params = { id: 'cat123' };

      const mockCategory = {
        _id: 'cat123',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        is_active: true,
        parent_category_id: null
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategory)
      };

      Category.findById.mockReturnValue(mockQuery);

      // Act
      await categoryController.getCategoryById(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findById).toHaveBeenCalledWith('cat123');
      expect(mockQuery.populate).toHaveBeenCalledWith('parent_category_id', 'name slug description');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategory
        })
      );
    });

    it('should return error if category not found', async () => {
      // Arrange
      mockReq.params = { id: 'nonexistent' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      };

      Category.findById.mockReturnValue(mockQuery);

      // Act
      await categoryController.getCategoryById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not found'
        })
      );
    });

    it('should return error for inactive category', async () => {
      // Arrange
      mockReq.params = { id: 'cat123' };

      const mockCategory = {
        _id: 'cat123',
        name: 'Electronics',
        is_active: false
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategory)
      };

      Category.findById.mockReturnValue(mockQuery);

      // Act
      await categoryController.getCategoryById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not available'
        })
      );
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      // Arrange
      mockReq.body = {
        name: 'New Category',
        description: 'A new category description',
        parent_category_id: 'parent123'
      };

      const mockCategory = {
        _id: 'newcat123',
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category description',
        parent_category_id: 'parent123',
        is_active: true
      };

      Category.findOne.mockResolvedValue(null); // No duplicate
      Category.create.mockResolvedValue(mockCategory);

      // Act
      await categoryController.createCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findOne).toHaveBeenCalledWith({ name: 'New Category' });
      expect(Category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Category',
          description: 'A new category description',
          parent_category_id: 'parent123'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategory
        })
      );
    });

    it('should return error if category already exists', async () => {
      // Arrange
      mockReq.body = {
        name: 'Existing Category'
      };

      Category.findOne.mockResolvedValue({ name: 'Existing Category' });

      // Act
      await categoryController.createCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category with this name already exists'
        })
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      // Arrange
      mockReq.params = { id: 'cat123' };
      mockReq.body = {
        name: 'Updated Category',
        description: 'Updated description'
      };

      const mockCategory = {
        _id: 'cat123',
        name: 'Old Category',
        description: 'Old description',
        save: jest.fn()
      };

      Category.findById.mockResolvedValue(mockCategory);
      Category.findOne.mockResolvedValue(null); // No name conflict

      // Act
      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findById).toHaveBeenCalledWith('cat123');
      expect(mockCategory.name).toBe('Updated Category');
      expect(mockCategory.description).toBe('Updated description');
      expect(mockCategory.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error if category not found', async () => {
      // Arrange
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { name: 'Updated Category' };

      Category.findById.mockResolvedValue(null);

      // Act
      await categoryController.updateCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not found'
        })
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Arrange
      mockReq.params = { id: 'cat123' };

      const mockCategory = {
        _id: 'cat123',
        name: 'Category to Delete'
      };

      Category.findById.mockResolvedValue(mockCategory);
      Category.findByIdAndDelete.mockResolvedValue(mockCategory);

      // Act
      await categoryController.deleteCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.findById).toHaveBeenCalledWith('cat123');
      expect(Category.findByIdAndDelete).toHaveBeenCalledWith('cat123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Category deleted successfully'
        })
      );
    });

    it('should return error if category not found', async () => {
      // Arrange
      mockReq.params = { id: 'nonexistent' };

      Category.findById.mockResolvedValue(null);

      // Act
      await categoryController.deleteCategory(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category not found'
        })
      );
    });
  });

  describe('getCategoryHierarchy', () => {
    it('should get category hierarchy successfully', async () => {
      // Arrange
      const mockCategories = [
        {
          _id: 'parent1',
          name: 'Electronics',
          parent_category_id: null,
          children: [
            {
              _id: 'child1',
              name: 'Smartphones',
              parent_category_id: 'parent1'
            }
          ]
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories)
      };

      Category.find.mockReturnValue(mockQuery);

      // Act
      await categoryController.getCategoryHierarchy(mockReq, mockRes, mockNext);

      // Assert
      expect(Category.find).toHaveBeenCalledWith({
        is_active: true,
        parent_category_id: null
      });
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'children',
        match: { is_active: true },
        select: 'name slug description'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCategories
        })
      );
    });
  });
});
