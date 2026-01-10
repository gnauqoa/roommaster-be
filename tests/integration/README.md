# Integration Tests

This directory contains integration tests that test the complete workflows and interactions between multiple services.

## Running Integration Tests

### Run all integration tests

```bash
yarn test:integration
```

### Run specific integration test

```bash
yarn test tests/integration/booking-flow.test.ts
```

### Run with watch mode

```bash
yarn test:watch --testPathPattern=integration
```

## Available Integration Tests

### Booking Flow Test

**File:** `booking-flow.test.ts`

Tests the complete booking workflow:

1. Create booking (3 rooms, 2 nights)
2. Make deposit payment
3. Check-in rooms
4. Create service usage
5. Partial payment (2 rooms)
6. Service payment
7. Full payment (remaining balance)
8. Check-out all rooms

**Duration:** ~10-15 seconds

**Requirements:**

- Database must be seeded with:
  - Room types with available rooms
  - Active services
  - Employee account

## Test Structure

Integration tests follow this pattern:

```typescript
describe('Feature Integration Test', () => {
  beforeAll(async () => {
    // Setup: Initialize services and test data
  });

  afterAll(async () => {
    // Cleanup: Remove test data and disconnect
  });

  it(
    'should complete full workflow',
    async () => {
      // Test steps with assertions
    },
    timeout
  );
});
```

## Best Practices

1. **Isolation**: Each test should clean up after itself
2. **Realistic Data**: Use realistic test data that mimics production
3. **Assertions**: Verify both success and side effects
4. **Logging**: Use console.log for debugging (visible in test output)
5. **Timeout**: Set appropriate timeouts for long-running tests

## Debugging

To debug integration tests:

```bash
# Run with verbose output
yarn test:integration --verbose

# Run specific test with logs
yarn test tests/integration/booking-flow.test.ts --verbose

# Run with coverage
yarn test:coverage --testPathPattern=integration
```

## CI/CD

Integration tests are run in CI/CD pipeline:

- Docker Compose spins up test database
- Database is seeded
- Tests run sequentially (`-i` flag)
- Database is torn down

## Adding New Integration Tests

1. Create new test file in `tests/integration/`
2. Follow the naming convention: `*.test.ts`
3. Use `beforeAll` for setup and `afterAll` for cleanup
4. Set appropriate timeout for long-running tests
5. Add documentation to this README
