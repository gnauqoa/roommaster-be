# Rate Policy System Changes

**Date:** December 19, 2025

## Overview

This document summarizes the changes made to implement a daily rate tracking system based on `RatePolicy`. The system now calculates and stores rates per night instead of using a single `lockedRate` or `expectedRate`.

---

## Schema Changes (`prisma/schema.prisma`)

### New Models Added

#### 1. `RatePolicyLog`
Historical rate policy snapshot - preserves rates when policy changes.

```prisma
model RatePolicyLog {
  id           Int      @id @default(autoincrement())
  roomTypeId   Int
  date         DateTime @db.Date
  dateType     DateType
  rateFactor   Decimal  @db.Decimal(5, 2)
  baseRate     Decimal  @db.Decimal(15, 2)
  ratePolicyId Int?
  createdAt    DateTime @default(now())

  @@unique([roomTypeId, date])  // One rate per room type per date
  @@map("rate_policy_logs")
}
```

#### 2. `ReservationDetailDay`
Daily rate for each night of the reservation.

```prisma
model ReservationDetailDay {
  id                  Int      @id @default(autoincrement())
  reservationDetailId Int
  date                DateTime @db.Date
  baseRate            Decimal  @db.Decimal(15, 2)  // rackRate from RoomType
  rateFactor          Decimal  @db.Decimal(5, 2)   // From RatePolicy (default 1.0)
  finalRate           Decimal  @db.Decimal(15, 2)  // baseRate × rateFactor
  ratePolicyLogId     Int?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([reservationDetailId, date])
  @@map("reservation_detail_days")
}
```

### Fields Removed

| Model | Field Removed | Reason |
|-------|---------------|--------|
| `ReservationDetail` | `expectedRate` | Replaced by `ReservationDetailDay.finalRate` |
| `StayDetail` | `lockedRate` | Rates now looked up from `ReservationDetailDay` or `RatePolicyLog` |

### Fields Added

| Model | Field Added | Purpose |
|-------|-------------|---------|
| `StayDetail` | `reservationDetailId` | Links to reservation detail for rate lookup |

### Updated Relations

- `RoomType` → `RatePolicyLog[]` (new)
- `RatePolicy` → `RatePolicyLog[]` (new)
- `ReservationDetail` → `ReservationDetailDay[]` (new)
- `RatePolicyLog` → `ReservationDetailDay[]` (new)

---

## Service Changes

### `reservation.service.ts`

#### New Methods Added:
- `getDateRange(startDate, endDate)` - Generate array of dates for a stay
- `findApplicableRatePolicy(roomTypeId, date)` - Find matching rate policy with highest priority
- `ensureRatePolicyLog(...)` - Create/retrieve rate snapshot for a date
- `createReservationDetailDays(...)` - Create daily rate records for a reservation detail

#### Modified Methods:
- `createReservation()` - Now creates `ReservationDetailDay` records for each night
- `addReservationDetail()` - Now creates daily rate records when adding a detail

#### Removed:
- `expectedRate` from `ReservationDetailInput` interface

---

### `nightly.service.ts`

#### New Methods Added:
- `getDailyRoomRate(stayDetail, date)` - Get rate with priority:
  1. `ReservationDetailDay` (if from reservation)
  2. `RatePolicyLog` (for walk-ins or extended stays)
  3. Calculate from `RatePolicy` and create log entry
- `findApplicableRatePolicy(roomTypeId, date)` - Find matching rate policy

#### Modified Methods:
- `postNightlyRoomCharges()` - Now uses `getDailyRoomRate()` instead of `lockedRate`

---

### `stay-record.service.ts`

#### Modified Interfaces:
- `StayDetailInput` - Removed `lockedRate`
- `RoomAssignment` - Removed `lockedRate`

#### Modified Methods:
- `createStayRecord()` - No longer sets `lockedRate`
- `checkInFromReservation()` - No longer sets `lockedRate`, now sets `reservationDetailId`

---

## Validation Changes

### `reservation.validation.ts`
- Removed `expectedRate` from `reservationDetailSchema`
- Removed `expectedRate` from `updateReservationDetail`
- Removed `lockedRate` from `checkInReservation`

### `stay-record.validation.ts`
- Removed `lockedRate` from `stayDetailSchema`
- Removed `lockedRate` from `checkInFromReservation`
- Removed `lockedRate` from `updateStayDetail`

---

## Rate Calculation Flow

### When Creating a Reservation:
```
1. For each night in the stay (expectedArrival to expectedDeparture):
   ├── Find applicable RatePolicy (by roomTypeId, date range, highest priority)
   ├── Get rateFactor and dateType from policy (or default 1.0)
   ├── Ensure RatePolicyLog exists (create snapshot if not)
   └── Create ReservationDetailDay:
       ├── baseRate = roomType.rackRate
       ├── rateFactor = policy.rateFactor
       └── finalRate = baseRate × rateFactor
```

### When Posting Nightly Charges:
```
1. For each occupied StayDetail:
   ├── Try ReservationDetailDay (if reservationDetailId exists)
   ├── Try matching via stayRecord.reservation.reservationDetails
   ├── Try RatePolicyLog (for walk-ins)
   └── Fallback: Calculate from RatePolicy and create RatePolicyLog
```

### When RatePolicy Changes:
```
1. Before updating, existing RatePolicyLog entries are preserved
2. New bookings get new rates from updated RatePolicy
3. Existing bookings keep their original rates (in ReservationDetailDay)
```

---

## Migration Required

Run the following commands to apply the schema changes:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_rate_policy_daily_tracking
```

**Note:** This is a breaking change. Existing data with `lockedRate` and `expectedRate` will be lost. Ensure to:
1. Backup the database before migration
2. Migrate existing rates if needed

---

## Benefits of New Design

1. **Granular Pricing** - Different rates for each night (weekend, holiday, high season)
2. **Historical Preservation** - Rate changes don't affect existing bookings
3. **Audit Trail** - `RatePolicyLog` preserves rate snapshots
4. **Flexible Rate Policies** - Support for date ranges, day-of-week, priority-based rules
5. **Walk-in Support** - Dynamic rate calculation for guests without reservations
