#!/usr/bin/env node

/**
 * Coupon API Endpoint Tester
 * Tests all coupon-related endpoints to verify their existence and functionality
 * 
 * Usage:
 *   node scripts/test-coupon-endpoints.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3100';

// Test endpoints
const endpoints = [
  // These should NOT exist according to our analysis
  { method: 'GET', path: '/api/v1/admin/coupons', shouldExist: false },
  { method: 'POST', path: '/api/v1/admin/coupons', shouldExist: false },
  
  // These SHOULD exist according to route files
  { method: 'GET', path: '/api/v1/admin/coupon-campaigns', shouldExist: true },
  { method: 'POST', path: '/api/v1/admin/coupon-campaigns', shouldExist: true },
  { method: 'GET', path: '/api/v1/user/coupons', shouldExist: true },
  { method: 'GET', path: '/api/v1/admin/user-coupons', shouldExist: true },
  
  // Health endpoint for comparison
  { method: 'GET', path: '/health', shouldExist: true },
  { method: 'GET', path: '/', shouldExist: true },
];

async function testEndpoint(endpoint) {
  try {
    const curlCommand = `curl -s -w "STATUS_CODE:%{http_code}" -X ${endpoint.method} "${BASE_URL}${endpoint.path}" -H "Accept: application/json"`;
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    // Parse the response
    const statusMatch = stdout.match(/STATUS_CODE:(\d+)$/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 0;
    const body = stdout.replace(/STATUS_CODE:\d+$/, '');
    
    let responseData = {};
    try {
      responseData = JSON.parse(body);
    } catch (e) {
      responseData = { raw: body };
    }
    
    const exists = status !== 404;
    const statusColor = status >= 200 && status < 300 ? '✅' : 
                       status === 401 ? '🔐' :
                       status === 404 ? '❌' : '⚠️';
    
    console.log(`${statusColor} ${endpoint.method} ${endpoint.path}`);
    console.log(`   Status: ${status}`);
    if (responseData && typeof responseData === 'object' && responseData.message) {
      console.log(`   Response: ${responseData.message}`);
    }
    
    if (endpoint.shouldExist && !exists) {
      console.log(`   ⚠️  EXPECTED to exist but got 404`);
    } else if (!endpoint.shouldExist && exists) {
      console.log(`   ⚠️  NOT EXPECTED to exist but got ${status}`);
    }
    
    console.log('');
    
    return {
      ...endpoint,
      status,
      exists,
      response: responseData
    };
    
  } catch (error) {
    console.log(`❌ ${endpoint.method} ${endpoint.path}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    return {
      ...endpoint,
      status: 'ERROR',
      exists: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🧪 Testing Coupon API Endpoints');
  console.log('================================\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n📊 Summary');
  console.log('===========\n');
  
  const existingEndpoints = results.filter(r => r.exists);
  const missingEndpoints = results.filter(r => !r.exists);
  const authProtectedEndpoints = results.filter(r => r.status === 401);
  
  console.log(`✅ Existing endpoints: ${existingEndpoints.length}`);
  existingEndpoints.forEach(e => {
    const authStatus = e.status === 401 ? ' (🔐 Auth Required)' : '';
    console.log(`   - ${e.method} ${e.path}${authStatus}`);
  });
  
  console.log(`\n❌ Missing endpoints: ${missingEndpoints.length}`);
  missingEndpoints.forEach(e => {
    console.log(`   - ${e.method} ${e.path}`);
  });
  
  console.log(`\n🔐 Auth-protected endpoints: ${authProtectedEndpoints.length}`);
  authProtectedEndpoints.forEach(e => {
    console.log(`   - ${e.method} ${e.path}`);
  });
  
  // Check for discrepancies
  console.log('\n🔍 Discrepancy Analysis');
  console.log('=======================\n');
  
  const discrepancies = results.filter(r => 
    (r.shouldExist && !r.exists) || (!r.shouldExist && r.exists)
  );
  
  if (discrepancies.length === 0) {
    console.log('✅ No discrepancies found - all endpoints match expectations!');
  } else {
    console.log(`⚠️  Found ${discrepancies.length} discrepancies:`);
    discrepancies.forEach(d => {
      if (d.shouldExist && !d.exists) {
        console.log(`   - ${d.method} ${d.path}: Expected to exist but is missing (404)`);
      } else {
        console.log(`   - ${d.method} ${d.path}: Not expected to exist but responds with ${d.status}`);
      }
    });
  }
  
  console.log('\n💡 Recommendations');
  console.log('==================\n');
  
  // Check the problematic endpoint specifically
  const adminCouponsResult = results.find(r => r.path === '/api/v1/admin/coupons');
  if (adminCouponsResult && adminCouponsResult.exists) {
    console.log('⚠️  ISSUE FOUND: /api/v1/admin/coupons endpoint exists but should not!');
    console.log('   This conflicts with the route analysis. Possible causes:');
    console.log('   1. There might be a wildcard route catching this');
    console.log('   2. The route might be defined elsewhere');
    console.log('   3. There might be middleware redirecting this request');
    console.log('   \n   ✅ SOLUTION: Use /api/v1/admin/coupon-campaigns instead');
  } else {
    console.log('✅ /api/v1/admin/coupons correctly returns 404 as expected');
  }
  
  const userCouponsResult = results.find(r => r.path === '/api/v1/user/coupons');
  if (userCouponsResult && userCouponsResult.status === 401) {
    console.log('\n✅ /api/v1/user/coupons exists and requires authentication as expected');
    console.log('   To test this endpoint, you need to:');
    console.log('   1. Login to get a JWT token');
    console.log('   2. Include "Authorization: Bearer <token>" header');
  }
  
  console.log('\n📚 Quick Reference');
  console.log('==================\n');
  console.log('Correct Coupon Endpoints:');
  console.log('- Admin Campaigns: /api/v1/admin/coupon-campaigns');
  console.log('- User Coupons: /api/v1/user/coupons (auth required)');
  console.log('- Admin User Coupons: /api/v1/admin/user-coupons');
  console.log('\nIncorrect Endpoint:');
  console.log('- ❌ /api/v1/admin/coupons (use coupon-campaigns instead)');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
