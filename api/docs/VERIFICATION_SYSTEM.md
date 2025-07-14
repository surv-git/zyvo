# Email and Phone Verification System Documentation

## Overview

The Email and Phone Verification System extends the existing user management system with comprehensive verification capabilities. This system ensures that users can verify their email addresses and phone numbers to activate full account functionality and enhance security.

## Features

### Email Verification
- **Automatic Trigger**: Email verification is automatically triggered after user registration
- **Token-Based**: Uses secure random tokens for email verification
- **Expiration**: Email verification tokens expire after 24 hours
- **Rate Limiting**: Prevents spam verification requests
- **HTML Templates**: Professional email templates with verification links

### Phone Verification
- **OTP-Based**: Uses 6-digit numeric OTP codes
- **SMS Integration**: Placeholder SMS service integration
- **Short Expiry**: OTP codes expire after 5 minutes
- **Format Validation**: Strict OTP format validation
- **Rate Limiting**: Prevents spam OTP requests

### Integration Features
- **Registration Flow**: Automatic email verification after registration
- **Login Status**: Verification status included in login responses
- **Profile Updates**: Verification reset when email/phone changes
- **Admin Override**: Admin users can update verification status
- **Logging Integration**: Comprehensive activity logging

## Database Schema Updates

### User Model Extensions
```javascript
{
  // ... existing fields
  is_email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: {
    type: String
  },
  email_verification_token_expires: {
    type: Date
  },
  is_phone_verified: {
    type: Boolean,
    default: false
  },
  phone_otp_code: {
    type: String
  },
  phone_otp_expires: {
    type: Date
  }
}
```

### Indexes for Performance
```javascript
// Recommended indexes for better query performance
userSchema.index({ email_verification_token: 1 });
userSchema.index({ email_verification_token_expires: 1 });
userSchema.index({ phone_otp_expires: 1 });
```

## API Endpoints

### Email Verification

#### Request Email Verification
```bash
POST /api/auth/verify-email/request
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Error Cases:**
- `400`: Email already verified
- `401`: Unauthorized
- `429`: Rate limit exceeded

#### Complete Email Verification
```bash
POST /api/auth/verify-email/complete
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Cases:**
- `400`: Invalid or expired token
- `400`: Email already verified

### Phone Verification

#### Request Phone Verification
```bash
POST /api/auth/verify-phone/request
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

**Error Cases:**
- `400`: Phone number missing
- `400`: Phone already verified
- `401`: Unauthorized
- `429`: Rate limit exceeded

#### Complete Phone Verification
```bash
POST /api/auth/verify-phone/complete
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

**Error Cases:**
- `400`: Invalid OTP format
- `400`: Invalid or expired OTP
- `401`: Unauthorized

## Updated Authentication Flow

### Registration Flow
1. User submits registration data
2. Account is created with `is_email_verified: false`
3. Email verification token is generated
4. Verification email is sent automatically
5. User receives access token but with verification flags

### Login Flow
1. User submits login credentials
2. Authentication is validated
3. Access token is generated
4. Response includes verification status:
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "...",
  "user": { ... },
  "verification": {
    "is_email_verified": false,
    "is_phone_verified": false
  },
  "verificationMessage": "Please verify your email and phone to access all features."
}
```

### Profile Update Flow
1. User updates email or phone
2. Verification status is reset for changed fields
3. New verification tokens/OTPs are generated
4. User is notified of verification requirement

## Security Implementation

### Token Generation
```javascript
// Email verification token
const emailToken = crypto.randomBytes(32).toString('hex');

// Phone OTP generation
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
```

### Rate Limiting
```javascript
// Email verification: 1 request per minute
// Phone verification: 1 request per minute
// Based on token expiry to prevent spam
```

### Token Storage
- Email tokens: Stored directly (with expiration)
- Phone OTPs: Stored directly (5-minute expiry)
- All tokens cleared after successful verification

### Validation Rules
```javascript
// Email token validation
- Required: non-empty string
- Length: 32-128 characters
- Expiry: Must not be expired

// Phone OTP validation
- Required: non-empty string
- Format: Exactly 6 digits
- Pattern: /^\d{6}$/
- Expiry: Must not be expired
```

## Utility Functions

### Email Verification Utility
```javascript
// utils/sendVerificationEmail.js
- sendVerificationEmail(email, token, baseUrl)
- generateEmailVerificationToken()
- hashEmailVerificationToken(token)
- sendEmailVerificationConfirmation(email)
```

### SMS Verification Utility
```javascript
// utils/sendVerificationSMS.js
- sendVerificationSMS(phone, otp)
- generateOTP(length = 6)
- validateOTPFormat(otp, expectedLength = 6)
- formatPhoneForDisplay(phone)
```

## Integration Points

### With Existing Authentication
```javascript
// Updated registerUser function
- Sets is_email_verified: false
- Sets is_phone_verified: false
- Triggers automatic email verification

// Updated loginUser function
- Includes verification status in response
- Adds verification message when needed
```

### With User Management
```javascript
// Updated updateUser function
- Detects email/phone changes
- Resets verification status
- Triggers new verification process
- Notifies user of verification requirement
```

## Error Handling

### Common Error Scenarios
1. **Token Expired**: Clear expired tokens, require new verification
2. **Invalid Format**: Validate input format before processing
3. **Already Verified**: Prevent duplicate verification attempts
4. **Rate Limiting**: Prevent spam verification requests
5. **Email/SMS Failure**: Handle service failures gracefully

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "token",
      "message": "Invalid or expired verification token"
    }
  ]
}
```

## Testing

### Unit Tests
```javascript
describe('Email Verification', () => {
  test('should send verification email', async () => {
    // Test email verification request
  });
  
  test('should complete email verification', async () => {
    // Test email verification completion
  });
});

describe('Phone Verification', () => {
  test('should send verification SMS', async () => {
    // Test SMS verification request
  });
  
  test('should complete phone verification', async () => {
    // Test phone verification completion
  });
});
```

### Integration Tests
```javascript
describe('Verification Flow', () => {
  test('should complete full verification flow', async () => {
    // Register -> Request Verification -> Complete Verification
  });
});
```

## Client-Side Integration

### JavaScript Example
```javascript
class VerificationService {
  constructor(authService) {
    this.authService = authService;
  }

  async requestEmailVerification() {
    const response = await fetch('/api/auth/verify-email/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
    return response.json();
  }

  async completeEmailVerification(token) {
    const response = await fetch('/api/auth/verify-email/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    return response.json();
  }

  async requestPhoneVerification() {
    const response = await fetch('/api/auth/verify-phone/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
    return response.json();
  }

  async completePhoneVerification(otpCode) {
    const response = await fetch('/api/auth/verify-phone/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: JSON.stringify({ otp_code: otpCode })
    });
    return response.json();
  }
}
```

## Production Considerations

### Email Service Integration
```javascript
// Replace placeholder with actual service
const nodemailer = require('nodemailer');
const sendgrid = require('@sendgrid/mail');
const aws = require('aws-sdk');

// Example with SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
await sendgrid.send({
  to: email,
  from: 'noreply@zyvo.com',
  subject: 'Email Verification',
  html: htmlContent
});
```

### SMS Service Integration
```javascript
// Example with Twilio
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: `Your verification code is: ${otpCode}`,
  from: '+1234567890',
  to: phoneNumber
});
```

### Security Enhancements
1. **Rate Limiting**: Implement Redis-based rate limiting
2. **IP Blocking**: Block suspicious IP addresses
3. **Device Tracking**: Track verification by device
4. **Fraud Detection**: Implement fraud detection algorithms
5. **Backup Channels**: Provide alternative verification methods

## Monitoring and Analytics

### Metrics to Track
- Verification request rates
- Verification completion rates
- Failed verification attempts
- Token expiration rates
- Service availability

### Logging Events
```javascript
// Successful verification
logger.info('Email verified successfully', {
  userId: user._id,
  email: user.email,
  timestamp: new Date()
});

// Failed verification
logger.warn('Invalid verification token', {
  userId: user._id,
  token: token.substring(0, 8) + '...',
  timestamp: new Date()
});
```

## Troubleshooting

### Common Issues

#### Email Verification Not Working
1. Check email service configuration
2. Verify SMTP settings
3. Check spam folders
4. Validate email templates

#### Phone Verification Not Working
1. Check SMS service configuration
2. Verify phone number format
3. Check carrier restrictions
4. Validate OTP generation

#### Token Expiration Issues
1. Check server time synchronization
2. Verify token expiry settings
3. Check database time zones
4. Validate token generation

### Debug Commands
```bash
# Test email verification
curl -X POST http://localhost:3000/api/auth/verify-email/request \
  -H "Authorization: Bearer <token>"

# Test phone verification
curl -X POST http://localhost:3000/api/auth/verify-phone/request \
  -H "Authorization: Bearer <token>"

# Check user verification status
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

### Planned Features
- **Multi-factor Authentication**: Combine email and phone verification
- **Backup Codes**: Generate backup verification codes
- **Social Verification**: Verify through social media accounts
- **Biometric Verification**: Add biometric verification options
- **Batch Verification**: Verify multiple contacts at once

### Extension Points
- Custom verification templates
- Multiple verification channels
- Verification webhooks
- Third-party verification services
- Advanced fraud detection

## Support and Maintenance

### Regular Tasks
- Monitor verification success rates
- Clean up expired tokens
- Update email/SMS templates
- Review security logs
- Update service configurations

### Performance Optimization
- Index verification fields
- Cache verification templates
- Optimize token generation
- Batch verification requests
- Monitor service response times

This verification system provides a robust foundation for email and phone verification while maintaining security best practices and providing a seamless user experience.
