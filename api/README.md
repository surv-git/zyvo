# Zyvo API Server

A secure Node.js API server built with Express.js that implements security best practices including CORS, CSRF protection, rate limiting, and comprehensive error handling.

## Features

- **Security First**: Implements multiple layers of security including CORS, CSRF protection, Helmet.js, and rate limiting
- **Environment Configuration**: Uses dotenv for environment variable management
- **Database Integration**: MongoDB connection with Mongoose ODM
- **User Management**: Complete user registration, authentication, and profile management
- **Category Management**: Hierarchical category system with unlimited nesting levels
- **Email System**: Professional email service with Gmail SMTP integration
- **Verification System**: Email and phone verification workflows
- **Comprehensive Logging**: HTTP request logging with Morgan, user activity tracking, and admin audit trails
- **Error Handling**: Centralized error handling with detailed error responses
- **Testing Ready**: Jest configuration for unit and integration testing with comprehensive test coverage
- **Production Ready**: Optimized for production deployment

## Security Features

### CORS (Cross-Origin Resource Sharing)
- Configurable origin restrictions
- Credential support for cookies/authorization headers
- Proper headers and methods configuration

### CSRF Protection
- Cross-Site Request Forgery protection using csurf
- Secure session management
- CSRF token endpoint for client-side applications

### Rate Limiting
- Configurable request limits per IP
- Protects against brute force attacks
- Proper rate limit headers

### HTTP Security Headers
- Helmet.js for security headers
- XSS protection
- Content Security Policy
- Frame options protection

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

3. **Set up API documentation**:
   ```bash
   npm run docs:setup
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **View API documentation**:
   ```bash
   # Visit http://localhost:3000/docs
   # Or serve docs directly
   npm run docs:serve
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/zyvo_api |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `SESSION_SECRET` | Session signing secret | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `GMAIL_USER` | Gmail SMTP username | - |
| `GMAIL_APP_PASSWORD` | Gmail app password for SMTP | - |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | - |

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### CSRF Token
```
GET /api/csrf-token
```
Returns CSRF token for client-side applications.

### Authentication
```
POST /api/v1/auth/register        # User registration
POST /api/v1/auth/login           # User login
POST /api/v1/auth/refresh         # Refresh JWT token
POST /api/v1/auth/logout          # User logout
POST /api/v1/auth/forgot-password # Password reset request
POST /api/v1/auth/reset-password  # Password reset
```

### User Management
```
GET    /api/v1/users              # Get all users (admin)
POST   /api/v1/users              # Create user (admin)
GET    /api/v1/users/:id          # Get user by ID
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

### Category Management
```
GET    /api/v1/categories         # Get all categories
POST   /api/v1/categories         # Create category (admin)
GET    /api/v1/categories/tree    # Get category tree
GET    /api/v1/categories/:id     # Get category by ID/slug
PUT    /api/v1/categories/:id     # Update category (admin)
DELETE /api/v1/categories/:id     # Delete category (admin)
```

### Email Verification
```
POST /api/v1/verify/email/send    # Send email verification
POST /api/v1/verify/email/verify  # Verify email code
```

### Phone Verification
```
POST /api/v1/verify/phone/send    # Send phone verification
POST /api/v1/verify/phone/verify  # Verify phone code
```

### Welcome
```
GET /
```
Basic welcome endpoint with server information.
```
Returns CSRF token for client-side applications.

### Welcome
```
GET /
```
Basic welcome endpoint with server information.

## API Documentation

### Overview
This API uses OpenAPI 3.0.0 specification with beautiful Redoc-generated documentation.

### Viewing Documentation
- **Online**: Visit `http://localhost:3000/docs` when the server is running
- **Local serve**: Run `npm run docs:serve` to serve documentation on port 8080
- **Static file**: Open `docs/index.html` directly in your browser

### Documentation Commands

| Command | Description |
|---------|-------------|
| `npm run docs:setup` | Initial setup for documentation system |
| `npm run docs:generate` | Generate OpenAPI specification from JSDoc comments |
| `npm run docs:build` | Build static HTML documentation |
| `npm run docs:serve` | Serve documentation locally |
| `npm run docs:full` | Generate and build in one command |
| `npm run docs:watch` | Watch for changes and auto-regenerate |

### Writing Documentation
API endpoints are documented using JSDoc comments with `@swagger` tags. Example:

```javascript
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
```

For detailed documentation guidelines, see `docs/README.md`.

## Project Structure

```
/Users/surv/Work/zyvo/api/
├── app.js                         # Main application file
├── server.js                      # Server startup file
├── package.json                   # Dependencies and scripts
├── .env.example                   # Environment variables template
├── jest.config.js                 # Jest testing configuration
├── __tests__/                     # Test files
│   ├── setup.js                   # Jest setup file
│   └── controllers/               # Controller tests
│       ├── user.controller.test.js
│       ├── auth.controller.test.js
│       └── category.controller.test.js
├── routes/                        # API route definitions
│   ├── auth.routes.js            # Authentication routes
│   ├── user.routes.js            # User management routes
│   ├── category.routes.js        # Category management routes
│   └── verification.routes.js    # Email/phone verification routes
├── controllers/                   # Route controllers
│   ├── auth.controller.js        # Authentication logic
│   ├── user.controller.js        # User management logic
│   └── category.controller.js    # Category management logic
├── models/                        # Database models
│   ├── User.js                   # User model with verification
│   └── Category.js               # Hierarchical category model
├── middleware/                    # Custom middleware
│   ├── auth.middleware.js        # Authentication middleware
│   └── validation.middleware.js  # Input validation middleware
├── utils/                         # Utility functions
│   ├── sendVerificationEmail.js  # Email verification utilities
│   └── sendVerificationSMS.js    # SMS verification utilities
├── loggers/                       # Winston logging system
│   ├── userActivity.logger.js    # User activity logging
│   └── adminAudit.logger.js      # Admin audit logging
├── seeders/                       # Database seeders
│   ├── userSeeder.js             # User data seeder
│   └── categorySeeder.js         # Category data seeder
└── docs/                          # Documentation
    ├── README.md                 # Documentation guide
    ├── TESTING_GUIDE.md          # Testing documentation
    └── API_DOCUMENTATION.md      # API reference
```

## Security Considerations

1. **Environment Variables**: Always use environment variables for sensitive configuration
2. **HTTPS**: Use HTTPS in production (configured via reverse proxy)
3. **Database Security**: Use MongoDB authentication and connection encryption
4. **Rate Limiting**: Adjust rate limits based on your application needs
5. **Session Security**: Use secure session configuration in production
6. **CSRF Tokens**: Implement CSRF token validation in client applications

## Development

### Adding New Routes

1. Create route files in the `routes/` directory
2. Create corresponding controllers in the `controllers/` directory
3. Import and use routes in `app.js`

Example:
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);

module.exports = router;
```

### Adding Models

Create Mongoose models in the `models/` directory:

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
```

## Testing

The project is configured with Jest for testing. Test files should be placed in:
- `__tests__/` directory
- Files ending with `.test.js` or `.spec.js`

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure secure environment variables
3. Use a process manager like PM2
4. Set up reverse proxy with Nginx/Apache
5. Configure SSL certificates
6. Set up monitoring and logging

## Database Seeding

### Overview
The API includes a comprehensive database seeding system for generating realistic test data with proper table dependencies.

### Quick Start

```bash
# Check database status
npm run db:status

# Seed all tables (handles dependencies automatically)
npm run seed:all

# Seed specific tables
npm run seed:users
npm run seed:products
npm run seed:orders

# Clean all data
npm run clean:all

# Reset database (clean and seed)
npm run db:reset
```

### Available Seeders

| Seeder | Dependencies | Records | Description |
|--------|-------------|---------|-------------|
| `users` | None | ~50 | User accounts with admin/test users |
| `products` | users | ~100 | Product catalog with 8 categories |
| `orders` | users, products | ~200 | Order history with realistic workflow |

### Test Accounts

The seeder creates default test accounts:
- **Admin**: `admin@zyvo.com` / `admin123`
- **Test User**: `test@zyvo.com` / `test123`

### Dependency Management

The seeder automatically handles table dependencies:
- **Seeding**: Dependencies are seeded first
- **Cleaning**: Dependencies are cleaned in reverse order
- **Validation**: Warns if dependencies are missing

For detailed documentation, see `seeders/README.md`.

## License

ISC License
