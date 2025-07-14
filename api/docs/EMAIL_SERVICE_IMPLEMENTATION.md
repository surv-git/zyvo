# Email Service Implementation Guide

## Overview

This document provides comprehensive information about the email service implementation for the Zyvo API server. The email service is fully configured and functional, using Gmail SMTP for reliable email delivery.

## Configuration

### Environment Variables

The email service is configured using the following environment variables in your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=zyvo.store.com@gmail.com
SMTP_PASS=hbhvqimeewvtuhrn
FROM_EMAIL=noreply@zyvo.com
```

### Gmail Setup

Your Gmail account (`zyvo.store.com@gmail.com`) is configured with:
- **SMTP Host**: smtp.gmail.com
- **Port**: 587 (STARTTLS)
- **Security**: STARTTLS (secure: false)
- **Authentication**: App-specific password

## Email Service Architecture

### Core Components

1. **Email Service Utility** (`utils/sendEmail.js`)
   - Primary email sending functionality
   - Nodemailer transporter configuration
   - Email template handling
   - Error handling and logging

2. **Email Verification Utility** (`utils/sendVerificationEmail.js`)
   - Email verification token generation
   - Verification email templates
   - Token hashing and validation
   - Confirmation emails

3. **Integration Points**
   - Authentication controller
   - User management controller
   - Password reset functionality
   - Email verification workflows

## Available Email Functions

### Basic Email Sending

```javascript
const { sendEmail } = require('./utils/sendEmail');

await sendEmail({
  email: 'user@example.com',
  subject: 'Your Subject',
  message: 'Plain text message',
  html: '<h1>HTML content</h1>' // Optional
});
```

### Password Reset Email

```javascript
const { sendPasswordResetEmail } = require('./utils/sendEmail');

await sendPasswordResetEmail({
  email: 'user@example.com',
  resetUrl: 'https://yourapp.com/reset-password?token=abc123',
  userName: 'John Doe'
});
```

### Welcome Email

```javascript
const { sendWelcomeEmail } = require('./utils/sendEmail');

await sendWelcomeEmail({
  email: 'user@example.com',
  userName: 'John Doe'
});
```

### Email Verification

```javascript
const { sendVerificationEmail } = require('./utils/sendVerificationEmail');

await sendVerificationEmail(
  'user@example.com',
  'verification-token-123',
  'https://yourapp.com'
);
```

### Verification Email Template

```javascript
const { sendVerificationEmail } = require('./utils/sendEmail');

await sendVerificationEmail({
  email: 'user@example.com',
  verificationUrl: 'https://yourapp.com/verify?token=abc123',
  userName: 'John Doe'
});
```

## Email Templates

### Professional Styling

All emails use consistent, professional styling:
- Responsive design (max-width: 600px)
- Branded colors and fonts
- Clear call-to-action buttons
- Professional footer with company information

### Template Structure

```html
<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
  <h2 style="color: #333; text-align: center;">Email Title</h2>
  <p>Email content...</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="URL" style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Call to Action
    </a>
  </div>
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px; text-align: center;">
    Best regards,<br>
    The Zyvo Team
  </p>
</div>
```

## Integration Examples

### In Authentication Controller

```javascript
// Registration with email verification
const registerUser = async (req, res, next) => {
  try {
    // ... user creation logic ...
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, emailToken);
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
      // Continue with registration even if email fails
    }
    
    // ... response logic ...
  } catch (error) {
    next(error);
  }
};

// Password reset
const forgotPassword = async (req, res, next) => {
  try {
    // ... token generation logic ...
    
    await sendPasswordResetEmail({
      email: user.email,
      resetUrl: resetUrl,
      userName: user.name
    });
    
    // ... response logic ...
  } catch (error) {
    next(error);
  }
};
```

### In User Management Controller

```javascript
// Email change verification
const updateUser = async (req, res, next) => {
  try {
    // ... update logic ...
    
    if (emailChanged) {
      // Send verification to new email
      try {
        await sendVerificationEmail(updates.email, emailToken);
      } catch (error) {
        console.error('Failed to send email verification:', error.message);
      }
    }
    
    // ... response logic ...
  } catch (error) {
    next(error);
  }
};
```

## Error Handling

### Email Service Errors

The email service includes comprehensive error handling:

```javascript
try {
  await sendEmail(options);
} catch (error) {
  console.error('Email sending failed:', {
    error: error.message,
    to: options.email,
    subject: options.subject,
    timestamp: new Date().toISOString()
  });
  
  // Handle error appropriately
  // Don't fail the entire operation for email issues
}
```

### Graceful Degradation

The system is designed to continue functioning even if email delivery fails:
- Registration continues even if verification email fails
- Password reset tokens are still generated
- User updates proceed regardless of email status

## Testing

### Email Test Script

Run the email test script to verify configuration:

```bash
node test-email.js
```

The test script verifies:
- SMTP configuration
- Connection to Gmail
- Basic email sending
- Verification email templates
- Email delivery confirmation

### Manual Testing

Test individual email functions:

```bash
# Test basic email
node -e "
const { sendEmail } = require('./utils/sendEmail');
sendEmail({
  email: 'test@example.com',
  subject: 'Test Email',
  message: 'This is a test message'
}).then(console.log).catch(console.error);
"

# Test verification email
node -e "
const { sendVerificationEmail } = require('./utils/sendVerificationEmail');
sendVerificationEmail('test@example.com', 'test-token', 'https://yourapp.com')
.then(console.log).catch(console.error);
"
```

## Security Considerations

### Gmail App Password

- Uses Gmail app-specific password (not regular password)
- App password is stored securely in environment variables
- Follows Gmail security best practices

### Token Security

- Verification tokens are cryptographically secure
- Tokens have appropriate expiration times
- Tokens are hashed before database storage

### Rate Limiting

- Email verification requests are rate-limited
- Prevents abuse of email sending functionality
- Implements reasonable delay between requests

## Performance Optimization

### Asynchronous Operations

- All email operations are asynchronous
- Non-blocking email sending
- Proper error handling for failed deliveries

### Connection Pooling

- Nodemailer handles connection pooling automatically
- Efficient SMTP connection management
- Optimal performance for high-volume sending

## Monitoring and Logging

### Email Logging

```javascript
// Success logging
console.log('Email sent successfully:', {
  messageId: result.messageId,
  to: options.email,
  subject: options.subject,
  timestamp: new Date().toISOString()
});

// Error logging
console.error('Email sending failed:', {
  error: error.message,
  to: options.email,
  subject: options.subject,
  timestamp: new Date().toISOString()
});
```

### Integration with Winston

The email service can be integrated with your existing Winston logging system:

```javascript
const { userActivityLogger } = require('../loggers/userActivity.logger');

// Log email activities
userActivityLogger.info('Email sent', {
  type: 'email_sent',
  recipient: options.email,
  subject: options.subject,
  messageId: result.messageId
});
```

## Production Considerations

### Email Deliverability

- Gmail SMTP provides excellent deliverability
- SPF, DKIM, and DMARC records should be configured
- Monitor bounce rates and reputation

### Volume Limits

- Gmail has sending limits (500 emails/day for personal accounts)
- Consider upgrading to Google Workspace for higher limits
- Implement proper queuing for high-volume scenarios

### Backup Configuration

Consider implementing backup email services:

```javascript
// Example backup service configuration
const backupEmailConfig = {
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
};
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Gmail app password is correct
   - Ensure 2-factor authentication is enabled
   - Check that less secure apps are disabled

2. **Connection Errors**
   - Verify SMTP host and port settings
   - Check firewall and network restrictions
   - Confirm internet connectivity

3. **Rate Limiting**
   - Implement delays between email sends
   - Monitor Gmail sending limits
   - Consider email queuing systems

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const transporter = nodemailer.createTransport({
  ...emailConfig,
  debug: true,
  logger: true
});
```

## Future Enhancements

### Email Templates

- Implement template engine (Handlebars, Mustache)
- Create reusable email components
- Add multi-language support

### Analytics

- Track email open rates
- Monitor click-through rates
- Implement email engagement metrics

### Advanced Features

- Email scheduling
- Bulk email sending
- Email automation workflows
- Integration with email marketing platforms

## Conclusion

The email service is now fully functional and ready for production use. The implementation provides:

✅ **Reliable email delivery** via Gmail SMTP
✅ **Professional email templates** with consistent branding
✅ **Comprehensive error handling** and logging
✅ **Security best practices** and token management
✅ **Easy integration** with existing authentication flows
✅ **Testing utilities** for validation and debugging

The system is designed to be maintainable, scalable, and secure for production use.
