#!/usr/bin/env node

/**
 * Admin User Coupon Endpoints Test
 * Tests both list and single user coupon admin endpoints
 */

const testEndpoints = [
  {
    name: 'List Admin User Coupons',
    method: 'GET',
    url: 'http://localhost:3100/api/v1/admin/user-coupons?page=1&limit=3',
    expectedStatus: 200
  },
  {
    name: 'Get Single Admin User Coupon',
    method: 'GET', 
    url: 'http://localhost:3100/api/v1/admin/user-coupons/688057d10bc53f3b7be48db2',
    expectedStatus: 200
  },
  {
    name: 'Get Non-existent User Coupon',
    method: 'GET',
    url: 'http://localhost:3100/api/v1/admin/user-coupons/507f1f77bcf86cd799439011',
    expectedStatus: 404
  }
];

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4ZWZiZDUxYjk1ODhhMWRhNTRkNDEiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6InNrdW1hcnZAZ21haWwuY29tIiwiaWF0IjoxNzUzMjQ0NDkxLCJleHAiOjE3NTM4NDkyOTF9.ZnErcu_Quf5iGgrJrJIPkdnrUHzvMrZgtWNMKKPGv7U';

async function testEndpoint(test) {
  const command = `curl -s -w "\\nSTATUS:%{http_code}" -X ${test.method} "${test.url}" \\
    -H "Authorization: Bearer ${token}" \\
    -H "Content-Type: application/json"`;
  
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`📍 ${test.method} ${test.url}`);
  
  try {
    const { execSync } = require('child_process');
    const output = execSync(command, { encoding: 'utf8' });
    
    const lines = output.trim().split('\n');
    const statusLine = lines[lines.length - 1];
    const statusCode = parseInt(statusLine.replace('STATUS:', ''));
    
    const responseBody = lines.slice(0, -1).join('\n');
    
    if (statusCode === test.expectedStatus) {
      console.log(`✅ Status: ${statusCode} (Expected: ${test.expectedStatus})`);
      
      // Parse and show key response data
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.success) {
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log(`📊 Found ${parsed.data.length} user coupons`);
            if (parsed.pagination) {
              console.log(`📄 Page ${parsed.pagination.current_page} of ${parsed.pagination.total_pages} (Total: ${parsed.pagination.total_count})`);
            }
          } else if (parsed.data && parsed.data._id) {
            console.log(`🎟️  Coupon ID: ${parsed.data._id}`);
            console.log(`👤 User: ${parsed.data.user_id?.name || 'N/A'}`);
            console.log(`🏷️  Campaign: ${parsed.data.coupon_campaign_id?.name || 'N/A'}`);
            console.log(`🎯 Code: ${parsed.data.coupon_code}`);
            console.log(`📊 Status: ${parsed.data.status}`);
          }
        } else {
          console.log(`❌ Response: ${parsed.message}`);
        }
      } catch (e) {
        console.log(`📄 Raw response: ${responseBody.substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ Status: ${statusCode} (Expected: ${test.expectedStatus})`);
      console.log(`📄 Response: ${responseBody}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing Admin User Coupon Endpoints');
  console.log('='.repeat(50));
  
  for (const test of testEndpoints) {
    await testEndpoint(test);
  }
  
  console.log('\n✨ Test completed!');
}

runTests().catch(console.error);
