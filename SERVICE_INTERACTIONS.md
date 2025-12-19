# Service Interaction Analysis - RoomMaster Backend

## Overview

This document provides a detailed analysis of how services interact with each other in the RoomMaster PMS backend. Services are the core business logic layer and have specific dependency patterns that enable complex workflows.

## Service Dependency Map

### Layer 1: Foundation Services (No Dependencies)

These services have **no dependencies on other services** - they only interact with the database through Prisma:

#### 1. **Customer Service** (`customer.service.ts`)
- **Purpose**: Customer/Guest management (CRM)
- **Database Models**: `Customer`, `CustomerTier`
- **Key Operations**: 
  - CRUD operations for customers
  - Search by name, email, phone, ID number
  - Customer tier management
- **Dependencies**: None
- **Used By**: ReservationService, StayRecordService, AuthService (indirectly)

#### 2. **Room Service** (`room.service.ts`)
- **Purpose**: Room inventory and availability management
- **Database Models**: `Room`, `RoomType`, `RatePolicy`
- **Key Operations**:
  - Room CRUD operations
  - Room type management
  - Availability checking
  - Rate calculation based on policies
- **Dependencies**: None
- **Used By**: ReservationService, StayRecordService, HousekeepingService

#### 3. **Employee Service** (`employee.service.ts`)
- **Purpose**: Staff management and authentication
- **Database Models**: `Employee`, `UserGroup`, `WorkShift`, `WorkSchedule`
- **Key Operations**:
  - Employee CRUD
  - Get employee by email (for authentication)
  - User group assignment
  - Shift scheduling
- **Dependencies**: None
- **Used By**: AuthService, TokenService, All operational services (for audit trails)

#### 4. **Service Service** (`service.service.ts`)
- **Purpose**: Billable services catalog management
- **Database Models**: `Service`, `ServiceGroup`, `PaymentMethod`
- **Key Operations**:
  - Service item CRUD
  - Service grouping (ROOM, F&B, SPA, LAUNDRY, etc.)
  - Pricing management
- **Dependencies**: None
- **Used By**: FolioService, NightlyService, InspectionService

### Layer 2: Authentication Services

#### 5. **Token Service** (`token.service.ts`)
- **Purpose**: JWT token generation and verification
- **Database Models**: `Token`
- **Key Operations**:
  - Generate access and refresh tokens
  - Verify tokens
  - Token blacklisting/revocation
  - Password reset tokens
- **Dependencies**: 
  - ✓ **EmployeeService** - to validate employee existence
- **Used By**: AuthService

#### 6. **Auth Service** (`auth.service.ts`)
- **Purpose**: Authentication and authorization
- **Database Models**: None directly (uses Token and Employee)
- **Key Operations**:
  - Login with email/password
  - Refresh token
  - Logout
  - Password reset
  - Change password
- **Dependencies**:
  - ✓ **TokenService** - for token operations
  - ✓ **EmployeeService** - for employee validation
- **Used By**: AuthController (entry point for authentication)

### Layer 3: Business Domain Services

#### 7. **Reservation Service** (`reservation.service.ts`)
- **Purpose**: Booking management
- **Database Models**: `Reservation`, `ReservationDetail`
- **Key Operations**:
  - Create reservations (by room type, not specific room)
  - Confirm/cancel reservations
  - Update reservation details
  - Query reservations with filters
  - Generate reservation codes (RES + YYMMDD + sequence)
- **Dependencies**:
  - ✓ **Indirect**: Validates `Customer` and `RoomType` via Prisma (not service calls)
- **Used By**: StayRecordService (during check-in from reservation)

#### 8. **Stay Record Service** (`stay-record.service.ts`)
- **Purpose**: Check-in/check-out operations and stay management
- **Database Models**: `StayRecord`, `StayDetail`, `GuestInResidence`, `RoomMoveLog`
- **Key Operations**:
  - Walk-in check-in (create stay without reservation)
  - Check-in from reservation (assign specific rooms)
  - Check-out process
  - Room moves/transfers
  - Guest registration
  - Generate stay codes (STY + YYMMDD + sequence)
- **Dependencies**:
  - ✓ **Indirect**: Reads `Reservation`, `Room`, `Customer` via Prisma
  - ✓ **Note**: Creates folios via Prisma directly (not through FolioService)
- **Used By**: FolioService, NightlyService, HousekeepingService

#### 9. **Folio Service** (`folio.service.ts`)
- **Purpose**: Financial accounting and transaction management
- **Database Models**: `GuestFolio`, `FolioTransaction`
- **Key Operations**:
  - Create folios (GUEST, MASTER, NON_RESIDENT types)
  - Post charges (room, service, surcharge, penalty)
  - Post payments (cash, card, transfer)
  - Post deposits
  - Post adjustments and corrections
  - Void/reverse transactions
  - Transfer between folios
  - Close folios
  - Generate codes (FLO + YYMMDD + sequence, TXN + YYMMDD + sequence)
- **Dependencies**:
  - ✓ **Indirect**: Validates `Service`, `StayRecord`, `Customer` via Prisma
  - ✓ **Note**: Self-contained for financial operations
- **Used By**: InvoiceService, InspectionService, NightlyService

#### 10. **Housekeeping Service** (`housekeeping.service.ts`)
- **Purpose**: Room cleaning and maintenance workflow
- **Database Models**: `HousekeepingLog`, `RoomStatus`
- **Key Operations**:
  - Create housekeeping tasks
  - Assign rooms to staff
  - Update cleaning status (Assigned → In Progress → Completed)
  - Inspector assignment
  - Priority management
- **Dependencies**:
  - ✓ **Indirect**: Validates `Room`, `Employee` via Prisma
- **Used By**: InspectionService

#### 11. **Inspection Service** (`inspection.service.ts`)
- **Purpose**: Room inspection after checkout/cleaning
- **Database Models**: `RoomInspection`
- **Key Operations**:
  - Create inspection records
  - Pass/fail inspections
  - Post damage penalties to folios
  - Update room status based on inspection
- **Dependencies**:
  - ✓ **Indirect**: Reads `Service` (penalty items), `GuestFolio`, `HousekeepingLog` via Prisma
  - ✓ **Note**: Posts penalties directly to folios via Prisma (not through FolioService)
- **Used By**: HousekeepingController

### Layer 4: Reporting & Batch Services

#### 12. **Nightly Service** (`nightly.service.ts`)
- **Purpose**: Automated batch processing at midnight
- **Database Models**: `FolioTransaction`, `DailySnapshot`
- **Key Operations**:
  - **Post nightly room charges** - Post room charges for all occupied rooms
  - **Post extra person charges** - Charge for guests exceeding base capacity
  - **Generate daily snapshot** - Aggregate metrics for reporting
  - **Auto-checkout** - Process expected departures
  - **Reservation reminders** - Handle upcoming arrivals
- **Dependencies**:
  - ✓ **Indirect**: Reads `StayDetail`, `GuestFolio`, `Service`, `Room`, `Reservation` via Prisma
  - ✓ **Note**: Posts charges directly to folios and creates transactions via Prisma
- **Scheduled**: Runs at midnight (00:00) via PM2/cron
- **Used By**: Scheduled job (not called by other services)

#### 13. **Report Service** (`report.service.ts`)
- **Purpose**: Analytics and business intelligence
- **Database Models**: `DailySnapshot`, All transactional models
- **Key Operations**:
  - Get daily snapshots
  - Occupancy reports (date range)
  - Revenue reports (breakdown by category)
  - Guest statistics
  - Calculate KPIs (ADR, RevPAR, Occupancy Rate)
- **Dependencies**:
  - ✓ **Indirect**: Reads all models via Prisma for aggregations
  - ✓ **Note**: Read-only operations, no service dependencies
- **Used By**: ReportController

#### 14. **Invoice Service** (`invoice.service.ts`)
- **Purpose**: Invoice generation and management
- **Database Models**: `Invoice`, `InvoiceDetail`
- **Key Operations**:
  - Create invoices from folio transactions
  - Link transactions to invoices
  - Generate invoice codes (INV + YYMMDD + sequence)
  - Query invoices
- **Dependencies**:
  - ✓ **Indirect**: Validates `GuestFolio`, `FolioTransaction`, `Customer` via Prisma
- **Used By**: InvoiceController

## Service Interaction Patterns

### Pattern 1: Direct Service-to-Service Calls

**Only 2 services use direct service imports:**

```typescript
// auth.service.ts
import tokenService from './token.service';
import employeeService from './employee.service';

const loginWithEmailAndPassword = async (email, password) => {
  const employee = await employeeService.getEmployeeByEmail(email);  // Direct call
  // ... validate password
  return tokenService.generateAuthTokens({ id: employee.id });       // Direct call
};
```

```typescript
// token.service.ts
import employeeService from './employee.service';

const verifyToken = async (token, type) => {
  // ... JWT verification
  const employee = await employeeService.getEmployeeById(employeeId); // Direct call
  return { employee, tokenData };
};
```

**Why so few direct calls?**
- Most services are **self-contained** and operate on their own domain
- Cross-domain operations are handled by **controllers orchestrating multiple services**
- This design prevents **circular dependencies** and keeps services testable

### Pattern 2: Prisma-Mediated Interactions

**Most common pattern** - Services interact with each other's data through Prisma ORM:

```typescript
// stay-record.service.ts - Check-in from reservation
const checkInFromReservation = async (reservationId, roomAssignments) => {
  // Read reservation data via Prisma (not ReservationService)
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { reservationDetails: true, customer: true }
  });
  
  // Create stay record
  const stayRecord = await prisma.stayRecord.create({ ... });
  
  // Update reservation status
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CHECKED_IN' }
  });
};
```

**Advantages:**
- **Single transaction** - All database operations in one Prisma transaction
- **Type safety** - Prisma provides TypeScript types
- **Performance** - No service layer overhead
- **Simplicity** - Direct data access

**Trade-off:**
- Business logic duplication risk (e.g., code generation logic copied in multiple services)
- Each service must understand related data models

### Pattern 3: Controller Orchestration

**Complex workflows** are orchestrated by controllers calling multiple services:

```typescript
// Example: Check-in process orchestrated by controller
const checkIn = catchAsync(async (req, res) => {
  // 1. Validate customer
  const customer = await customerService.getCustomerById(req.body.customerId);
  
  // 2. Check room availability
  const rooms = await roomService.checkAvailability(req.body.roomIds);
  
  // 3. Create stay record
  const stayRecord = await stayRecordService.checkInFromReservation(req.body);
  
  // 4. Create folios (if needed separately)
  const folios = await folioService.createFoliosForStay(stayRecord.id);
  
  // 5. Assign housekeeping
  await housekeepingService.createTasksForCheckIn(stayRecord.id);
  
  res.send({ stayRecord, folios });
});
```

**Note:** In the current implementation, most of this orchestration happens **within the StayRecordService** using Prisma transactions, not at the controller level.

## Detailed Service Interaction Flows

### Flow 1: Authentication Flow

```
Client Login Request
    ↓
AuthController
    ↓
AuthService.loginWithEmailAndPassword(email, password)
    ↓
    ├─→ EmployeeService.getEmployeeByEmail(email)
    │       ↓
    │   [Prisma: Query Employee table]
    │       ↓
    │   Return Employee
    ↓
[Verify password with bcrypt]
    ↓
TokenService.generateAuthTokens(employeeId)
    ↓
    ├─→ [Generate JWT access token]
    ├─→ [Generate JWT refresh token]
    ├─→ [Save refresh token to Token table via Prisma]
    ↓
Return { employee, tokens }
```

**Service Dependencies:**
- AuthService → EmployeeService (get employee)
- AuthService → TokenService (generate tokens)
- TokenService → EmployeeService (verify employee exists)

### Flow 2: Reservation to Check-In Flow

```
Client Create Reservation
    ↓
ReservationController
    ↓
ReservationService.createReservation(data)
    ↓
    ├─→ [Prisma: Validate Customer exists]
    ├─→ [Prisma: Validate RoomTypes exist]
    ├─→ [Generate reservation code: RES + YYMMDD + sequence]
    ├─→ [Prisma: Create Reservation + ReservationDetails]
    ↓
Return Reservation

─────────────────────────────────────────────

Client Check-In Request
    ↓
StayRecordController
    ↓
StayRecordService.checkInFromReservation(reservationId, roomAssignments)
    ↓
    ├─→ [Prisma: Load Reservation with details]
    ├─→ [Validate reservation status = CONFIRMED]
    ├─→ [Prisma: Validate Rooms are AVAILABLE]
    ├─→ [Generate stay code: STY + YYMMDD + sequence]
    ├─→ [Prisma Transaction: {
    │       Create StayRecord
    │       Create StayDetails (link rooms to reservation details)
    │       Create GuestInResidence records
    │       Update Room.status → OCCUPIED
    │       Update Reservation.status → CHECKED_IN
    │   }]
    ↓
Return StayRecord
```

**Key Observation:**
- **No direct service calls** - StayRecordService doesn't call ReservationService
- **Prisma-mediated** - Reads and updates Reservation via Prisma
- **Single transaction** - All database operations wrapped in Prisma.$transaction

### Flow 3: Nightly Room Charge Posting

```
Midnight (00:00) - PM2 Scheduled Job
    ↓
NightlyController.postRoomCharges()
    ↓
NightlyService.postNightlyRoomCharges(employeeId)
    ↓
    ├─→ [Prisma: Query all StayDetails with status=OCCUPIED]
    │       ↓
    │   For each StayDetail:
    ├─→ [Prisma: Find MASTER GuestFolio for stayRecordId]
    ├─→ [Prisma: Check if charge already posted today]
    ├─→ [Calculate room rate: lockedRate OR roomType.rackRate]
    ├─→ [Generate transaction code: TXN + YYMMDD + sequence]
    ├─→ [Prisma: Create FolioTransaction {
    │       type: DEBIT
    │       category: ROOM_CHARGE
    │       amount: roomRate
    │   }]
    ├─→ [Prisma: Update GuestFolio {
    │       totalCharges += roomRate
    │       balance += roomRate
    │   }]
    ↓
Return summary { totalProcessed, successful, failed }
```

**Key Observation:**
- **No service calls** - Operates entirely via Prisma
- **Batch processing** - Loops through all occupied rooms
- **Idempotent** - Checks for existing charges before posting
- **Direct folio manipulation** - Doesn't use FolioService

### Flow 4: Checkout with Inspection and Penalties

```
Client Checkout Request
    ↓
StayRecordController.checkout()
    ↓
StayRecordService.checkOut(stayRecordId)
    ↓
    ├─→ [Prisma: Load StayRecord with StayDetails]
    ├─→ [Prisma Transaction: {
    │       Update StayRecord.status → CHECKED_OUT
    │       Update StayDetails.status → CHECKED_OUT
    │       Update Room.status → DIRTY
    │   }]
    ↓
Return StayRecord

─────────────────────────────────────────────

Housekeeping Staff Cleans Room
    ↓
HousekeepingController.completeCleaning()
    ↓
HousekeepingService.completeCleaning(logId)
    ↓
    ├─→ [Prisma: Update HousekeepingLog {
    │       status → COMPLETED
    │       completedAt → now
    │   }]
    ├─→ [Prisma: Update Room.status → INSPECTING]
    ↓

─────────────────────────────────────────────

Inspector Checks Room
    ↓
InspectionController.createInspection()
    ↓
InspectionService.createInspection(data)
    ↓
    ├─→ [Prisma: Create RoomInspection record]
    ├─→ IF inspection FAILED with damages:
    │   ├─→ [Prisma: Query penalty Services]
    │   ├─→ [Prisma: Find StayRecord's MASTER folio]
    │   ├─→ [Generate transaction code]
    │   ├─→ [Prisma: Create FolioTransactions for penalties {
    │   │       type: DEBIT
    │   │       category: PENALTY
    │   │   }]
    │   ├─→ [Prisma: Update GuestFolio totals]
    │   ↓
    ├─→ [Prisma: Update HousekeepingLog.status → PASSED/FAILED]
    ├─→ [Prisma: Update Room.status → AVAILABLE/OUT_OF_ORDER]
    ↓
Return Inspection
```

**Key Observation:**
- **Multi-service workflow** but **no direct service calls**
- InspectionService posts penalties **directly** to folios via Prisma
- Room status flows: OCCUPIED → DIRTY → INSPECTING → AVAILABLE
- **Controller orchestration** would be needed to chain these operations automatically

## Why This Architecture?

### Advantages

1. **Loose Coupling**
   - Services don't depend on each other's implementation
   - Can change service internals without affecting others
   - Easy to test in isolation

2. **Transaction Integrity**
   - Prisma transactions ensure ACID properties
   - Complex workflows execute atomically
   - Rollback on any error

3. **Performance**
   - No service layer overhead
   - Direct database access via optimized Prisma queries
   - Reduced network latency (no inter-service calls)

4. **Type Safety**
   - Prisma generates TypeScript types
   - Compile-time validation of data structures
   - IntelliSense support

5. **Simplicity**
   - Clear data ownership per service
   - Straightforward code paths
   - Easy to understand and maintain

### Trade-offs

1. **Business Logic Duplication**
   - Code generation logic repeated (RES, STY, FLO, TXN codes)
   - Validation rules may be duplicated
   - **Mitigation**: Extract to shared utilities

2. **Cross-Cutting Concerns**
   - No centralized place for cross-domain operations
   - Controllers must orchestrate complex workflows
   - **Mitigation**: Create workflow services or use saga pattern

3. **Data Model Knowledge**
   - Services must understand related models
   - Breaking database changes affect multiple services
   - **Mitigation**: Prisma schema as single source of truth

4. **Testing Complexity**
   - Must mock Prisma for unit tests
   - Integration tests require database setup
   - **Mitigation**: Test database containers with Docker

## Service Interaction Summary Table

| Service | Direct Service Dependencies | Prisma Model Dependencies | Called By |
|---------|----------------------------|---------------------------|-----------|
| **CustomerService** | None | Customer, CustomerTier | Reservation, StayRecord, Invoice (via Prisma) |
| **RoomService** | None | Room, RoomType, RatePolicy | Reservation, StayRecord, Housekeeping (via Prisma) |
| **EmployeeService** | None | Employee, UserGroup, WorkShift | Auth, Token |
| **ServiceService** | None | Service, ServiceGroup | Folio, Nightly, Inspection (via Prisma) |
| **TokenService** | EmployeeService | Token | Auth |
| **AuthService** | TokenService, EmployeeService | None | Controllers |
| **ReservationService** | None | Reservation, ReservationDetail, Customer, RoomType | StayRecord (via Prisma) |
| **StayRecordService** | None | StayRecord, StayDetail, GuestInResidence, Reservation, Room, Customer | Folio, Nightly, Housekeeping (via Prisma) |
| **FolioService** | None | GuestFolio, FolioTransaction, Service, StayRecord | Invoice, Inspection (via Prisma) |
| **HousekeepingService** | None | HousekeepingLog, Room, Employee | Inspection (via Prisma) |
| **InspectionService** | None | RoomInspection, Service, GuestFolio, HousekeepingLog | Controllers |
| **NightlyService** | None | All (read-only), GuestFolio, FolioTransaction (write) | Scheduled Job |
| **ReportService** | None | DailySnapshot, All (read-only) | Controllers |
| **InvoiceService** | None | Invoice, InvoiceDetail, GuestFolio, Customer | Controllers |

## Recommendations for Future Enhancement

### 1. Extract Shared Utilities

Create utility functions for common patterns:

```typescript
// utils/codeGenerator.ts
export const generateSequentialCode = async (
  prefix: string,
  prismaModel: any,
  codeField: string = 'code',
  sequenceLength: number = 4
): Promise<string> => {
  const today = new Date();
  const datePrefix = `${prefix}${today.getFullYear().toString().slice(-2)}${
    (today.getMonth() + 1).toString().padStart(2, '0')
  }${today.getDate().toString().padStart(2, '0')}`;
  
  const lastRecord = await prismaModel.findFirst({
    where: { [codeField]: { startsWith: datePrefix } },
    orderBy: { [codeField]: 'desc' }
  });
  
  let sequence = 1;
  if (lastRecord) {
    sequence = parseInt(lastRecord[codeField].slice(-sequenceLength), 10) + 1;
  }
  
  return `${datePrefix}${sequence.toString().padStart(sequenceLength, '0')}`;
};
```

### 2. Create Workflow Services

For complex multi-service operations:

```typescript
// services/workflow/checkin.workflow.ts
export const executeCheckInWorkflow = async (data) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create stay record
    const stay = await stayRecordService.checkInFromReservation(data);
    
    // 2. Create folios
    const folios = await folioService.createFoliosForStay(stay.id);
    
    // 3. Assign housekeeping
    await housekeepingService.createTasksForCheckIn(stay.id);
    
    return { stay, folios };
  });
};
```

### 3. Implement Domain Events

For decoupled service communication:

```typescript
// After checkout
eventBus.emit('stay.checkedOut', { stayRecordId, roomIds });

// Listeners
eventBus.on('stay.checkedOut', async ({ roomIds }) => {
  await housekeepingService.createCleaningTasks(roomIds);
});
```

### 4. Add Service Facades

For common service combinations:

```typescript
// services/facades/booking.facade.ts
export class BookingFacade {
  async createReservationWithDeposit(data) {
    const reservation = await reservationService.create(data);
    if (data.depositAmount) {
      const folio = await folioService.createNonResidentFolio(data.customerId);
      await folioService.postDeposit(folio.id, data.depositAmount);
    }
    return reservation;
  }
}
```

## Conclusion

The RoomMaster backend follows a **Prisma-mediated service architecture** where:

1. **Direct service dependencies are minimal** (only Auth/Token/Employee)
2. **Most interactions happen through Prisma ORM** using shared data models
3. **Controllers orchestrate** complex multi-service workflows
4. **Services are self-contained** and operate on their own domain

This architecture prioritizes **simplicity, transaction integrity, and type safety** over strict service boundaries, which is appropriate for a monolithic application. For microservices migration, consider adding an event-driven layer to decouple services further.
