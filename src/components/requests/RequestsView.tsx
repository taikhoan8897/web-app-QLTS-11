import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Send, 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShoppingCart, 
  Clock, 
  Search, 
  Eye, 
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  Download,
  HelpCircle,
  Sparkles,
  Boxes,
  Edit3,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Request as AssetRequest, Category, Asset } from '../../types';
import { formatDateVN, formatVND } from '../../utils/excelExporter';

interface RequestsViewProps {
  onOpenTemplates: (type: any, data?: any) => void;
  onOpenAssetProfile: (asset: Asset) => void;
}

interface FormRequestLine {
  category_id: string;
  item_name: string;
  qty_requested: number;
  unit_of_measure: string;
  note: string;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  onOpenTemplates,
  onOpenAssetProfile,
}) => {
  const { 
    currentUser, 
    requests, 
    categories, 
    assets, 
    stockBalances, 
    selectedWarehouseId, 
    warehouses,
    employees,
    createRequest,
    updateRequest,
    updateRequestStatus,
    issueRequestAllocation,
    addDemandFromRequest
  } = useApp();

  const isWarehouseStaff = currentUser.role === 'THU_KHO' || currentUser.role === 'QUAN_TRI';

  const [activeTab, setActiveTab] = useState<'MY_REQUESTS' | 'WAREHOUSE_QUEUE'>(
    isWarehouseStaff ? 'WAREHOUSE_QUEUE' : 'MY_REQUESTS'
  );

  const [selectedReq, setSelectedReq] = useState<AssetRequest | null>(null);
  const [editingReq, setEditingReq] = useState<AssetRequest | null>(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  // New Request Form states - Empty by default, no prefilled item info as requested!
  const [newReqType, setNewReqType] = useState<AssetRequest['request_type']>('CAP_VAN_PHONG_PHAM');
  const [newPurpose, setNewPurpose] = useState('');
  const [newPriority, setNewPriority] = useState<AssetRequest['priority']>('TRUNG_BINH');
  const [newLines, setNewLines] = useState<FormRequestLine[]>([
    { category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' },
  ]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);

  const [attachedFileName, setAttachedFileName] = useState('');
  const [isExportedTemplate, setIsExportedTemplate] = useState(false);

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Allocation modal states
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = useState(false);
  const [allocState, setAllocState] = useState<{
    [lineId: string]: {
      selectedAssetIds: string[];
      consumableQty: number;
    };
  }>({});

  const currentWh = warehouses.find((w) => w.warehouse_id === selectedWarehouseId);

  // Filter requests
  const myRequests = requests.filter((r) => r.requester_id === currentUser.employee_id);
  const warehouseQueueRequests = requests.filter(
    (r) => r.status !== 'HUY'
  );

  // Open Create New Request
  const handleOpenNewRequest = () => {
    setEditingReq(null);
    setNewReqType('CAP_VAN_PHONG_PHAM');
    setNewPurpose('');
    setNewPriority('TRUNG_BINH');
    setNewLines([{ category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' }]);
    setAttachedFileName('');
    setIsExportedTemplate(false);
    setIsNewRequestOpen(true);
  };

  // Open Edit Request (for NHAP or CHO_TIEP_NHAN)
  const handleOpenEditRequest = (req: AssetRequest) => {
    setEditingReq(req);
    setNewReqType(req.request_type);
    setNewPurpose(req.purpose || '');
    setNewPriority(req.priority || 'TRUNG_BINH');
    if (req.lines && req.lines.length > 0) {
      setNewLines(
        req.lines.map((l) => {
          const cat = categories.find((c) => c.category_id === l.category_id);
          return {
            category_id: l.category_id,
            item_name: cat?.name || l.note || 'Vật tư',
            qty_requested: l.qty_requested,
            unit_of_measure: cat?.unit_of_measure || '',
            note: l.note || '',
          };
        })
      );
    } else {
      setNewLines([{ category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' }]);
    }
    setAttachedFileName(req.attachment_file?.file_name || '');
    setIsExportedTemplate(!!req.attachment_file?.file_name);
    setIsNewRequestOpen(true);
  };

  // Add line to request (clean, no prefill)
  const handleAddLine = () => {
    setNewLines((prev) => [
      ...prev,
      { category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' },
    ]);
  };

  // Remove line from request
  const handleRemoveLine = (idx: number) => {
    if (newLines.length > 1) {
      setNewLines((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // Select category from autocomplete suggestion
  const handleSelectCategory = (lineIdx: number, cat: Category) => {
    setNewLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx
          ? {
              ...l,
              category_id: cat.category_id,
              item_name: cat.name,
              unit_of_measure: cat.unit_of_measure,
            }
          : l
      )
    );
    setActiveSuggestionIdx(null);
  };

  // Prepare lines for saving
  const prepareLinesToSubmit = () => {
    return newLines.map((l) => {
      let resolvedCatId = l.category_id;
      if (!resolvedCatId) {
        // Find best match in categories
        const match = categories.find((c) =>
          c.name.toLowerCase().includes(l.item_name.toLowerCase())
        );
        resolvedCatId = match ? match.category_id : (categories[0]?.category_id || 'CAT-01');
      }
      return {
        category_id: resolvedCatId,
        qty_requested: Math.max(1, l.qty_requested),
        note: l.note || l.item_name,
      };
    });
  };

  // Save Draft Request (KHÔNG bắt buộc file đính kèm, lưu trạng thái NHAP)
  const handleSaveDraft = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate that each line has an item specified
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i];
      if (!line.item_name.trim()) {
        alert(`Vui lòng điền vật tư cần đề xuất ở dòng #${i + 1}!`);
        return;
      }
    }

    const linesToSubmit = prepareLinesToSubmit();

    if (editingReq) {
      const res = updateRequest(editingReq.request_id, {
        request_type: newReqType,
        purpose: newPurpose || 'Yêu cầu cấp phát nội bộ (Bản nháp)',
        priority: newPriority,
        lines: linesToSubmit,
        attachment_file_name: attachedFileName || undefined,
        is_draft: true,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    } else {
      const res = createRequest({
        request_type: newReqType,
        purpose: newPurpose || 'Yêu cầu cấp phát nội bộ (Bản nháp)',
        priority: newPriority,
        lines: linesToSubmit,
        attachment_file_name: attachedFileName || undefined,
        is_draft: true,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
        setNewPurpose('');
        setAttachedFileName('');
        setIsExportedTemplate(false);
        setNewLines([{ category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' }]);
      }
    }
  };

  // Submit request to warehouse queue (Section 5.3.1 - step 26: Bắt buộc có file đính kèm đã ký duyệt ngoài phần mềm)
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that each line has an item specified
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i];
      if (!line.item_name.trim()) {
        alert(`Vui lòng điền vật tư cần đề xuất ở dòng #${i + 1}!`);
        return;
      }
    }

    if (!attachedFileName.trim()) {
      alert('THEO QUY ĐỊNH MỤC 5.3.1 (BƯỚC 26):\n\nBắt buộc phải đính kèm file phiếu đề xuất đã được lãnh đạo ký duyệt ngoài hệ thống (File mềm PDF/Scan) mới được gửi vào hàng đợi Thủ kho!\n\nNếu chưa có file ký duyệt ngay lúc này, bạn có thể bấm nút "Lưu nháp (Chưa cần file)" để lưu lại và bổ sung file sau.');
      return;
    }

    const linesToSubmit = prepareLinesToSubmit();

    if (editingReq) {
      const res = updateRequest(editingReq.request_id, {
        request_type: newReqType,
        purpose: newPurpose || 'Cấp phát vật tư phục vụ công tác',
        priority: newPriority,
        lines: linesToSubmit,
        attachment_file_name: attachedFileName,
        is_draft: false,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    } else {
      const res = createRequest({
        request_type: newReqType,
        purpose: newPurpose || 'Cấp phát vật tư phục vụ công tác',
        priority: newPriority,
        lines: linesToSubmit,
        attachment_file_name: attachedFileName,
        is_draft: false,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
        setNewPurpose('');
        setAttachedFileName('');
        setIsExportedTemplate(false);
        setNewLines([{ category_id: '', item_name: '', qty_requested: 1, unit_of_measure: '', note: '' }]);
      }
    }
  };

  // Open Allocation Modal for Thủ kho
  const handleOpenAllocationModal = (req: AssetRequest) => {
    setSelectedReq(req);
    const initialAlloc: typeof allocState = {};

    req.lines.forEach((l) => {
      const cat = categories.find((c) => c.category_id === l.category_id);
      const remainingQty = l.qty_requested - l.qty_issued;

      if (cat?.tracking_type === 'DINH_DANH') {
        // Pre-select matching available assets in this warehouse
        const matchingAvailableAssets = assets.filter(
          (a) => a.category_id === l.category_id && a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO'
        );
        const preselected = matchingAvailableAssets.slice(0, remainingQty).map((a) => a.asset_id);
        initialAlloc[l.request_line_id] = {
          selectedAssetIds: preselected,
          consumableQty: 0,
        };
      } else {
        // Consumable
        const stock = stockBalances.find(
          (s) => s.warehouse_id === selectedWarehouseId && s.category_id === l.category_id
        );
        const avail = stock?.quantity_on_hand || 0;
        initialAlloc[l.request_line_id] = {
          selectedAssetIds: [],
          consumableQty: Math.min(avail, remainingQty),
        };
      }
    });

    setAllocState(initialAlloc);
    setIsAllocatingModalOpen(true);
  };

  // Submit Allocation
  const handleConfirmAllocation = () => {
    if (!selectedReq) return;

    let totalAllocated = 0;
    const payload = selectedReq.lines.map((l) => {
      const currentAlloc = allocState[l.request_line_id] || {
        selectedAssetIds: [],
        consumableQty: 0,
      };
      const assetCount = currentAlloc.selectedAssetIds?.length || 0;
      const consQty = currentAlloc.consumableQty || 0;
      totalAllocated += assetCount + consQty;

      return {
        line_id: l.request_line_id,
        category_id: l.category_id,
        asset_ids: currentAlloc.selectedAssetIds,
        consumable_qty: currentAlloc.consumableQty,
      };
    });

    if (totalAllocated === 0) {
      alert('Vui lòng chọn ít nhất 1 thiết bị định danh hoặc nhập số lượng vật tư tiêu hao để thực hiện cấp phát!');
      return;
    }

    const res = issueRequestAllocation(selectedReq.request_id, payload);
    if (res.success) {
      alert(res.message);
      setIsAllocatingModalOpen(false);
      setSelectedReq(null);
    } else {
      alert(res.message || 'Cấp phát không thành công.');
    }
  };

  // Handle Reject Request
  const handleConfirmReject = () => {
    if (!selectedReq) return;
    if (!rejectReason.trim()) {
      alert('Bắt buộc phải nhập lý do từ chối yêu cầu!');
      return;
    }
    updateRequestStatus(selectedReq.request_id, 'TU_CHOI', rejectReason);
    alert(`Đã từ chối yêu cầu ${selectedReq.request_code}. CBNV sẽ nhận được thông báo kèm lý do.`);
    setIsRejectOpen(false);
    setSelectedReq(null);
    setRejectReason('');
  };

  const getStatusBadge = (status: AssetRequest['status']) => {
    switch (status) {
      case 'NHAP':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Bản nháp</span>;
      case 'CHO_TIEP_NHAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Chờ tiếp nhận</span>;
      case 'DA_TIEP_NHAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Đã tiếp nhận</span>;
      case 'DANG_CAP_PHAT':
      case 'CAP_MOT_PHAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Cấp một phần</span>;
      case 'CHO_MUA':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Đã chuyển PO mua</span>;
      case 'HOAN_THANH':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Hoàn thành</span>;
      case 'TU_CHOI':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">Từ chối</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getPriorityBadge = (p: AssetRequest['priority']) => {
    switch (p) {
      case 'KHAN_CAP':
        return <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">KHẨN CẤP</span>;
      case 'CAO':
        return <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">ƯU TIÊN CAO</span>;
      default:
        return <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">Bình thường</span>;
    }
  };

  const getRequestTypeName = (type: AssetRequest['request_type']) => {
    switch (type) {
      case 'CAP_VAN_PHONG_PHAM': return '1. Cấp văn phòng phẩm';
      case 'CAP_DONG_PHUC': return '2. Cấp đồng phục';
      case 'CAP_MAY_TINH_LAPTOP': return '3. Cấp máy tính / laptop';
      case 'CAP_THIET_BI_CNTT': return '4. Cấp thiết bị CNTT';
      default: return type;
    }
  };

  const displayedRequests = isWarehouseStaff
    ? (activeTab === 'WAREHOUSE_QUEUE' ? warehouseQueueRequests : myRequests)
    : myRequests;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              {isWarehouseStaff
                ? 'Phân hệ Quản lý Cấp phát Kho (UI07)'
                : 'Phân hệ Đề xuất Cấp phát CBNV (UI06)'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Người dùng: <strong className="text-slate-900">{currentUser.full_name}</strong> ({currentUser.role})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isWarehouseStaff
              ? 'Hàng Đợi Tiếp Nhận & Cấp Phát Vật Tư / Thiết Bị'
              : 'Đề Xuất Cấp Phát Vật Tư & Thiết Bị Làm Việc'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isWarehouseStaff
              ? 'Thủ kho kiểm tra tồn kho gợi ý, thực hiện tiếp nhận, từ chối, cấp phát đủ/một phần hoặc chuyển thành đơn thu mua PO.'
              : 'CBNV tạo đề xuất theo 4 loại chuẩn, điền vật tư cần cấp, in mẫu trình ký ngoài và đính kèm hồ sơ phê duyệt.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewRequest}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo đề xuất cấp phát mới
          </button>
        </div>
      </div>

      {/* View Switcher Tabs - Strictly role-gated */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-3 sm:px-6 pt-3 gap-3 sm:gap-4 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
        {isWarehouseStaff && (
          <button
            onClick={() => setActiveTab('WAREHOUSE_QUEUE')}
            className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'WAREHOUSE_QUEUE'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hàng Đợi Xử Lý Của Thủ Kho (UI07)
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-black">
              {warehouseQueueRequests.filter((r) => r.status === 'CHO_TIEP_NHAN').length} chờ duyệt
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('MY_REQUESTS')}
          className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
            activeTab === 'MY_REQUESTS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Yêu Cầu Do Tôi Tạo ({myRequests.length})
        </button>
      </div>

      {/* Main Request Table */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã yêu cầu</th>
                <th className="py-3 px-4">Người tạo & Đơn vị</th>
                <th className="py-3 px-4">Loại cấp phát & Mục đích</th>
                <th className="py-3 px-4">Mặt hàng & Tiến độ cấp</th>
                <th className="py-3 px-4">File trình ký</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">
                  {isWarehouseStaff ? 'Thao tác (Thủ kho)' : 'Tiến độ xử lý'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không có yêu cầu cấp phát nào trong danh sách.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req, idx) => {
                  const requester = employees.find((e) => e.employee_id === req.requester_id);
                  const isPending = req.status === 'CHO_TIEP_NHAN';
                  const isAccepted =
                    req.status === 'DA_TIEP_NHAN' ||
                    req.status === 'CAP_MOT_PHAN' ||
                    req.status === 'DANG_CAP_PHAT';

                  return (
                    <tr key={req.request_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{req.request_code}</span>
                        <span className="text-[10px] text-slate-400">{formatDateVN(req.created_at)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{requester?.full_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {requester?.position} • {requester?.department_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-emerald-800 text-[11px]">
                            {getRequestTypeName(req.request_type)}
                          </span>
                          {getPriorityBadge(req.priority)}
                        </div>
                        <p className="text-slate-600 line-clamp-1">{req.purpose}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {req.lines.map((l) => {
                            const cat = categories.find((c) => c.category_id === l.category_id);
                            return (
                              <div key={l.request_line_id} className="flex items-center justify-between gap-2">
                                <span className="font-medium text-slate-800">{cat?.name || l.note}:</span>
                                <span className="font-mono font-bold text-[11px]">
                                  {l.qty_issued}/{l.qty_requested} {cat?.unit_of_measure || 'Món'}
                                  {l.qty_issued >= l.qty_requested ? (
                                    <span className="text-emerald-700 ml-1">✓</span>
                                  ) : (
                                    <span className="text-amber-700 ml-1">
                                      (Thiếu {l.qty_requested - l.qty_issued})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {req.attachment_file ? (
                          <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-[11px] font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]">{req.attachment_file.file_name}</span>
                          </div>
                        ) : req.status === 'NHAP' ? (
                          <span className="text-slate-500 italic text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Chưa có file (Bản nháp)
                          </span>
                        ) : (
                          <span className="text-red-500 italic text-[11px]">Thiếu file trình ký</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(req.status)}
                        {req.rejection_reason && (
                          <div className="text-[10px] text-red-600 mt-0.5 italic max-w-[140px]">
                            Lý do: {req.rejection_reason}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS: Strictly role-gated. Normal CBNV CANNOT see warehouse operational buttons */}
                      <td className="py-3 px-4 text-center">
                        {isWarehouseStaff ? (
                          <div className="inline-flex flex-wrap items-center justify-center gap-1">
                            {/* Nút sửa yêu cầu đã tạo */}
                            <button
                              onClick={() => handleOpenEditRequest(req)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Chỉnh sửa thông tin đề xuất cấp phát và file đính kèm"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              {req.status === 'NHAP' ? 'Sửa & Gửi' : 'Sửa'}
                            </button>
                            {/* Bước 28: Nếu Thủ kho tiếp nhận */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => updateRequestStatus(req.request_id, 'DA_TIEP_NHAN')}
                                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[11px] transition cursor-pointer"
                                  title="Tiếp nhận xử lý yêu cầu (Mục 5.3.1 bước 28)"
                                >
                                  Tiếp nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setIsRejectOpen(true);
                                  }}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-[11px] transition cursor-pointer"
                                  title="Từ chối yêu cầu (bắt buộc nhập lý do)"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <>
                                <button
                                  onClick={() => handleOpenAllocationModal(req)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                                  title="Cấp phát thiết bị định danh hoặc trừ tồn tiêu hao"
                                >
                                  Cấp phát
                                </button>
                                <button
                                  onClick={() => {
                                    const res = addDemandFromRequest(req.request_id);
                                    alert(res.message);
                                  }}
                                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Đưa phần vật tư còn thiếu của yêu cầu này vào Trung Tâm Gom PO"
                                >
                                  <Boxes className="w-3.5 h-3.5 text-purple-700" />
                                  Đưa vào Gom PO
                                </button>
                              </>
                            )}

                            {req.status === 'CHO_MUA' && (
                              <div className="inline-flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleOpenAllocationModal(req)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                                  title="Cấp phát thiết bị định danh hoặc trừ tồn tiêu hao khi hàng mua về kho đã sẵn sàng"
                                >
                                  Cấp phát
                                </button>
                                <span className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[11px] font-semibold flex items-center gap-1" title="Yêu cầu này đã được đưa vào Gom PO mua sắm">
                                  <Boxes className="w-3 h-3 text-purple-600" />
                                  Đã gom PO
                                </span>
                              </div>
                            )}

                            {req.status === 'HOAN_THANH' && (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Hoàn thành cấp phát
                              </span>
                            )}

                            {req.status === 'TU_CHOI' && (
                              <span className="px-2 py-1 bg-red-50 text-red-800 border border-red-200 rounded text-[11px] font-semibold flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-600" />
                                Đã từ chối
                              </span>
                            )}

                            {/* In biểu mẫu */}
                            <button
                              onClick={() => {
                                onOpenTemplates('PHIEU_DE_XUAT_CAP_PHAT', {
                                  requesterName: requester?.full_name,
                                  department: requester?.department_id,
                                  purpose: req.purpose,
                                  itemName: categories.find((c) => c.category_id === req.lines[0]?.category_id)?.name,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Xem biểu mẫu in ấn phiếu đề xuất"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* For normal CBNV: view status & edit when draft/pending */
                          <div className="inline-flex items-center gap-1.5 flex-wrap">
                            {req.status === 'NHAP' && (
                              <span className="text-[11px] text-slate-600 font-medium px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                                Bản nháp (Chưa gửi)
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[11px] text-amber-700 font-medium px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                                Đang chờ Thủ kho tiếp nhận
                              </span>
                            )}
                            <button
                              onClick={() => handleOpenEditRequest(req)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title={req.status === 'NHAP' ? "Tiếp tục chỉnh sửa hoặc đính kèm file để gửi duyệt" : "Chỉnh sửa thông tin đề xuất đã tạo"}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              {req.status === 'NHAP' ? 'Sửa & Gửi duyệt' : 'Sửa'}
                            </button>
                            {isAccepted && (
                              <span className="text-[11px] text-blue-700 font-medium px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                Đã tiếp nhận • Chờ giao hàng
                              </span>
                            )}
                            {req.status === 'HOAN_THANH' && (
                              <span className="text-[11px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã hoàn thành cấp phát
                              </span>
                            )}
                            {req.status === 'CHO_MUA' && (
                              <span className="text-[11px] text-purple-700 font-medium px-2 py-0.5 bg-purple-50 rounded border border-purple-200">
                                Kho đã đưa vào Gom PO thu mua
                              </span>
                            )}
                            {req.status === 'TU_CHOI' && (
                              <span className="text-[11px] text-red-700 font-medium px-2 py-0.5 bg-red-50 rounded border border-red-200">
                                Bị từ chối
                              </span>
                            )}

                            <button
                              onClick={() => {
                                onOpenTemplates('PHIEU_DE_XUAT_CAP_PHAT', {
                                  requesterName: requester?.full_name,
                                  department: requester?.department_id,
                                  purpose: req.purpose,
                                  itemName: categories.find((c) => c.category_id === req.lines[0]?.category_id)?.name,
                                });
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded transition"
                              title="Xem lại biểu mẫu phiếu đề xuất"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: TẠO ĐỀ XUẤT CẤP PHÁT MỚI (CBNV) --- */}
      {/* KHÔNG ĐIỀN TRƯỚC THÔNG TIN, CÓ GỢI Ý AUTOCOMPLETE KHI GÕ THEO YÊU CẦU */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  {editingReq ? (
                    <>
                      <Edit3 className="w-4 h-4 text-amber-300" />
                      Chỉnh Sửa Đề Xuất Cấp Phát [{editingReq.request_code}]
                    </>
                  ) : (
                    'Tạo Đề Xuất Cấp Phát Vật Tư / Thiết Bị (UI06)'
                  )}
                </h3>
                <p className="text-xs text-emerald-200">
                  {editingReq
                    ? `Trạng thái: ${editingReq.status === 'NHAP' ? 'Bản nháp' : 'Chờ tiếp nhận'} • Bạn có thể chỉnh sửa mặt hàng, số lượng và đính kèm file ký số khi hoàn tất`
                    : `Người đề xuất: ${currentUser.full_name} (${currentUser.employee_code}) - ${currentUser.position}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewRequestOpen(false);
                  setEditingReq(null);
                }}
                className="text-emerald-200 hover:text-white cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại đề xuất cấp phát:</label>
                  <select
                    value={newReqType}
                    onChange={(e) => setNewReqType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-emerald-600"
                  >
                    <option value="CAP_VAN_PHONG_PHAM">1. Cấp văn phòng phẩm</option>
                    <option value="CAP_DONG_PHUC">2. Cấp đồng phục</option>
                    <option value="CAP_MAY_TINH_LAPTOP">3. Cấp máy tính / laptop</option>
                    <option value="CAP_THIET_BI_CNTT">4. Cấp thiết bị CNTT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-emerald-600"
                  >
                    <option value="TRUNG_BINH">Bình thường</option>
                    <option value="CAO">Ưu tiên cao</option>
                    <option value="KHAN_CAP">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mục đích sử dụng & Diễn giải nhu cầu:
                </label>
                <textarea
                  rows={2}
                  required
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="Ví dụ: Trang bị phục vụ nhân sự mới nhận việc tại phòng ban..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              {/* Danh sách mặt hàng đề xuất - CÓ GỢI Ý TỰ ĐỘNG KHI GÕ, KHÔNG ĐIỀN TRƯỚC */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Danh mục mặt hàng & số lượng đề xuất:
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      CBNV chỉ cần chọn tên hàng hóa chung (VD: <strong>Laptop văn phòng</strong>, <strong>Máy tính để bàn</strong>...). Bộ phận Kho & Thu mua sẽ chỉ định rõ Hãng & Cấu hình chi tiết khi mua sắm/cấp phát.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm mặt hàng
                  </button>
                </div>

                {newLines.map((line, idx) => {
                  // Filter categories based on what the user types in item_name
                  const matchingSuggestions = line.item_name.trim()
                    ? categories.filter(
                        (c) =>
                          c.name.toLowerCase().includes(line.item_name.toLowerCase()) ||
                          c.code.toLowerCase().includes(line.item_name.toLowerCase()) ||
                          c.group.toLowerCase().includes(line.item_name.toLowerCase())
                      )
                    : categories.slice(0, 6); // show top 6 popular if empty

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          Mặt hàng #{idx + 1}:
                        </span>
                        {newLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            Xóa dòng
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* INPUT 1: Điền tên vật tư cần đề xuất (Có autocomplete dropdown) */}
                        <div className="sm:col-span-6 relative">
                          <label className="text-[11px] text-slate-500 block mb-0.5">
                            Tên hàng hóa / Vật tư cần đề xuất:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={line.item_name}
                              onFocus={() => setActiveSuggestionIdx(idx)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewLines((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, item_name: val } : l))
                                );
                                setActiveSuggestionIdx(idx);
                              }}
                              placeholder="VD: Laptop văn phòng, Giấy in A4..."
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-emerald-600 font-medium"
                            />
                            {line.category_id && (
                              <span className="absolute right-2 top-2 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                Đã khớp danh mục
                              </span>
                            )}
                          </div>

                          {/* Autocomplete Suggestions Popover */}
                          {activeSuggestionIdx === idx && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                              <div className="p-1.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                <span>Gợi ý hàng hóa chung (Người dùng không cần chọn Hãng/Cấu hình):</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveSuggestionIdx(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  ✕
                                </button>
                              </div>
                              {matchingSuggestions.length === 0 ? (
                                <div className="p-3 text-slate-400 text-center text-xs">
                                  Không tìm thấy vật tư trùng khớp. Bạn vẫn có thể nhập tên này như một yêu cầu mới.
                                </div>
                              ) : (
                                matchingSuggestions.map((cat) => (
                                  <button
                                    key={cat.category_id}
                                    type="button"
                                    onClick={() => handleSelectCategory(idx, cat)}
                                    className="w-full text-left p-2 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition flex items-center justify-between cursor-pointer"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-900 text-xs">
                                        {cat.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        Nhóm: {cat.group} • ĐVT: <strong className="text-slate-700">{cat.unit_of_measure}</strong>
                                        {cat.supported_brands && cat.supported_brands.length > 0 && (
                                          <span className="ml-1 text-indigo-700">
                                            (Kho/Thu mua sẽ chọn Hãng: {cat.supported_brands.slice(0, 3).join(', ')}...)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        cat.tracking_type === 'DINH_DANH'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {cat.tracking_type === 'DINH_DANH' ? 'Định danh' : 'Tiêu hao'}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* INPUT 2: Số lượng đề xuất */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-500 block mb-0.5">
                            Số lượng ({line.unit_of_measure || 'ĐVT'}):
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={line.qty_requested}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setNewLines((prev) =>
                                prev.map((l, i) => (i === idx ? { ...l, qty_requested: val } : l))
                              );
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-bold font-mono focus:outline-emerald-600 text-xs"
                            placeholder="Số lượng"
                          />
                        </div>

                        {/* INPUT 3: Note quy cách / mục đích */}
                        <div className="sm:col-span-4">
                          <label className="text-[11px] text-slate-500 block mb-0.5">
                            Ghi chú nhu cầu (Không bắt buộc):
                          </label>
                          <input
                            type="text"
                            value={line.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewLines((prev) =>
                                prev.map((l, i) => (i === idx ? { ...l, note: val } : l))
                              );
                            }}
                            placeholder="VD: Dùng cho công việc kế toán / thiết kế..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RÀNG BUỘC THEO MỤC 5.3.1 BƯỚC 25 & 26: BIỂU MẪU XUẤT & FILE ĐÍNH KÈM BẮT BUỘC */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Biểu mẫu trình ký & Phê duyệt ngoài hệ thống (Mục 5.3.1)
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Bước 1: Bấm "Xuất phiếu yêu cầu" để in mẫu trình lãnh đạo ký ngoài.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportedTemplate(true);
                      onOpenTemplates('PHIEU_DE_XUAT_CAP_PHAT', {
                        requesterName: currentUser.full_name,
                        department: currentUser.department_id,
                        purpose: newPurpose || 'Cấp phát phục vụ công tác chuyên môn',
                        itemName: newLines[0]?.item_name || 'Vật tư đề xuất',
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    1. Xuất phiếu yêu cầu (Mẫu in)
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-emerald-950">
                      Bước 2: Đính kèm file phiếu đã được lãnh đạo phê duyệt:
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                      Chưa có file có thể Lưu nháp
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mb-1.5">
                    * Bắt buộc có file đính kèm khi <strong>"Gửi yêu cầu"</strong> vào hàng đợi Thủ kho theo quy định mục 5.3.1. Nếu chưa kịp ký duyệt ngoài phần mềm, bạn có thể bấm <strong>"Lưu nháp (Chưa cần file)"</strong> bên dưới để lưu lại mà không cần file.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={attachedFileName}
                      onChange={(e) => setAttachedFileName(e.target.value)}
                      placeholder="Ví dụ: Phieu_de_xuat_cap_thiet_bi_signed.pdf"
                      className="flex-1 bg-white border border-emerald-300 rounded-lg p-2 font-mono text-xs focus:outline-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedFileName(`Phieu_de_xuat_${Date.now().toString().slice(-4)}_signed.pdf`)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      Mô phỏng đính kèm file đã ký
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRequestOpen(false);
                    setEditingReq(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition"
                    title="Lưu lại yêu cầu dạng bản nháp mà không cần file đính kèm"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-700" />
                    Lưu nháp (Chưa cần file)
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition"
                    title="Gửi yêu cầu vào hàng đợi xử lý của Thủ kho (Bắt buộc có file đính kèm)"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {editingReq && editingReq.status !== 'NHAP' ? 'Lưu & Cập nhật' : 'Gửi yêu cầu (Vào hàng đợi Thủ kho)'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: THỦ KHO CẤP PHÁT CHI TIẾT (Chỉ Thủ Kho truy cập được) --- */}
      {isAllocatingModalOpen && selectedReq && isWarehouseStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Thủ Kho Cấp Phát Cho Yêu Cầu {selectedReq.request_code} (UI07)
                </h3>
                <p className="text-xs text-emerald-200">
                  Người nhận: {employees.find((e) => e.employee_id === selectedReq.requester_id)?.full_name} • Kho xuất: {currentWh?.name}
                </p>
              </div>
              <button onClick={() => setIsAllocatingModalOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
                <span className="font-bold block mb-1">Cấp phát rõ ràng Hãng & Cấu hình cho yêu cầu chung của CBNV:</span>
                CBNV chỉ yêu cầu mặt hàng chung (VD: Laptop văn phòng). Thủ kho kiểm tra danh sách thiết bị đang sẵn có trong kho theo từng <strong>Hãng, Dòng máy (Model) & Cấu hình chi tiết</strong> để chọn bàn giao chính xác.
              </div>

              {selectedReq.lines.map((l) => {
                const cat = categories.find((c) => c.category_id === l.category_id);
                const isSerialized = cat?.tracking_type === 'DINH_DANH';
                const currentAlloc = allocState[l.request_line_id] || { selectedAssetIds: [], consumableQty: 0 };
                const remaining = l.qty_requested - l.qty_issued;

                if (isSerialized) {
                  const availableAssets = assets.filter(
                    (a) => a.category_id === l.category_id && a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO'
                  );

                  return (
                    <div key={l.request_line_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{cat?.name || l.note}</span>
                          <span className="text-slate-500 block text-[11px]">
                            Yêu cầu: {l.qty_requested} • Đã cấp: {l.qty_issued} • Cần cấp thêm: <strong className="text-emerald-800">{remaining} chiếc</strong>
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Kho có sẵn: {availableAssets.length} chiếc
                        </span>
                      </div>

                      {availableAssets.length === 0 ? (
                        <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                          {selectedReq.status === 'CHO_MUA' ? (
                            <span>
                              📦 Mặt hàng này đã được đưa vào <strong>Gom PO mua sắm</strong>. Khi đơn hàng PO mua sắm được nghiệm thu nhập kho, thiết bị định danh (với Hãng, Cấu hình, Serial & QR) sẽ hiển thị tại đây để bạn chọn cấp phát ngay.
                            </span>
                          ) : (
                            <span>
                              ⚠️ Kho hiện không còn thiết bị này ở trạng thái TRONG KHO! Hãy bấm nút <strong>"Đưa vào Gom PO"</strong> tại hàng đợi để tổng hợp mua hàng (bộ phận Thu mua sẽ chọn Hãng & Cấu hình đặt mua).
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1.5">
                            Chọn thiết bị định danh cụ thể theo Hãng & Cấu hình để bàn giao ({currentAlloc.selectedAssetIds.length}/{remaining} đã chọn):
                          </span>
                          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1">
                            {availableAssets.map((ast) => {
                              const isChecked = currentAlloc.selectedAssetIds.includes(ast.asset_id);
                              return (
                                <label
                                  key={ast.asset_id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setAllocState((prev) => {
                                        const oldIds = prev[l.request_line_id]?.selectedAssetIds || [];
                                        const newIds = checked
                                          ? [...oldIds, ast.asset_id]
                                          : oldIds.filter((id) => id !== ast.asset_id);
                                        return {
                                          ...prev,
                                          [l.request_line_id]: {
                                            ...prev[l.request_line_id],
                                            selectedAssetIds: newIds,
                                          },
                                        };
                                      });
                                    }}
                                    className="accent-emerald-700 mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[10px]">
                                          {ast.brand || 'Chưa rõ hãng'}
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs">
                                          {ast.model_name || cat?.name}
                                        </span>
                                      </div>
                                      <div className="font-mono text-[11px]">
                                        <span className="font-bold text-emerald-800">{ast.asset_code}</span>
                                        <span className="text-slate-400 mx-1">•</span>
                                        <span className="text-slate-600">SN: {ast.serial_no}</span>
                                      </div>
                                    </div>
                                    {ast.specifications && (
                                      <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        <span className="font-semibold text-slate-700">Cấu hình: </span>
                                        {ast.specifications}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const stock = stockBalances.find(
                    (s) => s.warehouse_id === selectedWarehouseId && s.category_id === l.category_id
                  );
                  const avail = stock?.quantity_on_hand || 0;

                  return (
                    <div key={l.request_line_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{cat?.name || l.note}</span>
                          <span className="text-slate-500 block text-[11px]">
                            Yêu cầu: {l.qty_requested} {cat?.unit_of_measure || 'Món'} • Tồn kho khả dụng: <strong className="text-emerald-800">{avail} {cat?.unit_of_measure || 'Món'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">SL cấp đợt này:</span>
                          <input
                            type="number"
                            min={0}
                            max={avail}
                            value={currentAlloc.consumableQty}
                            onChange={(e) => {
                              const val = Math.min(avail, Math.max(0, Number(e.target.value)));
                              setAllocState((prev) => ({
                                ...prev,
                                [l.request_line_id]: {
                                  ...prev[l.request_line_id],
                                  consumableQty: val,
                                },
                              }));
                            }}
                            className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold font-mono focus:outline-emerald-600"
                          />
                        </div>
                      </div>

                      {avail === 0 && (
                        <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                          {selectedReq.status === 'CHO_MUA' ? (
                            <span>
                              📦 Mặt hàng này đã được đưa vào <strong>Gom PO mua sắm</strong>. Khi đơn hàng PO được nghiệm thu nhập kho, tồn kho khả dụng sẽ tự động tăng để tiến hành cấp phát.
                            </span>
                          ) : (
                            <span>
                              ⚠️ Kho hiện hết tồn kho khả dụng! Bạn có thể bấm <strong>"Đưa vào Gom PO"</strong> tại hàng đợi để đề xuất mua sắm.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Nếu không cấp đủ toàn bộ, yêu cầu sẽ chuyển thành "CẤP MỘT PHẦN" và bạn có thể bấm "Đưa vào Gom PO" để gom mua sắm cùng các đơn khác.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocatingModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllocation}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Xác nhận cấp phát & Cập nhật kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: TỪ CHỐI YÊU CẦU (Chỉ Thủ Kho truy cập được) --- */}
      {isRejectOpen && selectedReq && isWarehouseStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-red-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Từ Chối Yêu Cầu Cấp Phát {selectedReq.request_code}</h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-red-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-red-50 text-red-900 rounded-lg text-xs leading-relaxed">
                Theo quy định mục 5.3.1 (bước 29) & ca kiểm thử TC11: 
                <strong> Bắt buộc phải nhập lý do từ chối</strong> để CBNV xem được kết quả và kết thúc yêu cầu.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do từ chối (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Đã vượt định mức văn phòng phẩm quý 4 / Chưa có phê duyệt bổ sung ngân sách..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-red-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận từ chối yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
