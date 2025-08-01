#!/bin/bash

echo "🧪 Testing Multiple Values Support for category_id and brand_id"
echo "=============================================================="

API_BASE="http://localhost:3100/api/v1"

echo ""
echo "1️⃣ Getting sample categories and brands for testing..."
categories_response=$(curl -s "${API_BASE}/categories?page=1&limit=3")
brands_response=$(curl -s "${API_BASE}/brands?page=1&limit=3")

category1=$(echo "$categories_response" | jq -r '.data[0]._id // empty')
category2=$(echo "$categories_response" | jq -r '.data[1]._id // empty')
category1_name=$(echo "$categories_response" | jq -r '.data[0].name // empty')
category2_name=$(echo "$categories_response" | jq -r '.data[1].name // empty')

brand1=$(echo "$brands_response" | jq -r '.data[0]._id // empty')
brand2=$(echo "$brands_response" | jq -r '.data[1]._id // empty')
brand1_name=$(echo "$brands_response" | jq -r '.data[0].name // empty')
brand2_name=$(echo "$brands_response" | jq -r '.data[1].name // empty')

if [ -n "$category1" ] && [ "$category1" != "null" ]; then
    echo "📂 Category 1: $category1_name ($category1)"
    echo "📂 Category 2: $category2_name ($category2)"
    echo "🏷️  Brand 1: $brand1_name ($brand1)"
    echo "🏷️  Brand 2: $brand2_name ($brand2)"
    
    echo ""
    echo "2️⃣ Testing single category_id (baseline)"
    echo "Request: GET /api/v1/products?category_id=$category1&limit=3"
    single_cat_response=$(curl -s "${API_BASE}/products?category_id=${category1}&limit=3")
    single_cat_count=$(echo "$single_cat_response" | jq '.pagination.totalItems // 0')
    echo "   ✅ Single category results: $single_cat_count products"
    
    echo ""
    echo "3️⃣ Testing multiple category_id (comma-separated)"
    echo "Request: GET /api/v1/products?category_id=$category1,$category2&limit=5"
    multi_cat_response=$(curl -s "${API_BASE}/products?category_id=${category1},${category2}&limit=5")
    multi_cat_success=$(echo "$multi_cat_response" | jq '.success // false')
    multi_cat_count=$(echo "$multi_cat_response" | jq '.pagination.totalItems // 0')
    
    if [ "$multi_cat_success" = "true" ]; then
        echo "   ✅ Multiple categories SUCCESS: $multi_cat_count products"
        echo "   📦 Sample products:"
        echo "$multi_cat_response" | jq -r '.data[0:2][] | "      • \(.name) (Category: \(.category_id.name // "N/A"))"'
    else
        echo "   ❌ Multiple categories FAILED:"
        echo "$multi_cat_response" | jq '.message, .errors'
    fi
    
    echo ""
    echo "4️⃣ Testing single brand_id (baseline)"
    echo "Request: GET /api/v1/products?brand_id=$brand1&limit=3"
    single_brand_response=$(curl -s "${API_BASE}/products?brand_id=${brand1}&limit=3")
    single_brand_count=$(echo "$single_brand_response" | jq '.pagination.totalItems // 0')
    echo "   ✅ Single brand results: $single_brand_count products"
    
    echo ""
    echo "5️⃣ Testing multiple brand_id (comma-separated)"
    echo "Request: GET /api/v1/products?brand_id=$brand1,$brand2&limit=5"
    multi_brand_response=$(curl -s "${API_BASE}/products?brand_id=${brand1},${brand2}&limit=5")
    multi_brand_success=$(echo "$multi_brand_response" | jq '.success // false')
    multi_brand_count=$(echo "$multi_brand_response" | jq '.pagination.totalItems // 0')
    
    if [ "$multi_brand_success" = "true" ]; then
        echo "   ✅ Multiple brands SUCCESS: $multi_brand_count products"
        echo "   📦 Sample products:"
        echo "$multi_brand_response" | jq -r '.data[0:2][] | "      • \(.name) (Brand: \(.brand_id.name // "N/A"))"'
    else
        echo "   ❌ Multiple brands FAILED:"
        echo "$multi_brand_response" | jq '.message, .errors'
    fi
    
    echo ""
    echo "6️⃣ Testing combined filters (multiple categories + multiple brands)"
    echo "Request: GET /api/v1/products?category_id=$category1,$category2&brand_id=$brand1,$brand2&limit=5"
    combined_response=$(curl -s "${API_BASE}/products?category_id=${category1},${category2}&brand_id=${brand1},${brand2}&limit=5")
    combined_success=$(echo "$combined_response" | jq '.success // false')
    combined_count=$(echo "$combined_response" | jq '.pagination.totalItems // 0')
    
    if [ "$combined_success" = "true" ]; then
        echo "   ✅ Combined filters SUCCESS: $combined_count products"
        echo "   📦 Sample products:"
        echo "$combined_response" | jq -r '.data[0:2][] | "      • \(.name) (Category: \(.category_id.name // "N/A"), Brand: \(.brand_id.name // "N/A"))"'
    else
        echo "   ❌ Combined filters FAILED:"
        echo "$combined_response" | jq '.message, .errors'
    fi
    
    echo ""
    echo "7️⃣ Testing validation error (invalid ObjectId)"
    echo "Request: GET /api/v1/products?category_id=invalid,${category1}&limit=3"
    invalid_response=$(curl -s "${API_BASE}/products?category_id=invalid,${category1}&limit=3")
    invalid_success=$(echo "$invalid_response" | jq '.success // false')
    
    if [ "$invalid_success" = "false" ]; then
        echo "   ✅ Validation correctly REJECTED invalid ObjectId"
        echo "   📝 Error message:"
        echo "$invalid_response" | jq '.message, .errors'
    else
        echo "   ❌ Validation should have failed but didn't"
    fi
    
else
    echo "❌ No categories found for testing"
fi

echo ""
echo "✅ Multiple values testing completed!"
