-- ==========================================================================================
-- TỔNG CÔNG TY NÔNG NGHIỆP THACO (THACO AGRI)
-- HỆ THỐNG QUẢN LÝ TÀI SẢN, DỊCH VỤ HOẠT ĐỘNG & THU MUA
-- 
-- FILE: ThacoAgri_Database_SQLServer2019.sql
-- MÔ TẢ: KỊCH BẢN TỰ ĐỘNG TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU & NẠP DỮ LIỆU MẪU BAN ĐẦU
-- HỆ QUẢN TRỊ CSDL: Microsoft SQL Server 2019 / 2022 (Tương thích cả 2016, 2017)
-- 
-- HƯỚNG DẪN THỰC THI NHANH TRÊN MÁY TÍNH CÁ NHÂN:
-- 1. Mở Microsoft SQL Server Management Studio (SSMS) hoặc Azure Data Studio.
-- 2. Kết nối tới SQL Server của bạn (ví dụ: localhost hoặc .\SQLEXPRESS).
-- 3. Mở file .sql này (File -> Open -> File...).
-- 4. Bấm nút [Execute] hoặc phím tắt [F5] trên bàn phím.
-- 5. Toàn bộ CSDL ThacoAgri_AssetDB, 15 bảng, chỉ mục và dữ liệu mẫu sẽ được tạo trong 2 giây!
-- ==========================================================================================

USE master;
GO

-- 1. TẠO CƠ SỞ DỮ LIỆU NẾU CHƯA CÓ
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'ThacoAgri_AssetDB')
BEGIN
    PRINT N'Đang khởi tạo Database ThacoAgri_AssetDB với bảng mã Vietnamese_CI_AS...';
    CREATE DATABASE ThacoAgri_AssetDB COLLATE Vietnamese_CI_AS;
END
ELSE
BEGIN
    PRINT N'Database ThacoAgri_AssetDB đã tồn tại. Đang chuyển sang ngữ cảnh làm việc...';
END
GO

USE ThacoAgri_AssetDB;
GO

-- 2. DỌN DẸP BẢNG CŨ NẾU ĐÃ TỒN TẠI (THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI)
IF OBJECT_ID('dbo.InventoryTransactions', 'U') IS NOT NULL DROP TABLE dbo.InventoryTransactions;
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.AssetEvents', 'U') IS NOT NULL DROP TABLE dbo.AssetEvents;
IF OBJECT_ID('dbo.TransferLines', 'U') IS NOT NULL DROP TABLE dbo.TransferLines;
IF OBJECT_ID('dbo.Transfers', 'U') IS NOT NULL DROP TABLE dbo.Transfers;
IF OBJECT_ID('dbo.TicketMaterials', 'U') IS NOT NULL DROP TABLE dbo.TicketMaterials;
IF OBJECT_ID('dbo.SupportTickets', 'U') IS NOT NULL DROP TABLE dbo.SupportTickets;
IF OBJECT_ID('dbo.RequestLines', 'U') IS NOT NULL DROP TABLE dbo.RequestLines;
IF OBJECT_ID('dbo.Requests', 'U') IS NOT NULL DROP TABLE dbo.Requests;
IF OBJECT_ID('dbo.PurchaseOrderLines', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrderLines;
IF OBJECT_ID('dbo.PurchaseOrders', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrders;
IF OBJECT_ID('dbo.ProcurementDemands', 'U') IS NOT NULL DROP TABLE dbo.ProcurementDemands;
IF OBJECT_ID('dbo.StockBalances', 'U') IS NOT NULL DROP TABLE dbo.StockBalances;
IF OBJECT_ID('dbo.Assets', 'U') IS NOT NULL DROP TABLE dbo.Assets;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Warehouses', 'U') IS NOT NULL DROP TABLE dbo.Warehouses;
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL DROP TABLE dbo.Employees;
IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL DROP TABLE dbo.Departments;
IF OBJECT_ID('dbo.OrganizationUnits', 'U') IS NOT NULL DROP TABLE dbo.OrganizationUnits;
GO

PRINT N'>> Bắt đầu tạo cấu trúc bảng...';
GO

-- ==========================================================================================
-- PHẦN I: KHỞI TẠO CẤU TRÚC 15 BẢNG CHUẨN QUAN HỆ (DDL)
-- ==========================================================================================

-- 1. BẢNG ĐƠN VỊ (OrganizationUnit)
CREATE TABLE dbo.OrganizationUnits (
    unit_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    short_name NVARCHAR(100) NOT NULL,
    parent_unit_id NVARCHAR(50) NULL,
    address NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_OrgUnit_Parent FOREIGN KEY (parent_unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 2. BẢNG PHÒNG BAN (Department)
CREATE TABLE dbo.Departments (
    department_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    unit_id NVARCHAR(50) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Department_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 3. BẢNG NHÂN VIÊN (Employee)
CREATE TABLE dbo.Employees (
    employee_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    employee_code NVARCHAR(50) NOT NULL UNIQUE,
    full_name NVARCHAR(200) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    department_id NVARCHAR(50) NOT NULL,
    position NVARCHAR(100) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('CBNV', 'THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY')),
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Employee_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Employee_Dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

-- 4. BẢNG KHO (Warehouse)
CREATE TABLE dbo.Warehouses (
    warehouse_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    owning_unit_id NVARCHAR(50) NOT NULL,
    manager_employee_id NVARCHAR(50) NOT NULL,
    address NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Warehouse_Unit FOREIGN KEY (owning_unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Warehouse_Manager FOREIGN KEY (manager_employee_id) REFERENCES dbo.Employees(employee_id)
);
GO

-- 5. BẢNG DANH MỤC HÀNG HÓA & CHỦNG LOẠI (Category) - MỤC 5.4.1 PHÂN TÁCH ĐỊNH DANH & TIÊU HAO
CREATE TABLE dbo.Categories (
    category_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    [group] NVARCHAR(100) NOT NULL,
    tracking_type NVARCHAR(20) NOT NULL CHECK (tracking_type IN ('DINH_DANH', 'TIEU_HAO')),
    unit_of_measure NVARCHAR(50) NOT NULL,
    min_stock INT NOT NULL DEFAULT 0,
    prefix NVARCHAR(20) NOT NULL DEFAULT 'AST',
    estimated_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    description NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 6. BẢNG TÀI SẢN ĐỊNH DANH (Assets) - THEO DÕI TỪNG MÁY / QR / SERIAL
CREATE TABLE dbo.Assets (
    asset_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    asset_code NVARCHAR(50) NOT NULL UNIQUE,
    category_id NVARCHAR(50) NOT NULL,
    serial_no NVARCHAR(100) NULL,
    model NVARCHAR(150) NULL,
    specifications NVARCHAR(MAX) NULL,
    po_id NVARCHAR(50) NULL,
    po_code NVARCHAR(100) NULL,
    warehouse_id NVARCHAR(50) NOT NULL,
    owning_unit_id NVARCHAR(50) NOT NULL,
    holder_employee_id NVARCHAR(50) NULL,
    location NVARCHAR(255) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'TRONG_KHO' CHECK (status IN ('CHO_DINH_DANH', 'TRONG_KHO', 'DANG_SU_DUNG', 'DANG_SUA_CHUA', 'DANG_DIEU_CHUYEN', 'DA_THANH_LY')),
    warranty_from DATE NULL,
    warranty_to DATE NULL,
    purchase_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    qr_code NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Asset_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT FK_Asset_Warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Asset_Unit FOREIGN KEY (owning_unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Asset_Holder FOREIGN KEY (holder_employee_id) REFERENCES dbo.Employees(employee_id)
);
GO

-- 7. BẢNG TỒN KHO VẬT TƯ TIÊU HAO (StockBalances) - THEO DÕI SỐ LƯỢNG / ĐVT
CREATE TABLE dbo.StockBalances (
    warehouse_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    invested_this_month INT NOT NULL DEFAULT 0,
    issued_this_month INT NOT NULL DEFAULT 0,
    average_unit_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    CONSTRAINT PK_StockBalances PRIMARY KEY (warehouse_id, category_id),
    CONSTRAINT FK_Stock_Warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Stock_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- 8. BẢNG TRUNG TÂM GOM NHU CẦU MUA SẮM (ProcurementDemands) - MỤC 5.3.3 & UI09
CREATE TABLE dbo.ProcurementDemands (
    demand_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    source_type NVARCHAR(50) NOT NULL CHECK (source_type IN ('YEU_CAU_CBNV', 'TICKET_KY_THUAT', 'THU_KHO_TU_TAO')),
    source_id NVARCHAR(50) NOT NULL,
    source_code NVARCHAR(50) NOT NULL,
    source_title NVARCHAR(255) NOT NULL,
    requester_name NVARCHAR(200) NOT NULL,
    requester_unit NVARCHAR(200) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    qty_needed INT NOT NULL DEFAULT 1,
    estimated_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    priority NVARCHAR(20) NOT NULL DEFAULT 'TRUNG_BINH' CHECK (priority IN ('THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(20) NOT NULL DEFAULT 'CHO_GOM_PO' CHECK (status IN ('CHO_GOM_PO', 'DA_GOM_PO')),
    linked_po_id NVARCHAR(50) NULL,
    linked_po_code NVARCHAR(100) NULL,
    note NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Demand_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- 9. BẢNG ĐƠN ĐẶT HÀNG MUA (PurchaseOrders)
CREATE TABLE dbo.PurchaseOrders (
    po_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    po_code NVARCHAR(100) NOT NULL UNIQUE,
    source NVARCHAR(50) NOT NULL CHECK (source IN ('KHO_THIEU_HUT', 'YEU_CAU_CBNV', 'TICKET_KY_THUAT', 'TONG_HOP', 'GOM_NHIEU_NGUON', 'MANUAL')),
    tracking_type NVARCHAR(20) NOT NULL CHECK (tracking_type IN ('DINH_DANH', 'TIEU_HAO')),
    status NVARCHAR(30) NOT NULL DEFAULT 'NHAP' CHECK (status IN ('NHAP', 'DA_GUI_THU_MUA', 'DANG_MUA', 'MUA_HANG_HOAN_TAT', 'HOAN_TAT_MOT_PHAN', 'CHO_NHAP_KHO', 'DA_NHAP_KHO', 'DA_DONG')),
    supplier_name NVARCHAR(255) NULL,
    created_by NVARCHAR(50) NOT NULL,
    buyer_id NVARCHAR(50) NULL,
    receiving_warehouse_id NVARCHAR(50) NOT NULL,
    parent_po_id NVARCHAR(50) NULL,
    total_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at DATETIME2 NULL,
    note NVARCHAR(MAX) NULL,
    aggregated_demand_count INT NOT NULL DEFAULT 0,
    aggregated_sources_summary NVARCHAR(500) NULL,
    CONSTRAINT FK_PO_Warehouse FOREIGN KEY (receiving_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_PO_Creator FOREIGN KEY (created_by) REFERENCES dbo.Employees(employee_id)
);
GO

-- 10. BẢNG CHI TIẾT MẶT HÀNG ĐƠN HÀNG (PurchaseOrderLines)
CREATE TABLE dbo.PurchaseOrderLines (
    line_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    po_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    tracking_type NVARCHAR(20) NOT NULL CHECK (tracking_type IN ('DINH_DANH', 'TIEU_HAO')),
    qty_requested INT NOT NULL DEFAULT 1,
    qty_ordered INT NOT NULL DEFAULT 1,
    qty_received INT NOT NULL DEFAULT 0,
    qty_identified INT NOT NULL DEFAULT 0,
    estimated_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    actual_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    warehouse_id NVARCHAR(50) NOT NULL,
    source_type NVARCHAR(50) NULL,
    source_id NVARCHAR(50) NULL,
    source_code NVARCHAR(100) NULL,
    source_name NVARCHAR(200) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'CHO_NHAN',
    CONSTRAINT FK_POLine_PO FOREIGN KEY (po_id) REFERENCES dbo.PurchaseOrders(po_id) ON DELETE CASCADE,
    CONSTRAINT FK_POLine_Cat FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT FK_POLine_Wh FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id)
);
GO

-- 11. BẢNG YÊU CẦU CẤP PHÁT (Requests) - MỤC 5.3.1 & UI06/UI07
CREATE TABLE dbo.Requests (
    request_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    request_code NVARCHAR(100) NOT NULL UNIQUE,
    requester_id NVARCHAR(50) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    request_type NVARCHAR(50) NOT NULL CHECK (request_type IN ('CAP_VAN_PHONG_PHAM', 'CAP_DONG_PHUC', 'CAP_MAY_TINH_LAPTOP', 'CAP_THIET_BI_CNTT')),
    purpose NVARCHAR(MAX) NOT NULL,
    priority NVARCHAR(20) NOT NULL DEFAULT 'TRUNG_BINH' CHECK (priority IN ('THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP')),
    status NVARCHAR(30) NOT NULL DEFAULT 'CHO_TIEP_NHAN' CHECK (status IN ('NHAP', 'CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'DANG_CAP_PHAT', 'CAP_MOT_PHAN', 'CHO_MUA', 'HOAN_THANH', 'TU_CHOI', 'HUY')),
    rejection_reason NVARCHAR(MAX) NULL,
    attachment_name NVARCHAR(255) NULL,
    attachment_size NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    po_id NVARCHAR(50) NULL,
    CONSTRAINT FK_Req_Employee FOREIGN KEY (requester_id) REFERENCES dbo.Employees(employee_id),
    CONSTRAINT FK_Req_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 12. BẢNG CHI TIẾT YÊU CẦU CẤP PHÁT (RequestLines)
CREATE TABLE dbo.RequestLines (
    request_line_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    request_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    qty_requested INT NOT NULL DEFAULT 1,
    qty_reserved INT NOT NULL DEFAULT 0,
    qty_issued INT NOT NULL DEFAULT 0,
    qty_to_purchase INT NOT NULL DEFAULT 0,
    note NVARCHAR(MAX) NULL,
    CONSTRAINT FK_ReqLine_Req FOREIGN KEY (request_id) REFERENCES dbo.Requests(request_id) ON DELETE CASCADE,
    CONSTRAINT FK_ReqLine_Cat FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- 13. BẢNG TICKET KỸ THUẬT & SỰ CỐ (SupportTickets) - MỤC 5.3.2 & UI08
CREATE TABLE dbo.SupportTickets (
    ticket_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    ticket_code NVARCHAR(100) NOT NULL UNIQUE,
    reporter_id NVARCHAR(50) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    asset_id NVARCHAR(50) NULL,
    issue_type NVARCHAR(50) NOT NULL CHECK (issue_type IN ('SU_CO_PHAN_CUNG', 'SU_CO_PHAN_MEM', 'SU_CO_MANG_KET_NOI', 'HU_HONG_LINH_KIEN', 'YEU_CAU_BAO_TRI')),
    description NVARCHAR(MAX) NOT NULL,
    priority NVARCHAR(20) NOT NULL DEFAULT 'TRUNG_BINH' CHECK (priority IN ('THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP')),
    status NVARCHAR(30) NOT NULL DEFAULT 'MOI' CHECK (status IN ('MOI', 'DA_TIEP_NHAN', 'DANG_XU_LY', 'CHO_HO_SO', 'CHO_KHO', 'HOAN_THANH', 'TU_CHOI', 'HUY')),
    assigned_to NVARCHAR(50) NULL,
    diagnosis NVARCHAR(MAX) NULL,
    resolution NVARCHAR(MAX) NULL,
    solution_scenario NVARCHAR(50) NULL CHECK (solution_scenario IN ('SUA_TAI_CHO', 'SUA_CHUA_THAY_THE', 'THU_HOI_CAP_MOI')),
    attachment_name NVARCHAR(255) NULL,
    signed_proposal_name NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Ticket_Reporter FOREIGN KEY (reporter_id) REFERENCES dbo.Employees(employee_id),
    CONSTRAINT FK_Ticket_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Ticket_Asset FOREIGN KEY (asset_id) REFERENCES dbo.Assets(asset_id),
    CONSTRAINT FK_Ticket_Assignee FOREIGN KEY (assigned_to) REFERENCES dbo.Employees(employee_id)
);
GO

-- 14. BẢNG VẬT TƯ ĐỀ XUẤT CHO TICKET (TicketMaterials)
CREATE TABLE dbo.TicketMaterials (
    ticket_material_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    ticket_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    action_type NVARCHAR(30) NOT NULL CHECK (action_type IN ('SUA_CHUA', 'THAY_THE', 'CAP_MOI')),
    note NVARCHAR(MAX) NULL,
    CONSTRAINT FK_TkMat_Ticket FOREIGN KEY (ticket_id) REFERENCES dbo.SupportTickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT FK_TkMat_Cat FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- 15. BẢNG ĐIỀU CHUYỂN KHO LIÊN ĐƠN VỊ (Transfers) - MỤC 5.2.5 & UI10
CREATE TABLE dbo.Transfers (
    transfer_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(100) NOT NULL UNIQUE,
    from_warehouse_id NVARCHAR(50) NOT NULL,
    to_warehouse_id NVARCHAR(50) NOT NULL,
    dispatched_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    dispatched_by NVARCHAR(200) NOT NULL,
    received_at DATETIME2 NULL,
    received_by NVARCHAR(200) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'DANG_DIEU_CHUYEN' CHECK (status IN ('CHO_XAC_NHAN', 'DANG_DIEU_CHUYEN', 'DA_HOAN_THANH', 'DA_TU_CHOI')),
    reason NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Transfer_FromWh FOREIGN KEY (from_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Transfer_ToWh FOREIGN KEY (to_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id)
);
GO

CREATE TABLE dbo.TransferLines (
    transfer_line_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    transfer_id NVARCHAR(50) NOT NULL,
    asset_id NVARCHAR(50) NOT NULL,
    CONSTRAINT FK_TrLine_Transfer FOREIGN KEY (transfer_id) REFERENCES dbo.Transfers(transfer_id) ON DELETE CASCADE,
    CONSTRAINT FK_TrLine_Asset FOREIGN KEY (asset_id) REFERENCES dbo.Assets(asset_id)
);
GO

-- 16. BẢNG VÒNG ĐỜI TÀI SẢN (AssetEvents) - LỊCH SỬ BẤT BIẾN
CREATE TABLE dbo.AssetEvents (
    event_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    asset_id NVARCHAR(50) NOT NULL,
    event_type NVARCHAR(50) NOT NULL CHECK (event_type IN ('NHAP_KHO', 'BAN_GIAO_CAP_PHAT', 'SUA_CHUA', 'DIEU_CHUYEN', 'THU_HOI', 'THANH_LY')),
    occurred_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    before_status NVARCHAR(30) NULL,
    after_status NVARCHAR(30) NULL,
    from_unit NVARCHAR(200) NULL,
    to_unit NVARCHAR(200) NULL,
    from_holder NVARCHAR(200) NULL,
    to_holder NVARCHAR(200) NULL,
    source_type NVARCHAR(50) NULL,
    source_id NVARCHAR(50) NULL,
    note NVARCHAR(MAX) NULL,
    performed_by NVARCHAR(200) NOT NULL,
    CONSTRAINT FK_Event_Asset FOREIGN KEY (asset_id) REFERENCES dbo.Assets(asset_id)
);
GO

-- 17. BẢNG NHẬT KÝ KIỂM TOÁN (AuditLogs) & GIAO DỊCH (InventoryTransactions)
CREATE TABLE dbo.AuditLogs (
    log_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(50) NOT NULL,
    user_name NVARCHAR(200) NOT NULL,
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(100) NOT NULL,
    entity_id NVARCHAR(50) NOT NULL,
    before_value NVARCHAR(MAX) NULL,
    after_value NVARCHAR(MAX) NULL,
    occurred_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    reason NVARCHAR(MAX) NULL
);
GO

CREATE TABLE dbo.InventoryTransactions (
    transaction_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    type NVARCHAR(50) NOT NULL CHECK (type IN ('NHAP_KHO', 'XUAT_CAP_PHAT', 'DIEU_CHUYEN_DEN', 'DIEU_CHUYEN_DI', 'THANH_LY', 'KIEM_KE')),
    warehouse_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    source_type NVARCHAR(50) NOT NULL,
    source_id NVARCHAR(50) NOT NULL,
    recipient_employee_id NVARCHAR(50) NULL,
    recipient_unit_id NVARCHAR(50) NULL,
    occurred_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by NVARCHAR(200) NOT NULL,
    note NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Trx_Warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Trx_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- TẠO CHỈ MỤC TĂNG TỐC ĐỘ TRUY VẤN
CREATE NONCLUSTERED INDEX IX_Assets_Cat ON dbo.Assets(category_id);
CREATE NONCLUSTERED INDEX IX_Assets_Wh ON dbo.Assets(warehouse_id);
CREATE NONCLUSTERED INDEX IX_Assets_Status ON dbo.Assets(status);
CREATE NONCLUSTERED INDEX IX_Assets_QR ON dbo.Assets(qr_code);
CREATE NONCLUSTERED INDEX IX_Demands_Status ON dbo.ProcurementDemands(status);
CREATE NONCLUSTERED INDEX IX_PO_Status ON dbo.PurchaseOrders(status);
CREATE NONCLUSTERED INDEX IX_Req_Status ON dbo.Requests(status);
CREATE NONCLUSTERED INDEX IX_Ticket_Status ON dbo.SupportTickets(status);
GO

PRINT N'>> Đã tạo thành công toàn bộ cấu trúc bảng và chỉ mục!';
GO

-- ==========================================================================================
-- PHẦN II: NẠP DỮ LIỆU MẪU BAN ĐẦU CHUẨN THỰC TẾ THACO AGRI (DML)
-- ==========================================================================================
PRINT N'>> Đang nạp dữ liệu mẫu ban đầu...';
BEGIN TRANSACTION;

-- 1. NẠP ĐƠN VỊ
INSERT INTO dbo.OrganizationUnits (unit_id, code, name, short_name, parent_unit_id, address, status) VALUES
('UNIT-01', 'AGRI-HQ', N'Tổng Công ty Nông nghiệp THACO (THACO AGRI)', N'THACO AGRI', NULL, N'Khu Công nghiệp Tam Hiệp, Huyện Núi Thành, Tỉnh Quảng Nam', 'ACTIVE'),
('UNIT-02', 'KLH-GL', N'Khu Liên Hợp Nông Nghiệp Gia Lai', N'KLH Gia Lai', 'UNIT-01', N'Huyện Chư Prông, Tỉnh Gia Lai', 'ACTIVE'),
('UNIT-03', 'KLH-KH', N'Khu Liên Hợp Nông Nghiệp Koun Mom (Campuchia)', N'KLH Campuchia', 'UNIT-01', N'Huyện Koun Mom, Tỉnh Ratanakiri, Vương quốc Campuchia', 'ACTIVE');

-- 2. NẠP PHÒNG BAN (LIÊN KẾT ĐƠN VỊ)
INSERT INTO dbo.Departments (department_id, unit_id, code, name, status) VALUES
('DEP-01', 'UNIT-01', 'IT-DX', N'Phòng CNTT & Chuyển đổi số', 'ACTIVE'),
('DEP-02', 'UNIT-01', 'HC-NS', N'Phòng Hành chính - Nhân sự', 'ACTIVE'),
('DEP-03', 'UNIT-01', 'KT-TC', N'Phòng Kế toán - Tài chính', 'ACTIVE'),
('DEP-04', 'UNIT-01', 'TM-CC', N'Phòng Thu mua & Cung ứng', 'ACTIVE'),
('DEP-05', 'UNIT-01', 'QL-TS', N'Bộ phận Quản lý Kho & Tài sản', 'ACTIVE'),
('DEP-06', 'UNIT-02', 'CG-GL', N'Ban Cơ giới & Kỹ thuật Gia Lai', 'ACTIVE'),
('DEP-07', 'UNIT-02', 'HC-GL', N'Phòng Hành chính & Quản trị Kho Gia Lai', 'ACTIVE'),
('DEP-08', 'UNIT-02', 'KT-GL', N'Bộ phận Kế toán Chi nhánh Gia Lai', 'ACTIVE'),
('DEP-09', 'UNIT-03', 'QL-KM', N'Ban Quản trị Nông trường Koun Mom', 'ACTIVE'),
('DEP-10', 'UNIT-03', 'KHO-KM', N'Bộ phận Kho vận & Hậu cần Campuchia', 'ACTIVE'),
('DEP-11', 'UNIT-03', 'SC-KM', N'Trạm Kỹ thuật Cơ điện & Bảo trì Campuchia', 'ACTIVE');

-- 3. NẠP NHÂN SỰ VÀ PHÂN QUYỀN RBAC
INSERT INTO dbo.Employees (employee_id, employee_code, full_name, unit_id, department_id, position, email, phone, role, status) VALUES
('EMP-001', 'TG-10023', N'Nguyễn Văn Hùng', 'UNIT-01', 'DEP-05', N'Thủ kho trưởng', 'nguyenvanhung@thacoagri.vn', '0905 123 456', 'THU_KHO', 'ACTIVE'),
('EMP-002', 'TG-10045', N'Trần Thị Mai', 'UNIT-01', 'DEP-04', N'Chuyên viên Thu mua', 'tranthimai@thacoagri.vn', '0905 234 567', 'THU_MUA', 'ACTIVE'),
('EMP-003', 'TG-10088', N'Lê Hoàng Nam', 'UNIT-01', 'DEP-01', N'Kỹ sư CNTT & Quản trị mạng', 'lehoangnam@thacoagri.vn', '0905 345 678', 'KY_THUAT', 'ACTIVE'),
('EMP-004', 'TG-10112', N'Phạm Hồng Ánh', 'UNIT-01', 'DEP-03', N'Chuyên viên Kế toán tài sản', 'phamhonganh@thacoagri.vn', '0905 456 789', 'CBNV', 'ACTIVE'),
('EMP-005', 'TG-10001', N'Đặng Tuấn Kiệt', 'UNIT-01', 'DEP-01', N'Giám đốc CNTT & Quản trị', 'dangtuankiet@thacoagri.vn', '0905 567 890', 'QUAN_TRI', 'ACTIVE'),
('EMP-006', 'TG-10009', N'Võ Thị Bích Thảo', 'UNIT-01', 'DEP-02', N'Trưởng ban Kiểm soát & Kế hoạch', 'vothibichthao@thacoagri.vn', '0905 678 901', 'QUAN_LY', 'ACTIVE'),
('EMP-007', 'TG-10156', N'Hoàng Minh Đức', 'UNIT-01', 'DEP-02', N'Chuyên viên Hành chính - Nhân sự', 'hoangminhduc@thacoagri.vn', '0905 789 012', 'CBNV', 'ACTIVE'),
('EMP-008', 'TG-20034', N'Nguyễn Văn Thành', 'UNIT-02', 'DEP-06', N'Kỹ sư Cơ giới Nông nghiệp Gia Lai', 'nguyenvanthanh@thacoagri.vn', '0905 890 123', 'CBNV', 'ACTIVE');

-- 4. NẠP HỆ THỐNG KHO
INSERT INTO dbo.Warehouses (warehouse_id, code, name, owning_unit_id, manager_employee_id, address, status) VALUES
('WH-01', 'KHO-TONG-CL', N'Kho Tổng THACO AGRI - Chu Lai', 'UNIT-01', 'EMP-001', N'KCN Tam Hiệp, Núi Thành, Quảng Nam', 'ACTIVE'),
('WH-02', 'KHO-CNTT-CL', N'Kho Thiết bị CNTT & Kỹ thuật Chu Lai', 'UNIT-01', 'EMP-001', N'Tầng 1, Tòa nhà Điều hành THACO AGRI, Chu Lai', 'ACTIVE'),
('WH-03', 'KHO-VT-GL', N'Kho Vật tư KLH Nông nghiệp Gia Lai', 'UNIT-02', 'EMP-001', N'Xã Ia Púch, Huyện Chư Prông, Gia Lai', 'ACTIVE');

-- 5. NẠP DANH MỤC HÀNG HÓA (ĐỊNH DANH & TIÊU HAO)
INSERT INTO dbo.Categories (category_id, code, name, [group], tracking_type, unit_of_measure, min_stock, prefix, estimated_unit_price, description, status) VALUES
('CAT-01', 'LT-DELL', N'Laptop Dell Latitude 5430', N'Thiết bị CNTT', 'DINH_DANH', N'Chiếc', 5, 'AST-LT', 22000000, N'Laptop làm việc tiêu chuẩn', 'ACTIVE'),
('CAT-02', 'PC-DESK', N'Máy tính để bàn HP ProDesk 400', N'Thiết bị CNTT', 'DINH_DANH', N'Bộ', 3, 'AST-PC', 17500000, N'Máy tính bàn cho nhân viên', 'ACTIVE'),
('CAT-03', 'MN-DELL', N'Màn hình Dell P2422H 24 inch', N'Thiết bị CNTT', 'DINH_DANH', N'Chiếc', 5, 'AST-MN', 4200000, N'Màn hình vi tính đồ họa/văn phòng', 'ACTIVE'),
('CAT-04', 'PR-CANON', N'Máy in laser đa năng Canon MF244dw', N'Thiết bị văn phòng', 'DINH_DANH', N'Chiếc', 2, 'AST-PR', 8900000, N'Máy in, photo, scan 2 mặt', 'ACTIVE'),
('CAT-05', 'DESK-WF', N'Bàn làm việc nhân viên Hòa Phát 1m4', N'Nội thất văn phòng', 'DINH_DANH', N'Cái', 4, 'AST-DK', 2800000, N'Bàn gỗ công nghiệp phủ Melamine', 'ACTIVE'),
('CAT-06', 'CHAIR-VP', N'Ghế xoay văn phòng lưới GX204', N'Nội thất văn phòng', 'DINH_DANH', N'Chiếc', 6, 'AST-CH', 1450000, N'Ghế xoay có tay vịn', 'ACTIVE'),
('CAT-07', 'VPP-A4', N'Giấy in A4 Double A 70gsm', N'Văn phòng phẩm', 'TIEU_HAO', N'Ream', 30, 'VPP-A4', 72000, N'Giấy in photo khổ A4', 'ACTIVE'),
('CAT-08', 'INK-2900', N'Hộp mực in Canon Cartridge 303', N'Linh kiện & Vật tư tiêu hao', 'TIEU_HAO', N'Hộp', 10, 'VPP-MC', 330000, N'Hộp mực dùng cho máy in LBP 2900', 'ACTIVE'),
('CAT-09', 'PEN-TL', N'Bút bi Thiên Long 0.5mm (Hộp 20 cây)', N'Văn phòng phẩm', 'TIEU_HAO', N'Hộp', 15, 'VPP-BB', 95000, N'Bút mực xanh viết văn phòng', 'ACTIVE'),
('CAT-10', 'DP-AGRI', N'Đồng phục sơ mi THACO AGRI', N'Bảo hộ & Đồng phục', 'TIEU_HAO', N'Bộ', 20, 'DP-SM', 260000, N'Áo sơ mi đồng phục công ty', 'ACTIVE'),
('CAT-11', 'KB-LOGI', N'Bộ chuột & bàn phím Logitech MK120', N'Linh kiện phụ trợ', 'TIEU_HAO', N'Bộ', 15, 'LK-KB', 380000, N'Chuột và phím cổng USB có dây', 'ACTIVE'),
('CAT-12', 'BAT-AA', N'Pin tiểu AA Panasonic (Vỉ 4 viên)', N'Vật tư văn phòng', 'TIEU_HAO', N'Vỉ', 25, 'VT-PIN', 55000, N'Pin dùng cho chuột không dây và đồng hồ', 'ACTIVE');

-- 6. NẠP TÀI SẢN ĐỊNH DANH (SERIAL / QR CODE)
INSERT INTO dbo.Assets (asset_id, asset_code, category_id, serial_no, model, specifications, po_id, po_code, warehouse_id, owning_unit_id, holder_employee_id, location, status, warranty_from, warranty_to, purchase_cost, qr_code) VALUES
('AST-2026-0001', 'AST-LT-0001', 'CAT-01', 'DL-5430-88491', 'Latitude 5430', N'Core i5-1235U, RAM 16GB, SSD 512GB NVMe, 14 inch FHD', 'PO-2026-001', 'PO-AGRI-2026-001', 'WH-02', 'UNIT-01', 'EMP-004', N'Phòng Kế toán - Tầng 2', 'DANG_SU_DUNG', '2025-01-16', '2028-01-16', 21500000, 'THACO-AGRI://AST-LT-0001/DL-5430-88491'),
('AST-2026-0002', 'AST-LT-0002', 'CAT-01', 'DL-5430-88492', 'Latitude 5430', N'Core i5-1235U, RAM 16GB, SSD 512GB NVMe, 14 inch FHD', 'PO-2026-001', 'PO-AGRI-2026-001', 'WH-02', 'UNIT-01', NULL, N'Kệ A1 - Kho Thiết bị CNTT', 'TRONG_KHO', '2025-01-16', '2028-01-16', 21500000, 'THACO-AGRI://AST-LT-0002/DL-5430-88492'),
('AST-2026-0003', 'AST-PC-0001', 'CAT-02', 'HP-PD400-33120', 'ProDesk 400 G9', N'Core i5-12500, RAM 8GB, SSD 256GB, Màn hình HP 21.5 inch', 'PO-2026-001', 'PO-AGRI-2026-001', 'WH-02', 'UNIT-01', 'EMP-002', N'Phòng Thu mua - Tầng 1', 'DANG_SU_DUNG', '2025-01-16', '2028-01-16', 16800000, 'THACO-AGRI://AST-PC-0001/HP-PD400-33120'),
('AST-2026-0004', 'AST-PR-0001', 'CAT-04', 'CN-MF244-99811', 'imageCLASS MF244dw', N'In 2 mặt tự động, Scan màu, Copy, kết nối Wifi', NULL, NULL, 'WH-01', 'UNIT-01', 'EMP-004', N'Phòng Kế toán - Tầng 2', 'DANG_SUA_CHUA', '2024-06-10', '2026-06-10', 8900000, 'THACO-AGRI://AST-PR-0001/CN-MF244-99811'),
('AST-2026-0005', 'AST-MN-0001', 'CAT-03', 'DELL-P24-77401', 'P2422H', N'23.8 inch IPS, Full HD, Cổng DP/HDMI/VGA/USB 3.0', NULL, NULL, 'WH-02', 'UNIT-01', NULL, N'Kệ M1 - Kho Thiết bị CNTT', 'TRONG_KHO', '2025-03-01', '2028-03-01', 4200000, 'THACO-AGRI://AST-MN-0001/DELL-P24-77401'),
('AST-2026-0006', 'AST-DK-0001', 'CAT-05', 'HP-DK14-55109', 'AT140S', N'Bàn làm việc chữ nhật 1m4x0m7 kèm hộc tủ 3 ngăn', NULL, NULL, 'WH-03', 'UNIT-02', NULL, N'Khu nhà điều hành Nông trường Gia Lai', 'TRONG_KHO', '2024-11-20', '2025-11-20', 2800000, 'THACO-AGRI://AST-DK-0001/HP-DK14-55109');

-- 7. NẠP TỒN KHO VẬT TƯ TIÊU HAO
INSERT INTO dbo.StockBalances (warehouse_id, category_id, quantity_on_hand, quantity_reserved, invested_this_month, issued_this_month, average_unit_cost) VALUES
('WH-01', 'CAT-07', 45, 10, 50, 15, 72000),
('WH-01', 'CAT-08', 8, 2, 10, 4, 330000),
('WH-01', 'CAT-09', 24, 3, 20, 8, 95000),
('WH-01', 'CAT-10', 35, 2, 40, 12, 260000),
('WH-01', 'CAT-11', 12, 0, 15, 6, 380000),
('WH-01', 'CAT-12', 40, 0, 30, 10, 55000);

-- 8. NẠP NHU CẦU MUA SẮM (GOM PO HUB)
INSERT INTO dbo.ProcurementDemands (demand_id, source_type, source_id, source_code, source_title, requester_name, requester_unit, category_id, qty_needed, estimated_unit_price, priority, status, note) VALUES
('DEMAND-2026-001', 'YEU_CAU_CBNV', 'REQ-2026-004', 'YC-LT-2026-004', N'Đề xuất cấp Laptop nhân sự mới (Phòng Hành chính - NS)', N'Hoàng Minh Đức (CBNV)', N'Phòng Hành chính - Nhân sự', 'CAT-01', 1, 21500000, 'CAO', 'CHO_GOM_PO', N'Nhân viên mới nhận việc, kho hiện hết laptop sẵn sàng cấp'),
('DEMAND-2026-002', 'YEU_CAU_CBNV', 'REQ-2026-004', 'YC-LT-2026-004', N'Đề xuất cấp phát đồng phục nhân sự mới', N'Hoàng Minh Đức (CBNV)', N'Phòng Hành chính - Nhân sự', 'CAT-10', 2, 260000, 'TRUNG_BINH', 'CHO_GOM_PO', N'2 áo sơ mi nam size L'),
('DEMAND-2026-003', 'TICKET_KY_THUAT', 'TCK-2026-001', 'TK-IT-2026-001', N'KB2 Thay thế cụm sấy & hộp mực máy in Canon LBP2900', N'Lê Hoàng Nam (Kỹ thuật IT)', N'Tổ Kỹ thuật CNTT Chu Lai', 'CAT-08', 2, 330000, 'CAO', 'CHO_GOM_PO', N'Tờ trình kỹ thuật thay thế linh kiện máy in Phòng Kế toán đã được ký duyệt'),
('DEMAND-2026-004', 'TICKET_KY_THUAT', 'TCK-2026-002', 'TK-IT-2026-002', N'KB3 Thu hồi màn hình hỏng & Cấp mới cho kỹ sư nông trường', N'Lê Hoàng Nam (Kỹ thuật IT)', N'Tổ Kỹ thuật CNTT Chu Lai', 'CAT-03', 1, 4200000, 'TRUNG_BINH', 'CHO_GOM_PO', N'Màn hình máy bàn kỹ sư Gia Lai bị chập panel, đề xuất thu hồi và cấp mới'),
('DEMAND-2026-005', 'THU_KHO_TU_TAO', 'MANUAL-001', 'BO-SUNG-KHO-01', N'Thủ kho chủ động tạo nhu cầu bù chuột bàn phím dự phòng', N'Nguyễn Văn Hùng (Thủ kho)', N'Kho Tổng THACO AGRI - Chu Lai', 'CAT-11', 15, 380000, 'TRUNG_BINH', 'CHO_GOM_PO', N'Tồn kho còn 12 bộ, cần gom mua bổ sung an toàn tối thiểu 25 bộ'),
('DEMAND-2026-006', 'THU_KHO_TU_TAO', 'MANUAL-002', 'BO-SUNG-KHO-02', N'Thủ kho chủ động tạo nhu cầu bổ sung Giấy in A4 quý 4', N'Nguyễn Văn Hùng (Thủ kho)', N'Kho Tổng THACO AGRI - Chu Lai', 'CAT-07', 30, 72000, 'TRUNG_BINH', 'CHO_GOM_PO', N'Nhu cầu in ấn báo cáo tài chính cuối năm tăng cao, kho chỉ còn 10 ream');

-- 9. NẠP ĐƠN HÀNG MUA PO
INSERT INTO dbo.PurchaseOrders (po_id, po_code, source, tracking_type, status, supplier_name, created_by, buyer_id, receiving_warehouse_id, total_amount, created_at, note, aggregated_demand_count, aggregated_sources_summary) VALUES
('PO-2026-001', 'PO-AGRI-2026-001', 'YEU_CAU_CBNV', 'DINH_DANH', 'DA_NHAP_KHO', N'Công ty CP Công Nghệ Phong Vũ', 'EMP-001', 'EMP-002', 'WH-02', 64500000, '2025-01-10', N'Mua sắm thiết bị CNTT phục vụ đợt tuyển dụng đầu năm', 0, NULL),
('PO-2026-002', 'PO-AGRI-2026-002', 'KHO_THIEU_HUT', 'TIEU_HAO', 'CHO_NHAP_KHO', N'Văn phòng phẩm An Phát Chu Lai', 'EMP-001', 'EMP-002', 'WH-01', 6800000, '2026-10-18', N'Bổ sung mực in Canon và Pin tiểu cho quý 4', 0, NULL),
('PO-2026-003', 'PO-AGRI-GOM-2026-001', 'GOM_NHIEU_NGUON', 'DINH_DANH', 'MUA_HANG_HOAN_TAT', N'Công ty TNHH Thiết bị Sao Mai', 'EMP-001', 'EMP-002', 'WH-02', 47200000, '2026-10-19', N'Đơn PO gom từ nhiều nguồn: Đề xuất YC-LT-2026-002 (Trần Thị Mai) + Ticket IT #TK-01 (KTV Hoàng Nam)', 2, N'1 Yêu cầu cấp phát nhân sự + 1 Phương án kỹ thuật Ticket'),
('PO-2026-004', 'PO-AGRI-2026-004', 'YEU_CAU_CBNV', 'DINH_DANH', 'DANG_MUA', N'Đại lý Nội Thất Hòa Phát Chu Lai', 'EMP-001', 'EMP-002', 'WH-01', 14000000, '2026-10-21', N'Mua bổ sung 5 bàn làm việc cho Ban Cơ giới Nông nghiệp', 0, NULL);

-- 10. NẠP DÒNG ĐƠN HÀNG PO
INSERT INTO dbo.PurchaseOrderLines (line_id, po_id, category_id, tracking_type, qty_requested, qty_ordered, qty_received, qty_identified, estimated_unit_price, actual_unit_price, amount, warehouse_id, source_type, status) VALUES
('POL-001', 'PO-2026-001', 'CAT-01', 'DINH_DANH', 2, 2, 2, 2, 22000000, 21500000, 43000000, 'WH-02', 'YEU_CAU_CBNV', 'DA_NHAP_KHO'),
('POL-002', 'PO-2026-001', 'CAT-02', 'DINH_DANH', 1, 1, 1, 1, 17500000, 16800000, 16800000, 'WH-02', 'YEU_CAU_CBNV', 'DA_NHAP_KHO'),
('POL-003', 'PO-2026-002', 'CAT-08', 'TIEU_HAO', 15, 15, 15, 0, 330000, 320000, 4800000, 'WH-01', 'KHO', 'CHO_NHAN'),
('POL-004', 'PO-2026-002', 'CAT-12', 'TIEU_HAO', 40, 40, 40, 0, 55000, 50000, 2000000, 'WH-01', 'KHO', 'CHO_NHAN'),
('POL-005', 'PO-2026-003', 'CAT-01', 'DINH_DANH', 2, 2, 2, 0, 22000000, 21500000, 43000000, 'WH-02', 'YEU_CAU_CBNV', 'CHO_NHAN'),
('POL-006', 'PO-2026-003', 'CAT-03', 'DINH_DANH', 1, 1, 1, 0, 4200000, 4200000, 4200000, 'WH-02', 'TICKET_KY_THUAT', 'CHO_NHAN');

-- 11. NẠP YÊU CẦU CẤP PHÁT
INSERT INTO dbo.Requests (request_id, request_code, requester_id, unit_id, request_type, purpose, priority, status, attachment_name, attachment_size, created_at) VALUES
('REQ-2026-001', 'YC-VPP-2026-001', 'EMP-004', 'UNIT-01', 'CAP_VAN_PHONG_PHAM', N'Cấp văn phòng phẩm quý 4/2026 cho Phòng Kế toán - Tài chính', 'TRUNG_BINH', 'DA_TIEP_NHAN', N'Phieu_de_xuat_cap_vpp_Q4_KTTC_da_ky.pdf', '342 KB', '2026-10-20'),
('REQ-2026-002', 'YC-LT-2026-002', 'EMP-002', 'UNIT-01', 'CAP_MAY_TINH_LAPTOP', N'Cấp laptop làm việc cho chuyên viên thu mua mới nhận việc', 'CAO', 'CHO_TIEP_NHAN', N'To_trinh_cap_laptop_NS_moi_T10_signed.pdf', '488 KB', '2026-10-21'),
('REQ-2026-003', 'YC-DP-2026-003', 'EMP-004', 'UNIT-01', 'CAP_DONG_PHUC', N'Cấp đồng phục đợt 2 cho nhân viên chuyển chính thức', 'TRUNG_BINH', 'HOAN_THANH', N'Danh_sach_cap_dong_phuc_T9.pdf', '210 KB', '2026-09-15'),
('REQ-2026-004', 'YC-LT-2026-004', 'EMP-007', 'UNIT-01', 'CAP_MAY_TINH_LAPTOP', N'Đề xuất cấp phát máy tính làm việc cho nhân sự mới phòng Hành chính - Nhân sự', 'CAO', 'CHO_TIEP_NHAN', N'Phieu_de_xuat_cap_laptop_HoangMinhDuc_signed.pdf', '310 KB', '2026-10-22');

-- 12. NẠP DÒNG YÊU CẦU CẤP PHÁT
INSERT INTO dbo.RequestLines (request_line_id, request_id, category_id, qty_requested, qty_reserved, qty_issued, qty_to_purchase, note) VALUES
('RQL-001', 'REQ-2026-001', 'CAT-07', 10, 10, 0, 0, N'Sử dụng in báo cáo tài chính quý 3 và sổ sách'),
('RQL-002', 'REQ-2026-001', 'CAT-09', 3, 3, 0, 0, N'Cấp cho 3 nhân sự kế toán thuế'),
('RQL-003', 'REQ-2026-002', 'CAT-01', 1, 0, 0, 0, N'Yêu cầu máy tính xách tay di động để đi công tác'),
('RQL-004', 'REQ-2026-003', 'CAT-10', 4, 0, 4, 0, N'2 sơ mi nam size L, 2 sơ mi nữ size M'),
('RQL-005', 'REQ-2026-004', 'CAT-01', 1, 0, 0, 0, N'Trang bị máy tính xách tay làm việc văn phòng'),
('RQL-006', 'REQ-2026-004', 'CAT-10', 2, 0, 0, 0, N'Cấp đồng phục sơ mi nam size L');

-- 13. NẠP TICKET SỰ CỐ KỸ THUẬT & 3 KỊCH BẢN
INSERT INTO dbo.SupportTickets (ticket_id, ticket_code, reporter_id, unit_id, asset_id, issue_type, description, priority, status, assigned_to, diagnosis, resolution, solution_scenario, attachment_name, signed_proposal_name) VALUES
('TCK-2026-001', 'TK-IT-2026-001', 'EMP-004', 'UNIT-01', 'AST-2026-0004', 'SU_CO_PHAN_CUNG', N'Máy in Canon LBP2900 bị kẹt giấy liên tục và kêu to khi khởi động kéo giấy', 'CAO', 'DANG_XU_LY', 'EMP-003', N'Hỏng cụm sấy và bánh cao su cuốn giấy bị mòn nghiêm trọng', N'Đề xuất thay thế cụm kéo giấy và bảo dưỡng sấy máy in', 'SUA_CHUA_THAY_THE', N'Hinh_anh_ket_giay_may_in_tang2.png', N'To_trinh_sua_chua_thay_the_cum_say_Canon_da_ky.pdf'),
('TCK-2026-002', 'TK-IT-2026-002', 'EMP-002', 'UNIT-01', 'AST-2026-0003', 'SU_CO_PHAN_MEM', N'Không mở được phần mềm khai báo hóa đơn điện tử và lỗi font chữ tiếng Việt', 'TRUNG_BINH', 'HOAN_THANH', 'EMP-003', N'Xung đột bộ gõ Unikey phiên bản cũ và lỗi quyền thư mục cài đặt', N'Đã gỡ bản cũ, cài Unikey 4.3 RC5 x64 và cấp quyền Administrator', 'SUA_TAI_CHO', NULL, NULL);

-- 14. NẠP VẬT TƯ ĐỀ XUẤT TICKET
INSERT INTO dbo.TicketMaterials (ticket_material_id, ticket_id, category_id, qty, action_type, note) VALUES
('MAT-001', 'TCK-2026-001', 'CAT-08', 1, 'THAY_THE', N'Thay cụm sấy và hộp mực mới tương thích');

-- 15. NẠP ĐIỀU CHUYỂN KHO
INSERT INTO dbo.Transfers (transfer_id, code, from_warehouse_id, to_warehouse_id, dispatched_at, dispatched_by, received_at, received_by, status, reason) VALUES
('TRF-2026-001', 'DC-KHO-2026-001', 'WH-01', 'WH-03', '2026-10-12', N'Nguyễn Văn Hùng (EMP-001)', '2026-10-14', N'Hoàng Văn Thắng (Thủ kho Gia Lai)', 'DA_HOAN_THANH', N'Điều chuyển bàn ghế và thiết bị bổ sung cho phòng điều hành dự án Gia Lai');

INSERT INTO dbo.TransferLines (transfer_line_id, transfer_id, asset_id) VALUES
('TRFL-001', 'TRF-2026-001', 'AST-2026-0006');

COMMIT TRANSACTION;
PRINT N'>> ĐÃ NẠP THÀNH CÔNG TOÀN BỘ DỮ LIỆU MẪU BAN ĐẦU!';
GO

-- ==========================================================================================
-- PHẦN III: KIỂM TRA TỔNG QUAN CƠ SỞ DỮ LIỆU VỪA TẠO
-- ==========================================================================================
SELECT '1. Don vi' AS Bang, COUNT(*) AS SoLuongBanGhi FROM dbo.OrganizationUnits
UNION ALL
SELECT '2. Phong ban', COUNT(*) FROM dbo.Departments
UNION ALL
SELECT '3. Nhan vien', COUNT(*) FROM dbo.Employees
UNION ALL
SELECT '4. Kho', COUNT(*) FROM dbo.Warehouses
UNION ALL
SELECT '5. Danh muc', COUNT(*) FROM dbo.Categories
UNION ALL
SELECT '6. Tai san dinh danh', COUNT(*) FROM dbo.Assets
UNION ALL
SELECT '7. Ton kho tieu hao', COUNT(*) FROM dbo.StockBalances
UNION ALL
SELECT '8. Nhu cau gom PO', COUNT(*) FROM dbo.ProcurementDemands
UNION ALL
SELECT '9. Don hang PO', COUNT(*) FROM dbo.PurchaseOrders
UNION ALL
SELECT '10. Chi tiet PO', COUNT(*) FROM dbo.PurchaseOrderLines
UNION ALL
SELECT '11. Yeu cau cap phat', COUNT(*) FROM dbo.Requests
UNION ALL
SELECT '12. Chi tiet yeu cau', COUNT(*) FROM dbo.RequestLines
UNION ALL
SELECT '13. Ticket ky thuat', COUNT(*) FROM dbo.SupportTickets
UNION ALL
SELECT '14. Vat tu ticket', COUNT(*) FROM dbo.TicketMaterials
UNION ALL
SELECT '15. Dieu chuyen kho', COUNT(*) FROM dbo.Transfers;
GO

PRINT '==========================================================================================';
PRINT '>>> CHÚC MỪNG! BẠN ĐÃ TẠO THÀNH CÔNG CƠ SỞ DỮ LIỆU THACO AGRI TRÊN SQL SERVER 2019! <<<';
PRINT '==========================================================================================';
GO
