import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  INITIAL_TRANSFERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROCUREMENT_DEMANDS,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_SERVICE_EXPENSES,
} from '../data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../.data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

export interface DatabaseState {
  units: any[];
  departments: any[];
  employees: any[];
  warehouses: any[];
  suppliers: any[];
  categories: any[];
  assets: any[];
  stockBalances: any[];
  purchaseOrders: any[];
  requests: any[];
  tickets: any[];
  procurementDemands: any[];
  transfers: any[];
  assetEvents: any[];
  auditLogs: any[];
  transactions: any[];
  expenseCategories: any[];
  serviceExpenses: any[];
}

function getDefaultState(): DatabaseState {
  return {
    units: JSON.parse(JSON.stringify(INITIAL_UNITS)),
    departments: JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS)),
    employees: JSON.parse(JSON.stringify(INITIAL_EMPLOYEES)),
    warehouses: JSON.parse(JSON.stringify(INITIAL_WAREHOUSES)),
    suppliers: JSON.parse(JSON.stringify(INITIAL_SUPPLIERS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    assets: JSON.parse(JSON.stringify(INITIAL_ASSETS)),
    stockBalances: JSON.parse(JSON.stringify(INITIAL_STOCK_BALANCES)),
    purchaseOrders: JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS)),
    requests: JSON.parse(JSON.stringify(INITIAL_REQUESTS)),
    tickets: JSON.parse(JSON.stringify(INITIAL_TICKETS)),
    procurementDemands: JSON.parse(JSON.stringify(INITIAL_PROCUREMENT_DEMANDS)),
    transfers: JSON.parse(JSON.stringify(INITIAL_TRANSFERS)),
    assetEvents: [],
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    transactions: JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)),
    expenseCategories: JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES)),
    serviceExpenses: JSON.parse(JSON.stringify(INITIAL_SERVICE_EXPENSES)),
  };
}

class DatabaseStore {
  private state: any;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const st = JSON.parse(raw);
        let updated = false;
        if (!st.suppliers) {
          st.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
          updated = true;
        }
        if (
          !st.expenseCategories ||
          st.expenseCategories.length < 40 ||
          !st.expenseCategories.some((c: any) => c.group_code === 'CPPL-KH') ||
          st.expenseCategories.some((c: any) => c.category_type?.startsWith('V.') || c.category_type?.startsWith('VI.'))
        ) {
          st.expenseCategories = JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
          updated = true;
        }
        if (
          !st.serviceExpenses ||
          st.serviceExpenses.length < 4 ||
          !st.serviceExpenses.some((e: any) => e.group_code?.startsWith('CPPL')) ||
          st.serviceExpenses.some((e: any) => e.category_type?.startsWith('V.') || e.category_type?.startsWith('VI.'))
        ) {
          st.serviceExpenses = JSON.parse(JSON.stringify(INITIAL_SERVICE_EXPENSES));
          updated = true;
        }
        if (updated) {
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(st, null, 2), 'utf-8');
          } catch (err) {
            console.warn('[DB] Could not write upgraded seed data to db.json:', err);
          }
        }
        return st;
      }
    } catch {
      console.warn('[DB] Could not load persisted db.json, using initial seed data');
    }
    const def = getDefaultState();
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(def, null, 2), 'utf-8');
    } catch {
      // ignore write error on init
    }
    return def;
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to save state to disk:', e);
    }
  }

  public reset(): DatabaseState {
    this.state = getDefaultState();
    this.save();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // --- BUSINESS LOGIC MUTATIONS (Server-Authoritative) ---

  // 1. Gom PO Hub: Consolidate Demands into 1 or 2 POs (strict separation of DINH_DANH vs TIEU_HAO per 5.4.1)
  public consolidateDemands(params: {
    demand_ids: string[];
    supplier_name: string;
    note?: string;
    created_by: string;
    receiving_warehouse_id?: string;
  }) {
    const { demand_ids, supplier_name, note, created_by, receiving_warehouse_id } = params;
    const selectedDemands = (this.state.procurementDemands || []).filter((d: any) =>
      demand_ids.includes(d.demand_id)
    );

    if (selectedDemands.length === 0) {
      throw new Error('Không tìm thấy mặt hàng nhu cầu nào được chọn!');
    }

    const ddDemands: any[] = [];
    const thDemands: any[] = [];

    selectedDemands.forEach((d: any) => {
      const cat = (this.state.categories || []).find((c: any) => c.category_id === d.category_id);
      if (cat?.tracking_type === 'DINH_DANH') {
        ddDemands.push(d);
      } else {
        thDemands.push(d);
      }
    });

    const createdPOs: any[] = [];
    const nowStr = new Date().toISOString();
    const targetWhId = receiving_warehouse_id || 'WH-01';

    // Create PO for DINH_DANH items
    if (ddDemands.length > 0) {
      const lines = ddDemands.map((d: any, idx: number) => {
        const cat = (this.state.categories || []).find((c: any) => c.category_id === d.category_id);
        return {
          line_id: `POL-GOM-DD-${Date.now()}-${idx + 1}`,
          po_id: '',
          category_id: d.category_id,
          tracking_type: 'DINH_DANH',
          qty_requested: d.qty_needed,
          qty_ordered: d.qty_needed,
          qty_received: 0,
          qty_identified: 0,
          estimated_unit_price: d.estimated_unit_price,
          actual_unit_price: d.estimated_unit_price,
          amount: d.qty_needed * d.estimated_unit_price,
          warehouse_id: targetWhId,
          source_type: d.source_type,
          source_id: d.source_id,
          source_code: d.source_code,
          source_name: d.requester_name || cat?.name,
          status: 'CHO_NHAN',
        };
      });

      const poId = `PO-DD-${Date.now().toString().slice(-6)}`;
      lines.forEach((l: any) => (l.po_id = poId));

      const poDD: any = {
        po_id: poId,
        po_code: `PO-AGRI-DD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier_name: supplier_name || 'Công ty TNHH Giải Pháp Tin Học & Thiết Bị THACO',
        receiving_warehouse_id: targetWhId,
        tracking_type: 'DINH_DANH',
        source: 'GOM_NHIEU_NGUON',
        status: 'DA_GUI_THU_MUA',
        lines,
        total_amount: lines.reduce((sum: number, l: any) => sum + l.amount, 0),
        created_by,
        created_at: nowStr,
        note: note || 'Đơn hàng gom nhu cầu mua sắm thiết bị định danh',
        aggregated_demand_count: ddDemands.length,
        aggregated_sources_summary: `Gom từ ${ddDemands.length} nhu cầu (${ddDemands.map((d: any) => d.source_code || d.source_title).join(', ')})`,
      };
      this.state.purchaseOrders.unshift(poDD);
      createdPOs.push(poDD);
    }

    // Create PO for TIEU_HAO items
    if (thDemands.length > 0) {
      const lines = thDemands.map((d: any, idx: number) => {
        const cat = (this.state.categories || []).find((c: any) => c.category_id === d.category_id);
        return {
          line_id: `POL-GOM-TH-${Date.now()}-${idx + 1}`,
          po_id: '',
          category_id: d.category_id,
          tracking_type: 'TIEU_HAO',
          qty_requested: d.qty_needed,
          qty_ordered: d.qty_needed,
          qty_received: 0,
          qty_identified: 0,
          estimated_unit_price: d.estimated_unit_price,
          actual_unit_price: d.estimated_unit_price,
          amount: d.qty_needed * d.estimated_unit_price,
          warehouse_id: targetWhId,
          source_type: d.source_type,
          source_id: d.source_id,
          source_code: d.source_code,
          source_name: d.requester_name || cat?.name,
          status: 'CHO_NHAN',
        };
      });

      const poId = `PO-TH-${Date.now().toString().slice(-6)}`;
      lines.forEach((l: any) => (l.po_id = poId));

      const poTH: any = {
        po_id: poId,
        po_code: `PO-AGRI-TH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier_name: supplier_name || 'Công ty Cổ phần Cung Ứng Vật Tư THACO',
        receiving_warehouse_id: targetWhId,
        tracking_type: 'TIEU_HAO',
        source: 'GOM_NHIEU_NGUON',
        status: 'DA_GUI_THU_MUA',
        lines,
        total_amount: lines.reduce((sum: number, l: any) => sum + l.amount, 0),
        created_by,
        created_at: nowStr,
        note: note || 'Đơn hàng gom nhu cầu mua sắm vật tư tiêu hao',
        aggregated_demand_count: thDemands.length,
        aggregated_sources_summary: `Gom từ ${thDemands.length} nhu cầu (${thDemands.map((d: any) => d.source_code || d.source_title).join(', ')})`,
      };
      this.state.purchaseOrders.unshift(poTH);
      createdPOs.push(poTH);
    }

    // Update demands status to DA_GOM_PO
    this.state.procurementDemands = (this.state.procurementDemands || []).map((d: any) =>
      demand_ids.includes(d.demand_id) ? { ...d, status: 'DA_GOM_PO' } : d
    );

    this.save();
    return { createdPOs, demandCount: selectedDemands.length };
  }

  // 2. Create Single Separate PO from an individual demand
  public createSinglePOFromDemand(params: {
    demand_id: string;
    supplier_name: string;
    actual_price?: number;
    note?: string;
    created_by: string;
    receiving_warehouse_id?: string;
  }) {
    const { demand_id, supplier_name, actual_price, note, created_by, receiving_warehouse_id } = params;
    const demand = (this.state.procurementDemands || []).find((d: any) => d.demand_id === demand_id);
    if (!demand) throw new Error('Không tìm thấy nhu cầu mua sắm!');

    const cat = (this.state.categories || []).find((c: any) => c.category_id === demand.category_id);
    const trackingType = cat?.tracking_type || 'DINH_DANH';
    const nowStr = new Date().toISOString();
    const unitPrice = actual_price !== undefined ? actual_price : demand.estimated_unit_price;
    const poId = `PO-RIENG-${Date.now().toString().slice(-6)}`;

    const newPO: any = {
      po_id: poId,
      po_code: `PO-AGRI-RIENG-${trackingType === 'DINH_DANH' ? 'DD' : 'TH'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier_name: supplier_name || 'Nhà Cung Cấp Chuyên Biệt',
      receiving_warehouse_id: receiving_warehouse_id || 'WH-01',
      tracking_type: trackingType,
      source: 'MANUAL',
      status: 'DA_GUI_THU_MUA',
      lines: [
        {
          line_id: `POL-RIENG-${Date.now()}`,
          po_id: poId,
          category_id: demand.category_id,
          tracking_type: trackingType,
          qty_requested: demand.qty_needed,
          qty_ordered: demand.qty_needed,
          qty_received: 0,
          qty_identified: 0,
          estimated_unit_price: demand.estimated_unit_price,
          actual_unit_price: unitPrice,
          amount: demand.qty_needed * unitPrice,
          warehouse_id: receiving_warehouse_id || 'WH-01',
          source_type: demand.source_type,
          source_id: demand.source_id,
          source_code: demand.source_code,
          source_name: demand.requester_name || cat?.name,
          status: 'CHO_NHAN',
        },
      ],
      total_amount: demand.qty_needed * unitPrice,
      created_by,
      created_at: nowStr,
      note: note || `Đơn hàng PO riêng biệt cho ${cat?.name || 'mặt hàng'} (${demand.source_code})`,
      aggregated_demand_count: 1,
      aggregated_sources_summary: `PO riêng từ [${demand.source_type}] ${demand.source_code}`,
    };

    this.state.purchaseOrders.unshift(newPO);
    this.state.procurementDemands = (this.state.procurementDemands || []).map((d: any) =>
      d.demand_id === demand_id ? { ...d, status: 'DA_GOM_PO', linked_po_id: poId, linked_po_code: newPO.po_code } : d
    );

    this.save();
    return newPO;
  }

  // 3. Create Manual PO
  public createManualPO(newPOData: any) {
    const nowStr = new Date().toISOString();
    const po: any = {
      ...newPOData,
      po_id: `PO-${Date.now().toString().slice(-6)}`,
      po_code: newPOData.po_code || `PO-AGRI-M-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: newPOData.status || 'DA_GUI_THU_MUA',
      created_at: nowStr,
    };
    this.state.purchaseOrders.unshift(po);
    this.save();
    return po;
  }

  // 4. Update PO Status
  public updatePOStatus(po_id: string, status: any, note?: string) {
    const po = (this.state.purchaseOrders || []).find((p: any) => p.po_id === po_id);
    if (!po) throw new Error('Không tìm thấy đơn hàng PO!');

    po.status = status;
    if (note) po.note = (po.note ? `${po.note} | ` : '') + note;

    this.save();
    return po;
  }

  // 5. PO Identification: Create Serialized Assets from PO lines
  public identifyPOAssets(po_id: string, declarations: Array<{
    category_id: string;
    serial_no: string;
    specifications?: string;
    warranty_from?: string;
    warranty_to?: string;
    purchase_cost: number;
    location?: string;
  }>) {
    const po = (this.state.purchaseOrders || []).find((p: any) => p.po_id === po_id);
    if (!po) throw new Error('Không tìm thấy đơn hàng PO!');

    const createdAssets: any[] = [];
    declarations.forEach((decl: any, idx: number) => {
      const cat = (this.state.categories || []).find((c: any) => c.category_id === decl.category_id);
      const prefix = cat?.prefix || 'AST';
      const assetCode = `${prefix}-${Date.now().toString().slice(-4)}${idx + 1}`;

      const asset: any = {
        asset_id: `AST-${Date.now()}-${idx + 1}`,
        asset_code: assetCode,
        category_id: decl.category_id,
        serial_no: decl.serial_no,
        specifications: decl.specifications || 'Tiêu chuẩn từ đơn PO',
        po_id: po.po_id,
        warehouse_id: po.receiving_warehouse_id,
        holder_employee_id: null,
        location: decl.location || 'Kho lưu trữ trung tâm',
        status: 'TRONG_KHO',
        warranty_from: decl.warranty_from || new Date().toISOString().slice(0, 10),
        warranty_to: decl.warranty_to || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        purchase_cost: decl.purchase_cost,
        qr_code: `THACO-AGRI://${assetCode}/${decl.serial_no}`,
        created_at: new Date().toISOString(),
      };
      this.state.assets.unshift(asset);
      createdAssets.push(asset);
    });

    po.status = 'DA_NHAP_KHO';
    this.save();
    return { createdAssets, po };
  }

  // 6. Receive Consumable PO: Increase stock balance directly
  public receivePOConsumable(po_id: string) {
    const po = (this.state.purchaseOrders || []).find((p: any) => p.po_id === po_id);
    if (!po) throw new Error('Không tìm thấy đơn hàng PO!');

    (po.lines || []).forEach((l: any) => {
      let balance = (this.state.stockBalances || []).find(
        (b: any) => b.warehouse_id === po.receiving_warehouse_id && b.category_id === l.category_id
      );
      if (balance) {
        balance.quantity_on_hand += l.qty_ordered;
        balance.invested_this_month += l.qty_ordered;
      } else {
        balance = {
          warehouse_id: po.receiving_warehouse_id,
          category_id: l.category_id,
          quantity_on_hand: l.qty_ordered,
          quantity_reserved: 0,
          invested_this_month: l.qty_ordered,
          issued_this_month: 0,
          average_unit_cost: l.actual_unit_price || l.estimated_unit_price,
        };
        this.state.stockBalances.push(balance);
      }
    });

    po.status = 'DA_NHAP_KHO';
    this.save();
    return po;
  }

  // 7. Technical Ticket: Propose solution (Scenario 2 & 3: Technician only proposes)
  public proposeTicketScenario(params: {
    ticket_id: string;
    scenario: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI';
    resolution: string;
    materials: any[];
    proposed_by: string;
  }) {
    const { ticket_id, scenario, resolution, materials, proposed_by } = params;
    const ticket = (this.state.tickets || []).find((t: any) => t.ticket_id === ticket_id);
    if (!ticket) throw new Error('Không tìm thấy ticket sự cố!');

    ticket.solution_scenario = scenario;
    ticket.resolution = resolution;
    ticket.materials = materials;
    ticket.assigned_to = proposed_by;
    ticket.updated_at = new Date().toISOString();

    if (scenario === 'SUA_TAI_CHO') {
      ticket.status = 'HOAN_THANH';
    } else {
      // Scenario 2 & 3: Wait for CBNV to attach signed PDF outside software
      ticket.status = 'DANG_XU_LY';
    }

    this.save();
    return ticket;
  }

  // 8. Technical Ticket: CBNV approves proposal with signed PDF and auto-generates warehouse demand
  public approveTicketProposal(params: {
    ticket_id: string;
    signed_attachment_name: string;
    approved_by: string;
  }) {
    const { ticket_id, signed_attachment_name } = params;
    const ticket = (this.state.tickets || []).find((t: any) => t.ticket_id === ticket_id);
    if (!ticket) throw new Error('Không tìm thấy ticket sự cố!');

    ticket.signed_proposal_file = {
      file_name: signed_attachment_name,
      uploaded_at: new Date().toISOString(),
    };
    ticket.status = 'HOAN_THANH';
    ticket.updated_at = new Date().toISOString();

    // Auto-generate Warehouse Allocation Request
    const reporter = (this.state.employees || []).find((e: any) => e.employee_id === ticket.reporter_id);
    const unitId = reporter?.unit_id || 'UNIT-01';
    const nowStr = new Date().toISOString();

    const requestLines = (ticket.materials || []).map((m: any, idx: number) => ({
      request_line_id: `REQL-TK-${ticket.ticket_code}-${idx + 1}`,
      request_id: '',
      category_id: m.category_id,
      qty_requested: m.qty || 1,
      qty_reserved: 0,
      qty_issued: 0,
      qty_to_purchase: 0,
      note: `Sinh tự động từ Ticket kỹ thuật: ${ticket.ticket_code}`,
    }));

    const reqId = `REQ-TK-${Date.now().toString().slice(-6)}`;
    requestLines.forEach((l: any) => (l.request_id = reqId));

    const newRequest: any = {
      request_id: reqId,
      request_code: `YC-TK-${ticket.ticket_code}`,
      requester_id: ticket.reporter_id,
      unit_id: unitId,
      request_type: ticket.solution_scenario === 'THU_HOI_CAP_MOI' ? 'CAP_THIET_BI_CNTT' : 'CAP_VAN_PHONG_PHAM',
      purpose: `[Duyệt Phương Án Kỹ Thuật ${ticket.ticket_code}] - Hồ sơ: ${signed_attachment_name}`,
      priority: ticket.priority,
      status: 'CHO_TIEP_NHAN',
      attachment_file: {
        file_name: signed_attachment_name,
        uploaded_at: nowStr,
        file_size: '350 KB',
      },
      lines: requestLines,
      created_at: nowStr,
    };
    this.state.requests.unshift(newRequest);

    // Auto-generate Procurement Demands for Gom PO Hub
    (ticket.materials || []).forEach((m: any, idx: number) => {
      const cat = (this.state.categories || []).find((c: any) => c.category_id === m.category_id);
      const demand: any = {
        demand_id: `DEMAND-TK-${Date.now()}-${idx + 1}`,
        source_type: 'TICKET_KY_THUAT',
        source_id: ticket.ticket_id,
        source_code: ticket.ticket_code,
        source_title: `Linh kiện sửa chữa Ticket: ${ticket.description}`,
        requester_name: reporter?.full_name || 'Kỹ thuật viên',
        requester_unit: unitId,
        category_id: m.category_id,
        qty_needed: m.qty || 1,
        estimated_unit_price: cat?.estimated_unit_price || 0,
        priority: ticket.priority,
        created_at: nowStr,
        status: 'CHO_GOM_PO',
        note: `Sinh tự động khi duyệt phương án kỹ thuật ${ticket.ticket_code}`,
      };
      this.state.procurementDemands.unshift(demand);
    });

    this.save();
    return { ticket, newRequest };
  }

  // 9. Create Request
  public createRequest(data: any) {
    const nowStr = new Date().toISOString();
    const req: any = {
      ...data,
      request_id: data.request_id || `REQ-${Date.now().toString().slice(-6)}`,
      request_code: data.request_code || `YC-AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: data.status || (data.is_draft ? 'NHAP' : 'CHO_TIEP_NHAN'),
      created_at: nowStr,
    };
    this.state.requests.unshift(req);
    this.save();
    return req;
  }

  // 9b. Update Request (Drafts or pending requests)
  public updateRequest(request_id: string, data: any) {
    const req = (this.state.requests || []).find((r: any) => r.request_id === request_id);
    if (!req) throw new Error('Không tìm thấy yêu cầu cấp phát!');

    if (data.request_type !== undefined) req.request_type = data.request_type;
    if (data.purpose !== undefined) req.purpose = data.purpose;
    if (data.priority !== undefined) req.priority = data.priority;
    if (data.lines !== undefined) req.lines = data.lines;
    if (data.attachment_file_name !== undefined) {
      if (data.attachment_file_name) {
        req.attachment_file = {
          file_name: data.attachment_file_name,
          uploaded_at: new Date().toISOString(),
          file_size: '350 KB',
        };
      } else {
        req.attachment_file = undefined;
      }
    } else if (data.attachment_file !== undefined) {
      req.attachment_file = data.attachment_file;
    }

    if (data.is_draft !== undefined) {
      req.status = data.is_draft ? 'NHAP' : 'CHO_TIEP_NHAN';
    } else if (data.status !== undefined) {
      req.status = data.status;
    }
    req.updated_at = new Date().toISOString();

    this.save();
    return req;
  }

  // 10. Update Request Status
  public updateRequestStatus(request_id: string, status: any, reason?: string) {
    const req = (this.state.requests || []).find((r: any) => r.request_id === request_id);
    if (!req) throw new Error('Không tìm thấy yêu cầu cấp phát!');

    req.status = status;
    if (reason) req.rejection_reason = reason;

    this.save();
    return req;
  }

  // 11. Issue Request Allocation (fulfill request lines from warehouse)
  public issueRequestAllocation(request_id: string, allocations: any) {
    const req = (this.state.requests || []).find((r: any) => r.request_id === request_id);
    if (!req) throw new Error('Không tìm thấy yêu cầu cấp phát!');

    const allocList = Array.isArray(allocations) ? allocations : Object.values(allocations || {});

    allocList.forEach((alloc: any) => {
      const lineId = alloc.line_id || alloc.request_line_id;
      const assetIds = alloc.asset_ids || alloc.selectedAssetIds || [];
      const consumableQty = alloc.consumable_qty || alloc.consumableQty || 0;

      const line = (req.lines || []).find((l: any) => l.request_line_id === lineId);

      // Allocate serialized assets
      if (assetIds.length > 0) {
        if (line) {
          line.qty_issued = (line.qty_issued || 0) + assetIds.length;
        }
        assetIds.forEach((astId: string) => {
          const ast = (this.state.assets || []).find((a: any) => a.asset_id === astId);
          if (ast) {
            ast.status = 'DANG_SU_DUNG';
            ast.holder_employee_id = req.requester_id;
          }
        });
      }

      // Allocate consumables
      if (consumableQty > 0) {
        if (line) {
          line.qty_issued = (line.qty_issued || 0) + consumableQty;
          const balance = (this.state.stockBalances || []).find(
            (b: any) => b.category_id === line.category_id
          );
          if (balance) {
            balance.quantity_on_hand = Math.max(0, balance.quantity_on_hand - consumableQty);
            balance.issued_this_month = (balance.issued_this_month || 0) + consumableQty;
          }
        }
      }
    });

    const isFullyIssued = (req.lines || []).every((l: any) => (l.qty_issued || 0) >= l.qty_requested);
    req.status = isFullyIssued ? 'HOAN_THANH' : 'CAP_MOT_PHAN';
    this.save();
    return req;
  }

  // 12. Add Demand From Request Line
  public addDemandFromRequest(request_id: string, line_id: string, qty: number, reason?: string) {
    const req = (this.state.requests || []).find((r: any) => r.request_id === request_id);
    if (!req) throw new Error('Không tìm thấy yêu cầu cấp phát!');

    const line = (req.lines || []).find((l: any) => l.request_line_id === line_id);
    if (!line) throw new Error('Không tìm thấy mặt hàng trong yêu cầu!');

    const cat = (this.state.categories || []).find((c: any) => c.category_id === line.category_id);
    const demand: any = {
      demand_id: `DEMAND-REQ-${Date.now()}`,
      source_type: 'YEU_CAU_CBNV',
      source_id: req.request_id,
      source_code: req.request_code,
      source_title: `Thiếu hàng khi cấp phát theo yêu cầu: ${req.purpose}`,
      requester_name: 'Cán bộ nhân viên',
      requester_unit: req.unit_id,
      category_id: line.category_id,
      qty_needed: qty,
      estimated_unit_price: cat?.estimated_unit_price || 0,
      priority: req.priority,
      created_at: new Date().toISOString(),
      status: 'CHO_GOM_PO',
      note: reason || 'Kho không đủ số lượng, chuyển chuyên viên thu mua gom PO',
    };

    this.state.procurementDemands.unshift(demand);
    this.save();
    return demand;
  }

  // 13. Create Ticket
  public createTicket(data: any) {
    const nowStr = new Date().toISOString();
    const tck: any = {
      ...data,
      ticket_id: `TCK-${Date.now().toString().slice(-6)}`,
      ticket_code: data.ticket_code || `TK-AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'MOI',
      created_at: nowStr,
    };
    this.state.tickets.unshift(tck);
    this.save();
    return tck;
  }

  // 14. Assign Ticket
  public assignTicket(ticket_id: string, technician_id: string) {
    const tck = (this.state.tickets || []).find((t: any) => t.ticket_id === ticket_id);
    if (!tck) throw new Error('Không tìm thấy ticket!');

    tck.assigned_to = technician_id;
    tck.status = 'DANG_XU_LY';
    this.save();
    return tck;
  }

  // 15. Issue Asset Direct
  public issueAssetDirect(params: { asset_id: string; employee_id: string; note?: string }) {
    const ast = (this.state.assets || []).find((a: any) => a.asset_id === params.asset_id);
    if (!ast) throw new Error('Không tìm thấy tài sản!');

    ast.status = 'DANG_SU_DUNG';
    ast.holder_employee_id = params.employee_id;
    this.save();
    return ast;
  }

  // 16. Issue Consumable Direct
  public issueConsumableDirect(params: { warehouse_id: string; category_id: string; qty: number; employee_id: string }) {
    const balance = (this.state.stockBalances || []).find(
      (b: any) => b.warehouse_id === params.warehouse_id && b.category_id === params.category_id
    );
    if (!balance || balance.quantity_on_hand < params.qty) {
      throw new Error('Số lượng tồn kho không đủ để cấp phát!');
    }

    balance.quantity_on_hand -= params.qty;
    balance.issued_this_month = (balance.issued_this_month || 0) + params.qty;
    this.save();
    return balance;
  }

  // 17. Recall Asset
  public recallAsset(params: { asset_id: string; warehouse_id: string; reason?: string }) {
    const ast = (this.state.assets || []).find((a: any) => a.asset_id === params.asset_id);
    if (!ast) throw new Error('Không tìm thấy tài sản!');

    ast.status = 'TRONG_KHO';
    ast.holder_employee_id = null;
    ast.warehouse_id = params.warehouse_id;
    this.save();
    return ast;
  }

  // 18. Liquidate Asset
  public liquidateAsset(params: { asset_id: string; reason?: string }) {
    const ast = (this.state.assets || []).find((a: any) => a.asset_id === params.asset_id);
    if (!ast) throw new Error('Không tìm thấy tài sản!');

    ast.status = 'DA_THANH_LY';
    ast.holder_employee_id = null;
    this.save();
    return ast;
  }

  // 19. Create Transfer
  public createTransfer(transferData: any) {
    const nowStr = new Date().toISOString();
    const tr: any = {
      ...transferData,
      transfer_id: `TR-${Date.now().toString().slice(-6)}`,
      code: `DC-AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'CHO_XAC_NHAN',
      dispatched_at: nowStr,
    };
    this.state.transfers.unshift(tr);
    this.save();
    return tr;
  }

  // 20. Update Transfer Status
  public updateTransferStatus(transfer_id: string, status: any) {
    const tr = (this.state.transfers || []).find((t: any) => t.transfer_id === transfer_id);
    if (!tr) throw new Error('Không tìm thấy phiếu điều chuyển!');

    tr.status = status;
    if (status === 'DA_HOAN_THANH') {
      (tr.lines || []).forEach((line: any) => {
        const ast = (this.state.assets || []).find((a: any) => a.asset_id === line.asset_id);
        if (ast) {
          ast.warehouse_id = tr.to_warehouse_id;
          ast.status = 'TRONG_KHO';
        }
      });
    }
    this.save();
    return tr;
  }

  // 21. Add Category & Update Category (CRUD)
  public addCategory(catData: any) {
    const cat: any = {
      ...catData,
      category_id: catData.category_id || `CAT-${Date.now().toString().slice(-6)}`,
      status: catData.status || 'ACTIVE',
    };
    if (!this.state.categories) this.state.categories = [];
    this.state.categories.push(cat);
    this.save();
    return cat;
  }

  public updateCategory(category_id: string, data: any) {
    const idx = (this.state.categories || []).findIndex((c: any) => c.category_id === category_id);
    if (idx === -1) throw new Error('Không tìm thấy danh mục hàng hóa!');
    this.state.categories[idx] = { ...this.state.categories[idx], ...data };
    this.save();
    return this.state.categories[idx];
  }

  public deleteCategory(category_id: string) {
    const hasAssets = (this.state.assets || []).some((a: any) => a.category_id === category_id);
    if (hasAssets) {
      throw new Error('Không thể xóa danh mục này vì đang có thiết bị/tài sản liên kết trong hệ thống!');
    }
    this.state.categories = (this.state.categories || []).filter((c: any) => c.category_id !== category_id);
    this.save();
    return { success: true };
  }

  // 22. Supplier Configuration (CRUD)
  public addSupplier(data: any) {
    const supp = {
      ...data,
      supplier_id: data.supplier_id || `SUP-${Date.now().toString().slice(-4)}`,
      status: data.status || 'ACTIVE',
    };
    if (!this.state.suppliers) this.state.suppliers = [];
    this.state.suppliers.push(supp);
    this.save();
    return supp;
  }

  public updateSupplier(supplier_id: string, data: any) {
    const idx = (this.state.suppliers || []).findIndex((s: any) => s.supplier_id === supplier_id);
    if (idx === -1) throw new Error('Không tìm thấy nhà cung cấp!');
    this.state.suppliers[idx] = { ...this.state.suppliers[idx], ...data };
    this.save();
    return this.state.suppliers[idx];
  }

  public deleteSupplier(supplier_id: string) {
    this.state.suppliers = (this.state.suppliers || []).filter((s: any) => s.supplier_id !== supplier_id);
    this.save();
    return { success: true };
  }

  // 23. Organization Units Configuration
  public addUnit(data: any) {
    const unit = {
      ...data,
      unit_id: data.unit_id || `UNIT-${Date.now().toString().slice(-4)}`,
      status: data.status || 'ACTIVE',
    };
    if (!this.state.units) this.state.units = [];
    this.state.units.push(unit);
    this.save();
    return unit;
  }

  public updateUnit(unit_id: string, data: any) {
    const idx = (this.state.units || []).findIndex((u: any) => u.unit_id === unit_id);
    if (idx === -1) throw new Error('Không tìm thấy đơn vị!');
    this.state.units[idx] = { ...this.state.units[idx], ...data };
    this.save();
    return this.state.units[idx];
  }

  // 24. Departments Configuration (Relational to OrganizationUnits)
  public addDepartment(data: any) {
    if (!data.unit_id) {
      throw new Error('Phòng ban bắt buộc phải trực thuộc một Đơn vị (unit_id)!');
    }
    const unitExists = (this.state.units || []).some((u: any) => u.unit_id === data.unit_id);
    if (!unitExists) {
      throw new Error(`Đơn vị ${data.unit_id} không tồn tại trong hệ thống!`);
    }

    const dept = {
      ...data,
      department_id: data.department_id || `DEP-${Date.now().toString().slice(-4)}`,
      status: data.status || 'ACTIVE',
    };
    if (!this.state.departments) this.state.departments = [];
    this.state.departments.push(dept);
    this.save();
    return dept;
  }

  public updateDepartment(department_id: string, data: any) {
    const idx = (this.state.departments || []).findIndex((d: any) => d.department_id === department_id);
    if (idx === -1) throw new Error('Không tìm thấy phòng ban!');
    
    if (data.unit_id) {
      const unitExists = (this.state.units || []).some((u: any) => u.unit_id === data.unit_id);
      if (!unitExists) throw new Error(`Đơn vị ${data.unit_id} không tồn tại!`);
    }

    this.state.departments[idx] = { ...this.state.departments[idx], ...data };
    this.save();
    return this.state.departments[idx];
  }

  public deleteDepartment(department_id: string) {
    // Referential integrity check: cannot delete if employees exist in this department
    const hasEmployees = (this.state.employees || []).some((e: any) => e.department_id === department_id);
    if (hasEmployees) {
      throw new Error('Không thể xóa phòng ban này vì đang có nhân viên trực thuộc!');
    }
    this.state.departments = (this.state.departments || []).filter((d: any) => d.department_id !== department_id);
    this.save();
    return { success: true };
  }

  // 25. Warehouses Configuration
  public addWarehouse(data: any) {
    const wh = {
      ...data,
      warehouse_id: data.warehouse_id || `WH-${Date.now().toString().slice(-4)}`,
      status: data.status || 'ACTIVE',
    };
    if (!this.state.warehouses) this.state.warehouses = [];
    this.state.warehouses.push(wh);
    this.save();
    return wh;
  }

  public updateWarehouse(warehouse_id: string, data: any) {
    const idx = (this.state.warehouses || []).findIndex((w: any) => w.warehouse_id === warehouse_id);
    if (idx === -1) throw new Error('Không tìm thấy kho!');
    this.state.warehouses[idx] = { ...this.state.warehouses[idx], ...data };
    this.save();
    return this.state.warehouses[idx];
  }

  // 26. Employees & RBAC Configuration (Relational to Units & Departments)
  public addEmployee(data: any) {
    // Referential integrity check: unit must exist
    const unit = (this.state.units || []).find((u: any) => u.unit_id === data.unit_id);
    if (!unit) {
      throw new Error(`Đơn vị [${data.unit_id}] không tồn tại!`);
    }

    // Referential integrity check: department must exist and belong to unit
    if (data.department_id) {
      const dept = (this.state.departments || []).find((d: any) => d.department_id === data.department_id);
      if (!dept) {
        throw new Error(`Phòng ban [${data.department_id}] không tồn tại!`);
      }
      if (dept.unit_id !== data.unit_id) {
        throw new Error(`Phòng ban ${dept.name} (${dept.code}) không thuộc Đơn vị ${unit.name}! Vui lòng chọn đúng phòng ban trực thuộc.`);
      }
    }

    const emp = {
      ...data,
      employee_id: data.employee_id || `EMP-${Date.now().toString().slice(-3)}`,
      position: data.position || 'Chuyên viên Nghiệp vụ',
      role: data.role || 'CBNV',
      status: data.status || 'ACTIVE',
    };
    if (!this.state.employees) this.state.employees = [];
    this.state.employees.push(emp);
    this.save();
    return emp;
  }

  public updateEmployee(employee_id: string, data: any) {
    const idx = (this.state.employees || []).findIndex((e: any) => e.employee_id === employee_id);
    if (idx === -1) throw new Error('Không tìm thấy nhân viên!');

    const targetUnitId = data.unit_id || this.state.employees[idx].unit_id;
    const targetDeptId = data.department_id || this.state.employees[idx].department_id;

    if (targetUnitId && targetDeptId) {
      const dept = (this.state.departments || []).find((d: any) => d.department_id === targetDeptId);
      if (dept && dept.unit_id !== targetUnitId) {
        throw new Error('Phòng ban không thuộc Đơn vị đã chọn! Vui lòng chọn phòng ban trực thuộc đơn vị.');
      }
    }

    this.state.employees[idx] = { ...this.state.employees[idx], ...data };
    this.save();
    return this.state.employees[idx];
  }

  public updateUserRole(employee_id: string, role: string) {
    const emp = (this.state.employees || []).find((e: any) => e.employee_id === employee_id);
    if (!emp) throw new Error('Không tìm thấy nhân viên!');
    emp.role = role;
    this.save();
    return emp;
  }

  // 27. Sync Employees from HRM (Simulation)
  public syncEmployeesFromHRM() {
    const simulatedHrmStaff = [
      {
        employee_id: 'EMP-009',
        employee_code: 'TG-30012',
        full_name: 'Nguyễn Văn Quyết',
        unit_id: 'UNIT-03',
        department_id: 'DEP-10', // Bộ phận Kho vận & Hậu cần Campuchia
        position: 'Thủ kho Phụ trách KLH Campuchia',
        email: 'nguyenvanquyet@thacoagri.vn',
        phone: '0905 912 345',
        status: 'ACTIVE',
        role: 'THU_KHO',
      },
      {
        employee_id: 'EMP-010',
        employee_code: 'TG-20078',
        full_name: 'Đỗ Thị Thu Trang',
        unit_id: 'UNIT-02',
        department_id: 'DEP-08', // Kế toán Chi nhánh Gia Lai
        position: 'Kế toán viên Chi nhánh Gia Lai',
        email: 'dothithutrang@thacoagri.vn',
        phone: '0905 998 877',
        status: 'ACTIVE',
        role: 'CBNV',
      },
      {
        employee_id: 'EMP-011',
        employee_code: 'TG-10199',
        full_name: 'Lê Đình Bảo',
        unit_id: 'UNIT-01',
        department_id: 'DEP-01', // Phòng CNTT & Chuyển đổi số
        position: 'Kỹ sư Phần mềm & Hệ thống IoT',
        email: 'ledinhbao@thacoagri.vn',
        phone: '0905 776 655',
        status: 'ACTIVE',
        role: 'KY_THUAT',
      },
    ];

    let newCount = 0;
    simulatedHrmStaff.forEach((hrmStaff) => {
      const exists = (this.state.employees || []).some(
        (e: any) => e.employee_id === hrmStaff.employee_id || e.employee_code === hrmStaff.employee_code
      );
      if (!exists) {
        this.state.employees.push(hrmStaff);
        newCount++;
      }
    });

    this.save();
    return {
      success: true,
      totalEmployees: this.state.employees.length,
      newEmployeesAdded: newCount,
      timestamp: new Date().toISOString(),
      hrmGateway: 'THACO AGRI Enterprise HR Core API v2.4 (Port 8443 - SSL Active)',
    };
  }

  // --- 24. EXPENSE CATEGORIES & SERVICE EXPENSES CRUD ---

  public addExpenseCategory(data: any) {
    if (!this.state.expenseCategories) this.state.expenseCategories = [];
    const newId = `EPC-${Date.now().toString().slice(-4)}`;
    let generatedCode = data.code;
    if (!generatedCode && data.group_code) {
      const groupCount = this.state.expenseCategories.filter((c: any) => c.group_code === data.group_code).length + 1;
      generatedCode = `${data.group_code}-${String(groupCount).padStart(2, '0')}`;
    } else if (!generatedCode) {
      generatedCode = `CP-${Date.now().toString().slice(-4)}`;
    }

    const category = {
      expense_category_id: data.expense_category_id || newId,
      code: generatedCode,
      name: data.name,
      group_code: data.group_code || '',
      group_name: data.group_name || '',
      category_type: data.category_type || 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
      description: data.description || '',
      is_active: data.is_active !== undefined ? !!data.is_active : true,
      created_at: new Date().toISOString(),
    };
    this.state.expenseCategories.unshift(category);
    this.save();
    return category;
  }

  public updateExpenseCategory(id: string, data: any) {
    if (!this.state.expenseCategories) this.state.expenseCategories = [];
    const idx = this.state.expenseCategories.findIndex((c: any) => c.expense_category_id === id);
    if (idx === -1) throw new Error('Không tìm thấy danh mục chi phí dịch vụ!');
    this.state.expenseCategories[idx] = {
      ...this.state.expenseCategories[idx],
      ...data,
    };
    this.save();
    return this.state.expenseCategories[idx];
  }

  public deleteExpenseCategory(id: string) {
    if (!this.state.expenseCategories) this.state.expenseCategories = [];
    this.state.expenseCategories = this.state.expenseCategories.filter((c: any) => c.expense_category_id !== id);
    this.save();
    return { success: true };
  }

  public addServiceExpense(data: any) {
    if (!this.state.serviceExpenses) this.state.serviceExpenses = [];
    const count = this.state.serviceExpenses.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const code = data.expense_code || `DV-${yearMonth}-${String(count).padStart(3, '0')}`;
    const newExpense = {
      expense_id: data.expense_id || `EXP-${Date.now()}`,
      expense_code: code,
      occurred_at: data.occurred_at || new Date().toISOString(),
      expense_category_id: data.expense_category_id,
      expense_name: data.expense_name,
      group_code: data.group_code || '',
      group_name: data.group_name || '',
      category_type: data.category_type,
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
      amount: Number(data.amount) || 0,
      description: data.description || '',
      invoice_ref: data.invoice_ref || '',
      attachment_file: data.attachment_file || '',
      created_by: data.created_by || 'Người dùng',
      created_at: new Date().toISOString(),
    };
    this.state.serviceExpenses.unshift(newExpense);
    this.save();
    return newExpense;
  }

  public updateServiceExpense(id: string, data: any) {
    if (!this.state.serviceExpenses) this.state.serviceExpenses = [];
    const idx = this.state.serviceExpenses.findIndex((e: any) => e.expense_id === id);
    if (idx === -1) throw new Error('Không tìm thấy phiếu chi phí dịch vụ!');
    this.state.serviceExpenses[idx] = {
      ...this.state.serviceExpenses[idx],
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : this.state.serviceExpenses[idx].amount,
    };
    this.save();
    return this.state.serviceExpenses[idx];
  }

  public deleteServiceExpense(id: string) {
    if (!this.state.serviceExpenses) this.state.serviceExpenses = [];
    this.state.serviceExpenses = this.state.serviceExpenses.filter((e: any) => e.expense_id !== id);
    this.save();
    return { success: true };
  }
}

export const dbStore = new DatabaseStore();
