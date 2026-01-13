# Chương 3: Phân tích hệ thống

## 3.1. **Class diagram (Mức phân tích)**

### 3.1.1 **Danh sách các lớp thực thể liên quan**

**Core Entities:**

- Employee (Nhân viên)
- Customer (Khách hàng)
- RoomType (Loại phòng)
- Room (Phòng)
- Booking (Đặt phòng)
- BookingRoom (Chi tiết đặt phòng - Phòng)
- BookingCustomer (Chi tiết đặt phòng - Khách hàng)
- Service (Dịch vụ)
- ServiceUsage (Sử dụng dịch vụ)
- Transaction (Giao dịch)
- TransactionDetail (Chi tiết giao dịch)
- Activity (Hoạt động/Nhật ký)
- Promotion (Mã khuyến mãi)
- PricingRule (Quy tắc điều chỉnh giá động)
- Role (Vai trò nhân viên)
- Permission (Quyền hạn)

### 3.1.2. **Conceptual model**

```plantuml
@startuml
skinparam linetype ortho
skinparam classAttributeIconSize 0
hide methods
hide stereotype

class Employee
class Customer
class RoomType
class Room
class Booking
class BookingRoom
class BookingCustomer
class Service
class ServiceUsage
class Transaction
class TransactionDetail
class Activity

Employee -- Transaction
Employee -- ServiceUsage
Employee -- Activity

Customer -- Booking
Customer -- BookingCustomer
Customer -- Activity

RoomType -- Room
RoomType -- BookingRoom

Room -- BookingRoom

Booking -- BookingRoom
Booking -- BookingCustomer
Booking -- Transaction
Booking -- ServiceUsage

BookingRoom -- BookingCustomer
BookingRoom -- ServiceUsage
BookingRoom -- TransactionDetail
BookingRoom -- Activity

Service -- ServiceUsage

ServiceUsage -- TransactionDetail
ServiceUsage -- Activity

Transaction -- TransactionDetail

@enduml
```

### 3.1.3 **Class diagram (analysis level)**

```plantuml


@startuml
skinparam linetype ortho
skinparam classAttributeIconSize 0

' ==================== ENUMS ====================
enum RoomStatus {
  AVAILABLE
  RESERVED
  OCCUPIED
  CLEANING
  MAINTENANCE
  OUT_OF_SERVICE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  PARTIALLY_CHECKED_OUT
  CHECKED_OUT
  CANCELLED
}

enum ServiceUsageStatus {
  PENDING
  TRANSFERRED
  COMPLETED
  CANCELLED
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  BANK_TRANSFER
  E_WALLET
}

enum TransactionType {
  DEPOSIT
  ROOM_CHARGE
  SERVICE_CHARGE
  REFUND
  ADJUSTMENT
}

enum ActivityType {
  CREATE_BOOKING
  UPDATE_BOOKING
  CREATE_BOOKING_ROOM
  UPDATE_BOOKING_ROOM
  CREATE_SERVICE_USAGE
  UPDATE_SERVICE_USAGE
  CREATE_TRANSACTION
  UPDATE_TRANSACTION
  CREATE_CUSTOMER
  CHECKED_IN
  CHECKED_OUT
}

' ==================== ENTITY CLASSES ====================
class Employee <<Entity>> {
  - id: String <<PK>>
  - name: String
  - username: String <<unique>>
  - password: String
  - role: String
  - updatedAt: DateTime
  --
  + createEmployee()
  + updateEmployeeInfo()
  + deleteEmployee()
  + getEmployeeByUsername()
}

class Customer <<Entity>> {
  - id: String <<PK>>
  - fullName: String
  - email: String
  - phone: String <<unique>>
  - idNumber: String
  - address: String
  - password: String
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createCustomer()
  + updateCustomerInfo()
  + getCustomerByPhone()
  + searchCustomer()
}

class RoomType <<Entity>> {
  - id: String <<PK>>
  - name: String
  - capacity: Int
  - pricePerNight: Decimal
  - amenities: Json
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createRoomType()
  + updateRoomType()
  + getRoomTypeById()
  + getAllRoomTypes()
}

class Room <<Entity>> {
  - id: String <<PK>>
  - roomNumber: String <<unique>>
  - floor: Int
  - status: RoomStatus
  - roomTypeId: String <<FK>>
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createRoom()
  + updateRoomInfo()
  + updateRoomStatus()
  + getRoomById()
  + getAllRooms()
}

class Booking <<Control>> {
  - id: String <<PK>>
  - bookingCode: String <<unique>>
  - status: BookingStatus
  - primaryCustomerId: String <<FK>>
  - checkInDate: DateTime
  - checkOutDate: DateTime
  - totalGuests: Int
  - totalAmount: Decimal
  - depositRequired: Decimal
  - totalDeposit: Decimal
  - totalPaid: Decimal
  - balance: Decimal
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createBooking()
  + updateBooking()
  + cancelBooking()
  + getBookingById()
}

class BookingRoom <<Control>> {
  - id: String <<PK>>
  - bookingId: String <<FK>>
  - roomId: String <<FK>>
  - roomTypeId: String <<FK>>
  - checkInDate: DateTime
  - checkOutDate: DateTime
  - actualCheckIn: DateTime
  - actualCheckOut: DateTime
  - pricePerNight: Decimal
  - depositAmount: Decimal
  - subtotalRoom: Decimal
  - subtotalService: Decimal
  - totalAmount: Decimal
  - totalPaid: Decimal
  - balance: Decimal
  - status: BookingStatus
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + checkIn()
  + checkOut()
  + updateBookingRoom()
}

class BookingCustomer <<Control>> {
  - id: String <<PK>>
  - bookingId: String <<FK>>
  - customerId: String <<FK>>
  - bookingRoomId: String <<FK>>
  - isPrimary: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + addCustomerToBooking()
  + removeCustomerFromBooking()
}

class Service <<Entity>> {
  - id: String <<PK>>
  - name: String
  - price: Decimal
  - unit: String
  - isActive: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createService()
  + updateService()
  + getServiceById()
  + getAllServices()
}

class ServiceUsage <<Control>> {
  - id: String <<PK>>
  - bookingId: String <<FK>>
  - bookingRoomId: String <<FK>>
  - employeeId: String <<FK>>
  - serviceId: String <<FK>>
  - quantity: Int
  - unitPrice: Decimal
  - totalPrice: Decimal
  - totalPaid: Decimal
  - status: ServiceUsageStatus
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createServiceUsage()
  + updateServiceUsage()
  + cancelServiceUsage()
  + updateServiceUsagePayment()
}

class Transaction <<Control>> {
  - id: String <<PK>>
  - bookingId: String <<FK>>
  - type: TransactionType
  - amount: Decimal
  - method: PaymentMethod
  - status: TransactionStatus
  - processedById: String <<FK>>
  - transactionRef: String
  - occurredAt: DateTime
  - description: String
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createTransaction()
  + processFullBookingPayment()
  + processSplitRoomPayment()
  + processBookingServicePayment()
  + processGuestServicePayment()
}

class TransactionDetail <<Control>> {
  - id: String <<PK>>
  - transactionId: String <<FK>>
  - amount: Decimal
  - bookingRoomId: String <<FK>>
  - serviceUsageId: String <<FK>>
  - createdAt: DateTime
  --
  + createTransactionDetail()
}

class Activity <<Entity>> {
  - id: String <<PK>>
  - type: ActivityType
  - metadata: Json
  - description: String
  - serviceUsageId: String <<FK>>
  - bookingRoomId: String <<FK>>
  - customerId: String <<FK>>
  - employeeId: String <<FK>>
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + createActivity()
  + createCheckInActivity()
  + createCheckOutActivity()
  + createTransactionActivity()
}

' ==================== RELATIONSHIPS ====================

' Employee relationships
Employee "1" -- "0..*" Transaction : processes >
Employee "1" -- "0..*" ServiceUsage : serves >
Employee "1" -- "0..*" Activity : performs >

' Customer relationships
Customer "1" -- "0..*" Booking : makes >
Customer "1" -- "0..*" BookingCustomer : participates >
Customer "1" -- "0..*" Activity : triggers >

' RoomType relationships
RoomType "1" -- "0..*" Room : categorizes >
RoomType "1" -- "0..*" BookingRoom : pricing >

' Room relationships
Room "0..*" -- "1" RoomType
Room "1" -- "0..*" BookingRoom : assigned to >

' Booking relationships
Booking "0..*" -- "1" Customer : primaryCustomer
Booking "1" -- "1..*" BookingRoom : contains >
Booking "1" -- "0..*" BookingCustomer : includes >
Booking "1" -- "0..*" Transaction : payments >
Booking "1" -- "0..*" ServiceUsage : services >

' BookingRoom relationships
BookingRoom "0..*" -- "1" Booking
BookingRoom "0..*" -- "1" Room
BookingRoom "0..*" -- "1" RoomType
BookingRoom "1" -- "0..*" BookingCustomer : guests >
BookingRoom "1" -- "0..*" ServiceUsage : usages >
BookingRoom "1" -- "0..*" TransactionDetail : payments >
BookingRoom "1" -- "0..*" Activity : logs >

' Service relationships
Service "1" -- "0..*" ServiceUsage : used in >

' ServiceUsage relationships
ServiceUsage "0..*" -- "0..1" Booking
ServiceUsage "0..*" -- "0..1" BookingRoom
ServiceUsage "0..*" -- "1" Service
ServiceUsage "0..*" -- "1" Employee
ServiceUsage "1" -- "0..*" TransactionDetail : payments >
ServiceUsage "1" -- "0..*" Activity : logs >

' Transaction relationships
Transaction "0..*" -- "0..1" Booking
Transaction "0..*" -- "0..1" Employee : processedBy
Transaction "1" -- "0..*" TransactionDetail : details >

' TransactionDetail relationships
TransactionDetail "0..*" -- "0..1" Transaction
TransactionDetail "0..*" -- "0..1" BookingRoom
TransactionDetail "0..*" -- "0..1" ServiceUsage

@enduml
```

### 3.1.4 **Danh sách các lớp và các mối quan hệ**

| STT | Class                   | Type (Entity/Control) | Ghi chú                                                     |
| --- | ----------------------- | --------------------- | ----------------------------------------------------------- |
| 1   | Employee                | Entity                | Quản lý thông tin nhân viên hệ thống                        |
| 2   | Customer                | Entity                | Quản lý thông tin khách hàng                                |
| 3   | RoomType                | Entity                | Quản lý loại phòng và giá cơ bản                            |
| 4   | Room                    | Entity                | Quản lý phòng và trạng thái phòng                           |
| 5   | Booking                 | Control               | Quản lý đặt phòng, tổng hợp tài chính                       |
| 6   | BookingRoom             | Control               | Chi tiết đặt phòng theo từng phòng cụ thể                   |
| 7   | BookingCustomer         | Control               | Liên kết khách hàng với booking/phòng                       |
| 8   | Service                 | Entity                | Quản lý danh mục dịch vụ                                    |
| 9   | ServiceUsage            | Control               | Quản lý sử dụng dịch vụ (theo booking/phòng/khách vãng lai) |
| 10  | Transaction             | Control               | Quản lý giao dịch thanh toán                                |
| 11  | TransactionDetail       | Control               | Chi tiết phân bổ thanh toán cho phòng/dịch vụ               |
| 12  | Activity                | Entity                | Nhật ký hoạt động hệ thống                                  |
| 13  | RoomStatus              | Entity (Enum)         | Trạng thái phòng                                            |
| 14  | BookingStatus           | Entity (Enum)         | Trạng thái đặt phòng                                        |
| 15  | ServiceUsageStatus      | Entity (Enum)         | Trạng thái sử dụng dịch vụ                                  |
| 16  | TransactionStatus       | Entity (Enum)         | Trạng thái giao dịch                                        |
| 17  | PaymentMethod           | Entity (Enum)         | Phương thức thanh toán                                      |
| 18  | TransactionType         | Entity (Enum)         | Loại giao dịch                                              |
| 19  | ActivityType            | Entity (Enum)         | Loại hoạt động (đã mở rộng)                                 |
| 20  | RoomTypeImage           | Entity                | Hình ảnh loại phòng (Cloudinary)                            |
| 21  | RoomImage               | Entity                | Hình ảnh phòng (Cloudinary)                                 |
| 22  | ServiceImage            | Entity                | Hình ảnh dịch vụ (Cloudinary)                               |
| 23  | RoomTag                 | Entity                | Tag phòng (wifi, TV, bếp...)                                |
| 24  | RoomTypeTag             | Entity                | Liên kết RoomType và RoomTag                                |
| 25  | Promotion               | Control               | Quản lý mã khuyến mãi                                       |
| 26  | CustomerPromotion       | Control               | Mã khuyến mãi thuộc về khách hàng                           |
| 27  | UsedPromotion           | Control               | Lịch sử sử dụng mã khuyến mãi                               |
| 28  | CustomerRank            | Entity                | Hạng VIP khách hàng                                         |
| 29  | CalendarEvent           | Entity                | Sự kiện lịch (Tết, mùa hè, blackpink...)                    |
| 30  | PricingRule             | Control               | Quy tắc điều chỉnh giá động                                 |
| 31  | Role                    | Entity                | Vai trò nhân viên (RBAC)                                    |
| 32  | Permission              | Entity                | Quyền hạn (RBAC)                                            |
| 33  | RolePermission          | Entity                | Liên kết Role và Permission                                 |
| 34  | AppSetting              | Entity                | Cấu hình hệ thống                                           |
| 35  | PromotionScope          | Entity (Enum)         | Phạm vi khuyến mãi (ROOM/SERVICE/ALL)                       |
| 36  | PromotionType           | Entity (Enum)         | Loại khuyến mãi (PERCENTAGE/FIXED_AMOUNT)                   |
| 37  | CustomerPromotionStatus | Entity (Enum)         | Trạng thái mã KM của khách (AVAILABLE/USED/EXPIRED)         |
| 38  | PermissionType          | Entity (Enum)         | Loại quyền (SCREEN/ACTION)                                  |
| 39  | EventType               | Entity (Enum)         | Loại sự kiện (HOLIDAY/SEASONAL/SPECIAL_EVENT)               |
| 40  | AdjustmentType          | Entity (Enum)         | Loại điều chỉnh giá (PERCENTAGE/FIXED_AMOUNT)               |

### 3.1.5 **Chi tiết các lớp**

#### **Lớp Employee (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại     | Ràng buộc          | Ý nghĩa/ghi chú               |
| --- | -------------- | -------- | ------------------ | ----------------------------- |
| 1   | id             | String   | private,\<\<PK\>\> | Mã định danh nhân viên (CUID) |
| 2   | name           | String   | private            | Họ tên nhân viên              |
| 3   | username       | String   | private, unique    | Tên đăng nhập (duy nhất)      |
| 4   | password       | String   | private            | Mật khẩu đã mã hóa (bcrypt)   |
| 5   | roleId         | String   | private, optional  | Khóa ngoại tới Role (RBAC)    |
| 6   | createdAt      | DateTime | private            | Thời điểm tạo                 |
| 7   | updatedAt      | DateTime | private            | Thời điểm cập nhật cuối       |

**Ghi chú:** Hệ thống sử dụng Role-Based Access Control (RBAC) thay vì role cố định.

**Trách nhiệm (Methods):**

| STT | Tên phương thức         | Mô tả                                 |
| --- | ----------------------- | ------------------------------------- |
| 1   | createEmployee()        | Tạo nhân viên mới với mật khẩu mã hóa |
| 2   | updateEmployeeInfo()    | Cập nhật thông tin nhân viên          |
| 3   | deleteEmployee()        | Xóa nhân viên khỏi hệ thống           |
| 4   | getEmployeeByUsername() | Tìm nhân viên theo tên đăng nhập      |
| 5   | getAllEmployees()       | Lấy danh sách nhân viên có phân trang |

---

#### **Lớp Customer (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính         | Loại     | Ràng buộc          | Ý nghĩa/ghi chú                             |
| --- | ---------------------- | -------- | ------------------ | ------------------------------------------- |
| 1   | id                     | String   | private,\<\<PK\>\> | Mã định danh khách hàng (CUID)              |
| 2   | fullName               | String   | private            | Họ tên đầy đủ                               |
| 3   | email                  | String   | private, optional  | Email liên hệ                               |
| 4   | phone                  | String   | private, unique    | Số điện thoại (duy nhất, dùng để đăng nhập) |
| 5   | idNumber               | String   | private, optional  | Số CMND/CCCD                                |
| 6   | address                | String   | private, optional  | Địa chỉ                                     |
| 7   | password               | String   | private            | Mật khẩu đã mã hóa                          |
| 8   | imageUrl               | String   | private, optional  | URL ảnh đại diện khách hàng                 |
| 9   | isEmailVerified        | Boolean  | private            | Trạng thái xác thực email                   |
| 10  | emailVerificationToken | String   | private, optional  | Token xác thực email                        |
| 11  | rankId                 | String   | private, optional  | Hạng VIP của khách hàng                     |
| 12  | totalSpent             | Decimal  | private            | Tổng chi tiêu (cached)                      |
| 13  | createdAt              | DateTime | private            | Thời điểm tạo                               |
| 14  | updatedAt              | DateTime | private            | Thời điểm cập nhật cuối                     |

**Ghi chú:** Hệ thống đã bổ sung VIP Rank System và email verification.

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                                   |
| --- | -------------------- | --------------------------------------- |
| 1   | createCustomer()     | Đăng ký khách hàng mới                  |
| 2   | updateCustomerInfo() | Cập nhật thông tin khách hàng           |
| 3   | getCustomerByPhone() | Tìm khách hàng theo số điện thoại       |
| 4   | searchCustomer()     | Tìm kiếm khách hàng theo nhiều tiêu chí |
| 5   | getAllCustomers()    | Lấy danh sách khách hàng có phân trang  |

---

#### **Lớp RoomType (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại     | Ràng buộc          | Ý nghĩa/ghi chú                                  |
| --- | -------------- | -------- | ------------------ | ------------------------------------------------ |
| 1   | id             | String   | private,\<\<PK\>\> | Mã định danh loại phòng (CUID)                   |
| 2   | name           | String   | private            | Tên loại phòng (VD: Standard, Deluxe, VIP)       |
| 3   | capacity       | Int      | private            | Sức chứa tối đa (số người)                       |
| 4   | totalBed       | Int      | private            | Số giường                                        |
| 5   | basePrice      | Decimal  | private            | Giá cơ bản (trước khi áp dụng dynamic pricing)   |
| 6   | imageUrl       | String   | private, optional  | URL ảnh chính (deprecated, dùng images relation) |
| 7   | createdAt      | DateTime | private            | Thời điểm tạo                                    |
| 8   | updatedAt      | DateTime | private            | Thời điểm cập nhật cuối                          |

**Quan hệ:**

- `images`: RoomTypeImage[] - Danh sách hình ảnh loại phòng (Cloudinary)
- `roomTypeTags`: RoomTypeTag[] - Các tag như wifi, TV, bếp

**Ghi chú:**

- `pricePerNight` đã đổi thành `basePrice` để hỗ trợ dynamic pricing
- Không còn lưu `amenities` dạng JSON, thay bằng RoomTypeTag relation
- Hỗ trợ multiple images thông qua RoomTypeImage model

**Trách nhiệm (Methods):**

| STT | Tên phương thức   | Mô tả                                  |
| --- | ----------------- | -------------------------------------- |
| 1   | createRoomType()  | Thêm loại phòng mới                    |
| 2   | updateRoomType()  | Cập nhật thông tin loại phòng          |
| 3   | getRoomTypeById() | Lấy chi tiết loại phòng theo ID        |
| 4   | getAllRoomTypes() | Lấy danh sách loại phòng có phân trang |

---

#### **Lớp Room (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại       | Ràng buộc          | Ý nghĩa/ghi chú           |
| --- | -------------- | ---------- | ------------------ | ------------------------- |
| 1   | id             | String     | private,\<\<PK\>\> | Mã định danh phòng (CUID) |
| 2   | roomNumber     | String     | private, unique    | Số phòng (duy nhất)       |
| 3   | floor          | Int        | private            | Tầng                      |
| 4   | code           | String     | private            | Mã phòng (VD: DLX-101)    |
| 5   | status         | RoomStatus | private            | Trạng thái phòng (Enum)   |
| 6   | roomTypeId     | String     | private,\<\<FK\>\> | Khóa ngoại tới RoomType   |
| 7   | createdAt      | DateTime   | private            | Thời điểm tạo             |
| 8   | updatedAt      | DateTime   | private            | Thời điểm cập nhật cuối   |

**Quan hệ:**

- `images`: RoomImage[] - Danh sách hình ảnh phòng cụ thể (Cloudinary)

**Ghi chú:** Mỗi phòng có thể có nhiều hình ảnh riêng thông qua RoomImage model

**Trách nhiệm (Methods):**

| STT | Tên phương thức    | Mô tả                                    |
| --- | ------------------ | ---------------------------------------- |
| 1   | createRoom()       | Thêm phòng mới vào hệ thống              |
| 2   | updateRoomInfo()   | Cập nhật thông tin phòng                 |
| 3   | updateRoomStatus() | Cập nhật trạng thái phòng                |
| 4   | getRoomById()      | Lấy chi tiết phòng theo ID               |
| 5   | getAllRooms()      | Lấy danh sách phòng có lọc và phân trang |

---

#### **Lớp Booking (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính    | Loại          | Ràng buộc          | Ý nghĩa/ghi chú                      |
| --- | ----------------- | ------------- | ------------------ | ------------------------------------ |
| 1   | id                | String        | private,\<\<PK\>\> | Mã định danh đặt phòng (CUID)        |
| 2   | bookingCode       | String        | private, unique    | Mã đặt phòng (VD: BK1703123456ABC)   |
| 3   | status            | BookingStatus | private            | Trạng thái đặt phòng (Enum)          |
| 4   | primaryCustomerId | String        | private,\<\<FK\>\> | Khách hàng chính (người đặt)         |
| 5   | checkInDate       | DateTime      | private            | Ngày nhận phòng dự kiến              |
| 6   | checkOutDate      | DateTime      | private            | Ngày trả phòng dự kiến               |
| 7   | totalGuests       | Int           | private            | Tổng số khách                        |
| 8   | totalAmount       | Decimal       | private            | Tổng tiền (tổng hợp từ BookingRooms) |
| 9   | depositRequired   | Decimal       | private            | Số tiền cọc yêu cầu                  |
| 10  | createdAt         | DateTime      | private            | Thời điểm tạo                        |
| 11  | updatedAt         | DateTime      | private            | Thời điểm cập nhật cuối              |

**Ghi chú quan trọng:**

- Hệ thống đã đơn giản hóa tài chính, KHÔNG còn theo dõi `totalDeposit`, `totalPaid`, `balance` ở cấp Booking
- Thay vào đó, các Transaction và TransactionDetail sẽ tracking thanh toán chi tiết
- BookingRoom vẫn có các trường tài chính riêng để theo dõi từng phòng

**Trách nhiệm (Methods):**

| STT | Tên phương thức  | Mô tả                                     |
| --- | ---------------- | ----------------------------------------- |
| 1   | createBooking()  | Tạo đặt phòng mới với tự động phân phòng  |
| 2   | checkIn()        | Thực hiện check-in cho các phòng đã chọn  |
| 3   | checkOut()       | Thực hiện check-out cho các phòng đã chọn |
| 4   | cancelBooking()  | Hủy đặt phòng                             |
| 5   | getBookingById() | Lấy chi tiết đặt phòng theo ID            |

---

#### **Lớp BookingRoom (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính      | Loại          | Ràng buộc          | Ý nghĩa/ghi chú                            |
| --- | ------------------- | ------------- | ------------------ | ------------------------------------------ |
| 1   | id                  | String        | private,\<\<PK\>\> | Mã định danh (CUID)                        |
| 2   | bookingId           | String        | private,\<\<FK\>\> | Khóa ngoại tới Booking                     |
| 3   | roomId              | String        | private,\<\<FK\>\> | Khóa ngoại tới Room                        |
| 4   | roomTypeId          | String        | private,\<\<FK\>\> | Khóa ngoại tới RoomType                    |
| 5   | checkInDate         | DateTime      | private            | Ngày nhận phòng dự kiến                    |
| 6   | checkOutDate        | DateTime      | private            | Ngày trả phòng dự kiến                     |
| 7   | actualCheckIn       | DateTime      | private, optional  | Thời điểm check-in thực tế                 |
| 8   | actualCheckOut      | DateTime      | private, optional  | Thời điểm check-out thực tế                |
| 9   | pricePerNight       | Decimal       | private            | Giá phòng mỗi đêm (snapshot)               |
| 10  | subtotalRoom        | Decimal       | private            | Tổng tiền phòng                            |
| 11  | subtotalService     | Decimal       | private            | Tổng tiền dịch vụ                          |
| 12  | totalAmount         | Decimal       | private            | Tổng cộng (phòng + dịch vụ)                |
| 13  | pricingRuleId       | String        | private, optional  | Quy tắc giá được áp dụng (Dynamic Pricing) |
| 14  | pricingRuleSnapshot | Json          | private, optional  | Snapshot của pricing rule (audit trail)    |
| 15  | status              | BookingStatus | private            | Trạng thái phòng trong booking             |
| 16  | createdAt           | DateTime      | private            | Thời điểm tạo                              |
| 17  | updatedAt           | DateTime      | private            | Thời điểm cập nhật cuối                    |

**Ghi chú quan trọng:**

- KHÔNG còn theo dõi `depositAmount`, `totalPaid`, `balance` ở cấp BookingRoom
- Tài chính tracking thông qua Transaction và TransactionDetail
- Đã bổ sung `pricingRuleId` và `pricingRuleSnapshot` để theo dõi dynamic pricing

**Trách nhiệm (Methods):**

| STT | Tên phương thức     | Mô tả                             |
| --- | ------------------- | --------------------------------- |
| 1   | checkIn()           | Check-in cho phòng cụ thể         |
| 2   | checkOut()          | Check-out cho phòng cụ thể        |
| 3   | updateBookingRoom() | Cập nhật thông tin chi tiết phòng |
| 4   | calculateTotals()   | Tính toán lại tổng tiền           |

---

#### **Lớp BookingCustomer (Control)**

**Kế thừa:** Không (Lớp liên kết giữa Booking, Customer và BookingRoom)

**Thuộc tính:**

| STT | Tên thuộc tính | Loại     | Ràng buộc                    | Ý nghĩa/ghi chú               |
| --- | -------------- | -------- | ---------------------------- | ----------------------------- |
| 1   | id             | String   | private,\<\<PK\>\>           | Mã định danh (CUID)           |
| 2   | bookingId      | String   | private,\<\<FK\>\>           | Khóa ngoại tới Booking        |
| 3   | customerId     | String   | private,\<\<FK\>\>           | Khóa ngoại tới Customer       |
| 4   | bookingRoomId  | String   | private,\<\<FK\>\>, optional | Khóa ngoại tới BookingRoom    |
| 5   | isPrimary      | Boolean  | private                      | Là khách hàng chính hay không |
| 6   | createdAt      | DateTime | private                      | Thời điểm tạo                 |
| 7   | updatedAt      | DateTime | private                      | Thời điểm cập nhật cuối       |

**Ràng buộc:** Unique constraint trên (bookingId, customerId)

**Trách nhiệm (Methods):**

| STT | Tên phương thức             | Mô tả                             |
| --- | --------------------------- | --------------------------------- |
| 1   | addCustomerToBooking()      | Thêm khách hàng vào booking/phòng |
| 2   | removeCustomerFromBooking() | Xóa khách hàng khỏi booking/phòng |

---

#### **Lớp Service (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại     | Ràng buộc          | Ý nghĩa/ghi chú               |
| --- | -------------- | -------- | ------------------ | ----------------------------- |
| 1   | id             | String   | private,\<\<PK\>\> | Mã định danh dịch vụ (CUID)   |
| 2   | name           | String   | private            | Tên dịch vụ                   |
| 3   | price          | Decimal  | private            | Đơn giá dịch vụ               |
| 4   | unit           | String   | private            | Đơn vị tính (mặc định: "lần") |
| 5   | isActive       | Boolean  | private            | Trạng thái hoạt động          |
| 6   | imageUrl       | String   | private, optional  | URL ảnh chính (deprecated)    |
| 7   | createdAt      | DateTime | private            | Thời điểm tạo                 |
| 8   | updatedAt      | DateTime | private            | Thời điểm cập nhật cuối       |

**Quan hệ:**

- `images`: ServiceImage[] - Danh sách hình ảnh dịch vụ (Cloudinary)

**Ghi chú:** Hỗ trợ multiple images thông qua ServiceImage model

**Trách nhiệm (Methods):**

| STT | Tên phương thức  | Mô tả                                      |
| --- | ---------------- | ------------------------------------------ |
| 1   | createService()  | Thêm dịch vụ mới                           |
| 2   | updateService()  | Cập nhật thông tin dịch vụ                 |
| 3   | getServiceById() | Lấy chi tiết dịch vụ theo ID               |
| 4   | getAllServices() | Lấy danh sách dịch vụ có lọc và phân trang |

---

#### **Lớp ServiceUsage (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại               | Ràng buộc                    | Ý nghĩa/ghi chú                                    |
| --- | -------------- | ------------------ | ---------------------------- | -------------------------------------------------- |
| 1   | id             | String             | private,\<\<PK\>\>           | Mã định danh (CUID)                                |
| 2   | bookingId      | String             | private,\<\<FK\>\>, optional | Khóa ngoại tới Booking (optional cho guest)        |
| 3   | bookingRoomId  | String             | private,\<\<FK\>\>, optional | Khóa ngoại tới BookingRoom                         |
| 4   | employeeId     | String             | private,\<\<FK\>\>           | Nhân viên phục vụ                                  |
| 5   | serviceId      | String             | private,\<\<FK\>\>           | Khóa ngoại tới Service                             |
| 6   | quantity       | Int                | private                      | Số lượng sử dụng                                   |
| 7   | unitPrice      | Decimal            | private                      | Đơn giá (snapshot từ Service)                      |
| 8   | customPrice    | Decimal            | private, optional            | Giá tùy chỉnh (penalty/surcharge)                  |
| 9   | totalPrice     | Decimal            | private                      | Thành tiền (customPrice hoặc unitPrice × quantity) |
| 10  | totalPaid      | Decimal            | private                      | Số tiền đã thanh toán                              |
| 11  | note           | String             | private, optional            | Ghi chú lý do penalty/surcharge                    |
| 12  | status         | ServiceUsageStatus | private                      | Trạng thái sử dụng dịch vụ (Enum)                  |
| 13  | createdAt      | DateTime           | private                      | Thời điểm tạo                                      |
| 14  | updatedAt      | DateTime           | private                      | Thời điểm cập nhật cuối                            |

**Ghi chú:**

- Đã bổ sung `customPrice` và `note` để hỗ trợ penalty/surcharge
- `totalPrice` = `customPrice` (nếu có) hoặc `unitPrice × quantity`
- `balance` = `totalPrice - totalPaid` (calculated field, không lưu DB)

**Ghi chú:** Hệ thống hỗ trợ 3 kịch bản sử dụng dịch vụ:

- **Booking-level service:** Có bookingId, không có bookingRoomId
- **Room-specific service:** Có cả bookingId và bookingRoomId
- **Guest service:** Không có bookingId và bookingRoomId (khách vãng lai)

**Trách nhiệm (Methods):**

| STT | Tên phương thức             | Mô tả                             |
| --- | --------------------------- | --------------------------------- |
| 1   | createServiceUsage()        | Tạo bản ghi sử dụng dịch vụ       |
| 2   | updateServiceUsage()        | Cập nhật số lượng hoặc trạng thái |
| 3   | cancelServiceUsage()        | Hủy sử dụng dịch vụ               |
| 4   | updateServiceUsagePayment() | Cập nhật số tiền đã thanh toán    |

---

#### **Lớp Transaction (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại              | Ràng buộc                    | Ý nghĩa/ghi chú                |
| --- | -------------- | :---------------- | ---------------------------- | ------------------------------ |
| 1   | id             | String            | private,\<\<PK\>\>           | Mã định danh giao dịch (CUID)  |
| 2   | bookingId      | String            | private,\<\<FK\>\>, optional | Khóa ngoại tới Booking         |
| 3   | type           | TransactionType   | private                      | Loại giao dịch (Enum)          |
| 4   | baseAmount     | Decimal           | private                      | Số tiền gốc trước giảm giá     |
| 5   | discountAmount | Decimal           | private                      | Số tiền được giảm (promotions) |
| 6   | amount         | Decimal           | private                      | Số tiền thực tế (sau giảm giá) |
| 7   | method         | PaymentMethod     | private, optional            | Phương thức thanh toán (Enum)  |
| 8   | status         | TransactionStatus | private                      | Trạng thái giao dịch (Enum)    |
| 9   | processedById  | String            | private,\<\<FK\>\>, optional | Nhân viên xử lý                |
| 10  | occurredAt     | DateTime          | private                      | Thời điểm giao dịch            |
| 11  | description    | String            | private, optional            | Mô tả giao dịch                |
| 12  | createdAt      | DateTime          | private                      | Thời điểm tạo                  |
| 13  | updatedAt      | DateTime          | private                      | Thời điểm cập nhật cuối        |

**Ghi chú quan trọng:**

- Đã bổ sung `baseAmount`, `discountAmount` để hỗ trợ promotion system
- `amount` = `baseAmount` - `discountAmount`
- KHÔNG còn `transactionRef` field

**Ghi chú:** Hệ thống hỗ trợ 4 kịch bản thanh toán:

1. **Full booking payment:** Thanh toán toàn bộ booking
2. **Split room payment:** Thanh toán theo phòng được chọn
3. **Booking service payment:** Thanh toán dịch vụ trong booking
4. **Guest service payment:** Thanh toán dịch vụ khách vãng lai (chỉ tạo TransactionDetail)

**Trách nhiệm (Methods):**

| STT | Tên phương thức                | Mô tả                                           |
| --- | ------------------------------ | ----------------------------------------------- |
| 1   | createTransaction()            | Entry point tạo giao dịch (route theo kịch bản) |
| 2   | processFullBookingPayment()    | Xử lý thanh toán toàn bộ booking                |
| 3   | processSplitRoomPayment()      | Xử lý thanh toán theo phòng                     |
| 4   | processBookingServicePayment() | Xử lý thanh toán dịch vụ booking                |
| 5   | processGuestServicePayment()   | Xử lý thanh toán dịch vụ khách vãng lai         |

---

#### **Lớp TransactionDetail (Control)**

**Kế thừa:** Không (Lớp phân bổ thanh toán)

**Thuộc tính:**

| STT | Tên thuộc tính | Loại     | Ràng buộc                    | Ý nghĩa/ghi chú                             |
| --- | -------------- | -------- | ---------------------------- | ------------------------------------------- |
| 1   | id             | String   | private,\<\<PK\>\>           | Mã định danh (CUID)                         |
| 2   | transactionId  | String   | private,\<\<FK\>\>, optional | Khóa ngoại tới Transaction (null cho guest) |
| 3   | baseAmount     | Decimal  | private                      | Số tiền gốc trước giảm giá                  |
| 4   | discountAmount | Decimal  | private                      | Số tiền được giảm (promotions)              |
| 5   | amount         | Decimal  | private                      | Số tiền thực tế (sau giảm giá)              |
| 6   | bookingRoomId  | String   | private,\<\<FK\>\>, optional | Nếu thanh toán tiền phòng                   |
| 7   | serviceUsageId | String   | private,\<\<FK\>\>, optional | Nếu thanh toán dịch vụ                      |
| 8   | createdAt      | DateTime | private                      | Thời điểm tạo                               |

**Ghi chú:**

- Đã bổ sung `baseAmount`, `discountAmount` để hỗ trợ promotion system
- `amount` = `baseAmount` - `discountAmount`

**Ghi chú:** Mỗi TransactionDetail chỉ liên kết với MỘT trong hai: bookingRoomId HOẶC serviceUsageId

**Trách nhiệm (Methods):**

| STT | Tên phương thức           | Mô tả                           |
| --- | ------------------------- | ------------------------------- |
| 1   | createTransactionDetail() | Tạo chi tiết phân bổ thanh toán |

---

#### **Lớp Activity (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại         | Ràng buộc                    | Ý nghĩa/ghi chú           |
| --- | -------------- | ------------ | ---------------------------- | ------------------------- |
| 1   | id             | String       | private,\<\<PK\>\>           | Mã định danh (CUID)       |
| 2   | type           | ActivityType | private                      | Loại hoạt động (Enum)     |
| 3   | metadata       | Json         | private, optional            | Dữ liệu bổ sung (JSON)    |
| 4   | description    | String       | private                      | Mô tả hoạt động           |
| 5   | serviceUsageId | String       | private,\<\<FK\>\>, optional | Liên kết tới ServiceUsage |
| 6   | bookingRoomId  | String       | private,\<\<FK\>\>, optional | Liên kết tới BookingRoom  |
| 7   | customerId     | String       | private,\<\<FK\>\>, optional | Liên kết tới Customer     |
| 8   | employeeId     | String       | private,\<\<FK\>\>, optional | Liên kết tới Employee     |
| 9   | createdAt      | DateTime     | private                      | Thời điểm tạo             |
| 10  | updatedAt      | DateTime     | private                      | Thời điểm cập nhật cuối   |

**Trách nhiệm (Methods):**

| STT | Tên phương thức             | Mô tả                          |
| --- | --------------------------- | ------------------------------ |
| 1   | createActivity()            | Tạo bản ghi hoạt động          |
| 2   | createCheckInActivity()     | Tạo hoạt động check-in         |
| 3   | createCheckOutActivity()    | Tạo hoạt động check-out        |
| 4   | createTransactionActivity() | Tạo hoạt động giao dịch        |
| 5   | getActivities()             | Lấy danh sách hoạt động có lọc |

---

#### **Lớp RoomStatus (Entity - Enum)**

**Các giá trị:**

| Giá trị        | Ý nghĩa                        |
| -------------- | ------------------------------ |
| AVAILABLE      | Phòng trống, sẵn sàng cho thuê |
| RESERVED       | Phòng đã được đặt trước        |
| OCCUPIED       | Phòng đang có khách ở          |
| CLEANING       | Phòng đang được dọn dẹp        |
| MAINTENANCE    | Phòng đang bảo trì             |
| OUT_OF_SERVICE | Phòng ngừng hoạt động          |

---

#### **Lớp BookingStatus (Entity - Enum)**

**Các giá trị:**

| Giá trị               | Ý nghĩa                                   |
| --------------------- | ----------------------------------------- |
| PENDING               | Chờ xác nhận (chưa đặt cọc)               |
| CONFIRMED             | Đã xác nhận (đã đặt cọc)                  |
| CHECKED_IN            | Đã nhận phòng                             |
| PARTIALLY_CHECKED_OUT | Một số phòng đã trả (booking nhiều phòng) |
| CHECKED_OUT           | Đã trả phòng hoàn toàn                    |
| CANCELLED             | Đã hủy                                    |

---

#### **Lớp ServiceUsageStatus (Entity - Enum)**

**Các giá trị:**

| Giá trị     | Ý nghĩa                          |
| ----------- | -------------------------------- |
| PENDING     | Dịch vụ đã yêu cầu, chờ phục vụ  |
| TRANSFERRED | Dịch vụ đã chuyển giao cho khách |
| COMPLETED   | Dịch vụ đã hoàn thành            |
| CANCELLED   | Dịch vụ đã hủy                   |

---

#### **Lớp TransactionStatus (Entity - Enum)**

**Các giá trị:**

| Giá trị   | Ý nghĩa                  |
| --------- | ------------------------ |
| PENDING   | Giao dịch đang chờ xử lý |
| COMPLETED | Giao dịch đã hoàn thành  |
| FAILED    | Giao dịch thất bại       |
| REFUNDED  | Giao dịch đã hoàn tiền   |

---

#### **Lớp PaymentMethod (Entity - Enum)**

**Các giá trị:**

| Giá trị       | Ý nghĩa                |
| ------------- | ---------------------- |
| CASH          | Tiền mặt               |
| CREDIT_CARD   | Thẻ tín dụng           |
| BANK_TRANSFER | Chuyển khoản ngân hàng |
| E_WALLET      | Ví điện tử             |

---

#### **Lớp TransactionType (Entity - Enum)**

**Các giá trị:**

| Giá trị        | Ý nghĩa                 |
| -------------- | ----------------------- |
| DEPOSIT        | Đặt cọc                 |
| ROOM_CHARGE    | Thanh toán tiền phòng   |
| SERVICE_CHARGE | Thanh toán tiền dịch vụ |
| REFUND         | Hoàn tiền               |
| ADJUSTMENT     | Điều chỉnh              |

---

#### **Lớp ActivityType (Entity - Enum)**

**Các giá trị:**

| Giá trị              | Ý nghĩa                  |
| -------------------- | ------------------------ |
| CREATE_BOOKING       | Tạo đặt phòng mới        |
| UPDATE_BOOKING       | Cập nhật đặt phòng       |
| CREATE_BOOKING_ROOM  | Thêm phòng vào đặt phòng |
| UPDATE_BOOKING_ROOM  | Cập nhật chi tiết phòng  |
| CREATE_SERVICE_USAGE | Tạo sử dụng dịch vụ      |
| UPDATE_SERVICE_USAGE | Cập nhật sử dụng dịch vụ |
| CREATE_TRANSACTION   | Tạo giao dịch mới        |
| UPDATE_TRANSACTION   | Cập nhật giao dịch       |
| CREATE_CUSTOMER      | Tạo khách hàng mới       |
| CHECKED_IN           | Check-in                 |
| CHECKED_OUT          | Check-out                |
| CREATE_PROMOTION     | Tạo mã khuyến mãi mới    |
| UPDATE_PROMOTION     | Cập nhật mã khuyến mãi   |
| CLAIM_PROMOTION      | Khách hàng nhận mã KM    |
| UPDATE_CUSTOMER_RANK | Cập nhật hạng VIP        |

---

#### **Lớp RoomTypeImage / RoomImage / ServiceImage (Entity)**

**Mục đích:** Quản lý hình ảnh sử dụng Cloudinary CDN

**Thuộc tính chung:**

| STT | Tên thuộc tính | Loại    | Ý nghĩa/ghi chú                                 |
| --- | -------------- | ------- | ----------------------------------------------- |
| 1   | id             | String  | Mã định danh (CUID)                             |
| 2   | cloudinaryId   | String  | Cloudinary public_id (dùng để xóa và transform) |
| 3   | url            | String  | Full Cloudinary URL                             |
| 4   | secureUrl      | String  | HTTPS Cloudinary URL (khuyến nghị sử dụng)      |
| 5   | thumbnailUrl   | String  | Pre-generated thumbnail URL (300px width)       |
| 6   | width          | Int     | Chiều rộng ảnh                                  |
| 7   | height         | Int     | Chiều cao ảnh                                   |
| 8   | format         | String  | Định dạng ảnh (jpg, png, webp)                  |
| 9   | sortOrder      | Int     | Thứ tự hiển thị                                 |
| 10  | isDefault      | Boolean | Ảnh mặc định                                    |

**Ghi chú:**

- Upload thông qua multer-storage-cloudinary
- Tự động generate thumbnail transformation
- Cascade delete khi xóa entity cha

---

#### **Lớp Promotion (Control)**

**Mục đích:** Quản lý mã khuyến mãi và chiến dịch giảm giá

**Thuộc tính:**

| STT | Tên thuộc tính   | Loại           | Ý nghĩa/ghi chú                          |
| --- | ---------------- | -------------- | ---------------------------------------- |
| 1   | id               | String         | Mã định danh (CUID)                      |
| 2   | code             | String         | Mã khuyến mãi (unique)                   |
| 3   | description      | String         | Mô tả chi tiết                           |
| 4   | type             | PromotionType  | PERCENTAGE hoặc FIXED_AMOUNT             |
| 5   | scope            | PromotionScope | ROOM/SERVICE/ALL                         |
| 6   | value            | Decimal        | Giá trị giảm (% hoặc số tiền)            |
| 7   | maxDiscount      | Decimal        | Giảm tối đa (cho loại PERCENTAGE)        |
| 8   | minBookingAmount | Decimal        | Giá trị đơn hàng tối thiểu               |
| 9   | startDate        | DateTime       | Ngày bắt đầu hiệu lực                    |
| 10  | endDate          | DateTime       | Ngày hết hạn                             |
| 11  | totalQty         | Int            | Tổng số lượng mã (null = không giới hạn) |
| 12  | remainingQty     | Int            | Số lượng còn lại                         |
| 13  | perCustomerLimit | Int            | Giới hạn sử dụng/khách (mặc định: 1)     |
| 14  | disabledAt       | DateTime       | Thời điểm vô hiệu hóa                    |

---

#### **Lớp CustomerRank (Entity)**

**Mục đích:** Hệ thống phân hạng VIP khách hàng

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ý nghĩa/ghi chú                          |
| --- | -------------- | ------- | ---------------------------------------- |
| 1   | id             | String  | Mã định danh (CUID)                      |
| 2   | name           | String  | Tên kỹ thuật (VIP1, VIP2...)             |
| 3   | displayName    | String  | Tên hiển thị (Thành viên Đồng, Bạc...)   |
| 4   | description    | String  | Mô tả chi tiết                           |
| 5   | minSpending    | Decimal | Chi tiêu tối thiểu để đạt hạng           |
| 6   | maxSpending    | Decimal | Chi tiêu tối đa (null cho hạng cao nhất) |
| 7   | benefits       | String  | Quyền lợi (JSON string)                  |
| 8   | color          | String  | Màu sắc hiển thị (hex color)             |

**Ghi chú:** Customer có trường `totalSpent` để cache tổng chi tiêu

---

#### **Lớp CalendarEvent (Entity)**

**Mục đích:** Định nghĩa các sự kiện đặc biệt cho dynamic pricing

**Thuộc tính:**

| STT | Tên thuộc tính | Loại      | Ý nghĩa/ghi chú                             |
| --- | -------------- | --------- | ------------------------------------------- |
| 1   | id             | String    | Mã định danh (CUID)                         |
| 2   | name           | String    | Tên sự kiện (VD: "Tết Nguyên Đán 2026")     |
| 3   | description    | String    | Mô tả chi tiết                              |
| 4   | type           | EventType | HOLIDAY/SEASONAL/SPECIAL_EVENT              |
| 5   | startDate      | DateTime  | Ngày bắt đầu                                |
| 6   | endDate        | DateTime  | Ngày kết thúc                               |
| 7   | rrule          | String    | RRule cho sự kiện lặp lại (RFC 5545 format) |

**Ghi chú:** Hỗ trợ recurring events qua RRule (VD: Tết hàng năm)

---

#### **Lớp PricingRule (Control)**

**Mục đích:** Định nghĩa quy tắc điều chỉnh giá động

**Thuộc tính:**

| STT | Tên thuộc tính  | Loại           | Ý nghĩa/ghi chú                               |
| --- | --------------- | -------------- | --------------------------------------------- |
| 1   | id              | String         | Mã định danh (CUID)                           |
| 2   | name            | String         | Tên quy tắc                                   |
| 3   | rank            | String         | LexoRank (thứ tự ưu tiên, top wins)           |
| 4   | roomTypeIds     | String[]       | Loại phòng áp dụng (empty = toàn bộ)          |
| 5   | calendarEventId | String         | Kế thừa thời gian từ CalendarEvent (optional) |
| 6   | startDate       | DateTime       | Hoặc set cứng ngày (optional)                 |
| 7   | endDate         | DateTime       | Hoặc set cứng ngày (optional)                 |
| 8   | recurrenceRule  | String         | RRule cho lặp lại phức tạp (VD: cuối tuần)    |
| 9   | adjustmentType  | AdjustmentType | PERCENTAGE hoặc FIXED_AMOUNT                  |
| 10  | adjustmentValue | Decimal        | Giá trị điều chỉnh (hỗ trợ số âm để giảm giá) |
| 11  | isActive        | Boolean        | Trạng thái kích hoạt                          |

**Ghi chú:**

- Sử dụng LexoRank để sắp xếp priority
- "Top of List Wins" strategy - quy tắc đầu tiên match sẽ được áp dụng
- BookingRoom có `pricingRuleId` và `pricingRuleSnapshot` để audit trail

---

#### **Lớp Role & Permission (Entity - RBAC)**

**Mục đích:** Quản lý phân quyền chi tiết cho nhân viên

**Role:**

| STT | Tên thuộc tính | Loại    | Ý nghĩa/ghi chú      |
| --- | -------------- | ------- | -------------------- |
| 1   | id             | String  | Mã định danh (CUID)  |
| 2   | name           | String  | Tên vai trò (unique) |
| 3   | description    | String  | Mô tả chi tiết       |
| 4   | isActive       | Boolean | Trạng thái kích hoạt |

**Permission:**

| STT | Tên thuộc tính | Loại           | Ý nghĩa/ghi chú                              |
| --- | -------------- | -------------- | -------------------------------------------- |
| 1   | id             | String         | Mã định danh (CUID)                          |
| 2   | name           | String         | Tên quyền (VD: "booking:create")             |
| 3   | type           | PermissionType | SCREEN hoặc ACTION                           |
| 4   | subject        | String         | Đối tượng (Booking, Room, Employee...)       |
| 5   | action         | String         | Hành động (access/create/read/update/delete) |
| 6   | description    | String         | Mô tả chi tiết                               |
| 7   | parentId       | String         | Hỗ trợ cây phân cấp quyền                    |

**Ghi chú:** Hệ thống sử dụng CASL (Attribute-Based Access Control)

---

## 3.2 **Sơ đồ trạng thái**

### 3.2.1 **Sơ đồ trạng thái cho lớp Room (Phòng)**

Lớp **Room** quản lý trạng thái vật lý của phòng trong khách sạn, phản ánh tình trạng sử dụng thực tế.

```plantuml
@startuml
skinparam state {
  BackgroundColor<<available>> LightGreen
  BackgroundColor<<reserved>> LightBlue
  BackgroundColor<<occupied>> Orange
  BackgroundColor<<cleaning>> Yellow
  BackgroundColor<<maintenance>> LightGray
  BackgroundColor<<outofservice>> Red
}

[*] --> AVAILABLE : Khởi tạo phòng mới

state "AVAILABLE\n(Trống)" as AVAILABLE <<available>>
state "RESERVED\n(Đã đặt)" as RESERVED <<reserved>>
state "OCCUPIED\n(Đang sử dụng)" as OCCUPIED <<occupied>>
state "CLEANING\n(Đang dọn)" as CLEANING <<cleaning>>
state "MAINTENANCE\n(Bảo trì)" as MAINTENANCE <<maintenance>>
state "OUT_OF_SERVICE\n(Ngừng hoạt động)" as OUT_OF_SERVICE <<outofservice>>

AVAILABLE --> OCCUPIED : Khách check-in\n[checkIn()]
AVAILABLE --> MAINTENANCE : Báo hỏng/cần sửa
AVAILABLE --> OUT_OF_SERVICE : Ngừng hoạt động

RESERVED --> OCCUPIED : Khách check-in\n[checkIn()]
RESERVED --> AVAILABLE : Khách hủy đặt phòng\n[cancelBooking()]

OCCUPIED --> AVAILABLE : Khách check-out\n(không có booking khác)
OCCUPIED --> RESERVED : Khách check-out\n(có booking khác cho hôm nay)
OCCUPIED --> CLEANING : Khách check-out\n(cần dọn dẹp)

CLEANING --> AVAILABLE : Dọn dẹp hoàn tất

MAINTENANCE --> AVAILABLE : Sửa chữa hoàn tất
MAINTENANCE --> OUT_OF_SERVICE : Hư hỏng nặng

OUT_OF_SERVICE --> AVAILABLE : Khôi phục hoạt động
OUT_OF_SERVICE --> MAINTENANCE : Cần sửa chữa

@enduml
```

**Danh sách các trạng thái:**

| STT | Trạng thái     | Ý nghĩa                                       |
| --- | -------------- | --------------------------------------------- |
| 1   | AVAILABLE      | Phòng trống, sẵn sàng cho thuê hoặc đặt trước |
| 2   | RESERVED       | Phòng đã được đặt trước, chờ khách đến nhận   |
| 3   | OCCUPIED       | Phòng đang có khách ở (đã check-in)           |
| 4   | CLEANING       | Phòng đang được dọn dẹp sau khi khách trả     |
| 5   | MAINTENANCE    | Phòng đang trong quá trình bảo trì, sửa chữa  |
| 6   | OUT_OF_SERVICE | Phòng ngừng hoạt động hoàn toàn               |

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)                      | Hành động (Action)                                       | Trạng thái kết thúc |
| ------------------ | ------------------------------------ | -------------------------------------------------------- | ------------------- |
| (Mới)              | Thêm phòng mới vào hệ thống          | `createRoom()` - Tạo phòng với status mặc định           | AVAILABLE           |
| AVAILABLE          | Khách check-in                       | `checkIn()` - Ghi nhận actualCheckIn, cập nhật room      | OCCUPIED            |
| AVAILABLE          | Phát hiện hư hỏng cần sửa chữa       | Cập nhật thủ công qua `updateRoomStatus()`               | MAINTENANCE         |
| AVAILABLE          | Ngừng hoạt động phòng                | Cập nhật thủ công qua `updateRoomStatus()`               | OUT_OF_SERVICE      |
| RESERVED           | Khách check-in                       | `checkIn()` - Ghi nhận actualCheckIn, cập nhật room      | OCCUPIED            |
| RESERVED           | Khách/Nhân viên hủy đặt phòng        | `cancelBooking()` - Kiểm tra booking khác                | AVAILABLE/RESERVED  |
| OCCUPIED           | Khách check-out (không booking khác) | `checkOut()` - Ghi actualCheckOut, kiểm tra booking khác | AVAILABLE           |
| OCCUPIED           | Khách check-out (có booking khác)    | `checkOut()` - Ghi actualCheckOut, kiểm tra booking khác | RESERVED            |
| OCCUPIED           | Khách check-out (cần dọn)            | `checkOut()` - Chuyển sang CLEANING nếu cần              | CLEANING            |
| CLEANING           | Nhân viên dọn xong                   | Cập nhật thủ công qua `updateRoomStatus()`               | AVAILABLE           |
| MAINTENANCE        | Sửa chữa hoàn tất                    | Cập nhật thủ công qua `updateRoomStatus()`               | AVAILABLE           |
| MAINTENANCE        | Hư hỏng nặng, không thể sửa          | Cập nhật thủ công qua `updateRoomStatus()`               | OUT_OF_SERVICE      |
| OUT_OF_SERVICE     | Khôi phục hoạt động                  | Cập nhật thủ công qua `updateRoomStatus()`               | AVAILABLE           |

---

### 3.2.2 **Sơ đồ trạng thái cho lớp Booking (Đặt phòng)**

Lớp **Booking** quản lý vòng đời của một đơn đặt phòng từ khi tạo cho đến khi hoàn tất hoặc hủy. Hệ thống hỗ trợ đặt nhiều phòng trong một booking.

```plantuml
@startuml
skinparam state {
  BackgroundColor<<pending>> LightYellow
  BackgroundColor<<confirmed>> LightBlue
  BackgroundColor<<checkedin>> LightGreen
  BackgroundColor<<partial>> Orange
  BackgroundColor<<checkedout>> LightGray
  BackgroundColor<<cancelled>> Pink
}

[*] --> PENDING : Tạo đặt phòng mới\n[createBooking()]

state "PENDING\n(Chờ xác nhận)" as PENDING <<pending>>
state "CONFIRMED\n(Đã xác nhận)" as CONFIRMED <<confirmed>>
state "CHECKED_IN\n(Đã nhận phòng)" as CHECKED_IN <<checkedin>>
state "PARTIALLY_CHECKED_OUT\n(Trả một phần)" as PARTIALLY_CHECKED_OUT <<partial>>
state "CHECKED_OUT\n(Đã trả phòng)" as CHECKED_OUT <<checkedout>>
state "CANCELLED\n(Đã hủy)" as CANCELLED <<cancelled>>

PENDING --> CONFIRMED : Thanh toán tiền cọc\n[createTransaction(DEPOSIT)]
PENDING --> CANCELLED : Hủy đặt phòng\n[cancelBooking()]
PENDING --> CANCELLED : Hết hạn thanh toán\n(15 phút)

CONFIRMED --> CHECKED_IN : Check-in tất cả phòng\n[checkIn()]
CONFIRMED --> CANCELLED : Hủy đặt phòng\n[cancelBooking()]

CHECKED_IN --> PARTIALLY_CHECKED_OUT : Check-out một số phòng\n[checkOut()] (booking nhiều phòng)
CHECKED_IN --> CHECKED_OUT : Check-out tất cả phòng\n[checkOut()]

PARTIALLY_CHECKED_OUT --> CHECKED_OUT : Check-out phòng còn lại\n[checkOut()]

CHECKED_OUT --> [*]
CANCELLED --> [*]

@enduml
```

**Danh sách các trạng thái:**

| STT | Trạng thái            | Ý nghĩa                                                         |
| --- | --------------------- | --------------------------------------------------------------- |
| 1   | PENDING               | Đặt phòng đã tạo, chờ thanh toán tiền cọc (có thời hạn 15 phút) |
| 2   | CONFIRMED             | Đã thanh toán cọc, chờ khách đến nhận phòng                     |
| 3   | CHECKED_IN            | Tất cả phòng trong booking đã được check-in                     |
| 4   | PARTIALLY_CHECKED_OUT | Một số phòng đã check-out (áp dụng cho booking nhiều phòng)     |
| 5   | CHECKED_OUT           | Tất cả phòng đã check-out, booking hoàn tất                     |
| 6   | CANCELLED             | Đặt phòng đã bị hủy                                             |

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu    | Biến cố (Event)                     | Hành động (Action)                                                 | Trạng thái kết thúc   |
| --------------------- | ----------------------------------- | ------------------------------------------------------------------ | --------------------- |
| (Mới)                 | Khách/Nhân viên tạo đặt phòng       | `createBooking()` - Tạo booking, phân phòng tự động, đặt expiresAt | PENDING               |
| PENDING               | Khách thanh toán tiền cọc           | `createTransaction(DEPOSIT)` - Ghi nhận cọc, cập nhật booking      | CONFIRMED             |
| PENDING               | Hết hạn thanh toán (15 phút)        | Hệ thống tự động hủy, giải phóng phòng                             | CANCELLED             |
| PENDING               | Khách/Nhân viên hủy đặt phòng       | `cancelBooking()` - Cập nhật status, giải phóng phòng              | CANCELLED             |
| CONFIRMED             | Khách đến check-in tất cả phòng     | `checkIn()` - Ghi nhận actualCheckIn cho tất cả BookingRoom        | CHECKED_IN            |
| CONFIRMED             | Khách/Nhân viên hủy đặt phòng       | `cancelBooking()` - Xử lý hoàn cọc (nếu có), giải phóng phòng      | CANCELLED             |
| CHECKED_IN            | Check-out một số phòng (multi-room) | `checkOut()` - Chỉ check-out các phòng được chọn                   | PARTIALLY_CHECKED_OUT |
| CHECKED_IN            | Check-out tất cả phòng              | `checkOut()` - Check-out toàn bộ, cập nhật Room sang AVAILABLE     | CHECKED_OUT           |
| PARTIALLY_CHECKED_OUT | Check-out các phòng còn lại         | `checkOut()` - Check-out phòng cuối cùng                           | CHECKED_OUT           |

**Ghi chú đặc biệt:**

- Trạng thái PARTIALLY_CHECKED_OUT chỉ xuất hiện khi booking có nhiều phòng và check-out từng phần
- Mỗi BookingRoom trong booking có trạng thái riêng, đồng bộ với trạng thái tổng của Booking

---

### 3.2.3 **Sơ đồ trạng thái cho lớp BookingRoom (Chi tiết đặt phòng)**

Lớp **BookingRoom** quản lý trạng thái của từng phòng cụ thể trong một đơn đặt phòng. Trạng thái của BookingRoom độc lập nhưng ảnh hưởng đến trạng thái tổng của Booking.

```plantuml
@startuml
skinparam state {
  BackgroundColor<<pending>> LightYellow
  BackgroundColor<<confirmed>> LightBlue
  BackgroundColor<<checkedin>> LightGreen
  BackgroundColor<<checkedout>> LightGray
  BackgroundColor<<cancelled>> Pink
}

[*] --> PENDING : Tạo BookingRoom\n[createBooking()]

state "PENDING\n(Chờ xác nhận)" as PENDING <<pending>>
state "CONFIRMED\n(Đã xác nhận)" as CONFIRMED <<confirmed>>
state "CHECKED_IN\n(Đã nhận phòng)" as CHECKED_IN <<checkedin>>
state "CHECKED_OUT\n(Đã trả phòng)" as CHECKED_OUT <<checkedout>>
state "CANCELLED\n(Đã hủy)" as CANCELLED <<cancelled>>

PENDING --> CONFIRMED : Thanh toán tiền cọc\n[createTransaction(DEPOSIT)]
PENDING --> CANCELLED : Hủy booking\n[cancelBooking()]

CONFIRMED --> CHECKED_IN : Check-in phòng này\n[checkIn()]
CONFIRMED --> CANCELLED : Hủy booking\n[cancelBooking()]

CHECKED_IN --> CHECKED_OUT : Check-out phòng này\n[checkOut()]

CHECKED_OUT --> [*]
CANCELLED --> [*]

@enduml
```

**Danh sách các trạng thái:**

| STT | Trạng thái  | Ý nghĩa                                         |
| --- | ----------- | ----------------------------------------------- |
| 1   | PENDING     | Phòng trong booking chờ xác nhận (chưa đặt cọc) |
| 2   | CONFIRMED   | Phòng đã được xác nhận, chờ check-in            |
| 3   | CHECKED_IN  | Khách đã nhận phòng này                         |
| 4   | CHECKED_OUT | Khách đã trả phòng này                          |
| 5   | CANCELLED   | Phòng trong booking đã bị hủy                   |

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)           | Hành động (Action)                                            | Trạng thái kết thúc |
| ------------------ | ------------------------- | ------------------------------------------------------------- | ------------------- |
| (Mới)              | Tạo booking với phòng     | `createBooking()` - Tạo BookingRoom với status PENDING        | PENDING             |
| PENDING            | Thanh toán cọc thành công | `createTransaction(DEPOSIT)` - Cập nhật tất cả BookingRoom    | CONFIRMED           |
| PENDING            | Hủy booking               | `cancelBooking()` - Cập nhật status sang CANCELLED            | CANCELLED           |
| CONFIRMED          | Check-in phòng cụ thể     | `checkIn()` - Ghi actualCheckIn, cập nhật Room sang OCCUPIED  | CHECKED_IN          |
| CONFIRMED          | Hủy booking               | `cancelBooking()` - Cập nhật status, gọi updateRoomStatuses() | CANCELLED           |
| CHECKED_IN         | Check-out phòng cụ thể    | `checkOut()` - Ghi actualCheckOut, gọi updateRoomStatuses()   | CHECKED_OUT         |

**Mối quan hệ với Booking:**

- Khi tất cả BookingRoom chuyển sang CHECKED_IN → Booking chuyển sang CHECKED_IN
- Khi một số BookingRoom chuyển sang CHECKED_OUT (còn lại CHECKED_IN) → Booking chuyển sang PARTIALLY_CHECKED_OUT
- Khi tất cả BookingRoom chuyển sang CHECKED_OUT → Booking chuyển sang CHECKED_OUT

---

### 3.2.4 **Sơ đồ trạng thái cho lớp ServiceUsage (Sử dụng dịch vụ)**

Lớp **ServiceUsage** quản lý vòng đời của một lần sử dụng dịch vụ, từ khi yêu cầu đến khi hoàn thành hoặc hủy.

```plantuml
@startuml
skinparam state {
  BackgroundColor<<pending>> LightYellow
  BackgroundColor<<transferred>> LightBlue
  BackgroundColor<<completed>> LightGreen
  BackgroundColor<<cancelled>> Pink
}

[*] --> PENDING : Tạo yêu cầu dịch vụ\n[createServiceUsage()]

state "PENDING\n(Chờ phục vụ)" as PENDING <<pending>>
state "TRANSFERRED\n(Đã chuyển giao)" as TRANSFERRED <<transferred>>
state "COMPLETED\n(Hoàn thành)" as COMPLETED <<completed>>
state "CANCELLED\n(Đã hủy)" as CANCELLED <<cancelled>>

PENDING --> TRANSFERRED : Chuyển giao dịch vụ cho khách\n[updateServiceUsage(TRANSFERRED)]
PENDING --> CANCELLED : Hủy yêu cầu\n[updateServiceUsage(CANCELLED)]

TRANSFERRED --> COMPLETED : Hoàn thành dịch vụ\n[updateServiceUsage(COMPLETED)]
TRANSFERRED --> CANCELLED : Hủy sau khi chuyển giao\n[updateServiceUsage(CANCELLED)]

COMPLETED --> [*]
CANCELLED --> [*]

note right of PENDING
  Có thể cập nhật số lượng
  khi đang ở trạng thái này
end note

note right of TRANSFERRED
  Không thể thay đổi số lượng
  sau khi đã chuyển giao
end note

note right of CANCELLED
  Có thể hủy từ bất kỳ
  trạng thái nào
end note

@enduml
```

**Danh sách các trạng thái:**

| STT | Trạng thái  | Ý nghĩa                                                       |
| --- | ----------- | ------------------------------------------------------------- |
| 1   | PENDING     | Dịch vụ đã được yêu cầu, đang chờ nhân viên phục vụ           |
| 2   | TRANSFERRED | Dịch vụ đã được chuyển giao cho khách (VD: đồ ăn đã mang lên) |
| 3   | COMPLETED   | Dịch vụ đã hoàn thành và thanh toán xong                      |
| 4   | CANCELLED   | Dịch vụ đã bị hủy                                             |

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)                    | Hành động (Action)                                              | Trạng thái kết thúc |
| ------------------ | ---------------------------------- | --------------------------------------------------------------- | ------------------- |
| (Mới)              | Nhân viên tạo yêu cầu dịch vụ      | `createServiceUsage()` - Tạo với status PENDING                 | PENDING             |
| PENDING            | Nhân viên cập nhật số lượng        | `updateServiceUsage()` - Cập nhật quantity, tính lại totalPrice | PENDING             |
| PENDING            | Nhân viên chuyển giao cho khách    | `updateServiceUsage(TRANSFERRED)` - Khóa số lượng               | TRANSFERRED         |
| PENDING            | Hủy yêu cầu dịch vụ                | `updateServiceUsage(CANCELLED)` - Đặt totalPrice = 0            | CANCELLED           |
| TRANSFERRED        | Hoàn thành dịch vụ (đã thanh toán) | `updateServiceUsage(COMPLETED)` - Đánh dấu hoàn thành           | COMPLETED           |
| TRANSFERRED        | Hủy sau khi chuyển giao            | `updateServiceUsage(CANCELLED)` - Đặt totalPrice = 0            | CANCELLED           |

**Quy tắc chuyển đổi trạng thái:**

| Từ trạng thái | Có thể chuyển sang     | Không thể chuyển sang |
| ------------- | ---------------------- | --------------------- |
| PENDING       | TRANSFERRED, CANCELLED | COMPLETED             |
| TRANSFERRED   | COMPLETED, CANCELLED   | PENDING               |
| COMPLETED     | (Không thể thay đổi)   | Tất cả                |
| CANCELLED     | (Không thể thay đổi)   | Tất cả                |

**Ràng buộc nghiệp vụ:**

- Chỉ có thể cập nhật `quantity` khi status là PENDING
- Có thể hủy (CANCELLED) từ bất kỳ trạng thái nào (trừ COMPLETED và CANCELLED)
- Khi hủy, `totalPrice` được đặt về 0

---

### 3.2.5 **Sơ đồ trạng thái cho lớp Transaction (Giao dịch)**

Lớp **Transaction** quản lý trạng thái của các giao dịch thanh toán trong hệ thống.

```plantuml
@startuml
skinparam state {
  BackgroundColor<<pending>> LightYellow
  BackgroundColor<<completed>> LightGreen
  BackgroundColor<<failed>> Pink
  BackgroundColor<<refunded>> LightGray
}

[*] --> PENDING : Khởi tạo giao dịch

state "PENDING\n(Chờ xử lý)" as PENDING <<pending>>
state "COMPLETED\n(Hoàn thành)" as COMPLETED <<completed>>
state "FAILED\n(Thất bại)" as FAILED <<failed>>
state "REFUNDED\n(Đã hoàn tiền)" as REFUNDED <<refunded>>

PENDING --> COMPLETED : Thanh toán thành công\n[processPayment()]
PENDING --> FAILED : Thanh toán thất bại\n[processPayment()]

COMPLETED --> REFUNDED : Yêu cầu hoàn tiền\n[createTransaction(REFUND)]

FAILED --> [*]
REFUNDED --> [*]
COMPLETED --> [*]

note right of COMPLETED
  Tạo TransactionDetail để
  phân bổ thanh toán cho
  BookingRoom hoặc ServiceUsage
end note

@enduml
```

**Danh sách các trạng thái:**

| STT | Trạng thái | Ý nghĩa                            |
| --- | ---------- | ---------------------------------- |
| 1   | PENDING    | Giao dịch đang chờ xử lý           |
| 2   | COMPLETED  | Giao dịch đã hoàn thành thành công |
| 3   | FAILED     | Giao dịch thất bại                 |
| 4   | REFUNDED   | Giao dịch đã được hoàn tiền        |

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)             | Hành động (Action)                                              | Trạng thái kết thúc |
| ------------------ | --------------------------- | --------------------------------------------------------------- | ------------------- |
| (Mới)              | Khởi tạo giao dịch          | `createTransaction()` - Tạo transaction với status tùy scenario | PENDING/COMPLETED   |
| PENDING            | Xử lý thanh toán thành công | Cập nhật status, phân bổ tiền qua TransactionDetail             | COMPLETED           |
| PENDING            | Xử lý thanh toán thất bại   | Cập nhật status sang FAILED                                     | FAILED              |
| COMPLETED          | Yêu cầu hoàn tiền           | `createTransaction(REFUND)` - Tạo giao dịch hoàn tiền mới       | REFUNDED            |

**Ghi chú:**

- Trong hệ thống hiện tại, hầu hết giao dịch được tạo với status COMPLETED ngay lập tức (thanh toán trực tiếp)
- TransactionDetail được tạo để phân bổ số tiền cho BookingRoom hoặc ServiceUsage cụ thể
- Transaction và TransactionDetail là single source of truth cho payment tracking (Booking và BookingRoom không còn lưu totalPaid/balance)

## 3.3 Mô hình động ( dynamic model )

### 3.3.1 Sơ đồ sequence cho Use Case "Check-in nhận phòng"

```plantuml

@startuml

title Hotel Booking Management - Employee Use Cases

actor Employee
participant "API Gateway" as API
participant "Booking\nController" as Controller
participant "Booking\nService" as Service
participant "Prisma\nClient" as Prisma
database "Database" as DB

== Use Case 1: Check-In Guests ==

Employee -> API: POST /employee-api/v1/bookings/check-in-rooms\n{checkInInfo: [{bookingRoomId, customerIds[]}]}
activate API
API -> API: Validate Request\n(bookingValidation.checkIn)
API -> Controller: checkInRooms(req, res)
activate Controller
Controller -> Service: checkIn(input)
activate Service

Service -> Prisma: findMany(bookingRooms)\nwhere: {id in bookingRoomIds}
activate Prisma
Prisma -> DB: SELECT booking_rooms with room
DB --> Prisma: Booking rooms data
Prisma --> Service: bookingRooms[]
deactivate Prisma

alt Booking rooms not found
    Service --> Controller: throw ApiError(404, "Booking rooms not found")
    Controller --> API: Error response
    API --> Employee: 404 Not Found
end

alt Any room not AVAILABLE
    Service --> Controller: throw ApiError(400, "Rooms not ready")
    Controller --> API: Error response
    API --> Employee: 400 Bad Request
end

Service -> Prisma: findMany(customers)\nwhere: {id in customerIds}
activate Prisma
Prisma -> DB: SELECT customers
DB --> Prisma: Customer records
Prisma --> Service: customers[]
deactivate Prisma

alt Customers not found
    Service --> Controller: throw ApiError(404, "Customers not found")
    Controller --> API: Error response
    API --> Employee: 404 Not Found
end

Service -> Prisma: BEGIN TRANSACTION
activate Prisma

Prisma -> DB: UPDATE booking_room\nSET actualCheckIn = now,\n    status = 'CHECKED_IN'
DB --> Prisma: Updated booking_rooms

Prisma -> DB: UPDATE room\nSET status = 'OCCUPIED'
DB --> Prisma: Updated rooms

Prisma -> DB: INSERT INTO booking_customer\n(bookingId, customerId, bookingRoomId...)
DB --> Prisma: Booking customers linked

Service -> Service: Check if all booking rooms\nfor each booking are checked in

alt All rooms checked in
    Prisma -> DB: UPDATE booking\nSET status = 'CHECKED_IN'
    DB --> Prisma: Updated booking
end

Prisma -> DB: INSERT INTO activity\n(type='CHECK_IN', bookingRoomId...)
DB --> Prisma: Activity created

Prisma -> DB: COMMIT
DB --> Prisma: Transaction committed
Prisma --> Service: {booking, bookingRoom}
deactivate Prisma

Service --> Controller: Check-in result
deactivate Service
Controller --> API: sendData(res, result)
deactivate Controller
API --> Employee: 200 OK\n{data: {booking, bookingRoom}}
deactivate API

== Use Case 2: Get Booking Details ==

Employee -> API: GET /employee-api/v1/bookings/{id}
activate API
API -> Controller: getBooking(req, res)
activate Controller
Controller -> Service: getBookingById(bookingId)
activate Service

Service -> Prisma: findUnique(bookingId)\n+ include all relations
activate Prisma
Prisma -> DB: SELECT booking\nJOIN booking_rooms\nJOIN customers\nJOIN transactions\nJOIN histories
DB --> Prisma: Complete booking data
Prisma --> Service: booking with full details
deactivate Prisma

alt Booking not found
    Service --> Controller: throw ApiError(404, "Booking not found")
    Controller --> API: Error response
    API --> Employee: 404 Not Found
end

Service --> Controller: booking
deactivate Service
Controller --> API: sendData(res, booking)
deactivate Controller
API --> Employee: 200 OK\n{data: booking}
deactivate API

@enduml


```

### 3.3.2 Sơ đồ sequence cho Use Case đặt phòng

```plantuml
@startuml

title Hotel Reservation (Create Booking) - Employee Use Case

actor Employee
participant "API Gateway" as API
participant "Booking\nController" as Controller
participant "Booking\nService" as Service
participant "Prisma\nClient" as Prisma
database "Database" as DB

== Use Case: Create Booking with Automatic Room Allocation ==

Employee -> API: POST /customer-api/v1/bookings\n{rooms[], checkInDate, checkOutDate, totalGuests, customerId}
activate API
API -> API: Validate Request\n(bookingValidation.createBooking)

alt Invalid dates or guests
    API --> Employee: 400 Bad Request\n(Validation Error)
end

API -> Controller: createBooking(req, res)
activate Controller
Controller -> Service: createBooking(input)
activate Service

Service -> Service: Calculate nights using dayjs\nnights = checkOut.diff(checkIn, 'day')

alt Check-out date <= Check-in date
    Service --> Controller: throw ApiError(400, "Invalid dates")
    Controller --> API: Error response
    API --> Employee: 400 Bad Request
end

Service -> Service: Extract room type IDs\nfrom rooms[]

Service -> Prisma: findMany(roomTypes)\nwhere: {id in roomTypeIds}
activate Prisma
Prisma -> DB: SELECT * FROM room_type\nWHERE id IN (...)
DB --> Prisma: Room types
Prisma --> Service: roomTypes[]
deactivate Prisma

alt Room types not found
    Service --> Controller: throw ApiError(404, "Room types not found")
    Controller --> API: Error response
    API --> Employee: 404 Not Found
end

Service -> Service: Create roomTypeMap\nfor quick lookup

loop For each room request
    Service -> Prisma: findMany(rooms)\nwhere: roomId, status=AVAILABLE\nexclude overlapping bookings
    activate Prisma
    Prisma -> DB: SELECT * FROM room\nWHERE room_id = ?\nAND status = 'AVAILABLE'\nAND NOT EXISTS (\n  SELECT 1 FROM booking_room\n  WHERE room_id = room.id\n  AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')\n  AND check_in_date <= ?\n  AND check_out_date >= ?\n)\nLIMIT ?
    DB --> Prisma: Available rooms
    Prisma --> Service: availableRooms[]
    deactivate Prisma

    alt Not enough rooms available
        Service --> Controller: throw ApiError(409, "Not enough rooms")
        Controller --> API: Error response
        API --> Employee: 409 Conflict\n{message: "Not enough available rooms for room type X.\nRequested: N, Available: M"}
    end

    Service -> Service: Add rooms to allocatedRooms[]
end

Service -> Service: Generate unique booking code\n"BK{timestamp}{random}"

Service -> Service: Calculate expiration time\n(15 minutes from now)

Service -> Service: Calculate totals:\n- totalAmount = sum(pricePerNight × nights)\n- depositRequired = sum(pricePerNight)\n  (one night per room)

Service -> Service: Build bookingRoomsData[]:\n{roomId, roomTypeId, dates,\npricePerNight, subtotal, balance}

Service -> Prisma: BEGIN TRANSACTION
activate Prisma

Prisma -> DB: INSERT INTO booking\n(booking_code, status='PENDING',\nprimary_customer_id, dates,\ntotal_guests, total_amount,\ndeposit_required, balance)
DB --> Prisma: Created booking

Prisma -> DB: INSERT INTO booking_room\n(multiple records with\nbooking_id, room_id, dates,\nprices, status='PENDING')
DB --> Prisma: Created booking_rooms

Prisma -> DB: UPDATE room\nSET status = 'RESERVED'\nWHERE id IN (allocated_room_ids)
DB --> Prisma: Rooms updated

Prisma -> DB: COMMIT
DB --> Prisma: Transaction committed

Prisma --> Service: booking with relations\n{bookingRooms[], primaryCustomer}
deactivate Prisma

Service -> Service: Build response object:\n{bookingId, bookingCode,\nexpiresAt, totalAmount, booking}

Service --> Controller: Booking result
deactivate Service

Controller --> API: sendData(res, result, 201)
deactivate Controller

API --> Employee: 201 Created\n{\n  data: {\n    bookingId,\n    bookingCode,\n    expiresAt,\n    totalAmount,\n    booking: {\n      status: "PENDING",\n      depositRequired,\n      balance,\n      bookingRooms[]\n    }\n  }\n}
deactivate API

note right of Employee
  Booking created with status PENDING.
  Rooms are RESERVED.
  Customer has 15 minutes to pay deposit.
  If deposit >= depositRequired,
  status changes to CONFIRMED.
end note

@enduml

```

### 3.3.3 Sơ đồ sequence cho Use Case "Checkout thanh toán"

```plantuml
  @startuml

  title Hotel Check-Out Process - Room Master System

  actor Employee as emp
  participant "Employee\nController" as ctrl
  participant "Booking\nService" as bookingSvc
  participant "Transaction\nService" as txnSvc
  participant "Room\nService" as roomSvc
  participant "Database\n(Prisma)" as db

  == Initiate Check-Out ==

  emp -> ctrl: POST /bookings/check-out\n{bookingId, bookingRoomId}
  activate ctrl

  ctrl -> ctrl: Validate request\n(auth, permissions)

  ctrl -> bookingSvc: getBookingById(bookingId)
  activate bookingSvc
  bookingSvc -> db: findUnique(bookingId,\ninclude: bookingRooms,\ntransactions, serviceUsages)
  activate db
  db --> bookingSvc: booking with details
  deactivate db

  alt Booking not found
      bookingSvc --> ctrl: throw NotFoundError
      ctrl --> emp: 404 Not Found
  end

  alt Booking status not CHECKED_IN or PARTIALLY_CHECKED_OUT
      bookingSvc --> ctrl: throw BadRequestError\n"Cannot check out from this status"
      ctrl --> emp: 400 Bad Request
  end
  deactivate bookingSvc

  ctrl -> bookingSvc: validateBookingRoom(bookingRoomId, bookingId)
  activate bookingSvc
  bookingSvc -> db: findFirst(bookingRoomId,\nwhere: {id, bookingId})
  activate db
  db --> bookingSvc: bookingRoom
  deactivate db

  alt BookingRoom not found
      bookingSvc --> ctrl: throw NotFoundError
      ctrl --> emp: 404 Not Found
  end
  deactivate bookingSvc

  == Process Check-Out ==

  note over emp,db
    Assumption: All payments handled
    via Transaction system before checkout.
    Checkout only updates room/booking status.
  end note

  ctrl -> bookingSvc: checkOut({bookingRoomIds, employeeId})
  activate bookingSvc

  bookingSvc -> db: bookingRoom.findMany({\n  where: {id in bookingRoomIds}\n})
  activate db
  db --> bookingSvc: bookingRooms[]
  deactivate db

  alt Any room status not CHECKED_IN
      bookingSvc --> ctrl: throw BadRequestError\n"All rooms must be CHECKED_IN"
      ctrl --> emp: 400 Bad Request
  end

  note over bookingSvc,db
    Perform check-out in transaction
    to ensure atomicity
  end note

  bookingSvc -> db: BEGIN TRANSACTION
  activate db

  bookingSvc -> db: bookingRoom.updateMany({\n  where: {id in bookingRoomIds},\n  actualCheckOut: now(),\n  status: CHECKED_OUT\n})
  db --> bookingSvc: updated bookingRooms

  bookingSvc -> bookingSvc: updateRoomStatuses(roomIds)\n- Check for other bookings\n- Set AVAILABLE or RESERVED

  bookingSvc -> db: room.updateMany({...})
  db --> bookingSvc: updated rooms

  bookingSvc -> db: bookingRoom.findMany({\n  where: {bookingId}\n})
  db --> bookingSvc: allBookingRooms[]

  alt All rooms checked out
      bookingSvc -> db: booking.update({\n  id: bookingId,\n  status: CHECKED_OUT\n})
      db --> bookingSvc: updated booking (CHECKED_OUT)
  end

  bookingSvc -> db: activity.create({\n  type: 'CHECK_OUT',\n  bookingRoomId,\n  employeeId\n})
  db --> bookingSvc: activity created

  bookingSvc -> db: COMMIT TRANSACTION
  db --> bookingSvc: transaction committed
  deactivate db

  bookingSvc --> ctrl: checkOutResult {\n  booking,\n  bookingRoom,\n  allRoomsCheckedOut: boolean\n}
  deactivate bookingSvc

  ctrl --> emp: 200 OK\n{checkOutResult}
  deactivate ctrl

  == Post Check-Out Notification ==

  note over emp,db
    Optional: System can send
    - Receipt/invoice to customer
    - Housekeeping notification
    - Update room availability
  end note

  alt Generate Receipt
      emp -> ctrl: GET /bookings/{bookingId}/receipt
      activate ctrl

      ctrl -> bookingSvc: generateReceipt(bookingId)
      activate bookingSvc

      bookingSvc -> db: Get full booking details\nwith all transactions,\nservice usages, payments
      activate db
      db --> bookingSvc: complete booking data
      deactivate db

      bookingSvc -> bookingSvc: Format receipt with:\n- Customer details\n- Room charges breakdown\n- Service charges\n- Payment history\n- Final balance

      bookingSvc --> ctrl: receipt data
      deactivate bookingSvc

      ctrl --> emp: 200 OK\n{receipt}
      deactivate ctrl
  end

  @enduml


```

### 3.3.4 Sơ đồ sequence cho Use Case "Sử dụng dịch vụ"

```plantuml

@startuml

title Service Usage Flow - Hotel Management System

actor Employee as emp
participant "Employee\nController" as ctrl
participant "ServiceUsage\nService" as svc
participant "Booking\nService" as booking
participant "Service\nService" as serviceSvc
participant "Database\n(Prisma)" as db

== Add Service to Booking ==

emp -> ctrl: POST /bookings/{bookingId}/services\n{serviceId, quantity, bookingRoomId?}
activate ctrl

ctrl -> ctrl: Validate request\n(auth, permissions)

ctrl -> booking: getBookingById(bookingId)
activate booking
booking -> db: findUnique(bookingId)
activate db
db --> booking: booking
deactivate db

alt Booking not found
    booking --> ctrl: throw NotFoundError
    ctrl --> emp: 404 Not Found
else Booking not CONFIRMED or CHECKED_IN
    booking --> ctrl: throw BadRequestError
    ctrl --> emp: 400 Bad Request
end
deactivate booking

ctrl -> serviceSvc: getServiceById(serviceId)
activate serviceSvc
serviceSvc -> db: findUnique(serviceId)
activate db
db --> serviceSvc: service
deactivate db

alt Service not found
    serviceSvc --> ctrl: throw NotFoundError
    ctrl --> emp: 404 Not Found
else Service not active
    serviceSvc --> ctrl: throw BadRequestError
    ctrl --> emp: 400 Bad Request
end
deactivate serviceSvc

alt bookingRoomId provided
    ctrl -> booking: validateBookingRoom(bookingId, bookingRoomId)
    activate booking
    booking -> db: findFirst(bookingRoomId, bookingId)
    activate db
    db --> booking: bookingRoom
    deactivate db

    alt BookingRoom not found or not belongs to booking
        booking --> ctrl: throw BadRequestError
        ctrl --> emp: 400 Bad Request
    end
    deactivate booking
end

ctrl -> svc: createServiceUsage(data)
activate svc

svc -> svc: Calculate prices\ntotalPrice = unitPrice * quantity

svc -> db: serviceUsage.create({\n  bookingId,\n  bookingRoomId?,\n  serviceId,\n  quantity,\n  unitPrice,\n  totalPrice\n})
activate db
db --> svc: serviceUsage
deactivate db

svc -> db: booking.update({\n  totalAmount += totalPrice\n})
activate db
db --> svc: updated booking
deactivate db

svc --> ctrl: serviceUsage
deactivate svc

ctrl --> emp: 201 Created\n{serviceUsage}
deactivate ctrl

== Get Service Usages for Booking ==

emp -> ctrl: GET /bookings/{bookingId}/services
activate ctrl

ctrl -> booking: getBookingById(bookingId)
activate booking
booking -> db: findUnique(bookingId)
activate db
db --> booking: booking
deactivate db
booking --> ctrl: booking
deactivate booking

ctrl -> svc: getServiceUsagesByBooking(bookingId, filters?)
activate svc

svc -> db: serviceUsage.findMany({\n  where: {bookingId},\n  include: {service, bookingRoom}\n})
activate db
db --> svc: serviceUsages[]
deactivate db

svc --> ctrl: serviceUsages[]
deactivate svc

ctrl --> emp: 200 OK\n{serviceUsages[]}
deactivate ctrl

== Update Service Usage ==

emp -> ctrl: PATCH /service-usages/{usageId}\n{quantity}
activate ctrl

ctrl -> ctrl: Validate request\n(auth, permissions)

ctrl -> svc: getServiceUsageById(usageId)
activate svc
svc -> db: findUnique(usageId)
activate db
db --> svc: serviceUsage
deactivate db

alt ServiceUsage not found
    svc --> ctrl: throw NotFoundError
    ctrl --> emp: 404 Not Found
end
deactivate svc

ctrl -> svc: updateServiceUsage(usageId, {quantity})
activate svc

svc -> svc: Calculate price difference\npriceDiff = (newQuantity - oldQuantity) * unitPrice

svc -> db: serviceUsage.update({\n  quantity,\n  totalPrice = unitPrice * quantity\n})
activate db
db --> svc: updated serviceUsage
deactivate db

svc -> db: booking.update({\n  totalAmount += priceDiff\n})
activate db
db --> svc: updated booking
deactivate db

svc --> ctrl: updated serviceUsage
deactivate svc

ctrl --> emp: 200 OK\n{serviceUsage}
deactivate ctrl

== Delete Service Usage ==

emp -> ctrl: DELETE /service-usages/{usageId}
activate ctrl

ctrl -> ctrl: Validate request\n(auth, permissions)

ctrl -> svc: getServiceUsageById(usageId)
activate svc
svc -> db: findUnique(usageId)
activate db
db --> svc: serviceUsage
deactivate db

alt ServiceUsage not found
    svc --> ctrl: throw NotFoundError
    ctrl --> emp: 404 Not Found
end
deactivate svc

ctrl -> svc: checkIfPaid(usageId)
activate svc
svc -> db: transactionDetail.count({\n  where: {serviceUsageId}\n})
activate db
db --> svc: count
deactivate db

alt Service usage already paid
    svc --> ctrl: throw BadRequestError\n"Cannot delete paid service"
    ctrl --> emp: 400 Bad Request
end
deactivate svc

ctrl -> svc: deleteServiceUsage(usageId)
activate svc

svc -> db: booking.update({\n  totalAmount -= serviceUsage.totalPrice\n})
activate db
db --> svc: updated booking
deactivate db

svc -> db: serviceUsage.delete({id: usageId})
activate db
db --> svc: deleted
deactivate db

svc --> ctrl: success
deactivate svc

ctrl --> emp: 204 No Content
deactivate ctrl

== Payment for Service Usage ==

note over emp,db
  Service usages are included in transaction details
  when processing payments for a booking
end note

emp -> ctrl: POST /transactions\n{bookingId, amount, method, details[]}
activate ctrl

ctrl -> svc: createTransaction(data)
activate svc

svc -> db: transaction.create({\n  bookingId,\n  amount,\n  method,\n  details: {\n    create: [{\n      serviceUsageId,\n      amount\n    }]\n  }\n})
activate db
db --> svc: transaction
deactivate db

svc -> db: booking.update({\n  balance += amount\n})
activate db
db --> svc: updated booking
deactivate db

svc --> ctrl: transaction
deactivate svc

ctrl --> emp: 201 Created\n{transaction}
deactivate ctrl

@enduml


```
