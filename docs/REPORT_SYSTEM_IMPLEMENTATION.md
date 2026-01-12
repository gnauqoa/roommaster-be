# Hệ Thống Báo Cáo - RoomMaster BE

## ✅ Triển Khai Hoàn Tất

Đã implement thành công **15 API endpoints** cho hệ thống báo cáo, chia thành 5 module chính.

---

## 📂 Cấu Trúc File

```
src/
├── services/reports/
│   ├── room-availability.report.service.ts    # API 1.1, 1.2
│   ├── customer.report.service.ts             # API 2.1, 2.2, 2.3, 2.4
│   ├── employee.report.service.ts             # API 3.1, 3.2, 3.3
│   ├── service.report.service.ts              # API 4.1, 4.2, 4.3
│   ├── revenue.report.service.ts              # API 5.1, 5.2, 5.3, 5.4
│   └── index.ts
├── controllers/employee/reports/
│   ├── report.controller.ts
│   └── index.ts
├── routes/v1/employee/
│   └── reports.route.ts
├── constants/
│   └── permissions.constant.ts                # Updated with report permissions
└── core/
    ├── container.ts                           # Added report service tokens
    └── bootstrap.ts                           # Registered report services & controller
```

---

## 🎯 API Endpoints

### Base URL: `/api/v1/employee/reports`

### 1️⃣ **MODULE: ROOM AVAILABILITY REPORTS**

#### 1.1 Kiểm Tra Phòng Trống
- **GET** `/rooms/availability`
- **Query Parameters:**
  - `checkInDate` (required): YYYY-MM-DD
  - `checkOutDate` (required): YYYY-MM-DD
  - `roomTypeId` (optional): Filter by room type
  - `capacity` (optional): Minimum capacity
  - `floor` (optional): Filter by floor
  - `minPrice`, `maxPrice` (optional): Price range

**Response Example:**
```json
{
  "checkInDate": "2026-01-15",
  "checkOutDate": "2026-01-17",
  "totalAvailable": 12,
  "totalOccupied": 5,
  "totalReserved": 3,
  "totalRooms": 20,
  "availableRooms": [
    {
      "roomId": "...",
      "roomNumber": "101",
      "floor": 1,
      "status": "AVAILABLE",
      "roomType": {...},
      "pricePerNight": 500000,
      "totalPrice": 1000000,
      "numberOfNights": 2
    }
  ]
}
```

#### 1.2 Dự Báo Tỷ Lệ Phòng Trống
- **GET** `/rooms/occupancy-forecast`
- **Query Parameters:**
  - `startDate` (required)
  - `endDate` (required)
  - `groupBy` (optional): 'day' | 'week' | 'month'

---

### 2️⃣ **MODULE: CUSTOMER REPORTS**

#### 2.1 Lịch Sử Lưu Trú Khách Hàng
- **GET** `/customers/stay-history`
- **Query Parameters:**
  - `fromDate`, `toDate` (optional)
  - `rankId` (optional): Filter by VIP rank
  - `minStays` (optional): Minimum number of stays
  - `minTotalSpent` (optional): Minimum total spending
  - `sortBy`: 'totalSpent' | 'totalStays' | 'lastVisit'
  - `page`, `limit`: Pagination

#### 2.2 Khách Lưu Trú Lần Đầu
- **GET** `/customers/first-time-guests`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)
  - `page`, `limit`

#### 2.3 Giá Trị Khách Hàng (Customer Lifetime Value)
- **GET** `/customers/lifetime-value`
- **Query Parameters:**
  - `limit` (optional, default: 50)

**Response includes:**
- CLV Score (calculated from spending, frequency, recency)
- Total stays
- Total spent
- Days since last visit
- Frequency (visits per month)

#### 2.4 Phân Bổ Hạng Khách Hàng
- **GET** `/customers/rank-distribution`

**Response Example:**
```json
{
  "totalCustomers": 150,
  "distribution": [
    {
      "rankId": "...",
      "rankName": "VIP Gold",
      "minSpending": 5000000,
      "customerCount": 25,
      "percentage": 16.67,
      "totalRevenue": 75000000,
      "averageRevenuePerCustomer": 3000000
    }
  ]
}
```

---

### 3️⃣ **MODULE: EMPLOYEE PERFORMANCE REPORTS**

#### 3.1 Hiệu Suất Xử Lý Booking
- **GET** `/employees/booking-performance`
- **Query Parameters:**
  - `employeeId` (optional): Filter by specific employee
  - `fromDate` (required)
  - `toDate` (required)
  - `sortBy`: 'totalBookings' | 'totalRevenue' | 'totalTransactions'

**Metrics:**
- Total bookings processed
- Total check-ins/check-outs
- Total transactions processed
- Total revenue processed
- Average transaction value

#### 3.2 Hiệu Suất Cung Cấp Dịch Vụ
- **GET** `/employees/service-performance`
- **Query Parameters:**
  - `employeeId` (optional)
  - `fromDate` (required)
  - `toDate` (required)

**Metrics:**
- Total services provided
- Total service revenue
- Top 5 services by this employee

#### 3.3 Tổng Hợp Hoạt Động
- **GET** `/employees/activity-summary`
- **Query Parameters:**
  - `employeeId` (optional)
  - `fromDate`, `toDate` (optional)
  - `activityTypes` (optional): Comma-separated list

**Response:**
- Activity breakdown by type
- Total activities per employee

---

### 4️⃣ **MODULE: SERVICE REPORTS**

#### 4.1 Thống Kê Sử Dụng Dịch Vụ
- **GET** `/services/usage-statistics`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)
  - `serviceId` (optional)
  - `status` (optional): ServiceUsageStatus

**Metrics per service:**
- Total usage count
- Total quantity
- Total revenue
- Average price
- Status breakdown (PENDING/COMPLETED/CANCELLED)
- Popularity rank

#### 4.2 Top Dịch Vụ Theo Doanh Thu
- **GET** `/services/top-by-revenue`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)
  - `limit` (optional, default: 10)

#### 4.3 Xu Hướng Dịch Vụ
- **GET** `/services/trend`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)
  - `serviceId` (optional)
  - `groupBy`: 'day' | 'week' | 'month'

**Response:**
- Time-series data with growth rates
- Service breakdown per period

---

### 5️⃣ **MODULE: REVENUE & FINANCIAL REPORTS**

#### 5.1 Tổng Quan Doanh Thu
- **GET** `/revenue/summary`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)
  - `groupBy`: 'day' | 'week' | 'month' | 'quarter' | 'year'

**Key Metrics:**
- Total revenue (room + service)
- Room revenue
- Service revenue
- Total bookings
- Total room nights
- **Occupancy Rate** (%)
- **ADR** (Average Daily Rate)
- **RevPAR** (Revenue Per Available Room)

**Response Example:**
```json
{
  "period": {...},
  "summary": {
    "totalRevenue": 150000000,
    "roomRevenue": 120000000,
    "serviceRevenue": 30000000,
    "totalBookings": 45,
    "totalRoomNights": 120,
    "occupancyRate": 75.5,
    "averageDailyRate": 1000000,
    "revenuePerAvailableRoom": 755000
  },
  "breakdown": [...]
}
```

#### 5.2 Doanh Thu Theo Loại Phòng
- **GET** `/revenue/by-room-type`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)

**Response:**
- Revenue breakdown by room type
- Total bookings per type
- Average revenue per booking
- Percentage of total revenue

#### 5.3 Phân Bổ Phương Thức Thanh Toán
- **GET** `/revenue/payment-methods`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)

**Response:**
```json
{
  "distribution": [
    {
      "method": "CASH",
      "count": 50,
      "totalAmount": 75000000,
      "averageAmount": 1500000,
      "percentageByAmount": 45.5,
      "percentageByCount": 55.5
    }
  ]
}
```

#### 5.4 Hiệu Quả Khuyến Mãi
- **GET** `/revenue/promotions`
- **Query Parameters:**
  - `fromDate` (required)
  - `toDate` (required)

**Metrics:**
- Times used
- Total discount given
- Total revenue influenced
- Bookings influenced
- **ROI** (Return on Investment)

---

## 🔐 Permissions

Đã thêm các permissions sau vào `permissions.constant.ts`:

```typescript
REPORT_READ: 'report.read',                    // General report access
REPORT_ROOM_READ: 'report.room.read',          // Room availability reports
REPORT_CUSTOMER_READ: 'report.customer.read',  // Customer reports
REPORT_EMPLOYEE_READ: 'report.employee.read',  // Employee performance reports
REPORT_SERVICE_READ: 'report.service.read',    // Service usage reports
REPORT_REVENUE_READ: 'report.revenue.read',    // Revenue reports
REPORT_EXPORT: 'report.export'                 // Export functionality (future)
```

### Phân Quyền Đề Xuất:

| Role | Permissions |
|------|-------------|
| **ADMIN** | ALL report permissions |
| **MANAGER** | All READ permissions (không có EXPORT) |
| **RECEPTIONIST** | `REPORT_ROOM_READ`, `REPORT_CUSTOMER_READ` (basic) |
| **ACCOUNTANT** | `REPORT_REVENUE_READ`, `REPORT_SERVICE_READ` |

---

## 🔧 Authentication & Authorization

Tất cả report endpoints được bảo vệ bởi:
1. **Employee Authentication** (`authEmployee` middleware)
2. **CASL Abilities** (`attachAbilities` middleware)
3. **Screen Access** (`canAccessScreen('Reports')` middleware)

```typescript
router.use(authEmployee, attachAbilities, canAccessScreen('Reports'));
```

---

## 📊 Database Optimization Notes

### Indexes Cần Thiết (Đã có sẵn trong schema):
- ✅ `Booking`: `bookingCode`, `status`
- ✅ `BookingRoom`: `status`
- ✅ `Customer`: `phone`, `rankId`
- ✅ `Transaction`: `status` (via filters)
- ✅ `Room`: `status`

### Performance Considerations:
- Tất cả queries đều có date range filtering
- Sử dụng pagination cho customer & activity reports
- Aggregation được thực hiện ở application layer (có thể tối ưu thêm bằng raw SQL nếu cần)

---

## 🚀 Testing

### Manual Testing với Postman/Thunder Client:

**Example Request:**
```http
GET /api/v1/employee/reports/revenue/summary?fromDate=2026-01-01&toDate=2026-01-31&groupBy=week
Authorization: Bearer <employee_token>
```

### Test Data Requirements:
- Bookings với status CHECKED_OUT/CHECKED_IN
- Transactions với status COMPLETED
- ServiceUsage records
- Customer với different ranks

---

## 📝 Các Features Có Thể Mở Rộng

### Phase 2 (Tương Lai):
1. **Export Reports**: PDF, Excel, CSV
2. **Scheduled Reports**: Email tự động hàng tuần/tháng
3. **Data Visualization**: Chart data endpoints
4. **Comparison Reports**: So sánh YoY, MoM
5. **Real-time Dashboards**: WebSocket updates
6. **Advanced Filters**: Multiple room types, date ranges comparison
7. **Custom Report Builder**: User-defined reports

---

## ⚠️ Known Limitations

1. **No Joi Validation**: Route validation schemas chưa được implement (nhưng TypeScript types đã có)
2. **No Caching**: Tất cả queries là real-time (có thể thêm Redis cache nếu cần)
3. **Application-Level Aggregation**: Một số aggregations có thể chậm với dataset lớn (có thể optimize bằng database views hoặc materialized views)

---

## 🎉 Summary

✅ **15 API endpoints** được triển khai đầy đủ  
✅ **5 Service classes** với clean separation of concerns  
✅ **1 Controller** với 15 methods  
✅ **Routes** được register và protected  
✅ **Permissions** được define và integrate  
✅ **DI Container** được setup đúng cách  

Hệ thống báo cáo đã sẵn sàng để sử dụng! 🚀
