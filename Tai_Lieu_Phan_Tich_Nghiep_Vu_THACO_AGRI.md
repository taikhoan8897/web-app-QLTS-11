# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ VÀ ĐẶC TẢ YÊU CẦU HỆ THỐNG
## HỆ THỐNG QUẢN LÝ TÀI SẢN, DỊCH VỤ HOẠT ĐỘNG & THU MUA - THACO AGRI (BẢN CẬP NHẬT ĐẦY ĐỦ)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG

### 1.1. Bối cảnh
Hệ thống phục vụ quản lý tập trung tài sản có định danh (theo dõi từng thiết bị vật lý kèm **Hãng sản xuất, Dòng máy, Cấu hình kỹ thuật, Số Serial, Mã QR**), vật tư tiêu hao, chi phí dịch vụ hoạt động, kho các đơn vị, phiếu đề xuất cấp phát từ cán bộ nhân viên (CBNV) theo 4 biểu mẫu chuẩn, ticket sự cố kỹ thuật IT/Bảo trì, trung tâm gom nhu cầu đơn hàng thu mua (Gom PO Hub) và hệ thống 4 báo cáo quản trị chi phí trọng tâm.

### 1.2. Mục tiêu cốt lõi
- **Chuẩn hóa cơ cấu tổ chức 3 bảng quan hệ**: `Đơn vị (OrganizationUnits)` ➔ `Phòng ban (Departments)` ➔ `Nhân viên (Employees)` kèm Chức vụ (`position`) và Vai trò phân quyền (`RBAC`).
- **Quản lý Tài sản định danh chi tiết theo Hãng & Cấu hình**:
  - Người dùng (CBNV) khi tạo đề xuất chỉ cần chọn chủng loại chung (ví dụ: `Laptop`, `Máy tính để bàn`).
  - Thu mua (khi lập PO), Thủ kho (khi định danh nhập kho, theo dõi bảng tồn kho, và cấp phát thiết bị) quản lý chi tiết **Hãng sản xuất (`brand`), Dòng máy (`model_name`) và Cấu hình kỹ thuật (`specifications`)**.
- **Chuẩn hóa 4 biểu mẫu Đề xuất cấp phát động (`/public/form/`)**:
  - Tự động thay đổi giao diện nhập liệu theo đúng 1 trong 4 loại yêu cầu cấp phát và xuất file điền tự động vào đúng các vị trí trong biểu mẫu gốc (`BM_VPP01.xlsx`, `BM_DP01.xlsx`, `BM_MT01.docx`, `BM_CNTT01.xlsx`).
- **Hỗ trợ chỉnh sửa (Edit) phiếu đã tạo**:
  - Cho phép sửa trực tiếp phiếu Đề xuất cấp phát (`NHAP`, `CHO_TIEP_NHAN`) và Ticket sự cố kỹ thuật (`MOI`, `DANG_XU_LY`).
- **Cấu hình Cây Danh Mục Chi Phí Dịch Vụ 3 tầng tại Quản trị Hệ thống**:
  - Đặt tại chức năng **Cấu Hình & Quản Trị Hệ Thống** ➔ Tab **1. Cây Danh Mục Chi Phí**.
  - Chuẩn hóa 2 khối chi phí đánh số: `1. CHI PHÍ VẬN HÀNH & CÔNG TÁC (CPVH)` và `2. CHI PHÍ GIAO TẾ & PHÚC LỢI (CPPL)`.
- **Hệ thống 4 Báo cáo Quản trị lọc theo thời gian & kết xuất Excel (`.xlsx`)**:
  1. Chi phí theo nhóm danh mục (`1a. Tài sản tiêu hao`, `1b. Tài sản định danh`, `1c. Dịch vụ` lọc theo Khối chi phí & Nhóm chi phí)
  2. Chi phí theo Nhà cung cấp
  3. Chi phí theo Tên thiết bị
  4. Chi phí theo Đơn vị

---

## 2. PHẠM VI CHỨC NĂNG CÁC PHÂN HỆ

| Mã | Phân hệ | Chức năng chính | Kết quả nghiệp vụ |
|---|---|---|---|
| **M1** | **Cấu hình & Quản trị Hệ thống** | 1. Cây Danh Mục Chi Phí (`1. CPVH` & `2. CPPL`); 2. Bảng Nhân viên; 3. Bảng Phòng ban; 4. Bảng Đơn vị; 5. Cây Quan hệ 3 Bảng; 6. Nhà cung cấp; 7. Danh mục hàng hóa (kèm cấu hình Hãng & Model); 8. Bảng Kho; 9. Phân quyền RBAC; 10. SQL Server 2022; 11. Sổ Kiểm toán. | Dữ liệu nền chuẩn hóa, ràng buộc khóa ngoại chặt chẽ và truy vết toàn bộ lịch sử cấu hình. |
| **M2** | **Kho trung tâm & Quản lý Tài sản** | Nhập kho tiêu hao; Khai báo định danh tài sản từ PO (chọn Hãng, Model, Cấu hình, Serial, QR); Cấp phát; Thu hồi; Thanh lý; Bảng tồn kho hiển thị rõ Hãng & Cấu hình. | Biết chính xác tài sản/vật tư đang ở kho nào, thuộc Hãng/Cấu hình gì, ai đang sử dụng. |
| **M3** | **Đề xuất cấp phát (4 biểu mẫu động)** | Tạo & Sửa đề xuất cấp phát theo 4 biểu mẫu: Văn phòng phẩm (`BM_VPP01`), Đồng phục (`BM_DP01`), Máy tính/Laptop (`BM_MT01`), Thiết bị CNTT (`BM_CNTT01`); Xuất file tự động điền đúng vị trí; Thủ kho tiếp nhận, cấp phát hoặc chuyển gom PO. | Hiển thị đúng tên người đề xuất/người nhận theo từng loại yêu cầu và xuất đúng file trình ký chuẩn. |
| **M4** | **Sự cố IT & Bảo trì** | Tạo & Sửa ticket sự cố; Kỹ thuật tiếp nhận và đề xuất phương án theo 3 kịch bản (`Sửa tại chỗ`, `Sửa chữa/Thay thế`, `Thu hồi cấp mới`); Đính kèm file trình ký duyệt để tự động sinh yêu cầu cấp phát/gom PO. | Kiểm soát tiến độ xử lý sự cố kỹ thuật và chi phí sửa chữa/thay thế linh kiện. |
| **M5** | **Đơn hàng thu mua (Gom PO Hub)** | Gom nhu cầu mua sắm tách biệt Định danh và Tiêu hao; Chọn Hãng & Cấu hình khi đặt mua; Cập nhật đơn giá thực tế & Nhà cung cấp; Xử lý giao đủ hoặc giao thiếu (sinh PO con). | Theo dõi xuyên suốt từ nhu cầu đến PO, nhận hàng và định danh tài sản. |
| **M6** | **Chi phí dịch vụ hoạt động** | Lập và quản lý phiếu chi phí dịch vụ gắn với Cây Danh Mục Chi Phí (`1. CPVH` & `2. CPPL`), Nhà cung cấp và Đơn vị chịu chi phí. | Quản trị tập trung toàn bộ chi phí dịch vụ vận hành và phúc lợi. |
| **M7** | **Báo cáo & Xuất Excel** | 4 báo cáo quản trị lọc theo khoảng thời gian (`Từ ngày - Đến ngày`) và xuất file Excel (`.xlsx`). | Tổng hợp chi phí minh bạch, chính xác theo thời gian, nhóm danh mục, nhà cung cấp, thiết bị và đơn vị. |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC NGHIỆP VỤ CẬP NHẬT MỚI

### 3.1. Quản lý Hãng sản xuất (`brand`), Dòng máy (`model_name`) & Cấu hình (`specifications`) cho Tài sản định danh
- **Khi CBNV tạo đề xuất**: Người dùng chỉ cần yêu cầu chủng loại thiết bị chung (ví dụ: `Laptop` hoặc `Máy tính để bàn`).
- **Trong Danh mục hàng hóa (`Categories`)**: Mỗi danh mục định danh lưu danh sách các tùy chọn Hãng & Cấu hình chuẩn (`brand_configs`), ví dụ với Laptop:
  - *Dell*: Dell Latitude 5440 (`Core i5-1335U / RAM 16GB / SSD 512GB / 14" FHD`)
  - *HP*: HP ProBook 440 G10 (`Core i5-1340P / RAM 16GB / SSD 512GB / 14" FHD`)
  - *Lenovo*: Lenovo ThinkPad T14 Gen 4 (`Core i7-1355U / RAM 16GB / SSD 512GB / 14" WUXGA`)
  - *Asus*: Asus ExpertBook B5 (`Core i5-1340P / RAM 16GB / SSD 512GB / 14" FHD`)
  - *Apple*: MacBook Air M2 (`Chip Apple M2 / RAM 16GB / SSD 512GB / 13.6" Liquid Retina`)
- **Khi Thu mua lập PO & Thủ kho định danh / Cấp phát**:
  - Chọn rõ Hãng sản xuất, Dòng máy và Cấu hình chi tiết.
  - Bảng tồn kho tài sản định danh hiển thị cột **Hãng & Dòng máy** và **Cấu hình kỹ thuật**, đồng thời cho phép lọc nhanh theo từng Hãng sản xuất.

---

### 3.2. Quy tắc 4 Biểu mẫu động tại chức năng Tạo Đề Xuất Cấp Phát Mới (`/public/form/`)

Khi chọn 1 trong 4 loại yêu cầu, form nhập liệu tự động chuyển đổi tương ứng và xuất file điền đúng vị trí trong biểu mẫu gốc:

#### 1) Đề xuất cấp Văn phòng phẩm (`BM_VPP01.xlsx`)
- **Tên hiển thị trên danh sách yêu cầu**: Tên **Người đề xuất**.
- **Trường nhập liệu**:
  - Mục đích đề xuất
  - Danh sách mặt hàng cần đề xuất & Số lượng (có thể thêm nhiều hàng; danh sách mặt hàng tự động lọc chỉ hiển thị các vật tư thuộc nhóm **Văn phòng phẩm & vật tư**).
- **Khi xuất file `BM_VPP01.xlsx`**:
  - Điền Người yêu cầu – Chức vụ, Phòng ban, Mục đích và danh sách Tên mặt hàng + Đơn vị tính + Số lượng vào đúng các vị trí trong biểu mẫu `BM_VPP01.xlsx`.

#### 2) Đề xuất cấp Đồng phục (`BM_DP01.xlsx`)
- **Tên hiển thị trên danh sách yêu cầu**: Tên **Người nhận (người được đề xuất cấp)**.
- **Trường nhập liệu**:
  - Danh sách người cần cấp (có thể thêm nhiều người nhận: Họ tên, Giới tính, Chức vụ).
  - Danh sách tên đồng phục cần cấp (Tên vật tư đồng phục, Số lượng) đi theo từng người cần cấp ở trên.
- **Khi xuất file `BM_DP01.xlsx`**:
  - Điền Người yêu cầu, Đơn vị, Phòng/ban người yêu cầu, Chức vụ người yêu cầu, Họ tên người nhận & Chức vụ người nhận.
  - Nếu có nhiều hơn 1 người nhận: Tự động chèn thêm các cặp hàng tiếp theo để điền đầy đủ Họ tên và Chức vụ từng người nhận.
  - Bảng chi tiết bên dưới điền: Người cần cấp – Giới tính – Chức vụ – Tên vật tư – Số lượng tương ứng (tự động chèn thêm hàng khi có nhiều dòng).

#### 3) Đề xuất cấp Máy tính / Laptop (`BM_MT01.docx`)
- **Tên hiển thị trên danh sách yêu cầu**: Tên **Người cần cấp (người sử dụng)**.
- **Trường nhập liệu**:
  - Chọn loại máy: `Máy tính để bàn` hoặc `Laptop` (mặc định mặt hàng đề xuất tự động lấy theo lựa chọn này, không cần bảng chọn danh mục mặt hàng thủ công).
  - Tên người sử dụng, Chức vụ, Ban/Phòng người sử dụng, Bộ phận, Ngày nhận việc, Mục đích sử dụng.
- **Khi xuất file Word `BM_MT01.docx`**:
  - Điền Người làm đề nghị, Phòng/ban người đề nghị, Đơn vị, Ngày/tháng/năm hiện tại, Tick chọn `☑` Máy tính bàn hoặc Laptop, Tên người sử dụng, Chức vụ, Ban/Phòng người sử dụng, Bộ phận, Ngày nhận việc, Mục đích sử dụng vào đúng các vị trí trong biểu mẫu `BM_MT01.docx`.

#### 4) Đề xuất cấp Thiết bị CNTT (`BM_CNTT01.xlsx`)
- **Tên hiển thị trên danh sách yêu cầu**: Tên **Người chịu trách nhiệm (người sử dụng)**.
- **Trường nhập liệu**:
  - Mục đích sử dụng
  - Người chịu trách nhiệm / bàn giao
  - Danh sách mặt hàng cần đề xuất – Số lượng (có thể thêm nhiều hàng; ở mặt hàng chỉ xuất hiện những vật tư liên quan đến **Thiết bị CNTT**).
- **Khi xuất file `BM_CNTT01.xlsx`**:
  - Điền Người đề xuất, Chức vụ người đề xuất, Mục đích sử dụng, Ngày/tháng/năm hiện tại và bảng Loại mặt hàng đề xuất – Số lượng – Người chịu trách nhiệm vào đúng vị trí trong biểu mẫu `BM_CNTT01.xlsx`.

---

### 3.3. Cấu trúc Cây Danh Mục Chi Phí Dịch Vụ (Tại Cấu hình Hệ thống)
- **1. CHI PHÍ VẬN HÀNH & CÔNG TÁC (`CPVH`)**:
  - *Chi phí Công tác & Tiếp khách (`CPVH-CT`)*:
    - `CPVH-CT-MS`: Di chuyển, lưu trú
    - `CPVH-CT-TK`: Ăn uống, hội nghị
  - *Chi phí Văn phòng & Hạ tầng (`CPVH-VP`)*:
    - `CPVH-VP-SUA`: Bảo trì & Sửa chữa
    - `CPVH-VP-THU`: Thuê ngoài
    - `CPVH-VP-VT`: Viễn thông & Chuyển phát
    - `CPVH-VP-MT`: Môi trường & Tiện ích
  - *Chi phí Năng lượng & Nhiên liệu (`CPVH-NL`)*:
    - `CPVH-NL-SH`: Điện nước sinh hoạt
    - `CPVH-NL-XE`: Xăng dầu
  - *Chi phí Xe & Phí hành chính (`CPVH-XE`)*:
    - `CPVH-XE`: Các loại phí & Sửa chữa xe
- **2. CHI PHÍ GIAO TẾ & PHÚC LỢI (`CPPL`)**:
  - `CPPL-NV`: Phúc lợi Nội bộ (CB-NV)
  - `CPPL-KH`: Giao tế Đối ngoại

---

### 3.4. Đặc tả 4 Báo cáo Quản trị (Lọc theo thời gian & Xuất Excel `.xlsx`)
Tất cả 4 báo cáo đều hỗ trợ bộ lọc khoảng thời gian (`Từ ngày` - `Đến ngày`), bộ lọc nhanh (`Tháng này`, `Quý này`, `Năm nay`, `Tất cả`) và nút **Xuất Excel (.xlsx)**:
1. **Báo cáo 1 – Chi phí theo nhóm danh mục**:
   - **1a. Tài sản tiêu hao**: Thống kê chi phí xuất cấp & mua sắm vật tư tiêu hao theo nhóm danh mục.
   - **1b. Tài sản định danh**: Thống kê chi phí đầu tư tài sản định danh theo nhóm thiết bị.
   - **1c. Dịch vụ**: Lọc sâu theo **Khối chi phí** (`1. CHI PHÍ VẬN HÀNH & CÔNG TÁC` / `2. CHI PHÍ GIAO TẾ & PHÚC LỢI`) và theo **Nhóm chi phí**.
2. **Báo cáo 2 – Chi phí theo Nhà cung cấp**:
   - Tổng hợp doanh số mua sắm PO (Định danh + Tiêu hao) và Chi phí dịch vụ theo từng Nhà cung cấp.
3. **Báo cáo 3 – Chi phí theo Tên thiết bị**:
   - Tổng hợp chi phí mua mới và sửa chữa/bảo trì theo từng Tên thiết bị / Mặt hàng (kèm thông tin Hãng & Cấu hình).
4. **Báo cáo 4 – Chi phí theo Đơn vị**:
   - Tổng hợp toàn diện 3 khoản mục (Tài sản tiêu hao + Tài sản định danh + Chi phí dịch vụ) theo từng Đơn vị pháp nhân / Khu liên hợp.
