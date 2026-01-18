# Employee Chat System - Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EMPLOYEE CLIENT APP                          │
│                    (Mobile / Web Application)                        │
└────────────────┬────────────────────────────────┬───────────────────┘
                 │                                │
          HTTP REST API                    WebSocket (Socket.IO)
                 │                                │
                 ▼                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                          EXPRESS SERVER                             │
│  ┌──────────────────────┐         ┌──────────────────────┐        │
│  │   HTTP Endpoints     │         │  Socket.IO Server     │        │
│  │  /employee/chat/*    │         │  (Real-time Events)   │        │
│  └──────────┬───────────┘         └──────────┬───────────┘        │
│             │                                 │                     │
│             └─────────────────┬───────────────┘                     │
│                               ▼                                     │
│                    ┌──────────────────────┐                        │
│                    │   ChatService        │                        │
│                    │  (Business Logic)    │                        │
│                    └──────────┬───────────┘                        │
└───────────────────────────────┼─────────────────────────────────────┘
                                ▼
                    ┌──────────────────────┐
                    │    Prisma ORM        │
                    └──────────┬───────────┘
                                ▼
                    ┌──────────────────────┐
                    │   PostgreSQL DB      │
                    │  - ChatRoom          │
                    │  - ChatMessage       │
                    │  - ChatParticipant   │
                    └──────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────┐
│    Employee     │
│─────────────────│         ┌──────────────────────┐
│ id (PK)         │◄────────│  ChatParticipant     │
│ name            │ 1     * │──────────────────────│
│ username        │         │ id (PK)              │
│ password        │         │ chatRoomId (FK)      │
│ roleId          │         │ employeeId (FK)      │
└─────────┬───────┘         │ lastReadAt           │
          │                 │ joinedAt             │
          │ 1               └──────────┬───────────┘
          │                            │ *
          │                            │
          │                            │ 1
          │                 ┌──────────▼───────────┐
          │            *  1 │     ChatRoom         │
          │ creates         │──────────────────────│
          └────────────────►│ id (PK)              │
                            │ name                 │
                            │ type (DIRECT/GROUP)  │
                            │ createdById (FK)     │
                            │ isActive             │
                            └──────────┬───────────┘
                                       │ 1
                                       │
                                       │ *
                            ┌──────────▼───────────┐
         ┌──────────────────│   ChatMessage        │
         │ 1                │──────────────────────│
         │ sends            │ id (PK)              │
  ┌──────┴──────┐           │ chatRoomId (FK)      │
  │  Employee   │           │ senderId (FK)        │
  │─────────────│       *   │ content              │
  │ id (PK)     │◄──────────│ messageType          │
  └─────────────┘           │ isEdited             │
                            │ isDeleted            │
                            │ createdAt            │
                            └──────────────────────┘
```

## Message Flow - Real-time Chat

### Scenario: Employee A sends message to Employee B

```
┌─────────────┐                                      ┌─────────────┐
│ Employee A  │                                      │ Employee B  │
│   Client    │                                      │   Client    │
└──────┬──────┘                                      └──────▲──────┘
       │                                                    │
       │ 1. emit('chat:message', {...})                    │
       │                                                    │
       ▼                                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      Socket.IO Server                            │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 2. Authenticate Socket                                │      │
│  │ 3. Validate: Is Employee A participant in room?       │      │
│  └───────────────────────┬───────────────────────────────┘      │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ ChatSocketController                                   │      │
│  │ 4. Handle 'chat:message' event                         │      │
│  └───────────────────────┬───────────────────────────────┘      │
└────────────────────────────┼─────────────────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   ChatService        │
                  │ 5. sendMessage()     │
                  │    - Validate input  │
                  │    - Save to DB      │
                  │    - Return message  │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Prisma/Database    │
                  │ 6. INSERT message    │
                  └──────────┬───────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Socket.IO Server                            │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 7. Emit to room: io.to('room:xyz').emit(...)          │      │
│  └───────────────────────┬───────────┬───────────────────┘      │
└────────────────────────────┼───────────┼─────────────────────────┘
                             │           │
       8. Acknowledge        │           │ 9. Broadcast
          to sender          │           │    to all participants
                             ▼           ▼
                      ┌─────────────┐ ┌─────────────┐
                      │ Employee A  │ │ Employee B  │
                      │   Client    │ │   Client    │
                      └─────────────┘ └─────────────┘
                             │           │
                             │           │
                             ▼           ▼
                      Message displayed  Message displayed
                      in chat UI         in chat UI
```

## Authentication Flow - WebSocket Connection

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Connect with JWT token
       │    socket.connect({
       │      auth: { token: 'jwt...' }
       │    })
       │
       ▼
┌─────────────────────────────────────────┐
│      Socket.IO Server                   │
│  ┌──────────────────────────────────┐   │
│  │  socketAuthMiddleware            │   │
│  │  2. Extract token from handshake │   │
│  └───────────┬──────────────────────┘   │
│              ▼                           │
│  ┌──────────────────────────────────┐   │
│  │  3. Verify JWT token             │   │
│  │     - Check signature             │   │
│  │     - Check expiration            │   │
│  └───────────┬──────────────────────┘   │
│              ▼                           │
│  ┌──────────────────────────────────┐   │
│  │  4. Query database               │   │
│  │     - Get employee by ID          │   │
│  │     - Verify active status        │   │
│  └───────────┬──────────────────────┘   │
│              ▼                           │
│  ┌──────────────────────────────────┐   │
│  │  5. Attach employee to socket    │   │
│  │     socket.data.employee = {...} │   │
│  └───────────┬──────────────────────┘   │
└──────────────┼───────────────────────────┘
               ▼
        ┌─────────────┐
        │ Connection  │
        │  Success    │
        └─────────────┘
```

## REST API Flow - Get Message History

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ GET /v1/employee/chat/rooms/:roomId/messages
       │ Authorization: Bearer <jwt-token>
       │ Query: ?limit=50&before=msg_xyz
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Middleware                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. authEmployee() - Verify JWT & load employee     │     │
│  └───────────────────────┬────────────────────────────┘     │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 2. validate() - Check query params                 │     │
│  └───────────────────────┬────────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              EmployeeChatController                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 3. getChatRoomMessages()                           │     │
│  │    - Extract roomId from params                    │     │
│  │    - Extract employeeId from req.employee          │     │
│  └───────────────────────┬────────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   ChatService        │
                  │ 4. getMessages()     │
                  │    - Check permission │
                  │    - Query database   │
                  │    - Apply pagination │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Prisma Client      │
                  │ 5. findMany()        │
                  │    WHERE roomId      │
                  │    WHERE createdAt   │
                  │    ORDER BY DESC     │
                  │    TAKE limit        │
                  └──────────┬───────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response                                  │
│  {                                                           │
│    messages: [                                               │
│      {                                                       │
│        id: "msg_123",                                        │
│        content: "Hello!",                                    │
│        senderId: "emp_456",                                  │
│        sender: { name: "John" },                             │
│        createdAt: "2026-01-14T10:30:00Z"                     │
│      },                                                      │
│      ...                                                     │
│    ],                                                        │
│    hasMore: true,                                            │
│    nextCursor: "msg_100"                                     │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Room Types

### Direct Chat (1-on-1)

```
┌──────────────────────────────────────┐
│          ChatRoom                    │
│──────────────────────────────────────│
│ id: "room_abc"                       │
│ type: DIRECT                         │
│ name: null                           │
│ createdById: "emp_1"                 │
└───────────────┬──────────────────────┘
                │
                │ has 2 participants
                │
    ┌───────────┴───────────┐
    ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│ ChatParticipant │   │ ChatParticipant │
│─────────────────│   │─────────────────│
│ employeeId:     │   │ employeeId:     │
│ "emp_1"         │   │ "emp_2"         │
└─────────────────┘   └─────────────────┘
```

### Group Chat (Multiple participants)

```
┌──────────────────────────────────────┐
│          ChatRoom                    │
│──────────────────────────────────────│
│ id: "room_xyz"                       │
│ type: GROUP                          │
│ name: "Frontend Team"                │
│ createdById: "emp_1"                 │
└───────────────┬──────────────────────┘
                │
                │ has N participants
                │
    ┌───────────┼───────────┬─────────┐
    ▼           ▼           ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Part. 1 │ │ Part. 2 │ │ Part. 3 │ │ Part. N │
│─────────│ │─────────│ │─────────│ │─────────│
│ emp_1   │ │ emp_2   │ │ emp_3   │ │ emp_n   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Message States

```
┌─────────────────┐
│  New Message    │
│  isEdited:false │
│  isDeleted:false│
└────────┬────────┘
         │
         │ User edits
         ▼
┌─────────────────┐
│ Edited Message  │
│ isEdited: true  │
│ editedAt: Date  │
│ isDeleted:false │
└────────┬────────┘
         │
         │ User deletes
         ▼
┌─────────────────┐
│ Deleted Message │
│ isEdited: true  │
│ isDeleted: true │
│ deletedAt: Date │
│ content: ""     │← Content cleared
└─────────────────┘
```

## Typing Indicator Flow

```
Employee A                    Server                    Employee B
    │                            │                            │
    │ 1. User types              │                            │
    │───────────────────────────►│                            │
    │ emit('chat:typing',{       │                            │
    │   roomId, isTyping:true    │                            │
    │ })                         │                            │
    │                            │ 2. Broadcast to room       │
    │                            │───────────────────────────►│
    │                            │ emit('chat:typing',{       │
    │                            │   employeeName: "John",    │
    │                            │   isTyping: true           │
    │                            │ })                         │
    │                            │                            │
    │                            │                            │ 3. Show indicator
    │                            │                            │ "John is typing..."
    │                            │                            │
    │ 4. User stops (3s timeout) │                            │
    │───────────────────────────►│                            │
    │ emit('chat:typing',{       │                            │
    │   roomId, isTyping:false   │                            │
    │ })                         │                            │
    │                            │ 5. Broadcast               │
    │                            │───────────────────────────►│
    │                            │                            │ 6. Hide indicator
    │                            │                            │
```

## Scalability - Multi-Server Setup (Future)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Client 1   │  │  Client 2   │  │  Client 3   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       │ WS             │ WS             │ WS
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Server 1    │ │  Server 2    │ │  Server 3    │
│  (Node.js)   │ │  (Node.js)   │ │  (Node.js)   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
         Pub/Sub via Redis Adapter
                        │
                        ▼
              ┌──────────────────┐
              │   Redis Server   │
              │  (Message Broker)│
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │   (Persistence)  │
              └──────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Transport Security (HTTPS/WSS)                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Authentication (JWT Token)                    │
│  - Verify token signature                               │
│  - Check expiration                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Authorization (Room Access)                   │
│  - Check if user is participant                         │
│  - Verify room permissions                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Input Validation                              │
│  - Joi schema validation                                │
│  - Content length check                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 5: Input Sanitization                            │
│  - XSS prevention                                       │
│  - HTML encoding                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 6: Rate Limiting                                 │
│  - Max 10 messages per 10 seconds                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
               Process Request
```

---

**Document Purpose**: Visual reference for understanding the employee chat system architecture, data flow, and security model.

**Last Updated**: 2026-01-14
