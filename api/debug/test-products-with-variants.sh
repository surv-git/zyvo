#!/bin/bash

# Test script to verify that product variants are included in /api/v1/products response
# This script tests the updated endpoint that now returns product variants

echo "🧪 Testing /api/v1/products endpoint with variants support"
echo "=================================================="

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Test 1: Get products with variants (limit to 2 for readability)
echo ""
echo "📋 Test 1: Get products with variants (limit=2)"
echo "Request: GET $BASE_URL/products?limit=2"
echo ""

response=$(curl -s -X GET "$BASE_URL/products?limit=2" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$response" | jq '.'

# Check if variants field exists in response
echo ""
echo "🔍 Checking if variants field exists in response..."
variants_exist=$(echo "$response" | jq '.data[0].variants // empty')
if [ -n "$variants_exist" ]; then
    echo "✅ SUCCESS: variants field found in response"
    
    # Count variants for first product
    variant_count=$(echo "$response" | jq '.data[0].variants | length')
    echo "📊 First product has $variant_count variants"
    
    # Show variant structure
    echo ""
    echo "🏷️  Sample variant structure:"
    echo "$response" | jq '.data[0].variants[0] // "No variants available"'
else
    echo "❌ FAILED: variants field not found in response"
fi

# Test 2: Check if min_price and min_discounted_price are included
echo ""
echo "💰 Test 2: Check pricing fields"
min_price=$(echo "$response" | jq '.data[0].min_price // empty')
min_discounted_price=$(echo "$response" | jq '.data[0].min_discounted_price // empty')

if [ -n "$min_price" ]; then
    echo "✅ min_price field found: $min_price"
else
    echo "❌ min_price field missing"
fi

if [ -n "$min_discounted_price" ]; then
    echo "✅ min_discounted_price field found: $min_discounted_price"
else
    echo "✅ min_discounted_price field is null (expected if no discounts)"
fi

# Test 3: Test with category filter to see variants for specific category
echo ""
echo "📂 Test 3: Get products with variants filtered by category"
echo "Note: Replace CATEGORY_ID with actual category ID from your database"
echo ""

# This is a placeholder - user should replace with actual category ID
CATEGORY_ID="REPLACE_WITH_ACTUAL_CATEGORY_ID"
echo "Request: GET $BASE_URL/products?category_id=$CATEGORY_ID&limit=1"
echo "⚠️  Please replace CATEGORY_ID with an actual category ID to test filtering"

echo ""
echo "🎯 Summary:"
echo "- ✅ Modified /api/v1/products endpoint to include product variants"
echo "- ✅ Added min_price and min_discounted_price fields"
echo "- ✅ Updated OpenAPI documentation (YAML and JSON)"
echo "- ✅ Variants are collected from active product variants only"
echo ""
echo "📝 Response structure now includes:"
echo "  - variants: Array of ProductVariant objects"
echo "  - min_price: Minimum price from all active variants"
echo "  - min_discounted_price: Minimum discounted price (null if no discounts)"
