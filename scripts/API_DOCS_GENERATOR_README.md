# API Documentation Generator

This script automatically generates comprehensive API documentation by running through all endpoints, recording their responses, and creating detailed documentation files.

## Features

- 🔍 **Auto-discovery**: Automatically finds all API endpoints from Express routes
- 🔐 **Authentication**: Handles JWT authentication for protected endpoints
- 📝 **Comprehensive**: Records request/response examples for each endpoint
- ⚙️ **Configurable**: Customizable sample data and descriptions
- 📊 **Multiple Formats**: Generates both Markdown and JSON documentation
- 🏷️ **Categorized**: Organizes endpoints by functional area

## Prerequisites

Before running the script, ensure:

1. **Database is running**: Start your development database

   ```bash
   pnpm run docker:dev-db:start
   ```

2. **Database is seeded**: Ensure you have test data

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

3. **Valid credentials**: Update credentials in `scripts/api-docs-config.ts` if needed

## Usage

### Quick Start

Generate API documentation with one command:

```bash
pnpm run generate:api-docs
```

This will:

1. Start the API server
2. Authenticate using configured credentials
3. Test all endpoints
4. Generate `API_DOCUMENTATION.md` and `api-documentation.json`

### Configuration

Customize the documentation generation by editing `scripts/api-docs-config.ts`:

#### Authentication Credentials

```typescript
auth: {
  email: 'admin@hotel.com',
  password: 'password123'
}
```

#### Sample Request Data

Add sample data for POST/PUT/PATCH endpoints:

```typescript
sampleData: {
  'POST /v1/rooms': {
    roomNumber: '101',
    floor: 1,
    roomTypeId: 1,
    status: 'AVAILABLE'
  }
}
```

#### Skip Endpoints

Skip problematic or deprecated endpoints:

```typescript
skipEndpoints: ['DELETE /v1/employees/:id', 'POST /v1/auth/register'];
```

#### Add Descriptions

Provide custom descriptions for endpoints:

```typescript
descriptions: {
  'POST /v1/auth/login': 'Authenticate and receive JWT tokens',
  'GET /v1/rooms': 'List all rooms with optional filters'
}
```

#### Adjust Timing

```typescript
timeout: 5000,              // Request timeout in ms
delayBetweenRequests: 100   // Delay between requests in ms
```

## Output Files

### API_DOCUMENTATION.md

A comprehensive Markdown file with:

- Table of contents
- Endpoints organized by category
- Request/response examples
- Authentication requirements
- Status codes and error examples

Example structure:

```markdown
# Hotel Management System API Documentation

## Authentication

### POST /v1/auth/login

Authenticate a user and receive JWT tokens

**Request Body:**
{
"email": "admin@hotel.com",
"password": "password123"
}

**Response Status:** 200
**Success Response:**
{
"user": {...},
"tokens": {...}
}
```

### api-documentation.json

A machine-readable JSON file containing:

- All endpoint metadata
- Request/response examples
- Status codes
- Timestamps

Useful for:

- API testing tools
- Documentation portals
- CI/CD pipelines
- Automated testing

## Categories

Endpoints are automatically categorized:

- **Authentication**: Login, register, tokens
- **Employees**: Staff management
- **Rooms**: Room and room type management
- **Customers**: Guest management
- **Reservations**: Booking management
- **Stay Records**: Active stays
- **Folios**: Guest billing
- **Services**: Hotel services
- **Housekeeping**: Cleaning tasks
- **Invoices**: Financial records
- **Inspections**: Quality control
- **Customer Tiers**: Loyalty programs
- **Shifts**: Staff scheduling
- **Reports**: Analytics and reports
- **Nightly Operations**: Batch processes

## Troubleshooting

### Authentication Fails

**Problem**: Script cannot authenticate
**Solution**:

- Verify credentials in `api-docs-config.ts`
- Ensure database is seeded with admin user
- Check `prisma/seeds/employee.ts` for default credentials

### Endpoints Return 404

**Problem**: Routes not found
**Solution**:

- Ensure all routes are properly registered in `src/routes/v1/index.ts`
- Check that the server is running correctly
- Verify route paths match

### Database Connection Errors

**Problem**: Cannot connect to database
**Solution**:

```bash
# Start database
pnpm run docker:dev-db:start

# Push schema
npx prisma db push

# Seed data
npx prisma db seed
```

### Timeout Errors

**Problem**: Requests timing out
**Solution**:

- Increase timeout in `api-docs-config.ts`
- Check server performance
- Verify database queries are optimized

### Missing Request Examples

**Problem**: Some POST/PUT/PATCH endpoints show no request body
**Solution**:

- Add sample data in `api-docs-config.ts` sampleData section
- Follow the format: `'METHOD /path': { data }`

## Advanced Usage

### Custom Base URL

Run against a different server:

```typescript
// Modify in generate-api-docs.ts
const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
```

Then run:

```bash
API_BASE_URL=https://staging.api.com pnpm run generate:api-docs
```

### Filter by Category

Modify the script to test only specific categories:

```typescript
// In generate-api-docs.ts
const apiRoutes = routes
  .filter((r) => r.fullPath.startsWith('/v1'))
  .filter((r) => r.fullPath.includes('/rooms')); // Only rooms
```

### Export to Different Formats

Extend the script to generate additional formats:

```typescript
// Add to generate-api-docs.ts
import { writeFileSync } from 'fs';

// HTML export
const html = generateHTML(documentation);
writeFileSync('api-docs.html', html);

// OpenAPI/Swagger export
const openapi = convertToOpenAPI(documentation);
writeFileSync('openapi.json', JSON.stringify(openapi, null, 2));
```

## Integration with CI/CD

### Generate on Every Build

```yaml
# .github/workflows/api-docs.yml
name: Generate API Docs

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: pnpm install
      - name: Start database
        run: pnpm run docker:dev-db:start
      - name: Setup database
        run: |
          npx prisma db push
          npx prisma db seed
      - name: Generate docs
        run: pnpm run generate:api-docs
      - name: Commit docs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add API_DOCUMENTATION.md api-documentation.json
          git commit -m "Update API documentation" || exit 0
          git push
```

### Validate API Changes

Use the generated JSON to detect breaking changes:

```typescript
// scripts/validate-api-changes.ts
import { readFileSync } from 'fs';

const oldDocs = JSON.parse(readFileSync('api-documentation.json', 'utf8'));
const newDocs = generateNewDocs();

const changes = detectBreakingChanges(oldDocs, newDocs);
if (changes.length > 0) {
  console.error('Breaking changes detected:', changes);
  process.exit(1);
}
```

## Best Practices

1. **Run regularly**: Generate docs after significant API changes
2. **Version control**: Commit generated docs to track API evolution
3. **Review manually**: Verify generated examples make sense
4. **Keep config updated**: Add new endpoints to config as they're created
5. **Test data quality**: Ensure seed data represents realistic scenarios

## Support

For issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review console output for specific errors
3. Verify configuration in `api-docs-config.ts`
4. Check that server and database are running properly

## License

Same as the main project.
