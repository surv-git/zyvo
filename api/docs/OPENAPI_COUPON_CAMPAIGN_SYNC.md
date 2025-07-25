# OpenAPI CouponCampaign Schema Synchronization

## Overview
This document outlines the discrepancies found between the CouponCampaign Mongoose model and the OpenAPI documentation, and the fixes applied to synchronize them.

## Major Discrepancies Found

### 1. **Schema Structure Mismatch**
- **OpenAPI (Before)**: Used outdated field names and enum values
- **Model (Current)**: Modern schema with comprehensive validation
- **Fix Applied**: Complete schema rewrite to match model

### 2. **Required Fields**
- **OpenAPI (Before)**: `required: [code, discount_type, discount_value]`
- **Model (Current)**: `required: [name, discount_type, discount_value, valid_from, valid_until]`
- **Fix Applied**: Updated required fields to match model validation

### 3. **Field Name Inconsistencies**

| OpenAPI (Before) | Model (Current) | Status |
|------------------|-----------------|--------|
| `code` | Not present | ❌ Removed (wrong field) |
| `name` | `name` | ✅ Fixed |
| `discount_type` enum | `[percentage, fixed_amount]` | `[PERCENTAGE, AMOUNT, FREE_SHIPPING]` | ✅ Fixed |
| `min_order_value` | `min_purchase_amount` | ✅ Fixed |
| `max_discount_amount` | `max_coupon_discount` | ✅ Fixed |
| `usage_limit` | `max_global_usage` | ✅ Fixed |
| `usage_count` | `current_global_usage` | ✅ Fixed |
| `starts_at` | `valid_from` | ✅ Fixed |
| `expires_at` | `valid_until` | ✅ Fixed |
| `applicable_products` | `applicable_product_variant_ids` | ✅ Fixed |
| `applicable_categories` | `applicable_category_ids` | ✅ Fixed |

### 4. **Missing Fields in OpenAPI**

The following fields were completely missing from the OpenAPI schema:

- `slug` - Auto-generated URL-friendly identifier
- `code_prefix` - Prefix for generated coupon codes
- `max_usage_per_user` - Usage limit per user
- `current_global_usage` - Current usage tracking
- `is_unique_per_user` - User uniqueness constraint
- `eligibility_criteria` - User eligibility array with enum values
- `validity_period` - Virtual field for validity info
- `usage_stats` - Virtual field for usage statistics

### 5. **Eligibility Criteria Issue**

- **Model Enum Values**: `['NEW_USER', 'REFERRAL', 'FIRST_ORDER', 'SPECIFIC_USER_GROUP', 'ALL_USERS', 'NONE']`
- **OpenAPI (Before)**: Not present
- **Fix Applied**: Added complete eligibility_criteria field with proper enum values

## POST Endpoint Request Schema Issues

### Before (Incorrect)
```yaml
required: [name, discount_type, discount_value]
properties:
  name: {minLength: 3}  # Wrong - model allows 1+
  min_order_value: {}   # Wrong field name
  max_discount_amount: {} # Wrong field name
  starts_at: {}         # Wrong field name
  expires_at: {}        # Wrong field name
```

### After (Corrected)
```yaml
required: [name, discount_type, discount_value, valid_from, valid_until]
properties:
  name: {minLength: 1, maxLength: 100}
  min_purchase_amount: {}
  max_coupon_discount: {}
  valid_from: {}
  valid_until: {}
  eligibility_criteria: {enum: [NEW_USER, REFERRAL, FIRST_ORDER, SPECIFIC_USER_GROUP, ALL_USERS, NONE]}
```

## Validation Rules Synchronized

### Discount Value Validation
- **PERCENTAGE**: 0-100 range
- **AMOUNT**: Positive values
- **FREE_SHIPPING**: Positive values

### Date Validation
- `valid_until` must be after `valid_from`
- Both dates are required

### String Length Limits
- `name`: 1-100 characters
- `description`: 0-500 characters
- `code_prefix`: 0-20 characters

## Virtual Fields Added

Added documentation for virtual fields that are computed by the model:

1. **validity_period**: Contains validity status and date range
2. **usage_stats**: Contains usage statistics and percentages

## Impact of Changes

✅ **Fixed Issues**:
- API documentation now matches actual model structure
- Request validation will work correctly
- Client SDKs generated from OpenAPI will be accurate
- Developer documentation is now reliable

⚠️ **Breaking Changes**:
- Field names changed in API documentation
- Required fields updated
- Enum values corrected

## Verification

The OpenAPI schema now accurately reflects:
- All model fields and their types
- Correct validation rules and constraints
- Proper enum values (especially for eligibility_criteria)
- Virtual fields for complete API response documentation
- Accurate request body schema for POST endpoints

## Next Steps

1. ✅ Update OpenAPI schema (completed)
2. 🔄 Regenerate client SDKs if using automated tools
3. 🔄 Update frontend/client code to use correct field names
4. 🔄 Validate all coupon-related endpoints against updated schema
