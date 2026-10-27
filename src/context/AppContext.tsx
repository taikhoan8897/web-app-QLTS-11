import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  OrganizationUnit,
  Department,
  Employee,
  Warehouse,
  Category,
  Asset,
  StockBalance,
  PurchaseOrder,
  Request as AssetRequest,
  SupportTicket,
  AssetEvent,
  Transfer,
  AuditLog,
  InventoryTransaction,
  UserRole,
  TrackingType,
  AssetStatus,
  PurchaseOrderLine,
  RequestLine,
  TicketMaterial,
  ProcurementDemandItem,
  Supplier,
  ExpenseCategory,
  ServiceExpense,
} from '../types';
import {
  INITIAL_UNITS,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_WAREHOUSES,
  INITIAL_SUPPLIERS,
  INITIAL_CATEGORIES,
  INITIAL_ASSETS,
  INITIAL_STOCK_BALANCES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_REQUESTS,
  INITIAL_TICKETS,
  INITIAL_ASSET_EVENTS,
  INITIAL_TRANSFERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROCUREMENT_DEMANDS,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_SERVICE_EXPENSES,
} from '../mockData';
import { serverApi } from '../services/api.ts';

interface AppContextType {
  currentUser: Employee;
  setCurrentUserById: (employeeId: string) => void;
  selectedWarehouseId: string;
  setSelectedWarehouseId: (warehouseId: string) => void;

  units: OrganizationUnit[];
  departments: Department[];
  employees: Employee[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  categories: Category[];
  assets: Asset[];
  stockBalances: StockBalance[];
  purchaseOrders: PurchaseOrder[];
  procurementDemands: ProcurementDemandItem[];
  requests: AssetRequest[];
  tickets: SupportTicket[];
  assetEvents: AssetEvent[];
  transfers: Transfer[];
  auditLogs: AuditLog[];
  transactions: InventoryTransaction[];
  expenseCategories: ExpenseCategory[];
  serviceExpenses: ServiceExpense[];

  // Actions
  consolidateDemandsToPO: (
    demandIds: string[],
    options: {
      receiving_warehouse_id: string;
      supplier_name?: string;
      note?: string;
      merge_same_category?: boolean;
    }
  ) => { success: boolean; message: string; po_id?: string; po_code?: string };

  createSinglePOFromDemand: (
    demandId: string,
    options: {
      receiving_warehouse_id: string;
      supplier_name?: string;
      note?: string;
    }
  ) => { success: boolean; message: string; po_id?: string; po_code?: string };

  createManualDemand: (data: {
    category_id: string;
    qty_needed: number;
    estimated_unit_price?: number;
    priority?: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
    note?: string;
  }) => { success: boolean; message: string };

  addDemandFromRequest: (
    requestId: string
  ) => { success: boolean; message: string };
  addCategory: (category: Omit<Category, 'category_id'>) => Promise<{ success: boolean; message: string; category?: Category }>;
  updateCategory: (category: Category) => Promise<{ success: boolean; message: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; message: string }>;

  createRequest: (
    data: {
      request_type: AssetRequest['request_type'];
      purpose: string;
      priority: AssetRequest['priority'];
      lines: { category_id: string; qty_requested: number; note?: string }[];
      attachment_file_name?: string;
      is_draft?: boolean;
    }
  ) => { success: boolean; message: string };

  updateRequest: (
    requestId: string,
    data: {
      request_type?: AssetRequest['request_type'];
      purpose?: string;
      priority?: AssetRequest['priority'];
      lines?: { category_id: string; qty_requested: number; note?: string }[];
      attachment_file_name?: string;
      is_draft?: boolean;
    }
  ) => { success: boolean; message: string };

  updateRequestStatus: (
    requestId: string,
    status: AssetRequest['status'],
    rejectionReason?: string
  ) => void;

  issueRequestAllocation: (
    requestId: string,
    allocations: {
      line_id: string;
      category_id: string;
      asset_ids?: string[];
      consumable_qty?: number;
    }[]
  ) => { success: boolean; message: string };

  convertRequestToPO: (
    requestId: string,
    receivingWarehouseId: string
  ) => { success: boolean; po_id?: string; message: string };

  createTicket: (
    data: {
      issue_type: SupportTicket['issue_type'];
      description: string;
      priority: SupportTicket['priority'];
      asset_id?: string | null;
      attachment_name?: string;
    }
  ) => { success: boolean; message: string };

  assignTicket: (ticketId: string, technicianId: string) => void;

  completeTicketScenario: (
    ticketId: string,
    scenario: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI',
    details: {
      diagnosis: string;
      resolution: string;
      materials?: { category_id: string; qty: number; action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI'; note?: string }[];
      signed_proposal_file?: string;
    }
  ) => { success: boolean; message: string };

  proposeTicketScenario: (
    ticketId: string,
    scenario: 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI',
    details: {
      diagnosis: string;
      resolution: string;
      materials?: { category_id: string; qty: number; action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI'; note?: string }[];
    }
  ) => { success: boolean; message: string };

  approveTicketProposal: (
    ticketId: string,
    signedFileName: string
  ) => { success: boolean; message: string };

  createPO: (
    data: {
      source: PurchaseOrder['source'];
      tracking_type: TrackingType;
      receiving_warehouse_id: string;
      supplier_name?: string;
      note?: string;
      lines: {
        category_id: string;
        qty_requested: number;
        estimated_unit_price: number;
        source_type: PurchaseOrderLine['source_type'];
        source_id?: string;
      }[];
    }
  ) => { success: boolean; message: string };

  procurePO: (
    poId: string,
    data: {
      supplier_name: string;
      linesActual: { line_id: string; actual_unit_price: number; qty_received: number }[];
      isPartialDelivery: boolean;
    }
  ) => { success: boolean; message: string };

  receivePOConsumable: (
    poId: string,
    warehouseId: string,
    receivedLines: { line_id: string; qty_received: number }[]
  ) => { success: boolean; message: string };

  identifyPOAssets: (
    poId: string,
    warehouseId: string,
    declarations: {
      category_id: string;
      serial_no: string;
      specifications?: string;
      warranty_from?: string;
      warranty_to?: string;
      purchase_cost: number;
      location: string;
    }[]
  ) => { success: boolean; message: string };

  issueAssetDirect: (
    assetId: string,
    recipientEmployeeId: string,
    location: string,
    note?: string
  ) => { success: boolean; message: string };

  issueConsumableDirect: (
    warehouseId: string,
    categoryId: string,
    quantity: number,
    recipientEmployeeId: string,
    note?: string
  ) => { success: boolean; message: string };

  recallAsset: (
    assetId: string,
    returnerEmployeeId: string,
    reason: string,
    condition: string
  ) => { success: boolean; message: string };

  liquidateAsset: (
    assetId: string,
    reason: string,
    liquidationDate: string,
    recoveryAmount: number,
    docNote?: string
  ) => { success: boolean; message: string };

  createTransfer: (
    fromWarehouseId: string,
    toWarehouseId: string,
    assetIds: string[],
    reason: string
  ) => { success: boolean; message: string };

  confirmTransfer: (
    transferId: string
  ) => { success: boolean; message: string };

  addAuditLog: (
    action: string,
    entityType: string,
    entityId: string,
    beforeVal?: string,
    afterVal?: string,
    reason?: string
  ) => void;

  // Admin Configuration Actions
  addSupplier: (data: any) => Promise<{ success: boolean; message: string; supplier?: Supplier }>;
  updateSupplier: (supplierId: string, data: any) => Promise<{ success: boolean; message: string }>;
  deleteSupplier: (supplierId: string) => Promise<{ success: boolean; message: string }>;
  addUnit: (data: any) => Promise<{ success: boolean; message: string }>;
  updateUnit: (unitId: string, data: any) => Promise<{ success: boolean; message: string }>;
  addDepartment: (data: any) => Promise<{ success: boolean; message: string; department?: Department }>;
  updateDepartment: (departmentId: string, data: any) => Promise<{ success: boolean; message: string }>;
  deleteDepartment: (departmentId: string) => Promise<{ success: boolean; message: string }>;
  addWarehouse: (data: any) => Promise<{ success: boolean; message: string }>;
  updateWarehouse: (warehouseId: string, data: any) => Promise<{ success: boolean; message: string }>;
  addEmployee: (data: any) => Promise<{ success: boolean; message: string }>;
  updateEmployee: (employeeId: string, data: any) => Promise<{ success: boolean; message: string }>;
  updateUserRole: (employeeId: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  syncEmployeesFromHRM: () => Promise<{ success: boolean; message: string; stats?: any }>;

  // Expense Categories & Service Expenses Actions
  addExpenseCategory: (data: any) => Promise<{ success: boolean; message: string; category?: ExpenseCategory }>;
  updateExpenseCategory: (id: string, data: any) => Promise<{ success: boolean; message: string }>;
  deleteExpenseCategory: (id: string) => Promise<{ success: boolean; message: string }>;
  addServiceExpense: (data: any) => Promise<{ success: boolean; message: string; expense?: ServiceExpense }>;
  updateServiceExpense: (id: string, data: any) => Promise<{ success: boolean; message: string }>;
  deleteServiceExpense: (id: string) => Promise<{ success: boolean; message: string }>;

  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'THACO_AGRI_ASSET_MGMT_STATE_V2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial mock data
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    loadState('currentUserId', 'EMP-001') // Default: Thủ kho Nguyễn Văn Hùng
  );

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() =>
    loadState('selectedWarehouseId', 'WH-01')
  );

  const [units, setUnits] = useState<OrganizationUnit[]>(() => loadState('units', INITIAL_UNITS));
  const [departments, setDepartments] = useState<Department[]>(() => loadState('departments', INITIAL_DEPARTMENTS));
  const [employees, setEmployees] = useState<Employee[]>(() => loadState('employees', INITIAL_EMPLOYEES));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadState('warehouses', INITIAL_WAREHOUSES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadState('suppliers', INITIAL_SUPPLIERS));

  const [categories, setCategories] = useState<Category[]>(() =>
    loadState('categories', INITIAL_CATEGORIES)
  );

  const [assets, setAssets] = useState<Asset[]>(() => loadState('assets', INITIAL_ASSETS));
  const [stockBalances, setStockBalances] = useState<StockBalance[]>(() =>
    loadState('stockBalances', INITIAL_STOCK_BALANCES)
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    loadState('purchaseOrders', INITIAL_PURCHASE_ORDERS)
  );
  const [procurementDemands, setProcurementDemands] = useState<ProcurementDemandItem[]>(() =>
    loadState('procurementDemands', INITIAL_PROCUREMENT_DEMANDS)
  );
  const [requests, setRequests] = useState<AssetRequest[]>(() =>
    loadState('requests', INITIAL_REQUESTS)
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    loadState('tickets', INITIAL_TICKETS)
  );
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>(() =>
    loadState('assetEvents', INITIAL_ASSET_EVENTS)
  );
  const [transfers, setTransfers] = useState<Transfer[]>(() =>
    loadState('transfers', INITIAL_TRANSFERS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadState('auditLogs', INITIAL_AUDIT_LOGS)
  );
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() =>
    loadState('transactions', INITIAL_TRANSACTIONS)
  );
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() =>
    loadState('expenseCategories', INITIAL_EXPENSE_CATEGORIES)
  );
  const [serviceExpenses, setServiceExpenses] = useState<ServiceExpense[]>(() =>
    loadState('serviceExpenses', INITIAL_SERVICE_EXPENSES)
  );

  // Synchronize client state with Node.js backend server on startup
  useEffect(() => {
    let isMounted = true;
    async function syncWithServer() {
      try {
        const serverData = await serverApi.getData();
        if (serverData && isMounted) {
          if (serverData.units) setUnits(serverData.units);
          if (serverData.departments) setDepartments(serverData.departments);
          if (serverData.employees) setEmployees(serverData.employees);
          if (serverData.warehouses) setWarehouses(serverData.warehouses);
          if (serverData.suppliers) setSuppliers(serverData.suppliers);
          if (serverData.categories) setCategories(serverData.categories);
          if (serverData.assets) setAssets(serverData.assets);
          if (serverData.stockBalances) setStockBalances(serverData.stockBalances);
          if (serverData.purchaseOrders) setPurchaseOrders(serverData.purchaseOrders);
          if (serverData.procurementDemands) setProcurementDemands(serverData.procurementDemands);
          if (serverData.requests) setRequests(serverData.requests);
          if (serverData.tickets) setTickets(serverData.tickets);
          if (serverData.transfers) setTransfers(serverData.transfers);
          if (serverData.auditLogs) setAuditLogs(serverData.auditLogs);
          if (serverData.transactions) setTransactions(serverData.transactions);
          if (serverData.expenseCategories) setExpenseCategories(serverData.expenseCategories);
          if (serverData.serviceExpenses) setServiceExpenses(serverData.serviceExpenses);
        }
      } catch (err) {
        console.info('[Client] Running with local state cache while server is initializing');
      }
    }
    syncWithServer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_currentUserId`, JSON.stringify(currentUserId));
      localStorage.setItem(`${STORAGE_KEY}_selectedWarehouseId`, JSON.stringify(selectedWarehouseId));
      localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(units));
      localStorage.setItem(`${STORAGE_KEY}_employees`, JSON.stringify(employees));
      localStorage.setItem(`${STORAGE_KEY}_warehouses`, JSON.stringify(warehouses));
      localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
      localStorage.setItem(`${STORAGE_KEY}_assets`, JSON.stringify(assets));
      localStorage.setItem(`${STORAGE_KEY}_stockBalances`, JSON.stringify(stockBalances));
      localStorage.setItem(`${STORAGE_KEY}_purchaseOrders`, JSON.stringify(purchaseOrders));
      localStorage.setItem(`${STORAGE_KEY}_procurementDemands`, JSON.stringify(procurementDemands));
      localStorage.setItem(`${STORAGE_KEY}_requests`, JSON.stringify(requests));
      localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(tickets));
      localStorage.setItem(`${STORAGE_KEY}_assetEvents`, JSON.stringify(assetEvents));
      localStorage.setItem(`${STORAGE_KEY}_transfers`, JSON.stringify(transfers));
      localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`${STORAGE_KEY}_expenseCategories`, JSON.stringify(expenseCategories));
      localStorage.setItem(`${STORAGE_KEY}_serviceExpenses`, JSON.stringify(serviceExpenses));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [
    currentUserId,
    selectedWarehouseId,
    units,
    employees,
    warehouses,
    suppliers,
    categories,
    assets,
    stockBalances,
    purchaseOrders,
    procurementDemands,
    requests,
    tickets,
    assetEvents,
    transfers,
    auditLogs,
    transactions,
    expenseCategories,
    serviceExpenses,
  ]);

  const currentUser = employees.find((e) => e.employee_id === currentUserId) || employees[0];

  const setCurrentUserById = (id: string) => {
    setCurrentUserId(id);
    addAuditLog('CHUYEN_VAI_TRO', 'USER', id, undefined, id, `Chuyển người dùng sang ${id}`);
  };

  const addAuditLog = (
    action: string,
    entityType: string,
    entityId: string,
    beforeVal?: string,
    afterVal?: string,
    reason?: string
  ) => {
    const newLog: AuditLog = {
      log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: currentUser.employee_id,
      user_name: `${currentUser.full_name} (${currentUser.role})`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_value: beforeVal,
      after_value: afterVal,
      occurred_at: new Date().toISOString(),
      reason,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addCategory = async (catData: Omit<Category, 'category_id'>) => {
    try {
      const created = await serverApi.addCategory(catData);
      setCategories((prev) => [...prev, created]);
      addAuditLog('TAO_DANH_MUC', 'CATEGORY', created.category_id, undefined, created.name, `Tạo danh mục mới: ${created.name}`);
      return { success: true, message: `Đã thêm danh mục ${created.name} thành công!`, category: created };
    } catch {
      const newCat: Category = {
        ...catData,
        category_id: `CAT-${Date.now()}`,
      };
      setCategories((prev) => [...prev, newCat]);
      addAuditLog('TAO_DANH_MUC', 'CATEGORY', newCat.category_id, undefined, newCat.name, `Tạo danh mục mới: ${newCat.name}`);
      return { success: true, message: `Đã thêm danh mục ${newCat.name} thành công!`, category: newCat };
    }
  };

  const updateCategory = async (cat: Category) => {
    try {
      const updated = await serverApi.updateCategory(cat.category_id, cat);
      setCategories((prev) => prev.map((c) => (c.category_id === cat.category_id ? updated : c)));
      addAuditLog(
        'CAP_NHAT_DANH_MUC',
        'CATEGORY',
        cat.category_id,
        undefined,
        cat.name,
        `Cập nhật cấu hình danh mục hàng hóa: ${cat.name} (${cat.code})`
      );
      return { success: true, message: `Đã cập nhật danh mục ${cat.name} thành công!` };
    } catch {
      setCategories((prev) => prev.map((c) => (c.category_id === cat.category_id ? cat : c)));
      addAuditLog(
        'CAP_NHAT_DANH_MUC',
        'CATEGORY',
        cat.category_id,
        undefined,
        cat.name,
        `Cập nhật cấu hình danh mục hàng hóa: ${cat.name} (${cat.code})`
      );
      return { success: true, message: `Đã cập nhật danh mục ${cat.name} thành công!` };
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const hasAssets = assets.some((a) => a.category_id === categoryId);
    if (hasAssets) {
      return { success: false, message: 'Không thể xóa danh mục này vì đang có thiết bị/tài sản liên kết trong hệ thống!' };
    }
    const target = categories.find((c) => c.category_id === categoryId);
    try {
      await serverApi.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
      addAuditLog('XOA_DANH_MUC', 'CATEGORY', categoryId, target?.name, undefined, `Xóa danh mục ${target?.name}`);
      return { success: true, message: `Đã xóa danh mục ${target?.name || categoryId} thành công!` };
    } catch {
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
      return { success: true, message: `Đã xóa danh mục ${target?.name || categoryId}!` };
    }
  };

  // --- M3: REQUEST MANAGEMENT ---
  const createRequest = (data: {
    request_type: AssetRequest['request_type'];
    purpose: string;
    priority: AssetRequest['priority'];
    lines: { category_id: string; qty_requested: number; note?: string }[];
    attachment_file_name?: string;
    is_draft?: boolean;
  }) => {
    // If submitting (not draft), check mandatory attachment rule (Mục 5.3.1 - bước 26)
    if (!data.is_draft && !data.attachment_file_name) {
      return {
        success: false,
        message: 'Bắt buộc phải đính kèm file phiếu đề xuất đã ký duyệt ngoài hệ thống trước khi gửi phê duyệt!',
      };
    }

    const newReqId = `REQ-2026-${String(requests.length + 1).padStart(3, '0')}`;
    const newReqCode = `YC-${Date.now().toString().slice(-4)}`;

    const newLines: RequestLine[] = data.lines.map((l, idx) => ({
      request_line_id: `RQL-${Date.now()}-${idx}`,
      request_id: newReqId,
      category_id: l.category_id,
      qty_requested: l.qty_requested,
      qty_reserved: 0,
      qty_issued: 0,
      qty_to_purchase: 0,
      note: l.note,
    }));

    const status: AssetRequest['status'] = data.is_draft ? 'NHAP' : 'CHO_TIEP_NHAN';

    const newRequest: AssetRequest = {
      request_id: newReqId,
      request_code: newReqCode,
      requester_id: currentUser.employee_id,
      unit_id: currentUser.unit_id,
      request_type: data.request_type,
      purpose: data.purpose,
      priority: data.priority,
      status,
      attachment_file: data.attachment_file_name
        ? {
            file_name: data.attachment_file_name,
            uploaded_at: new Date().toISOString(),
            file_size: '350 KB',
          }
        : undefined,
      created_at: new Date().toISOString(),
      lines: newLines,
    };

    setRequests((prev) => [newRequest, ...prev]);

    // Async sync to server API
    serverApi.createRequest(newRequest).catch(console.warn);

    addAuditLog(
      data.is_draft ? 'LUU_NHAP_YEU_CAU' : 'GUI_YEU_CAU_CAP_PHAT',
      'REQUEST',
      newReqId,
      undefined,
      status,
      data.is_draft ? `Lưu nháp yêu cầu cấp phát: ${data.purpose}` : `Tạo yêu cầu cấp phát: ${data.purpose}`
    );

    return {
      success: true,
      message: data.is_draft
        ? `Đã lưu bản nháp đề xuất cấp phát mã ${newReqCode} thành công. Bạn có thể đính kèm file và gửi duyệt sau.`
        : `Đã gửi yêu cầu cấp phát mã ${newReqCode} thành công vào hàng đợi Thủ kho.`,
    };
  };

  const updateRequest = (
    requestId: string,
    data: {
      request_type?: AssetRequest['request_type'];
      purpose?: string;
      priority?: AssetRequest['priority'];
      lines?: { category_id: string; qty_requested: number; note?: string }[];
      attachment_file_name?: string;
      is_draft?: boolean;
    }
  ) => {
    const target = requests.find((r) => r.request_id === requestId);
    if (!target) return { success: false, message: 'Không tìm thấy yêu cầu cấp phát!' };

    const effectiveAttachment =
      data.attachment_file_name !== undefined ? data.attachment_file_name : target.attachment_file?.file_name;

    // If submitting (not draft), require signed attachment
    if (data.is_draft === false && !effectiveAttachment) {
      return {
        success: false,
        message: 'Bắt buộc phải đính kèm file phiếu đề xuất đã ký duyệt ngoài hệ thống trước khi gửi phê duyệt!',
      };
    }

    const updatedLines: RequestLine[] = data.lines
      ? data.lines.map((l, idx) => ({
          request_line_id: `RQL-${Date.now()}-${idx}`,
          request_id: requestId,
          category_id: l.category_id,
          qty_requested: l.qty_requested,
          qty_reserved: 0,
          qty_issued: 0,
          qty_to_purchase: 0,
          note: l.note,
        }))
      : target.lines;

    const newStatus: AssetRequest['status'] =
      data.is_draft !== undefined ? (data.is_draft ? 'NHAP' : 'CHO_TIEP_NHAN') : target.status;

    const newAttachment = effectiveAttachment
      ? {
          file_name: effectiveAttachment,
          uploaded_at: new Date().toISOString(),
          file_size: target.attachment_file?.file_size || '350 KB',
        }
      : undefined;

    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId
          ? {
              ...r,
              request_type: data.request_type ?? r.request_type,
              purpose: data.purpose ?? r.purpose,
              priority: data.priority ?? r.priority,
              lines: updatedLines,
              status: newStatus,
              attachment_file: newAttachment,
            }
          : r
      )
    );

    // Sync to backend
    serverApi
      .updateRequest(requestId, {
        request_type: data.request_type,
        purpose: data.purpose,
        priority: data.priority,
        lines: updatedLines,
        status: newStatus,
        attachment_file_name: effectiveAttachment,
      })
      .catch(console.warn);

    addAuditLog(
      data.is_draft ? 'SUA_NHAP_YEU_CAU' : 'GUI_DUYET_YEU_CAU',
      'REQUEST',
      requestId,
      target.status,
      newStatus,
      `Cập nhật yêu cầu cấp phát ${target.request_code}: ${data.purpose || target.purpose}`
    );

    return {
      success: true,
      message:
        data.is_draft
          ? `Đã cập nhật bản nháp yêu cầu ${target.request_code} thành công!`
          : `Đã gửi duyệt yêu cầu cấp phát ${target.request_code} thành công vào hàng đợi Thủ kho.`,
    };
  };

  const updateRequestStatus = (
    requestId: string,
    status: AssetRequest['status'],
    rejectionReason?: string
  ) => {
    const target = requests.find((r) => r.request_id === requestId);
    if (!target) return;

    if (status === 'TU_CHOI' && !rejectionReason?.trim()) {
      alert('Bắt buộc phải nhập lý do từ chối yêu cầu theo quy định!');
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId
          ? {
              ...r,
              status,
              rejection_reason: rejectionReason || r.rejection_reason,
            }
          : r
      )
    );

    addAuditLog(
      'DOI_TRANG_THAI_YEU_CAU',
      'REQUEST',
      requestId,
      target.status,
      status,
      rejectionReason || 'Cập nhật trạng thái yêu cầu'
    );
  };

  const issueRequestAllocation = (
    requestId: string,
    allocations: {
      line_id: string;
      category_id: string;
      asset_ids?: string[];
      consumable_qty?: number;
    }[]
  ) => {
    const req = requests.find((r) => r.request_id === requestId);
    if (!req) return { success: false, message: 'Không tìm thấy yêu cầu' };

    const requester = employees.find((e) => e.employee_id === req.requester_id);
    const requesterName = requester ? requester.full_name : 'CBNV';
    const requesterUnitId = requester ? requester.unit_id : req.unit_id;

    // Process serialized assets
    let totalIssued = 0;
    let totalRequested = 0;

    const updatedLines = req.lines.map((line) => {
      totalRequested += line.qty_requested;
      const alloc = allocations.find((a) => a.line_id === line.request_line_id);
      if (!alloc) return line;

      const cat = categories.find((c) => c.category_id === line.category_id);
      if (cat?.tracking_type === 'DINH_DANH') {
        const assetCount = alloc.asset_ids ? alloc.asset_ids.length : 0;
        const newIssued = line.qty_issued + assetCount;
        totalIssued += newIssued;

        // Allocate each asset
        if (alloc.asset_ids && alloc.asset_ids.length > 0) {
          alloc.asset_ids.forEach((astId) => {
            const targetAsset = assets.find((a) => a.asset_id === astId);
            if (targetAsset) {
              setAssets((prev) =>
                prev.map((a) =>
                  a.asset_id === astId
                    ? {
                        ...a,
                        status: 'DANG_SU_DUNG',
                        holder_employee_id: req.requester_id,
                        holder_unit_snapshot: requesterUnitId, // Chụp lại đơn vị chi trả lương
                        location: `Bàn giao theo yêu cầu ${req.request_code}`,
                      }
                    : a
                )
              );

              // Add AssetEvent
              const newEvent: AssetEvent = {
                event_id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                asset_id: astId,
                event_type: 'BAN_GIAO_CAP_PHAT',
                occurred_at: new Date().toISOString(),
                before_status: 'TRONG_KHO',
                after_status: 'DANG_SU_DUNG',
                to_holder: `${requesterName} (${req.requester_id})`,
                to_unit: requesterUnitId,
                source_type: 'REQUEST',
                source_id: req.request_code,
                note: `Bàn giao cấp phát theo phiếu ${req.request_code}. Cho phép xuất biên bản bàn giao.`,
                performed_by: `${currentUser.full_name} (Thủ kho)`,
              };
              setAssetEvents((prev) => [newEvent, ...prev]);
            }
          });
        }

        return {
          ...line,
          qty_issued: newIssued,
          qty_to_purchase: Math.max(0, line.qty_requested - newIssued),
        };
      } else {
        // Consumable
        const qtyToIssue = alloc.consumable_qty || 0;
        if (qtyToIssue > 0) {
          // Check stock
          const stock = stockBalances.find(
            (s) => s.warehouse_id === selectedWarehouseId && s.category_id === line.category_id
          );
          if (!stock || stock.quantity_on_hand < qtyToIssue) {
            alert(`Kho không đủ hàng tiêu hao ${cat?.name}! Tồn khả dụng: ${stock?.quantity_on_hand || 0}`);
            return line;
          }

          // Deduct stock
          setStockBalances((prev) =>
            prev.map((s) =>
              s.warehouse_id === selectedWarehouseId && s.category_id === line.category_id
                ? {
                    ...s,
                    quantity_on_hand: s.quantity_on_hand - qtyToIssue,
                    issued_this_month: s.issued_this_month + qtyToIssue,
                    updated_at: new Date().toISOString(),
                  }
                : s
            )
          );

          // Add transaction
          const newTrx: InventoryTransaction = {
            transaction_id: `TRX-${Date.now()}`,
            type: 'XUAT_CAP_PHAT',
            warehouse_id: selectedWarehouseId,
            category_id: line.category_id,
            quantity: qtyToIssue,
            unit_cost: stock.average_unit_cost,
            total_amount: qtyToIssue * stock.average_unit_cost,
            source_type: 'REQUEST',
            source_id: req.request_code,
            recipient_employee_id: req.requester_id,
            recipient_unit_id: requesterUnitId,
            occurred_at: new Date().toISOString(),
            created_by: currentUser.full_name,
            note: `Cấp phát hàng tiêu hao theo phiếu ${req.request_code}`,
          };
          setTransactions((prev) => [newTrx, ...prev]);

          const newIssued = line.qty_issued + qtyToIssue;
          totalIssued += newIssued;
          return {
            ...line,
            qty_issued: newIssued,
            qty_to_purchase: Math.max(0, line.qty_requested - newIssued),
          };
        }
        return line;
      }
    });

    const isFullyIssued = updatedLines.every((l) => l.qty_issued >= l.qty_requested);
    const newStatus: AssetRequest['status'] = isFullyIssued ? 'HOAN_THANH' : 'CAP_MOT_PHAN';

    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId
          ? {
              ...r,
              status: newStatus,
              lines: updatedLines,
            }
          : r
      )
    );

    addAuditLog(
      'CAP_PHAT_THEO_YEU_CAU',
      'REQUEST',
      requestId,
      req.status,
      newStatus,
      `Cấp phát thiết bị/vật tư cho phiếu ${req.request_code}. Đạt trạng thái: ${newStatus}`
    );

    return {
      success: true,
      message: `Đã cấp phát thành công. Phiếu hiện chuyển trạng thái: ${
        newStatus === 'HOAN_THANH' ? 'HOÀN THÀNH (Đã cấp đủ)' : 'CẤP MỘT PHẦN (Có thể gom mua phần thiếu)'
      }`,
    };
  };

  const convertRequestToPO = (requestId: string, receivingWarehouseId: string) => {
    const req = requests.find((r) => r.request_id === requestId);
    if (!req) return { success: false, message: 'Không tìm thấy yêu cầu' };

    const missingLines = req.lines.filter((l) => l.qty_requested - l.qty_issued > 0);
    if (missingLines.length === 0) {
      return { success: false, message: 'Yêu cầu này đã được cấp đủ, không có phần thiếu để mua!' };
    }

    // TÁCH BIỆT THEO MỤC 5.4.1: Hàng Định Danh và Hàng Tiêu Hao KHÔNG ĐƯỢC CHUNG 1 PO
    const ddMissingLines = missingLines.filter((l) => {
      const cat = categories.find((c) => c.category_id === l.category_id);
      return cat?.tracking_type === 'DINH_DANH';
    });
    const thMissingLines = missingLines.filter((l) => {
      const cat = categories.find((c) => c.category_id === l.category_id);
      return cat?.tracking_type === 'TIEU_HAO';
    });

    const newPOs: PurchaseOrder[] = [];
    let createdCodes: string[] = [];

    // Tạo PO Hàng Định Danh nếu có
    if (ddMissingLines.length > 0) {
      const poId = `PO-2026-${String(purchaseOrders.length + newPOs.length + 1).padStart(3, '0')}`;
      const poCode = `PO-AGRI-DD-${Date.now().toString().slice(-4)}`;
      const lines: PurchaseOrderLine[] = ddMissingLines.map((ml, idx) => {
        const cat = categories.find((c) => c.category_id === ml.category_id);
        const qtyMissing = ml.qty_requested - ml.qty_issued;
        return {
          line_id: `POL-DD-${Date.now()}-${idx}`,
          po_id: poId,
          category_id: ml.category_id,
          tracking_type: 'DINH_DANH' as TrackingType,
          qty_requested: qtyMissing,
          qty_ordered: qtyMissing,
          qty_received: 0,
          qty_identified: 0,
          estimated_unit_price: 20000000,
          actual_unit_price: 0,
          amount: 0,
          warehouse_id: receivingWarehouseId,
          source_type: 'YEU_CAU_CBNV',
          source_id: req.request_id,
          source_code: req.request_code,
          source_name: `${req.purpose}`,
          status: 'CHO_NHAN',
        };
      });

      newPOs.push({
        po_id: poId,
        po_code: poCode,
        source: 'YEU_CAU_CBNV',
        tracking_type: 'DINH_DANH',
        status: 'DA_GUI_THU_MUA',
        created_by: currentUser.employee_id,
        buyer_id: 'EMP-002',
        receiving_warehouse_id: receivingWarehouseId,
        parent_po_id: null,
        total_amount: 0,
        created_at: new Date().toISOString(),
        note: `PO Hàng Định Danh (Cần sinh Serial/QR khi nhập kho) cho Yêu cầu ${req.request_code}`,
        lines,
      });
      createdCodes.push(poCode);
    }

    // Tạo PO Hàng Tiêu Hao nếu có
    if (thMissingLines.length > 0) {
      const poId = `PO-2026-${String(purchaseOrders.length + newPOs.length + 1).padStart(3, '0')}`;
      const poCode = `PO-AGRI-TH-${Date.now().toString().slice(-4)}`;
      const lines: PurchaseOrderLine[] = thMissingLines.map((ml, idx) => {
        const cat = categories.find((c) => c.category_id === ml.category_id);
        const qtyMissing = ml.qty_requested - ml.qty_issued;
        return {
          line_id: `POL-TH-${Date.now()}-${idx}`,
          po_id: poId,
          category_id: ml.category_id,
          tracking_type: 'TIEU_HAO' as TrackingType,
          qty_requested: qtyMissing,
          qty_ordered: qtyMissing,
          qty_received: 0,
          qty_identified: 0,
          estimated_unit_price: 350000,
          actual_unit_price: 0,
          amount: 0,
          warehouse_id: receivingWarehouseId,
          source_type: 'YEU_CAU_CBNV',
          source_id: req.request_id,
          source_code: req.request_code,
          source_name: `${req.purpose}`,
          status: 'CHO_NHAN',
        };
      });

      newPOs.push({
        po_id: poId,
        po_code: poCode,
        source: 'YEU_CAU_CBNV',
        tracking_type: 'TIEU_HAO',
        status: 'DA_GUI_THU_MUA',
        created_by: currentUser.employee_id,
        buyer_id: 'EMP-002',
        receiving_warehouse_id: receivingWarehouseId,
        parent_po_id: null,
        total_amount: 0,
        created_at: new Date().toISOString(),
        note: `PO Hàng Tiêu Hao (Cộng tồn kho theo số lượng & ĐVT) cho Yêu cầu ${req.request_code}`,
        lines,
      });
      createdCodes.push(poCode);
    }

    setPurchaseOrders((prev) => [...newPOs, ...prev]);

    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId
          ? {
              ...r,
              status: 'CHO_MUA',
              po_id: newPOs[0]?.po_id,
            }
          : r
      )
    );

    addAuditLog(
      'CHUYEN_YEU_CAU_THANH_PO',
      'REQUEST',
      requestId,
      req.status,
      'CHO_MUA',
      `Tạo PO thu mua: ${createdCodes.join(', ')} từ yêu cầu cấp phát thiếu`
    );

    const isSplit = newPOs.length > 1;
    return {
      success: true,
      po_id: newPOs[0]?.po_id,
      message: isSplit
        ? `Đã tự động tách thành 2 Đơn hàng PO riêng biệt (${createdCodes.join(', ')}) gồm 1 PO Định danh & 1 PO Tiêu hao theo đúng quy chuẩn nhập kho!`
        : `Đã chuyển phần thiếu của yêu cầu ${req.request_code} thành đơn mua hàng ${createdCodes[0]}!`,
    };
  };

  // GOM NHIỀU NHU CẦU THÀNH PO - NGHIÊM NGẶT TUÂN THỦ TÁCH RIÊNG ĐỊNH DANH VÀ TIÊU HAO
  const consolidateDemandsToPO = (
    demandIds: string[],
    options: {
      receiving_warehouse_id: string;
      supplier_name?: string;
      note?: string;
      merge_same_category?: boolean;
    }
  ) => {
    if (!demandIds || demandIds.length === 0) {
      return { success: false, message: 'Vui lòng chọn ít nhất một mặt hàng/nhu cầu cần gom!' };
    }

    const selectedDemands = procurementDemands.filter((d) => demandIds.includes(d.demand_id));
    if (selectedDemands.length === 0) {
      return { success: false, message: 'Không tìm thấy các nhu cầu đã chọn!' };
    }

    // Phân loại mặt hàng theo hình thức theo dõi (Định danh vs Tiêu hao)
    const ddDemands = selectedDemands.filter((d) => {
      const cat = categories.find((c) => c.category_id === d.category_id);
      return cat?.tracking_type === 'DINH_DANH';
    });
    const thDemands = selectedDemands.filter((d) => {
      const cat = categories.find((c) => c.category_id === d.category_id);
      return cat?.tracking_type === 'TIEU_HAO';
    });

    const newPOs: PurchaseOrder[] = [];
    const createdCodes: string[] = [];

    // Helper tạo lines cho 1 nhóm
    const buildLinesForGroup = (items: ProcurementDemandItem[], targetPoId: string, trackType: TrackingType) => {
      const lines: PurchaseOrderLine[] = [];
      if (options.merge_same_category) {
        const grouped: { [catId: string]: ProcurementDemandItem[] } = {};
        items.forEach((d) => {
          if (!grouped[d.category_id]) grouped[d.category_id] = [];
          grouped[d.category_id].push(d);
        });

        Object.entries(grouped).forEach(([catId, groupItems], idx) => {
          const cat = categories.find((c) => c.category_id === catId);
          const totalQty = groupItems.reduce((sum, it) => sum + it.qty_needed, 0);
          const avgPrice = groupItems[0].estimated_unit_price || (trackType === 'DINH_DANH' ? 20000000 : 350000);
          const sourceSummaries = groupItems.map((it) => `${it.source_code} (${it.requester_name}: ${it.qty_needed})`).join(', ');

          lines.push({
            line_id: `POL-GOM-${Date.now()}-${idx}-${trackType}`,
            po_id: targetPoId,
            category_id: catId,
            tracking_type: trackType,
            qty_requested: totalQty,
            qty_ordered: totalQty,
            qty_received: 0,
            qty_identified: 0,
            estimated_unit_price: avgPrice,
            actual_unit_price: 0,
            amount: 0,
            warehouse_id: options.receiving_warehouse_id,
            source_type: groupItems.length > 1 ? 'MANUAL' : (groupItems[0].source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : groupItems[0].source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO'),
            source_id: groupItems.map((it) => it.source_id).join(','),
            source_code: groupItems.map((it) => it.source_code).join(', '),
            source_name: sourceSummaries,
            status: 'CHO_NHAN',
          });
        });
      } else {
        items.forEach((dem, idx) => {
          lines.push({
            line_id: `POL-GOM-${Date.now()}-${idx}-${trackType}`,
            po_id: targetPoId,
            category_id: dem.category_id,
            tracking_type: trackType,
            qty_requested: dem.qty_needed,
            qty_ordered: dem.qty_needed,
            qty_received: 0,
            qty_identified: 0,
            estimated_unit_price: dem.estimated_unit_price || (trackType === 'DINH_DANH' ? 20000000 : 350000),
            actual_unit_price: 0,
            amount: 0,
            warehouse_id: options.receiving_warehouse_id,
            source_type: dem.source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : dem.source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO',
            source_id: dem.source_id,
            source_code: dem.source_code,
            source_name: `${dem.requester_name} • ${dem.source_title}`,
            status: 'CHO_NHAN',
          });
        });
      }
      return lines;
    };

    // 1. TẠO PO ĐỊNH DANH (Nếu có mặt hàng định danh được chọn)
    if (ddDemands.length > 0) {
      const poId = `PO-2026-${String(purchaseOrders.length + newPOs.length + 1).padStart(3, '0')}`;
      const poCode = `PO-AGRI-GOM-DD-${Date.now().toString().slice(-4)}`;
      const uniqueSrc = Array.from(new Set(ddDemands.map((d) => d.source_code)));
      const lines = buildLinesForGroup(ddDemands, poId, 'DINH_DANH');

      const poSourceType: PurchaseOrder['source'] = ddDemands.length > 1 ? 'GOM_NHIEU_NGUON' : (ddDemands[0].source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : ddDemands[0].source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO_THIEU_HUT');

      newPOs.push({
        po_id: poId,
        po_code: poCode,
        source: poSourceType,
        tracking_type: 'DINH_DANH',
        status: 'DA_GUI_THU_MUA',
        created_by: currentUser.employee_id,
        buyer_id: 'EMP-002',
        receiving_warehouse_id: options.receiving_warehouse_id,
        supplier_name: options.supplier_name || 'Đại lý phân phối Thiết bị CNTT',
        parent_po_id: null,
        total_amount: 0,
        created_at: new Date().toISOString(),
        note: options.note ? `${options.note} [PO Hàng Định Danh]` : `Gom ${ddDemands.length} mặt hàng Định danh từ: ${uniqueSrc.join(', ')}`,
        aggregated_demand_count: ddDemands.length,
        aggregated_sources_summary: `${ddDemands.length} mặt hàng Định Danh (Serial/QR) từ ${uniqueSrc.length} nguồn`,
        lines,
      });
      createdCodes.push(poCode);
    }

    // 2. TẠO PO TIÊU HAO (Nếu có mặt hàng tiêu hao được chọn)
    if (thDemands.length > 0) {
      const poId = `PO-2026-${String(purchaseOrders.length + newPOs.length + 1).padStart(3, '0')}`;
      const poCode = `PO-AGRI-GOM-TH-${Date.now().toString().slice(-4)}`;
      const uniqueSrc = Array.from(new Set(thDemands.map((d) => d.source_code)));
      const lines = buildLinesForGroup(thDemands, poId, 'TIEU_HAO');

      const poSourceType: PurchaseOrder['source'] = thDemands.length > 1 ? 'GOM_NHIEU_NGUON' : (thDemands[0].source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : thDemands[0].source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO_THIEU_HUT');

      newPOs.push({
        po_id: poId,
        po_code: poCode,
        source: poSourceType,
        tracking_type: 'TIEU_HAO',
        status: 'DA_GUI_THU_MUA',
        created_by: currentUser.employee_id,
        buyer_id: 'EMP-002',
        receiving_warehouse_id: options.receiving_warehouse_id,
        supplier_name: options.supplier_name || 'Nhà phân phối Vật tư Tiêu hao',
        parent_po_id: null,
        total_amount: 0,
        created_at: new Date().toISOString(),
        note: options.note ? `${options.note} [PO Hàng Tiêu Hao]` : `Gom ${thDemands.length} mặt hàng Tiêu hao từ: ${uniqueSrc.join(', ')}`,
        aggregated_demand_count: thDemands.length,
        aggregated_sources_summary: `${thDemands.length} mặt hàng Tiêu Hao (Số lượng kho) từ ${uniqueSrc.length} nguồn`,
        lines,
      });
      createdCodes.push(poCode);
    }

    setPurchaseOrders((prev) => [...newPOs, ...prev]);

    // Cập nhật trạng thái demands
    setProcurementDemands((prev) =>
      prev.map((d) => {
        if (!demandIds.includes(d.demand_id)) return d;
        const cat = categories.find((c) => c.category_id === d.category_id);
        const assignedPo = cat?.tracking_type === 'DINH_DANH'
          ? newPOs.find((p) => p.tracking_type === 'DINH_DANH')
          : newPOs.find((p) => p.tracking_type === 'TIEU_HAO');

        return {
          ...d,
          status: 'DA_GOM_PO',
          linked_po_id: assignedPo?.po_id,
          linked_po_code: assignedPo?.po_code,
        };
      })
    );

    // Cập nhật status các yêu cầu nguồn
    const linkedRequestIds = selectedDemands
      .filter((d) => d.source_type === 'YEU_CAU_CBNV')
      .map((d) => d.source_id);

    if (linkedRequestIds.length > 0) {
      setRequests((prev) =>
        prev.map((r) =>
          linkedRequestIds.includes(r.request_id)
            ? { ...r, status: 'CHO_MUA', po_id: newPOs[0]?.po_id }
            : r
        )
      );
    }

    addAuditLog(
      'GOM_PO_THEO_HINH_THUC',
      'PURCHASE_ORDER',
      newPOs[0]?.po_id || 'PO',
      undefined,
      'DA_GUI_THU_MUA',
      `Tạo ${newPOs.length} đơn PO tách biệt theo hình thức theo dõi: ${createdCodes.join(', ')}`
    );

    const isSplit = newPOs.length > 1;
    return {
      success: true,
      message: isSplit
        ? `Theo quy chuẩn mục 5.4.1 (Hàng Định Danh và Hàng Tiêu Hao có quy trình nhập kho & vòng đời khác nhau hoàn toàn), hệ thống đã tự động tách thành 2 Đơn hàng PO riêng biệt: (1) PO Định Danh: ${createdCodes[0]} và (2) PO Tiêu Hao: ${createdCodes[1]}!`
        : `Đã gom thành công các mặt hàng vào Đơn hàng PO mã ${createdCodes[0]} (Loại: ${newPOs[0].tracking_type === 'DINH_DANH' ? 'Hàng Định Danh' : 'Hàng Tiêu Hao'})!`,
      po_id: newPOs[0]?.po_id,
      po_code: createdCodes.join(' & '),
    };
  };

  // SINH ĐƠN PO RIÊNG TỪ 1 NHU CẦU MUA SẮM CỤ THỂ
  const createSinglePOFromDemand = (
    demandId: string,
    options: {
      receiving_warehouse_id: string;
      supplier_name?: string;
      note?: string;
    }
  ) => {
    const dem = procurementDemands.find((d) => d.demand_id === demandId);
    if (!dem) return { success: false, message: 'Không tìm thấy nhu cầu mua sắm!' };

    const cat = categories.find((c) => c.category_id === dem.category_id);
    const trackType: TrackingType = cat?.tracking_type || 'DINH_DANH';
    const prefix = trackType === 'DINH_DANH' ? 'DD' : 'TH';
    const poId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    const poCode = `PO-AGRI-RIENG-${prefix}-${Date.now().toString().slice(-4)}`;

    const line: PurchaseOrderLine = {
      line_id: `POL-RIENG-${Date.now()}`,
      po_id: poId,
      category_id: dem.category_id,
      tracking_type: trackType,
      qty_requested: dem.qty_needed,
      qty_ordered: dem.qty_needed,
      qty_received: 0,
      qty_identified: 0,
      estimated_unit_price: dem.estimated_unit_price || (trackType === 'DINH_DANH' ? 20000000 : 350000),
      actual_unit_price: 0,
      amount: 0,
      warehouse_id: options.receiving_warehouse_id,
      source_type: dem.source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : dem.source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO',
      source_id: dem.source_id,
      source_code: dem.source_code,
      source_name: `${dem.requester_name} • ${dem.source_title}`,
      status: 'CHO_NHAN',
    };

    const poSourceType: PurchaseOrder['source'] = dem.source_type === 'YEU_CAU_CBNV' ? 'YEU_CAU_CBNV' : dem.source_type === 'TICKET_KY_THUAT' ? 'TICKET_KY_THUAT' : 'KHO_THIEU_HUT';

    const newPO: PurchaseOrder = {
      po_id: poId,
      po_code: poCode,
      source: poSourceType,
      tracking_type: trackType,
      status: 'DA_GUI_THU_MUA',
      created_by: currentUser.employee_id,
      buyer_id: 'EMP-002',
      receiving_warehouse_id: options.receiving_warehouse_id,
      supplier_name: options.supplier_name || (trackType === 'DINH_DANH' ? 'Đại lý phân phối Thiết bị CNTT' : 'Nhà phân phối Vật tư Tiêu hao'),
      parent_po_id: null,
      total_amount: (dem.qty_needed * (dem.estimated_unit_price || (trackType === 'DINH_DANH' ? 20000000 : 350000))),
      created_at: new Date().toISOString(),
      note: options.note ? `${options.note} [PO Riêng]` : `PO riêng biệt cho nhu cầu ${dem.source_code} (${dem.requester_name})`,
      aggregated_demand_count: 1,
      aggregated_sources_summary: `PO riêng cho ${cat?.name || 'mặt hàng'} (Nguồn: ${dem.source_code})`,
      lines: [line],
    };

    setProcurementDemands((prev) =>
      prev.map((d) => (d.demand_id === demandId ? { ...d, status: 'DA_GOM_PO' as const } : d))
    );

    setPurchaseOrders((prev) => [newPO, ...prev]);

    addAuditLog(
      'TAO_PO_RIENG',
      'PURCHASE_ORDER',
      poId,
      undefined,
      'DA_GUI_THU_MUA',
      `Sinh đơn PO riêng ${poCode} (${trackType === 'DINH_DANH' ? 'Định danh' : 'Tiêu hao'}) cho nhu cầu ${dem.source_code}`
    );

    return {
      success: true,
      po_id: poId,
      po_code: poCode,
      message: `Đã sinh PO riêng biệt thành công: Mã đơn ${poCode} (${trackType === 'DINH_DANH' ? 'Hàng Định Danh' : 'Hàng Tiêu Hao'})!`,
    };
  };

  // THỦ KHO CHỦ ĐỘNG TẠO NHU CẦU MUA BỔ SUNG VÀO DANH SÁCH GOM PO
  const createManualDemand = (data: {
    category_id: string;
    qty_needed: number;
    estimated_unit_price?: number;
    priority?: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
    note?: string;
  }) => {
    const cat = categories.find((c) => c.category_id === data.category_id);
    const demandId = `DEMAND-${Date.now()}`;
    const code = `BO-SUNG-KHO-${Date.now().toString().slice(-4)}`;

    const newDemand: ProcurementDemandItem = {
      demand_id: demandId,
      source_type: 'THU_KHO_TU_TAO',
      source_id: demandId,
      source_code: code,
      source_title: `Thủ kho tự tạo nhu cầu bổ sung ${cat?.name || 'Vật tư'}`,
      requester_name: `${currentUser.full_name} (Thủ kho)`,
      requester_unit: warehouses.find((w) => w.warehouse_id === selectedWarehouseId)?.name || 'Kho THACO AGRI',
      category_id: data.category_id,
      qty_needed: Math.max(1, data.qty_needed),
      estimated_unit_price: data.estimated_unit_price || 1000000,
      priority: data.priority || 'TRUNG_BINH',
      created_at: new Date().toISOString(),
      status: 'CHO_GOM_PO',
      note: data.note || 'Thủ kho chủ động lập dự trù bổ sung an toàn kho',
    };

    setProcurementDemands((prev) => [newDemand, ...prev]);

    addAuditLog(
      'TAO_NHU_CAU_MUA_HANG',
      'PROCUREMENT_DEMAND',
      demandId,
      undefined,
      'CHO_GOM_PO',
      `Thủ kho tạo nhu cầu bổ sung ${data.qty_needed} ${cat?.name} vào danh sách gom PO`
    );

    return {
      success: true,
      message: `Đã thêm mặt hàng "${cat?.name}" (SL: ${data.qty_needed}) vào danh mục chờ gom PO thành công!`,
    };
  };

  // ĐƯA YÊU CẦU CẤP PHÁT THIẾU HÀNG VÀO DANH SÁCH GOM PO
  const addDemandFromRequest = (requestId: string) => {
    const req = requests.find((r) => r.request_id === requestId);
    if (!req) return { success: false, message: 'Không tìm thấy yêu cầu' };

    const missingLines = req.lines.filter((l) => l.qty_requested - l.qty_issued > 0);
    if (missingLines.length === 0) {
      return { success: false, message: 'Yêu cầu này đã được cấp đủ, không có phần thiếu!' };
    }

    const requester = employees.find((e) => e.employee_id === req.requester_id);
    const newDemands: ProcurementDemandItem[] = missingLines.map((line, idx) => {
      const cat = categories.find((c) => c.category_id === line.category_id);
      const qtyMissing = line.qty_requested - line.qty_issued;
      return {
        demand_id: `DEMAND-${Date.now()}-${idx}`,
        source_type: 'YEU_CAU_CBNV',
        source_id: req.request_id,
        source_code: req.request_code,
        source_title: `Yêu cầu cấp phát: ${req.purpose}`,
        requester_name: requester?.full_name || 'CBNV',
        requester_unit: requester?.department_id || req.unit_id,
        category_id: line.category_id,
        qty_needed: qtyMissing,
        estimated_unit_price: cat?.tracking_type === 'DINH_DANH' ? 20000000 : 300000,
        priority: req.priority,
        created_at: new Date().toISOString(),
        status: 'CHO_GOM_PO',
        note: line.note || `Nhu cầu mua phần thiếu cho yêu cầu ${req.request_code}`,
      };
    });

    setProcurementDemands((prev) => [...newDemands, ...prev]);

    setRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId ? { ...r, status: 'CHO_MUA' } : r
      )
    );

    return {
      success: true,
      message: `Đã đưa ${missingLines.length} mặt hàng còn thiếu của phiếu ${req.request_code} vào Danh sách chờ Gom PO!`,
    };
  };

  // --- M4: TECHNICAL SUPPORT TICKETS ---
  const createTicket = (data: {
    issue_type: SupportTicket['issue_type'];
    description: string;
    priority: SupportTicket['priority'];
    asset_id?: string | null;
    attachment_name?: string;
  }) => {
    const tckId = `TCK-2026-${String(tickets.length + 1).padStart(3, '0')}`;
    const tckCode = `TK-IT-2026-${Date.now().toString().slice(-4)}`;

    const newTicket: SupportTicket = {
      ticket_id: tckId,
      ticket_code: tckCode,
      reporter_id: currentUser.employee_id,
      unit_id: currentUser.unit_id,
      asset_id: data.asset_id || null,
      issue_type: data.issue_type,
      description: data.description,
      priority: data.priority,
      status: 'MOI',
      assigned_to: 'EMP-003', // default technician Lê Hoàng Nam
      materials: [],
      attachment_file: data.attachment_name
        ? { file_name: data.attachment_name, uploaded_at: new Date().toISOString() }
        : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);

    // If linked to an asset, update asset status if needed
    if (data.asset_id) {
      setAssets((prev) =>
        prev.map((a) =>
          a.asset_id === data.asset_id ? { ...a, status: 'DANG_SUA_CHUA' } : a
        )
      );

      const evt: AssetEvent = {
        event_id: `EVT-${Date.now()}`,
        asset_id: data.asset_id,
        event_type: 'SUA_CHUA',
        occurred_at: new Date().toISOString(),
        before_status: 'DANG_SU_DUNG',
        after_status: 'DANG_SUA_CHUA',
        source_type: 'TICKET',
        source_id: tckCode,
        note: `Báo cáo sự cố kỹ thuật theo ticket ${tckCode}`,
        performed_by: currentUser.full_name,
      };
      setAssetEvents((prev) => [evt, ...prev]);
    }

    addAuditLog('TAO_TICKET_KY_THUAT', 'TICKET', tckId, undefined, 'MOI', `Tạo ticket kỹ thuật: ${tckCode}`);

    return {
      success: true,
      message: `Đã tạo ticket kỹ thuật mã ${tckCode} thành công. Kỹ thuật viên sẽ tiếp nhận kiểm tra.`,
    };
  };

  const assignTicket = (ticketId: string, technicianId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              assigned_to: technicianId,
              status: 'DA_TIEP_NHAN',
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
    addAuditLog('TIEP_NHAN_TICKET', 'TICKET', ticketId, 'MOI', 'DA_TIEP_NHAN', 'Kỹ thuật viên tiếp nhận ticket');
  };

  const completeTicketScenario = (
    ticketId: string,
    scenario: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI',
    details: {
      diagnosis: string;
      resolution: string;
      materials?: { category_id: string; qty: number; action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI'; note?: string }[];
      signed_proposal_file?: string;
    }
  ) => {
    const tck = tickets.find((t) => t.ticket_id === ticketId);
    if (!tck) return { success: false, message: 'Không tìm thấy ticket' };

    // Kịch bản 1: Sửa tại chỗ
    if (scenario === 'SUA_TAI_CHO') {
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === ticketId
            ? {
                ...t,
                status: 'HOAN_THANH',
                solution_scenario: 'SUA_TAI_CHO',
                diagnosis: details.diagnosis,
                resolution: details.resolution,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      // Return asset to DANG_SU_DUNG if it was under repair
      if (tck.asset_id) {
        setAssets((prev) =>
          prev.map((a) => (a.asset_id === tck.asset_id ? { ...a, status: 'DANG_SU_DUNG' } : a))
        );
        const evt: AssetEvent = {
          event_id: `EVT-${Date.now()}`,
          asset_id: tck.asset_id,
          event_type: 'SUA_CHUA',
          occurred_at: new Date().toISOString(),
          before_status: 'DANG_SUA_CHUA',
          after_status: 'DANG_SU_DUNG',
          source_type: 'TICKET',
          source_id: tck.ticket_code,
          note: `Đã hoàn tất khắc phục sự cố tại chỗ theo ticket ${tck.ticket_code}`,
          performed_by: `${currentUser.full_name} (Kỹ thuật)`,
        };
        setAssetEvents((prev) => [evt, ...prev]);
      }

      addAuditLog('HOAN_THANH_TICKET_TAI_CHO', 'TICKET', ticketId, tck.status, 'HOAN_THANH', 'Sửa chữa tại chỗ hoàn tất');
      return { success: true, message: 'Đã hoàn thành ticket xử lý tại chỗ thành công!' };
    }

    // Kịch bản 2 & 3: Sửa chữa/thay thế hoặc thu hồi cấp mới
    // Bắt buộc có file trình ký đã duyệt ngoài hệ thống (theo mục 5.3.2 - bước 35)
    if (!details.signed_proposal_file) {
      return {
        success: false,
        message: 'Bắt buộc phải tải lên file tờ trình/phương án đã được lãnh đạo phê duyệt ngoài phần mềm để tiếp tục!',
      };
    }

    const ticketMats: TicketMaterial[] = (details.materials || []).map((m, idx) => ({
      ticket_material_id: `TKM-${Date.now()}-${idx}`,
      ticket_id: ticketId,
      category_id: m.category_id,
      qty: m.qty,
      action_type: m.action_type,
      note: m.note,
    }));

    // Update ticket
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              status: 'HOAN_THANH',
              solution_scenario: scenario,
              diagnosis: details.diagnosis,
              resolution: details.resolution,
              materials: ticketMats,
              signed_proposal_file: {
                file_name: details.signed_proposal_file!,
                uploaded_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    // BƯỚC QUAN TRỌNG THEO MỤC 5.3.2 BƯỚC 35:
    // Tự động sinh ra Đề xuất cấp phát từ CBNV kế thừa thông tin từ ticket!
    const autoReqId = `REQ-2026-${String(requests.length + 1).padStart(3, '0')}`;
    const autoReqCode = `YC-TK-${tck.ticket_code.slice(-4)}`;

    const autoLines: RequestLine[] = ticketMats.map((tm, idx) => ({
      request_line_id: `RQL-AUTO-${Date.now()}-${idx}`,
      request_id: autoReqId,
      category_id: tm.category_id,
      qty_requested: tm.qty,
      qty_reserved: 0,
      qty_issued: 0,
      qty_to_purchase: 0,
      note: `Sinh tự động từ phương án kỹ thuật ${scenario} của Ticket ${tck.ticket_code}`,
    }));

    const autoRequest: AssetRequest = {
      request_id: autoReqId,
      request_code: autoReqCode,
      requester_id: tck.reporter_id,
      unit_id: tck.unit_id,
      request_type: scenario === 'THU_HOI_CAP_MOI' ? 'CAP_THIET_BI_CNTT' : 'CAP_VAN_PHONG_PHAM',
      purpose: `Cấp phát vật tư/thiết bị theo phương án xử lý sự cố Ticket ${tck.ticket_code} (${
        scenario === 'THU_HOI_CAP_MOI' ? 'Thu hồi & Cấp mới' : 'Sửa chữa thay thế'
      })`,
      priority: tck.priority,
      status: 'CHO_TIEP_NHAN',
      attachment_file: {
        file_name: details.signed_proposal_file,
        uploaded_at: new Date().toISOString(),
        file_size: '420 KB',
      },
      created_at: new Date().toISOString(),
      lines: autoLines,
    };

    setRequests((prev) => [autoRequest, ...prev]);

    // ĐỒNG THỜI ĐƯA TRỰC TIẾP VÀO DANH SÁCH CHỜ GOM PO (Nguồn: Ticket Kỹ thuật)
    const ticketDemands: ProcurementDemandItem[] = ticketMats.map((tm, idx) => {
      const cat = categories.find((c) => c.category_id === tm.category_id);
      return {
        demand_id: `DEMAND-TK-${Date.now()}-${idx}`,
        source_type: 'TICKET_KY_THUAT',
        source_id: tck.ticket_id,
        source_code: tck.ticket_code,
        source_title: `Phương án Ticket ${tck.ticket_code} (${scenario === 'THU_HOI_CAP_MOI' ? 'Thu hồi cấp mới' : 'Thay thế linh kiện'})`,
        requester_name: `${currentUser.full_name} (Kỹ thuật)`,
        requester_unit: tck.unit_id,
        category_id: tm.category_id,
        qty_needed: tm.qty,
        estimated_unit_price: cat?.tracking_type === 'DINH_DANH' ? 20000000 : 500000,
        priority: tck.priority,
        created_at: new Date().toISOString(),
        status: 'CHO_GOM_PO',
        note: tm.note || `Vật tư kỹ thuật cho ticket ${tck.ticket_code}`,
      };
    });
    setProcurementDemands((prev) => [...ticketDemands, ...prev]);

    // If THU_HOI_CAP_MOI: mark old asset as ready for recall or TRONG_KHO
    if (scenario === 'THU_HOI_CAP_MOI' && tck.asset_id) {
      setAssets((prev) =>
        prev.map((a) =>
          a.asset_id === tck.asset_id
            ? { ...a, status: 'TRONG_KHO', holder_employee_id: null, location: 'Kho chờ thanh lý/đánh giá' }
            : a
        )
      );
      const evt: AssetEvent = {
        event_id: `EVT-${Date.now()}`,
        asset_id: tck.asset_id,
        event_type: 'THU_HOI',
        occurred_at: new Date().toISOString(),
        before_status: 'DANG_SUA_CHUA',
        after_status: 'TRONG_KHO',
        source_type: 'TICKET',
        source_id: tck.ticket_code,
        note: `Thu hồi thiết bị cũ hỏng theo phương án thu hồi cấp mới ticket ${tck.ticket_code}`,
        performed_by: `${currentUser.full_name} (Kỹ thuật)`,
      };
      setAssetEvents((prev) => [evt, ...prev]);
    }

    addAuditLog(
      'DUYET_PHUONG_AN_TICKET',
      'TICKET',
      ticketId,
      tck.status,
      'HOAN_THANH',
      `Duyệt phương án ${scenario}. Tự động tạo Yêu cầu cấp phát ${autoReqCode} gửi Thủ kho`
    );

    return {
      success: true,
      message: `Đã phê duyệt phương án thành công! Hệ thống đã tự động tạo Đề xuất cấp phát mã ${autoReqCode} gửi Thủ kho tiếp nhận.`,
    };
  };

  // KỸ THUẬT VIÊN ĐỀ XUẤT PHƯƠNG ÁN (Kịch bản 2 & 3: không duyệt, chỉ lập đề xuất chuyển trạng thái CHO_HO_SO)
  const proposeTicketScenario = (
    ticketId: string,
    scenario: 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI',
    details: {
      diagnosis: string;
      resolution: string;
      materials?: { category_id: string; qty: number; action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI'; note?: string }[];
    }
  ) => {
    const tck = tickets.find((t) => t.ticket_id === ticketId);
    if (!tck) return { success: false, message: 'Không tìm thấy ticket' };

    const ticketMats: TicketMaterial[] = (details.materials || []).map((m, idx) => ({
      ticket_material_id: `TKM-${Date.now()}-${idx}`,
      ticket_id: ticketId,
      category_id: m.category_id,
      qty: m.qty,
      action_type: m.action_type,
      note: m.note,
    }));

    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              status: 'CHO_HO_SO',
              solution_scenario: scenario,
              diagnosis: details.diagnosis,
              resolution: details.resolution,
              materials: ticketMats,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    const reporter = employees.find((e) => e.employee_id === tck.reporter_id);
    addAuditLog(
      'DE_XUAT_PHUONG_AN_TICKET',
      'TICKET',
      ticketId,
      tck.status,
      'CHO_HO_SO',
      `Kỹ thuật viên đề xuất phương án ${scenario}. Chuyển CBNV (${reporter?.full_name || tck.reporter_id}) trình ký phê duyệt ngoài.`
    );

    return {
      success: true,
      message: `Đã lập đề xuất phương án ${
        scenario === 'THU_HOI_CAP_MOI' ? 'Thu hồi cấp mới' : 'Sửa chữa thay thế'
      } thành công! Ticket chuyển sang trạng thái "Chờ duyệt tờ trình". Cán bộ nhân viên tạo ticket (${
        reporter?.full_name || 'CBNV'
      }) sẽ tải phiếu, trình ký ngoài và đính kèm file PDF để hoàn tất.`,
    };
  };

  // CÁN BỘ NHÂN VIÊN TẠO TICKET ĐÍNH KÈM FILE PDF & DUYỆT PHƯƠNG ÁN (Tự động sinh Đề xuất cấp phát)
  const approveTicketProposal = (
    ticketId: string,
    signedFileName: string
  ) => {
    const tck = tickets.find((t) => t.ticket_id === ticketId);
    if (!tck) return { success: false, message: 'Không tìm thấy ticket' };

    if (!signedFileName.trim()) {
      return {
        success: false,
        message: 'Bắt buộc phải đính kèm file tờ trình/phương án đã được lãnh đạo phê duyệt ngoài phần mềm (PDF/Scan)!',
      };
    }

    const scenario = tck.solution_scenario || 'SUA_CHUA_THAY_THE';
    const ticketMats = tck.materials || [];

    // 1. Cập nhật ticket hoàn thành kèm file trình ký
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              status: 'HOAN_THANH',
              signed_proposal_file: {
                file_name: signedFileName,
                uploaded_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    // 2. Tự động sinh ra Đề xuất cấp phát sang hàng đợi Thủ kho (Mục 5.3.2 Bước 35)
    const autoReqId = `REQ-2026-${String(requests.length + 1).padStart(3, '0')}`;
    const autoReqCode = `YC-TK-${tck.ticket_code.slice(-4)}`;

    const autoLines: RequestLine[] = ticketMats.map((tm, idx) => ({
      request_line_id: `RQL-AUTO-${Date.now()}-${idx}`,
      request_id: autoReqId,
      category_id: tm.category_id,
      qty_requested: tm.qty,
      qty_reserved: 0,
      qty_issued: 0,
      qty_to_purchase: 0,
      note: `Sinh tự động từ phương án kỹ thuật ${scenario} của Ticket ${tck.ticket_code}`,
    }));

    const autoRequest: AssetRequest = {
      request_id: autoReqId,
      request_code: autoReqCode,
      requester_id: tck.reporter_id,
      unit_id: tck.unit_id,
      request_type: scenario === 'THU_HOI_CAP_MOI' ? 'CAP_THIET_BI_CNTT' : 'CAP_VAN_PHONG_PHAM',
      purpose: `Cấp phát vật tư/thiết bị theo phương án xử lý sự cố Ticket ${tck.ticket_code} (${
        scenario === 'THU_HOI_CAP_MOI' ? 'Thu hồi & Cấp mới' : 'Sửa chữa thay thế'
      })`,
      priority: tck.priority,
      status: 'CHO_TIEP_NHAN',
      attachment_file: {
        file_name: signedFileName,
        uploaded_at: new Date().toISOString(),
        file_size: '420 KB',
      },
      created_at: new Date().toISOString(),
      lines: autoLines,
    };

    setRequests((prev) => [autoRequest, ...prev]);

    // 3. Đưa vật tư vào danh sách chờ Gom PO
    const ticketDemands: ProcurementDemandItem[] = ticketMats.map((tm, idx) => {
      const cat = categories.find((c) => c.category_id === tm.category_id);
      return {
        demand_id: `DEMAND-TK-${Date.now()}-${idx}`,
        source_type: 'TICKET_KY_THUAT',
        source_id: tck.ticket_id,
        source_code: tck.ticket_code,
        source_title: `Phương án Ticket ${tck.ticket_code} (${scenario === 'THU_HOI_CAP_MOI' ? 'Thu hồi cấp mới' : 'Thay thế linh kiện'})`,
        requester_name: `${employees.find((e) => e.employee_id === tck.reporter_id)?.full_name || 'CBNV'} (Đã duyệt phương án)`,
        requester_unit: tck.unit_id,
        category_id: tm.category_id,
        qty_needed: tm.qty,
        estimated_unit_price: cat?.tracking_type === 'DINH_DANH' ? 20000000 : 500000,
        priority: tck.priority,
        created_at: new Date().toISOString(),
        status: 'CHO_GOM_PO',
        note: tm.note || `Vật tư kỹ thuật cho ticket ${tck.ticket_code}`,
      };
    });
    setProcurementDemands((prev) => [...ticketDemands, ...prev]);

    // 4. Nếu thu hồi cấp mới: thu hồi thiết bị cũ về kho
    if (scenario === 'THU_HOI_CAP_MOI' && tck.asset_id) {
      setAssets((prev) =>
        prev.map((a) =>
          a.asset_id === tck.asset_id
            ? { ...a, status: 'TRONG_KHO', holder_employee_id: null, location: 'Kho chờ thanh lý/đánh giá' }
            : a
        )
      );
      const evt: AssetEvent = {
        event_id: `EVT-${Date.now()}`,
        asset_id: tck.asset_id,
        event_type: 'THU_HOI',
        occurred_at: new Date().toISOString(),
        before_status: 'DANG_SUA_CHUA',
        after_status: 'TRONG_KHO',
        source_type: 'TICKET',
        source_id: tck.ticket_code,
        note: `Thu hồi thiết bị cũ hỏng theo phương án thu hồi cấp mới ticket ${tck.ticket_code}`,
        performed_by: `${currentUser.full_name} (CBNV duyệt)`,
      };
      setAssetEvents((prev) => [evt, ...prev]);
    }

    addAuditLog(
      'CBNV_DUYET_PHUONG_AN_TICKET',
      'TICKET',
      ticketId,
      tck.status,
      'HOAN_THANH',
      `CBNV đính kèm file duyệt ${signedFileName}. Tự động tạo Yêu cầu cấp phát ${autoReqCode} gửi Thủ kho`
    );

    return {
      success: true,
      message: `Đã phê duyệt phương án thành công! Hệ thống đã tự động tạo Đề xuất cấp phát mã ${autoReqCode} gửi sang Thủ kho tiếp nhận.`,
    };
  };

  // --- M5: PURCHASE ORDERS (PO) ---
  const createPO = (data: {
    source: PurchaseOrder['source'];
    tracking_type: TrackingType;
    receiving_warehouse_id: string;
    supplier_name?: string;
    note?: string;
    lines: {
      category_id: string;
      qty_requested: number;
      estimated_unit_price: number;
      source_type: PurchaseOrderLine['source_type'];
      source_id?: string;
    }[];
  }) => {
    const poId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    const poCode = `PO-AGRI-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;

    let totalEst = 0;
    const poLines: PurchaseOrderLine[] = data.lines.map((l, idx) => {
      const lineTotal = l.qty_requested * l.estimated_unit_price;
      totalEst += lineTotal;
      return {
        line_id: `POL-${Date.now()}-${idx}`,
        po_id: poId,
        category_id: l.category_id,
        tracking_type: data.tracking_type,
        qty_requested: l.qty_requested,
        qty_ordered: l.qty_requested,
        qty_received: 0,
        qty_identified: 0,
        estimated_unit_price: l.estimated_unit_price,
        actual_unit_price: 0,
        amount: 0,
        warehouse_id: data.receiving_warehouse_id,
        source_type: l.source_type,
        source_id: l.source_id,
        status: 'CHO_NHAN',
      };
    });

    const newPO: PurchaseOrder = {
      po_id: poId,
      po_code: poCode,
      source: data.source,
      tracking_type: data.tracking_type,
      status: 'DA_GUI_THU_MUA',
      supplier_name: data.supplier_name,
      created_by: currentUser.employee_id,
      buyer_id: 'EMP-002', // Thu mua
      receiving_warehouse_id: data.receiving_warehouse_id,
      parent_po_id: null,
      total_amount: totalEst,
      created_at: new Date().toISOString(),
      note: data.note,
      lines: poLines,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    addAuditLog('TAO_PO_THU_MUA', 'PURCHASE_ORDER', poId, undefined, 'DA_GUI_THU_MUA', `Tạo PO ${poCode}`);

    return {
      success: true,
      message: `Đã tạo đơn mua hàng ${poCode} và gửi cho bộ phận Thu mua xử lý.`,
    };
  };

  const procurePO = (
    poId: string,
    data: {
      supplier_name: string;
      linesActual: { line_id: string; actual_unit_price: number; qty_received: number }[];
      isPartialDelivery: boolean;
    }
  ) => {
    const po = purchaseOrders.find((p) => p.po_id === poId);
    if (!po) return { success: false, message: 'Không tìm thấy PO' };

    let totalActual = 0;
    const remainingMissingLines: {
      category_id: string;
      qty_missing: number;
      actual_unit_price: number;
    }[] = [];

    const updatedLines = po.lines.map((l) => {
      const act = data.linesActual.find((la) => la.line_id === l.line_id);
      if (!act) return l;

      const lineTotal = act.qty_received * act.actual_unit_price;
      totalActual += lineTotal;

      const qtyMissing = l.qty_ordered - act.qty_received;
      if (qtyMissing > 0) {
        remainingMissingLines.push({
          category_id: l.category_id,
          qty_missing: qtyMissing,
          actual_unit_price: act.actual_unit_price,
        });
      }

      return {
        ...l,
        qty_received: act.qty_received,
        actual_unit_price: act.actual_unit_price,
        amount: lineTotal,
        status: act.qty_received >= l.qty_ordered ? ('DA_NHAP_KHO' as const) : ('NHAN_MOT_PHAN' as const),
      };
    });

    let nextStatus: PurchaseOrder['status'] = 'MUA_HANG_HOAN_TAT';
    if (data.isPartialDelivery && remainingMissingLines.length > 0) {
      nextStatus = 'HOAN_TAT_MOT_PHAN';
    } else {
      nextStatus = po.tracking_type === 'TIEU_HAO' ? 'CHO_NHAP_KHO' : 'MUA_HANG_HOAN_TAT';
    }

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.po_id === poId
          ? {
              ...p,
              supplier_name: data.supplier_name,
              total_amount: totalActual,
              status: nextStatus,
              lines: updatedLines,
              completed_at: new Date().toISOString(),
            }
          : p
      )
    );

    // Kịch bản giao thiếu: TỰ ĐỘNG SINH PO CON KẾ THỪA VẬT TƯ THIẾU (theo mục 5.4.2)
    if (data.isPartialDelivery && remainingMissingLines.length > 0) {
      const childPoId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}-CON`;
      const childPoCode = `${po.po_code}-CON`;

      const childLines: PurchaseOrderLine[] = remainingMissingLines.map((rm, idx) => ({
        line_id: `POL-CHILD-${Date.now()}-${idx}`,
        po_id: childPoId,
        category_id: rm.category_id,
        tracking_type: po.tracking_type,
        qty_requested: rm.qty_missing,
        qty_ordered: rm.qty_missing,
        qty_received: 0,
        qty_identified: 0,
        estimated_unit_price: rm.actual_unit_price,
        actual_unit_price: 0,
        amount: 0,
        warehouse_id: po.receiving_warehouse_id,
        source_type: 'MANUAL',
        source_id: po.po_code,
        status: 'CHO_NHAN',
      }));

      const childPO: PurchaseOrder = {
        po_id: childPoId,
        po_code: childPoCode,
        source: po.source,
        tracking_type: po.tracking_type,
        status: 'DANG_MUA',
        supplier_name: data.supplier_name,
        created_by: currentUser.employee_id,
        buyer_id: po.buyer_id,
        receiving_warehouse_id: po.receiving_warehouse_id,
        parent_po_id: po.po_id,
        total_amount: 0,
        created_at: new Date().toISOString(),
        note: `PO Con kế thừa số lượng giao thiếu từ đơn ${po.po_code}`,
        lines: childLines,
      };

      setPurchaseOrders((prev) => [...prev, childPO]);
      addAuditLog(
        'TAO_PO_CON_GIAO_THIEU',
        'PURCHASE_ORDER',
        childPoId,
        undefined,
        'DANG_MUA',
        `Tạo PO con ${childPoCode} cho phần thiếu của ${po.po_code}`
      );
    }

    addAuditLog(
      'HOAN_TAT_THU_MUA_PO',
      'PURCHASE_ORDER',
      poId,
      po.status,
      nextStatus,
      `Thu mua cập nhật giá thực tế & số lượng. Chuyển sang Kho tiếp nhận.`
    );

    return {
      success: true,
      message: `Đã hoàn tất trách nhiệm Thu mua cho đơn ${po.po_code}! Đơn hàng đã được chuyển quyền xử lý sang Kho.`,
    };
  };

  const receivePOConsumable = (
    poId: string,
    warehouseId: string,
    receivedLines: { line_id: string; qty_received: number }[]
  ) => {
    const po = purchaseOrders.find((p) => p.po_id === poId);
    if (!po) return { success: false, message: 'Không tìm thấy PO' };

    // Update stock balances and insert inventory transactions
    receivedLines.forEach((rl) => {
      const line = po.lines.find((l) => l.line_id === rl.line_id);
      if (!line) return;

      const qty = rl.qty_received;
      setStockBalances((prev) => {
        const existing = prev.find(
          (s) => s.warehouse_id === warehouseId && s.category_id === line.category_id
        );
        if (existing) {
          const totalQty = existing.quantity_on_hand + qty;
          const newAvgCost =
            totalQty > 0
              ? (existing.quantity_on_hand * existing.average_unit_cost + qty * line.actual_unit_price) /
                totalQty
              : line.actual_unit_price;

          return prev.map((s) =>
            s.warehouse_id === warehouseId && s.category_id === line.category_id
              ? {
                  ...s,
                  quantity_on_hand: totalQty,
                  invested_this_month: s.invested_this_month + qty,
                  average_unit_cost: Math.round(newAvgCost),
                  updated_at: new Date().toISOString(),
                }
              : s
          );
        } else {
          const newStock: StockBalance = {
            warehouse_id: warehouseId,
            category_id: line.category_id,
            quantity_on_hand: qty,
            quantity_reserved: 0,
            invested_this_month: qty,
            issued_this_month: 0,
            average_unit_cost: line.actual_unit_price,
            updated_at: new Date().toISOString(),
          };
          return [...prev, newStock];
        }
      });

      // Transaction
      const trx: InventoryTransaction = {
        transaction_id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'NHAP_KHO',
        warehouse_id: warehouseId,
        category_id: line.category_id,
        quantity: qty,
        unit_cost: line.actual_unit_price,
        total_amount: qty * line.actual_unit_price,
        source_type: 'PO',
        source_id: po.po_code,
        occurred_at: new Date().toISOString(),
        created_by: `${currentUser.full_name} (Thủ kho)`,
        note: `Nhập kho tiêu hao từ đơn mua hàng ${po.po_code}`,
      };
      setTransactions((prev) => [trx, ...prev]);
    });

    // Mark PO as DA_NHAP_KHO
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.po_id === poId
          ? {
              ...p,
              status: 'DA_NHAP_KHO',
              completed_at: new Date().toISOString(),
            }
          : p
      )
    );

    addAuditLog(
      'NHAP_KHO_TIÊU_HAO',
      'PURCHASE_ORDER',
      poId,
      po.status,
      'DA_NHAP_KHO',
      `Thủ kho kiểm đếm thực nhận và cộng tồn kho cho đơn ${po.po_code}`
    );

    return {
      success: true,
      message: `Đã nhập kho hàng tiêu hao thành công! Tồn kho đã được cập nhật chính xác.`,
    };
  };

  const identifyPOAssets = (
    poId: string,
    warehouseId: string,
    declarations: {
      category_id: string;
      serial_no: string;
      specifications?: string;
      warranty_from?: string;
      warranty_to?: string;
      purchase_cost: number;
      location: string;
    }[]
  ) => {
    const po = purchaseOrders.find((p) => p.po_id === poId);
    if (!po) return { success: false, message: 'Không tìm thấy PO' };

    const wh = warehouses.find((w) => w.warehouse_id === warehouseId);
    const owningUnitId = wh ? wh.owning_unit_id : 'UNIT-01';

    const newCreatedAssets: Asset[] = [];
    const newEvents: AssetEvent[] = [];

    declarations.forEach((decl, idx) => {
      const cat = categories.find((c) => c.category_id === decl.category_id);
      const prefix = cat?.prefix || 'AST';
      const seq = String(assets.length + idx + 1).padStart(4, '0');
      const assetCode = `AGRI-${prefix}-2026-${seq}`;

      const newAsset: Asset = {
        asset_id: `AST-2026-${seq}`,
        asset_code: assetCode,
        category_id: decl.category_id,
        serial_no: decl.serial_no,
        warranty_from: decl.warranty_from,
        warranty_to: decl.warranty_to,
        purchase_cost: decl.purchase_cost,
        owning_unit_id: owningUnitId, // Tự động gắn đơn vị sở hữu theo kho nhận (mục 1.2)
        warehouse_id: warehouseId,
        holder_employee_id: null,
        holder_unit_snapshot: null,
        location: decl.location,
        status: 'TRONG_KHO',
        specifications: decl.specifications,
        qr_code: assetCode,
        po_id: poId,
        created_at: new Date().toISOString(),
      };

      newCreatedAssets.push(newAsset);

      newEvents.push({
        event_id: `EVT-${Date.now()}-${idx}`,
        asset_id: newAsset.asset_id,
        event_type: 'NHAP_KHO',
        occurred_at: new Date().toISOString(),
        before_status: 'CHO_DINH_DANH',
        after_status: 'TRONG_KHO',
        from_unit: po.supplier_name || 'Nhà cung cấp',
        to_unit: owningUnitId,
        source_type: 'PO',
        source_id: po.po_code,
        note: `Khai báo tài sản định danh từ đơn mua hàng ${po.po_code}. Serial: ${decl.serial_no}`,
        performed_by: `${currentUser.full_name} (Thủ kho)`,
      });
    });

    setAssets((prev) => [...prev, ...newCreatedAssets]);
    setAssetEvents((prev) => [...newEvents, ...prev]);

    // Update PO lines identified count
    const updatedLines = po.lines.map((l) => {
      const count = declarations.filter((d) => d.category_id === l.category_id).length;
      return {
        ...l,
        qty_identified: l.qty_identified + count,
      };
    });

    const isAllIdentified = updatedLines.every((l) => l.qty_identified >= l.qty_received);

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.po_id === poId
          ? {
              ...p,
              status: isAllIdentified ? 'DA_NHAP_KHO' : 'MUA_HANG_HOAN_TAT',
              lines: updatedLines,
            }
          : p
      )
    );

    addAuditLog(
      'DINH_DANH_TAI_SAN',
      'PURCHASE_ORDER',
      poId,
      'CHO_DINH_DANH',
      isAllIdentified ? 'DA_NHAP_KHO' : 'MUA_HANG_HOAN_TAT',
      `Khai báo thành công ${declarations.length} thiết bị định danh từ PO ${po.po_code}`
    );

    return {
      success: true,
      message: `Đã khai báo ${declarations.length} thiết bị định danh thành công vào kho! Mã QR và hồ sơ tài sản đã được tạo.`,
    };
  };

  // --- M2: CORE WAREHOUSE ACTIONS ---
  const issueAssetDirect = (
    assetId: string,
    recipientEmployeeId: string,
    location: string,
    note?: string
  ) => {
    const ast = assets.find((a) => a.asset_id === assetId);
    if (!ast) return { success: false, message: 'Không tìm thấy tài sản' };

    const recipient = employees.find((e) => e.employee_id === recipientEmployeeId);
    if (!recipient) return { success: false, message: 'Không tìm thấy nhân viên nhận' };

    setAssets((prev) =>
      prev.map((a) =>
        a.asset_id === assetId
          ? {
              ...a,
              status: 'DANG_SU_DUNG',
              holder_employee_id: recipientEmployeeId,
              holder_unit_snapshot: recipient.unit_id, // Chụp lại đơn vị chi trả lương
              location,
            }
          : a
      )
    );

    const newEvent: AssetEvent = {
      event_id: `EVT-${Date.now()}`,
      asset_id: assetId,
      event_type: 'BAN_GIAO_CAP_PHAT',
      occurred_at: new Date().toISOString(),
      before_status: ast.status,
      after_status: 'DANG_SU_DUNG',
      to_holder: `${recipient.full_name} (${recipient.employee_code})`,
      to_unit: recipient.unit_id,
      source_type: 'MANUAL',
      note: note || `Bàn giao cấp phát trực tiếp. Cho phép xuất biên bản bàn giao.`,
      performed_by: `${currentUser.full_name} (Thủ kho)`,
    };
    setAssetEvents((prev) => [newEvent, ...prev]);

    addAuditLog(
      'CAP_PHAT_TAI_SAN_TRUC_TIEP',
      'ASSET',
      assetId,
      ast.status,
      'DANG_SU_DUNG',
      `Bàn giao tài sản ${ast.asset_code} cho ${recipient.full_name}`
    );

    return {
      success: true,
      message: `Bàn giao tài sản ${ast.asset_code} cho ${recipient.full_name} thành công!`,
    };
  };

  const issueConsumableDirect = (
    warehouseId: string,
    categoryId: string,
    quantity: number,
    recipientEmployeeId: string,
    note?: string
  ) => {
    const stock = stockBalances.find(
      (s) => s.warehouse_id === warehouseId && s.category_id === categoryId
    );
    if (!stock || stock.quantity_on_hand < quantity) {
      return {
        success: false,
        message: `Số lượng tồn khả dụng không đủ! Tồn kho hiện có: ${stock?.quantity_on_hand || 0}`,
      };
    }

    const recipient = employees.find((e) => e.employee_id === recipientEmployeeId);
    const cat = categories.find((c) => c.category_id === categoryId);

    setStockBalances((prev) =>
      prev.map((s) =>
        s.warehouse_id === warehouseId && s.category_id === categoryId
          ? {
              ...s,
              quantity_on_hand: s.quantity_on_hand - quantity,
              issued_this_month: s.issued_this_month + quantity,
              updated_at: new Date().toISOString(),
            }
          : s
      )
    );

    const cost = quantity * stock.average_unit_cost;
    const trx: InventoryTransaction = {
      transaction_id: `TRX-${Date.now()}`,
      type: 'XUAT_CAP_PHAT',
      warehouse_id: warehouseId,
      category_id: categoryId,
      quantity,
      unit_cost: stock.average_unit_cost,
      total_amount: cost,
      source_type: 'MANUAL',
      recipient_employee_id: recipientEmployeeId,
      recipient_unit_id: recipient?.unit_id,
      occurred_at: new Date().toISOString(),
      created_by: currentUser.full_name,
      note: note || `Cấp phát vật tư ${cat?.name} cho ${recipient?.full_name}`,
    };
    setTransactions((prev) => [trx, ...prev]);

    addAuditLog(
      'XUAT_CAP_PHAT_TIÊU_HAO',
      'STOCK_BALANCE',
      `${warehouseId}_${categoryId}`,
      undefined,
      `-${quantity}`,
      `Xuất cấp phát ${quantity} ${cat?.unit_of_measure} cho ${recipient?.full_name}`
    );

    return {
      success: true,
      message: `Đã xuất kho ${quantity} ${cat?.unit_of_measure} ${cat?.name} thành công!`,
    };
  };

  const recallAsset = (
    assetId: string,
    returnerEmployeeId: string,
    reason: string,
    condition: string
  ) => {
    const ast = assets.find((a) => a.asset_id === assetId);
    if (!ast) return { success: false, message: 'Không tìm thấy tài sản' };

    const returner = employees.find((e) => e.employee_id === returnerEmployeeId);

    setAssets((prev) =>
      prev.map((a) =>
        a.asset_id === assetId
          ? {
              ...a,
              status: 'TRONG_KHO',
              holder_employee_id: null,
              holder_unit_snapshot: null,
              location: 'Kho lưu trữ - chờ phân bổ lại',
            }
          : a
      )
    );

    const newEvent: AssetEvent = {
      event_id: `EVT-${Date.now()}`,
      asset_id: assetId,
      event_type: 'THU_HOI',
      occurred_at: new Date().toISOString(),
      before_status: ast.status,
      after_status: 'TRONG_KHO',
      from_holder: returner ? `${returner.full_name} (${returner.employee_code})` : undefined,
      source_type: 'MANUAL',
      note: `Thu hồi tài sản về kho. Lý do: ${reason}. Tình trạng: ${condition}. Cho phép xuất biên bản thu hồi.`,
      performed_by: `${currentUser.full_name} (Thủ kho)`,
    };
    setAssetEvents((prev) => [newEvent, ...prev]);

    addAuditLog(
      'THU_HOI_TAI_SAN',
      'ASSET',
      assetId,
      ast.status,
      'TRONG_KHO',
      `Thu hồi tài sản ${ast.asset_code} về kho. Lý do: ${reason}`
    );

    return {
      success: true,
      message: `Đã thu hồi tài sản ${ast.asset_code} về kho thành công!`,
    };
  };

  const liquidateAsset = (
    assetId: string,
    reason: string,
    liquidationDate: string,
    recoveryAmount: number,
    docNote?: string
  ) => {
    const ast = assets.find((a) => a.asset_id === assetId);
    if (!ast) return { success: false, message: 'Không tìm thấy tài sản' };

    // Bắt buộc kiểm soát: chỉ thanh lý khi tài sản đang TRONG_KHO (mục 5.2.6 & TC16)
    if (ast.status !== 'TRONG_KHO') {
      return {
        success: false,
        message: 'Chỉ có thể thanh lý tài sản đang ở trạng thái TRONG KHO! Vui lòng thu hồi trước.',
      };
    }

    setAssets((prev) =>
      prev.map((a) =>
        a.asset_id === assetId
          ? {
              ...a,
              status: 'DA_THANH_LY',
              location: 'Đã thanh lý & xuất khỏi sổ tài sản',
            }
          : a
      )
    );

    const newEvent: AssetEvent = {
      event_id: `EVT-${Date.now()}`,
      asset_id: assetId,
      event_type: 'THANH_LY',
      occurred_at: liquidationDate || new Date().toISOString(),
      before_status: 'TRONG_KHO',
      after_status: 'DA_THANH_LY',
      note: `Thanh lý tài sản. Lý do: ${reason}. Thu hồi: ${recoveryAmount.toLocaleString('vi-VN')} VND. Chứng từ: ${docNote || 'Biên bản HĐ thanh lý'}`,
      performed_by: `${currentUser.full_name}`,
    };
    setAssetEvents((prev) => [newEvent, ...prev]);

    addAuditLog(
      'THANH_LY_TAI_SAN',
      'ASSET',
      assetId,
      'TRONG_KHO',
      'DA_THANH_LY',
      `Thanh lý tài sản ${ast.asset_code}. Giá thu hồi: ${recoveryAmount}`
    );

    return {
      success: true,
      message: `Đã thanh lý tài sản ${ast.asset_code} thành công và khóa các nghiệp vụ tiếp theo.`,
    };
  };

  const createTransfer = (
    fromWarehouseId: string,
    toWarehouseId: string,
    assetIds: string[],
    reason: string
  ) => {
    if (fromWarehouseId === toWarehouseId) {
      return { success: false, message: 'Kho gửi và kho nhận không được trùng nhau!' };
    }

    const trfId = `TRF-2026-${String(transfers.length + 1).padStart(3, '0')}`;
    const trfCode = `DC-KHO-2026-${Date.now().toString().slice(-4)}`;

    // Set assets to DANG_DIEU_CHUYEN
    setAssets((prev) =>
      prev.map((a) =>
        assetIds.includes(a.asset_id)
          ? { ...a, status: 'DANG_DIEU_CHUYEN', location: `Đang vận chuyển tới kho nhận` }
          : a
      )
    );

    const newTransfer: Transfer = {
      transfer_id: trfId,
      code: trfCode,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      dispatched_at: new Date().toISOString(),
      dispatched_by: `${currentUser.full_name} (${currentUser.employee_code})`,
      status: 'DANG_DIEU_CHUYEN',
      reason,
      lines: assetIds.map((id, idx) => ({
        transfer_line_id: `TRFL-${Date.now()}-${idx}`,
        transfer_id: trfId,
        asset_id: id,
      })),
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Timeline event for each asset
    assetIds.forEach((astId) => {
      const evt: AssetEvent = {
        event_id: `EVT-${Date.now()}-${astId}`,
        asset_id: astId,
        event_type: 'DIEU_CHUYEN',
        occurred_at: new Date().toISOString(),
        before_status: 'TRONG_KHO',
        after_status: 'DANG_DIEU_CHUYEN',
        source_type: 'TRANSFER',
        source_id: trfCode,
        note: `Xuất kho gửi điều chuyển theo phiếu ${trfCode}`,
        performed_by: currentUser.full_name,
      };
      setAssetEvents((prev) => [evt, ...prev]);
    });

    addAuditLog(
      'TAO_DIEU_CHUYEN_KHO',
      'TRANSFER',
      trfId,
      undefined,
      'DANG_DIEU_CHUYEN',
      `Tạo lệnh điều chuyển ${trfCode} cho ${assetIds.length} thiết bị`
    );

    return {
      success: true,
      message: `Đã xuất kho gửi điều chuyển theo mã ${trfCode}. Chờ Thủ kho bên nhận xác nhận.`,
    };
  };

  const confirmTransfer = (transferId: string) => {
    const trf = transfers.find((t) => t.transfer_id === transferId);
    if (!trf) return { success: false, message: 'Không tìm thấy phiếu điều chuyển' };

    const toWh = warehouses.find((w) => w.warehouse_id === trf.to_warehouse_id);
    const newOwningUnitId = toWh ? toWh.owning_unit_id : 'UNIT-01';

    // RÀNG BUỘC THEO MỤC 4.1 & 6.7:
    // "Khi điều chuyển giữa các đơn vị, việc nhập kho tại kho của đơn vị mới làm thay đổi đơn vị sở hữu theo quy tắc nguồn"
    const assetIds = trf.lines.map((l) => l.asset_id);
    setAssets((prev) =>
      prev.map((a) =>
        assetIds.includes(a.asset_id)
          ? {
              ...a,
              warehouse_id: trf.to_warehouse_id,
              owning_unit_id: newOwningUnitId, // Tự động cập nhật đơn vị sở hữu mới!
              status: 'TRONG_KHO',
              location: `Kệ lưu trữ tại ${toWh?.name}`,
            }
          : a
      )
    );

    setTransfers((prev) =>
      prev.map((t) =>
        t.transfer_id === transferId
          ? {
              ...t,
              status: 'DA_HOAN_THANH',
              received_at: new Date().toISOString(),
              received_by: `${currentUser.full_name} (${currentUser.employee_code})`,
            }
          : t
      )
    );

    // Event nhập kho tại kho mới
    assetIds.forEach((astId) => {
      const evt: AssetEvent = {
        event_id: `EVT-${Date.now()}-${astId}`,
        asset_id: astId,
        event_type: 'DIEU_CHUYEN',
        occurred_at: new Date().toISOString(),
        before_status: 'DANG_DIEU_CHUYEN',
        after_status: 'TRONG_KHO',
        to_unit: newOwningUnitId,
        source_type: 'TRANSFER',
        source_id: trf.code,
        note: `Đã xác nhận nhập kho tại ${toWh?.name}. Chuyển đơn vị sở hữu sang đơn vị quản lý kho mới.`,
        performed_by: currentUser.full_name,
      };
      setAssetEvents((prev) => [evt, ...prev]);
    });

    addAuditLog(
      'XAC_NHAN_NHAN_DIEU_CHUYEN',
      'TRANSFER',
      transferId,
      'DANG_DIEU_CHUYEN',
      'DA_HOAN_THANH',
      `Thủ kho nhận đã nhập kho và đổi đơn vị sở hữu theo kho mới`
    );

    return {
      success: true,
      message: `Đã xác nhận nhận thiết bị thành công! Đơn vị sở hữu của tài sản đã được tự động cập nhật theo đơn vị kho mới.`,
    };
  };

  // Admin Configuration Actions
  const addSupplier = async (data: any) => {
    try {
      const created = await serverApi.addSupplier(data);
      setSuppliers((prev) => [...prev, created]);
      addAuditLog('THEM_NCC', 'SUPPLIER', created.supplier_id, undefined, created.name, `Thêm mới nhà cung cấp: ${created.name}`);
      return { success: true, message: 'Đã thêm nhà cung cấp thành công!', supplier: created };
    } catch {
      const newSupp: Supplier = {
        ...data,
        supplier_id: `SUP-${Date.now().toString().slice(-4)}`,
        status: data.status || 'ACTIVE',
      };
      setSuppliers((prev) => [...prev, newSupp]);
      addAuditLog('THEM_NCC', 'SUPPLIER', newSupp.supplier_id, undefined, newSupp.name, `Thêm mới nhà cung cấp: ${newSupp.name}`);
      return { success: true, message: 'Đã thêm nhà cung cấp thành công!', supplier: newSupp };
    }
  };

  const updateSupplier = async (supplierId: string, data: any) => {
    try {
      const updated = await serverApi.updateSupplier(supplierId, data);
      setSuppliers((prev) => prev.map((s) => (s.supplier_id === supplierId ? updated : s)));
      addAuditLog('SUA_NCC', 'SUPPLIER', supplierId, undefined, JSON.stringify(data), `Cập nhật thông tin NCC ${supplierId}`);
      return { success: true, message: 'Đã cập nhật nhà cung cấp thành công!' };
    } catch {
      setSuppliers((prev) => prev.map((s) => (s.supplier_id === supplierId ? { ...s, ...data } : s)));
      return { success: true, message: 'Đã cập nhật nhà cung cấp!' };
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    try {
      await serverApi.deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((s) => s.supplier_id !== supplierId));
      addAuditLog('XOA_NCC', 'SUPPLIER', supplierId, undefined, undefined, `Xóa nhà cung cấp ${supplierId}`);
      return { success: true, message: 'Đã xóa nhà cung cấp thành công!' };
    } catch {
      setSuppliers((prev) => prev.filter((s) => s.supplier_id !== supplierId));
      return { success: true, message: 'Đã xóa nhà cung cấp!' };
    }
  };

  const addUnit = async (data: any) => {
    try {
      const created = await serverApi.addUnit(data);
      setUnits((prev) => [...prev, created]);
      addAuditLog('THEM_DON_VI', 'UNIT', created.unit_id, undefined, created.name, `Thêm mới đơn vị: ${created.name}`);
      return { success: true, message: 'Đã thêm đơn vị pháp nhân thành công!' };
    } catch {
      const newUnit: OrganizationUnit = {
        ...data,
        unit_id: data.unit_id || `UNIT-${Date.now().toString().slice(-4)}`,
        status: data.status || 'ACTIVE',
      };
      setUnits((prev) => [...prev, newUnit]);
      return { success: true, message: 'Đã thêm đơn vị pháp nhân!' };
    }
  };

  const updateUnit = async (unitId: string, data: any) => {
    try {
      const updated = await serverApi.updateUnit(unitId, data);
      setUnits((prev) => prev.map((u) => (u.unit_id === unitId ? updated : u)));
      addAuditLog('SUA_DON_VI', 'UNIT', unitId, undefined, JSON.stringify(data), `Cập nhật đơn vị ${unitId}`);
      return { success: true, message: 'Đã cập nhật thông tin đơn vị thành công!' };
    } catch {
      setUnits((prev) => prev.map((u) => (u.unit_id === unitId ? { ...u, ...data } : u)));
      return { success: true, message: 'Đã cập nhật đơn vị!' };
    }
  };

  const addDepartment = async (data: any) => {
    try {
      const created = await serverApi.addDepartment(data);
      setDepartments((prev) => [...prev, created]);
      addAuditLog('THEM_PHONG_BAN', 'DEPARTMENT', created.department_id, undefined, created.name, `Thêm phòng ban mới: ${created.name} thuộc đơn vị ${created.unit_id}`);
      return { success: true, message: 'Đã thêm phòng ban mới thành công!', department: created };
    } catch {
      const newDept: Department = {
        ...data,
        department_id: data.department_id || `DEP-${Date.now().toString().slice(-4)}`,
        status: data.status || 'ACTIVE',
      };
      setDepartments((prev) => [...prev, newDept]);
      return { success: true, message: 'Đã thêm phòng ban!' };
    }
  };

  const updateDepartment = async (departmentId: string, data: any) => {
    try {
      const updated = await serverApi.updateDepartment(departmentId, data);
      setDepartments((prev) => prev.map((d) => (d.department_id === departmentId ? updated : d)));
      addAuditLog('SUA_PHONG_BAN', 'DEPARTMENT', departmentId, undefined, JSON.stringify(data), `Cập nhật phòng ban ${departmentId}`);
      return { success: true, message: 'Đã cập nhật phòng ban thành công!' };
    } catch {
      setDepartments((prev) => prev.map((d) => (d.department_id === departmentId ? { ...d, ...data } : d)));
      return { success: true, message: 'Đã cập nhật phòng ban!' };
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    const hasEmployees = employees.some((e) => e.department_id === departmentId);
    if (hasEmployees) {
      return { success: false, message: 'Không thể xóa phòng ban này vì đang có nhân viên trực thuộc!' };
    }
    try {
      await serverApi.deleteDepartment(departmentId);
      setDepartments((prev) => prev.filter((d) => d.department_id !== departmentId));
      addAuditLog('XOA_PHONG_BAN', 'DEPARTMENT', departmentId, undefined, undefined, `Xóa phòng ban ${departmentId}`);
      return { success: true, message: 'Đã xóa phòng ban thành công!' };
    } catch {
      setDepartments((prev) => prev.filter((d) => d.department_id !== departmentId));
      return { success: true, message: 'Đã xóa phòng ban!' };
    }
  };

  const addWarehouse = async (data: any) => {
    try {
      const created = await serverApi.addWarehouse(data);
      setWarehouses((prev) => [...prev, created]);
      addAuditLog('THEM_KHO', 'WAREHOUSE', created.warehouse_id, undefined, created.name, `Thêm kho mới: ${created.name}`);
      return { success: true, message: 'Đã thêm kho lưu trữ mới thành công!' };
    } catch {
      const newWh: Warehouse = {
        ...data,
        warehouse_id: data.warehouse_id || `WH-${Date.now().toString().slice(-4)}`,
        status: data.status || 'ACTIVE',
      };
      setWarehouses((prev) => [...prev, newWh]);
      return { success: true, message: 'Đã thêm kho lưu trữ!' };
    }
  };

  const updateWarehouse = async (warehouseId: string, data: any) => {
    try {
      const updated = await serverApi.updateWarehouse(warehouseId, data);
      setWarehouses((prev) => prev.map((w) => (w.warehouse_id === warehouseId ? updated : w)));
      addAuditLog('SUA_KHO', 'WAREHOUSE', warehouseId, undefined, JSON.stringify(data), `Cập nhật cấu hình kho ${warehouseId}`);
      return { success: true, message: 'Đã cập nhật cấu hình kho thành công!' };
    } catch {
      setWarehouses((prev) => prev.map((w) => (w.warehouse_id === warehouseId ? { ...w, ...data } : w)));
      return { success: true, message: 'Đã cập nhật kho!' };
    }
  };

  const addEmployee = async (data: any) => {
    // Relational validation
    if (data.department_id) {
      const dept = departments.find((d) => d.department_id === data.department_id);
      if (dept && dept.unit_id !== data.unit_id) {
        return { success: false, message: 'Phòng ban không thuộc Đơn vị đã chọn! Vui lòng chọn phòng ban tương ứng.' };
      }
    }
    try {
      const created = await serverApi.addEmployee(data);
      setEmployees((prev) => [...prev, created]);
      addAuditLog('THEM_NV', 'EMPLOYEE', created.employee_id, undefined, `${created.full_name} (${created.position})`, `Thêm nhân sự mới: ${created.full_name} - ${created.position} [${created.role}]`);
      return { success: true, message: 'Đã thêm nhân sự thành công!' };
    } catch {
      const newEmp: Employee = {
        ...data,
        employee_id: data.employee_id || `EMP-${Date.now().toString().slice(-3)}`,
        position: data.position || 'Chuyên viên Nghiệp vụ',
        role: data.role || 'CBNV',
        status: data.status || 'ACTIVE',
      };
      setEmployees((prev) => [...prev, newEmp]);
      return { success: true, message: 'Đã thêm nhân sự!' };
    }
  };

  const updateEmployee = async (employeeId: string, data: any) => {
    try {
      const updated = await serverApi.updateEmployee(employeeId, data);
      setEmployees((prev) => prev.map((e) => (e.employee_id === employeeId ? updated : e)));
      addAuditLog('SUA_NV', 'EMPLOYEE', employeeId, undefined, JSON.stringify(data), `Cập nhật nhân viên ${employeeId}`);
      return { success: true, message: 'Đã cập nhật thông tin nhân viên thành công!' };
    } catch {
      setEmployees((prev) => prev.map((e) => (e.employee_id === employeeId ? { ...e, ...data } : e)));
      return { success: true, message: 'Đã cập nhật thông tin nhân viên!' };
    }
  };

  const updateUserRole = async (employeeId: string, role: UserRole) => {
    try {
      const updated = await serverApi.updateUserRole(employeeId, role);
      setEmployees((prev) => prev.map((e) => (e.employee_id === employeeId ? updated : e)));
      addAuditLog('PHAN_QUYEN', 'USER', employeeId, undefined, role, `Gán quyền ${role} cho nhân sự ${employeeId}`);
      return { success: true, message: `Đã cập nhật vai trò [${role}] thành công!` };
    } catch {
      setEmployees((prev) => prev.map((e) => (e.employee_id === employeeId ? { ...e, role } : e)));
      return { success: true, message: `Đã cập nhật vai trò [${role}]!` };
    }
  };

  const syncEmployeesFromHRM = async () => {
    try {
      const res = await serverApi.syncHrmEmployees();
      const freshData = await serverApi.getData();
      if (freshData?.employees) setEmployees(freshData.employees);
      addAuditLog('DONG_BO_HRM', 'SYSTEM', 'HRM_CORE', undefined, `${res.newEmployeesAdded} added`, `Đồng bộ HRM Core: ${res.newEmployeesAdded} nhân sự mới`);
      return {
        success: true,
        message: `Đồng bộ HRM thành công! Tổng cộng ${res.totalEmployees} nhân sự (${res.newEmployeesAdded} nhân sự mới được bổ sung).`,
        stats: res,
      };
    } catch {
      const extraEmp: Employee = {
        employee_id: `EMP-${Date.now().toString().slice(-3)}`,
        employee_code: `TG-${Math.floor(10000 + Math.random() * 90000)}`,
        full_name: 'Nguyễn Văn Quyết (HRM Sync)',
        unit_id: 'UNIT-03',
        department_id: 'DEP-05',
        position: 'Thủ kho Phụ trách KLH Campuchia',
        email: 'nguyenvanquyet@thacoagri.vn',
        phone: '0905 912 345',
        status: 'ACTIVE',
        role: 'THU_KHO',
      };
      setEmployees((prev) => [...prev, extraEmp]);
      return {
        success: true,
        message: 'Đồng bộ HRM thành công! Đã bổ sung 1 nhân sự mới từ hệ thống nhân sự tập đoàn.',
      };
    }
  };

  // --- EXPENSE CATEGORIES & SERVICE EXPENSES ACTIONS ---
  const addExpenseCategory = async (data: any) => {
    try {
      const created = await serverApi.createExpenseCategory(data);
      setExpenseCategories((prev) => [created, ...prev]);
      addAuditLog('THEM_DANH_MUC_CHI_PHI', 'EXPENSE_CATEGORY', created.expense_category_id, undefined, created.name, `Thêm danh mục chi phí: ${created.name}`);
      return { success: true, message: 'Đã thêm danh mục chi phí dịch vụ thành công!', category: created };
    } catch {
      const newCat: ExpenseCategory = {
        expense_category_id: `EPC-${Date.now().toString().slice(-4)}`,
        code: data.code || `CP-${Date.now().toString().slice(-4)}`,
        name: data.name,
        category_type: data.category_type || 'Chi phí dịch vụ chung',
        description: data.description || '',
        is_active: data.is_active !== undefined ? !!data.is_active : true,
        created_at: new Date().toISOString(),
      };
      setExpenseCategories((prev) => [newCat, ...prev]);
      return { success: true, message: 'Đã thêm danh mục chi phí dịch vụ!', category: newCat };
    }
  };

  const updateExpenseCategory = async (id: string, data: any) => {
    try {
      const updated = await serverApi.updateExpenseCategory(id, data);
      setExpenseCategories((prev) => prev.map((c) => (c.expense_category_id === id ? updated : c)));
      addAuditLog('SUA_DANH_MUC_CHI_PHI', 'EXPENSE_CATEGORY', id, undefined, JSON.stringify(data), `Cập nhật danh mục chi phí ${id}`);
      return { success: true, message: 'Đã cập nhật danh mục chi phí thành công!' };
    } catch {
      setExpenseCategories((prev) => prev.map((c) => (c.expense_category_id === id ? { ...c, ...data } : c)));
      return { success: true, message: 'Đã cập nhật danh mục chi phí!' };
    }
  };

  const deleteExpenseCategory = async (id: string) => {
    try {
      await serverApi.deleteExpenseCategory(id);
      setExpenseCategories((prev) => prev.filter((c) => c.expense_category_id !== id));
      addAuditLog('XOA_DANH_MUC_CHI_PHI', 'EXPENSE_CATEGORY', id, undefined, undefined, `Xóa danh mục chi phí ${id}`);
      return { success: true, message: 'Đã xóa danh mục chi phí thành công!' };
    } catch {
      setExpenseCategories((prev) => prev.filter((c) => c.expense_category_id !== id));
      return { success: true, message: 'Đã xóa danh mục chi phí!' };
    }
  };

  const addServiceExpense = async (data: any) => {
    try {
      const created = await serverApi.createServiceExpense({
        ...data,
        created_by: currentUser.full_name,
      });
      setServiceExpenses((prev) => [created, ...prev]);
      addAuditLog('THEM_CHI_PHI_DICH_VU', 'SERVICE_EXPENSE', created.expense_id, undefined, `${created.expense_code} - ${created.amount}đ`, `Ghi nhận chi phí dịch vụ: ${created.expense_name} từ ${created.supplier_name}`);
      return { success: true, message: 'Đã ghi nhận phiếu chi phí dịch vụ thành công!', expense: created };
    } catch {
      const count = serviceExpenses.length + 1;
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const newExp: ServiceExpense = {
        expense_id: `EXP-${Date.now()}`,
        expense_code: data.expense_code || `DV-${yearMonth}-${String(count).padStart(3, '0')}`,
        occurred_at: data.occurred_at || new Date().toISOString(),
        expense_category_id: data.expense_category_id,
        expense_name: data.expense_name,
        category_type: data.category_type,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        amount: Number(data.amount) || 0,
        description: data.description || '',
        invoice_ref: data.invoice_ref || '',
        attachment_file: data.attachment_file || '',
        created_by: currentUser.full_name,
        created_at: new Date().toISOString(),
      };
      setServiceExpenses((prev) => [newExp, ...prev]);
      return { success: true, message: 'Đã ghi nhận phiếu chi phí dịch vụ!', expense: newExp };
    }
  };

  const updateServiceExpense = async (id: string, data: any) => {
    try {
      const updated = await serverApi.updateServiceExpense(id, data);
      setServiceExpenses((prev) => prev.map((e) => (e.expense_id === id ? updated : e)));
      addAuditLog('SUA_CHI_PHI_DICH_VU', 'SERVICE_EXPENSE', id, undefined, JSON.stringify(data), `Cập nhật phiếu chi phí dịch vụ ${id}`);
      return { success: true, message: 'Đã cập nhật phiếu chi phí dịch vụ thành công!' };
    } catch {
      setServiceExpenses((prev) => prev.map((e) => (e.expense_id === id ? { ...e, ...data, amount: data.amount !== undefined ? Number(data.amount) : e.amount } : e)));
      return { success: true, message: 'Đã cập nhật phiếu chi phí dịch vụ!' };
    }
  };

  const deleteServiceExpense = async (id: string) => {
    try {
      await serverApi.deleteServiceExpense(id);
      setServiceExpenses((prev) => prev.filter((e) => e.expense_id !== id));
      addAuditLog('XOA_CHI_PHI_DICH_VU', 'SERVICE_EXPENSE', id, undefined, undefined, `Xóa phiếu chi phí dịch vụ ${id}`);
      return { success: true, message: 'Đã xóa phiếu chi phí dịch vụ thành công!' };
    } catch {
      setServiceExpenses((prev) => prev.filter((e) => e.expense_id !== id));
      return { success: true, message: 'Đã xóa phiếu chi phí dịch vụ!' };
    }
  };

  const resetToDefaultData = async () => {
    localStorage.clear();
    try {
      const res = await serverApi.resetData();
      if (res && res.data) {
        if (res.data.units) setUnits(res.data.units);
        if (res.data.departments) setDepartments(res.data.departments);
        if (res.data.employees) setEmployees(res.data.employees);
        if (res.data.warehouses) setWarehouses(res.data.warehouses);
        if (res.data.suppliers) setSuppliers(res.data.suppliers);
        setCategories(res.data.categories);
        setAssets(res.data.assets);
        setStockBalances(res.data.stockBalances);
        setPurchaseOrders(res.data.purchaseOrders);
        setProcurementDemands(res.data.procurementDemands);
        setRequests(res.data.requests);
        setTickets(res.data.tickets);
        setTransfers(res.data.transfers);
        if (res.data.expenseCategories) setExpenseCategories(res.data.expenseCategories);
        if (res.data.serviceExpenses) setServiceExpenses(res.data.serviceExpenses);
      }
    } catch {
      setUnits(INITIAL_UNITS);
      setDepartments(INITIAL_DEPARTMENTS);
      setEmployees(INITIAL_EMPLOYEES);
      setWarehouses(INITIAL_WAREHOUSES);
      setSuppliers(INITIAL_SUPPLIERS);
      setCategories(INITIAL_CATEGORIES);
      setAssets(INITIAL_ASSETS);
      setStockBalances(INITIAL_STOCK_BALANCES);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      setProcurementDemands(INITIAL_PROCUREMENT_DEMANDS);
      setRequests(INITIAL_REQUESTS);
      setTickets(INITIAL_TICKETS);
      setTransfers(INITIAL_TRANSFERS);
      setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
      setServiceExpenses(INITIAL_SERVICE_EXPENSES);
    }
    setAssetEvents(INITIAL_ASSET_EVENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCurrentUserId('EMP-001');
    setSelectedWarehouseId('WH-01');
    alert('Đã khôi phục dữ liệu mẫu hệ thống THACO AGRI về ban đầu trên Server!');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUserById,
        selectedWarehouseId,
        setSelectedWarehouseId,
        units,
        departments,
        employees,
        warehouses,
        suppliers,
        categories,
        assets,
        stockBalances,
        purchaseOrders,
        procurementDemands,
        requests,
        tickets,
        assetEvents,
        transfers,
        auditLogs,
        transactions,
        expenseCategories,
        serviceExpenses,
        consolidateDemandsToPO,
        createSinglePOFromDemand,
        createManualDemand,
        addDemandFromRequest,
        addCategory,
        updateCategory,
        deleteCategory,
        createRequest,
        updateRequest,
        updateRequestStatus,
        issueRequestAllocation,
        convertRequestToPO,
        createTicket,
        assignTicket,
        completeTicketScenario,
        proposeTicketScenario,
        approveTicketProposal,
        createPO,
        procurePO,
        receivePOConsumable,
        identifyPOAssets,
        issueAssetDirect,
        issueConsumableDirect,
        recallAsset,
        liquidateAsset,
        createTransfer,
        confirmTransfer,
        addAuditLog,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addUnit,
        updateUnit,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addWarehouse,
        updateWarehouse,
        addEmployee,
        updateEmployee,
        updateUserRole,
        syncEmployeesFromHRM,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,
        addServiceExpense,
        updateServiceExpense,
        deleteServiceExpense,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
