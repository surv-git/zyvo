/**
 * Option Controller Unit Tests
 * Comprehensive test suite for option.controller.js
 */

const optionController = require('../../controllers/option.controller');
const Option = require('../../models/Option');
const userActivityLogger = require('../../loggers/userActivity.logger');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

// Mock the Option model, loggers, and validation
jest.mock('../../models/Option');
jest.mock('../../loggers/userActivity.logger');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');

describe('Option Controller', () => {
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

  describe('createOption', () => {
    const validOptionData = {
      option_type: 'Color',
      option_value: 'Red',
      name: 'Bright Red',
      sort_order: 1
    };

    it('should create a new option successfully', async () => {
      mockReq.body = validOptionData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockOption = {
        _id: 'opt123',
        ...validOptionData,
        slug: 'color-red',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue({
          _id: 'opt123',
          ...validOptionData,
          slug: 'color-red',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      Option.mockImplementation(() => mockOption);

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(Option).toHaveBeenCalledWith({
        option_type: validOptionData.option_type,
        option_value: validOptionData.option_value,
        name: validOptionData.name,
        sort_order: validOptionData.sort_order
      });
      expect(mockOption.save).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Option created', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Option created successfully',
        data: expect.any(Object)
      });
    });

    it('should use option_value as name if name not provided', async () => {
      const optionDataWithoutName = {
        option_type: 'Size',
        option_value: 'Large',
        sort_order: 1
      };

      mockReq.body = optionDataWithoutName;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const mockOption = {
        _id: 'opt123',
        save: jest.fn().mockResolvedValue(true)
      };

      Option.mockImplementation(() => mockOption);

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(Option).toHaveBeenCalledWith({
        option_type: 'Size',
        option_value: 'Large',
        name: 'Large', // Should default to option_value
        sort_order: 1
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = validOptionData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'Option type is required' },
          { msg: 'Option value is required' }
        ])
      });

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [
          { msg: 'Option type is required' },
          { msg: 'Option value is required' }
        ]
      });
    });

    it('should handle duplicate option type + value combination', async () => {
      mockReq.body = validOptionData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { option_type: 'Color', option_value: 'Red' };

      const mockOption = {
        save: jest.fn().mockRejectedValue(duplicateError)
      };

      Option.mockImplementation(() => mockOption);

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Option 'Color: Red' already exists"
      });
    });

    it('should handle duplicate slug error', async () => {
      mockReq.body = validOptionData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { slug: 'color-red' };

      const mockOption = {
        save: jest.fn().mockRejectedValue(duplicateError)
      };

      Option.mockImplementation(() => mockOption);

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Option with slug 'color-red' already exists"
      });
    });

    it('should handle validation model errors', async () => {
      mockReq.body = validOptionData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        option_type: { message: 'Option type is required' },
        option_value: { message: 'Option value is required' }
      };

      const mockOption = {
        save: jest.fn().mockRejectedValue(validationError)
      };

      Option.mockImplementation(() => mockOption);

      await optionController.createOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Option type is required', 'Option value is required']
      });
    });
  });

  describe('getAllOptions', () => {
    const mockOptions = [
      {
        _id: 'opt1',
        option_type: 'Color',
        option_value: 'Red',
        name: 'Bright Red',
        slug: 'color-red',
        is_active: true,
        sort_order: 1
      },
      {
        _id: 'opt2',
        option_type: 'Color',
        option_value: 'Blue',
        name: 'Ocean Blue',
        slug: 'color-blue',
        is_active: true,
        sort_order: 2
      }
    ];

    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOptions)
      };

      Option.find = jest.fn().mockReturnValue(mockQuery);
      Option.countDocuments = jest.fn().mockResolvedValue(20);
    });

    it('should get all options with default pagination', async () => {
      mockReq.query = {};

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(Option.find).toHaveBeenCalledWith({ is_active: true });
      expect(userActivityLogger.info).toHaveBeenCalledWith('Options list viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOptions,
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalItems: 20,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    it('should apply pagination correctly', async () => {
      mockReq.query = { page: '2', limit: '5' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOptions)
      };

      Option.find.mockReturnValue(mockQuery);

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should apply option_type filter', async () => {
      mockReq.query = { option_type: 'Color' };

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(Option.find).toHaveBeenCalledWith({
        is_active: true,
        option_type: { $regex: 'Color', $options: 'i' }
      });
    });

    it('should apply search filter', async () => {
      mockReq.query = { search: 'Red' };

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(Option.find).toHaveBeenCalledWith({
        is_active: true,
        $or: [
          { name: { $regex: 'Red', $options: 'i' } },
          { option_value: { $regex: 'Red', $options: 'i' } },
          { option_type: { $regex: 'Red', $options: 'i' } }
        ]
      });
    });

    it('should allow admin to see inactive options', async () => {
      mockReq.query = { include_inactive: 'true', is_active: 'false' };
      mockReq.user = { role: 'admin' };

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(Option.find).toHaveBeenCalledWith({ is_active: false });
    });

    it('should apply sorting by option_type', async () => {
      mockReq.query = { sort: 'option_type', order: 'desc' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOptions)
      };

      Option.find.mockReturnValue(mockQuery);

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(mockQuery.sort).toHaveBeenCalledWith({
        option_type: -1,
        sort_order: 1
      });
    });

    it('should apply sorting by name', async () => {
      mockReq.query = { sort: 'name', order: 'asc' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOptions)
      };

      Option.find.mockReturnValue(mockQuery);

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Option.find.mockImplementation(() => {
        throw error;
      });

      await optionController.getAllOptions(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getOptionById', () => {
    const mockOption = {
      _id: 'opt123',
      option_type: 'Color',
      option_value: 'Red',
      name: 'Bright Red',
      slug: 'color-red',
      is_active: true
    };

    beforeEach(() => {
      Option.findOne = jest.fn().mockResolvedValue(mockOption);
    });

    it('should get option by id successfully', async () => {
      mockReq.params = { id: 'opt123' };

      await optionController.getOptionById(mockReq, mockRes, mockNext);

      expect(Option.findOne).toHaveBeenCalledWith({
        _id: 'opt123',
        is_active: true
      });
      expect(userActivityLogger.info).toHaveBeenCalledWith('Option viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOption
      });
    });

    it('should allow admin to see inactive options', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.user = { role: 'admin' };

      await optionController.getOptionById(mockReq, mockRes, mockNext);

      expect(Option.findOne).toHaveBeenCalledWith({ _id: 'opt123' });
    });

    it('should return 404 if option not found', async () => {
      mockReq.params = { id: 'non-existent' };
      Option.findOne.mockResolvedValue(null);

      await optionController.getOptionById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Option not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'opt123' };
      const error = new Error('Database error');
      Option.findOne.mockRejectedValue(error);

      await optionController.getOptionById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateOption', () => {
    const updateData = {
      name: 'Updated Red',
      sort_order: 5
    };

    const mockOption = {
      _id: 'opt123',
      option_type: 'Color',
      option_value: 'Red',
      name: 'Bright Red',
      is_active: true,
      sort_order: 1,
      slug: 'color-red',
      save: jest.fn().mockImplementation(() => {
        console.log('TEST DEBUG: save method called');
        return Promise.resolve({
          _id: 'opt123',
          option_type: 'Color',
          option_value: 'Red',
          name: 'Updated Red',
          is_active: true,
          sort_order: 5,
          slug: 'color-red'
        });
      })
    };

    beforeEach(() => {
      // Create a proper mock that ensures save method is mocked
      const mockSave = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          _id: 'opt123',
          option_type: 'Color',
          option_value: 'Red',
          name: 'Updated Red',
          is_active: true,
          sort_order: 5,
          slug: 'color-red'
        });
      });
      
      mockOption.save = mockSave;
      Option.findById = jest.fn().mockResolvedValue(mockOption);
    });

    it('should update option successfully', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await optionController.updateOption(mockReq, mockRes, mockNext);

      expect(Option.findById).toHaveBeenCalledWith('opt123');
      expect(mockOption.save).toHaveBeenCalled();
      
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Option updated', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Option updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 if option not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = updateData;
      Option.findById.mockResolvedValue(null);

      await optionController.updateOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Option not found'
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.body = updateData;
      
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Invalid data' }])
      });

      await optionController.updateOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ msg: 'Invalid data' }]
      });
    });

    it('should handle duplicate errors', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.body = updateData;
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyValue = { option_type: 'Color', option_value: 'Red' };

      mockOption.save.mockRejectedValue(duplicateError);

      await optionController.updateOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Option 'Color: Red' already exists"
      });
    });
  });

  describe('deleteOption', () => {
    const mockOption = {
      _id: 'opt123',
      option_type: 'Color',
      option_value: 'Red',
      softDelete: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      Option.findById = jest.fn().mockResolvedValue(mockOption);
    });

    it('should soft delete option successfully', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      await optionController.deleteOption(mockReq, mockRes, mockNext);

      expect(Option.findById).toHaveBeenCalledWith('opt123');
      expect(mockOption.softDelete).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Option deleted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Option deleted successfully'
      });
    });

    it('should return 404 if option not found', async () => {
      mockReq.params = { id: 'non-existent' };
      Option.findById.mockResolvedValue(null);

      await optionController.deleteOption(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Option not found'
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'opt123' };
      mockReq.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };

      const error = new Error('Database error');
      mockOption.softDelete.mockRejectedValue(error);

      await optionController.deleteOption(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getOptionTypes', () => {
    const mockOptionTypes = [
      {
        _id: 'Color',
        count: 5,
        values: [
          { _id: 'opt1', option_value: 'Red', name: 'Bright Red', slug: 'color-red', sort_order: 1 },
          { _id: 'opt2', option_value: 'Blue', name: 'Ocean Blue', slug: 'color-blue', sort_order: 2 }
        ]
      },
      {
        _id: 'Size',
        count: 3,
        values: [
          { _id: 'opt3', option_value: 'Small', name: 'Small Size', slug: 'size-small', sort_order: 1 },
          { _id: 'opt4', option_value: 'Large', name: 'Large Size', slug: 'size-large', sort_order: 2 }
        ]
      }
    ];

    beforeEach(() => {
      Option.getOptionTypes = jest.fn().mockResolvedValue(mockOptionTypes);
    });

    it('should get option types successfully', async () => {
      mockReq.query = {};

      await optionController.getOptionTypes(mockReq, mockRes, mockNext);

      expect(Option.getOptionTypes).toHaveBeenCalledWith(false);
      expect(userActivityLogger.info).toHaveBeenCalledWith('Option types viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOptionTypes
      });
    });

    it('should allow admin to include inactive options', async () => {
      mockReq.query = { include_inactive: 'true' };
      mockReq.user = { role: 'admin' };

      await optionController.getOptionTypes(mockReq, mockRes, mockNext);

      expect(Option.getOptionTypes).toHaveBeenCalledWith(true);
    });

    it('should not include inactive options for non-admin users', async () => {
      mockReq.query = { include_inactive: 'true' };
      mockReq.user = { role: 'user' };

      await optionController.getOptionTypes(mockReq, mockRes, mockNext);

      expect(Option.getOptionTypes).toHaveBeenCalledWith(false);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Option.getOptionTypes.mockRejectedValue(error);

      await optionController.getOptionTypes(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getOptionStats', () => {
    beforeEach(() => {
      Option.countDocuments = jest.fn();
      Option.distinct = jest.fn();
      Option.aggregate = jest.fn();
    });

    it('should return option statistics', async () => {
      Option.countDocuments
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // active
        .mockResolvedValueOnce(5); // inactive

      Option.distinct.mockResolvedValue(['Color', 'Size', 'Weight']);

      Option.aggregate.mockResolvedValue([
        { option_type: 'Color', count: 20 },
        { option_type: 'Size', count: 15 },
        { option_type: 'Weight', count: 10 }
      ]);

      await optionController.getOptionStats(mockReq, mockRes, mockNext);

      expect(Option.countDocuments).toHaveBeenCalledTimes(3);
      expect(Option.distinct).toHaveBeenCalledWith('option_type');
      expect(Option.aggregate).toHaveBeenCalled();

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalOptions: 50,
          activeOptions: 45,
          inactiveOptions: 5,
          totalOptionTypes: 3,
          topOptionTypes: [
            { option_type: 'Color', count: 20 },
            { option_type: 'Size', count: 15 },
            { option_type: 'Weight', count: 10 }
          ]
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Option.countDocuments.mockRejectedValue(error);

      await optionController.getOptionStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
