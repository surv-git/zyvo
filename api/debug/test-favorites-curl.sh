#!/bin/bash

# Favorites Authentication Test Script using curl
# This script helps debug the 401 error on /api/v1/user/favorites

echo "🚀 Favorites Authentication Test with curl"
echo "=========================================="

# Configuration
BASE_URL="http://localhost:3100"
TEST_EMAIL="skumarv@gmail.com"  # Replace with your test user email
TEST_PASSWORD="Password@123!"    # Replace with your test user password

echo "📋 Configuration:"
echo "  Server URL: $BASE_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Step 1: Login to get token
echo "Step 1: Attempting login..."
echo "curl -X POST $BASE_URL/api/v1/auth/login"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "📝 Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo "✅ Token extracted successfully"
    echo "🔑 Token preview: ${TOKEN:0:20}..."
    echo ""
    
    # Step 2: Test favorites endpoint
    echo "Step 2: Testing favorites endpoint..."
    echo "curl -X GET $BASE_URL/api/v1/user/favorites -H \"Authorization: Bearer [TOKEN]\""
    
    FAVORITES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/user/favorites" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status
    HTTP_STATUS=$(echo "$FAVORITES_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$FAVORITES_RESPONSE" | sed '/HTTP_STATUS:/d')
    
    echo "📊 HTTP Status: $HTTP_STATUS"
    echo "📝 Response Body:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Success! Favorites endpoint working correctly"
    elif [ "$HTTP_STATUS" = "401" ]; then
        echo "❌ 401 Unauthorized Error"
        echo ""
        echo "🔍 Debugging Steps:"
        echo "1. Check if the token is valid and not expired"
        echo "2. Verify the Authorization header format: 'Bearer <token>'"
        echo "3. Ensure the user exists and is active in the database"
        echo "4. Check server logs for detailed error information"
        echo ""
        echo "🔧 Manual Token Test:"
        echo "Replace YOUR_TOKEN_HERE with your actual token:"
        echo "curl -X GET $BASE_URL/api/v1/user/favorites \\"
        echo "  -H \"Authorization: Bearer YOUR_TOKEN_HERE\" \\"
        echo "  -H \"Content-Type: application/json\""
    else
        echo "⚠️ Unexpected HTTP status: $HTTP_STATUS"
    fi
    
else
    echo "❌ Failed to extract token from login response"
    echo "🔍 Possible issues:"
    echo "1. Login credentials are incorrect"
    echo "2. Server is not running"
    echo "3. Login endpoint is not working"
    echo "4. Response format has changed"
fi

echo ""
echo "🏁 Test completed"

# Additional debugging information
echo ""
echo "📋 Additional Debugging Commands:"
echo ""
echo "# Check if server is running:"
echo "curl -s $BASE_URL/health || echo 'Server not responding'"
echo ""
echo "# Test with a manual token (replace YOUR_TOKEN):"
echo "curl -X GET $BASE_URL/api/v1/user/favorites \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -v  # verbose output for debugging"
echo ""
echo "# Check server logs:"
echo "tail -f /path/to/your/server/logs"
