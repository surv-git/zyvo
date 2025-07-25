# Coupon API Testing Guide

## 🚨 Critical Issue Identified

### ❌ THE PROBLEM
```
/api/v1/admin/coupons
```
**This endpoint appears to exist but is actually being caught by a wildcard user route!**

**Root Cause:**
- In `app.js` line 425: `app.use('/api/v1/admin', userRoutes)`
- User routes include: `router.get('/:id', authMiddleware, userController.getUserById)`  
- When you hit `/api/v1/admin/coupons`, Express matches it against `/:id` route
- "coupons" is treated as a user ID parameter
- This is why it returns authentication errors instead of 404

### ✅ CORRECT ENDPOINTS

#### 1. Admin Coupon Campaign Management
```
Base URL: /api/v1/admin/coupon-campaigns
```

**Available Endpoints:**
- `GET /api/v1/admin/coupon-campaigns` - Get all coupon campaigns  
- `POST /api/v1/admin/coupon-campaigns` - Create new coupon campaign
- `GET /api/v1/admin/coupon-campaigns/:identifier` - Get specific campaign
- `PATCH /api/v1/admin/coupon-campaigns/:id` - Update campaign
- `DELETE /api/v1/admin/coupon-campaigns/:id` - Delete campaign
- `POST /api/v1/admin/coupon-campaigns/:id/generate-codes` - Generate coupon codes

#### 2. User Coupon Management (Requires Authentication)
```
Base URL: /api/v1/user/coupons
```

**Available Endpoints:**
- `GET /api/v1/user/coupons` - Get my coupons
- `GET /api/v1/user/coupons/:code` - Get coupon by code  
- `POST /api/v1/user/coupons/apply` - Apply coupon to cart

#### 3. Admin User Coupon Management
```
Base URL: /api/v1/admin/user-coupons
```

**Available Endpoints:**
- `GET /api/v1/admin/user-coupons` - Get all user coupons
- `PATCH /api/v1/admin/user-coupons/:id` - Update user coupon
- `DELETE /api/v1/admin/user-coupons/:id` - Delete user coupon

## 🧪 API Testing Examples

### 1. Test Admin Coupon Campaigns

```bash
# Get all coupon campaigns (correct port: 3100)
curl -X GET "http://localhost:3100/api/v1/admin/coupon-campaigns"

# Get campaigns with pagination  
curl -X GET "http://localhost:3100/api/v1/admin/coupon-campaigns?page=1&limit=10"

# Create new campaign
curl -X POST "http://localhost:3100/api/v1/admin/coupon-campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "description": "Test campaign for API testing", 
    "code_prefix": "TEST",
    "discount_type": "PERCENTAGE",
    "discount_value": 10,
    "min_purchase_amount": 50,
    "max_usage_per_user": 1,
    "max_global_usage": 100,
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "is_active": true
  }'
```

### 2. Test User Coupons (Requires Authentication)

```bash
# Get my coupons (requires Authorization header)
curl -X GET "http://localhost:3100/api/v1/user/coupons" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get coupon by code
curl -X GET "http://localhost:3100/api/v1/user/coupons/WELCOME-ABC123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Apply coupon
curl -X POST "http://localhost:3100/api/v1/user/coupons/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "coupon_code": "WELCOME-ABC123",
    "cart_total_amount": 100,
    "cart_item_details": [
      {
        "product_variant_id": "507f1f77bcf86cd799439011",
        "category_id": "507f1f77bcf86cd799439012", 
        "quantity": 2,
        "price": 50
      }
    ]
  }'
```

### 3. Test Admin User Coupons

```bash
# Get all user coupons
curl -X GET "http://localhost:3100/api/v1/admin/user-coupons"

# Filter by user
curl -X GET "http://localhost:3100/api/v1/admin/user-coupons?user_id=507f1f77bcf86cd799439011"

# Filter by status
curl -X GET "http://localhost:3100/api/v1/admin/user-coupons?status=active"
```

### 4. Demonstrate the Problem (DO NOT USE)

```bash
# This endpoint is INCORRECT but will appear to work due to route collision
curl -X GET "http://localhost:3100/api/v1/admin/coupons"
# Returns: {"success":false,"message":"Access denied. No token provided."}
# This is NOT a coupon endpoint - it's trying to find a user with ID "coupons"!
```

## 🔐 Authentication Requirements

### User Endpoints (`/api/v1/user/coupons`)
- **Required:** Valid JWT token in Authorization header
- **Format:** `Authorization: Bearer <your_jwt_token>`
- **Role:** Regular user authentication

### Admin Endpoints (`/api/v1/admin/*`)
- **Required:** Admin-level authentication
- **Format:** Depends on your admin auth implementation

## 🎯 Sample Test Data

After running the seeder, you'll have these test campaigns:

1. **Welcome New Users** (`WELCOME-*`)
   - 15% discount
   - Minimum order: $50
   - Max discount: $100

2. **Summer Sale 2024** (`SUMMER-*`)
   - 25% discount
   - Minimum order: $100
   - Max discount: $200

3. **Free Shipping Weekend** (`FREESHIP-*`)
   - Free shipping
   - Minimum order: $25

4. **VIP Customer Bonus** (`VIP-*`)
   - $50 fixed discount
   - Minimum order: $200

## 🚀 Quick Setup Commands

1. **Seed test data:**
   ```bash
   node scripts/seed-coupons.js
   ```

2. **Or use main seeder:**
   ```bash
   node seeders/seeder.js seed coupons
   ```

3. **Clean coupon data:**
   ```bash
   node seeders/seeder.js clean coupons
   ```

## 🔍 Troubleshooting

### Issue: 400/404 Errors on Coupon Endpoints
- ❌ **Problem**: Using `/api/v1/admin/coupons` - this gets caught by user route `/:id`
- ✅ **Solution**: Use `/api/v1/admin/coupon-campaigns` for admin coupon management

### Issue: 401 Unauthorized on User Endpoints  
- ❌ **Problem**: Missing or invalid JWT token in Authorization header
- ✅ **Solution**: Include valid JWT token: `Authorization: Bearer <token>`

### Issue: No Coupon Data
- ❌ **Problem**: Database is empty
- ✅ **Solution**: Run seeder: `node scripts/seed-coupons.js`

### Issue: Route Collision (/admin/coupons responds but shouldn't)
- ❌ **Problem**: Catch-all user route `app.use('/api/v1/admin', userRoutes)` with `/:id` parameter
- ✅ **Solution**: Move user routes to be more specific or restructure route mounting order

## 📝 Technical Notes

### Route Collision Explanation
The `/api/v1/admin/coupons` endpoint is being intercepted by:
```javascript
// app.js line 425
app.use('/api/v1/admin', userRoutes);

// user.routes.js  
router.get('/:id', authMiddleware, userController.getUserById);
```

When you hit `/api/v1/admin/coupons`, Express matches "coupons" as the `:id` parameter and tries to find a user with ID "coupons", which is why it returns authentication errors instead of 404.

### Server Port
- Development server runs on port **3100** (not 3000)
- Update all curl commands and API clients accordingly

## 📝 Notes

- The `/api/v1/admin/coupons` endpoint **does not exist** in your codebase
- Use `/api/v1/admin/coupon-campaigns` for admin coupon management
- User coupon endpoints require proper authentication
- Test data includes various discount types (percentage, fixed amount, free shipping)
- All user coupons are linked to existing users in the database
