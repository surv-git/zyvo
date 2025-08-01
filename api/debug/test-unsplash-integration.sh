#!/bin/bash

# Test script to verify Unsplash integration
# Tests API endpoints and automatic image population

echo "🖼️  Testing Unsplash Integration"
echo "================================"

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed. Please install jq to run this script."
    exit 1
fi

# Function to get admin token (replace with actual admin credentials)
get_admin_token() {
    echo "🔐 Getting admin authentication token..."
    
    # Replace with your admin credentials
    ADMIN_EMAIL="admin@example.com"
    ADMIN_PASSWORD="your_admin_password"
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    token=$(echo "$response" | jq -r '.accessToken // empty')
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        echo "✅ Admin token obtained"
        echo "$token"
    else
        echo "❌ Failed to get admin token. Please update admin credentials in this script."
        echo "Response: $response"
        return 1
    fi
}

# Get admin token
ADMIN_TOKEN=$(get_admin_token)
if [ $? -ne 0 ]; then
    echo "⚠️  Skipping admin-only tests due to authentication failure"
    ADMIN_TOKEN=""
fi

echo ""
echo "📊 Test 1: Check Unsplash service status"
echo "========================================"

if [ -n "$ADMIN_TOKEN" ]; then
    response=$(curl -s -X GET "$BASE_URL/unsplash/status" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    configured=$(echo "$response" | jq -r '.data.configured // false')
    if [ "$configured" = "true" ]; then
        echo "✅ Unsplash service is configured and ready"
    else
        echo "❌ Unsplash service not configured. Please set UNSPLASH_ACCESS_KEY in .env"
        echo "⚠️  Remaining tests will be skipped"
        exit 1
    fi
else
    echo "⚠️  Skipping status check - no admin token"
fi

echo ""
echo "🔍 Test 2: Search for images"
echo "============================"

if [ -n "$ADMIN_TOKEN" ]; then
    response=$(curl -s -X GET "$BASE_URL/unsplash/search?query=electronics&count=3" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    count=$(echo "$response" | jq '.count // 0')
    if [ "$count" -gt 0 ]; then
        echo "✅ Found $count images for 'electronics'"
    else
        echo "❌ No images found"
    fi
else
    echo "⚠️  Skipping search test - no admin token"
fi

echo ""
echo "📦 Test 3: Create product with auto-generated images"
echo "=================================================="

if [ -n "$ADMIN_TOKEN" ]; then
    # First, get a category ID
    categories_response=$(curl -s -X GET "$BASE_URL/categories?limit=1" \
        -H "Content-Type: application/json")
    
    category_id=$(echo "$categories_response" | jq -r '.data[0]._id // empty')
    
    if [ -n "$category_id" ] && [ "$category_id" != "null" ]; then
        echo "Using category ID: $category_id"
        
        # Create product without images (should auto-fetch from Unsplash)
        product_data='{
            "name": "Test Wireless Headphones",
            "description": "High-quality wireless headphones for testing Unsplash integration",
            "short_description": "Test headphones with auto-generated images",
            "category_id": "'$category_id'"
        }'
        
        echo "Creating product without images..."
        response=$(curl -s -X POST "$BASE_URL/products" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$product_data")
        
        echo "Response:"
        echo "$response" | jq '.'
        
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            product_id=$(echo "$response" | jq -r '.data._id')
            images_count=$(echo "$response" | jq '.data.images | length')
            echo "✅ Product created successfully with ID: $product_id"
            echo "📸 Auto-generated images count: $images_count"
            
            if [ "$images_count" -gt 0 ]; then
                echo "✅ Unsplash integration working - images auto-populated"
                echo "Sample image URL:"
                echo "$response" | jq -r '.data.images[0]'
            else
                echo "⚠️  No images were auto-populated (this might be expected if Unsplash quota is exceeded)"
            fi
        else
            echo "❌ Failed to create product"
        fi
    else
        echo "❌ No categories found. Please create a category first."
    fi
else
    echo "⚠️  Skipping product creation test - no admin token"
fi

echo ""
echo "📂 Test 4: Create category with auto-generated image"
echo "================================================="

if [ -n "$ADMIN_TOKEN" ]; then
    # Create category without image (should auto-fetch from Unsplash)
    category_data='{
        "name": "Test Electronics Category",
        "description": "Test category for Unsplash integration testing"
    }'
    
    echo "Creating category without image..."
    response=$(curl -s -X POST "$BASE_URL/categories" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$category_data")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        category_id=$(echo "$response" | jq -r '.data._id')
        image_url=$(echo "$response" | jq -r '.data.image_url // empty')
        echo "✅ Category created successfully with ID: $category_id"
        
        if [ -n "$image_url" ] && [ "$image_url" != "null" ]; then
            echo "✅ Unsplash integration working - image auto-populated"
            echo "Image URL: $image_url"
        else
            echo "⚠️  No image was auto-populated"
        fi
    else
        echo "❌ Failed to create category"
    fi
else
    echo "⚠️  Skipping category creation test - no admin token"
fi

echo ""
echo "🚀 Test 5: Bulk image population (background process)"
echo "=================================================="

if [ -n "$ADMIN_TOKEN" ]; then
    # Start bulk population in background
    populate_data='{
        "overwrite": false,
        "productLimit": 5,
        "categoryLimit": 3
    }'
    
    echo "Starting bulk image population..."
    response=$(curl -s -X POST "$BASE_URL/unsplash/populate" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$populate_data")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        echo "✅ Bulk population started in background"
        echo "📝 Check server logs for progress updates"
    else
        echo "❌ Failed to start bulk population"
    fi
else
    echo "⚠️  Skipping bulk population test - no admin token"
fi

echo ""
echo "🎯 Summary"
echo "=========="
echo "✅ Unsplash Integration Features:"
echo "   - Automatic image fetching for new products"
echo "   - Automatic image fetching for new categories"
echo "   - Manual image search API"
echo "   - Bulk image population utility"
echo "   - Image suggestions for existing items"
echo ""
echo "📚 Available API Endpoints:"
echo "   GET  /api/v1/unsplash/status"
echo "   GET  /api/v1/unsplash/search"
echo "   GET  /api/v1/unsplash/product/{id}/suggestions"
echo "   GET  /api/v1/unsplash/category/{id}/suggestions"
echo "   POST /api/v1/unsplash/populate"
echo ""
echo "🛠️  CLI Tools:"
echo "   node scripts/populate-images.js [options]"
echo ""
echo "📝 Note: All Unsplash endpoints require admin authentication"
