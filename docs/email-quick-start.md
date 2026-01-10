# 🚀 Quick Start - Email Testing

## Bước 1: Setup SMTP (Chọn 1 trong 2)

### Option A: Gmail (Production-like)

1. Truy cập: https://myaccount.google.com/apppasswords
2. Tạo App Password mới
3. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=generated-app-password
EMAIL_FROM="RoomMaster <noreply@roommaster.com>"
```

### Option B: Ethereal (Testing - Recommended)

1. Truy cập: https://ethereal.email/create
2. Copy credentials
3. Update `.env`:
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USERNAME=ethereal-username
SMTP_PASSWORD=ethereal-password
EMAIL_FROM="RoomMaster <noreply@ethereal.email>"
```

## Bước 2: Start Server

```bash
npm run dev
```

Check console cho:
```
✅ Email service is ready to send emails
```

## Bước 3: Test Email

### 3.1. Tạo customer với email

```bash
curl -X POST http://localhost:8080/employee-api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "fullName": "Test Customer",
    "phone": "0901234567",
    "email": "test@example.com",
    "password": "12345678",
    "idNumber": "123456789"
  }'
```

### 3.2. Tạo booking

```bash
curl -X POST http://localhost:8080/employee-api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "customerId": "CUSTOMER_ID_FROM_STEP_3.1",
    "rooms": [{"roomTypeId": "YOUR_ROOM_TYPE_ID", "count": 1}],
    "checkInDate": "2026-01-20",
    "checkOutDate": "2026-01-22",
    "totalGuests": 2
  }'
```

### 3.3. Confirm booking (Trigger Email!)

```bash
curl -X PATCH http://localhost:8080/employee-api/v1/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN" \
  -d '{
    "status": "CONFIRMED"
  }'
```

## Bước 4: Verify Email

### Nếu dùng Gmail:
- Check inbox của email trong Step 3.1

### Nếu dùng Ethereal:
- Truy cập: https://ethereal.email/messages
- Login với credentials từ Step 1
- Xem email preview

### Check Console Logs:
```
✅ Email sent successfully: <message-id>
✅ Booking confirmation email sent to test@example.com for booking BOOK-XXX
```

## 🎉 Done!

Email đã được gửi với:
- ✅ Vietnamese content
- ✅ Beautiful HTML design
- ✅ All booking details
- ✅ Room information
- ✅ Financial summary

## Troubleshooting

### Không thấy log email sent?
- Check customer có email không: `GET /employee-api/v1/customers/:id`
- Check booking status đã CONFIRMED: `GET /employee-api/v1/bookings/:id`

### Email service connection failed?
- Verify SMTP credentials trong `.env`
- Test connection: Restart server và check console

### Template not found?
- Check file tồn tại: `ls src/templates/emails/booking-confirmation.hbs`
- Rebuild: `npm run build`

## 📚 Full Documentation

- [Email Integration Guide](./email-integration-guide.md) - Complete guide
- [Implementation Summary](./email-integration-summary.md) - What was built

## 🔗 Useful Links

- Ethereal Email (Test SMTP): https://ethereal.email/
- Gmail App Passwords: https://myaccount.google.com/apppasswords
- Nodemailer Docs: https://nodemailer.com/
- Handlebars Docs: https://handlebarsjs.com/
