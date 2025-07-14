/**
 * Supplier Contact Number Controller Unit Tests
 * Comprehensive test suite for supplierContactNumber.controller.js
 */

const supplierContactNumberController = require('../../controllers/supplierContactNumber.controller');
const SupplierContactNumber = require('../../models/SupplierContactNumber');
const Supplier = require('../../models/Supplier');
const adminAuditLogger = require('../../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');

// Mock the models, loggers, and validation
jest.mock('../../models/SupplierContactNumber');
jest.mock('../../models/Supplier');
jest.mock('../../loggers/adminAudit.logger');
jest.mock('express-validator');

describe('Supplier Contact Number Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockReq = global.mockReq();
    mockRes = global.mockRes();
    mockNext = global.mockNext();

    // Mock logger methods
    adminAuditLogger.info = jest.fn();

    // Mock validationResult to return no errors by default
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('createContactNumber', () => {
    const validContactData = {
      supplier_id: 'supplier123',
      contact_number: '+1-555-123-4567',
      extension: '123',
      type: 'Mobile',
      contact_name: 'John Doe',
      is_primary: true,
      notes: 'Main sales contact'
    };

    beforeEach(() => {
      mockReq.body = validContactData;
      mockReq.user = { id: 'admin123', email: 'admin@test.com', role: 'admin' };
    });

    it('should create contact number successfully', async () => {
      const mockSupplier = {
        _id: 'supplier123',
        name: 'TechSupply Corp'
      };

      const savedContactNumber = {
        _id: 'contact123',
        ...validContactData,
        supplier_id: mockSupplier,
        populate: jest.fn().mockImplementation(function() {
          this.supplier_id = mockSupplier;
          return Promise.resolve(this);
        })
      };

      const mockContactNumber = {
        save: jest.fn().mockResolvedValue(savedContactNumber)
      };

      Supplier.findById = jest.fn().mockResolvedValue(mockSupplier);
      SupplierContactNumber.mockImplementation(() => mockContactNumber);

      await supplierContactNumberController.createContactNumber(mockReq, mockRes, mockNext);

      expect(Supplier.findById).toHaveBeenCalledWith('supplier123');
      expect(SupplierContactNumber).toHaveBeenCalledWith(validContactData);
      expect(mockContactNumber.save).toHaveBeenCalled();
      expect(savedContactNumber.populate).toHaveBeenCalledWith('supplier_id', 'name slug email');
      expect(adminAuditLogger.info).toHaveBeenCalledWith('Supplier contact number created', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Supplier contact number created successfully',
        data: savedContactNumber
      });
    });

    it('should return 400 when supplier not found', async () => {
      Supplier.findById = jest.fn().mockResolvedValue(null);

      await supplierContactNumberController.createContactNumber(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Supplier not found'
      });
    });
  });

  describe('getContactNumbersBySupplier', () => {
    beforeEach(() => {
      mockReq.params.supplierId = 'supplier123';
      mockReq.query = {
        include_inactive: 'false'
      };
    });

    it('should get contact numbers by supplier', async () => {
      const mockContactNumbers = [
        { _id: 'contact1', contact_number: '+1-555-123-4567', is_primary: true }
      ];

      const mockSupplier = { 
        _id: 'supplier123', 
        name: 'TechSupply Corp', 
        slug: 'techsupply-corp', 
        email: 'contact@techsupply.com' 
      };

      Supplier.findById = jest.fn().mockResolvedValue(mockSupplier);
      SupplierContactNumber.findBySupplier = jest.fn().mockResolvedValue(mockContactNumbers);

      await supplierContactNumberController.getContactNumbersBySupplier(mockReq, mockRes, mockNext);

      expect(Supplier.findById).toHaveBeenCalledWith('supplier123');
      expect(SupplierContactNumber.findBySupplier).toHaveBeenCalledWith('supplier123', false);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockContactNumbers,
        supplier: {
          _id: 'supplier123',
          name: 'TechSupply Corp',
          slug: 'techsupply-corp',
          email: 'contact@techsupply.com'
        }
      });
    });
  });
});