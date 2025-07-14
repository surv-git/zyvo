# Order Processing Updates for Coupon Management

## Overview
This document outlines the specific changes needed in your order processing logic to properly track coupon usage and maintain data consistency.

## 1. Critical Integration Points

### 1.1. Order Model Updates

Add these fields to your existing Order schema:

```javascript
// Add to your existing Order schema
const orderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Coupon-related fields
  applied_coupon_code: {
    type: String,
    default: null,
    trim: true,
    uppercase: true
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
  },
  
  // ... rest of existing fields ...
});
```

### 1.2. Order Creation Flow

Update your order creation controller to handle coupon application:

```javascript
const UserCoupon = require('../models/UserCoupon');
const { validateCouponApplicability } = require('../controllers/userCoupon.controller');

const createOrder = async (req, res, next) => {
  try {
    const { 
      cart_items, 
      shipping_address,
      payment_method,
      applied_coupon_code, // Add this field
      // ... other order fields
    } = req.body;

    const userId = req.user.id;
    
    // Calculate original cart total
    const originalTotal = cart_items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    let couponDiscount = 0;
    let finalTotal = originalTotal;
    
    // Process coupon if applied
    if (applied_coupon_code) {
      try {
        const couponResult = await processCouponForOrder(
          applied_coupon_code, 
          userId, 
          originalTotal, 
          cart_items
        );
        
        if (couponResult.success) {
          couponDiscount = couponResult.discount_amount;
          finalTotal = originalTotal - couponDiscount;
        } else {
          return res.status(400).json({
            success: false,
            message: `Coupon error: ${couponResult.message}`
          });
        }
      } catch (couponError) {
        console.error('Coupon processing error:', couponError);
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }
    }

    // Create order with coupon information
    const order = new Order({
      user_id: userId,
      items: cart_items,
      shipping_address,
      payment_method,
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
      data: {
        order_id: order._id,
        original_total: originalTotal,
        coupon_discount: couponDiscount,
        final_total: finalTotal,
        applied_coupon: applied_coupon_code || null
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    next(error);
  }
};

// Helper function to process coupon for order
const processCouponForOrder = async (couponCode, userId, cartTotal, cartItems) => {
  const UserCoupon = require('../models/UserCoupon');
  const { validateCouponApplicability, validateUserEligibility } = require('../controllers/userCoupon.controller');

  // Find user coupon
  const userCoupon = await UserCoupon.findByCodeAndUser(couponCode, userId);
  if (!userCoupon) {
    return { success: false, message: 'Coupon not found' };
  }

  // Check if coupon can be used
  const canUseResult = await userCoupon.canBeUsed();
  if (!canUseResult.valid) {
    return { success: false, message: canUseResult.reason };
  }

  const campaign = canUseResult.campaign;

  // Validate minimum purchase amount
  if (cartTotal < campaign.min_purchase_amount) {
    return { 
      success: false, 
      message: `Minimum purchase amount of ₹${campaign.min_purchase_amount} required` 
    };
  }

  // Check applicability to cart items
  const cartItemDetails = cartItems.map(item => ({
    product_variant_id: item.product_variant_id,
    category_id: item.category_id,
    quantity: item.quantity,
    price: item.price
  }));

  const applicabilityCheck = await validateCouponApplicability(campaign, cartItemDetails);
  if (!applicabilityCheck.valid) {
    return { success: false, message: applicabilityCheck.message };
  }

  // Check user eligibility
  const eligibilityCheck = await validateUserEligibility(campaign.eligibility_criteria, userId);
  if (!eligibilityCheck.valid) {
    return { success: false, message: eligibilityCheck.message };
  }

  // Calculate discount
  const applicableAmount = applicabilityCheck.applicable_amount || cartTotal;
  let discountAmount = campaign.calculateDiscount(applicableAmount);

  // Ensure discount doesn't exceed cart total
  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  return {
    success: true,
    discount_amount: discountAmount,
    campaign_name: campaign.name
  };
};
```

## 2. Order Status Update (CRITICAL)

### 2.1. The Most Important Integration

This is the **most critical part** of the integration. When an order status changes to 'COMPLETED', 'PAID', or equivalent, you MUST update the coupon usage counters:

```javascript
const mongoose = require('mongoose');
const UserCoupon = require('../models/UserCoupon');
const CouponCampaign = require('../models/CouponCampaign');

const updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status, ...otherUpdates } = req.body;

    // Find the order
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    
    // Update order status
    Object.assign(order, { status, ...otherUpdates, updatedAt: new Date() });

    // CRITICAL: Handle coupon usage when order is completed/paid
    const completionStatuses = ['COMPLETED', 'PAID', 'DELIVERED']; // Adjust based on your status system
    const wasNotCompleted = !completionStatuses.includes(previousStatus);
    const isNowCompleted = completionStatuses.includes(status);

    if (wasNotCompleted && isNowCompleted && order.applied_coupon_code) {
      console.log(`Processing coupon usage for order ${orderId}, coupon: ${order.applied_coupon_code}`);
      
      try {
        await updateCouponUsage(order.applied_coupon_code, order.user_id, session);
      } catch (couponError) {
        console.error('Error updating coupon usage:', couponError);
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: 'Failed to update coupon usage'
        });
      }
    }

    // Handle coupon usage reversal if order is cancelled/refunded after completion
    const cancellationStatuses = ['CANCELLED', 'REFUNDED'];
    const wasCompleted = completionStatuses.includes(previousStatus);
    const isNowCancelled = cancellationStatuses.includes(status);

    if (wasCompleted && isNowCancelled && order.applied_coupon_code) {
      console.log(`Reversing coupon usage for order ${orderId}, coupon: ${order.applied_coupon_code}`);
      
      try {
        await reverseCouponUsage(order.applied_coupon_code, order.user_id, session);
      } catch (couponError) {
        console.error('Error reversing coupon usage:', couponError);
        // Don't fail the transaction for reversal errors, just log them
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

// Helper function to update coupon usage
const updateCouponUsage = async (couponCode, userId, session) => {
  // Find the user coupon
  const userCoupon = await UserCoupon.findOne({
    coupon_code: couponCode,
    user_id: userId
  }).session(session);

  if (!userCoupon) {
    throw new Error(`UserCoupon not found for code: ${couponCode}, user: ${userId}`);
  }

  // Find the campaign
  const campaign = await CouponCampaign.findById(userCoupon.coupon_campaign_id).session(session);
  if (!campaign) {
    throw new Error(`CouponCampaign not found for ID: ${userCoupon.coupon_campaign_id}`);
  }

  // Increment user coupon usage
  userCoupon.current_usage_count += 1;
  userCoupon.updatedAt = new Date();

  // Check if this usage meets the max limit for the user
  if (userCoupon.current_usage_count >= campaign.max_usage_per_user) {
    userCoupon.is_redeemed = true;
    userCoupon.redeemed_at = new Date();
  }

  await userCoupon.save({ session });

  // Increment campaign global usage
  await CouponCampaign.findByIdAndUpdate(
    campaign._id,
    { 
      $inc: { current_global_usage: 1 },
      updatedAt: new Date()
    },
    { session }
  );

  console.log(`Successfully updated coupon usage: ${couponCode}`);
};

// Helper function to reverse coupon usage (for cancellations/refunds)
const reverseCouponUsage = async (couponCode, userId, session) => {
  // Find the user coupon
  const userCoupon = await UserCoupon.findOne({
    coupon_code: couponCode,
    user_id: userId
  }).session(session);

  if (!userCoupon || userCoupon.current_usage_count === 0) {
    console.log(`No usage to reverse for coupon: ${couponCode}`);
    return;
  }

  // Decrement user coupon usage
  userCoupon.current_usage_count = Math.max(0, userCoupon.current_usage_count - 1);
  userCoupon.updatedAt = new Date();

  // If usage count drops below max, mark as not redeemed
  const campaign = await CouponCampaign.findById(userCoupon.coupon_campaign_id).session(session);
  if (campaign && userCoupon.current_usage_count < campaign.max_usage_per_user) {
    userCoupon.is_redeemed = false;
    userCoupon.redeemed_at = null;
  }

  await userCoupon.save({ session });

  // Decrement campaign global usage
  await CouponCampaign.findByIdAndUpdate(
    campaign._id,
    { 
      $inc: { current_global_usage: -1 },
      updatedAt: new Date()
    },
    { session }
  );

  console.log(`Successfully reversed coupon usage: ${couponCode}`);
};
```

## 3. Batch Order Processing

If you process orders in batches, ensure coupon usage is updated for each completed order:

```javascript
const processBatchOrders = async (orderIds) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const orderId of orderIds) {
      const order = await Order.findById(orderId).session(session);
      
      if (order && order.applied_coupon_code && order.status === 'PENDING') {
        // Update order status to completed
        order.status = 'COMPLETED';
        order.updatedAt = new Date();
        
        // Update coupon usage
        await updateCouponUsage(order.applied_coupon_code, order.user_id, session);
        
        await order.save({ session });
      }
    }

    await session.commitTransaction();
    console.log(`Processed ${orderIds.length} orders successfully`);
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing batch orders:', error);
    throw error;
  } finally {
    session.endSession();
  }
};
```

## 4. Data Migration (If Adding to Existing System)

If you're adding this to an existing system with orders that don't have coupon fields:

```javascript
const migrateExistingOrders = async () => {
  try {
    const result = await Order.updateMany(
      { 
        applied_coupon_code: { $exists: false }
      },
      {
        $set: {
          applied_coupon_code: null,
          coupon_discount_amount: 0,
          original_total_amount: '$total_amount', // Map to your existing total field
          final_total_amount: '$total_amount'
        }
      }
    );

    console.log(`Migrated ${result.modifiedCount} existing orders`);
  } catch (error) {
    console.error('Error migrating orders:', error);
  }
};
```

## 5. Testing the Integration

### 5.1. Test Order Flow with Coupon

```javascript
// Test script to verify integration
const testOrderWithCoupon = async () => {
  try {
    // 1. Create a test user coupon
    const testCoupon = await UserCoupon.create({
      coupon_campaign_id: 'TEST_CAMPAIGN_ID',
      user_id: 'TEST_USER_ID',
      coupon_code: 'TEST123',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // 2. Create an order with the coupon
    const testOrder = await Order.create({
      user_id: 'TEST_USER_ID',
      items: [{ product_id: 'TEST_PRODUCT', quantity: 1, price: 100 }],
      applied_coupon_code: 'TEST123',
      coupon_discount_amount: 20,
      original_total_amount: 100,
      final_total_amount: 80,
      status: 'PENDING'
    });

    // 3. Complete the order and verify coupon usage
    testOrder.status = 'COMPLETED';
    await testOrder.save();
    
    // Manually trigger coupon usage update
    await updateCouponUsage('TEST123', 'TEST_USER_ID');

    // 4. Verify coupon usage was incremented
    const updatedCoupon = await UserCoupon.findById(testCoupon._id);
    console.log('Coupon usage after order completion:', updatedCoupon.current_usage_count);

    // 5. Cleanup
    await UserCoupon.findByIdAndDelete(testCoupon._id);
    await Order.findByIdAndDelete(testOrder._id);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## 6. Monitoring and Alerts

Set up monitoring for:

1. **Failed coupon updates**: Log when coupon usage fails to update
2. **Data inconsistencies**: Regular checks for mismatched usage counts
3. **Performance**: Monitor transaction times for order completion

```javascript
// Example monitoring function
const checkCouponDataConsistency = async () => {
  try {
    const campaigns = await CouponCampaign.find({});
    
    for (const campaign of campaigns) {
      const actualUsage = await UserCoupon.aggregate([
        { $match: { coupon_campaign_id: campaign._id } },
        { $group: { _id: null, total: { $sum: '$current_usage_count' } } }
      ]);
      
      const actualTotal = actualUsage[0]?.total || 0;
      
      if (actualTotal !== campaign.current_global_usage) {
        console.error(`Data inconsistency in campaign ${campaign._id}: expected ${campaign.current_global_usage}, actual ${actualTotal}`);
      }
    }
  } catch (error) {
    console.error('Error checking data consistency:', error);
  }
};
```

## Summary

The key integration points are:

1. ✅ Add coupon fields to Order model
2. ✅ Validate and apply coupons during order creation
3. ✅ **MOST CRITICAL**: Update coupon usage when orders are completed
4. ✅ Use database transactions for data consistency
5. ✅ Handle edge cases (cancellations, refunds)
6. ✅ Monitor for data consistency

This ensures your coupon system accurately tracks usage and prevents fraud while maintaining data integrity.
