#!/usr/bin/env node

/**
 * Coupon Campaign Creation Test
 * Tests the POST /api/v1/admin/coupon-campaigns endpoint with various payloads
 */

const testPayloads = [
  {
    name: 'Minimal Valid Campaign',
    payload: {
      name: 'Test Campaign',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      valid_from: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // One week from now
    }
  },
  {
    name: 'Complete Campaign',
    payload: {
      name: 'Summer Sale 2025',
      description: 'Get amazing discounts this summer',
      code_prefix: 'SUMMER',
      discount_type: 'PERCENTAGE',
      discount_value: 25,
      min_purchase_amount: 100,
      max_coupon_discount: 50,
      valid_from: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_global_usage: 1000,
      max_usage_per_user: 1,
      is_unique_per_user: true,
      eligibility_criteria: ['NEW_USER'],
      is_active: true
    }
  },
  {
    name: 'Free Shipping Campaign',
    payload: {
      name: 'Free Shipping Weekend',
      discount_type: 'FREE_SHIPPING',
      discount_value: 0,
      valid_from: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
];

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4ZWZiZDUxYjk1ODhhMWRhNTRkNDEiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6InNrdW1hcnZAZ21haWwuY29tIiwiaWF0IjoxNzUzMjQ0NDkxLCJleHAiOjE3NTM4NDkyOTF9.ZnErcu_Quf5iGgrJrJIPkdnrUHzvMrZgtWNMKKPGv7U';

async function testCampaignCreation(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log('📤 Payload:', JSON.stringify(test.payload, null, 2));
  
  const tempFile = `/tmp/payload_${Date.now()}.json`;
  require('fs').writeFileSync(tempFile, JSON.stringify(test.payload));
  
  const command = `curl -s -w "\\nSTATUS:%{http_code}" -X POST "http://localhost:3100/api/v1/admin/coupon-campaigns" \\
    -H "Authorization: Bearer ${token}" \\
    -H "Content-Type: application/json" \\
    -d @${tempFile}`;
  
  try {
    const { execSync } = require('child_process');
    const output = execSync(command, { encoding: 'utf8' });
    
    const lines = output.trim().split('\n');
    const statusLine = lines[lines.length - 1];
    const statusCode = parseInt(statusLine.replace('STATUS:', ''));
    
    const responseBody = lines.slice(0, -1).join('\n');
    
    console.log(`📊 Status: ${statusCode}`);
    
    try {
      const parsed = JSON.parse(responseBody);
      if (statusCode === 201) {
        console.log(`✅ Success: ${parsed.message}`);
        console.log(`🆔 Campaign ID: ${parsed.data?._id}`);
        console.log(`🏷️  Campaign Name: ${parsed.data?.name}`);
      } else {
        console.log(`❌ Error: ${parsed.message}`);
        if (parsed.errors && Array.isArray(parsed.errors)) {
          console.log('📋 Validation Errors:');
          parsed.errors.forEach((err, index) => {
            console.log(`   ${index + 1}. ${err.msg || err.message} (Field: ${err.param || err.field || 'unknown'})`);
          });
        }
      }
    } catch (e) {
      console.log(`📄 Raw response: ${responseBody}`);
    }
    
    // Cleanup
    require('fs').unlinkSync(tempFile);
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    // Cleanup
    try { require('fs').unlinkSync(tempFile); } catch {}
  }
}

async function runTests() {
  console.log('🚀 Testing Coupon Campaign Creation');
  console.log('='.repeat(60));
  
  for (const test of testPayloads) {
    await testCampaignCreation(test);
  }
  
  console.log('\n✨ Test completed!');
}

runTests().catch(console.error);
