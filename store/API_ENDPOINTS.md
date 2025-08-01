# API Endpoints Documentation

This document lists all the centralized API endpoints used in the application.

## Base Configuration

- **Base URL**: `http://localhost:3100`
- **API Version**: `v1`

## Available Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/{id}` - Get category details

### Products
- `GET /api/v1/products` - List products with filters
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/{id}` - Get product details
- `GET /api/v1/products/search` - Search products

### Product Variants
- `GET /api/v1/product-variants` - List product variants
- `GET /api/v1/product-variants/{id}` - Get variant details

### Brands
- `GET /api/v1/brands` - List all brands
- `GET /api/v1/brands/{id}` - Get brand details

### Orders
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/{id}` - Get order details
- `POST /api/v1/orders` - Create new order

### Shopping Cart
- `GET /api/v1/cart` - Get cart contents
- `POST /api/v1/cart/add` - Add item to cart
- `PUT /api/v1/cart/update` - Update cart item
- `DELETE /api/v1/cart/remove` - Remove item from cart
- `DELETE /api/v1/cart/clear` - Clear entire cart

### Wishlist
- `GET /api/v1/wishlist` - Get wishlist items
- `POST /api/v1/wishlist/add` - Add item to wishlist
- `DELETE /api/v1/wishlist/remove` - Remove item from wishlist

## Usage

All endpoints are centralized in `/src/lib/api-config.ts` and should be accessed through the service layer:

```typescript
import { API_CONFIG, apiGet, apiPost } from '@/lib/api-config'

// Example: Get categories
const categories = await apiGet(API_CONFIG.ENDPOINTS.CATEGORIES.LIST)

// Example: Get featured products
const products = await apiGet(`${API_CONFIG.ENDPOINTS.PRODUCTS.FEATURED}?limit=10`)
```

## Query Parameters

### Products endpoint supports:
- `category` - Filter by category slug
- `subcategory` - Filter by subcategory slug
- `brand` - Filter by brand (can be multiple)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `rating` - Minimum rating filter
- `inStock` - Filter for in-stock items only
- `onSale` - Filter for items on sale
- `sortBy` - Sort criteria (name-asc, name-desc, price-asc, price-desc, rating, newest)
- `page` - Page number for pagination
- `limit` - Items per page
- `search` - Search query

### Categories endpoint supports:
- `page` - Page number for pagination
- `limit` - Items per page
- `parent` - Filter by parent category

## Authentication

Endpoints requiring authentication automatically include the Bearer token from localStorage when using the centralized API functions with `includeAuth: true`.
