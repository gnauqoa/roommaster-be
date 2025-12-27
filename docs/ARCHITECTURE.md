# RoomMaster Backend - Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Request Lifecycle](#request-lifecycle)
- [Dependency Injection System](#dependency-injection-system)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [PlantUML Diagrams](#plantuml-diagrams)

---

## Overview

RoomMaster Backend is a RESTful API server for a hotel/room management system built with **Node.js**, **TypeScript**, **Express**, and **Prisma ORM**. The application follows a **layered architecture** with a custom **Dependency Injection (DI)** container inspired by NestJS patterns.

### Key Features

- Multi-tenant authentication (Customer & Employee)
- Room booking with automatic allocation
- Check-in/Check-out management
- Financial transactions & deposits
- Service usage tracking
- Booking history audit trail

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | Passport.js + JWT |
| Validation | Joi |
| Documentation | Swagger (OpenAPI) |
| Logging | Winston + Morgan |
| Process Manager | PM2 |
| Containerization | Docker |

---

## Architecture Layers

The application follows a **4-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES LAYER                           │
│  (Route definitions, Swagger docs, Middleware binding)      │
├─────────────────────────────────────────────────────────────┤
│                   MIDDLEWARE LAYER                          │
│  (Auth, Validation, Rate Limiting, Error Handling, XSS)     │
├─────────────────────────────────────────────────────────────┤
│                   CONTROLLER LAYER                          │
│  (Request handling, Response formatting)                    │
├─────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                            │
│  (Business logic, Database operations via Prisma)           │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                               │
│  (Prisma ORM, PostgreSQL)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| **Routes** | `src/routes/` | Define API endpoints, attach middlewares, Swagger documentation |
| **Middleware** | `src/middlewares/` | Cross-cutting concerns: auth, validation, error handling |
| **Controller** | `src/controllers/` | Handle HTTP requests, delegate to services, format responses |
| **Service** | `src/services/` | Business logic, database operations, domain rules |
| **Data** | `prisma/` | Schema definition, migrations, Prisma Client |

---

## Request Lifecycle

A typical request flows through the following stages:

1. **Express receives request** → `src/app.ts`
2. **Global middlewares** → helmet, cors, body parsing, morgan
3. **Route matching** → `src/routes/v1/`
4. **Route-specific middlewares** → auth, validate
5. **Controller method** → `src/controllers/`
6. **Service method** → `src/services/`
7. **Prisma query** → Database
8. **Response formatting** → `responseWrapper`
9. **Error handling** → `errorConverter` + `errorHandler`

---

## Dependency Injection System

### Overview

The application uses a **custom DI container** (`src/core/container.ts`) that provides NestJS-like dependency injection for Express applications.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| Container | `src/core/container.ts` | Singleton container managing providers & instances |
| Decorators | `src/core/decorators.ts` | `@Injectable()` and `@Inject()` markers |
| Bootstrap | `src/core/bootstrap.ts` | Registers all services at application startup |
| Tokens | `src/core/container.ts` | Type-safe symbols for dependency resolution |

### Registration Types

```typescript
// Value provider (e.g., PrismaClient instance)
container.registerValue(TOKENS.PrismaClient, prisma);

// Factory provider (services with dependencies)
container.registerFactory(
  TOKENS.AuthService,
  (...args) => new AuthService(args[0], args[1], args[2], args[3]),
  [TOKENS.PrismaClient, TOKENS.TokenService, TOKENS.CustomerService, TOKENS.EmployeeService]
);
```

### Resolution

```typescript
// In routes, manually resolve dependencies
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const controller = new SomeController(authService);
```

### Service Dependency Graph

```
PrismaClient
    ├── TokenService
    ├── CustomerService
    ├── EmployeeService
    ├── BookingService
    ├── RoomService
    ├── RoomTypeService
    ├── ServiceService
    └── AuthService
            ├── TokenService
            ├── CustomerService
            └── EmployeeService
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
{
  sub: string;          // User ID (customer or employee)
  userType: 'customer' | 'employee';
  type: 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';
  iat: number;          // Issued at
  exp: number;          // Expiration
}
```

### Authentication Flow

1. **Login** → Validate credentials → Generate access + refresh tokens
2. **Protected routes** → Extract JWT from `Authorization: Bearer <token>`
3. **Passport verification** → Validate token, identify userType
4. **Middleware check** → Verify userType matches route requirement
5. **Attach user** → `req.customer` or `req.employee`

### Two-Type Authentication

| User Type | Routes Prefix | Middleware | Request Property |
|-----------|---------------|------------|------------------|
| Customer | `/v1/customer/` | `authCustomer()` | `req.customer` |
| Employee | `/v1/employee/` | `authEmployee()` | `req.employee` |

---

## Database Schema

### Entity Relationship Summary

| Entity | Description | Key Relations |
|--------|-------------|---------------|
| **Employee** | Staff members (Admin, Receptionist, Housekeeping) | → Transactions, BookingHistory |
| **Customer** | Hotel guests | → Bookings, BookingCustomers |
| **RoomType** | Room categories with pricing | → Rooms, BookingRooms |
| **Room** | Physical rooms | → BookingRooms |
| **Booking** | Reservation record | → BookingRooms, Transactions, ServiceUsages |
| **BookingRoom** | Room allocation within booking | → Transactions, ServiceUsages |
| **BookingCustomer** | Guest assignment to booking/room | M:N Customer ↔ Booking |
| **Transaction** | Payment record | → TransactionDetails |
| **Service** | Hotel services (spa, laundry, etc.) | → ServiceUsages |
| **ServiceUsage** | Service consumption record | → TransactionDetails |
| **BookingHistory** | Audit log | → Booking, Employee |

### Key Enums

```prisma
enum BookingStatus {
  PENDING, CONFIRMED, CHECKED_IN, 
  PARTIALLY_CHECKED_OUT, CHECKED_OUT, CANCELLED
}

enum RoomStatus {
  AVAILABLE, RESERVED, OCCUPIED, 
  CLEANING, MAINTENANCE, OUT_OF_SERVICE
}

enum TransactionType {
  DEPOSIT, ROOM_CHARGE, SERVICE_CHARGE, REFUND, ADJUSTMENT
}
```

---

## Error Handling

### Error Flow

```
Controller throws ApiError
        ↓
errorConverter middleware
  (Convert to ApiError if not already)
        ↓
errorHandler middleware
  (Format response, log in dev, hide stack in prod)
        ↓
JSON response: { code, message, [stack] }
```

### ApiError Class

```typescript
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;  // true = expected error, false = programming error
}
```

---

## PlantUML Diagrams

### 1. High-Level Architecture

```plantuml
@startuml High-Level Architecture
!define RECTANGLE class

skinparam backgroundColor #FEFEFE
skinparam componentStyle rectangle

package "Client Applications" {
  [Web App] as WebApp
  [Mobile App] as MobileApp
}

package "RoomMaster Backend" {
  package "API Layer" {
    [Express Server] as Express
    [Routes v1] as Routes
    [Swagger Docs] as Swagger
  }
  
  package "Middleware Layer" {
    [Auth Middleware] as AuthMW
    [Validation] as ValidateMW
    [Error Handler] as ErrorMW
    [Rate Limiter] as RateMW
  }
  
  package "Business Layer" {
    [Controllers] as Controllers
    [Services] as Services
  }
  
  package "Core" {
    [DI Container] as DI
    [Bootstrap] as Bootstrap
  }
  
  package "Data Layer" {
    [Prisma ORM] as Prisma
  }
}

database "PostgreSQL" as DB

WebApp --> Express : HTTP/REST
MobileApp --> Express : HTTP/REST

Express --> Swagger
Express --> Routes
Routes --> AuthMW
Routes --> ValidateMW
Routes --> RateMW
AuthMW --> Controllers
ValidateMW --> Controllers
Controllers --> Services
Services --> Prisma
Prisma --> DB
Controllers --> ErrorMW
Bootstrap --> DI
DI --> Services

@enduml
```

### 2. Request Lifecycle Sequence

```plantuml
@startuml Request Lifecycle
!theme plain

actor Client
participant "Express\nApp" as App
participant "Router" as Router
participant "Auth\nMiddleware" as Auth
participant "Validate\nMiddleware" as Validate
participant "Controller" as Controller
participant "Service" as Service
participant "Prisma" as Prisma
database "PostgreSQL" as DB
participant "Error\nHandler" as Error

Client -> App: HTTP Request
activate App

App -> App: Global Middlewares\n(helmet, cors, json, morgan)

App -> Router: Route Matching
activate Router

Router -> Auth: authCustomer() / authEmployee()
activate Auth

Auth -> Auth: Extract JWT from Bearer token
Auth -> Auth: Verify token signature
Auth -> Prisma: Find user by ID
Prisma -> DB: SELECT query
DB --> Prisma: User data
Auth -> Auth: Attach req.customer/req.employee
Auth --> Router: next()
deactivate Auth

Router -> Validate: validate(schema)
activate Validate
Validate -> Validate: Joi validation
alt Validation Failed
  Validate -> Error: ApiError(400)
  Error --> Client: { code: 400, message: "..." }
else Validation Passed
  Validate --> Router: next()
end
deactivate Validate

Router -> Controller: Handler method
activate Controller

Controller -> Service: Business method
activate Service

Service -> Prisma: Database operation
activate Prisma
Prisma -> DB: SQL Query
DB --> Prisma: Result
Prisma --> Service: Data
deactivate Prisma

Service --> Controller: Processed data
deactivate Service

Controller -> Controller: sendData(res, data)
Controller --> Client: { success: true, data: {...} }
deactivate Controller

deactivate Router
deactivate App

@enduml
```

### 3. Dependency Injection Container

```plantuml
@startuml Dependency Injection
!theme plain

package "DI Container" {
  class Container {
    -providers: Map<Symbol, Provider>
    -instances: Map<Symbol, Object>
    +register(definition)
    +registerClass(token, class)
    +registerValue(token, value)
    +registerFactory(token, factory, inject[])
    +resolve<T>(token): T
    +has(token): boolean
    +clearInstances()
    +reset()
  }
  
  class TOKENS <<enumeration>> {
    PrismaClient
    AuthService
    TokenService
    EmployeeService
    CustomerService
    BookingService
    RoomTypeService
    RoomService
    ServiceService
  }
}

package "Bootstrap" {
  class bootstrap <<function>> {
    Registers all services
  }
}

package "Services" {
  class TokenService {
    -prisma: PrismaClient
  }
  
  class CustomerService {
    -prisma: PrismaClient
  }
  
  class EmployeeService {
    -prisma: PrismaClient
  }
  
  class AuthService {
    -prisma: PrismaClient
    -tokenService: TokenService
    -customerService: CustomerService
    -employeeService: EmployeeService
  }
  
  class BookingService {
    -prisma: PrismaClient
  }
  
  class RoomService {
    -prisma: PrismaClient
  }
  
  class RoomTypeService {
    -prisma: PrismaClient
  }
  
  class ServiceService {
    -prisma: PrismaClient
  }
}

package "External" {
  class PrismaClient
}

bootstrap --> Container : registers
Container --> TOKENS : uses
Container --> Services : creates & caches
PrismaClient <-- TokenService
PrismaClient <-- CustomerService
PrismaClient <-- EmployeeService
PrismaClient <-- BookingService
PrismaClient <-- RoomService
PrismaClient <-- RoomTypeService
PrismaClient <-- ServiceService
PrismaClient <-- AuthService
TokenService <-- AuthService
CustomerService <-- AuthService
EmployeeService <-- AuthService

@enduml
```

### 4. Database Entity Relationship Diagram

```plantuml
@startuml Database ERD
!theme plain
skinparam linetype ortho

entity "Employee" as employee {
  *id : string <<PK>>
  --
  name : string
  username : string <<unique>>
  password : string
  role : string
  updatedAt : datetime
}

entity "Customer" as customer {
  *id : string <<PK>>
  --
  fullName : string
  email : string?
  phone : string <<unique>>
  idNumber : string?
  address : text?
  password : string
  createdAt : datetime
  updatedAt : datetime
}

entity "RoomType" as roomtype {
  *id : string <<PK>>
  --
  name : string
  capacity : int
  pricePerNight : decimal
  amenities : json?
  createdAt : datetime
  updatedAt : datetime
}

entity "Room" as room {
  *id : string <<PK>>
  --
  roomNumber : string <<unique>>
  floor : int
  status : RoomStatus
  *roomTypeId : string <<FK>>
  createdAt : datetime
  updatedAt : datetime
}

entity "Booking" as booking {
  *id : string <<PK>>
  --
  bookingCode : string <<unique>>
  status : BookingStatus
  *primaryCustomerId : string <<FK>>
  checkInDate : datetime
  checkOutDate : datetime
  totalGuests : int
  totalAmount : decimal
  depositRequired : decimal
  totalDeposit : decimal
  totalPaid : decimal
  balance : decimal
  createdAt : datetime
  updatedAt : datetime
}

entity "BookingRoom" as bookingroom {
  *id : string <<PK>>
  --
  *bookingId : string <<FK>>
  *roomId : string <<FK>>
  *roomTypeId : string <<FK>>
  checkInDate : datetime
  checkOutDate : datetime
  actualCheckIn : datetime?
  actualCheckOut : datetime?
  pricePerNight : decimal
  depositAmount : decimal
  subtotalRoom : decimal
  subtotalService : decimal
  totalAmount : decimal
  totalPaid : decimal
  balance : decimal
  status : BookingStatus
  createdAt : datetime
  updatedAt : datetime
}

entity "BookingCustomer" as bookingcustomer {
  *id : string <<PK>>
  --
  *bookingId : string <<FK>>
  *customerId : string <<FK>>
  bookingRoomId : string? <<FK>>
  isPrimary : boolean
  createdAt : datetime
  updatedAt : datetime
}

entity "Transaction" as transaction {
  *id : string <<PK>>
  --
  *bookingId : string <<FK>>
  bookingRoomId : string? <<FK>>
  type : TransactionType
  amount : decimal
  method : PaymentMethod
  status : TransactionStatus
  processedById : string? <<FK>>
  transactionRef : string?
  occurredAt : datetime
  description : string?
  createdAt : datetime
  updatedAt : datetime
}

entity "TransactionDetail" as transactiondetail {
  *id : string <<PK>>
  --
  *transactionId : string <<FK>>
  amount : decimal
  bookingRoomId : string? <<FK>>
  serviceUsageId : string? <<FK>>
  createdAt : datetime
}

entity "Service" as service {
  *id : string <<PK>>
  --
  name : string
  price : decimal
  unit : string
  isActive : boolean
  createdAt : datetime
  updatedAt : datetime
}

entity "ServiceUsage" as serviceusage {
  *id : string <<PK>>
  --
  *bookingId : string <<FK>>
  bookingRoomId : string? <<FK>>
  *serviceId : string <<FK>>
  quantity : int
  unitPrice : decimal
  totalPrice : decimal
  createdAt : datetime
  updatedAt : datetime
}

entity "BookingHistory" as bookinghistory {
  *id : int <<PK>>
  --
  *bookingId : string <<FK>>
  employeeId : string? <<FK>>
  action : string
  changes : json?
  reason : string?
  createdAt : datetime
}

' Relationships
roomtype ||--o{ room : contains
customer ||--o{ booking : makes
booking ||--o{ bookingroom : includes
room ||--o{ bookingroom : allocated_to
roomtype ||--o{ bookingroom : type_ref
booking ||--o{ bookingcustomer : guests
customer ||--o{ bookingcustomer : participates
bookingroom ||--o{ bookingcustomer : assigned_to
booking ||--o{ transaction : payments
bookingroom ||--o{ transaction : room_payments
employee ||--o{ transaction : processes
transaction ||--o{ transactiondetail : details
bookingroom ||--o{ transactiondetail : room_detail
serviceusage ||--o{ transactiondetail : service_detail
service ||--o{ serviceusage : used
booking ||--o{ serviceusage : consumes
bookingroom ||--o{ serviceusage : room_service
booking ||--o{ bookinghistory : history
employee ||--o{ bookinghistory : records

@enduml
```

### 5. Authentication Flow

```plantuml
@startuml Authentication Flow
!theme plain

title Customer/Employee Authentication Flow

|Client|
start
:Send login request\nPOST /v1/customer/auth/login\n{phone, password};

|Auth Controller|
:Receive request;
:Call authService.loginCustomerWithPhoneAndPassword();

|Auth Service|
:Find customer by phone;
if (Customer exists?) then (yes)
  :Compare password with bcrypt;
  if (Password matches?) then (yes)
    :Call tokenService.generateAuthTokens();
    |Token Service|
    :Generate Access Token (30 min);
    :Generate Refresh Token (30 days);
    :Save refresh token in DB;
    :Return tokens;
    |Auth Service|
    :Return {customer, tokens};
  else (no)
    :Throw ApiError(401);
    stop
  endif
else (no)
  :Throw ApiError(401);
  stop
endif

|Auth Controller|
:Exclude password from response;
:sendData(res, {customer, tokens});

|Client|
:Store tokens;
:Use Access Token for subsequent requests;

partition "Protected Request" {
  |Client|
  :Send request with\nAuthorization: Bearer <accessToken>;
  
  |Auth Middleware|
  :Extract token from header;
  :Passport JWT verification;
  
  |Passport Strategy|
  :Verify token signature;
  :Check token type === 'ACCESS';
  :Check userType (customer/employee);
  :Fetch user from database;
  
  if (Valid?) then (yes)
    :Attach user to request;
    :next();
  else (no)
    :Throw ApiError(401);
    stop
  endif
}

stop

@enduml
```

### 6. Booking Flow State Machine

```plantuml
@startuml Booking State Machine
!theme plain

title Booking Status State Machine

[*] --> PENDING : Customer creates booking

PENDING --> CONFIRMED : Employee confirms\n(deposit paid)
PENDING --> CANCELLED : Customer/Employee\ncancels

CONFIRMED --> CHECKED_IN : First room checks in
CONFIRMED --> CANCELLED : Cancel before check-in

CHECKED_IN --> PARTIALLY_CHECKED_OUT : Some rooms check out
CHECKED_IN --> CHECKED_OUT : All rooms check out

PARTIALLY_CHECKED_OUT --> CHECKED_OUT : Remaining rooms\ncheck out

CHECKED_OUT --> [*]
CANCELLED --> [*]

note right of PENDING
  Initial state when
  booking is created
end note

note right of CHECKED_IN
  At least one room
  has actual check-in time
end note

note bottom of PARTIALLY_CHECKED_OUT
  Some rooms checked out
  but not all
end note

@enduml
```

### 7. Room Status State Machine

```plantuml
@startuml Room Status State Machine
!theme plain

title Room Status State Machine

[*] --> AVAILABLE : Initial state

AVAILABLE --> RESERVED : Booking confirmed
RESERVED --> OCCUPIED : Guest checks in
RESERVED --> AVAILABLE : Booking cancelled

OCCUPIED --> CLEANING : Guest checks out
CLEANING --> AVAILABLE : Cleaning completed
CLEANING --> MAINTENANCE : Issues found

MAINTENANCE --> AVAILABLE : Maintenance done
MAINTENANCE --> OUT_OF_SERVICE : Major repairs needed

OUT_OF_SERVICE --> MAINTENANCE : Start repairs
OUT_OF_SERVICE --> AVAILABLE : Resolved

note right of RESERVED
  Room allocated to
  confirmed booking
end note

note right of OCCUPIED
  Guest currently
  staying
end note

@enduml
```

### 8. Component Architecture

```plantuml
@startuml Component Architecture
!theme plain

package "Entry Point" {
  [index.ts] as Index
  [app.ts] as App
  [prisma.ts] as PrismaInstance
}

package "Configuration" {
  [env.ts] as Env
  [passport.ts] as PassportConfig
  [logger.ts] as Logger
  [morgan.ts] as Morgan
  [swagger.ts] as SwaggerConfig
}

package "Core" {
  [container.ts] as Container
  [bootstrap.ts] as Bootstrap
  [decorators.ts] as Decorators
}

package "Routes" {
  [routes/v1/index.ts] as MainRouter
  package "Customer Routes" {
    [auth.route.ts] as CustAuth
    [booking.route.ts] as CustBooking
  }
  package "Employee Routes" {
    [auth.route.ts] as EmpAuth
    [booking.route.ts] as EmpBooking
    [room.route.ts] as EmpRoom
  }
}

package "Middlewares" {
  [auth.ts] as AuthMW
  [validate.ts] as ValidateMW
  [error.ts] as ErrorMW
  [rateLimiter.ts] as RateLimiterMW
  [xss.ts] as XssMW
}

package "Controllers" {
  [CustomerController] as CustCtrl
  [CustomerBookingController] as CustBookCtrl
  [EmployeeController] as EmpCtrl
  [EmployeeBookingController] as EmpBookCtrl
}

package "Services" {
  [AuthService] as AuthSvc
  [TokenService] as TokenSvc
  [CustomerService] as CustSvc
  [EmployeeService] as EmpSvc
  [BookingService] as BookSvc
  [RoomService] as RoomSvc
  [RoomTypeService] as RoomTypeSvc
  [ServiceService] as SvcSvc
}

package "Validations" {
  [auth.validation.ts] as AuthVal
  [booking.validation.ts] as BookVal
  [customer.validation.ts] as CustVal
}

package "Utils" {
  [ApiError.ts] as ApiError
  [catchAsync.ts] as CatchAsync
  [responseWrapper.ts] as ResponseWrapper
}

' Connections
Index --> App
Index --> PrismaInstance
App --> Bootstrap
App --> MainRouter
App --> ErrorMW
Bootstrap --> Container
Container --> Services

MainRouter --> CustAuth
MainRouter --> EmpAuth
CustAuth --> AuthMW
CustAuth --> ValidateMW
CustAuth --> CustCtrl
CustCtrl --> AuthSvc
CustCtrl --> CustSvc
AuthSvc --> TokenSvc

Services --> PrismaInstance

@enduml
```

### 9. Package/Module Dependencies

```plantuml
@startuml Package Dependencies
!theme plain

package "External Dependencies" {
  [express]
  [prisma]
  [passport]
  [passport-jwt]
  [jsonwebtoken]
  [joi]
  [bcryptjs]
  [helmet]
  [cors]
  [compression]
  [winston]
  [morgan]
  [swagger-ui-express]
  [http-status]
  [dayjs]
}

package "RoomMaster Modules" {
  [App] --> [express]
  [App] --> [helmet]
  [App] --> [cors]
  [App] --> [compression]
  
  [Auth] --> [passport]
  [Auth] --> [passport-jwt]
  [Auth] --> [jsonwebtoken]
  
  [Services] --> [prisma]
  [Services] --> [bcryptjs]
  [Services] --> [dayjs]
  
  [Validation] --> [joi]
  
  [Logging] --> [winston]
  [Logging] --> [morgan]
  
  [Docs] --> [swagger-ui-express]
  
  [ErrorHandling] --> [http-status]
}

@enduml
```

---

## File Structure Reference

```
src/
├── index.ts              # Application entry point
├── app.ts                # Express app configuration
├── prisma.ts             # Prisma client instance
│
├── config/               # Configuration modules
│   ├── env.ts            # Environment variables
│   ├── passport.ts       # JWT strategy
│   ├── logger.ts         # Winston logger
│   ├── morgan.ts         # HTTP request logging
│   ├── roles.ts          # Role definitions
│   └── swagger.ts        # Swagger configuration
│
├── core/                 # DI & bootstrapping
│   ├── container.ts      # DI container & tokens
│   ├── bootstrap.ts      # Service registration
│   ├── decorators.ts     # @Injectable, @Inject
│   └── index.ts          # Barrel export
│
├── routes/v1/            # API route definitions
│   ├── index.ts          # Main router
│   ├── customer/         # Customer-facing routes
│   └── employee/         # Employee-facing routes
│
├── middlewares/          # Express middlewares
│   ├── auth.ts           # authCustomer, authEmployee
│   ├── validate.ts       # Joi validation
│   ├── error.ts          # Error handling
│   ├── rateLimiter.ts    # Rate limiting
│   └── xss.ts            # XSS sanitization
│
├── controllers/          # Request handlers
│   ├── customer/         # Customer controllers
│   └── employee/         # Employee controllers
│
├── services/             # Business logic
│   ├── auth.service.ts
│   ├── token.service.ts
│   ├── customer.service.ts
│   ├── employee.service.ts
│   ├── booking.service.ts
│   ├── room.service.ts
│   ├── roomType.service.ts
│   └── service.service.ts
│
├── validations/          # Joi schemas
├── utils/                # Utility functions
└── types/                # TypeScript declarations
```

---

## Summary

RoomMaster Backend implements a clean, layered architecture with:

- **Custom DI Container** for decoupled, testable services
- **Dual authentication** for customers and employees
- **Comprehensive booking system** with room allocation, transactions, and history
- **RESTful API design** with Swagger documentation
- **Centralized error handling** and validation
- **Production-ready features** (logging, security headers, rate limiting)

The architecture allows for easy extension and maintenance while keeping business logic separated from HTTP concerns.
