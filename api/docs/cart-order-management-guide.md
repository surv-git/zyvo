# Cart and Order Management System Documentation

## Overview
This documentation covers the comprehensive Cart and Order Management System implemented for the e-commerce application. The system uses separate collections for CartItem and OrderItem to enhance scalability and analytical flexibility while maintaining crucial data snapshotting for order items.

## System Architecture

### Database Models

#### 1. Cart Model (`models/Cart.js`)
- **Purpose**: Manages user shopping carts with coupon integration
- **Key Features**:
  - One cart per authenticated user
  - Coupon application and discount tracking
  - Automatic total calculation
  - Integration with CartItem collection

**Schema Fields:**
- `user_id`: Reference to User (unique)
- `applied_coupon_code`: Applied coupon code string
- `coupon_discount_amount`: Discount amount from coupon
- `cart_total_amount`: Total amount after discounts
- `last_updated_at`, `createdAt`, `updatedAt`: Timestamps

**Key Methods:**
- `calculateTotal()`: Recalculates cart total from items
- `clearCoupon()`: Removes applied coupon
- `applyCoupon()`: Applies coupon with discount amount

#### 2. CartItem Model (`models/CartItem.js`)
- **Purpose**: Individual items within shopping carts
- **Key Features**:
  - Separate collection for scalability
  - Automatic cart total updates
  - Inventory validation
  - Historical price tracking

**Schema Fields:**
- `cart_id`: Reference to Cart
- `product_variant_id`: Reference to ProductVariant
- `quantity`: Item quantity
- `price_at_addition`: Price when added to cart
- `added_at`: Timestamp

**Key Methods:**
- `getCurrentSubtotal()`: Calculate current price-based subtotal
- `updateQuantity()`: Update item quantity with validation

#### 3. Order Model (`models/Order.js`)
- **Purpose**: Customer orders with comprehensive tracking
- **Key Features**:
  - Complete order lifecycle management
  - Address management (shipping/billing)
  - Payment and order status tracking
  - Financial calculations

**Schema Fields:**
- `user_id`: Reference to User
- `order_number`: Unique order identifier (auto-generated)
- `shipping_address`, `billing_address`: Embedded address objects
- `payment_method_id`: Reference to PaymentMethod (optional for COD)
- `payment_status`: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
- `order_status`: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED
- Financial fields: `subtotal_amount`, `shipping_cost`, `tax_amount`, `discount_amount`, `grand_total_amount`
- `applied_coupon_code`: Applied coupon snapshot
- `tracking_number`, `shipping_carrier`: Shipping information
- `notes`: Admin/internal notes

**Key Methods:**
- `canBeCancelled()`: Check if order can be cancelled
- `updateStatus()`: Update order status with optional tracking
- `calculateTotals()`: Recalculate order totals

#### 4. OrderItem Model (`models/OrderItem.js`)
- **Purpose**: Individual items within orders with data snapshotting
- **Key Features**:
  - Separate collection for analytics
  - Historical data preservation
  - Product information snapshotting

**Schema Fields:**
- `order_id`: Reference to Order
- `product_variant_id`: Reference to ProductVariant
- `sku_code`: Snapshotted SKU
- `product_name`: Snapshotted product name
- `variant_options`: Snapshotted variant options
- `quantity`: Item quantity
- `price`: Price at time of order
- `subtotal`: Calculated subtotal

**Key Methods:**
- `createFromCartItems()`: Static method to create order items from cart
- `getProductSalesStats()`: Analytics for product performance

## API Endpoints

### Cart Management (`/api/v1/user/cart`)

#### 1. Get User's Cart
- **Endpoint**: `GET /api/v1/user/cart`
- **Authentication**: User required
- **Response**: Cart with all items, populated product details

#### 2. Add Item to Cart
- **Endpoint**: `POST /api/v1/user/cart/items`
- **Authentication**: User required
- **Body**: `{ product_variant_id, quantity }`
- **Features**:
  - Inventory validation
  - Automatic quantity merging for existing items
  - Cart total recalculation

#### 3. Update Cart Item Quantity
- **Endpoint**: `PATCH /api/v1/user/cart/items/:productVariantId`
- **Authentication**: User required
- **Body**: `{ quantity }`
- **Features**:
  - Inventory validation
  - Quantity 0 removes item
  - Cart total recalculation

#### 4. Remove Item from Cart
- **Endpoint**: `DELETE /api/v1/user/cart/items/:productVariantId`
- **Authentication**: User required

#### 5. Apply Coupon to Cart
- **Endpoint**: `POST /api/v1/user/cart/apply-coupon`
- **Authentication**: User required
- **Body**: `{ coupon_code }`
- **Features**:
  - Coupon validation using existing coupon system
  - Discount calculation
  - Cart total recalculation

#### 6. Remove Coupon from Cart
- **Endpoint**: `DELETE /api/v1/user/cart/remove-coupon`
- **Authentication**: User required

#### 7. Clear Cart
- **Endpoint**: `DELETE /api/v1/user/cart`
- **Authentication**: User required

### Order Management

#### User Order Endpoints (`/api/v1/user/orders`)

##### 1. Place Order
- **Endpoint**: `POST /api/v1/user/orders`
- **Authentication**: User required
- **Body**: 
```json
{
  "shipping_address": {
    "full_name": "string",
    "address_line1": "string",
    "address_line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string",
    "phone_number": "string"
  },
  "billing_address": { /* same structure */ },
  "payment_method_id": "ObjectId (optional for COD)",
  "is_cod": "boolean"
}
```
- **Transaction Features**:
  - Atomic cart-to-order conversion
  - Inventory deduction with rollback on failure
  - Coupon usage tracking
  - Data snapshotting for order items
  - Cart clearing after successful order

##### 2. Get My Orders
- **Endpoint**: `GET /api/v1/user/orders`
- **Authentication**: User required
- **Query Parameters**: `status`, `page`, `limit`, `startDate`, `endDate`

##### 3. Get Order Details
- **Endpoint**: `GET /api/v1/user/orders/:orderId`
- **Authentication**: User required

##### 4. Cancel Order
- **Endpoint**: `PATCH /api/v1/user/orders/:orderId/cancel`
- **Authentication**: User required
- **Body**: `{ reason }`
- **Transaction Features**:
  - Inventory restoration
  - Coupon usage reversal
  - Order status update

#### Admin Order Endpoints (`/api/v1/admin/orders`)

##### 1. Get All Orders
- **Endpoint**: `GET /api/v1/admin/orders/all`
- **Authentication**: Admin required
- **Query Parameters**: `user_id`, `order_status`, `payment_status`, `order_number`, `page`, `limit`, `startDate`, `endDate`

##### 2. Get Order Details (Admin)
- **Endpoint**: `GET /api/v1/admin/orders/:orderId`
- **Authentication**: Admin required

##### 3. Update Order Status
- **Endpoint**: `PATCH /api/v1/admin/orders/:orderId/status`
- **Authentication**: Admin required
- **Body**: `{ new_status, tracking_number?, shipping_carrier?, notes? }`

##### 4. Process Refund
- **Endpoint**: `POST /api/v1/admin/orders/:orderId/refund`
- **Authentication**: Admin required
- **Body**: `{ amount?, reason }`

## Transaction Safety

### Critical Transaction Points

#### 1. Order Placement
The order placement process uses MongoDB transactions to ensure atomicity:

```javascript
await session.withTransaction(async () => {
  // 1. Validate cart and coupon
  // 2. Check inventory for all items
  // 3. Create order and order items
  // 4. Deduct inventory
  // 5. Update coupon usage
  // 6. Clear cart
});
```

#### 2. Order Cancellation
Order cancellation reverses all order-related changes:

```javascript
await session.withTransaction(async () => {
  // 1. Validate cancellation eligibility
  // 2. Restore inventory
  // 3. Reverse coupon usage
  // 4. Update order status
});
```

### Inventory Integration

The system integrates with the existing inventory system through:
- `getVariantPackDetails()`: Helper function to calculate inventory requirements
- Atomic inventory updates within transactions
- Stock validation before order placement
- Inventory restoration on order cancellation

### Coupon Integration

Integration with the existing Coupon Management System:
- Coupon validation using `UserCoupon.validateCouponApplicability()`
- Usage tracking with `current_usage_count` updates
- Campaign-level usage tracking
- Coupon state management (redeemed/available)

## Data Flow

### Cart to Order Flow

1. **Cart Building**:
   - User adds items to cart
   - Cart items stored separately with current prices
   - Cart totals calculated dynamically

2. **Coupon Application**:
   - Coupon validated against cart contents
   - Discount applied to cart total
   - Coupon marked as applied but not redeemed

3. **Order Placement**:
   - Cart contents validated for inventory
   - Order created with address and payment info
   - Order items created with data snapshotting
   - Inventory deducted atomically
   - Coupon marked as redeemed
   - Cart cleared

4. **Order Processing**:
   - Admin updates order status
   - Tracking information added
   - Payment status managed

### Error Handling

The system implements comprehensive error handling:

- **Validation Errors**: 400 Bad Request for invalid input
- **Inventory Errors**: 412 Precondition Failed for insufficient stock
- **Authentication Errors**: 401 Unauthorized for missing auth
- **Authorization Errors**: 403 Forbidden for insufficient permissions
- **Not Found Errors**: 404 Not Found for missing resources
- **Server Errors**: 500 Internal Server Error for system issues

### Audit Logging

Both user activities and admin actions are logged:

```javascript
// User actions
userAuditLogger.logActivity(userId, 'CART_ITEM_ADDED', context);

// Admin actions
adminAuditLogger.logActivity(adminId, 'ORDER_STATUS_UPDATED', context);
```

## Security Features

### Input Validation
- Comprehensive validation using express-validator
- Address format validation
- MongoDB ObjectId validation
- Quantity and amount validation

### Authentication & Authorization
- User authentication required for all cart/order operations
- Admin authentication required for admin endpoints
- User-specific data isolation

### Data Protection
- No sensitive data exposure in error messages
- Environment-based error detail control
- Audit logging for all critical operations

## Performance Considerations

### Database Indexing
- Compound indexes for optimal query performance
- User-based queries optimized
- Date range queries supported

### Scalability Features
- Separate item collections for better analytics
- Efficient aggregation pipelines
- Pagination support for large datasets

### Caching Opportunities
- Cart data can be cached per user
- Product variant details caching
- Inventory data caching with TTL

## Integration Requirements

### Payment Gateway Integration
The system is designed to integrate with payment gateways:
- Payment method validation
- Payment status tracking
- Refund processing hooks

### Shipping Integration
Shipping cost calculation can be enhanced with:
- Real shipping carrier APIs
- Weight/dimension-based calculations
- Address validation services

### Notification System
The system supports notification integration:
- Order status change notifications
- Inventory alerts
- Payment confirmations

## Testing Strategy

### Unit Tests
- Model validation tests
- Controller logic tests
- Helper function tests

### Integration Tests
- API endpoint tests
- Database transaction tests
- Authentication/authorization tests

### Load Tests
- Cart performance under load
- Order placement concurrency
- Database performance tests

## Monitoring and Analytics

### Key Metrics
- Cart abandonment rates
- Order conversion rates
- Average order values
- Inventory turnover

### Logging Points
- All cart modifications
- Order state changes
- Payment events
- Error occurrences

### Health Checks
- Database connectivity
- External service availability
- Transaction success rates

## Deployment Considerations

### Environment Variables
- Database connection strings
- Payment gateway credentials
- JWT secrets
- Rate limiting configurations

### Database Migration
- Model schema updates
- Index creation
- Data migration scripts

### Monitoring Setup
- Application performance monitoring
- Database monitoring
- Error tracking
- User activity analytics

---

## Quick Start Guide

### 1. Install Dependencies
Ensure all required models and middleware are in place from previous implementations:
- Coupon Management System
- Payment Methods System
- User Authentication System
- Product Management System
- Inventory Management System

### 2. Database Setup
The system will automatically create the required collections and indexes on first use.

### 3. Environment Configuration
Ensure the following environment variables are configured:
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

### 4. API Testing
Use the provided API endpoints to test the system:
1. Add items to cart
2. Apply coupons
3. Place orders
4. Manage order status

### 5. Integration
Follow the app.js integration example to include the routes in your application.

---

This comprehensive Cart and Order Management System provides a solid foundation for e-commerce operations with enterprise-grade features including transaction safety, comprehensive validation, audit logging, and scalability considerations.
