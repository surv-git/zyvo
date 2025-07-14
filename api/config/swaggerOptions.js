/**
 * Swagger/OpenAPI Configuration
 * Configuration for swagger-jsdoc to generate OpenAPI 3.0.0 specification
 */

const path = require('path');

/**
 * OpenAPI 3.0.0 specification configuration
 * This configuration defines the metadata for the API documentation
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zyvo API',
      version: '1.0.0',
      description: `
        A secure Node.js API server built with Express.js that implements 
        security best practices including CORS, CSRF protection, rate limiting, 
        and comprehensive error handling.
        
        ## Features
        - JWT Authentication
        - Role-based Access Control
        - Rate Limiting
        - CSRF Protection
        - Input Validation
        - Comprehensive Error Handling
        
        ## Security
        This API implements multiple layers of security:
        - CORS with configurable origins
        - CSRF token validation
        - Rate limiting per IP
        - Secure HTTP headers via Helmet.js
        - Input sanitization and validation
      `,
      contact: {
        name: 'Zyvo API Support',
        email: 'support@zyvo.com',
        url: 'https://zyvo.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.zyvo.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF token for protection against CSRF attacks'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '64a1b2c3d4e5f6789abcdef0'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              minLength: 1,
              maxLength: 100,
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Role of the user',
              default: 'user',
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
              default: true,
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of the last login',
              example: '2025-07-12T10:30:00.000Z'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2025-07-12T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account last update timestamp',
              example: '2025-07-12T10:30:00.000Z'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the product',
              example: '64a1b2c3d4e5f6789abcdef1'
            },
            name: {
              type: 'string',
              description: 'Name of the product',
              minLength: 1,
              maxLength: 200,
              example: 'Premium Wireless Headphones'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the product',
              maxLength: 2000,
              example: 'High-quality wireless headphones with noise cancellation'
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Price of the product in USD',
              example: 299.99
            },
            category: {
              type: 'string',
              description: 'Product category',
              example: 'Electronics'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              description: 'Available stock quantity',
              example: 50
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Product tags for categorization',
              example: ['wireless', 'audio', 'premium']
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri'
              },
              description: 'Product image URLs',
              example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the product is active/available',
              default: true,
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Product creation timestamp',
              example: '2025-07-12T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Product last update timestamp',
              example: '2025-07-12T10:30:00.000Z'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the category',
              example: '64a1b2c3d4e5f6789abcdef2'
            },
            name: {
              type: 'string',
              description: 'Name of the category',
              minLength: 1,
              maxLength: 100,
              example: 'Electronics'
            },
            description: {
              type: 'string',
              description: 'Description of the category',
              maxLength: 500,
              example: 'Electronic devices and accessories'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly slug for the category',
              example: 'electronics'
            },
            parent_category: {
              type: 'string',
              description: 'Parent category ID for hierarchical structure',
              example: '64a1b2c3d4e5f6789abcdef1'
            },
            image_url: {
              type: 'string',
              format: 'uri',
              description: 'Category image URL',
              example: 'https://example.com/electronics.jpg'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the category is active',
              default: true,
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation timestamp',
              example: '2025-07-12T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category last update timestamp',
              example: '2025-07-12T10:30:00.000Z'
            }
          }
        },
        CategoryTree: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID',
              example: '64a1b2c3d4e5f6789abcdef2'
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Electronics'
            },
            slug: {
              type: 'string',
              description: 'Category slug',
              example: 'electronics'
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Electronic devices and accessories'
            },
            image_url: {
              type: 'string',
              format: 'uri',
              description: 'Category image URL',
              example: 'https://example.com/electronics.jpg'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CategoryTree'
              },
              description: 'Child categories'
            }
          }
        },
        CategoryStats: {
          type: 'object',
          properties: {
            totalCategories: {
              type: 'integer',
              description: 'Total number of categories',
              example: 50
            },
            activeCategories: {
              type: 'integer',
              description: 'Number of active categories',
              example: 45
            },
            inactiveCategories: {
              type: 'integer',
              description: 'Number of inactive categories',
              example: 5
            },
            rootCategories: {
              type: 'integer',
              description: 'Number of root categories',
              example: 10
            },
            categoriesWithChildren: {
              type: 'integer',
              description: 'Number of categories with child categories',
              example: 15
            },
            categoriesWithoutChildren: {
              type: 'integer',
              description: 'Number of categories without child categories',
              example: 30
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 5
            },
            totalItems: {
              type: 'integer',
              description: 'Total number of items',
              example: 47
            },
            itemsPerPage: {
              type: 'integer',
              description: 'Number of items per page',
              example: 10
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Whether there is a next page',
              example: true
            },
            hasPrevPage: {
              type: 'boolean',
              description: 'Whether there is a previous page',
              example: false
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            details: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Detailed error information',
              example: ['Name is required', 'Email must be valid']
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 400
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
              example: '2025-07-12T10:30:00.000Z'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
              example: '2025-07-12T10:30:00.000Z'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              description: 'Current page number',
              example: 1
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Number of items per page',
              example: 10
            },
            total: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of items',
              example: 100
            },
            totalPages: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of pages',
              example: 10
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
              example: true
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
              example: false
            }
          }
        }
      },
      responses: {
        400: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        404: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        429: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Categories',
        description: 'Category management operations with hierarchical structure'
      },
      {
        name: 'Products',
        description: 'Product catalog operations'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    // Path to route files to scan for JSDoc comments
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/**/*.js'),
    // Include the main app file for general endpoints
    path.join(__dirname, '../app.js')
  ]
};

module.exports = swaggerOptions;
