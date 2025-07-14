# Email and Phone Verification System

## Overview

The Zyvo API includes a comprehensive email and phone verification system that ensures user authenticity and enables secure communication. This system is integrated into the user management and authentication workflows.

## Features

- **Email Verification**: Secure token-based email verification
- **Phone Verification**: OTP-based phone number verification
- **Automatic Triggering**: Verification processes are triggered automatically when users register or change their email/phone
- **Rate Limiting**: Built-in protection against abuse
- **Expiration Handling**: Secure token/OTP expiration mechanisms
- **Status Tracking**: Real-time verification status tracking

## User Schema Extensions

The User model includes the following verification fields:

```javascript
{
  // Email verification fields
  is_email_verified: { type: Boolean, default: false },
  email_verification_token: { type: String },
  email_verification_token_expires: { type: Date },
  
  // Phone verification fields
  is_phone_verified: { type: Boolean, default: false },
  phone_otp_code: { type: String },
  phone_otp_expires: { type: Date }
}
```

## API Endpoints

### Email Verification

#### Request Email Verification
- **Endpoint**: `POST /api/auth/verify-email/request`
- **Authentication**: Required (Bearer token)
- **Rate Limit**: 1 request per minute per user
- **Description**: Generates and sends email verification token

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

#### Complete Email Verification
- **Endpoint**: `POST /api/auth/verify-email/complete`
- **Authentication**: Not required
- **Description**: Completes email verification using token

**Request Body:**
```json
{
  "token": "verification-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Phone Verification

#### Request Phone Verification
- **Endpoint**: `POST /api/auth/verify-phone/request`
- **Authentication**: Required (Bearer token)
- **Rate Limit**: 1 request per minute per user
- **Description**: Generates and sends OTP to phone number

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

#### Complete Phone Verification
- **Endpoint**: `POST /api/auth/verify-phone/complete`
- **Authentication**: Required (Bearer token)
- **Description**: Completes phone verification using OTP

**Request Body:**
```json
{
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone verified successfully"
}
```

## Integration with Authentication

### Registration Process

1. User registers with email and optional phone
2. `is_email_verified` and `is_phone_verified` are set to `false`
3. Email verification token is automatically generated
4. Verification email is sent automatically
5. Registration response includes verification status

**Registration Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "accessToken": "jwt-token-here",
  "user": { /* user data */ },
  "verificationStatus": {
    "emailVerified": false,
    "phoneVerified": false,
    "emailVerificationRequired": true
  }
}
```

### Login Process

1. User logs in with email and password
2. Login proceeds regardless of verification status
3. Response includes verification status and message
4. Frontend can restrict features based on verification status

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt-token-here",
  "user": { /* user data */ },
  "verification": {
    "is_email_verified": false,
    "is_phone_verified": false
  },
  "verificationMessage": "Please verify your email and phone to access all features."
}
```

## Integration with User Management

### Updating Email/Phone

When users update their email or phone number:

1. **Email Update**: 
   - `is_email_verified` is reset to `false`
   - Previous verification token is cleared
   - New verification token is generated
   - New verification email is sent automatically

2. **Phone Update**:
   - `is_phone_verified` is reset to `false`
   - Previous OTP is cleared
   - User must manually request new phone verification

**Update Response:**
```json
{
  "success": true,
  "message": "User updated successfully. Your email and phone verification status has been reset. Please verify your new email and phone.",
  "data": { /* updated user data */ },
  "verificationReset": {
    "emailChanged": true,
    "phoneChanged": true,
    "emailVerificationRequired": true,
    "phoneVerificationRequired": true
  }
}
```

## Security Features

### Token Security
- **Email Tokens**: 64-character cryptographically secure random tokens
- **Phone OTPs**: 6-digit numeric codes
- **Expiration**: Email tokens expire in 24 hours, OTPs in 5 minutes
- **Single Use**: Tokens/OTPs are cleared after successful verification

### Rate Limiting
- **Email Verification**: 1 request per minute per user
- **Phone Verification**: 1 request per minute per user
- **Global Rate Limiting**: Applied to all verification endpoints

### Validation
- **Email Format**: Comprehensive email validation
- **Phone Format**: Basic international phone number validation
- **OTP Format**: Strict 6-digit numeric validation

## Error Handling

### Common Error Responses

**Already Verified:**
```json
{
  "success": false,
  "message": "Email is already verified"
}
```

**Invalid/Expired Token:**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

**Rate Limited:**
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

**Missing Phone Number:**
```json
{
  "success": false,
  "message": "Phone number is required for verification"
}
```

## Implementation Details

### Email Verification Utility

```javascript
const { sendVerificationEmail, generateEmailVerificationToken } = require('../utils/sendVerificationEmail');

// Generate token
const token = generateEmailVerificationToken();

// Send email
await sendVerificationEmail(userEmail, token, baseUrl);
```

### Phone Verification Utility

```javascript
const { sendVerificationSMS, generateOTP } = require('../utils/sendVerificationSMS');

// Generate OTP
const otp = generateOTP(6);

// Send SMS
await sendVerificationSMS(phoneNumber, otp);
```

## Frontend Integration

### Verification Status Checking

```javascript
// Check verification status from login/registration response
const { verification } = response.data;

if (!verification.is_email_verified) {
  // Show email verification prompt
  showEmailVerificationPrompt();
}

if (!verification.is_phone_verified) {
  // Show phone verification prompt
  showPhoneVerificationPrompt();
}
```

### Requesting Verification

```javascript
// Request email verification
const requestEmailVerification = async () => {
  try {
    const response = await fetch('/api/auth/verify-email/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      showMessage('Verification email sent! Please check your inbox.');
    }
  } catch (error) {
    console.error('Error requesting email verification:', error);
  }
};
```

### Completing Verification

```javascript
// Complete email verification
const completeEmailVerification = async (token) => {
  try {
    const response = await fetch('/api/auth/verify-email/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    if (data.success) {
      showMessage('Email verified successfully!');
      // Refresh user data
      await refreshUserProfile();
    }
  } catch (error) {
    console.error('Error completing email verification:', error);
  }
};
```

## Testing

### Manual Testing Commands

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Login to get access token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Request email verification
curl -X POST http://localhost:3000/api/auth/verify-email/request \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Complete email verification
curl -X POST http://localhost:3000/api/auth/verify-email/complete \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification-token-from-email"
  }'
```

## Configuration

### Environment Variables

```bash
# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@zyvo.com

# SMS configuration (when implementing real SMS service)
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your-account-sid
SMS_AUTH_TOKEN=your-auth-token
SMS_FROM_NUMBER=+1234567890
```

## Production Considerations

### Email Service Integration

For production, replace the placeholder email service with a real provider:

```javascript
// Example integration with SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (toEmail, token, baseUrl) => {
  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL,
    subject: 'Please Verify Your Email Address',
    html: `
      <p>Click the following link to verify your email:</p>
      <a href="${baseUrl}/verify-email?token=${token}">Verify Email</a>
    `
  };
  
  await sgMail.send(msg);
};
```

### SMS Service Integration

```javascript
// Example integration with Twilio
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendVerificationSMS = async (toNumber, otp) => {
  await client.messages.create({
    body: `Your verification code is: ${otp}`,
    from: process.env.TWILIO_FROM_NUMBER,
    to: toNumber
  });
};
```

## Best Practices

1. **Security**: Always use HTTPS in production
2. **Rate Limiting**: Implement comprehensive rate limiting
3. **Token Storage**: Store tokens securely (consider hashing)
4. **Logging**: Log all verification attempts for security monitoring
5. **User Experience**: Provide clear feedback and error messages
6. **Accessibility**: Ensure verification flows are accessible
7. **Testing**: Implement comprehensive unit and integration tests

## Future Enhancements

- **Multi-factor Authentication**: Combine email and phone verification
- **Social Media Verification**: Add social login verification
- **Biometric Verification**: Add fingerprint/face recognition
- **Backup Codes**: Provide backup verification codes
- **Advanced Fraud Detection**: Implement ML-based fraud detection
- **Internationalization**: Support multiple languages for verification messages
