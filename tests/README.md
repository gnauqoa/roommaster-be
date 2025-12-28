# Testing Guide

This document provides guidelines for writing and running tests in the Roommaster application.

## Table of Contents

- [Test Statistics](#test-statistics)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)

## Test Statistics

### ✅ All Tests Passing: 156/156

**Performance**: ~2.3 seconds total execution time

| Phase       | Services              | Tests | Status |
| ----------- | --------------------- | ----- | ------ |
| **Phase 1** | Foundation & Core     | 79    | ✅     |
| **Phase 2** | Room Management       | 45    | ✅     |
| **Phase 3** | Booking Management    | 12    | ✅     |
| **Phase 4** | Transaction & Payment | 20    | ✅     |

### Test Breakdown by Service

#### Phase 1: Foundation Services (79 tests)

- **ServiceService** (12 tests) - Service CRUD operations
- **TokenService** (18 tests) - JWT token generation & validation
- **AuthService** (17 tests) - Authentication & authorization
- **EmployeeService** (17 tests) - Employee management
- **CustomerService** (16 tests) - Customer management

#### Phase 2: Room Management (45 tests)

- **RoomTagService** (13 tests) - Room tag CRUD
- **RoomTypeService** (13 tests) - Room type management with tags
- **RoomService** (19 tests) - Room inventory & availability

#### Phase 3: Booking Management (12 tests)

- **BookingService** (12 tests) - Booking creation, check-in/out, validation

#### Phase 4: Transaction & Payment (20 tests)

- **TransactionService** (5 tests) - Payment routing logic
- **PromotionService** (15 tests) - Promotion management & discount calculation

## Setup

### Test Database

Tests use a separate PostgreSQL database to avoid conflicts with development data.

**Start the test database:**

```bash
docker compose -f docker-compose.only-db-test.yml up -d
```

**Stop the test database:**

```bash
docker compose -f docker-compose.only-db-test.yml down
```

The test database runs on port `5433` (different from dev database on `5432`).

### Environment Variables

Create a `.env.test` file or ensure your `.env` has test database configuration:

```env
DATABASE_URL=postgresql://postgres:secret@localhost:5433/roommaster_test
```

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test tests/unit/services/service.service.test.ts

# Run tests matching pattern
yarn test --testNamePattern="ServiceService"
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions/methods in isolation with mocked dependencies.

**Location:** `tests/unit/`

**Example:**

```typescript
import { describe, expect, it, beforeEach } from '@jest/globals';
import { ServiceService } from '../../../src/services/service.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient } from '@prisma/client';

describe('ServiceService', () => {
  let serviceService: ServiceService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    serviceService = new ServiceService(mockPrisma as PrismaClient);
  });

  it('should create a service', async () => {
    const serviceData = { name: 'Test', price: 1000 };

    (mockPrisma.service!.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.service!.create as jest.Mock).mockResolvedValue({
      id: '123',
      ...serviceData
    });

    const result = await serviceService.createService(serviceData);

    expect(result.id).toBe('123');
    expect(mockPrisma.service!.create).toHaveBeenCalled();
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly, using the real database.

**Location:** `tests/integration/`

**Example:**

```typescript
import request from 'supertest';
import app from '../../../src/app';
import setupTestDB from '../../utils/setupTestDb';

setupTestDB();

describe('Auth Routes', () => {
  it('POST /v1/employee/auth/login - should login employee', async () => {
    // Insert test employee first
    // ...

    const res = await request(app)
      .post('/v1/employee/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(res.body).toHaveProperty('tokens');
  });
});
```

## Test Structure

```
tests/
├── fixtures/           # Test data and factories
│   ├── employee.fixture.ts
│   └── index.ts
├── integration/        # Integration tests
│   └── routes/
│       └── auth.route.test.ts
├── unit/              # Unit tests
│   └── services/
│       └── service.service.test.ts
└── utils/             # Test utilities
    ├── setupTestDb.ts
    └── testContainer.ts
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Clean database between tests

### 2. Descriptive Test Names

```typescript
// Good
it('should throw error when service name already exists', async () => {});

// Bad
it('test create service', async () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create a service', async () => {
  // Arrange
  const serviceData = { name: 'Test', price: 1000 };
  mockPrisma.service!.create.mockResolvedValue(serviceData);

  // Act
  const result = await serviceService.createService(serviceData);

  // Assert
  expect(result).toEqual(serviceData);
});
```

### 4. Mock External Dependencies

- Always mock database calls in unit tests
- Use `createMockPrismaClient()` for Prisma mocks
- Mock third-party services (email, payment gateways, etc.)

### 5. Test Error Cases

```typescript
it('should throw error when service not found', async () => {
  mockPrisma.service!.findUnique.mockResolvedValue(null);

  await expect(serviceService.getServiceById('invalid-id')).rejects.toThrow('Service not found');
});
```

### 6. Coverage Goals

- Aim for at least 50% coverage (configured in `jest.config.ts`)
- Focus on critical business logic
- Don't obsess over 100% coverage

### 7. Keep Tests Fast

- Unit tests should run in milliseconds
- Use mocks to avoid slow operations
- Run integration tests separately if needed

## Utilities

### `createMockPrismaClient()`

Creates a mocked Prisma client for unit testing.

```typescript
import { createMockPrismaClient } from '../../utils/testContainer';

const mockPrisma = createMockPrismaClient();
```

### `setupTestDB()`

Sets up and tears down the test database for integration tests.

```typescript
import setupTestDB from '../../utils/setupTestDb';

setupTestDB(); // Call at the top of your test file
```

### Fixtures

Use fixtures for consistent test data:

```typescript
import { adminEmployee, insertEmployees } from '../../fixtures';

await insertEmployees([adminEmployee]);
```

## Debugging Tests

### Run Single Test

```bash
yarn test -t "should create a service"
```

### Enable Verbose Output

```bash
yarn test --verbose
```

### Debug in VS Code

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

- Ensure test database is running: `docker compose -f docker-compose.only-db-test.yml up -d`
- Check `DATABASE_URL` in `.env`
- Run `yarn db:push` to sync schema

### Test Timeouts

- Increase timeout for slow tests: `jest.setTimeout(10000)`
- Check for unresolved promises
- Ensure database cleanup is working

### Import Errors

- Check module paths in `jest.config.ts`
- Ensure TypeScript paths are configured correctly
- Clear Jest cache: `yarn test --clearCache`
