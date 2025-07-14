/**
 * Listing Controller Tests - Basic Validation
 * Tests to verify listing controller is working correctly
 */

describe('Listing Controller Tests', () => {
  it('should be able to require the listing controller', () => {
    // This test verifies that the listing controller module loads correctly
    expect(() => {
      require('../../controllers/listing.controller');
    }).not.toThrow();
  });

  it('should have all required controller methods', () => {
    const listingController = require('../../controllers/listing.controller');
    
    expect(typeof listingController.createListing).toBe('function');
    expect(typeof listingController.getAllListings).toBe('function');
    expect(typeof listingController.getListingById).toBe('function');
    expect(typeof listingController.updateListing).toBe('function');
    expect(typeof listingController.deleteListing).toBe('function');
  });

  it('should be able to require the Listing model', () => {
    expect(() => {
      const Listing = require('../../models/Listing');
      expect(Listing).toBeDefined();
    }).not.toThrow();
  });

  it('should validate Listing model has required static methods', () => {
    const Listing = require('../../models/Listing');
    
    expect(typeof Listing.findActive).toBe('function');
    expect(typeof Listing.findByPlatform).toBe('function');
    expect(typeof Listing.findByProductVariant).toBe('function');
    expect(typeof Listing.findLive).toBe('function');
    expect(typeof Listing.findNeedingSync).toBe('function');
    expect(typeof Listing.search).toBe('function');
  });

  it('should validate Listing model has required instance methods', () => {
    const Listing = require('../../models/Listing');
    
    const listing = new Listing({
      product_variant_id: '507f1f77bcf86cd799439011',
      platform_id: '507f1f77bcf86cd799439012'
    });
    
    expect(typeof listing.softDelete).toBe('function');
    expect(typeof listing.activate).toBe('function');
    expect(typeof listing.markAsSynced).toBe('function');
    expect(typeof listing.updateStatus).toBe('function');
  });

  it('should validate Listing model virtual fields', () => {
    const Listing = require('../../models/Listing');
    
    // Test with fees calculation
    const listing = new Listing({
      product_variant_id: '507f1f77bcf86cd799439011',
      platform_id: '507f1f77bcf86cd799439012',
      platform_price: 100,
      platform_commission_percentage: 15,
      platform_fixed_fee: 5,
      platform_shipping_fee: 3
    });
    
    // Total fees should be: fixed(5) + shipping(3) + commission(15% of 100 = 15) = 23
    expect(listing.total_platform_fees).toBe(23);
    
    // Net revenue should be: price(100) - fees(23) = 77
    expect(listing.estimated_net_revenue).toBe(77);
    
    // Test live status
    listing.listing_status = 'Live';
    listing.is_active_on_platform = true;
    expect(listing.is_live_and_active).toBe(true);
  });

  it('should validate listing status enum values', () => {
    const Listing = require('../../models/Listing');
    const schema = Listing.schema;
    const statusField = schema.paths.listing_status;
    
    const expectedValues = [
      'Draft',
      'Pending Review',
      'Live',
      'Rejected',
      'Deactivated'
    ];
    
    expect(statusField.enumValues).toEqual(expectedValues);
  });

  it('should validate compound unique index exists', () => {
    const Listing = require('../../models/Listing');
    const indexes = Listing.schema.indexes();
    
    // Find the compound unique index for product_variant_id and platform_id
    const compoundIndex = indexes.find(index => {
      const keys = Object.keys(index[0]);
      return keys.includes('product_variant_id') && 
             keys.includes('platform_id') && 
             index[1] && index[1].unique === true;
    });
    
    expect(compoundIndex).toBeDefined();
  });

  it('should validate needs_sync virtual field logic', () => {
    const Listing = require('../../models/Listing');
    
    // Test listing with no sync date (should need sync)
    const neverSynced = new Listing({
      product_variant_id: '507f1f77bcf86cd799439011',
      platform_id: '507f1f77bcf86cd799439012'
    });
    expect(neverSynced.needs_sync).toBe(true);
    
    // Test listing synced recently (should not need sync)
    const recentlySynced = new Listing({
      product_variant_id: '507f1f77bcf86cd799439011',
      platform_id: '507f1f77bcf86cd799439012',
      last_synced_at: new Date()
    });
    expect(recentlySynced.needs_sync).toBe(false);
    
    // Test listing synced more than 24 hours ago (should need sync)
    const oldSync = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    const needsSync = new Listing({
      product_variant_id: '507f1f77bcf86cd799439011',
      platform_id: '507f1f77bcf86cd799439012',
      last_synced_at: oldSync
    });
    expect(needsSync.needs_sync).toBe(true);
  });
});
