#!/bin/bash

# Test script to debug products pagination issue
# Testing /api/v1/products endpoint with different parameters

BASE_URL="http://localhost:3100/api/v1/products"

echo "=== Testing Products API Pagination ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Default parameters
echo "Test 1: Default parameters (should return 10 items by default)"
echo "GET $BASE_URL"
curl -s "$BASE_URL" | jq '.data | length, .pagination'
echo ""

# Test 2: Limit 5
echo "Test 2: Limit 5"
echo "GET $BASE_URL?limit=5"
curl -s "$BASE_URL?limit=5" | jq '.data | length, .pagination'
echo ""

# Test 3: Limit 20
echo "Test 3: Limit 20"
echo "GET $BASE_URL?limit=20" 
curl -s "$BASE_URL?limit=20" | jq '.data | length, .pagination'
echo ""

# Test 4: Page 2 with limit 10
echo "Test 4: Page 2 with limit 10"
echo "GET $BASE_URL?page=2&limit=10"
curl -s "$BASE_URL?page=2&limit=10" | jq '.data | length, .pagination'
echo ""

# Test 5: Limit 1 (should return only 1 item)
echo "Test 5: Limit 1"
echo "GET $BASE_URL?limit=1"
curl -s "$BASE_URL?limit=1" | jq '.data | length, .pagination'
echo ""

# Test 6: Check total count
echo "Test 6: Get total count and first few items"
echo "GET $BASE_URL?limit=3"
RESPONSE=$(curl -s "$BASE_URL?limit=3")
echo "Items returned: $(echo $RESPONSE | jq '.data | length')"
echo "Pagination info: $(echo $RESPONSE | jq '.pagination')"
echo ""

echo "=== Raw response for limit=3 ==="
curl -s "$BASE_URL?limit=3" | jq '.'
