/**
 * THACO AGRI - Client HTTP API Service
 * Communicates directly with the Express Backend (/api/*)
 */
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
  Transfer,
  AuditLog,
  InventoryTransaction,
  ProcurementDemandItem,
  Supplier,
  ExpenseCategory,
  ServiceExpense,
} from '../types.ts';

export interface DatabaseState {
  units: OrganizationUnit[];
  departments: Department[];
  employees: Employee[];
  warehouses: any[];
  suppliers: Supplier[];
  categories: Category[];
  assets: Asset[];
  stockBalances: StockBalance[];
  purchaseOrders: PurchaseOrder[];
  requests: AssetRequest[];
  tickets: SupportTicket[];
  procurementDemands: ProcurementDemandItem[];
  transfers: Transfer[];
  auditLogs: AuditLog[];
  transactions: InventoryTransaction[];
  expenseCategories?: ExpenseCategory[];
  serviceExpenses?: ServiceExpense[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMessage = errJson.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const serverApi = {
  // 1. Core Data
  async getData(): Promise<DatabaseState> {
    return request<DatabaseState>('/api/data');
  },

  async resetData(): Promise<{ message: string; data: DatabaseState }> {
    return request<{ message: string; data: DatabaseState }>('/api/reset', {
      method: 'POST',
    });
  },

  downloadSqlSchema(): void {
    window.location.href = '/api/sql-schema';
  },

  // 2. PO & Gom PO Hub
  async consolidateDemands(payload: {
    demand_ids: string[];
    supplier_name: string;
    note?: string;
    created_by: string;
    receiving_warehouse_id?: string;
  }): Promise<{ createdPOs: PurchaseOrder[]; demandCount: number }> {
    return request('/api/purchase-orders/consolidate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createSinglePO(payload: {
    demand_id: string;
    supplier_name: string;
    actual_price?: number;
    note?: string;
    created_by: string;
    receiving_warehouse_id?: string;
  }): Promise<PurchaseOrder> {
    return request<PurchaseOrder>('/api/purchase-orders/single', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createManualPO(poData: any): Promise<PurchaseOrder> {
    return request<PurchaseOrder>('/api/purchase-orders/manual', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  async updatePOStatus(po_id: string, status: any, note?: string): Promise<PurchaseOrder> {
    return request<PurchaseOrder>(`/api/purchase-orders/${po_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  async identifyPOAssets(
    po_id: string,
    declarations: Array<{
      category_id: string;
      serial_no: string;
      specifications?: string;
      warranty_from?: string;
      warranty_to?: string;
      purchase_cost: number;
      location?: string;
    }>
  ): Promise<{ createdAssets: Asset[]; po: PurchaseOrder }> {
    return request(`/api/purchase-orders/${po_id}/identify`, {
      method: 'POST',
      body: JSON.stringify({ declarations }),
    });
  },

  async receivePOConsumable(po_id: string): Promise<PurchaseOrder> {
    return request<PurchaseOrder>(`/api/purchase-orders/${po_id}/receive-consumable`, {
      method: 'POST',
    });
  },

  // 3. Requests (UI06 & UI07)
  async createRequest(data: any): Promise<AssetRequest> {
    return request<AssetRequest>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRequest(request_id: string, data: any): Promise<AssetRequest> {
    return request<AssetRequest>(`/api/requests/${request_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateRequestStatus(request_id: string, status: any, reason?: string): Promise<AssetRequest> {
    return request<AssetRequest>(`/api/requests/${request_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  async issueRequestAllocation(request_id: string, allocations: any): Promise<AssetRequest> {
    return request<AssetRequest>(`/api/requests/${request_id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ allocations }),
    });
  },

  async addDemandFromRequest(
    request_id: string,
    line_id: string,
    qty: number,
    reason?: string
  ): Promise<ProcurementDemandItem> {
    return request<ProcurementDemandItem>(`/api/requests/${request_id}/to-demand`, {
      method: 'POST',
      body: JSON.stringify({ line_id, qty, reason }),
    });
  },

  // 4. Tickets (UI08)
  async createTicket(data: any): Promise<SupportTicket> {
    return request<SupportTicket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async assignTicket(ticket_id: string, technician_id: string): Promise<SupportTicket> {
    return request<SupportTicket>(`/api/tickets/${ticket_id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ technician_id }),
    });
  },

  async proposeTicketScenario(payload: {
    ticket_id: string;
    scenario: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI';
    resolution: string;
    materials: any[];
    proposed_by: string;
  }): Promise<SupportTicket> {
    return request<SupportTicket>(`/api/tickets/${payload.ticket_id}/propose`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async approveTicketProposal(payload: {
    ticket_id: string;
    signed_attachment_name: string;
    approved_by: string;
  }): Promise<{ ticket: SupportTicket; newRequest: AssetRequest }> {
    return request(`/api/tickets/${payload.ticket_id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 5. Asset Operations
  async issueAssetDirect(payload: { asset_id: string; employee_id: string; note?: string }): Promise<Asset> {
    return request<Asset>('/api/assets/allocate-direct', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async issueConsumableDirect(payload: {
    warehouse_id: string;
    category_id: string;
    qty: number;
    employee_id: string;
  }): Promise<StockBalance> {
    return request<StockBalance>('/api/assets/allocate-consumable-direct', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recallAsset(payload: { asset_id: string; warehouse_id: string; reason?: string }): Promise<Asset> {
    return request<Asset>('/api/assets/recall', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async liquidateAsset(payload: { asset_id: string; reason?: string }): Promise<Asset> {
    return request<Asset>('/api/assets/liquidate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 6. Transfers & Categories
  async createTransfer(payload: any): Promise<Transfer> {
    return request<Transfer>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTransferStatus(transfer_id: string, status: any): Promise<Transfer> {
    return request<Transfer>(`/api/transfers/${transfer_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addCategory(payload: any): Promise<Category> {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(categoryId: string, payload: any): Promise<Category> {
    return request<Category>(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteCategory(categoryId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  // 7. Suppliers Configuration
  async addSupplier(payload: any): Promise<Supplier> {
    return request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSupplier(supplier_id: string, payload: any): Promise<Supplier> {
    return request<Supplier>(`/api/suppliers/${supplier_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSupplier(supplier_id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/suppliers/${supplier_id}`, {
      method: 'DELETE',
    });
  },

  // 8. Units & Warehouses Configuration
  async addUnit(payload: any): Promise<OrganizationUnit> {
    return request<OrganizationUnit>('/api/units', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUnit(unit_id: string, payload: any): Promise<OrganizationUnit> {
    return request<OrganizationUnit>(`/api/units/${unit_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // 8.1 Departments Configuration (Relational to Units)
  async addDepartment(payload: any): Promise<Department> {
    return request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateDepartment(department_id: string, payload: any): Promise<Department> {
    return request<Department>(`/api/departments/${department_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteDepartment(department_id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/departments/${department_id}`, {
      method: 'DELETE',
    });
  },

  async addWarehouse(payload: any): Promise<Warehouse> {
    return request<Warehouse>('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateWarehouse(warehouse_id: string, payload: any): Promise<Warehouse> {
    return request<Warehouse>(`/api/warehouses/${warehouse_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // 9. Employees, RBAC & HRM Sync
  async addEmployee(payload: any): Promise<Employee> {
    return request<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateEmployee(employee_id: string, payload: any): Promise<Employee> {
    return request<Employee>(`/api/employees/${employee_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateUserRole(employee_id: string, role: string): Promise<Employee> {
    return request<Employee>(`/api/employees/${employee_id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async syncHrmEmployees(): Promise<{
    success: boolean;
    totalEmployees: number;
    newEmployeesAdded: number;
    timestamp: string;
    hrmGateway: string;
  }> {
    return request('/api/employees/sync-hrm', {
      method: 'POST',
    });
  },

  // Expense Categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return request<ExpenseCategory[]>('/api/expense-categories');
  },
  async createExpenseCategory(payload: any): Promise<ExpenseCategory> {
    return request<ExpenseCategory>('/api/expense-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateExpenseCategory(id: string, payload: any): Promise<ExpenseCategory> {
    return request<ExpenseCategory>(`/api/expense-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteExpenseCategory(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/expense-categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Service Expenses
  async getServiceExpenses(): Promise<ServiceExpense[]> {
    return request<ServiceExpense[]>('/api/service-expenses');
  },
  async createServiceExpense(payload: any): Promise<ServiceExpense> {
    return request<ServiceExpense>('/api/service-expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateServiceExpense(id: string, payload: any): Promise<ServiceExpense> {
    return request<ServiceExpense>(`/api/service-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteServiceExpense(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/service-expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
