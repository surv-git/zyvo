# Project Structure and File Naming Conventions

## Overview
This document outlines the file organization and naming conventions used in the Zyvo API project.

## File Naming Conventions

### Controllers
- Pattern: `[name].controller.js`
- Examples: `auth.controller.js`, `user.controller.js`, `product.controller.js`
- Location: `/controllers/`

### Routes
- Pattern: `[name].routes.js`
- Examples: `auth.routes.js`, `user.routes.js`, `product.routes.js`
- Location: `/routes/`

### Models
- Pattern: `[Name].js` (PascalCase)
- Examples: `User.js`, `Product.js`, `Order.js`
- Location: `/models/`

### Middleware
- Pattern: `[name].middleware.js`
- Examples: `logging.middleware.js`, `auth.middleware.js`
- Location: `/middleware/`

### Loggers
- Pattern: `[name].logger.js`
- Examples: `userActivity.logger.js`, `adminAudit.logger.js`
- Location: `/loggers/`

### Utils
- Pattern: `[name].utils.js`
- Examples: `email.utils.js`, `validation.utils.js`
- Location: `/utils/`

### Tests
- Pattern: `[name].[type].test.js`
- Examples: `auth.controller.test.js`, `user.model.test.js`
- Location: `/__tests__/`

### Configuration
- Pattern: `[name].config.js`
- Examples: `database.config.js`, `redis.config.js`
- Location: `/config/`

## Directory Structure

```
/Users/surv/Work/zyvo/api/
├── __tests__/                    # Test files
│   ├── controllers/
│   │   ├── auth.controller.test.js
│   │   └── user.controller.test.js
│   └── setup.js                  # Test setup configuration
├── config/                       # Configuration files
│   ├── database.config.js
│   └── redis.config.js
├── controllers/                  # Request handlers
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── product.controller.js
│   └── user.controller.js
├── docs/                         # Documentation
│   ├── AUTHENTICATION.md
│   ├── EMAIL_PHONE_VERIFICATION.md
│   ├── EMAIL_SERVICE_IMPLEMENTATION.md  # ✨ NEW: Email service guide
│   ├── HOW_TO_RUN_TESTS.md
│   ├── PROJECT_STRUCTURE.md
│   ├── README.md
│   ├── TESTING_GUIDE.md
│   ├── USER_MANAGEMENT.md
│   ├── VERIFICATION_SYSTEM.md
│   ├── WINSTON_LOGGING_IMPLEMENTATION_SUMMARY.md
│   ├── WINSTON_LOGGING_SYSTEM.md
│   ├── index.html
│   ├── openapi.json
│   └── openapi.yaml
├── examples/                     # Example scripts and demos
│   ├── email-service-demo.js     # ✨ NEW: Email service demo
│   └── logging-demo.js
├── loggers/                      # Winston logger configurations
│   ├── adminAudit.logger.js
│   └── userActivity.logger.js
├── logs/                         # Generated log files
│   ├── admin_audit-YYYY-MM-DD.log
│   ├── user_activity-YYYY-MM-DD.log
│   └── [various exception logs]
├── middleware/                   # Express middleware
│   └── logging.middleware.js
├── models/                       # Database models
│   ├── Order.js
│   ├── Product.js
│   └── User.js
├── routes/                       # API routes
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── productDemo.routes.js
│   └── user.routes.js
├── scripts/                      # Utility scripts
│   ├── generateDocs.js
│   ├── setup-auth.js
│   ├── setup-docs.js
│   └── setup-user-management.js
├── seeders/                      # Database seeders
│   ├── data/
│   │   ├── orderSeeder.js
│   │   ├── productSeeder.js
│   │   └── userSeeder.js
│   ├── README.md
│   └── seeder.js
├── utils/                        # Utility functions
│   ├── generateTokens.js         # JWT token generation
│   ├── sendEmail.js              # ✨ Email service utilities
│   ├── sendVerificationEmail.js  # ✨ Email verification utilities
│   ├── sendVerificationSMS.js    # SMS verification utilities
│   └── [other utility files]
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
├── app.js                        # Main application entry point
├── jest.config.js                # Jest testing configuration
├── package.json                  # Node.js dependencies
└── package-lock.json             # Locked dependency versions
```

## Import Patterns

### Controller Imports
```javascript
// In routes
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');

// In tests
const authController = require('../../controllers/auth.controller');
```

### Route Imports
```javascript
// In app.js
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
```

### Model Imports
```javascript
// In controllers
const User = require('../models/User');
const Product = require('../models/Product');
```

### Middleware Imports
```javascript
// In app.js or routes
const loggingMiddleware = require('./middleware/logging.middleware');
const authMiddleware = require('./middleware/auth.middleware');
```

### Logger Imports
```javascript
// In controllers or middleware
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
```

### Utils Imports
```javascript
// In controllers
const emailUtils = require('../utils/email.utils');
const validationUtils = require('../utils/validation.utils');
```

## Naming Guidelines

### General Rules
1. Use **camelCase** for variable names and function names
2. Use **PascalCase** for class names and model names
3. Use **kebab-case** with dots for file names (e.g., `auth.controller.js`)
4. Use **UPPER_SNAKE_CASE** for constants and environment variables
5. Use descriptive names that clearly indicate purpose

### File Naming Best Practices
1. **Be specific**: `auth.controller.js` instead of `controller.js`
2. **Use consistent extensions**: Always use `.js` for JavaScript files
3. **Group related files**: Put all controllers in `/controllers/`
4. **Use meaningful prefixes**: `test.` for test files, `example.` for examples
5. **Avoid abbreviations**: Use full words for clarity

### Directory Organization
1. **Group by function**: Controllers, routes, models in separate directories
2. **Keep flat structure**: Avoid deep nesting when possible
3. **Use plural names**: `/controllers/`, `/routes/`, `/models/`
4. **Separate concerns**: Tests, docs, examples in their own directories

## Clean Code Principles

### File Organization
1. **Single Responsibility**: Each file should have one clear purpose
2. **Consistent Structure**: Similar files should follow the same pattern
3. **Clear Dependencies**: Import statements should be at the top
4. **Logical Grouping**: Related functionality should be grouped together

### Maintenance
1. **Remove unused files**: Regularly clean up obsolete files
2. **Update imports**: Keep import statements current when renaming files
3. **Document changes**: Update documentation when structure changes
4. **Test after changes**: Ensure all imports work after restructuring

## Migration Notes

### Recent Changes
- Renamed `userActivityLogger.js` → `userActivity.logger.js`
- Renamed `adminAuditLogger.js` → `adminAudit.logger.js`
- Renamed `loggingMiddleware.js` → `logging.middleware.js`
- Renamed `products.js` → `product.routes.js`
- Renamed `productRoutes.js` → `productDemo.routes.js`
- Renamed `adminRoutes.js` → `admin.routes.js`
- Renamed `adminController.js` → `admin.controller.js`
- Renamed `productController.js` → `product.controller.js`
- Moved `demo-logging.js` → `examples/logging-demo.js`
- Removed duplicate files: `auth.js`, `authController.js`, `debug_test.js`

### Updated Import Statements
All import statements have been updated to reflect the new file names and locations.

## Benefits of This Structure

1. **Predictability**: Developers can easily find files based on naming patterns
2. **Maintainability**: Consistent structure makes code easier to maintain
3. **Scalability**: Clear organization supports project growth
4. **Collaboration**: Team members can quickly understand project structure
5. **Automation**: Build tools and scripts can rely on consistent patterns

This structure follows Node.js and Express.js best practices while maintaining clarity and organization for the Zyvo API project.
