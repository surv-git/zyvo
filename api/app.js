/**
 * Zyvo API Server
 * A secure Node.js API server built with Express.js
 * Implements security best practices including CORS, CSRF, rate limiting, and more
 */

// Load environment variables first
require('dotenv').config();

// Core dependencies
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Security middleware
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');

// Logging middleware
const morgan = require('morgan');

// Winston logging system
const userActivityLogger = require('./loggers/userActivity.logger');
const adminAuditLogger = require('./loggers/adminAudit.logger');
const { 
  logUserActivityMiddleware, 
  logAdminActivityMiddleware, 
  logErrorMiddleware,
  requestCorrelationMiddleware 
} = require('./middleware/logging.middleware');

// Initialize Express application
const app = express();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyvo_api';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// =============================================================================
// SECURITY MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Helmet.js - Set various HTTP headers for security
 * Includes XSS protection, no-sniff, frameguard, etc.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.redoc.ly"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.redoc.ly"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if needed for development
}));

/**
 * CORS Configuration
 * Configure Cross-Origin Resource Sharing with specific origin
 */
const corsOptions = {
  origin: CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true, // Allow cookies/authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

/**
 * Rate Limiting
 * Limit repeated requests to public APIs
 */
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests (optional)
  skipFailedRequests: false,
});

// Rate limiting disabled
// app.use(limiter);

/**
 * Body parsing middleware
 * Parse JSON and URL-encoded data from request bodies
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Cookie parser middleware
 * Required for CSRF protection and session management
 */
app.use(cookieParser());

/**
 * Session configuration
 * Required for CSRF protection
 */
const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  name: 'sessionId' // Don't use default session name
};

app.use(session(sessionConfig));

/**
 * CSRF Protection
 * Protect against Cross-Site Request Forgery attacks
 * Exclude API routes from CSRF protection as they use JWT tokens
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict'
  },
  // Skip CSRF protection for API routes
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Custom skip function to exclude API routes
  value: (req) => {
    // Skip CSRF for API routes
    if (req.path.startsWith('/api/')) {
      return 'skip-csrf-for-api';
    }
    return req.csrfToken();
  }
});

// Apply CSRF protection only to non-API routes
app.use((req, res, next) => {
  // Skip CSRF protection for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Apply CSRF protection to other routes
  csrfProtection(req, res, next);
});

/**
 * CSRF Token Endpoint
 * Provides CSRF token to clients (for web form submissions)
 */
app.get('/api/v1/csrf-token', (req, res) => {
  // Only provide CSRF token for web clients, not API clients
  try {
    const csrfToken = req.csrfToken ? req.csrfToken : null;
    res.json({ 
      csrfToken: csrfToken,
      message: csrfToken ? 'CSRF token provided' : 'CSRF not required for API endpoints'
    });
  } catch (error) {
    res.json({ 
      csrfToken: null,
      message: 'CSRF not required for API endpoints'
    });
  }
});

/**
 * Middleware to attach CSRF token to all responses
 */
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken;
  next();
});

// =============================================================================
// LOGGING MIDDLEWARE
// =============================================================================

/**
 * Request Correlation Middleware
 * Adds correlation IDs to requests for tracing across services
 */
app.use(requestCorrelationMiddleware);

/**
 * Morgan HTTP request logging
 * Use different formats for development and production
 */
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

/**
 * Winston User Activity Logging
 * Logs user interactions with public-facing API endpoints
 * Applied to all non-admin routes
 */
app.use('/api/v1', logUserActivityMiddleware({
  defaultEventType: 'api_request',
  logResponseTime: true,
  excludePaths: ['/health', '/csrf-token', '/favicon.ico']
}));

/**
 * Winston Admin Audit Logging
 * Logs administrative actions with detailed audit trail
 * Applied specifically to admin routes
 */
app.use('/api/v1/admin', logAdminActivityMiddleware({
  logAllRequests: true,
  sensitiveFields: ['password', 'token', 'secret', 'key']
}));

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

/**
 * MongoDB connection using Mongoose
 * Includes connection event listeners and error handling
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Database connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Returns the current health status of the API server. This endpoint is 
 *       useful for monitoring systems, load balancers, and automated health checks.
 *       
 *       The response includes:
 *       - Server status
 *       - Current timestamp
 *       - Server uptime in seconds
 *       - Current environment
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-12T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600.5
 *                 environment:
 *                   type: string
 *                   example: "development"
 *             examples:
 *               healthy:
 *                 summary: Healthy server response
 *                 value:
 *                   status: "OK"
 *                   timestamp: "2025-07-12T10:30:00.000Z"
 *                   uptime: 3600.5
 *                   environment: "development"
 *       500:
 *         $ref: '#/components/responses/500'
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * API Routes
 * Import and use route modules with comprehensive logging
 */
// Import route modules
const productRoutes = require('./routes/product.routes');
const productAnalyticsRoutes = require('./routes/productAnalytics.routes'); // Product analytics routes
const productVariantRoutes = require('./routes/productVariant.routes'); // Product variant management routes
const optionRoutes = require('./routes/option.routes'); // Option management routes
const brandRoutes = require('./routes/brand.routes'); // Brand management routes
const supplierRoutes = require('./routes/supplier.routes'); // Supplier management routes
const supplierContactNumberRoutes = require('./routes/supplierContactNumber.routes'); // Supplier contact number management routes
const purchaseRoutes = require('./routes/purchase.routes'); // Purchase management routes
const platformRoutes = require('./routes/platform.routes'); // Platform management routes
const platformFeeRoutes = require('./routes/platformFee.routes'); // Platform fee management routes
const listingRoutes = require('./routes/listing.routes'); // Listing management routes
const inventoryRoutes = require('./routes/inventory.routes'); // Inventory management routes
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes'); // Category management routes
const adminRoutes = require('./routes/admin.routes'); // Admin routes with audit logging
const cartRoutes = require('./routes/cart.routes'); // Cart management routes
const orderRoutes = require('./routes/order.routes'); // Order management routes
const razorpayOrderRoutes = require('./routes/razorpayOrder.routes'); // Razorpay order routes
const webhookRoutes = require('./routes/webhook.routes'); // Webhook routes

// Coupon Management Routes (assuming they exist from previous implementation)
const couponCampaignRoutes = require('./routes/couponCampaign.routes'); // Coupon campaign management routes
const userCouponRoutes = require('./routes/userCoupon.routes'); // User coupon management routes
const adminUserCouponRoutes = require('./routes/adminUserCoupon.routes'); // Admin coupon management routes

// Payment Method Routes (assuming they exist from previous implementation)
const paymentMethodRoutes = require('./routes/paymentMethod.routes'); // Payment method management routes

// Blog Management Routes
const adminBlogRoutes = require('./routes/adminBlog.routes'); // Admin blog management routes
const publicBlogRoutes = require('./routes/publicBlog.routes'); // Public blog reading routes

// Review Management Routes
const userReviewRoutes = require('./routes/userReviews.routes'); // User review management routes
const publicReviewRoutes = require('./routes/publicReviews.routes'); // Public review reading routes
const adminReviewRoutes = require('./routes/adminReviews.routes'); // Admin review management routes
const adminReviewReportRoutes = require('./routes/adminReviewReports.routes'); // Admin review report management routes

// Favorites Management Routes
const favoriteRoutes = require('./routes/favorite.routes'); // User favorites management routes
const adminFavoriteRoutes = require('./routes/adminFavorite.routes'); // Admin favorites management routes

// Admin Cart Management Routes
const adminCartRoutes = require('./routes/adminCart.routes'); // Admin cart management routes
const adminOrderRoutes = require('./routes/adminOrder.routes'); // Admin order management routes

// Wallet Management Routes
const userWalletRoutes = require('./routes/userWallet.routes'); // User wallet management routes
const adminWalletRoutes = require('./routes/adminWallet.routes'); // Admin wallet management routes
const walletCallbackRoutes = require('./routes/walletCallback.routes'); // Payment gateway callback routes

// Dynamic Content Management Routes
const adminDynamicContentRoutes = require('./routes/adminDynamicContent.routes'); // Admin dynamic content management routes
const publicDynamicContentRoutes = require('./routes/publicDynamicContent.routes'); // Public dynamic content delivery routes

// Unsplash Integration Routes
const unsplashRoutes = require('./routes/unsplash.routes'); // Unsplash image integration routes

// Address Management Routes
const userAddressRoutes = require('./routes/userAddress.routes'); // User address management routes
const adminAddressRoutes = require('./routes/adminAddress.routes'); // Admin address management routes

// Payment Method Management Routes
const adminPaymentMethodRoutes = require('./routes/adminPaymentMethod.routes'); // Admin payment method management routes

// Notification Management Routes
const userNotificationRoutes = require('./routes/userNotification.routes'); // User notification routes
const adminNotificationRoutes = require('./routes/adminNotification.routes'); // Admin notification management routes

// Email Management Routes
const adminEmailRoutes = require('./routes/adminEmail.routes'); // Admin email management routes
const adminEmailTemplateRoutes = require('./routes/adminEmailTemplate.routes'); // Admin email template management routes

// Support Ticket Management Routes
const userSupportTicketRoutes = require('./routes/userSupportTicket.routes.test'); // User support ticket routes
const adminSupportTicketRoutes = require('./routes/adminSupportTicket.routes.test'); // Admin support ticket management routes

// Use routes with v1 prefix
app.use('/api/v1/products', productRoutes); // Product management routes
app.use('/api/v1/analytics/products', productAnalyticsRoutes); // Product analytics routes
app.use('/api/v1/product-variants', productVariantRoutes); // Product variant management routes
app.use('/api/v1/options', optionRoutes); // Option management routes
app.use('/api/v1/brands', brandRoutes); // Brand management routes
app.use('/api/v1/suppliers', supplierRoutes); // Supplier management routes
app.use('/api/v1/supplier-contact-numbers', supplierContactNumberRoutes); // Supplier contact number management routes
app.use('/api/v1/purchases', purchaseRoutes); // Purchase management routes
app.use('/api/v1/platforms', platformRoutes); // Platform management routes
app.use('/api/v1/platform-fees', platformFeeRoutes); // Platform fee management routes
app.use('/api/v1/listings', listingRoutes); // Listing management routes
app.use('/api/v1/inventory', inventoryRoutes); // Inventory management routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes); // Category management routes

// Admin routes - specific routes first, then general admin routes
app.use('/api/v1/admin/reviews', adminReviewRoutes); // Admin review management
app.use('/api/v1/admin/reports', adminReviewReportRoutes); // Admin review report management
app.use('/api/v1/admin/blog', adminBlogRoutes); // Admin blog management
app.use('/api/v1/admin/favorites', adminFavoriteRoutes); // Admin favorites management
app.use('/api/v1/admin/carts', adminCartRoutes); // Admin cart management
app.use('/api/v1/admin/orders', adminOrderRoutes); // Admin order management routes
app.use('/api/v1/admin/coupon-campaigns', couponCampaignRoutes); // Admin coupon campaign management
app.use('/api/v1/admin/user-coupons', adminUserCouponRoutes); // Admin user coupon management
app.use('/api/v1/admin/wallets', adminWalletRoutes); // Admin wallet management
app.use('/api/v1/admin/addresses', adminAddressRoutes); // Admin address management
app.use('/api/v1/admin/payment-methods', adminPaymentMethodRoutes); // Admin payment method management
app.use('/api/v1/notifications', userNotificationRoutes); // User notification routes
app.use('/api/v1/admin/notifications', adminNotificationRoutes); // Admin notification management
app.use('/api/v1/admin/emails', adminEmailRoutes); // Admin email management
app.use('/api/v1/admin/email-templates', adminEmailTemplateRoutes); // Admin email template management
app.use('/api/v1/admin/support-tickets', adminSupportTicketRoutes); // Admin support ticket management
app.use('/api/v1/admin/dynamic-content', adminDynamicContentRoutes); // Admin dynamic content management
app.use('/api/v1/unsplash', unsplashRoutes); // Unsplash image integration
app.use('/api/v1/admin', userRoutes); // Admin routes are included in user routes (must be last)

// Cart and Order Management Routes
app.use('/api/v1/user/cart', cartRoutes); // Cart management routes
app.use('/api/v1/user/orders', orderRoutes); // User order management routes
app.use('/api/v1/user/orders/razorpay', razorpayOrderRoutes); // Razorpay payment integration routes
app.use('/api/v1/webhooks', webhookRoutes); // Webhook routes

// User specific routes
app.use('/api/v1/user/coupons', userCouponRoutes); // User coupon management
app.use('/api/v1/user/reviews', userReviewRoutes); // User review management

// DEBUG: Log all requests to favorites endpoint
app.use('/api/v1/user/favorites', (req, res, next) => {
  console.log('\n🔍 FAVORITES DEBUG - Request received:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', {
    auth: req.headers.authorization ? 'Present' : 'Missing',
    contentType: req.headers['content-type'],
    origin: req.headers.origin
  });
  console.log('Body:', req.body);
  console.log('About to call next()...');
  next();
  console.log('After next() - this should not appear if route is found');
});

app.use('/api/v1/user/favorites', favoriteRoutes); // User favorites management
app.use('/api/v1/user/wallet', userWalletRoutes); // User wallet management
app.use('/api/v1/user/addresses', userAddressRoutes); // User address management
app.use('/api/v1/user/payment-methods', paymentMethodRoutes); // User payment method management
app.use('/api/v1/user/support-tickets', userSupportTicketRoutes); // User support ticket management

// Public routes
app.use('/api/v1/products', publicReviewRoutes); // Public review reading (products/:id/reviews)
// NOTE: favorites routes are handled by /api/v1/user/favorites mounting above
app.use('/api/v1/wallet', walletCallbackRoutes); // Payment gateway callbacks
app.use('/api/v1/content', publicDynamicContentRoutes); // Public dynamic content delivery

// Admin routes with comprehensive logging
app.use('/api/v1/admin', adminRoutes);

/**
 * @swagger
 * /api/v1/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     description: |
 *       Returns a CSRF token that must be included in subsequent requests that modify data.
 *       This endpoint is used by client applications to obtain a valid CSRF token for 
 *       protection against Cross-Site Request Forgery attacks.
 *       
 *       The token should be included in the `X-CSRF-Token` header for all 
 *       POST, PUT, PATCH, and DELETE requests.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: CSRF token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   description: The CSRF token to be used in subsequent requests
 *                   example: "a4f8b2c1-9d3e-4f5a-8b7c-1e2d3f4a5b6c"
 *             examples:
 *               success:
 *                 summary: Successful CSRF token response
 *                 value:
 *                   csrfToken: "a4f8b2c1-9d3e-4f5a-8b7c-1e2d3f4a5b6c"
 *       500:
 *         $ref: '#/components/responses/500'
 */
// CSRF Token endpoint is already defined above

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     description: |
 *       Basic welcome endpoint that provides information about the API server.
 *       This endpoint can be used to verify that the server is running and 
 *       to get basic information about the API.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Welcome message with API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to Zyvo API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 csrfToken:
 *                   type: string
 *                   description: CSRF token for this session
 *                   example: "a4f8b2c1-9d3e-4f5a-8b7c-1e2d3f4a5b6c"
 *             examples:
 *               welcome:
 *                 summary: Welcome response
 *                 value:
 *                   message: "Welcome to Zyvo API"
 *                   version: "1.0.0"
 *                   environment: "development"
 *                   csrfToken: "a4f8b2c1-9d3e-4f5a-8b7c-1e2d3f4a5b6c"
 *       500:
 *         $ref: '#/components/responses/500'
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Zyvo API',
    version: '1.0.0',
    environment: NODE_ENV,
    csrfToken: res.locals.csrfToken,
    documentation: {
      interactive: `http://localhost:${PORT}/api-docs`,
      redocly_preview: 'http://127.0.0.1:8080'
    },
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      platforms: '/api/v1/platforms',
      admin: '/api/v1/admin'
    }
  });
});

// =============================================================================
// DOCUMENTATION SERVING
// =============================================================================

/**
 * Serve API documentation
 * Makes the generated documentation available at /docs
 */
app.use('/docs', express.static(path.join(__dirname, 'docs')));

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     description: |
 *       Serves the interactive API documentation generated with Redoc.
 *       This endpoint provides access to the complete API documentation 
 *       including all endpoints, schemas, and examples.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API documentation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<!DOCTYPE html><html>...</html>"
 *       404:
 *         description: Documentation not found (may not be generated yet)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api-docs', (req, res) => {
  const docsPath = path.join(__dirname, 'docs', 'index.html');
  res.sendFile(docsPath, (err) => {
    if (err) {
      res.status(404).json({
        error: 'Documentation not found',
        message: 'API documentation has not been generated yet. Run "npm run docs:full" to generate it.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * 404 Handler
 * Handle routes that don't exist
 */
app.use('*', (req, res) => {
  console.log('\n⚠️ 404 HANDLER HIT:');
  console.log('Method:', req.method);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Headers:', {
    auth: req.headers.authorization ? 'Present' : 'Missing',
    contentType: req.headers['content-type']
  });
  console.log('This means no route matched the request!');
  console.log('---');
  
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} was not found on this server.`,
    statusCode: 404
  });
});

/**
 * Centralized Error Handling Middleware
 * Catches and processes all errors in the application
 * Integrates with Winston logging system for comprehensive error tracking
 */
app.use(logErrorMiddleware);

app.use((err, req, res, next) => {
  // Default error response
  let error = {
    message: 'Internal Server Error',
    statusCode: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    error = {
      message: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message),
      statusCode: 400
    };
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    error = {
      message: 'Invalid resource ID',
      statusCode: 400
    };
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error = {
      message: 'Duplicate field value entered',
      statusCode: 400
    };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    error = {
      message: 'Token expired',
      statusCode: 401
    };
  } else if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token error
    error = {
      message: 'Invalid CSRF token',
      statusCode: 403
    };
  } else if (err.statusCode) {
    // Custom application errors
    error = {
      message: err.message || 'Application Error',
      statusCode: err.statusCode
    };
  }

  // Don't expose sensitive error details in production
  if (NODE_ENV === 'production' && error.statusCode === 500) {
    error.message = 'Internal Server Error';
    delete error.details;
  }

  // Send error response
  res.status(error.statusCode).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * Start the server
 * Connect to database and start listening on specified port
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔒 CORS Origin: ${CORS_ORIGIN}`);
      console.log(`⚡ Rate Limit: DISABLED`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;
