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
    CONSTRAINT FK_Department_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 3. BẢNG NHÂN VIÊN (Employee)
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL DROP TABLE dbo.Employees;
CREATE TABLE dbo.Employees (
    employee_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    employee_code NVARCHAR(50) NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    unit_id NVARCHAR(50) NOT NULL,
    department_id NVARCHAR(50) NOT NULL,
    position NVARCHAR(100) NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('CBNV', 'THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY')),
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Employee_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id),
    CONSTRAINT FK_Employee_Dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

-- 4. BẢNG KHO (Warehouse)
IF OBJECT_ID('dbo.Warehouses', 'U') IS NOT NULL DROP TABLE dbo.Warehouses;
CREATE TABLE dbo.Warehouses (
    warehouse_id NVARCHAR(50) NOT NULL PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    unit_id NVARCHAR(50) NOT NULL,
    location NVARCHAR(500) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Warehouse_Unit FOREIGN KEY (unit_id) REFERENCES dbo.OrganizationUnits(unit_id)
);
GO

-- 5. BẢNG DANH MỤC HÀNG HÓA & VẬT TƯ (Category)
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
    prefix NVARCHAR(20) NOT NULL DEFAULT 'AST',
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO
`;
