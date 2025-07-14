# User Management System Documentation

## Overview

The User Management System provides comprehensive CRUD operations, advanced search and filtering capabilities, soft/hard delete functionality, and admin dashboard analytics for user management in the e-commerce API.

## Features

### Core User Operations
- **User Registration**: Create new user accounts with validation
- **User Authentication**: JWT-based authentication system
- **Profile Management**: Update user profiles with role-based access
- **Account Deletion**: Both soft delete (deactivation) and hard delete options

### Advanced Search & Filtering
- **Text Search**: Search across name, email, phone, and address fields
- **Role Filtering**: Filter users by role (user, admin)
- **Activity Status**: Filter by active/inactive status
- **Date Range Filtering**: Filter by creation date and last login date
- **Pagination**: Configurable page size and navigation
- **Sorting**: Sort by any field with ascending/descending order

### Admin Dashboard Analytics
- **Registration Trends**: Daily, weekly, monthly, and yearly registration analytics
- **Active Users**: Count of active users within specified time periods
- **Top Users**: Most active users by login count (extensible to orders/reviews)
- **Role Distribution**: Breakdown of users by role

## API Endpoints

### User CRUD Operations

#### Create User (Registration)
```
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "address": "123 Main St, City, State",
  "role": "user"
}
```

#### Get All Users (with search/filter/pagination)
```
GET /api/users?page=1&limit=10&search=john&role=user&is_active=true&sort=createdAt&order=desc
Authorization: Bearer <jwt-token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term (searches name, email, phone, address)
- `role`: Filter by role (user, admin)
- `is_active`: Filter by active status (true, false)
- `min_createdAt`: Minimum creation date
- `max_createdAt`: Maximum creation date
- `min_lastLoginAt`: Minimum last login date
- `max_lastLoginAt`: Maximum last login date
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc, desc - default: desc)

#### Get User by ID
```
GET /api/users/:id
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```
PATCH /api/users/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+1234567890",
  "address": "Updated Address"
}
```

Admin can also update:
- `role`: User role
- `isActive`: Account active status

#### Delete User
```
DELETE /api/users/:id?hard_delete=false
Authorization: Bearer <jwt-token>
```

Query Parameters:
- `hard_delete`: true for permanent deletion (admin only), false for soft delete

### Admin Dashboard Analytics

#### Registration Trends
```
GET /api/admin/users/trends/registrations?period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin-jwt-token>
```

Parameters:
- `period`: daily, weekly, monthly, yearly
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### Active Users Count
```
GET /api/admin/users/trends/active?lastActivityDays=30
Authorization: Bearer <admin-jwt-token>
```

#### Top Users by Activity
```
GET /api/admin/users/trends/top-activity?type=logins&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Role Distribution
```
GET /api/admin/users/trends/roles
Authorization: Bearer <admin-jwt-token>
```

## Authorization & Access Control

### User Roles
- **user**: Regular user with limited access
- **admin**: Administrator with full access

### Access Permissions

#### Regular Users Can:
- Create their own account
- View their own profile
- Update their own profile
- Delete their own account (soft delete only)
- View list of active users (basic info only)

#### Admin Users Can:
- Perform all user operations
- View inactive/deleted users
- Update any user's role and active status
- Perform hard delete operations
- Access all dashboard analytics

## Data Model

### User Schema
```javascript
{
  name: String,           // User full name
  email: String,          // Unique email address
  password: String,       // Hashed password
  role: String,           // 'user' or 'admin'
  phone: String,          // Phone number
  address: String,        // User address
  isActive: Boolean,      // Account active status
  lastLogin: Date,        // Last login timestamp
  loginCount: Number,     // Total login count
  deleted_at: Date,       // Soft delete timestamp
  createdAt: Date,        // Account creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

## Security Features

### Authentication
- JWT-based token authentication
- Token expiration and refresh
- Password hashing with bcrypt
- Login attempt tracking

### Authorization
- Role-based access control
- Resource-level permissions
- Admin-only endpoints protection

### Data Protection
- Password field excluded from responses
- Sensitive data filtering
- Input validation and sanitization

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Usage Examples

### Register New User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "securepassword123",
    "phone": "+1987654321",
    "address": "456 Oak Ave, City, State"
  }'
```

### Search Users with Pagination
```bash
curl -X GET "http://localhost:3000/api/users?search=jane&page=1&limit=5&sort=name&order=asc" \
  -H "Authorization: Bearer your-jwt-token"
```

### Get Registration Trends (Admin)
```bash
curl -X GET "http://localhost:3000/api/admin/users/trends/registrations?period=monthly" \
  -H "Authorization: Bearer admin-jwt-token"
```

## Integration Guide

### Adding to Your Application

1. **Install Dependencies**
```bash
npm install jsonwebtoken bcrypt
```

2. **Import Routes in app.js**
```javascript
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);
app.use('/api/admin', userRoutes);
```

3. **Environment Variables**
```bash
JWT_SECRET=your-secret-key-here
```

4. **Middleware Setup**
Ensure authentication and admin middleware are properly configured in your application.

## Testing

### Unit Tests
Test individual controller functions with mocked dependencies.

### Integration Tests
Test API endpoints with actual database operations.

### Example Test Cases
- User registration with valid/invalid data
- Authentication with valid/invalid tokens
- Search and filtering functionality
- Admin-only endpoint access control
- Soft delete vs hard delete operations

## Future Enhancements

### Planned Features
- Email verification for new accounts
- Password reset functionality
- Two-factor authentication
- User activity logging
- Advanced analytics dashboard
- Bulk user operations
- Export user data functionality

### Extensibility Points
- Custom user fields
- Additional authentication methods
- Integration with external identity providers
- Advanced search operators
- Custom analytics metrics

## Troubleshooting

### Common Issues
1. **JWT Token Errors**: Ensure JWT_SECRET is set in environment variables
2. **Permission Denied**: Check user role and authentication status
3. **Search Not Working**: Verify search parameters and field names
4. **Database Connection**: Ensure MongoDB connection is established

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Contributing

When contributing to the user management system:
1. Follow existing code patterns and naming conventions
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure security best practices are maintained
5. Test all authentication and authorization scenarios
