# Database Schema Guide for RoomMaster

## Core Models

### Booking System

- **Booking**: Central entity. Contains `bookingCode`, `status` (PENDING, CONFIRMED, CHECKED_IN, etc.), `checkInDate`, `checkOutDate`, `totalAmount`, `depositRequired`.
  - Relations: `primaryCustomer` (Customer), `bookingRooms` (BookingRoom[]), `bookingCustomers` (BookingCustomer[]), `transactions`, `serviceUsages`.
- **BookingRoom**: A specific room within a booking. Tracks `checkInDate`/`checkOutDate` per room, prices, and status.
- **BookingCustomer**: Links Customers to Bookings (guests). `isPrimary` flag indicates the main contact.

### Rooms & Inventory

- **Room**: Physical room. Has `roomNumber`, `floor`, `status` (AVAILABLE, OCCUPIED, etc.), and `roomType`.
- **RoomType**: Categories of rooms (e.g., "Single", "Deluxe"). Contains `basePrice`, `capacity`, `totalBed`.
- **RoomTag/RoomTypeTag**: Features/amenities associated with room types (e.g., "Sea View", "Wifi").

### Customers & People

- **Customer**: Guest profiles. `phone` (unique), `email`, `fullName`, `rank` (VIP status), `totalSpent`.
- **Employee**: Staff members. `username`, `role` (Admin, Receptionist, etc.).
- **CustomerRank**: VIP tiers (Bronze, Silver, Gold) based on `minSpending`.

### Financials

- **Transaction**: Payments/Refunds. `type` (DEPOSIT, ROOM_CHARGE), `amount`, `status`, `method` (CASH, CARD).
- **TransactionDetail**: Line items for transactions, linking to `bookingRoom` or `serviceUsage`.
- **PricingRule**: Dynamic pricing logic (seasonal adjustments, etc.) linked to `BookingRoom`.

### Services

- **Service**: Extra amenities (SPA, Laundry). `name`, `price`, `unit`.
- **ServiceUsage**: Records a customer/room using a service. Contains `quantity`, `totalPrice`, `status`.

## Enums

- **BookingStatus**: PENDING, CONFIRMED, CHECKED_IN, PARTIALLY_CHECKED_OUT, CHECKED_OUT, CANCELLED.
- **RoomStatus**: AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE.
- **TransactionStatus**: PENDING, COMPLETED, FAILED, REFUNDED.
- **PaymentMethod**: CASH, CREDIT_CARD, BANK_TRANSFER, E_WALLET.

## Key Relationships

- **Booking -> BookingRoom -> Room**: How a booking reserves specific physical rooms.
- **Booking -> Transaction**: Financial records for a reservation.
- **Customer -> CustomerRank**: Loyalty program level.
