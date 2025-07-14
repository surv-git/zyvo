/**
 * Platform Controller Tests - Basic Validation
 * Tests to verify platform controller is working correctly
 */

describe('Platform Controller Tests', () => {
  it('should be able to require the platform controller', () => {
    // This test verifies that the platform controller module loads correctly
    expect(() => {
      require('../../controllers/platform.controller');
    }).not.toThrow();
  });

  it('should have all required controller methods', () => {
    const platformController = require('../../controllers/platform.controller');
    
    expect(typeof platformController.createPlatform).toBe('function');
    expect(typeof platformController.getAllPlatforms).toBe('function');
    expect(typeof platformController.getPlatformByIdOrSlug).toBe('function');
    expect(typeof platformController.updatePlatform).toBe('function');
    expect(typeof platformController.deletePlatform).toBe('function');
  });

  it('should be able to require the Platform model', () => {
    expect(() => {
      const Platform = require('../../models/Platform');
      expect(Platform).toBeDefined();
    }).not.toThrow();
  });

  it('should validate Platform model has required static methods', () => {
    const Platform = require('../../models/Platform');
    
    expect(typeof Platform.findActive).toBe('function');
    expect(typeof Platform.search).toBe('function');
  });

  it('should validate Platform model has required instance methods', () => {
    const Platform = require('../../models/Platform');
    
    const platform = new Platform({
      name: 'Test Platform'
    });
    
    expect(typeof platform.softDelete).toBe('function');
    expect(typeof platform.activate).toBe('function');
  });
});
