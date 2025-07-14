# Coupon Management System Integration Guide

## Overview
This guide explains how to integrate the Coupon Management System into your existing e-commerce application.

## 1. App.js Integration

Add the following routes to your main `app.js` file:

```javascript
// Coupon Management Routes
const couponCampaignRoutes = require('./routes/couponCampaign.routes');
const userCouponRoutes = require('./routes/userCoupon.routes');
const adminUserCouponRoutes = require('./routes/adminUserCoupon.routes');

// Mount routes
app.use('/api/v1/admin/coupon-campaigns', couponCampaignRoutes);
app.use('/api/v1/user/coupons', userCouponRoutes);
app.use('/api/v1/admin/user-coupons', adminUserCouponRoutes);
```

## 2. Order Processing Integration

### 2.1. Update Order Model
Add the following fields to your Order model if not already present:

```javascript
// In your Order schema
{
  applied_coupon_code: {
    type: String,
    default: null,
    trim: true
  },
  
  coupon_discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  original_total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  final_total_amount: {
    type: Number,
    required: true,
    min: 0
  }
}
```

### 2.2. Order Controller Updates

#### During Order Creation:
```javascript
// In your order creation controller
const createOrder = async (req, res, next) => {
  try {
    const { 
      cart_items, 
      shipping_address, 
      applied_coupon_code,
      // ... other fields 
    } = req.body;

    let couponDiscount = 0;
    let originalTotal = calculateCartTotal(cart_items);
    
    // If coupon is applied, validate and calculate discount
    if (applied_coupon_code) {
      const UserCoupon = require('../models/UserCoupon');
      const userCoupon = await UserCoupon.findByCodeAndUser(applied_coupon_code, req.user.id);
      
      if (userCoupon) {
        const canUseResult = await userCoupon.canBeUsed();
        if (canUseResult.valid) {
          couponDiscount = canUseResult.campaign.calculateDiscount(originalTotal);
        }
      }
    }

    const finalTotal = originalTotal - couponDiscount;

    const order = new Order({
      user_id: req.user.id,
      items: cart_items,
      shipping_address,
      applied_coupon_code,
      coupon_discount_amount: couponDiscount,
      original_total_amount: originalTotal,
      final_total_amount: finalTotal,
      status: 'PENDING',
      // ... other fields
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    next(error);
  }
};
```

#### During Order Status Update (CRITICAL for coupon usage tracking):
```javascript
// In your order status update controller
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();

    // CRITICAL: Update coupon usage when order is completed
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED' && order.applied_coupon_code) {
      const UserCoupon = require('../models/UserCoupon');
      
      try {
        const userCoupon = await UserCoupon.findByCodeAndUser(
          order.applied_coupon_code, 
          order.user_id
        );

        if (userCoupon) {
          await userCoupon.incrementUsage();
          console.log(`Coupon usage incremented for code: ${order.applied_coupon_code}`);
        }
      } catch (couponError) {
        console.error('Error updating coupon usage:', couponError);
        // Don't fail the order update if coupon update fails
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    next(error);
  }
};
```

### 2.3. Transaction Safety (Recommended)

For production environments, wrap the order completion and coupon usage update in a transaction:

```javascript
const mongoose = require('mongoose');

const updateOrderStatusWithTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();

    // Update coupon usage within transaction
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED' && order.applied_coupon_code) {
      const UserCoupon = require('../models/UserCoupon');
      const CouponCampaign = require('../models/CouponCampaign');
      
      const userCoupon = await UserCoupon.findByCodeAndUser(
        order.applied_coupon_code, 
        order.user_id
      ).session(session);

      if (userCoupon) {
        // Increment user coupon usage
        userCoupon.current_usage_count += 1;
        
        // Check if coupon should be marked as redeemed
        const campaign = await CouponCampaign.findById(userCoupon.coupon_campaign_id).session(session);
        if (campaign && userCoupon.current_usage_count >= campaign.max_usage_per_user) {
          userCoupon.is_redeemed = true;
          userCoupon.redeemed_at = new Date();
        }
        
        await userCoupon.save({ session });
        
        // Increment campaign global usage
        await CouponCampaign.findByIdAndUpdate(
          userCoupon.coupon_campaign_id,
          { $inc: { current_global_usage: 1 } },
          { session }
        );
      }
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating order status:', error);
    next(error);
  } finally {
    session.endSession();
  }
};
```

## 3. Frontend Integration

### 3.1. Coupon Application Flow

```javascript
// Example frontend coupon application
const applyCoupon = async (couponCode, cartData) => {
  try {
    const response = await fetch('/api/v1/user/coupons/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        coupon_code: couponCode,
        cart_total_amount: cartData.total,
        cart_item_details: cartData.items.map(item => ({
          product_variant_id: item.variant_id,
          category_id: item.category_id,
          quantity: item.quantity,
          price: item.price
        }))
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Update UI with discount information
      updateCartTotal(result.data.final_amount);
      showDiscountInfo(result.data);
    } else {
      // Show error message
      showError(result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error applying coupon:', error);
    showError('Failed to apply coupon');
  }
};
```

### 3.2. User Coupons Display

```javascript
// Fetch and display user's available coupons
const fetchUserCoupons = async () => {
  try {
    const response = await fetch('/api/v1/user/coupons?status=active', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      displayCoupons(result.data);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching coupons:', error);
  }
};
```

## 4. Testing the Integration

### 4.1. Create a Test Campaign

```bash
# Create a test coupon campaign
curl -X POST http://localhost:3000/api/v1/admin/coupon-campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Campaign",
    "discount_type": "PERCENTAGE",
    "discount_value": 20,
    "min_purchase_amount": 100,
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_until": "2024-12-31T23:59:59.000Z",
    "max_global_usage": 1000,
    "eligibility_criteria": ["NONE"]
  }'
```

### 4.2. Generate User Coupons

```bash
# Generate coupons for users
curl -X POST http://localhost:3000/api/v1/admin/coupon-campaigns/CAMPAIGN_ID/generate-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "user_ids": ["USER_ID_1", "USER_ID_2"]
  }'
```

### 4.3. Test Coupon Application

```bash
# Apply coupon
curl -X POST http://localhost:3000/api/v1/user/coupons/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "coupon_code": "GENERATED_COUPON_CODE",
    "cart_total_amount": 500,
    "cart_item_details": [
      {
        "product_variant_id": "VARIANT_ID",
        "category_id": "CATEGORY_ID",
        "quantity": 2,
        "price": 250
      }
    ]
  }'
```

## 5. Monitoring and Analytics

### 5.1. Campaign Performance Tracking

Create endpoints to track campaign performance:

```javascript
// Get campaign statistics
router.get('/api/v1/admin/coupon-campaigns/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const UserCoupon = require('../models/UserCoupon');
    
    const stats = await UserCoupon.getUsageStatistics(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 5.2. User Engagement Metrics

Track coupon-related user activities for analytics.

## 6. Security Considerations

1. **Rate Limiting**: Implement rate limiting on coupon application endpoints
2. **Validation**: Always validate coupon codes server-side
3. **Audit Logging**: Log all coupon-related activities
4. **Fraud Prevention**: Monitor for suspicious coupon usage patterns

## 7. Performance Optimization

1. **Indexing**: Ensure proper database indexes are in place
2. **Caching**: Cache frequently accessed campaign data
3. **Batch Operations**: Use batch operations for bulk coupon generation

This integration guide ensures that your coupon system is properly connected to your order processing flow and provides reliable tracking of coupon usage.
