# Email Verification Implementation Guide

## Overview
This document describes the email verification system implemented for customer registration in the RoomMaster application.

## Features Implemented

### 1. Database Changes
- **New Fields in Customer Model:**
  - `isEmailVerified`: Boolean (default: false) - Tracks if customer's email is verified
  - `emailVerificationToken`: String (optional) - Stores the verification token

### 2. Email Verification Flow

#### Registration
1. Customer registers with email (required)
2. System generates verification token (24-hour validity)
3. Sends verification email with clickable link
4. Customer can still login but access to certain features is restricted

#### Verification Process
1. Customer clicks verification link from email
2. Token is validated
3. `isEmailVerified` is set to true
4. Customer gains full access to all features

### 3. API Endpoints

#### `GET /v1/customer/auth/verify-email?token={token}`
Verifies customer email using token from email.

**Response:**
- 200: Email verified successfully
- 400: Email already verified
- 401: Invalid or expired token

#### `POST /v1/customer/auth/resend-verification`
Resends verification email to authenticated customer.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
- 200: Verification email sent
- 400: Email already verified or no email address
- 401: Unauthorized

### 4. Protected Routes

The following routes require email verification (via `requireEmailVerified` middleware):

- `POST /v1/customer/bookings` - Create booking
- `POST /v1/customer/promotions/claim` - Claim promotion

**Error Response (403):**
```json
{
  "code": 403,
  "message": "Please verify your email address to access this resource"
}
```

### 5. Email Template

Location: `src/templates/emails/verify-email.hbs`

Features:
- Professional design matching booking confirmation email
- Clear call-to-action button
- Alternative link for manual copy-paste
- 24-hour expiration warning
- Mobile-responsive layout

### 6. Middleware

#### `requireEmailVerified`
Location: `src/middlewares/emailVerification.ts`

Usage:
```typescript
import { requireEmailVerified } from '@/middlewares/emailVerification';

router.post('/protected-route', authCustomer, requireEmailVerified, controller.method);
```

## Migration Strategy

### For Existing Customers

Run the grandfather script to set all existing customers as verified:

```bash
npx ts-node scripts/grandfather-existing-customers.ts
```

This ensures existing customers are not disrupted by the new feature.

### For New Deployments

The Prisma migration `20260111093655_add_email_verification` will automatically:
1. Add new fields to Customer table
2. Set default values for existing records
3. Update Prisma Client types

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="RoomMaster <noreply@roommaster.com>"

# Application URL (for email links)
APP_URL=http://localhost:3000
```

### Token Expiration

Email verification tokens expire after 24 hours (configurable in `token.service.ts`):

```typescript
generateEmailVerificationToken(userId: string): string {
  const expires = moment().add(24, 'hours'); // Modify duration here
  // ...
}
```

## Testing

### Manual Testing Flow

1. **Register new customer:**
```bash
curl -X POST http://localhost:3000/v1/customer/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phone": "0901234567",
    "email": "test@example.com",
    "password": "password123"
  }'
```

2. **Check email for verification link**

3. **Verify email:**
```bash
curl -X GET "http://localhost:3000/v1/customer/auth/verify-email?token={TOKEN}"
```

4. **Test protected route (should succeed after verification):**
```bash
curl -X POST http://localhost:3000/v1/customer/bookings \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rooms": [...],
    "checkInDate": "2026-01-15",
    "checkOutDate": "2026-01-17",
    "totalGuests": 2
  }'
```

5. **Resend verification (if needed):**
```bash
curl -X POST http://localhost:3000/v1/customer/auth/resend-verification \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

## Architecture

### Service Layer

#### TokenService
- `generateEmailVerificationToken(userId)` - Creates JWT token with 24h expiry
- Token type: `VERIFY_EMAIL`

#### AuthService
- `verifyEmail(token)` - Validates token and updates customer record

#### EmailService
- `sendVerificationEmail(email, name, token)` - Sends HTML email with verification link

### Flow Diagram

```
Registration
    ↓
Generate Token → Save to Customer.emailVerificationToken
    ↓
Send Email → Customer receives verification link
    ↓
Customer Clicks Link → Validate Token → Update isEmailVerified
    ↓
Full Access Granted
```

## Security Considerations

1. **Token Validity**: Tokens expire after 24 hours
2. **One-Time Use**: Token is cleared after successful verification
3. **JWT Security**: Tokens are signed with JWT secret
4. **HTTPS Required**: Email links should use HTTPS in production
5. **Rate Limiting**: Consider adding rate limiting to resend endpoint

## Future Enhancements

1. **Email Change Flow**: Require reverification when customer changes email
2. **Notification System**: Send reminder emails for unverified accounts
3. **Admin Dashboard**: View verification statistics
4. **Bulk Operations**: Admin ability to manually verify customers
5. **Email Templates**: Add more email templates for other flows

## Troubleshooting

### Email not sending
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT
- Check email service logs

### Token expired
- Customer can request new token via `/resend-verification`
- Check token generation configuration

### Middleware not working
- Ensure `authCustomer` is applied before `requireEmailVerified`
- Check customer object is attached to request

## Files Modified/Created

### New Files
- `src/templates/emails/verify-email.hbs`
- `src/middlewares/emailVerification.ts`
- `scripts/grandfather-existing-customers.ts`
- `docs/email-verification-guide.md`

### Modified Files
- `prisma/schema.prisma` - Added email verification fields
- `src/services/token.service.ts` - Added VERIFY_EMAIL token type and generation method
- `src/services/auth.service.ts` - Added verifyEmail method
- `src/services/email.service.ts` - Added sendVerificationEmail method
- `src/services/customer.service.ts` - Added emailVerificationToken to UpdateCustomerData
- `src/controllers/customer/customer.controller.ts` - Added verifyEmail and resendVerification methods
- `src/routes/v1/customer/auth.route.ts` - Added verification endpoints
- `src/routes/v1/customer/booking.route.ts` - Added requireEmailVerified middleware
- `src/routes/v1/customer/promotion.route.ts` - Added requireEmailVerified middleware
- `src/validations/auth.validation.ts` - Added verification schemas

## Support

For issues or questions, contact the development team or create an issue in the repository.
