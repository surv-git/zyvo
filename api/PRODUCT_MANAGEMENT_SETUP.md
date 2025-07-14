# Product Management System Setup Guide

## Overview
This document provides instructions for integrating the new Product Management System into your e-commerce API.

## Files Created

### 1. Product Model (`models/Product.js`)
- **Purpose**: Mongoose schema for conceptual products
- **Key Features**:
  - Automatic slug generation from product name
  - SEO details embedded document
  - Comprehensive validation
  - Efficient indexing for queries
  - Virtual fields for computed properties
  - Static methods for common queries

### 2. Product Controller (`controllers/product.controller.js`)
- **Purpose**: Business logic for product operations
- **Key Features**:
  - Full CRUD operations
  - Pagination and filtering
  - Search functionality
  - Admin audit logging
  - User activity logging
  - Comprehensive error handling

### 3. Product Routes (`routes/product.routes.js`)
- **Purpose**: RESTful API endpoints for product management
- **Key Features**:
  - Input validation with express-validator
  - Authentication and authorization middleware
  - Comprehensive Swagger documentation
  - Proper HTTP status codes

## API Endpoints

### Base URL: `/api/v1/products`

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| POST | `/api/v1/products` | Admin | Create new product |
| GET | `/api/v1/products` | Public | Get all products (paginated) |
| GET | `/api/v1/products/stats` | Admin | Get product statistics |
| GET | `/api/v1/products/:identifier` | Public | Get product by ID or slug |
| PATCH | `/api/v1/products/:id` | Admin | Update product |
| DELETE | `/api/v1/products/:id` | Admin | Soft delete product |

## Integration Steps

### 1. App.js Configuration
The `app.js` file has been updated to include the product routes:

```javascript
// Product routes are now available at /api/v1/products
app.use('/api/v1/products', productRoutes);
```

### 2. Required Dependencies
Ensure these packages are installed:
```bash
npm install express-validator mongoose
```

### 3. Middleware Requirements
The following middleware must be available:
- `authMiddleware` - For user authentication
- `adminAuthMiddleware` - For admin-only routes
- Winston loggers: `userActivityLogger`, `adminAuditLogger`

### 4. Database Requirements
- MongoDB connection must be established
- Category model should exist for category_id references
- Brand model should exist for brand_id references (optional)

## Usage Examples

### Creating a Product (Admin)
```javascript
POST /api/v1/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "MacBook Pro 16-inch",
  "description": "Powerful laptop for professionals",
  "short_description": "Latest MacBook Pro with M2 chip",
  "category_id": "64f8d2b3e4b0a3c5d6e7f8g9",
  "brand_id": "64f8d2b3e4b0a3c5d6e7f8g8",
  "images": [
    "https://example.com/macbook-1.jpg",
    "https://example.com/macbook-2.jpg"
  ],
  "score": 4.8,
  "seo_details": {
    "meta_title": "MacBook Pro 16-inch - Best Laptop for Professionals",
    "meta_description": "Discover the powerful MacBook Pro 16-inch with M2 chip...",
    "meta_keywords": ["macbook", "laptop", "professional", "apple"]
  }
}
```

### Getting Products (Public)
```javascript
GET /api/v1/products?page=1&limit=10&category_id=64f8d2b3e4b0a3c5d6e7f8g9&search=laptop
```

### Getting Product by Slug (Public)
```javascript
GET /api/v1/products/macbook-pro-16-inch
```

### Updating a Product (Admin)
```javascript
PATCH /api/v1/products/64f8d2b3e4b0a3c5d6e7f8g7
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "MacBook Pro 16-inch (Updated)",
  "score": 4.9,
  "is_active": true
}
```

## Key Features

### 1. Automatic Slug Generation
- Slugs are automatically generated from product names
- Handles duplicates by appending numbers (e.g., "product-1", "product-2")
- Regenerated when product name changes

### 2. SEO Optimization
- Embedded SEO details document
- Auto-generated meta titles and descriptions
- Meta keywords array support

### 3. Comprehensive Filtering
- Filter by category, brand, active status
- Search across name, description, and short_description
- Sort by name, creation date, score, update date

### 4. Security & Logging
- Admin actions logged with audit trail
- User activities logged for analytics
- Proper authentication and authorization
- Input validation and sanitization

### 5. Soft Delete
- Products are soft-deleted (is_active = false)
- Maintains data integrity
- Admin can view inactive products

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Validation errors, duplicate entries
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Product not found
- **500 Internal Server Error**: Server errors

## Performance Considerations

### Database Indexes
The Product model includes optimized indexes for:
- Individual fields: name, slug, category_id, brand_id, is_active
- Compound indexes for common query patterns
- Sorting and pagination optimization

### Pagination
- Default page size: 10 items
- Maximum page size: 100 items
- Efficient skip/limit implementation

## Next Steps

1. **Test the API**: Use the provided examples to test all endpoints
2. **Update Documentation**: Run `npm run docs:generate` to update API docs
3. **Create Product Variants**: Implement ProductVariant model for pricing/stock
4. **Add Image Upload**: Implement file upload for product images
5. **Add Reviews**: Implement product review system
6. **Add Inventory**: Link with inventory management system

## Troubleshooting

### Common Issues

1. **Missing Category/Brand**: Ensure Category and Brand models exist
2. **Authentication Errors**: Verify middleware is properly configured
3. **Validation Errors**: Check request body format matches schema
4. **Database Errors**: Ensure MongoDB connection is established

### Testing
```bash
# Run tests
npm test

# Generate documentation
npm run docs:generate

# Start development server
npm run dev
```
