# RoomMaster Backend - Service Interactions

This document provides a detailed analysis of how services interact with each other in the RoomMaster backend application.

---

## Table of Contents

- [Overview](#overview)
- [Service Inventory](#service-inventory)
- [Dependency Graph](#dependency-graph)
- [Service Categories](#service-categories)
- [Detailed Service Interactions](#detailed-service-interactions)
- [Data Flow Patterns](#data-flow-patterns)
- [PlantUML Diagrams](#plantuml-diagrams)

---

## Overview

The RoomMaster backend uses **11 services** organized in a layered dependency structure. Services are registered in the DI container during application bootstrap and follow these principles:

1. **Single Responsibility** - Each service handles one domain
2. **Dependency Injection** - Services receive dependencies via constructor
3. **Database Isolation** - All Prisma access goes through services
4. **Cross-Cutting Concerns** - Activity logging is injected where needed

---

## Service Inventory

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `PrismaClient` | Database access layer | None (external) |
| `TokenService` | JWT token generation/verification | PrismaClient |
| `CustomerService` | Customer CRUD operations | PrismaClient |
| `EmployeeService` | Employee CRUD operations | PrismaClient |
| `RoomTypeService` | Room type management | PrismaClient |
| `RoomService` | Room management | PrismaClient |
| `ServiceService` | Hotel services (spa, laundry) | PrismaClient |
| `ActivityService` | Activity/audit logging | PrismaClient |
| `AuthService` | Authentication orchestration | PrismaClient, TokenService, CustomerService, EmployeeService |
| `UsageServiceService` | Service usage tracking | PrismaClient, ActivityService |
| `TransactionService` | Payment processing | PrismaClient, ActivityService, UsageServiceService |
| `BookingService` | Booking lifecycle management | PrismaClient, TransactionService, ActivityService |

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │  PrismaClient   │
                    │   (Database)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ TokenService  │   │ActivityService│   │ Basic CRUD    │
│               │   │  (Logging)    │   │   Services    │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │           │ CustomerService
        │                   │           │ EmployeeService
        │                   │           │ RoomService
        │                   │           │ RoomTypeService
        │                   │           │ ServiceService
        │                   │
        │           ┌───────┴───────────────┐
        │           │                       │
        │           ▼                       ▼
        │   ┌───────────────┐       ┌───────────────┐
        │   │UsageService   │       │TransactionSvc │
        │   │   Service     │◄──────│               │
        │   └───────────────┘       └───────┬───────┘
        │                                   │
        │                           ┌───────┴───────┐
        │                           │               │
        ▼                           ▼               │
┌───────────────┐           ┌───────────────┐       │
│  AuthService  │           │BookingService │◄──────┘
│               │           │               │
└───────────────┘           └───────────────┘
        │
        ├──► CustomerService
        ├──► EmployeeService
        └──► TokenService
```

---

## Service Categories

### 1. Foundation Services (Tier 0)
Services with no dependencies except PrismaClient.

| Service | Methods | Description |
|---------|---------|-------------|
| **TokenService** | `generateToken`, `verifyToken`, `generateAuthTokens`, `generateResetPasswordToken` | Stateless JWT operations |
| **CustomerService** | `createCustomer`, `getCustomerById`, `getCustomerByPhone`, `updateCustomer`, `deleteCustomer` | Customer entity management |
| **EmployeeService** | `createEmployee`, `getEmployeeById`, `getEmployeeByUsername`, `updateEmployee`, `deleteEmployee` | Employee entity management |
| **RoomTypeService** | `createRoomType`, `getAllRoomTypes`, `getRoomTypeById`, `updateRoomType`, `deleteRoomType` | Room type catalog |
| **RoomService** | `createRoom`, `getAllRooms`, `getRoomById`, `updateRoom`, `deleteRoom` | Physical room inventory |
| **ServiceService** | `createService`, `getAllServices`, `getServiceById`, `updateService`, `deleteService` | Hotel service catalog |
| **ActivityService** | `createActivity`, `createCheckInActivity`, `createCheckOutActivity`, `createServiceUsageActivity` | Audit trail logging |

### 2. Composite Services (Tier 1)
Services that depend on Tier 0 services.

| Service | Dependencies | Description |
|---------|--------------|-------------|
| **AuthService** | TokenService, CustomerService, EmployeeService | Orchestrates login, logout, password reset |
| **UsageServiceService** | ActivityService | Tracks hotel service consumption |

### 3. Orchestration Services (Tier 2)
Services that coordinate complex business operations.

| Service | Dependencies | Description |
|---------|--------------|-------------|
| **TransactionService** | ActivityService, UsageServiceService | Handles all payment scenarios |
| **BookingService** | TransactionService, ActivityService | Manages booking lifecycle |

---

## Detailed Service Interactions

### AuthService Interactions

```
AuthService
    │
    ├─► CustomerService.getCustomerByPhone()
    │       └─► Prisma.customer.findUnique()
    │
    ├─► EmployeeService.getEmployeeByUsername()
    │       └─► Prisma.employee.findUnique()
    │
    ├─► TokenService.generateAuthTokens()
    │       ├─► generateToken(ACCESS)
    │       └─► generateToken(REFRESH)
    │
    ├─► TokenService.verifyToken()
    │       └─► jwt.verify()
    │
    └─► TokenService.generateResetPasswordToken()
            └─► Prisma.[customer|employee].findUnique()
```

**Key Operations:**
- `loginCustomerWithPhoneAndPassword()` → CustomerService → TokenService
- `loginEmployeeWithUsernameAndPassword()` → EmployeeService → TokenService
- `refreshAuth()` → TokenService.verifyToken() → TokenService.generateAuthTokens()
- `resetPassword()` → TokenService.verifyToken() → Prisma update

---

### BookingService Interactions

```
BookingService
    │
    ├─► createBooking()
    │       ├─► Prisma.roomType.findMany()
    │       ├─► Prisma.room.findMany() [available rooms]
    │       ├─► Prisma.$transaction()
    │       │       ├─► Prisma.booking.create()
    │       │       └─► Prisma.room.updateMany() [→ RESERVED]
    │       └─► Return booking with allocated rooms
    │
    ├─► checkIn()
    │       ├─► Prisma.bookingRoom.findMany()
    │       ├─► Prisma.customer.findMany() [verify guests]
    │       ├─► Prisma.$transaction()
    │       │       ├─► Prisma.bookingRoom.updateMany() [→ CHECKED_IN]
    │       │       ├─► Prisma.room.updateMany() [→ OCCUPIED]
    │       │       ├─► Prisma.bookingCustomer.upsert() [guest assignment]
    │       │       ├─► ActivityService.createCheckInActivity()
    │       │       └─► Prisma.booking.update() [status if all checked in]
    │       └─► Return updated booking rooms
    │
    └─► checkOut()
            ├─► Prisma.bookingRoom.findMany()
            ├─► Prisma.$transaction()
            │       ├─► Prisma.bookingRoom.updateMany() [→ CHECKED_OUT]
            │       ├─► Prisma.room.updateMany() [→ AVAILABLE]
            │       ├─► ActivityService.createCheckOutActivity()
            │       └─► Prisma.booking.update() [status if all checked out]
            └─► Return updated booking rooms
```

**Key Operations:**
- `createBooking()` → Room allocation with conflict detection
- `checkIn()` → ActivityService for audit logging
- `checkOut()` → ActivityService for audit logging

---

### TransactionService Interactions

```
TransactionService
    │
    ├─► createTransaction() [Router]
    │       ├─► processGuestServicePayment()
    │       ├─► processBookingServicePayment()
    │       ├─► processSplitRoomPayment()
    │       └─► processFullBookingPayment()
    │
    ├─► processFullBookingPayment()
    │       ├─► Prisma.booking.findUnique() [with rooms & services]
    │       ├─► calculateBookingTotal()
    │       ├─► Prisma.$transaction()
    │       │       ├─► Prisma.transaction.create()
    │       │       ├─► Prisma.transactionDetail.createMany() [allocations]
    │       │       ├─► Prisma.bookingRoom.update() [totalPaid, balance]
    │       │       ├─► UsageServiceService.updateServiceUsagePaid()
    │       │       ├─► Prisma.booking.update() [totals]
    │       │       └─► ActivityService.createPaymentActivity()
    │       └─► Return transaction with details
    │
    └─► processSplitRoomPayment()
            ├─► Prisma.bookingRoom.findMany()
            ├─► Prisma.$transaction()
            │       ├─► Create transaction
            │       ├─► Create details for selected rooms only
            │       └─► Update room balances
            └─► Return transaction
```

**Key Operations:**
- `processFullBookingPayment()` → UsageServiceService, ActivityService
- `processSplitRoomPayment()` → ActivityService
- All scenarios update financial balances atomically

---

### UsageServiceService Interactions

```
UsageServiceService
    │
    ├─► createServiceUsage()
    │       ├─► Validate booking/bookingRoom (if provided)
    │       ├─► Prisma.service.findUnique() [get price]
    │       ├─► Prisma.$transaction()
    │       │       ├─► Prisma.serviceUsage.create()
    │       │       ├─► Prisma.bookingRoom.update() [subtotalService]
    │       │       └─► ActivityService.createServiceUsageActivity()
    │       └─► Return service usage
    │
    ├─► updateServiceUsagePaid() [called by TransactionService]
    │       ├─► Prisma.serviceUsage.update() [paidAmount]
    │       └─► Check if fully paid
    │
    └─► cancelServiceUsage()
            ├─► Prisma.serviceUsage.update() [status → CANCELLED]
            ├─► Prisma.bookingRoom.update() [subtotalService]
            └─► ActivityService.createActivity()
```

**Key Operations:**
- `createServiceUsage()` → ActivityService
- `updateServiceUsagePaid()` → Called BY TransactionService (inverse dependency)

---

## Data Flow Patterns

### Pattern 1: Authentication Flow

```
┌────────┐     ┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Client │────►│AuthService  │────►│CustomerService  │────►│ PrismaClient │
└────────┘     │             │     │getCustomerByPhone│    │              │
               │             │     └─────────────────┘     └──────────────┘
               │             │
               │             │     ┌─────────────────┐
               │             │────►│ TokenService    │
               │             │     │generateAuthTokens│
               └─────────────┘     └─────────────────┘
```

### Pattern 2: Booking with Payment Flow

```
┌────────┐     ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Client │────►│BookingService│───►│  Prisma Client   │────►│  PostgreSQL  │
└────────┘     │createBooking │    │   (Transaction)  │     │              │
               └─────────────┘     └──────────────────┘     └──────────────┘
                     │
                     ▼
               ┌─────────────┐
               │Transaction  │
               │  Service    │
               │createTxn    │
               └──────┬──────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐
    │Activity   │ │UsageService│ │  Prisma   │
    │Service    │ │  Service   │ │  Client   │
    └───────────┘ └───────────┘ └───────────┘
```

### Pattern 3: Check-In with Activity Logging

```
┌────────┐     ┌─────────────┐
│Employee│────►│BookingService│
│ Client │     │   checkIn   │
└────────┘     └──────┬──────┘
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
┌─────────────┐ ┌───────────┐ ┌───────────┐
│ Prisma      │ │Activity   │ │ Update    │
│ Booking     │ │ Service   │ │ Room &    │
│ Customer    │ │createCheck│ │ Booking   │
│ Assignment  │ │InActivity │ │ Status    │
└─────────────┘ └───────────┘ └───────────┘
```

---

## PlantUML Diagrams

### 1. Service Dependency Diagram

```plantuml
@startuml Service Dependencies
!theme plain
skinparam linetype ortho

package "Tier 0 - Foundation" {
  [PrismaClient] as Prisma #LightBlue
  [TokenService] as Token
  [CustomerService] as Customer
  [EmployeeService] as Employee
  [RoomTypeService] as RoomType
  [RoomService] as Room
  [ServiceService] as Service
  [ActivityService] as Activity #LightGreen
}

package "Tier 1 - Composite" {
  [AuthService] as Auth
  [UsageServiceService] as Usage
}

package "Tier 2 - Orchestration" {
  [TransactionService] as Transaction
  [BookingService] as Booking
}

' Tier 0 dependencies
Token --> Prisma
Customer --> Prisma
Employee --> Prisma
RoomType --> Prisma
Room --> Prisma
Service --> Prisma
Activity --> Prisma

' Tier 1 dependencies
Auth --> Prisma
Auth --> Token
Auth --> Customer
Auth --> Employee

Usage --> Prisma
Usage --> Activity

' Tier 2 dependencies
Transaction --> Prisma
Transaction --> Activity
Transaction --> Usage

Booking --> Prisma
Booking --> Transaction
Booking --> Activity

note right of Activity
  Cross-cutting concern
  for audit logging
end note

note right of Booking
  Main orchestrator for
  hotel operations
end note

@enduml
```

### 2. Authentication Sequence Diagram

```plantuml
@startuml Authentication Flow
!theme plain

actor Client
participant "AuthService" as Auth
participant "CustomerService" as Cust
participant "TokenService" as Token
participant "PrismaClient" as Prisma
database "PostgreSQL" as DB

== Customer Login ==

Client -> Auth: loginCustomerWithPhoneAndPassword(phone, password)
activate Auth

Auth -> Cust: getCustomerByPhone(phone)
activate Cust
Cust -> Prisma: customer.findUnique({phone})
Prisma -> DB: SELECT * FROM Customer WHERE phone = ?
DB --> Prisma: customer record
Prisma --> Cust: Customer | null
Cust --> Auth: Customer
deactivate Cust

Auth -> Auth: isPasswordMatch(password, customer.password)

alt Password matches
  Auth -> Token: generateAuthTokens(customer.id, 'customer')
  activate Token
  Token -> Token: generateToken(ACCESS, 30min)
  Token -> Token: generateToken(REFRESH, 30days)
  Token --> Auth: { access: {...}, refresh: {...} }
  deactivate Token
  
  Auth --> Client: { customer, tokens }
else Password doesn't match
  Auth --> Client: ApiError(401, "Incorrect phone or password")
end

deactivate Auth

== Token Refresh ==

Client -> Auth: refreshAuth(refreshToken)
activate Auth

Auth -> Token: verifyToken(refreshToken, 'REFRESH')
activate Token
Token -> Token: jwt.verify(token, secret)
alt Valid token
  Token --> Auth: { sub: userId, userType: 'customer' }
else Invalid token
  Token --> Auth: throw ApiError(401)
end
deactivate Token

Auth -> Token: generateAuthTokens(userId, userType)
Token --> Auth: { access, refresh }

Auth --> Client: { access, refresh }
deactivate Auth

@enduml
```

### 3. Booking Creation Flow

```plantuml
@startuml Booking Creation
!theme plain

actor Customer
participant "BookingService" as Booking
participant "PrismaClient" as Prisma
database "PostgreSQL" as DB

Customer -> Booking: createBooking(rooms[], checkIn, checkOut, guests, customerId)
activate Booking

' Validate dates
Booking -> Booking: Calculate nights = checkOut - checkIn
alt nights <= 0
  Booking --> Customer: ApiError(400, "Invalid dates")
end

' Validate room types
Booking -> Prisma: roomType.findMany({ id in roomTypeIds })
Prisma -> DB: SELECT * FROM RoomType WHERE id IN (...)
DB --> Prisma: RoomType[]
Prisma --> Booking: RoomType[]

alt Some room types not found
  Booking --> Customer: ApiError(404, "Room type not found")
end

' Find available rooms
loop For each room request
  Booking -> Prisma: room.findMany({ roomTypeId, status: AVAILABLE, no overlaps })
  Prisma -> DB: Complex availability query
  DB --> Prisma: Room[]
  
  alt Not enough rooms
    Booking --> Customer: ApiError(409, "Not enough rooms")
  end
end

' Calculate totals
Booking -> Booking: Calculate totalAmount, depositRequired

' Create booking in transaction
Booking -> Prisma: $transaction()
activate Prisma

Prisma -> DB: BEGIN TRANSACTION

Prisma -> DB: INSERT INTO Booking (...)
DB --> Prisma: Booking

Prisma -> DB: INSERT INTO BookingRoom [...] (multiple)
DB --> Prisma: BookingRoom[]

Prisma -> DB: UPDATE Room SET status = 'RESERVED' WHERE id IN (...)
DB --> Prisma: Updated rooms

Prisma -> DB: COMMIT
Prisma --> Booking: Complete booking with relations
deactivate Prisma

Booking --> Customer: { bookingId, bookingCode, totalAmount, booking }
deactivate Booking

@enduml
```

### 4. Check-In Process Flow

```plantuml
@startuml Check-In Process
!theme plain

actor Receptionist
participant "BookingService" as Booking
participant "ActivityService" as Activity
participant "PrismaClient" as Prisma
database "PostgreSQL" as DB

Receptionist -> Booking: checkIn({ checkInInfo: [{bookingRoomId, customerIds}], employeeId })
activate Booking

' Verify booking rooms
Booking -> Prisma: bookingRoom.findMany({ id in bookingRoomIds })
Prisma -> DB: SELECT with room and booking relations
DB --> Prisma: BookingRoom[]
Prisma --> Booking: BookingRoom[]

alt Some rooms not found
  Booking --> Receptionist: ApiError(404)
end

alt Some rooms not CONFIRMED status
  Booking --> Receptionist: ApiError(400, "Must be CONFIRMED")
end

' Verify customers
Booking -> Prisma: customer.findMany({ id in allCustomerIds })
Prisma -> DB: SELECT * FROM Customer WHERE id IN (...)
DB --> Prisma: Customer[]

alt Some customers not found
  Booking --> Receptionist: ApiError(404, "Customer not found")
end

' Execute check-in transaction
Booking -> Prisma: $transaction()
activate Prisma

Prisma -> DB: BEGIN TRANSACTION

' Update booking rooms
Prisma -> DB: UPDATE BookingRoom SET status='CHECKED_IN', actualCheckIn=NOW()
DB --> Prisma: Updated

' Update physical rooms
Prisma -> DB: UPDATE Room SET status='OCCUPIED' WHERE id IN (...)
DB --> Prisma: Updated

' Create guest assignments
loop For each room
  Prisma -> DB: UPSERT BookingCustomer (bookingId, customerId, bookingRoomId)
  DB --> Prisma: BookingCustomer
end

' Create activity records
loop For each room
  Booking -> Activity: createCheckInActivity(bookingRoomId, employeeId, roomNumber)
  Activity -> Prisma: activity.create({ type: CHECKED_IN, ... })
  Prisma -> DB: INSERT INTO Activity
  DB --> Prisma: Activity
end

' Check if all rooms checked in → update booking status
Prisma -> DB: SELECT * FROM BookingRoom WHERE bookingId = ?
DB --> Prisma: All booking rooms

alt All rooms checked in
  Prisma -> DB: UPDATE Booking SET status='CHECKED_IN'
  DB --> Prisma: Updated
end

Prisma -> DB: COMMIT
deactivate Prisma

Booking --> Receptionist: { bookingRooms: [...] }
deactivate Booking

@enduml
```

### 5. Payment Transaction Flow

```plantuml
@startuml Payment Transaction
!theme plain

actor Cashier
participant "TransactionService" as TxnSvc
participant "UsageServiceService" as Usage
participant "ActivityService" as Activity
participant "PrismaClient" as Prisma
database "PostgreSQL" as DB

Cashier -> TxnSvc: createTransaction({ bookingId, amount, paymentMethod, ... })
activate TxnSvc

TxnSvc -> TxnSvc: Determine scenario\n(full/split/service)

alt Full Booking Payment
  
  ' Fetch booking with all items
  TxnSvc -> Prisma: booking.findUnique({ include: bookingRooms, serviceUsages })
  Prisma -> DB: Complex SELECT with joins
  DB --> Prisma: Booking with relations
  Prisma --> TxnSvc: Booking
  
  TxnSvc -> TxnSvc: calculateBookingTotal()
  
  alt Amount exceeds balance
    TxnSvc --> Cashier: ApiError(400, "Exceeds balance")
  end
  
  ' Create transaction
  TxnSvc -> Prisma: $transaction()
  activate Prisma
  
  Prisma -> DB: BEGIN
  
  ' Create main transaction record
  Prisma -> DB: INSERT INTO Transaction (bookingId, type, amount, ...)
  DB --> Prisma: Transaction
  
  ' Allocate to rooms
  TxnSvc -> TxnSvc: Proportional allocation algorithm
  
  loop For each room with balance
    Prisma -> DB: INSERT INTO TransactionDetail (transactionId, bookingRoomId, amount)
    DB --> Prisma: TransactionDetail
    
    Prisma -> DB: UPDATE BookingRoom SET totalPaid += ?, balance -= ?
    DB --> Prisma: Updated
  end
  
  ' Allocate to services
  loop For each unpaid service
    TxnSvc -> Usage: updateServiceUsagePaid(serviceId, amount)
    Usage -> Prisma: serviceUsage.update({ paidAmount })
    Prisma -> DB: UPDATE ServiceUsage
    DB --> Prisma: Updated
  end
  
  ' Update booking totals
  Prisma -> DB: UPDATE Booking SET totalPaid += ?, balance -= ?
  DB --> Prisma: Updated
  
  ' Log activity
  TxnSvc -> Activity: createPaymentActivity(...)
  Activity -> Prisma: activity.create()
  Prisma -> DB: INSERT INTO Activity
  DB --> Prisma: Activity
  
  Prisma -> DB: COMMIT
  deactivate Prisma
  
end

TxnSvc --> Cashier: { transaction, details, updatedBooking }
deactivate TxnSvc

@enduml
```

### 6. Service Usage Flow

```plantuml
@startuml Service Usage
!theme plain

actor Staff
participant "UsageServiceService" as Usage
participant "ActivityService" as Activity
participant "PrismaClient" as Prisma
database "PostgreSQL" as DB

Staff -> Usage: createServiceUsage({ bookingRoomId, serviceId, quantity, employeeId })
activate Usage

' Validate booking room
Usage -> Prisma: bookingRoom.findUnique({ id })
Prisma -> DB: SELECT * FROM BookingRoom
DB --> Prisma: BookingRoom
Prisma --> Usage: BookingRoom

alt Not found
  Usage --> Staff: ApiError(404, "Booking room not found")
end

' Get service price
Usage -> Prisma: service.findUnique({ id: serviceId })
Prisma -> DB: SELECT * FROM Service
DB --> Prisma: Service
Prisma --> Usage: Service

alt Not found
  Usage --> Staff: ApiError(404, "Service not found")
end

Usage -> Usage: Calculate totalPrice = unitPrice × quantity

' Create usage in transaction
Usage -> Prisma: $transaction()
activate Prisma

Prisma -> DB: BEGIN

' Create service usage record
Prisma -> DB: INSERT INTO ServiceUsage (bookingRoomId, serviceId, quantity, unitPrice, totalPrice)
DB --> Prisma: ServiceUsage

' Update booking room subtotal
Prisma -> DB: UPDATE BookingRoom SET subtotalService += ?, totalAmount += ?, balance += ?
DB --> Prisma: Updated BookingRoom

' Log activity
Usage -> Activity: createServiceUsageActivity(...)
Activity -> Prisma: activity.create({ type: SERVICE_ADDED, ... })
Prisma -> DB: INSERT INTO Activity
DB --> Prisma: Activity

Prisma -> DB: COMMIT
deactivate Prisma

Usage --> Staff: { serviceUsage, updatedBookingRoom }
deactivate Usage

@enduml
```

### 7. Complete Service Interaction Map

```plantuml
@startuml Complete Service Map
!theme plain
left to right direction
skinparam packageStyle rectangle

package "Controllers" {
  [CustomerController]
  [EmployeeController]
  [BookingController]
  [RoomController]
}

package "Authentication Domain" #LightYellow {
  [AuthService] as Auth
  [TokenService] as Token
}

package "User Domain" #LightGreen {
  [CustomerService] as Cust
  [EmployeeService] as Emp
}

package "Room Domain" #LightBlue {
  [RoomService] as Room
  [RoomTypeService] as RoomType
}

package "Booking Domain" #LightCoral {
  [BookingService] as Booking
  [TransactionService] as Txn
  [UsageServiceService] as Usage
}

package "Catalog Domain" #LightGray {
  [ServiceService] as Svc
}

package "Cross-Cutting" #Wheat {
  [ActivityService] as Activity
}

package "Data Layer" #LightPink {
  [PrismaClient] as Prisma
  database "PostgreSQL" as DB
}

' Controller -> Service
CustomerController --> Auth
CustomerController --> Cust
EmployeeController --> Auth
EmployeeController --> Emp
BookingController --> Booking
BookingController --> Txn
BookingController --> Usage
RoomController --> Room
RoomController --> RoomType

' Authentication Domain
Auth --> Token : generates tokens
Auth --> Cust : validates customer
Auth --> Emp : validates employee

' Booking Domain interactions
Booking --> Txn : payment processing
Booking --> Activity : check-in/out logging
Txn --> Activity : payment logging
Txn --> Usage : service payment allocation
Usage --> Activity : service logging

' All services -> Prisma
Auth --> Prisma
Token --> Prisma
Cust --> Prisma
Emp --> Prisma
Room --> Prisma
RoomType --> Prisma
Booking --> Prisma
Txn --> Prisma
Usage --> Prisma
Svc --> Prisma
Activity --> Prisma

Prisma --> DB

note bottom of Activity
  ActivityService is injected into:
  • BookingService
  • TransactionService
  • UsageServiceService
  
  Provides consistent audit trail
end note

note bottom of Booking
  BookingService orchestrates:
  • Room allocation
  • Status transitions
  • Customer assignments
  • Payment coordination
end note

@enduml
```

---

## Summary

### Key Takeaways

1. **Layered Dependencies**: Services follow a strict tier system preventing circular dependencies.

2. **ActivityService as Cross-Cutting Concern**: Injected into multiple services for consistent audit logging.

3. **Transaction Boundaries**: Complex operations use `prisma.$transaction()` for atomicity.

4. **Inverse Dependencies**: `TransactionService` calls into `UsageServiceService`, demonstrating cross-domain coordination.

5. **DI Container Registration Order**: Bootstrap registers Tier 0 first, then Tier 1, finally Tier 2 to satisfy dependencies.

### Service Interaction Patterns

| Pattern | Services Involved | Use Case |
|---------|-------------------|----------|
| **Authentication** | Auth → Token + Customer/Employee | Login, refresh, password reset |
| **Booking Lifecycle** | Booking → Activity | Create, check-in, check-out |
| **Payment Processing** | Transaction → Activity + Usage | Full, split, service payments |
| **Service Tracking** | Usage → Activity | Add/cancel services |
| **Audit Trail** | All → Activity | Consistent logging |
