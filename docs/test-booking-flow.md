# Full Booking Flow Test Script

## Overview

This script (`scripts/test-booking-flow.ts`) tests the complete booking workflow in the Roommaster application.

## Test Flow

The script executes the following steps:

1. **Employee Login** - Authenticate as admin employee
2. **Get/Create Customer** - Ensure test customer exists
3. **Get Available Rooms** - Find available room types
4. **Create Booking** - Book 3 rooms for 2 nights
5. **Make Deposit** - Pay deposit to confirm booking
6. **Check-in Rooms** - Check in all 3 rooms
7. **Create Service Usage** - Add room service to first room
8. **Partial Payment** - Pay for first 2 rooms only
9. **Pay Service** - Pay for the room service
10. **Full Payment** - Pay remaining balance for all rooms
11. **Check-out** - Check out all rooms

## Prerequisites

1. **Database Setup**

   ```bash
   # Run migrations
   yarn prisma migrate dev

   # Seed database with initial data
   yarn prisma db seed
   ```

2. **Server Running**

   ```bash
   # Start the development server
   yarn dev
   ```

3. **Environment Variables**
   - Ensure `.env` file is configured
   - Default API URL: `http://localhost:8080/v1`

## Running the Test

### Option 1: Using ts-node (Recommended)

```bash
npx ts-node -r tsconfig-paths/register scripts/test-booking-flow.ts
```

### Option 2: Compile and Run

```bash
# Build the project
yarn build

# Run the compiled script
node build/scripts/test-booking-flow.js
```

## Configuration

You can customize the test by modifying these variables in the script:

```typescript
const BASE_URL = process.env.API_URL || 'http://localhost:8080/v1';
const EMPLOYEE_USERNAME = 'admin';
const EMPLOYEE_PASSWORD = 'password123';
```

## Expected Output

The script provides detailed logging for each step:

```
============================================================
STARTING FULL BOOKING FLOW TEST
============================================================

[STEP 1] Employee login...
✅ [STEP 1] Logged in as Admin User

[STEP 2] Getting/creating customer...
✅ [STEP 2] Customer ready: Nguyễn Văn Test (0987654321)

[STEP 3] Getting available room types...
✅ [STEP 3] Found 2 room types with available rooms

[STEP 4] Creating booking for 3 rooms (2 nights)...
✅ [STEP 4] Booking created: BK123456

... (more steps)

============================================================
✅ BOOKING FLOW TEST COMPLETED SUCCESSFULLY!
============================================================

Final Booking Summary:
  Booking Code: BK123456
  Status: CHECKED_OUT
  Total Amount: 1200000 VND
  Total Paid: 1200000 VND
  Balance: 0 VND
  Rooms: 3
  Services: 1
  Transactions: 4
============================================================
```

## Troubleshooting

### Error: "No available rooms found"

- Run `yarn prisma db seed` to populate the database with test data

### Error: "API Error: Unauthorized"

- Check that the employee credentials are correct
- Ensure the server is running

### Error: "Connection refused"

- Verify the server is running on the correct port
- Check the `BASE_URL` configuration

## What This Tests

- ✅ Employee authentication
- ✅ Booking creation with multiple rooms
- ✅ Deposit payment and booking confirmation
- ✅ Room check-in process
- ✅ Service usage creation
- ✅ Partial payment (split room payments)
- ✅ Service payment
- ✅ Full payment settlement
- ✅ Room checkout process
- ✅ Transaction tracking
- ✅ Balance calculations

## Adding to CI/CD

To add this test to your CI/CD pipeline:

```yaml
# In .github/workflows/test.yml
- name: Run booking flow test
  run: npx ts-node -r tsconfig-paths/register scripts/test-booking-flow.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_URL: http://localhost:8080/v1
```
