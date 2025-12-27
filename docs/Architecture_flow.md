# RoomMaster Backend - Kiến trúc Module Chi tiết

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [1. Routes (Định tuyến)](#1-routes-định-tuyến)
- [2. Middleware (Phần mềm trung gian)](#2-middleware-phần-mềm-trung-gian)
- [3. Controller (Bộ điều khiển)](#3-controller-bộ-điều-khiển)
- [4. Service (Dịch vụ nghiệp vụ)](#4-service-dịch-vụ-nghiệp-vụ)
- [5. Data Access (Truy cập dữ liệu)](#5-data-access-truy-cập-dữ-liệu)
- [6. DI-Core (Dependency Injection)](#6-di-core-dependency-injection)
- [Luồng xử lý Request](#luồng-xử-lý-request)

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GLOBAL MIDDLEWARE (app.ts)                      │
│         helmet | cors | json | urlencoded | morgan | xss             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         1. ROUTES LAYER                              │
│                    /v1/customer  |  /v1/employee                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       2. MIDDLEWARE LAYER                            │
│              authCustomer | authEmployee | validate                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       3. CONTROLLER LAYER                            │
│                   CustomerController | EmployeeController            │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        4. SERVICE LAYER                              │
│      AuthService | BookingService | TransactionService | ...         │
└─────────────────────────────────┬───────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      5. DATA ACCESS LAYER                            │
│                        Prisma ORM + PostgreSQL                       │
└─────────────────────────────────────────────────────────────────────┘

            ┌─────────────────────────────────────────┐
            │         6. DI-CORE (Container)          │
            │    Tiêm phụ thuộc vào tất cả các layer  │
            └─────────────────────────────────────────┘
```

---

## 1. Routes (Định tuyến)

### Vị trí
```
src/routes/v1/
├── index.ts                 # Router chính
├── customer/
│   ├── auth.route.ts        # Đăng nhập/đăng ký khách hàng
│   └── booking.route.ts     # Đặt phòng của khách
└── employee/
    ├── auth.route.ts        # Đăng nhập nhân viên
    ├── booking.route.ts     # Quản lý booking
    ├── room.route.ts        # Quản lý phòng
    └── ...
```

### Trách nhiệm

| Trách nhiệm | Mô tả |
|-------------|-------|
| **Định nghĩa endpoints** | Khai báo các đường dẫn API (GET, POST, PUT, DELETE) |
| **Gắn middleware** | Áp dụng xác thực và validation cho từng route |
| **Swagger documentation** | Định nghĩa tài liệu API thông qua JSDoc comments |
| **Phân luồng** | Tách biệt routes cho Customer và Employee |

### Các hoạt động chính

```typescript
// Ví dụ từ auth.route.ts
const router = express.Router();

// 1. Resolve dependencies từ DI Container
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const customerController = new CustomerController(authService, ...);

// 2. Định nghĩa route với middleware chain
router.post(
  '/login',
  validate(authValidation.login),    // Middleware validation
  customerController.login            // Controller handler
);

router.get(
  '/profile',
  authCustomer(),                     // Middleware xác thực
  customerController.getProfile
);
```

### Tương tác

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Express    │────►│    Routes    │────►│  Middleware  │
│   Server     │     │  (Matching)  │     │   (Chain)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Controller  │
                                          └──────────────┘
```

### Danh sách Routes chính

| Nhóm | Endpoint | Method | Mô tả |
|------|----------|--------|-------|
| **Customer Auth** | `/v1/customer/auth/register` | POST | Đăng ký tài khoản |
| | `/v1/customer/auth/login` | POST | Đăng nhập |
| | `/v1/customer/auth/profile` | GET | Xem hồ sơ |
| **Customer Booking** | `/v1/customer/bookings` | POST | Tạo booking |
| | `/v1/customer/bookings/:id` | GET | Xem chi tiết booking |
| **Employee Auth** | `/v1/employee/auth/login` | POST | Đăng nhập nhân viên |
| **Employee Booking** | `/v1/employee/bookings` | GET | Danh sách bookings |
| | `/v1/employee/bookings/check-in` | POST | Check-in khách |
| | `/v1/employee/bookings/check-out` | POST | Check-out khách |
| **Room Management** | `/v1/employee/rooms` | GET/POST | Quản lý phòng |
| **Transactions** | `/v1/employee/transactions` | POST | Tạo giao dịch |

---

## 2. Middleware (Phần mềm trung gian)

### Vị trí
```
src/middlewares/
├── auth.ts           # Xác thực JWT (authCustomer, authEmployee)
├── validate.ts       # Validation với Joi
├── error.ts          # Xử lý lỗi (errorConverter, errorHandler)
├── rateLimiter.ts    # Giới hạn request
└── xss.ts            # Bảo vệ XSS
```

### Trách nhiệm

| Middleware | File | Trách nhiệm |
|------------|------|-------------|
| **authCustomer** | `auth.ts` | Xác thực JWT cho khách hàng, gắn `req.customer` |
| **authEmployee** | `auth.ts` | Xác thực JWT cho nhân viên, gắn `req.employee` |
| **validate** | `validate.ts` | Kiểm tra `req.body`, `req.params`, `req.query` với Joi schema |
| **errorConverter** | `error.ts` | Chuyển đổi mọi lỗi thành `ApiError` chuẩn |
| **errorHandler** | `error.ts` | Định dạng và trả về JSON response lỗi |
| **authLimiter** | `rateLimiter.ts` | Giới hạn 20 requests/15 phút cho auth endpoints |
| **xss** | `xss.ts` | Sanitize dữ liệu đầu vào chống XSS |

### Các hoạt động chính

#### Authentication Middleware

```typescript
// auth.ts - Xác thực Customer
export const authCustomer = () => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, 
      verifyCustomerCallback(req, resolve, reject)
    )(req, res, next);
  })
  .then(() => next())
  .catch((err) => next(err));
};

const verifyCustomerCallback = (req, resolve, reject) => async (err, user, info) => {
  // 1. Kiểm tra lỗi xác thực
  if (err || info || !user) {
    return reject(new ApiError(401, 'Please authenticate'));
  }
  
  // 2. Lấy token và verify userType
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, config.jwt.secret);
  
  // 3. Đảm bảo userType là 'customer'
  if (decoded.userType !== 'customer') {
    return reject(new ApiError(403, 'Customer authentication required'));
  }
  
  // 4. Gắn thông tin user vào request
  req.customer = user;
  resolve();
};
```

#### Validation Middleware

```typescript
// validate.ts
const validate = (schema: object) => (req, res, next) => {
  // 1. Lọc các trường cần validate
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const obj = pick(req, Object.keys(validSchema));
  
  // 2. Thực hiện validation với Joi
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(obj);
  
  // 3. Trả về lỗi nếu validation fail
  if (error) {
    const errorMessage = error.details.map(d => d.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }
  
  // 4. Gán validated value vào request
  Object.assign(req, value);
  return next();
};
```

#### Error Handling Middleware

```typescript
// error.ts
export const errorConverter = (err, req, res, next) => {
  let error = err;
  
  // Chuyển đổi các loại lỗi khác thành ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 
      (error instanceof Prisma.PrismaClientKnownRequestError 
        ? 400 : 500);
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  // Ẩn chi tiết lỗi trong production
  if (config.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }
  
  res.status(statusCode).send({
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack })
  });
};
```

### Tương tác

```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   xss()       │───►│ authCustomer()│───►│  validate()   │
│  (Sanitize)   │    │ (JWT Check)   │    │ (Joi Schema)  │
└───────────────┘    └───────────────┘    └───────┬───────┘
                                                   │
                            ┌──────────────────────┘
                            ▼
                     ┌─────────────┐
                     │ Controller  │
                     └──────┬──────┘
                            │
                            ▼ (nếu có lỗi)
┌───────────────────────────────────────────────────────────────┐
│                      ERROR PIPELINE                            │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│errorConverter │───►│ errorHandler  │───►│   Response    │
│(Normalize)    │    │ (Format JSON) │    │  { code, msg }│
└───────────────┘    └───────────────┘    └───────────────┘
```

### Thứ tự thực thi Middleware

```
1. helmet()           → Security HTTP headers
2. express.json()     → Parse JSON body
3. express.urlencoded → Parse URL-encoded body
4. xss()              → Sanitize input
5. cors()             → Enable CORS
6. passport.init()    → Initialize Passport
7. rateLimiter        → Limit auth requests (production only)
8. [Route Middlewares]:
   ├── authCustomer() / authEmployee()  → JWT verification
   └── validate(schema)                  → Request validation
9. [Controller]       → Handle request
10. errorConverter    → Normalize errors
11. errorHandler      → Send error response
```

---

## 3. Controller (Bộ điều khiển)

### Vị trí
```
src/controllers/
├── index.ts
├── customer/
│   ├── customer.controller.ts         # Auth + Profile
│   └── customer.booking.controller.ts # Booking operations
└── employee/
    ├── employee.controller.ts         # Auth
    ├── employee.booking.controller.ts # Booking management
    ├── employee.room.controller.ts    # Room management
    └── employee.service.controller.ts # Service management
```

### Trách nhiệm

| Trách nhiệm | Mô tả |
|-------------|-------|
| **Nhận HTTP Request** | Parse request params, query, body |
| **Ủy quyền cho Service** | Gọi các service methods với dữ liệu đã validate |
| **Định dạng Response** | Sử dụng `sendData()`, `sendNoContent()` từ responseWrapper |
| **Xử lý lỗi** | Wrap trong `catchAsync()` để tự động forward errors |
| **KHÔNG chứa logic nghiệp vụ** | Chỉ điều phối, không tính toán |

### Các hoạt động chính

```typescript
// customer.controller.ts
@Injectable()
export class CustomerController {
  constructor(
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly tokenService: TokenService
  ) {}

  // Đăng ký
  register = catchAsync(async (req: Request, res: Response) => {
    // 1. Gọi service để tạo customer
    const customer = await this.customerService.createCustomer(req.body);
    
    // 2. Tạo tokens
    const tokens = await this.tokenService.generateAuthTokens(customer.id, 'customer');
    
    // 3. Loại bỏ password trước khi trả về
    const customerWithoutPassword = exclude(customer, ['password']);
    
    // 4. Trả về response chuẩn
    sendData(res, { customer: customerWithoutPassword, tokens }, httpStatus.CREATED);
  });

  // Đăng nhập
  login = catchAsync(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    
    // Ủy quyền hoàn toàn cho AuthService
    const { customer, tokens } = await this.authService
      .loginCustomerWithPhoneAndPassword(phone, password);
    
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, { customer: customerWithoutPassword, tokens });
  });

  // Xem profile (yêu cầu đã authenticate)
  getProfile = catchAsync(async (req: Request, res: Response) => {
    // req.customer được gắn bởi authCustomer middleware
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }
    
    const customer = await this.customerService.getCustomerById(req.customer.id);
    const customerWithoutPassword = exclude(customer, ['password']);
    sendData(res, customerWithoutPassword);
  });
}
```

### Danh sách Controllers

| Controller | Methods | Mô tả |
|------------|---------|-------|
| **CustomerController** | `register`, `login`, `logout`, `refreshTokens`, `getProfile`, `updateProfile`, `changePassword` | Xác thực và quản lý hồ sơ khách |
| **CustomerBookingController** | `createBooking`, `getMyBookings`, `getBookingById`, `cancelBooking` | Đặt phòng và xem lịch sử |
| **EmployeeController** | `login`, `logout`, `refreshTokens`, `getProfile` | Xác thực nhân viên |
| **EmployeeBookingController** | `getAllBookings`, `getBookingById`, `checkIn`, `checkOut`, `confirmBooking` | Quản lý booking |
| **EmployeeRoomController** | `createRoom`, `getAllRooms`, `updateRoom`, `deleteRoom`, `updateRoomStatus` | Quản lý phòng |
| **EmployeeRoomTypeController** | `createRoomType`, `getAllRoomTypes`, `updateRoomType`, `deleteRoomType` | Quản lý loại phòng |
| **EmployeeServiceController** | `createService`, `getAllServices`, `updateService` | Quản lý dịch vụ khách sạn |

### Tương tác

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTROLLER                                │
└─────────────────────────────────────────────────────────────────┘
        │
        │ Receives
        ▼
┌───────────────┐
│   Request     │ ─── req.body, req.params, req.query
│   Object      │ ─── req.customer (from auth middleware)
└───────┬───────┘
        │
        │ Delegates to
        ▼
┌───────────────────────────────────────────────────────────────┐
│                         SERVICES                               │
│  AuthService │ BookingService │ CustomerService │ ...          │
└───────────────────────────────────────────────────────────────┘
        │
        │ Returns data
        ▼
┌───────────────┐
│  Response     │ ─── sendData(res, data, statusCode)
│  Formatting   │ ─── sendNoContent(res)
└───────────────┘
```

### Response Wrapper Pattern

```typescript
// utils/responseWrapper.ts
export const sendData = (res: Response, data: any, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendNoContent = (res: Response) => {
  res.status(204).send();
};

// Sử dụng trong controller
sendData(res, { booking, message: 'Booking created' }, 201);
```

---

## 4. Service (Dịch vụ nghiệp vụ)

### Vị trí
```
src/services/
├── index.ts                  # Barrel export
├── auth.service.ts           # Xác thực
├── token.service.ts          # JWT tokens
├── customer.service.ts       # Quản lý khách hàng
├── employee.service.ts       # Quản lý nhân viên
├── booking.service.ts        # Đặt phòng
├── room.service.ts           # Quản lý phòng
├── roomType.service.ts       # Loại phòng
├── service.service.ts        # Dịch vụ khách sạn
├── transaction.service.ts    # Giao dịch tài chính
├── usage-service.service.ts  # Sử dụng dịch vụ
└── activity.service.ts       # Audit logging
```

### Trách nhiệm

| Service | Trách nhiệm chính |
|---------|-------------------|
| **TokenService** | Tạo/xác thực JWT tokens (access, refresh, reset password) |
| **AuthService** | Orchestrate login, logout, refresh, reset password |
| **CustomerService** | CRUD khách hàng, hash password |
| **EmployeeService** | CRUD nhân viên, quản lý roles |
| **BookingService** | Tạo booking, phân bổ phòng, check-in/out |
| **RoomService** | CRUD phòng, cập nhật trạng thái |
| **RoomTypeService** | CRUD loại phòng với giá và tiện nghi |
| **ServiceService** | CRUD dịch vụ khách sạn (spa, giặt ủi...) |
| **TransactionService** | Xử lý thanh toán, phân bổ tiền |
| **UsageServiceService** | Ghi nhận sử dụng dịch vụ |
| **ActivityService** | Ghi audit trail cho mọi hoạt động |

### Phân tầng Services

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: ORCHESTRATION                         │
│                                                                   │
│   BookingService ←───── TransactionService                       │
│        │                       │                                  │
│        └──────────┬────────────┘                                  │
│                   ▼                                               │
│            ActivityService (Audit)                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: COMPOSITE                             │
│                                                                   │
│   AuthService ────► TokenService + CustomerService + EmployeeService│
│   UsageServiceService ────► ActivityService                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 0: FOUNDATION                            │
│                                                                   │
│   TokenService │ CustomerService │ EmployeeService               │
│   RoomService  │ RoomTypeService │ ServiceService                │
│   ActivityService                                                 │
│                                                                   │
│   ──────────────────────────────────────────────────────────     │
│                      PrismaClient (Database)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Các hoạt động chính

#### AuthService - Orchestration Pattern

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    private readonly customerService: CustomerService,
    private readonly employeeService: EmployeeService
  ) {}

  async loginCustomerWithPhoneAndPassword(phone: string, password: string) {
    // 1. Lấy customer từ CustomerService
    const customer = await this.customerService.getCustomerByPhone(phone);

    // 2. Kiểm tra password
    if (!customer || !(await isPasswordMatch(password, customer.password))) {
      throw new ApiError(401, 'Incorrect phone or password');
    }

    // 3. Tạo tokens từ TokenService
    const tokens = this.tokenService.generateAuthTokens(customer.id, 'customer');

    return { customer, tokens };
  }

  async refreshAuth(refreshToken: string) {
    // 1. Verify token
    const payload = this.tokenService.verifyToken(refreshToken, 'REFRESH');
    
    // 2. Generate new tokens
    return this.tokenService.generateAuthTokens(payload.sub, payload.userType);
  }
}
```

#### BookingService - Complex Business Logic

```typescript
@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly transactionService: TransactionService,
    private readonly activityService: ActivityService
  ) {}

  async createBooking(input: CreateBookingPayload) {
    const { rooms, checkInDate, checkOutDate, totalGuests, customerId } = input;

    // 1. Tính số đêm
    const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), 'day');
    if (nights <= 0) {
      throw new ApiError(400, 'Check-out date must be after check-in date');
    }

    // 2. Validate room types
    const roomTypes = await this.prisma.roomType.findMany({
      where: { id: { in: rooms.map(r => r.roomTypeId) } }
    });

    // 3. Tìm phòng trống cho mỗi loại phòng
    const allocatedRooms = [];
    for (const roomRequest of rooms) {
      const availableRooms = await this.prisma.room.findMany({
        where: {
          roomTypeId: roomRequest.roomTypeId,
          status: RoomStatus.AVAILABLE,
          bookingRooms: {
            none: {
              AND: [
                { checkInDate: { lte: checkOutDate } },
                { checkOutDate: { gte: checkInDate } },
                { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } }
              ]
            }
          }
        },
        take: roomRequest.count
      });

      if (availableRooms.length < roomRequest.count) {
        throw new ApiError(409, `Not enough rooms for type: ${roomRequest.roomTypeId}`);
      }
      allocatedRooms.push(...availableRooms);
    }

    // 4. Tạo booking trong transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      // Tạo booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode: `BK${Date.now()}`,
          primaryCustomerId: customerId,
          checkInDate,
          checkOutDate,
          totalGuests,
          totalAmount: calculateTotal(allocatedRooms, nights),
          bookingRooms: { create: [...] }
        }
      });

      // Cập nhật trạng thái phòng → RESERVED
      await tx.room.updateMany({
        where: { id: { in: allocatedRooms.map(r => r.id) } },
        data: { status: RoomStatus.RESERVED }
      });

      return newBooking;
    });

    return booking;
  }

  async checkIn(input: CheckInPayload) {
    const { checkInInfo, employeeId } = input;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update booking rooms → CHECKED_IN
      await tx.bookingRoom.updateMany({...});

      // 2. Update rooms → OCCUPIED
      await tx.room.updateMany({...});

      // 3. Create guest assignments
      for (const info of checkInInfo) {
        await tx.bookingCustomer.upsert({...});
      }

      // 4. Log activity (audit trail)
      for (const room of bookingRooms) {
        await this.activityService.createCheckInActivity(
          room.id, employeeId, room.room.roomNumber, tx
        );
      }

      // 5. Update booking status if all rooms checked in
      // ...
    });
  }
}
```

#### TransactionService - Financial Processing

```typescript
@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activityService: ActivityService,
    private readonly usageServiceService: UsageServiceService
  ) {}

  async createTransaction(payload: CreateTransactionPayload) {
    // Route to appropriate handler
    if (payload.serviceUsageId && !payload.bookingId) {
      return this.processGuestServicePayment(payload);
    }
    if (payload.bookingRoomIds?.length) {
      return this.processSplitRoomPayment(payload);
    }
    return this.processFullBookingPayment(payload);
  }

  private async processFullBookingPayment(payload) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          bookingId: payload.bookingId,
          type: payload.transactionType,
          amount: payload.amount,
          method: payload.paymentMethod,
          status: 'COMPLETED'
        }
      });

      // 2. Allocate payment to rooms and services
      // ... proportional allocation logic

      // 3. Update booking totals
      await tx.booking.update({
        where: { id: payload.bookingId },
        data: {
          totalPaid: { increment: payload.amount },
          balance: { decrement: payload.amount }
        }
      });

      // 4. Log activity
      await this.activityService.createPaymentActivity(...);

      return transaction;
    });
  }
}
```

### Tương tác giữa Services

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE INTERACTIONS                          │
└─────────────────────────────────────────────────────────────────┘

AuthService
    ├──► TokenService.generateAuthTokens()
    ├──► CustomerService.getCustomerByPhone()
    └──► EmployeeService.getEmployeeByUsername()

BookingService
    ├──► TransactionService (payment processing)
    ├──► ActivityService.createCheckInActivity()
    └──► Prisma.$transaction() for atomic operations

TransactionService
    ├──► ActivityService.createPaymentActivity()
    ├──► UsageServiceService.updateServiceUsagePaid()
    └──► Prisma.$transaction() for financial atomicity

UsageServiceService
    └──► ActivityService.createServiceUsageActivity()
```

---

## 5. Data Access (Truy cập dữ liệu)

### Vị trí
```
prisma/
├── schema.prisma           # Định nghĩa schema
├── migrations/             # Migration files
│   ├── 20251223053341_init/
│   └── ...
└── seeds/                  # Seed data
    ├── index.ts
    ├── customer.seed.ts
    ├── employee.seed.ts
    └── room.seed.ts
```

### Trách nhiệm

| Trách nhiệm | Mô tả |
|-------------|-------|
| **Schema Definition** | Định nghĩa các model, relations, enums |
| **Migrations** | Quản lý thay đổi schema theo thời gian |
| **Type Generation** | Tự động tạo TypeScript types từ schema |
| **Query Building** | Cung cấp type-safe query API |
| **Transactions** | Hỗ trợ atomic operations với `$transaction` |
| **Seeding** | Khởi tạo dữ liệu mẫu cho development |

### Các hoạt động chính

#### Schema Definition (schema.prisma)

```prisma
// Enums
enum BookingStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  PARTIALLY_CHECKED_OUT
  CHECKED_OUT
  CANCELLED
}

enum RoomStatus {
  AVAILABLE
  RESERVED
  OCCUPIED
  CLEANING
  MAINTENANCE
  OUT_OF_SERVICE
}

// Models
model Customer {
  id       String  @id @default(cuid())
  fullName String
  email    String?
  phone    String  @unique
  password String

  bookings         Booking[]
  bookingCustomers BookingCustomer[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([phone])
}

model Booking {
  id              String        @id @default(cuid())
  bookingCode     String        @unique
  status          BookingStatus @default(PENDING)
  primaryCustomerId String
  primaryCustomer   Customer    @relation(fields: [primaryCustomerId], references: [id])

  checkInDate     DateTime
  checkOutDate    DateTime
  totalGuests     Int

  // Financial fields
  totalAmount     Decimal @default(0) @db.Decimal(10, 2)
  depositRequired Decimal @default(0) @db.Decimal(10, 2)
  totalPaid       Decimal @default(0) @db.Decimal(10, 2)
  balance         Decimal @default(0) @db.Decimal(10, 2)

  // Relations
  bookingRooms     BookingRoom[]
  transactions     Transaction[]
  serviceUsages    ServiceUsage[]

  @@index([bookingCode])
  @@index([status])
}

model Room {
  id         String     @id @default(cuid())
  roomNumber String     @unique
  floor      Int
  status     RoomStatus @default(AVAILABLE)
  roomTypeId String

  roomType     RoomType      @relation(fields: [roomTypeId], references: [id])
  bookingRooms BookingRoom[]
}
```

#### Prisma Client Usage

```typescript
// src/prisma.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;

// Trong Service
class BookingService {
  constructor(private readonly prisma: PrismaClient) {}

  // Simple query
  async getBookingById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        bookingRooms: {
          include: { room: true, roomType: true }
        },
        primaryCustomer: true
      }
    });
  }

  // Complex query with filters
  async getAllBookings(filters, pagination) {
    const where: Prisma.BookingWhereInput = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.dateFrom && filters.dateTo) {
      where.checkInDate = {
        gte: filters.dateFrom,
        lte: filters.dateTo
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder }
      }),
      this.prisma.booking.count({ where })
    ]);

    return { data, total, ...pagination };
  }

  // Transaction for atomic operations
  async checkIn(input) {
    return this.prisma.$transaction(async (tx) => {
      // All operations use 'tx' instead of 'this.prisma'
      await tx.bookingRoom.updateMany({...});
      await tx.room.updateMany({...});
      await tx.booking.update({...});
      // If any fails, entire transaction is rolled back
    });
  }
}
```

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Employee   │     │  Customer   │     │  RoomType   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ name        │     │ fullName    │     │ name        │
│ username    │     │ phone       │     │ capacity    │
│ password    │     │ email       │     │ pricePerNight│
│ role        │     │ password    │     │ amenities   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                         Booking                              │
├─────────────────────────────────────────────────────────────┤
│ id │ bookingCode │ status │ primaryCustomerId              │
│ checkInDate │ checkOutDate │ totalGuests                   │
│ totalAmount │ depositRequired │ totalPaid │ balance        │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │BookingRoom│  │Transaction│  │ServiceUsage│
       ├───────────┤  ├───────────┤  ├───────────┤
       │ roomId    │  │ type      │  │ serviceId │
       │ status    │  │ amount    │  │ quantity  │
       │ pricePerN │  │ method    │  │ totalPrice│
       └───────────┘  └───────────┘  └───────────┘
```

### Migration Commands

```bash
# Tạo migration mới
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Seed data
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 6. DI-Core (Dependency Injection)

### Vị trí
```
src/core/
├── container.ts    # DI Container & Tokens
├── bootstrap.ts    # Service registration
├── decorators.ts   # @Injectable, @Inject
└── index.ts        # Barrel export
```

### Trách nhiệm

| Component | Trách nhiệm |
|-----------|-------------|
| **Container** | Singleton quản lý providers và instances |
| **TOKENS** | Type-safe symbols để identify services |
| **Bootstrap** | Đăng ký tất cả services khi app khởi động |
| **Decorators** | Mark classes là injectable |

### Các hoạt động chính

#### Container Implementation

```typescript
// container.ts
type Constructor<T = any> = new (...args: any[]) => T;

interface ProviderDefinition {
  token: string | symbol;
  useClass?: Constructor;
  useValue?: unknown;
  useFactory?: (...args: any[]) => unknown;
  inject?: (string | symbol)[];
}

class Container {
  private providers = new Map<string | symbol, ProviderDefinition>();
  private instances = new Map<string | symbol, unknown>();

  // Đăng ký một giá trị cố định (như PrismaClient)
  registerValue<T>(token: string | symbol, value: T): void {
    this.providers.set(token, { token, useValue: value });
    this.instances.set(token, value);
  }

  // Đăng ký một factory function
  registerFactory<T>(
    token: string | symbol,
    factory: (...args: unknown[]) => T,
    inject?: (string | symbol)[]
  ): void {
    this.providers.set(token, { token, useFactory: factory, inject });
  }

  // Resolve một dependency
  resolve<T>(token: string | symbol): T {
    // Return cached instance nếu có
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    let instance: T;

    if (provider.useValue !== undefined) {
      instance = provider.useValue as T;
    } else if (provider.useFactory) {
      // Resolve dependencies trước, sau đó gọi factory
      const deps = (provider.inject || []).map((dep) => this.resolve(dep));
      instance = provider.useFactory(...deps) as T;
    } else if (provider.useClass) {
      const deps = (provider.inject || []).map((dep) => this.resolve(dep));
      instance = new provider.useClass(...deps) as T;
    } else {
      throw new Error(`Invalid provider for: ${String(token)}`);
    }

    // Cache instance (singleton pattern)
    this.instances.set(token, instance);
    return instance;
  }

  // Reset container (for testing)
  reset(): void {
    this.providers.clear();
    this.instances.clear();
  }
}

// Singleton export
export const container = new Container();

// Type-safe tokens
export const TOKENS = {
  PrismaClient: Symbol('PrismaClient'),
  AuthService: Symbol('AuthService'),
  TokenService: Symbol('TokenService'),
  EmployeeService: Symbol('EmployeeService'),
  CustomerService: Symbol('CustomerService'),
  BookingService: Symbol('BookingService'),
  RoomTypeService: Symbol('RoomTypeService'),
  RoomService: Symbol('RoomService'),
  ServiceService: Symbol('ServiceService'),
  TransactionService: Symbol('TransactionService'),
  UsageServiceService: Symbol('UsageServiceService'),
  ActivityService: Symbol('ActivityService')
} as const;
```

#### Bootstrap Registration

```typescript
// bootstrap.ts
import { container, TOKENS } from './container';
import prisma from 'prisma';
import { 
  TokenService, AuthService, CustomerService, 
  EmployeeService, BookingService, ... 
} from 'services';

export function bootstrap(): void {
  // 1. Register PrismaClient (value provider)
  container.registerValue(TOKENS.PrismaClient, prisma);

  // 2. Register Tier 0 Services (only depend on Prisma)
  container.registerFactory(
    TOKENS.TokenService,
    (prisma) => new TokenService(prisma),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.CustomerService,
    (prisma) => new CustomerService(prisma),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.ActivityService,
    (prisma) => new ActivityService(prisma),
    [TOKENS.PrismaClient]
  );

  // 3. Register Tier 1 Services (depend on Tier 0)
  container.registerFactory(
    TOKENS.UsageServiceService,
    (prisma, activityService) => 
      new UsageServiceService(prisma, activityService),
    [TOKENS.PrismaClient, TOKENS.ActivityService]
  );

  // 4. Register Tier 2 Services (depend on Tier 0 + 1)
  container.registerFactory(
    TOKENS.TransactionService,
    (prisma, activityService, usageService) => 
      new TransactionService(prisma, activityService, usageService),
    [TOKENS.PrismaClient, TOKENS.ActivityService, TOKENS.UsageServiceService]
  );

  container.registerFactory(
    TOKENS.BookingService,
    (prisma, transactionService, activityService) => 
      new BookingService(prisma, transactionService, activityService),
    [TOKENS.PrismaClient, TOKENS.TransactionService, TOKENS.ActivityService]
  );

  // 5. Register AuthService (orchestrator)
  container.registerFactory(
    TOKENS.AuthService,
    (prisma, tokenService, customerService, employeeService) =>
      new AuthService(prisma, tokenService, customerService, employeeService),
    [TOKENS.PrismaClient, TOKENS.TokenService, TOKENS.CustomerService, TOKENS.EmployeeService]
  );
}
```

#### Usage in Routes

```typescript
// routes/v1/customer/auth.route.ts
import { container, TOKENS } from 'core/container';
import { AuthService, CustomerService, TokenService } from 'services';

const router = express.Router();

// Resolve dependencies từ container
const authService = container.resolve<AuthService>(TOKENS.AuthService);
const customerService = container.resolve<CustomerService>(TOKENS.CustomerService);
const tokenService = container.resolve<TokenService>(TOKENS.TokenService);

// Inject vào controller
const customerController = new CustomerController(
  authService, 
  customerService, 
  tokenService
);

router.post('/login', validate(schema), customerController.login);
```

### DI Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION STARTUP                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    bootstrap() called in app.ts                  │
│                                                                   │
│   1. container.registerValue(TOKENS.PrismaClient, prisma)        │
│   2. container.registerFactory(TOKENS.TokenService, ...)         │
│   3. container.registerFactory(TOKENS.AuthService, ...)          │
│   ...                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DI CONTAINER STATE                           │
│                                                                   │
│   providers: Map {                                                │
│     Symbol(PrismaClient) → { useValue: PrismaClient }            │
│     Symbol(TokenService) → { useFactory: fn, inject: [...] }    │
│     Symbol(AuthService)  → { useFactory: fn, inject: [...] }    │
│   }                                                               │
│                                                                   │
│   instances: Map {                                                │
│     Symbol(PrismaClient) → PrismaClient instance                 │
│   }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTES INITIALIZATION                         │
│                                                                   │
│   const authService = container.resolve(TOKENS.AuthService);    │
│                              │                                    │
│                              ▼                                    │
│   Container resolves dependencies recursively:                   │
│   1. AuthService needs TokenService, CustomerService, ...        │
│   2. TokenService needs PrismaClient                             │
│   3. PrismaClient already in cache → return                      │
│   4. Create TokenService with PrismaClient                       │
│   5. Create AuthService with all deps                            │
│   6. Cache AuthService instance                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER INSTANTIATION                      │
│                                                                   │
│   const controller = new CustomerController(                     │
│     authService,      // ← from container                        │
│     customerService,  // ← from container                        │
│     tokenService      // ← from container                        │
│   );                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Decorators

```typescript
// decorators.ts

// Mark class as injectable (documentation + future use)
export function Injectable(): (target: any) => any {
  return (target: any) => {
    target.__injectable__ = true;
    return target;
  };
}

// Usage in services
@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly transactionService: TransactionService,
    private readonly activityService: ActivityService
  ) {}
}
```

---

## Luồng xử lý Request

### Sequence Diagram

```
┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐
│ Client │  │ Express │  │Middleware│  │Controller│  │ Service │  │ Prisma │
└───┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  └───┬────┘
    │            │            │             │             │           │
    │ POST /login│            │             │             │           │
    │───────────►│            │             │             │           │
    │            │            │             │             │           │
    │            │ Global MW  │             │             │           │
    │            │───────────►│             │             │           │
    │            │ (helmet,   │             │             │           │
    │            │  cors...)  │             │             │           │
    │            │            │             │             │           │
    │            │            │ validate()  │             │           │
    │            │            │────────────►│             │           │
    │            │            │             │             │           │
    │            │            │     OK      │             │           │
    │            │            │◄────────────│             │           │
    │            │            │             │             │           │
    │            │            │     login() │             │           │
    │            │            │────────────►│             │           │
    │            │            │             │             │           │
    │            │            │             │loginWithPhone│          │
    │            │            │             │────────────►│           │
    │            │            │             │             │           │
    │            │            │             │             │findUnique │
    │            │            │             │             │──────────►│
    │            │            │             │             │           │
    │            │            │             │             │  Customer │
    │            │            │             │             │◄──────────│
    │            │            │             │             │           │
    │            │            │             │  {customer, │           │
    │            │            │             │   tokens}   │           │
    │            │            │             │◄────────────│           │
    │            │            │             │             │           │
    │            │            │ sendData()  │             │           │
    │            │            │◄────────────│             │           │
    │            │            │             │             │           │
    │  200 OK    │            │             │             │           │
    │◄───────────│            │             │             │           │
    │ {customer, │            │             │             │           │
    │  tokens}   │            │             │             │           │
    │            │            │             │             │           │
```

### Tóm tắt

```
REQUEST → Global Middleware → Routes → Route Middleware → Controller → Service → Data → Response
                                                │
                                                ▼
                                     DI Container (cung cấp dependencies)
```

**Nguyên tắc chính:**
1. **Routes** chỉ định nghĩa đường dẫn và gắn middleware
2. **Middleware** xử lý cross-cutting concerns (auth, validation)
3. **Controller** điều phối, không chứa logic nghiệp vụ
4. **Service** chứa toàn bộ business logic
5. **Data Access** cung cấp type-safe database operations
6. **DI-Core** kết nối tất cả với dependency injection 