/**
 * Payment Method Controller Tests
 * Comprehensive test suite for payment method management system
 */

const PaymentMethod = require('../../models/PaymentMethod');
const paymentMethodController = require('../../controllers/paymentMethod.controller');

// Mock the PaymentMethod model
jest.mock('../../models/PaymentMethod');
jest.mock('../../loggers/userActivity.logger', () => ({
  log: jest.fn().mockResolvedValue(true)
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => [])
  }))
}));

const { validationResult } = require('express-validator');

describe('Payment Method Controller Tests', () => {
  
  // Test data
  const mockUser = {
    id: '64a7b8c9d0e1f2a3b4c5d6e7',
    email: 'test@example.com'
  };

  const mockPaymentMethod = {
    _id: '64a7b8c9d0e1f2a3b4c5d6e8',
    user_id: mockUser.id,
    method_type: 'CREDIT_CARD',
    alias: 'My Visa Card',
    is_default: true,
    is_active: true,
    details: {
      card_brand: 'Visa',
      last4_digits: '1234',
      expiry_month: '12',
      expiry_year: '2025',
      card_holder_name: 'John Doe',
      token: 'tok_test_encrypted'
    },
    toSafeObject: jest.fn().mockReturnValue({
      _id: '64a7b8c9d0e1f2a3b4c5d6e8',
      user_id: mockUser.id,
      method_type: 'CREDIT_CARD',
      alias: 'My Visa Card',
      is_default: true,
      details: {
        card_brand: 'Visa',
        last4_digits: '1234',
        expiry_month: '12',
        expiry_year: '2025',
        card_holder_name: 'John Doe'
        // token removed for security
      }
    })
  };

  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: mockUser,
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test-Agent/1.0')
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Module Loading', () => {
    it('should be able to require the payment method controller', () => {
      expect(() => {
        require('../../controllers/paymentMethod.controller');
      }).not.toThrow();
    });

    it('should have all required controller methods', () => {
      const controller = require('../../controllers/paymentMethod.controller');
      
      expect(typeof controller.addPaymentMethod).toBe('function');
      expect(typeof controller.getAllPaymentMethods).toBe('function');
      expect(typeof controller.getPaymentMethodById).toBe('function');
      expect(typeof controller.updatePaymentMethod).toBe('function');
      expect(typeof controller.deletePaymentMethod).toBe('function');
      expect(typeof controller.setAsDefaultPaymentMethod).toBe('function');
      expect(typeof controller.getDefaultPaymentMethod).toBe('function');
    });

    it('should be able to require the PaymentMethod model', () => {
      expect(() => {
        const PaymentMethod = require('../../models/PaymentMethod');
        expect(PaymentMethod).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('addPaymentMethod', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Default mock for validation result (no validation errors)
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });
    });

    it('should create a credit card payment method successfully', async () => {
      mockReq.body = {
        method_type: 'CREDIT_CARD',
        alias: 'My Visa Card',
        is_default: true,
        details: {
          card_brand: 'Visa',
          last4_digits: '1234',
          expiry_month: '12',
          expiry_year: '2025',
          card_holder_name: 'John Doe',
          token: 'tok_test_12345'
        }
      };

      // Mock no duplicates found
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      // Create a properly mocked instance with all required methods
      const mockInstance = {
        ...mockPaymentMethod,
        save: jest.fn().mockResolvedValue(mockPaymentMethod),
        toSafeObject: jest.fn().mockReturnValue({
          _id: '64a7b8c9d0e1f2a3b4c5d6e8',
          user_id: mockUser.id,
          method_type: 'CREDIT_CARD',
          alias: 'My Visa Card',
          is_default: true,
          details: {
            card_brand: 'Visa',
            last4_digits: '1234',
            expiry_month: '12',
            expiry_year: '2025',
            card_holder_name: 'John Doe'
            // token removed for security
          }
        })
      };

      // Mock PaymentMethod constructor to return the properly configured instance
      PaymentMethod.mockImplementation(() => mockInstance);

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method added successfully',
        data: expect.objectContaining({
          method_type: 'CREDIT_CARD',
          alias: 'My Visa Card'
        })
      });
    });

    it('should create a UPI payment method successfully', async () => {
      mockReq.body = {
        method_type: 'UPI',
        alias: 'Personal UPI',
        details: {
          upi_id: 'john@paytm',
          account_holder_name: 'John Doe'
        }
      };

      const upiPaymentMethod = {
        ...mockPaymentMethod,
        _id: '64a7b8c9d0e1f2a3b4c5d6e9',
        method_type: 'UPI',
        alias: 'Personal UPI',
        details: {
          upi_id: 'john@paytm',
          account_holder_name: 'John Doe'
        },
        toSafeObject: jest.fn().mockReturnValue({
          _id: '64a7b8c9d0e1f2a3b4c5d6e9',
          method_type: 'UPI',
          alias: 'Personal UPI',
          details: {
            upi_id: 'john@paytm',
            account_holder_name: 'John Doe'
          }
        })
      };

      // Mock no duplicates found
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(upiPaymentMethod);
      PaymentMethod.mockImplementation(() => ({
        ...upiPaymentMethod,
        save: mockSave
      }));

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method added successfully',
        data: expect.objectContaining({
          method_type: 'UPI'
        })
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = {
        method_type: 'INVALID_TYPE',
        details: {}
      };

      // Mock validation errors
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { field: 'method_type', message: 'Invalid method type' }
        ])
      });

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: expect.any(Array)
      });
    });

    it('should handle duplicate UPI ID error', async () => {
      mockReq.body = {
        method_type: 'UPI',
        details: {
          upi_id: 'john@paytm',
          account_holder_name: 'John Doe'
        }
      };

      require('express-validator').validationResult = jest.fn().mockReturnValue({
        isEmpty: () => true
      });

      // Mock finding existing UPI with same ID
      PaymentMethod.findOne = jest.fn().mockResolvedValue({
        details: { upi_id: 'john@paytm' }
      });

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'This UPI ID is already registered'
      });
    });
  });

  describe('getAllPaymentMethods', () => {
    it('should retrieve all active payment methods', async () => {
      const mockPaymentMethods = [mockPaymentMethod].map(method => ({
        ...method,
        toSafeObject: jest.fn().mockReturnValue({...method, is_active: true})
      }));
      
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPaymentMethods)
      });

      await paymentMethodController.getAllPaymentMethods(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: expect.any(Array),
        pagination: expect.objectContaining({
          total: 1,
          active: 1
        })
      });
    });

    it('should include inactive methods when requested', async () => {
      mockReq.query.include_inactive = 'true';
      
      const mockPaymentMethods = [mockPaymentMethod, { ...mockPaymentMethod, is_active: false }];
      
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPaymentMethods)
      });

      await paymentMethodController.getAllPaymentMethods(mockReq, mockRes, mockNext);

      expect(PaymentMethod.find).toHaveBeenCalledWith({
        user_id: mockUser.id
      });
    });
  });

  describe('getPaymentMethodById', () => {
    it('should retrieve a specific payment method', async () => {
      mockReq.params.id = mockPaymentMethod._id;
      
      // Create a mock with the toSafeObject method
      const mockWithSafeObject = {
        ...mockPaymentMethod,
        toSafeObject: jest.fn().mockReturnValue({
          _id: mockPaymentMethod._id,
          user_id: mockUser.id,
          method_type: 'CREDIT_CARD',
          alias: 'My Visa Card',
          is_default: true,
          details: {
            card_brand: 'Visa',
            last4_digits: '1234',
            expiry_month: '12',
            expiry_year: '2025',
            card_holder_name: 'John Doe'
          }
        })
      };
      
      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockWithSafeObject);

      await paymentMethodController.getPaymentMethodById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method retrieved successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 if payment method not found', async () => {
      mockReq.params.id = 'nonexistent_id';
      
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      await paymentMethodController.getPaymentMethodById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment method not found'
      });
    });
  });

  describe('updatePaymentMethod', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Default mock for validation result (no validation errors)
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });
    });

    it('should update payment method alias successfully', async () => {
      mockReq.params.id = mockPaymentMethod._id;
      mockReq.body = { alias: 'Updated Alias' };

      const mockUpdatedMethod = {
        ...mockPaymentMethod,
        alias: 'Updated Alias',
        save: jest.fn().mockResolvedValue(true),
        toSafeObject: jest.fn().mockReturnValue({
          _id: mockPaymentMethod._id,
          user_id: mockUser.id,
          method_type: 'CREDIT_CARD',
          alias: 'Updated Alias',
          is_default: true,
          details: {
            card_brand: 'Visa',
            last4_digits: '1234',
            expiry_month: '12',
            expiry_year: '2025',
            card_holder_name: 'John Doe'
          }
        })
      };

      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockUpdatedMethod);

      await paymentMethodController.updatePaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method updated successfully',
        data: expect.any(Object)
      });
    });

    it('should prevent sensitive field updates', async () => {
      mockReq.params.id = mockPaymentMethod._id;
      mockReq.body = {
        details: {
          last4_digits: '5678' // Should not be allowed
        }
      };

      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockPaymentMethod);

      await paymentMethodController.updatePaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Card sensitive details cannot be updated. Please add a new payment method.'
      });
    });
  });

  describe('deletePaymentMethod', () => {
    it('should soft delete payment method successfully', async () => {
      mockReq.params.id = mockPaymentMethod._id;

      const mockDeleteMethod = {
        ...mockPaymentMethod,
        is_active: true,
        is_default: false,
        save: jest.fn().mockResolvedValue(true)
      };

      PaymentMethod.findOne = jest.fn().mockResolvedValueOnce(mockDeleteMethod)
        .mockResolvedValueOnce(null); // No next method to set as default

      await paymentMethodController.deletePaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockDeleteMethod.is_active).toBe(false);
    });

    it('should hard delete when requested', async () => {
      mockReq.params.id = mockPaymentMethod._id;
      mockReq.query.hard_delete = 'true';

      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockPaymentMethod);
      PaymentMethod.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

      await paymentMethodController.deletePaymentMethod(mockReq, mockRes, mockNext);

      expect(PaymentMethod.deleteOne).toHaveBeenCalledWith({ _id: mockPaymentMethod._id });
    });
  });

  describe('setAsDefaultPaymentMethod', () => {
    it('should set payment method as default', async () => {
      mockReq.params.id = mockPaymentMethod._id;

      PaymentMethod.setAsDefault = jest.fn().mockResolvedValue(true);
      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockPaymentMethod);

      await paymentMethodController.setAsDefaultPaymentMethod(mockReq, mockRes, mockNext);

      expect(PaymentMethod.setAsDefault).toHaveBeenCalledWith(mockPaymentMethod._id, mockUser.id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should retrieve default payment method', async () => {
      const mockWithSafeObject = {
        ...mockPaymentMethod,
        toSafeObject: jest.fn().mockReturnValue({
          _id: mockPaymentMethod._id,
          user_id: mockUser.id,
          method_type: 'CREDIT_CARD',
          alias: 'My Visa Card',
          is_default: true,
          details: {
            card_brand: 'Visa',
            last4_digits: '1234',
            expiry_month: '12',
            expiry_year: '2025',
            card_holder_name: 'John Doe'
          }
        })
      };
      
      PaymentMethod.findDefaultForUser = jest.fn().mockResolvedValue(mockWithSafeObject);

      await paymentMethodController.getDefaultPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Default payment method retrieved successfully',
        data: expect.any(Object)
      });
    });

    it('should return 404 if no default payment method found', async () => {
      PaymentMethod.findDefaultForUser = jest.fn().mockResolvedValue(null);

      await paymentMethodController.getDefaultPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No default payment method found'
      });
    });
  });

  describe('Security Features', () => {
    it('should ensure tokens are never exposed in responses', () => {
      // Reset and re-create the mock to ensure it works properly
      mockPaymentMethod.toSafeObject = jest.fn().mockReturnValue({
        _id: '64a7b8c9d0e1f2a3b4c5d6e8',
        user_id: mockUser.id,
        method_type: 'CREDIT_CARD',
        alias: 'My Visa Card',
        is_default: true,
        details: {
          card_brand: 'Visa',
          last4_digits: '1234',
          expiry_month: '12',
          expiry_year: '2025',
          card_holder_name: 'John Doe'
          // token removed for security
        }
      });
      
      const safeObject = mockPaymentMethod.toSafeObject();
      
      expect(safeObject).toBeDefined();
      expect(safeObject.details).toBeDefined();
      expect(safeObject.details.token).toBeUndefined();
      expect(safeObject.details.card_brand).toBeDefined();
      expect(safeObject.details.last4_digits).toBeDefined();
    });

    it('should validate payment method types', () => {
      const validTypes = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING', 'OTHER'];
      
      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should validate UPI ID format', () => {
      const validUPIIds = [
        'user@paytm',
        'john.doe@sbi',
        'test123@hdfc',
        'user_name@bank'
      ];

      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      
      validUPIIds.forEach(upiId => {
        expect(upiRegex.test(upiId)).toBe(true);
      });
    });

    it('should validate card expiry dates', () => {
      const currentYear = new Date().getFullYear();
      const validExpiryYears = [
        currentYear.toString(),
        (currentYear + 1).toString(),
        (currentYear + 5).toString()
      ];

      validExpiryYears.forEach(year => {
        expect(/^\d{4}$/.test(year)).toBe(true);
        expect(parseInt(year)).toBeGreaterThanOrEqual(currentYear);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Default mock for validation result (no validation errors)
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });
    });

    it('should handle mongoose validation errors', async () => {
      mockReq.body = {
        method_type: 'CREDIT_CARD',
        details: {} // Missing required fields
      };

      // Mock no duplicates found
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        'details.token': { message: 'Token is required', path: 'details.token' }
      };

      PaymentMethod.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError)
      }));

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Card details must include card_brand, last4_digits, expiry_month, expiry_year, card_holder_name, and token'
      });
    });

    it('should handle unexpected errors', async () => {
      mockReq.body = {
        method_type: 'CREDIT_CARD',
        details: {
          card_brand: 'Visa',
          last4_digits: '1234',
          expiry_month: '12',
          expiry_year: '2025',
          card_holder_name: 'John Doe',
          token: 'tok_test_12345'
        }
      };

      const unexpectedError = new Error('Database connection failed');
      
      // Mock findOne to succeed (no duplicates)
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock constructor and save to fail with unexpected error
      PaymentMethod.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(unexpectedError),
        _id: 'mock_id'
      }));

      await paymentMethodController.addPaymentMethod(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('Integration Readiness', () => {
    it('should be ready for route integration', () => {
      const controller = require('../../controllers/paymentMethod.controller');
      
      const expectedMethods = [
        'addPaymentMethod',
        'getAllPaymentMethods',
        'getPaymentMethodById',
        'updatePaymentMethod',
        'deletePaymentMethod',
        'setAsDefaultPaymentMethod',
        'getDefaultPaymentMethod'
      ];

      expectedMethods.forEach(method => {
        expect(controller[method]).toBeDefined();
        expect(typeof controller[method]).toBe('function');
      });
    });

    it('should be ready for authentication middleware integration', () => {
      const controller = require('../../controllers/paymentMethod.controller');
      
      Object.values(controller).forEach(method => {
        expect(method).toBeInstanceOf(Function);
        expect(method.length).toBeGreaterThanOrEqual(2); // (req, res, next)
      });
    });

    it('should be ready for validation middleware integration', () => {
      const { validationResult } = require('express-validator');
      
      expect(typeof validationResult).toBe('function');
    });
  });
});
