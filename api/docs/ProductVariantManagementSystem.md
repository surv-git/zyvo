# Product Variant Management System

## Overview

The Product Variant Management System provides comprehensive functionality to handle different purchasable versions (SKUs) of products based on combinations of options. This system enables e-commerce platforms to manage complex product catalogs with multiple variants such as size, color, style, and other configurable attributes.

## Architecture

### Core Components

1. **ProductVariant Model** (`models/ProductVariant.js`)
2. **ProductVariant Controller** (`controllers/productVariant.controller.js`)
3. **ProductVariant Routes** (`routes/productVariant.routes.js`)
4. **Test Suite** (`test-product-variant-system.js`)

## Features

### ✅ Model Features

- **Unique SKU Management**: Each variant has a unique SKU code for inventory tracking
- **Option Combination Validation**: Prevents duplicate variants with the same option combinations
- **Automatic Slug Generation**: SEO-friendly URLs generated automatically
- **Dynamic Pricing**: Support for base price and discount pricing
- **Physical Attributes**: Dimensions, weight, packaging, and shipping costs
- **Media Management**: Image URLs for variant-specific photos
- **Status Management**: Active/inactive status with soft delete functionality
- **Timestamps**: Automatic creation and update timestamp tracking

### ✅ Advanced Functionality

- **Virtual Fields**: Calculated fields for effective price, savings, and discount percentages
- **Static Methods**: Convenient querying methods for common operations
- **Instance Methods**: Variant-specific operations like discount management
- **Pre-save Validation**: Automatic data validation and slug generation
- **Compound Indexing**: Optimized database queries for performance

### ✅ API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| POST | `/api/product-variants` | Admin | Create new product variant |
| GET | `/api/product-variants` | Public | List variants with filtering/pagination |
| GET | `/api/product-variants/stats` | Admin | Get variant statistics |
| GET | `/api/product-variants/:identifier` | Public | Get specific variant by ID or SKU |
| PATCH | `/api/product-variants/:id` | Admin | Update existing variant |
| DELETE | `/api/product-variants/:id` | Admin | Delete variant |

## Data Structure

### ProductVariant Schema

```javascript
{
  // Core identification
  product_id: ObjectId,           // Reference to parent product
  option_values: [ObjectId],      // Array of option references
  sku_code: String,               // Unique inventory code
  
  // Pricing
  price: Number,                  // Base price
  discount_details: {
    price: Number,                // Discounted price
    percentage: Number,           // Discount percentage
    end_date: Date,              // Discount expiration
    is_on_sale: Boolean          // Sale status
  },
  
  // SEO
  slug: String,                   // URL-friendly identifier
  
  // Physical properties
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String                  // 'cm' or 'in'
  },
  weight: {
    value: Number,
    unit: String                  // 'g', 'kg', 'lb', 'oz'
  },
  
  // Costs
  packaging_cost: Number,
  shipping_cost: Number,
  
  // Media
  images: [String],              // Image URLs
  
  // Status
  is_active: Boolean,
  sort_order: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## API Usage Examples

### Create Product Variant

```javascript
POST /api/product-variants
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "product_id": "507f1f77bcf86cd799439011",
  "option_values": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "sku_code": "TSHIRT-RED-L",
  "price": 29.99,
  "discount_details": {
    "price": 24.99,
    "percentage": 17,
    "is_on_sale": true,
    "end_date": "2024-12-31T23:59:59.000Z"
  },
  "dimensions": {
    "length": 70,
    "width": 50,
    "height": 2,
    "unit": "cm"
  },
  "weight": {
    "value": 200,
    "unit": "g"
  },
  "images": ["https://example.com/tshirt-red-large.jpg"]
}
```

### List Product Variants with Filtering

```javascript
GET /api/product-variants?product_id=507f1f77bcf86cd799439011&is_on_sale=true&limit=20&page=1
```

### Get Variant by SKU

```javascript
GET /api/product-variants/TSHIRT-RED-L
```

### Update Variant

```javascript
PATCH /api/product-variants/507f1f77bcf86cd799439014
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "price": 27.99,
  "discount_details": {
    "price": 22.99,
    "percentage": 18,
    "is_on_sale": true
  }
}
```

## Model Methods

### Static Methods

- `findByProductId(productId, includeInactive)` - Find all variants for a product
- `findBySKU(skuCode, includeInactive)` - Find variant by SKU code
- `findOnSale(includeInactive)` - Find all variants currently on sale
- `searchBySKU(searchTerm, includeInactive)` - Search variants by SKU pattern

### Instance Methods

- `softDelete()` - Mark variant as inactive
- `activate()` - Mark variant as active
- `updateDiscount(discountData)` - Apply discount to variant
- `clearDiscount()` - Remove discount from variant

### Virtual Fields

- `effective_price` - Current selling price (discounted or regular)
- `savings` - Amount saved if on sale
- `discount_percentage_calculated` - Actual discount percentage

## Validation Rules

### Required Fields
- `product_id` - Must reference existing product
- `option_values` - Array of valid option references
- `sku_code` - 3-50 characters, unique, alphanumeric
- `price` - Positive number

### Unique Constraints
- `sku_code` - Must be unique across all variants
- `product_id + option_values` - Combination must be unique
- `slug` - Auto-generated, must be unique

### Business Rules
- Option combinations cannot duplicate within the same product
- Discount prices cannot exceed base prices
- Discount percentages must be 0-100%
- Physical dimensions cannot be negative

## Database Indexes

### Primary Indexes
- `sku_code` (unique)
- `slug` (unique)
- `product_id + option_values` (compound unique)

### Query Optimization Indexes
- `product_id + is_active`
- `is_active + discount_details.is_on_sale`
- `price + is_active`
- `createdAt` (descending)
- `sort_order + createdAt`

## Error Handling

### Common Error Codes
- `400` - Invalid input data
- `404` - Variant not found
- `409` - Duplicate SKU or option combination
- `422` - Validation error
- `500` - Server error

### Error Response Format
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "code": "ERROR_CODE"
}
```

## Performance Metrics

### Benchmark Results (from test suite)
- **Bulk Creation**: 50 variants created in ~59ms
- **Complex Queries**: 50 variants queried with population in ~4ms
- **Memory Usage**: Efficient with proper indexing
- **Concurrent Operations**: Supports parallel operations

## Integration Points

### Dependencies
- **Product Model**: Parent product reference
- **Option Model**: Option value references
- **Authentication**: Admin/user middleware
- **Logging**: Winston audit and activity logging
- **Validation**: express-validator integration

### Related Systems
- Inventory Management
- Order Processing
- Shopping Cart
- Product Catalog
- Pricing Engine

## Best Practices

### Development
1. Always populate option_values and product_id for display
2. Use static methods for common queries
3. Leverage virtual fields for calculated values
4. Handle unique constraint errors gracefully
5. Use proper indexing for query optimization

### Production
1. Monitor slug generation performance
2. Implement caching for frequently accessed variants
3. Use aggregation pipelines for complex reporting
4. Regular index maintenance
5. Backup critical variant data

## Testing

The system includes comprehensive test coverage:

- ✅ Variant creation and validation
- ✅ Unique constraint enforcement
- ✅ Automatic slug generation
- ✅ Static method functionality
- ✅ Virtual field calculations
- ✅ Instance method operations
- ✅ Complex queries and aggregation
- ✅ Performance benchmarking

Run tests with: `node test-product-variant-system.js`

## Future Enhancements

### Planned Features
- Inventory tracking integration
- Bulk import/export functionality
- Advanced reporting and analytics
- Multi-currency pricing support
- Seasonal pricing rules
- Image optimization integration

### Performance Optimizations
- Redis caching layer
- Database query optimization
- Bulk operation improvements
- Real-time inventory updates

## Support

For technical support or feature requests, please refer to the API documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
