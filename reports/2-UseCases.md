# Chương 2: Sơ đồ Use Case - Hệ thống Quản lý Khách sạn RoomMaster

## 2.1. Giới thiệu

Tài liệu này mô tả các sơ đồ Use Case của hệ thống quản lý khách sạn **RoomMaster**. Các sơ đồ được thiết kế theo chuẩn UML và thể hiện các chức năng chính của hệ thống bao gồm:

- **Quản lý Đặt phòng (Booking)**: Tạo, xác nhận, hủy và quản lý các đặt phòng
- **Check-in**: Quy trình nhận phòng cho khách
- **Check-out**: Quy trình trả phòng và thanh toán
- **Quản lý Người dùng**: Đăng ký, đăng nhập, phân quyền

---

## 2.2. Tổng quan các Actor

### 2.2.1. Danh sách Actor

| Actor                     | Mô tả                                         | Quyền hạn chính                             |
| ------------------------- | --------------------------------------------- | ------------------------------------------- |
| **Khách hàng (Customer)** | Người sử dụng dịch vụ lưu trú tại khách sạn   | Đặt phòng, xem booking, thanh toán          |
| **Lễ tân (Receptionist)** | Nhân viên tiếp tân, xử lý nghiệp vụ hàng ngày | Check-in/out, quản lý booking, thu tiền     |
| **Housekeeping**          | Nhân viên dọn phòng                           | Cập nhật trạng thái phòng                   |
| **Quản trị viên (Admin)** | Người quản lý hệ thống                        | Toàn quyền, quản lý nhân viên               |
| **Hệ thống (System)**     | Actor tự động của hệ thống                    | Cập nhật trạng thái, ghi log, gửi thông báo |

### 2.2.2. Sơ đồ phân cấp Actor

```plantuml
@startuml
!theme plain
skinparam actorStyle awesome

actor "Người dùng\n(User)" as User
actor "Khách hàng\n(Customer)" as Customer
actor "Nhân viên\n(Employee)" as Employee
actor "Lễ tân\n(Receptionist)" as Receptionist
actor "Housekeeping" as Housekeeping
actor "Quản trị viên\n(Admin)" as Admin

User <|-- Customer
User <|-- Employee
Employee <|-- Receptionist
Employee <|-- Housekeeping
Employee <|-- Admin

note right of Customer
  Sử dụng qua:
  - Mobile App
  - Web App
end note

note right of Employee
  Sử dụng qua:
  - Web Portal
  - Desktop App
end note

@enduml
```

---

## 2.3. Use Case: Quản lý Đặt phòng (Booking)

### 2.3.1. Mô tả tổng quan

Chức năng Quản lý Đặt phòng cho phép khách hàng tạo booking mới, lễ tân xác nhận và quản lý các booking. Hệ thống tự động phân bổ phòng dựa trên loại phòng và tình trạng sẵn có.

### 2.3.2. Sơ đồ Use Case

```plantuml
@startuml
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

### 2.3.3. Mô tả chi tiết các Use Case

| ID     | Use Case                    | Actor                  | Mô tả                                                          | Precondition                 | Postcondition                  |
| ------ | --------------------------- | ---------------------- | -------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| UC-B01 | **Tìm kiếm phòng trống**    | Customer, Receptionist | Tìm kiếm phòng theo ngày check-in/out, loại phòng, số khách    | Không                        | Hiển thị danh sách phòng trống |
| UC-B02 | **Xem chi tiết loại phòng** | Customer               | Xem thông tin chi tiết về loại phòng: giá, tiện nghi, hình ảnh | Không                        | Hiển thị thông tin loại phòng  |
| UC-B03 | **Tạo đặt phòng mới**       | Customer               | Chọn loại phòng, ngày, số lượng và tạo booking                 | Đã đăng nhập, có phòng trống | Booking được tạo (PENDING)     |
| UC-B04 | **Thanh toán đặt cọc**      | Customer               | Thanh toán tiền đặt cọc qua các phương thức hỗ trợ             | Có booking PENDING           | Transaction được ghi nhận      |
| UC-B05 | **Xem booking của mình**    | Customer               | Xem danh sách và chi tiết các booking đã tạo                   | Đã đăng nhập                 | Hiển thị danh sách booking     |
| UC-B06 | **Hủy đặt phòng**           | Customer, Receptionist | Hủy booking, hoàn tiền nếu đủ điều kiện                        | Booking chưa check-in        | Booking = CANCELLED            |
| UC-B07 | **Xem tất cả booking**      | Receptionist           | Xem toàn bộ booking trong hệ thống với bộ lọc                  | Đã đăng nhập (Employee)      | Hiển thị danh sách booking     |
| UC-B08 | **Xác nhận đặt phòng**      | Receptionist           | Xác nhận booking sau khi nhận đủ đặt cọc                       | Booking PENDING, đã đặt cọc  | Booking = CONFIRMED            |
| UC-B09 | **Chỉnh sửa booking**       | Receptionist           | Thay đổi thông tin booking: ngày, phòng, số khách              | Booking chưa check-out       | Booking được cập nhật          |
| UC-B10 | **Phân bổ phòng**           | Receptionist           | Gán phòng cụ thể cho booking                                   | Booking CONFIRMED            | BookingRoom được tạo           |
| UC-B11 | **Tạo booking cho khách**   | Receptionist           | Tạo booking thay cho khách (walk-in, điện thoại)               | Có phòng trống               | Booking được tạo               |
| UC-B12 | **Quản lý loại phòng**      | Admin                  | Thêm, sửa, xóa loại phòng                                      | Đăng nhập Admin              | RoomType được cập nhật         |
| UC-B13 | **Quản lý giá phòng**       | Admin                  | Cập nhật giá theo mùa, khuyến mãi                              | Đăng nhập Admin              | Pricing được cập nhật          |

### 2.3.4. Luồng xử lý chính: Tạo Booking

```plantuml
@startuml
!theme plain

title Luồng xử lý: Tạo Đặt phòng mới

|Khách hàng|
start
:Đăng nhập hệ thống;
:Tìm kiếm phòng trống;
:Chọn loại phòng và số lượng;
:Chọn ngày check-in / check-out;
:Nhập số lượng khách;

|Hệ thống|
:Kiểm tra phòng trống;
if (Có đủ phòng?) then (Có)
  :Tính toán giá và tiền cọc;
  :Tạo Booking (PENDING);
  :Sinh mã booking unique;
  :Phân bổ phòng tạm thời;

  |Khách hàng|
  :Thanh toán đặt cọc;

  |Hệ thống|
  if (Thanh toán thành công?) then (Có)
    :Tạo Transaction (DEPOSIT);
    :Cập nhật Room = RESERVED;
    :Gửi email xác nhận;

    |Lễ tân|
    :Xem booking mới;
    :Xác nhận booking;

    |Hệ thống|
    :Cập nhật Booking = CONFIRMED;
    :Ghi log Activity;
  else (Không)
    :Giữ trạng thái PENDING;
    :Đặt thời gian hết hạn (15 phút);
  endif
else (Không)
  :Thông báo hết phòng;
  stop
endif

stop

@enduml
```

### 2.3.5. Quy tắc nghiệp vụ

| STT | Quy tắc               | Mô tả                                                           |
| --- | --------------------- | --------------------------------------------------------------- |
| 1   | **Thời gian hết hạn** | Booking PENDING sẽ tự động hủy sau 15 phút nếu không thanh toán |
| 2   | **Tiền đặt cọc**      | Tính bằng giá 1 đêm của mỗi phòng được đặt                      |
| 3   | **Hủy miễn phí**      | Hủy trước 24h so với ngày check-in được hoàn 100% tiền cọc      |
| 4   | **Hủy có phí**        | Hủy trong vòng 24h giữ lại 50% tiền cọc                         |
| 5   | **Phân bổ phòng**     | Hệ thống tự động chọn phòng trống theo thứ tự tầng thấp đến cao |

---

## 2.4. Use Case: Check-in

### 2.4.1. Mô tả tổng quan

Quy trình Check-in cho phép lễ tân xác nhận khách đến nhận phòng, kiểm tra giấy tờ tùy thân, gán khách vào phòng cụ thể và cập nhật trạng thái hệ thống.

### 2.4.2. Sơ đồ Use Case

```plantuml
@startuml
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

### 2.4.3. Mô tả chi tiết các Use Case

| ID      | Use Case                        | Actor        | Mô tả                                 | Precondition          | Postcondition               |
| ------- | ------------------------------- | ------------ | ------------------------------------- | --------------------- | --------------------------- |
| UC-CI01 | **Xác minh booking**            | Receptionist | Tìm booking theo mã hoặc SĐT khách    | Booking tồn tại       | Hiển thị thông tin booking  |
| UC-CI02 | **Kiểm tra thông tin khách**    | Receptionist | Xác minh CCCD/CMND của khách          | Khách có mặt          | Thông tin được xác nhận     |
| UC-CI03 | **Cung cấp thông tin CCCD**     | Customer     | Cung cấp giấy tờ tùy thân             | Không                 | CCCD được ghi nhận          |
| UC-CI04 | **Xác minh đặt cọc**            | Receptionist | Kiểm tra tiền cọc đã thanh toán       | Booking CONFIRMED     | Xác nhận đủ cọc             |
| UC-CI05 | **Gán khách vào phòng**         | Receptionist | Liên kết khách với phòng cụ thể       | Booking CONFIRMED     | BookingCustomer được tạo    |
| UC-CI06 | **Thêm khách đi kèm**           | Receptionist | Thêm khách đi cùng vào phòng          | Có phòng đã gán       | BookingCustomer được thêm   |
| UC-CI07 | **Thực hiện check-in**          | Receptionist | Xác nhận check-in chính thức          | Tất cả điều kiện đạt  | BookingRoom = CHECKED_IN    |
| UC-CI08 | **Thu thêm tiền cọc**           | Receptionist | Thu thêm tiền nếu cọc chưa đủ         | Cọc < yêu cầu         | Transaction được tạo        |
| UC-CI09 | **Nâng cấp phòng**              | Receptionist | Đổi sang phòng cao cấp hơn            | Có phòng trống        | BookingRoom được cập nhật   |
| UC-CI10 | **Cập nhật trạng thái phòng**   | System       | Tự động cập nhật Room = OCCUPIED      | Check-in thành công   | Room.status = OCCUPIED      |
| UC-CI11 | **Cập nhật trạng thái booking** | System       | Tự động cập nhật Booking = CHECKED_IN | Tất cả phòng check-in | Booking.status = CHECKED_IN |
| UC-CI12 | **Ghi nhận hoạt động**          | System       | Ghi log Activity cho check-in         | Check-in thành công   | Activity được tạo           |
| UC-CI13 | **In phiếu check-in**           | Receptionist | In phiếu xác nhận cho khách           | Check-in thành công   | Phiếu được in               |

### 2.4.4. Luồng xử lý chính: Check-in

```plantuml
@startuml
!theme plain

title Luồng xử lý: Check-in

|Khách hàng|
start
:Đến quầy lễ tân;
:Cung cấp mã booking hoặc SĐT;

|Lễ tân|
:Tìm kiếm booking;
if (Tìm thấy booking?) then (Có)
  :Kiểm tra trạng thái;
  if (Booking = CONFIRMED?) then (Có)

    |Khách hàng|
    :Xuất trình CCCD/CMND;

    |Lễ tân|
    :Xác minh thông tin khách;
    :Kiểm tra tiền đặt cọc;

    if (Đủ tiền cọc?) then (Có)
      :Gán khách vào từng phòng;

      fork
        :Khách 1 → Phòng A;
      fork again
        :Khách 2 → Phòng A;
      fork again
        :Khách 3 → Phòng B;
      end fork

      :Thực hiện Check-in;

      |Hệ thống|
      :Cập nhật BookingRoom.status = CHECKED_IN;
      :Cập nhật BookingRoom.actualCheckIn = now();
      :Cập nhật Room.status = OCCUPIED;
      :Kiểm tra tất cả phòng đã check-in?;

      if (Tất cả phòng check-in?) then (Có)
        :Cập nhật Booking.status = CHECKED_IN;
      else (Không)
        :Giữ Booking.status = CONFIRMED;
      endif

      :Tạo Activity log;

      |Lễ tân|
      :In phiếu check-in;
      :Bàn giao chìa khóa;

    else (Không)
      |Lễ tân|
      :Yêu cầu thanh toán thêm;
      :Thu tiền cọc bổ sung;
      :Quay lại quy trình check-in;
    endif

  else (Không)
    :Thông báo booking chưa xác nhận;
    :Hướng dẫn thanh toán đặt cọc;
  endif
else (Không)
  :Thông báo không tìm thấy;
  :Đề xuất tạo booking mới;
endif

stop

@enduml
```

### 2.4.5. Bảng chuyển đổi trạng thái

| Trạng thái trước           | Hành động               | Trạng thái sau              | Ghi chú                     |
| -------------------------- | ----------------------- | --------------------------- | --------------------------- |
| **Booking: CONFIRMED**     | Check-in phòng đầu tiên | **Booking: CHECKED_IN**     | Nếu chỉ có 1 phòng          |
| **Booking: CONFIRMED**     | Check-in phòng đầu tiên | **Booking: CONFIRMED**      | Nếu còn phòng chưa check-in |
| **BookingRoom: CONFIRMED** | Thực hiện check-in      | **BookingRoom: CHECKED_IN** | Ghi actualCheckIn           |
| **Room: RESERVED**         | Check-in thành công     | **Room: OCCUPIED**          | Phòng có khách              |

---

## 2.5. Use Case: Check-out

### 2.5.1. Mô tả tổng quan

Quy trình Check-out cho phép lễ tân xử lý trả phòng, tính toán tổng hóa đơn bao gồm tiền phòng và dịch vụ, thu thanh toán và bàn giao phòng cho housekeeping dọn dẹp.

### 2.5.2. Sơ đồ Use Case

```plantuml
@startuml
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

### 2.5.3. Mô tả chi tiết các Use Case

| ID      | Use Case                        | Actor                  | Mô tả                             | Precondition             | Postcondition                   |
| ------- | ------------------------------- | ---------------------- | --------------------------------- | ------------------------ | ------------------------------- |
| UC-CO01 | **Yêu cầu check-out**           | Customer, Receptionist | Khách yêu cầu trả phòng           | BookingRoom = CHECKED_IN | Bắt đầu quy trình               |
| UC-CO02 | **Kiểm tra dịch vụ đã dùng**    | Receptionist           | Rà soát các dịch vụ khách sử dụng | Có booking               | Danh sách ServiceUsage          |
| UC-CO03 | **Thêm phí dịch vụ**            | Receptionist           | Thêm phí minibar, giặt ủi...      | Khách sử dụng dịch vụ    | ServiceUsage được tạo           |
| UC-CO04 | **Tính toán hóa đơn**           | Receptionist           | Tổng hợp phí phòng + dịch vụ      | Có booking               | Tổng tiền cần thanh toán        |
| UC-CO05 | **Xử lý thanh toán**            | Receptionist           | Thu tiền còn thiếu từ khách       | Có số tiền cần thu       | Transaction được tạo            |
| UC-CO06 | **Hoàn tiền**                   | Receptionist           | Hoàn lại tiền thừa cho khách      | Khách đã trả dư          | Transaction REFUND              |
| UC-CO07 | **Thực hiện check-out**         | Receptionist           | Xác nhận trả phòng                | Thanh toán đủ            | BookingRoom = CHECKED_OUT       |
| UC-CO08 | **Check-out một phần**          | Receptionist           | Chỉ check-out một số phòng        | Booking nhiều phòng      | Booking = PARTIALLY_CHECKED_OUT |
| UC-CO09 | **Gia hạn phòng**               | Receptionist           | Kéo dài thời gian lưu trú         | Phòng trống              | Booking được cập nhật           |
| UC-CO10 | **Cập nhật trạng thái phòng**   | System                 | Chuyển Room = CLEANING            | Check-out thành công     | Room cần dọn dẹp                |
| UC-CO11 | **Cập nhật trạng thái booking** | System                 | Cập nhật Booking status           | Tất cả phòng check-out   | Booking = CHECKED_OUT           |
| UC-CO12 | **Ghi nhận hoạt động**          | System                 | Ghi log Activity                  | Check-out thành công     | Activity được tạo               |
| UC-CO13 | **In hóa đơn**                  | Receptionist           | In hóa đơn VAT cho khách          | Thanh toán xong          | Hóa đơn được in                 |
| UC-CO14 | **Dọn dẹp phòng**               | Housekeeping           | Dọn vệ sinh phòng                 | Room = CLEANING          | Phòng sạch sẽ                   |
| UC-CO15 | **Cập nhật phòng sẵn sàng**     | Housekeeping           | Đánh dấu phòng đã dọn xong        | Dọn xong                 | Room = AVAILABLE                |

### 2.5.4. Luồng xử lý chính: Check-out

```plantuml
@startuml
!theme plain

title Luồng xử lý: Check-out

|Khách hàng|
start
:Yêu cầu check-out;

|Lễ tân|
:Tìm booking của khách;
:Kiểm tra các phòng đang ở;

fork
  :Kiểm tra minibar;
fork again
  :Kiểm tra dịch vụ giặt ủi;
fork again
  :Kiểm tra dịch vụ khác;
end fork

:Tổng hợp ServiceUsage;
:Tính toán hóa đơn;

|Hệ thống|
:Tiền phòng = Σ(pricePerNight × số đêm);
:Tiền dịch vụ = Σ(ServiceUsage.totalPrice);
:Tổng = Tiền phòng + Tiền dịch vụ;
:Còn lại = Tổng - Đã thanh toán;

|Lễ tân|
:Hiển thị hóa đơn cho khách;

if (Còn tiền phải thu?) then (Có)
  |Khách hàng|
  :Thanh toán số tiền còn lại;

  |Lễ tân|
  :Nhận thanh toán;
  :Tạo Transaction (ROOM_CHARGE / SERVICE_CHARGE);
else (Không - Có tiền thừa)
  |Lễ tân|
  :Xác nhận hoàn tiền;
  :Tạo Transaction (REFUND);
  :Hoàn tiền cho khách;
endif

|Lễ tân|
:Thực hiện check-out;

|Hệ thống|
:Cập nhật BookingRoom.status = CHECKED_OUT;
:Cập nhật BookingRoom.actualCheckOut = now();
:Cập nhật Room.status = CLEANING;

if (Tất cả phòng đã check-out?) then (Có)
  :Cập nhật Booking.status = CHECKED_OUT;
else (Không)
  :Cập nhật Booking.status = PARTIALLY_CHECKED_OUT;
endif

:Tạo Activity log;

|Lễ tân|
:In hóa đơn;
:Bàn giao cho khách;

|Housekeeping|
:Nhận thông báo phòng cần dọn;
:Dọn dẹp phòng;
:Đánh dấu hoàn thành;

|Hệ thống|
:Cập nhật Room.status = AVAILABLE;

stop

@enduml
```

### 2.5.5. Bảng chuyển đổi trạng thái

| Trạng thái trước            | Hành động              | Trạng thái sau                     | Ghi chú                |
| --------------------------- | ---------------------- | ---------------------------------- | ---------------------- |
| **BookingRoom: CHECKED_IN** | Check-out              | **BookingRoom: CHECKED_OUT**       | Ghi actualCheckOut     |
| **Booking: CHECKED_IN**     | Check-out tất cả phòng | **Booking: CHECKED_OUT**           | Hoàn tất booking       |
| **Booking: CHECKED_IN**     | Check-out một số phòng | **Booking: PARTIALLY_CHECKED_OUT** | Còn phòng đang ở       |
| **Room: OCCUPIED**          | Check-out              | **Room: CLEANING**                 | Cần dọn dẹp            |
| **Room: CLEANING**          | Dọn xong               | **Room: AVAILABLE**                | Sẵn sàng cho khách mới |

### 2.5.6. Công thức tính hóa đơn

```
Tiền phòng = Σ (pricePerNight × số đêm thực tế) cho mỗi BookingRoom

Tiền dịch vụ = Σ (ServiceUsage.totalPrice) cho tất cả dịch vụ đã dùng

Tổng hóa đơn = Tiền phòng + Tiền dịch vụ

Số tiền còn lại = Tổng hóa đơn - Σ(Transaction đã thanh toán)

Nếu Số tiền còn lại > 0: Khách cần trả thêm
Nếu Số tiền còn lại < 0: Hoàn tiền cho khách
```

---

## 2.6. Use Case: Quản lý Người dùng

### 2.6.1. Mô tả tổng quan

Chức năng Quản lý Người dùng bao gồm việc đăng ký, đăng nhập, quản lý thông tin cá nhân cho cả Khách hàng và Nhân viên. Admin có thêm quyền tạo tài khoản nhân viên và phân quyền.

### 2.6.2. Sơ đồ Use Case

```plantuml
@startuml
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

### 2.6.3. Mô tả chi tiết các Use Case

#### 2.6.3.1. Use Case Khách hàng

| ID     | Use Case                  | Mô tả                        | Input                             | Output                  |
| ------ | ------------------------- | ---------------------------- | --------------------------------- | ----------------------- |
| UC-U01 | **Đăng ký tài khoản**     | Tạo tài khoản khách hàng mới | fullName, phone, password, email? | Customer + Tokens       |
| UC-U02 | **Đăng nhập**             | Xác thực và nhận JWT         | phone, password                   | Access + Refresh tokens |
| UC-U03 | **Xem thông tin cá nhân** | Xem profile của mình         | -                                 | Customer info           |
| UC-U04 | **Cập nhật thông tin**    | Sửa họ tên, email, địa chỉ   | updateData                        | Updated customer        |
| UC-U05 | **Đổi mật khẩu**          | Thay đổi mật khẩu            | oldPassword, newPassword          | Success message         |
| UC-U06 | **Quên mật khẩu**         | Nhận email reset password    | email                             | Reset token sent        |
| UC-U07 | **Xem lịch sử booking**   | Xem các booking đã tạo       | -                                 | List of bookings        |

#### 2.6.3.2. Use Case Nhân viên

| ID     | Use Case                    | Mô tả                           | Quyền yêu cầu |
| ------ | --------------------------- | ------------------------------- | ------------- |
| UC-U08 | **Đăng nhập nhân viên**     | Xác thực tài khoản nhân viên    | Không         |
| UC-U09 | **Xem thông tin nhân viên** | Xem profile của mình            | Đã đăng nhập  |
| UC-U10 | **Tìm kiếm khách hàng**     | Tìm theo tên, SĐT, email        | Receptionist+ |
| UC-U11 | **Xem chi tiết khách hàng** | Xem thông tin + lịch sử khách   | Receptionist+ |
| UC-U12 | **Tạo khách hàng mới**      | Tạo tài khoản cho walk-in guest | Receptionist+ |

#### 2.6.3.3. Use Case Admin

| ID     | Use Case                    | Mô tả                        | Chỉ Admin |
| ------ | --------------------------- | ---------------------------- | --------- |
| UC-U13 | **Tạo tài khoản nhân viên** | Tạo tài khoản mới với role   | ✅        |
| UC-U14 | **Xem danh sách nhân viên** | Xem tất cả nhân viên         | ✅        |
| UC-U15 | **Phân quyền nhân viên**    | Thay đổi role                | ✅        |
| UC-U16 | **Vô hiệu hóa tài khoản**   | Disable tài khoản nhân viên  | ✅        |
| UC-U17 | **Đặt lại mật khẩu NV**     | Reset password cho nhân viên | ✅        |

### 2.6.4. Luồng xác thực JWT

```plantuml
@startuml
!theme plain

title Luồng Xác thực JWT

|Client|
start
:Gửi request đăng nhập;
note right
  POST /v1/customer/auth/login
  { phone, password }
end note

|Auth Service|
:Tìm user theo phone/username;

if (User tồn tại?) then (Có)
  :So sánh password (bcrypt);

  if (Password đúng?) then (Đúng)
    |Token Service|
    :Sinh Access Token (30 phút);
    :Sinh Refresh Token (30 ngày);
    :Lưu Refresh Token vào DB;

    |Auth Service|
    :Trả về user + tokens;

    |Client|
    :Lưu tokens vào storage;
    :Sử dụng Access Token cho các request;

    partition "Request với Access Token" {
      |Client|
      :Gửi request với header;
      note right
        Authorization: Bearer <accessToken>
      end note

      |Auth Middleware|
      :Trích xuất token từ header;
      :Xác minh chữ ký JWT;
      :Kiểm tra token hết hạn?;
      :Kiểm tra userType;
      :Lấy user từ DB;

      if (Token hợp lệ?) then (Có)
        :Gắn user vào req.customer/req.employee;
        :Cho phép tiếp tục;
      else (Không)
        :Trả về 401 Unauthorized;
        stop
      endif
    }

    partition "Refresh Token" {
      |Client|
      :Access Token hết hạn;
      :Gửi Refresh Token;

      |Token Service|
      :Xác minh Refresh Token;
      :Sinh Access Token mới;
      :Trả về tokens mới;
    }

  else (Sai)
    :Trả về 401 - Sai mật khẩu;
    stop
  endif
else (Không)
  :Trả về 401 - User không tồn tại;
  stop
endif

stop

@enduml
```

### 2.6.5. Cấu trúc JWT Token

```typescript
// Access Token payload
{
  sub: "customer-id-123",           // ID người dùng
  userType: "customer",             // "customer" hoặc "employee"
  type: "ACCESS",                   // Loại token
  iat: 1703750400,                  // Issued at (Unix timestamp)
  exp: 1703752200                   // Expires (30 phút sau iat)
}

// Refresh Token payload
{
  sub: "customer-id-123",
  userType: "customer",
  type: "REFRESH",
  iat: 1703750400,
  exp: 1706342400                   // Expires (30 ngày sau iat)
}
```

---

## 2.7. Ma trận phân quyền

### 2.7.1. Phân quyền theo Role

| Chức năng                 | Customer | Receptionist | Housekeeping | Admin |
| ------------------------- | :------: | :----------: | :----------: | :---: |
| **Tài khoản**             |
| Đăng ký/Đăng nhập         |    ✅    |      ✅      |      ✅      |  ✅   |
| Xem/Sửa thông tin cá nhân |    ✅    |      ✅      |      ✅      |  ✅   |
| Đổi mật khẩu              |    ✅    |      ✅      |      ✅      |  ✅   |
| **Booking**               |
| Tạo booking               |    ✅    |      ✅      |      ❌      |  ✅   |
| Xem booking của mình      |    ✅    |      -       |      -       |   -   |
| Xem tất cả booking        |    ❌    |      ✅      |      ❌      |  ✅   |
| Xác nhận/Hủy booking      |    ❌    |      ✅      |      ❌      |  ✅   |
| Chỉnh sửa booking         |    ❌    |      ✅      |      ❌      |  ✅   |
| **Check-in/Check-out**    |
| Thực hiện check-in        |    ❌    |      ✅      |      ❌      |  ✅   |
| Thực hiện check-out       |    ❌    |      ✅      |      ❌      |  ✅   |
| Xử lý thanh toán          |    ❌    |      ✅      |      ❌      |  ✅   |
| **Phòng**                 |
| Xem danh sách phòng       |    ✅    |      ✅      |      ✅      |  ✅   |
| Cập nhật trạng thái phòng |    ❌    |      ✅      |      ✅      |  ✅   |
| Quản lý loại phòng        |    ❌    |      ❌      |      ❌      |  ✅   |
| **Khách hàng**            |
| Quản lý khách hàng        |    ❌    |      ✅      |      ❌      |  ✅   |
| Xem lịch sử khách         |    ❌    |      ✅      |      ❌      |  ✅   |
| **Nhân viên**             |
| Quản lý nhân viên         |    ❌    |      ❌      |      ❌      |  ✅   |
| Phân quyền                |    ❌    |      ❌      |      ❌      |  ✅   |
| **Báo cáo**               |
| Xem báo cáo               |    ❌    |      ❌      |      ❌      |  ✅   |
| Xem thống kê              |    ❌    |      ❌      |      ❌      |  ✅   |

### 2.7.2. Giải thích Role

| Role             | Mô tả                | Phạm vi truy cập                                      |
| ---------------- | -------------------- | ----------------------------------------------------- |
| **Customer**     | Khách hàng đặt phòng | Chỉ dữ liệu của bản thân, đặt phòng qua app/web       |
| **Receptionist** | Nhân viên lễ tân     | Quản lý booking, check-in/out, thu tiền, hỗ trợ khách |
| **Housekeeping** | Nhân viên dọn phòng  | Chỉ cập nhật trạng thái phòng (CLEANING → AVAILABLE)  |
| **Admin**        | Quản trị viên        | Toàn quyền hệ thống, quản lý nhân viên, cấu hình      |

---
