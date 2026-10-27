/**
 * Microsoft SQL Server (T-SQL) DDL Script for THACO AGRI Asset & Procurement Management System
 * Based on Section 7 of the Business Analysis Specification Document
 */

export const SQL_SERVER_SCHEMA_SCRIPT = `-- ==========================================================================================
-- THACO AGRI - HỆ THỐNG QUẢN LÝ TÀI SẢN & THU MUA DỊCH VỤ HOẠT ĐỘNG
-- DATABASE ENGINE: Microsoft SQL Server 2019 / 2022
-- FILE: Schema_ThacoAgri_AssetManagement.sql
-- MỤC ĐÍCH: Khởi tạo cấu trúc bảng, ràng buộc toàn vẹn, chỉ mục và dữ liệu mẫu ban đầu
-- ==========================================================================================

USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'ThacoAgri_AssetDB')
BEGIN
    CREATE DATABASE ThacoAgri_AssetDB COLLATE Vietnamese_CI_AS;
END
GO

USE ThacoAgri_AssetDB;
GO

-- 1. BẢNG ĐƠN VỊ (OrganizationUnit)
IF OBJECT_ID('dbo.OrganizationUnits', 'U') IS NOT NULL DROP TABLE dbo.OrganizationUnits;
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
IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL DROP TABLE dbo.Departments;
CREATE TABLE dbo.Departments (
    department_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    unit_id NVARCHAR(50) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Dept_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 3. BẢNG NHÂN VIÊN (Employee)
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL DROP TABLE dbo.Employees;
CREATE TABLE dbo.Employees (
    employee_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    employee_code NVARCHAR(50) NOT NULL UNIQUE,
    full_name NVARCHAR(200) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL, -- Đơn vị chi trả lương
    department_id NVARCHAR(50) NOT NULL,
    position NVARCHAR(150) NULL,
    email NVARCHAR(150) NULL,
    phone NVARCHAR(50) NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'CBNV' CHECK (role IN ('CBNV', 'THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY')),
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Emp_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Emp_Dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

-- 4. BẢNG KHO (Warehouse)
IF OBJECT_ID('dbo.Warehouses', 'U') IS NOT NULL DROP TABLE dbo.Warehouses;
CREATE TABLE dbo.Warehouses (
    warehouse_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    owning_unit_id NVARCHAR(50) NOT NULL,
    manager_employee_id NVARCHAR(50) NULL,
    address NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Wh_Unit FOREIGN KEY (owning_unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Wh_Manager FOREIGN KEY (manager_employee_id) REFERENCES dbo.Employees(employee_id)
);
GO

-- 5. BẢNG DANH MỤC HÀNG HÓA (Category)
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
CREATE TABLE dbo.Categories (
    category_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    [group] NVARCHAR(100) NOT NULL,
    tracking_type NVARCHAR(20) NOT NULL CHECK (tracking_type IN ('DINH_DANH', 'TIEU_HAO')),
    unit_of_measure NVARCHAR(50) NOT NULL,
    min_stock INT NOT NULL DEFAULT 0,
    estimated_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    description NVARCHAR(MAX) NULL,
    prefix NVARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 6. BẢNG TÀI SẢN ĐỊNH DANH (Asset)
IF OBJECT_ID('dbo.Assets', 'U') IS NOT NULL DROP TABLE dbo.Assets;
CREATE TABLE dbo.Assets (
    asset_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    asset_code NVARCHAR(100) NOT NULL UNIQUE,
    category_id NVARCHAR(50) NOT NULL,
    serial_no NVARCHAR(150) NULL,
    warranty_from DATE NULL,
    warranty_to DATE NULL,
    purchase_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    owning_unit_id NVARCHAR(50) NOT NULL,
    warehouse_id NVARCHAR(50) NOT NULL,
    holder_employee_id NVARCHAR(50) NULL,
    holder_unit_snapshot NVARCHAR(50) NULL, -- Chụp lại đơn vị chi trả lương tại thời điểm cấp
    location NVARCHAR(255) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'TRONG_KHO' CHECK (status IN ('CHO_DINH_DANH', 'TRONG_KHO', 'DANG_SU_DUNG', 'DANG_SUA_CHUA', 'DANG_DIEU_CHUYEN', 'DA_THANH_LY')),
    specifications NVARCHAR(MAX) NULL,
    qr_code NVARCHAR(200) NOT NULL,
    po_id NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Asset_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT FK_Asset_OwningUnit FOREIGN KEY (owning_unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Asset_Warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Asset_Holder FOREIGN KEY (holder_employee_id) REFERENCES dbo.Employees(employee_id)
);
GO

-- 7. BẢNG TỒN KHO TIÊU HAO (StockBalance)
IF OBJECT_ID('dbo.StockBalances', 'U') IS NOT NULL DROP TABLE dbo.StockBalances;
CREATE TABLE dbo.StockBalances (
    warehouse_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    invested_this_month INT NOT NULL DEFAULT 0,
    issued_this_month INT NOT NULL DEFAULT 0,
    average_unit_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (warehouse_id, category_id),
    CONSTRAINT FK_Stock_Wh FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Stock_Cat FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);
GO

-- 8. BẢNG GIAO DỊCH KHO (InventoryTransaction)
IF OBJECT_ID('dbo.InventoryTransactions', 'U') IS NOT NULL DROP TABLE dbo.InventoryTransactions;
CREATE TABLE dbo.InventoryTransactions (
    transaction_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    type NVARCHAR(30) NOT NULL CHECK (type IN ('NHAP_KHO', 'XUAT_CAP_PHAT', 'THU_HOI', 'DIEU_CHINH', 'THANH_LY')),
    warehouse_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NULL,
    asset_id NVARCHAR(50) NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    source_type NVARCHAR(30) NOT NULL,
    source_id NVARCHAR(50) NULL,
    recipient_employee_id NVARCHAR(50) NULL,
    recipient_unit_id NVARCHAR(50) NULL,
    occurred_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by NVARCHAR(200) NOT NULL,
    note NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Tx_Wh FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id)
);
GO

-- 9. BẢNG ĐƠN HÀNG THU MUA (PurchaseOrder)
IF OBJECT_ID('dbo.PurchaseOrders', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrders;
CREATE TABLE dbo.PurchaseOrders (
    po_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    po_code NVARCHAR(50) NOT NULL UNIQUE,
    source NVARCHAR(50) NOT NULL,
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
    CONSTRAINT FK_PO_Wh FOREIGN KEY (receiving_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_PO_Parent FOREIGN KEY (parent_po_id) REFERENCES dbo.PurchaseOrders(po_id)
);
GO

-- 10. BẢNG CHI TIẾT ĐƠN HÀNG THU MUA (PurchaseOrderLine)
IF OBJECT_ID('dbo.PurchaseOrderLines', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrderLines;
CREATE TABLE dbo.PurchaseOrderLines (
    line_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    po_id NVARCHAR(50) NOT NULL,
    category_id NVARCHAR(50) NOT NULL,
    tracking_type NVARCHAR(20) NOT NULL,
    qty_requested INT NOT NULL DEFAULT 1,
    qty_ordered INT NOT NULL DEFAULT 1,
    qty_received INT NOT NULL DEFAULT 0,
    qty_identified INT NOT NULL DEFAULT 0,
    estimated_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    actual_unit_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    warehouse_id NVARCHAR(50) NOT NULL,
    source_type NVARCHAR(30) NOT NULL,
    source_id NVARCHAR(50) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'CHO_NHAN',
    CONSTRAINT FK_POLine_PO FOREIGN KEY (po_id) REFERENCES dbo.PurchaseOrders(po_id) ON DELETE CASCADE,
    CONSTRAINT FK_POLine_Cat FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT FK_POLine_Wh FOREIGN KEY (warehouse_id) REFERENCES dbo.Warehouses(warehouse_id)
);
GO

-- 11. BẢNG YÊU CẦU CẤP PHÁT (Request)
IF OBJECT_ID('dbo.Requests', 'U') IS NOT NULL DROP TABLE dbo.Requests;
CREATE TABLE dbo.Requests (
    request_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    request_code NVARCHAR(50) NOT NULL UNIQUE,
    requester_id NVARCHAR(50) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    request_type NVARCHAR(50) NOT NULL CHECK (request_type IN ('CAP_VAN_PHONG_PHAM', 'CAP_DONG_PHUC', 'CAP_MAY_TINH_LAPTOP', 'CAP_THIET_BI_CNTT')),
    purpose NVARCHAR(500) NOT NULL,
    priority NVARCHAR(20) NOT NULL DEFAULT 'TRUNG_BINH' CHECK (priority IN ('THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP')),
    status NVARCHAR(30) NOT NULL DEFAULT 'CHO_TIEP_NHAN' CHECK (status IN ('NHAP', 'CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'DANG_CAP_PHAT', 'CAP_MOT_PHAN', 'CHO_MUA', 'HOAN_THANH', 'TU_CHOI', 'HUY')),
    rejection_reason NVARCHAR(MAX) NULL,
    attachment_name NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Req_User FOREIGN KEY (requester_id) REFERENCES dbo.Employees(employee_id),
    CONSTRAINT FK_Req_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 12. BẢNG CHI TIẾT YÊU CẦU CẤP PHÁT (RequestLine)
IF OBJECT_ID('dbo.RequestLines', 'U') IS NOT NULL DROP TABLE dbo.RequestLines;
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

-- 13. BẢNG TICKET KỸ THUẬT (SupportTicket)
IF OBJECT_ID('dbo.SupportTickets', 'U') IS NOT NULL DROP TABLE dbo.SupportTickets;
CREATE TABLE dbo.SupportTickets (
    ticket_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    ticket_code NVARCHAR(50) NOT NULL UNIQUE,
    reporter_id NVARCHAR(50) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    asset_id NVARCHAR(50) NULL,
    issue_type NVARCHAR(50) NOT NULL,
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

-- 14. BẢNG VẬT TƯ ĐỀ XUẤT TICKET (TicketMaterial)
IF OBJECT_ID('dbo.TicketMaterials', 'U') IS NOT NULL DROP TABLE dbo.TicketMaterials;
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

-- 15. BẢNG NHẬT KÝ VÒNG ĐỜI TÀI SẢN (AssetEvent) - BẤT BIẾN
IF OBJECT_ID('dbo.AssetEvents', 'U') IS NOT NULL DROP TABLE dbo.AssetEvents;
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

-- 16. BẢNG ĐIỀU CHUYỂN KHO (Transfers)
IF OBJECT_ID('dbo.Transfers', 'U') IS NOT NULL DROP TABLE dbo.Transfers;
CREATE TABLE dbo.Transfers (
    transfer_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    from_warehouse_id NVARCHAR(50) NOT NULL,
    to_warehouse_id NVARCHAR(50) NOT NULL,
    dispatched_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    dispatched_by NVARCHAR(200) NOT NULL,
    received_at DATETIME2 NULL,
    received_by NVARCHAR(200) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'DANG_DIEU_CHUYEN',
    reason NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Transfer_FromWh FOREIGN KEY (from_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id),
    CONSTRAINT FK_Transfer_ToWh FOREIGN KEY (to_warehouse_id) REFERENCES dbo.Warehouses(warehouse_id)
);
GO

-- 17. BẢNG NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AuditLogs)
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
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

-- TẠO CHỈ MỤC TỐI ƯU TRA CỨU
CREATE NONCLUSTERED INDEX IX_Assets_Category ON dbo.Assets(category_id);
CREATE NONCLUSTERED INDEX IX_Assets_Warehouse ON dbo.Assets(warehouse_id);
CREATE NONCLUSTERED INDEX IX_Assets_Status ON dbo.Assets(status);
CREATE NONCLUSTERED INDEX IX_Assets_QR ON dbo.Assets(qr_code);
CREATE NONCLUSTERED INDEX IX_AssetEvents_AssetId ON dbo.AssetEvents(asset_id);
CREATE NONCLUSTERED INDEX IX_PO_Status ON dbo.PurchaseOrders(status);
CREATE NONCLUSTERED INDEX IX_Requests_Status ON dbo.Requests(status);
CREATE NONCLUSTERED INDEX IX_Tickets_Status ON dbo.SupportTickets(status);
GO

PRINT '>>> THACO AGRI ASSET MANAGEMENT DATABASE SCHEMA CREATED SUCCESSFULLY! <<<';
GO
`;
