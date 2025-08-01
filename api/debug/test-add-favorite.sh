#!/bin/bash

# Test script to add a favorite and see the response structure
BASE_URL="http://localhost:3100"

echo "🧪 Testing Add Favorite Response Structure"
echo "=========================================="

# Get a valid token first
echo "🔐 Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get authentication token"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Test adding a favorite with product_variant_id
echo ""
echo "📝 Testing ADD FAVORITE with product_variant_id..."
ADD_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/user/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_variant_id": "687b33680a7b4450b31334f6",
    "user_notes": "Testing add favorite response structure"
  }')

HTTP_STATUS=$(echo "$ADD_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$ADD_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 HTTP Status: $HTTP_STATUS"
echo "📝 Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

# Test adding a favorite with product_id
echo ""
echo "📝 Testing ADD FAVORITE with product_id..."
ADD_RESPONSE2=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/user/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "687b21467dcb8dc3b6bd4e2d",
    "user_notes": "Testing add favorite with product_id"
  }')

HTTP_STATUS2=$(echo "$ADD_RESPONSE2" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY2=$(echo "$ADD_RESPONSE2" | sed '/HTTP_STATUS:/d')

echo "📊 HTTP Status: $HTTP_STATUS2"
echo "📝 Response Body:"
echo "$RESPONSE_BODY2" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY2"

echo ""
echo "🏁 Test completed"
