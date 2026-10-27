import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Download,
  Layers,
  TrendingUp,
  DollarSign,
  Building2,
  Warehouse,
  Package,
  Truck,
  Monitor,
  ReceiptText,
  Search,
  RotateCcw,
  Filter,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDateVN, exportTableToExcel } from '../../utils/excelExporter';
import { THACO_STANDARD_SUBGROUPS } from '../expenses/ServiceExpensesView';

type MainReportTab =
  | 'BY_CATEGORY_GROUP' // 1. Chi phí theo nhóm danh mục (a. Tiêu hao, b. Định danh, c. Dịch vụ)
  | 'BY_SUPPLIER'       // 2. Chi phí theo nhà cung cấp
  | 'BY_EQUIPMENT_NAME' // 3. Chi phí theo tên thiết bị
  | 'BY_UNIT';          // 4. Chi phí theo đơn vị

type CategorySubTab = 'ALL_OVERVIEW' | 'CONSUMABLE' | 'IDENTIFIED' | 'SERVICE';

type QuickPeriod = 'ALL' | 'THIS_MONTH' | 'LAST_3_MONTHS' | 'YEAR_2026' | 'YEAR_2025' | 'CUSTOM';

export const ReportsView: React.FC = () => {
  const {
    categories,
    assets,
    stockBalances,
    purchaseOrders,
    warehouses,
    units,
    departments,
    employees,
    transactions,
    suppliers = [],
    expenseCategories = [],
    serviceExpenses = [],
  } = useApp();

  // Active Report & Sub-tab
  const [activeReport, setActiveReport] = useState<MainReportTab>('BY_CATEGORY_GROUP');
  const [categorySubTab, setCategorySubTab] = useState<CategorySubTab>('SERVICE');

  // Global Time Filter (applies to ALL reports)
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');

  // Specific Filters for 1c. Dịch vụ
  const [serviceRootFilter, setServiceRootFilter] = useState<string>('ALL'); // ALL | 1. CHI PHÍ VẬN HÀNH & CÔNG TÁC | 2. CHI PHÍ GIAO TẾ & PHÚC LỢI
  const [serviceGroupFilter, setServiceGroupFilter] = useState<string>('ALL'); // ALL or group_code

  // Specific Filters for 1a / 1b / 2 / 3 / 4
  const [assetCategoryGroupFilter, setAssetCategoryGroupFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [supplierCostTypeFilter, setSupplierCostTypeFilter] = useState<'ALL' | 'DINH_DANH' | 'TIEU_HAO' | 'DICH_VU'>('ALL');
  const [equipmentTrackingFilter, setEquipmentTrackingFilter] = useState<'ALL' | 'DINH_DANH' | 'TIEU_HAO'>('ALL');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');

  // Handle Quick Period Presets
  const handleSelectQuickPeriod = (period: QuickPeriod) => {
    setQuickPeriod(period);
    const now = new Date();
    if (period === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else if (period === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setDateFrom(`${y}-${m}-01`);
      setDateTo(`${y}-${m}-31`);
    } else if (period === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const y1 = threeMonthsAgo.getFullYear();
      const m1 = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
      const y2 = now.getFullYear();
      const m2 = String(now.getMonth() + 1).padStart(2, '0');
      setDateFrom(`${y1}-${m1}-01`);
      setDateTo(`${y2}-${m2}-31`);
    } else if (period === 'YEAR_2026') {
      setDateFrom('2026-01-01');
      setDateTo('2026-12-31');
    } else if (period === 'YEAR_2025') {
      setDateFrom('2025-01-01');
      setDateTo('2025-12-31');
    }
  };

  // Universal Date Range Matcher
  const isWithinDateRange = (isoDateStr?: string): boolean => {
    if (!dateFrom && !dateTo) return true;
    if (!isoDateStr) return false;
    const d = isoDateStr.slice(0, 10); // YYYY-MM-DD
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  // Filtered base datasets by Time Range & Warehouse
  const timeFilteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchWh =
        selectedWarehouseFilter === 'ALL' || a.warehouse_id === selectedWarehouseFilter;
      const matchTime = isWithinDateRange(a.created_at);
      return matchWh && matchTime;
    });
  }, [assets, selectedWarehouseFilter, dateFrom, dateTo]);

  const timeFilteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchWh =
        selectedWarehouseFilter === 'ALL' || t.warehouse_id === selectedWarehouseFilter;
      const matchTime = isWithinDateRange(t.occurred_at);
      return matchWh && matchTime;
    });
  }, [transactions, selectedWarehouseFilter, dateFrom, dateTo]);

  const timeFilteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchWh =
        selectedWarehouseFilter === 'ALL' || po.receiving_warehouse_id === selectedWarehouseFilter;
      const matchTime = isWithinDateRange(po.created_at);
      return matchWh && matchTime;
    });
  }, [purchaseOrders, selectedWarehouseFilter, dateFrom, dateTo]);

  const timeFilteredServiceExpenses = useMemo(() => {
    return serviceExpenses.filter((exp) => isWithinDateRange(exp.occurred_at));
  }, [serviceExpenses, dateFrom, dateTo]);

  // ============================================================================
  // 1A. DỮ LIỆU BÁO CÁO CHI PHÍ TÀI SẢN TIÊU HAO (THEO NHÓM DANH MỤC)
  // ============================================================================
  const consumableReportData = useMemo(() => {
    const consumableCats = categories.filter(
      (c) =>
        c.tracking_type === 'TIEU_HAO' &&
        (assetCategoryGroupFilter === 'ALL' || c.group === assetCategoryGroupFilter)
    );

    const rows = consumableCats.map((cat, idx) => {
      // Transactions in selected time range
      const catTrx = timeFilteredTransactions.filter((t) => t.category_id === cat.category_id);
      const qtyImportedTrx = catTrx
        .filter((t) => t.type === 'NHAP_KHO')
        .reduce((s, t) => s + t.quantity, 0);
      const costImportedTrx = catTrx
        .filter((t) => t.type === 'NHAP_KHO')
        .reduce((s, t) => s + t.total_amount, 0);

      const qtyIssuedTrx = catTrx
        .filter((t) => t.type === 'XUAT_CAP_PHAT')
        .reduce((s, t) => s + t.quantity, 0);
      const costIssuedTrx = catTrx
        .filter((t) => t.type === 'XUAT_CAP_PHAT')
        .reduce((s, t) => s + t.total_amount, 0);

      // PO lines in selected time range
      let poQty = 0;
      let poCost = 0;
      timeFilteredPOs.forEach((po) => {
        po.lines
          .filter((l) => l.category_id === cat.category_id)
          .forEach((l) => {
            poQty += l.qty_ordered;
            poCost += l.amount;
          });
      });

      // Current stock balance
      const stocks = stockBalances.filter(
        (s) =>
          s.category_id === cat.category_id &&
          (selectedWarehouseFilter === 'ALL' || s.warehouse_id === selectedWarehouseFilter)
      );
      const currentOnHand = stocks.reduce((s, b) => s + b.quantity_on_hand, 0);
      const avgUnitCost = stocks[0]?.average_unit_cost || cat.estimated_unit_price || 0;

      // Effective numbers for period
      const effectiveImportedQty = Math.max(qtyImportedTrx, poQty);
      const effectiveImportedCost = Math.max(costImportedTrx, poCost);
      const effectiveIssuedQty =
        qtyIssuedTrx > 0
          ? qtyIssuedTrx
          : !dateFrom && !dateTo
          ? stocks.reduce((s, b) => s + b.issued_this_month, 0)
          : 0;
      const effectiveIssuedCost =
        costIssuedTrx > 0 ? costIssuedTrx : effectiveIssuedQty * avgUnitCost;

      return {
        stt: idx + 1,
        category_id: cat.category_id,
        code: cat.code,
        name: cat.name,
        group: cat.group,
        uom: cat.unit_of_measure,
        unit_cost: avgUnitCost,
        imported_qty: effectiveImportedQty,
        imported_cost: effectiveImportedCost,
        issued_qty: effectiveIssuedQty,
        issued_cost: effectiveIssuedCost,
        on_hand_qty: currentOnHand,
        on_hand_value: currentOnHand * avgUnitCost,
        total_expense: effectiveIssuedCost + effectiveImportedCost,
      };
    });

    const totalImportedCost = rows.reduce((s, r) => s + r.imported_cost, 0);
    const totalIssuedCost = rows.reduce((s, r) => s + r.issued_cost, 0);
    const totalOnHandValue = rows.reduce((s, r) => s + r.on_hand_value, 0);

    return {
      rows,
      totalImportedCost,
      totalIssuedCost,
      totalOnHandValue,
    };
  }, [
    categories,
    assetCategoryGroupFilter,
    timeFilteredTransactions,
    timeFilteredPOs,
    stockBalances,
    selectedWarehouseFilter,
    dateFrom,
    dateTo,
  ]);

  // ============================================================================
  // 1B. DỮ LIỆU BÁO CÁO CHI PHÍ TÀI SẢN ĐỊNH DANH (THEO NHÓM DANH MỤC)
  // ============================================================================
  const identifiedReportData = useMemo(() => {
    const identifiedCats = categories.filter(
      (c) =>
        c.tracking_type === 'DINH_DANH' &&
        (assetCategoryGroupFilter === 'ALL' || c.group === assetCategoryGroupFilter)
    );

    const rows = identifiedCats.map((cat, idx) => {
      const catAssets = timeFilteredAssets.filter((a) => a.category_id === cat.category_id);
      const totalQty = catAssets.length;
      const inUseQty = catAssets.filter((a) => a.status === 'DANG_SU_DUNG').length;
      const inStockQty = catAssets.filter((a) => a.status === 'TRONG_KHO').length;
      const repairingQty = catAssets.filter((a) => a.status === 'DANG_SUA_CHUA').length;
      const totalPurchaseCost = catAssets.reduce((s, a) => s + (a.purchase_cost || 0), 0);

      return {
        stt: idx + 1,
        category_id: cat.category_id,
        code: cat.code,
        name: cat.name,
        group: cat.group,
        uom: cat.unit_of_measure,
        total_qty: totalQty,
        in_use_qty: inUseQty,
        in_stock_qty: inStockQty,
        repairing_qty: repairingQty,
        total_cost: totalPurchaseCost,
      };
    });

    // Group Summary by Category.group
    const groupMap = new Map<
      string,
      { group_name: string; item_count: number; asset_qty: number; total_cost: number }
    >();
    rows.forEach((r) => {
      const cur = groupMap.get(r.group) || {
        group_name: r.group,
        item_count: 0,
        asset_qty: 0,
        total_cost: 0,
      };
      cur.item_count += 1;
      cur.asset_qty += r.total_qty;
      cur.total_cost += r.total_cost;
      groupMap.set(r.group, cur);
    });

    const totalCost = rows.reduce((s, r) => s + r.total_cost, 0);
    const totalAssetsCount = rows.reduce((s, r) => s + r.total_qty, 0);

    return {
      rows,
      groupSummary: Array.from(groupMap.values()).sort((a, b) => b.total_cost - a.total_cost),
      totalCost,
      totalAssetsCount,
    };
  }, [categories, assetCategoryGroupFilter, timeFilteredAssets]);

  // ============================================================================
  // 1C. DỮ LIỆU BÁO CÁO CHI PHÍ DỊCH VỤ (LỌC THEO KHỐI CHI PHÍ & NHÓM CHI PHÍ)
  // ============================================================================
  const serviceReportData = useMemo(() => {
    // Filter service expenses by Root Block (1. CPVH / 2. CPPL) and Group Code
    const filtered = timeFilteredServiceExpenses.filter((exp) => {
      const isCPPL =
        (exp.group_code && exp.group_code.startsWith('CPPL')) ||
        exp.category_type.startsWith('2.');
      const expRoot = isCPPL
        ? '2. CHI PHÍ GIAO TẾ & PHÚC LỢI'
        : '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC';

      const matchRoot = serviceRootFilter === 'ALL' || expRoot === serviceRootFilter;
      const matchGroup =
        serviceGroupFilter === 'ALL' ||
        exp.group_code === serviceGroupFilter ||
        (exp.group_code && exp.group_code.startsWith(serviceGroupFilter));

      return matchRoot && matchGroup;
    });

    // Aggregate by 11 Standard Sub-groups
    const groupRows = THACO_STANDARD_SUBGROUPS.filter((g) => {
      const matchRoot = serviceRootFilter === 'ALL' || g.root_type === serviceRootFilter;
      const matchGrp =
        serviceGroupFilter === 'ALL' ||
        g.group_code === serviceGroupFilter ||
        g.parent_code === serviceGroupFilter;
      return matchRoot && matchGrp;
    }).map((std, idx) => {
      const exps = filtered.filter((e) => e.group_code === std.group_code);
      const totalAmount = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const configuredItemsCount = expenseCategories.filter(
        (c) => c.group_code === std.group_code
      ).length;

      return {
        stt: idx + 1,
        group_code: std.group_code,
        sub_title: std.sub_title,
        group_name: std.group_name,
        parent_name: std.parent_name,
        root_code: std.root_code,
        root_type: std.root_type,
        configured_items: configuredItemsCount,
        voucher_count: exps.length,
        total_amount: totalAmount,
      };
    });

    const totalServiceCost = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalCPVH = filtered
      .filter((e) => e.group_code?.startsWith('CPVH') || e.category_type.startsWith('1.'))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalCPPL = filtered
      .filter((e) => e.group_code?.startsWith('CPPL') || e.category_type.startsWith('2.'))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return {
      filteredExpenses: filtered,
      groupRows,
      totalServiceCost,
      totalCPVH,
      totalCPPL,
    };
  }, [timeFilteredServiceExpenses, serviceRootFilter, serviceGroupFilter, expenseCategories]);

  // ============================================================================
  // 2. DỮ LIỆU BÁO CÁO CHI PHÍ THEO NHÀ CUNG CẤP
  // ============================================================================
  const supplierReportData = useMemo(() => {
    const map = new Map<
      string,
      {
        supplier_id: string;
        code: string;
        name: string;
        tax_code: string;
        phone: string;
        po_count: number;
        service_voucher_count: number;
        identified_cost: number;
        consumable_cost: number;
        service_cost: number;
        total_cost: number;
      }
    >();

    // Seed with registered suppliers
    suppliers.forEach((sup) => {
      map.set(sup.name.trim().toLowerCase(), {
        supplier_id: sup.supplier_id,
        code: sup.code,
        name: sup.name,
        tax_code: sup.tax_code || '---',
        phone: sup.phone || '---',
        po_count: 0,
        service_voucher_count: 0,
        identified_cost: 0,
        consumable_cost: 0,
        service_cost: 0,
        total_cost: 0,
      });
    });

    // Add PO costs in time range
    timeFilteredPOs.forEach((po) => {
      const supName = (po.supplier_name || 'Nhà cung cấp vãng lai').trim();
      const key = supName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          supplier_id: `SUP-EXT-${map.size + 1}`,
          code: `NCC-${map.size + 1}`,
          name: supName,
          tax_code: '---',
          phone: '---',
          po_count: 0,
          service_voucher_count: 0,
          identified_cost: 0,
          consumable_cost: 0,
          service_cost: 0,
          nested_lines: 0,
          total_cost: 0,
        } as any);
      }
      const entry = map.get(key)!;
      entry.po_count += 1;

      po.lines.forEach((line) => {
        if (line.tracking_type === 'DINH_DANH') {
          entry.identified_cost += line.amount || 0;
        } else {
          entry.consumable_cost += line.amount || 0;
        }
      });
    });

    // Add Service Expenses in time range
    timeFilteredServiceExpenses.forEach((exp) => {
      const supName = (exp.supplier_name || 'Đối tác dịch vụ ngoài').trim();
      const key = supName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          supplier_id: exp.supplier_id || `SUP-DV-${map.size + 1}`,
          code: `NCC-DV-${map.size + 1}`,
          name: supName,
          tax_code: '---',
          phone: '---',
          po_count: 0,
          service_voucher_count: 0,
          identified_cost: 0,
          consumable_cost: 0,
          service_cost: 0,
          total_cost: 0,
        });
      }
      const entry = map.get(key)!;
      entry.service_voucher_count += 1;
      entry.service_cost += Number(exp.amount) || 0;
    });

    // Compute total cost according to filter
    let list = Array.from(map.values()).map((item) => {
      const idCost =
        supplierCostTypeFilter === 'ALL' || supplierCostTypeFilter === 'DINH_DANH'
          ? item.identified_cost
          : 0;
      const conCost =
        supplierCostTypeFilter === 'ALL' || supplierCostTypeFilter === 'TIEU_HAO'
          ? item.consumable_cost
          : 0;
      const srvCost =
        supplierCostTypeFilter === 'ALL' || supplierCostTypeFilter === 'DICH_VU'
          ? item.service_cost
          : 0;
      return {
        ...item,
        filtered_total: idCost + conCost + srvCost,
        total_cost: item.identified_cost + item.consumable_cost + item.service_cost,
      };
    });

    if (supplierFilter !== 'ALL') {
      list = list.filter((s) => s.supplier_id === supplierFilter || s.name === supplierFilter);
    }

    list.sort((a, b) => b.filtered_total - a.filtered_total);

    const grandTotal = list.reduce((s, i) => s + i.filtered_total, 0);
    const totalIdentified = list.reduce((s, i) => s + i.identified_cost, 0);
    const totalConsumable = list.reduce((s, i) => s + i.consumable_cost, 0);
    const totalService = list.reduce((s, i) => s + i.service_cost, 0);

    return {
      rows: list,
      grandTotal,
      totalIdentified,
      totalConsumable,
      totalService,
    };
  }, [suppliers, timeFilteredPOs, timeFilteredServiceExpenses, supplierFilter, supplierCostTypeFilter]);

  // ============================================================================
  // 3. DỮ LIỆU BÁO CÁO CHI PHÍ THEO TÊN THIẾT BỊ / VẬT TƯ
  // ============================================================================
  const equipmentReportData = useMemo(() => {
    const filteredCats = categories.filter((c) => {
      const matchTrack =
        equipmentTrackingFilter === 'ALL' || c.tracking_type === equipmentTrackingFilter;
      const q = equipmentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q);
      return matchTrack && matchSearch;
    });

    const rows = filteredCats.map((cat, idx) => {
      if (cat.tracking_type === 'DINH_DANH') {
        const catAssets = timeFilteredAssets.filter((a) => a.category_id === cat.category_id);
        const qtyTotal = catAssets.length;
        const qtyInUse = catAssets.filter((a) => a.status === 'DANG_SU_DUNG').length;
        const qtyInStock = catAssets.filter((a) => a.status === 'TRONG_KHO').length;
        const purchaseValue = catAssets.reduce((s, a) => s + (a.purchase_cost || 0), 0);
        const avgPrice = qtyTotal > 0 ? Math.round(purchaseValue / qtyTotal) : cat.estimated_unit_price || 0;

        return {
          stt: idx + 1,
          category_id: cat.category_id,
          code: cat.code,
          name: cat.name,
          group: cat.group,
          tracking_type: 'Tài sản định danh',
          uom: cat.unit_of_measure,
          qty_total: qtyTotal,
          qty_active_or_issued: qtyInUse,
          qty_in_stock: qtyInStock,
          unit_price: avgPrice,
          total_cost: purchaseValue,
        };
      } else {
        // TIEU_HAO
        const catTrx = timeFilteredTransactions.filter((t) => t.category_id === cat.category_id);
        const stocks = stockBalances.filter(
          (s) =>
            s.category_id === cat.category_id &&
            (selectedWarehouseFilter === 'ALL' || s.warehouse_id === selectedWarehouseFilter)
        );
        const onHand = stocks.reduce((s, b) => s + b.quantity_on_hand, 0);
        const avgPrice = stocks[0]?.average_unit_cost || cat.estimated_unit_price || 0;

        let poQty = 0;
        let poCost = 0;
        timeFilteredPOs.forEach((po) => {
          po.lines
            .filter((l) => l.category_id === cat.category_id)
            .forEach((l) => {
              poQty += l.qty_ordered;
              poCost += l.amount;
            });
        });

        const trxImportedQty = catTrx
          .filter((t) => t.type === 'NHAP_KHO')
          .reduce((s, t) => s + t.quantity, 0);
        const trxImportedCost = catTrx
          .filter((t) => t.type === 'NHAP_KHO')
          .reduce((s, t) => s + t.total_amount, 0);
        const trxIssuedQty = catTrx
          .filter((t) => t.type === 'XUAT_CAP_PHAT')
          .reduce((s, t) => s + t.quantity, 0);
        const trxIssuedCost = catTrx
          .filter((t) => t.type === 'XUAT_CAP_PHAT')
          .reduce((s, t) => s + t.total_amount, 0);

        const totalCost = Math.max(poCost, trxImportedCost) || trxIssuedCost || onHand * avgPrice;

        return {
          stt: idx + 1,
          category_id: cat.category_id,
          code: cat.code,
          name: cat.name,
          group: cat.group,
          tracking_type: 'Vật tư tiêu hao',
          uom: cat.unit_of_measure,
          qty_total: Math.max(poQty, trxImportedQty) + onHand,
          qty_active_or_issued: trxIssuedQty,
          qty_in_stock: onHand,
          unit_price: avgPrice,
          total_cost: totalCost,
        };
      }
    });

    rows.sort((a, b) => b.total_cost - a.total_cost);
    const grandTotal = rows.reduce((s, r) => s + r.total_cost, 0);

    return {
      rows,
      grandTotal,
    };
  }, [
    categories,
    equipmentTrackingFilter,
    equipmentSearch,
    timeFilteredAssets,
    timeFilteredTransactions,
    timeFilteredPOs,
    stockBalances,
    selectedWarehouseFilter,
  ]);

  // ============================================================================
  // 4. DỮ LIỆU BÁO CÁO CHI PHÍ THEO ĐƠN VỊ
  // ============================================================================
  const unitReportData = useMemo(() => {
    const filteredUnits = units.filter((u) => unitFilter === 'ALL' || u.unit_id === unitFilter);

    const rows = filteredUnits.map((u, idx) => {
      const unitEmps = employees.filter((e) => e.unit_id === u.unit_id);
      const unitDepts = departments.filter((d) => d.unit_id === u.unit_id);
      const unitWhIds = warehouses
        .filter((w) => w.owning_unit_id === u.unit_id)
        .map((w) => w.warehouse_id);

      // (a) Chi phí tài sản định danh thuộc đơn vị sở hữu hoặc CBNV đơn vị đang giữ
      const unitAssets = timeFilteredAssets.filter(
        (a) =>
          a.owning_unit_id === u.unit_id ||
          a.holder_unit_snapshot === u.unit_id ||
          unitEmps.some((e) => e.employee_id === a.holder_employee_id)
      );
      const identifiedAssetCost = unitAssets.reduce((s, a) => s + (a.purchase_cost || 0), 0);

      // (b) Chi phí vật tư tiêu hao xuất cấp cho đơn vị hoặc nhập vào kho của đơn vị
      const unitTrx = timeFilteredTransactions.filter(
        (t) =>
          t.recipient_unit_id === u.unit_id ||
          unitWhIds.includes(t.warehouse_id) ||
          unitEmps.some((e) => e.employee_id === t.recipient_employee_id)
      );
      const consumableIssuedCost = unitTrx
        .filter((t) => t.type === 'XUAT_CAP_PHAT')
        .reduce((s, t) => s + t.total_amount, 0);

      const unitStockValue = stockBalances
        .filter((s) => unitWhIds.includes(s.warehouse_id))
        .reduce((sum, s) => sum + s.quantity_on_hand * s.average_unit_cost, 0);

      const effectiveConsumableCost =
        consumableIssuedCost > 0 ? consumableIssuedCost : Math.round(unitStockValue * 0.25);

      // (c) Chi phí dịch vụ do nhân sự thuộc đơn vị lập / thụ hưởng
      const unitServiceExps = timeFilteredServiceExpenses.filter((exp) =>
        unitEmps.some((e) => exp.created_by.toLowerCase().includes(e.full_name.toLowerCase()))
      );
      const serviceCost = unitServiceExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);

      const totalUnitCost = identifiedAssetCost + effectiveConsumableCost + serviceCost;

      return {
        stt: idx + 1,
        unit_id: u.unit_id,
        code: u.code,
        name: u.name,
        short_name: u.short_name,
        address: u.address,
        dept_count: unitDepts.length,
        emp_count: unitEmps.length,
        asset_count: unitAssets.length,
        identified_cost: identifiedAssetCost,
        consumable_cost: effectiveConsumableCost,
        service_cost: serviceCost,
        total_cost: totalUnitCost,
      };
    });

    rows.sort((a, b) => b.total_cost - a.total_cost);
    const grandTotal = rows.reduce((s, r) => s + r.total_cost, 0);

    return {
      rows,
      grandTotal,
    };
  }, [
    units,
    unitFilter,
    employees,
    departments,
    warehouses,
    timeFilteredAssets,
    timeFilteredTransactions,
    timeFilteredServiceExpenses,
    stockBalances,
  ]);

  // ============================================================================
  // EXPORT CURRENT VIEW TO EXCEL (.XLSX)
  // ============================================================================
  const handleExportExcel = () => {
    const periodSuffix =
      dateFrom || dateTo ? `_${dateFrom || 'Dau'}_den_${dateTo || 'Nay'}` : '_ToanThoiGian';

    if (activeReport === 'BY_CATEGORY_GROUP') {
      if (categorySubTab === 'CONSUMABLE') {
        exportTableToExcel(
          consumableReportData.rows.map((r) => ({
            STT: r.stt,
            'Mã vật tư': r.code,
            'Tên vật tư tiêu hao': r.name,
            'Nhóm danh mục': r.group,
            ĐVT: r.uom,
            'Đơn giá BQ (VND)': r.unit_cost,
            'SL Nhập trong kỳ': r.imported_qty,
            'Chi phí Mua/Nhập (VND)': r.imported_cost,
            'SL Xuất cấp phát': r.issued_qty,
            'Chi phí Xuất dùng (VND)': r.issued_cost,
            'SL Tồn hiện tại': r.on_hand_qty,
            'Giá trị Tồn kho (VND)': r.on_hand_value,
          })),
          `BaoCao_1a_ChiPhi_TaiSanTieuHao${periodSuffix}`
        );
      } else if (categorySubTab === 'IDENTIFIED') {
        exportTableToExcel(
          identifiedReportData.rows.map((r) => ({
            STT: r.stt,
            'Mã danh mục': r.code,
            'Tên danh mục thiết bị': r.name,
            'Nhóm danh mục': r.group,
            ĐVT: r.uom,
            'Tổng SL tài sản': r.total_qty,
            'Đang sử dụng': r.in_use_qty,
            'Trong kho': r.in_stock_qty,
            'Đang sửa chữa': r.repairing_qty,
            'Tổng nguyên giá (VND)': r.total_cost,
          })),
          `BaoCao_1b_ChiPhi_TaiSanDinhDanh${periodSuffix}`
        );
      } else {
        exportTableToExcel(
          serviceReportData.groupRows.map((r) => ({
            STT: r.stt,
            'Khối chi phí gốc': r.root_type,
            'Nhóm cha': r.parent_name,
            'Mã nhóm chi phí': r.group_code,
            'Tên phân nhóm chi phí': r.sub_title,
            'Số mục cấu hình': r.configured_items,
            'Số phiếu phát sinh': r.voucher_count,
            'Tổng chi phí (VND)': r.total_amount,
          })),
          `BaoCao_1c_ChiPhi_DichVu_TheoNhom${periodSuffix}`
        );
      }
    } else if (activeReport === 'BY_SUPPLIER') {
      exportTableToExcel(
        supplierReportData.rows.map((r, i) => ({
          STT: i + 1,
          'Mã NCC': r.code,
          'Tên Nhà Cung Cấp': r.name,
          'Mã số thuế': r.tax_code,
          'Số đơn PO': r.po_count,
          'Số phiếu DV': r.service_voucher_count,
          'Chi phí TS Định danh (VND)': r.identified_cost,
          'Chi phí VT Tiêu hao (VND)': r.consumable_cost,
          'Chi phí Dịch vụ (VND)': r.service_cost,
          'Tổng Chi Phí (VND)': r.filtered_total,
        })),
        `BaoCao_2_ChiPhi_TheoNhaCungCap${periodSuffix}`
      );
    } else if (activeReport === 'BY_EQUIPMENT_NAME') {
      exportTableToExcel(
        equipmentReportData.rows.map((r, i) => ({
          STT: i + 1,
          'Mã thiết bị/vật tư': r.code,
          'Tên thiết bị / Vật tư': r.name,
          'Nhóm danh mục': r.group,
          'Loại quản lý': r.tracking_type,
          ĐVT: r.uom,
          'Tổng SL': r.qty_total,
          'Đang sử dụng / Đã cấp': r.qty_active_or_issued,
          'Tồn trong kho': r.qty_in_stock,
          'Đơn giá BQ (VND)': r.unit_price,
          'Tổng chi phí / Nguyên giá (VND)': r.total_cost,
        })),
        `BaoCao_3_ChiPhi_TheoTenThietBi${periodSuffix}`
      );
    } else if (activeReport === 'BY_UNIT') {
      exportTableToExcel(
        unitReportData.rows.map((r, i) => ({
          STT: i + 1,
          'Mã Đơn vị': r.code,
          'Tên Đơn vị': r.name,
          'Số Phòng ban': r.dept_count,
          'Số Nhân sự': r.emp_count,
          'Số Tài sản định danh': r.asset_count,
          'Chi phí VT Tiêu hao (VND)': r.consumable_cost,
          'Giá trị TS Định danh (VND)': r.identified_cost,
          'Chi phí Dịch vụ (VND)': r.service_cost,
          'Tổng Chi Phí Đơn Vị (VND)': r.total_cost,
        })),
        `BaoCao_4_ChiPhi_TheoDonVi${periodSuffix}`
      );
    }
  };

  // Distinct Category Groups for filter
  const categoryGroupsList = useMemo(() => {
    return Array.from(new Set(categories.map((c) => c.group)));
  }, [categories]);

  const grandTotalAll3 =
    consumableReportData.totalIssuedCost +
    consumableReportData.totalImportedCost +
    identifiedReportData.totalCost +
    serviceReportData.totalServiceCost;

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* HEADER & GLOBAL TIME FILTER BAR (APPLIES TO ALL 4 REPORTS)            */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Hệ Thống Báo Cáo Quản Trị Chi Phí THACO AGRI
              </span>
              {(dateFrom || dateTo) && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Đang lọc: {dateFrom || 'Đầu kỳ'} ➔ {dateTo || 'Hiện tại'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Báo Cáo Tổng Hợp & Phân Tích Chi Phí Đa Chiều (Lọc Theo Thời Gian)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              1. Theo Nhóm danh mục (a. Tiêu hao • b. Định danh • c. Dịch vụ) • 2. Theo Nhà cung cấp • 3. Theo Tên thiết bị • 4. Theo Đơn vị
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Warehouse Scope */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <Warehouse className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả kho THACO AGRI</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Xuất Báo Cáo Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Universal Time Filter Bar */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Kỳ báo cáo:
            </span>
            {[
              { id: 'ALL' as QuickPeriod, label: 'Toàn thời gian' },
              { id: 'THIS_MONTH' as QuickPeriod, label: 'Tháng này' },
              { id: 'LAST_3_MONTHS' as QuickPeriod, label: '3 tháng gần nhất' },
              { id: 'YEAR_2026' as QuickPeriod, label: 'Năm 2026' },
              { id: 'YEAR_2025' as QuickPeriod, label: 'Năm 2025' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectQuickPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  quickPeriod === p.id
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-600">Từ ngày:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setQuickPeriod('CUSTOM');
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-600">Đến ngày:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setQuickPeriod('CUSTOM');
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => handleSelectQuickPeriod('ALL')}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                title="Xóa bộ lọc ngày"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* 4 MAIN REPORT TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {[
            {
              id: 'BY_CATEGORY_GROUP' as MainReportTab,
              title: '1. Chi Phí Theo Nhóm Danh Mục',
              sub: 'a. Tiêu hao • b. Định danh • c. Dịch vụ',
              icon: Layers,
            },
            {
              id: 'BY_SUPPLIER' as MainReportTab,
              title: '2. Chi Phí Theo Nhà Cung Cấp',
              sub: `${supplierReportData.rows.length} NCC • PO & Dịch vụ`,
              icon: Truck,
            },
            {
              id: 'BY_EQUIPMENT_NAME' as MainReportTab,
              title: '3. Chi Phí Theo Tên Thiết Bị',
              sub: `${equipmentReportData.rows.length} danh mục thiết bị/vật tư`,
              icon: Monitor,
            },
            {
              id: 'BY_UNIT' as MainReportTab,
              title: '4. Chi Phí Theo Đơn Vị',
              sub: `${unitReportData.rows.length} đơn vị pháp nhân THACO AGRI`,
              icon: Building2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveReport(tab.id)}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive ? 'bg-emerald-700 text-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{tab.title}</div>
                  <div
                    className={`text-[11px] mt-0.5 truncate ${
                      isActive ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {tab.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BÁO CÁO 1: CHI PHÍ THEO NHÓM DANH MỤC (a. Tiêu hao, b. Định danh, c. Dịch vụ) */}
      {/* ===================================================================== */}
      {activeReport === 'BY_CATEGORY_GROUP' && (
        <div className="space-y-4">
          {/* Sub-navigation for 1a, 1b, 1c, Overview */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategorySubTab('ALL_OVERVIEW')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition border ${
                  categorySubTab === 'ALL_OVERVIEW'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <PieChart className="w-4 h-4" />
                Tổng hợp cả 3 nhóm (a + b + c)
              </button>

              <button
                type="button"
                onClick={() => setCategorySubTab('CONSUMABLE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition border ${
                  categorySubTab === 'CONSUMABLE'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Package className="w-4 h-4" />
                1a. Tài Sản Tiêu Hao ({formatVND(consumableReportData.totalImportedCost + consumableReportData.totalIssuedCost)})
              </button>

              <button
                type="button"
                onClick={() => setCategorySubTab('IDENTIFIED')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition border ${
                  categorySubTab === 'IDENTIFIED'
                    ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                    : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Monitor className="w-4 h-4" />
                1b. Tài Sản Định Danh ({formatVND(identifiedReportData.totalCost)})
              </button>

              <button
                type="button"
                onClick={() => setCategorySubTab('SERVICE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition border ${
                  categorySubTab === 'SERVICE'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                1c. Chi Phí Dịch Vụ ({formatVND(serviceReportData.totalServiceCost)})
              </button>
            </div>
          </div>

          {/* 1. OVERVIEW OF ALL 3 CATEGORY GROUPS */}
          {categorySubTab === 'ALL_OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setCategorySubTab('CONSUMABLE')}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                    1a. Tài Sản Tiêu Hao
                  </span>
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black font-mono text-amber-800 tabular-nums">
                  {formatVND(consumableReportData.totalImportedCost + consumableReportData.totalIssuedCost)}
                </div>
                <p className="text-xs text-slate-600">
                  Mua nhập kỳ: <strong>{formatVND(consumableReportData.totalImportedCost)}</strong> • Xuất dùng: <strong>{formatVND(consumableReportData.totalIssuedCost)}</strong>
                </p>
                <div className="text-[11px] font-bold text-amber-700 pt-1">
                  Bấm để xem chi tiết nhóm tiêu hao →
                </div>
              </div>

              <div
                onClick={() => setCategorySubTab('IDENTIFIED')}
                className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs">
                    1b. Tài Sản Định Danh
                  </span>
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-black font-mono text-blue-900 tabular-nums">
                  {formatVND(identifiedReportData.totalCost)}
                </div>
                <p className="text-xs text-slate-600">
                  Tổng số: <strong>{identifiedReportData.totalAssetsCount} thiết bị định danh</strong> thuộc {identifiedReportData.groupSummary.length} nhóm danh mục
                </p>
                <div className="text-[11px] font-bold text-blue-700 pt-1">
                  Bấm để xem chi tiết nhóm định danh →
                </div>
              </div>

              <div
                onClick={() => setCategorySubTab('SERVICE')}
                className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">
                    1c. Chi Phí Dịch Vụ (CPVH & CPPL)
                  </span>
                  <ReceiptText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black font-mono text-emerald-800 tabular-nums">
                  {formatVND(serviceReportData.totalServiceCost)}
                </div>
                <p className="text-xs text-slate-600">
                  1. Vận hành (CPVH): <strong>{formatVND(serviceReportData.totalCPVH)}</strong> • 2. Phúc lợi (CPPL): <strong>{formatVND(serviceReportData.totalCPPL)}</strong>
                </p>
                <div className="text-[11px] font-bold text-emerald-700 pt-1">
                  Bấm để lọc theo Khối chi phí & Nhóm chi phí →
                </div>
              </div>
            </div>
          )}

          {/* 1A. CHI PHÍ TÀI SẢN TIÊU HAO */}
          {categorySubTab === 'CONSUMABLE' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Lọc Nhóm Danh Mục Vật Tư:</span>
                  <select
                    value={assetCategoryGroupFilter}
                    onChange={(e) => setAssetCategoryGroupFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">Tất cả nhóm danh mục</option>
                    {categoryGroupsList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span>
                    Tổng mua nhập kỳ: <strong className="text-blue-800 font-mono">{formatVND(consumableReportData.totalImportedCost)}</strong>
                  </span>
                  <span>
                    Tổng xuất cấp phát: <strong className="text-amber-800 font-mono">{formatVND(consumableReportData.totalIssuedCost)}</strong>
                  </span>
                  <span>
                    Giá trị tồn kho: <strong className="text-emerald-800 font-mono">{formatVND(consumableReportData.totalOnHandValue)}</strong>
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                        <th className="py-3 px-3 text-center w-12">STT</th>
                        <th className="py-3 px-4">Nhóm Danh Mục</th>
                        <th className="py-3 px-4">Mã & Tên Vật Tư Tiêu Hao</th>
                        <th className="py-3 px-3 text-center">ĐVT</th>
                        <th className="py-3 px-4 text-right">Đơn Giá BQ</th>
                        <th className="py-3 px-4 text-right text-blue-800">SL Nhập</th>
                        <th className="py-3 px-4 text-right text-blue-800">Chi Phí Mua/Nhập</th>
                        <th className="py-3 px-4 text-right text-amber-800">SL Xuất</th>
                        <th className="py-3 px-4 text-right text-amber-800">Chi Phí Xuất Dùng</th>
                        <th className="py-3 px-4 text-right text-emerald-900 bg-emerald-50">Giá Trị Tồn Kho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {consumableReportData.rows.map((r) => (
                        <tr key={r.category_id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-center text-slate-400">{r.stt}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{r.group}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{r.code}</span>
                            <span className="font-medium text-slate-800">{r.name}</span>
                          </td>
                          <td className="py-3 px-3 text-center">{r.uom}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatVND(r.unit_cost)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{r.imported_qty}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">{formatVND(r.imported_cost)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">{r.issued_qty}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">{formatVND(r.issued_cost)}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-900 bg-emerald-50/50">
                            {formatVND(r.on_hand_value)} ({r.on_hand_qty} {r.uom})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 1B. CHI PHÍ TÀI SẢN ĐỊNH DANH */}
          {categorySubTab === 'IDENTIFIED' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Lọc Nhóm Danh Mục Tài Sản:</span>
                  <select
                    value={assetCategoryGroupFilter}
                    onChange={(e) => setAssetCategoryGroupFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">Tất cả nhóm danh mục</option>
                    {categoryGroupsList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs">
                  Tổng nguyên giá tài sản định danh trong kỳ:{' '}
                  <strong className="text-blue-900 font-mono text-sm">
                    {formatVND(identifiedReportData.totalCost)}
                  </strong>{' '}
                  ({identifiedReportData.totalAssetsCount} tài sản)
                </div>
              </div>

              {/* Group Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {identifiedReportData.groupSummary.map((g) => (
                  <div
                    key={g.group_name}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1"
                  >
                    <div className="text-xs font-bold text-slate-800 truncate">{g.group_name}</div>
                    <div className="text-lg font-black font-mono text-blue-900 tabular-nums">
                      {formatVND(g.total_cost)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {g.asset_qty} thiết bị • {g.item_count} danh mục
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Table by Identified Category */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                        <th className="py-3 px-3 text-center w-12">STT</th>
                        <th className="py-3 px-4">Nhóm Danh Mục</th>
                        <th className="py-3 px-4">Mã & Tên Danh Mục Tài Sản Định Danh</th>
                        <th className="py-3 px-3 text-center">ĐVT</th>
                        <th className="py-3 px-3 text-center">Tổng SL</th>
                        <th className="py-3 px-3 text-center text-emerald-700">Đang Sử Dụng</th>
                        <th className="py-3 px-3 text-center text-blue-700">Trong Kho</th>
                        <th className="py-3 px-3 text-center text-amber-700">Đang Sửa Chữa</th>
                        <th className="py-3 px-4 text-right">Tổng Nguyên Giá (VND)</th>
                        <th className="py-3 px-4 text-right w-28">Tỷ Trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {identifiedReportData.rows.map((r) => {
                        const pct =
                          identifiedReportData.totalCost > 0
                            ? ((r.total_cost / identifiedReportData.totalCost) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <tr key={r.category_id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-center text-slate-400">{r.stt}</td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{r.group}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-blue-900 block">{r.code}</span>
                              <span className="font-bold text-slate-900">{r.name}</span>
                            </td>
                            <td className="py-3 px-3 text-center">{r.uom}</td>
                            <td className="py-3 px-3 text-center font-bold">{r.total_qty}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-700">{r.in_use_qty}</td>
                            <td className="py-3 px-3 text-center font-bold text-blue-700">{r.in_stock_qty}</td>
                            <td className="py-3 px-3 text-center font-bold text-amber-700">{r.repairing_qty}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {formatVND(r.total_cost)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 1C. CHI PHÍ DỊCH VỤ (LỌC THEO KHỐI CHI PHÍ & NHÓM CHI PHÍ) */}
          {categorySubTab === 'SERVICE' && (
            <div className="space-y-4">
              {/* Filter Bar for 1c. Service Expenses: Filter by Root Block (1. CPVH / 2. CPPL) and Group */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800">1. Lọc theo Khối Chi Phí:</span>
                      <select
                        value={serviceRootFilter}
                        onChange={(e) => {
                          setServiceRootFilter(e.target.value);
                          setServiceGroupFilter('ALL');
                        }}
                        className="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 focus:outline-emerald-700"
                      >
                        <option value="ALL">Tất cả Khối Chi Phí (1. CPVH & 2. CPPL)</option>
                        <option value="1. CHI PHÍ VẬN HÀNH & CÔNG TÁC">
                          1. CHI PHÍ VẬN HÀNH & CÔNG TÁC (CPVH)
                        </option>
                        <option value="2. CHI PHÍ GIAO TẾ & PHÚC LỢI">
                          2. CHI PHÍ GIAO TẾ & PHÚC LỢI (CPPL)
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">2. Lọc theo Nhóm Chi Phí:</span>
                      <select
                        value={serviceGroupFilter}
                        onChange={(e) => setServiceGroupFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-700"
                      >
                        <option value="ALL">Tất cả 11 Nhóm Chi Phí</option>
                        <optgroup label="Nhóm Cha (Tầng 2)">
                          <option value="CPVH-CT">CPVH-CT: Chi phí Công tác & Tiếp khách</option>
                          <option value="CPVH-VP">CPVH-VP: Chi phí Văn phòng & Hạ tầng</option>
                          <option value="CPVH-NL">CPVH-NL: Chi phí Năng lượng & Nhiên liệu</option>
                          <option value="CPVH-XE">CPVH-XE: Chi phí Xe & Phí hành chính</option>
                          <option value="CPPL-NV">CPPL-NV: Phúc lợi Nội bộ (CB-NV)</option>
                          <option value="CPPL-KH">CPPL-KH: Giao tế Đối ngoại</option>
                        </optgroup>
                        <optgroup label="11 Phân Nhóm Chi Tiết (Tầng 3)">
                          {THACO_STANDARD_SUBGROUPS.filter(
                            (g) => serviceRootFilter === 'ALL' || g.root_type === serviceRootFilter
                          ).map((g) => (
                            <option key={g.group_code} value={g.group_code}>
                              [{g.group_code}] {g.sub_title}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span>
                      1. CPVH: <strong className="font-mono text-emerald-800">{formatVND(serviceReportData.totalCPVH)}</strong>
                    </span>
                    <span>
                      2. CPPL: <strong className="font-mono text-purple-800">{formatVND(serviceReportData.totalCPPL)}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-900 text-white font-mono font-bold">
                      Tổng: {formatVND(serviceReportData.totalServiceCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Table by Expense Group */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">
                    Bảng 1c-1: Tổng Hợp Chi Phí Dịch Vụ Theo Khối Chi Phí & Phân Nhóm Chi Phí
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {serviceReportData.groupRows.length} phân nhóm
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                        <th className="py-3 px-3 text-center w-12">STT</th>
                        <th className="py-3 px-4">Khối Chi Phí Gốc</th>
                        <th className="py-3 px-4">Nhóm Cha</th>
                        <th className="py-3 px-4">Mã & Tên Phân Nhóm Chi Phí</th>
                        <th className="py-3 px-3 text-center">Số Khoản Mục</th>
                        <th className="py-3 px-3 text-center">Số Phiếu Chi</th>
                        <th className="py-3 px-4 text-right">Tổng Chi Phí (VND)</th>
                        <th className="py-3 px-4 text-right w-28">Tỷ Trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceReportData.groupRows.map((row) => {
                        const pct =
                          serviceReportData.totalServiceCost > 0
                            ? ((row.total_amount / serviceReportData.totalServiceCost) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <tr key={row.group_code} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-center text-slate-400">{row.stt}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  row.root_code === 'CPVH'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                {row.root_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">{row.parent_name}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-900 mr-2">
                                [{row.group_code}]
                              </span>
                              <span className="font-bold text-slate-800">{row.sub_title}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">
                              {row.configured_items} mục
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-blue-700">
                              {row.voucher_count} phiếu
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {formatVND(row.total_amount)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Service Vouchers Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">
                    Bảng 1c-2: Chi Tiết Các Chứng Từ Chi Phí Dịch Vụ Phát Sinh Trong Kỳ ({serviceReportData.filteredExpenses.length} phiếu)
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                        <th className="py-2.5 px-3 text-center w-12">STT</th>
                        <th className="py-2.5 px-4">Mã Phiếu & Ngày</th>
                        <th className="py-2.5 px-4">Khối & Nhóm Chi Phí</th>
                        <th className="py-2.5 px-4">Khoản Mục Chi Phí Dịch Vụ</th>
                        <th className="py-2.5 px-4">Nhà Cung Cấp</th>
                        <th className="py-2.5 px-4">Diễn Giải</th>
                        <th className="py-2.5 px-4 text-right">Số Tiền (VND)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceReportData.filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Không có chứng từ chi phí dịch vụ nào trong khoảng thời gian và bộ lọc đã chọn.
                          </td>
                        </tr>
                      ) : (
                        serviceReportData.filteredExpenses.map((exp, idx) => (
                          <tr key={exp.expense_id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-mono font-bold text-slate-900 block">
                                {exp.expense_code}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {formatDateVN(exp.occurred_at)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">
                                {exp.group_code}
                              </span>
                              <span className="text-[11px] text-slate-600">{exp.category_type}</span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{exp.expense_name}</td>
                            <td className="py-2.5 px-4 text-slate-800">{exp.supplier_name}</td>
                            <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={exp.description}>
                              {exp.description}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-800">
                              {formatVND(exp.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* BÁO CÁO 2: CHI PHÍ THEO NHÀ CUNG CẤP                                   */}
      {/* ===================================================================== */}
      {activeReport === 'BY_SUPPLIER' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-700">Nhà cung cấp:</span>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Tất cả Nhà cung cấp ({suppliers.length})</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.name}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Loại chi phí:</span>
                <select
                  value={supplierCostTypeFilter}
                  onChange={(e) => setSupplierCostTypeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Tất cả (Định danh + Tiêu hao + Dịch vụ)</option>
                  <option value="DINH_DANH">Chỉ mua sắm Tài sản Định danh</option>
                  <option value="TIEU_HAO">Chỉ mua sắm Vật tư Tiêu hao</option>
                  <option value="DICH_VU">Chỉ Chi phí Dịch vụ (CPVH & CPPL)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span>
                Định danh: <strong className="font-mono text-blue-800">{formatVND(supplierReportData.totalIdentified)}</strong>
              </span>
              <span>
                Tiêu hao: <strong className="font-mono text-amber-800">{formatVND(supplierReportData.totalConsumable)}</strong>
              </span>
              <span>
                Dịch vụ: <strong className="font-mono text-emerald-800">{formatVND(supplierReportData.totalService)}</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold">
                Tổng: {formatVND(supplierReportData.grandTotal)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-4">Mã & Tên Nhà Cung Cấp</th>
                    <th className="py-3 px-3">Mã Số Thuế</th>
                    <th className="py-3 px-3 text-center">Số Đơn PO</th>
                    <th className="py-3 px-3 text-center">Số Phiếu DV</th>
                    <th className="py-3 px-4 text-right text-blue-800">Chi Phí TS Định Danh</th>
                    <th className="py-3 px-4 text-right text-amber-800">Chi Phí VT Tiêu Hao</th>
                    <th className="py-3 px-4 text-right text-emerald-800">Chi Phí Dịch Vụ</th>
                    <th className="py-3 px-4 text-right font-black bg-emerald-50 text-emerald-950">
                      Tổng Chi Phí (VND)
                    </th>
                    <th className="py-3 px-3 text-right w-24">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {supplierReportData.rows.map((row, idx) => {
                    const pct =
                      supplierReportData.grandTotal > 0
                        ? ((row.filtered_total / supplierReportData.grandTotal) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={row.supplier_id + idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-600 text-[11px] block">
                            {row.code}
                          </span>
                          <span className="font-bold text-slate-900">{row.name}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{row.tax_code}</td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700">{row.po_count}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700">
                          {row.service_voucher_count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-blue-900">
                          {formatVND(row.identified_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-900">
                          {formatVND(row.consumable_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-900">
                          {formatVND(row.service_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-950 bg-emerald-50/60">
                          {formatVND(row.filtered_total)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BÁO CÁO 3: CHI PHÍ THEO TÊN THIẾT BỊ / VẬT TƯ                         */}
      {/* ===================================================================== */}
      {activeReport === 'BY_EQUIPMENT_NAME' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  placeholder="Tìm theo tên thiết bị, mã danh mục..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-emerald-600"
                />
              </div>

              <select
                value={equipmentTrackingFilter}
                onChange={(e) => setEquipmentTrackingFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="ALL">Tất cả loại thiết bị / vật tư</option>
                <option value="DINH_DANH">Tài sản định danh (Laptop, Máy in, Nội thất...)</option>
                <option value="TIEU_HAO">Vật tư tiêu hao (Giấy, Mực in, Đồng phục...)</option>
              </select>
            </div>

            <div className="text-xs">
              Tổng chi phí / nguyên giá theo thiết bị:{' '}
              <strong className="font-mono text-sm text-emerald-900">
                {formatVND(equipmentReportData.grandTotal)}
              </strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-4">Mã Thiết Bị</th>
                    <th className="py-3 px-4">Tên Thiết Bị / Vật Tư</th>
                    <th className="py-3 px-4">Nhóm Danh Mục</th>
                    <th className="py-3 px-3 text-center">Loại Quản Lý</th>
                    <th className="py-3 px-3 text-center">ĐVT</th>
                    <th className="py-3 px-3 text-center">Tổng SL</th>
                    <th className="py-3 px-3 text-center text-emerald-700">Đang Dùng / Đã Xuất</th>
                    <th className="py-3 px-3 text-center text-blue-700">Tồn Kho</th>
                    <th className="py-3 px-4 text-right">Đơn Giá BQ</th>
                    <th className="py-3 px-4 text-right font-black bg-emerald-50 text-emerald-950">
                      Tổng Chi Phí (VND)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {equipmentReportData.rows.map((row, idx) => (
                    <tr key={row.category_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                      <td className="py-3 px-4 text-slate-700">{row.group}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.tracking_type === 'Tài sản định danh'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {row.tracking_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">{row.uom}</td>
                      <td className="py-3 px-3 text-center font-bold">{row.qty_total}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">
                        {row.qty_active_or_issued}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {row.qty_in_stock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatVND(row.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-950 bg-emerald-50/60">
                        {formatVND(row.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BÁO CÁO 4: CHI PHÍ THEO ĐƠN VỊ                                        */}
      {/* ===================================================================== */}
      {activeReport === 'BY_UNIT' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-700">Lọc theo Đơn vị pháp nhân:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="ALL">Tất cả Đơn vị trực thuộc THACO AGRI ({units.length})</option>
                {units.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>
                    [{u.code}] {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs">
              Tổng chi phí phân bổ toàn đơn vị:{' '}
              <strong className="font-mono text-sm text-emerald-900">
                {formatVND(unitReportData.grandTotal)}
              </strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-4">Mã & Tên Đơn Vị Pháp Nhân</th>
                    <th className="py-3 px-3 text-center">Phòng Ban</th>
                    <th className="py-3 px-3 text-center">Nhân Sự</th>
                    <th className="py-3 px-3 text-center">SL Tài Sản</th>
                    <th className="py-3 px-4 text-right text-amber-800">a. Chi Phí Tiêu Hao</th>
                    <th className="py-3 px-4 text-right text-blue-800">b. Giá Trị TS Định Danh</th>
                    <th className="py-3 px-4 text-right text-emerald-800">c. Chi Phí Dịch Vụ</th>
                    <th className="py-3 px-4 text-right font-black bg-emerald-50 text-emerald-950">
                      Tổng Chi Phí Đơn Vị
                    </th>
                    <th className="py-3 px-3 text-right w-24">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {unitReportData.rows.map((row, idx) => {
                    const pct =
                      unitReportData.grandTotal > 0
                        ? ((row.total_cost / unitReportData.grandTotal) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={row.unit_id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-800 text-[11px] block">
                            {row.code} • {row.short_name}
                          </span>
                          <span className="font-bold text-slate-900">{row.name}</span>
                          <span className="text-[11px] text-slate-500 block">{row.address}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">{row.dept_count}</td>
                        <td className="py-3 px-3 text-center font-semibold">{row.emp_count}</td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700">
                          {row.asset_count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-900">
                          {formatVND(row.consumable_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-blue-900">
                          {formatVND(row.identified_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-900">
                          {formatVND(row.service_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-950 bg-emerald-50/60">
                          {formatVND(row.total_cost)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
