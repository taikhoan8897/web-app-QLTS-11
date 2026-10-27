export type TrackingType = 'DINH_DANH' | 'TIEU_HAO';

export type UserRole = 
  | 'CBNV' 
  | 'THU_KHO' 
  | 'THU_MUA' 
  | 'KY_THUAT' 
  | 'QUAN_TRI' 
  | 'QUAN_LY';

export type AssetStatus = 
  | 'CHO_DINH_DANH'
  | 'TRONG_KHO'
  | 'DANG_SU_DUNG'
  | 'DANG_SUA_CHUA'
  | 'DANG_DIEU_CHUYEN'
  | 'DA_THANH_LY';

export type RequestStatus = 
  | 'NHAP'
  | 'CHO_TIEP_NHAN'
  | 'DA_TIEP_NHAN'
  | 'DANG_CAP_PHAT'
  | 'CAP_MOT_PHAN'
  | 'CHO_MUA'
  | 'HOAN_THANH'
  | 'TU_CHOI'
  | 'HUY';

export type TicketStatus = 
  | 'MOI'
  | 'DA_TIEP_NHAN'
  | 'DANG_XU_LY'
  | 'CHO_HO_SO'
  | 'CHO_KHO'
  | 'HOAN_THANH'
  | 'TU_CHOI'
  | 'HUY';

export type POStatus = 
  | 'NHAP'
  | 'DA_GUI_THU_MUA'
  | 'DANG_MUA'
  | 'MUA_HANG_HOAN_TAT'
  | 'HOAN_TAT_MOT_PHAN'
  | 'CHO_NHAP_KHO'
  | 'DA_NHAP_KHO'
  | 'DA_DONG';

export type TransferStatus = 
  | 'CHO_XAC_NHAN'
  | 'DANG_DIEU_CHUYEN'
  | 'DA_HOAN_THANH'
  | 'DA_TU_CHOI';

export interface OrganizationUnit {
  unit_id: string;
  code: string;
  name: string;
  short_name: string;
  parent_unit_id?: string | null;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Department {
  department_id: string;
  unit_id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Employee {
  employee_id: string;
  employee_code: string;
  full_name: string;
  unit_id: string; // Đơn vị chi trả lương
  department_id: string;
  position: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: UserRole;
}

export interface Warehouse {
  warehouse_id: string;
  code: string;
  name: string;
  owning_unit_id: string;
  manager_employee_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
}

export interface Supplier {
  supplier_id: string;
  code: string;
  name: string;
  tax_code?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  category_groups?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  note?: string;
}

export interface Category {
  category_id: string;
  code: string;
  name: string;
  group: 
    | 'Thiết bị điện tử văn phòng'
    | 'Thiết bị gia dụng'
    | 'Thiết bị tin học'
    | 'Nội thất văn phòng'
    | 'Văn phòng phẩm & vật tư'
    | 'Phương tiện vận tải';
  tracking_type: TrackingType;
  unit_of_measure: string;
  min_stock: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  prefix?: string;
  estimated_unit_price?: number;
}

export interface Asset {
  asset_id: string;
  asset_code: string;
  category_id: string;
  serial_no: string;
  warranty_from?: string;
  warranty_to?: string;
  purchase_cost: number;
  owning_unit_id: string;
  warehouse_id: string;
  holder_employee_id?: string | null;
  holder_unit_snapshot?: string | null; // Đơn vị chi trả lương chụp tại thời điểm cấp phát
  location: string;
  status: AssetStatus;
  specifications?: string;
  qr_code: string;
  po_id?: string | null;
  created_at: string;
}

export interface StockBalance {
  warehouse_id: string;
  category_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  invested_this_month: number;
  issued_this_month: number;
  average_unit_cost: number;
  updated_at: string;
}

export interface InventoryTransaction {
  transaction_id: string;
  type: 'NHAP_KHO' | 'XUAT_CAP_PHAT' | 'THU_HOI' | 'DIEU_CHINH' | 'THANH_LY';
  warehouse_id: string;
  category_id?: string;
  asset_id?: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  source_type: 'PO' | 'REQUEST' | 'TICKET' | 'TRANSFER' | 'MANUAL';
  source_id?: string;
  recipient_employee_id?: string;
  recipient_unit_id?: string;
  occurred_at: string;
  created_by: string;
  note?: string;
}

export interface PurchaseOrderLine {
  line_id: string;
  po_id: string;
  category_id: string;
  tracking_type: TrackingType;
  qty_requested: number;
  qty_ordered: number;
  qty_received: number;
  qty_identified: number;
  estimated_unit_price: number;
  actual_unit_price: number;
  amount: number;
  warehouse_id: string;
  source_type: 'KHO' | 'YEU_CAU_CBNV' | 'TICKET_KY_THUAT' | 'MANUAL';
  source_id?: string;
  source_code?: string;
  source_name?: string;
  status: 'CHO_NHAN' | 'NHAN_MOT_PHAN' | 'DA_NHAP_KHO';
}

export interface ProcurementDemandItem {
  demand_id: string;
  source_type: 'YEU_CAU_CBNV' | 'TICKET_KY_THUAT' | 'THU_KHO_TU_TAO';
  source_id: string; // e.g. "REQ-2026-004", "TCK-2026-001", "MANUAL-001"
  source_code: string; // e.g. "YC-LT-2026-004", "TK-IT-2026-001"
  source_title: string; // Tiêu đề/Lý do phát sinh
  requester_name: string; // CBNV đề xuất hoặc KTV
  requester_unit: string;
  category_id: string;
  qty_needed: number;
  estimated_unit_price: number;
  priority: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
  created_at: string;
  status: 'CHO_GOM_PO' | 'DA_GOM_PO';
  linked_po_id?: string;
  linked_po_code?: string;
  note?: string;
}

export interface PurchaseOrder {
  po_id: string;
  po_code: string;
  source: 'KHO_THIEU_HUT' | 'YEU_CAU_CBNV' | 'TICKET_KY_THUAT' | 'TONG_HOP' | 'GOM_NHIEU_NGUON' | 'MANUAL';
  tracking_type: TrackingType;
  status: POStatus;
  supplier_name?: string;
  created_by: string;
  buyer_id?: string;
  receiving_warehouse_id: string;
  parent_po_id?: string | null;
  total_amount: number;
  created_at: string;
  completed_at?: string;
  note?: string;
  lines: PurchaseOrderLine[];
  aggregated_demand_count?: number; // Số lượng nhu cầu được gom vào PO này
  aggregated_sources_summary?: string; // Tóm tắt nguồn: "2 Yêu cầu cấp phát + 1 Ticket Kỹ thuật"
}

export interface RequestLine {
  request_line_id: string;
  request_id: string;
  category_id: string;
  qty_requested: number;
  qty_reserved: number;
  qty_issued: number;
  qty_to_purchase: number;
  note?: string;
}

export interface Request {
  request_id: string;
  request_code: string;
  requester_id: string;
  unit_id: string;
  request_type: 
    | 'CAP_VAN_PHONG_PHAM' 
    | 'CAP_DONG_PHUC' 
    | 'CAP_MAY_TINH_LAPTOP' 
    | 'CAP_THIET_BI_CNTT';
  purpose: string;
  priority: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
  status: RequestStatus;
  rejection_reason?: string;
  attachment_file?: {
    file_name: string;
    uploaded_at: string;
    file_size: string;
  };
  created_at: string;
  lines: RequestLine[];
  po_id?: string;
}

export interface TicketMaterial {
  ticket_material_id: string;
  ticket_id: string;
  category_id: string;
  qty: number;
  action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI';
  note?: string;
}

export interface SupportTicket {
  ticket_id: string;
  ticket_code: string;
  reporter_id: string;
  unit_id: string;
  asset_id?: string | null;
  issue_type: 
    | 'SU_CO_PHAN_CUNG' 
    | 'SU_CO_PHAN_MEM' 
    | 'SU_CO_MANG_KET_NOI' 
    | 'HU_HONG_LINH_KIEN' 
    | 'YEU_CAU_BAO_TRI';
  description: string;
  priority: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
  status: TicketStatus;
  assigned_to?: string | null;
  diagnosis?: string;
  resolution?: string;
  solution_scenario?: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI';
  materials: TicketMaterial[];
  attachment_file?: {
    file_name: string;
    uploaded_at: string;
  };
  signed_proposal_file?: {
    file_name: string;
    uploaded_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AssetEvent {
  event_id: string;
  asset_id: string;
  event_type: 
    | 'NHAP_KHO' 
    | 'BAN_GIAO_CAP_PHAT' 
    | 'SUA_CHUA' 
    | 'DIEU_CHUYEN' 
    | 'THU_HOI' 
    | 'THANH_LY';
  occurred_at: string;
  before_status?: AssetStatus;
  after_status?: AssetStatus;
  from_unit?: string;
  to_unit?: string;
  from_holder?: string;
  to_holder?: string;
  source_type?: 'PO' | 'REQUEST' | 'TICKET' | 'TRANSFER' | 'MANUAL';
  source_id?: string;
  note?: string;
  performed_by: string;
}

export interface TransferLine {
  transfer_line_id: string;
  transfer_id: string;
  asset_id: string;
}

export interface Transfer {
  transfer_id: string;
  code: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  dispatched_at: string;
  dispatched_by: string;
  received_at?: string;
  received_by?: string;
  status: TransferStatus;
  reason: string;
  lines: TransferLine[];
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_value?: string;
  after_value?: string;
  occurred_at: string;
  reason?: string;
}

// -------------------------------------------------------------
// CHI PHÍ DỊCH VỤ & CẤU HÌNH DANH MỤC CHI PHÍ DỊCH VỤ
// -------------------------------------------------------------
export interface ExpenseCategory {
  expense_category_id: string;
  code: string;
  name: string;
  group_code: string;
  group_name: string;
  category_type: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceExpense {
  expense_id: string;
  expense_code: string;
  occurred_at: string;
  expense_category_id: string;
  expense_name: string;
  group_code?: string;
  group_name?: string;
  category_type: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  description: string;
  invoice_ref?: string;
  attachment_file?: string;
  created_by: string;
  created_at: string;
}

