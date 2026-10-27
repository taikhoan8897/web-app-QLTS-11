import React, { useState } from 'react';
import { 
  Box, 
  Plus, 
  QrCode, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Send, 
  Package, 
  Upload, 
  Download,
  Calendar,
  Layers,
  User,
  Building2,
  FileText,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Asset, Category, PurchaseOrder, Employee, TrackingType } from '../../types';
import { formatVND, formatDateVN, exportTableToExcel } from '../../utils/excelExporter';

interface AssetManagementViewProps {
  onOpenAssetProfile: (asset: Asset) => void;
  onOpenTemplates: (type: any, data?: any) => void;
}

export const AssetManagementView: React.FC<AssetManagementViewProps> = ({
  onOpenAssetProfile,
  onOpenTemplates,
}) => {
  const { 
    categories, 
    assets, 
    stockBalances, 
    purchaseOrders, 
    selectedWarehouseId, 
    warehouses, 
    employees, 
    currentUser,
    issueAssetDirect,
    issueConsumableDirect,
    recallAsset,
    liquidateAsset,
    identifyPOAssets,
    createManualAsset,
    updateAssetDetails,
    receivePOConsumable,
    addCategory,
    updateCategory
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'SERIALIZED' | 'CONSUMABLE' | 'PENDING_IDENTIFICATION' | 'PENDING_RECEIVE_PO' | 'CATEGORIES' | 'MY_ASSIGNED_ASSETS'
  >(currentUser.role === 'CBNV' ? 'MY_ASSIGNED_ASSETS' : 'SERIALIZED');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  // Modal States
  const [allocatingAsset, setAllocatingAsset] = useState<Asset | null>(null);
  const [recallingAsset, setRecallingAsset] = useState<Asset | null>(null);
  const [liquidatingAsset, setLiquidatingAsset] = useState<Asset | null>(null);
  const [identifyingPO, setIdentifyingPO] = useState<PurchaseOrder | null>(null);
  const [receivingConsumablePO, setReceivingConsumablePO] = useState<PurchaseOrder | null>(null);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isDirectConsumableOpen, setIsDirectConsumableOpen] = useState(false);
  const [isManualAssetOpen, setIsManualAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form states for Manual Asset Declaration (Chọn Tên hàng hóa -> Chọn Hãng -> Chọn Cấu hình)
  const [manualCatId, setManualCatId] = useState('CAT-01');
  const [manualBrand, setManualBrand] = useState('Dell');
  const [manualModelName, setManualModelName] = useState('Dell Latitude 5430');
  const [manualSpecs, setManualSpecs] = useState('Core i5-1235U, RAM 16GB DDR4, SSD 512GB NVMe, 14" FHD IPS');
  const [manualSerial, setManualSerial] = useState(`SN-LP-${Date.now().toString().slice(-5)}`);
  const [manualCost, setManualCost] = useState(21500000);
  const [manualWarrantyTo, setManualWarrantyTo] = useState('2028-10-25');
  const [manualLocation, setManualLocation] = useState('Kệ A1 - Kho IT Trung tâm');

  // Form states for Edit Asset Brand & Configuration
  const [editAstBrand, setEditAstBrand] = useState('');
  const [editAstModel, setEditAstModel] = useState('');
  const [editAstSpecs, setEditAstSpecs] = useState('');
  const [editAstSerial, setEditAstSerial] = useState('');
  const [editAstLocation, setEditAstLocation] = useState('');
  const [editAstCost, setEditAstCost] = useState(0);

  // Form states for Allocate Asset
  const [allocRecipientId, setAllocRecipientId] = useState('EMP-004');
  const [allocLocation, setAllocLocation] = useState('Phòng Kế toán - Tầng 2');
  const [allocNote, setAllocNote] = useState('');

  // Form states for Recall Asset
  const [recallReturnerId, setRecallReturnerId] = useState('EMP-004');
  const [recallReason, setRecallReason] = useState('Chuyển công tác / Thu hồi thiết bị cũ');
  const [recallCondition, setRecallCondition] = useState('Thiết bị hoạt động bình thường, đầy đủ phụ kiện');

  // Form states for Liquidate Asset
  const [liquidateReason, setLiquidateReason] = useState('Hư hỏng linh kiện không thể khắc phục, hết hạn khấu hao');
  const [liquidateAmount, setLiquidateAmount] = useState(1500000);
  const [liquidateDocNote, setLiquidateDocNote] = useState('Biên bản họp Hội đồng Thanh lý THACO AGRI số 08/BB-TL');

  // Form states for PO Identification (UI05)
  const [identDeclarations, setIdentDeclarations] = useState<
    {
      category_id: string;
      brand: string;
      model_name: string;
      serial_no: string;
      specifications: string;
      warranty_from: string;
      warranty_to: string;
      purchase_cost: number;
      location: string;
    }[]
  >([]);

  // Form states for Consumable Receive (UI04)
  const [receiveLines, setReceiveLines] = useState<{ line_id: string; qty_received: number }[]>([]);

  // Form states for New Category (UI02)
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<Category['group']>('Thiết bị tin học');
  const [newCatTracking, setNewCatTracking] = useState<Category['tracking_type']>('DINH_DANH');
  const [newCatUom, setNewCatUom] = useState('Cái');
  const [newCatMinStock, setNewCatMinStock] = useState(5);
  const [newCatPrefix, setNewCatPrefix] = useState('AST');

  // Form states for Edit Category (Sửa danh mục)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatGroup, setEditCatGroup] = useState<Category['group']>('Thiết bị tin học');
  const [editCatTracking, setEditCatTracking] = useState<TrackingType>('DINH_DANH');
  const [editCatUom, setEditCatUom] = useState('');
  const [editCatMinStock, setEditCatMinStock] = useState<number>(0);
  const [editCatPrefix, setEditCatPrefix] = useState('');
  const [editCatEstPrice, setEditCatEstPrice] = useState<number>(0);
  const [editCatStatus, setEditCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Direct Consumable Issue
  const [issueCatId, setIssueCatId] = useState('CAT-07');
  const [issueQty, setIssueQty] = useState(5);
  const [issueEmpId, setIssueEmpId] = useState('EMP-004');

  const currentWh = warehouses.find((w) => w.warehouse_id === selectedWarehouseId);

  // Available brands for filter bar (based on selected category or all DINH_DANH categories)
  const availableBrandsForFilter = Array.from(
    new Set([
      ...categories
        .filter((c) => c.tracking_type === 'DINH_DANH' && (categoryFilter === 'ALL' || c.category_id === categoryFilter))
        .flatMap((c) => c.supported_brands || []),
      ...assets
        .filter((a) => a.warehouse_id === selectedWarehouseId && (categoryFilter === 'ALL' || a.category_id === categoryFilter))
        .map((a) => a.brand)
        .filter((b): b is string => !!b),
    ])
  );

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (a.warehouse_id !== selectedWarehouseId) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && a.category_id !== categoryFilter) return false;
    if (brandFilter !== 'ALL' && (a.brand || '') !== brandFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCode = a.asset_code.toLowerCase().includes(q);
      const matchSerial = (a.serial_no || '').toLowerCase().includes(q);
      const matchBrand = (a.brand || '').toLowerCase().includes(q);
      const matchModel = (a.model_name || '').toLowerCase().includes(q);
      const matchSpecs = (a.specifications || '').toLowerCase().includes(q);
      const cat = categories.find((c) => c.category_id === a.category_id);
      const matchName = (cat?.name || '').toLowerCase().includes(q);
      if (!matchCode && !matchSerial && !matchName && !matchBrand && !matchModel && !matchSpecs) return false;
    }
    return true;
  });

  // Handle opening Manual Asset modal with category defaults
  const handleOpenManualAssetModal = (defaultCatId?: string) => {
    const targetCatId = defaultCatId || (categoryFilter !== 'ALL' ? categoryFilter : 'CAT-01');
    const cat = categories.find((c) => c.category_id === targetCatId) || categories.find((c) => c.tracking_type === 'DINH_DANH');
    const firstConfig = cat?.brand_configs?.[0];
    const firstBrand = firstConfig?.brand || cat?.supported_brands?.[0] || 'Dell';
    setManualCatId(cat?.category_id || 'CAT-01');
    setManualBrand(firstBrand);
    setManualModelName(firstConfig?.model_name || '');
    setManualSpecs(firstConfig?.specifications || '');
    setManualCost(firstConfig?.estimated_price || cat?.estimated_unit_price || 15000000);
    setManualSerial(`SN-${cat?.prefix || 'AST'}-${Date.now().toString().slice(-5)}`);
    setManualLocation(`Kệ A1 - ${currentWh?.name || 'Kho Trung tâm'}`);
    setIsManualAssetOpen(true);
  };

  const handleManualCategoryChange = (newCatId: string) => {
    setManualCatId(newCatId);
    const cat = categories.find((c) => c.category_id === newCatId);
    const firstConfig = cat?.brand_configs?.[0];
    const firstBrand = firstConfig?.brand || cat?.supported_brands?.[0] || '';
    setManualBrand(firstBrand);
    setManualModelName(firstConfig?.model_name || '');
    setManualSpecs(firstConfig?.specifications || '');
    setManualCost(firstConfig?.estimated_price || cat?.estimated_unit_price || 10000000);
    setManualSerial(`SN-${cat?.prefix || 'AST'}-${Date.now().toString().slice(-5)}`);
  };

  const handleManualBrandChange = (newBrand: string) => {
    setManualBrand(newBrand);
    const cat = categories.find((c) => c.category_id === manualCatId);
    const brandCfgs = (cat?.brand_configs || []).filter((cfg) => cfg.brand === newBrand);
    if (brandCfgs.length > 0) {
      setManualModelName(brandCfgs[0].model_name);
      setManualSpecs(brandCfgs[0].specifications);
      if (brandCfgs[0].estimated_price) setManualCost(brandCfgs[0].estimated_price);
    } else {
      setManualModelName('');
      setManualSpecs('');
    }
  };

  const handleSubmitManualAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBrand.trim() || !manualSpecs.trim() || !manualSerial.trim()) {
      alert('Vui lòng chọn/nhập đầy đủ Hãng sản xuất, Cấu hình chi tiết và Số Serial!');
      return;
    }
    const res = createManualAsset({
      category_id: manualCatId,
      warehouse_id: selectedWarehouseId,
      brand: manualBrand.trim(),
      model_name: manualModelName.trim() || `${manualBrand.trim()} Standard`,
      specifications: manualSpecs.trim(),
      serial_no: manualSerial.trim(),
      purchase_cost: Number(manualCost) || 0,
      warranty_from: new Date().toISOString().slice(0, 10),
      warranty_to: manualWarrantyTo,
      location: manualLocation.trim(),
    });
    if (res.success) {
      alert(res.message);
      setIsManualAssetOpen(false);
    }
  };

  const handleOpenEditAsset = (ast: Asset) => {
    setEditingAsset(ast);
    setEditAstBrand(ast.brand || '');
    setEditAstModel(ast.model_name || '');
    setEditAstSpecs(ast.specifications || '');
    setEditAstSerial(ast.serial_no || '');
    setEditAstLocation(ast.location || '');
    setEditAstCost(ast.purchase_cost || 0);
  };

  const handleSaveEditAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const res = updateAssetDetails(editingAsset.asset_id, {
      brand: editAstBrand.trim(),
      model_name: editAstModel.trim(),
      specifications: editAstSpecs.trim(),
      serial_no: editAstSerial.trim(),
      location: editAstLocation.trim(),
      purchase_cost: Number(editAstCost) || editingAsset.purchase_cost,
    });
    if (res.success) {
      alert(res.message);
      setEditingAsset(null);
    }
  };

  // Filtered Consumables
  const consumableCategories = categories.filter((c) => c.tracking_type === 'TIEU_HAO');

  // POs pending identification (UI05)
  const pendingIdentifyPOs = purchaseOrders.filter(
    (p) =>
      p.receiving_warehouse_id === selectedWarehouseId &&
      p.tracking_type === 'DINH_DANH' &&
      (p.status === 'MUA_HANG_HOAN_TAT' || p.status === 'HOAN_TAT_MOT_PHAN')
  );

  // POs pending consumable receive (UI04)
  const pendingReceivePOs = purchaseOrders.filter(
    (p) =>
      p.receiving_warehouse_id === selectedWarehouseId &&
      p.tracking_type === 'TIEU_HAO' &&
      p.status === 'CHO_NHAP_KHO'
  );

  // Open PO Identification Modal (UI05)
  const handleOpenIdentifyModal = (po: PurchaseOrder) => {
    setIdentifyingPO(po);
    const initialDecls: typeof identDeclarations = [];
    po.lines.forEach((l) => {
      const unindentified = l.qty_received - l.qty_identified;
      const cat = categories.find((c) => c.category_id === l.category_id);
      const defaultCfg = cat?.brand_configs?.[0];
      const lineBrand = l.brand || defaultCfg?.brand || cat?.supported_brands?.[0] || 'Dell';
      const lineModel = l.model_name || defaultCfg?.model_name || cat?.name || '';
      const lineSpecs =
        l.specifications ||
        defaultCfg?.specifications ||
        `Cấu hình tiêu chuẩn (${l.actual_unit_price > 0 ? formatVND(l.actual_unit_price) : 'Từ PO'})`;
      for (let i = 0; i < unindentified; i++) {
        initialDecls.push({
          category_id: l.category_id,
          brand: lineBrand,
          model_name: lineModel,
          serial_no: `SN-${cat?.prefix || 'AST'}-${Date.now().toString().slice(-4)}${i + 1}`,
          specifications: lineSpecs,
          warranty_from: new Date().toISOString().slice(0, 10),
          warranty_to: new Date(Date.now() + 365 * 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          purchase_cost: l.actual_unit_price || l.estimated_unit_price,
          location: `Kệ A1 - ${currentWh?.name}`,
        });
      }
    });
    setIdentDeclarations(initialDecls);
  };

  // Submit PO Identification
  const handleSubmitIdentify = () => {
    if (!identifyingPO) return;
    if (identDeclarations.length === 0) {
      alert('Chưa có thiết bị nào được khai báo!');
      return;
    }
    const res = identifyPOAssets(identifyingPO.po_id, selectedWarehouseId, identDeclarations);
    if (res.success) {
      alert(res.message);
      setIdentifyingPO(null);
    }
  };

  // Open Consumable Receive Modal (UI04)
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setReceivingConsumablePO(po);
    setReceiveLines(
      po.lines.map((l) => ({
        line_id: l.line_id,
        qty_received: l.qty_received || l.qty_ordered,
      }))
    );
  };

  // Submit Consumable Receive
  const handleSubmitReceive = () => {
    if (!receivingConsumablePO) return;
    const res = receivePOConsumable(receivingConsumablePO.po_id, selectedWarehouseId, receiveLines);
    if (res.success) {
      alert(res.message);
      setReceivingConsumablePO(null);
    }
  };

  // Submit Allocate Serialized Asset (Mục 5.2.3)
  const handleConfirmAllocate = () => {
    if (!allocatingAsset) return;
    const res = issueAssetDirect(allocatingAsset.asset_id, allocRecipientId, allocLocation, allocNote);
    if (res.success) {
      alert(res.message);
      const recipient = employees.find((e) => e.employee_id === allocRecipientId);
      const cat = categories.find((c) => c.category_id === allocatingAsset.category_id);
      const fullAssetLabel = [
        cat?.name,
        allocatingAsset.brand ? `Hãng ${allocatingAsset.brand}` : '',
        allocatingAsset.model_name ? `(${allocatingAsset.model_name})` : '',
        allocatingAsset.specifications ? `- Cấu hình: ${allocatingAsset.specifications}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      onOpenTemplates('BIEN_BAN_BAN_GIAO', {
        assetName: fullAssetLabel,
        assetCode: allocatingAsset.asset_code,
        serialNo: allocatingAsset.serial_no,
        recipientName: recipient?.full_name,
        recipientCode: recipient?.employee_code,
        departmentName: 'Phòng ban người nhận',
        senderName: currentUser.full_name,
        condition: `Bàn giao thiết bị ${allocatingAsset.brand || ''} ${allocatingAsset.model_name || ''} (${allocatingAsset.specifications || 'Đầy đủ phụ kiện'}) hoạt động tốt`,
      });
      setAllocatingAsset(null);
    }
  };

  // Submit Recall Asset (Mục 5.2.5)
  const handleConfirmRecall = () => {
    if (!recallingAsset) return;
    const res = recallAsset(recallingAsset.asset_id, recallReturnerId, recallReason, recallCondition);
    if (res.success) {
      alert(res.message);
      const returner = employees.find((e) => e.employee_id === recallReturnerId);
      onOpenTemplates('BIEN_BAN_THU_HOI', {
        assetName: categories.find((c) => c.category_id === recallingAsset.category_id)?.name,
        assetCode: recallingAsset.asset_code,
        serialNo: recallingAsset.serial_no,
        returnerName: returner?.full_name,
        reason: recallReason,
        condition: recallCondition,
      });
      setRecallingAsset(null);
    }
  };

  // Submit Liquidate Asset (Mục 5.2.6 & TC16)
  const handleConfirmLiquidate = () => {
    if (!liquidatingAsset) return;
    const res = liquidateAsset(
      liquidatingAsset.asset_id,
      liquidateReason,
      new Date().toISOString(),
      Number(liquidateAmount),
      liquidateDocNote
    );
    if (res.success) {
      alert(res.message);
      onOpenTemplates('BIEN_BAN_THANH_LY', {
        assetName: categories.find((c) => c.category_id === liquidatingAsset.category_id)?.name,
        assetCode: liquidatingAsset.asset_code,
        recoveryAmount: Number(liquidateAmount),
      });
      setLiquidatingAsset(null);
    } else {
      alert(res.message);
    }
  };

  // Submit Create Category (UI02)
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatName) {
      alert('Vui lòng nhập đầy đủ mã và tên danh mục!');
      return;
    }
    addCategory({
      code: newCatCode.toUpperCase().trim(),
      name: newCatName.trim(),
      group: newCatGroup,
      tracking_type: newCatTracking,
      unit_of_measure: newCatUom.trim(),
      min_stock: Number(newCatMinStock),
      status: 'ACTIVE',
      prefix: newCatPrefix.toUpperCase().trim(),
    });
    alert(`Đã thêm danh mục ${newCatName} thành công!`);
    setIsNewCategoryOpen(false);
    setNewCatCode('');
    setNewCatName('');
  };

  // Open Edit Category
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatGroup(cat.group);
    setEditCatTracking(cat.tracking_type);
    setEditCatUom(cat.unit_of_measure);
    setEditCatMinStock(cat.min_stock || 0);
    setEditCatPrefix(cat.prefix || '');
    setEditCatEstPrice(cat.estimated_unit_price || 0);
    setEditCatStatus(cat.status || 'ACTIVE');
    setEditCatDesc(cat.description || '');
  };

  // Submit Edit Category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      alert('Vui lòng nhập tên danh mục hàng hóa!');
      return;
    }
    const res = await updateCategory({
      ...editingCategory,
      name: editCatName.trim(),
      group: editCatGroup,
      tracking_type: editCatTracking,
      unit_of_measure: editCatUom.trim(),
      min_stock: Number(editCatMinStock),
      prefix: editCatPrefix.toUpperCase().trim(),
      estimated_unit_price: Number(editCatEstPrice) || 0,
      status: editCatStatus,
      description: editCatDesc.trim(),
    });
    alert(res.message);
    setEditingCategory(null);
  };

  // Submit Direct Consumable Issue (Mục 5.2.4)
  const handleIssueConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    const res = issueConsumableDirect(selectedWarehouseId, issueCatId, Number(issueQty), issueEmpId);
    if (res.success) {
      alert(res.message);
      setIsDirectConsumableOpen(false);
    } else {
      alert(res.message);
    }
  };

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'TRONG_KHO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Trong kho
          </span>
        );
      case 'DANG_SU_DUNG':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Đang dùng
          </span>
        );
      case 'DANG_SUA_CHUA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Đang sửa chữa
          </span>
        );
      case 'DANG_DIEU_CHUYEN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Đang điều chuyển
          </span>
        );
      case 'DA_THANH_LY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Đã thanh lý
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          <button
            onClick={() => setActiveSubTab('SERIALIZED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'SERIALIZED'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Box className="w-4 h-4" />
            1. Tài sản định danh ({assets.filter((a) => a.warehouse_id === selectedWarehouseId).length})
          </button>

          <button
            onClick={() => setActiveSubTab('CONSUMABLE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'CONSUMABLE'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            2. Vật tư tiêu hao ({consumableCategories.length})
          </button>

          <button
            onClick={() => setActiveSubTab('PENDING_IDENTIFICATION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'PENDING_IDENTIFICATION'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            3. PO Chờ định danh
            {pendingIdentifyPOs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {pendingIdentifyPOs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('PENDING_RECEIVE_PO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'PENDING_RECEIVE_PO'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            4. PO Chờ nhập kho tiêu hao
            {pendingReceivePOs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white">
                {pendingReceivePOs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('CATEGORIES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'CATEGORIES'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            5. Danh mục hàng hóa (UI02)
          </button>
        </div>

        {/* Quick Action Button for current tab */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'SERIALIZED' && (
            <>
              <button
                onClick={() => handleOpenManualAssetModal()}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nhập / Khai báo TS (Chọn Hãng & Cấu hình)
              </button>
              <button
                onClick={() => {
                  const firstAvail = assets.find(
                    (a) => a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO'
                  );
                  if (firstAvail) setAllocatingAsset(firstAvail);
                  else alert('Hiện không có tài sản nào ở trạng thái TRONG KHO để cấp phát!');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Cấp phát tài sản
              </button>
            </>
          )}

          {activeSubTab === 'CONSUMABLE' && (
            <button
              onClick={() => setIsDirectConsumableOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Xuất tiêu hao
            </button>
          )}

          {activeSubTab === 'CATEGORIES' && (
            <button
              onClick={() => setIsNewCategoryOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm danh mục
            </button>
          )}
        </div>
      </div>

      {/* --- SUBTAB 1: TÀI SẢN ĐỊNH DANH (UI03) --- */}
      {activeSubTab === 'SERIALIZED' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[230px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã TS, Hãng (Dell, HP...), cấu hình, serial..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold">Tên hàng hóa:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setBrandFilter('ALL');
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="ALL">Tất cả hàng hóa định danh</option>
                    {categories
                      .filter((c) => c.tracking_type === 'DINH_DANH')
                      .map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold">Hãng sản xuất:</span>
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-bold text-blue-900 focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="ALL">Tất cả các hãng ({availableBrandsForFilter.length})</option>
                    {availableBrandsForFilter.map((brand) => (
                      <option key={brand} value={brand}>
                        Hãng {brand}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="TRONG_KHO">Trong kho (Sẵn sàng)</option>
                    <option value="DANG_SU_DUNG">Đang sử dụng</option>
                    <option value="DANG_SUA_CHUA">Đang sửa chữa</option>
                    <option value="DANG_DIEU_CHUYEN">Đang điều chuyển</option>
                    <option value="DA_THANH_LY">Đã thanh lý</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  const data = filteredAssets.map((a, idx) => {
                    const cat = categories.find((c) => c.category_id === a.category_id);
                    const holder = employees.find((e) => e.employee_id === a.holder_employee_id);
                    return {
                      STT: idx + 1,
                      'Mã tài sản': a.asset_code,
                      'Tên hàng hóa': cat?.name,
                      'Hãng sản xuất': a.brand || 'Chưa cập nhật',
                      'Dòng máy (Model)': a.model_name || '',
                      'Cấu hình chi tiết': a.specifications || '',
                      'Số Serial': a.serial_no,
                      'Trạng thái': a.status,
                      'Người đang sử dụng': holder?.full_name || 'Trong kho',
                      'Mã NV': holder?.employee_code || '',
                      'Đơn vị sở hữu': 'THACO AGRI',
                      'Kho lưu trữ': currentWh?.name,
                      'Nguyên giá (VND)': a.purchase_cost,
                      'Hạn bảo hành': a.warranty_to || '',
                      'Mã QR': a.qr_code,
                    };
                  });
                  exportTableToExcel(data, `DanhSach_TaiSan_DinhDanh_${currentWh?.code}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Xuất Excel
              </button>
            </div>

            {/* Quick Brand Pills Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                Lọc nhanh theo Hãng {categoryFilter !== 'ALL' ? `(${categories.find((c) => c.category_id === categoryFilter)?.name})` : ''}:
              </span>
              <button
                type="button"
                onClick={() => setBrandFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  brandFilter === 'ALL'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tất cả hãng
              </button>
              {availableBrandsForFilter.map((b) => {
                const count = assets.filter(
                  (a) =>
                    a.warehouse_id === selectedWarehouseId &&
                    (categoryFilter === 'ALL' || a.category_id === categoryFilter) &&
                    a.brand === b
                ).length;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrandFilter(b)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      brandFilter === b
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span>{b}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        brandFilter === b ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3">Mã tài sản / QR</th>
                  <th className="py-3 px-3">Tên hàng hóa</th>
                  <th className="py-3 px-3">Hãng & Dòng máy (Model)</th>
                  <th className="py-3 px-3 min-w-[230px]">Cấu hình chi tiết (Specs)</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Người đang giữ / Vị trí</th>
                  <th className="py-3 px-3 text-right">Nguyên giá (PO)</th>
                  <th className="py-3 px-3">Hạn BH</th>
                  <th className="py-3 px-3 text-center">Thao tác nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không tìm thấy tài sản định danh nào phù hợp bộ lọc trong kho này.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((ast, idx) => {
                    const cat = categories.find((c) => c.category_id === ast.category_id);
                    const holder = employees.find((e) => e.employee_id === ast.holder_employee_id);

                    return (
                      <tr key={ast.asset_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => onOpenAssetProfile(ast)}
                            className="font-mono font-bold text-emerald-800 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                            title="Bấm để xem Hồ sơ vòng đời và Timeline"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{ast.asset_code}</span>
                          </button>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            SN: <span className="font-bold text-slate-700">{ast.serial_no || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{cat?.name}</div>
                          <div className="text-[10px] text-slate-400">{cat?.group}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                              {ast.brand || 'Chưa gán hãng'}
                            </span>
                          </div>
                          {ast.model_name && (
                            <div className="font-semibold text-slate-800 mt-1 text-xs">
                              {ast.model_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs text-slate-700 font-medium leading-snug bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                            {ast.specifications || <span className="text-slate-400 italic">Chưa cập nhật cấu hình</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(ast.status)}</td>
                        <td className="py-3 px-3">
                          {holder ? (
                            <div>
                              <div className="font-semibold text-blue-900 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {holder.full_name}
                              </div>
                              <div className="text-[11px] text-slate-400">{ast.location}</div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-700 font-semibold text-[11px] block">Sẵn sàng tại kho</span>
                              <span className="text-[11px] text-slate-400">{ast.location || 'Kho bảo quản'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatVND(ast.purchase_cost)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {ast.warranty_to ? formatDateVN(ast.warranty_to).slice(0, 10) : '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                            {/* Cấp phát (nếu TRONG_KHO) */}
                            {ast.status === 'TRONG_KHO' && (
                              <button
                                onClick={() => setAllocatingAsset(ast)}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold text-[11px] transition cursor-pointer"
                                title="Bàn giao cấp phát cho CBNV hoặc phòng ban"
                              >
                                Cấp phát
                              </button>
                            )}

                            {/* Sửa Hãng & Cấu hình */}
                            <button
                              onClick={() => handleOpenEditAsset(ast)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] transition cursor-pointer"
                              title="Cập nhật Hãng sản xuất, Dòng máy & Cấu hình chi tiết"
                            >
                              Sửa Hãng/CH
                            </button>

                            {/* Thu hồi (nếu DANG_SU_DUNG) */}
                            {ast.status === 'DANG_SU_DUNG' && (
                              <button
                                onClick={() => setRecallingAsset(ast)}
                                className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded font-semibold text-[11px] transition cursor-pointer"
                                title="Thu hồi tài sản về kho"
                              >
                                Thu hồi
                              </button>
                            )}

                            {/* Thanh lý (Chỉ khi TRONG_KHO - Mục 5.2.6 & TC16) */}
                            {ast.status === 'TRONG_KHO' && (
                              <button
                                onClick={() => setLiquidatingAsset(ast)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-semibold text-[11px] transition cursor-pointer"
                                title="Thanh lý tài sản hỏng/hết khấu hao"
                              >
                                Thanh lý
                              </button>
                            )}

                            {/* Xem hồ sơ */}
                            <button
                              onClick={() => onOpenAssetProfile(ast)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition cursor-pointer"
                            >
                              Hồ sơ
                            </button>
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
      )}

      {/* --- SUBTAB 2: VẬT TƯ TIÊU HAO --- */}
      {activeSubTab === 'CONSUMABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Kiểm Soát Tồn Kho & Cấp Phát Hàng Tiêu Hao (Mục 5.2.4 & 5.2.7)
            </h3>
            <button
              onClick={() => setIsDirectConsumableOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Xuất kho tiêu hao
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Mã vật tư</th>
                  <th className="py-3 px-4">Tên vật tư</th>
                  <th className="py-3 px-4">Nhóm</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-right bg-emerald-50 text-emerald-900 font-bold">
                    Tồn khả dụng
                  </th>
                  <th className="py-3 px-4 text-center">Ngưỡng tối thiểu</th>
                  <th className="py-3 px-4 text-right">Đơn giá BQ</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consumableCategories.map((cat, idx) => {
                  const stock = stockBalances.find(
                    (s) => s.warehouse_id === selectedWarehouseId && s.category_id === cat.category_id
                  );
                  const onHand = stock?.quantity_on_hand || 0;
                  const isLow = onHand <= cat.min_stock;

                  return (
                    <tr key={cat.category_id} className={`hover:bg-slate-50 transition ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{cat.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>
                          <span className="font-semibold text-slate-900 text-xs block leading-snug">{cat.name}</span>
                          {isLow && (
                            <span
                              title={`Cảnh báo: Tồn kho ${onHand} ≤ Ngưỡng tối thiểu ${cat.min_stock} ${cat.unit_of_measure}`}
                              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Cảnh báo thiếu tồn: Còn {onHand} / Ngưỡng {cat.min_stock} {cat.unit_of_measure}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{cat.group}</td>
                      <td className="py-3 px-4 text-center">{cat.unit_of_measure}</td>
                      <td className="py-3 px-4 text-right font-black text-sm text-emerald-800 bg-emerald-50/40">
                        {onHand}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {cat.min_stock} {cat.unit_of_measure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatVND(stock?.average_unit_cost || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setIssueCatId(cat.category_id);
                            setIsDirectConsumableOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold text-[11px] transition cursor-pointer"
                        >
                          Cấp phát
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: PO CHỜ ĐỊNH DANH (UI05) --- */}
      {activeSubTab === 'PENDING_IDENTIFICATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Danh sách PO Đã Mua Xong - Chờ Thủ Kho Khai Báo Định Danh (UI05 & Mục 5.2.2)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thu mua đã bàn giao hàng về công ty. Thủ kho tiến hành nhập Serial, bảo hành, cấu hình để sinh mã QR và đưa vào TRONG KHO.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs border border-amber-300">
              {pendingIdentifyPOs.length} đơn cần định danh
            </span>
          </div>

          <div className="p-5">
            {pendingIdentifyPOs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-slate-700">Tất cả PO định danh đã được khai báo đầy đủ!</p>
                <p className="text-xs text-slate-400 mt-1">Không có thiết bị nào đang chờ định danh.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingIdentifyPOs.map((po) => {
                  const unidentCount = po.lines.reduce(
                    (acc, l) => acc + (l.qty_received - l.qty_identified),
                    0
                  );

                  return (
                    <div
                      key={po.po_id}
                      className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-xl p-5 shadow-xs transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-sm">{po.po_code}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Còn {unidentCount} thiết bị chưa định danh
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>
                          Nhà cung cấp: <span className="font-semibold text-slate-800">{po.supplier_name}</span>
                        </div>
                        <div>
                          Ngày mua hoàn tất:{' '}
                          <span className="font-medium text-slate-800">{formatDateVN(po.created_at)}</span>
                        </div>
                        <div>
                          Tổng giá trị: <span className="font-bold text-emerald-800">{formatVND(po.total_amount)}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-700 block mb-1">Mặt hàng trong PO:</span>
                        {po.lines.map((l) => {
                          const cat = categories.find((c) => c.category_id === l.category_id);
                          return (
                            <div key={l.line_id} className="flex justify-between py-0.5 text-slate-600">
                              <span>{cat?.name}</span>
                              <span className="font-bold font-mono">
                                Đã định danh: {l.qty_identified}/{l.qty_received}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleOpenIdentifyModal(po)}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        Khai báo Serial & Sinh mã tài sản QR
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: PO CHỜ NHẬP KHO TIÊU HAO (UI04) --- */}
      {activeSubTab === 'PENDING_RECEIVE_PO' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Danh sách PO Hàng Tiêu Hao Chờ Nhập Kho (UI04 & Mục 5.2.1)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thủ kho mở PO có trạng thái CHỜ NHẬP KHO, nhập số lượng thực nhận để kiểm đếm, ghi giao dịch nhập và cộng tồn kho.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs border border-blue-300">
              {pendingReceivePOs.length} đơn chờ nhập
            </span>
          </div>

          <div className="p-5">
            {pendingReceivePOs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-blue-500 mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-slate-700">Tất cả PO tiêu hao đã được nhập kho xong!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReceivePOs.map((po) => (
                  <div
                    key={po.po_id}
                    className="bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl p-5 shadow-xs transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-sm">{po.po_code}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        Chờ kiểm đếm nhập kho
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        Nhà cung cấp: <span className="font-semibold text-slate-800">{po.supplier_name}</span>
                      </div>
                      <div>
                        Tổng tiền mua thực tế:{' '}
                        <span className="font-bold text-emerald-800">{formatVND(po.total_amount)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700 block mb-1">Mặt hàng cần kiểm nhận:</span>
                      {po.lines.map((l) => {
                        const cat = categories.find((c) => c.category_id === l.category_id);
                        return (
                          <div key={l.line_id} className="flex justify-between py-0.5 text-slate-600">
                            <span>{cat?.name}</span>
                            <span className="font-bold font-mono text-emerald-800">
                              SL đặt: {l.qty_ordered} {cat?.unit_of_measure}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleOpenReceiveModal(po)}
                      className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Mở phiếu kiểm đếm & Nhập kho (UI04)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB 5: QUẢN LÝ DANH MỤC HÀNG HÓA (UI02) --- */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Cấu Hình Danh Mục Hàng Hóa & Nhóm Thiết Bị (UI02 & Mục 5.1.1)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập loại theo dõi (Định danh vs Tiêu hao), ngưỡng cảnh báo tồn tối thiểu và quy tắc mã tự sinh.
              </p>
            </div>
            <button
              onClick={() => setIsNewCategoryOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm danh mục mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Mã danh mục</th>
                  <th className="py-3 px-4">Tên hàng hóa / Thiết bị</th>
                  <th className="py-3 px-4">Hãng & Cấu hình hỗ trợ (Định danh)</th>
                  <th className="py-3 px-4">Nhóm thiết bị</th>
                  <th className="py-3 px-4">Loại theo dõi</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-center">Ngưỡng tồn</th>
                  <th className="py-3 px-4 text-center">Tiền tố mã</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((cat, idx) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{cat.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-bold">{cat.name}</div>
                      {cat.estimated_unit_price ? (
                        <div className="text-[11px] text-slate-400 font-mono">Đơn giá chuẩn: {formatVND(cat.estimated_unit_price)}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      {cat.tracking_type === 'DINH_DANH' ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {(cat.supported_brands || []).map((b) => (
                              <span
                                key={b}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          {cat.brand_configs && cat.brand_configs.length > 0 && (
                            <div className="text-[10px] text-slate-500">
                              {cat.brand_configs.length} cấu hình chuẩn ({cat.brand_configs.slice(0, 2).map((c) => c.model_name).join(', ')}...)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Không áp dụng (Hàng tiêu hao)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cat.group}</td>
                    <td className="py-3 px-4">
                      {cat.tracking_type === 'DINH_DANH' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Định danh (Serial & QR)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Tiêu hao (Số lượng tồn)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{cat.unit_of_measure}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{cat.min_stock}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-700">{cat.prefix || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {cat.status === 'INACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          Ngưng áp dụng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 shadow-xs transition"
                        title="Chỉnh sửa cấu hình danh mục hàng hóa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CẤP PHÁT TÀI SẢN ĐỊNH DANH (Mục 5.2.3) --- */}
      {allocatingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Cấp Phát Tài Sản Định Danh (Rõ Hãng & Cấu Hình)</h3>
              </div>
              <button
                onClick={() => setAllocatingAsset(null)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Cho phép chọn đổi thiết bị định danh sẵn có trong kho theo Hãng & Cấu hình */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn thiết bị cụ thể trong kho để bàn giao (Theo Hãng & Cấu hình):
                </label>
                <select
                  value={allocatingAsset.asset_id}
                  onChange={(e) => {
                    const found = assets.find((a) => a.asset_id === e.target.value);
                    if (found) setAllocatingAsset(found);
                  }}
                  className="w-full bg-emerald-50/70 border border-emerald-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-emerald-600"
                >
                  {assets
                    .filter((a) => a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO')
                    .map((a) => {
                      const c = categories.find((cat) => cat.category_id === a.category_id);
                      return (
                        <option key={a.asset_id} value={a.asset_id}>
                          [{a.asset_code}] {c?.name} — Hãng {a.brand || 'N/A'} | {a.model_name || ''} ({a.specifications || 'Tiêu chuẩn'}) - SN: {a.serial_no}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã tài sản & Serial:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {allocatingAsset.asset_code} • SN: {allocatingAsset.serial_no}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên hàng hóa:</span>
                  <span className="font-bold text-slate-900">
                    {categories.find((c) => c.category_id === allocatingAsset.category_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hãng & Dòng máy:</span>
                  <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                    Hãng {allocatingAsset.brand || 'Chưa gán'} • {allocatingAsset.model_name || 'Tiêu chuẩn'}
                  </span>
                </div>
                <div className="pt-1 border-t border-emerald-200/70">
                  <span className="text-slate-500 block mb-0.5">Cấu hình chi tiết bàn giao:</span>
                  <span className="font-semibold text-slate-800 block bg-white p-2 rounded border border-emerald-200">
                    {allocatingAsset.specifications || 'Cấu hình tiêu chuẩn theo PO'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn nhân viên nhận bàn giao (Hiển thị đơn vị chi trả lương):
                </label>
                <select
                  value={allocRecipientId}
                  onChange={(e) => setAllocRecipientId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.position} - Đơn vị: THACO AGRI
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khu vực / Phòng ban lắp đặt thiết bị:
                </label>
                <input
                  type="text"
                  value={allocLocation}
                  onChange={(e) => setAllocLocation(e.target.value)}
                  placeholder="Ví dụ: Phòng Kế toán - Tầng 2 Chu Lai"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú bàn giao & tình trạng:
                </label>
                <textarea
                  rows={2}
                  value={allocNote}
                  onChange={(e) => setAllocNote(e.target.value)}
                  placeholder="Ví dụ: Bàn giao máy mới 100%, kèm củ sạc 65W và chuột quang..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                ℹ️ Sau khi xác nhận, tài sản sẽ chuyển trạng thái <span className="font-bold text-blue-700">DANG_SU_DUNG</span>, 
                ghi nhận rõ <span className="font-bold text-slate-800">Hãng {allocatingAsset.brand} & Cấu hình</span> vào nhật ký vòng đời và tự động mở <span className="font-bold text-emerald-800">Biên bản bàn giao</span>.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAllocatingAsset(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllocate}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận bàn giao & In biên bản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: THU HỒI TÀI SẢN (Mục 5.2.5) --- */}
      {recallingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-orange-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-200" />
                <h3 className="font-bold text-base">Thu Hồi Tài Sản Về Kho (Mục 5.2.5)</h3>
              </div>
              <button onClick={() => setRecallingAsset(null)} className="text-orange-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-orange-50 p-3.5 rounded-xl border border-orange-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã tài sản:</span>
                  <span className="font-mono font-bold text-orange-900">{recallingAsset.asset_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thiết bị:</span>
                  <span className="font-bold text-slate-900">
                    {categories.find((c) => c.category_id === recallingAsset.category_id)?.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhân viên hoàn trả:</label>
                <select
                  value={recallReturnerId}
                  onChange={(e) => setRecallReturnerId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do thu hồi (Bắt buộc chi tiết):</label>
                <input
                  type="text"
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  placeholder="Ví dụ: Nhân viên nghỉ việc / Thay thế thiết bị mới..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tình trạng thiết bị khi thu hồi:</label>
                <input
                  type="text"
                  value={recallCondition}
                  onChange={(e) => setRecallCondition(e.target.value)}
                  placeholder="Ví dụ: Ngoại hình 95%, hoạt động bình thường, kèm đầy đủ sạc..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRecallingAsset(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRecall}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận thu hồi & In biên bản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: THANH LÝ TÀI SẢN (Mục 5.2.6 & TC16) --- */}
      {liquidatingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-red-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base">Thanh Lý Tài Sản (Mục 5.2.6)</h3>
              </div>
              <button onClick={() => setLiquidatingAsset(null)} className="text-red-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã tài sản:</span>
                  <span className="font-mono font-bold text-red-900">{liquidatingAsset.asset_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thiết bị:</span>
                  <span className="font-bold text-slate-900">
                    {categories.find((c) => c.category_id === liquidatingAsset.category_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nguyên giá ban đầu:</span>
                  <span className="font-mono text-slate-800">{formatVND(liquidatingAsset.purchase_cost)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do thanh lý:</label>
                <textarea
                  rows={2}
                  value={liquidateReason}
                  onChange={(e) => setLiquidateReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền thu về từ thanh lý (VND):
                </label>
                <input
                  type="number"
                  value={liquidateAmount}
                  onChange={(e) => setLiquidateAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tài liệu minh chứng / Biên bản quyết định:
                </label>
                <input
                  type="text"
                  value={liquidateDocNote}
                  onChange={(e) => setLiquidateDocNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-800 text-[11px] leading-relaxed">
                ⚠️ Cảnh báo: Tài sản sau khi thanh lý sẽ chuyển trạng thái <span className="font-bold">DA_THANH_LY</span> và bị khóa vĩnh viễn các thao tác cấp phát/thu hồi tiếp theo (theo mục 5.2.6).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLiquidatingAsset(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLiquidate}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận thanh lý & Khóa tài sản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: KHAI BÁO ĐỊNH DANH TỪ PO (UI05) --- */}
      {identifyingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Khai Báo Tài Sản Định Danh Từ PO {identifyingPO.po_code} (UI05 & Mục 5.2.2)
                </h3>
                <p className="text-xs text-emerald-200">
                  Nhà cung cấp: {identifyingPO.supplier_name} • Kho nhận: {currentWh?.name}
                </p>
              </div>
              <button onClick={() => setIdentifyingPO(null)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-900">
                  Tổng thiết bị cần khai báo: {identDeclarations.length} chiếc
                </span>
                <span className="text-slate-600">
                  Đơn vị sở hữu sẽ tự động gắn theo Kho: <strong className="text-slate-900">THACO AGRI</strong>
                </span>
              </div>

              <div className="space-y-3">
                {identDeclarations.map((decl, idx) => {
                  const cat = categories.find((c) => c.category_id === decl.category_id);
                  const brandOptions = cat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG'];
                  const matchingConfigs = (cat?.brand_configs || []).filter(
                    (cfg) => !decl.brand || cfg.brand === decl.brand
                  );

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-bold text-[11px]">
                            Thiết bị #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {cat?.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800">
                          Giá nhập: {formatVND(decl.purchase_cost)}
                        </span>
                      </div>

                      {/* Chọn Hãng & Cấu hình dòng máy */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                        <div>
                          <label className="text-[11px] font-bold text-blue-900 block mb-0.5">
                            1. Chọn Hãng sản xuất:
                          </label>
                          <select
                            value={decl.brand}
                            onChange={(e) => {
                              const newBrand = e.target.value;
                              const firstCfg = (cat?.brand_configs || []).find((c) => c.brand === newBrand);
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        brand: newBrand,
                                        model_name: firstCfg ? firstCfg.model_name : d.model_name,
                                        specifications: firstCfg ? firstCfg.specifications : d.specifications,
                                      }
                                    : d
                                )
                              );
                            }}
                            className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-bold text-blue-900 text-xs focus:outline-blue-600"
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
                            2. Chọn Dòng máy & Cấu hình chuẩn theo hãng ({decl.brand}):
                          </label>
                          <select
                            value={decl.model_name}
                            onChange={(e) => {
                              const chosenModel = e.target.value;
                              const foundCfg = (cat?.brand_configs || []).find((c) => c.model_name === chosenModel);
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) =>
                                  i === idx
                                    ? {
                                        ...d,
                                        model_name: chosenModel,
                                        specifications: foundCfg ? foundCfg.specifications : d.specifications,
                                      }
                                    : d
                                )
                              );
                            }}
                            className="w-full bg-white border border-blue-300 rounded-md p-1.5 font-semibold text-slate-800 text-xs focus:outline-blue-600"
                          >
                            {matchingConfigs.map((cfg) => (
                              <option key={cfg.model_name} value={cfg.model_name}>
                                {cfg.model_name} — ({cfg.specifications})
                              </option>
                            ))}
                            <option value={decl.model_name}>{decl.model_name} (Tùy chỉnh)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            Thông số cấu hình chi tiết lưu kho (CPU / RAM / SSD / Màn hình...):
                          </label>
                          <input
                            type="text"
                            value={decl.specifications}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, specifications: val } : d))
                              );
                            }}
                            className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-medium text-slate-800 focus:outline-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-0.5">Số Serial (SN):</label>
                          <input
                            type="text"
                            value={decl.serial_no}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, serial_no: val } : d))
                              );
                            }}
                            className="w-full bg-white border border-slate-200 rounded-md p-1.5 font-mono text-xs focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 block mb-0.5">Hạn bảo hành đến:</label>
                          <input
                            type="date"
                            value={decl.warranty_to}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, warranty_to: val } : d))
                              );
                            }}
                            className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 block mb-0.5">Vị trí lưu kho:</label>
                          <input
                            type="text"
                            value={decl.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIdentDeclarations((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, location: val } : d))
                              );
                            }}
                            className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs focus:outline-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Mỗi thiết bị sẽ được sinh mã định danh và QR code duy nhất theo chuẩn THACO AGRI.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIdentifyingPO(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSubmitIdentify}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Hoàn thành nhập & Khai báo tài sản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: NHẬP KHO TIÊU HAO TỪ PO (UI04) --- */}
      {receivingConsumablePO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Kiểm Đếm & Nhập Kho Tiêu Hao Từ PO {receivingConsumablePO.po_code} (UI04)
                </h3>
                <p className="text-xs text-blue-200">
                  Nhà cung cấp: {receivingConsumablePO.supplier_name}
                </p>
              </div>
              <button onClick={() => setReceivingConsumablePO(null)} className="text-blue-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                {receivingConsumablePO.lines.map((l) => {
                  const cat = categories.find((c) => c.category_id === l.category_id);
                  const currentLine = receiveLines.find((rl) => rl.line_id === l.line_id);

                  return (
                    <div
                      key={l.line_id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{cat?.name}</span>
                        <span className="text-[11px] text-slate-500">
                          SL đặt mua: {l.qty_ordered} {cat?.unit_of_measure} • Đơn giá: {formatVND(l.actual_unit_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600">SL thực nhận:</span>
                        <input
                          type="number"
                          min={0}
                          max={l.qty_ordered}
                          value={currentLine?.qty_received || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setReceiveLines((prev) =>
                              prev.map((rl) =>
                                rl.line_id === l.line_id ? { ...rl, qty_received: val } : rl
                              )
                            );
                          }}
                          className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold font-mono focus:outline-blue-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingConsumablePO(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReceive}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận nhập kho & Cộng tồn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 6: THÊM DANH MỤC MỚI (UI02) --- */}
      {isNewCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Thêm Danh Mục Hàng Hóa Mới (UI02)</h3>
              <button onClick={() => setIsNewCategoryOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã danh mục (Duy nhất):</label>
                <input
                  type="text"
                  required
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="Ví dụ: LT-LENOVO-T14"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono uppercase focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên danh mục hàng hóa:</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Laptop Lenovo ThinkPad T14 Gen 4"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm hàng hóa:</label>
                <select
                  value={newCatGroup}
                  onChange={(e) => setNewCatGroup(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                >
                  <option value="Thiết bị tin học">Thiết bị tin học</option>
                  <option value="Thiết bị điện tử văn phòng">Thiết bị điện tử văn phòng</option>
                  <option value="Thiết bị gia dụng">Thiết bị gia dụng</option>
                  <option value="Nội thất văn phòng">Nội thất văn phòng</option>
                  <option value="Văn phòng phẩm & vật tư">Văn phòng phẩm & vật tư</option>
                  <option value="Phương tiện vận tải">Phương tiện vận tải</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại theo dõi:</label>
                <select
                  value={newCatTracking}
                  onChange={(e) => setNewCatTracking(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                >
                  <option value="DINH_DANH">Định danh (Theo dõi từng đơn vị vật lý, Serial, QR)</option>
                  <option value="TIEU_HAO">Tiêu hao (Theo dõi số lượng tồn tổng, không yêu cầu Serial)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính:</label>
                  <input
                    type="text"
                    required
                    value={newCatUom}
                    onChange={(e) => setNewCatUom(e.target.value)}
                    placeholder="Máy, Bộ, Cái, Ram..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngưỡng tồn tối thiểu:</label>
                  <input
                    type="number"
                    min={0}
                    value={newCatMinStock}
                    onChange={(e) => setNewCatMinStock(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {newCatTracking === 'DINH_DANH' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiền tố mã tài sản tự sinh:</label>
                  <input
                    type="text"
                    value={newCatPrefix}
                    onChange={(e) => setNewCatPrefix(e.target.value)}
                    placeholder="LP, PC, PR..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 uppercase font-mono focus:outline-emerald-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 7: XUẤT TIÊU HAO NHANH --- */}
      {isDirectConsumableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Xuất Cấp Phát Tiêu Hao (Mục 5.2.4)</h3>
              <button onClick={() => setIsDirectConsumableOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueConsumable} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vật tư xuất kho:</label>
                <select
                  value={issueCatId}
                  onChange={(e) => setIssueCatId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                >
                  {consumableCategories.map((c) => {
                    const st = stockBalances.find(
                      (s) => s.warehouse_id === selectedWarehouseId && s.category_id === c.category_id
                    );
                    return (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name} (Tồn khả dụng: {st?.quantity_on_hand || 0} {c.unit_of_measure})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng xuất cấp:</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={issueQty}
                  onChange={(e) => setIssueQty(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhân viên nhận:</label>
                <select
                  value={issueEmpId}
                  onChange={(e) => setIssueEmpId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDirectConsumableOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận xuất kho & Trừ tồn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 8: CHỈNH SỬA DANH MỤC HÀNG HÓA --- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-base">Cấu Hình / Sửa Danh Mục Hàng Hóa</h3>
                  <p className="text-[11px] text-blue-200">Mã: {editingCategory.code}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-blue-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-3.5 text-xs">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[11px]">Mã danh mục:</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">{editingCategory.code}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">ID hệ thống:</span>
                  <span className="font-mono text-slate-600">{editingCategory.category_id}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên danh mục hàng hóa / Thiết bị: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="Ví dụ: Laptop Dell XPS 15..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm hàng hóa:</label>
                  <select
                    value={editCatGroup}
                    onChange={(e) => setEditCatGroup(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600"
                  >
                    <option value="Thiết bị tin học">Thiết bị tin học</option>
                    <option value="Thiết bị điện tử văn phòng">Thiết bị điện tử văn phòng</option>
                    <option value="Thiết bị gia dụng">Thiết bị gia dụng</option>
                    <option value="Nội thất văn phòng">Nội thất văn phòng</option>
                    <option value="Văn phòng phẩm & vật tư">Văn phòng phẩm & vật tư</option>
                    <option value="Phương tiện vận tải">Phương tiện vận tải</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hình thức theo dõi:</label>
                  <select
                    value={editCatTracking}
                    onChange={(e) => setEditCatTracking(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600 font-semibold"
                  >
                    <option value="DINH_DANH">Định danh (Serial & QR)</option>
                    <option value="TIEU_HAO">Tiêu hao (Số lượng tồn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính:</label>
                  <input
                    type="text"
                    required
                    value={editCatUom}
                    onChange={(e) => setEditCatUom(e.target.value)}
                    placeholder="Máy, Bộ, Hộp..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngưỡng tồn cảnh báo:</label>
                  <input
                    type="number"
                    min={0}
                    value={editCatMinStock}
                    onChange={(e) => setEditCatMinStock(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn giá dự kiến (VND):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={editCatEstPrice}
                    onChange={(e) => setEditCatEstPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiền tố mã QR tự sinh:</label>
                  <input
                    type="text"
                    value={editCatPrefix}
                    onChange={(e) => setEditCatPrefix(e.target.value)}
                    placeholder="VD: LP, PC, PR..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 uppercase font-mono focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái:</label>
                  <select
                    value={editCatStatus}
                    onChange={(e) => setEditCatStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600 font-semibold"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Ngưng áp dụng (INACTIVE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả / Ghi chú kỹ thuật:</label>
                <textarea
                  rows={2}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  placeholder="Ghi chú cấu hình hoặc tiêu chuẩn kỹ thuật..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Lưu thay đổi danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 9: NHẬP / KHAI BÁO TÀI SẢN ĐỊNH DANH TRỰC TIẾP VÀO KHO (CHỌN TÊN HÀNG HÓA -> HÃNG -> CẤU HÌNH) --- */}
      {isManualAssetOpen && (() => {
        const selectedCat = categories.find((c) => c.category_id === manualCatId);
        const brandList = selectedCat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG', 'Samsung', 'Hòa Phát (The One)'];
        const configsForBrand = (selectedCat?.brand_configs || []).filter((cfg) => cfg.brand === manualBrand);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-300" />
                  <div>
                    <h3 className="font-bold text-base">Nhập / Khai Báo Tài Sản Định Danh Vào Kho</h3>
                    <p className="text-[11px] text-blue-200">
                      Chọn chủng loại hàng hóa (VD: Laptop) → Chọn Hãng sản xuất → Chọn Cấu hình chi tiết
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsManualAssetOpen(false)} className="text-blue-200 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitManualAsset} className="p-6 space-y-4 text-xs">
                {/* Bước 1: Chọn Tên hàng hóa */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. Chọn Tên hàng hóa / Chủng loại định danh: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manualCatId}
                    onChange={(e) => handleManualCategoryChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:outline-blue-600"
                  >
                    {categories
                      .filter((c) => c.tracking_type === 'DINH_DANH')
                      .map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name} ({c.code}) — Hỗ trợ: {(c.supported_brands || []).join(', ')}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Bước 2: Chọn Hãng sản xuất */}
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                  <div>
                    <label className="block font-bold text-blue-950 mb-1.5">
                      2. Chọn Hãng sản xuất cho {selectedCat?.name}: <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {brandList.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleManualBrandChange(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            manualBrand === b
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={manualBrand}
                      onChange={(e) => setManualBrand(e.target.value)}
                      placeholder="Hoặc tự nhập tên Hãng khác..."
                      className="w-full bg-white border border-blue-200 rounded-lg p-2 font-bold text-blue-900 focus:outline-blue-600"
                    />
                  </div>

                  {/* Bước 3: Chọn Cấu hình gợi ý theo Hãng */}
                  <div>
                    <label className="block font-bold text-blue-950 mb-1">
                      3. Chọn Dòng máy & Cấu hình chuẩn của hãng {manualBrand}:
                    </label>
                    {configsForBrand.length > 0 ? (
                      <div className="space-y-1.5 mb-2">
                        {configsForBrand.map((cfg) => {
                          const isSelected = manualModelName === cfg.model_name;
                          return (
                            <div
                              key={cfg.model_name}
                              onClick={() => {
                                setManualModelName(cfg.model_name);
                                setManualSpecs(cfg.specifications);
                                if (cfg.estimated_price) setManualCost(cfg.estimated_price);
                              }}
                              className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                                  : 'bg-white text-slate-800 border-blue-200 hover:bg-blue-50'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs">{cfg.model_name}</div>
                                <div className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                  {cfg.specifications}
                                </div>
                              </div>
                              {cfg.estimated_price && (
                                <span className={`font-mono font-bold text-xs shrink-0 ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                                  {formatVND(cfg.estimated_price)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic mb-2">
                        Nhập dòng máy và thông số kỹ thuật chi tiết bên dưới:
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Dòng máy / Model:
                        </label>
                        <input
                          type="text"
                          required
                          value={manualModelName}
                          onChange={(e) => setManualModelName(e.target.value)}
                          placeholder="VD: Dell Latitude 5430..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Nguyên giá nhập kho (VND):
                        </label>
                        <input
                          type="number"
                          required
                          value={manualCost}
                          onChange={(e) => setManualCost(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 focus:outline-blue-600"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Cấu hình kỹ thuật chi tiết (CPU, RAM, SSD, Màn hình / Kích thước...): <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={manualSpecs}
                        onChange={(e) => setManualSpecs(e.target.value)}
                        placeholder="VD: Core i5-1235U, RAM 16GB DDR4, SSD 512GB NVMe, 14 inch FHD IPS"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Bước 4: Serial, Bảo hành, Vị trí kho */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Serial (SN):</label>
                    <input
                      type="text"
                      required
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bảo hành đến:</label>
                    <input
                      type="date"
                      value={manualWarrantyTo}
                      onChange={(e) => setManualWarrantyTo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vị trí kệ kho:</label>
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsManualAssetOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg shadow-xs"
                  >
                    Lưu & Sinh Mã Tài Sản Định Danh
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* --- MODAL 10: SỬA NHANH HÃNG & CẤU HÌNH TÀI SẢN TRONG KHO --- */}
      {editingAsset && (() => {
        const cat = categories.find((c) => c.category_id === editingAsset.category_id);
        const brandList = cat?.supported_brands || ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Canon', 'Brother', 'LG', 'Hòa Phát (The One)'];
        const brandConfigs = (cat?.brand_configs || []).filter((cfg) => !editAstBrand || cfg.brand === editAstBrand);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="px-6 py-4 bg-blue-800 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Cập Nhật Hãng & Cấu Hình Tài Sản</h3>
                  <p className="text-[11px] text-blue-200">
                    Mã tài sản: {editingAsset.asset_code} • {cat?.name}
                  </p>
                </div>
                <button onClick={() => setEditingAsset(null)} className="text-blue-200 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditAsset} className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chọn Hãng sản xuất:</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {brandList.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setEditAstBrand(b);
                          const firstCfg = (cat?.brand_configs || []).find((c) => c.brand === b);
                          if (firstCfg) {
                            setEditAstModel(firstCfg.model_name);
                            setEditAstSpecs(firstCfg.specifications);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          editAstBrand === b
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={editAstBrand}
                    onChange={(e) => setEditAstBrand(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-blue-900"
                  />
                </div>

                {brandConfigs.length > 0 && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chọn nhanh cấu hình chuẩn của hãng {editAstBrand}:
                    </label>
                    <select
                      value={editAstModel}
                      onChange={(e) => {
                        const m = e.target.value;
                        setEditAstModel(m);
                        const found = brandConfigs.find((c) => c.model_name === m);
                        if (found) {
                          setEditAstSpecs(found.specifications);
                          if (found.estimated_price) setEditAstCost(found.estimated_price);
                        }
                      }}
                      className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn dòng máy / cấu hình gợi ý --</option>
                      {brandConfigs.map((cfg) => (
                        <option key={cfg.model_name} value={cfg.model_name}>
                          {cfg.model_name} — {cfg.specifications}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dòng máy (Model):</label>
                  <input
                    type="text"
                    value={editAstModel}
                    onChange={(e) => setEditAstModel(e.target.value)}
                    placeholder="VD: Dell Latitude 5430"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cấu hình chi tiết (Specifications):</label>
                  <textarea
                    rows={2}
                    value={editAstSpecs}
                    onChange={(e) => setEditAstSpecs(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Serial (SN):</label>
                    <input
                      type="text"
                      value={editAstSerial}
                      onChange={(e) => setEditAstSerial(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vị trí lưu trữ / lắp đặt:</label>
                    <input
                      type="text"
                      value={editAstLocation}
                      onChange={(e) => setEditAstLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg shadow-xs"
                  >
                    Lưu cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
