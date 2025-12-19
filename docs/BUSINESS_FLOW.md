# RoomMaster - Business Flow Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Business Flows](#core-business-flows)
   - [Resrvation Flow](#1-reservation-flow)
   - [Check-in Flow](#2-check-in-flow)
   - [Stay Management Flow](#3-stay-management-flow)
   - [Check-out Flow](#4-check-out-flow)
   - [Night Audit Process](#5-night-audit-process)
3. [Supporting Flows](#supporting-flows)
   - [Folio &amp; Billing System](#6-folio--billing-system)
   - [Housekeeping Flow](#7-housekeeping-flow)
   - [Pricing &amp; Rate Policy System](#8-pricing--rate-policy-system)
4. [Administrative Functions](#administrative-functions)
   - [Employee &amp; Authentication](#9-employee--authentication)
   - [Shift Management](#10-shift-management)
   - [Reporting &amp; Analytics](#11-reporting--analytics)
5. [Entity Relationships](#entity-relationships)

---

## System Overview

RoomMaster is a comprehensive Property Management System (PMS) for hotels. The system manages the complete guest lifecycle from reservation through check-out, including financial tracking, housekeeping coordination, and business analytics.

### Key Architectural Patterns

- **Dependency Injection**: Services use `@Injectable()` decorator for DI
- **Prisma ORM**: PostgreSQL database with type-safe queries
- **Folio-Based Billing**: All financial transactions flow through the folio system
- **Night Audit**: Automated nightly process for room charges and reconciliation

---

## Core Business Flows

### 1. Reservation Flow

**File**: `src/services/reservation.service.ts`

#### 1.1 Create Reservation

```
Customer Request → Create Reservation → Calculate Expected Price → Confirm
```

**Process:**

1. **Validate Customer**: Check if customer exists
2. **Check Room Availability**: Query available rooms for the date range
3. **Calculate Expected Total Price**:
   - For each night in the stay:
     - Find applicable `RatePolicy` using loop type matching
     - Apply the policy's `price` (direct amount, not factor)
     - Add extra person fees if guests exceed base capacity
4. **Create Reservation Record** with status `PENDING` or `CONFIRMED`
5. **Create Room Assignments** linking rooms to the reservation

**Rate Policy Matching Logic** (`isDateMatchingPolicy()`):

- `NONE`: Exact date range match (startDate ≤ date ≤ endDate)
- `WEEKLY`: Day of week matches (0=Sunday to 6=Saturday)
- `MONTHLY`: Day of month matches (1-31)
- `YEARLY`: Day and month match annually

#### 1.2 Reservation Status Lifecycle

```
PENDING → CONFIRMED → CHECKED_IN
                   ↘ CANCELLED
                   ↘ NO_SHOW
```

**Key Functions:**

- `createReservation()` - Create new reservation with price calculation
- `confirmReservation()` - Change status to CONFIRMED
- `cancelReservation()` - Cancel with optional penalty calculation
- `markNoShow()` - Mark as NO_SHOW for arrivals that didn't check in
- `getAvailableRooms()` - Check room availability for dates

---

### 2. Check-in Flow

**File**: `src/services/stay-record.service.ts`

#### 2.1 Walk-in Guest (Direct Check-in)

```
Guest Arrives → Create StayRecord → Create GuestFolio → Assign Room → Create StayDetail
```

**Process:**

1. Generate unique stay record code (`SR-{timestamp}`)
2. Create `StayRecord` with status `CHECKED_IN`
3. **Create Master Folio** (`FolioType.MASTER`) for the stay
4. For each room:
   - Create `StayDetail` with `OCCUPIED` status
   - Create `RoomAssignment` linking room to stay
   - Update room status to `OCCUPIED`
5. Create `GuestInResidence` records for all guests

#### 2.2 Check-in from Reservation

```
Reservation → Validate → Create StayRecord → Create Folios → Update Room Status
```

**Process:**

1. Verify reservation exists and is `CONFIRMED`
2. Update reservation status to `CHECKED_IN`
3. Create `StayRecord` linked to reservation
4. Create Master Folio (or Guest/Non-Resident as needed)
5. For each reserved room:
   - Create `StayDetail` with dates from reservation
   - Create `RoomAssignment`
   - Change room status from `RESERVED` to `OCCUPIED`
6. Register guests in residence

**Key Functions:**

- `createStayRecord()` - Walk-in check-in
- `checkInFromReservation()` - Reservation-based check-in
- `addGuestToStay()` - Add additional guests
- `assignRoomToStay()` - Assign additional rooms

---

### 3. Stay Management Flow

**File**: `src/services/stay-record.service.ts`

#### 3.1 Room Move

```
Request Move → Validate New Room → Transfer StayDetail → Update Room Statuses
```

**Process:**

1. Verify current `StayDetail` exists and is `OCCUPIED`
2. Verify new room is `AVAILABLE`
3. Update old room status to `CLEANING`
4. Create housekeeping log for old room
5. Update `StayDetail` with new room ID
6. Create new `RoomAssignment` for new room
7. Update new room status to `OCCUPIED`

#### 3.2 Extend Stay

```
Request Extension → Validate Availability → Update Expected Check-out
```

**Process:**

1. Check room availability for extended dates
2. Update `expectedCheckOut` on all `StayDetails`
3. Recalculate expected charges (handled by night audit)

#### 3.3 Split Folio

```
Master Folio → Create Guest Folio → Transfer Selected Transactions
```

**Process:**

1. Create new `GuestFolio` linked to same `StayRecord`
2. Transfer selected transactions to new folio
3. Recalculate balances on both folios

**Key Functions:**

- `moveRoom()` - Transfer guest to different room
- `extendStay()` - Extend departure date
- `splitFolio()` - Create separate billing folios

---

### 4. Check-out Flow

**File**: `src/services/stay-record.service.ts`

```
Initiate Check-out → Settle Folios → Update Statuses → Create Housekeeping → Complete
```

#### 4.1 Pre-Check-out Validation

1. Verify all folios have zero balance or are settled
2. If balance remaining, collect payment first

#### 4.2 Check-out Process

1. **Close All Folios**:
   - Update `GuestFolio` status to `CLOSED`
   - Set `closedAt` timestamp
2. **Update Stay Records**:
   - Set `StayDetail` status to `CHECKED_OUT`
   - Set `actualCheckOut` timestamp
   - Set `StayRecord` status to `CHECKED_OUT`
3. **Room Cleanup**:
   - Change room status to `CLEANING`
   - Create `HousekeepingLog` with `PENDING` status
4. **Guest Records**:
   - Remove guests from `GuestInResidence`

#### 4.3 Early Departure Handling

- Calculate any applicable early departure penalties
- Post penalty charges to folio before closing

**Key Functions:**

- `checkOut()` - Complete check-out process
- `validateFolioBalance()` - Ensure all balances settled
- `generateCheckoutFolio()` - Final folio summary

---

### 5. Night Audit Process

**File**: `src/services/nightly.service.ts`

The Night Audit is the most critical daily operation, running typically at 2-3 AM.

```
Start Audit → Post Room Charges → Post Extra Person Fees → Process Surcharges → Create Snapshot → Complete
```

#### 5.1 Main Night Audit Sequence (`runNightAudit()`)

1. **Validate Timing**: Ensure audit hasn't already run today
2. **Post Room Charges** (`postNightlyRoomCharges()`)
3. **Post Extra Person Charges** (`postExtraPersonCharges()`)
4. **Post Late Check-out Surcharges** (if applicable)
5. **Update No-Shows** (`updateNoShowReservations()`)
6. **Create Daily Snapshot** (`createDailySnapshot()`)
7. **Log Audit Completion**

#### 5.2 Room Charge Posting (`postNightlyRoomCharges()`)

For each occupied `StayDetail`:

1. **Find Applicable Rate** (`getDailyRoomRate()`):

   - Get room type's base `rackRate`
   - Look up `RatePolicy` for the room type
   - Find nearest `RatePolicyLog` created before check-in date
   - Apply the logged `price` (historical rate snapshot)

2. **Calculate Final Rate**:

   - If customer has tier, apply `roomDiscountFactor`
   - Rate = PolicyPrice × (1 - TierDiscount)

3. **Post Transaction**:

   - Create `FolioTransaction` with:
     - `category`: `ROOM_CHARGE`
     - `transactionType`: `DEBIT`
     - `quantity`: 1 (one night)
     - `postingDate`: Audit date

#### 5.3 Rate Policy Lookup (`findNearestRatePolicyLog()`)

The system uses historical rate snapshots:

```
1. Find RatePolicy for room type where:
   - loop = NONE: startDate ≤ targetDate ≤ endDate
   - loop = WEEKLY: dayOfWeek matches
   - loop = MONTHLY: dayOfMonth matches
   - loop = YEARLY: day/month matches

2. Get RatePolicyLog where:
   - effectiveDate ≤ targetDate (reservation date or check-in date)
   - Order by effectiveDate DESC
   - Take first (nearest historical rate)

3. Return logged price (rate at time of booking)
```

#### 5.4 Daily Snapshot Creation (`createDailySnapshot()`)

Captures end-of-day metrics:

- **Room Statistics**: Total, Available, Occupied, Reserved, Out-of-Order
- **Occupancy Metrics**: Occupancy Rate, ADR, RevPAR
- **Revenue Breakdown**: Room, Service, Surcharge, Penalty
- **Activity Counts**: Check-ins, Check-outs, New Reservations, Cancellations, No-Shows

**Key Functions:**

- `runNightAudit()` - Main orchestrator
- `postNightlyRoomCharges()` - Post room charges
- `getDailyRoomRate()` - Calculate rate with policy lookup
- `findNearestRatePolicyLog()` - Historical rate retrieval
- `postExtraPersonCharges()` - Surcharge for excess guests
- `createDailySnapshot()` - Daily metrics snapshot

---

## Supporting Flows

### 6. Folio & Billing System

**File**: `src/services/folio.service.ts`

#### 6.1 Folio Types

- **MASTER**: Primary billing folio for the stay (always created)
- **GUEST**: Individual guest folios (split from master)
- **NON_RESIDENT**: Billing for non-staying customers (events, dining)

#### 6.2 Folio Lifecycle

```
OPEN → CLOSED
```

#### 6.3 Transaction Types

| Category       | Type         | Description                   |
| -------------- | ------------ | ----------------------------- |
| ROOM_CHARGE    | DEBIT        | Nightly room rate             |
| SERVICE_CHARGE | DEBIT        | Services (F&B, laundry, etc.) |
| SURCHARGE      | DEBIT        | Extra person, late checkout   |
| PENALTY        | DEBIT        | Cancellation, no-show fees    |
| PAYMENT        | CREDIT       | Guest payments                |
| DISCOUNT       | CREDIT       | Promotional discounts         |
| REFUND         | CREDIT       | Payment reversals             |
| ADJUSTMENT     | DEBIT/CREDIT | Manual corrections            |

#### 6.4 Key Folio Operations

**Add Room Charge:**

```typescript
addRoomCharge(folioId, stayDetailId, amount, quantity, description, employeeId);
```

**Add Service Charge:**

```typescript
addServiceCharge(folioId, serviceId, quantity, unitPrice, employeeId, stayDetailId?)
```

**Add Payment:**

```typescript
addPayment(folioId, amount, paymentMethodId, employeeId, reference?)
```

**Void Transaction:**

```typescript
voidTransaction(transactionId, reason, employeeId);
// Creates reversal transaction, marks original as void
```

**Transfer Transaction:**

```typescript
transferTransaction(transactionId, targetFolioId, employeeId);
// Moves transaction between folios (for splits)
```

**Key Functions:**

- `createGuestFolio()` - Create new folio
- `addRoomCharge()`, `addServiceCharge()`, `addPayment()`
- `voidTransaction()` - Void with reversal
- `transferTransaction()` - Inter-folio transfer
- `closeFolio()` - Close folio (balance must be zero)
- `getFolioBalance()` - Calculate current balance

---

### 7. Housekeeping Flow

**File**: `src/services/housekeeping.service.ts`

#### 7.1 Housekeeping Status Lifecycle

```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
                               ↘ INSPECTED (optional)
```

#### 7.2 Housekeeping Triggers

1. **Guest Check-out**: Automatic `PENDING` log created
2. **Room Move**: Old room gets `PENDING` log
3. **Daily Cleaning**: Scheduled cleaning for occupied rooms
4. **Manual Request**: Guest or staff requests

#### 7.3 Housekeeping Process

1. **Assignment**: Supervisor assigns housekeeper to room
2. **Start Cleaning**: Housekeeper marks `IN_PROGRESS`
3. **Complete**: Mark `COMPLETED`, update room status
4. **Inspection** (optional): Supervisor inspects and approves

**Room Status Integration:**

- After cleaning: Room status → `AVAILABLE`
- During cleaning: Room status → `CLEANING`

**Key Functions:**

- `createHousekeepingLog()` - Create new task
- `assignHousekeeper()` - Assign employee
- `updateHousekeepingStatus()` - Progress updates
- `completeHousekeeping()` - Mark complete + update room

---

### 8. Pricing & Rate Policy System

**File**: `src/services/pricing.service.ts`

#### 8.1 Rate Policy Structure

```
RatePolicy (Template)
├── roomTypeId: Target room type
├── price: Direct price amount
├── loop: NONE | WEEKLY | MONTHLY | YEARLY
├── startDate/endDate: Date range (for NONE)
├── dayOfWeek: 0-6 (for WEEKLY)
├── dayOfMonth: 1-31 (for MONTHLY)
└── RatePolicyLog[] (Historical snapshots)
```

#### 8.2 Loop Types Explained

| Loop Type | Use Case                                | Matching Logic                   |
| --------- | --------------------------------------- | -------------------------------- |
| `NONE`    | Specific date ranges (holidays, events) | startDate ≤ date ≤ endDate       |
| `WEEKLY`  | Weekday/weekend pricing                 | dayOfWeek matches (0=Sun, 6=Sat) |
| `MONTHLY` | Monthly patterns (1st of month special) | dayOfMonth matches               |
| `YEARLY`  | Annual events (Christmas, New Year)     | day + month match annually       |

#### 8.3 Rate Policy Log

When a `RatePolicy` is created or updated, a `RatePolicyLog` is created:

```typescript
RatePolicyLog {
  ratePolicyId: Link to policy
  price: Price at this point in time
  effectiveDate: When this price became effective
  createdAt: Log creation timestamp
}
```

This enables **historical rate preservation** - guests are charged the rate that was in effect when they booked, not the current rate.

#### 8.4 Rate Calculation Priority

1. Find `RatePolicy` matching the date (using loop logic)
2. Find `RatePolicyLog` with `effectiveDate` ≤ booking date
3. If found: Use logged price
4. If not found: Fall back to room type's `rackRate`

**Key Functions:**

- `createRatePolicy()` - Create policy + initial log
- `updateRatePolicy()` - Update policy + new log entry
- `getRatePolicies()` - Query policies
- `calculateRate()` - Get effective rate for date

---

## Administrative Functions

### 9. Employee & Authentication

**Files**: `src/services/auth.service.ts`, `src/services/employee.service.ts`

#### 9.1 Authentication Flow

```
Login → Validate Credentials → Generate Tokens (Access + Refresh)
```

**Token Types:**

- **Access Token**: Short-lived (15min), used for API requests
- **Refresh Token**: Longer-lived, used to get new access tokens

#### 9.2 Employee Management

- Create/Update/Delete employees
- Assign to `UserGroup` for permissions
- Track `isActive` status

**Key Functions:**

- `loginWithEmailAndPassword()` - Authenticate
- `refreshAuth()` - Token refresh
- `changePassword()` - Password update
- `resetPassword()` - Password reset flow

---

### 10. Shift Management

**File**: `src/services/shift.service.ts`

#### 10.1 Work Shifts

Define shift templates (Morning, Evening, Night) with time ranges.

#### 10.2 Shift Sessions

```
OPEN → CLOSED → APPROVED
```

**Shift Session Flow:**

1. **Open Session**: Employee starts shift, records opening cash balance
2. **Work Session**: Process transactions, collect payments
3. **Close Session**: Record closing balance, system calculates expected balance
4. **Variance Calculation**: `Variance = ClosingBalance - ExpectedBalance`
5. **Approval**: Supervisor approves session

**Key Functions:**

- `openShiftSession()` - Start shift
- `closeShiftSession()` - End shift with reconciliation
- `approveShiftSession()` - Supervisor approval

---

### 11. Reporting & Analytics

**File**: `src/services/report.service.ts`

#### 11.1 Real-time Dashboard (`getDashboard()`)

- Current room status breakdown
- Today's arrivals/departures
- Today's revenue/payments
- Comparison with yesterday

#### 11.2 Occupancy Report (`getOccupancyReport()`)

- Average occupancy rate
- ADR (Average Daily Rate)
- RevPAR (Revenue Per Available Room)
- Daily breakdown

#### 11.3 Revenue Report (`getRevenueReport()`)

- Total revenue by category
- Room vs Service vs Surcharge breakdown
- Daily trends

#### 11.4 Booking Report (`getBookingReport()`)

- Total reservations
- Cancellation rate
- No-show rate
- Check-in/Check-out counts

#### 11.5 Revenue by Room Type (`getRevenueByRoomType()`)

- Revenue contribution per room type
- Room nights sold

---

## Entity Relationships

### Core Booking Entities

```
Customer ─────────┐
                  ↓
Reservation ────→ StayRecord ────→ GuestFolio ────→ FolioTransaction
    │                 │                                    │
    ↓                 ↓                                    ↓
RoomAssignment   StayDetail ←──────────────────────────────┘
    │                 │
    ↓                 ↓
  Room         GuestInResidence
    │
    ↓
RoomType ←──── RatePolicy ────→ RatePolicyLog
```

### Financial Entities

```
GuestFolio
    │
    ├── FolioTransaction (ROOM_CHARGE)
    │       └── stayDetailId → StayDetail → Room
    │
    ├── FolioTransaction (SERVICE_CHARGE)
    │       └── serviceId → Service
    │
    ├── FolioTransaction (PAYMENT)
    │       └── paymentMethodId → PaymentMethod
    │
    └── Invoice
            └── InvoiceDetail → FolioTransaction
```

### Operational Entities

```
Employee ────→ ShiftSession ────→ WorkShift
    │              │
    │              ↓
    │         FolioTransaction (employeeId)
    │
    └── HousekeepingLog ────→ Room
```

---

## Summary of Key Business Rules

1. **Rate Locking**: Guests are charged rates from `RatePolicyLog` effective at booking time
2. **Folio Balance**: Must be zero before check-out
3. **Night Audit**: Runs once daily, posts all room charges
4. **Room Status**: Automatically managed through check-in/check-out/housekeeping
5. **Transaction Voiding**: Creates reversal transaction, never deletes
6. **Historical Preservation**: `RatePolicyLog` maintains rate history
7. **Tier Discounts**: Applied during night audit room charge posting

---

## Service Index

| Service             | File                    | Primary Responsibility           |
| ------------------- | ----------------------- | -------------------------------- |
| ReservationService  | reservation.service.ts  | Booking management               |
| StayRecordService   | stay-record.service.ts  | Check-in/out operations          |
| FolioService        | folio.service.ts        | Financial transactions           |
| NightlyService      | nightly.service.ts      | Night audit process              |
| PricingService      | pricing.service.ts      | Rate policy management           |
| HousekeepingService | housekeeping.service.ts | Room cleaning workflow           |
| InvoiceService      | invoice.service.ts      | Invoice generation               |
| ReportService       | report.service.ts       | Analytics & reporting            |
| RoomService         | room.service.ts         | Room & room type management      |
| CustomerService     | customer.service.ts     | Customer & tier management       |
| EmployeeService     | employee.service.ts     | Staff management                 |
| AuthService         | auth.service.ts         | Authentication                   |
| ShiftService        | shift.service.ts        | Shift & session management       |
| ServiceService      | service.service.ts      | Hotel services & payment methods |
