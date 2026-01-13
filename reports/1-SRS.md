# Chương 1 - SRS

## 1.1. **Introduction**

### 1.1.1. **Mục đích Tài liệu**

Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này đóng vai trò là "Single Source of Truth" (Nguồn thông tin duy nhất) cho hệ thống Quản lý Khách sạn (Hotel Management System). Tài liệu định nghĩa chi tiết các chức năng, luồng nghiệp vụ tài chính và các quy tắc hệ thống (Rules Engine).

**Mục tiêu:**

- **Về phía Khách sạn:** Tối ưu hóa việc quản lý phòng trống thông qua cơ chế tự động hóa (Temporary Hold), quản lý nhân viên và kiểm soát dòng tiền chính xác qua hệ thống giao dịch 3 lớp.
- **Về phía Khách hàng:** Cung cấp trải nghiệm đặt phòng mượt mà, hỗ trợ tìm kiếm phòng theo tiện ích (Tags), quản lý ví voucher (Voucher Wallet) và thanh toán linh hoạt.
- **Về phía Quản trị:** Cung cấp dữ liệu thời gian thực thông qua hệ thống nhật ký hoạt động (Activity Log) và báo cáo doanh thu để đưa ra quyết định kinh doanh.

**Đối tượng đọc:**

- **Developer:** Căn cứ để triển khai mã nguồn (TypeScript, Prisma) và kiến trúc Dependency Injection.
- **Tester:** Xây dựng các kịch bản kiểm thử (Test Cases) cho các logic phức tạp như Rules Engine và tranh chấp Voucher (Concurrency).
- **Project Manager:** Theo dõi tiến độ dựa trên danh sách chức năng (Functional Requirements).
- **Hotel Manager/Staff:** Xác nhận các luồng nghiệp vụ (Check-in, Check-out, Extra Services) khớp với thực tế vận hành.
- **Documentation Writers:** Soạn thảo hướng dẫn sử dụng cho nhân viên và khách hàng.

### 1.1.2. **Quy ước Tài liệu**

- **Định danh yêu cầu:**
  - **FR-x:** Yêu cầu chức năng (Functional Requirement).
  - **NFR-x:** Yêu cầu phi chức năng (Non-functional Requirement).
- **Thứ tự ưu tiên:** High (H) - Bắt buộc; Medium (M) - Quan trọng; Low (L) - Mở rộng.
- **Ngôn ngữ & Thuật ngữ:**
  - Tài liệu sử dụng Tiếng Việt cho phần mô tả nghiệp vụ.
  - Giữ nguyên thuật ngữ Tiếng Anh cho các thực thể Database và kỹ thuật (ví dụ: Booking, Transaction, CUID, PromotionScope) để đồng bộ với mã nguồn.
- **Quy ước Tài chính:** Mọi giá trị tiền tệ được tính toán và lưu trữ dưới định dạng Decimal(10,2).

### 1.1.3. **Phạm vi Dự án**

Dự án tập trung vào việc xây dựng lõi quản lý khách sạn (Core PMS) thông qua hai cổng giao
tiếp API riêng biệt:

**Hệ thống cung cấp các phân hệ:**

- **Inventory (Phân hệ Phòng):** Quản lý loại phòng (RoomType), phòng thực tế (Room) và hệ thống đặc tính (RoomTag).
- **Booking Lifecycle (Vòng đời Đặt phòng):** Xử lý luồng từ tìm kiếm phòng trống, giữ phòng tạm thời (Hold) trong 15 phút, đến khi nhận phòng (Check-in) và trả phòng (Check-out).
- **Financial & Transactions (Tài chính):** Ghi nhận dòng tiền theo mô hình phân bổ 3 lớp (baseAmount, discountAmount, amount) để đảm bảo tính minh bạch trong đối soát.
- **Promotion Rules Engine (Khuyến mãi):** Hệ thống ví voucher cho khách hàng, cho phép thu thập và áp dụng mã giảm giá dựa trên phạm vi (Scope) và điều kiện (Constraints).
- **Audit & Logging (Nhật ký):** Ghi lại mọi biến động dữ liệu qua thực thể Activity.

**Lợi ích mang lại:**

- **Chính xác:** Loại bỏ sai lệch tài chính nhờ cơ chế tính toán tập trung.
- **Tối ưu:** Tự động giải phóng phòng trống từ các đơn hàng ảo/quá hạn.
- **Nâng cao trải nghiệm:** Khách hàng chủ động quản lý ví voucher và thông tin đặt phòng.

### 1.1.4. **Tài liệu Tham khảo**

- **Chuẩn quốc tế:** IEEE Std 830-1998 cho việc viết tài liệu SRS.
- **Kiến trúc Phần mềm:** Documentation cho Prisma ORM, TypeScript và kiến trúc Inversion of Control (IoC).
- **Nghiệp vụ Khách sạn:** Quy trình vận hành tiêu chuẩn (SOP) dành cho lễ tân và kế toán khách sạn.
- **Tài liệu API:** Các cổng thanh toán (Momo, ZaloPay, VNPay) phục vụ cho việc tích hợp thanh toán tự động.

## 1.2. **Mô tả Tổng quan**

### 1.2.1. **Góc nhìn Sản phẩm**

- Là sản phẩm mới thay thế việc quản lý thủ công bằng Excel và sổ sách.
- Hoạt động theo mô hình client–server.
- Tích hợp hệ thống thanh toán điện tử, báo cáo PDF/Excel.

### 1.2.2. **Các Nhóm Người dùng và Đặc điểm**

1. **Khách hàng (End-user)**

   - Đặc điểm: ít kiến thức CNTT, chủ yếu dùng mobile app.
   - Mục tiêu: tìm phòng, đặt phòng nhanh, thanh toán dễ dàng.

2. **Lễ tân (Receptionist)**

   - Đặc điểm: dùng hệ thống hằng ngày, cần thao tác nhanh và giao diện trực quan.
   - Mục tiêu: check-in, check-out, nhập khách hàng, xử lý đặt phòng.

3. **Quản lý (Manager)**

   - Đặc điểm: ít thao tác trực tiếp, quan tâm báo cáo, quản lý nhân viên và phân quyền.
   - Mục tiêu: giám sát kinh doanh, quản lý nhân viên.

### 1.2.3. **Môi trường Vận hành**

- Server: Windows/Linux, 8 GB RAM, MySQL/SQL Server.
- Client: Chrome/Edge browser hoặc Android/iOS app.
- Network: Internet ổn định ≥ 20 Mbps.

### 1.2.4. **Ràng buộc Thiết kế và Triển khai**

- Ngôn ngữ: **typescript**, **prisma** và **express** cho backend; **reactJS**, **Vite**, **Electron** cho **frontend**.
- DBMS: **PostgreSQL**
- Bảo mật: AES-256, HTTPS, 2FA.
- Tuân thủ luật bảo vệ dữ liệu cá nhân Việt Nam.

### 1.2.5. **Giả định và Phụ thuộc**

- Nhân viên được đào tạo sử dụng.
- Internet hoạt động ổn định.
- Phụ thuộc vào dịch vụ thanh toán bên thứ 3.

## 1.3. **System Features**

Phần này đặc tả các chức năng hệ thống dựa trên cấu trúc dữ liệu thực tế. Mọi nghiệp vụ tài chính phải tuân thủ công thức: `amount = baseAmount - discountAmount`.

### 1.3.1. **Quản lý Loại phòng & Tiện ích (Room Type & Tag Management)**

**Mức độ:** High

#### 1.3.1.1. Mô tả

Quản lý các loại phòng (RoomType) và các đặc tính đi kèm (RoomTag) để khách hàng có thể lọc phòng theo nhu cầu (vị trí, tiện nghi).

#### 1.3.1.2. Functional Requirements

| Mã FR  | Chức năng              | Mô tả chi tiết                                                                        |
| :----- | :--------------------- | :------------------------------------------------------------------------------------ |
| FR-001 | Quản lý RoomType       | Thêm/Sửa/Xóa loại phòng: name, capacity, totalBed, và pricePerNight.                  |
| FR-002 | Quản lý RoomTag        | Định nghĩa các tiện ích: "Wifi", "Bếp", "View biển", "Hồ bơi"...                      |
| FR-003 | Gán Tag cho Loại phòng | Thiết lập mối quan hệ thông qua RoomTypeTag để hiển thị tiện ích cho từng hạng phòng. |

### 1.3.2. **Quản lý Phòng (Room Management)**

**Mức độ:** High

#### 1.3.2.1. Mô tả

Quản lý thực thể phòng vật lý (Room) và theo dõi trạng thái vận hành theo thời gian thực.

#### 1.3.2.2. Functional Requirements

| Mã FR  | Chức năng           | Mô tả chi tiết                                                                                               |
| :----- | :------------------ | :----------------------------------------------------------------------------------------------------------- |
| FR-004 | Quản lý Room        | Thêm phòng mới với roomNumber, floor, và liên kết tới RoomType.                                              |
| FR-005 | Cập nhật RoomStatus | Tự động hoặc thủ công chuyển đổi giữa: AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE. |
| FR-006 | Tìm kiếm & Bộ lọc   | Lọc phòng trống theo thời gian, loại phòng và tiện ích (RoomTag).                                            |

### 1.3.3. **Quản lý Đặt phòng (Booking & Holding Management)**

**Mức độ:** High

#### 1.3.3.1. Mô tả

Xử lý quy trình đặt phòng từ khách hàng (Customer) hoặc lễ tân. Hỗ trợ cơ chế giữ phòng tạm thời (Temporary Hold).

#### 1.3.3.2. Functional Requirements

| Mã FR  | Chức năng           | Mô tả chi tiết                                                                                              |
| :----- | :------------------ | :---------------------------------------------------------------------------------------------------------- |
| FR-007 | Tạo Booking         | Khởi tạo đơn đặt với bookingCode, checkInDate, checkOutDate và totalGuests. Trạng thái mặc định là PENDING. |
| FR-008 | Cơ chế giữ phòng    | Tự động chuyển RoomStatus sang RESERVED và thiết lập thời gian hết hạn đơn hàng.                            |
| FR-009 | Quản lý BookingRoom | Phân bổ các phòng cụ thể vào đơn đặt, lưu trữ giá tại thời điểm đặt (pricePerNight).                        |
| FR-010 | Xác nhận đơn hàng   | Chuyển trạng thái sang CONFIRMED khi khách thanh toán DEPOSIT đủ yêu cầu.                                   |

### 1.3.4. **Quản lý Nhận phòng & Trả phòng (Check-in / Check-out)**

**Mức độ:** High

#### 1.3.4.1. Mô tả

Quản lý thực tế việc khách cư trú và xử lý hậu kỳ khi khách rời đi.

#### 1.3.4.2. Functional Requirements

| Mã FR  | Chức năng           | Mô tả chi tiết                                                                                          |
| :----- | :------------------ | :------------------------------------------------------------------------------------------------------ |
| FR-011 | Quy trình Check-in  | Cập nhật status của Booking sang CHECKED_IN, ghi nhận actualCheckIn cho từng BookingRoom.               |
| FR-012 | Gán khách cư trú    | Sử dụng BookingCustomer để liên kết danh sách khách hàng ở trong từng phòng cụ thể.                     |
| FR-013 | Quy trình Check-out | Tính toán số dư (balance), cập nhật actualCheckOut. Hỗ trợ trả phòng từng phần (PARTIALLY_CHECKED_OUT). |

### 1.3.5. **Quản lý Dịch vụ phát sinh (Service & Extra Usage)**

**Mức độ:** Medium

#### 1.3.5.1. Mô tả

Ghi nhận các chi phí phát sinh ngoài tiền phòng (Minibar, Laundry, Spa...).

#### 1.3.5.2. Functional Requirements

| Mã FR  | Chức năng             | Mô tả chi tiết                                                                          |
| :----- | :-------------------- | :-------------------------------------------------------------------------------------- |
| FR-014 | Danh mục Service      | Quản lý tên dịch vụ, đơn giá niêm yết và trạng thái isActive.                           |
| FR-015 | Ghi nhận ServiceUsage | Gắn dịch vụ vào BookingRoom, tự động tính totalPrice dựa trên số lượng và đơn giá.      |
| FR-016 | Cập nhật tài chính    | Đồng bộ số tiền dịch vụ vào subtotalService của BookingRoom và totalAmount của Booking. |

### 1.3.6. **Hệ thống Khuyến mãi & Voucher (Promotion & Voucher Wallet)**

**Mức độ:** High

#### 1.3.6.1. Mô tả

Quản lý các chiến dịch giảm giá, cho phép khách hàng thu thập và áp dụng mã vào đơn hàng.

#### 1.3.6.2. Functional Requirements

| Mã FR  | Chức năng           | Mô tả chi tiết                                                                                                    |
| :----- | :------------------ | :---------------------------------------------------------------------------------------------------------------- |
| FR-017 | Thiết lập Promotion | Tạo mã giảm giá với PromotionType (%, cố định) và PromotionScope (ROOM, SERVICE, ALL).                            |
| FR-018 | Ví Voucher          | Khách hàng thực hiện CLAIM_PROMOTION để lưu vào ví CustomerPromotion với trạng thái AVAILABLE.                    |
| FR-019 | Áp dụng Voucher     | Khi thanh toán, hệ thống kiểm tra điều kiện minBookingAmount và tạo bản ghi UsedPromotion liên kết với giao dịch. |

### 1.3.7. **Quản lý Giao dịch & Thanh toán (Transaction & Financials)**

**Mức độ:** High

#### 1.3.7.1. Mô tả

Hệ thống lõi xử lý dòng tiền, hỗ trợ đối trừ giảm giá và phân bổ thanh toán chính xác.

#### 1.3.7.2. Functional Requirements

| Mã FR  | Chức năng                 | Mô tả chi tiết                                                                                        |
| :----- | :------------------------ | :---------------------------------------------------------------------------------------------------- |
| FR-020 | Tạo Transaction           | Ghi nhận giao dịch với TransactionType (DEPOSIT, ROOM_CHARGE, SERVICE_CHARGE...) và PaymentMethod.    |
| FR-021 | Phân bổ TransactionDetail | Phân phối số tiền của một giao dịch cho nhiều BookingRoom hoặc ServiceUsage.                          |
| FR-022 | Luồng tiền 3 lớp          | Mọi bản ghi tài chính phải lưu đủ: baseAmount (gốc), discountAmount (giảm giá), và amount (thực thu). |
| FR-023 | Tính toán Balance         | Tự động tính lại số dư nợ sau mỗi giao dịch: `balance = totalAmount - totalPaid`.                     |

### 1.3.8. **Quản lý Nhân viên & Nhật ký Hoạt động (Employee & Audit Trail)**

**Mức độ:** High

#### 1.3.8.1. Mô tả

Quản lý nhân sự và lưu vết mọi thay đổi dữ liệu trong hệ thống.

#### 1.3.8.2. Functional Requirements

| Mã FR  | Chức năng            | Mô tả chi tiết                                                                                           |
| :----- | :------------------- | :------------------------------------------------------------------------------------------------------- |
| FR-024 | Quản lý Employee     | Lưu thông tin nhân viên, vai trò (Role) và thông tin đăng nhập.                                          |
| FR-025 | Ghi nhật ký Activity | Tự động ghi lại các hành động nhạy cảm (CHECKED_OUT, CREATE_TRANSACTION...) kèm dữ liệu metadata (JSON). |
| FR-026 | Truy vết tài chính   | Mọi giao dịch (Transaction) phải liên kết với nhân viên xử lý (processedById).                           |

### 1.3.9. **Xử lý lỗi & Kiểm thử (Error Handling & Test Scenarios)**

#### 1.3.9.1. Các kịch bản trọng yếu

- **Tranh chấp Claim Voucher:** Kiểm thử khi 100 người cùng claim mã giảm giá chỉ còn 1 suất. Hệ thống phải dùng Transaction để đảm bảo không âm remainingQty.
- **Hết hạn giữ phòng:** Kiểm tra Worker có tự động nhả RESERVED về AVAILABLE khi đơn PENDING quá 15 phút không.
- **Sai lệch tài chính:** Kiểm thử khi số tiền discountAmount lớn hơn baseAmount. Hệ thống phải chặn và báo lỗi nghiệp vụ.

#### 1.3.9.2. Quy định chung

- Mọi thao tác ghi dữ liệu đa bảng phải nằm trong **Prisma Transaction**.
- Lỗi hệ thống phải được ghi lại vào nhật ký máy chủ và trả về mã lỗi chuẩn REST API.

## 1.4. **Data Requirements**

### 1.4.1. **Logical Data Model**

**RoomType** (id, name, capacity, totalBed, pricePerNight)

**Room** (id, roomNumber, floor, code, status, roomTypeId)

**RoomTag** (id, name, description)

**RoomTypeTag** (id, roomTypeId, roomTagId)

**Employee** (id, name, username, password, role)

**Customer** (id, fullName, email, phone, idNumber, address, password)

**Booking** (id, bookingCode, status, primaryCustomerId, checkInDate, checkOutDate, totalGuests, totalAmount, depositRequired, totalDeposit, totalPaid, balance)

**BookingRoom** (id, bookingId, roomId, roomTypeId, checkInDate, checkOutDate, actualCheckIn, actualCheckOut, pricePerNight, depositAmount, subtotalRoom, subtotalService, totalAmount, totalPaid, balance, status)

**BookingCustomer** (id, bookingId, customerId, bookingRoomId, isPrimary)

**Transaction** (id, bookingId, type, baseAmount, discountAmount, amount, method, status, processedById, transactionRef, occurredAt, description)

**TransactionDetail** (id, transactionId, baseAmount, discountAmount, amount, bookingRoomId, serviceUsageId)

**Service** (id, name, price, unit, isActive)

**ServiceUsage** (id, bookingId, bookingRoomId, employeeId, serviceId, quantity, unitPrice, totalPrice, totalPaid, status)

**Promotion** (id, code, description, type, scope, value, maxDiscount, minBookingAmount, startDate, endDate, totalQty, remainingQty, perCustomerLimit, isActive)

**CustomerPromotion** (id, customerId, promotionId, status, claimedAt, usedAt)

**UsedPromotion** (id, promotionId, discountAmount, transactionDetailId, transactionId)

**Activity** (id, type, metadata, description, serviceUsageId, bookingRoomId, customerId, employeeId)

### 1.4.2. **Data Dictionary (Ví dụ chọn lọc)**

#### 1.4.2.1. Nhóm 1: Danh mục Phòng & Tiện ích (Inventory)

#### 1\. RoomType (Loại phòng)

| Column        | Data Type     | Key | Description                         |
| :------------ | :------------ | :-- | :---------------------------------- |
| id            | TEXT (CUID)   | PK  | Định danh duy nhất của loại phòng.  |
| name          | VARCHAR(255)  |     | Tên loại phòng (VD: Deluxe, Suite). |
| capacity      | INT           |     | Sức chứa người lớn tối đa.          |
| totalBed      | INT           |     | Tổng số giường có trong phòng.      |
| pricePerNight | DECIMAL(10,2) |     | Giá niêm yết cho một đêm.           |

#### 2\. Room (Phòng thực tế)

| Column     | Data Type   | Key    | Description                                            |
| :--------- | :---------- | :----- | :----------------------------------------------------- |
| id         | TEXT (CUID) | PK     | Định danh duy nhất của phòng.                          |
| roomNumber | VARCHAR(20) | Unique | Số phòng (VD: 101, 202).                               |
| floor      | INT         |        | Tầng của phòng.                                        |
| status     | ENUM        |        | Trạng thái: AVAILABLE, RESERVED, OCCUPIED, CLEANING... |
| roomTypeId | TEXT (CUID) | FK     | Tham chiếu đến RoomType.                               |

#### 3\. RoomTag & RoomTypeTag (Tiện ích)

| Column     | Data Type    | Key    | Description                              |
| :--------- | :----------- | :----- | :--------------------------------------- |
| id         | TEXT (CUID)  | PK     | Định danh Tag/Liên kết.                  |
| name       | VARCHAR(100) | Unique | Tên tiện ích (VD: Wifi, Tivi, Ban công). |
| roomTypeId | TEXT (CUID)  | FK     | Liên kết giữa loại phòng và tiện ích.    |

#### 1.4.2.2. Nhóm 2: Khách hàng & Nhân viên (Users)

#### 4\. Customer (Khách hàng)

| Column   | Data Type    | Key    | Description                                   |
| :------- | :----------- | :----- | :-------------------------------------------- |
| id       | TEXT (CUID)  | PK     | Định danh khách hàng.                         |
| fullName | VARCHAR(255) |        | Họ và tên đầy đủ.                             |
| phone    | VARCHAR(20)  | Unique | Số điện thoại (dùng làm tài khoản đăng nhập). |
| idNumber | VARCHAR(50)  |        | CMND/CCCD/Passport.                           |
| password | TEXT         |        | Mật khẩu đã mã hóa Bcrypt.                    |

#### 5\. Employee (Nhân viên)

| Column   | Data Type   | Key    | Description                          |
| :------- | :---------- | :----- | :----------------------------------- |
| id       | TEXT (CUID) | PK     | Định danh nhân viên.                 |
| username | VARCHAR(50) | Unique | Tên đăng nhập hệ thống nội bộ.       |
| role     | VARCHAR(50) |        | Vai trò: ADMIN, STAFF, HOUSEKEEPING. |

#### 1.4.2.3. Nhóm 3: Đặt phòng & Lưu trú (Booking)

#### 6\. Booking (Đơn đặt phòng tổng)

| Column      | Data Type     | Key    | Description                                   |
| :---------- | :------------ | :----- | :-------------------------------------------- |
| id          | TEXT (CUID)   | PK     | Định danh đơn đặt phòng.                      |
| bookingCode | VARCHAR(50)   | Unique | Mã tra cứu đơn hàng cho khách.                |
| status      | ENUM          |        | Trạng thái: PENDING, CONFIRMED, CHECKED_IN... |
| totalAmount | DECIMAL(10,2) |        | Tổng giá trị đơn hàng sau chiết khấu.         |
| totalPaid   | DECIMAL(10,2) |        | Tổng tiền khách đã thanh toán.                |
| balance     | DECIMAL(10,2) |        | Số dư nợ (TotalAmount - TotalPaid).           |

#### 7\. BookingRoom (Chi tiết phòng trong đơn)

| Column          | Data Type     | Key | Description                                |
| :-------------- | :------------ | :-- | :----------------------------------------- |
| id              | TEXT (CUID)   | PK  | Định danh chi tiết lưu trú.                |
| actualCheckIn   | TIMESTAMP     |     | Thời gian nhận phòng thực tế.              |
| subtotalRoom    | DECIMAL(10,2) |     | Tiền phòng thuần (Giá x Số đêm).           |
| subtotalService | DECIMAL(10,2) |     | Tổng tiền dịch vụ phát sinh của phòng này. |

#### 1.4.2.4. Nhóm 4: Tài chính & Giao dịch (Finance)

#### 8\. Transaction (Giao dịch)

| Column         | Data Type     | Key | Description                            |
| :------------- | :------------ | :-- | :------------------------------------- |
| id             | TEXT (CUID)   | PK  | Định danh giao dịch.                   |
| type           | ENUM          |     | Loại: DEPOSIT, ROOM_CHARGE, REFUND...  |
| baseAmount     | DECIMAL(10,2) |     | Số tiền gốc chưa giảm giá.             |
| discountAmount | DECIMAL(10,2) |     | Số tiền được giảm trong giao dịch này. |
| amount         | DECIMAL(10,2) |     | Số tiền thực thu (Base - Discount).    |
| processedById  | TEXT (CUID)   | FK  | Nhân viên thực hiện giao dịch này.     |

#### 9\. TransactionDetail (Phân bổ giao dịch)

| Column         | Data Type     | Key | Description                          |
| :------------- | :------------ | :-- | :----------------------------------- |
| id             | TEXT (CUID)   | PK  | Định danh chi tiết phân bổ.          |
| transactionId  | TEXT (CUID)   | FK  | Tham chiếu giao dịch tổng.           |
| amount         | DECIMAL(10,2) |     | Số tiền phân bổ cho hạng mục cụ thể. |
| bookingRoomId  | TEXT (CUID)   | FK  | Liên kết nếu trả cho tiền phòng.     |
| serviceUsageId | TEXT (CUID)   | FK  | Liên kết nếu trả cho dịch vụ.        |

#### 1.4.2.5. Nhóm 5: Khuyến mãi (Promotion)

#### 10\. Promotion (Chương trình KM)

| Column           | Data Type     | Key    | Description                              |
| :--------------- | :------------ | :----- | :--------------------------------------- |
| code             | VARCHAR(50)   | Unique | Mã code (VD: TET2025).                   |
| scope            | ENUM          |        | Phạm vi: ROOM, SERVICE, ALL.             |
| value            | DECIMAL(10,2) |        | Giá trị giảm (Số tiền hoặc %).           |
| perCustomerLimit | INT           |        | Số lượt dùng tối đa trên mỗi khách hàng. |
| remainingQty     | INT           |        | Số lượng voucher còn lại trong hệ thống. |

#### 11\. UsedPromotion (Lịch sử sử dụng KM)

| Column         | Data Type     | Key | Description                           |
| :------------- | :------------ | :-- | :------------------------------------ |
| id             | TEXT (CUID)   | PK  | Định danh lượt sử dụng.               |
| discountAmount | DECIMAL(10,2) |     | Số tiền thực tế đã giảm cho lượt này. |
| transactionId  | TEXT (CUID)   | FK  | Giao dịch chứa khoản giảm giá này.    |

#### 1.4.2.6. Nhóm 6: Dịch vụ & Nhật ký (Services & Audit)

#### 12\. Service & ServiceUsage (Dịch vụ)

| Column     | Data Type     | Key | Description                        |
| :--------- | :------------ | :-- | :--------------------------------- |
| id         | TEXT (CUID)   | PK  | Định danh dịch vụ/lượt dùng.       |
| quantity   | INT           |     | Số lượng sử dụng.                  |
| totalPrice | DECIMAL(10,2) |     | Thành tiền (Quantity x UnitPrice). |

#### 13\. Activity (Nhật ký hệ thống)

| Column   | Data Type   | Key | Description                               |
| :------- | :---------- | :-- | :---------------------------------------- |
| id       | TEXT (CUID) | PK  | Định danh hành động.                      |
| type     | ENUM        |     | Loại hành động (VD: CHECKED_OUT).         |
| metadata | JSON        |     | Dữ liệu chi tiết tại thời điểm hành động. |

### 1.4.3. **Reports (Danh sách và cấu trúc)**

Mỗi báo cáo cần mô tả trường xuất, thứ tự sắp xếp, các filter, và định dạng xuất.

1. **Báo cáo doanh thu theo ngày**

   - Fields: Ngay, TongTienPhong, TongTienDichVu, TongThanhTien, SoLuongPhieuTraPhong.
   - Filters: Khoảng ngày, LoaiPhong (option), NhanVien (option).
   - Output: Hiển thị bảng + biểu đồ cột, xuất PDF/Excel.

2. **Báo cáo doanh thu theo tháng/quý/năm**

   - Fields: Thang/Quy/Nam, TongThanhTien, SoPhieu.
   - Output: PDF/Excel.

3. **Báo cáo phòng trống tại thời điểm**

   - Fields: MaPhong, TenPhong, MaLoaiPhong, TrangThaiPhong, GhiChu.
   - Filter: ThoiGian (ngày giờ tham chiếu).

4. **Báo cáo danh sách khách hàng (lưu trú)**

   - Fields: MaKhachHang, HoTen, SDT, LanDau (boolean), SoLanLuuTru, TongChiTieu.

5. **Báo cáo dịch vụ**

   - Fields: MaDichVu, TenLoaiDichVu, SoLanSD, TongTienDV, NhanVienPhucVu.

Các báo cáo phải có khả năng xuất theo mẫu in hóa đơn thuế (nếu cần), đồng thời có control paging và filter date range.

### 1.4.4. **Data Acquisition, Integrity, Retention, and Disposal**

#### 1.4.4.1. Data Acquisition

- Dữ liệu được thu từ form UI (web/mobile), import file CSV/Excel (danh sách khách hàng, danh sách phòng), và từ API tích hợp (payment gateway, hệ thống OTA nếu có).
- Mỗi input trên UI phải có kiểm tra hợp lệ (validation) cả client-side và server-side.

#### 1.4.4.2. Data Integrity

- Sử dụng các ràng buộc DB: PK, FK, unique, check constraints cho enum/giá trị.
- Transaction: mọi nghiệp vụ tài chính (thanh toán, hoàn tiền) cần dùng transaction để đảm bảo atomicity.
- Logging: mọi thay đổi quan trọng (hủy đặt, sửa hóa đơn, thay đổi giá) phải có audit trail ghi ai, khi nào, giá trị cũ/mới.

#### 1.4.4.3. Retention (Lưu trữ)

- Dữ liệu giao dịch (hóa đơn, phiếu trả phòng, chứng từ thanh toán) lưu ít nhất **10 năm** để phục vụ kiểm toán và kê khai thuế.
- Dữ liệu khách hàng, đặt phòng, trạng thái phòng lưu **tối thiểu 5 năm**.
- Logs hệ thống lưu **1 năm** chi tiết; tổng hợp logs lưu **3 năm** nếu cần phân tích.

#### 1.4.4.4. Disposal (Xóa dữ liệu)

- Xóa mềm (soft-delete): dữ liệu được đánh dấu Deleted=true và không hiển thị trên UI. Xóa thật (hard-delete) chỉ thực hiện sau khi đã được backup và tuân theo chính sách lưu trữ.
- Khi yêu cầu xóa dữ liệu cá nhân từ chủ sở hữu (theo luật bảo vệ dữ liệu), thực hiện quy trình: xác thực yêu cầu → xóa/ẩn thông tin nhận diện cá nhân (anonymize) nếu luật cho phép → ghi nhận audit.

## 1.5. **External Interface Requirements**

### 1.5.1. **User Interfaces**

Mô tả các màn hình chính, tiêu chuẩn UI/UX, và yêu cầu giao diện.

#### 1.5.1.1. Màn hình chính (Dashboard)

- Thông tin: Tổng số phòng, phòng trống, doanh thu hôm nay, biểu đồ công suất, thông báo.
- Components: KPI cards, chart (Doanh thu theo ngày), bảng phiếu đặt sắp tới.

#### 1.5.1.2. Màn hình Quản lý Phòng

- Bảng danh sách với filter: Loại phòng, Trạng thái, Giá.
- Chức năng: Thêm/Sửa/Xóa, Cập nhật trạng thái.

#### 1.5.1.3. Màn hình Đặt phòng

- Form đặt phòng: chọn ngày giờ, chọn loại/phòng, nhập thông tin khách, chọn phương thức thanh toán.
- Gợi ý phòng phù hợp + lịch sẵn có.

#### 1.5.1.4. Màn hình Check-in/Check-out

- Tìm kiếm bằng MaDatPhong / MaKhachHang.
- Kiểm tra dịch vụ phát sinh, kiểm kê hư hỏng, in hóa đơn.

#### 1.5.1.5. Tiêu chuẩn UI/UX

- Ngôn ngữ: Tiếng Việt + tùy chọn Tiếng Anh.
- Accessibility: các form có label rõ ràng, tab-index, hỗ trợ màn hình cỡ nhỏ (responsive).
- Thông báo lỗi: rõ ràng, dễ hiểu, không lộ thông tin hệ thống.

### 1.5.2. **Software Interfaces**

Danh sách các giao tiếp phần mềm cần triển khai:

1. **Payment Gateway (3rd-party)**

   - Giao thức: HTTPS REST API (JSON).
   - Functions: create_payment, verify_payment, refund.
   - Authentication: API key / OAuth2.

2. **Email Service (SMTP or API)**

   - Functions: send_booking_confirmation, send_invoice, send_system_alert.

3. **SMS Gateway (tuỳ chọn)**

   - Chức năng: Gửi OTP, thông báo đặt/phòng trả.

4. **Export/Import**

   - CSV/Excel import/export cho khách hàng, báo cáo. Format UTF-8.

5. **Các hệ thống kế toán / thuế** (nếu tích hợp)

   - Định dạng trao đổi: XML/JSON theo chuẩn của nhà cung cấp phần mềm kế toán hoặc chuẩn e-invoice nếu cần.

### 1.5.3. **Hardware Interfaces**

- **Máy in nhiệt / Laser**: in hóa đơn, voucher.

  - Driver: CUPS (Linux) hoặc WinPrint (Windows).

- **Thiết bị POS / đầu đọc thẻ**: giao tiếp qua API hoặc cổng serial/USB (tùy nhà cung cấp).
- **Máy quét mã vạch / QR**: cho check-in nhanh (tuỳ chọn).
- **Khóa cửa điện tử (keycard)**: API tích hợp để cấp/thu hồi thẻ khi check-in/check-out (tùy hạ tầng khách sạn).

### 1.5.4. **Communications Interfaces**

- Giao thức chính: HTTPS (TLS 1.2+, khuyến nghị TLS 1.3).
- Email: SMTP with STARTTLS hoặc API provider (SendGrid, Mailgun).
- API format: RESTful JSON, mã trạng thái HTTP chuẩn.
- Batch data: CSV/Excel (UTF-8) cho import/export.

## 1.6. **Quality Attributes**

Các thuộc tính chất lượng được mô tả cụ thể và có chỉ tiêu định lượng khi có thể.

### 1.6.1. **Usability**

- **NFR-001**: Thời gian để một nhân viên lễ tân mới thực hiện đặt phòng cơ bản ≤ 10 phút sau đào tạo 30 phút.
- Giao diện trực quan, điều hướng rõ ràng; hỗ trợ tìm kiếm (autocomplete) theo MaPhong, TênKhách.
- Hệ thống cung cấp help tooltip cho các trường phức tạp.

### 1.6.2. **Performance**

- **NFR-002**: Thời gian phản hồi trung bình cho các thao tác CRUD trong UI ≤ 2 giây (95th percentile) với tải đến 200 concurrent users.
- **NFR-003**: Báo cáo tóm tắt (daily aggregate) trả về ≤ 5 giây với dataset 1 triệu bản ghi (tối ưu bằng indexing/summary tables).
- Hệ thống chịu được peak load 500 concurrent users với degradation graceful.

### 1.6.3. **Security**

- **NFR-004**: Mật khẩu lưu bằng cơ chế hashing mạnh (bcrypt/argon2) và không lưu mật khẩu thuần văn.
- **NFR-005**: Hỗ trợ 2FA cho tài khoản role Admin.
- **NFR-006**: Dữ liệu nhạy cảm (thông tin cá nhân, payment ID) được mã hóa khi lưu (AES-256 at rest).
- **NFR-007**: Hệ thống phải tuân thủ OWASP Top 10: chống SQL injection, XSS, CSRF.
- **NFR-008**: Audit logging cho các thao tác: ai, khi nào, thay đổi gì (immutable logs, có thể export).

### 1.6.4. **Safety**

- **NFR-009**: RTO (Recovery Time Objective) ≤ 4 giờ trong trường hợp server chính failure; RPO (Recovery Point Objective) ≤ 1 giờ.
- Kiểm tra periodic disaster recovery drills ít nhất 1 năm 1 lần.

### 1.6.5. **Availability, Scalability, Maintainability**

- **NFR-010 Availability**: Uptime ≥ 99.5% (trừ bảo trì đã thông báo trước).
- **NFR-011 Scalability**: Hệ thống phải hỗ trợ mở rộng theo chiều ngang (horizontal scaling) cho web app và DB read-replicas.
- **NFR-012 Maintainability**: Mã nguồn có cấu trúc module, có test coverage tối thiểu 70% cho business-critical modules.

## 1.7. **Internationalization and Localization Requirements**

- Hỗ trợ multi-language: tiếng Việt (vi-VN) mặc định và tiếng Anh (en-US). Chuẩn i18n để dễ thêm ngôn ngữ.
- Định dạng ngày giờ: hỗ trợ hiển thị theo locale; lưu nội bộ dạng UTC, hiển thị theo timezone của user (mặc định Asia/Ho_Chi_Minh).
- Hỗ trợ nhiều loại tiền tệ (VNĐ, USD) và chuyển đổi theo tỷ giá (tùy chọn). Thanh toán phải hiển thị currency rõ ràng.
- Hỗ trợ định dạng địa chỉ và số điện thoại theo chuẩn quốc gia.
- Ký tự: UTF-8 full support.

## 1.8. **Other Requirements**

### 1.8.1. **Legal & Regulatory**

- Tuân thủ Luật An toàn thông tin cá nhân Việt Nam và các quy định lưu trữ chứng từ kế toán/thuế (gia hạn dữ liệu giao dịch ít nhất 10 năm).
- Hỗ trợ xuất chứng từ theo mẫu hóa đơn điện tử (nếu cần tích hợp với Cơ quan thuế hoặc phần mềm hóa đơn).

### 1.8.2. **Installation, Configuration, Deployment**

- Cung cấp Docker-compose hoặc Helm charts cho deploy nhanh trên môi trường staging/production.
- Hướng dẫn cấu hình: file env template (.env.example) cho các biến quan trọng (DB, payment keys, SMTP).

### 1.8.3. **Logging, Monitoring & Audit**

- Tích hợp monitoring (Prometheus + Grafana hoặc tương đương) cho CPU, Memory, Response time, Error rate.
- Alerting: cảnh báo qua email/SMS/Slack cho lỗi nghiêm trọng và khi disk usage \> 80%.
- Audit trail cho giao dịch tài chính và thay đổi dữ liệu quan trọng (xóa đặt phòng, sửa hóa đơn).

### 1.8.4. **Backup Policy**

- Full backup hàng ngày (sau giờ thấp điểm), incremental backup mỗi 1 giờ.
- Dự trữ backup offsite hoặc cloud (S3) tối thiểu 30 ngày online, lưu trữ lưu trữ lâu hơn (cold storage) theo chính sách.

### 1.8.5. **Documentation**

- Cung cấp: User Manual (cho mỗi role), Admin Manual, API Documentation (OpenAPI/Swagger), Deployment Guide.

## 1.9. **Glossary**

**CUID (Collision-resistant Unique Identifier):** Mã định danh duy nhất được hệ thống tự động sinh ra cho mọi bản ghi (thay thế cho ID số tự tăng truyền thống), giúp tăng tính bảo mật và tránh bị dự đoán ID qua URL.

**Room (Phòng):** Thực thể đại diện cho một phòng vật lý cụ thể trong khách sạn, được định danh qua roomNumber.

**RoomType (Loại phòng):** Phân loại phòng dựa trên các đặc tính chung như sức chứa (capacity), số giường (totalBed) và đơn giá (pricePerNight).

**RoomTag:** Các nhãn tiện ích (như Wifi, Tivi, View biển) dùng để gắn vào loại phòng phục vụ mục đích tìm kiếm và lọc dữ liệu.

**Booking (Đơn đặt phòng):** Phiếu ghi nhận thông tin đặt chỗ tổng quát của một khách hàng, bao gồm mã đặt chỗ (bookingCode) và tổng trạng thái tài chính.

**BookingRoom:** Bản ghi chi tiết cho từng phòng cụ thể nằm trong một Booking. Một đơn đặt phòng có thể bao gồm nhiều BookingRoom.

**Temporary Hold (Giữ phòng tạm thời):** Cơ chế hệ thống tự động khóa trạng thái phòng sang RESERVED trong vòng 15 phút kể từ khi khách khởi tạo đơn hàng PENDING để chờ thanh toán cọc.

**ServiceUsage (Sử dụng dịch vụ):** Các lượt sử dụng dịch vụ phát sinh (Extra) như giặt là, ăn uống được gắn trực tiếp vào một phòng hoặc đơn đặt phòng.

**Transaction (Giao dịch):** Bản ghi ghi nhận việc luân chuyển dòng tiền (Đặt cọc, Thanh toán, Hoàn tiền, Giảm giá).

**Base / Discount / Net Amount:**

- **Base (Giá gốc):** Số tiền niêm yết ban đầu.
- **Discount (Giảm giá):** Số tiền được khấu trừ từ các chương trình khuyến mãi.
- **Net (Thực thu):** Số tiền thực tế khách phải trả (Base - Discount).

**Rules Engine (Công cụ quy tắc):** Logic phần mềm dùng để kiểm tra các điều kiện phức tạp khi áp dụng khuyến mãi (ví dụ: kiểm tra số đêm ở tối thiểu, giá trị hóa đơn tối thiểu).

**PromotionScope (Phạm vi khuyến mãi):** Quy định đối tượng được giảm giá, bao gồm: ROOM (chỉ giảm tiền phòng), SERVICE (chỉ giảm tiền dịch vụ), hoặc ALL (toàn bộ hóa đơn).

**Voucher Wallet (Ví Voucher):** Chức năng cho phép khách hàng lưu trữ (CLAIM) các mã khuyến mãi vào tài khoản cá nhân trước khi sử dụng.

**RBAC (Role-Based Access Control):** Cơ chế phân quyền dựa trên vai trò của nhân viên (ví dụ: Nhân viên buồng phòng chỉ thấy trạng thái dọn dẹp, Quản trị viên thấy toàn bộ báo cáo tài chính).

**RTO / RPO (Recovery Time/Point Objective):**

- **RTO:** Thời gian tối đa để khôi phục lại hệ thống sau sự cố.
- **RPO:** Lượng dữ liệu tối đa chấp nhận bị mất (tính theo thời gian) khi có sự cố xảy ra.

## 1.10. **Analysis Models**

Phần này mô tả các mô hình phân tích dùng để cụ thể hóa các yêu cầu chức năng, giúp đội ngũ kỹ thuật triển khai chính xác các luồng logic phức tạp.

### 1.10.1. **Use Case Diagram (Sơ đồ Ca sử dụng)**

Hệ thống phục vụ hai nhóm đối tượng chính với các quyền hạn riêng biệt qua hai cổng API:

- **Actors (Tác nhân):**
  - **Customer (Khách hàng):** Tìm kiếm phòng, Claim Voucher, Đặt phòng (Hold), Thanh toán cọc.
  - **Staff (Lễ tân/Kế toán):** Check-in, Ghi nhận dịch vụ phát sinh, Check-out, Xử lý giao dịch.
  - **Housekeeping (Buồng phòng):** Cập nhật trạng thái dọn dẹp phòng.
  - **Admin (Quản trị):** Thiết lập PromotionRule, quản lý nhân sự, xem báo cáo doanh thu.
  - **External Systems:** Payment Gateway (Cổng thanh toán), Email/SMS Service.
- **Use Cases chính:**
  - **Search & Filter:** Lọc phòng theo RoomTag và thời gian.
  - **Voucher Management:** Thu thập mã vào ví và áp dụng theo PromotionScope.
  - **Booking Hold:** Giữ phòng tạm thời và tự động giải phóng nếu quá hạn.
  - **Financial Allocation:** Phân bổ tiền thanh toán vào TransactionDetail.

### 1.10.2. **Entity-Relationship Diagram (ERD)**

Hệ thống tuân thủ mô hình quan hệ chặt chẽ (đã mô tả chi tiết tại mục 4.1):

- **Cardinality (Tính đa trị):**
  - Một Booking có thể chứa nhiều BookingRoom (Đặt phòng đoàn).
  - Một Transaction có nhiều TransactionDetail (Thanh toán gộp cho nhiều hạng mục).
  - Một Promotion có thể được Claim bởi nhiều khách hàng qua CustomerPromotion.

### 1.10.3. **Sequence Diagrams (Sơ đồ trình tự)**

Các quy trình trọng yếu cần được mô hình hóa:

- **Quy trình Đặt phòng & Áp dụng Voucher (Customer API):**

  1. Khách hàng chọn mã từ ví (CustomerPromotion).
  2. Hệ thống chạy **Rules Engine** để kiểm tra điều kiện (minBookingAmount, scope).
  3. Tạo đơn Booking trạng thái PENDING.
  4. Cập nhật Room sang RESERVED và đặt expiresAt (15 phút).
  5. Sau khi thanh toán thành công → Chuyển Booking sang CONFIRMED.

- **Quy trình Check-out & Phân bổ tài chính (Employee API):**

  1. Lễ tân thực hiện Check-out.
  2. Hệ thống tổng hợp totalAmount từ subtotalRoom và subtotalService.
  3. Tạo Transaction loại ROOM_CHARGE hoặc ADJUSTMENT.
  4. Tạo các TransactionDetail ghi nhận đủ: baseAmount, discountAmount, amount (Net).
  5. Hệ thống cập nhật balance về 0 và chuyển Room sang trạng thái CLEANING.

### 1.10.4. **State Transition Diagram (Sơ đồ chuyển trạng thái)**

Việc quản lý trạng thái là cốt lõi để tránh xung đột dữ liệu:

- Trạng thái Đơn đặt phòng (Booking Status):

  PENDING (Hold) → (Thanh toán cọc) → CONFIRMED → (Nhận phòng) → CHECKED_IN → (Trả phòng) → CHECKED_OUT.

  (Lưu ý: PENDING có thể chuyển sang CANCELLED nếu quá 15 phút không thanh toán).

- Trạng thái Phòng (Room Status):

  AVAILABLE → (Đặt phòng PENDING) → RESERVED → (Check-in) → OCCUPIED → (Check-out) → CLEANING → (Xác nhận sạch) → AVAILABLE.

### 1.10.5. **Data Flow Diagrams (DFD)**

Mô tả luồng dữ liệu giữa các thành phần kiến trúc:

- **DFD Level 0:**
  - **Input:** Thông tin tìm kiếm, thông tin khách hàng, lệnh thanh toán, yêu cầu dọn phòng.
  - **Process:** Xử lý logic tại Backend (Node.js/TS), tính toán chiết khấu qua Rules Engine.
  - **Output:** Hóa đơn (Invoice), Mã đặt phòng, Trạng thái phòng thời gian thực, Báo cáo doanh thu.
- **External Data Flow:** Luồng trao đổi Token xác thực (JWT) và IPN (Instant Payment Notification) từ cổng thanh toán bên thứ ba.
