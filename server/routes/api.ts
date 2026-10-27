import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbStore } from '../db/store.ts';
import { SQL_SERVER_SCHEMA_SCRIPT } from '../data/sqlServerScript.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_SQL_FILE = path.resolve(__dirname, '../../ThacoAgri_Database_SQLServer2019.sql');

export const apiRouter = Router();

// ==========================================
// 1. SYSTEM & DATABASE ENDPOINTS
// ==========================================

// GET /api/health
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'THACO AGRI - He thong Quan ly Tai san & Thu mua',
    version: '2.5.0',
    architecture: 'Two-Tier Modular (Server: Node.js/Express, Client: React 19/Vite)',
    databaseEngine: 'Microsoft SQL Server 2022 (Compatibility Mode: Relational Store)',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/data - Full database snapshot for client synchronization
apiRouter.get('/data', (_req: Request, res: Response) => {
  try {
    const data = dbStore.getState();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi tải dữ liệu từ server' });
  }
});

// POST /api/reset - Reset server database to initial seeds
apiRouter.post('/reset', (_req: Request, res: Response) => {
  try {
    const resetData = dbStore.reset();
    res.json({ message: 'Đã khôi phục dữ liệu ban đầu thành công', data: resetData });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi đặt lại dữ liệu' });
  }
});

// GET /api/sql-schema - Download T-SQL DDL schema & data for Microsoft SQL Server 2019 / 2022
apiRouter.get('/sql-schema', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ThacoAgri_Database_SQLServer2019.sql"');
  if (fs.existsSync(ROOT_SQL_FILE)) {
    res.send(fs.readFileSync(ROOT_SQL_FILE, 'utf-8'));
  } else {
    res.send(SQL_SERVER_SCHEMA_SCRIPT);
  }
});

// GET /api/system/info
apiRouter.get('/system/info', (_req: Request, res: Response) => {
  res.json({
    company: 'THACO AGRI',
    tier: 'Two-Tier Architecture (Node.js/Express Server + React 19 Client)',
    database: 'Microsoft SQL Server 2022 Relational Architecture',
    ruleSection541: 'Strict separation of DINH_DANH (Serialized with QR/Serial) vs TIEU_HAO (Consumables by Qty)',
    ticketApprovalWorkflow: 'Scenarios 2 & 3: Technician proposes only -> CBNV attaches signed PDF to approve -> Auto creates Warehouse Requisition',
  });
});

// ==========================================
// 2. PURCHASE ORDERS & GOM PO HUB ENDPOINTS
// ==========================================

// POST /api/purchase-orders/consolidate - Consolidate multiple demands into PO(s)
apiRouter.post('/purchase-orders/consolidate', (req: Request, res: Response) => {
  try {
    const result = dbStore.consolidateDemands(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi gom PO' });
  }
});

// POST /api/purchase-orders/single - Create single/separate PO for 1 demand
apiRouter.post('/purchase-orders/single', (req: Request, res: Response) => {
  try {
    const po = dbStore.createSinglePOFromDemand(req.body);
    res.status(201).json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo PO riêng' });
  }
});

// POST /api/purchase-orders/manual - Create standalone manual PO
apiRouter.post('/purchase-orders/manual', (req: Request, res: Response) => {
  try {
    const po = dbStore.createManualPO(req.body);
    res.status(201).json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo PO thủ công' });
  }
});

// PATCH /api/purchase-orders/:id/status
apiRouter.patch('/purchase-orders/:id/status', (req: Request, res: Response) => {
  try {
    const po = dbStore.updatePOStatus(req.params.id, req.body.status, req.body.note);
    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật trạng thái PO' });
  }
});

// POST /api/purchase-orders/:id/identify - Identify Serial/QR for DINH_DANH PO items
apiRouter.post('/purchase-orders/:id/identify', (req: Request, res: Response) => {
  try {
    const result = dbStore.identifyPOAssets(req.params.id, req.body.declarations);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi định danh thiết bị PO' });
  }
});

// POST /api/purchase-orders/:id/receive-consumable - Receive TIEU_HAO PO items into stock
apiRouter.post('/purchase-orders/:id/receive-consumable', (req: Request, res: Response) => {
  try {
    const po = dbStore.receivePOConsumable(req.params.id);
    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi nhập kho vật tư tiêu hao' });
  }
});

// ==========================================
// 3. ASSET ALLOCATION REQUESTS (UI06 & UI07)
// ==========================================

// POST /api/requests - Create new asset request
apiRouter.post('/requests', (req: Request, res: Response) => {
  try {
    const newReq = dbStore.createRequest(req.body);
    res.status(201).json(newReq);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo yêu cầu cấp phát' });
  }
});

// PUT /api/requests/:id - Update request (lines, purpose, attachment, draft status)
apiRouter.put('/requests/:id', (req: Request, res: Response) => {
  try {
    const updated = dbStore.updateRequest(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi chỉnh sửa yêu cầu cấp phát' });
  }
});

// PATCH /api/requests/:id/status - Update request status (accept, reject)
apiRouter.patch('/requests/:id/status', (req: Request, res: Response) => {
  try {
    const updated = dbStore.updateRequestStatus(req.params.id, req.body.status, req.body.reason);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật yêu cầu' });
  }
});

// POST /api/requests/:id/allocate - Issue allocation for request
apiRouter.post('/requests/:id/allocate', (req: Request, res: Response) => {
  try {
    const updated = dbStore.issueRequestAllocation(req.params.id, req.body.allocations);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cấp phát thiết bị' });
  }
});

// POST /api/requests/:id/to-demand - Push unfulfilled request item to Gom PO Hub
apiRouter.post('/requests/:id/to-demand', (req: Request, res: Response) => {
  try {
    const demand = dbStore.addDemandFromRequest(
      req.params.id,
      req.body.line_id,
      req.body.qty,
      req.body.reason
    );
    res.status(201).json(demand);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi chuyển sang nhu cầu gom PO' });
  }
});

// ==========================================
// 4. TECHNICAL TICKETS & INCIDENTS (UI08)
// ==========================================

// POST /api/tickets - Create new technical support ticket
apiRouter.post('/tickets', (req: Request, res: Response) => {
  try {
    const tck = dbStore.createTicket(req.body);
    res.status(201).json(tck);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi báo sự cố kỹ thuật' });
  }
});

// PATCH /api/tickets/:id/assign - Assign ticket to technician
apiRouter.patch('/tickets/:id/assign', (req: Request, res: Response) => {
  try {
    const tck = dbStore.assignTicket(req.params.id, req.body.technician_id);
    res.json(tck);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tiếp nhận ticket' });
  }
});

// POST /api/tickets/:id/propose - Technician proposes resolution (Scenarios 2 & 3)
apiRouter.post('/tickets/:id/propose', (req: Request, res: Response) => {
  try {
    const tck = dbStore.proposeTicketScenario({
      ticket_id: req.params.id,
      scenario: req.body.scenario,
      resolution: req.body.resolution,
      materials: req.body.materials,
      proposed_by: req.body.proposed_by,
    });
    res.json(tck);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi đề xuất phương án kỹ thuật' });
  }
});

// POST /api/tickets/:id/approve - CBNV approves proposal with signed PDF
apiRouter.post('/tickets/:id/approve', (req: Request, res: Response) => {
  try {
    const result = dbStore.approveTicketProposal({
      ticket_id: req.params.id,
      signed_attachment_name: req.body.signed_attachment_name,
      approved_by: req.body.approved_by,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi phê duyệt phương án ticket' });
  }
});

// ==========================================
// 5. ASSET OPERATIONS (ALLOCATION, RECALL, LIQUIDATION)
// ==========================================

// POST /api/assets/allocate-direct
apiRouter.post('/assets/allocate-direct', (req: Request, res: Response) => {
  try {
    const ast = dbStore.issueAssetDirect(req.body);
    res.json(ast);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cấp phát tài sản' });
  }
});

// POST /api/assets/allocate-consumable-direct
apiRouter.post('/assets/allocate-consumable-direct', (req: Request, res: Response) => {
  try {
    const bal = dbStore.issueConsumableDirect(req.body);
    res.json(bal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cấp phát vật tư tiêu hao' });
  }
});

// POST /api/assets/recall
apiRouter.post('/assets/recall', (req: Request, res: Response) => {
  try {
    const ast = dbStore.recallAsset(req.body);
    res.json(ast);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thu hồi tài sản' });
  }
});

// POST /api/assets/liquidate
apiRouter.post('/assets/liquidate', (req: Request, res: Response) => {
  try {
    const ast = dbStore.liquidateAsset(req.body);
    res.json(ast);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thanh lý tài sản' });
  }
});

// ==========================================
// 6. TRANSFERS & CATEGORIES
// ==========================================

// POST /api/transfers
apiRouter.post('/transfers', (req: Request, res: Response) => {
  try {
    const tr = dbStore.createTransfer(req.body);
    res.status(201).json(tr);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo phiếu điều chuyển' });
  }
});

// PATCH /api/transfers/:id/status
apiRouter.patch('/transfers/:id/status', (req: Request, res: Response) => {
  try {
    const tr = dbStore.updateTransferStatus(req.params.id, req.body.status);
    res.json(tr);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật điều chuyển' });
  }
});

// POST /api/categories
apiRouter.post('/categories', (req: Request, res: Response) => {
  try {
    const cat = dbStore.addCategory(req.body);
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo danh mục' });
  }
});

// PUT /api/categories/:id
apiRouter.put('/categories/:id', (req: Request, res: Response) => {
  try {
    const cat = dbStore.updateCategory(req.params.id, req.body);
    res.json(cat);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật danh mục' });
  }
});

// DELETE /api/categories/:id
apiRouter.delete('/categories/:id', (req: Request, res: Response) => {
  try {
    const result = dbStore.deleteCategory(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi xóa danh mục' });
  }
});

// ==========================================
// 7. ADMIN CONFIGURATION ENDPOINTS
// ==========================================

// --- Suppliers Configuration ---
apiRouter.get('/suppliers', (_req: Request, res: Response) => {
  res.json(dbStore.getState().suppliers || []);
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  try {
    const supp = dbStore.addSupplier(req.body);
    res.status(201).json(supp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thêm nhà cung cấp' });
  }
});

apiRouter.put('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const supp = dbStore.updateSupplier(req.params.id, req.body);
    res.json(supp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật nhà cung cấp' });
  }
});

apiRouter.delete('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const result = dbStore.deleteSupplier(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi xóa nhà cung cấp' });
  }
});

// --- Organization Units Configuration ---
apiRouter.get('/units', (_req: Request, res: Response) => {
  res.json(dbStore.getState().units || []);
});

apiRouter.post('/units', (req: Request, res: Response) => {
  try {
    const unit = dbStore.addUnit(req.body);
    res.status(201).json(unit);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo đơn vị' });
  }
});

apiRouter.put('/units/:id', (req: Request, res: Response) => {
  try {
    const unit = dbStore.updateUnit(req.params.id, req.body);
    res.json(unit);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật đơn vị' });
  }
});

// --- Departments Configuration (Relational to Units) ---
apiRouter.get('/departments', (_req: Request, res: Response) => {
  res.json(dbStore.getState().departments || []);
});

apiRouter.post('/departments', (req: Request, res: Response) => {
  try {
    const dept = dbStore.addDepartment(req.body);
    res.status(201).json(dept);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo phòng ban' });
  }
});

apiRouter.put('/departments/:id', (req: Request, res: Response) => {
  try {
    const dept = dbStore.updateDepartment(req.params.id, req.body);
    res.json(dept);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật phòng ban' });
  }
});

apiRouter.delete('/departments/:id', (req: Request, res: Response) => {
  try {
    const result = dbStore.deleteDepartment(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi xóa phòng ban' });
  }
});

// --- Warehouses Configuration ---
apiRouter.get('/warehouses', (_req: Request, res: Response) => {
  res.json(dbStore.getState().warehouses || []);
});

apiRouter.post('/warehouses', (req: Request, res: Response) => {
  try {
    const wh = dbStore.addWarehouse(req.body);
    res.status(201).json(wh);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thêm kho' });
  }
});

apiRouter.put('/warehouses/:id', (req: Request, res: Response) => {
  try {
    const wh = dbStore.updateWarehouse(req.params.id, req.body);
    res.json(wh);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật kho' });
  }
});

// --- Employees & Role Permissions ---
apiRouter.get('/employees', (_req: Request, res: Response) => {
  res.json(dbStore.getState().employees || []);
});

apiRouter.post('/employees', (req: Request, res: Response) => {
  try {
    const emp = dbStore.addEmployee(req.body);
    res.status(201).json(emp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thêm nhân viên' });
  }
});

apiRouter.put('/employees/:id', (req: Request, res: Response) => {
  try {
    const emp = dbStore.updateEmployee(req.params.id, req.body);
    res.json(emp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật nhân viên' });
  }
});

apiRouter.patch('/employees/:id/role', (req: Request, res: Response) => {
  try {
    const emp = dbStore.updateUserRole(req.params.id, req.body.role);
    res.json(emp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi phân quyền nhân viên' });
  }
});

// --- HRM Synchronization Simulation ---
apiRouter.post('/employees/sync-hrm', (_req: Request, res: Response) => {
  try {
    const result = dbStore.syncEmployeesFromHRM();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi đồng bộ HRM' });
  }
});

// ==========================================
// 12. EXPENSE CATEGORIES & SERVICE EXPENSES
// ==========================================

// GET /api/expense-categories
apiRouter.get('/expense-categories', (_req: Request, res: Response) => {
  try {
    const list = dbStore.getState().expenseCategories || [];
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi tải danh mục chi phí' });
  }
});

// POST /api/expense-categories
apiRouter.post('/expense-categories', (req: Request, res: Response) => {
  try {
    const item = dbStore.addExpenseCategory(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi thêm danh mục chi phí' });
  }
});

// PUT /api/expense-categories/:id
apiRouter.put('/expense-categories/:id', (req: Request, res: Response) => {
  try {
    const item = dbStore.updateExpenseCategory(req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật danh mục chi phí' });
  }
});

// DELETE /api/expense-categories/:id
apiRouter.delete('/expense-categories/:id', (req: Request, res: Response) => {
  try {
    const result = dbStore.deleteExpenseCategory(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi xóa danh mục chi phí' });
  }
});

// GET /api/service-expenses
apiRouter.get('/service-expenses', (_req: Request, res: Response) => {
  try {
    const list = dbStore.getState().serviceExpenses || [];
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi tải phiếu chi phí dịch vụ' });
  }
});

// POST /api/service-expenses
apiRouter.post('/service-expenses', (req: Request, res: Response) => {
  try {
    const item = dbStore.addServiceExpense(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi tạo phiếu chi phí dịch vụ' });
  }
});

// PUT /api/service-expenses/:id
apiRouter.put('/service-expenses/:id', (req: Request, res: Response) => {
  try {
    const item = dbStore.updateServiceExpense(req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi cập nhật phiếu chi phí dịch vụ' });
  }
});

// DELETE /api/service-expenses/:id
apiRouter.delete('/service-expenses/:id', (req: Request, res: Response) => {
  try {
    const result = dbStore.deleteServiceExpense(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi khi xóa phiếu chi phí dịch vụ' });
  }
});

