/**
 * Test script to verify order placement functionality
 */

const axios = require('axios');

// Test order placement with sample data
async function testOrderPlacement() {
  try {
    const orderData = {
      shipping_address: {
        address_line_1: "123 Test Street",
        address_line_2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India"
      },
      billing_address: {
        address_line_1: "123 Test Street",
        address_line_2: "Apt 4B", 
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India"
      },
      is_cod: true
    };

    console.log('Testing order placement...');
    console.log('Request payload:', JSON.stringify(orderData, null, 2));

    const response = await axios.post('http://localhost:3100/api/v1/user/orders', orderData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but test the validation
      }
    });

    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testOrderPlacement();
