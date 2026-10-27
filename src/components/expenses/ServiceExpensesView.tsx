import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Download,
  DollarSign,
  FileText,
  Paperclip,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  Printer,
  X,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronRight,
  Building2,
  Tag,
  FolderTree,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceExpense, ExpenseCategory } from '../../types';
import { formatDateVN, formatVND } from '../../utils/excelExporter';

// Cấu trúc Cây Danh Mục Chi Phí Chuẩn THACO AGRI (3 Tầng: Mã gốc -> Nhóm chính -> Phân nhóm nghiệp vụ)
export interface StandardSubGroup {
  group_code: string;
  sub_title: string;
  group_name: string;
  parent_code: string;
  parent_name: string;
  root_code: 'CPVH' | 'CPPL';
  root_type: string;
}

export const THACO_STANDARD_SUBGROUPS: StandardSubGroup[] = [
  // 1. CHI PHÍ VẬN HÀNH & CÔNG TÁC (Mã gốc: CPVH)
  // 1. Chi phí Công tác & Tiếp khách (CPVH-CT)
  {
    group_code: 'CPVH-CT-MS',
    sub_title: 'Di chuyển, lưu trú',
    group_name: 'Di chuyển, lưu trú (Công tác & Tiếp khách)',
    parent_code: 'CPVH-CT',
    parent_name: 'Chi phí Công tác & Tiếp khách (CPVH-CT)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  {
    group_code: 'CPVH-CT-TK',
    sub_title: 'Ăn uống, hội nghị',
    group_name: 'Ăn uống, hội nghị (Công tác & Tiếp khách)',
    parent_code: 'CPVH-CT',
    parent_name: 'Chi phí Công tác & Tiếp khách (CPVH-CT)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  // 2. Chi phí văn phòng & Hạ tầng (CPVH-VP)
  {
    group_code: 'CPVH-VP-SUA',
    sub_title: 'Bảo trì & Sửa chữa',
    group_name: 'Bảo trì & Sửa chữa (Văn phòng & Hạ tầng)',
    parent_code: 'CPVH-VP',
    parent_name: 'Chi phí văn phòng & Hạ tầng (CPVH-VP)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  {
    group_code: 'CPVH-VP-THU',
    sub_title: 'Thuê ngoài',
    group_name: 'Thuê ngoài (Văn phòng & Hạ tầng)',
    parent_code: 'CPVH-VP',
    parent_name: 'Chi phí văn phòng & Hạ tầng (CPVH-VP)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  {
    group_code: 'CPVH-VP-VT',
    sub_title: 'Viễn thông & Chuyển phát',
    group_name: 'Viễn thông & Chuyển phát (Văn phòng & Hạ tầng)',
    parent_code: 'CPVH-VP',
    parent_name: 'Chi phí văn phòng & Hạ tầng (CPVH-VP)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  {
    group_code: 'CPVH-VP-MT',
    sub_title: 'Môi trường & Tiện ích',
    group_name: 'Môi trường & Tiện ích (Văn phòng & Hạ tầng)',
    parent_code: 'CPVH-VP',
    parent_name: 'Chi phí văn phòng & Hạ tầng (CPVH-VP)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  // 3. Chi phí Năng lượng & Nhiên liệu (CPVH-NL)
  {
    group_code: 'CPVH-NL-SH',
    sub_title: 'Điện nước sinh hoạt',
    group_name: 'Điện nước sinh hoạt (Năng lượng & Nhiên liệu)',
    parent_code: 'CPVH-NL',
    parent_name: 'Chi phí Năng lượng & Nhiên liệu (CPVH-NL)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  {
    group_code: 'CPVH-NL-XE',
    sub_title: 'Xăng dầu',
    group_name: 'Xăng dầu (Năng lượng & Nhiên liệu)',
    parent_code: 'CPVH-NL',
    parent_name: 'Chi phí Năng lượng & Nhiên liệu (CPVH-NL)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  // 4. Chi phí xe & Phí hành chính (CPVH-XE)
  {
    group_code: 'CPVH-XE',
    sub_title: 'Phí xe & Bảo dưỡng xe',
    group_name: 'Phí xe & Phí hành chính (CPVH-XE)',
    parent_code: 'CPVH-XE',
    parent_name: 'Chi phí xe & Phí hành chính (CPVH-XE)',
    root_code: 'CPVH',
    root_type: '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
  },
  // 2. CHI PHÍ GIAO TẾ & PHÚC LỢI (Mã gốc: CPPL)
  // 1. Phúc lợi Nội bộ (CB-NV) (CPPL-NV)
  {
    group_code: 'CPPL-NV',
    sub_title: 'Phúc lợi Nội bộ (CB-NV)',
    group_name: 'Phúc lợi Nội bộ CB-NV (CPPL-NV)',
    parent_code: 'CPPL-NV',
    parent_name: 'Phúc lợi Nội bộ (CB-NV) (CPPL-NV)',
    root_code: 'CPPL',
    root_type: '2. CHI PHÍ GIAO TẾ & PHÚC LỢI',
  },
  // 2. Giao tế Đối ngoại (CPPL-KH)
  {
    group_code: 'CPPL-KH',
    sub_title: 'Giao tế Đối ngoại',
    group_name: 'Giao tế Đối ngoại (CPPL-KH)',
    parent_code: 'CPPL-KH',
    parent_name: 'Giao tế Đối ngoại (CPPL-KH)',
    root_code: 'CPPL',
    root_type: '2. CHI PHÍ GIAO TẾ & PHÚC LỢI',
  },
];

interface ServiceExpensesViewProps {
  onOpenCategoryConfig?: () => void;
}

export const ServiceExpensesView: React.FC<ServiceExpensesViewProps> = ({
  onOpenCategoryConfig,
}) => {
  const {
    serviceExpenses,
    expenseCategories,
    suppliers,
    currentUser,
    addServiceExpense,
    updateServiceExpense,
    deleteServiceExpense,
  } = useApp();

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Search and Filters for Ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Modal States for Service Expense Entry
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ServiceExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ServiceExpense | null>(null);
  const [quickCategorySearch, setQuickCategorySearch] = useState('');
  const [formRootFilter, setFormRootFilter] = useState<'ALL' | 'CPVH' | 'CPPL'>('ALL');

  // Form State for Expense Entry
  const [formData, setFormData] = useState({
    occurred_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    group_code: '',
    group_name: '',
    expense_category_id: '',
    expense_name: '',
    category_type: '',
    supplier_id: '',
    supplier_name: '',
    amount: '' as string | number,
    description: '',
    invoice_ref: '',
    attachment_file: '',
  });

  // Extract structured groups from expense categories
  const expenseGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        group_code: string;
        group_name: string;
        sub_title: string;
        parent_code: string;
        parent_name: string;
        root_code: 'CPVH' | 'CPPL';
        root_type: string;
        count: number;
      }
    >();

    // Initialize in standard THACO AGRI order first
    THACO_STANDARD_SUBGROUPS.forEach((std) => {
      map.set(std.group_code, {
        ...std,
        count: 0,
      });
    });

    expenseCategories.forEach((c) => {
      const gCode = c.group_code || 'CPVH-VP-MT';
      if (!map.has(gCode)) {
        const isCPPL = gCode.startsWith('CPPL') || (c.category_type && c.category_type.startsWith('2.'));
        map.set(gCode, {
          group_code: gCode,
          group_name: c.group_name || 'Nhóm chi phí khác',
          sub_title: c.group_name || gCode,
          parent_code: isCPPL ? 'CPPL-KH' : 'CPVH-VP',
          parent_name: c.group_name || 'Nhóm chi phí bổ sung',
          root_code: isCPPL ? 'CPPL' : 'CPVH',
          root_type: c.category_type || '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
          count: 0,
        });
      }
      map.get(gCode)!.count++;
    });

    return Array.from(map.values());
  }, [expenseCategories]);

  // Extract unique category types
  const categoryTypes = useMemo(() => {
    const types = new Set<string>([
      '1. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
      '2. CHI PHÍ GIAO TẾ & PHÚC LỢI',
    ]);
    expenseCategories.forEach((c) => {
      if (c.category_type) types.add(c.category_type);
    });
    return Array.from(types);
  }, [expenseCategories]);

  // Extract available months from expenses
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    serviceExpenses.forEach((e) => {
      if (e.occurred_at) {
        months.add(e.occurred_at.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [serviceExpenses]);

  // Groups filtered by Root (CPVH / CPPL) in the Entry Form
  const filteredGroupsForForm = useMemo(() => {
    if (formRootFilter === 'ALL') return expenseGroups;
    return expenseGroups.filter((g) => g.root_code === formRootFilter);
  }, [expenseGroups, formRootFilter]);

  // Categories filtered by currently selected group in the form
  const availableCategoriesInGroup = useMemo(() => {
    const activeCats = expenseCategories.filter((c) => c.is_active !== false);
    if (!formData.group_code) return activeCats;
    return activeCats.filter((c) => c.group_code === formData.group_code);
  }, [expenseCategories, formData.group_code]);

  // Quick search suggestions across all 40 categories inside the Form Modal
  const quickMatchedCategories = useMemo(() => {
    const q = quickCategorySearch.trim().toLowerCase();
    if (!q) return [];
    return expenseCategories
      .filter(
        (c) =>
          c.is_active !== false &&
          (c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            (c.group_code && c.group_code.toLowerCase().includes(q)) ||
            (c.group_name && c.group_name.toLowerCase().includes(q)) ||
            (c.description && c.description.toLowerCase().includes(q)))
      )
      .slice(0, 8);
  }, [expenseCategories, quickCategorySearch]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return serviceExpenses.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expense_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_ref && item.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.group_code && item.group_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.group_name && item.group_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchGroup =
        selectedGroupFilter === 'ALL' ||
        item.group_code === selectedGroupFilter ||
        (item.group_code && item.group_code.startsWith(selectedGroupFilter));

      const matchSupplier =
        selectedSupplierId === 'ALL' || item.supplier_id === selectedSupplierId;

      const matchCategoryType =
        selectedCategoryType === 'ALL' || item.category_type === selectedCategoryType;

      const matchMonth =
        monthFilter === 'ALL' || (item.occurred_at && item.occurred_at.startsWith(monthFilter));

      return matchSearch && matchGroup && matchSupplier && matchCategoryType && matchMonth;
    });
  }, [
    serviceExpenses,
    searchTerm,
    selectedGroupFilter,
    selectedSupplierId,
    selectedCategoryType,
    monthFilter,
  ]);

  // KPI Calculations
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalCPVH = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category_type.startsWith('1.') || (e.group_code && e.group_code.startsWith('CPVH')))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalCPPL = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category_type.startsWith('2.') || (e.group_code && e.group_code.startsWith('CPPL')))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const topSupplier = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((item) => {
      map.set(item.supplier_name, (map.get(item.supplier_name) || 0) + item.amount);
    });
    let maxName = 'Chưa có';
    let maxVal = 0;
    map.forEach((val, name) => {
      if (val > maxVal) {
        maxVal = val;
        maxName = name;
      }
    });
    return { name: maxName, amount: maxVal };
  }, [filteredExpenses]);

  // Open Create Expense Form
  const handleOpenCreateModal = (preselectedCat?: ExpenseCategory, preselectedGroupCode?: string) => {
    setEditingExpense(null);
    setQuickCategorySearch('');
    const targetGroupCode =
      preselectedCat?.group_code || preselectedGroupCode || expenseGroups[0]?.group_code || 'CPVH-CT-MS';
    const targetGroup = expenseGroups.find((g) => g.group_code === targetGroupCode) || expenseGroups[0];
    const itemsInGroup = expenseCategories.filter((c) => c.group_code === targetGroupCode);
    const defaultCat = preselectedCat || itemsInGroup[0] || expenseCategories[0];
    const defaultSupplier = suppliers[0];

    setFormRootFilter(
      targetGroupCode.startsWith('CPPL') ? 'CPPL' : targetGroupCode.startsWith('CPVH') ? 'CPVH' : 'ALL'
    );

    setFormData({
      occurred_at: new Date().toISOString().slice(0, 16),
      group_code: defaultCat?.group_code || targetGroup?.group_code || '',
      group_name: defaultCat?.group_name || targetGroup?.group_name || '',
      expense_category_id: defaultCat?.expense_category_id || '',
      expense_name: defaultCat?.name || '',
      category_type: defaultCat?.category_type || targetGroup?.root_type || 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
      supplier_id: defaultSupplier?.supplier_id || '',
      supplier_name: defaultSupplier?.name || '',
      amount: '',
      description: defaultCat?.description || '',
      invoice_ref: '',
      attachment_file: '',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (expense: ServiceExpense) => {
    setEditingExpense(expense);
    setQuickCategorySearch('');
    setFormRootFilter('ALL');
    setFormData({
      occurred_at: expense.occurred_at
        ? expense.occurred_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      group_code: expense.group_code || '',
      group_name: expense.group_name || '',
      expense_category_id: expense.expense_category_id,
      expense_name: expense.expense_name,
      category_type: expense.category_type,
      supplier_id: expense.supplier_id,
      supplier_name: expense.supplier_name,
      amount: expense.amount,
      description: expense.description,
      invoice_ref: expense.invoice_ref || '',
      attachment_file: expense.attachment_file || '',
    });
    setIsFormModalOpen(true);
  };

  // Handle Root Filter Switch inside Form Modal
  const handleFormRootSwitch = (root: 'ALL' | 'CPVH' | 'CPPL') => {
    setFormRootFilter(root);
    const matchingGroups =
      root === 'ALL' ? expenseGroups : expenseGroups.filter((g) => g.root_code === root);
    if (matchingGroups.length > 0 && !matchingGroups.some((g) => g.group_code === formData.group_code)) {
      handleGroupChange(matchingGroups[0].group_code);
    }
  };

  // Handle Parent Group Change (Cascading: selects first child item in that group)
  const handleGroupChange = (groupCode: string) => {
    const group = expenseGroups.find((g) => g.group_code === groupCode);
    const items = expenseCategories.filter((c) => c.group_code === groupCode && c.is_active !== false);
    const firstItem = items[0];

    setFormData((prev) => ({
      ...prev,
      group_code: groupCode,
      group_name: group?.group_name || '',
      category_type: group?.root_type || prev.category_type,
      expense_category_id: firstItem ? firstItem.expense_category_id : '',
      expense_name: firstItem ? firstItem.name : '',
      description: firstItem?.description || prev.description,
    }));
  };

  // Handle Category Change in Form (Autofill group, category_type, name & description)
  const handleCategoryChange = (catId: string) => {
    const cat = expenseCategories.find((c) => c.expense_category_id === catId);
    if (cat) {
      setFormData((prev) => ({
        ...prev,
        expense_category_id: cat.expense_category_id,
        expense_name: cat.name,
        group_code: cat.group_code || prev.group_code,
        group_name: cat.group_name || prev.group_name,
        category_type: cat.category_type || prev.category_type,
        description: cat.description || prev.description,
      }));
    }
  };

  // Handle Supplier Change in Form
  const handleSupplierChange = (supId: string) => {
    const sup = suppliers.find((s) => s.supplier_id === supId);
    if (sup) {
      setFormData((prev) => ({
        ...prev,
        supplier_id: sup.supplier_id,
        supplier_name: sup.name,
      }));
    }
  };

  // Save Service Expense
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.expense_name.trim()) {
      alert('Vui lòng chọn hoặc nhập Tên chi phí!');
      return;
    }
    if (!formData.supplier_name.trim()) {
      alert('Vui lòng chọn Nhà cung cấp dịch vụ!');
      return;
    }
    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Vui lòng nhập số tiền chi phí hợp lệ lớn hơn 0!');
      return;
    }

    if (editingExpense) {
      const res = await updateServiceExpense(editingExpense.expense_id, {
        ...formData,
        amount: numAmount,
        occurred_at: new Date(formData.occurred_at).toISOString(),
      });
      showToast(res.message);
    } else {
      const res = await addServiceExpense({
        ...formData,
        amount: numAmount,
        occurred_at: new Date(formData.occurred_at).toISOString(),
      });
      showToast(res.message);
    }

    setIsFormModalOpen(false);
  };

  // Delete Service Expense
  const handleDeleteExpense = async (id: string, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu chi phí dịch vụ ${code}?`)) {
      const res = await deleteServiceExpense(id);
      showToast(res.message);
    }
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('Không có dữ liệu chi phí dịch vụ để xuất!');
      return;
    }

    const headers = [
      'STT',
      'Mã phiếu',
      'Thời gian phát sinh',
      'Mã nhóm',
      'Tên nhóm chi phí',
      'Tên khoản mục chi phí',
      'Loại áp dụng (Mã gốc)',
      'Nhà cung cấp',
      'Số tiền (VND)',
      'Số hóa đơn',
      'Diễn giải',
      'Người tạo',
    ];

    const rows = filteredExpenses.map((e, idx) => [
      idx + 1,
      `"${e.expense_code}"`,
      `"${formatDateVN(e.occurred_at)}"`,
      `"${e.group_code || 'CPVH'}"`,
      `"${(e.group_name || '').replace(/"/g, '""')}"`,
      `"${e.expense_name.replace(/"/g, '""')}"`,
      `"${e.category_type.replace(/"/g, '""')}"`,
      `"${e.supplier_name.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.invoice_ref || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.created_by}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Ke_Chi_Phi_THACO_AGRI_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-600 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5" />
              Phân Hệ Quản Lý Chi Phí Dịch Vụ (CPVH & CPPL)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Người thực hiện: <strong className="text-slate-900">{currentUser.full_name}</strong> ({currentUser.role})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Sổ Nhật Ký & Nhập Phiếu Chi Phí Dịch Vụ Theo Nhà Cung Cấp
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Ghi nhận chi phí theo danh mục chuẩn THACO AGRI (1. Chi phí Vận hành & Công tác `CPVH` và 2. Chi phí Giao tế & Phúc lợi `CPPL`). Cấu hình cây danh mục được quản lý tại mục <strong>Cấu Hình & Quản Trị Hệ Thống</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCategoryConfig && (
            <button
              onClick={onOpenCategoryConfig}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Đi tới Cấu hình Cây Danh Mục Chi Phí (CPVH & CPPL) trong Cấu hình Hệ thống"
            >
              <FolderTree className="w-4 h-4 text-emerald-700" />
              Cấu Hình Cây Danh Mục ({expenseCategories.length})
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Xuất bảng kê chi phí dịch vụ ra Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Xuất Excel/CSV
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nhập Phiếu Chi Phí
          </button>
        </div>
      </div>

      {/* 4 KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Tổng Chi Phí Đang Lọc</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-800 tabular-nums">
            {formatVND(totalAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tổng cộng {filteredExpenses.length} chứng từ chi phí
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>1. Vận Hành & Công Tác (CPVH)</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-blue-900 tabular-nums">
            {formatVND(totalCPVH)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Công tác, văn phòng, năng lượng, phí xe
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>2. Giao Tế & Phúc Lợi (CPPL)</span>
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono text-purple-900 tabular-nums">
            {formatVND(totalCPPL)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Phúc lợi CB-NV nội bộ & Giao tế khách hàng
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>NCC Chi Trả Lớn Nhất</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={topSupplier.name}>
            {topSupplier.name}
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 mt-1 block tabular-nums">
            {formatVND(topSupplier.amount)}
          </span>
        </div>
      </div>

      {/* Quick Group Filter Bar + Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Quick Filter Buttons by Root & Parent Group */}
        <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Lọc nhanh theo nhóm:</span>
          {[
            { code: 'ALL', label: 'Tất cả nhóm' },
            { code: 'CPVH-CT', label: 'CPVH-CT: Công tác & Tiếp khách' },
            { code: 'CPVH-VP', label: 'CPVH-VP: Văn phòng & Hạ tầng' },
            { code: 'CPVH-NL', label: 'CPVH-NL: Điện nước & Xăng dầu' },
            { code: 'CPVH-XE', label: 'CPVH-XE: Phí xe & Bảo dưỡng' },
            { code: 'CPPL-NV', label: 'CPPL-NV: Phúc lợi CB-NV' },
            { code: 'CPPL-KH', label: 'CPPL-KH: Giao tế Đối ngoại' },
          ].map((pill) => (
            <button
              key={pill.code}
              type="button"
              onClick={() => setSelectedGroupFilter(pill.code)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                selectedGroupFilter === pill.code
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên chi phí, hóa đơn, diễn giải..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Sub-Group Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả 11 Phân Nhóm Chi Tiết</option>
              {expenseGroups.map((g) => (
                <option key={g.group_code} value={g.group_code}>
                  [{g.group_code}] {g.sub_title} ({g.count} mục)
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả NCC ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Type Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategoryType}
              onChange={(e) => setSelectedCategoryType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả Mã gốc (1 & 2)</option>
              {categoryTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="sm:col-span-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả tháng</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Tháng {m.slice(5, 7)}/{m.slice(0, 4)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Mã Phiếu & Ngày</th>
                <th className="py-3 px-4">Phân Nhóm & Khoản Mục Chi Phí</th>
                <th className="py-3 px-4">Nhà Cung Cấp</th>
                <th className="py-3 px-4 text-right">Chi Phí (VND)</th>
                <th className="py-3 px-4">Diễn Giải & Hóa Đơn</th>
                <th className="py-3 px-4">Người Lập</th>
                <th className="py-3 px-3 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ReceiptText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Không tìm thấy phiếu chi phí dịch vụ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const boundCategory = expenseCategories.find(
                    (c) => c.expense_category_id === exp.expense_category_id
                  );
                  const isCPPL =
                    (exp.group_code && exp.group_code.startsWith('CPPL')) ||
                    exp.category_type.startsWith('2.');
                  return (
                    <tr key={exp.expense_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {exp.expense_code}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDateVN(exp.occurred_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              isCPPL
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {boundCategory?.code || exp.group_code || 'CPVH'}
                          </span>
                          <span
                            className="text-[11px] font-semibold text-slate-600 truncate max-w-[230px]"
                            title={exp.group_name || boundCategory?.group_name}
                          >
                            {exp.group_name || boundCategory?.group_name || 'Chi phí vận hành'}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {exp.expense_name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold inline-block px-1.5 py-0.5 rounded border mt-1 ${
                            isCPPL
                              ? 'bg-purple-50/70 text-purple-900 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {exp.category_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div
                          className="font-medium text-slate-900 truncate"
                          title={exp.supplier_name}
                        >
                          {exp.supplier_name}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm tabular-nums">
                        {formatVND(exp.amount)}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 line-clamp-2" title={exp.description}>
                          {exp.description}
                        </div>
                        {exp.invoice_ref && (
                          <div className="text-[10px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            HĐ: {exp.invoice_ref}
                          </div>
                        )}
                        {exp.attachment_file && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {exp.attachment_file}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">{exp.created_by}</td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title="Xem chi tiết phiếu chi phí"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded transition cursor-pointer"
                            title="Sửa phiếu chi phí"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteExpense(exp.expense_id, exp.expense_code)
                            }
                            className="p-1.5 text-red-500 hover:text-red-700 rounded transition cursor-pointer"
                            title="Xóa phiếu chi phí"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ===================================================================== */}
      {/* MODAL 1: FORM NHẬP / SỬA PHIẾU CHI PHÍ DỊCH VỤ THEO CÂY 3 TẦNG       */}
      {/* ===================================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-emerald-300" />
                  {editingExpense
                    ? `Cập Nhật Phiếu Chi Phí: ${editingExpense.expense_code}`
                    : 'Nhập Phiếu Chi Phí Chuẩn THACO AGRI (CPVH / CPPL)'}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Hỗ trợ gõ từ khóa tìm nhanh hoặc chọn theo phân cấp: Mã gốc ➔ Phân nhóm ➔ Khoản mục chi tiết
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmitForm}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
            >
              {/* SMART SEARCH BAR: Gõ từ khóa tự động chọn Nhóm & Tên chi phí */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4" />
                    Tìm & Chọn Nhanh Khoản Mục Chi Phí (Gõ từ khóa gợi ý tức thì):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    VD: vé máy bay, khách sạn, mực in, vệ sinh, xăng, quà tết...
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={quickCategorySearch}
                    onChange={(e) => setQuickCategorySearch(e.target.value)}
                    placeholder="Gõ tên khoản mục hoặc mã (VD: CPVH-CT-MS, vé máy bay, sửa chữa, đăng kiểm, thăm hỏi)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-emerald-500"
                  />
                  {quickCategorySearch && (
                    <button
                      type="button"
                      onClick={() => setQuickCategorySearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {quickMatchedCategories.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 max-h-40 overflow-y-auto">
                    {quickMatchedCategories.map((cat) => (
                      <button
                        key={cat.expense_category_id}
                        type="button"
                        onClick={() => {
                          handleCategoryChange(cat.expense_category_id);
                          setQuickCategorySearch('');
                        }}
                        className="text-left p-2 rounded-lg bg-slate-800 hover:bg-emerald-800 border border-slate-700 hover:border-emerald-500 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] text-emerald-300 font-bold block">
                            [{cat.code}] {cat.group_code}
                          </span>
                          <span className="font-bold text-white truncate block">{cat.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CASCADING SELECTOR: 3 BƯỚC HỢP LÝ */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3.5">
                {/* Bước 1: Chọn Mã Gốc (1. CPVH hoặc 2. CPPL) */}
                <div>
                  <label className="font-bold text-emerald-950 block mb-1.5">
                    Bước 1: Chọn Khối Chi Phí Gốc:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ALL' as const, label: 'Tất cả (40 mục)' },
                      { id: 'CPVH' as const, label: '1. Vận hành & Công tác (CPVH)' },
                      { id: 'CPPL' as const, label: '2. Giao tế & Phúc lợi (CPPL)' },
                    ].map((rootBtn) => (
                      <button
                        key={rootBtn.id}
                        type="button"
                        onClick={() => handleFormRootSwitch(rootBtn.id)}
                        className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition cursor-pointer text-center ${
                          formRootFilter === rootBtn.id
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                        }`}
                      >
                        {rootBtn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bước 2 & Bước 3 trên cùng 1 hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bước 2: Chọn Phân Nhóm Chi Phí Cha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-emerald-950">
                        Bước 2: Chọn Nhóm Chi Phí: <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        {filteredGroupsForForm.length} phân nhóm
                      </span>
                    </div>
                    <select
                      required
                      value={formData.group_code}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-emerald-700"
                    >
                      <option value="">-- Chọn phân nhóm chi phí --</option>
                      {filteredGroupsForForm.map((g) => (
                        <option key={g.group_code} value={g.group_code}>
                          [{g.group_code}] {g.sub_title} ({g.count} mục)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bước 3: Chọn Khoản Mục Chi Phí Chi Tiết */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-emerald-950">
                        Bước 3: Khoản Mục Chi Tiết: <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold">
                        {availableCategoriesInGroup.length} mục trong nhóm
                      </span>
                    </div>
                    <select
                      required
                      value={formData.expense_category_id}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-emerald-700"
                    >
                      <option value="">-- Chọn khoản mục chi tiết --</option>
                      {availableCategoriesInGroup.map((c) => (
                        <option key={c.expense_category_id} value={c.expense_category_id}>
                          [{c.code}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tóm tắt phân loại đang chọn */}
                {formData.expense_name && (
                  <div className="px-3 py-2 bg-white rounded-lg border border-emerald-200 flex items-center justify-between gap-2 text-[11px]">
                    <div className="truncate">
                      <span className="text-slate-500">Đang chọn: </span>
                      <strong className="text-emerald-900 font-mono">[{formData.group_code}]</strong>{' '}
                      <strong className="text-slate-900">{formData.expense_name}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                      {formData.category_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Row: Thời gian phát sinh & Số tiền */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Thời gian phát sinh chứng từ: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.occurred_at}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, occurred_at: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số tiền chi phí (VND): <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      placeholder="Ví dụ: 15500000"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 text-right pr-12 focus:outline-emerald-600 focus:bg-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400">VND</span>
                  </div>
                  {formData.amount &&
                    !isNaN(Number(formData.amount)) &&
                    Number(formData.amount) > 0 && (
                      <span className="text-[11px] text-emerald-800 font-bold mt-0.5 block text-right font-mono">
                        = {formatVND(Number(formData.amount))}
                      </span>
                    )}
                </div>
              </div>

              {/* Row: Nhà cung cấp đối tác */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    Nhà cung cấp / Đơn vị thụ hưởng: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Chọn từ danh bạ NCC hoặc sửa tên bên dưới
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="">-- Chọn nhà cung cấp trong danh bạ --</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.name} {s.tax_code ? `(MST: ${s.tax_code})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Tên nhà cung cấp / Đơn vị nhận thanh toán..."
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, supplier_name: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row: Diễn giải */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Diễn giải nội dung chi phí: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nhập chi tiết nội dung dịch vụ, đoàn công tác, kỳ cước thanh toán..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Row: Số hóa đơn & Đính kèm chứng từ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số hóa đơn / Chứng từ tham chiếu:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: HD-FPT-88291..."
                    value={formData.invoice_ref}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, invoice_ref: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tệp hóa đơn / bảng kê đính kèm:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Hoa_don_dien_tu.pdf..."
                      value={formData.attachment_file}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, attachment_file: e.target.value }))
                      }
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg cursor-pointer flex items-center font-bold text-xs">
                      <Paperclip className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev) => ({ ...prev, attachment_file: file.name }));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingExpense ? 'Lưu Cập Nhật Phiếu' : 'Lưu Phiếu Chi Phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: XEM CHI TIẾT PHIẾU CHI PHÍ                                   */}
      {/* ===================================================================== */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Chi Tiết Chứng Từ Chi Phí Dịch Vụ
                </span>
                <h3 className="font-bold text-base">{viewingExpense.expense_code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Tổng số tiền chi trả:</span>
                  <div className="text-2xl font-black font-mono text-emerald-900 tabular-nums">
                    {formatVND(viewingExpense.amount)}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs border border-emerald-300">
                  Đã hạch toán
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Thời gian phát sinh:</span>
                  <span className="font-bold text-slate-800">
                    {formatDateVN(viewingExpense.occurred_at)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Khối chi phí gốc:</span>
                  <span className="font-bold text-slate-800">{viewingExpense.category_type}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px]">
                  Phân nhóm & Khoản mục chi phí:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {viewingExpense.group_code || 'CPVH'}
                  </span>
                  <span className="font-semibold text-slate-700 text-xs">
                    {viewingExpense.group_name || 'Chi phí vận hành & công tác'}
                  </span>
                </div>
                <span className="font-bold text-slate-900 text-sm block mt-1">
                  {viewingExpense.expense_name}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px]">Nhà cung cấp đối tác:</span>
                <span className="font-bold text-slate-900">{viewingExpense.supplier_name}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px]">Diễn giải chi tiết:</span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewingExpense.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Hóa đơn tham chiếu:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {viewingExpense.invoice_ref || 'Chưa ghi nhận'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Người lập phiếu:</span>
                  <span className="font-medium text-slate-800">{viewingExpense.created_by}</span>
                </div>
              </div>

              {viewingExpense.attachment_file && (
                <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{viewingExpense.attachment_file}</span>
                  </div>
                  <span className="text-[10px] text-blue-700">Tệp đính kèm</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                In phiếu chi
              </button>

              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg text-xs hover:bg-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
