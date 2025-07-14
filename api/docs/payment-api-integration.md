# Payment Methods API - Integration Guide

## Overview
This guide provides practical examples for integrating with the User Payment Methods Management System API endpoints.

## Base URL
All API endpoints use the base path: `/api/v1/user/payment-methods`

## Authentication
All endpoints require user authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Add Payment Method

#### Credit/Debit Card
```bash
POST /api/v1/user/payment-methods

# Request Body
{
  "method_type": "CREDIT_CARD",
  "alias": "My Primary Visa",
  "is_default": true,
  "details": {
    "card_brand": "Visa",
    "last4_digits": "1234",
    "expiry_month": "12",
    "expiry_year": "2025",
    "card_holder_name": "John Doe",
    "token": "tok_razorpay_secure_token_xyz123"
  }
}

# Response (201 Created)
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "_id": "64a7b8c9d0e1f2a3b4c5d6e8",
    "user_id": "64a7b8c9d0e1f2a3b4c5d6e7",
    "method_type": "CREDIT_CARD",
    "alias": "My Primary Visa",
    "is_default": true,
    "is_active": true,
    "details": {
      "card_brand": "Visa",
      "last4_digits": "1234",
      "expiry_month": "12",
      "expiry_year": "2025",
      "card_holder_name": "John Doe"
      // Note: token is encrypted and not returned in response
    },
    "display_name": "Visa ****1234",
    "createdAt": "2023-07-14T10:30:00.000Z",
    "updatedAt": "2023-07-14T10:30:00.000Z"
  }
}
```

#### UPI Payment Method
```bash
POST /api/v1/user/payment-methods

# Request Body
{
  "method_type": "UPI",
  "alias": "Personal UPI",
  "is_default": false,
  "details": {
    "upi_id": "john.doe@paytm",
    "account_holder_name": "John Doe"
  }
}

# Response (201 Created)
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "_id": "64a7b8c9d0e1f2a3b4c5d6e9",
    "method_type": "UPI",
    "alias": "Personal UPI",
    "is_default": false,
    "details": {
      "upi_id": "john.doe@paytm", // Encrypted in database
      "account_holder_name": "John Doe"
    },
    "display_name": "john.doe@paytm"
  }
}
```

#### Wallet Payment Method
```bash
POST /api/v1/user/payment-methods

# Request Body
{
  "method_type": "WALLET",
  "alias": "PhonePe Wallet",
  "details": {
    "wallet_provider": "PhonePe",
    "linked_account_identifier": "9876543210"
  }
}
```

#### Net Banking
```bash
POST /api/v1/user/payment-methods

# Request Body
{
  "method_type": "NETBANKING",
  "alias": "SBI NetBanking",
  "details": {
    "bank_name": "State Bank of India",
    "account_holder_name": "John Doe",
    "token": "netbank_token_xyz789" // Optional, from payment gateway
  }
}
```

### 2. Get All Payment Methods

```bash
GET /api/v1/user/payment-methods?include_inactive=false

# Response (200 OK)
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "_id": "64a7b8c9d0e1f2a3b4c5d6e8",
      "method_type": "CREDIT_CARD",
      "alias": "My Primary Visa",
      "is_default": true,
      "details": {
        "card_brand": "Visa",
        "last4_digits": "1234",
        "expiry_month": "12",
        "expiry_year": "2025",
        "card_holder_name": "John Doe"
      },
      "display_name": "Visa ****1234"
    },
    {
      "_id": "64a7b8c9d0e1f2a3b4c5d6e9",
      "method_type": "UPI",
      "alias": "Personal UPI",
      "is_default": false,
      "details": {
        "upi_id": "john.doe@paytm",
        "account_holder_name": "John Doe"
      },
      "display_name": "john.doe@paytm"
    }
  ],
  "pagination": {
    "total": 2,
    "active": 2,
    "default": "64a7b8c9d0e1f2a3b4c5d6e8"
  }
}
```

### 3. Get Specific Payment Method

```bash
GET /api/v1/user/payment-methods/64a7b8c9d0e1f2a3b4c5d6e8

# Response (200 OK)
{
  "success": true,
  "message": "Payment method retrieved successfully",
  "data": {
    "_id": "64a7b8c9d0e1f2a3b4c5d6e8",
    "method_type": "CREDIT_CARD",
    "alias": "My Primary Visa",
    "is_default": true,
    "details": {
      "card_brand": "Visa",
      "last4_digits": "1234",
      "expiry_month": "12",
      "expiry_year": "2025",
      "card_holder_name": "John Doe"
    }
  }
}
```

### 4. Update Payment Method

```bash
PATCH /api/v1/user/payment-methods/64a7b8c9d0e1f2a3b4c5d6e8

# Request Body (only non-sensitive fields)
{
  "alias": "Updated Card Name",
  "is_default": false,
  "details": {
    "card_holder_name": "John F. Doe" // Allowed update
  }
}

# Response (200 OK)
{
  "success": true,
  "message": "Payment method updated successfully",
  "data": {
    // Updated payment method object
  }
}
```

### 5. Set as Default Payment Method

```bash
PATCH /api/v1/user/payment-methods/64a7b8c9d0e1f2a3b4c5d6e9/default

# Response (200 OK)
{
  "success": true,
  "message": "Default payment method updated successfully",
  "data": {
    // Payment method now set as default
  }
}
```

### 6. Get Default Payment Method

```bash
GET /api/v1/user/payment-methods/default

# Response (200 OK)
{
  "success": true,
  "message": "Default payment method retrieved successfully",
  "data": {
    "_id": "64a7b8c9d0e1f2a3b4c5d6e9",
    "method_type": "UPI",
    "is_default": true,
    // ... other fields
  }
}
```

### 7. Delete Payment Method

#### Soft Delete (Default)
```bash
DELETE /api/v1/user/payment-methods/64a7b8c9d0e1f2a3b4c5d6e8

# Response (204 No Content)
{
  "success": true,
  "message": "Payment method deleted successfully"
}
```

#### Hard Delete
```bash
DELETE /api/v1/user/payment-methods/64a7b8c9d0e1f2a3b4c5d6e8?hard_delete=true

# Response (204 No Content)
```

## Frontend Integration Examples

### React.js Integration

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // API client with auth token
  const api = axios.create({
    baseURL: '/api/v1',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  // Fetch all payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/payment-methods');
      setPaymentMethods(response.data.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new card via Razorpay
  const addCardPaymentMethod = async (cardData) => {
    try {
      // Step 1: Tokenize card with Razorpay
      const razorpayToken = await tokenizeCardWithRazorpay(cardData);
      
      // Step 2: Save to your backend
      const paymentMethodData = {
        method_type: 'CREDIT_CARD',
        alias: cardData.alias,
        is_default: cardData.is_default,
        details: {
          card_brand: razorpayToken.card.brand,
          last4_digits: razorpayToken.card.last4,
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          card_holder_name: cardData.card_holder_name,
          token: razorpayToken.id // Secure token from Razorpay
        }
      };

      const response = await api.post('/user/payment-methods', paymentMethodData);
      
      // Refresh the list
      fetchPaymentMethods();
      
      return response.data;
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  };

  // Add UPI payment method
  const addUPIPaymentMethod = async (upiData) => {
    try {
      const paymentMethodData = {
        method_type: 'UPI',
        alias: upiData.alias,
        details: {
          upi_id: upiData.upi_id,
          account_holder_name: upiData.account_holder_name
        }
      };

      const response = await api.post('/user/payment-methods', paymentMethodData);
      fetchPaymentMethods();
      return response.data;
    } catch (error) {
      console.error('Error adding UPI:', error);
      throw error;
    }
  };

  // Set default payment method
  const setAsDefault = async (paymentMethodId) => {
    try {
      await api.patch(`/user/payment-methods/${paymentMethodId}/default`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (paymentMethodId) => {
    try {
      await api.delete(`/user/payment-methods/${paymentMethodId}`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return (
    <div className="payment-methods-manager">
      <h2>Payment Methods</h2>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="payment-methods-list">
          {paymentMethods.map((method) => (
            <div key={method._id} className="payment-method-card">
              <div className="method-info">
                <h3>{method.display_name}</h3>
                <p>{method.alias}</p>
                {method.is_default && <span className="default-badge">Default</span>}
              </div>
              
              <div className="method-actions">
                {!method.is_default && (
                  <button onClick={() => setAsDefault(method._id)}>
                    Set as Default
                  </button>
                )}
                <button onClick={() => deletePaymentMethod(method._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add new payment method forms would go here */}
    </div>
  );
};

// Helper function for Razorpay tokenization
const tokenizeCardWithRazorpay = async (cardData) => {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      // ... other Razorpay configuration
    });

    // Use Razorpay's tokenization API
    // This is a simplified example - actual implementation may vary
    rzp.createToken({
      card: {
        number: cardData.number,
        expiry_month: cardData.expiry_month,
        expiry_year: cardData.expiry_year,
        cvv: cardData.cvv,
        name: cardData.card_holder_name
      }
    }, (response) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

export default PaymentMethodsManager;
```

### Node.js Client Integration

```javascript
const axios = require('axios');

class PaymentMethodsClient {
  constructor(baseURL, authToken) {
    this.api = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllPaymentMethods(includeInactive = false) {
    try {
      const response = await this.api.get('/user/payment-methods', {
        params: { include_inactive: includeInactive }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addCreditCard(cardData) {
    const paymentMethodData = {
      method_type: 'CREDIT_CARD',
      alias: cardData.alias,
      is_default: cardData.is_default || false,
      details: {
        card_brand: cardData.card_brand,
        last4_digits: cardData.last4_digits,
        expiry_month: cardData.expiry_month,
        expiry_year: cardData.expiry_year,
        card_holder_name: cardData.card_holder_name,
        token: cardData.payment_gateway_token
      }
    };

    try {
      const response = await this.api.post('/user/payment-methods', paymentMethodData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addUPI(upiData) {
    const paymentMethodData = {
      method_type: 'UPI',
      alias: upiData.alias,
      details: {
        upi_id: upiData.upi_id,
        account_holder_name: upiData.account_holder_name
      }
    };

    try {
      const response = await this.api.post('/user/payment-methods', paymentMethodData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setAsDefault(paymentMethodId) {
    try {
      const response = await this.api.patch(`/user/payment-methods/${paymentMethodId}/default`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePaymentMethod(paymentMethodId, hardDelete = false) {
    try {
      const response = await this.api.delete(`/user/payment-methods/${paymentMethodId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data.message || 'Unknown error',
        errors: error.response.data.errors || []
      };
    } else if (error.request) {
      // Network error
      return {
        status: 0,
        message: 'Network error - could not reach server'
      };
    } else {
      // Other error
      return {
        status: -1,
        message: error.message
      };
    }
  }
}

module.exports = PaymentMethodsClient;
```

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "details.upi_id",
      "message": "Invalid UPI ID format"
    }
  ]
}
```

#### Duplicate Payment Method (409)
```json
{
  "success": false,
  "message": "This UPI ID is already registered"
}
```

#### Payment Method Not Found (404)
```json
{
  "success": false,
  "message": "Payment method not found"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

## Security Best Practices

1. **Never send full card details to your backend**
2. **Always use HTTPS for API communications**
3. **Implement rate limiting on payment endpoints**
4. **Validate all inputs on both client and server side**
5. **Log all payment-related activities for audit**
6. **Use strong authentication and authorization**
7. **Regularly rotate encryption keys**
8. **Monitor for suspicious activities**

## Testing

### Postman Collection
Import this collection to test the API endpoints:

```json
{
  "info": {
    "name": "Payment Methods API",
    "description": "Test collection for payment methods management"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "authToken",
      "value": "your-jwt-token-here"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{authToken}}"
      }
    ]
  }
}
```

This integration guide provides comprehensive examples for implementing the payment methods management system in various environments while maintaining security best practices.
