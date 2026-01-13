# Hướng Dẫn Tích Hợp Flow Booking (Frontend Integration Guide)

Tài liệu này hướng dẫn chi tiết cho Frontend Developer cách tích hợp luồng đặt phòng, check-in, sử dụng dịch vụ và thanh toán.

---

## 1. Màn Hình Đặt Phòng (Create Booking)

**Chức năng**: Cho phép nhân viên lễ tân hoặc khách hàng tạo đơn đặt phòng mới.

### API Endpoint

`POST /v1/bookings`

### Payload Mẫu

```json
{
  "customerId": "cm5...", // ID của khách hàng (Lấy từ màn hình tìm kiếm hoặc tạo mới khách)
  "checkInDate": "2023-12-25T14:00:00.000Z",
  "checkOutDate": "2023-12-28T12:00:00.000Z",
  "totalGuests": 2, // Tổng số khách dự kiến
  "rooms": [
    {
      "roomTypeId": "clo...", // ID loại phòng khách chọn
      "count": 1 // Số lượng phòng loại này
    }
  ]
}
```

### Logic Frontend

1. **Bước 1**: Chọn ngày check-in, check-out và số người.
2. **Bước 2**: Gọi API tìm phòng trống (Search Rooms) để hiển thị các `RoomType` khả dụng.
3. **Bước 3**: Người dùng chọn loại phòng và số lượng.
4. **Bước 4**: Nhập thông tin khách hàng (hoặc chọn khách hàng cũ).
5. **Bước 5**: Gọi API `POST /v1/bookings`.
   - **Thành công**: Chuyển sang màn hình "Chi tiết Booking" (Booking Detail). Lúc này trạng thái booking là `PENDING`.

---

## 2. Màn Hình Đặt Cọc (Booking Detail - Deposit)

**Chức năng**: Xác nhận đặt phòng bằng cách thu tiền cọc.

### API Endpoint

`POST /v1/employee/transactions`

### Payload Mẫu

```json
{
  "bookingId": "bk123...", // ID booking vừa tạo
  "amount": 500000, // Số tiền khách đóng cọc
  "paymentMethod": "BANK_TRANSFER", // CASH, CREDIT_CARD, BANK_TRANSFER, E_WALLET
  "transactionType": "DEPOSIT", // BẮT BUỘC là DEPOSIT
  "allocations": [
    // Phân bổ tiền cọc vào các phòng (thường chia đều hoặc dồn vào phòng chính)
    // Tổng splitAmount phải bằng amount tổng bên trên
    {
      "bookingRoomId": "br456...",
      "splitAmount": 500000
    }
  ]
}
```

### Logic Frontend

1. Hiển thị nút "Đặt cọc / Xác nhận" trên màn hình Booking Detail khi status là `PENDING`.
2. Modal nhập số tiền cọc và hình thức thanh toán.
3. **Lưu ý**: Cần lấy danh sách `bookingRooms` từ chi tiết booking để tạo mảng `allocations`. Nếu booking có 1 phòng, allocation 100% vào phòng đó.
4. Gọi API Transaction.
   - **Thành công**: Load lại Booking Detail. Trạng thái sẽ tự động đổi sang `CONFIRMED`.

---

## 3. Màn Hình Check-in (Booking Detail - Check-in)

**Chức năng**: Giao phòng cho khách khi khách đến nơi.

### API Endpoint

`POST /v1/employee/bookings/check-in`

### Payload Mẫu

```json
{
  "bookingId": "bk123...",
  "bookingRoomId": "br456...", // Check-in từng phòng một
  "guests": [
    {
      "customerId": "cm5...", // Khách hàng đứng tên phòng này
      "isPrimary": true // Người đại diện (bắt buộc phải có 1 người là true)
    },
    {
      "customerId": "cm6...", // Khách ở cùng (nếu có)
      "isPrimary": false
    }
  ],
  "employeeId": "emp789..." // ID nhân viên đang thực hiện (thường lấy từ token/session)
}
```

### Logic Frontend

1. Trên Booking Detail (Status `CONFIRMED`), hiển thị danh sách các phòng (`bookingRooms`).
2. Nút "Check-in" bên cạnh từng phòng.
3. Form Check-in:
   - Cho phép add thêm khách hàng vào phòng (Search khách hàng hoặc tạo nhanh).
   - Đánh dấu ai là khách chính (Primary Guest).
4. Gọi API Check-in.
   - **Thành công**: Trạng thái phòng đổi sang `CHECKED_IN`. Booking đổi sang `CHECKED_IN`.

---

## 4. Màn Hình Gọi Dịch Vụ (Service Ordering)

**Chức năng**: Thêm dịch vụ (Minibar, Spa, Ăn uống) vào phòng.

### API Endpoint

`POST /v1/employee/service/service-usage`

### Payload Mẫu

```json
{
  "bookingId": "bk123...",
  "bookingRoomId": "br456...", // Dịch vụ này dùng cho phòng nào
  "serviceId": "svc999...", // ID dịch vụ (Coca, Massage...)
  "quantity": 2,
  "employeeId": "emp789..."
}
```

### Logic Frontend

1. Tại màn hình chi tiết phòng (Room Detail) hoặc Booking Detail.
2. Nút "Thêm dịch vụ" -> Hiện danh sách Services.
3. Chọn Service -> Nhập số lượng.
4. Gọi API.
   - **Thành công**: Cập nhật lại danh sách dịch vụ đã dùng. Tổng tiền (`totalAmount`) của booking sẽ tăng lên, `balance` (công nợ) tăng lên.

---

## 5. Màn Hình Thanh Toán & Trả Phòng (Checkout & Payment)

**Chức năng**: Thanh toán số tiền còn lại và trả phòng.

### Bước 5.1: Thanh Toán (Settle Balance)

Trước khi checkout, khách cần thanh toán hết công nợ (`balance` phải về 0 hoặc có xác nhận nợ).

**API Endpoint**: `POST /v1/employee/transactions`

**Payload Mẫu**:

```json
{
  "bookingId": "bk123...",
  "amount": 1500000, // Số tiền khách trả nốt
  "paymentMethod": "CASH",
  "transactionType": "ROOM_CHARGE", // Hoặc PAYMENT, ADJUSTMENT
  "allocations": [
    {
      "bookingRoomId": "br456...",
      "splitAmount": 1500000 // Phân bổ vào phòng cần thanh toán
    }
  ]
}
```

### Bước 5.2: Check-out

**API Endpoint**: `POST /v1/employee/bookings/check-out`

**Payload Mẫu**:

```json
{
  "bookingId": "bk123...",
  "bookingRoomId": "br456...", // Phòng cần trả
  "employeeId": "emp789..."
}
```

### Logic Frontend

1. Hiển thị "Tổng tiền cần thanh toán" (`balance`) trên Booking Detail.
2. Nếu `balance > 0`: Hiển thị nút "Thanh toán".
   - Gọi API Transaction để clear công nợ.
3. Khi `balance == 0` (hoặc khách đã thanh toán đủ): Hiển thị nút "Check-out".
4. Gọi API Check-out.
   - **Thành công**: Trạng thái phòng đổi về `CHECKED_OUT`. Phòng trống (`AVAILABLE`) để đón khách mới.

---

## Tóm Tắt Trạng Thái (Status Flow)

| Bước             | Booking Status | BookingRoom Status | Room Status                 |
| :--------------- | :------------- | :----------------- | :-------------------------- |
| **1. Tạo mới**   | `PENDING`      | `PENDING`          | `AVAILABLE` (Giữ chỗ logic) |
| **2. Đặt cọc**   | `CONFIRMED`    | `CONFIRMED`        | `AVAILABLE`                 |
| **3. Check-in**  | `CHECKED_IN`   | `CHECKED_IN`       | `OCCUPIED` (Khách đang ở)   |
| **4. Check-out** | `CHECKED_OUT`  | `CHECKED_OUT`      | `AVAILABLE` (Sẵn sàng)      |
