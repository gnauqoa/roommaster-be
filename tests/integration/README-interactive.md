# Interactive Booking Flow Test

This test provides detailed logging at each step of the booking flow, making it easy to understand and debug the booking lifecycle.

## Features

- **Runs with Jest**: Integrates with existing test suite
- **Uses Docker Compose Test DB**: Automatic database setup via `docker-compose.only-db-test.yml`
- **Detailed Logging**: Comprehensive logs at each step
- **Automatic Cleanup**: Removes old test bookings and resets room statuses
- **No Manual Setup Required**: Docker compose handles everything

## Usage

The test runs automatically with the standard test commands:

### Run All Tests (includes this test)

```bash
yarn test
```

### Watch Mode (recommended for development)

```bash
yarn test:watch
```

The interactive test will run along with all other integration tests.

### Run Only Integration Tests

```bash
yarn test:integration
```

### Run Only This Test

If you want to run only the interactive booking flow test:

```bash
yarn test:watch --testNamePattern="Interactive"
```

Or:

```bash
yarn test --testNamePattern="Interactive"
```

## What It Tests

The test validates the complete booking flow:

1. **Create Booking** - 3 rooms for 2 nights
2. **Deposit Payment** - Pay deposit amount
3. **Check-in** - Check in all rooms
4. **Service Usage** - Add service to booking
5. **Partial Payment** - Pay for first 2 rooms
6. **Service Payment** - Pay for service (auto-skips if already paid)
7. **Full Payment** - Pay remaining balance
8. **Check-out** - Complete the booking

## Example Output

```
============================================================
INTERACTIVE BOOKING FLOW TEST
============================================================

[SETUP] Setting up test data...
✅ [SETUP] Test data ready

[STEP 1] Creating booking for 3 rooms (2 nights)...
✅ [STEP 1] Booking created: BK17676150249058N7T8

[STEP 1] Booking Details:
{
  "bookingId": "cmk14ci6o0002lqtfspwoclbm",
  "bookingCode": "BK17676150249058N7T8",
  "status": "PENDING",
  "totalAmount": 6800000,
  "depositRequired": 6800000,
  "balance": 6800000,
  "totalPaid": 0,
  "rooms": 3
}

[STEP 2] Making deposit payment...
✅ [STEP 2] Deposit paid: 6800000 VND

[STEP 2] Booking Status After Deposit:
{
  "status": "CONFIRMED",
  "depositRequired": 6800000,
  "totalPaid": 6800000,
  "balance": 0
}

...

============================================================
FINAL SUMMARY
============================================================

Booking Code: BK17676150249058N7T8
Status: CHECKED_OUT
Total Amount: 6800000 VND
Total Paid: 6800000 VND
Balance: 0 VND
Rooms: 3
Services: 1
Transactions: 4

============================================================
✅ TEST COMPLETED
============================================================
```

## Benefits

1. **Easy Debugging**: Detailed logs show exactly what happens at each step
2. **No Manual Setup**: Docker compose handles database automatically
3. **Isolated Testing**: Uses separate test database (port 5433)
4. **Watch Mode**: Automatically reruns on file changes
5. **CI/CD Ready**: Works in automated pipelines

## Comparison with Standalone Script

| Feature             | Jest Version          | Standalone Script     |
| ------------------- | --------------------- | --------------------- |
| Database            | Docker Compose (auto) | Manual setup required |
| Interactive Prompts | No                    | Yes (y/n prompts)     |
| Watch Mode          | ✅ Yes                | ❌ No                 |
| CI/CD               | ✅ Yes                | ❌ No                 |
| Detailed Logging    | ✅ Yes                | ✅ Yes                |
| Cleanup             | ✅ Automatic          | ✅ Automatic          |

## Files

- [`interactive-booking-flow.test.ts`](file:///Users/quang/workplace/roommaster/roommaster-be/tests/integration/interactive-booking-flow.test.ts) - Jest test with detailed logging
- [`docker-compose.only-db-test.yml`](file:///Users/quang/workplace/roommaster/roommaster-be/docker-compose.only-db-test.yml) - Test database configuration
- [`package.json`](file:///Users/quang/workplace/roommaster/roommaster-be/package.json) - Test scripts

## Tips

- The test runs automatically with `yarn test` and `yarn test:watch`
- Use `--testNamePattern="Interactive"` to run only this test
- Use `--verbose` for even more detailed output
- Check `docker-compose.only-db-test.yml` for database configuration (port 5433)
