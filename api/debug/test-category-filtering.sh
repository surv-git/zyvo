#!/bin/bash

echo "🧪 Testing Category Filtering in Products API"
echo "=============================================="

API_BASE="http://localhost:3100/api/v1"

echo ""
echo "1️⃣ Testing: Get all products (no filtering)"
echo "Request: GET /api/v1/products?page=1&limit=5"
curl -s "${API_BASE}/products?page=1&limit=5" | jq '.pagination.totalItems, .data | length'

echo ""
echo "2️⃣ Testing: category=Clothing (current format - should fail validation)"
echo "Request: GET /api/v1/products?category=Clothing&page=1&limit=5"
response=$(curl -s "${API_BASE}/products?category=Clothing&page=1&limit=5")
echo "$response" | jq '.success, .message, .errors'

echo ""
echo "3️⃣ Getting sample category for testing..."
echo "Request: GET /api/v1/categories?page=1&limit=1"
category_response=$(curl -s "${API_BASE}/categories?page=1&limit=1")
category_id=$(echo "$category_response" | jq -r '.data[0]._id // empty')
category_name=$(echo "$category_response" | jq -r '.data[0].name // empty')

if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
    echo "📂 Sample category: $category_name (ID: $category_id)"
    
    echo ""
    echo "4️⃣ Testing: category_id with ObjectId (correct format)"
    echo "Request: GET /api/v1/products?category_id=$category_id&page=1&limit=5"
    correct_response=$(curl -s "${API_BASE}/products?category_id=${category_id}&page=1&limit=5")
    echo "$correct_response" | jq '.success, .pagination.totalItems, (.data | length)'
    
    echo ""
    echo "📦 Sample products in this category:"
    echo "$correct_response" | jq -r '.data[0:3][] | "   • \(.name) (Category: \(.category_id.name // "N/A"))"'
else
    echo "❌ No categories found for testing"
fi

echo ""
echo "✅ Test completed!"
