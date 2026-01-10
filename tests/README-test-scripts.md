# Test Scripts - Database Reset & Seed

All test scripts now automatically reset and seed the database before running tests to ensure a clean, consistent test environment.

## Test Commands

### Run All Tests

```bash
yarn test
```

- Starts test database (Docker Compose)
- Resets database (drops all data, reruns migrations)
- Seeds database with test data
- Runs all tests
- Stops test database

### Watch Mode

```bash
yarn test:watch
```

- Same as above but runs Jest in watch mode
- **Note**: Database is reset/seeded only once at start
- Tests rerun automatically on file changes

### Coverage

```bash
yarn test:coverage
```

- Same as `yarn test` but with coverage report

### Integration Tests Only

```bash
yarn test:integration
```

- Same as `yarn test` but only runs integration tests

### Unit Tests Only

```bash
yarn test:unit
```

- Runs unit tests only
- No database setup needed

## Database Scripts

### Reset Database

```bash
yarn db:reset
```

- Drops all data
- Reruns all migrations
- **Warning**: Destructive operation!

### Seed Database

```bash
yarn db:seed
```

- Populates database with test/dev data
- Safe to run multiple times (uses upsert)

### Push Schema

```bash
yarn db:push
```

- Pushes schema changes without migrations
- Used for development

## Benefits

### ✅ Consistent Test Environment

- Every test run starts with the same data
- No flaky tests due to leftover data
- Predictable test results

### ✅ Isolated Tests

- Tests don't interfere with each other
- Can run tests in any order
- Parallel test execution safe

### ✅ Easy Debugging

- Known initial state
- Reproducible failures
- Clear test data

## Test Flow

```
1. Start Docker Compose (PostgreSQL on port 5433)
2. Reset Database (drop all data, rerun migrations)
3. Seed Database (insert test data)
4. Run Tests
5. Stop Docker Compose
```

## Example Output

```bash
$ yarn test

# Starting test database...
✓ Container postgresdb-roommaster-test started

# Resetting database...
✓ Database reset complete

# Seeding database...
✓ Created 2 room types
✓ Created 10 rooms
✓ Created 5 services
✓ Created 1 employee
✓ Seed complete

# Running tests...
PASS tests/integration/interactive-booking-flow.test.ts
PASS tests/integration/booking-flow.test.ts

Tests: 2 passed, 2 total
```

## Notes

- **Watch Mode**: Database is reset/seeded only once when starting watch mode, not on every test rerun
- **Unit Tests**: Don't need database, so they skip the setup
- **Test Database**: Uses separate database on port 5433 (not dev database on 5432)
- **Seed Data**: Defined in `prisma/seeds/index.ts`
