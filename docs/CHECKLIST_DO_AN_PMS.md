# 📋 CHECKLIST ĐỒ ÁN PMS

## HƯỚNG ĐẾN ĐIỂM 9-10

<div align="center">

**🎯 Hệ thống Property Management System (PMS) - Quản lý Khách sạn**

[![Status](https://img.shields.io/badge/Status-In%20Progress-yellow)]() [![Target](https://img.shields.io/badge/Target-9--10%2F10-green)]()

</div>

---

## 📖 GIỚI THIỆU

| Tiêu chí            | Mô tả                                                        |
| ------------------- | ------------------------------------------------------------ |
| **Mục tiêu**        | Hướng dẫn chi tiết các tính năng cần làm theo thứ tự ưu tiên |
| **Áp dụng**         | Đồ án môn học Phát triển Phần mềm                            |
| **Chuẩn tham khảo** | PMS quốc tế (Opera PMS, Cloudbeds, Protel, eZee Absolute)    |

---

## 📑 MỤC LỤC

<details open>
<summary><h3>🔴 HIGH PRIORITY (BẮT BUỘC) - Điểm 7-8/10</h3></summary>

**Core Modules - Nghiệp vụ cốt lõi:**

1. [Quản lý Phòng (Room Management)](#-1-quản-lý-phòng-room-management)
2. [Đặt Phòng (Reservation)](#-2-đặt-phòng-reservation)
3. [Check-in](#-3-check-in)
4. [Sử dụng Dịch vụ (Service Usage)](#-4-sử-dụng-dịch-vụ-service-usage)
5. [Phụ Thu (Surcharge)](#-5-phụ-thu-surcharge)
6. [Phạt (Penalty)](#-6-phạt-penalty)
7. [Check-out & Billing](#-7-check-out--billing)
8. [Quản lý Khách hàng (Customer Management)](#-8-quản-lý-khách-hàng-customer-management)

</details>

<details>
<summary><h3>🟠 MEDIUM PRIORITY (NÂNG CAO) - Điểm 8-9/10</h3></summary>

9. [Pricing Engine](#-9-pricing-engine-giá-phòng-nâng-cao)
10. [Room Move](#-10-room-move-chuyển-phòng)
11. [Folio Transaction](#-11-folio-transaction-sổ-tính-tiền-nâng-cao)
12. [NGUOIO](#-12-quản-lý-thông-tin-khách-lưu-trú-nguoio-)
13. [Invoice](#-13-hóa-đơn-invoice)
14. [Housekeeping](#-14-housekeeping-dọn-phòng)
15. [Customer Types](#-15-quản-lý-loại-khách-hàng-customer-type-management)
16. [Edge Cases](#-16-edge-cases-trường-hợp-đặc-biệt)

</details>

<details>
<summary><h3>🟢 LOW PRIORITY (HOÀN THIỆN) - Điểm 9.5-10/10</h3></summary>

17. [Master & Guest Folio](#-17-master--guest-folio-group-booking)
18. [Void / Adjust](#-18-void--adjust-transaction)
19. [Shift Management](#-19-shift-management-quản-lý-ca)
20. [Reporting](#-20-reporting-báo-cáo-đầy-đủ)
21. [Advanced Search](#-21-tìm-kiếm-nâng-cao)
22. [Minibar Automation](#-22-minibar-automation-bonus---1010)

</details>

---

### 📚 PHỤ LỤC

- [Tổng kết toàn bộ Checklist](#-tổng-kết-toàn-bộ-checklist)
- [Chiến lược đạt điểm cao](#-chiến-lược-đạt-điểm-cao)
- [Lưu ý quan trọng](#️-lưu-ý-quan-trọng)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 📊 PHÂN CẤP ƯU TIÊN

<table>
<thead>
<tr>
<th align="center">Cấp độ</th>
<th>Mô tả</th>
<th align="center">Điểm đạt được</th>
<th align="center">Effort</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">🔴 <strong>HIGH</strong></td>
<td>Nghiệp vụ cốt lõi - <strong>BẮT BUỘC</strong><br/>8 modules cơ bản</td>
<td align="center"><strong>7-8/10</strong></td>
<td align="center">60-70%</td>
</tr>
<tr>
<td align="center">🟠 <strong>MEDIUM</strong></td>
<td>Nâng cao - Thể hiện hiểu biết nghiệp vụ<br/>8 modules advanced</td>
<td align="center"><strong>8-9/10</strong></td>
<td align="center">20-25%</td>
</tr>
<tr>
<td align="center">🟢 <strong>LOW</strong></td>
<td>Hoàn thiện - Tạo wow factor<br/>6 modules polish</td>
<td align="center"><strong>9.5-10/10</strong></td>
<td align="center">10-15%</td>
</tr>
</tbody>
</table>

---

<div align="center">

# 📋 QUẢN LÝ TRẠNG THÁI HỆ THỐNG

## State Management Overview

**Core Design Pattern: 2-Level Status**

</div>

---

### 🎯 Nguyên tắc thiết kế: **2-Level Status Pattern**

| Entity         | Level 1 (Header)              | Level 2 (Detail)                | Lý do                                               |
| -------------- | ----------------------------- | ------------------------------- | --------------------------------------------------- |
| **ĐẶT PHÒNG**  | PHIEUDAT.TrangThaiPhieu       | CT_DATPHONG.TinhTrangDatPhong   | Đặt nhiều phòng, check-in/checkout từng phòng riêng |
| **THUÊ PHÒNG** | PHIEUTHUEPHONG.TrangThaiPhieu | CT_PHIEUTHUEPHONG.TrangThaiThue | Thuê nhiều phòng, checkout từng phòng riêng         |
| **PHÒNG**      | PHONG.TrangThai               | _(không có)_                    | Trạng thái phòng độc lập, không có chi tiết         |

---

### 📊 CHI TIẾT TRẠNG THÁI TỪNG ENTITY

#### 1️⃣ **ĐẶT PHÒNG (Reservation)**

| Level      | Field                         | Giá trị       | Ý nghĩa                      | Khi nào chuyển?         |
| ---------- | ----------------------------- | ------------- | ---------------------------- | ----------------------- |
| **Header** | PHIEUDAT.TrangThaiPhieu       | `PENDING`     | Toàn bộ đơn chưa xác nhận    | Tạo mới, chưa cọc       |
|            |                               | `CONFIRMED`   | Toàn bộ đơn đã xác nhận      | Sau khi cọc đủ          |
|            |                               | `CHECKED_IN`  | **Tất cả** phòng đã check-in | Khi phòng cuối check-in |
|            |                               | `CHECKED_OUT` | **Tất cả** phòng đã checkout | Khi phòng cuối checkout |
|            |                               | `CANCELLED`   | Hủy toàn bộ đơn              | Khách hủy tất cả        |
|            |                               | `NO_SHOW`     | Khách không đến              | Quá giờ check-in 6h     |
| **Detail** | CT_DATPHONG.TinhTrangDatPhong | `PENDING`     | Phòng này chưa xác nhận      | Tạo mới                 |
|            |                               | `CONFIRMED`   | Phòng này đã xác nhận        | Header confirmed        |
|            |                               | `CHECKED_IN`  | Phòng này đã check-in        | Khi check-in phòng này  |
|            |                               | `CHECKED_OUT` | Phòng này đã checkout        | Khi checkout phòng này  |
|            |                               | `CANCELLED`   | Hủy phòng này                | Hủy riêng 1 phòng       |
|            |                               | `NO_SHOW`     | Phòng này khách không đến    | Quá giờ 6h              |

**💡 Rule cập nhật PHIEUDAT.TrangThaiPhieu:**

```sql
-- Chuyển sang CHECKED_IN khi TẤT CẢ phòng đã check-in
IF (SELECT COUNT(*) FROM CT_DATPHONG
    WHERE MaPhieuDat = @MaPhieuDat
    AND TinhTrangDatPhong != 'CHECKED_IN') = 0
THEN PHIEUDAT.TrangThaiPhieu = 'CHECKED_IN'

-- Chuyển sang CHECKED_OUT khi TẤT CẢ phòng đã checkout
IF (SELECT COUNT(*) FROM CT_DATPHONG
    WHERE MaPhieuDat = @MaPhieuDat
    AND TinhTrangDatPhong != 'CHECKED_OUT') = 0
THEN PHIEUDAT.TrangThaiPhieu = 'CHECKED_OUT'
```

---

#### 2️⃣ **THUÊ PHÒNG (Stay/Rental)**

| Level      | Field                           | Giá trị       | Ý nghĩa               | Khi nào chuyển?                                 |
| ---------- | ------------------------------- | ------------- | --------------------- | ----------------------------------------------- |
| **Header** | PHIEUTHUEPHONG.TrangThaiPhieu   | `CHECKED_IN`  | Đang thuê phòng       | Tạo khi check-in                                |
|            |                                 | `CHECKED_OUT` | Đã trả phòng xong     | Khi **tất cả** phòng checkout + thanh toán xong |
| **Detail** | CT_PHIEUTHUEPHONG.TrangThaiThue | `OCCUPIED`    | Phòng đang có khách ở | Tạo khi check-in                                |
|            |                                 | `CHECKED_OUT` | Phòng đã checkout     | Khi checkout phòng này                          |

**💡 Rule cập nhật PHIEUTHUEPHONG.TrangThaiPhieu:**

```sql
-- Chuyển sang CHECKED_OUT khi TẤT CẢ phòng đã checkout VÀ thanh toán xong
IF (SELECT COUNT(*) FROM CT_PHIEUTHUEPHONG
    WHERE MaPhieuThue = @MaPhieuThue
    AND TrangThaiThue != 'CHECKED_OUT') = 0
AND FOLIO.ConLai = 0  -- Đã thanh toán hết
THEN PHIEUTHUEPHONG.TrangThaiPhieu = 'CHECKED_OUT'
```

---

#### 3️⃣ **PHÒNG (Room)**

| Field           | Giá trị       | Ý nghĩa                  | Khi nào chuyển?                  |
| --------------- | ------------- | ------------------------ | -------------------------------- |
| PHONG.TrangThai | `READY`       | Phòng sạch, sẵn sàng bán | Sau khi dọn xong, inspected      |
|                 | `RESERVED`    | Đã được đặt trước        | Khi tạo booking (nếu chọn phòng) |
|                 | `OCCUPIED`    | Đang có khách ở          | Khi check-in                     |
|                 | `DIRTY`       | Phòng bẩn, cần dọn       | Sau checkout                     |
|                 | `MAINTENANCE` | Đang sửa chữa, không bán | Khi báo hỏng                     |

**💡 Lưu ý:** PHONG.TrangThai là **single-level**, không có chi tiết

---

### 🔄 WORKFLOW TỔNG HỢP

#### Từ Booking → Checkout - Complete Journey

<br/>

```
┌─────────────────────────────────────────────────────────────────────────┐
│  KHÁCH ĐẶT 2 PHÒNG (101, 102) - CheckIn khác ngày, Checkout khác ngày  │
└─────────────────────────────────────────────────────────────────────────┘

📅 Ngày 08/12 - TẠO BOOKING
  PHIEUDAT.TrangThaiPhieu: NULL → PENDING
  CT_DATPHONG (101): NULL → PENDING
  CT_DATPHONG (102): NULL → PENDING
  PHONG (101): READY (chưa chuyển)
  PHONG (102): READY (chưa chuyển)

📅 Ngày 09/12 - CỌC TIỀN
  PHIEUDAT.TrangThaiPhieu: PENDING → CONFIRMED
  CT_DATPHONG (101): PENDING → CONFIRMED
  CT_DATPHONG (102): PENDING → CONFIRMED
  PHONG (101): READY → RESERVED ✅
  PHONG (102): READY → RESERVED ✅

  FOLIO: NULL → Tạo mới ✅
    MaPhieuDat = PD001
    MaPhieuThue = NULL (chưa check-in)
    TrangThai = 'Open'
  FOLIOTRANSACTION: Tạo Deposit ✅
    LoaiGiaoDich = 'Deposit'
    Credit = 3,000,000đ (cọc 30%)
    Folio.ConLai = -3,000,000đ (đã trả trước)

📅 Ngày 10/12 - CHECK-IN PHÒNG 101
  PHIEUDAT.TrangThaiPhieu: CONFIRMED (vẫn giữ, vì 102 chưa check-in)
  CT_DATPHONG (101): CONFIRMED → CHECKED_IN ✅
  CT_DATPHONG (102): CONFIRMED (chưa đến)
  PHONG (101): RESERVED → OCCUPIED ✅
  PHONG (102): RESERVED (chờ check-in)

  PHIEUTHUEPHONG.TrangThaiPhieu: NULL → CHECKED_IN ✅ (tạo mới)
  CT_PHIEUTHUEPHONG (101): NULL → OCCUPIED ✅

  FOLIO: Update ✅
    MaPhieuThue = PT001 (gắn vào phiếu thuê)
    ConLai = -3,000,000đ (vẫn giữ credit từ cọc)

📅 Ngày 12/12 - CHECK-IN PHÒNG 102
  PHIEUDAT.TrangThaiPhieu: CONFIRMED → CHECKED_IN ✅ (tất cả đã check-in)
  CT_DATPHONG (101): CHECKED_IN
  CT_DATPHONG (102): CONFIRMED → CHECKED_IN ✅
  PHONG (101): OCCUPIED
  PHONG (102): RESERVED → OCCUPIED ✅

  CT_PHIEUTHUEPHONG (102): NULL → OCCUPIED ✅ (thêm vào phiếu thuê)

📅 Ngày 14/12 - CHECKOUT PHÒNG 101
  PHIEUDAT.TrangThaiPhieu: CHECKED_IN (vẫn giữ, vì 102 chưa checkout)
  CT_DATPHONG (101): CHECKED_IN → CHECKED_OUT ✅
  CT_DATPHONG (102): CHECKED_IN (chưa checkout)
  PHONG (101): OCCUPIED → DIRTY ✅
  PHONG (102): OCCUPIED

  PHIEUTHUEPHONG.TrangThaiPhieu: CHECKED_IN (vẫn giữ, vì 102 chưa checkout)
  CT_PHIEUTHUEPHONG (101): OCCUPIED → CHECKED_OUT ✅
  CT_PHIEUTHUEPHONG (102): OCCUPIED

📅 Ngày 15/12 - CHECKOUT PHÒNG 102
  PHIEUDAT.TrangThaiPhieu: CHECKED_IN → CHECKED_OUT ✅ (tất cả đã xong)
  CT_DATPHONG (101): CHECKED_OUT
  CT_DATPHONG (102): CHECKED_IN → CHECKED_OUT ✅
  PHONG (101): DIRTY
  PHONG (102): OCCUPIED → DIRTY ✅

  PHIEUTHUEPHONG.TrangThaiPhieu: CHECKED_IN → CHECKED_OUT ✅ (tất cả đã xong)
  CT_PHIEUTHUEPHONG (101): CHECKED_OUT
  CT_PHIEUTHUEPHONG (102): OCCUPIED → CHECKED_OUT ✅

📅 Ngày 15/12 - DỌN PHÒNG
  PHONG (101): DIRTY → READY ✅
  PHONG (102): DIRTY → READY ✅
```

---

### ✅ CHECKLIST KIỂM TRA TRẠNG THÁI

**Khi code, đảm bảo:**

- [ ] Cập nhật **cả 2 levels** (Header + Detail) khi check-in/checkout
- [ ] Header chỉ chuyển trạng thái khi **TẤT CẢ** detail đã chuyển
- [ ] Luôn kiểm tra điều kiện trước khi chuyển trạng thái Header
- [ ] Log đầy đủ khi chuyển trạng thái (audit trail)
- [ ] Validate trạng thái hợp lệ (không nhảy trạng thái)
- [ ] UI hiển thị cả 2 levels (tổng quan + chi tiết)

---

## 🔴 CẤP ĐỘ HIGH PRIORITY (BẮT BUỘC)

> **Mục tiêu**: Đạt 7-8/10 điểm  
> **Thời gian**: 60-70% effort  
> **Yêu cầu**: PHẢI CÓ đầy đủ các tính năng này

### 🔴 MODULE 1: QUẢN LÝ PHÒNG

#### Room Management

<br/>

**Chức năng cốt lõi:**

- [ ] Danh sách phòng theo tầng/loại
- [ ] Theo dõi trạng thái phòng realtime:
  - `READY` - Phòng sạch, sẵn sàng bán
  - `RESERVED` - Đã được đặt trước (có PHIEUDAT)
  - `OCCUPIED` - Đang có khách ở
  - `DIRTY` - Phòng bẩn, cần dọn
  - `MAINTENANCE` - Đang sửa chữa / không bán
- [ ] Xem chi tiết phòng (số giường, loại phòng, view...)
- [ ] Lọc/tìm kiếm phòng theo tiêu chí

**Workflow trạng thái phòng:**

```
Có Booking trước:
READY → (tạo booking) → RESERVED → (check-in) → OCCUPIED → (checkout) → DIRTY → (dọn xong) → READY

Walk-in (không booking):
READY → (check-in trực tiếp) → OCCUPIED → (checkout) → DIRTY → (dọn xong) → READY
```

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 1_

**Acceptance Criteria:**

- Hiển thị đúng trạng thái phòng realtime
- Cập nhật trạng thái khi: **booking → check-in → check-out → housekeeping**
- UI trực quan (có thể dùng grid/card view)
- Workflow update trạng thái:
  - **Khi tạo booking** (có chọn phòng cụ thể): READY → RESERVED
  - **Khi check-in**: RESERVED → OCCUPIED (hoặc READY → OCCUPIED nếu walk-in)
  - **Khi checkout**: OCCUPIED → DIRTY
  - **Sau khi dọn xong**: DIRTY → READY

---

### ✅ 2. Đặt Phòng (Reservation)

**Chức năng cốt lõi (Đơn giản hóa cho đồ án):**

- [ ] Tạo đặt phòng mới
  - Chọn ngày đến - ngày đi
  - Chọn loại phòng
  - **Chọn phòng cụ thể** (tùy chọn - có thể để trống)
  - Số lượng khách
  - Thông tin khách hàng
- [ ] **Check Availability** (Kiểm tra phòng trống)
  - Query phòng trống theo loại phòng trong khoảng thời gian
  - Hiển thị danh sách phòng available (số phòng, tầng, view...)
  - Cho phép chọn phòng cụ thể hoặc để trống
  - Tránh conflict với booking khác (validate trùng lặp)

#### 📊 **TRẠNG THÁI ĐẶT PHÒNG (2 levels):**

**Level 1: PHIEUDAT.TrangThaiPhieu** (Trạng thái toàn bộ đơn đặt)

- `PENDING` - Khách đặt nhưng chưa xác nhận (chưa cọc)
- `CONFIRMED` - Đơn đặt đã xác nhận / đã cọc đủ
- `CHECKED_IN` - **Tất cả** phòng đã check-in
- `CHECKED_OUT` - **Tất cả** phòng đã trả phòng và thanh toán xong
- `CANCELLED` - Khách hủy toàn bộ đơn đặt
- `NO_SHOW` - Khách không đến (quá giờ nhận phòng)

**Level 2: CT_DATPHONG.TinhTrangDatPhong** (Trạng thái từng phòng riêng lẻ)

- `PENDING` - Phòng này chưa xác nhận
- `CONFIRMED` - Phòng này đã xác nhận
- `CHECKED_IN` - Phòng này đã check-in
- `CHECKED_OUT` - Phòng này đã checkout
- `CANCELLED` - Hủy phòng này (giữ lại phòng khác)
- `NO_SHOW` - Phòng này khách không đến

**💡 Tại sao cần 2 levels?**

```
Ví dụ: Khách đặt 3 phòng (101, 102, 103)
- Ngày 10/12: Check-in phòng 101, 102
  → CT_DATPHONG (101, 102): CONFIRMED → CHECKED_IN
  → CT_DATPHONG (103): CONFIRMED (chưa đến)
  → PHIEUDAT.TrangThaiPhieu: CONFIRMED (vẫn còn phòng chưa check-in)

- Ngày 12/12: Check-in phòng 103
  → CT_DATPHONG (103): CONFIRMED → CHECKED_IN
  → PHIEUDAT.TrangThaiPhieu: CONFIRMED → CHECKED_IN (tất cả đã check-in)

- Ngày 15/12: Checkout phòng 101
  → CT_DATPHONG (101): CHECKED_IN → CHECKED_OUT
  → PHIEUDAT.TrangThaiPhieu: CHECKED_IN (còn 102, 103 chưa checkout)

→ Kết luận: PHIEUDAT track toàn bộ, CT_DATPHONG track chi tiết!
```

- [ ] **Đặt cọc (Deposit)** - QUAN TRỌNG!
  - Tính % đặt cọc (30-50%)
  - **Tạo FOLIO ngay khi booking** (link MaPhieuDat, MaPhieuThue = NULL)
  - Thu tiền cọc → Post vào **FOLIOTRANSACTION** (LoaiGiaoDich='Deposit', Credit = số tiền cọc)
  - Cho phép cọc nhiều lần (tạo nhiều FolioTransaction type='Deposit')
  - Folio.ConLai giảm dần khi cọc (Balance âm = đã trả trước)
  - Cập nhật trạng thái booking: PENDING → CONFIRMED (khi cọc đủ)
- [ ] Sửa/Hủy đặt phòng
  - Cho phép đổi phòng nếu phòng mới còn trống
  - Áp dụng chính sách hủy
  - Hoàn tiền nếu đủ điều kiện

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 2_

**Business Rule (Đơn giản hóa cho đồ án):**

```
Booking Flow:
1. Tạo PHIEUDAT (header)
2. Tạo nhiều CT_DATPHONG (1 record = 1 phòng)
3. Khách đặt 3 phòng → 1 PHIEUDAT + 3 CT_DATPHONG

Availability Check:
- Query CT_DATPHONG để kiểm tra phòng trống
- Phòng trống = Không có CT_DATPHONG nào overlap [NgayNhanDuKien, NgayTraDuKien]
- WHERE TinhTrangDatPhong NOT IN ('CANCELLED', 'CHECKED_IN')
- Nếu khách chọn phòng cụ thể: Validate MaPhong không conflict
- Nếu không chọn: MaPhong = NULL, gán khi check-in

Conflict Validation:
- Không cho đặt nếu phòng đã có booking overlap
- Alert nếu phòng sắp có booking tiếp theo (trong vòng 3 giờ)

Deposit Policy:
- Cọc tối thiểu: 30% tổng giá trị booking
- Cọc tối đa: 100% (prepayment)
- Tạo FOLIO ngay khi booking:
  FOLIO (MaPhieuDat=PD001, MaPhieuThue=NULL, TrangThai='Open')
- Cho phép cọc nhiều lần:
  FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=TienCoc)
- Balance = TotalCharge - TotalPayment (âm = đã trả trước)
- Khi check-in: Update FOLIO.MaPhieuThue = PT001 (gắn vào phiếu thuê)

Cancellation Policy:
- Hủy > 24h trước: Free (hoàn 100% cọc)
- Hủy < 24h: Mất 50% cọc
- No-show: Mất 100% cọc
```

**Acceptance Criteria:**

- Hiển thị danh sách phòng trống khi chọn loại phòng + ngày
- Validate không cho đặt phòng conflict (query CT_DATPHONG)
- Cho phép booking mà không cần chọn phòng (CT_DATPHONG.MaPhong = NULL)
- **Hỗ trợ đặt nhiều phòng:**
  - 1 PHIEUDAT có thể có nhiều CT_DATPHONG
  - Mỗi CT_DATPHONG = 1 phòng
  - Tính tổng tiền cho toàn bộ phiếu
- **Thu tiền cọc đầy đủ:**
  - Tính đúng % cọc yêu cầu (trên tổng giá trị PHIEUDAT)
  - Tạo FOLIO ngay (link MaPhieuDat)
  - Post tiền cọc vào FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit)
  - Cho phép cọc nhiều lần (nhiều FolioTransaction type='Deposit')
  - Hiển thị Folio.ConLai (số âm = đã cọc bao nhiêu)
- **Cập nhật trạng thái khi tạo booking:**
  - PHIEUDAT.TrangThaiPhieu: NULL → PENDING → CONFIRMED (sau khi cọc)
  - CT_DATPHONG.TinhTrangDatPhong: NULL → PENDING → CONFIRMED
  - **PHONG.TrangThai: READY → RESERVED** (nếu đã chọn phòng cụ thể - MaPhong != NULL)
- Email/SMS xác nhận (tùy chọn)

**Lưu ý đồ án:**

- Đơn giản hóa: Cho chọn phòng ngay khi booking để dễ code & demo
- Trong báo cáo ghi chú: "Thiết kế phù hợp phạm vi đồ án môn học"
- PMS thực tế thường book theo loại phòng, gán phòng khi check-in

---

### ✅ 3. Check-in

#### 📊 **TRẠNG THÁI PHIẾU THUÊ (2 levels):**

**Level 1: PHIEUTHUEPHONG.TrangThaiPhieu** (Trạng thái toàn bộ phiếu thuê)

- `CHECKED_IN` - Đang thuê (tạo khi check-in)
- `CHECKED_OUT` - Đã trả phòng và thanh toán xong

**Level 2: CT_PHIEUTHUEPHONG.TrangThaiThue** (Trạng thái thuê từng phòng)

- `OCCUPIED` - Phòng đang có khách ở
- `CHECKED_OUT` - Phòng này đã checkout

**💡 Tại sao cần 2 levels?**

```
Ví dụ: Khách thuê 2 phòng (201, 202) cùng lúc
- Ngày 10/12: Check-in cả 2 phòng
  → PHIEUTHUEPHONG.TrangThaiPhieu: CHECKED_IN
  → CT_PHIEUTHUEPHONG (201): OCCUPIED
  → CT_PHIEUTHUEPHONG (202): OCCUPIED

- Ngày 12/12: Checkout sớm phòng 201
  → CT_PHIEUTHUEPHONG (201): OCCUPIED → CHECKED_OUT
  → CT_PHIEUTHUEPHONG (202): OCCUPIED (vẫn ở)
  → PHIEUTHUEPHONG.TrangThaiPhieu: CHECKED_IN (còn phòng 202)

- Ngày 15/12: Checkout phòng 202
  → CT_PHIEUTHUEPHONG (202): OCCUPIED → CHECKED_OUT
  → PHIEUTHUEPHONG.TrangThaiPhieu: CHECKED_IN → CHECKED_OUT (hết phòng)

→ Kết luận: PHIEUTHUEPHONG track toàn phiếu, CT_PHIEUTHUEPHONG track từng phòng!
```

---

**Chức năng cốt lõi:**

- [ ] Tìm booking theo: Mã đặt phòng / Tên khách / CCCD
- [ ] Kiểm tra trạng thái phòng:
  - **Nếu đã chọn phòng khi booking**: Kiểm tra phòng sẵn sàng (status = Vacant Clean/Ready)
  - **Nếu chưa chọn phòng**: Gán phòng cụ thể theo loại phòng đã đặt
- [ ] Gán/Xác nhận phòng cụ thể cho booking
  ```
  - Trường hợp 1: Đã chọn phòng khi booking → Xác nhận phòng đó
  - Trường hợp 2: Chưa chọn phòng → Chọn phòng trống cùng loại
  - Trường hợp 3: Phòng không sẵn sàng → Đề xuất phòng khác (Room Move)
  ```
- [ ] Tạo phiếu thuê phòng (STAY)
- [ ] **Thu thập thông tin lưu trú:**
  - Mở form nhập thông tin NGUOIO
  - Nhập thông tin từng người:
    - Họ tên đầy đủ
    - Loại giấy tờ (CCCD/CMND/Passport)
    - Số giấy tờ
    - Ngày sinh
    - Quốc tịch
    - Địa chỉ thường trú
    - Ngày bắt đầu ở / Ngày kết thúc (copy từ booking)
  - **Lưu vào bảng NGUOIO** - mỗi người 1 record
  - Link với CT_PHIEUTHUEPHONG (phòng cụ thể)
- [ ] Thu tiền cọc thêm (nếu cần)
- [ ] **Kiểm tra yêu cầu phụ thu khi check-in:**
  - **Early check-in**: Nếu check-in trước 14:00
    - Trước 10:00: Phụ thu 50% giá phòng
    - 10:00-14:00: Miễn phí (nếu phòng sẵn sàng)
    - Hiển thị thông báo cho lễ tân
  - **Extra person**: Nếu số người > số người chuẩn của phòng
    - Tính 30-50% giá phòng/người/đêm
  - **Extra bed**: Nếu yêu cầu giường phụ
    - Tính 200k-500k/giường/đêm
  - **Pet**: Nếu khách mang thú cưng
    - Tính 200k-500k/đêm + deposit 1-2 triệu
  - Tạo record PHUTHU và post vào Folio ngay
- [ ] **Xử lý FOLIO:**
  - **Nếu có booking trước:**
    - Lấy Folio đã tạo từ lúc booking (WHERE MaPhieuDat = @MaPhieuDat)
    - Update: FOLIO.MaPhieuThue = @MaPhieuThue (gắn vào phiếu thuê)
    - Folio.ConLai đã có credit từ tiền cọc (số âm)
  - **Nếu walk-in (không có booking):**
    - Tạo FOLIO mới: FOLIO (MaPhieuDat = NULL, MaPhieuThue = @MaPhieuThue)
    - Thu tiền cọc (nếu cần) → Post FolioTransaction (LoaiGiaoDich='Deposit')
  - Bắt đầu post room charge + service charge vào folio
- [ ] Cập nhật trạng thái:
  - Booking: `CONFIRMED` → `CHECKED_IN`
  - Room: `RESERVED` → `OCCUPIED` (hoặc `READY` → `OCCUPIED` nếu walk-in)
  - DATPHONG.MaPhong: Cập nhật nếu ban đầu NULL
- [ ] In registration card (tùy chọn)

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 3_

**Business Rule:**

```
Check-in Flow:
1. Tìm PHIEUDAT theo mã/tên/CCCD
2. Tạo PHIEUTHUEPHONG (link MaPhieuDat, hoặc NULL nếu walk-in)
3. Tạo nhiều CT_PHIEUTHUEPHONG (1 record = 1 phòng)
4. Mở form nhập thông tin NGUOIO:
   - Nhập thông tin từng người lưu trú
   - Mỗi phòng (CT_PHIEUTHUEPHONG) có nhiều NGUOIO
   - Validate: Bắt buộc có HoTen, LoaiGiayTo, SoGiayTo
5. Kiểm tra và tạo PHỤ THU (nếu có):
   A. Early check-in (nếu check-in trước 10:00):
      - Tính phụ thu: 50% giá phòng
      - Lấy dịch vụ: SELECT * FROM DICHVU WHERE MaDV='DV_PT001' (Early Check-in)
      - Alert: "Early check-in phát hiện (8:00 AM). Phụ thu: 1,000,000đ. Xác nhận?"
      - Post: FOLIOTRANSACTION (MaDV='DV_PT001', LoaiGiaoDich='Surcharge', Debit=1000000)

   B. Extra person (nếu SoNguoiO > SoNguoiChuan):
      - Tính phụ thu: (SoNguoiO - SoNguoiChuan) × 400k/người/đêm
      - Lấy dịch vụ: SELECT * FROM DICHVU WHERE MaDV='DV_PT003' (Extra Person)
      - Alert: "Phòng có 4 người (chuẩn 2). Phụ thu: 800k/đêm. Xác nhận?"
      - Post mỗi đêm (Job auto 00:00) với MaDV='DV_PT003'

   C. Extra bed (nếu khách yêu cầu):
      - Lấy dịch vụ: SELECT * FROM DICHVU WHERE MaDV='DV_PT004' (Extra Bed)
      - Phụ thu: DonGia = 300,000đ/giường/đêm
      - Post 1 lần

   D. Pet (nếu khách mang thú cưng):
      - Lấy dịch vụ: SELECT * FROM DICHVU WHERE MaDV='DV_PT005' (Pet)
      - Phụ thu: DonGia = 300,000đ/đêm
      - Deposit riêng: 1-2 triệu (hoàn lại nếu không hư hỏng)
      - Post deposit: FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=Deposit)
6. Xử lý FOLIO:
   - Nếu có booking (MaPhieuDat != NULL):
     * Lấy Folio đã tạo từ lúc booking: SELECT * FROM FOLIO WHERE MaPhieuDat = @MaPhieuDat
     * Update: FOLIO.MaPhieuThue = @MaPhieuThue
     * Folio.ConLai đã có tiền cọc (credit) từ trước
   - Nếu walk-in (MaPhieuDat = NULL):
     * Tạo FOLIO mới: FOLIO (MaPhieuDat = NULL, MaPhieuThue = @MaPhieuThue, TrangThai = 'Open')
     * Thu tiền cọc ngay (nếu cần): FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=TienCoc)

Validation:
- Không check-in nếu phòng không sẵn sàng
- PHẢI có thông tin NGUOIO cho ít nhất 1 người (bắt buộc: HoTen, LoaiGiayTo, SoGiayTo)
- Nếu chưa chọn phòng: Gán MaPhong cho CT_DATPHONG → tạo CT_PHIEUTHUEPHONG
- Nếu đã chọn phòng: Kiểm tra phòng sẵn sàng → tạo CT_PHIEUTHUEPHONG

Phụ thu khi check-in:
- Tự động phát hiện:
  * Early check-in: So sánh NOW() với 14:00
  * Extra person: So sánh SoNguoiO với LOAIPHONG.SoNguoiChuan
  * Pet: Checkbox "Có thú cưng?"
- Alert rõ ràng cho lễ tân xác nhận từng loại phụ thu
- Cho phép miễn phụ thu cho khách VIP (waive with reason)
- Extra person charge: Post mỗi đêm (job auto), không post 1 lần

Walk-in Flow:
- Bỏ qua PHIEUDAT (không tạo booking)
- Tạo thẳng PHIEUTHUEPHONG (MaPhieuDat = NULL)
- Tạo CT_PHIEUTHUEPHONG cho từng phòng
- Nhập thông tin NGUOIO (form đơn giản)
- Kiểm tra phụ thu (early check-in, extra person, pet...)
- **Tạo FOLIO mới:** FOLIO (MaPhieuDat = NULL, MaPhieuThue = PT001, TrangThai = 'Open')
- Thu tiền cọc (nếu yêu cầu):
  * FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=TienCoc)
  * Folio.ConLai = -TienCoc (âm = đã trả trước)
```

**Acceptance Criteria:**

- Workflow hoàn chỉnh từ booking → check-in
- **Hỗ trợ check-in nhiều phòng:**
  - 1 PHIEUTHUEPHONG có thể có nhiều CT_PHIEUTHUEPHONG
  - Mỗi CT_PHIEUTHUEPHONG = 1 phòng đang thuê
- **Hỗ trợ walk-in:**
  - Không cần PHIEUDAT trước
  - PHIEUTHUEPHONG.MaPhieuDat = NULL
- **Form nhập thông tin NGUOIO:**
  - Form đơn giản, dễ sử dụng
  - Phải có ít nhất 1 NGUOIO cho mỗi CT_PHIEUTHUEPHONG
  - Validate: HoTen, LoaiGiayTo, SoGiayTo bắt buộc
  - Có thể nhập nhiều người cho 1 phòng
- **Kiểm tra và tạo PHỤ THU tự động:**
  - Phát hiện early check-in (trước 10:00) → Alert + tính phụ thu 50% giá phòng
  - Phát hiện extra person (số người > chuẩn) → Alert + tính phụ thu/người/đêm
  - Phát hiện extra bed → Alert + tính phụ thu/giường
  - Phát hiện pet → Alert + tính phụ thu/đêm + yêu cầu deposit riêng
  - Lễ tân xác nhận → Tạo PHUTHU → Post Surcharge vào Folio
  - Cho phép miễn phụ thu cho VIP (waive with reason)
  - **Lưu ý:** Extra person charge post MỖI ĐÊM (job auto), không post 1 lần
- Cập nhật đồng bộ trạng thái:
  - PHIEUDAT.TrangThaiPhieu: CONFIRMED → CHECKED_IN
  - CT_DATPHONG.TinhTrangDatPhong: CONFIRMED → CHECKED_IN
  - PHONG.TrangThai: RESERVED → OCCUPIED (hoặc READY → OCCUPIED nếu walk-in)
  - PHIEUTHUEPHONG.TrangThaiPhieu: NULL → CHECKED_IN
  - CT_PHIEUTHUEPHONG.TrangThaiThue: NULL → OCCUPIED
- **Xử lý FOLIO đúng theo case:**
  - Có booking: Gắn FOLIO vào phiếu thuê (Update FOLIO.MaPhieuThue)
  - Walk-in: Tạo FOLIO mới (MaPhieuDat = NULL, MaPhieuThue = PT001)
- Folio.ConLai đã có credit từ tiền cọc (số âm = đã trả trước) nếu có cọc
- Lưu thông tin khách vào NGUOIO để tra cứu lịch sử
- Phụ thu được tạo và post vào Folio chính xác

---

### 🔴 MODULE 4: SỬ DỤNG DỊCH VỤ

#### Service Usage Management

<br/>

**Chức năng cốt lõi:**

- [ ] Danh sách dịch vụ (Minibar, Laundry, Restaurant, Spa...)
- [ ] Chọn khách hàng/phòng đang ở
- [ ] Chọn dịch vụ + số lượng
- [ ] **Post Charge** vào Folio
  - Tạo FolioTransaction
  - Cập nhật tổng tiền Folio
- [ ] Lưu lịch sử sử dụng dịch vụ

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 4_

**Business Rule:**

```
Post Service Charge:
- ThanhTien = DonGia × SoLuong
- Folio.TongTien += ThanhTien
- Folio.ConLai += ThanhTien
```

**Acceptance Criteria:**

- Post charge chính xác vào đúng folio
- Hiển thị lịch sử giao dịch đầy đủ
- Không cho post vào folio đã check-out

---

### ✅ 5. Phụ Thu (Surcharge)

**📌 Khái niệm:**  
Phụ thu là **phí phát sinh do khách YÊU CẦU dịch vụ thêm hoặc thay đổi lịch trình**.  
Đặc điểm: **CÓ THỂ BIẾT TRƯỚC, có thể tránh được**, khách có quyền lựa chọn.

**💡 Tại sao cần hiểu rõ Phụ Thu?**

- ✅ Tính toán chính xác chi phí cho khách
- ✅ Alert lễ tân để xác nhận trước khi áp dụng
- ✅ Tạo trải nghiệm tốt (khách biết rõ phí phát sinh)
- ✅ Tránh khiếu nại khi check-out

**Lưu vào:** Bảng **DICHVU** với `NhomDichVu = 'PHUTHU'`

| Loại phụ thu | Thời điểm phát sinh | Thời điểm tính | Công thức | MaDV (ví dụ) |
| **Early Check-in** | Check-in trước 14:00 | Ngay khi check-in | • Trước 10:00: 50% giá phòng<br>• 10:00-14:00: Miễn phí (nếu phòng sẵn sàng) | DV_PT001 |
| **Late Checkout** | Checkout sau 14:00 | Ngay khi checkout | • 14:00-18:00: 50% giá phòng<br>• Sau 18:00: 100% giá phòng | DV_PT002 |
| **Extra Person** | Số người > Số người chuẩn | Ngay khi check-in | 30-50% giá phòng/người/đêm | DV_PT003 |
| **Extra Bed** | Khách yêu cầu giường phụ | Ngay khi check-in | 200k-500k/giường/đêm | DV_PT004 |
| **Pet** | Khách mang thú cưng | Ngay khi check-in | 200k-500k/đêm + Deposit 1-2 triệu | DV_PT005 |
| **View Upgrade** | Upgrade phòng view đẹp hơn | Khi đổi phòng | 10-20% giá phòng/đêm | DV_PT006 |
| **Airport Transfer** | Khách đặt xe đón/tiễn | Khi sử dụng dịch vụ | 300k-500k/chuyến | DV_PT007 |

**Workflow xử lý phụ thu:**

```
1. Phát hiện điều kiện phụ thu:
   - Early check-in: So sánh giờ check-in với 14:00
   - Late checkout: So sánh giờ checkout với 14:00
   - Extra person: So sánh SoNguoiO với LOAIPHONG.SoNguoiChuan
   - Extra bed: Khách yêu cầu
   - Pet: Khách có thú cưng

2. Lấy thông tin dịch vụ phụ thu:
   SELECT MaDV, TenDV, DonGia FROM DICHVU
   WHERE MaDV = 'DV_PT001' AND NhomDichVu = 'PHUTHU'
   (Hoặc tính động: DonGia = GiaPhong × 50%)

3. Post vào Folio:
   INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Debit, MoTa)
   VALUES (@MaFolio, 'Surcharge', 1000000, 'Phụ thu Early Check-in')

4. Alert lễ tân:
   - Hiển thị popup: "Phát hiện early check-in, phụ thu 1,000,000đ. Xác nhận?"
   - Cho phép miễn phụ thu cho VIP (waive with reason)

5. Cập nhật Folio.ConLai:
   Folio.ConLai += 1,000,000 (khách nợ thêm)
```

**Đặc biệt - Phụ thu Extra Person:**

- Post **MỖI ĐÊM** (giống Room Charge)
- Job auto chạy 00:00: Kiểm tra SoNguoiO > SoNguoiChuan → Post phụ thu
- Công thức: `(SoNguoiO - SoNguoiChuan) × GiaPhuThuPerNguoi`

---

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 5_

**Business Rule:**

```
Tính giá phòng 1 đêm:
GiaCuoi = GiaGoc
         × (isWeekend ? HeSoCuoiTuan : 1.0)
         × (isHoliday ? HeSoNgayLe : 1.0)
         × (isSeason ? HeSoMua : 1.0)
         × (1 - TyLeGiamGiaTheoLoaiKhach)

Auto Post Room Charge (Job 00:00):
FOR EACH CT_PHIEUTHUEPHONG WHERE TrangThaiThue = 'OCCUPIED'
  IF NOT EXISTS (SELECT 1 FROM FOLIOTRANSACTION
                 WHERE MaFolio = @MaFolio
                 AND NgayPost = CURDATE()
                 AND LoaiGiaoDich = 'RoomCharge')
  THEN
    INSERT FOLIOTRANSACTION (LoaiGiaoDich='RoomCharge', Debit=GiaPhong)
  END IF
END FOR

Auto Post Extra Person Charge (Job 00:00):
FOR EACH CT_PHIEUTHUEPHONG WHERE SoNguoiO > SoNguoiChuan
  PhiPhuThu = (SoNguoiO - SoNguoiChuan) × 400000
  INSERT FOLIOTRANSACTION (LoaiGiaoDich='Surcharge', Debit=PhiPhuThu, MoTa='Phụ thu người thêm')
END FOR
```

**📋 Setup Master Data - PHỤ THU:**

```sql
-- 1. Early Check-in
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT001', 'Phụ thu Early Check-in', 0, '%', 'PHUTHU',
        'Tính 50% giá phòng nếu check-in trước 10:00');

-- 2. Late Checkout
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT002', 'Phụ thu Late Checkout', 0, '%', 'PHUTHU',
        '50% giá phòng (14:00-18:00) hoặc 100% (sau 18:00)');

-- 3-7: Extra Person, Extra Bed, Pet, View Upgrade, Airport Transfer...
```

**✅ Acceptance Criteria:**

- ✅ Phụ thu được tính tự động dựa trên giờ/số người
- ✅ Alert rõ ràng cho lễ tân xác nhận trước khi áp dụng
- ✅ Cho phép miễn phụ thu (waive) cho VIP với lý do
- ✅ UI hiển thị màu xanh để phân biệt với Phạt
- ✅ Khách có quyền lựa chọn (accept/cancel) trước khi tính

---

### ✅ 6. Phạt (Penalty)

**📌 Khái niệm:**  
Phạt là **tiền phạt do khách VI PHẠM nội quy hoặc làm hư hỏng tài sản**.  
Đặc điểm: **KHÔNG MONG MUỐN, phát sinh ngoài dự kiến**, khách không thể tránh sau khi đã vi phạm.

**💡 Tại sao cần tách riêng Phạt?**

- ⚠️ Tính chất nghiêm trọng hơn Phụ thu
- ⚠️ Cần chứng cứ (hình ảnh, báo cáo kiểm tra phòng)
- ⚠️ Bắt buộc phải trả (trừ khi có lý do chính đáng để miễn)
- ⚠️ Ảnh hưởng đến uy tín khách hàng

**Lưu vào:** Bảng **DICHVU** với `NhomDichVu = 'PHAT'`

| Loại phạt | Mức phạt | Lý do | MaDV (ví dụ) |
| **Hư hỏng tài sản** | Tính thực tế | TV, điều hòa, nội thất hư hỏng | DV_PH001 |
| **Mất chìa khóa/thẻ từ** | 300,000đ | Phải đổi khóa toàn bộ vì lý do an ninh | DV_PH002 |
| **Mất khăn tắm/gối/chăn** | 200,000đ | Theo giá thành thực tế | DV_PH003 |
| **Hút thuốc trong phòng** | 500,000đ | Phải vệ sinh đặc biệt để khử mùi | DV_PH004 |
| **Gây ồn làm phiền** | 500,000đ | Tùy mức độ nghiêm trọng | DV_PH005 |
| **Vi phạm giờ giấc** | 300,000đ | Làm ồn sau 22:00 hoặc trước 7:00 | DV_PH006 |
| **Đưa người lạ vào phòng** | 1,000,000đ | Vi phạm an ninh nghiêm trọng | DV_PH007 |

**🔄 Workflow xử lý phạt (khi checkout):**

```
Bước 1: Form kiểm tra phòng
┌────────────────────────────────────────────────────┐
│ Kiểm tra phòng trước khi khách rời đi:             │
│                                                    │
│ □ Phòng nguyên vẹn ✅                             │
│ □ Hư hỏng tài sản                                  │
│   → Mô tả: _______________                        │
│   → Chi phí sửa chữa: _______________             │
│ □ Mất đồ (chìa khóa, điều khiển, khăn tắm...)     │
│   → Danh sách: _______________                    │
│   → Tổng tiền: _______________                    │
│ □ Vi phạm nội quy                                  │
│   → Loại vi phạm: _______________                 │
│   → Mức phạt: _______________                     │
└────────────────────────────────────────────────────┘

Bước 2: Nếu có vi phạm → Chọn loại phạt từ DICHVU
SELECT MaDV, TenDV, DonGia FROM DICHVU
WHERE NhomDichVu = 'PHAT'
-- Ví dụ:
-- DV_PH001: 'Hư hỏng tài sản' (DonGia = Tính thực tế)
-- DV_PH002: 'Mất chìa khóa/thẻ từ' (DonGia = 300000)
-- DV_PH003: 'Hút thuốc trong phòng' (DonGia = 500000)
-- DV_PH004: 'Gây ồn' (DonGia = 300000)

Bước 3: Post tiền phạt vào Folio
INSERT INTO FOLIOTRANSACTION (
  MaFolio,
  LoaiGiaoDich = 'Penalty',
  Debit = @SoTienPhat,
  MoTa = 'Phạt: ' + @MoTaViPham
)

Bước 4: Cập nhật Folio.ConLai
Folio.ConLai += @SoTienPhat (khách nợ thêm)

Bước 5: Alert lễ tân
"Phát hiện vi phạm. Tiền phạt: XXX đ. Đã cộng vào bill."
```

**Bảng mức phạt tham khảo (trong DICHVU):**

| MaDV | TenDV | DonGia | NhomDichVu | Ghi chú |
| DV_PH001 | Hư hỏng tài sản | 0 (tính thực tế) | PHAT | TV, điều hòa, nội thất... |
| DV_PH002 | Mất chìa khóa/thẻ từ | 300,000 | PHAT | Phải đổi khóa toàn bộ |
| DV_PH003 | Mất khăn tắm/gối/chăn | 200,000 | PHAT | Theo giá thành |
| DV_PH004 | Hút thuốc trong phòng | 500,000 | PHAT | Phải vệ sinh đặc biệt |
| DV_PH005 | Gây ồn làm phiền khách khác | 500,000 | PHAT | Tùy mức độ nghiêm trọng |
| DV_PH006 | Vi phạm giờ giấc | 300,000 | PHAT | Tùy quy định khách sạn |
| DV_PH007 | Đưa người lạ vào phòng | 1,000,000 | PHAT | Vi phạm an ninh |

**📋 Setup Master Data - PHẠT:**

```sql
-- 1. Hư hỏng tài sản
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH001', 'Phạt Hư hỏng tài sản', 0, 'đồng', 'PHAT',
        'Tính theo chi phí sửa chữa thực tế');

-- 2. Mất chìa khóa/thẻ từ
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH002', 'Phạt Mất chìa khóa/thẻ từ', 300000, 'chiếc', 'PHAT',
        'Phải đổi khóa toàn bộ vì lý do an ninh');

-- 3-7: Các loại phạt khác...
```

**⚠️ Waive Penalty (Miễn phạt):**

- Chỉ Manager/Supervisor có quyền miễn
- Bắt buộc nhập lý do: "Khách VIP", "Lỗi nhỏ lần đầu", "Đền bù bằng cách khác"
- Có thể adjust DonGia xuống 0 hoặc giảm %
- Lưu log waive vào GhiChu của FolioTransaction

**✅ Acceptance Criteria:**

- ✅ Form kiểm tra phòng rõ ràng, dễ sử dụng
- ✅ Mức phạt chính xác theo bảng quy định
- ✅ Cần chứng cứ (hình ảnh) khi có hư hỏng nghiêm trọng
- ✅ UI hiển thị màu đỏ để phân biệt với Phụ thu
- ✅ Chỉ Manager mới có quyền waive

---

## 📊 SO SÁNH: PHỤ THU vs PHẠT

| Tiêu chí       | 💰 PHỤ THU (SURCHARGE)                      | ⚠️ PHẠT (PENALTY)                |
| -------------- | ------------------------------------------- | -------------------------------- |
| **Khái niệm**  | Phí do khách **YÊU CẦU** dịch vụ thêm       | Tiền phạt do **VI PHẠM** nội quy |
| **Tính chất**  | CÓ THỂ BIẾT TRƯỚC, tránh được               | KHÔNG MONG MUỐN, ngoài dự kiến   |
| **Ví dụ**      | Early check-in, Late checkout, Extra person | Hư hỏng, Mất đồ, Hút thuốc       |
| **Thời điểm**  | Check-in/Mỗi đêm/Checkout                   | Khi checkout (kiểm tra phòng)    |
| **Lưu vào**    | DICHVU (NhomDichVu='PHUTHU')                | DICHVU (NhomDichVu='PHAT')       |
| **Post Folio** | LoaiGiaoDich='Surcharge'                    | LoaiGiaoDich='Penalty'           |
| **Miễn phí**   | ✅ Dễ miễn cho VIP                          | ⚠️ Khó miễn, cần lý do           |
| **Attitude**   | Tích cực (khách muốn tốt hơn)               | Tiêu cực (khách làm sai)         |
| **UI Color**   | 🟢 Xanh                                     | 🔴 Đỏ                            |

---

### ✅ 7. Check-out & Billing

**📌 Tổng quan:**  
Module này tổng hợp **TOÀN BỘ QUY TRÌNH** từ khi khách muốn checkout cho đến khi hoàn tất thanh toán và xuất hóa đơn.  
**Luồng chính:** Tính tiền phòng (đã auto) → Tính dịch vụ (đã post) → Áp dụng phụ thu (nếu có) → Áp dụng phạt (nếu có) → Hiển thị bill tổng hợp → Thu tiền → Đóng folio → Xuất hóa đơn.

**💡 Tại sao gộp Billing và Checkout?**

- Checkout là thời điểm **tổng kết toàn bộ chi phí**
- Tất cả charges (room, service, surcharge, penalty) được tính vào **1 bill duy nhất**
- Workflow liền mạch, không tách rời → Dễ hiểu, dễ code

---

#### **7.1. 💵 TÍNH TIỀN PHÒNG (Room Charge) - Background Process**

**Chạy tự động mỗi đêm 00:00:**

- [ ] **Job auto post room charge**
  - Quét tất cả phòng đang có khách (`TrangThaiThue = 'OCCUPIED'`)
  - Tính giá phòng theo công thức: `GiaGoc × HeSoCuoiTuan × HeSoNgayLe × HeSoMua × (1 - GiamGia)`
  - Check đã post hôm nay chưa (tránh trùng)
  - Post: `FOLIOTRANSACTION (LoaiGiaoDich='RoomCharge', Debit=GiaPhong)`
  - Update `Folio.TongTien` và `Folio.ConLai`
  - **Đồng thời** check Extra Person → Post Surcharge nếu có

**Ví dụ tính giá:**

- Phòng Deluxe: 2,000,000đ
- Chủ nhật: ×1.3 = 2,600,000đ
- Tết: ×1.5 = 3,900,000đ
- VIP giảm 10%: ×0.9 = 3,510,000đ

💻 _Code SQL mẫu: Xem file CODE_SAMPLES_PMS.md - Section 7.1_

---

#### **7.2. 🍹 TÍNH TIỀN DỊCH VỤ (Service Charge) - Manual Post**

**Post thủ công khi khách sử dụng:**

- [ ] **Khách dùng dịch vụ → Lễ tân post charge**
  - Chọn dịch vụ từ DICHVU (Minibar, Spa, Laundry, F&B...)
  - Nhập số lượng
  - Tính: `ThanhTien = DonGia × SoLuong`
  - Post: `FOLIOTRANSACTION (MaDV, LoaiGiaoDich='ServiceCharge', Debit=ThanhTien)`
  - Update `Folio.TongTien` và `Folio.ConLai` realtime

**Ví dụ:**

- Spa massage: 500,000đ × 1 = 500,000đ
- Minibar Coca: 25,000đ × 4 = 100,000đ
- Giặt ủi: 30,000đ/kg × 3kg = 90,000đ

💻 _Code SQL mẫu: Xem file CODE_SAMPLES_PMS.md - Section 7.2_

````

**Note:** Tất cả dịch vụ (Minibar, Laundry, F&B, Spa...) đã được post từ trước khi checkout.

---

#### **7.3. 📋 HIỂN THỊ BILL TỔNG HỢP (Folio Summary)**

**Khi khách yêu cầu checkout:**

- [ ] **Tìm phiếu thuê đang ở**
```sql
SELECT * FROM PHIEUTHUEPHONG
WHERE TrangThaiPhieu = 'CHECKED_IN'
AND MaKhachHang = @MaKhachHang
````

- [ ] **Lấy FOLIO tương ứng**

  ```sql
  SELECT * FROM FOLIO
  WHERE MaPhieuThue = @MaPhieuThue
  ```

- [ ] **Hiển thị bill chi tiết theo nhóm:**

```
┌─────────────────────────────────────────────────────────────┐
│                    HÓA ĐƠN CHECKOUT                        │
│         Khách sạn ABC - Phòng 101 - 10-15/12/2024         │
└─────────────────────────────────────────────────────────────┘

🛏️  TIỀN PHÒNG (Room Charges):
   Ngày 10/12: Deluxe, Thứ 7              2,600,000đ
   Ngày 11/12: Deluxe, Chủ nhật            2,600,000đ
   Ngày 12/12: Deluxe, Thứ 2               2,000,000đ
   Ngày 13/12: Deluxe, Thứ 3               2,000,000đ
   Ngày 14/12: Deluxe, Thứ 4               2,000,000đ
   ──────────────────────────────────────────────────
   Tổng tiền phòng:                       11,200,000đ

🍹 DỊCH VỤ (Service Charges):
   Minibar - Coca Cola (×4)                  100,000đ
   Spa massage 90 phút                       500,000đ
   Giặt ủi (3kg)                              90,000đ
   ──────────────────────────────────────────────────
   Tổng dịch vụ:                             690,000đ

💰 PHỤ THU (Surcharges):
   Early Check-in (09:30)                  1,000,000đ
   Người thêm (×5 đêm)                     2,000,000đ
   ──────────────────────────────────────────────────
   Tổng phụ thu:                           3,000,000đ

⚠️  PHẠT (Penalties):
   Mất chìa khóa/thẻ từ                      300,000đ
   ──────────────────────────────────────────────────
   Tổng phạt:                                300,000đ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 TỔNG CHI PHÍ:                          15,190,000đ

💵 ĐÃ THANH TOÁN:
   Tiền cọc (09/12) - Chuyển khoản        -3,000,000đ
   ──────────────────────────────────────────────────
   Tổng đã trả:                           -3,000,000đ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CÒN PHẢI TRẢ:                         12,190,000đ
```

💡 **Giải thích Deposit (Tiền cọc đã trả):**

- Deposit được thu **KHI ĐẶT PHÒNG** (xem Module 2)
- Được post vào FOLIOTRANSACTION với `LoaiGiaoDich='Deposit'`, `Credit=TienCoc`
- Folio.ConLai = Âm (khách đã trả trước)
- Khi checkout: Deposit được **trừ vào tổng bill**
- Nếu Deposit > TotalCharge → Hoàn lại tiền thừa

📋 _Query SQL để lấy bill: Xem file CODE_SAMPLES_PMS.md_

---

#### **7.4. 🔍 KIỂM TRA PHÒNG & ÁP DỤNG PHẠT (Room Inspection)**

**Trước khi cho checkout, phải kiểm tra phòng:**

- [ ] **Form kiểm tra phòng**

  ```
  ┌──────────────────────────────────────────────────┐
  │  KIỂM TRA PHÒNG 101 - Trước khi checkout       │
  ├──────────────────────────────────────────────────┤
  │  ☐ Phòng nguyên vẹn ✅                         │
  │  ☐ Hư hỏng tài sản                          │
  │      → Mô tả: _________________             │
  │      → Chi phí: _________________           │
  │  ☐ Mất đồ                                    │
  │      → Loại: ☐ Chìa khóa  ☐ Khăn tắm       │
  │      → Số lượng: _________________          │
  │  ☐ Vi phạm nội quy                          │
  │      → Loại: ☐ Hút thuốc  ☐ Gây ồn         │
  │                                              │
  │  [Xác nhận]  [Hủy]                          │
  └──────────────────────────────────────────────┘
  ```

- [ ] **Nếu có vi phạm → Post Penalty**

  ```sql
  -- Ví dụ: Mất chìa khóa
  SELECT MaDV, TenDV, DonGia FROM DICHVU
  WHERE MaDV = 'DV_PH002' AND NhomDichVu = 'PHAT'
  -- Result: 'Phạt Mất chìa khóa/thẻ từ', 300,000đ

  INSERT FOLIOTRANSACTION (
    MaFolio, MaDV, LoaiGiaoDich, Debit, MoTa
  ) VALUES (
    @MaFolio, 'DV_PH002', 'Penalty', 300000,
    'Phạt mất chìa khóa phòng 101'
  )

  UPDATE FOLIO
  SET TongTien = TongTien + 300000,
      ConLai = ConLai + 300000

  -- Alert
  SHOW_ALERT('Phạt 300,000đ đã được cộng vào bill')
  ```

---

#### **7.5. ⏰ KIỂM TRA LATE CHECKOUT & ÁP DỤNG PHỤ THU**

**Tự động phát hiện khi checkout:**

- [ ] **Check giờ checkout**

  ```sql
  GioCheckout = NOW()
  GioChuan = '14:00:00'

  IF GioCheckout <= GioChuan THEN
    PhiPhuThu = 0 -- Miễn phí ✅
  ELSE IF TIME(GioCheckout) <= '18:00:00' THEN
    PhiPhuThu = GiaPhong × 0.5 -- 50%
  ELSE
    PhiPhuThu = GiaPhong × 1.0 -- 100%
  END IF
  ```

- [ ] **Nếu có phụ thu → Alert & Post**

  ```sql
  -- Alert lễ tân
  SHOW_CONFIRM(
    'Late checkout phát hiện: 16:30
     Phụ thu: 1,000,000đ (50% giá phòng)

     [Đồng ý]  [Miễn phí (VIP)]  [Hủy checkout]'
  )

  -- Nếu đồng ý → Post
  INSERT FOLIOTRANSACTION (
    MaFolio, MaDV, LoaiGiaoDich, Debit, MoTa
  ) VALUES (
    @MaFolio, 'DV_PT002', 'Surcharge', 1000000,
    'Phụ thu Late Checkout (16:30)'
  )
  ```

---

#### **7.6. 💳 THU TIỀN & ĐÓNG FOLIO**

**Tính tổng & validation:**

- [ ] **Tính số tiền còn lại**

  ```sql
  TotalCharge = SUM(Debit)
  TotalPayment = SUM(Credit)
  ConLai = TotalCharge - TotalPayment

  -- Ví dụ:
  -- TotalCharge = 15,190,000đ (Room + Service + Surcharge + Penalty)
  -- TotalPayment = 3,000,000đ (Deposit đã trả trước)
  -- ConLai = 12,190,000đ 🔴
  ```

- [ ] **Validation & Thu tiền**
  ```sql
  IF ConLai > 0 THEN
    -- Khách còn nợ → Phải thu
    SHOW_PAYMENT_FORM(
      'Khách còn phải trả: 12,190,000đ

       Phương thức:
       ☐ Tiền mặt
       ☐ Thẻ tín dụng
       ☐ Chuyển khoản
       ☐ E-wallet (Momo/ZaloPay)

       [Thanh toán]  [Hủy]'
    )

    -- Sau khi thu → Post Payment
    INSERT FOLIOTRANSACTION (
      MaFolio, LoaiGiaoDich, Credit, MoTa
    ) VALUES (
      @MaFolio, 'Payment', 12190000,
      'Thanh toán khi checkout - Tiền mặt'
    )

    UPDATE FOLIO
    SET ConLai = 0

  ELSE IF ConLai < 0 THEN
    -- Khách thừa tiền cọc → Hoàn lại
    SoTienHoan = ABS(ConLai)
    SHOW_ALERT('Hoàn lại tiền cọc thừa: ' + SoTienHoan)

    INSERT FOLIOTRANSACTION (
      MaFolio, LoaiGiaoDich, Debit, MoTa
    ) VALUES (
      @MaFolio, 'Refund', @SoTienHoan,
      'Hoàn tiền cọc thừa'
    )

  ELSE
    -- ConLai = 0 → Perfect ✅
    SHOW_ALERT('Thanh toán đầy đủ. Cho phép checkout.')
  END IF
  ```

---

#### **7.7. 🔄 CẬP NHẬT TRẠNG THÁI (6 Entities)**

**Sau khi thu tiền đủ → Update tất cả:**

```sql
-- 1. Phiếu thuê (header)
UPDATE PHIEUTHUEPHONG
SET TrangThaiPhieu = 'CHECKED_OUT',
    NgayTraThucTe = NOW()
WHERE MaPhieuThue = @MaPhieuThue

-- 2. Chi tiết phiếu thuê (từng phòng)
UPDATE CT_PHIEUTHUEPHONG
SET TrangThaiThue = 'CHECKED_OUT',
    NgayTraThucTe = NOW()
WHERE MaPhieuThue = @MaPhieuThue

-- 3. Phiếu đặt (nếu có booking)
UPDATE PHIEUDAT
SET TrangThaiPhieu = 'CHECKED_OUT'
WHERE MaPhieuDat = @MaPhieuDat

-- 4. Chi tiết phiếu đặt
UPDATE CT_DATPHONG
SET TinhTrangDatPhong = 'CHECKED_OUT'
WHERE MaPhieuDat = @MaPhieuDat

-- 5. Phòng → Chuyển sang DIRTY (chờ dọn)
UPDATE PHONG
SET TrangThai = 'DIRTY'
WHERE MaPhong IN (
  SELECT MaPhong FROM CT_PHIEUTHUEPHONG
  WHERE MaPhieuThue = @MaPhieuThue
)

-- 6. Đóng FOLIO
UPDATE FOLIO
SET TrangThai = 'Closed',
    NgayDong = NOW()
WHERE MaFolio = @MaFolio AND ConLai = 0
```

---

#### **7.8. 👤 CẬP NHẬT THÔNG TIN KHÁCH HÀNG**

```sql
-- Cộng dồn chi tiêu và số đêm
UPDATE KHACHHANG
SET TongChiTieu = TongChiTieu + @TotalCharge,
    TongSoDem = TongSoDem + @SoNgayO,
    LanCuoiO = NOW()
WHERE MaKhachHang = @MaKhachHang

-- Kiểm tra nâng cấp VIP
IF (SELECT TongChiTieu FROM KHACHHANG WHERE MaKhachHang = @MaKhachHang) >= 50000000
AND (SELECT MaLoaiKhach FROM KHACHHANG WHERE MaKhachHang = @MaKhachHang) != 'VIP'
THEN
  UPDATE KHACHHANG
  SET MaLoaiKhach = 'VIP'
  WHERE MaKhachHang = @MaKhachHang

  -- Gửi email chúc mừng
  SEND_EMAIL(@Email, 'Chúc mừng bạn đã trở thành khách VIP!')
END IF
```

---

#### **7.9. 🧾 XUẤT HÓA ĐƠN (Invoice)**

```sql
-- Tạo hóa đơn
INSERT INTO HOADON (
  MaFolio, NgayXuat, TongTien, ThueVAT, ThanhToan
) VALUES (
  @MaFolio, NOW(), @TotalCharge, @TotalCharge * 0.1, @TotalCharge * 1.1
)

-- Lấy MaHoaDon vừa tạo
SET @MaHoaDon = LAST_INSERT_ID()

-- Tạo chi tiết hóa đơn (từ FolioTransaction)
INSERT INTO CT_HOADON (MaHoaDon, MaDichVu, SoLuong, DonGia, ThanhTien)
SELECT
  @MaHoaDon,
  MaDV,
  SoLuong,
  Debit / SoLuong AS DonGia,
  Debit AS ThanhTien
FROM FOLIOTRANSACTION
WHERE MaFolio = @MaFolio
AND LoaiGiaoDich IN ('RoomCharge', 'ServiceCharge', 'Surcharge', 'Penalty')

-- In PDF hoặc gửi email
GENERATE_INVOICE_PDF(@MaHoaDon)
SEND_EMAIL(@Email, 'Hóa đơn checkout', @PDFPath)
```

---

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 7_

**🔄 WORKFLOW TỔNG HỢP (Checkout & Billing):**

```
┌──────────────────────────────────────────────────────────┐
│  1. Khách yêu cầu checkout                              │
│  2. Hiển thị bill tổng hợp (Room + Service đã có sẵn) │
│  3. Form kiểm tra phòng → Phát hiện vi phạm?           │
│     ├─ Có → Post Penalty → Cộng vào bill              │
│     └─ Không → Next                                     │
│  4. Check giờ checkout → Late checkout?                │
│     ├─ Có → Post Surcharge → Cộng vào bill            │
│     └─ Không → Next                                     │
│  5. Tính tổng: ConLai = TotalCharge - TotalPayment    │
│  6. Validation & Thu tiền                              │
│  7. Cập nhật 6 entities (Phiếu thuê, Phòng, Folio...) │
│  8. Cập nhật KHACHHANG (TongChiTieu, TongSoDem)       │
│  9. Check nâng cấp VIP (nếu đủ điều kiện)             │
│  10. Đóng FOLIO (TrangThai = 'Closed')                 │
│  11. Tạo HOADON                                        │
│  12. In PDF / Gửi email                                │
│  13. PHONG.TrangThai = 'DIRTY' (chờ housekeeping)     │
└──────────────────────────────────────────────────────────┘
```

**✅ Acceptance Criteria:**

- ✅ Bill hiển thị đầy đủ 4 nhóm: Room, Service, Surcharge, Penalty
- ✅ Breakdown rõ ràng từng khoản phí (ngày, dịch vụ, lý do)
- ✅ Form kiểm tra phòng trực quan, dễ sử dụng
- ✅ Tự động phát hiện Late Checkout → Alert lễ tân
- ✅ Validation: Không cho checkout nếu ConLai > 0 (còn nợ)
- ✅ Hỗ trợ nhiều phương thức thanh toán
- ✅ Cho phép miễn phạt/phụ thu (chỉ Manager) với lý do
- ✅ Workflow đồng bộ tất cả 6 entities (không thiếu bước nào)
- ✅ Cập nhật TongChiTieu, TongSoDem cho KHACHHANG
- ✅ Tự động kiểm tra nâng cấp VIP
- ✅ Folio.TrangThai = 'Closed' khi ConLai = 0
- ✅ Hóa đơn PDF chuyên nghiệp, có logo khách sạn
- ✅ PHONG chuyển sang DIRTY để housekeeping dọn
- ✅ UI phân biệt màu: Room (xám), Service (xanh dương), Surcharge (xanh lá), Penalty (đỏ)

---

## 💡 CHECKLIST KIỂM TRA MODULE 7

**Khi code Checkout & Billing:**

- [ ] Room Charge đã được post tự động mỗi đêm (job 00:00)
- [ ] Service Charge đã được post khi khách dùng dịch vụ
- [ ] Form kiểm tra phòng đầy đủ checkbox
- [ ] Penalty post chính xác khi có vi phạm
- [ ] Late Checkout được phát hiện tự động
- [ ] Surcharge post chính xác (50% hoặc 100% giá phòng)
- [ ] Bill hiển thị breakdown rõ ràng
- [ ] Tính ConLai chính xác: TotalCharge - TotalPayment
- [ ] Validation: Không cho checkout nếu còn nợ
- [ ] Hỗ trợ đủ phương thức thanh toán
- [ ] Cập nhật đồng bộ 6 entities
- [ ] Cập nhật KHACHHANG.TongChiTieu, TongSoDem
- [ ] Check nâng cấp VIP (TongChiTieu >= 50M)
- [ ] Đóng FOLIO (TrangThai = 'Closed', ConLai = 0)
- [ ] Tạo HOADON đầy đủ
- [ ] In PDF đẹp, có logo
- [ ] PHONG chuyển DIRTY
- [ ] UI màu sắc phân biệt rõ ràng

---

### 💡 QUY TẮC VÀNG

**PHỤ THU (SURCHARGE):**

- ✅ Alert trước khi tính
- ✅ Cho khách lựa chọn (accept/cancel)
- ✅ Có thể miễn cho VIP
- ✅ Tính sẵn vào estimate bill

**PHẠT (PENALTY):**

- ⚠️ Phát hiện khi kiểm tra phòng
- ⚠️ Bắt buộc phải trả (trừ khi miễn có lý do)
- ⚠️ Cần chứng cứ (hình ảnh, báo cáo)
- ⚠️ Không tính trước được

---

### 🔄 WORKFLOW TỔNG HỢP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CHECK-IN PHASE                                  │
└─────────────────────────────────────────────────────────────────────────┘

Kiểm tra PHỤ THU:
  • Early check-in? → Alert → Tạo PHUTHU → Post Surcharge
  • Extra person? → Alert → Tạo PHUTHU → Post Surcharge (mỗi đêm)
  • Extra bed? → Alert → Tạo PHUTHU → Post Surcharge (1 lần)
  • Pet? → Alert → Tạo PHUTHU + Deposit → Post Surcharge

┌─────────────────────────────────────────────────────────────────────────┐
│                         STAY PHASE (Mỗi đêm 00:00)                      │
└─────────────────────────────────────────────────────────────────────────┘

Auto Post Charges:
  • Room Charge (Job auto)
  • Extra Person Charge (Job auto - nếu có)

┌─────────────────────────────────────────────────────────────────────────┐
│                         CHECK-OUT PHASE                                 │
└─────────────────────────────────────────────────────────────────────────┘

Bước 1: Kiểm tra PHỤ THU Late Checkout
  IF GioCheckout > 14:00 → Tính phụ thu → Alert → Tạo PHUTHU → Post Surcharge

Bước 2: Kiểm tra PHẠT (Form inspection)
  • Phòng có hư hỏng? → Tạo PHIEUPHAT → Post Penalty
  • Mất đồ? → Tạo PHIEUPHAT → Post Penalty
  • Vi phạm nội quy? → Tạo PHIEUPHAT → Post Penalty

Bước 3: Tính tổng bill
  Total = RoomCharge + ServiceCharge + Surcharge + Penalty - Deposit - Payment

Bước 4: Thu tiền & Đóng folio
  ConLai = 0 → Checkout success
```

---

### ✅ CHECKLIST KIỂM TRA

**Khi code nghiệp vụ Phụ Thu & Phạt:**

- [ ] Dùng bảng DICHVU với NhomDichVu phân biệt ('PHUTHU' vs 'PHAT')
- [ ] Setup master data:
  - [ ] INSERT DICHVU cho các loại phụ thu (DV_PT001 - DV_PT007)
  - [ ] INSERT DICHVU cho các loại phạt (DV_PH001 - DV_PH007)
- [ ] PHUTHU: Alert trước, cho khách lựa chọn
- [ ] PHAT: Kiểm tra phòng, bắt buộc phải trả
- [ ] Post đúng LoaiGiaoDich ('Surcharge' vs 'Penalty')
- [ ] Extra person charge: Post mỗi đêm (job auto)
- [ ] Late checkout: Tính theo giờ thực tế
- [ ] Form inspection phòng đầy đủ (checkbox + mô tả + số tiền)
- [ ] Cho phép waive với lý do (chỉ Manager/Supervisor)
- [ ] UI hiển thị rõ: Surcharge màu xanh, Penalty màu đỏ
- [ ] Bill breakdown: Room | Service | Surcharge | Penalty | Deposit | Payment | **Total**

---

### 📋 SETUP MASTER DATA - DICHVU

#### **Phụ Thu (PHUTHU):**

```sql
-- 1. Early Check-in
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT001', 'Phụ thu Early Check-in', 0, '%', 'PHUTHU',
        'Tính 50% giá phòng nếu check-in trước 10:00');

-- 2. Late Checkout
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT002', 'Phụ thu Late Checkout', 0, '%', 'PHUTHU',
        '50% giá phòng (14:00-18:00) hoặc 100% (sau 18:00)');

-- 3. Extra Person
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT003', 'Phụ thu Người thêm', 400000, 'người/đêm', 'PHUTHU',
        'Tính khi số người vượt số người chuẩn');

-- 4. Extra Bed
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT004', 'Phụ thu Giường phụ', 300000, 'giường/đêm', 'PHUTHU',
        'Áp dụng khi khách yêu cầu giường thêm');

-- 5. Pet
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT005', 'Phụ thu Thú cưng', 300000, 'đêm', 'PHUTHU',
        'Cộng thêm deposit 1-2 triệu');

-- 6. View Upgrade
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT006', 'Phụ thu Upgrade View', 0, '%', 'PHUTHU',
        'Tính 15% giá phòng khi upgrade view');

-- 7. Airport Transfer
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PT007', 'Phụ thu Đưa đón sân bay', 400000, 'chuyến', 'PHUTHU',
        'One way từ khách sạn đến sân bay');
```

#### **Phạt (PHAT):**

```sql
-- 1. Hư hỏng tài sản
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH001', 'Phạt Hư hỏng tài sản', 0, 'đồng', 'PHAT',
        'Tính theo chi phí sửa chữa thực tế');

-- 2. Mất chìa khóa/thẻ từ
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH002', 'Phạt Mất chìa khóa/thẻ từ', 300000, 'chiếc', 'PHAT',
        'Phải đổi khóa toàn bộ vì lý do an ninh');

-- 3. Mất khăn tắm/gối/chăn
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH003', 'Phạt Mất đồ dùng phòng', 200000, 'món', 'PHAT',
        'Khăn tắm, gối, chăn, ga trải giường...');

-- 4. Hút thuốc trong phòng
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH004', 'Phạt Hút thuốc trong phòng', 500000, 'lần', 'PHAT',
        'Phải vệ sinh đặc biệt để khử mùi');

-- 5. Gây ồn làm phiền khách khác
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH005', 'Phạt Gây ồn', 500000, 'lần', 'PHAT',
        'Tùy mức độ nghiêm trọng');

-- 6. Vi phạm giờ giấc
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH006', 'Phạt Vi phạm giờ giấc', 300000, 'lần', 'PHAT',
        'Làm ồn sau 22:00 hoặc trước 7:00');

-- 7. Đưa người lạ vào phòng
INSERT INTO DICHVU (MaDV, TenDV, DonGia, DonViTinh, NhomDichVu, GhiChu)
VALUES ('DV_PH007', 'Phạt Vi phạm an ninh', 1000000, 'lần', 'PHAT',
        'Đưa người không đăng ký vào phòng');
```

#### **Dịch vụ thông thường (SERVICE):**

```sql
-- Ví dụ các dịch vụ khác
INSERT INTO DICHVU VALUES ('DV_SV001', 'Minibar - Coca Cola', 25000, 'lon', 'MINIBAR', '');
INSERT INTO DICHVU VALUES ('DV_SV002', 'Spa - Massage', 500000, 'giờ', 'SPA', '');
INSERT INTO DICHVU VALUES ('DV_SV003', 'Giặt ủi', 30000, 'kg', 'LAUNDRY', '');
INSERT INTO DICHVU VALUES ('DV_SV004', 'Ăn sáng buffet', 150000, 'người', 'F&B', '');
```

---

### 📊 ENTITY DIAGRAM - DICHVU

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BẢNG DICHVU                                  │
│  (Master Data cho: Dịch vụ, Phụ thu, Phạt)                         │
└──────────────────────────────────────────────────────────────────────┘

    DICHVU
   ┌─────────────┐
   │ MaDV        │ PK
   │ TenDV       │
   │ DonGia      │ (có thể = 0 nếu tính động)
   │ DonViTinh   │ (%, đồng, người/đêm, giờ...)
   │ NhomDichVu  │ ◄─── PHÂN BIỆT LOẠI
   │ GhiChu      │
   └─────────────┘
         │
         │ NhomDichVu
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
    'PHUTHU'       'PHAT'        'MINIBAR'      'SPA'...
         │              │              │              │
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │DV_PT001│    │DV_PH001│    │DV_SV001│    │DV_SV002│
    │Early CI│    │Hư hỏng │    │Coca    │    │Massage │
    └────────┘    └────────┘    └────────┘    └────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    KHI POST VÀO FOLIO                                │
└──────────────────────────────────────────────────────────────────────┘

    FOLIOTRANSACTION
   ┌──────────────────┐
   │ MaGiaoDich       │ PK
   │ MaFolio          │ FK
   │ MaDV             │ FK → DICHVU ✅
   │ LoaiGiaoDich     │ ('RoomCharge', 'ServiceCharge', 'Surcharge', 'Penalty')
   │ Debit            │ (nợ - khách phải trả)
   │ Credit           │ (có - khách đã trả)
   │ SoLuong          │
   │ MoTa             │
   │ NgayGiaoDich     │
   └──────────────────┘
         │
         │ JOIN
         ▼
    DICHVU (để lấy TenDV, DonGia)

┌──────────────────────────────────────────────────────────────────────┐
│                         VÍ DỤ QUERY                                  │
└──────────────────────────────────────────────────────────────────────┘

-- Lấy tất cả dịch vụ Phụ thu
SELECT * FROM DICHVU WHERE NhomDichVu = 'PHUTHU';

-- Lấy tất cả dịch vụ Phạt
SELECT * FROM DICHVU WHERE NhomDichVu = 'PHAT';

-- Lấy bill chi tiết
SELECT
  ft.NgayGiaoDich,
  dv.TenDV,
  dv.NhomDichVu,
  ft.SoLuong,
  ft.Debit,
  ft.LoaiGiaoDich
FROM FOLIOTRANSACTION ft
JOIN DICHVU dv ON ft.MaDV = dv.MaDV
WHERE ft.MaFolio = 'F001'
ORDER BY ft.NgayGiaoDich;
```

---

### 💡 ƯU ĐIỂM THIẾT KẾ MỚI

**✅ Đơn giản hơn:**

- Chỉ 1 bảng DICHVU thay vì 3 bảng (DICHVU + PHUTHU + PHIEUPHAT)
- Dễ quản lý master data

**✅ Linh hoạt:**

- Thêm loại phụ thu/phạt mới chỉ cần INSERT DICHVU
- Không cần ALTER TABLE

**✅ Thống nhất:**

- Tất cả charges đều có MaDV
- Query bill đơn giản hơn (JOIN 1 lần)

**✅ Mở rộng dễ dàng:**

- Có thể thêm NhomDichVu mới: 'PROMOTION', 'DISCOUNT'...
- Áp dụng được cho nhiều nghiệp vụ khác

**⚠️ Lưu ý:**

- DonGia có thể = 0 nếu tính động (Early check-in, Late checkout)
- DonViTinh giúp hiểu rõ cách tính: '%', 'đồng', 'người/đêm'...
- GhiChu lưu business rule để dev tham khảo

---

### 📊 SO SÁNH THIẾT KẾ CŨ vs MỚI

| Tiêu chí                  | ❌ Thiết kế Cũ                                                            | ✅ Thiết kế Mới (Dùng DICHVU)    |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| **Số bảng**               | 3 bảng:<br>• DICHVU (dịch vụ)<br>• PHUTHU (phụ thu)<br>• PHIEUPHAT (phạt) | 1 bảng:<br>• DICHVU (all-in-one) |
| **Phân biệt loại**        | Theo bảng                                                                 | Theo NhomDichVu                  |
| **Thêm loại mới**         | Phải tạo bảng mới                                                         | Chỉ cần INSERT record            |
| **Query bill**            | JOIN 3 bảng                                                               | JOIN 1 bảng                      |
| **Quản lý master data**   | Phân tán 3 nơi                                                            | Tập trung 1 nơi                  |
| **FOLIOTRANSACTION.MaDV** | NULL (không link được)                                                    | Link trực tiếp → DICHVU          |
| **Lấy tên dịch vụ**       | Phức tạp (check nhiều bảng)                                               | Đơn giản (JOIN DICHVU)           |
| **Mở rộng**               | Khó (thêm bảng = thêm FK)                                                 | Dễ (thêm NhomDichVu)             |

---

### 🔄 WORKFLOW SO SÁNH

**❌ Cũ - Post Phụ Thu:**

```sql
-- Bước 1: Tạo PHUTHU
INSERT INTO PHUTHU (MaPhieuThue, LoaiPhuThu, SoTien)
VALUES ('PT001', 'EarlyCheckIn', 1000000);

-- Bước 2: Post vào Folio (không có MaDV!)
INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Debit)
VALUES ('F001', 'Surcharge', 1000000);

-- Bước 3: Query bill → Phải JOIN PHUTHU để lấy tên
SELECT ft.*, pt.LoaiPhuThu
FROM FOLIOTRANSACTION ft
LEFT JOIN PHUTHU pt ON ... -- Phức tạp!
```

**✅ Mới - Post Phụ Thu:**

```sql
-- Bước 1: Lấy dịch vụ phụ thu từ DICHVU
SELECT MaDV, TenDV, DonGia FROM DICHVU
WHERE MaDV = 'DV_PT001' AND NhomDichVu = 'PHUTHU';

-- Bước 2: Post vào Folio (có MaDV!)
INSERT INTO FOLIOTRANSACTION (MaFolio, MaDV, LoaiGiaoDich, Debit, SoLuong)
VALUES ('F001', 'DV_PT001', 'Surcharge', 1000000, 1);

-- Bước 3: Query bill → JOIN đơn giản
SELECT ft.*, dv.TenDV, dv.NhomDichVu
FROM FOLIOTRANSACTION ft
JOIN DICHVU dv ON ft.MaDV = dv.MaDV
WHERE ft.MaFolio = 'F001';
-- Result: NgayGiaoDich | TenDV | NhomDichVu | Debit
--         10/12        | Phụ thu Early Check-in | PHUTHU | 1,000,000
```

---

### 🎯 KẾT LUẬN

**Dùng bảng DICHVU chung cho Dịch vụ, Phụ thu, Phạt:**

- ✅ Giảm số bảng: 3 → 1
- ✅ Code đơn giản hơn
- ✅ Query nhanh hơn
- ✅ Dễ maintain master data
- ✅ Dễ mở rộng (thêm NhomDichVu mới)

**Cách phân biệt:**

```sql
NhomDichVu = 'PHUTHU'  → Phụ thu (Surcharge)
NhomDichVu = 'PHAT'    → Phạt (Penalty)
NhomDichVu = 'MINIBAR' → Dịch vụ Minibar
NhomDichVu = 'SPA'     → Dịch vụ Spa
NhomDichVu = 'LAUNDRY' → Dịch vụ Giặt ủi
NhomDichVu = 'F&B'     → Ăn uống
...
```

**UI/UX:**

- Màu xanh: NhomDichVu = 'PHUTHU'
- Màu đỏ: NhomDichVu = 'PHAT'
- Màu xám: Các dịch vụ khác

---

### 🔴 MODULE 8: QUẢN LÝ KHÁCH HÀNG

#### Customer Management

<br/>

**Chức năng cốt lõi:**

- [ ] Thêm/Sửa/Xóa khách hàng
- [ ] Lưu thông tin:
  - Họ tên, CCCD/Passport
  - Ngày sinh, giới tính
  - Điện thoại, email
  - Địa chỉ
  - Loại khách (FIT/Corporate/VIP)
- [ ] Tra cứu khách hàng
- [ ] Xem lịch sử đặt phòng của khách
- [ ] Xem lịch sử giao dịch

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 7_

\*\*Acceptance Criteria:

- CRUD đầy đủ
- Validation CCCD unique
- Tìm kiếm nhanh
- Hiển thị history bookings

---

## 📈 TỔNG KẾT HIGH PRIORITY

Nếu làm đủ 8 chức năng trên với chất lượng tốt:

✅ **Điểm đạt được: 7-8/10**

**Checklist tự đánh giá:**

- [ ] Tất cả CRUD hoạt động tốt
- [ ] Workflow từ Booking → Check-in → Service → Check-out hoàn chỉnh
- [ ] Tính tiền chính xác (Room + Service + Surcharge + Penalty)
- [ ] **PHỤ THU & PHẠT rõ ràng:**
  - [ ] DICHVU (NhomDichVu='PHUTHU'): Early check-in, Late checkout, Extra person, Extra bed, Pet
  - [ ] DICHVU (NhomDichVu='PHAT'): Hư hỏng, Mất đồ, Vi phạm nội quy
  - [ ] Dùng chung bảng DICHVU, phân biệt bằng NhomDichVu
  - [ ] Alert rõ ràng cho lễ tân
- [ ] Database design chuẩn (20-25 tables)
- [ ] UI/UX dễ sử dụng
- [ ] Có validation & error handling

**⚠️ Lưu ý**: Đây mới chỉ là nền tảng. Để đạt 9-10 điểm, bạn cần làm thêm MEDIUM & LOW priority.

---

### 🎯 ĐIỂM QUAN TRỌNG - PHỤ THU & PHẠT

**Nếu làm tốt phần này → Cộng 0.5-1 điểm:**

- ✅ Workflow rõ ràng, logic đúng
- ✅ Tách biệt 2 nghiệp vụ (PHUTHU vs PHIEUPHAT)
- ✅ UI/UX trực quan (màu sắc phân biệt)
- ✅ Alert đầy đủ, không bỏ sót
- ✅ Cho phép waive với lý do

**Nếu làm sai/thiếu → Mất điểm nghiêm trọng:**

- ❌ Nhầm lẫn Phụ thu và Phạt
- ❌ Không tính Late checkout
- ❌ Extra person charge post 1 lần thay vì mỗi đêm
- ❌ Không có form kiểm tra phòng khi checkout
- ❌ Bill không hiển thị breakdown rõ ràng

---

## 🟠 CẤP ĐỘ MEDIUM PRIORITY (NÂ

NG CAO)

> **Mục tiêu**: Đạt 8-9/10 điểm  
> **Thời gian**: 20-25% effort  
> **Yêu cầu**: Thể hiện hiểu biết nghiệp vụ sâu

### ✅ 9. Pricing Engine (Giá phòng nâng cao)

**Chức năng nâng cao:**

- [ ] **Bảng giá theo mùa (Seasonal Pricing)**
  - High Season: Tết, Hè, Lễ lớn (+30-50%)
  - Low Season: Tháng ế (-20-30%)
  - Shoulder Season: Bình thường
- [ ] **Bảng giá theo ngày lễ**
  - 30/4-1/5, 2/9, Tết...
  - Hệ số riêng cho từng ngày lễ
- [ ] **Bảng giá theo thứ trong tuần**
  - Thứ 2-4: Giá thấp
  - Thứ 5: Tăng 10%
  - Thứ 6-7, CN: Tăng 20-30%
- [ ] **Dynamic Pricing (Giá động)**
  - Occupancy < 50%: Giảm giá
  - Occupancy > 80%: Tăng giá
  - Cập nhật giá realtime
- [ ] **Giảm giá theo số đêm ở (Length of Stay Discount)** ⭐ NEW
  - 3-4 đêm: Giảm 5%
  - 5-6 đêm: Giảm 10%
  - 7+ đêm: Giảm 15%
  - Áp dụng đồng thời với giảm giá Loại khách (cascade)

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 8_

**Business Rule cho giảm giá theo số đêm:**

```
Công thức áp dụng:
1. Tính giá gốc toàn bộ booking
2. Giảm theo Loại khách (VIP/CORP) trước
3. Giảm theo Số đêm sau (trên giá đã giảm)
4. Kết quả: Discount cascade tạo ưu đãi lớn!

Ví dụ: Khách VIP book 5 đêm
- Giá gốc: 1,000,000đ × 5 = 5,000,000đ
- Giảm VIP 10%: 4,500,000đ
- Giảm 5 đêm 10%: 4,050,000đ
- Tiết kiệm: 950,000đ (19%)
```

**Acceptance Criteria:**

- Tính giá chính xác với đa hệ số
- UI để config các hệ số
- Lịch sử thay đổi giá
- Hiển thị breakdown giảm giá rõ ràng cho khách
- Priority: Loại khách → Số đêm → Mã khuyến mãi

---

### ✅ 10. Room Move (Chuyển phòng)

**Chức năng nâng cao:**

- [ ] Cho phép chuyển khách từ phòng A → phòng B
- [ ] Lý do chuyển:
  - Phòng hỏng đột xuất
  - Khách yêu cầu
  - Upgrade/downgrade
- [ ] **Xử lý tiền phòng:**
  - Tách room charge theo 2 phòng
  - Đêm 1-3: Tính tiền phòng A
  - Đêm 4-5: Tính tiền phòng B
- [ ] Lưu log chuyển phòng
- [ ] Cập nhật trạng thái cả 2 phòng

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 9_

**Business Rule:**

```
Room Move:
1. Phòng mới phải Vacant Clean
2. Stop posting charge vào phòng cũ
3. Start posting charge vào phòng mới từ đêm tiếp theo
4. Update Stay: MaPhong = PhongMoi
```

**Acceptance Criteria:**

- Workflow chuyển phòng mượt mà
- Tiền phòng tính đúng theo từng giai đoạn
- Log đầy đủ

---

### ✅ 11. Folio Transaction (Sổ tính tiền nâng cao)

**Chức năng nâng cao:**

- [ ] **Guest Folio** cho từng phòng
- [ ] **Xem chi tiết giao dịch:**
  - Room Charge từng đêm
  - Service Charge từng món
  - Deposit
  - Payment
  - Adjustment
- [ ] **Post Charge** đầy đủ loại:
  - Room Charge (auto)
  - Service Charge (manual)
  - Extra Charge (phụ thu)
- [ ] **Post Payment:**
  - Cash
  - Credit Card
  - Bank Transfer
- [ ] **Recalculate Balance** realtime
- [ ] **Transfer Charge** giữa các folio
- [ ] **Void Transaction** (hủy giao dịch)

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 10_

\*\*Business Rule:

```
Balance Calculation:
Balance = Sum(Charges) - Sum(Payments)

Void Transaction:
- Không xóa, chỉ đánh dấu IsVoid = 1
- Tạo reverse transaction (số âm)
- Yêu cầu lý do + approval
```

**Acceptance Criteria:**

- Folio hiển thị đúng balance
- Tất cả loại transaction hoạt động
- Audit trail đầy đủ

---

### ✅ 12. Quản lý thông tin khách lưu trú (NGUOIO) ⭐ NEW

**Mục đích:**

- Lưu trữ thông tin chi tiết của từng người lưu trú tại khách sạn
- Phục vụ tra cứu lịch sử, quản lý khách hàng
- Đáp ứng yêu cầu khai báo tạm trú (nếu cần thiết)

**Chức năng cốt lõi:**

- [ ] **Form nhập thông tin NGUOIO khi check-in:**
  - Form đơn giản, dễ sử dụng
  - Các trường thông tin:
    - Họ tên (bắt buộc)
    - Loại giấy tờ: CCCD/CMND/Passport (bắt buộc)
    - Số giấy tờ (bắt buộc)
    - Ngày sinh (tùy chọn)
    - Quốc tịch (mặc định: Việt Nam)
    - Địa chỉ thường trú (tùy chọn)
    - Ngày bắt đầu ở / Ngày kết thúc (auto fill từ booking)
  - Có thể nhập nhiều người cho 1 phòng
  - Link với CT_PHIEUTHUEPHONG
- [ ] **Danh sách khách lưu trú:**
  - Xem tất cả khách đang ở
  - Lọc theo phòng, ngày check-in
  - Tìm kiếm theo tên, số giấy tờ
- [ ] **Lịch sử lưu trú:**
  - Xem lịch sử của khách hàng
  - Số lần đã ở, tổng số đêm
  - Preferences (sở thích phòng, dịch vụ...)

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 11_

**Business Rule:**

```
Quy trình nhập:
1. Check-in → Mở form NGUOIO
2. Nhập thông tin từng người (ít nhất 1 người)
3. Validate: HoTen, LoaiGiayTo, SoGiayTo bắt buộc
4. Save vào database
5. Link với CT_PHIEUTHUEPHONG

Tra cứu:
- Tìm theo SoGiayTo để xem lịch sử
- Hiển thị tất cả lần lưu trú trước đó
- Gợi ý thông tin khi khách quay lại
```

**Acceptance Criteria:**

- ✅ Form nhập NGUOIO đơn giản, dễ dùng
- ✅ Validate đúng các trường bắt buộc
- ✅ Lưu thành công vào database
- ✅ Có thể nhập nhiều người cho 1 phòng
- ✅ Tra cứu lịch sử lưu trú hoạt động
- ✅ Tìm kiếm theo tên/số giấy tờ chính xác

**Lưu ý đồ án:**

- Module này ĐƠN GIẢN nhưng THỰC TẾ
- Thể hiện hiểu biết về quản lý khách hàng
- Không cần phức tạp với API, logic nghiệp vụ rườm rà
- Focus vào UX: Form đẹp, dễ dùng, validate tốt

---

### ✅ 13. Hóa đơn (Invoice)

**Chức năng nâng cao:**

- [ ] Sinh hóa đơn từ Folio
- [ ] **Header hóa đơn:**
  - Số hóa đơn (auto generate)
  - Ngày xuất
  - Thông tin khách hàng
  - Thông tin công ty (nếu B2B)
- [ ] **Chi tiết hóa đơn (CT_HOADON):**
  - Tham chiếu từ FolioTransaction
  - Mỗi dòng: Dịch vụ, số lượng, đơn giá, thành tiền
  - Group by loại (Room / F&B / Other)
- [ ] Tính tổng, thuế VAT (nếu có)
- [ ] **In hóa đơn PDF:**
  - Template chuyên nghiệp
  - Logo khách sạn
  - QR code (tùy chọn)
- [ ] **Reprint invoice** (in lại)
- [ ] Gửi hóa đơn qua email

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 12_

**Acceptance Criteria:**

- Hóa đơn chính xác 100%
- In PDF đẹp
- Reprint giữ nguyên nội dung cũ

---

### ✅ 14. Housekeeping (Dọn phòng)

**Chức năng nâng cao:**

- [ ] **Workflow trạng thái phòng:**
  ```
  Check-out → Dirty → Inspecting → Cleaning → Clean → Ready
  ```
- [ ] **Giao việc cho nhân viên dọn phòng:**
  - Danh sách phòng cần dọn
  - Priority: Check-out rooms > Stayover rooms
  - Gán nhân viên
- [ ] **Cập nhật tiến độ:**
  - Đang dọn
  - Đã dọn xong
  - Chờ inspection
- [ ] **Inspection (Kiểm tra):**
  - Supervisor kiểm tra phòng
  - Pass → Ready
  - Fail → Cleaning lại
- [ ] **Lịch sử dọn phòng:**
  - Ai dọn, lúc nào, mất bao lâu

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 12_

\*\*Acceptance Criteria:

- Workflow hoàn chỉnh
- Realtime update status
- Dashboard cho housekeeping manager

---

### ✅ 15. Quản lý Loại khách hàng (Customer Type Management)

**Chức năng nâng cao:**

- [ ] **Phân loại khách hàng:**
  - 3 loại: FIT (Khách lẻ), VIP, CORP (Công ty)
  - Mỗi loại có ưu đãi riêng
- [ ] **Áp dụng giảm giá theo loại khách:**
  - VIP: 10% tiền phòng
  - CORP: 15% tiền phòng
  - FIT: Không giảm
  - **CHỈ giảm TIỀN PHÒNG, không giảm dịch vụ**
- [ ] **Tự động nâng cấp VIP:**
  - Điều kiện: TongChiTieu ≥ 50,000,000đ
  - Tự động check sau mỗi checkout
  - Gửi email chúc mừng
- [ ] **Lịch sử nâng cấp:**
  - Lưu log khi nâng cấp
  - Ghi rõ lý do, thời gian
- [ ] **Báo cáo khách hàng:**
  - Top khách VIP
  - Danh sách gần đạt VIP
  - Progress bar "Còn X để VIP"

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 13_

\*\*Business Rule:

```
Tính giá có giảm:
- GiaSauGiam = GiaGocPhong × (1 - TyLeGiamGiaPhong)
- Áp dụng cho tất cả booking mới
- Hiển thị rõ trên bill

Nâng cấp VIP:
- Check sau mỗi checkout
- Điều kiện: TongChiTieu ≥ 50,000,000đ
- Tự động nâng cấp khi đủ điều kiện
- Không thể tự hạ cấp
- Gửi email + popup thông báo

Cập nhật chi tiêu:
- Sau mỗi checkout: TongChiTieu += SoTienThanhToan
- TongSoDem += SoNgayO
- Trigger kiểm tra nâng cấp
```

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 13_

**Acceptance Criteria:**

- Giá được giảm đúng % theo loại khách
- Tự động nâng cấp VIP khi đủ điều kiện
- Lịch sử nâng cấp được lưu đầy đủ
- Email/popup thông báo hoạt động
- Progress bar hiển thị chính xác
- Báo cáo "Gần đạt VIP" đúng

---

### ✅ 16. Edge Cases (Trường hợp đặc biệt)

**Chức năng nâng cao:**

#### **16.1. Late Checkout**

- [ ] Khách muốn trả phòng muộn
- [ ] Kiểm tra phòng có booking tiếp không
- [ ] Tính phụ phí theo giờ:
  - Free đến 14:00
  - 50% giá phòng: 14:00-18:00
  - 100% giá phòng: sau 18:00

#### **16.2. Early Checkout**

- [ ] Khách trả phòng sớm hơn dự định
- [ ] Xử lý hoàn tiền theo policy
- [ ] Tính lại bill

#### **16.3. Overstay (Ở quá hạn)**

- [ ] Khách ở quá ngày check-out dự kiến
- [ ] Kiểm tra phòng có booking tiếp không
- [ ] Nếu có: Yêu cầu chuyển phòng
- [ ] Nếu không: Cho ở tiếp + tính thêm tiền
- [ ] Surcharge cho ngày vượt quá

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 14_

\*\*Acceptance Criteria:

- Xử lý đúng từng case
- Tính phí chính xác
- Warning khi có conflict

---

## 📈 TỔNG KẾT MEDIUM PRIORITY

Nếu làm đủ HIGH + MEDIUM với chất lượng tốt:

✅ **Điểm đạt được: 8.5-9/10**

**Checklist tự đánh giá:**

- [ ] Pricing engine hoạt động với đầy đủ hệ số
- [ ] Room move workflow hoàn chỉnh
- [ ] Folio transaction đầy đủ chức năng
- [ ] Invoice sinh chính xác và đẹp
- [ ] Housekeeping workflow chuẩn
- [ ] Xử lý đúng late/early/overstay

<br/>

---

<div align="center">

# 🟢 LOW PRIORITY MODULES

## HOÀN THIỆN & WOW FACTOR

**Target: 9.5-10/10 điểm | Effort: 10-15% | Tạo wow factor, thể hiện độ chín muồi**

</div>

---

### ✅ 17. Master & Guest Folio (Group Booking)

**Chức năng hoàn thiện:**

- [ ] **Group Booking:**
  - Đặt nhiều phòng cùng lúc
  - Contact person chính
  - Special rate cho đoàn
- [ ] **Master Folio:**
  - 1 folio chính cho công ty/đoàn
  - Tập hợp tất cả charges
  - Thanh toán tập trung
- [ ] **Guest Folio:**
  - Mỗi phòng có folio riêng
  - Theo dõi chi tiết từng phòng
- [ ] **Split Billing:**
  - Công ty trả: Room Charge
  - Khách trả: Minibar, Laundry, Personal services
  - Transfer charge giữa Guest ↔ Master Folio

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 16_

\*\*Business Rule:

```
Split Billing với cấu trúc mới:
1. PHIEUTHUEPHONG có nhiều CT_PHIEUTHUEPHONG (nhiều phòng)
2. Tạo 1 Master FOLIO (MaFolio chính, LoaiFolio='Master')
3. Tạo nhiều Guest FOLIO (1 folio/phòng, link MaCTThue)
4. Room Charge → Transfer to Master Folio
5. Personal Services → Stay in Guest Folio
6. Master Folio total = Sum(Room Charges từ tất cả Guest Folio)

Relationships:
- FOLIO.MaPhieuThue → PHIEUTHUEPHONG (header)
- FOLIO.MaCTThue → CT_PHIEUTHUEPHONG (specific room)
- FOLIO.MaFolioChinh → FOLIO (master folio)
```

**Acceptance Criteria:**

- Group booking workflow hoàn chỉnh
- Master/Guest folio rõ ràng
- Split billing chính xác 100%

---

### ✅ 18. Void / Adjust Transaction

**Chức năng hoàn thiện:**

- [ ] **Void Transaction (Hủy giao dịch):**
  - Chỉ đánh dấu IsVoid, không xóa
  - Tạo reverse entry (số âm)
  - Yêu cầu lý do + approval
  - Chỉ Manager mới có quyền void
- [ ] **Adjust Transaction (Điều chỉnh):**
  - Sửa số lượng
  - Sửa giá (discount)
  - Ghi log adjustment
- [ ] **Audit Log đầy đủ:**
  - Who: User nào
  - When: Thời gian
  - What: Thao tác gì
  - Why: Lý do
  - Before/After: Giá trị cũ/mới

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 17_

\*\*Acceptance Criteria:

- Không mất dữ liệu khi void
- Audit trail chi tiết
- Chỉ user có quyền mới thao tác

---

### ✅ 19. Shift Management (Quản lý ca)

**Chức năng hoàn thiện:**

- [ ] **Mở ca (Start Shift):**
  - Nhân viên login
  - Chọn ca làm việc
  - Nhập số tiền đầu ca (Opening Balance)
  - Tạo ShiftSession
- [ ] **Đóng ca (End Shift):**
  - Nhập số tiền cuối ca (Closing Balance)
  - Hệ thống tính:
    - Tổng thu trong ca
    - Tổng chi trong ca
    - Số tiền lý thuyết = Opening + Thu - Chi
  - So sánh vs Closing Balance
  - Chênh lệch (Over/Short)
  - Yêu cầu giải trình nếu chênh > threshold
- [ ] **Báo cáo ca:**
  - Tổng hợp giao dịch
  - Số booking/check-in/check-out trong ca
  - Doanh thu từng loại
  - Vấn đề phát sinh
- [ ] **Audit:**
  - Manager duyệt báo cáo ca
  - Lock ca (không cho sửa transaction cũ)

📋 _Chi tiết database schema: Xem DATABASE_SCHEMA_AND_CODE.md - Section 18_

**Acceptance Criteria:**

- Workflow ca đầy đủ
- Báo cáo chính xác
- Không sửa được transaction của ca đã đóng

---

### ✅ 20. Reporting (Báo cáo đầy đủ)

**Các báo cáo cần có:**

#### **20.1. Báo cáo Doanh thu**

- [ ] Doanh thu theo ngày/tuần/tháng/năm
- [ ] Breakdown theo:
  - Room revenue
  - F&B revenue
  - Other services
- [ ] Biểu đồ xu hướng
- [ ] So sánh với kỳ trước

#### **20.2. Báo cáo Tỷ lệ phòng**

- [ ] Occupancy Rate theo ngày/tháng
- [ ] ADR (Average Daily Rate)
- [ ] RevPAR (Revenue Per Available Room)
- [ ] Forecast công suất

#### **20.3. Báo cáo Dịch vụ**

- [ ] Top services
- [ ] Revenue từng dịch vụ
- [ ] Tần suất sử dụng

#### **20.4. Báo cáo Khách hàng**

- [ ] Guest in-house (đang ở)
- [ ] Arrival list (sắp đến hôm nay)
- [ ] Departure list (sắp đi hôm nay)
- [ ] No-show report
- [ ] VIP guest list

#### **20.5. Báo cáo Tài chính**

- [ ] Cash flow
- [ ] Receivables (công nợ)
- [ ] Payment method breakdown

**Acceptance Criteria:**

- Báo cáo chính xác, realtime
- Export Excel/PDF
- Filter linh hoạt
- Dashboard trực quan

---

### ✅ 21. Tìm kiếm Nâng cao

**Chức năng hoàn thiện:**

- [ ] **Search Box thông minh:**
  - Tìm theo số phòng
  - Tìm theo tên khách
  - Tìm theo CCCD/Passport
  - Tìm theo số điện thoại
  - Tìm theo mã booking
- [ ] **Advanced Filter:**
  - Theo ngày đặt
  - Theo ngày đến/đi
  - Theo trạng thái
  - Theo loại phòng
  - Theo nguồn booking (Direct/OTA)
- [ ] **Quick Actions:**
  - Click phòng → Xem chi tiết ngay
  - Hover → Preview thông tin
- [ ] **Search History:**
  - Lưu lịch sử tìm kiếm
  - Suggest kết quả phổ biến

**Acceptance Criteria:**

- Tìm kiếm nhanh (< 1s)
- Giao diện trực quan
- Autocomplete

---

### ✅ 22. Minibar Automation (Bonus - 10/10)

**Chức năng wow factor:**

- [ ] **QR Code trên mỗi sản phẩm minibar**
- [ ] **Khách quét QR:**
  - Tự động post charge
  - Không cần gọi reception
- [ ] **Housekeeping confirm:**
  - Check số lượng thực tế
  - Adjust nếu sai lệch
- [ ] **Inventory realtime:**
  - Tự động trừ tồn kho
  - Alert khi hết hàng

**Tech Stack:**

- QR Generator
- Mobile-friendly scan interface
- WebSocket cho realtime update

**Acceptance Criteria:**

- Workflow tự động hoàn toàn
- Không lỗi khi scan
- Tích hợp seamless với folio

---

<div align="center">

# 🎯 TỔNG KẾT TOÀN BỘ CHECKLIST

## Project Roadmap & Scoring Guide

</div>

---

### 📊 Bảng Điểm Chi tiết

<table>
<thead>
<tr>
<th align="center">Mức độ</th>
<th align="center">Số lượng</th>
<th>Nội dung</th>
<th align="center">Điểm đạt được</th>
<th align="center">Effort</th>
<th align="center">Status</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">🔴 <strong>HIGH</strong></td>
<td align="center">8 modules</td>
<td>Nghiệp vụ cốt lõi - Bắt buộc</td>
<td align="center"><strong>7-8/10</strong></td>
<td align="center">60-70%</td>
<td align="center">⏳ Phase 1</td>
</tr>
<tr>
<td align="center">🟠 <strong>MEDIUM</strong></td>
<td align="center">8 modules</td>
<td>Tính năng nâng cao - Thể hiện hiểu biết</td>
<td align="center"><strong>8-9/10</strong></td>
<td align="center">20-25%</td>
<td align="center">💪 Phase 2</td>
</tr>
<tr>
<td align="center">🟢 <strong>LOW</strong></td>
<td align="center">6 modules</td>
<td>Hoàn thiện - Wow factor</td>
<td align="center"><strong>9.5-10/10</strong></td>
<td align="center">10-15%</td>
<td align="center">✨ Phase 3</td>
</tr>
<tr>
<td colspan="3" align="right"><strong>TỔNG CỘNG:</strong></td>
<td align="center"><strong>22 modules</strong></td>
<td align="center"><strong>100%</strong></td>
<td align="center">🎯 Target: 9-10/10</td>
</tr>
</tbody>
</table>

<br/>

### ✅ Checklist Tổng hợp

**🔴 HIGH PRIORITY (BẮT BUỘC):**

- [ ] 1. Room Management
- [ ] 2. Reservation + Availability Check
- [ ] 3. Check-in
- [ ] 4. Service Usage
- [ ] 5. Phụ Thu (Surcharge)
- [ ] 6. Phạt (Penalty)
- [ ] 7. Check-out & Billing (tổng hợp)
- [ ] 8. Customer Management

**🟠 MEDIUM PRIORITY (NÂNG CAO):**

- [ ] 9. Pricing Engine (Dynamic/Seasonal/Holiday)
- [ ] 10. Room Move
- [ ] 11. Folio Transaction (đầy đủ loại)
- [ ] 12. Quản lý thông tin khách lưu trú (NGUOIO)
- [ ] 13. Invoice Generation
- [ ] 14. Housekeeping Workflow
- [ ] 15. Quản lý Loại khách hàng (VIP upgrade)
- [ ] 16. Edge Cases (Late/Early/Overstay)

**🟢 LOW PRIORITY (HOÀN THIỆN):**

- [ ] 17. Master & Guest Folio
- [ ] 18. Void / Adjust Transaction
- [ ] 19. Shift Management
- [ ] 20. Full Reporting Suite
- [ ] 21. Advanced Search
- [ ] 22. Minibar Automation (Bonus)

---

## 💡 CHIẾN LƯỢC ĐẠT ĐIỂM CAO

### 🎯 Để đạt 7-8 điểm:

✅ Làm đủ HIGH priority  
✅ Workflow end-to-end hoàn chỉnh  
✅ Tài liệu đầy đủ (SRS + ERD + Use Case)

### 🎯 Để đạt 8-9 điểm:

✅ Làm đủ HIGH + MEDIUM  
✅ Xử lý đúng business logic phức tạp  
✅ Code clean, có test case  
✅ UI/UX đẹp, professional

### 🎯 Để đạt 9.5-10 điểm:

✅ Làm đủ HIGH + MEDIUM + 50% LOW  
✅ Có wow factor (automation, advanced features)  
✅ Tài liệu xuất sắc (chi tiết, có diagram)  
✅ Demo mượt mà, xử lý tốt Q&A  
✅ Code quality cao (patterns, SOLID, test coverage)

---

## ⚠️ LƯU Ý QUAN TRỌNG

### ❌ Tránh những sai lầm phổ biến:

1. **Làm nhiều tính năng nhưng không chất lượng**

   - → Better: Ít tính năng nhưng hoàn chỉnh

2. **Bỏ qua tài liệu**

   - → Tài liệu chiếm 15-20% điểm

3. **Database design kém**

   - → Phải có ERD chuẩn, relationship rõ ràng

4. **Không test**

   - → Demo bị lỗi = mất điểm nặng

5. **UI xấu, khó dùng**
   - → First impression rất quan trọng

### ✅ Tips tối ưu thời gian:

1. **Tuần 1-2**: HIGH priority (Core features)
2. **Tuần 3**: MEDIUM priority (Business logic)
3. **Tuần 4**: LOW priority (Polish) + Tài liệu
4. **Tuần 5**: Testing + Bug fixing + Chuẩn bị demo

### 🎬 Demo Tips:

1. **Chuẩn bị data mẫu đầy đủ:**

   - 20-30 phòng
   - 50-100 bookings
   - Đủ các trạng thái

2. **Script demo rõ ràng:**

   - Flow 1: Walk-in guest → Check-in → Use service → Check-out
   - Flow 2: Advance booking → Modify → Check-in → Room move → Check-out
   - Flow 3: Group booking → Master/Guest folio → Split bill

3. **Chuẩn bị câu hỏi thường gặp:**
   - "Xử lý overbooking thế nào?"
   - "Tính tiền cuối tuần + lễ như thế nào?"
   - "Nếu khách ở quá ngày thì sao?"

---

## 💰 NGHIỆP VỤ ĐẶT CỌC - FOLIO WORKFLOW

### 🎯 Thiết kế mới: FOLIO từ Booking (không dùng THANHTOAN_COC)

#### **Ưu điểm của thiết kế mới:**

✅ **Đơn giản hơn**: Không cần bảng THANHTOAN_COC riêng  
✅ **Thống nhất**: Tất cả giao dịch tiền đều qua FOLIO  
✅ **Realtime**: Folio.ConLai luôn chính xác (âm = đã trả trước)  
✅ **Dễ track**: Lịch sử cọc nằm trong FolioTransaction

---

### 🔄 WORKFLOW CHI TIẾT (Booking → Check-out)

```
┌─────────────────────────────────────────────────────────────────┐
│  CASE: Khách đặt phòng trước, cọc 30%, check-in sau 2 ngày     │
└─────────────────────────────────────────────────────────────────┘

📅 Ngày 08/12 - TẠO BOOKING
  1. Tạo PHIEUDAT (TrangThaiPhieu = 'PENDING')
  2. Tạo CT_DATPHONG cho phòng 101
  3. Tính tổng giá trị: 10,000,000đ (5 đêm × 2,000,000đ)
  4. Yêu cầu cọc 30% = 3,000,000đ

📅 Ngày 09/12 - CỌC TIỀN ✅ (WORKFLOW MỚI)
  1. Tạo FOLIO:
     INSERT INTO FOLIO (MaPhieuDat, MaPhieuThue, TrangThai)
     VALUES ('PD001', NULL, 'Open')

  2. Thu tiền cọc → Post vào FolioTransaction:
     INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Credit, Debit)
     VALUES ('F001', 'Deposit', 3000000, 0)
     MoTa = 'Tiền cọc đặt phòng 30%'

  3. Cập nhật Folio.ConLai:
     TongCharge = 0 (chưa có charge)
     TongPayment = 3,000,000
     ConLai = 0 - 3,000,000 = -3,000,000đ (SỐ ÂM = ĐÃ TRẢ TRƯỚC)

  4. Cập nhật trạng thái booking:
     PHIEUDAT.TrangThaiPhieu = 'CONFIRMED' ✅
     CT_DATPHONG.TinhTrangDatPhong = 'CONFIRMED' ✅

📅 Ngày 10/12 - CHECK-IN ✅
  1. Tạo PHIEUTHUEPHONG (PT001)
  2. Tạo CT_PHIEUTHUEPHONG (phòng 101)
  3. Gắn FOLIO vào phiếu thuê:
     UPDATE FOLIO
     SET MaPhieuThue = 'PT001'
     WHERE MaPhieuDat = 'PD001'

  4. Folio hiện tại:
     MaFolio = 'F001'
     MaPhieuDat = 'PD001'
     MaPhieuThue = 'PT001' ✅ (vừa gắn)
     ConLai = -3,000,000đ (vẫn còn credit)

📅 Ngày 11/12 - AUTO POST ROOM CHARGE (Đêm 1)
  INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Debit, Credit)
  VALUES ('F001', 'RoomCharge', 2000000, 0)
  MoTa = 'Tiền phòng 10/12'

  Folio.ConLai = -3,000,000 + 2,000,000 = -1,000,000đ

📅 Ngày 12/12 - SỬ DỤNG DỊCH VỤ
  INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Debit, Credit)
  VALUES ('F001', 'ServiceCharge', 500000, 0)
  MoTa = 'Spa massage'

  Folio.ConLai = -1,000,000 + 500,000 = -500,000đ

📅 Ngày 15/12 - CHECKOUT (Sau 5 đêm)
  1. Tổng room charge: 5 đêm × 2,000,000 = 10,000,000đ
  2. Service charge: 500,000đ
  3. Tổng hóa đơn: 10,500,000đ
  4. Đã cọc (credit): 3,000,000đ
  5. Còn phải trả: 10,500,000 - 3,000,000 = 7,500,000đ ✅

  6. Thu tiền:
     INSERT INTO FOLIOTRANSACTION (MaFolio, LoaiGiaoDich, Credit, Debit)
     VALUES ('F001', 'Payment', 7500000, 0)

  7. Folio.ConLai = 0 → Đóng Folio ✅
     UPDATE FOLIO SET TrangThai = 'Closed'
```

---

### 💡 CÁC CASE ĐẶC BIỆT

#### **Case 1: Cọc nhiều lần**

```sql
-- Lần 1: Cọc 1,000,000đ
INSERT FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=1000000, MoTa='Cọc lần 1')
Folio.ConLai = -1,000,000đ

-- Lần 2: Cọc thêm 2,000,000đ
INSERT FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=2000000, MoTa='Cọc lần 2')
Folio.ConLai = -3,000,000đ

→ Tổng cọc = 3,000,000đ (SUM Credit WHERE LoaiGiaoDich='Deposit')
```

#### **Case 2: Walk-in (không có booking trước)**

```sql
-- Check-in trực tiếp
1. Tạo PHIEUTHUEPHONG (MaPhieuDat = NULL)
2. Tạo CT_PHIEUTHUEPHONG (phòng thuê)
3. Tạo FOLIO mới:
   INSERT INTO FOLIO (MaPhieuDat, MaPhieuThue, TrangThai)
   VALUES (NULL, 'PT001', 'Open')

4. Thu cọc (nếu yêu cầu):
   INSERT INTO FOLIOTRANSACTION (LoaiGiaoDich, Credit)
   VALUES ('Deposit', 1000000)
   MoTa = 'Tiền cọc walk-in'

→ Không có booking, không có tiền cọc trước, tạo FOLIO mới hoàn toàn
```

#### **Case 3: Hủy booking (refund tiền cọc)**

```sql
-- Kiểm tra policy
IF HuyTruoc24h THEN
  -- Hoàn 100%
  INSERT FOLIOTRANSACTION (Debit = 3000000, MoTa = 'Hoàn tiền cọc')
  Folio.ConLai = -3,000,000 + 3,000,000 = 0
ELSE
  -- Mất 50% cọc
  INSERT FOLIOTRANSACTION (Debit = 1500000, MoTa = 'Hoàn 50% cọc')
  Folio.ConLai = -3,000,000 + 1,500,000 = -1,500,000đ
END IF
```

---

### ✅ CHECKLIST IMPLEMENT

**Khi code nghiệp vụ đặt cọc:**
**Có booking trước:**

- [ ] Tạo FOLIO ngay khi tạo PHIEUDAT (không đợi đến check-in)
- [ ] FOLIO.MaPhieuDat = @MaPhieuDat (link ngay)
- [ ] FOLIO.MaPhieuThue = NULL (chưa check-in)
- [ ] Khi thu cọc: Tạo FolioTransaction (LoaiGiaoDich='Deposit', Credit=TienCoc)
- [ ] Khi check-in: Update FOLIO.MaPhieuThue = @MaPhieuThue (gắn vào phiếu thuê)

**Walk-in (không có booking):**

- [ ] Tạo FOLIO mới khi check-in: FOLIO (MaPhieuDat=NULL, MaPhieuThue=@MaPhieuThue)
- [ ] Thu cọc ngay: FolioTransaction (LoaiGiaoDich='Deposit', Credit=TienCoc)

**Chung:**

- [ ] Folio.ConLai = TotalCharge - TotalPayment (âm = đã trả trước)
- [ ] Không tạo bảng THANHTOAN_COC (bỏ bảng này)
- [ ] UI hiển thị Folio.ConLai (âm = credit, dương = nợ)

---

### ❓ FAQ - THẮC MẮC THƯỜNG GẶP

#### **Q1: Tại sao không dùng bảng THANHTOAN_COC như trước?**

**A:** Dùng FOLIO đơn giản hơn và chuẩn PMS quốc tế hơn:

- ✅ Tất cả giao dịch tiền tập trung 1 chỗ (FOLIOTRANSACTION)
- ✅ Không cần "chuyển tiền cọc vào folio" khi check-in (phức tạp)
- ✅ Balance luôn chính xác realtime
- ✅ Dễ audit trail (theo dõi lịch sử)

#### **Q2: FOLIO.MaPhieuDat và FOLIO.MaPhieuThue khác nhau thế nào?**

**A:**

- **MaPhieuDat**: Link với booking (tạo khi đặt phòng)
- **MaPhieuThue**: Link với phiếu thuê (gắn khi check-in)
- Ví dụ:

  ```sql
  -- Lúc booking:
  FOLIO (MaPhieuDat='PD001', MaPhieuThue=NULL)

  -- Sau check-in:
  FOLIO (MaPhieuDat='PD001', MaPhieuThue='PT001')
  ```

#### **Q3: Folio.ConLai âm có nghĩa là gì?**

**A:**

- **ConLai < 0** (âm): Khách đã trả trước (có credit)
  - VD: ConLai = -3M → Khách cọc 3M, chưa có charge nào
- **ConLai > 0** (dương): Khách còn nợ
  - VD: ConLai = +2M → Khách nợ 2M phải trả
- **ConLai = 0**: Đã thanh toán hết

#### **Q4: Nếu khách đặt 3 phòng thì có mấy FOLIO?**

**A:** **1 FOLIO duy nhất** cho cả 3 phòng (gắn với PHIEUTHUEPHONG)

```
PHIEUDAT (PD001) - Đặt 3 phòng
└─► PHIEUTHUEPHONG (PT001) - Thuê 3 phòng
    ├─► CT_PHIEUTHUEPHONG (Phòng 101)
    ├─► CT_PHIEUTHUEPHONG (Phòng 102)
    └─► CT_PHIEUTHUEPHONG (Phòng 103)

    └─► FOLIO (F001) ← CHỈ 1 FOLIO
        ├─► RoomCharge phòng 101
        ├─► RoomCharge phòng 102
        └─► RoomCharge phòng 103
```

**Ngoại lệ**: Group Booking có Master Folio (xem Module 16 - LOW Priority)

#### **Q5: Walk-in (không có booking) thì sao?**

**A:** Tạo FOLIO mới khi check-in:

```sql
-- Walk-in: Bỏ qua PHIEUDAT
PHIEUTHUEPHONG (MaPhieuDat = NULL)
FOLIO (MaPhieuDat = NULL, MaPhieuThue = 'PT001')
```

#### **Q6: Khách cọc nhiều lần thì lưu thế nào?**

**A:** Tạo nhiều FolioTransaction:

```sql
-- Lần 1: Cọc 1M
FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=1000000, MoTa='Cọc lần 1')

-- Lần 2: Cọc thêm 2M
FOLIOTRANSACTION (LoaiGiaoDich='Deposit', Credit=2000000, MoTa='Cọc lần 2')

-- Tổng cọc = SUM(Credit WHERE LoaiGiaoDich='Deposit')
```

#### **Q7: Hủy booking thì hoàn tiền cọc như thế nào?**

**A:** Tạo FolioTransaction Debit (trừ tiền):

```sql
-- Ví dụ: Hoàn 100% cọc (3M)
FOLIOTRANSACTION (
  Debit = 3000000,
  Credit = 0,
  MoTa = 'Hoàn tiền cọc - Hủy booking'
)

-- Folio.ConLai: -3M + 3M = 0
```

#### **Q8: Khi nào đóng FOLIO (TrangThai = 'Closed')?**

**A:** Khi checkout VÀ Folio.ConLai = 0:

```sql
IF Folio.ConLai = 0 THEN
  UPDATE FOLIO SET TrangThai = 'Closed', NgayDong = NOW()
END IF
```

---

### 📊 BẢNG TỔNG HỢP - FOLIO LIFECYCLE

| Giai đoạn       | Action                | FOLIO State        | ConLai     | MaPhieuDat | MaPhieuThue  |
| --------------- | --------------------- | ------------------ | ---------- | ---------- | ------------ |
| **1. Booking**  | Tạo đặt phòng         | Tạo FOLIO          | 0          | PD001      | NULL         |
| **2. Deposit**  | Thu cọc 3M            | Post Deposit       | **-3M** ⬇️ | PD001      | NULL         |
| **3. Check-in** | Gắn vào phiếu thuê    | Update             | -3M        | PD001      | **PT001** ✅ |
| **4. Night 1**  | Auto post room charge | Post Charge        | -1M ⬆️     | PD001      | PT001        |
| **5. Night 2**  | Auto post room charge | Post Charge        | +1M ⬆️     | PD001      | PT001        |
| **6. Service**  | Khách dùng spa        | Post Charge        | +1.5M ⬆️   | PD001      | PT001        |
| **7. Checkout** | Thu tiền còn lại      | Post Payment       | **0** ✅   | PD001      | PT001        |
| **8. Close**    | Đóng folio            | TrangThai='Closed' | 0          | PD001      | PT001        |

**Chú thích:**

- ⬇️ ConLai giảm (âm) = Khách trả tiền (Credit)
- ⬆️ ConLai tăng (dương) = Khách nợ thêm (Debit)
- ✅ Checkpoint quan trọng

---

### 🎯 KEY TAKEAWAYS

1. **FOLIO tạo từ lúc booking** (không đợi check-in)
2. **Tiền cọc = Credit trong FolioTransaction** (không lưu bảng riêng)
3. **ConLai âm = Đã trả trước** (khách có credit)
4. **ConLai dương = Còn nợ** (phải thu thêm tiền)
5. **Check-in = Gắn FOLIO vào phiếu thuê** (update MaPhieuThue)
6. **Checkout = ConLai phải = 0** (không nợ không thừa)

---

## 📚 TÀI LIỆU THAM KHẢO

- **Nghiệp vụ**: NGHIEP_VU_KHACH_SAN.md
- **Database Schema**: DATABASE_SCHEMA_AND_CODE.md
- **Standards**: ISO 9001, PCI-DSS
- **Systems**: Opera PMS, Cloudbeds, eZee Absolute
- **Books**:
  - "Hotel Front Office Management" - James Bardi
  - "Professional Management of Housekeeping Operations" - Thomas Jones

---

**🎓 Chúc bạn đạt điểm cao! Remember: Quality > Quantity!**

> **Pro tip cuối**: Demo cho giảng viên ở phase HIGH xong để nhận feedback sớm. Đừng để đến cuối mới phát hiện sai hướng!
