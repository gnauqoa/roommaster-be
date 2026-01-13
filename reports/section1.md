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
