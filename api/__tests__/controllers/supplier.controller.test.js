/**
 * Supplier Controller Unit Tests
 * Comprehensive test suite for supplier.controller.js
 */

const supplierController = require('../../controllers/supplier.controller');
const Supplier = require('../../models/Supplier');
const userActivityLogger = require('../../loggers/userActivity.logger');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Mock the Supplier model, loggers, and validation
jest.mock('../../models/Supplier', () => jest.fn());
jest.mock('../../loggers/userActivity.logger');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');
jest.mock('mongoose');

describe('Supplier Controller', () => {
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

    // Mock mongoose ObjectId
    mongoose.Types = {
      ObjectId: jest.fn().mockImplementation((id) => id)
    };
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

    // Setup Supplier model mock methods
    Supplier.find = jest.fn();
    Supplier.findOne = jest.fn();
    Supplier.findById = jest.fn();
    Supplier.aggregate = jest.fn();
    Supplier.countDocuments = jest.fn();
    Supplier.mockClear();
  });

  describe('createSupplier', () => {
    const validSupplierData = {
      name: 'TechSupply Corp',
      description: 'Leading technology supplier',
      email: 'contact@techsupply.com',
      website: 'https://www.techsupply.com',
      address: {
        address_line_1: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipcode: '94102',
        country: 'USA'
      },
      status: 'Active',
      rating: 4.5,
      payment_terms: 'Net 30 days',
      delivery_terms: 'FOB destination',
      notes: 'Reliable supplier',
      product_categories_supplied: ['cat123', 'cat456']
    };

    beforeEach(() => {
      mockReq.body = validSupplierData;
      mockReq.user = { id: 'admin123', email: 'admin@test.com', role: 'admin' };
    });

    it('should create a supplier successfully', async () => {
      const mockSupplier = {
        _id: 'supplier123',
        ...validSupplierData,
        slug: 'techsupply-corp',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'supplier123',
          ...validSupplierData,
          slug: 'techsupply-corp',
          product_categories_supplied: [
            { _id: 'cat123', name: 'Electronics', slug: 'electronics' },
            { _id: 'cat456', name: 'Accessories', slug: 'accessories' }
          ]
        })
      };

      Supplier.mockImplementation(() => mockSupplier);
      mockSupplier.save.mockResolvedValue(mockSupplier);

      await supplierController.createSupplier(mockReq, mockRes, mockNext);

      expect(Supplier).toHaveBeenCalledWith({
        name: validSupplierData.name,
        description: validSupplierData.description,
        logo_url: undefined,
        address: validSupplierData.address,
        email: validSupplierData.email,
        website: validSupplierData.website,
        payment_terms: validSupplierData.payment_terms,
        delivery_terms: validSupplierData.delivery_terms,
        status: 'Active',
        notes: validSupplierData.notes,
        product_categories_supplied: validSupplierData.product_categories_supplied
      });

      expect(mockSupplier.save).toHaveBeenCalled();
      expect(mockSupplier.populate).toHaveBeenCalledWith('product_categories_supplied', 'name slug');
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Supplier created', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier created successfully',
        data: expect.any(Object)
      });
    });

    it('should return validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'Supplier name is required', param: 'name' }
        ])
      });

      await supplierController.createSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ msg: 'Supplier name is required', param: 'name' }]
      });
    });

    it('should handle duplicate name error', async () => {
      const mockSupplier = {
        save: jest.fn().mockRejectedValue({
          code: 11000,
          keyValue: { name: 'TechSupply Corp' }
        })
      };

      Supplier.mockImplementation(() => mockSupplier);

      await supplierController.createSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier with this name already exists',
        field: 'name'
      });
    });

    it('should handle validation errors from model', async () => {
      const mockSupplier = {
        save: jest.fn().mockRejectedValue({
          name: 'ValidationError',
          errors: {
            email: { message: 'Email must be valid' }
          }
        })
      };

      Supplier.mockImplementation(() => mockSupplier);

      await supplierController.createSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Email must be valid']
      });
    });

    it('should handle unexpected errors', async () => {
      const mockSupplier = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Supplier.mockImplementation(() => mockSupplier);

      await supplierController.createSupplier(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Database error'));
    });
  });

  describe('getAllSuppliers', () => {
    beforeEach(() => {
      mockReq.query = {
        page: '1',
        limit: '10',
        sort: 'createdAt',
        order: 'desc'
      };
    });

    it('should get all suppliers for admin', async () => {
      mockReq.user = { role: 'admin' };
      
      const mockSuppliers = [
        { _id: 'supplier1', name: 'Supplier 1', is_active: true },
        { _id: 'supplier2', name: 'Supplier 2', is_active: false }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(mockSuppliers)
      };

      Supplier.find = jest.fn().mockReturnValue(mockQuery);
      Supplier.countDocuments = jest.fn().mockResolvedValue(2);

      await supplierController.getAllSuppliers(mockReq, mockRes, mockNext);

      expect(Supplier.find).toHaveBeenCalledWith({ is_active: true });
      expect(mockQuery.populate).toHaveBeenCalledWith('product_categories_supplied', 'name slug description');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSuppliers,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    it('should filter suppliers by status', async () => {
      mockReq.query.status = 'Active';
      mockReq.user = { role: 'admin' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([])
      };

      Supplier.find = jest.fn().mockReturnValue(mockQuery);
      Supplier.countDocuments = jest.fn().mockResolvedValue(0);

      await supplierController.getAllSuppliers(mockReq, mockRes, mockNext);

      expect(Supplier.find).toHaveBeenCalledWith({
        is_active: true,
        status: 'Active'
      });
    });

    it('should search suppliers', async () => {
      mockReq.query.search = 'tech';
      mockReq.user = { role: 'admin' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([])
      };

      Supplier.find = jest.fn().mockReturnValue(mockQuery);
      Supplier.countDocuments = jest.fn().mockResolvedValue(0);

      await supplierController.getAllSuppliers(mockReq, mockRes, mockNext);

      expect(Supplier.find).toHaveBeenCalledWith({
        is_active: true,
        $or: [
          { name: { $regex: 'tech', $options: 'i' } },
          { description: { $regex: 'tech', $options: 'i' } },
          { email: { $regex: 'tech', $options: 'i' } },
          { 'address.city': { $regex: 'tech', $options: 'i' } },
          { 'address.country': { $regex: 'tech', $options: 'i' } }
        ]
      });
    });

    it('should log user activity for non-admin users', async () => {
      mockReq.user = { id: 'user123', email: 'user@test.com', role: 'user' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([])
      };

      Supplier.find = jest.fn().mockReturnValue(mockQuery);
      Supplier.countDocuments = jest.fn().mockResolvedValue(0);

      await supplierController.getAllSuppliers(mockReq, mockRes, mockNext);

      expect(userActivityLogger.info).toHaveBeenCalledWith('Suppliers list viewed', expect.any(Object));
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Supplier.find = jest.fn().mockImplementation(() => {
        throw error;
      });

      await supplierController.getAllSuppliers(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSupplierByIdOrSlug', () => {
    it('should get supplier by ObjectId', async () => {
      mockReq.params.identifier = '507f1f77bcf86cd799439011';
      
      const mockSupplier = {
        _id: '507f1f77bcf86cd799439011',
        name: 'TechSupply Corp',
        is_active: true
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockSupplier)
      };

      Supplier.findOne = jest.fn().mockReturnValue(mockQuery);

      await supplierController.getSupplierByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Supplier.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        is_active: true
      });
      expect(mockQuery.populate).toHaveBeenCalledWith('product_categories_supplied', 'name slug description');
      expect(userActivityLogger.info).toHaveBeenCalledWith('Supplier viewed', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSupplier
      });
    });

    it('should get supplier by slug', async () => {
      mockReq.params.identifier = 'techsupply-corp';
      
      const mockSupplier = {
        _id: 'supplier123',
        name: 'TechSupply Corp',
        slug: 'techsupply-corp',
        is_active: true
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockSupplier)
      };

      Supplier.findOne = jest.fn().mockReturnValue(mockQuery);

      await supplierController.getSupplierByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Supplier.findOne).toHaveBeenCalledWith({
        slug: 'techsupply-corp',
        is_active: true
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSupplier
      });
    });

    it('should return 404 when supplier not found', async () => {
      mockReq.params.identifier = 'nonexistent';

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Supplier.findOne = jest.fn().mockReturnValue(mockQuery);

      await supplierController.getSupplierByIdOrSlug(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier not found'
      });
    });

    it('should allow admin to view inactive suppliers', async () => {
      mockReq.params.identifier = 'supplier123';
      mockReq.user = { role: 'admin' };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue({ _id: 'supplier123', is_active: false })
      };

      Supplier.findOne = jest.fn().mockReturnValue(mockQuery);

      await supplierController.getSupplierByIdOrSlug(mockReq, mockRes, mockNext);

      expect(Supplier.findOne).toHaveBeenCalledWith({ slug: 'supplier123' });
    });
  });

  describe('updateSupplier', () => {
    beforeEach(() => {
      mockReq.params.id = 'supplier123';
      mockReq.body = {
        name: 'Updated Supplier Name',
        description: 'Updated description',
        address: {
          city: 'New York'
        }
      };
      mockReq.user = { id: 'admin123', email: 'admin@test.com' };
    });

    it('should update supplier successfully', async () => {
      const mockSupplier = {
        _id: 'supplier123',
        name: 'Old Name',
        description: 'Old description',
        email: 'old@example.com',
        status: 'active',
        product_categories_supplied: [],
        address: { 
          city: 'Old City',
          toObject: jest.fn().mockReturnValue({ city: 'Old City' })
        },
        save: jest.fn().mockResolvedValue({
          _id: 'supplier123',
          name: 'Updated Supplier Name',
          description: 'Updated description',
          address: { city: 'New York' },
          populate: jest.fn().mockResolvedValue({
            _id: 'supplier123',
            name: 'Updated Supplier Name',
            description: 'Updated description',
            address: { city: 'New York' },
            product_categories_supplied: []
          })
        })
      };

      Supplier.findById = jest.fn().mockResolvedValue(mockSupplier);

      await supplierController.updateSupplier(mockReq, mockRes, mockNext);

      expect(Supplier.findById).toHaveBeenCalledWith('supplier123');
      expect(mockSupplier.save).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Supplier updated', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 when supplier not found', async () => {
      Supplier.findById = jest.fn().mockResolvedValue(null);

      await supplierController.updateSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier not found'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'Name is required', param: 'name' }
        ])
      });

      await supplierController.updateSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ msg: 'Name is required', param: 'name' }]
      });
    });

    it('should handle duplicate name error', async () => {
      const mockSupplier = {
        _id: 'supplier123',
        address: { toObject: jest.fn().mockReturnValue({}) },
        save: jest.fn().mockRejectedValue({
          code: 11000,
          keyValue: { name: 'Updated Supplier Name' }
        })
      };

      Supplier.findById = jest.fn().mockResolvedValue(mockSupplier);

      await supplierController.updateSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier with this name already exists',
        field: 'name'
      });
    });
  });

  describe('deleteSupplier', () => {
    beforeEach(() => {
      mockReq.params.id = 'supplier123';
      mockReq.user = { id: 'admin123', email: 'admin@test.com' };
    });

    it('should soft delete supplier successfully', async () => {
      const mockSupplier = {
        _id: 'supplier123',
        name: 'TechSupply Corp',
        email: 'contact@techsupply.com',
        softDelete: jest.fn().mockResolvedValue(true)
      };

      Supplier.findById = jest.fn().mockResolvedValue(mockSupplier);

      await supplierController.deleteSupplier(mockReq, mockRes, mockNext);

      expect(Supplier.findById).toHaveBeenCalledWith('supplier123');
      expect(mockSupplier.softDelete).toHaveBeenCalled();
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Supplier soft deleted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 when supplier not found', async () => {
      Supplier.findById = jest.fn().mockResolvedValue(null);

      await supplierController.deleteSupplier(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier not found'
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Supplier.findById = jest.fn().mockRejectedValue(error);

      await supplierController.deleteSupplier(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSupplierStats', () => {
    beforeEach(() => {
      mockReq.user = { role: 'admin' };
    });

    it('should return supplier statistics', async () => {
      const mockStats = [
        {
          totalSuppliers: 100,
          activeSuppliers: 85,
          inactiveSuppliers: 15,
          averageRating: 4.2
        }
      ];

      const mockStatusStats = [
        { _id: 'Active', count: 70 },
        { _id: 'Pending Approval', count: 15 },
        { _id: 'On Hold', count: 10 },
        { _id: 'Inactive', count: 5 }
      ];

      const mockCountryStats = [
        { _id: 'USA', count: 40 },
        { _id: 'Canada', count: 25 },
        { _id: 'Mexico', count: 20 },
        { _id: 'China', count: 15 }
      ];

      Supplier.aggregate = jest.fn()
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockStatusStats)
        .mockResolvedValueOnce(mockCountryStats);

      await supplierController.getSupplierStats(mockReq, mockRes, mockNext);

      expect(Supplier.aggregate).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          overview: mockStats[0],
          statusBreakdown: mockStatusStats,
          topCountries: mockCountryStats
        }
      });
    });

    it('should handle empty stats', async () => {
      Supplier.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await supplierController.getSupplierStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          overview: {
            totalSuppliers: 0,
            activeSuppliers: 0,
            inactiveSuppliers: 0,
            averageRating: 0
          },
          statusBreakdown: [],
          topCountries: []
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Aggregation error');
      Supplier.aggregate = jest.fn().mockRejectedValue(error);

      await supplierController.getSupplierStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
