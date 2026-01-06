# Testing Guide

Complete guide for testing the Roommaster application.

## Quick Start

```bash
# Run all tests (auto resets & seeds DB)
yarn test

# Watch mode (recommended for development)
yarn test:watch

# Run specific test type
yarn test:unit          # Unit tests only
yarn test:integration   # Integration tests only
yarn test:booking-flow  # Booking flow test only

# Coverage
yarn test:coverage
```

## Test Database

Tests use a **separate PostgreSQL database** (port 5433) managed by Docker Compose.

**Database is automatically:**

- Started before tests
- Reset (drops all data, reruns migrations)
- Seeded with test data
- Stopped after tests

**Manual database commands:**

```bash
yarn db:reset  # Drop all data, rerun migrations
yarn db:seed   # Populate with test data
yarn db:push   # Push schema changes (dev only)
```

## Test Structure

```
tests/
├── integration/                    # Integration tests (with real DB)
│   ├── booking-flow.test.ts       # Full booking workflow
│   └── interactive-booking-flow.test.ts  # Detailed logging version
├── unit/                          # Unit tests (mocked)
│   └── services/
│       ├── service.service.test.ts
│       ├── auth.service.test.ts
│       └── ...
├── fixtures/                      # Test data factories
└── utils/                         # Test utilities
```

## Integration Tests

### Booking Flow Tests

Two versions of the same test:

**1. Standard Version** (`booking-flow.test.ts`)

- Concise assertions
- Fast execution
- CI/CD friendly

**2. Interactive Version** (`interactive-booking-flow.test.ts`)

- Detailed logging at each step
- Easy debugging
- Shows complete data flow

Both test the same workflow:

1. Create booking (3 rooms, 2 nights)
2. Deposit payment (50% of total)
3. Check-in all rooms
4. Add service usage
5. Partial payment (room 3)
6. Service payment
7. Full payment
8. Check-out

**Run specific test:**

```bash
yarn test:booking-flow
yarn test --testNamePattern="Interactive"
```

### Example Output

```
✅ Booking created: BK1767625250009QUZ6D
✅ Deposit paid: 3400000 VND (50%)
✅ Checked in 3 rooms
✅ Service usage created: 2 units
✅ Partial payment: 3400000 VND
✅ Service paid: 100000 VND
✅ Full payment: 0 VND
✅ Checked out 3 rooms

✅ Full booking flow completed successfully!
   Total Amount: 6800000 VND
   Total Paid: 6800000 VND
   Transactions: 4
```

## Unit Tests

Unit tests use **mocked dependencies** and don't require database.

**Example:**

```typescript
import { createMockPrismaClient } from '../../utils/testContainer';

describe('ServiceService', () => {
  let serviceService: ServiceService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    serviceService = new ServiceService(mockPrisma as PrismaClient);
  });

  it('should create a service', async () => {
    mockPrisma.service!.create.mockResolvedValue({ id: '123', name: 'Test' });

    const result = await serviceService.createService({ name: 'Test', price: 1000 });

    expect(result.id).toBe('123');
  });
});
```

## Best Practices

### 1. Test Isolation

- Each test is independent
- Database reset before each test run
- No shared state between tests

### 2. Descriptive Names

```typescript
// ✅ Good
it('should throw error when service name already exists', async () => {});

// ❌ Bad
it('test create service', async () => {});
```

### 3. Arrange-Act-Assert

```typescript
it('should create a service', async () => {
  // Arrange
  const data = { name: 'Test', price: 1000 };

  // Act
  const result = await serviceService.createService(data);

  // Assert
  expect(result).toHaveProperty('id');
});
```

### 4. Test Error Cases

```typescript
it('should throw error when service not found', async () => {
  await expect(serviceService.getServiceById('invalid-id')).rejects.toThrow('Service not found');
});
```

## Debugging

### Run Single Test

```bash
yarn test -t "should create a service"
```

### Verbose Output

```bash
yarn test --verbose
```

### VS Code Debug

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Database Connection Errors

- Ensure Docker is running
- Check `DATABASE_URL` in `.env`
- Run `yarn db:push` to sync schema

### Test Timeouts

- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Ensure database cleanup works

### Import Errors

- Check paths in `jest.config.ts`
- Clear Jest cache: `yarn test --clearCache`

## Test Statistics

**All Tests Passing:** 156/156 ✅

| Category              | Tests | Status |
| --------------------- | ----- | ------ |
| Foundation Services   | 79    | ✅     |
| Room Management       | 45    | ✅     |
| Booking Management    | 12    | ✅     |
| Transaction & Payment | 20    | ✅     |

**Performance:** ~2.3 seconds total execution time

## CI/CD

Tests run automatically in CI/CD:

1. Docker Compose starts test database
2. Database reset & seed
3. Tests run sequentially (`-i` flag)
4. Database teardown

## Environment

**Test Database:**

- Port: 5433 (separate from dev on 5432)
- Database: `roommaster_test`
- Auto-managed by Docker Compose

**Environment Variables:**

```env
DATABASE_URL=postgresql://postgres:secret@localhost:5433/roommaster_test
```

## Adding New Tests

### Unit Test

1. Create file in `tests/unit/services/`
2. Use `createMockPrismaClient()` for mocks
3. Follow naming: `*.service.test.ts`

### Integration Test

1. Create file in `tests/integration/`
2. Use real database (auto-setup)
3. Add cleanup in `afterAll`
4. Set appropriate timeout

## Utilities

**`createMockPrismaClient()`** - Mock Prisma for unit tests

```typescript
const mockPrisma = createMockPrismaClient();
```

**`setupTestDB()`** - Setup/teardown for integration tests

```typescript
setupTestDB(); // Call at top of test file
```

**Fixtures** - Consistent test data

```typescript
import { adminEmployee, insertEmployees } from '../../fixtures';
await insertEmployees([adminEmployee]);
```
