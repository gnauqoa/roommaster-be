# 1. **Class diagram (Mức phân tích)**

## 1.1. **Danh sách các lớp thực thể liên quan**

Phong

KhachHang

NhanVien

DatPhong

Phieu Thue Phong

DichVu

PhuThu

PhieuPhat

HoaDon

NguoiDung

NhomNguoiDung

Quyen

## 1.2. **Conceptual model**

plant uml here, this is main entities with there relation simplify into just one line ( if they have call then have one line)

## 1.3 **Class diagram (analysis level)**

plant uml code here contains full diagram in analysis level ( dont need to list all the funtions)

## 1.4 **Danh sách các lớp và các mối quan hệ**

| No  | Class                   | Type(Entity/ Boundary/ Control) | Note                          |
| :-- | :---------------------- | :------------------------------ | :---------------------------- |
| 1   | LOAIPHONG               | Entity                          | Quản lý loại phòng            |
| 2   | PHONG                   | Entity                          | Quản lý phòng                 |
| 3   | NHANVIEN                | Entity                          | Quản lý nhân viên             |
| 4   | LOAIKHACHHANG           | Entity                          | Quản lý loại khách hàng       |
| 5   | KHACHHANG               | Entity                          | Quản lý khách hàng            |
| 6   | HINHTHUCTHANHTOAN       | Entity                          | Hình thức thanh toán          |
| 7   | DATPHONG                | Control                         | Quản lý đặt phòng             |
| 8   | CHITIET_DATPHONG        | Control                         | Chi tiết đặt phòng            |
| 9   | PHIEUTHUEPHONG          | Control                         | Quản lý thuê phòng            |
| 10  | CHITIET_PHIEUTHUEPHONG  | Control                         | Chi tiết thuê phòng           |
| 11  | LOAIDICHVU              | Entity                          | Quản lý loại dịch vụ          |
| 12  | DICHVU                  | Entity                          | Quản lý dịch vụ               |
| 13  | SUDUNGDICHVU            | Control                         | Sử dụng dịch vụ               |
| 14  | HOADON                  | Entity                          | Quản lý hóa đơn               |
| 15  | CHITIET_HOADON          | Control                         | Chi tiết hóa đơn              |
| 16  | PHIEUPHAT               | Entity                          | Quản lý phiếu phạt            |
| 17  | PHUTHU                  | Entity                          | Quản lý phụ thu               |
| 18  | THAMSO                  | Entity                          | Tham số hệ thống              |
| 19  | BAOCAODOANHTHU          | Control                         | Báo cáo doanh thu             |
| 20  | NGUOIDUNG               | Entity                          | Người dùng hệ thống           |
| 21  | NHOMNGUOIDUNG           | Entity                          | Nhóm người dùng               |
| 22  | QUYEN                   | Entity                          | Quyền                         |
| 23  | PHANQUYEN               | Control                         | Phân quyền                    |
| 24  | TrangThaiPhongStatus    | Entity (Enum)                   | Trạng thái phòng              |
| 25  | TinhTrangDatPhongStatus | Entity (Enum)                   | Tình trạng đặt phòng          |
| 26  | TinhTrangLamViecStatus  | Entity (Enum)                   | Tình trạng làm việc nhân viên |

## 1.5 **Chi tiết các lớp**

### **Lớp LOAIPHONG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                       |
| :-- | :------------- | :------ | :----------------- | :------------------------------------ |
| 1   | MaLoaiPhong    | Integer | private,\<\<PK\>\> | Mã định danh loại phòng (khóa chính)  |
| 2   | TenLoaiPhong   | String  | private            | Tên loại phòng (VD: Standard, Deluxe) |
| 3   | Gia            | Double  | private            | Giá tiền cho loại phòng này           |
| 4   | SucChua        | Integer | private            | Số người tối đa có thể ở              |
| 5   | TienNghi       | String  | private            | Mô tả tiện nghi                       |

**Trách nhiệm (Methods):**

| STT | Tên phương thức  | Mô tả                         |
| :-- | :--------------- | :---------------------------- |
| 1   | addRoomType()    | Thêm mới một loại phòng       |
| 2   | updateRoomType() | Cập nhật thông tin loại phòng |
| 3   | setPricing()     | Thiết lập giá cho loại phòng  |

### **Lớp PHONG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại                 | Ràng buộc          | Ý nghĩa/ghi chú                      |
| :-- | :------------- | :------------------- | :----------------- | :----------------------------------- |
| 1   | MaPhong        | Integer              | private,\<\<PK\>\> | Mã định danh phòng (khóa chính)      |
| 2   | TenPhong       | String               | private            | Tên/số phòng                         |
| 3   | TrangThaiPhong | TrangThaiPhongStatus | private            | Trạng thái hiện tại của phòng (Enum) |

**Trách nhiệm (Methods):**

| STT | Tên phương thức          | Mô tả                       |
| :-- | :----------------------- | :-------------------------- |
| 1   | addRoom()                | Thêm phòng mới vào hệ thống |
| 2   | updateRoomInfo()         | Cập nhật thông tin phòng    |
| 3   | updateRoomStatus(status) | Cập nhật trạng thái phòng   |
| 4   | viewRoomHistory()        | Xem lịch sử phòng           |

### **Lớp NHANVIEN (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính    | Loại                   | Ràng buộc          | Ý nghĩa/ghi chú                     |
| :-- | :---------------- | :--------------------- | :----------------- | :---------------------------------- |
| 1   | MaNV              | Integer                | private,\<\<PK\>\> | Mã định danh nhân viên (khóa chính) |
| 2   | TenNV             | String                 | private            | Họ tên nhân viên                    |
| 3   | ChucVu            | String                 | private            | Chức vụ trong khách sạn             |
| 4   | LuongCoBan        | Double                 | private            | Lương cơ bản                        |
| 5   | NgayBatDauLamViec | Date                   | private            | Ngày bắt đầu làm việc               |
| 6   | SoDienThoai       | String                 | private            | Số điện thoại                       |
| 7   | Email             | String                 | private            | Email liên lạc                      |
| 8   | TinhTrangLamViec  | TinhTrangLamViecStatus | private            | Tình trạng làm việc (Enum)          |

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                        |
| :-- | :------------------- | :--------------------------- |
| 1   | addEmployee()        | Thêm nhân viên mới           |
| 2   | updateEmployeeInfo() | Cập nhật thông tin nhân viên |
| 3   | deleteEmployee()     | Xóa nhân viên                |
| 4   | viewSchedule()       | Xem lịch làm việc            |

### **Lớp LOAIKHACHHANG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                 |
| :-- | :------------- | :------ | :----------------- | :------------------------------ |
| 1   | MaLoaiKH       | Integer | private,\<\<PK\>\> | Mã loại khách hàng (khóa chính) |
| 2   | TenLoaiKH      | String  | private            | Tên loại khách hàng             |

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                    |
| :-- | :------------------- | :----------------------- |
| 1   | addCustomerType()    | Thêm loại khách hàng mới |
| 2   | updateCustomerType() | Cập nhật loại khách hàng |

### **Lớp KHACHHANG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                      |
| :-- | :------------- | :------ | :----------------- | :----------------------------------- |
| 1   | MaKH           | Integer | private,\<\<PK\>\> | Mã định danh khách hàng (khóa chính) |
| 2   | TenKH          | String  | private            | Họ tên khách hàng                    |
| 3   | SoDienThoai    | String  | private            | Số điện thoại                        |
| 4   | Email          | String  | private            | Email liên lạc                       |
| 5   | CCCD           | String  | private            | Số căn cước công dân                 |
| 6   | DiaChi         | String  | private            | Địa chỉ                              |

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                         |
| :-- | :------------------- | :---------------------------- |
| 1   | registerCustomer()   | Đăng ký khách hàng mới        |
| 2   | updateCustomerInfo() | Cập nhật thông tin khách hàng |
| 3   | searchCustomer()     | Tìm kiếm khách hàng           |

### **Lớp HINHTHUCTHANHTOAN (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                      |
| :-- | :------------- | :------ | :----------------- | :----------------------------------- |
| 1   | MaHTTT         | Integer | private,\<\<PK\>\> | Mã hình thức thanh toán (khóa chính) |
| 2   | TenHTTT        | String  | private            | Tên hình thức (Tiền mặt, Thẻ...)     |
| 3   | Value          | String  | private            | Giá trị hoặc mô tả thêm              |

**Trách nhiệm (Methods):**

| STT | Tên phương thức       | Mô tả                         |
| :-- | :-------------------- | :---------------------------- |
| 1   | addPaymentMethod()    | Thêm hình thức thanh toán mới |
| 2   | selectPaymentMethod() | Chọn hình thức thanh toán     |

### **Lớp DATPHONG (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                     |
| :-- | :------------- | :------ | :----------------- | :---------------------------------- |
| 1   | MaDatPhong     | Integer | private,\<\<PK\>\> | Mã định danh đặt phòng (khóa chính) |
| 2   | NgayDat        | Date    | private            | Ngày thực hiện đặt phòng            |
| 3   | TongTienCoc    | Double  | private            | Tổng số tiền đã cọc                 |

**Trách nhiệm (Methods):**

| STT | Tên phương thức | Mô tả               |
| :-- | :-------------- | :------------------ |
| 1   | createBooking() | Tạo đặt phòng mới   |
| 2   | modifyBooking() | Sửa đặt phòng       |
| 3   | cancelBooking() | Hủy đặt phòng       |
| 4   | payDeposit()    | Thanh toán tiền cọc |

### **Lớp CHITIET_DATPHONG (Control)**

**Kế thừa:** Không (Lớp liên kết cho DATPHONG và PHONG)

**Thuộc tính:**

| STT | Tên thuộc tính    | Loại                    | Ràng buộc | Ý nghĩa/ghi chú                           |
| :-- | :---------------- | :---------------------- | :-------- | :---------------------------------------- |
| 1   | NgayDenDuKien     | Date                    | private   | Ngày dự kiến nhận phòng                   |
| 2   | NgayDiDuKien      | Date                    | private   | Ngày dự kiến trả phòng                    |
| 3   | TienCoc           | Double                  | private   | Tiền cọc cho phòng này                    |
| 4   | TinhTrangDatPhong | TinhTrangDatPhongStatus | private   | Tình trạng (Confirmed, Pending...) (Enum) |

**Trách nhiệm (Methods):**

| STT | Tên phương thức        | Mô tả                                   |
| :-- | :--------------------- | :-------------------------------------- |
| 1   | addRoomToBooking()     | Thêm một phòng vào đặt phòng            |
| 2   | updateBookingDetails() | Cập nhật chi tiết đặt phòng (ngày, cọc) |

### **Lớp PHIEUTHUEPHONG (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                  |
| :-- | :------------- | :------ | :----------------- | :------------------------------- |
| 1   | MaPhieuThue    | Integer | private,\<\<PK\>\> | Mã phiếu thuê phòng (khóa chính) |
| 2   | NgayNhanThucTe | Date    | private            | Ngày nhận phòng thực tế          |
| 3   | NgayTraThucTe  | Date    | private            | Ngày trả phòng thực tế           |
| 4   | SoNguoiO       | Integer | private            | Số người ở thực tế               |
| 5   | GhiChu         | String  | private            | Ghi chú thêm                     |

**Trách nhiệm (Methods):**

| STT | Tên phương thức       | Mô tả                                             |
| :-- | :-------------------- | :------------------------------------------------ |
| 1   | createRentalReceipt() | Tạo phiếu thuê (khi check-in)                     |
| 2   | checkIn()             | Thực hiện nghiệp vụ check-in                      |
| 3   | checkOut()            | Thực hiện nghiệp vụ check-out (tạo hóa đơn)       |
| 4   | registerGuest()       | Đăng ký khách ở cùng (vào CHITIET_PHIEUTHUEPHONG) |

### **Lớp CHITIET_PHIEUTHUEPHONG (Control)**

**Kế thừa:** Không (Lớp liên kết cho PHIEUTHUEPHONG và KHACHHANG)

Thuộc tính:

(Không có thuộc tính riêng)

**Trách nhiệm (Methods):**

| STT | Tên phương thức       | Mô tả                            |
| :-- | :-------------------- | :------------------------------- |
| 1   | addGuestToRoom()      | Thêm khách ở cùng vào phiếu thuê |
| 2   | removeGuestFromRoom() | Xóa khách ở cùng khỏi phiếu thuê |

### **Lớp LOAIDICHVU (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                         |
| :-- | :------------- | :------ | :----------------- | :-------------------------------------- |
| 1   | MaLoaiDichVu   | Integer | private,\<\<PK\>\> | Mã loại dịch vụ (khóa chính)            |
| 2   | TenLoaiDichVu  | String  | private            | Tên loại dịch vụ (VD: Ăn uống, Giặt ủi) |

**Trách nhiệm (Methods):**

| STT | Tên phương thức     | Mô tả                 |
| :-- | :------------------ | :-------------------- |
| 1   | addServiceType()    | Thêm loại dịch vụ mới |
| 2   | updateServiceType() | Cập nhật loại dịch vụ |

### **Lớp DICHVU (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                       |
| :-- | :------------- | :------ | :----------------- | :------------------------------------ |
| 1   | MaDV           | Integer | private,\<\<PK\>\> | Mã dịch vụ (khóa chính)               |
| 2   | TenDV          | String  | private            | Tên dịch vụ (VD: Coca, Giặt áo sơ mi) |
| 3   | Gia            | Double  | private            | Giá dịch vụ                           |

**Trách nhiệm (Methods):**

| STT | Tên phương thức   | Mô tả                      |
| :-- | :---------------- | :------------------------- |
| 1   | addService()      | Thêm dịch vụ mới           |
| 2   | updateService()   | Cập nhật thông tin dịch vụ |
| 3   | setServicePrice() | Thiết lập giá dịch vụ      |

### **Lớp SUDUNGDICHVU (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                           |
| :-- | :------------- | :------ | :----------------- | :---------------------------------------- |
| 1   | MaSuDungDichVu | Integer | private,\<\<PK\>\> | Mã định danh sử dụng dịch vụ (khóa chính) |
| 2   | SoLuong        | Integer | private            | Số lượng sử dụng                          |
| 3   | ThanhTien      | Double  | private            | Thành tiền (Số lượng\* Giá)               |
| 4   | ThoiGianPhucVu | Date    | private            | Thời gian/ngày phục vụ                    |

**Trách nhiệm (Methods):**

| STT | Tên phương thức         | Mô tả                             |
| :-- | :---------------------- | :-------------------------------- |
| 1   | addServiceToRoom()      | Thêm dịch vụ cho phiếu thuê       |
| 2   | updateServiceQuantity() | Cập nhật số lượng dịch vụ đã dùng |
| 3   | recordServiceStaff()    | Ghi nhận nhân viên phục vụ        |

### **Lớp HOADON (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú               |
| :-- | :------------- | :------ | :----------------- | :---------------------------- |
| 1   | SoHD           | Integer | private,\<\<PK\>\> | Số hóa đơn (khóa chính)       |
| 2   | TongTien       | Double  | private            | Tổng tiền (chưa gồm thuế)     |
| 3   | NgayThanhToan  | Date    | private            | Ngày thanh toán               |
| 4   | MaSoThue       | String  | private            | Mã số thuế (nếu xuất hóa đơn) |
| 5   | GhiChu         | String  | private            | Ghi chú                       |
| 6   | TongTriGia     | Double  | private            | Tổng trị giá (đã gồm thuế)    |

**Trách nhiệm (Methods):**

| STT | Tên phương thức   | Mô tả                              |
| :-- | :---------------- | :--------------------------------- |
| 1   | generateInvoice() | Tạo hóa đơn (từ PhieuThuePhong)    |
| 2   | calculateTotal()  | Tính tổng tiền (từ CHITIET_HOADON) |
| 3   | processPayment()  | Xử lý thanh toán                   |
| 4   | printInvoice()    | In hóa đơn                         |

### **Lớp CHITIET_HOADON (Control)**

**Kế thừa:** Không (Lớp liên kết cho HOADON và PHIEUTHUEPHONG)

**Thuộc tính:**

| STT | Tên thuộc tính | Loại   | Ràng buộc | Ý nghĩa/ghi chú                          |
| :-- | :------------- | :----- | :-------- | :--------------------------------------- |
| 1   | SoTien         | Double | private   | Số tiền của phiếu thuê này trong hóa đơn |

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                           |
| :-- | :------------------- | :------------------------------ |
| 1   | addRentalToInvoice() | Thêm một phiếu thuê vào hóa đơn |

### **Lớp PHIEUPHAT (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú               |
| :-- | :------------- | :------ | :----------------- | :---------------------------- |
| 1   | MaPhieuPhat    | Integer | private,\<\<PK\>\> | Mã phiếu phạt (khóa chính)    |
| 2   | LyDo           | String  | private            | Lý do phạt (VD: Làm hỏng TV)  |
| 3   | SoTienPhat     | Double  | private            | Số tiền phạt                  |
| 4   | TrangThai      | String  | private            | Trạng thái (Đã thu, Chưa thu) |

**Trách nhiệm (Methods):**

| STT | Tên phương thức       | Mô tả                          |
| :-- | :-------------------- | :----------------------------- |
| 1   | createPenalty()       | Tạo phiếu phạt mới             |
| 2   | updatePenaltyStatus() | Cập nhật trạng thái phiếu phạt |

### **Lớp PHUTHU (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                       |
| :-- | :------------- | :------ | :----------------- | :------------------------------------ |
| 1   | MaPhuThu       | Integer | private,\<\<PK\>\> | Mã phụ thu (khóa chính)               |
| 2   | SoNguoiVuot    | Integer | private            | Số người vượt quy định                |
| 3   | TongTienPhuThu | Double  | private            | Tổng tiền phụ thu                     |
| 4   | LyDo           | String  | private            | Lý do phụ thu (VD: Vượt quá số người) |

**Trách nhiệm (Methods):**

| STT | Tên phương thức      | Mô tả                                   |
| :-- | :------------------- | :-------------------------------------- |
| 1   | createSurcharge()    | Tạo phụ thu mới                         |
| 2   | calculateSurcharge() | Tính toán tiền phụ thu (dựa vào THAMSO) |

### **Lớp THAMSO (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính                | Loại    | Ràng buộc | Ý nghĩa/ghi chú                        |
| :-- | :---------------------------- | :------ | :-------- | :------------------------------------- |
| 1   | SoNguoiODuocVuot              | Integer | private   | Số người tối đa được vượt              |
| 2   | SoTienPhuThu                  | Double  | private   | Tiền phụ thu mỗi người                 |
| 3   | TiLeGiaPhongCoKhachNuocNgoai  | Float   | private   | Tỉ lệ % giá phòng cho khách nước ngoài |
| 4   | SoNgayToiThieuDuocHuyDatPhong | Integer | private   | Số ngày tối thiểu để hủy đặt phòng     |

**Trách nhiệm (Methods):**

| STT | Tên phương thức        | Mô tả                       |
| :-- | :--------------------- | :-------------------------- |
| 1   | getSurchargeRate()     | Lấy mức phí phụ thu         |
| 2   | getOverCapacityLimit() | Lấy số người được phép vượt |

### **Lớp BAOCAODOANHTHU (Control)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú         |
| :-- | :------------- | :------ | :----------------- | :---------------------- |
| 1   | MaBaoCao       | Integer | private,\<\<PK\>\> | Mã báo cáo (khóa chính) |
| 2   | Thang          | Integer | private            | Tháng báo cáo           |
| 3   | Nam            | Integer | private            | Năm báo cáo             |
| 4   | TongDoanhThu   | Double  | private            | Tổng doanh thu trong kỳ |

**Trách nhiệm (Methods):**

| STT | Tên phương thức         | Mô tả                                      |
| :-- | :---------------------- | :----------------------------------------- |
| 1   | generateMonthlyReport() | Tạo báo cáo doanh thu hàng tháng           |
| 2   | viewReport()            | Xem báo cáo                                |
| 3   | derives from()          | (Mô tả logic) Lấy dữ liệu từ HOADON        |
| 4   | generates()             | (Mô tả logic) Nhân viên tạo báo cáo        |
| 5   | issued to()             | (Mô tả logic) Báo cáo được cấp cho quản lý |

### **Lớp NGUOIDUNG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú            |
| :-- | :------------- | :------ | :----------------- | :------------------------- |
| 1   | MaNguoiDung    | Integer | private,\<\<PK\>\> | Mã người dùng (khóa chính) |
| 2   | TenDangNhap    | String  | private            | Tên đăng nhập              |
| 3   | MatKhauHash    | String  | private            | Mật khẩu đã mã hóa         |

**Trách nhiệm (Methods):**

| STT | Tên phương thức        | Mô tả                                 |
| :-- | :--------------------- | :------------------------------------ |
| 1   | createAccount()        | Tạo tài khoản (liên kết với NHANVIEN) |
| 2   | updateAccount()        | Cập nhật tài khoản                    |
| 3   | deactivateAccount()    | Vô hiệu hóa tài khoản                 |
| 4   | login()                | Đăng nhập                             |
| 5   | checkPermission(quyen) | Kiểm tra quyền truy cập               |

### **Lớp NHOMNGUOIDUNG (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú                 |
| :-- | :------------- | :------ | :----------------- | :------------------------------ |
| 1   | MaNhom         | Integer | private,\<\<PK\>\> | Mã nhóm người dùng (khóa chính) |
| 2   | TenNhom        | String  | private            | Tên nhóm (Admin, Lễ tân...)     |

**Trách nhiệm (Methods):**

| STT | Tên phương thức | Mô tả                  |
| :-- | :-------------- | :--------------------- |
| 1   | manageRole()    | Quản lý vai trò (Nhóm) |
| 2   | addRole()       | Thêm vai trò mới       |
| 3   | removeRole()    | Xóa vai trò            |

### **Lớp QUYEN (Entity)**

**Kế thừa:** Không

**Thuộc tính:**

| STT | Tên thuộc tính | Loại    | Ràng buộc          | Ý nghĩa/ghi chú               |
| :-- | :------------- | :------ | :----------------- | :---------------------------- |
| 1   | MaQuyen        | Integer | private,\<\<PK\>\> | Mã quyền (khóa chính)         |
| 2   | TenQuyen       | String  | private            | Tên quyền (VD: Xem, Sửa, Xóa) |
| 3   | MoTa           | String  | private            | Mô tả chi tiết quyền          |

**Trách nhiệm (Methods):**

| STT | Tên phương thức        | Mô tả          |
| :-- | :--------------------- | :------------- |
| 1   | configurePermissions() | Cấu hình quyền |

### **Lớp PHANQUYEN (Control)**

**Kế thừa:** Không (Lớp liên kết cho NHOMNGUOIDUNG và QUYEN)

Thuộc tính:

(Không có thuộc tính riêng)

**Trách nhiệm (Methods):**

| STT | Tên phương thức    | Mô tả                   |
| :-- | :----------------- | :---------------------- |
| 1   | assignPermission() | Gán quyền cho nhóm      |
| 2   | revokePermission() | Thu hồi quyền khỏi nhóm |

### **Lớp TrangThaiPhongStatus (Entity (Enum))**

**Thuộc tính:**

- Available
- Occupied
- Reserved
- Cleaning
- Maintenance

### **Lớp TinhTrangDatPhongStatus (Entity (Enum))**

**Thuộc tính:**

- Confirmed
- Pending
- Cancelled

### **Lớp TinhTrangLamViecStatus (Entity (Enum))**

**Thuộc tính:**

- Active
- Inactive

# 2. **Sơ đồ trạng thái**

## **2.1 Sơ đồ trạng thái cho lớp Phong (Room)**

plant uml code here

**Danh sách các trạng thái:**

1. **Trống (Available):** Phòng đang trống và sẵn sàng để cho khách đặt hoặc thuê.
2. **Đã đặt (Reserved):** Phòng đã được khách hàng đặt trước nhưng chưa đến nhận phòng.
3. **Đang sử dụng (Occupied):** Khách hàng đã nhận phòng và đang trong thời gian lưu trú.
4. **Cần dọn dẹp (Needs Cleaning):** Khách đã trả phòng, phòng cần được dọn dẹp trước khi khách mới có thể nhận.
5. **Đang dọn dẹp (Cleaning in Progress):** Nhân viên dọn phòng đang thực hiện công việc vệ sinh.
6. **Bảo trì (Maintenance):** Phòng đang trong quá trình sửa chữa hoặc bảo trì, không khả dụng để cho thuê.

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)               | Hành động (Action)                                         | Trạng thái kết thúc |
| :----------------- | :---------------------------- | :--------------------------------------------------------- | :------------------ |
| Trống              | Khách đặt phòng               | Tạo `DatPhong`, cập nhật lịch phòng                        | Đã đặt              |
| Trống              | Khách vãng lai check-in       | Tạo `ThuePhong` trực tiếp                                  | Đang sử dụng        |
| Trống              | Báo hỏng/cần sửa chữa         | Tạo ghi chú, khóa phòng trên hệ thống                      | Bảo trì             |
| Đã đặt             | Khách check-in                | Cập nhật `DatPhong` thành `DA_NHAN_PHONG`, tạo `ThuePhong` | Đang sử dụng        |
| Đã đặt             | Khách hủy đặt phòng           | Cập nhật `DatPhong` thành `DA_HUY_TRA_PHONG`               | Trống               |
| Đang sử dụng       | Khách check-out và thanh toán | Tạo `TraPhong`, tạo `HoaDon`                               | Cần dọn dẹp         |
| Cần dọn dẹp        | Nhân viên bắt đầu dọn         | Gửi thông báo cho quản lý                                  | Đang dọn dẹp        |
| Đang dọn dẹp       | Nhân viên dọn xong            | Cập nhật trạng thái trên hệ thống                          | Trống               |
| Bảo trì            | Sửa chữa hoàn tất             | Cập nhật trạng thái trên hệ thống                          | Trống               |

## **2.2 Sơ đồ trạng thái cho lớp DatPhong (Booking)**

Lớp **DatPhong** quản lý vòng đời của một yêu cầu đặt phòng từ lúc được tạo cho đến khi hoàn tất hoặc bị hủy.

plant uml code here

**Danh sách các trạng thái:**

1. **Chờ xác nhận (Pending Confirmation):** Đặt phòng đã được tạo nhưng đang chờ xử lý, ví dụ như chờ thanh toán tiền cọc.
2. **Chưa nhận phòng (Confirmed / Not Checked-in):** Đặt phòng đã được xác nhận (đã cọc tiền) và đang chờ khách đến nhận phòng.
3. **Đã nhận phòng (Checked-in):** Khách hàng đã hoàn tất thủ tục check-in và nhận phòng.
4. **Đã trả phòng (Checked-out):** Khách hàng đã trả phòng và hoàn tất thanh toán.
5. **Đã hủy (Canceled):** Đặt phòng đã bị hủy bởi khách hàng hoặc hệ thống.

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)                         | Hành động (Action)                              | Trạng thái kết thúc |
| :----------------- | :-------------------------------------- | :---------------------------------------------- | :------------------ |
| (Mới)              | Khách hàng/Lễ tân tạo yêu cầu đặt phòng | Hệ thống tạo `DatPhong`                         | Chờ xác nhận        |
| Chờ xác nhận       | Khách thanh toán cọc thành công         | Ghi nhận thanh toán cọc, gửi email/SMS xác nhận | Chưa nhận phòng     |
| Chờ xác nhận       | Hết hạn thanh toán cọc                  | Tự động hủy đặt phòng, giải phóng phòng         | Đã hủy              |
| Chưa nhận phòng    | Khách hàng đến check-in                 | Tạo `ThuePhong` từ `DatPhong`                   | Đã nhận phòng       |
| Chưa nhận phòng    | Khách/Lễ tân hủy đặt phòng              | Xử lý hoàn tiền cọc (nếu có), giải phóng phòng  | Đã hủy              |
| Đã nhận phòng      | Khách hàng check-out                    | Tạo `TraPhong` và `HoaDon`                      | Đã trả phòng        |

## **2.3 Sơ đồ trạng thái cho lớp HoaDon (Invoice)**

Lớp **HoaDon** thể hiện quy trình xử lý tài chính sau khi khách hàng sử dụng dịch vụ và trả phòng.

![][image3]

**Danh sách các trạng thái:**

1. **Chưa thanh toán (Unpaid):** Hóa đơn đã được tạo ra (thường là khi check-out) nhưng chưa được thanh toán đầy đủ.
2. **Đã thanh toán (Paid):** Khách hàng đã thanh toán toàn bộ số tiền trên hóa đơn.
3. **Đã hủy (Voided):** Hóa đơn bị hủy do có sai sót hoặc các lý do nghiệp vụ khác, cần có sự cho phép của quản lý.

**Bảng mô tả các biến cố và hành động:**

| Trạng thái bắt đầu | Biến cố (Event)                      | Hành động (Action)                                              | Trạng thái kết thúc |
| :----------------- | :----------------------------------- | :-------------------------------------------------------------- | :------------------ |
| (Mới)              | Lễ tân thực hiện check-out cho khách | Tạo `HoaDon` từ `TraPhong`, tổng hợp chi phí                    | Chưa thanh toán     |
| Chưa thanh toán    | Khách thanh toán thành công          | Ghi nhận giao dịch, cập nhật trạng thái `ThuePhong`, in hóa đơn | Đã thanh toán       |
| Chưa thanh toán    | Quản lý hủy hóa đơn (do lỗi)         | Ghi nhận lý do hủy, mở lại `ThuePhong` để điều chỉnh            | Đã hủy              |
