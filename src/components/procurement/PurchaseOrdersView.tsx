import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Building2, 
  DollarSign, 
  Layers, 
  Download, 
  ArrowRight,
  GitBranch,
  User,
  PackageCheck,
  CheckSquare,
  Square,
  Wrench,
  Warehouse as WarehouseIcon,
  Filter,
  Eye,
  Info,
  ChevronRight,
  Boxes,
  FileCheck,
  QrCode,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, Category, TrackingType, ProcurementDemandItem } from '../../types';
import { formatVND, formatDateVN, exportTableToExcel } from '../../utils/excelExporter';

export const PurchaseOrdersView: React.FC = () => {
  const { 
    purchaseOrders, 
    procurementDemands,
    categories, 
    warehouses, 
    suppliers = [],
    selectedWarehouseId, 
    currentUser, 
    procurePO, 
    consolidateDemandsToPO,
    createSinglePOFromDemand,
    createPO,
    createManualDemand,
    stockBalances
  } = useApp();

  // Primary top-level navigation: Gom PO Hub vs PO List vs Thủ kho tự tạo nhu cầu
  const [mainView, setMainView] = useState<'GOM_PO_HUB' | 'PO_LIST' | 'MANUAL_DEMAND'>('GOM_PO_HUB');

  // Filter in PO List tab
  const [poFilterTab, setPoFilterTab] = useState<'ALL' | 'DA_GUI' | 'DANG_MUA' | 'HOAN_TAT'>('ALL');

  // Filters in Gom PO Hub
  const [trackingFilter, setTrackingFilter] = useState<'ALL' | 'DINH_DANH' | 'TIEU_HAO'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'YEU_CAU_CBNV' | 'TICKET_KY_THUAT' | 'THU_KHO_TU_TAO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected demand IDs for consolidation
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([]);

  // Modals state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isProcuringModalOpen, setIsProcuringModalOpen] = useState(false);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isViewPODetailOpen, setIsViewPODetailOpen] = useState(false);

  // Single PO Modal state (Sinh PO riêng cho 1 nhu cầu)
  const [isSinglePOModalOpen, setIsSinglePOModalOpen] = useState(false);
  const [targetSingleDemand, setTargetSingleDemand] = useState<ProcurementDemandItem | null>(null);
  const [singlePOSupplier, setSinglePOSupplier] = useState('');
  const [singlePOWarehouseId, setSinglePOWarehouseId] = useState(selectedWarehouseId);
  const [singlePONote, setSinglePONote] = useState('');
  const [singlePOBrand, setSinglePOBrand] = useState('');
  const [singlePOModel, setSinglePOModel] = useState('');
  const [singlePOSpecs, setSinglePOSpecs] = useState('');
  const [singlePOPrice, setSinglePOPrice] = useState(0);

  // Manual PO Modal state (Tạo PO riêng mới thủ công từ danh sách PO)
  const [isCreateManualPOOpen, setIsCreateManualPOOpen] = useState(false);
  const [manualPOWarehouseId, setManualPOWarehouseId] = useState(selectedWarehouseId);
  const [manualPOSupplier, setManualPOSupplier] = useState('Công ty CP Công Nghệ Phong Vũ');
  const [manualPOTrackingType, setManualPOTrackingType] = useState<TrackingType>('DINH_DANH');
  const [manualPONote, setManualPONote] = useState('');
  const [manualPOLines, setManualPOLines] = useState<
    {
      category_id: string;
      brand?: string;
      model_name?: string;
      specifications?: string;
      qty: number;
      unit_price: number;
    }[]
  >([
    {
      category_id: 'CAT-01',
      brand: 'Dell',
      model_name: 'Dell Latitude 5430',
      specifications: 'Core i5-1235U, RAM 16GB DDR4, SSD 512GB NVMe, 14" FHD IPS',
      qty: 1,
      unit_price: 21500000,
    },
  ]);

  // Consolidation Modal options
  const [consolidateWarehouseId, setConsolidateWarehouseId] = useState(selectedWarehouseId);
  const [consolidateSupplier, setConsolidateSupplier] = useState('Công ty CP Công Nghệ Phong Vũ');
  const [consolidateNote, setConsolidateNote] = useState('');
  const [mergeSameCategory, setMergeSameCategory] = useState(false);
  const [consolidateLineConfigs, setConsolidateLineConfigs] = useState<
    Record<string, { brand?: string; model_name?: string; specifications?: string; estimated_unit_price?: number }>
  >({});

  // Procure PO modal states
  const [procureSupplier, setProcureSupplier] = useState('');
  const [procureLines, setProcureLines] = useState<
    {
      line_id: string;
      actual_unit_price: number;
      qty_received: number;
      brand?: string;
      model_name?: string;
      specifications?: string;
    }[]
  >([]);
  const [isPartialDelivery, setIsPartialDelivery] = useState(false);

  // Manual Demand Form states (Thủ kho chủ động lập dự trù)
  const [manualCatId, setManualCatId] = useState('CAT-11');
  const [manualQty, setManualQty] = useState(10);
  const [manualUnitPrice, setManualUnitPrice] = useState(380000);
  const [manualPriority, setManualPriority] = useState<'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP'>('TRUNG_BINH');
  const [manualNote, setManualNote] = useState('Bổ sung tồn kho an toàn tối thiểu phục vụ vận hành quý 4');

  // Open demands waiting for PO
  const openDemands = procurementDemands.filter((d) => d.status === 'CHO_GOM_PO');

  const openDDCount = openDemands.filter((d) => {
    const cat = categories.find((c) => c.category_id === d.category_id);
    return cat?.tracking_type === 'DINH_DANH';
  }).length;

  const openTHCount = openDemands.filter((d) => {
    const cat = categories.find((c) => c.category_id === d.category_id);
    return cat?.tracking_type === 'TIEU_HAO';
  }).length;

  const filteredDemands = openDemands.filter((d) => {
    const cat = categories.find((c) => c.category_id === d.category_id);
    if (trackingFilter !== 'ALL' && cat?.tracking_type !== trackingFilter) return false;
    if (sourceFilter !== 'ALL' && d.source_type !== sourceFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCat = cat?.name.toLowerCase().includes(q) || cat?.code.toLowerCase().includes(q);
      const matchSource = d.source_code.toLowerCase().includes(q) || d.source_title.toLowerCase().includes(q) || d.requester_name.toLowerCase().includes(q);
      if (!matchCat && !matchSource) return false;
    }
    return true;
  });

  const filteredPOs = purchaseOrders.filter((po) => {
    if (poFilterTab === 'DA_GUI') return po.status === 'DA_GUI_THU_MUA';
    if (poFilterTab === 'DANG_MUA') return po.status === 'DANG_MUA';
    if (poFilterTab === 'HOAN_TAT') return po.status === 'MUA_HANG_HOAN_TAT' || po.status === 'DA_NHAP_KHO' || po.status === 'HOAN_TAT_MOT_PHAN';
    return true;
  });

  // Toggle selection for consolidation
  const toggleSelectDemand = (id: string) => {
    setSelectedDemandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedDemandIds.length === filteredDemands.length) {
      setSelectedDemandIds([]);
    } else {
      setSelectedDemandIds(filteredDemands.map((d) => d.demand_id));
    }
  };

  // Open Consolidate Modal
  const handleOpenConsolidateModal = () => {
    if (selectedDemandIds.length === 0) {
      alert('Vui lòng chọn ít nhất một nhu cầu mua sắm để gom vào PO!');
      return;
    }
    const demandsToGom = procurementDemands.filter((d) => selectedDemandIds.includes(d.demand_id));
    const uniqueCodes = Array.from(new Set(demandsToGom.map((d) => d.source_code)));
    const initConfigs: Record<string, { brand?: string; model_name?: string; specifications?: string; estimated_unit_price?: number }> = {};
    demandsToGom.forEach((d) => {
      const cat = categories.find((c) => c.category_id === d.category_id);
      if (cat?.tracking_type === 'DINH_DANH') {
        const firstCfg = cat.brand_configs?.[0];
        initConfigs[d.demand_id] = {
          brand: firstCfg?.brand || cat.supported_brands?.[0] || 'Dell',
          model_name: firstCfg?.model_name || '',
          specifications: firstCfg?.specifications || '',
          estimated_unit_price: firstCfg?.estimated_price || d.estimated_unit_price || cat.estimated_unit_price || 20000000,
        };
      }
    });
    setConsolidateLineConfigs(initConfigs);
    setConsolidateNote(`Gom mua sắm từ ${demandsToGom.length} mặt hàng của các nguồn: ${uniqueCodes.join(', ')}`);
    setIsConsolidateModalOpen(true);
  };

  // Confirm Consolidate PO
  const handleConfirmConsolidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDemandIds.length === 0) return;

    const res = consolidateDemandsToPO(selectedDemandIds, {
      receiving_warehouse_id: consolidateWarehouseId,
      supplier_name: consolidateSupplier,
      note: consolidateNote,
      merge_same_category: mergeSameCategory,
      lineConfigs: consolidateLineConfigs,
    });

    if (res.success) {
      alert(res.message);
      setIsConsolidateModalOpen(false);
      setSelectedDemandIds([]);
      setMainView('PO_LIST');
      if (res.po_id) {
        const createdPO = purchaseOrders.find((p) => p.po_id === res.po_id);
        if (createdPO) {
          setSelectedPO(createdPO);
          setIsViewPODetailOpen(true);
        }
      }
    } else {
      alert(res.message);
    }
  };

  // Open Single PO Modal for a specific demand item
  const handleOpenSinglePOModal = (dem: ProcurementDemandItem) => {
    setTargetSingleDemand(dem);
    const cat = categories.find((c) => c.category_id === dem.category_id);
    const isDD = cat?.tracking_type === 'DINH_DANH';
    const firstCfg = cat?.brand_configs?.[0];
    setSinglePOBrand(isDD ? (firstCfg?.brand || cat?.supported_brands?.[0] || 'Dell') : '');
    setSinglePOModel(isDD ? (firstCfg?.model_name || '') : '');
    setSinglePOSpecs(isDD ? (firstCfg?.specifications || '') : '');
    setSinglePOPrice(firstCfg?.estimated_price || dem.estimated_unit_price || cat?.estimated_unit_price || 0);
    setSinglePOSupplier(isDD ? 'Công ty CP Công Nghệ Phong Vũ' : 'Công ty TNHH Văn Phòng Phẩm An Phát');
    setSinglePOWarehouseId(selectedWarehouseId);
    setSinglePONote(`PO riêng lẻ cho ${cat?.name || 'mặt hàng'} theo nhu cầu ${dem.source_code} (${dem.requester_name})`);
    setIsSinglePOModalOpen(true);
  };

  // Confirm Single PO
  const handleConfirmSinglePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSingleDemand) return;
    const res = createSinglePOFromDemand(targetSingleDemand.demand_id, {
      receiving_warehouse_id: singlePOWarehouseId,
      supplier_name: singlePOSupplier,
      note: singlePONote,
      brand: singlePOBrand || undefined,
      model_name: singlePOModel || undefined,
      specifications: singlePOSpecs || undefined,
      estimated_unit_price: singlePOPrice || undefined,
    });
    alert(res.message);
    if (res.success) {
      setIsSinglePOModalOpen(false);
      setSelectedDemandIds((prev) => prev.filter((id) => id !== targetSingleDemand.demand_id));
      setTargetSingleDemand(null);
      setMainView('PO_LIST');
    }
  };

  // Bulk create separate POs for all selected items
  const handleOpenConsolidateAsSeparatePOs = () => {
    if (selectedDemandIds.length === 0) return;
    if (
      !confirm(
        `Bạn có chắc chắn muốn sinh ${selectedDemandIds.length} Đơn hàng PO riêng biệt cho ${selectedDemandIds.length} mặt hàng đã chọn (mỗi mặt hàng/nguồn 1 PO riêng, không gộp chung)?`
      )
    )
      return;

    let count = 0;
    selectedDemandIds.forEach((demId) => {
      const res = createSinglePOFromDemand(demId, {
        receiving_warehouse_id: selectedWarehouseId,
        supplier_name: 'Đại lý phân phối THACO',
        note: 'Sinh PO riêng biệt từ bảng nhu cầu',
      });
      if (res.success) count++;
    });

    alert(`Đã sinh thành công ${count} Đơn hàng PO riêng biệt!`);
    setSelectedDemandIds([]);
    setMainView('PO_LIST');
  };

  // Confirm Manual Standalone PO
  const handleConfirmManualPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPOLines.length === 0) {
      alert('Vui lòng thêm ít nhất một mặt hàng vào đơn PO!');
      return;
    }
    const res = createPO({
      source: 'MANUAL',
      tracking_type: manualPOTrackingType,
      receiving_warehouse_id: manualPOWarehouseId,
      supplier_name: manualPOSupplier,
      note: manualPONote || 'PO lập riêng biệt thủ công bởi bộ phận Thu mua',
      lines: manualPOLines.map((l) => ({
        category_id: l.category_id,
        brand: manualPOTrackingType === 'DINH_DANH' ? l.brand : undefined,
        model_name: manualPOTrackingType === 'DINH_DANH' ? l.model_name : undefined,
        specifications: manualPOTrackingType === 'DINH_DANH' ? l.specifications : undefined,
        qty_requested: l.qty,
        estimated_unit_price: l.unit_price,
        source_type: 'MANUAL',
      })),
    });
    alert(res.message);
    if (res.success) {
      setIsCreateManualPOOpen(false);
      setMainView('PO_LIST');
    }
  };

  // Submit Manual Demand (Thủ kho tự tạo)
  const handleSubmitManualDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createManualDemand({
      category_id: manualCatId,
      qty_needed: manualQty,
      estimated_unit_price: manualUnitPrice,
      priority: manualPriority,
      note: manualNote,
    });

    if (res.success) {
      alert(res.message);
      setMainView('GOM_PO_HUB');
    }
  };

  // Open Procure Modal for Nhân viên Thu Mua
  const handleOpenProcureModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setProcureSupplier(po.supplier_name || 'Công ty CP Công Nghệ Phong Vũ');
    setProcureLines(
      po.lines.map((l) => {
        const cat = categories.find((c) => c.category_id === l.category_id);
        const firstCfg = cat?.brand_configs?.[0];
        return {
          line_id: l.line_id,
          actual_unit_price: l.actual_unit_price || l.estimated_unit_price || firstCfg?.estimated_price || 20000000,
          qty_received: l.qty_received > 0 ? l.qty_received : l.qty_ordered,
          brand: l.brand || (l.tracking_type === 'DINH_DANH' ? (firstCfg?.brand || cat?.supported_brands?.[0] || 'Dell') : undefined),
          model_name: l.model_name || (l.tracking_type === 'DINH_DANH' ? (firstCfg?.model_name || '') : undefined),
          specifications: l.specifications || (l.tracking_type === 'DINH_DANH' ? (firstCfg?.specifications || '') : undefined),
        };
      })
    );
    setIsPartialDelivery(false);
    setIsProcuringModalOpen(true);
  };

  // Submit Procure PO
  const handleSubmitProcure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    if (!procureSupplier.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp thực tế!');
      return;
    }

    const res = procurePO(selectedPO.po_id, {
      supplier_name: procureSupplier,
      linesActual: procureLines,
      isPartialDelivery,
    });

    if (res.success) {
      alert(res.message);
      setIsProcuringModalOpen(false);
      setSelectedPO(null);
    }
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'DA_GUI_THU_MUA':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Đã gửi thu mua</span>;
      case 'DANG_MUA':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Đang mua hàng</span>;
      case 'MUA_HANG_HOAN_TAT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Chờ định danh</span>;
      case 'CHO_NHAP_KHO':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Chờ nhập kho</span>;
      case 'HOAN_TAT_MOT_PHAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">Giao thiếu (Có PO con)</span>;
      case 'DA_NHAP_KHO':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Đã nhập kho</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getSourceBadge = (source: PurchaseOrder['source']) => {
    switch (source) {
      case 'GOM_NHIEU_NGUON':
      case 'TONG_HOP':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Boxes className="w-3 h-3" />
            PO Gom Nhiều Nguồn
          </span>
        );
      case 'YEU_CAU_CBNV':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <User className="w-3 h-3" />
            Từ Yêu Cầu CBNV
          </span>
        );
      case 'TICKET_KY_THUAT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Từ Ticket Kỹ Thuật
          </span>
        );
      case 'KHO_THIEU_HUT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <WarehouseIcon className="w-3 h-3" />
            Thủ Kho Tự Tạo
          </span>
        );
      case 'MANUAL':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            PO Riêng Thủ Công
          </span>
        );
      default:
        return <span>{source}</span>;
    }
  };

  // Selected demands data analysis
  const selectedDemandsList = procurementDemands.filter((d) => selectedDemandIds.includes(d.demand_id));
  const totalSelectedEstAmount = selectedDemandsList.reduce((sum, d) => sum + (d.qty_needed * (d.estimated_unit_price || 0)), 0);
  const selectedSourcesCount = Array.from(new Set(selectedDemandsList.map((d) => d.source_code))).length;

  const selectedDDCount = selectedDemandsList.filter((d) => {
    const cat = categories.find((c) => c.category_id === d.category_id);
    return cat?.tracking_type === 'DINH_DANH';
  }).length;

  const selectedTHCount = selectedDemandsList.filter((d) => {
    const cat = categories.find((c) => c.category_id === d.category_id);
    return cat?.tracking_type === 'TIEU_HAO';
  }).length;

  const isMixedSelection = selectedDDCount > 0 && selectedTHCount > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Quản Trị Đơn Hàng Mua Sắm (PO) & Gom Nhu Cầu
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Trung Tâm Gom Đơn Hàng PO & Quản Lý Mua Sắm THACO AGRI
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Tổng hợp nhu cầu mua sắm từ yêu cầu cấp phát CBNV, đề xuất kỹ thuật IT và nhu cầu dự phòng kho. Đơn hàng Tài sản định danh và Vật tư tiêu hao được tách riêng để quản lý nhập kho chính xác.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMainView('MANUAL_DEMAND')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thủ kho tự tạo nhu cầu
          </button>
        </div>
      </div>

      {/* Main View Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-3 sm:px-6 pt-3 gap-3 sm:gap-6 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setMainView('GOM_PO_HUB')}
          className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
            mainView === 'GOM_PO_HUB'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Trung Tâm Gom PO (Nhu Cầu Chờ Mua)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            {openDemands.length} mặt hàng
          </span>
        </button>

        <button
          onClick={() => setMainView('PO_LIST')}
          className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
            mainView === 'PO_LIST'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Danh Sách Đơn Hàng PO Đã Tạo</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {purchaseOrders.length} PO
          </span>
        </button>

        <button
          onClick={() => setMainView('MANUAL_DEMAND')}
          className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
            mainView === 'MANUAL_DEMAND'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Thủ Kho Tự Tạo Nhu Cầu Bổ Sung</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TRUNG TÂM GOM PO (Nhu cầu từ CBNV, Ticket & Kho) */}
      {/* ========================================================= */}
      {mainView === 'GOM_PO_HUB' && (
        <div className="space-y-4">
          {/* Rule Notification Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-950">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                Quy tắc nghiệp vụ mục 5.4.1 (Tách riêng Hàng Định Danh & Hàng Tiêu Hao):
              </span>
              <span>
                <strong>Hàng Định Danh</strong> khi mua về cần quy trình dán Serial No, sinh QR Code và gắn người giữ tài sản. Trong khi <strong>Hàng Tiêu Hao</strong> chỉ cộng dồn số lượng tồn kho theo ĐVT. Bạn có thể chọn lọc theo từng hình thức để gom, hoặc nếu gom chung cả hai, hệ thống sẽ tự động tách thành 2 Đơn hàng PO riêng biệt.
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            {/* Primary Filter: Tracking Type (Định danh vs Tiêu hao) */}
            <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                Hình thức theo dõi:
              </span>
              <button
                onClick={() => setTrackingFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  trackingFilter === 'ALL'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Tất cả hình thức ({openDemands.length})
              </button>
              <button
                onClick={() => setTrackingFilter('DINH_DANH')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  trackingFilter === 'DINH_DANH'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Hàng Định Danh ({openDDCount})</span>
                <span className="text-[10px] opacity-80">(Serial/QR)</span>
              </button>
              <button
                onClick={() => setTrackingFilter('TIEU_HAO')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  trackingFilter === 'TIEU_HAO'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Hàng Tiêu Hao ({openTHCount})</span>
                <span className="text-[10px] opacity-80">(Số lượng kho)</span>
              </button>
            </div>

            {/* Secondary Filter: Source & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                  Nguồn phát sinh:
                </span>
                {[
                  { id: 'ALL', label: 'Tất cả nguồn' },
                  { id: 'YEU_CAU_CBNV', label: 'Yêu cầu nhân sự' },
                  { id: 'TICKET_KY_THUAT', label: 'Ticket IT / Bảo trì' },
                  { id: 'THU_KHO_TU_TAO', label: 'Thủ kho tự tạo' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSourceFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      sourceFilter === f.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="Tìm mã nguồn, tên vật tư, người yêu cầu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Demand Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllFiltered}
                  className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-emerald-800 cursor-pointer"
                >
                  {selectedDemandIds.length === filteredDemands.length && filteredDemands.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Chọn tất cả ({filteredDemands.length} mặt hàng trong bộ lọc)</span>
                </button>
              </div>

              <div className="text-slate-500 text-[11px]">
                Tích chọn các mặt hàng cần mua để gom thành Đơn hàng PO ở thanh thao tác phía dưới
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[950px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">Chọn</th>
                    <th className="py-3 px-4">Hình thức theo dõi</th>
                    <th className="py-3 px-4">Nguồn gốc phát sinh</th>
                    <th className="py-3 px-4">Mã tham chiếu & Người yêu cầu</th>
                    <th className="py-3 px-4">Mặt hàng cần mua</th>
                    <th className="py-3 px-4 text-center">SL cần mua</th>
                    <th className="py-3 px-4 text-right">Đơn giá ước tính</th>
                    <th className="py-3 px-4 text-right">Thành tiền dự kiến</th>
                    <th className="py-3 px-4 text-center">Ưu tiên</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDemands.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Không có nhu cầu mua sắm nào đang chờ gom trong bộ lọc này.
                      </td>
                    </tr>
                  ) : (
                    filteredDemands.map((dem) => {
                      const cat = categories.find((c) => c.category_id === dem.category_id);
                      const isSelected = selectedDemandIds.includes(dem.demand_id);
                      const estAmount = dem.qty_needed * (dem.estimated_unit_price || 0);
                      const isDD = cat?.tracking_type === 'DINH_DANH';

                      return (
                        <tr
                          key={dem.demand_id}
                          className={`hover:bg-emerald-50/50 transition cursor-pointer ${
                            isSelected ? 'bg-emerald-50/80 font-medium' : ''
                          }`}
                          onClick={() => toggleSelectDemand(dem.demand_id)}
                        >
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelectDemand(dem.demand_id)}
                              className="cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Hình thức theo dõi */}
                          <td className="py-3 px-4">
                            {isDD ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                                <QrCode className="w-3 h-3 text-blue-700" />
                                Định danh Serial/QR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                <Boxes className="w-3 h-3 text-amber-700" />
                                Tiêu hao (Số lượng)
                              </span>
                            )}
                          </td>

                          {/* Nguồn phát sinh */}
                          <td className="py-3 px-4">
                            {dem.source_type === 'YEU_CAU_CBNV' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                <User className="w-3 h-3 text-blue-700" />
                                Yêu cầu nhân sự
                              </span>
                            )}
                            {dem.source_type === 'TICKET_KY_THUAT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                <Wrench className="w-3 h-3 text-purple-700" />
                                Ticket IT / Bảo trì
                              </span>
                            )}
                            {dem.source_type === 'THU_KHO_TU_TAO' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                <WarehouseIcon className="w-3 h-3 text-emerald-700" />
                                Thủ kho tự tạo
                              </span>
                            )}
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={dem.source_title}>
                              {dem.source_title}
                            </div>
                          </td>

                          {/* Mã tham chiếu & Người yêu cầu */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">
                              {dem.source_code}
                            </span>
                            <div className="text-[11px] text-slate-600">
                              {dem.requester_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {dem.requester_unit}
                            </div>
                          </td>

                          {/* Mặt hàng cần mua */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{cat?.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Mã: <span className="font-mono">{cat?.code}</span> • Nhóm: {cat?.group}
                            </div>
                          </td>

                          {/* Số lượng */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-black text-sm text-emerald-800">
                              {dem.qty_needed}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {cat?.unit_of_measure}
                            </span>
                          </td>

                          {/* Đơn giá ước tính */}
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            {formatVND(dem.estimated_unit_price)}
                          </td>

                          {/* Thành tiền dự kiến */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatVND(estAmount)}
                          </td>

                          {/* Mức độ ưu tiên */}
                          <td className="py-3 px-4 text-center">
                            {dem.priority === 'KHAN_CAP' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                Khẩn cấp
                              </span>
                            )}
                            {dem.priority === 'CAO' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Cao
                              </span>
                            )}
                            {dem.priority === 'TRUNG_BINH' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                Trung bình
                              </span>
                            )}
                            {dem.priority === 'THAP' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                Thấp
                              </span>
                            )}
                          </td>

                          {/* Thao tác: Cho phép sinh PO riêng cho từng mặt hàng */}
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenSinglePOModal(dem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer whitespace-nowrap"
                              title="Sinh đơn PO riêng biệt cho mặt hàng này (không gom chung)"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                              Tạo PO riêng
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FLOATING CONSOLIDATION & SEPARATE PO ACTION BAR */}
          {selectedDemandIds.length > 0 && (
            <div className="sticky bottom-4 z-30 bg-emerald-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-500 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
                  {selectedDemandIds.length}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Đã chọn {selectedDemandIds.length} mặt hàng từ {selectedSourcesCount} nguồn yêu cầu</span>
                    {selectedDDCount > 0 && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-500 text-white">
                        {selectedDDCount} Định danh
                      </span>
                    )}
                    {selectedTHCount > 0 && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white">
                        {selectedTHCount} Tiêu hao
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-200 mt-0.5">
                    Tổng giá trị dự kiến: <strong className="text-white font-mono">{formatVND(totalSelectedEstAmount)}</strong>
                    {isMixedSelection && (
                      <span className="text-amber-300 ml-2 font-medium">
                        (⚠️ Gom gộp sẽ tự động tách thành 2 PO riêng biệt theo hình thức theo dõi)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => setSelectedDemandIds([])}
                  className="px-3 py-2 bg-emerald-900 hover:bg-emerald-800 rounded-xl text-xs font-semibold text-emerald-200 transition cursor-pointer"
                >
                  Bỏ chọn
                </button>

                {/* TÙY CHỌN 1: SINH PO RIÊNG BIỆT (Không gom chung) */}
                {selectedDemandIds.length === 1 ? (
                  <button
                    onClick={() => handleOpenSinglePOModal(selectedDemandsList[0])}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                    title="Sinh 1 PO riêng biệt cho mặt hàng duy nhất này"
                  >
                    <ShoppingCart className="w-4 h-4 text-blue-200" />
                    <span>Tạo PO Riêng Cho Mục Này</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenConsolidateAsSeparatePOs}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-400 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                    title="Tạo các đơn PO riêng biệt cho từng mặt hàng (không gom gộp)"
                  >
                    <ShoppingCart className="w-4 h-4 text-blue-300" />
                    <span>Sinh {selectedDemandIds.length} PO Riêng Từng Mục</span>
                  </button>
                )}

                {/* TÙY CHỌN 2: GOM PO HÀNG LOẠT */}
                <button
                  onClick={handleOpenConsolidateModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-black transition shadow-lg cursor-pointer"
                >
                  <Boxes className="w-4 h-4" />
                  <span>
                    {isMixedSelection
                      ? 'Gom vào PO Tổng (Tách 2 PO Định Danh & Tiêu Hao)'
                      : selectedDDCount > 0
                      ? 'Gom thành 1 PO Định Danh'
                      : 'Gom thành 1 PO Tiêu Hao'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DANH SÁCH ĐƠN HÀNG PO ĐÃ TẠO */}
      {/* ========================================================= */}
      {mainView === 'PO_LIST' && (
        <div className="space-y-4">
          {/* Filter Sub-Tabs & Actions Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-3 gap-3 text-xs font-bold">
            <div className="flex gap-3">
              {[
                { id: 'ALL', label: `Tất cả PO (${purchaseOrders.length})` },
                { id: 'DA_GUI', label: 'Chờ Thu mua tiếp nhận' },
                { id: 'DANG_MUA', label: 'Đang tiến hành mua hàng' },
                { id: 'HOAN_TAT', label: 'Đã hoàn tất / Đã nhập kho' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPoFilterTab(t.id as any)}
                  className={`pb-3 px-2 transition cursor-pointer border-b-2 ${
                    poFilterTab === t.id
                      ? 'border-emerald-700 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setIsCreateManualPOOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                title="Tạo đơn hàng PO riêng mới trực tiếp"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo PO riêng mới</span>
              </button>
              <button
                onClick={() => {
                  const exportData = filteredPOs.map((po, i) => ({
                    'STT': i + 1,
                    'Mã đơn PO': po.po_code,
                    'Hình thức theo dõi': po.tracking_type === 'DINH_DANH' ? 'Hàng Định Danh' : 'Hàng Tiêu Hao',
                    'Nguồn gốc': po.source,
                    'Số mặt hàng': po.lines.length,
                    'Nhà cung cấp': po.supplier_name || 'Chưa cập nhật',
                    'Kho nhận': warehouses.find((w) => w.warehouse_id === po.receiving_warehouse_id)?.name || '',
                    'Tổng chi phí': po.total_amount,
                    'Trạng thái': po.status,
                    'Ngày tạo': formatDateVN(po.created_at),
                  }));
                  exportTableToExcel(exportData, 'Danh_Sach_Don_Hang_PO_THACO_AGRI');
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          {/* PO Table */}
          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table id="po-table" className="w-full min-w-[950px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã đơn PO</th>
                    <th className="py-3 px-4">Hình thức theo dõi</th>
                    <th className="py-3 px-4">Nguồn gốc & Diễn giải</th>
                    <th className="py-3 px-4">Số lượng mặt hàng</th>
                    <th className="py-3 px-4">Nhà cung cấp</th>
                    <th className="py-3 px-4">Kho nhận</th>
                    <th className="py-3 px-4 text-right">Tổng chi phí thực tế</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        Không có đơn mua hàng nào trong danh mục này.
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map((po, idx) => {
                      const wh = warehouses.find((w) => w.warehouse_id === po.receiving_warehouse_id);
                      const isPendingProcure = po.status === 'DA_GUI_THU_MUA' || po.status === 'DANG_MUA';
                      const isDD = po.tracking_type === 'DINH_DANH';

                      return (
                        <tr key={po.po_id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">{po.po_code}</span>
                              {po.parent_po_id && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                  <GitBranch className="w-2.5 h-2.5" />
                                  PO Con
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatDateVN(po.created_at)}
                            </span>
                          </td>

                          {/* Hình thức theo dõi */}
                          <td className="py-3 px-4">
                            {isDD ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
                                <QrCode className="w-3 h-3 text-blue-700" />
                                Hàng Định Danh
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                <Boxes className="w-3 h-3 text-amber-700" />
                                Hàng Tiêu Hao
                              </span>
                            )}
                          </td>

                          {/* Nguồn gốc & Hình thức gom */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 mb-1">
                              {getSourceBadge(po.source)}
                            </div>
                            {po.aggregated_sources_summary ? (
                              <div className="text-[11px] font-semibold text-purple-900">
                                {po.aggregated_sources_summary}
                              </div>
                            ) : null}
                            <div className="text-[11px] text-slate-500 line-clamp-1">{po.note}</div>
                          </td>

                          {/* Số lượng mặt hàng */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">
                              {po.lines.length} mặt hàng
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Tổng SL đặt: {po.lines.reduce((s, l) => s + l.qty_ordered, 0)}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-800">
                            {po.supplier_name || <span className="text-slate-400 italic">Chưa chọn NCC</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{wh?.name}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {po.total_amount > 0 ? formatVND(po.total_amount) : '— Chờ cập nhật'}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(po.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedPO(po);
                                  setIsViewPODetailOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Chi tiết
                              </button>

                              {isPendingProcure && (currentUser.role === 'THU_MUA' || currentUser.role === 'QUAN_TRI') && (
                                <button
                                  onClick={() => handleOpenProcureModal(po)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Nghiệm thu
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: THỦ KHO TỰ TẠO NHU CẦU BỔ SUNG VÀO GOM PO */}
      {/* ========================================================= */}
      {mainView === 'MANUAL_DEMAND' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <WarehouseIcon className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Thủ Kho Chủ Động Lập Dự Trù / Bổ Sung Kho Thiếu Hụt
              </h3>
              <p className="text-xs text-slate-500">
                Nhu cầu này sẽ xuất hiện trong "Trung Tâm Gom PO" để bạn có thể gom mua riêng theo hình thức theo dõi tương ứng.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitManualDemand} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chọn mặt hàng vật tư / thiết bị cần bổ sung:
              </label>
              <select
                value={manualCatId}
                onChange={(e) => {
                  setManualCatId(e.target.value);
                  const cat = categories.find((c) => c.category_id === e.target.value);
                  if (cat) {
                    setManualUnitPrice(cat.tracking_type === 'DINH_DANH' ? 20000000 : 350000);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name} ({c.code}) • ĐVT: {c.unit_of_measure} • {c.tracking_type === 'DINH_DANH' ? '🏷️ Hàng Định danh' : '📦 Hàng Tiêu hao'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số lượng cần mua:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={manualQty}
                  onChange={(e) => setManualQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-sm focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn giá ước tính (VNĐ):
                </label>
                <input
                  type="number"
                  min={1000}
                  step={50000}
                  required
                  value={manualUnitPrice}
                  onChange={(e) => setManualUnitPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-sm focus:outline-emerald-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {formatVND(manualUnitPrice)} / ĐVT
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mức độ ưu tiên:
              </label>
              <select
                value={manualPriority}
                onChange={(e) => setManualPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
              >
                <option value="TRUNG_BINH">Trung bình (Kế hoạch định kỳ)</option>
                <option value="CAO">Ưu tiên cao (Sắp hết tồn kho an toàn)</option>
                <option value="KHAN_CAP">Khẩn cấp (Hết hàng ảnh hưởng sản xuất)</option>
                <option value="THAP">Thấp (Dự trù xa)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ghi chú lý do bổ sung kho:
              </label>
              <textarea
                rows={3}
                required
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Nêu rõ lý do cần bổ sung (ví dụ: Tồn kho chỉ còn 6 hộp mực, dự trù quý 4 cần tối thiểu 20 hộp...)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMainView('GOM_PO_HUB')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Đưa Vào Danh Sách Chờ Gom PO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XÁC NHẬN LẬP ĐƠN HÀNG PO GOM (Consolidation Dialog) */}
      {/* ========================================================= */}
      {isConsolidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Xác Nhận Gom {selectedDemandsList.length} Nhu Cầu Mua Sắm Thành PO
                </h3>
                <p className="text-xs text-emerald-200">
                  {isMixedSelection
                    ? `Phát hiện cả 2 hình thức: Sẽ tự động tách thành 1 PO Định Danh (${selectedDDCount} mặt hàng) và 1 PO Tiêu Hao (${selectedTHCount} mặt hàng)`
                    : selectedDDCount > 0
                    ? `Gom ${selectedDDCount} mặt hàng Hàng Định Danh (Serial/QR)`
                    : `Gom ${selectedTHCount} mặt hàng Hàng Tiêu Hao (Số lượng kho)`}
                </p>
              </div>
              <button onClick={() => setIsConsolidateModalOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmConsolidate} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Mixed notice */}
              {isMixedSelection && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                  <strong className="block mb-0.5">⚠️ Thông báo phân tách PO tự động (Mục 5.4.1):</strong>
                  Bạn đang chọn cả <strong>Hàng Định Danh</strong> (Laptop, máy móc...) và <strong>Hàng Tiêu Hao</strong> (Văn phòng phẩm, đồng phục...). Khi bấm xác nhận, hệ thống sẽ tự động tách thành <strong>2 Đơn hàng PO riêng biệt</strong> để đảm bảo quy trình nhập kho và quản lý vòng đời tài sản không bị sai lệch logic.
                </div>
              )}

              {/* Review Selected Items Table */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Danh mục các mặt hàng sẽ gom vào PO:
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Hình thức</th>
                        <th className="p-2">Nguồn phát sinh</th>
                        <th className="p-2">Mặt hàng</th>
                        <th className="p-2 text-center">SL</th>
                        <th className="p-2 text-right">Đơn giá ước tính</th>
                        <th className="p-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDemandsList.map((d) => {
                        const cat = categories.find((c) => c.category_id === d.category_id);
                        const isDD = cat?.tracking_type === 'DINH_DANH';

                        return (
                          <tr key={d.demand_id} className="hover:bg-slate-50">
                            <td className="p-2">
                              {isDD ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-900">
                                  Định danh
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900">
                                  Tiêu hao
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-[11px]">
                              <span className="font-bold text-slate-900">{d.source_code}</span>
                              <div className="text-[10px] text-slate-500">{d.requester_name}</div>
                            </td>
                            <td className="p-2">
                              <span className="font-semibold text-slate-900">{cat?.name}</span>
                              <div className="text-[10px] text-slate-400">{cat?.group}</div>
                            </td>
                            <td className="p-2 text-center font-bold font-mono">
                              {d.qty_needed} {cat?.unit_of_measure}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {formatVND(d.estimated_unit_price)}
                            </td>
                            <td className="p-2 text-right font-bold font-mono text-emerald-900">
                              {formatVND(d.qty_needed * (d.estimated_unit_price || 0))}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-emerald-50/70 font-bold">
                        <td colSpan={5} className="p-2 text-right text-emerald-900">
                          Tổng cộng chi phí ước tính:
                        </td>
                        <td className="p-2 text-right font-mono text-sm text-emerald-950 font-black">
                          {formatVND(totalSelectedEstAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Merge option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Tùy chọn hiển thị dòng đơn PO:</div>
                  <div className="text-[11px] text-slate-500">
                    {mergeSameCategory
                      ? 'Gộp các dòng cùng mặt hàng thành 1 dòng duy nhất (cộng dồn số lượng)'
                      : 'Giữ nguyên từng dòng riêng biệt kèm thông tin nguồn gốc để dễ theo dõi người yêu cầu'}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={mergeSameCategory}
                    onChange={(e) => setMergeSameCategory(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Gộp cùng loại</span>
                </label>
              </div>

              {/* Receiving Warehouse */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kho tiếp nhận hàng khi nhà cung cấp giao:
                </label>
                <select
                  value={consolidateWarehouseId}
                  onChange={(e) => setConsolidateWarehouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold text-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Supplier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Nhà cung cấp dự kiến:
                  </label>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    (Chọn từ danh bạ cấu hình)
                  </span>
                </div>
                <div className="space-y-2">
                  <select
                    value={suppliers.some((s) => s.name === consolidateSupplier) ? consolidateSupplier : (consolidateSupplier ? 'KHAC' : '')}
                    onChange={(e) => {
                      if (e.target.value === 'KHAC') {
                        setConsolidateSupplier('');
                      } else {
                        setConsolidateSupplier(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold text-slate-900"
                  >
                    <option value="">-- Chọn Nhà cung cấp có sẵn trong hệ thống --</option>
                    {suppliers
                      .filter((s) => s.status === 'ACTIVE')
                      .map((s) => (
                        <option key={s.supplier_id} value={s.name}>
                          {s.name} ({s.code} - MST: {s.tax_code || 'N/A'})
                        </option>
                      ))}
                    <option value="KHAC">+ Nhập tên Nhà cung cấp khác...</option>
                  </select>

                  <input
                    type="text"
                    value={consolidateSupplier}
                    onChange={(e) => setConsolidateSupplier(e.target.value)}
                    placeholder="Tên nhà cung cấp (tự động cập nhật khi chọn ở trên hoặc tự gõ)..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú đơn PO:
                </label>
                <textarea
                  rows={2}
                  value={consolidateNote}
                  onChange={(e) => setConsolidateNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConsolidateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4 text-amber-300" />
                  <span>
                    {isMixedSelection
                      ? 'Xác Nhận Tạo 2 Đơn Hàng PO (Định Danh + Tiêu Hao)'
                      : 'Xác Nhận Tạo Đơn Hàng PO'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG PO ĐÃ TẠO */}
      {/* ========================================================= */}
      {isViewPODetailOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base font-mono">
                    {selectedPO.po_code}
                  </h3>
                  {selectedPO.tracking_type === 'DINH_DANH' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      Hàng Định Danh
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Boxes className="w-3 h-3" />
                      Hàng Tiêu Hao
                    </span>
                  )}
                  {getSourceBadge(selectedPO.source)}
                  {getStatusBadge(selectedPO.status)}
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Ngày lập: {formatDateVN(selectedPO.created_at)} • Kho nhận: {warehouses.find((w) => w.warehouse_id === selectedPO.receiving_warehouse_id)?.name}
                </p>
              </div>
              <button onClick={() => setIsViewPODetailOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Nhà cung cấp:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {selectedPO.supplier_name || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Nhân viên thu mua phụ trách:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    Trần Thị Mai (Thu mua)
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] text-emerald-700 block">Tổng chi phí thực tế:</span>
                  <span className="font-bold text-emerald-950 font-mono text-sm">
                    {selectedPO.total_amount > 0 ? formatVND(selectedPO.total_amount) : 'Chờ nghiệm thu'}
                  </span>
                </div>
              </div>

              {selectedPO.note && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong>Ghi chú đơn hàng:</strong> {selectedPO.note}
                </div>
              )}

              {/* PO Lines Table with Origin Tags & Brand/Specs */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Chi tiết từng mặt hàng, Hãng sản xuất, Cấu hình và nguồn gốc gom đơn:
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">STT</th>
                        <th className="p-2">Tên hàng hóa</th>
                        {selectedPO.tracking_type === 'DINH_DANH' && (
                          <th className="p-2">Hãng & Cấu hình đặt mua</th>
                        )}
                        <th className="p-2">Nguồn phát sinh ban đầu</th>
                        <th className="p-2 text-center">SL Đặt</th>
                        <th className="p-2 text-center">SL Đã giao</th>
                        <th className="p-2 text-right">Đơn giá thực tế</th>
                        <th className="p-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPO.lines.map((line, idx) => {
                        const cat = categories.find((c) => c.category_id === line.category_id);
                        return (
                          <tr key={line.line_id} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2">
                              <span className="font-bold text-slate-900">{cat?.name}</span>
                              <div className="text-[10px] text-slate-400">
                                {line.tracking_type === 'DINH_DANH' ? '🏷️ Hàng Định Danh (Serial/QR)' : '📦 Hàng Tiêu Hao (Cộng tồn kho)'}
                              </div>
                            </td>
                            {selectedPO.tracking_type === 'DINH_DANH' && (
                              <td className="p-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                                    Hãng: {line.brand || cat?.supported_brands?.[0] || 'Tiêu chuẩn'}
                                  </span>
                                  {line.model_name && (
                                    <span className="font-bold text-slate-800 text-[11px]">
                                      {line.model_name}
                                    </span>
                                  )}
                                </div>
                                {line.specifications && (
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    {line.specifications}
                                  </div>
                                )}
                              </td>
                            )}
                            <td className="p-2">
                              {line.source_code ? (
                                <span className="font-mono font-bold text-slate-800 block text-[11px]">
                                  {line.source_code}
                                </span>
                              ) : null}
                              <span className="text-[10px] text-slate-500">
                                {line.source_name || (line.source_type === 'YEU_CAU_CBNV' ? 'Yêu cầu cấp phát' : line.source_type === 'TICKET_KY_THUAT' ? 'Ticket Kỹ thuật' : 'Bổ sung kho')}
                              </span>
                            </td>
                            <td className="p-2 text-center font-mono font-bold">
                              {line.qty_ordered} {cat?.unit_of_measure}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-emerald-800">
                              {line.qty_received}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {line.actual_unit_price > 0 ? formatVND(line.actual_unit_price) : formatVND(line.estimated_unit_price)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {line.amount > 0 ? formatVND(line.amount) : formatVND(line.qty_ordered * line.estimated_unit_price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsViewPODetailOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Đóng
                </button>
                {(selectedPO.status === 'DA_GUI_THU_MUA' || selectedPO.status === 'DANG_MUA') && 
                  (currentUser.role === 'THU_MUA' || currentUser.role === 'QUAN_TRI') && (
                  <button
                    onClick={() => {
                      setIsViewPODetailOpen(false);
                      handleOpenProcureModal(selectedPO);
                    }}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    Cập nhật giá mua & Nghiệm thu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THU MUA CẬP NHẬT GIÁ THỰC TẾ & XÁC NHẬN HOÀN TẤT */}
      {/* ========================================================= */}
      {isProcuringModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Cập Nhật Giá Mua Thực Tế & Nghiệm Thu PO {selectedPO.po_code} (Mục 5.4.2)
                </h3>
                <p className="text-xs text-emerald-200">
                  Vai trò: Nhân viên Thu mua • Kho tiếp nhận: {warehouses.find((w) => w.warehouse_id === selectedPO.receiving_warehouse_id)?.name}
                </p>
              </div>
              <button onClick={() => setIsProcuringModalOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProcure} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                <strong>Quy trình phân chia trách nhiệm:</strong> Nhân viên Thu mua cập nhật tên Nhà cung cấp, đơn giá thực tế theo hóa đơn VAT và số lượng bàn giao. Khi hoàn tất, hệ thống chuyển giao quyền sở hữu sang Thủ kho để nhập kho hoặc định danh thiết bị.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Nhà cung cấp thực tế (theo hóa đơn VAT): *
                </label>
                <div className="space-y-2">
                  <select
                    value={suppliers.some((s) => s.name === procureSupplier) ? procureSupplier : (procureSupplier ? 'KHAC' : '')}
                    onChange={(e) => {
                      if (e.target.value === 'KHAC') {
                        setProcureSupplier('');
                      } else {
                        setProcureSupplier(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold text-slate-900 text-xs"
                  >
                    <option value="">-- Chọn Nhà cung cấp từ danh bạ đã cấu hình --</option>
                    {suppliers
                      .filter((s) => s.status === 'ACTIVE')
                      .map((s) => (
                        <option key={s.supplier_id} value={s.name}>
                          {s.name} ({s.code} - MST: {s.tax_code || 'N/A'})
                        </option>
                      ))}
                    <option value="KHAC">+ Nhập tên Nhà cung cấp khác...</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={procureSupplier}
                    onChange={(e) => setProcureSupplier(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-semibold"
                    placeholder="Ví dụ: Công ty Cổ phần Công nghệ Phong Vũ..."
                  />
                </div>
              </div>

              {/* Line item price/qty/brand/specs update */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Xác nhận Hãng sản xuất, Cấu hình, Đơn giá thực tế & Số lượng giao nhận:
                </label>
                <div className="space-y-3">
                  {selectedPO.lines.map((l, idx) => {
                    const cat = categories.find((c) => c.category_id === l.category_id);
                    const stateLine = procureLines.find((pl) => pl.line_id === l.line_id);
                    const isDD = l.tracking_type === 'DINH_DANH';
                    const brandOptions = cat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG'];
                    const brandConfigs = (cat?.brand_configs || []).filter(
                      (cfg) => !stateLine?.brand || cfg.brand === stateLine.brand
                    );

                    return (
                      <div key={l.line_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {idx + 1}. {cat?.name} ({isDD ? 'Tài sản Định danh' : 'Vật tư Tiêu hao'})
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Số lượng đặt: <strong className="text-slate-800">{l.qty_ordered}</strong> {cat?.unit_of_measure}
                          </span>
                        </div>

                        {isDD && (
                          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[11px] font-bold text-blue-900 block mb-0.5">
                                  Chọn Hãng thu mua:
                                </label>
                                <select
                                  value={stateLine?.brand || ''}
                                  onChange={(e) => {
                                    const newBrand = e.target.value;
                                    const firstCfg = (cat?.brand_configs || []).find((c) => c.brand === newBrand);
                                    setProcureLines((prev) =>
                                      prev.map((pl) =>
                                        pl.line_id === l.line_id
                                          ? {
                                              ...pl,
                                              brand: newBrand,
                                              model_name: firstCfg ? firstCfg.model_name : pl.model_name,
                                              specifications: firstCfg ? firstCfg.specifications : pl.specifications,
                                              actual_unit_price: firstCfg?.estimated_price || pl.actual_unit_price,
                                            }
                                          : pl
                                      )
                                    );
                                  }}
                                  className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-bold text-blue-900 text-xs"
                                >
                                  {brandOptions.map((b) => (
                                    <option key={b} value={b}>
                                      Hãng {b}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-blue-900 block mb-0.5">
                                  Chọn Dòng máy & Cấu hình ({stateLine?.brand}):
                                </label>
                                <select
                                  value={stateLine?.model_name || ''}
                                  onChange={(e) => {
                                    const chosenModel = e.target.value;
                                    const foundCfg = (cat?.brand_configs || []).find((c) => c.model_name === chosenModel);
                                    setProcureLines((prev) =>
                                      prev.map((pl) =>
                                        pl.line_id === l.line_id
                                          ? {
                                              ...pl,
                                              model_name: chosenModel,
                                              specifications: foundCfg ? foundCfg.specifications : pl.specifications,
                                              actual_unit_price: foundCfg?.estimated_price || pl.actual_unit_price,
                                            }
                                          : pl
                                      )
                                    );
                                  }}
                                  className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-semibold text-slate-800 text-xs"
                                >
                                  {brandConfigs.map((cfg) => (
                                    <option key={cfg.model_name} value={cfg.model_name}>
                                      {cfg.model_name} — ({cfg.specifications})
                                    </option>
                                  ))}
                                  <option value={stateLine?.model_name || ''}>{stateLine?.model_name || 'Tùy chỉnh'}</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                                Thông số cấu hình chi tiết trên hóa đơn / PO:
                              </label>
                              <input
                                type="text"
                                value={stateLine?.specifications || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProcureLines((prev) =>
                                    prev.map((pl) =>
                                      pl.line_id === l.line_id ? { ...pl, specifications: val } : pl
                                    )
                                  );
                                }}
                                placeholder="VD: Core i5-1235U, RAM 16GB, SSD 512GB NVMe..."
                                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-medium"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-slate-500 block mb-0.5">
                              Đơn giá thực tế (VNĐ/ĐVT):
                            </label>
                            <input
                              type="number"
                              min={1000}
                              step={50000}
                              value={stateLine?.actual_unit_price || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProcureLines((prev) =>
                                  prev.map((pl) =>
                                    pl.line_id === l.line_id ? { ...pl, actual_unit_price: val } : pl
                                  )
                                );
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 block mb-0.5">
                              Số lượng thực tế giao nhận:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={l.qty_ordered}
                              value={stateLine?.qty_received || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProcureLines((prev) =>
                                  prev.map((pl) =>
                                    pl.line_id === l.line_id ? { ...pl, qty_received: val } : pl
                                  )
                                );
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Partial delivery split notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPartialDelivery}
                    onChange={(e) => setIsPartialDelivery(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  Xác nhận: Nhà cung cấp giao hàng thiếu một phần
                </label>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Theo quy định mục 5.4.2: Nếu giao thiếu, hệ thống sẽ chuyển số lượng đã nhận sang Kho, đồng thời <strong className="underline">tự động sinh ra 1 PO con</strong> kế thừa các dòng vật tư mua thiếu để tiếp tục theo dõi!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProcuringModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  Hoàn thành trách nhiệm Thu mua & Chuyển sang Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SINH ĐƠN HÀNG PO RIÊNG BIỆT CHO 1 MẶT HÀNG / NHU CẦU */}
      {/* ========================================================= */}
      {isSinglePOModalOpen && targetSingleDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-300" />
                  Sinh Đơn Hàng PO Riêng Biệt (Chọn Hãng & Cấu Hình)
                </h3>
                <p className="text-xs text-blue-200">
                  Tạo đơn mua sắm độc lập cho mặt hàng từ nguồn {targetSingleDemand.source_code}
                </p>
              </div>
              <button
                onClick={() => setIsSinglePOModalOpen(false)}
                className="text-blue-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSinglePO} className="p-6 space-y-4 text-xs">
              {/* Demand Info Box + Brand/Config Selector for DINH_DANH */}
              {(() => {
                const cat = categories.find((c) => c.category_id === targetSingleDemand.category_id);
                const isDD = cat?.tracking_type === 'DINH_DANH';
                const unitPrice = singlePOPrice || targetSingleDemand.estimated_unit_price || 0;
                const estTotal = targetSingleDemand.qty_needed * unitPrice;
                const brandList = cat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG'];
                const brandConfigs = (cat?.brand_configs || []).filter((c) => !singlePOBrand || c.brand === singlePOBrand);

                return (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{cat?.name}</span>
                        {isDD ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-blue-700" />
                            Hàng Định Danh (Serial/QR)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Boxes className="w-3 h-3 text-amber-700" />
                            Hàng Tiêu Hao (Số lượng)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>Nguồn phát sinh: <strong className="text-slate-800 font-mono">{targetSingleDemand.source_code}</strong></div>
                        <div>Người đề xuất: <strong className="text-slate-800">{targetSingleDemand.requester_name}</strong></div>
                        <div>Số lượng cần mua: <strong className="text-emerald-800 font-mono text-sm">{targetSingleDemand.qty_needed}</strong> {cat?.unit_of_measure}</div>
                        <div>Thành tiền dự kiến: <strong className="text-emerald-800 font-mono text-sm">{formatVND(estTotal)}</strong></div>
                      </div>
                    </div>

                    {isDD && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                        <div className="font-bold text-blue-950 text-xs">
                          Chỉ định Hãng sản xuất & Cấu hình đặt mua cho {cat?.name}:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {brandList.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                setSinglePOBrand(b);
                                const firstCfg = (cat?.brand_configs || []).find((c) => c.brand === b);
                                if (firstCfg) {
                                  setSinglePOModel(firstCfg.model_name);
                                  setSinglePOSpecs(firstCfg.specifications);
                                  if (firstCfg.estimated_price) setSinglePOPrice(firstCfg.estimated_price);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                singlePOBrand === b
                                  ? 'bg-blue-700 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>

                        {brandConfigs.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-semibold text-blue-900 mb-0.5">
                              Chọn dòng máy & cấu hình chuẩn ({singlePOBrand}):
                            </label>
                            <select
                              value={singlePOModel}
                              onChange={(e) => {
                                const m = e.target.value;
                                setSinglePOModel(m);
                                const found = brandConfigs.find((c) => c.model_name === m);
                                if (found) {
                                  setSinglePOSpecs(found.specifications);
                                  if (found.estimated_price) setSinglePOPrice(found.estimated_price);
                                }
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg p-2 font-semibold text-slate-800"
                            >
                              {brandConfigs.map((cfg) => (
                                <option key={cfg.model_name} value={cfg.model_name}>
                                  {cfg.model_name} — {cfg.specifications} ({formatVND(cfg.estimated_price || 0)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Cấu hình chi tiết ghi trên PO:
                          </label>
                          <input
                            type="text"
                            value={singlePOSpecs}
                            onChange={(e) => setSinglePOSpecs(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kho tiếp nhận hàng hóa:
                </label>
                <select
                  value={singlePOWarehouseId}
                  onChange={(e) => setSinglePOWarehouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-blue-600 font-semibold text-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhà cung cấp dự kiến: *
                </label>
                <div className="space-y-2">
                  <select
                    value={suppliers.some((s) => s.name === singlePOSupplier) ? singlePOSupplier : (singlePOSupplier ? 'KHAC' : '')}
                    onChange={(e) => {
                      if (e.target.value === 'KHAC') {
                        setSinglePOSupplier('');
                      } else {
                        setSinglePOSupplier(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-blue-600 font-semibold text-slate-900 text-xs"
                  >
                    <option value="">-- Chọn Nhà cung cấp có sẵn --</option>
                    {suppliers
                      .filter((s) => s.status === 'ACTIVE')
                      .map((s) => (
                        <option key={s.supplier_id} value={s.name}>
                          {s.name} ({s.code} - MST: {s.tax_code || 'N/A'})
                        </option>
                      ))}
                    <option value="KHAC">+ Nhập tên Nhà cung cấp khác...</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={singlePOSupplier}
                    onChange={(e) => setSinglePOSupplier(e.target.value)}
                    placeholder="Tên nhà cung cấp (chọn ở trên hoặc tự gõ)..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:outline-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú đơn hàng PO:
                </label>
                <textarea
                  rows={2}
                  value={singlePONote}
                  onChange={(e) => setSinglePONote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSinglePOModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Xác Nhận Sinh PO Riêng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TẠO ĐƠN HÀNG PO MỚI (RIÊNG LẺ / THỦ CÔNG) */}
      {/* ========================================================= */}
      {isCreateManualPOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-300" />
                  Lập Đơn Hàng PO Mới (Chọn Hãng & Cấu Hình Chi Tiết)
                </h3>
                <p className="text-xs text-emerald-200">
                  Dành cho bộ phận Thu mua chủ động tạo đơn PO riêng trực tiếp với nhà cung cấp
                </p>
              </div>
              <button
                onClick={() => setIsCreateManualPOOpen(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmManualPO} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Tracking type selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hình thức theo dõi đơn hàng (Mục 5.4.1 - Phải tách biệt hoàn toàn):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setManualPOTrackingType('DINH_DANH');
                      const firstDD = categories.find((c) => c.tracking_type === 'DINH_DANH');
                      const firstCfg = firstDD?.brand_configs?.[0];
                      if (firstDD) {
                        setManualPOLines([
                          {
                            category_id: firstDD.category_id,
                            brand: firstCfg?.brand || firstDD.supported_brands?.[0] || 'Dell',
                            model_name: firstCfg?.model_name || '',
                            specifications: firstCfg?.specifications || '',
                            qty: 1,
                            unit_price: firstCfg?.estimated_price || firstDD.estimated_unit_price || 21500000,
                          },
                        ]);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-left font-bold transition cursor-pointer ${
                      manualPOTrackingType === 'DINH_DANH'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <QrCode className="w-4 h-4 text-blue-700" />
                      <span>PO Hàng Định Danh (Serial/QR)</span>
                    </div>
                    <span className="text-[11px] font-normal block text-slate-500">
                      Tài sản cần chọn Hãng, Cấu hình, cấp Serial, mã QR (Laptop, PC, Máy in...)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualPOTrackingType('TIEU_HAO');
                      const firstTH = categories.find((c) => c.tracking_type === 'TIEU_HAO');
                      if (firstTH) {
                        setManualPOLines([{ category_id: firstTH.category_id, qty: 10, unit_price: 350000 }]);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-left font-bold transition cursor-pointer ${
                      manualPOTrackingType === 'TIEU_HAO'
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Boxes className="w-4 h-4 text-amber-700" />
                      <span>PO Hàng Tiêu Hao (Số lượng)</span>
                    </div>
                    <span className="text-[11px] font-normal block text-slate-500">
                      Vật tư chỉ theo dõi số lượng tồn kho và ĐVT (Mực in, giấy, đồng phục...)
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kho tiếp nhận hàng:
                  </label>
                  <select
                    value={manualPOWarehouseId}
                    onChange={(e) => setManualPOWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold"
                  >
                    {warehouses.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhà cung cấp: *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={suppliers.some((s) => s.name === manualPOSupplier) ? manualPOSupplier : (manualPOSupplier ? 'KHAC' : '')}
                      onChange={(e) => {
                        if (e.target.value === 'KHAC') {
                          setManualPOSupplier('');
                        } else {
                          setManualPOSupplier(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold text-xs text-slate-900"
                    >
                      <option value="">-- Chọn Nhà cung cấp đã cấu hình --</option>
                      {suppliers
                        .filter((s) => s.status === 'ACTIVE')
                        .map((s) => (
                          <option key={s.supplier_id} value={s.name}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      <option value="KHAC">+ Nhập tên khác...</option>
                    </select>

                    <input
                      type="text"
                      required
                      value={manualPOSupplier}
                      onChange={(e) => setManualPOSupplier(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:outline-emerald-600 font-medium"
                      placeholder="Tên Nhà cung cấp..."
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Items Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">
                    Danh sách mặt hàng ({manualPOTrackingType === 'DINH_DANH' ? 'Chọn Tên hàng hóa → Hãng → Cấu hình' : 'Hàng Tiêu Hao'}):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const availCats = categories.filter((c) => c.tracking_type === manualPOTrackingType);
                      const pick = availCats[0] || categories[0];
                      const firstCfg = pick.brand_configs?.[0];
                      setManualPOLines((prev) => [
                        ...prev,
                        {
                          category_id: pick.category_id,
                          brand: manualPOTrackingType === 'DINH_DANH' ? (firstCfg?.brand || pick.supported_brands?.[0] || 'Dell') : undefined,
                          model_name: manualPOTrackingType === 'DINH_DANH' ? (firstCfg?.model_name || '') : undefined,
                          specifications: manualPOTrackingType === 'DINH_DANH' ? (firstCfg?.specifications || '') : undefined,
                          qty: manualPOTrackingType === 'DINH_DANH' ? 1 : 10,
                          unit_price: firstCfg?.estimated_price || pick.estimated_unit_price || (manualPOTrackingType === 'DINH_DANH' ? 20000000 : 350000),
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm mặt hàng
                  </button>
                </div>

                <div className="space-y-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {manualPOLines.map((line, idx) => {
                    const availCats = categories.filter((c) => c.tracking_type === manualPOTrackingType);
                    const selectedCat = categories.find((c) => c.category_id === line.category_id);
                    const brandOptions = selectedCat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG'];
                    const brandConfigs = (selectedCat?.brand_configs || []).filter(
                      (cfg) => !line.brand || cfg.brand === line.brand
                    );

                    return (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tên hàng hóa:</label>
                            <select
                              value={line.category_id}
                              onChange={(e) => {
                                const val = e.target.value;
                                const c = categories.find((cat) => cat.category_id === val);
                                const firstCfg = c?.brand_configs?.[0];
                                setManualPOLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          category_id: val,
                                          brand: c?.tracking_type === 'DINH_DANH' ? (firstCfg?.brand || c.supported_brands?.[0] || 'Dell') : undefined,
                                          model_name: c?.tracking_type === 'DINH_DANH' ? (firstCfg?.model_name || '') : undefined,
                                          specifications: c?.tracking_type === 'DINH_DANH' ? (firstCfg?.specifications || '') : undefined,
                                          unit_price: firstCfg?.estimated_price || c?.estimated_unit_price || (c?.tracking_type === 'DINH_DANH' ? 20000000 : 350000),
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-slate-900"
                            >
                              {availCats.map((c) => (
                                <option key={c.category_id} value={c.category_id}>
                                  {c.name} ({c.code}) - {c.unit_of_measure}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-20">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Số lượng:</label>
                            <input
                              type="number"
                              min={1}
                              value={line.qty}
                              onChange={(e) => {
                                const v = Math.max(1, Number(e.target.value));
                                setManualPOLines((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, qty: v } : item))
                                );
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold"
                              placeholder="SL"
                            />
                          </div>

                          <div className="w-32">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Đơn giá (VND):</label>
                            <input
                              type="number"
                              min={1000}
                              step={50000}
                              value={line.unit_price}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setManualPOLines((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, unit_price: v } : item))
                                );
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-right font-mono font-bold"
                              placeholder="Đơn giá"
                            />
                          </div>

                          {manualPOLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setManualPOLines((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer mt-4"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {manualPOTrackingType === 'DINH_DANH' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                            <div>
                              <label className="text-[10px] font-bold text-blue-900 block mb-0.5">Hãng sản xuất:</label>
                              <select
                                value={line.brand || ''}
                                onChange={(e) => {
                                  const newBrand = e.target.value;
                                  const firstCfg = (selectedCat?.brand_configs || []).find((c) => c.brand === newBrand);
                                  setManualPOLines((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            brand: newBrand,
                                            model_name: firstCfg ? firstCfg.model_name : item.model_name,
                                            specifications: firstCfg ? firstCfg.specifications : item.specifications,
                                            unit_price: firstCfg?.estimated_price || item.unit_price,
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-bold text-blue-900 text-xs"
                              >
                                {brandOptions.map((b) => (
                                  <option key={b} value={b}>
                                    Hãng {b}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-blue-900 block mb-0.5">
                                Chọn Dòng máy & Cấu hình chuẩn ({line.brand}):
                              </label>
                              <select
                                value={line.model_name || ''}
                                onChange={(e) => {
                                  const m = e.target.value;
                                  const foundCfg = (selectedCat?.brand_configs || []).find((c) => c.model_name === m);
                                  setManualPOLines((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            model_name: m,
                                            specifications: foundCfg ? foundCfg.specifications : item.specifications,
                                            unit_price: foundCfg?.estimated_price || item.unit_price,
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-semibold text-slate-800 text-xs"
                              >
                                {brandConfigs.map((cfg) => (
                                  <option key={cfg.model_name} value={cfg.model_name}>
                                    {cfg.model_name} — {cfg.specifications}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                value={line.specifications || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setManualPOLines((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, specifications: val } : item))
                                  );
                                }}
                                placeholder="Cấu hình chi tiết..."
                                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="text-right font-bold text-xs pt-1 text-slate-700">
                    Tổng chi phí dự kiến: <span className="font-mono text-emerald-800 text-sm">{formatVND(manualPOLines.reduce((sum, l) => sum + (l.qty * l.unit_price), 0))}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú đơn PO:
                </label>
                <textarea
                  rows={2}
                  value={manualPONote}
                  onChange={(e) => setManualPONote(e.target.value)}
                  placeholder="Ghi chú nội dung mua sắm, số hợp đồng hoặc văn bản căn cứ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateManualPOOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Đơn Hàng PO Riêng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
