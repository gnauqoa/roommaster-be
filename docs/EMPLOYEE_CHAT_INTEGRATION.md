# Employee Chat - Integration with Existing Architecture

## Overview

This document explains how the proposed employee chat system integrates seamlessly with RoomMaster's existing architecture, following established patterns and conventions.

## Architecture Consistency

### Layered Architecture Pattern

The chat system follows the exact same 5-layer architecture used throughout RoomMaster:

| Layer | Existing Examples | Chat Implementation |
|-------|------------------|---------------------|
| **Routes** | `employee/booking.route.ts` | `employee/chat.route.ts` |
| **Middleware** | `auth.ts`, `validate.ts` | `socket-auth.middleware.ts` |
| **Controller** | `employee.booking.controller.ts` | `employee.chat.controller.ts` |
| **Service** | `booking.service.ts` | `chat.service.ts` |
| **Data** | Prisma models (Booking, Room) | Prisma models (ChatRoom, ChatMessage) |

### Dependency Injection Pattern

```typescript
// Existing Pattern (Booking)
const bookingService = container.resolve(TOKENS.BookingService);
const bookingController = new EmployeeBookingController(bookingService);

// Chat Implementation (Same Pattern)
const chatService = container.resolve(TOKENS.ChatService);
const chatController = new EmployeeChatController(chatService);
```

### Authentication Pattern

```typescript
// Existing Pattern
router.get('/bookings', authEmployee(), bookingController.getBookings);

// Chat Implementation (Same Pattern)
router.get('/chat/rooms', authEmployee(), chatController.getChatRooms);

// WebSocket (Extended Pattern)
io.use(socketAuthMiddleware); // Uses same JWT verification
```

## Database Integration

### Prisma Schema Consistency

The chat models follow the exact same patterns as existing models:

#### Existing Pattern Example: Booking System

```prisma
model Booking {
  id          String   @id @default(cuid())
  status      BookingStatus @default(PENDING)
  
  // Relations
  primaryCustomerId String
  primaryCustomer   Customer @relation(fields: [primaryCustomerId], references: [id])
  bookingRooms      BookingRoom[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
}
```

#### Chat Pattern (Matches Existing Style)

```prisma
model ChatRoom {
  id          String   @id @default(cuid())
  type        ChatRoomType @default(DIRECT)
  
  // Relations
  createdById String
  createdBy   Employee @relation(fields: [createdById], references: [id])
  messages    ChatMessage[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
}
```

### Naming Conventions

| Convention | Existing | Chat Implementation |
|------------|----------|---------------------|
| **ID Pattern** | `cuid()` | `cuid()` ✅ |
| **Timestamps** | `createdAt`, `updatedAt` | `createdAt`, `updatedAt` ✅ |
| **Enum Naming** | `BookingStatus`, `RoomStatus` | `ChatRoomType`, `ChatMessageType` ✅ |
| **Foreign Keys** | `customerId`, `bookingId` | `employeeId`, `chatRoomId` ✅ |
| **Indexes** | `@@index([status])` | `@@index([type])` ✅ |

## Service Layer Integration

### Service Class Pattern

```typescript
// Existing Pattern: BookingService
export class BookingService {
  constructor(
    private prisma: PrismaClient,
    private roomService: RoomService,
    private transactionService: TransactionService
  ) {}
  
  async createBooking(data: CreateBookingDto) {
    // Business logic
  }
}

// Chat Pattern (Identical Structure)
export class ChatService {
  constructor(
    private prisma: PrismaClient
  ) {}
  
  async createChatRoom(data: CreateChatRoomDto) {
    // Business logic
  }
}
```

### Method Naming Conventions

| Operation | Existing Pattern | Chat Implementation |
|-----------|-----------------|---------------------|
| **Get Single** | `getBookingById()` | `getChatRoomById()` ✅ |
| **Get Multiple** | `getBookings()` | `getChatRooms()` ✅ |
| **Create** | `createBooking()` | `createChatRoom()` ✅ |
| **Update** | `updateBooking()` | `editMessage()` ✅ |
| **Delete** | `deleteBooking()` | `deleteMessage()` ✅ |

## Controller Layer Integration

### Controller Pattern

```typescript
// Existing Pattern
export class EmployeeBookingController {
  constructor(private bookingService: BookingService) {}
  
  getBookings = catchAsync(async (req, res) => {
    const employeeId = req.employee.id;
    const bookings = await this.bookingService.getBookings(employeeId);
    res.json({ bookings });
  });
}

// Chat Pattern (Same Structure)
export class EmployeeChatController {
  constructor(private chatService: ChatService) {}
  
  getChatRooms = catchAsync(async (req, res) => {
    const employeeId = req.employee.id;
    const rooms = await this.chatService.getChatRooms(employeeId);
    res.json({ rooms });
  });
}
```

### Response Format Consistency

```typescript
// Existing Response Format
{
  bookings: [...],
  pagination: { ... }
}

// Chat Response Format (Matches)
{
  rooms: [...],
  pagination: { ... }
}
```

## Validation Integration

### Joi Schema Pattern

```typescript
// Existing Pattern: booking.validation.ts
export const bookingValidation = {
  createBooking: {
    body: Joi.object({
      checkInDate: Joi.date().required(),
      checkOutDate: Joi.date().required(),
      // ...
    })
  }
};

// Chat Pattern (Same Structure)
export const chatValidation = {
  createChatRoom: {
    body: Joi.object({
      type: Joi.string().valid('DIRECT', 'GROUP').required(),
      participantIds: Joi.array().items(Joi.string()).required(),
      // ...
    })
  }
};
```

## Route Documentation Integration

### Swagger Pattern

```typescript
// Existing Pattern
/**
 * @swagger
 * /v1/employee/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Employee - Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bookings', authEmployee(), controller.getBookings);

// Chat Pattern (Same Structure)
/**
 * @swagger
 * /v1/employee/chat/rooms:
 *   get:
 *     summary: Get all chat rooms
 *     tags: [Employee - Chat]
 *     security:
 *       - bearerAuth: []
 */
router.get('/chat/rooms', authEmployee(), controller.getChatRooms);
```

## Error Handling Integration

### ApiError Usage

```typescript
// Existing Pattern
if (!booking) {
  throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
}

// Chat Pattern (Same)
if (!chatRoom) {
  throw new ApiError(httpStatus.NOT_FOUND, 'Chat room not found');
}
```

### Error Response Format

Both use the same error format:
```json
{
  "code": 404,
  "message": "Resource not found"
}
```

## Testing Integration

### Test Structure Pattern

```typescript
// Existing Pattern: booking.service.test.ts
describe('BookingService', () => {
  describe('createBooking', () => {
    it('should create booking with valid data');
    it('should throw error for invalid dates');
  });
});

// Chat Pattern (Same Structure)
describe('ChatService', () => {
  describe('createChatRoom', () => {
    it('should create chat room with valid data');
    it('should throw error for invalid participants');
  });
});
```

### Integration Test Pattern

```typescript
// Existing Pattern
describe('POST /v1/employee/bookings', () => {
  it('should create booking when authenticated');
  it('should return 401 without auth');
});

// Chat Pattern (Same)
describe('POST /v1/employee/chat/rooms', () => {
  it('should create chat room when authenticated');
  it('should return 401 without auth');
});
```

## Security Integration

### Authentication Integration

| Feature | Existing Implementation | Chat Integration |
|---------|------------------------|------------------|
| **JWT Tokens** | Used for all endpoints | Used for HTTP & WebSocket ✅ |
| **Token Service** | `token.service.ts` | Reused for socket auth ✅ |
| **Auth Middleware** | `authEmployee()` | Extended for WebSocket ✅ |
| **Token Expiration** | 30 minutes | Same (30 minutes) ✅ |

### Authorization Pattern

```typescript
// Existing Pattern: Check if user can access resource
const booking = await prisma.booking.findFirst({
  where: { 
    id: bookingId,
    // User authorization check
    primaryCustomerId: customerId 
  }
});

// Chat Pattern (Same Concept)
const chatRoom = await prisma.chatRoom.findFirst({
  where: { 
    id: roomId,
    // User authorization check
    participants: {
      some: { employeeId }
    }
  }
});
```

## File Organization

### Directory Structure Comparison

```
src/
├── controllers/
│   └── employee/
│       ├── employee.booking.controller.ts    [Existing]
│       ├── employee.room.controller.ts        [Existing]
│       ├── employee.chat.controller.ts        [NEW - Same pattern]
│       └── employee.chat.socket.ts            [NEW - WebSocket handler]
│
├── services/
│   ├── booking.service.ts                     [Existing]
│   ├── room.service.ts                        [Existing]
│   └── chat.service.ts                        [NEW - Same pattern]
│
├── routes/v1/employee/
│   ├── booking.route.ts                       [Existing]
│   ├── room.route.ts                          [Existing]
│   └── chat.route.ts                          [NEW - Same pattern]
│
└── validations/
    ├── booking.validation.ts                  [Existing]
    ├── room.validation.ts                     [Existing]
    └── chat.validation.ts                     [NEW - Same pattern]
```

## Configuration Integration

### Environment Variables Pattern

```env
# Existing Configuration
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_ACCESS_EXPIRATION_MINUTES=30

# Chat Configuration (New, Following Pattern)
SOCKET_IO_PATH=/socket.io/
SOCKET_IO_CORS_ORIGIN=https://app.example.com
CHAT_MAX_MESSAGE_LENGTH=5000
CHAT_MESSAGE_RATE_LIMIT=10
```

## Logging Integration

### Logger Usage

```typescript
// Existing Pattern
import logger from '@/config/logger';

logger.info('Booking created', { bookingId, customerId });
logger.error('Booking creation failed', { error: error.message });

// Chat Pattern (Same)
import logger from '@/config/logger';

logger.info('Chat room created', { roomId, creatorId });
logger.error('Message send failed', { error: error.message });
```

## Activity Tracking Integration

### Activity Model Extension (Optional)

The existing `Activity` model can be extended to track chat activities:

```prisma
// Existing Activity enum
enum ActivityType {
  CREATE_BOOKING
  UPDATE_BOOKING
  // ... existing activities
  
  // New chat activities (optional)
  CREATE_CHAT_ROOM
  SEND_MESSAGE
  EDIT_MESSAGE
  DELETE_MESSAGE
}
```

## Employee Model Integration

### Minimal Changes to Existing Model

```prisma
model Employee {
  // ... all existing fields remain unchanged ...
  
  // NEW: Add chat relations (non-breaking addition)
  createdChatRooms ChatRoom[] @relation("ChatRoomCreator")
  chatParticipants ChatParticipant[]
  chatMessages     ChatMessage[]
}
```

**Impact**: Zero breaking changes to existing Employee functionality

## API Versioning

```
Existing Endpoints:
/v1/employee/bookings
/v1/employee/rooms
/v1/employee/transactions

New Endpoints (Same version):
/v1/employee/chat/rooms
/v1/employee/chat/rooms/:id/messages

WebSocket:
/socket.io/ (Standard Socket.IO path)
```

## TypeScript Types Integration

### Type Definition Pattern

```typescript
// Existing Pattern
export interface CreateBookingDto {
  checkInDate: Date;
  checkOutDate: Date;
  // ...
}

// Chat Pattern (Same)
export interface CreateChatRoomDto {
  type: 'DIRECT' | 'GROUP';
  participantIds: string[];
  // ...
}
```

## Migration Integration

### Migration Pattern

```typescript
// Existing migrations
20240101_create_employee.sql
20240102_create_booking.sql
20240103_add_customer_rank.sql

// New migration (follows sequence)
20260114_add_employee_chat_system.sql
```

**All migrations are additive** - no modifications to existing tables.

## Backward Compatibility

### Zero Breaking Changes

✅ No changes to existing endpoints
✅ No changes to existing database tables
✅ No changes to existing services
✅ No changes to existing authentication
✅ No changes to existing API responses
✅ All existing tests continue to pass

### Optional Feature

The chat system is a **completely new feature** that:
- Can be deployed independently
- Doesn't affect existing functionality
- Can be disabled by not loading chat routes
- Can be rolled back by running down migration

## Performance Impact

### Database Queries

| Aspect | Impact | Mitigation |
|--------|--------|------------|
| **New Tables** | 3 new tables | Properly indexed ✅ |
| **Existing Queries** | No change | Chat uses separate tables ✅ |
| **Employee Queries** | Minimal | Optional relations, not auto-loaded ✅ |
| **Connection Pool** | Same | Uses existing Prisma connection ✅ |

### Server Resources

| Resource | Impact | Notes |
|----------|--------|-------|
| **Memory** | Low | WebSocket connections are lightweight |
| **CPU** | Low | Event-driven, non-blocking |
| **Network** | Moderate | Real-time connections (planned for) |
| **Database** | Low | Efficient queries with indexes |

## Monitoring Integration

### Existing Monitoring (Winston + Morgan)

```typescript
// HTTP endpoints automatically logged by Morgan (existing)
GET /v1/employee/chat/rooms -> 200 (125ms)

// Application logs via Winston (existing pattern)
logger.info('Chat message sent', {
  roomId,
  senderId,
  messageLength: content.length
});
```

### New Metrics to Track

- WebSocket connection count
- Messages sent per second
- Average message delivery time
- Active chat rooms
- Socket errors

## Summary Comparison

### What Stays the Same ✅

- Layered architecture pattern
- Dependency injection approach
- Authentication mechanism (JWT)
- Validation approach (Joi)
- Error handling (ApiError)
- Logging (Winston/Morgan)
- Testing framework (Jest)
- API documentation (Swagger)
- Database ORM (Prisma)
- Coding style and conventions

### What's New 🆕

- WebSocket server (Socket.IO) - **Only** new infrastructure
- Real-time event handling
- 3 new database models (ChatRoom, ChatMessage, ChatParticipant)
- Socket authentication middleware
- WebSocket event controller

### Integration Benefits

✅ **Consistency**: Follows all existing patterns
✅ **Maintainability**: Same code structure as existing features
✅ **Familiarity**: Team already knows the patterns
✅ **Safety**: Zero breaking changes
✅ **Testability**: Same testing approach
✅ **Documentation**: Same Swagger approach
✅ **Scalability**: Built on proven architecture

## Conclusion

The employee chat system is designed to **seamlessly integrate** with RoomMaster's existing architecture:

- **No architectural changes** required
- **Follows all existing patterns** and conventions
- **Zero breaking changes** to existing functionality
- **Natural extension** of the current system
- **Same development workflow** as other features

The only new infrastructure component is Socket.IO for real-time communication, which is isolated and doesn't affect existing REST APIs.

---

**Document Purpose**: Demonstrate architectural consistency and integration approach

**Last Updated**: 2026-01-14
