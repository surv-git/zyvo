# Payment Methods Management System - Security Documentation

## Overview
This document outlines the security architecture and implementation details for the User Payment Methods Management System. The system is designed with PCI DSS compliance principles and follows security best practices for handling sensitive payment data.

## Security Architecture

### 1. Data Encryption Strategy

#### Encryption Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: Environment variable `PAYMENT_ENCRYPTION_KEY`
- **Initialization Vector**: Randomly generated for each encryption operation
- **Authentication Tag**: Included for data integrity verification

#### Encrypted Fields
- **Credit/Debit Cards**: `last4_digits`, `token`
- **UPI**: `upi_id`
- **Wallet**: `linked_account_identifier`
- **Net Banking**: `token` (if applicable)

#### Implementation Details
```javascript
// Encryption Process
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};
```

### 2. PCI DSS Compliance

#### What We NEVER Store
- Full Primary Account Number (PAN)
- Card Verification Value (CVV/CVC)
- Full magnetic stripe data
- PIN numbers

#### What We Store Securely
- Payment gateway tokens (encrypted)
- Last 4 digits of card numbers (encrypted)
- Expiry month/year (partial data only)
- Card brand information
- Cardholder name

#### Token-Based Architecture
```
Frontend → Payment Gateway → Token → Backend Storage
```

1. **Frontend**: Collects sensitive card data
2. **Payment Gateway**: Tokenizes card data (PCI DSS compliant)
3. **Backend**: Stores only the secure token and metadata

### 3. API Security Measures

#### Authentication & Authorization
- All endpoints protected by `userAuthMiddleware`
- Users can only access their own payment methods
- JWT-based authentication required

#### Input Validation
- Comprehensive validation using `express-validator`
- Method-type specific validation rules
- Sanitization of all user inputs
- Prevention of sensitive field updates

#### Rate Limiting (Recommended Implementation)
```javascript
const rateLimit = require('express-rate-limit');

const paymentMethodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many payment method requests'
});

router.use(paymentMethodLimiter);
```

### 4. Database Security

#### Mongoose Schema Security
- Pre-save hooks for automatic encryption
- Post-find hooks for automatic decryption
- Custom validators for data integrity
- Compound indexes for query optimization

#### Data Sanitization
```javascript
// Automatic sanitization for API responses
PaymentMethodSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove sensitive tokens from responses
  if (obj.details) {
    switch (obj.method_type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        delete obj.details.token;
        break;
      case 'NETBANKING':
        delete obj.details.token;
        break;
    }
  }
  
  return obj;
};
```

### 5. Audit and Monitoring

#### User Activity Logging
All operations are logged with:
- User ID and IP address
- Action performed
- Resource affected
- Timestamp
- Request metadata

#### Audit Trail Example
```javascript
await userActivityLogger.log({
  user_id,
  action: 'add_payment_method',
  resource_type: 'PaymentMethod',
  resource_id: paymentMethod._id,
  ip_address: req.ip,
  user_agent: req.get('User-Agent'),
  details: {
    method_type,
    is_default,
    alias: alias || null
  }
});
```

## Implementation Guidelines

### 1. Environment Setup

#### Required Environment Variables
```bash
# Encryption key for payment data (32 bytes)
PAYMENT_ENCRYPTION_KEY=your-32-byte-encryption-key

# Database connection
MONGODB_URI=mongodb://localhost:27017/your-database

# JWT secret for authentication
JWT_SECRET=your-jwt-secret
```

#### Key Generation
```bash
# Generate a secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Frontend Integration Guidelines

#### Payment Gateway Integration Flow
```javascript
// Example: Razorpay Integration
const handleCardPayment = async (cardData) => {
  try {
    // 1. Send card data directly to payment gateway
    const tokenResponse = await razorpay.tokens.create({
      card: {
        number: cardData.number,
        expiry_month: cardData.expiry_month,
        expiry_year: cardData.expiry_year,
        cvv: cardData.cvv,
        name: cardData.holder_name
      }
    });
    
    // 2. Send only token and metadata to your backend
    const paymentMethodData = {
      method_type: 'CREDIT_CARD',
      details: {
        token: tokenResponse.id, // Secure token from gateway
        card_brand: tokenResponse.card.brand,
        last4_digits: tokenResponse.card.last4,
        expiry_month: cardData.expiry_month,
        expiry_year: cardData.expiry_year,
        card_holder_name: cardData.holder_name
      }
    };
    
    // 3. Store in your system
    await api.post('/api/v1/user/payment-methods', paymentMethodData);
    
  } catch (error) {
    console.error('Payment method creation failed:', error);
  }
};
```

### 3. Error Handling Best Practices

#### Secure Error Messages
```javascript
// Don't expose sensitive information in errors
try {
  // Payment processing logic
} catch (error) {
  console.error('Payment error details:', error); // Log internally
  
  res.status(500).json({
    success: false,
    message: 'Payment processing failed' // Generic user message
  });
}
```

### 4. Testing Considerations

#### Test Data Security
- Never use real payment data in tests
- Use payment gateway test tokens
- Mock encryption/decryption in unit tests
- Test data sanitization thoroughly

#### Security Test Cases
- Verify encryption/decryption
- Test unauthorized access attempts
- Validate input sanitization
- Confirm audit logging

## Compliance Checklist

### PCI DSS Requirements
- [ ] No storage of sensitive authentication data
- [ ] Protect stored cardholder data with encryption
- [ ] Encrypt transmission of cardholder data
- [ ] Use and regularly update anti-virus software
- [ ] Develop and maintain secure systems
- [ ] Implement strong access control measures
- [ ] Regularly monitor and test networks
- [ ] Maintain information security policy

### Implementation Verification
- [ ] Encryption keys properly secured
- [ ] Sensitive data never in logs
- [ ] API responses sanitized
- [ ] Input validation comprehensive
- [ ] Audit logging functional
- [ ] Error handling secure
- [ ] Authentication required
- [ ] Authorization enforced

## Monitoring and Maintenance

### Key Metrics to Monitor
- Failed authentication attempts
- Encryption/decryption errors
- Unusual payment method patterns
- Database query performance
- API response times

### Regular Security Tasks
- Rotate encryption keys quarterly
- Review audit logs monthly
- Update dependencies regularly
- Conduct security assessments
- Monitor for data breaches

### Incident Response
1. **Detection**: Monitor for security anomalies
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the scope of breach
4. **Recovery**: Restore secure operations
5. **Lessons Learned**: Update security measures

## Best Practices Summary

1. **Never store sensitive payment data directly**
2. **Always use payment gateway tokenization**
3. **Encrypt all stored payment-related data**
4. **Implement comprehensive audit logging**
5. **Validate and sanitize all inputs**
6. **Use secure communication protocols**
7. **Regular security assessments**
8. **Keep dependencies updated**
9. **Train development team on security**
10. **Have incident response plan ready**

## Support and Resources

### Documentation References
- [PCI DSS Standards](https://www.pcisecuritystandards.org/)
- [OWASP Payment Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Payment Gateway Documentation
- [Razorpay API Documentation](https://razorpay.com/docs/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [PayU API Documentation](https://www.payu.in/docs/)

This security documentation should be reviewed and updated regularly as the system evolves and new security threats emerge.
