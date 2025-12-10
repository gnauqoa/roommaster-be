# Guest Folio Business Logic Documentation

## Overview

The `GuestFolio` model now enforces strict business logic based on folio type, ensuring proper separation of concerns between different types of folios.

## Folio Types and Requirements

### 1. GUEST Folio

**Purpose:** Track charges and payments for individual guest rooms within a stay.

**Required Fields:**

- `stayDetailId` (required) - Links to the specific room assignment
- `stayRecordId` (required) - Links to the overall stay/check-in
- `reservationId` (optional) - Links to the original reservation if applicable
- `billToCustomerId` (required) - The customer being billed

**Characteristics:**

- One folio per room per stay (when a guest moves rooms, a new GUEST folio is created)
- Tracks all charges/payments for that specific room
- Room charges, service charges, and surcharges post to this folio
- Example: Guest in Room 101 → stayDetail 5 → GUEST folio

**Creation Rules:**

```typescript
const guestFolio = await folioService.createGuestFolio({
  stayRecordId: 123, // Required
  stayDetailId: 456, // Required
  billToCustomerId: 789, // Required
  folioType: FolioType.GUEST,
  reservationId: 999 // Optional
});
```

---

### 2. MASTER Folio

**Purpose:** Consolidate all charges for a complete stay (all rooms combined).

**Required Fields:**

- `stayRecordId` (required) - Links to the overall stay/check-in
- `billToCustomerId` (required) - The customer being billed

**Forbidden Fields:**

- `stayDetailId` - MUST be null/undefined
- `reservationId` - Optional but typically null for MASTER

**Characteristics:**

- One folio per stay (regardless of room moves)
- Aggregates charges from all rooms during the stay
- Summary folio for final billing/invoice generation
- Example: Guest checks in on 1/1, moves rooms 1/2 → one MASTER folio for entire stay

**Creation Rules:**

```typescript
const masterFolio = await folioService.createGuestFolio({
  stayRecordId: 123, // Required
  billToCustomerId: 789, // Required
  folioType: FolioType.MASTER
  // stayDetailId: undefined (will reject if provided)
});
```

---

### 3. NON_RESIDENT Folio

**Purpose:** Track charges for non-room services (e.g., spa treatments, minibar, F&B).

**Required Fields:**

- `billToCustomerId` (required) - The customer being billed

**Forbidden Fields:**

- `stayRecordId` - MUST be null/undefined
- `stayDetailId` - MUST be null/undefined
- `reservationId` - MUST be null/undefined

**Characteristics:**

- Standalone folio not linked to any stay
- For walk-in customers or service-only transactions
- Example: Customer comes for a spa service without staying

**Creation Rules:**

```typescript
const nonResidentFolio = await folioService.createGuestFolio({
  billToCustomerId: 789, // Required
  folioType: FolioType.NON_RESIDENT
  // All other fields must be undefined/null
});
```

---

## Transaction Posting Logic

### Room Charges (Nightly Service)

- Post to: **MASTER folio** only
- Query: `guestFolio.stayRecordId = stayDetail.stayRecordId`
- Amount: `stayDetail.lockedRate` or `roomType.rackRate`
- Reference: `transaction.stayDetailId` (to track which room the charge is for)

```typescript
// In nightly.service.ts
const folio = await prisma.guestFolio.findFirst({
  where: {
    stayRecordId: stayDetail.stayRecordId, // Find MASTER folio
    status: 'OPEN'
  }
});
// Create transaction with stayDetailId reference
await prisma.folioTransaction.create({
  guestFolioId: folio.id,
  stayDetailId: stayDetail.id, // Track which room
  category: TransactionCategory.ROOM_CHARGE
});
```

### Service Charges & Surcharges

- Post to: **MASTER folio** (for room-related services)
- Example: Extra person charges, minibar used in room
- Reference: `transaction.stayDetailId` (optional, for room context)

### Direct Customer Charges

- Post to: **GUEST folio** (if room-specific) or **NON_RESIDENT folio** (if standalone)
- Example: Bellhop service for specific guest room

---

## Data Integrity Checks

### When Creating a Folio

1. **GUEST Folio:**

   - Verify `stayDetail.id` exists
   - Verify `stayRecord.id` exists
   - Both IDs required → error if missing

2. **MASTER Folio:**

   - Verify `stayRecord.id` exists
   - Reject if `stayDetailId` provided → error
   - Required ID: stayRecordId

3. **NON_RESIDENT Folio:**
   - Reject if any of (stayRecordId, stayDetailId, reservationId) provided → error
   - Standalone only

### Error Messages

| Scenario                                   | Error                                                     |
| ------------------------------------------ | --------------------------------------------------------- |
| GUEST without stayDetailId or stayRecordId | "GUEST folio requires both stayDetailId and stayRecordId" |
| MASTER without stayRecordId                | "MASTER folio requires stayRecordId"                      |
| MASTER with stayDetailId                   | "MASTER folio should not have stayDetailId"               |
| NON_RESIDENT with any stay link            | "NON_RESIDENT folio should not be linked to a stay"       |

---

## API Usage Examples

### Create GUEST Folio for a Room

```typescript
POST /api/v1/folios
{
  "folioType": "GUEST",
  "stayRecordId": 123,
  "stayDetailId": 456,
  "billToCustomerId": 789,
  "reservationId": 999
}
```

### Create MASTER Folio for Overall Stay

```typescript
POST /api/v1/folios
{
  "folioType": "MASTER",
  "stayRecordId": 123,
  "billToCustomerId": 789
}
```

### Query Folios by Type

```typescript
GET /api/v1/folios?stayRecordId=123&stayDetailId=456  // GUEST
GET /api/v1/folios?stayRecordId=123                    // All for stay (GUEST + MASTER)
GET /api/v1/folios?customerId=789                      // All customer folios
```

---

## Database Schema (Key Fields)

```prisma
model GuestFolio {
  id               Int         @id
  code             String      @unique

  // Folio Type
  folioType        FolioType   @default(GUEST)

  // Stay Links
  reservationId    Int?        // Optional: Link to booking
  stayRecordId     Int?        // MASTER & GUEST: Link to check-in
  stayDetailId     Int?        // GUEST only: Link to specific room

  // Billing
  billToCustomerId Int         // Required: Who to bill

  // Amounts
  totalCharges     Decimal     @default(0)
  totalPayments    Decimal     @default(0)
  balance          Decimal     @default(0)

  // Status
  status           FolioStatus @default(OPEN)

  // Relations
  reservation      Reservation?
  stayRecord       StayRecord?
  stayDetail       StayDetail?
  billToCustomer   Customer
}
```

---

## Migration Notes

- Schema change: Added `stayDetailId` to `GuestFolio`
- Service validation: Added folio type validation in `createGuestFolio()`
- Nightly logic: Updated to query MASTER folios for room charges
- Backward compatibility: Existing MASTER folios (with only stayRecordId) continue to work
