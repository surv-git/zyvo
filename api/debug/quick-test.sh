#!/bin/bash

echo "Testing products API with valid parameters..."

echo "Test 1: limit=5"
curl -s "http://localhost:3000/api/v1/products?limit=5" | head -20

echo -e "\n\nTest 2: limit=1"  
curl -s "http://localhost:3000/api/v1/products?limit=1" | head -20

echo -e "\n\nTest 3: default parameters"
curl -s "http://localhost:3000/api/v1/products" | head -20
