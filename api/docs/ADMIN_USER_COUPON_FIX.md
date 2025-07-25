# Admin User Coupon Endpoint Fix

## Issue
The endpoint `/api/v1/admin/user-coupons/<id>` was returning 401 errors because the **GET single user coupon endpoint was missing** from the admin user coupon routes.

## Root Cause
The `adminUserCoupon.routes.js` file only had these routes:
- `GET /` - List all user coupons ✅
- `PATCH /:id` - Update a user coupon ✅  
- `DELETE /:id` - Delete a user coupon ✅
- `GET /:id` - Get single user coupon ❌ **MISSING**

## Solution Implemented

### 1. Added Missing Route
**File**: `/Users/surv/Work/zyvo/api/routes/adminUserCoupon.routes.js`

Added the missing GET route:
```javascript
/**
 * Get Single User Coupon (Admin)
 * GET /api/v1/admin/user-coupons/:id
 */
router.get('/:id',
  param('id').isMongoId().withMessage('User coupon ID must be a valid ObjectId'),
  userCouponController.getUserCouponById
);
```

### 2. Added Controller Method
**File**: `/Users/surv/Work/zyvo/api/controllers/userCoupon.controller.js`

Added the `getUserCouponById` method:
```javascript
/**
 * Admin: Get single user coupon by ID
 * GET /api/v1/admin/user-coupons/:id
 */
const getUserCouponById = async (req, res, next) => {
  try {
    // Validation and error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Find user coupon with populated relationships
    const userCoupon = await UserCoupon.findById(id)
      .populate({
        path: 'coupon_campaign_id',
        select: 'name slug discount_type discount_value min_order_value max_discount_amount usage_limit usage_count is_active starts_at expires_at'
      })
      .populate({
        path: 'user_id',
        select: 'name email phone isActive'
      });

    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: 'User coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User coupon retrieved successfully',
      data: userCoupon
    });

  } catch (error) {
    console.error('Error getting user coupon by ID:', error);
    next(error);
  }
};
```

### 3. Updated Exports
Added `getUserCouponById` to the controller exports:
```javascript
module.exports = {
  getMyCoupons,
  getCouponByCode,
  applyCoupon,
  getAllUserCoupons,
  getUserCouponById,  // <- Added this
  updateUserCoupon,
  deleteUserCoupon,
  validateCouponApplicability,
  validateUserEligibility
};
```

### 4. Updated OpenAPI Documentation
**File**: `/Users/surv/Work/zyvo/api/docs/openapi.yaml`

Added the GET method documentation for the single user coupon endpoint.

## Test Results

✅ **All endpoints now working correctly:**

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/v1/admin/user-coupons` | GET | 200 | List user coupons (pagination working) |
| `/api/v1/admin/user-coupons/{id}` | GET | 200 | Get single user coupon (new endpoint) |
| `/api/v1/admin/user-coupons/{id}` | PATCH | 200 | Update user coupon |
| `/api/v1/admin/user-coupons/{id}` | DELETE | 200 | Delete user coupon |

## Example Usage

```bash
# Get single user coupon (now working!)
curl -X GET "http://localhost:3100/api/v1/admin/user-coupons/688057d10bc53f3b7be48db2" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "User coupon retrieved successfully",
  "data": {
    "_id": "688057d10bc53f3b7be48db2",
    "coupon_campaign_id": {
      "_id": "688057d10bc53f3b7be48d86",
      "name": "Free Shipping Weekend",
      "slug": "free-shipping-weekend",
      "discount_type": "FREE_SHIPPING",
      "discount_value": 0
    },
    "user_id": {
      "_id": "687b015864843ad6fabfdedf",
      "name": "Sara Singh",
      "email": "sara_singh72@yahoo.co.in"
    },
    "coupon_code": "FREESHIP-4GZACA",
    "current_usage_count": 1,
    "status": "ACTIVE",
    "expires_at": "2026-01-23T03:32:33.288Z",
    "is_redeemed": false,
    "is_active": true
  }
}
```

## Summary

The issue was **not an authentication problem** but a **missing endpoint**. The route existed for PATCH and DELETE operations but not for GET single item. The fix was straightforward:

1. ✅ Added missing GET route with proper validation
2. ✅ Implemented controller method with error handling
3. ✅ Updated exports and documentation
4. ✅ Verified all endpoints work correctly

The endpoint `/api/v1/admin/user-coupons/<id>` now works as expected!
