# RoomMaster Backend - System Architecture

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [System Layers](#system-layers)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Security Architecture](#security-architecture)
- [Business Domains](#business-domains)
- [Data Flow](#data-flow)
- [Deployment Architecture](#deployment-architecture)
- [Key Design Decisions](#key-design-decisions)

## Overview

RoomMaster is a comprehensive Hotel Property Management System (PMS) backend built with modern TypeScript and PostgreSQL. The system manages the complete lifecycle of hotel operations including reservations, check-in/out, financial accounting (folios), housekeeping, and reporting.

**Architecture Style**: Layered Architecture with MVC pattern  
**Primary Language**: TypeScript  
**Database**: PostgreSQL with Prisma ORM  
**API Style**: RESTful JSON API

## Technology Stack

### Core Framework
- **Runtime**: Node.js (ES2016+)
- **Language**: TypeScript 4.9+ (strict mode enabled)
- **Web Framework**: Express.js
- **ORM**: Prisma 4.x (with PostgreSQL)

### Security & Authentication
- **Authentication**: Passport.js with JWT strategy
- **Validation**: Joi schema validation
- **Security Headers**: Helmet
- **XSS Protection**: xss-filters
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit

### Development & Operations
- **Process Manager**: PM2 (production)
- **Hot Reload**: Nodemon (development)
- **Testing**: Jest + Supertest
- **Logging**: Winston + Morgan
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Containerization**: Docker + Docker Compose

### Utilities
- **Password Hashing**: bcryptjs
- **Compression**: compression middleware
- **Environment**: dotenv + cross-env
- **Email**: nodemailer
- **Documentation**: Swagger (swagger-jsdoc + swagger-ui-express)

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│            (HTTP Requests via REST API)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Middleware Layer                       │
│  ┌──────────┬──────────┬─────────┬──────────────────┐  │
│  │  Auth    │ Validate │   XSS   │  Rate Limiter    │  │
│  │ (Passport)│  (Joi)  │ Sanitize│  Error Handler   │  │
│  └──────────┴──────────┴─────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Controller Layer                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Request Handling, Response Formatting,          │  │
│  │  HTTP Status Codes, Input Extraction (pick)      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Business Logic, Validation, Transactions,       │  │
│  │  Complex Queries, Code Generation, Calculations  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Prisma ORM, Database Queries, Transactions      │  │
│  │  Schema Migrations, Type-Safe Models             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                      │
│           (28 Tables, Complex Relations)                │
└─────────────────────────────────────────────────────────┘
```

### 2. Key Design Patterns

- **Repository Pattern**: Abstracted through Prisma Client
- **Service Pattern**: Business logic encapsulated in service modules
- **Factory Pattern**: Code generation for entities (folios, transactions, etc.)
- **Middleware Chain**: Express middleware for cross-cutting concerns
- **Error Handling Pattern**: Centralized error converter and handler
- **Async Wrapper Pattern**: `catchAsync` utility for route handlers

## Component Architecture

### High-Level System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                      │
│              (Web App, Mobile App, Admin Panel)                 │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Request          ↑ Response
                        ↓ HTTPS/REST       ↑ JSON
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Request          ↑ Response
┌─────────────────────────────────────────────────────────────────┐
│                      RoomMaster Backend API                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Reservation  │  │    Stay      │  │   Financial  │         │
│  │  Management  │  │  Management  │  │    (Folio)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Housekeeping │  │   Reporting  │  │     Auth     │         │
│  │              │  │  & Analytics │  │     RBAC     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Customer   │  │     Room     │  │   Employee   │         │
│  │     CRM      │  │  Management  │  │  Management  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  External Service Integrations (within Service Layer):         │
│  • Email Service (nodemailer/SMTP)                             │
│  • Background Jobs (PM2 scheduled tasks)                       │
└─────────────────────────────────────────────────────────────────┘
                        ↓ Query            ↑ Data
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer (Prisma ORM)             │
└─────────────────────────────────────────────────────────────────┘
                        ↓ SQL Query        ↑ Result Set
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Config & │ │  HR/CRM  │ │Front Off │ │ Finance  │          │
│  │  Master  │ │ (7 tbl)  │ │ (5 tbl)  │ │ (4 tbl)  │          │
│  │ (6 tbl)  │ └──────────┘ └──────────┘ └──────────┘          │
│  └──────────┘ ┌──────────┐ ┌──────────┐                       │
│               │  Access  │ │Operations│                        │
│               │ Control  │ │  & Audit │                        │
│               │ (3 tbl)  │ │ (6 tbl)  │                        │
│               └──────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions & Dependencies

**Architecture Pattern: Prisma-Mediated Services**

Services do NOT call each other directly (except Auth/Token/Employee).
Instead, they interact through shared database models via Prisma ORM.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Controllers                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │Reservation │ │ StayRecord │ │   Folio    │ │Housekeeping│  │
│  │Controller  │ │ Controller │ │ Controller │ │ Controller │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  │
└────────┼──────────────┼──────────────┼──────────────┼──────────┘
         │ call         │ call         │ call         │ call
         ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          Services                               │
│                   (Independent - No direct calls)               │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │Reservation │ │ StayRecord │ │   Folio    │ │Housekeeping│  │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │  Room      │ │ Customer   │ │  Nightly   │ │   Report   │  │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  Special Case - Only Auth services have direct dependencies:   │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐           │
│  │   Auth     │───►│   Token    │───►│  Employee  │           │
│  │  Service   │    │  Service   │    │  Service   │           │
│  └────────────┘    └────────────┘    └────────────┘           │
│                                                                 │
└────────┬──────────────┬──────────────┬──────────────┬──────────┘
         │              │              │              │
         │ All services access data independently via Prisma
         ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Prisma Client                              │
│    (Shared data layer - Services read/write same models)        │
└─────────────────────────────────────────────────────────────────┘
         │ SQL Queries               ↑ Result Sets
         ↓                           ↑
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│  Models: Reservation, StayRecord, GuestFolio, Room, Customer... │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Components Detail

#### Reservation Domain
- **Components**: `ReservationController`, `ReservationService`
- **Models**: `Reservation`, `ReservationDetail`
- **Service Dependencies**: None
- **Data Dependencies (via Prisma)**: `Customer`, `RoomType`
- **Key Operations**: Create booking, Confirm, Cancel, Check availability
- **API Routes**: `/v1/reservations`

#### Stay Management Domain  
- **Components**: `StayRecordController`, `StayRecordService`
- **Models**: `StayRecord`, `StayDetail`, `GuestInResidence`, `RoomMoveLog`
- **Service Dependencies**: None
- **Data Dependencies (via Prisma)**: `Reservation`, `Room`, `Customer`, `GuestFolio`
- **Key Operations**: Check-in, Check-out, Room assignment, Room move
- **API Routes**: `/v1/stay-records`

#### Financial Domain (Folio)
- **Components**: `FolioController`, `FolioService`
- **Models**: `GuestFolio` (GUEST/MASTER/NON_RESIDENT), `FolioTransaction`, `Invoice`, `InvoiceDetail`
- **Service Dependencies**: None
- **Data Dependencies (via Prisma)**: `StayRecord`, `Service`, `PaymentMethod`
- **Key Operations**: Create folio, Post charges, Post payments, Generate invoice
- **API Routes**: `/v1/folios`, `/v1/invoices`

#### Housekeeping Domain
- **Components**: `HousekeepingController`, `HousekeepingService`, `InspectionService`
- **Models**: `HousekeepingLog`, `RoomInspection`
- **Dependencies**: `RoomService`, `EmployeeService`, `FolioService`
- **Key Operations**: Assign tasks, Update status, Inspect room, Post penalties
- **API Routes**: `/v1/housekeeping`, `/v1/inspections`

#### Reporting Domain
- **Components**: `ReportController`, `ReportService`, `NightlyService`
- **Models**: `DailySnapshot`
- **Dependencies**: All domain services (read-only)
- **Key Operations**: Generate snapshots, Calculate KPIs, Nightly room charge posting
- **API Routes**: `/v1/reports`, `/v1/nightly`

#### Authentication & Authorization Domain
- **Components**: `AuthController`, `AuthService`, `TokenService`
- **Models**: `Employee`, `UserGroup`, `SystemFunction`, `Permission`, `Token`
- **Dependencies**: None (foundational layer)
- **Key Operations**: Login, Refresh token, RBAC validation, Password management
- **API Routes**: `/v1/auth`

#### Customer Management Domain
- **Components**: `CustomerController`, `CustomerService`, `CustomerTierService`
- **Models**: `Customer`, `CustomerTier`
- **Dependencies**: None
- **Key Operations**: Customer CRUD, Loyalty points, Tier management
- **API Routes**: `/v1/customers`, `/v1/customer-tiers`

#### Room Management Domain
- **Components**: `RoomController`, `RoomService`
- **Models**: `Room`, `RoomType`, `RatePolicy`
- **Dependencies**: None
- **Key Operations**: Room availability, Rate calculation, Room status updates
- **API Routes**: `/v1/rooms`

#### Employee Management Domain
- **Components**: `EmployeeController`, `EmployeeService`
- **Models**: `Employee`, `WorkShift`, `WorkSchedule`, `ShiftSession`
- **Dependencies**: `UserGroupService`
- **Key Operations**: Employee CRUD, Shift management, Cash reconciliation
- **API Routes**: `/v1/employees`, `/v1/shifts`

### Request Processing Pipeline

```
HTTP Request
    ↓
┌─────────────────────────────────────────┐
│ 1. Morgan (HTTP Logging)                │
│    - Log request method, URL, status    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Helmet (Security Headers)            │
│    - CSP, HSTS, X-Frame-Options         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. CORS (Cross-Origin)                  │
│    - Allow configured origins           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Body Parser (JSON/URL-encoded)       │
│    - Parse request body                 │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. XSS Sanitization                     │
│    - Remove malicious scripts           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 6. Compression (gzip)                   │
│    - Compress response                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 7. Rate Limiter (Auth endpoints only)   │
│    - Prevent brute force attacks        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 8. Passport JWT Authentication          │
│    - Verify token (protected routes)    │
│    - Extract employee from JWT          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 9. RBAC Permission Check                │
│    - Verify UserGroup permissions       │
│    - Check SystemFunction access        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 10. Joi Request Validation              │
│     - Validate body, query, params      │
│     - Apply custom validation rules     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 11. Route Handler (Controller)          │
│     - Execute business logic via service│
│     - Format response                   │
└─────────────────────────────────────────┘
    │
    ↓ Success                ↓ Error
    │                        │
    │                  ┌─────────────────────────────────────────┐
    │                  │ 12. Error Handler (if error occurs)     │
    │                  │     - Convert to ApiError               │
    │                  │     - Log error with Winston            │
    │                  │     - Return formatted error response   │
    │                  └─────────────────────────────────────────┘
    │                        │
    │                        ↓
    └────────────────────────┤
                             ↓
                    HTTP Response (JSON)
```

### Service Dependency Graph

**ACTUAL Service-to-Service Dependencies:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Direct Service Dependencies (Only 3 services)                  │
│                                                                 │
│     ┌──────────────┐                                            │
│     │    Auth      │                                            │
│     │   Service    │                                            │
│     └───────┬──────┘                                            │
│             │                                                   │
│             ├─────────────┐                                     │
│             ↓             ↓                                     │
│     ┌──────────────┐  ┌──────────────┐                         │
│     │    Token     │  │   Employee   │                         │
│     │   Service    │─►│   Service    │                         │
│     └──────────────┘  └──────────────┘                         │
│                                                                 │
│  AuthService calls:                                             │
│    • TokenService.generateAuthTokens()                          │
│    • EmployeeService.getEmployeeByEmail()                       │
│                                                                 │
│  TokenService calls:                                            │
│    • EmployeeService.getEmployeeById()                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  All Other Services - NO Direct Dependencies                    │
│  (Interact via Prisma ORM reading/writing shared DB models)     │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Customer   │  │   Room     │  │  Service   │               │
│  │  Service   │  │  Service   │  │  Service   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │Reservation │  │ StayRecord │  │   Folio    │               │
│  │  Service   │  │  Service   │  │  Service   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │Housekeeping│  │ Inspection │  │  Invoice   │               │
│  │  Service   │  │  Service   │  │  Service   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│  ┌────────────┐  ┌────────────┐                                │
│  │  Nightly   │  │   Report   │                                │
│  │  Service   │  │  Service   │  (Scheduled/Read-only)         │
│  └────────────┘  └────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Data Dependencies (via Prisma - NOT service calls)             │
│                                                                 │
│  Examples:                                                      │
│  • StayRecordService reads Reservation model via Prisma         │
│  • FolioService reads StayRecord model via Prisma               │
│  • NightlyService reads StayDetail + creates Transactions       │
│  • InspectionService creates FolioTransactions directly         │
│                                                                 │
│  This is Prisma-mediated architecture, not service dependencies │
└─────────────────────────────────────────────────────────────────┘
```

## System Layers

### 1. Entry Point (`src/index.ts`)
- Database connection initialization
- Server startup
- Graceful shutdown handling
- Process signal management (SIGTERM, uncaught exceptions)

### 2. Application Configuration (`src/app.ts`)
- Express app setup
- Middleware registration
- Route mounting
- Global error handling

### 3. Route Layer (`src/routes/v1/`)
- **17 route modules** mapping HTTP endpoints to controllers
- Route-level middleware (auth, validation)
- API versioning (v1 prefix)

**Available Routes:**
- `auth`, `employees`, `rooms`, `customers`, `reservations`
- `stay-records`, `folios`, `services`, `housekeeping`
- `inspections`, `invoices`, `customer-tiers`, `shifts`
- `reports`, `nightly`, `docs`

### 4. Controller Layer (`src/controllers/`)
- **Thin controllers** - minimal logic
- Request parsing with `pick` utility
- Response formatting
- HTTP status code management
- Delegates to service layer

**Pattern:**
```typescript
const createReservation = catchAsync(async (req, res) => {
  const reservation = await reservationService.createReservation(req.body);
  res.status(httpStatus.CREATED).send(reservation);
});
```

### 5. Service Layer (`src/services/`)
- **Business logic hub** - core domain operations
- Transaction management
- Cross-entity operations
- Code generation
- Validation beyond schema
- Complex calculations (pricing, occupancy, revenue)

**Key Services:**
- `reservation.service.ts` - Booking management
- `stay-record.service.ts` - Check-in/out operations
- `folio.service.ts` - Financial transactions
- `nightly.service.ts` - Batch processing
- `housekeeping.service.ts` - Room cleaning workflow
- `report.service.ts` - Analytics and metrics

### 6. Middleware Layer (`src/middlewares/`)

| Middleware | Purpose |
|------------|---------|
| `auth.ts` | JWT verification, permission checking (RBAC) |
| `validate.ts` | Joi schema validation |
| `error.ts` | Error conversion and handling |
| `xss.ts` | XSS attack prevention |
| `rateLimiter.ts` | Rate limiting (auth endpoints) |

### 7. Configuration (`src/config/`)
- `env.ts` - Environment variables with Joi validation
- `passport.ts` - JWT authentication strategy
- `logger.ts` - Winston logger configuration
- `morgan.ts` - HTTP request logging
- `roles.ts` - RBAC role definitions

### 8. Validation Layer (`src/validations/`)
- Joi schemas for request validation
- Reusable custom validators
- Type-safe validation patterns

### 9. Utilities (`src/utils/`)
- `ApiError.ts` - Custom error class
- `catchAsync.ts` - Async error wrapper
- `pick.ts` - Object property picker
- `exclude.ts` - Sensitive data exclusion
- `encryption.ts` - Password hashing

## Database Design

### Schema Organization (28 Models)

#### 1. Configuration & Master Data (6 models)
- `SystemParameter` - System-wide settings
- `RoomType` - Room categories with pricing
- `Room` - Physical room inventory
- `RatePolicy` - Date-based pricing rules
- `Service` - Billable services catalog
- `PaymentMethod` - Payment options

#### 2. HR & CRM (7 models)
- `Employee` - Staff management
- `WorkShift` - Shift definitions
- `WorkSchedule` - Employee schedules
- `Customer` - Guest profiles
- `CustomerTier` - Loyalty program tiers
- `Promotion` - Discount campaigns
- `UserGroup` - RBAC groups

#### 3. Front Office Operations (5 models)
- `Reservation` - Bookings (by room type)
- `ReservationDetail` - Individual room type bookings
- `StayRecord` - Check-in sessions
- `StayDetail` - Specific room assignments
- `GuestInResidence` - Guest details per room

#### 4. Finance & Accounting (4 models)
- `GuestFolio` - Account containers (GUEST/MASTER/NON_RESIDENT)
- `FolioTransaction` - Charges and payments
- `Invoice` - Billing documents
- `InvoiceDetail` - Transaction-invoice mapping

#### 5. Access Control (3 models)
- `UserGroup` - Permission groups
- `SystemFunction` - System capabilities
- `Permission` - Group-function mapping

#### 6. Operations & Audit (6 models)
- `HousekeepingLog` - Cleaning tasks
- `RoomMoveLog` - Room transfer audit
- `ShiftSession` - Cash reconciliation
- `DailySnapshot` - Daily metrics
- `RoomInspection` - Checkout inspection
- `Token` - Authentication tokens

### Database Relationships

**Key Relationship Patterns:**
- **One-to-Many**: Customer → Reservations, RoomType → Rooms
- **Many-to-Many**: UserGroup ↔ SystemFunction (via Permission)
- **Self-Referencing**: FolioTransaction (originalTxId for adjustments)
- **Polymorphic-like**: GuestFolio (optional reservationId, stayRecordId, stayDetailId)

**Cascade Rules:**
- `onDelete: Cascade` for dependent entities (ReservationDetail, StayDetail, etc.)
- Soft deletes via status fields (no hard deletions)

### Indexes
- Composite indexes on frequently queried combinations
- Foreign key indexes (automatic via Prisma)
- Unique constraints on business keys (code, email, idNumber)
- Date-based indexes for transaction queries

## API Design

### RESTful Conventions

```
GET    /v1/{resource}           - List with pagination/filtering
POST   /v1/{resource}           - Create new entity
GET    /v1/{resource}/:id       - Get single entity
PATCH  /v1/{resource}/:id       - Update entity
DELETE /v1/{resource}/:id       - Delete entity (soft)
POST   /v1/{resource}/:id/action - Custom actions
```

### Request/Response Patterns

**Pagination:**
```typescript
{
  results: Array<T>,
  page: number,
  limit: number,
  totalPages: number,
  totalResults: number
}
```

**Error Response:**
```typescript
{
  code: number,      // HTTP status code
  message: string    // Error description
}
```

**Success Response:**
```typescript
// Single entity
{ id, code, name, ... }

// Paginated list
{ results: [...], page, limit, totalPages, totalResults }
```

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field
- `sortType` - 'asc' | 'desc'
- Domain-specific filters (status, date ranges, etc.)

## Security Architecture

### Authentication Flow

```
1. Login → POST /v1/auth/login {email, password}
   ↓
2. Verify credentials (bcrypt compare)
   ↓
3. Generate JWT tokens (access + refresh)
   ↓
4. Return tokens + employee data
   ↓
5. Subsequent requests: Authorization: Bearer <token>
   ↓
6. Passport JWT strategy validates token
   ↓
7. Attach employee to req.user
```

### Authorization (RBAC)

```typescript
// Permission check middleware
auth('permission.key')
  ↓
1. Verify JWT token (authentication)
  ↓
2. Load employee's UserGroup
  ↓
3. Check group has permission for SystemFunction
  ↓
4. Allow/Deny access
```

**Permission Levels:**
- System-wide functions defined in `SystemFunction`
- Groups assigned permissions via `Permission` table
- Employees assigned to `UserGroup`
- Fine-grained control per API endpoint

### Security Measures

| Layer | Implementation |
|-------|---------------|
| **Transport** | HTTPS (production), CORS configured |
| **Headers** | Helmet security headers |
| **Input** | Joi validation, XSS sanitization |
| **Authentication** | JWT with secret key, token expiration |
| **Password** | bcrypt hashing (salt rounds) |
| **Rate Limiting** | Auth endpoints protected in production |
| **SQL Injection** | Prisma parameterized queries |
| **Secrets** | Environment variables (.env) |

## Business Domains

### 1. Reservation Management
- **Room Type Booking**: Reservations specify room type, not specific room
- **Multi-room Support**: ReservationDetail for multiple room types
- **Deposit Tracking**: Required vs paid amounts
- **Status Flow**: Pending → Confirmed → Checked In → Checked Out / Cancelled / No Show

### 2. Stay Management
- **Check-in Process**: Assign specific rooms to reservation
- **Walk-in Support**: Create StayRecord without reservation
- **Room Moves**: Track room changes with RoomMoveLog
- **Guest Registry**: GuestInResidence for regulatory compliance

### 3. Financial System (Folio Architecture)

**Three Folio Types:**

| Type | Purpose | Required Links | Use Case |
|------|---------|----------------|----------|
| **GUEST** | Per-room charges | stayRecordId + stayDetailId | Individual room billing |
| **MASTER** | Consolidated stay | stayRecordId only | Final invoice for entire stay |
| **NON_RESIDENT** | Walk-in services | billToCustomerId only | Spa, F&B without stay |

**Transaction Categories:**
- `ROOM_CHARGE` - Nightly room fees
- `SERVICE_CHARGE` - Billable services (spa, laundry, etc.)
- `SURCHARGE` - Extra person fees, early check-in, etc.
- `PENALTY` - Damage, late checkout, policy violations
- `DEPOSIT` - Advance payments
- `PAYMENT` - Cash/card payments
- `REFUND` - Payment reversals
- `ADJUSTMENT` - Manual corrections
- `DISCOUNT` - Promotions, loyalty discounts

### 4. Pricing Engine
- **Base Rate**: RoomType.rackRate
- **Rate Policies**: Date-based multipliers (weekday, weekend, holiday, high season)
- **Extra Person Fees**: RoomType.extraPersonFee
- **Customer Tier Discounts**: Loyalty-based percentage off
- **Promotions**: Voucher codes, date-range campaigns
- **Dynamic Calculation**: Service layer computes final rates

### 5. Housekeeping Operations
- **Task Assignment**: Assign rooms to housekeeping staff
- **Priority System**: Checkout rooms = high priority
- **Inspection Workflow**: Supervisor approval after completion
- **Status Tracking**: Pending → Assigned → In Progress → Completed → Inspecting → Passed/Failed

### 6. Nightly Automation
- **Room Charge Posting**: Automated at midnight for all occupied rooms
- **Duplicate Prevention**: Check for existing charges per date
- **Daily Snapshot**: Aggregate occupancy, revenue, and operational metrics
- **Metrics Calculation**: Occupancy rate, ADR, RevPAR

### 7. Reporting & Analytics
- **Daily Snapshots**: Historical data warehouse
- **Occupancy Metrics**: Available, occupied, reserved, out-of-order rooms
- **Revenue Breakdown**: Room, service, surcharge, penalty revenue
- **Guest Metrics**: Total guests, check-ins, check-outs, no-shows
- **Performance KPIs**: ADR (Average Daily Rate), RevPAR (Revenue Per Available Room)

## Data Flow

### Example: Check-in Process

```
1. Find Reservation
   reservationService.getReservationById()
   ↓
2. Validate Reservation Status
   Must be CONFIRMED or PENDING
   ↓
3. Check Room Availability
   roomService.getAvailableRooms() by room type
   ↓
4. Create StayRecord
   stayRecordService.checkInReservation()
   ↓
5. Create StayDetail (per room)
   Assign specific room numbers
   ↓
6. Update Room Status
   AVAILABLE → OCCUPIED
   ↓
7. Create GUEST Folio (per StayDetail)
   folioService.createGuestFolio()
   ↓
8. Create MASTER Folio (per StayRecord)
   Consolidated billing folio
   ↓
9. Update Reservation Status
   CONFIRMED → CHECKED_IN
   ↓
10. Return StayRecord with details
```

### Example: Nightly Room Charge Posting

```
1. Scheduled Job (Midnight)
   nightlyService.postNightlyRoomCharges()
   ↓
2. Find All Occupied StayDetails
   status = OCCUPIED
   ↓
3. For Each StayDetail:
   ├─ Get MASTER Folio (stayRecordId)
   ├─ Check for existing charge today
   ├─ Calculate room rate (locked rate or current policy)
   ├─ Get room charge service
   ├─ Create FolioTransaction (DEBIT, ROOM_CHARGE)
   └─ Update Folio totals (totalCharges, balance)
   ↓
4. Generate Daily Snapshot
   reportService.generateDailySnapshot()
   ↓
5. Update Room Statuses
   Handle expected checkouts, auto-extend stays
```

## Deployment Architecture

### Development Environment

```
┌──────────────────────────────────────────────┐
│  Developer Machine                           │
│  ┌────────────────────────────────────────┐ │
│  │  nodemon (hot reload)                  │ │
│  │  TypeScript compiler (watch mode)      │ │
│  │  src/ → runtime execution              │ │
│  └────────────────────────────────────────┘ │
│                    ↓                         │
│  ┌────────────────────────────────────────┐ │
│  │  Docker Compose (Dev)                  │ │
│  │  ├─ PostgreSQL container               │ │
│  │  └─ Prisma migrations                  │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

Commands:
- yarn dev (nodemon)
- yarn docker:dev-db:start
- yarn db:push (Prisma schema sync)
```

### Test Environment

```
┌──────────────────────────────────────────────┐
│  CI/CD Pipeline or Local Test                │
│  ┌────────────────────────────────────────┐ │
│  │  Jest Test Runner                      │ │
│  │  ├─ Unit tests                         │ │
│  │  ├─ Integration tests                  │ │
│  │  └─ Coverage reports                   │ │
│  └────────────────────────────────────────┘ │
│                    ↓                         │
│  ┌────────────────────────────────────────┐ │
│  │  Docker Compose (Test DB Only)         │ │
│  │  PostgreSQL (isolated test database)   │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

Commands:
- yarn test (auto Docker setup + teardown)
- yarn test:watch
- yarn coverage
```

### Production Environment

```
┌──────────────────────────────────────────────┐
│  Production Server                           │
│  ┌────────────────────────────────────────┐ │
│  │  PM2 Process Manager                   │ │
│  │  ├─ Cluster mode (multi-core)          │ │
│  │  ├─ Auto-restart on crash              │ │
│  │  ├─ Log management                     │ │
│  │  └─ Zero-downtime reload               │ │
│  │                                         │ │
│  │  ecosystem.config.json                 │ │
│  └────────────────────────────────────────┘ │
│                    ↓                         │
│  ┌────────────────────────────────────────┐ │
│  │  Compiled JavaScript (build/)          │ │
│  │  TypeScript → CommonJS                 │ │
│  └────────────────────────────────────────┘ │
│                    ↓                         │
│  ┌────────────────────────────────────────┐ │
│  │  Docker Compose (Production)           │ │
│  │  ├─ App container(s)                   │ │
│  │  └─ PostgreSQL container               │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

Commands:
- yarn build (TypeScript compilation)
- yarn start (PM2 production mode)
- yarn docker:prod
```

### Database Migration Strategy

```
Development:
prisma db push (schema sync for rapid iteration)
  ↓
Generate Migration:
prisma migrate dev --name migration_name
  ↓
Production:
prisma migrate deploy (apply migrations)
```

**Migration Files**: `prisma/migrations/`
- Versioned SQL migrations
- Automatic rollback support
- Schema evolution tracking

## Key Design Decisions

### 1. Why Prisma Over Raw SQL?
- **Type Safety**: Auto-generated TypeScript types from schema
- **Developer Experience**: IntelliSense, compile-time checks
- **Migration Management**: Declarative schema with version control
- **Performance**: Optimized query generation, connection pooling
- **Maintainability**: Single source of truth (schema.prisma)

### 2. Why Separate Service Layer?
- **Business Logic Isolation**: Controllers remain thin
- **Testability**: Service functions easily unit tested
- **Reusability**: Services called from multiple controllers/jobs
- **Transaction Management**: Complex multi-step operations
- **Code Organization**: Clear separation of concerns

### 3. Why Three Folio Types?
- **GUEST Folio**: Granular per-room tracking for split billing
- **MASTER Folio**: Consolidated view for final checkout
- **NON_RESIDENT Folio**: Support walk-in services without stay complexity

This design supports:
- Room moves (new GUEST folio per room)
- Split billing (multiple GUEST folios, one MASTER)
- Non-resident services (spa, restaurant)

### 4. Why Nightly Batch Processing?
- **Consistent Timing**: Charges posted at midnight
- **Automated Revenue Recognition**: No manual room charge entry
- **Duplicate Prevention**: Business rule enforcement
- **Daily Snapshot**: Historical data for analytics
- **Scalability**: Batch operation vs real-time for all rooms

### 5. Why JWT Over Sessions?
- **Stateless**: No server-side session storage
- **Scalability**: Easy horizontal scaling
- **Mobile-Friendly**: Token-based auth for mobile apps
- **Microservice-Ready**: Self-contained authentication

### 6. Why Joi for Validation?
- **Schema-First**: Declarative validation rules
- **Rich Validation**: Complex rules (email, dates, custom)
- **Error Messages**: Detailed validation feedback
- **TypeScript Integration**: Type inference from schemas

### 7. Code Generation Strategy
- **Daily Sequential Codes**: FLO241211-0001, TXN241211-0001
- **Prevents Collisions**: Race condition handling
- **Human-Readable**: Easy reference for staff
- **Audit Trail**: Chronological ordering

### 8. Soft Delete via Status
- **Data Retention**: Cancelled/void records preserved
- **Audit Trail**: Complete history for compliance
- **Reversibility**: Can "uncancel" if needed
- **Reporting**: Include/exclude based on status

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexes on foreign keys, dates, status fields
- **Pagination**: Limit query results, cursor-based for large datasets
- **Select Specific Fields**: Prisma `select` to reduce payload
- **Connection Pooling**: Prisma manages connection pool
- **Transaction Optimization**: Batch operations where possible

### Caching Strategy (Future Enhancement)
- Redis for frequently accessed data (room types, rate policies)
- Cache invalidation on updates
- Session storage in Redis vs JWT

### Monitoring & Logging
- **Winston**: Structured logging with levels
- **Morgan**: HTTP request logging
- **PM2**: Process monitoring, CPU/memory metrics
- **Error Tracking**: Centralized error handler with stack traces

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: JWT enables multi-instance deployment
- **Load Balancer**: Distribute traffic across instances
- **Database Connection Pool**: Shared pool across instances

### Vertical Scaling
- **PM2 Cluster Mode**: Utilize all CPU cores
- **Database Optimization**: Indexing, query optimization

### Future Enhancements
- **Microservices**: Split by domain (reservations, finance, housekeeping)
- **Event-Driven**: Message queue for async operations (email, notifications)
- **CQRS**: Separate read/write models for reporting
- **Multi-Tenancy**: Support multiple hotel properties

## Conclusion

RoomMaster backend is a well-architected, production-ready PMS system with:
- **Clear separation of concerns** (layered architecture)
- **Type-safe development** (TypeScript + Prisma)
- **Comprehensive business logic** (hotel operations domain)
- **Security best practices** (JWT, RBAC, validation, sanitization)
- **Scalable foundation** (stateless, Docker, PM2)
- **Maintainable codebase** (consistent patterns, documentation)

The architecture supports the complex requirements of hotel management while maintaining code quality, testability, and extensibility for future growth.
