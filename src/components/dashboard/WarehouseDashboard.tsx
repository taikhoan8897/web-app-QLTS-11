import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Cpu,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  ShieldAlert,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Asset, StockBalance } from '../../types';
import { formatVND, exportTableToExcel } from '../../utils/excelExporter';

interface WarehouseDashboardProps {
  onNavigateToTab: (tab: any) => void;
  onOpenAssetProfile: (asset: Asset) => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  onNavigateToTab,
  onOpenAssetProfile,
}) => {
  const { 
    categories, 
    assets, 
    stockBalances, 
    purchaseOrders, 
    selectedWarehouseId, 
    warehouses,
    currentUser
  } = useApp();

  const [activeViewMode, setActiveViewMode] = useState<'CONSUMABLES' | 'SERIALIZED'>('CONSUMABLES');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const currentWh = warehouses.find((w) => w.warehouse_id === selectedWarehouseId);

  // Groups list
  const categoryGroups = [
    'Thiết bị tin học',
    'Thiết bị điện tử văn phòng',
    'Thiết bị gia dụng',
    'Nội thất văn phòng',
    'Văn phòng phẩm & vật tư',
    'Phương tiện vận tải',
  ];

  // Key KPI stats
  const totalSerialized = assets.filter((a) => a.warehouse_id === selectedWarehouseId).length;
  const inUseCount = assets.filter(
    (a) => a.warehouse_id === selectedWarehouseId && a.status === 'DANG_SU_DUNG'
  ).length;
  const inStockCount = assets.filter(
    (a) => a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO'
  ).length;
  const underRepairCount = assets.filter(
    (a) => a.warehouse_id === selectedWarehouseId && a.status === 'DANG_SUA_CHUA'
  ).length;

  const lowStockConsumables = stockBalances.filter((s) => {
    if (s.warehouse_id !== selectedWarehouseId) return false;
    const cat = categories.find((c) => c.category_id === s.category_id);
    return cat && s.quantity_on_hand <= cat.min_stock;
  });

  const pendingPOs = purchaseOrders.filter(
    (p) => p.receiving_warehouse_id === selectedWarehouseId && p.status !== 'DA_NHAP_KHO' && p.status !== 'DA_DONG'
  ).length;

  // Filter categories
  const filteredConsumableCategories = categories.filter((c) => {
    if (c.tracking_type !== 'TIEU_HAO') return false;
    if (selectedGroup !== 'ALL' && c.group !== selectedGroup) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredSerializedCategories = categories.filter((c) => {
    if (c.tracking_type !== 'DINH_DANH') return false;
    if (selectedGroup !== 'ALL' && c.group !== selectedGroup) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleExportConsumablesExcel = () => {
    const data = filteredConsumableCategories.map((cat, idx) => {
      const stock = stockBalances.find(
        (s) => s.warehouse_id === selectedWarehouseId && s.category_id === cat.category_id
      );
      const onHand = stock?.quantity_on_hand || 0;
      const isLow = onHand <= cat.min_stock;
      return {
        STT: idx + 1,
        'Mã vật tư': cat.code,
        'Tên vật tư tiêu hao': cat.name,
        'Nhóm danh mục': cat.group,
        'Đơn vị tính': cat.unit_of_measure,
        'Tồn kho hiện tại': onHand,
        'Ngưỡng tồn tối thiểu': cat.min_stock,
        'Trạng thái cảnh báo': isLow ? 'CẢNH BÁO THIẾU HÀNG' : 'Đảm bảo định mức',
        'Đầu tư trong tháng': stock?.invested_this_month || 0,
        'Đã cấp trong tháng': stock?.issued_this_month || 0,
        'Đơn giá bình quân (VND)': stock?.average_unit_cost || 0,
        'Kho áp dụng': currentWh?.name,
      };
    });
    exportTableToExcel(data, `BaoCao_TonKho_TieuHao_${currentWh?.code}`);
  };

  const handleExportSerializedExcel = () => {
    const data = filteredSerializedCategories.map((cat, idx) => {
      const catAssets = assets.filter(
        (a) => a.category_id === cat.category_id && a.warehouse_id === selectedWarehouseId
      );
      const total = catAssets.length;
      const inUse = catAssets.filter((a) => a.status === 'DANG_SU_DUNG').length;
      const inStock = catAssets.filter((a) => a.status === 'TRONG_KHO').length;
      
      // Calculate pending procurement quantity
      let pendingProcureQty = 0;
      purchaseOrders.forEach((po) => {
        if (po.receiving_warehouse_id === selectedWarehouseId && (po.status === 'DANG_MUA' || po.status === 'DA_GUI_THU_MUA')) {
          po.lines.forEach((l) => {
            if (l.category_id === cat.category_id) {
              pendingProcureQty += l.qty_ordered - l.qty_received;
            }
          });
        }
      });

      return {
        STT: idx + 1,
        'Mã thiết bị': cat.code,
        'Tên chủng loại thiết bị': cat.name,
        'Nhóm thiết bị': cat.group,
        'Đơn vị tính': cat.unit_of_measure,
        'Tổng có': total,
        'Đang dùng': inUse,
        'Tồn kho': inStock,
        'Đang chờ thu mua': pendingProcureQty,
        'Ngưỡng tối thiểu': cat.min_stock,
        'Kho quản lý': currentWh?.name,
      };
    });
    exportTableToExcel(data, `BaoCao_VatTu_DinhDanh_${currentWh?.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700/80 text-emerald-200 border border-emerald-500/50">
                Phân hệ Quản trị Kho Trung tâm THACO AGRI (UI01)
              </span>
              <span className="text-xs text-emerald-200/80">• Đơn vị: {currentWh?.name}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Dashboard Kiểm Soát Tồn Kho & Tài Sản
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Theo dõi tồn khả dụng theo thời gian thực, giám sát vật tư tiêu hao theo 3 cột nghiệp vụ,
              và kiểm soát vòng đời tài sản định danh từ khâu mua sắm đến thanh lý.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('REQUESTS')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              Tạo đề xuất cấp phát
            </button>
            <button
              onClick={() => onNavigateToTab('ASSETS')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition border border-emerald-500/50 cursor-pointer"
            >
              <Box className="w-4 h-4" />
              Kho & Định danh PO
            </button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 10 H90 V90 H10 Z" />
          </svg>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Tổng tài sản</span>
            <Box className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{totalSerialized}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Định danh vật lý</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Đang sử dụng</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-900">{inUseCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">CBNV / Phòng ban</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Tồn kho sẵn sàng</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800">{inStockCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Khả dụng cấp phát</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Đang sửa chữa</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-800">{underRepairCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Chờ kỹ thuật xử lý</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Cảnh báo tồn thấp</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-700">{lowStockConsumables.length}</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">≤ Ngưỡng tối thiểu</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Đơn mua PO</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-900">{pendingPOs}</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">Đang tiến hành mua</div>
        </div>
      </div>

      {/* Main Mode Toggle: Vật tư tiêu hao vs Tài sản định danh (Mục 5.2.7) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-slate-50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setActiveViewMode('CONSUMABLES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer ${
                activeViewMode === 'CONSUMABLES'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>1. Vật tư tiêu hao (3 cột nghiệp vụ)</span>
            </button>
            <button
              onClick={() => setActiveViewMode('SERIALIZED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer ${
                activeViewMode === 'SERIALIZED'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>2. Tài sản định danh (Serial/QR)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã hoặc tên vật tư..."
                className="w-full sm:w-60 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* Export Excel Button */}
            <button
              onClick={
                activeViewMode === 'CONSUMABLES'
                  ? handleExportConsumablesExcel
                  : handleExportSerializedExcel
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Group Filter Tabs (Theo các tab nhóm thiết bị như mục 5.2.7) */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Nhóm hàng:</span>
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              selectedGroup === 'ALL'
                ? 'bg-emerald-100 text-emerald-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả nhóm
          </button>
          {categoryGroups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                selectedGroup === grp
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {/* Table 1: Vật tư tiêu hao (3 Cột nghiệp vụ: Tồn kho hiện tại, Đầu tư trong tháng, Đã cấp trong tháng) */}
        {activeViewMode === 'CONSUMABLES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Mã vật tư</th>
                  <th className="py-3 px-4">Tên vật tư tiêu hao</th>
                  <th className="py-3 px-4">Nhóm danh mục</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-right bg-emerald-50/70 text-emerald-900">
                    1. Tồn kho hiện tại (Khả dụng)
                  </th>
                  <th className="py-3 px-4 text-right bg-blue-50/60 text-blue-900">
                    2. Đầu tư trong tháng
                  </th>
                  <th className="py-3 px-4 text-right bg-amber-50/60 text-amber-900">
                    3. Đã cấp trong tháng
                  </th>
                  <th className="py-3 px-4 text-center">Ngưỡng tối thiểu</th>
                  <th className="py-3 px-4 text-right">Đơn giá BQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredConsumableCategories.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không tìm thấy mặt hàng tiêu hao nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredConsumableCategories.map((cat, idx) => {
                    const stock = stockBalances.find(
                      (s) => s.warehouse_id === selectedWarehouseId && s.category_id === cat.category_id
                    );
                    const onHand = stock?.quantity_on_hand || 0;
                    const isBelowMin = onHand <= cat.min_stock;

                    return (
                      <tr
                        key={cat.category_id}
                        className={`hover:bg-slate-50 transition ${
                          isBelowMin ? 'bg-red-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{cat.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div>
                            <span className="font-semibold text-slate-900 text-xs block leading-snug">{cat.name}</span>
                            {isBelowMin && (
                              <span
                                title={`Cảnh báo tồn kho: Tồn khả dụng (${onHand}) đang chạm hoặc dưới ngưỡng tối thiểu (${cat.min_stock} ${cat.unit_of_measure})`}
                                className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Cảnh báo thiếu tồn: Còn {onHand} / Ngưỡng {cat.min_stock} {cat.unit_of_measure}</span>
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <span className="text-[11px] text-slate-400 block mt-1">{cat.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{cat.group}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {cat.unit_of_measure}
                        </td>

                        {/* 1. Cột Tồn kho hiện tại */}
                        <td className="py-3 px-4 text-right font-black text-sm bg-emerald-50/40">
                          <span
                            className={
                              isBelowMin ? 'text-red-700 font-black' : 'text-emerald-800'
                            }
                          >
                            {onHand}
                          </span>
                        </td>

                        {/* 2. Cột Đầu tư trong tháng */}
                        <td className="py-3 px-4 text-right font-bold text-blue-800 bg-blue-50/30">
                          +{stock?.invested_this_month || 0}
                        </td>

                        {/* 3. Cột Đã cấp trong tháng */}
                        <td className="py-3 px-4 text-right font-bold text-amber-800 bg-amber-50/30">
                          -{stock?.issued_this_month || 0}
                        </td>

                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {cat.min_stock} {cat.unit_of_measure}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                          {formatVND(stock?.average_unit_cost || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 2: Tài sản định danh (Tổng có, Đang dùng, Tồn kho, Đang chờ thu mua) */}
        {activeViewMode === 'SERIALIZED' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Mã chủng loại</th>
                  <th className="py-3 px-4">Tên chủng loại thiết bị</th>
                  <th className="py-3 px-4">Nhóm thiết bị</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-200/50">
                    Tổng có
                  </th>
                  <th className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50">
                    Đang dùng
                  </th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-900 bg-emerald-50">
                    Tồn kho (Khả dụng)
                  </th>
                  <th className="py-3 px-4 text-right font-bold text-purple-900 bg-purple-50">
                    Đang chờ thu mua
                  </th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSerializedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không tìm thấy thiết bị định danh nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSerializedCategories.map((cat, idx) => {
                    const catAssets = assets.filter(
                      (a) => a.category_id === cat.category_id && a.warehouse_id === selectedWarehouseId
                    );
                    const total = catAssets.length;
                    const inUse = catAssets.filter((a) => a.status === 'DANG_SU_DUNG').length;
                    const inStock = catAssets.filter((a) => a.status === 'TRONG_KHO').length;

                    let pendingProcureQty = 0;
                    purchaseOrders.forEach((po) => {
                      if (
                        po.receiving_warehouse_id === selectedWarehouseId &&
                        (po.status === 'DANG_MUA' || po.status === 'DA_GUI_THU_MUA')
                      ) {
                        po.lines.forEach((l) => {
                          if (l.category_id === cat.category_id) {
                            pendingProcureQty += l.qty_ordered - l.qty_received;
                          }
                        });
                      }
                    });

                    return (
                      <tr key={cat.category_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{cat.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {cat.name}
                          {cat.description && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">{cat.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{cat.group}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {cat.unit_of_measure}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 bg-slate-100/50">
                          {total}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-blue-800 bg-blue-50/40">
                          {inUse}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-800 bg-emerald-50/40">
                          {inStock}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-purple-800 bg-purple-50/40">
                          {pendingProcureQty > 0 ? (
                            <span className="text-purple-700">+{pendingProcureQty}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onNavigateToTab('ASSETS')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Xem chi tiết ({catAssets.length})
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span>
            Dữ liệu đối soát tự động từ các giao dịch kho và PO theo quy tắc bất biến (mục 5.2.7 & 7.1).
          </span>
          <span className="font-mono text-emerald-800 font-semibold">
            Kho: {currentWh?.code} • Pháp nhân: THACO AGRI
          </span>
        </div>
      </div>
    </div>
  );
};
