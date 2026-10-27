# Kế Hoạch Cấu Hình & Tối Ưu Nhập Liệu Danh Mục Chi Phí Chuẩn THACO AGRI

Tích hợp toàn bộ cây danh mục chuẩn hai cấp gồm **Chi phí Vận hành & Công tác (CPVH)** và **Chi phí Giao tế & Phúc lợi (CPPL)** vào hệ thống, đồng thời nâng cấp giao diện nhập chi phí theo cơ chế **chọn nhóm cha ➔ tự động lọc danh sách tên chi phí chi tiết** và tự động sinh mã chuẩn có số thứ tự tăng dần.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định thiết kế đã được người dùng lựa chọn và thống nhất:

- **Cơ chế chọn khi nhập liệu**: Tối ưu trải nghiệm bằng cơ chế lọc phân cấp 2 bước:
  1. *Bước 1*: Chọn Nhóm chi phí lớn / Nhóm con (Ví dụ: `CPVH-CT-MS: Di chuyển, lưu trú` hoặc `CPVH-VP-SUA: Bảo trì & Sửa chữa`).
  2. *Bước 2*: Danh sách Tên chi phí bên dưới lập tức được lọc gọn gàng theo đúng nhóm đã chọn (kèm tính năng gõ tìm kiếm nhanh), giúp người dùng không bị hoa mắt giữa hàng chục khoản chi phí và không bao giờ chọn nhầm nhóm.
- **Cấu trúc mã chi phí**: Tự động sinh mã chi tiết theo tiền tố nhóm cha kèm đuôi số thứ tự tăng dần (Ví dụ: `CPVH-CT-MS-01: Dịch vụ vé máy bay`, `CPVH-CT-MS-02: Dịch vụ khách sạn`...).
- **Nạp dữ liệu danh mục**: Nạp đầy đủ 100% tất cả các danh mục chi phí theo cây chuẩn THACO AGRI vào cả cơ sở dữ liệu backend (`server/db/store.ts`), file mock seed (`server/data/initialData.ts`, `src/mockData.ts`) và giao diện Quản trị hệ thống.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Chuẩn hóa toàn bộ hệ thống phân loại chi phí dịch vụ của doanh nghiệp theo 2 nhóm gốc lớn:
  1. **Nhóm V - CPVH (Chi phí Vận hành & Công tác)**:
     - `CPVH-CT`: Chi phí Công tác & Tiếp khách (Di chuyển lưu trú `CPVH-CT-MS`, Ăn uống hội nghị `CPVH-CT-TK`).
     - `CPVH-VP`: Chi phí Văn phòng & Hạ tầng (Bảo trì sửa chữa `CPVH-VP-SUA`, Thuê ngoài `CPVH-VP-THU`, Viễn thông chuyển phát `CPVH-VP-VT`, Môi trường tiện ích `CPVH-VP-MT`).
     - `CPVH-NL`: Chi phí Năng lượng & Nhiên liệu (Điện nước sinh hoạt `CPVH-NL-SH`, Xăng dầu chạy máy/xe `CPVH-NL-XE`).
     - `CPVH-XE`: Chi phí Xe & Phí hành chính (Cầu đường, đăng kiểm, rửa xe, bảo hiểm, sửa xe...).
  2. **Nhóm VI - CPPL (Chi phí Giao tế & Phúc lợi)**:
     - `CPPL-NV`: Phúc lợi Nội bộ CB-NV (Ốm đau thai sản, hiếu hỉ tang chế, hoa chúc mừng, quà tết, vé phép...).
     - `CPPL-KH`: Giao tế Đối ngoại (Quà tặng đối tác/khách hàng, hoa chúc mừng/chia buồn khách hàng).
- **Giá trị mang lại**: Giúp việc hạch toán, tổng hợp chi phí hàng tháng, quý của phòng Thu mua, Kế toán và Ban Lãnh đạo trở nên khoa học, dễ phân bổ theo từng bộ phận và đối soát theo nhà cung cấp.

---

## 2. User Experience & Visual Design

### Quy Trình Nhập Liệu Hợp Lý & Tiện Lợi (Form Modal)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Modal Nhập Phiếu Chi Phí Dịch Vụ]                                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Thời gian phát sinh: [ 2026-10-26 14:30 ]                           │
│                                                                        │
│ 2. Nhóm Chi Phí Cha:                                                   │
│    [ CPVH-CT-MS: Di chuyển, lưu trú                                ▼ ] │
│                                                                        │
│ 3. Tên Chi Phí Chi Tiết (Tự động lọc theo nhóm cha đã chọn):           │
│    [ Dịch vụ vé máy bay (CPVH-CT-MS-01)                           ▼ ] │
│    *(Tự động điền Loại áp dụng & Diễn giải gợi ý)*                     │
│                                                                        │
│ 4. Nhà Cung Cấp:                                                       │
│    [ Công ty CP Vận tải Giao Nhận THILOGI                         ▼ ] │
│                                                                        │
│ 5. Số Tiền (VND):                                                      │
│    [ 12,500,000 VND ]  => Mười hai triệu năm trăm nghìn đồng           │
│                                                                        │
│ 6. Diễn giải chi tiết & Số hóa đơn chứng từ:                           │
│    [ Vé máy bay đoàn công tác Pleiku - Chu Lai theo quyết định số... ] │
└────────────────────────────────────────────────────────────────────────┘
```

- **Hỗ trợ gõ tìm kiếm thông minh**: Trong trường hợp người dùng muốn gõ trực tiếp tên dịch vụ (ví dụ: gõ *"mực in"* hoặc *"vé máy bay"*), hệ thống tự động tìm đúng tên mục và tự động chọn nhóm cha tương ứng.
- **Thẻ hiển thị mã chuẩn**: Mỗi hàng trong bảng kê chi phí hiển thị rõ ràng mã nhóm và mã chi tiết dạng huy hiệu font mono chuẩn (`CPVH-CT-MS-01`), phân tách màu sắc nhẹ nhàng giữa chi phí vận hành (xanh lục/xanh lam) và chi phí phúc lợi (tím/hồng).

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Mở rộng trường `parent_group` và `group_code` trong Schema `ExpenseCategory`**:
  - *Lý do*: Cho phép một danh mục vừa có tên chi tiết, vừa thuộc về một nhóm cha xác định, giúp lọc cascade mượt mà mà vẫn giữ nguyên cấu trúc phẳng khi cần truy vấn đơn giản.
- **Quyết định 2: Tự động điền Loại áp dụng khi chọn Nhóm cha**:
  - *Lý do*: Giảm bớt số lần thao tác chuột và phím của người nhập liệu, đảm bảo số liệu báo cáo luôn nhất quán 100%.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CÂY DANH MỤC CHI PHÍ CHUẨN                      │
└────────────────────────────────────────────────────────────────────────┘
            │                                              │
            ▼                                              ▼
┌───────────────────────────────────┐    ┌──────────────────────────────────┐
│   V. VẬN HÀNH & CÔNG TÁC (CPVH)   │    │  VI. GIAO TẾ & PHÚC LỢI (CPPL)   │
├───────────────────────────────────┤    ├──────────────────────────────────┤
│ - CPVH-CT-MS: Di chuyển, lưu trú  │    │ - CPPL-NV: Phúc lợi Nội bộ CB-NV │
│ - CPVH-CT-TK: Ăn uống, hội nghị   │    │ - CPPL-KH: Giao tế Đối ngoại     │
│ - CPVH-VP-SUA: Bảo trì, sửa chữa  │    └──────────────────────────────────┘
│ - CPVH-VP-THU: Thuê ngoài văn phòng                                    
│ - CPVH-VP-VT: Viễn thông, bưu điện                                     
│ - CPVH-VP-MT: Môi trường, tiện ích                                     
│ - CPVH-NL-SH: Điện nước sinh hoạt                                      
│ - CPVH-NL-XE: Xăng dầu máy móc/xe                                      
│ - CPVH-XE: Phí cầu đường, xe cộ                                        
└───────────────────────────────────┘
```

### Chi Tiết Cấu Hình Dữ Liệu (Seed Items)

```typescript
export interface ExpenseCategory {
  expense_category_id: string;
  code: string;           // VD: "CPVH-CT-MS-01"
  name: string;           // VD: "Dịch vụ vé máy bay"
  group_code: string;     // VD: "CPVH-CT-MS"
  group_name: string;     // VD: "Di chuyển, lưu trú (Công tác & Tiếp khách)"
  category_type: string;  // VD: "V. Chi phí Vận hành & Công tác"
  description?: string;
  is_active: boolean;
  created_at: string;
}
```

---

## 5. Kế Hoạch Các Bước Triển Khai Chi Tiết

1. **Cập nhật Schema & Data Seeds**:
   - Cập nhật `src/types.ts` và `server/types.ts` bổ sung `group_code`, `group_name` cho `ExpenseCategory`.
   - Nạp đầy đủ toàn bộ 34+ danh mục chi tiết thuộc đầy đủ các nhóm V và VI vào `server/data/initialData.ts` và `src/mockData.ts`.
2. **Cập nhật Backend Store**:
   - Cập nhật `server/db/store.ts` để đồng bộ lại dữ liệu danh mục chuẩn vào `db.json`.
3. **Nâng cấp Giao diện Nhập Chi Phí (`ServiceExpensesView.tsx`)**:
   - Bổ sung bộ chọn 2 bước (Cascade selector): Chọn Nhóm chi phí ➔ Lọc Tên chi phí chi tiết.
   - Thêm bộ lọc nhóm chi phí trên thanh công cụ bảng danh sách.
   - Hiển thị badge mã chi tiết chuẩn (`CPVH-...`, `CPPL-...`) trên từng dòng chi phí.
4. **Nâng cấp Cấu hình Danh Mục trong Quản Trị Hệ Thống (`SqlServerAdminView.tsx`)**:
   - Cập nhật bảng Danh mục chi phí dịch vụ hiển thị phân nhóm cây, bộ lọc theo nhóm cha V/VI và form thêm/sửa có chọn nhóm cha.
5. **Biên dịch & Kiểm thử**:
   - Chạy `lint_applet` và `compile_applet` đảm bảo 0 lỗi biên dịch.
   - Restart dev server.
