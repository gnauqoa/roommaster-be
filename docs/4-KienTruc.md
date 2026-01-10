# Tài liệu Kiến trúc Hệ thống

# Chương 4

## 4.1. Giới thiệu

**RoomMaster Backend** là một máy chủ API RESTful phục vụ cho hệ thống quản lý khách sạn/phòng nghỉ. Hệ thống được xây dựng trên nền tảng **Node.js** với ngôn ngữ **TypeScript**, sử dụng framework **Express** và **Prisma ORM** để tương tác với cơ sở dữ liệu.

Ứng dụng tuân theo **kiến trúc phân tầng (Layered Architecture)** kết hợp với **hệ thống Dependency Injection (DI)** tùy chỉnh, lấy cảm hứng từ các pattern của NestJS, giúp mã nguồn dễ bảo trì, mở rộng và kiểm thử.

## 4.2. Các tính năng chính

| Tính năng                 | Mô tả chi tiết                                                                |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Xác thực đa đối tượng** | Hỗ trợ đăng nhập cho cả Khách hàng (Customer) và Nhân viên (Employee) với JWT |
| **Quản lý đặt phòng**     | Tạo, xác nhận, hủy booking với tự động phân bổ phòng                          |
| **Check-in/Check-out**    | Quản lý quá trình nhận/trả phòng với theo dõi trạng thái chi tiết             |
| **Giao dịch tài chính**   | Quản lý tiền đặt cọc, thanh toán, hoàn tiền                                   |
| **Sử dụng dịch vụ**       | Theo dõi các dịch vụ khách hàng sử dụng (spa, giặt ủi, minibar...)            |
| **Lịch sử hoạt động**     | Ghi nhận đầy đủ lịch sử thay đổi booking (audit trail)                        |

---

## 4.3. Công nghệ sử dụng

### 4.3.1. Bảng tổng hợp công nghệ

| Danh mục            | Công nghệ         | Mô tả                                                  |
| ------------------- | ----------------- | ------------------------------------------------------ |
| **Runtime**         | Node.js           | Môi trường chạy JavaScript phía server                 |
| **Ngôn ngữ**        | TypeScript        | JavaScript với kiểu dữ liệu tĩnh, tăng độ an toàn code |
| **Framework**       | Express.js        | Framework web nhẹ, linh hoạt cho Node.js               |
| **ORM**             | Prisma            | ORM thế hệ mới với type-safe và auto-generated queries |
| **Database**        | PostgreSQL        | Hệ quản trị CSDL quan hệ mạnh mẽ, hỗ trợ JSON          |
| **Xác thực**        | Passport.js + JWT | Xác thực người dùng với JSON Web Token                 |
| **Validation**      | Joi               | Thư viện validate dữ liệu đầu vào mạnh mẽ              |
| **Tài liệu API**    | Swagger (OpenAPI) | Tự động sinh tài liệu API tương tác                    |
| **Logging**         | Winston + Morgan  | Ghi log ứng dụng và HTTP request                       |
| **Process Manager** | PM2               | Quản lý process Node.js trong production               |
| **Container**       | Docker            | Đóng gói và triển khai ứng dụng                        |

### 4.3.2. Lý do lựa chọn

- **TypeScript**: Giúp phát hiện lỗi sớm trong quá trình phát triển, hỗ trợ IDE tốt hơn với auto-complete và refactoring
- **Prisma**: Cung cấp type-safety cho database queries, migrations dễ quản lý, schema định nghĩa rõ ràng
- **Express**: Đơn giản, cộng đồng lớn, nhiều middleware có sẵn
- **PostgreSQL**: Hỗ trợ tốt cho dữ liệu quan hệ phức tạp, JSON fields, và transactions

---

## 4.4. Kiến trúc phân tầng

### 4.4.1. Tổng quan kiến trúc

Ứng dụng được thiết kế theo **kiến trúc 5 tầng**, mỗi tầng có trách nhiệm riêng biệt:

```
┌─────────────────────────────────────────────────────────────┐
│                     ROUTES LAYER                            │
│  Định nghĩa endpoint, tài liệu Swagger, gắn middleware      │
├─────────────────────────────────────────────────────────────┤
│                   MIDDLEWARE LAYER                          │
│  Xác thực, Validation, Rate Limiting, Xử lý lỗi, XSS        │
├─────────────────────────────────────────────────────────────┤
│                   CONTROLLER LAYER                          │
│  Xử lý HTTP request, định dạng response                     │
├─────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                            │
│  Logic nghiệp vụ, tương tác database qua Prisma             │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                               │
│  Prisma ORM, PostgreSQL Database                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.4.2. Chi tiết từng tầng

| Tầng           | Thư mục            | Trách nhiệm                                                                  | Ví dụ                                |
| -------------- | ------------------ | ---------------------------------------------------------------------------- | ------------------------------------ |
| **Routes**     | `src/routes/`      | Định nghĩa các API endpoint, gắn middleware vào route, viết tài liệu Swagger | `auth.route.ts`, `booking.route.ts`  |
| **Middleware** | `src/middlewares/` | Xử lý các concern xuyên suốt: xác thực, validation, xử lý lỗi, bảo mật       | `auth.ts`, `validate.ts`, `error.ts` |
| **Controller** | `src/controllers/` | Nhận HTTP request, gọi service tương ứng, format và trả về response          | `auth.controller.ts`                 |
| **Service**    | `src/services/`    | Chứa toàn bộ logic nghiệp vụ, thao tác database, áp dụng business rules      | `booking.service.ts`                 |
| **Data**       | `prisma/`          | Định nghĩa schema database, quản lý migrations, Prisma Client                | `schema.prisma`                      |

### 4.4.3. Nguyên tắc thiết kế

1. **Separation of Concerns**: Mỗi tầng chỉ làm một việc, không xử lý logic của tầng khác
2. **Dependency Direction**: Tầng trên phụ thuộc tầng dưới, không ngược lại
3. **Single Responsibility**: Mỗi file/class chỉ có một lý do để thay đổi
4. **Interface Segregation**: Controller không biết cách service truy vấn database

---

## 4.5. Vòng đời xử lý Request

### 4.5.1. Các bước xử lý

Một request điển hình sẽ đi qua các giai đoạn sau:

| Bước | Vị trí                            | Mô tả chi tiết                                                                     |
| ---- | --------------------------------- | ---------------------------------------------------------------------------------- |
| 1    | `src/app.ts`                      | Express nhận HTTP request từ client                                                |
| 2    | Global Middlewares                | Chạy qua helmet (bảo mật), cors, body parsing, morgan (logging)                    |
| 3    | `src/routes/v1/`                  | Khớp route với URL pattern                                                         |
| 4    | Route Middlewares                 | Chạy `authCustomer()`/`authEmployee()` để xác thực, `validate()` để kiểm tra input |
| 5    | `src/controllers/`                | Controller method xử lý request                                                    |
| 6    | `src/services/`                   | Service method thực thi logic nghiệp vụ                                            |
| 7    | Prisma                            | Thực hiện truy vấn database                                                        |
| 8    | `responseWrapper`                 | Format response chuẩn `{ success: true, data: {...} }`                             |
| 9    | `errorConverter` + `errorHandler` | Bắt và xử lý lỗi (nếu có)                                                          |

### 4.5.2. Luồng xử lý thành công

```
Client Request → Express → Global MW → Route Match → Auth MW → Validate MW
    → Controller → Service → Prisma → Database
    ← Data ← Processed Data ← JSON Response ← Client
```

### 4.5.3. Luồng xử lý lỗi

```
Bất kỳ tầng nào throw Error → errorConverter (chuyển thành ApiError)
    → errorHandler (log + format response) → Client nhận { code, message }
```

---

## 4.6. Hệ thống Dependency Injection

### 4.6.1. Tổng quan

Ứng dụng sử dụng **DI Container tùy chỉnh** (`src/core/container.ts`) cung cấp tính năng dependency injection tương tự NestJS cho ứng dụng Express.

**Lợi ích của DI:**

- **Loose coupling**: Các class không phụ thuộc trực tiếp vào nhau
- **Dễ test**: Có thể mock dependencies khi unit test
- **Tái sử dụng**: Services được khởi tạo một lần và dùng chung
- **Quản lý lifecycle**: Container quản lý việc khởi tạo và cache instances

### 4.6.2. Các thành phần

| Thành phần     | File                     | Mục đích                                            |
| -------------- | ------------------------ | --------------------------------------------------- |
| **Container**  | `src/core/container.ts`  | Singleton container quản lý providers và instances  |
| **Decorators** | `src/core/decorators.ts` | Các decorator `@Injectable()` và `@Inject()`        |
| **Bootstrap**  | `src/core/bootstrap.ts`  | Đăng ký tất cả services khi khởi động ứng dụng      |
| **Tokens**     | `src/core/container.ts`  | Các Symbol dùng để định danh dependency (type-safe) |

### 4.6.3. Các cách đăng ký

```typescript
// 1. Value provider - Đăng ký một instance có sẵn (VD: PrismaClient)
container.registerValue(TOKENS.PrismaClient, prisma);

// 2. Factory provider - Đăng ký service với dependencies
container.registerFactory(
  TOKENS.AuthService, // Token định danh
  (...args) => new AuthService(args[0], args[1], args[2], args[3]), // Factory function
  [TOKENS.PrismaClient, TOKENS.TokenService, TOKENS.CustomerService, TOKENS.EmployeeService] // Dependencies
);
```

### 4.6.4. Cách sử dụng (Resolution)

```typescript
// Trong routes, resolve dependencies từ container
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const controller = new SomeController(authService);
```

### 4.6.5. Biểu đồ phụ thuộc Services

```
PrismaClient (Gốc - không có dependency)
    │
    ├── TokenService         (cần PrismaClient)
    ├── CustomerService      (cần PrismaClient)
    ├── EmployeeService      (cần PrismaClient)
    ├── BookingService       (cần PrismaClient)
    ├── RoomService          (cần PrismaClient)
    ├── RoomTypeService      (cần PrismaClient)
    ├── ServiceService       (cần PrismaClient)
    └── TransactionService   (cần PrismaClient)

AuthService (cần nhiều dependencies)
    ├── PrismaClient
    ├── TokenService
    ├── CustomerService
    └── EmployeeService
```

---

## 4.7. Xác thực và Phân quyền

### 4.7.1. Cấu trúc JWT Token

Hệ thống sử dụng **JWT (JSON Web Token)** để xác thực người dùng. Mỗi token chứa các thông tin:

```typescript
{
  sub: string; // ID người dùng (customer hoặc employee)
  userType: 'customer' | 'employee'; // Loại người dùng
  type: 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD'; // Loại token
  iat: number; // Thời điểm tạo (issued at)
  exp: number; // Thời điểm hết hạn (expiration)
}
```

### 4.7.2. Các loại Token

| Loại Token         | Thời hạn | Mục đích                                                          |
| ------------------ | -------- | ----------------------------------------------------------------- |
| **ACCESS**         | 30 phút  | Dùng để gọi API, gửi trong header `Authorization: Bearer <token>` |
| **REFRESH**        | 30 ngày  | Dùng để lấy access token mới khi hết hạn                          |
| **RESET_PASSWORD** | 10 phút  | Dùng cho chức năng đặt lại mật khẩu                               |

### 4.7.3. Luồng xác thực

1. **Đăng nhập** → Validate credentials → Sinh cặp access + refresh tokens
2. **Gọi API bảo vệ** → Trích xuất JWT từ header `Authorization: Bearer <token>`
3. **Passport xác minh** → Kiểm tra chữ ký token, xác định userType
4. **Middleware kiểm tra** → Đảm bảo userType khớp với route requirement
5. **Gắn user vào request** → `req.customer` hoặc `req.employee`

### 4.7.4. Xác thực hai loại người dùng

Hệ thống hỗ trợ **hai loại người dùng riêng biệt** với routes và middleware khác nhau:

| Loại User    | Prefix Routes   | Middleware       | Property trong Request |
| ------------ | --------------- | ---------------- | ---------------------- |
| **Customer** | `/v1/customer/` | `authCustomer()` | `req.customer`         |
| **Employee** | `/v1/employee/` | `authEmployee()` | `req.employee`         |

### 4.7.5. Phân quyền (Authorization)

Sau khi xác thực, hệ thống kiểm tra quyền của user:

- **Customer**: Chỉ được truy cập dữ liệu của chính mình
- **Employee**: Phân quyền theo role (Admin, Receptionist, Housekeeping...)
  - **Admin**: Toàn quyền trên hệ thống
  - **Receptionist**: Quản lý booking, check-in/out, giao dịch
  - **Housekeeping**: Cập nhật trạng thái phòng (cleaning)

---

## 4.8. Cơ sở dữ liệu

### 4.8.1. Tổng quan các Entity

| Entity                | Mô tả                                                   | Quan hệ chính                               |
| --------------------- | ------------------------------------------------------- | ------------------------------------------- |
| **Employee**          | Nhân viên khách sạn (Admin, Receptionist, Housekeeping) | → Transactions, BookingHistory              |
| **Customer**          | Khách hàng đặt phòng                                    | → Bookings, BookingCustomers                |
| **RoomType**          | Loại phòng với giá và tiện nghi                         | → Rooms, BookingRooms                       |
| **Room**              | Phòng vật lý trong khách sạn                            | → BookingRooms                              |
| **Booking**           | Bản ghi đặt phòng                                       | → BookingRooms, Transactions, ServiceUsages |
| **BookingRoom**       | Phân bổ phòng trong booking                             | → Transactions, ServiceUsages               |
| **BookingCustomer**   | Gán khách vào booking/phòng                             | M:N Customer ↔ Booking                      |
| **Transaction**       | Bản ghi giao dịch thanh toán                            | → TransactionDetails                        |
| **TransactionDetail** | Chi tiết từng khoản trong giao dịch                     | → BookingRoom, ServiceUsage                 |
| **Service**           | Dịch vụ khách sạn (spa, giặt ủi...)                     | → ServiceUsages                             |
| **ServiceUsage**      | Bản ghi sử dụng dịch vụ                                 | → TransactionDetails                        |
| **BookingHistory**    | Log kiểm toán (audit log)                               | → Booking, Employee                         |
| **Activity**          | Log hoạt động hệ thống                                  | Metadata JSON                               |

## 4.9. Xử lý lỗi

### 4.9.1. Luồng xử lý lỗi

```
Bất kỳ tầng nào throw ApiError hoặc Error
                    ↓
        errorConverter middleware
  (Chuyển đổi thành ApiError nếu chưa phải)
                    ↓
        errorHandler middleware
  (Format response, log lỗi ở dev, ẩn stack ở prod)
                    ↓
    JSON response: { code, message, [stack] }
```

### 4.9.2. Lớp ApiError

```typescript
class ApiError extends Error {
  statusCode: number; // HTTP status code (400, 401, 403, 404, 500...)
  isOperational: boolean; // true = lỗi mong đợi, false = lỗi lập trình
}

// Ví dụ sử dụng
throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
throw new ApiError(httpStatus.UNAUTHORIZED, 'Token không hợp lệ');
throw new ApiError(httpStatus.BAD_REQUEST, 'Dữ liệu không hợp lệ');
```

### 4.9.3. Phân loại lỗi

| Loại lỗi                 | isOperational | Xử lý                             |
| ------------------------ | ------------- | --------------------------------- |
| **Validation error**     | true          | Trả về 400 với message chi tiết   |
| **Authentication error** | true          | Trả về 401                        |
| **Authorization error**  | true          | Trả về 403                        |
| **Not found**            | true          | Trả về 404                        |
| **Business logic error** | true          | Trả về 400/409 tùy context        |
| **Database error**       | false         | Trả về 500, log chi tiết          |
| **Unexpected error**     | false         | Trả về 500, không expose chi tiết |

### 4.9.4. Response format

**Development:**

```json
{
  "code": 400,
  "message": "Phòng đã được đặt trong khoảng thời gian này",
  "stack": "Error: Phòng đã được đặt...\n    at BookingService.create..."
}
```

**Production:**

```json
{
  "code": 400,
  "message": "Phòng đã được đặt trong khoảng thời gian này"
}
```

---

## 4.10. Mô hình hóa kiến trúc

### 4.10.1 Kiến trúc tổng quan (High-Level Architecture)

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

### 4.10.2. Vòng đời Request (Request Lifecycle Sequence)

Sơ đồ tuần tự này minh họa chi tiết các bước xử lý một HTTP request từ client đến database và ngược lại.

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

### 4.10.3. Dependency Injection Container

Sơ đồ này thể hiện cấu trúc của DI Container và cách các services được đăng ký, quản lý.

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

### 4.10.4. Sơ đồ quan hệ thực thể (Entity Relationship Diagram)

Sơ đồ ERD chi tiết các bảng trong database và mối quan hệ giữa chúng.

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

### 4.10.5. Luồng xác thực (Authentication Flow)

Sơ đồ chi tiết quá trình đăng nhập và xác thực người dùng (Customer/Employee).

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

### 4.10.6. Máy trạng thái Booking (Booking State Machine)

Sơ đồ thể hiện các trạng thái của một Booking và điều kiện chuyển đổi giữa chúng.

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
  Trạng thái ban đầu khi
  booking được tạo
end note

note right of CHECKED_IN
  Ít nhất một phòng
  đã nhận khách (actualCheckIn)
end note

note bottom of PARTIALLY_CHECKED_OUT
  Một số phòng đã trả
  nhưng chưa trả hết
end note

@enduml
```

### 4.10.7. Máy trạng thái Room (Room Status State Machine)

Sơ đồ thể hiện các trạng thái của phòng và điều kiện chuyển đổi.

```plantuml
@startuml Room Status State Machine
!theme plain

title Room Status State Machine

[*] --> AVAILABLE : Trạng thái ban đầu

AVAILABLE --> RESERVED : Booking được xác nhận
RESERVED --> OCCUPIED : Khách check-in
RESERVED --> AVAILABLE : Booking bị hủy

OCCUPIED --> CLEANING : Khách check-out
CLEANING --> AVAILABLE : Dọn dẹp xong
CLEANING --> MAINTENANCE : Phát hiện hư hỏng

MAINTENANCE --> AVAILABLE : Bảo trì xong
MAINTENANCE --> OUT_OF_SERVICE : Cần sửa chữa lớn

OUT_OF_SERVICE --> MAINTENANCE : Bắt đầu sửa chữa
OUT_OF_SERVICE --> AVAILABLE : Đã giải quyết

note right of RESERVED
  Phòng đã được phân bổ
  cho booking đã xác nhận
end note

note right of OCCUPIED
  Khách đang lưu trú
  tại phòng
end note

@enduml
```

### 4.10.8. Kiến trúc Component (Component Architecture)

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

### 4.10.9. Phụ thuộc Package (Package Dependencies)

Sơ đồ thể hiện các thư viện npm được sử dụng trong dự án.

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

## 4.11. Cấu trúc thư mục

### 4.11.1. Tổng quan cấu trúc

```
src/
├── index.ts              # Entry point - khởi động server
├── app.ts                # Cấu hình Express app
├── prisma.ts             # Prisma client instance
│
├── config/               # Các module cấu hình
│   ├── env.ts            # Biến môi trường
│   ├── passport.ts       # JWT strategy cho Passport
│   ├── logger.ts         # Cấu hình Winston logger
│   ├── morgan.ts         # Logging HTTP request
│   ├── roles.ts          # Định nghĩa roles và permissions
│   └── swagger.ts        # Cấu hình Swagger UI
│
├── core/                 # DI & bootstrapping
│   ├── container.ts      # DI container & tokens
│   ├── bootstrap.ts      # Đăng ký tất cả services
│   ├── decorators.ts     # @Injectable, @Inject
│   └── index.ts          # Barrel export
│
├── routes/v1/            # Định nghĩa API routes
│   ├── index.ts          # Router chính, gộp tất cả routes
│   ├── customer/         # Routes cho khách hàng
│   │   ├── auth.route.ts
│   │   └── booking.route.ts
│   └── employee/         # Routes cho nhân viên
│       ├── auth.route.ts
│       ├── booking.route.ts
│       ├── room.route.ts
│       └── ...
│
├── middlewares/          # Express middlewares
│   ├── auth.ts           # authCustomer, authEmployee
│   ├── validate.ts       # Joi validation middleware
│   ├── error.ts          # Error converter & handler
│   ├── rateLimiter.ts    # Giới hạn request rate
│   └── xss.ts            # Bảo vệ XSS
│
├── controllers/          # Request handlers
│   ├── customer/         # Controllers cho customer
│   │   ├── auth.controller.ts
│   │   └── booking.controller.ts
│   └── employee/         # Controllers cho employee
│       ├── auth.controller.ts
│       ├── booking.controller.ts
│       └── ...
│
├── services/             # Business logic
│   ├── auth.service.ts       # Xác thực người dùng
│   ├── token.service.ts      # Quản lý JWT tokens
│   ├── customer.service.ts   # Quản lý khách hàng
│   ├── employee.service.ts   # Quản lý nhân viên
│   ├── booking.service.ts    # Logic đặt phòng
│   ├── room.service.ts       # Quản lý phòng
│   ├── roomType.service.ts   # Quản lý loại phòng
│   ├── service.service.ts    # Quản lý dịch vụ
│   ├── transaction.service.ts # Quản lý giao dịch
│   └── activity.service.ts   # Log hoạt động
│
├── validations/          # Joi schemas cho validation
│   ├── auth.validation.ts
│   ├── booking.validation.ts
│   ├── customer.validation.ts
│   └── ...
│
├── utils/                # Utility functions
│   ├── ApiError.ts       # Class lỗi tùy chỉnh
│   ├── catchAsync.ts     # Wrapper bắt lỗi async
│   ├── responseWrapper.ts # Format response chuẩn
│   └── ...
│
└── types/                # TypeScript type declarations
    ├── express.d.ts      # Extend Express types
    └── ...
```

### 4.11.2. Mô tả chi tiết các thư mục

| Thư mục          | Mô tả                                                             | Files quan trọng                    |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------- |
| **config/**      | Chứa tất cả cấu hình ứng dụng. Mỗi file cấu hình một aspect riêng | `env.ts` - đọc biến môi trường      |
| **core/**        | Hệ thống DI core của ứng dụng                                     | `container.ts` - DI container chính |
| **routes/**      | Định nghĩa endpoints, gắn middleware, viết Swagger docs           | Tách riêng customer/employee        |
| **middlewares/** | Xử lý cross-cutting concerns trước/sau controller                 | `auth.ts` - xác thực JWT            |
| **controllers/** | Nhận request, gọi service, trả response                           | Tách riêng theo loại user           |
| **services/**    | Toàn bộ business logic, không biết về HTTP                        | `booking.service.ts` - core logic   |
| **validations/** | Joi schemas validate input                                        | Một file cho mỗi domain             |
| **utils/**       | Helper functions dùng chung                                       | `ApiError.ts` - standard errors     |
| **types/**       | TypeScript declarations                                           | Extend Express Request type         |

---

## 4.12. Sơ đồ Use Case

### 4.12.1. Use Case: Quản lý Đặt phòng (Booking Management)

Sơ đồ này mô tả các chức năng liên quan đến việc đặt phòng trong hệ thống.

```plantuml
@startuml Use Case - Booking Management
!theme plain
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

title Use Case Diagram: Quản lý Đặt phòng (Booking)

actor "Khách hàng\n(Customer)" as Customer
actor "Lễ tân\n(Receptionist)" as Receptionist
actor "Quản trị viên\n(Admin)" as Admin

rectangle "Hệ thống Quản lý Đặt phòng" {
  ' Customer use cases
  usecase "Đăng ký tài khoản" as UC_Register
  usecase "Đăng nhập" as UC_Login
  usecase "Tìm kiếm phòng trống" as UC_SearchRoom
  usecase "Xem chi tiết loại phòng" as UC_ViewRoomType
  usecase "Tạo đặt phòng mới" as UC_CreateBooking
  usecase "Xem booking của mình" as UC_ViewMyBooking
  usecase "Hủy đặt phòng" as UC_CancelBooking
  usecase "Thanh toán đặt cọc" as UC_PayDeposit

  ' Receptionist use cases
  usecase "Xem tất cả booking" as UC_ViewAllBookings
  usecase "Xác nhận đặt phòng" as UC_ConfirmBooking
  usecase "Chỉnh sửa booking" as UC_EditBooking
  usecase "Phân bổ phòng" as UC_AllocateRoom
  usecase "Xử lý thanh toán" as UC_ProcessPayment
  usecase "Tạo booking cho khách" as UC_CreateBookingForCustomer

  ' Admin use cases
  usecase "Quản lý loại phòng" as UC_ManageRoomTypes
  usecase "Quản lý giá phòng" as UC_ManagePricing
  usecase "Xem báo cáo booking" as UC_ViewReports
}

' Customer associations
Customer --> UC_Register
Customer --> UC_Login
Customer --> UC_SearchRoom
Customer --> UC_ViewRoomType
Customer --> UC_CreateBooking
Customer --> UC_ViewMyBooking
Customer --> UC_CancelBooking
Customer --> UC_PayDeposit

' Receptionist associations
Receptionist --> UC_Login
Receptionist --> UC_ViewAllBookings
Receptionist --> UC_ConfirmBooking
Receptionist --> UC_EditBooking
Receptionist --> UC_CancelBooking
Receptionist --> UC_AllocateRoom
Receptionist --> UC_ProcessPayment
Receptionist --> UC_CreateBookingForCustomer
Receptionist --> UC_SearchRoom

' Admin associations (inherits from Receptionist)
Admin --> UC_ManageRoomTypes
Admin --> UC_ManagePricing
Admin --> UC_ViewReports
Admin --|> Receptionist : <<extends>>

' Include relationships
UC_CreateBooking ..> UC_SearchRoom : <<include>>
UC_CreateBooking ..> UC_PayDeposit : <<include>>
UC_ConfirmBooking ..> UC_AllocateRoom : <<include>>
UC_CreateBookingForCustomer ..> UC_AllocateRoom : <<include>>

' Extend relationships
UC_CancelBooking ..> UC_ProcessPayment : <<extend>>\nHoàn tiền

note right of UC_CreateBooking
  Tự động phân bổ phòng
  dựa trên loại phòng và
  số lượng yêu cầu
end note

note right of UC_ConfirmBooking
  Chỉ xác nhận khi
  đã nhận đủ tiền cọc
end note

@enduml
```

**Mô tả chi tiết các Use Case:**

| Use Case               | Actor                 | Mô tả                                                                        | Precondition                 |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| **Tạo đặt phòng mới**  | Customer              | Khách hàng chọn loại phòng, ngày check-in/out, số lượng khách và tạo booking | Đã đăng nhập, có phòng trống |
| **Xác nhận đặt phòng** | Receptionist          | Lễ tân xác nhận booking sau khi khách đặt cọc                                | Booking ở trạng thái PENDING |
| **Hủy đặt phòng**      | Customer/Receptionist | Hủy booking, hoàn tiền nếu đủ điều kiện                                      | Booking chưa check-in        |
| **Phân bổ phòng**      | Receptionist          | Gán phòng cụ thể cho booking                                                 | Booking đã được xác nhận     |

---

### 4.12.2. Use Case: Check-in

Sơ đồ này mô tả quy trình nhận phòng của khách hàng.

```plantuml
@startuml Use Case - Check-in
!theme plain
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

title Use Case Diagram: Quy trình Check-in

actor "Khách hàng\n(Customer)" as Customer
actor "Lễ tân\n(Receptionist)" as Receptionist
actor "Hệ thống\n(System)" as System

rectangle "Quy trình Check-in" {
  ' Main use cases
  usecase "Xác minh booking" as UC_VerifyBooking
  usecase "Kiểm tra thông tin khách" as UC_VerifyCustomer
  usecase "Xác minh đặt cọc" as UC_VerifyDeposit
  usecase "Gán khách vào phòng" as UC_AssignCustomerToRoom
  usecase "Thực hiện check-in" as UC_PerformCheckIn
  usecase "Cập nhật trạng thái phòng" as UC_UpdateRoomStatus
  usecase "Cập nhật trạng thái booking" as UC_UpdateBookingStatus
  usecase "Ghi nhận hoạt động" as UC_LogActivity
  usecase "In phiếu check-in" as UC_PrintCheckInSlip

  ' Additional use cases
  usecase "Thêm khách đi kèm" as UC_AddGuests
  usecase "Thu thêm tiền cọc" as UC_CollectExtraDeposit
  usecase "Nâng cấp phòng" as UC_UpgradeRoom
  usecase "Cung cấp thông tin CCCD" as UC_ProvideID
}

' Customer associations
Customer --> UC_ProvideID
Customer --> UC_VerifyBooking

' Receptionist associations
Receptionist --> UC_VerifyBooking
Receptionist --> UC_VerifyCustomer
Receptionist --> UC_VerifyDeposit
Receptionist --> UC_AssignCustomerToRoom
Receptionist --> UC_PerformCheckIn
Receptionist --> UC_AddGuests
Receptionist --> UC_CollectExtraDeposit
Receptionist --> UC_UpgradeRoom
Receptionist --> UC_PrintCheckInSlip

' System associations
System --> UC_UpdateRoomStatus
System --> UC_UpdateBookingStatus
System --> UC_LogActivity

' Include relationships
UC_PerformCheckIn ..> UC_VerifyBooking : <<include>>
UC_PerformCheckIn ..> UC_VerifyDeposit : <<include>>
UC_PerformCheckIn ..> UC_AssignCustomerToRoom : <<include>>
UC_PerformCheckIn ..> UC_UpdateRoomStatus : <<include>>
UC_PerformCheckIn ..> UC_UpdateBookingStatus : <<include>>
UC_PerformCheckIn ..> UC_LogActivity : <<include>>
UC_VerifyCustomer ..> UC_ProvideID : <<include>>

' Extend relationships
UC_PerformCheckIn ..> UC_AddGuests : <<extend>>
UC_PerformCheckIn ..> UC_CollectExtraDeposit : <<extend>>
UC_PerformCheckIn ..> UC_UpgradeRoom : <<extend>>

note right of UC_PerformCheckIn
  Cập nhật:
  - BookingRoom.status = CHECKED_IN
  - BookingRoom.actualCheckIn = now()
  - Room.status = OCCUPIED
  - Booking.status = CHECKED_IN
end note

note right of UC_AssignCustomerToRoom
  Tạo bản ghi BookingCustomer
  liên kết khách với phòng cụ thể
end note

note bottom of UC_UpdateRoomStatus
  Room chuyển từ RESERVED
  sang OCCUPIED
end note

@enduml
```

**Luồng xử lý Check-in:**

| Bước | Thực hiện bởi | Mô tả                                   | Trạng thái sau           |
| ---- | ------------- | --------------------------------------- | ------------------------ |
| 1    | Receptionist  | Tìm booking theo mã hoặc SĐT khách      | -                        |
| 2    | Receptionist  | Xác minh booking ở trạng thái CONFIRMED | -                        |
| 3    | Customer      | Cung cấp CCCD/CMND để xác minh          | -                        |
| 4    | Receptionist  | Kiểm tra tiền cọc đã đủ chưa            | -                        |
| 5    | Receptionist  | Gán khách vào từng phòng cụ thể         | BookingCustomer created  |
| 6    | Receptionist  | Thực hiện check-in                      | BookingRoom = CHECKED_IN |
| 7    | System        | Cập nhật trạng thái phòng               | Room = OCCUPIED          |
| 8    | System        | Cập nhật trạng thái booking             | Booking = CHECKED_IN     |
| 9    | System        | Ghi log hoạt động                       | Activity created         |

---

### 4.12.3. Use Case: Check-out

Sơ đồ này mô tả quy trình trả phòng của khách hàng.

```plantuml
@startuml Use Case - Check-out
!theme plain
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

title Use Case Diagram: Quy trình Check-out

actor "Khách hàng\n(Customer)" as Customer
actor "Lễ tân\n(Receptionist)" as Receptionist
actor "Housekeeping" as Housekeeping
actor "Hệ thống\n(System)" as System

rectangle "Quy trình Check-out" {
  ' Main use cases
  usecase "Yêu cầu check-out" as UC_RequestCheckOut
  usecase "Kiểm tra dịch vụ đã dùng" as UC_CheckServices
  usecase "Tính toán hóa đơn" as UC_CalculateBill
  usecase "Xử lý thanh toán" as UC_ProcessPayment
  usecase "Thực hiện check-out" as UC_PerformCheckOut
  usecase "Cập nhật trạng thái phòng" as UC_UpdateRoomStatus
  usecase "Cập nhật trạng thái booking" as UC_UpdateBookingStatus
  usecase "Ghi nhận hoạt động" as UC_LogActivity
  usecase "In hóa đơn" as UC_PrintInvoice

  ' Additional use cases
  usecase "Thêm phí dịch vụ" as UC_AddServiceCharge
  usecase "Hoàn tiền" as UC_Refund
  usecase "Gia hạn phòng" as UC_ExtendStay
  usecase "Check-out một phần" as UC_PartialCheckOut
  usecase "Dọn dẹp phòng" as UC_CleanRoom
  usecase "Cập nhật phòng sẵn sàng" as UC_MarkRoomReady
}

' Customer associations
Customer --> UC_RequestCheckOut
Customer --> UC_ProcessPayment

' Receptionist associations
Receptionist --> UC_RequestCheckOut
Receptionist --> UC_CheckServices
Receptionist --> UC_CalculateBill
Receptionist --> UC_ProcessPayment
Receptionist --> UC_PerformCheckOut
Receptionist --> UC_AddServiceCharge
Receptionist --> UC_Refund
Receptionist --> UC_ExtendStay
Receptionist --> UC_PartialCheckOut
Receptionist --> UC_PrintInvoice

' Housekeeping associations
Housekeeping --> UC_CleanRoom
Housekeeping --> UC_MarkRoomReady

' System associations
System --> UC_UpdateRoomStatus
System --> UC_UpdateBookingStatus
System --> UC_LogActivity

' Include relationships
UC_PerformCheckOut ..> UC_CheckServices : <<include>>
UC_PerformCheckOut ..> UC_CalculateBill : <<include>>
UC_PerformCheckOut ..> UC_ProcessPayment : <<include>>
UC_PerformCheckOut ..> UC_UpdateRoomStatus : <<include>>
UC_PerformCheckOut ..> UC_UpdateBookingStatus : <<include>>
UC_PerformCheckOut ..> UC_LogActivity : <<include>>
UC_CleanRoom ..> UC_MarkRoomReady : <<include>>

' Extend relationships
UC_PerformCheckOut ..> UC_Refund : <<extend>>\nNếu dư tiền
UC_PerformCheckOut ..> UC_AddServiceCharge : <<extend>>
UC_CalculateBill ..> UC_PartialCheckOut : <<extend>>

note right of UC_PerformCheckOut
  Cập nhật:
  - BookingRoom.status = CHECKED_OUT
  - BookingRoom.actualCheckOut = now()
  - Room.status = CLEANING
end note

note right of UC_CalculateBill
  Tổng = Tiền phòng + Dịch vụ
  Còn lại = Tổng - Đã thanh toán
end note

note right of UC_PartialCheckOut
  Chỉ check-out một số phòng
  Booking chuyển sang
  PARTIALLY_CHECKED_OUT
end note

note bottom of UC_CleanRoom
  Sau khi dọn xong,
  Room chuyển từ CLEANING
  sang AVAILABLE
end note

@enduml
```

**Luồng xử lý Check-out:**

| Bước | Thực hiện bởi         | Mô tả                                             | Trạng thái sau                                   |
| ---- | --------------------- | ------------------------------------------------- | ------------------------------------------------ |
| 1    | Customer/Receptionist | Yêu cầu check-out                                 | -                                                |
| 2    | Receptionist          | Kiểm tra dịch vụ đã sử dụng (minibar, giặt ủi...) | -                                                |
| 3    | System                | Tính toán tổng hóa đơn                            | -                                                |
| 4    | Customer              | Thanh toán số tiền còn lại                        | Transaction created                              |
| 5    | Receptionist          | Thực hiện check-out                               | BookingRoom = CHECKED_OUT                        |
| 6    | System                | Cập nhật phòng sang cleaning                      | Room = CLEANING                                  |
| 7    | System                | Cập nhật trạng thái booking                       | Booking = CHECKED_OUT hoặc PARTIALLY_CHECKED_OUT |
| 8    | Housekeeping          | Dọn dẹp phòng                                     | -                                                |
| 9    | Housekeeping          | Đánh dấu phòng sẵn sàng                           | Room = AVAILABLE                                 |

---

### 4.12.4. Use Case: Quản lý Người dùng (User Management)

Sơ đồ này mô tả các chức năng quản lý người dùng trong hệ thống.

```plantuml
@startuml Use Case - User Management
!theme plain
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

title Use Case Diagram: Quản lý Người dùng (User Management)

actor "Khách hàng\n(Customer)" as Customer
actor "Nhân viên\n(Employee)" as Employee
actor "Quản trị viên\n(Admin)" as Admin
actor "Hệ thống\n(System)" as System

rectangle "Quản lý Khách hàng (Customer)" {
  usecase "Đăng ký tài khoản" as UC_CustomerRegister
  usecase "Đăng nhập" as UC_CustomerLogin
  usecase "Xem thông tin cá nhân" as UC_CustomerViewProfile
  usecase "Cập nhật thông tin" as UC_CustomerUpdateProfile
  usecase "Đổi mật khẩu" as UC_CustomerChangePassword
  usecase "Quên mật khẩu" as UC_CustomerForgotPassword
  usecase "Xem lịch sử booking" as UC_CustomerViewHistory
}

rectangle "Quản lý Nhân viên (Employee)" {
  usecase "Đăng nhập nhân viên" as UC_EmployeeLogin
  usecase "Xem thông tin nhân viên" as UC_EmployeeViewProfile
  usecase "Cập nhật thông tin NV" as UC_EmployeeUpdateProfile
  usecase "Đổi mật khẩu NV" as UC_EmployeeChangePassword

  ' Admin only
  usecase "Tạo tài khoản nhân viên" as UC_CreateEmployee
  usecase "Xem danh sách nhân viên" as UC_ViewAllEmployees
  usecase "Phân quyền nhân viên" as UC_AssignRole
  usecase "Vô hiệu hóa tài khoản" as UC_DisableAccount
  usecase "Đặt lại mật khẩu NV" as UC_ResetEmployeePassword
}

rectangle "Quản lý Khách hàng bởi NV" {
  usecase "Tìm kiếm khách hàng" as UC_SearchCustomer
  usecase "Xem chi tiết khách hàng" as UC_ViewCustomerDetail
  usecase "Tạo khách hàng mới" as UC_CreateCustomer
  usecase "Cập nhật thông tin khách" as UC_UpdateCustomer
  usecase "Xem lịch sử booking của khách" as UC_ViewCustomerBookings
}

rectangle "Xác thực & Bảo mật" {
  usecase "Sinh JWT Token" as UC_GenerateToken
  usecase "Refresh Token" as UC_RefreshToken
  usecase "Đăng xuất" as UC_Logout
  usecase "Ghi log hoạt động" as UC_LogActivity
}

' Customer associations
Customer --> UC_CustomerRegister
Customer --> UC_CustomerLogin
Customer --> UC_CustomerViewProfile
Customer --> UC_CustomerUpdateProfile
Customer --> UC_CustomerChangePassword
Customer --> UC_CustomerForgotPassword
Customer --> UC_CustomerViewHistory
Customer --> UC_RefreshToken
Customer --> UC_Logout

' Employee associations
Employee --> UC_EmployeeLogin
Employee --> UC_EmployeeViewProfile
Employee --> UC_EmployeeUpdateProfile
Employee --> UC_EmployeeChangePassword
Employee --> UC_SearchCustomer
Employee --> UC_ViewCustomerDetail
Employee --> UC_CreateCustomer
Employee --> UC_UpdateCustomer
Employee --> UC_ViewCustomerBookings
Employee --> UC_RefreshToken
Employee --> UC_Logout

' Admin associations
Admin --> UC_CreateEmployee
Admin --> UC_ViewAllEmployees
Admin --> UC_AssignRole
Admin --> UC_DisableAccount
Admin --> UC_ResetEmployeePassword
Admin --|> Employee : <<extends>>

' System associations
System --> UC_GenerateToken
System --> UC_LogActivity

' Include relationships
UC_CustomerLogin ..> UC_GenerateToken : <<include>>
UC_EmployeeLogin ..> UC_GenerateToken : <<include>>
UC_CustomerRegister ..> UC_GenerateToken : <<include>>
UC_CustomerLogin ..> UC_LogActivity : <<include>>
UC_EmployeeLogin ..> UC_LogActivity : <<include>>

' Extend relationships
UC_CustomerForgotPassword ..> UC_GenerateToken : <<extend>>\nReset Password Token

note right of UC_CustomerRegister
  Yêu cầu:
  - Họ tên, SĐT (unique)
  - Mật khẩu (hash bcrypt)
  - Email (optional)
end note

note right of UC_CreateEmployee
  Chỉ Admin có quyền
  Gán role: ADMIN,
  RECEPTIONIST, HOUSEKEEPING
end note

note right of UC_GenerateToken
  Access Token: 30 phút
  Refresh Token: 30 ngày
end note

note bottom of UC_AssignRole
  Các role:
  - ADMIN: Toàn quyền
  - RECEPTIONIST: Booking, Check-in/out
  - HOUSEKEEPING: Cập nhật trạng thái phòng
end note

@enduml
```

**Mô tả chi tiết các Use Case Quản lý Người dùng:**

| Use Case              | Actor             | Mô tả                                 | Ghi chú                           |
| --------------------- | ----------------- | ------------------------------------- | --------------------------------- |
| **Đăng ký tài khoản** | Customer          | Tạo tài khoản mới với SĐT và mật khẩu | SĐT phải unique                   |
| **Đăng nhập**         | Customer/Employee | Xác thực và nhận JWT tokens           | Phân biệt customer/employee       |
| **Tạo nhân viên**     | Admin             | Tạo tài khoản nhân viên mới           | Gán role phù hợp                  |
| **Phân quyền**        | Admin             | Thay đổi role của nhân viên           | Admin, Receptionist, Housekeeping |
| **Đổi mật khẩu**      | Customer/Employee | Thay đổi mật khẩu đăng nhập           | Yêu cầu mật khẩu cũ               |
| **Quên mật khẩu**     | Customer          | Nhận email reset password             | Token có hiệu lực 10 phút         |

**Ma trận phân quyền:**

| Chức năng                  | Customer | Receptionist | Housekeeping | Admin |
| -------------------------- | :------: | :----------: | :----------: | :---: |
| Đăng ký/Đăng nhập          |    ✅    |      ✅      |      ✅      |  ✅   |
| Xem/Sửa thông tin cá nhân  |    ✅    |      ✅      |      ✅      |  ✅   |
| Tạo booking                |    ✅    |      ✅      |      ❌      |  ✅   |
| Quản lý booking            |    ❌    |      ✅      |      ❌      |  ✅   |
| Check-in/Check-out         |    ❌    |      ✅      |      ❌      |  ✅   |
| Quản lý khách hàng         |    ❌    |      ✅      |      ❌      |  ✅   |
| Cập nhật trạng thái phòng  |    ❌    |      ✅      |      ✅      |  ✅   |
| Quản lý nhân viên          |    ❌    |      ❌      |      ❌      |  ✅   |
| Quản lý loại phòng/dịch vụ |    ❌    |      ❌      |      ❌      |  ✅   |
| Xem báo cáo                |    ❌    |      ❌      |      ❌      |  ✅   |

---

## 4.13. Tổng kết

### 4.13.1. Lý do chọn kiến trúc

| Đặc điểm                       | Mô tả                                                             | Lợi ích                                 |
| ------------------------------ | ----------------------------------------------------------------- | --------------------------------------- |
| **Custom DI Container**        | Hệ thống dependency injection tự xây dựng, lấy cảm hứng từ NestJS | Services decoupled, dễ test, dễ mở rộng |
| **Xác thực kép**               | Hỗ trợ cả Customer và Employee với JWT riêng biệt                 | Bảo mật cao, phân quyền rõ ràng         |
| **Hệ thống Booking toàn diện** | Quản lý đặt phòng, phân bổ phòng, giao dịch, lịch sử              | Đáp ứng đầy đủ nghiệp vụ khách sạn      |
| **RESTful API chuẩn**          | Tuân thủ best practices với Swagger docs                          | Dễ tích hợp, dễ sử dụng                 |
| **Xử lý lỗi tập trung**        | Một điểm duy nhất xử lý tất cả lỗi                                | Consistent error responses              |
| **Production-ready**           | Logging, security headers, rate limiting                          | Sẵn sàng triển khai production          |

### 4.13.2. Nguyên tắc thiết kế đã áp dụng

1. **Separation of Concerns**: Mỗi layer/module có trách nhiệm rõ ràng
2. **Single Responsibility**: Mỗi class/function làm một việc
3. **Dependency Inversion**: High-level modules không phụ thuộc low-level modules
4. **DRY (Don't Repeat Yourself)**: Tái sử dụng code qua services và utilities
5. **KISS (Keep It Simple)**: Giữ code đơn giản, dễ hiểu

### 4.13.3. Hướng mở rộng

- **Thêm domain mới**: Tạo service, controller, routes mới theo pattern có sẵn
- **Thêm tính năng**: Business logic nằm trong services, không ảnh hưởng layers khác
- **Scale horizontal**: Stateless design, có thể chạy nhiều instances
- **Đổi database**: Chỉ cần thay đổi Prisma schema và migrations
- **Thêm authentication provider**: Mở rộng Passport strategies

_Tài liệu này được cập nhật lần cuối: Tháng 12, 2025_
