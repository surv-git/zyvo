# Option Management System Documentation

## Overview
The Option Management System handles product options (types and values) for the e-commerce API. This system manages option types like Color, Size, Weight, etc., and their corresponding values (Red, Large, 500g, etc.).

## Features

### Core Functionality
- **CRUD Operations**: Create, read, update, and delete options
- **Option Types**: Organize options by type (Color, Size, Weight, etc.)
- **Unique Combinations**: Prevents duplicate option_type + option_value combinations
- **Automatic Slug Generation**: URL-friendly identifiers generated automatically
- **Soft Delete**: Options are deactivated rather than permanently deleted
- **Sort Order**: Custom ordering within option types

### Advanced Features
- **Pagination**: Efficient handling of large option lists
- **Search**: Search across option names, values, and types
- **Filtering**: Filter by option type, active status, etc.
- **Option Types Endpoint**: Get organized list of all option types with their values
- **Statistics**: Admin-only endpoint for option analytics

## API Endpoints

### Public Endpoints
- `GET /api/options` - List all active options with pagination and filtering
- `GET /api/options/:id` - Get a single option by ID
- `GET /api/options/types` - Get all option types with their values

### Admin-Only Endpoints
- `POST /api/options` - Create a new option
- `PATCH /api/options/:id` - Update an option
- `DELETE /api/options/:id` - Soft delete an option
- `GET /api/options/stats` - Get option statistics

## Data Model

### Option Schema
```javascript
{
  option_type: String,     // e.g., "Color", "Size", "Weight"
  option_value: String,    // e.g., "Red", "Large", "500g"
  name: String,           // Display name (defaults to option_value)
  slug: String,           // Auto-generated URL-friendly identifier
  is_active: Boolean,     // Active status (default: true)
  sort_order: Number,     // Sort order within type (default: 0)
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- Compound unique index on `option_type` + `option_value`
- Unique index on `slug`
- Index on `option_type` for efficient filtering
- Index on `is_active` for active/inactive filtering

## Usage Examples

### Creating Options
```json
POST /api/options
{
  "option_type": "Color",
  "option_value": "Red",
  "name": "Bright Red",
  "sort_order": 1
}
```

### Searching and Filtering
```
GET /api/options?option_type=Color&search=red&page=1&limit=10&sort=sort_order
```

### Getting Option Types
```
GET /api/options/types
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "option_type": "Color",
      "values": [
        {
          "_id": "...",
          "option_value": "Red",
          "name": "Bright Red",
          "slug": "color-red",
          "sort_order": 1
        }
      ]
    }
  ]
}
```

## Security & Logging

### Authentication
- Public endpoints: No authentication required (only shows active options)
- Admin endpoints: JWT authentication with admin role required

### Logging
- **User Activity Logger**: Logs all public GET operations
- **Admin Audit Logger**: Logs all admin create/update/delete operations
- **Comprehensive Tracking**: Includes user details, IP addresses, and change details

### Validation
- Input sanitization and validation on all endpoints
- MongoDB injection protection
- Rate limiting applied to all endpoints

## Integration with Product System

The Option Management System is designed to work with ProductVariants:

1. **Option Selection**: Products can have multiple variants based on option combinations
2. **Inventory Management**: Each variant can have its own stock levels and pricing
3. **User Experience**: Options provide structured choices for customers

### Example Product Variant Structure
```javascript
{
  product_id: ObjectId,
  options: [
    { option_id: ObjectId("color-red-id"), option_type: "Color", option_value: "Red" },
    { option_id: ObjectId("size-large-id"), option_type: "Size", option_value: "Large" }
  ],
  sku: "PROD-RED-LARGE",
  price: 29.99,
  stock_quantity: 50
}
```

## Performance Considerations

1. **Indexing**: Proper indexes for efficient queries on option_type and active status
2. **Pagination**: Prevents large result sets from overwhelming the API
3. **Caching**: Consider implementing Redis caching for frequently accessed option types
4. **Aggregation**: Use MongoDB aggregation for complex statistics and reporting

## Maintenance

### Bulk Operations
For large datasets, consider implementing bulk operations:
- Bulk import of options from CSV
- Bulk update of sort orders
- Bulk activation/deactivation

### Data Migration
When adding new option types or restructuring:
- Use migration scripts to update existing data
- Maintain backward compatibility during transitions
- Test thoroughly in staging environment

## Monitoring

### Key Metrics
- Number of active options by type
- Most frequently used option types
- Option creation/update frequency
- API response times

### Health Checks
- Verify index effectiveness
- Monitor query performance
- Check data consistency

## Future Enhancements

1. **Option Groups**: Group related options (e.g., "Physical Attributes")
2. **Option Dependencies**: Some options depend on others (e.g., Size depends on Category)
3. **Localization**: Multi-language support for option names
4. **Rich Media**: Support for option images (color swatches, size charts)
5. **Price Modifiers**: Options that affect product pricing

This documentation provides a comprehensive guide to the Option Management System, enabling developers to effectively use and maintain the system.
