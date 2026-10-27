import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Tag,
  DollarSign,
  FileText,
  Paperclip,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  Printer,
  ChevronDown,
  X,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceExpense, ExpenseCategory, Supplier } from '../../types';
import { formatDateVN, formatVND } from '../../utils/excelExporter';

export const ServiceExpensesView: React.FC = () => {
  const {
    serviceExpenses,
    expenseCategories,
    suppliers,
    currentUser,
    addServiceExpense,
    updateServiceExpense,
    deleteServiceExpense,
  } = useApp();

  // Search and Filters
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ServiceExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ServiceExpense | null>(null);

  // Form State
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

  // Extract structured groups from expense categories (11 groups from THACO AGRI standard)
  const expenseGroups = useMemo(() => {
    const map = new Map<string, { group_code: string; group_name: string; root_type: string; count: number }>();
    expenseCategories.forEach((c) => {
      const gCode = c.group_code || 'CP_OTHER';
      const gName = c.group_name || 'Chi phí dịch vụ khác';
      const rootType = c.category_type || 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC';
      if (!map.has(gCode)) {
        map.set(gCode, { group_code: gCode, group_name: gName, root_type: rootType, count: 0 });
      }
      map.get(gCode)!.count++;
    });
    return Array.from(map.values());
  }, [expenseCategories]);

  // Extract unique category types from configured categories
  const categoryTypes = useMemo(() => {
    const types = new Set<string>();
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

  // Categories filtered by currently selected group in the form
  const availableCategoriesInGroup = useMemo(() => {
    if (!formData.group_code) return expenseCategories;
    return expenseCategories.filter((c) => c.group_code === formData.group_code);
  }, [expenseCategories, formData.group_code]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return serviceExpenses.filter((item) => {
      // Keyword search
      const matchSearch =
        searchTerm === '' ||
        item.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expense_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_ref && item.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.group_code && item.group_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.group_name && item.group_name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Group filter
      const matchGroup =
        selectedGroupFilter === 'ALL' || item.group_code === selectedGroupFilter;

      // Supplier filter
      const matchSupplier =
        selectedSupplierId === 'ALL' || item.supplier_id === selectedSupplierId;

      // Category type filter
      const matchCategoryType =
        selectedCategoryType === 'ALL' || item.category_type === selectedCategoryType;

      // Month filter
      const matchMonth =
        monthFilter === 'ALL' || (item.occurred_at && item.occurred_at.startsWith(monthFilter));

      return matchSearch && matchGroup && matchSupplier && matchCategoryType && matchMonth;
    });
  }, [serviceExpenses, searchTerm, selectedGroupFilter, selectedSupplierId, selectedCategoryType, monthFilter]);

  // KPI Calculations
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
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

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    const defaultGroup = expenseGroups[0];
    const itemsInDefaultGroup = expenseCategories.filter((c) => c.group_code === defaultGroup?.group_code);
    const defaultCat = itemsInDefaultGroup[0] || expenseCategories[0];
    const defaultSupplier = suppliers[0];

    setFormData({
      occurred_at: new Date().toISOString().slice(0, 16),
      group_code: defaultCat?.group_code || defaultGroup?.group_code || '',
      group_name: defaultCat?.group_name || defaultGroup?.group_name || '',
      expense_category_id: defaultCat?.expense_category_id || '',
      expense_name: defaultCat?.name || '',
      category_type: defaultCat?.category_type || 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
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
    setFormData({
      occurred_at: expense.occurred_at ? expense.occurred_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
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

  // Handle Parent Group Change (Cascading: selects first child item in that group)
  const handleGroupChange = (groupCode: string) => {
    const group = expenseGroups.find((g) => g.group_code === groupCode);
    const items = expenseCategories.filter((c) => c.group_code === groupCode);
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
      alert(res.message);
    } else {
      const res = await addServiceExpense({
        ...formData,
        amount: numAmount,
        occurred_at: new Date(formData.occurred_at).toISOString(),
      });
      alert(res.message);
    }

    setIsFormModalOpen(false);
  };

  // Delete Service Expense
  const handleDeleteExpense = async (id: string, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu chi phí dịch vụ ${code}?`)) {
      const res = await deleteServiceExpense(id);
      alert(res.message);
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
      'Tên chi phí',
      'Loại áp dụng',
      'Nhà cung cấp',
      'Số tiền (VND)',
      'Số hóa đơn',
      'Diễn giải',
      'Người tạo'
    ];

    const rows = filteredExpenses.map((e, idx) => [
      idx + 1,
      `"${e.expense_code}"`,
      `"${formatDateVN(e.occurred_at)}"`,
      `"${e.expense_name.replace(/"/g, '""')}"`,
      `"${e.category_type.replace(/"/g, '""')}"`,
      `"${e.supplier_name.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.invoice_ref || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.created_by}"`
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Ke_Chi_Phi_Dich_Vu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5" />
              Phân Hệ Quản Lý Chi Phí Dịch Vụ Vận Hành
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Người thực hiện: <strong className="text-slate-900">{currentUser.full_name}</strong> ({currentUser.role})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Sổ Nhật Ký & Nhập Chi Phí Dịch Vụ Theo Nhà Cung Cấp
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Ghi nhận toàn bộ chi phí dịch vụ thuê ngoài (bảo trì máy móc IT, cước viễn thông, vệ sinh, vận chuyển bốc xếp, kiểm định...) theo danh mục chuẩn và nhà cung cấp trong hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Xuất bảng kê chi phí dịch vụ ra Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Xuất Excel/CSV
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nhập Chi Phí Dịch Vụ
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Tổng Chi Phí Dịch Vụ</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-800 tabular-nums">
            {formatVND(totalAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Theo {filteredExpenses.length} phiếu chi phí đang lọc
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Số Lượng Phiếu Chi Phí</span>
            <ReceiptText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
            {filteredExpenses.length} <span className="text-sm font-normal text-slate-500">phiếu</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tổng toàn hệ thống: {serviceExpenses.length} phiếu
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>NCC Phát Sinh Lớn Nhất</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={topSupplier.name}>
            {topSupplier.name}
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 mt-1 block tabular-nums">
            {formatVND(topSupplier.amount)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên chi phí, hóa đơn, diễn giải..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Group Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả Nhóm Chi Phí ({expenseGroups.length} nhóm)</option>
              {expenseGroups.map((g) => (
                <option key={g.group_code} value={g.group_code}>
                  {g.group_code}: {g.group_name} ({g.count})
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
              <option value="ALL">Tất cả Loại áp dụng</option>
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
                <th className="py-3 px-4">Mã Phiếu & Ngày Tạo</th>
                <th className="py-3 px-4">Nhóm & Tên Chi Phí Dịch Vụ</th>
                <th className="py-3 px-4">Nhà Cung Cấp</th>
                <th className="py-3 px-4 text-right">Chi Phí (Số Tiền)</th>
                <th className="py-3 px-4">Diễn Giải & Hóa Đơn</th>
                <th className="py-3 px-4">Người Tạo</th>
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
                  const boundCategory = expenseCategories.find((c) => c.expense_category_id === exp.expense_category_id);
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
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {boundCategory?.code || exp.group_code || 'CPVH'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[200px]" title={exp.group_name || boundCategory?.group_name}>
                            {exp.group_name || boundCategory?.group_name || 'Chi phí vận hành'}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {exp.expense_name}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-semibold inline-block bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                          {exp.category_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={exp.supplier_name}>
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

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {exp.created_by}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
                            title="Xem chi tiết phiếu chi phí"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded transition"
                            title="Sửa phiếu chi phí"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.expense_id, exp.expense_code)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded transition"
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

      {/* --- MODAL 1: FORM NHẬP / SỬA CHI PHÍ DỊCH VỤ --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-emerald-300" />
                  {editingExpense ? `Sửa Phiếu Chi Phí Dịch Vụ: ${editingExpense.expense_code}` : 'Nhập Phiếu Chi Phí Dịch Vụ Mới'}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Chọn nhóm cha ➔ chọn tên chi phí chi tiết ➔ chọn nhà cung cấp và nhập số tiền.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Row 1: Thời gian tạo & Số tiền */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Thời gian tạo / phát sinh: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.occurred_at}
                    onChange={(e) => setFormData((prev) => ({ ...prev, occurred_at: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Mặc định là ngày giờ hiện tại, có thể chọn lại nếu nhập chứng từ bù.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Chi phí (Số tiền VND): <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      placeholder="Ví dụ: 15500000"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 text-right pr-12 focus:outline-emerald-600 focus:bg-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400">VND</span>
                  </div>
                  {formData.amount && !isNaN(Number(formData.amount)) && Number(formData.amount) > 0 && (
                    <span className="text-[11px] text-emerald-800 font-bold mt-0.5 block text-right font-mono">
                      = {formatVND(Number(formData.amount))}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: BƯỚC 1 - Chọn Nhóm Chi Phí Cha (THACO AGRI) */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">1</span>
                    Bước 1: Chọn Nhóm Chi Phí Cha: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    11 nhóm chuẩn THACO AGRI
                  </span>
                </div>
                <select
                  required
                  value={formData.group_code}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-emerald-700 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn nhóm chi phí cha --</option>
                  {expenseGroups.map((g) => (
                    <option key={g.group_code} value={g.group_code}>
                      [{g.group_code}] {g.group_name} ({g.count} mục chi tiết)
                    </option>
                  ))}
                </select>
                {formData.group_name && (
                  <div className="text-[11px] text-emerald-900 flex items-center gap-1">
                    <span className="font-semibold">Thuộc gốc:</span> {formData.category_type}
                  </div>
                )}
              </div>

              {/* Row 3: BƯỚC 2 - Chọn Tên Chi Phí Chi Tiết (Lọc theo nhóm đã chọn) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
                    Bước 2: Chọn Tên Chi Phí Chi Tiết: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {availableCategoriesInGroup.length} mục trong nhóm
                  </span>
                </div>
                <select
                  required
                  value={formData.expense_category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="">-- Chọn tên chi phí chi tiết --</option>
                  {availableCategoriesInGroup.map((c) => (
                    <option key={c.expense_category_id} value={c.expense_category_id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 4: Loại áp dụng */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Loại áp dụng (Gốc chi phí): <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.category_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category_type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="">-- Chọn loại áp dụng --</option>
                    {categoryTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="Khác">Khác / Tùy chỉnh</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Hoặc nhập loại áp dụng chi tiết..."
                    value={formData.category_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category_type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Tên nhà cung cấp (List có sẵn trong cấu hình) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">
                    Tên nhà cung cấp (List có sẵn): <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Lấy từ danh mục Nhà cung cấp trong hệ thống
                  </span>
                </div>
                <select
                  required
                  value={formData.supplier_id}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:outline-emerald-600 focus:bg-white"
                >
                  <option value="">-- Chọn nhà cung cấp dịch vụ --</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.name} {s.tax_code ? `(MST: ${s.tax_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 5: Diễn giải */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Diễn giải nội dung chi phí: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết nội dung dịch vụ đã thực hiện, phạm vi công việc, quý/tháng nghiệm thu..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Row 6: Số hóa đơn & Đính kèm chứng từ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số hóa đơn / Chứng từ tham chiếu:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: HD-FPT-88291..."
                    value={formData.invoice_ref}
                    onChange={(e) => setFormData((prev) => ({ ...prev, invoice_ref: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tên tệp hóa đơn đính kèm:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Hoa_don_dien_tu.pdf..."
                      value={formData.attachment_file}
                      onChange={(e) => setFormData((prev) => ({ ...prev, attachment_file: e.target.value }))}
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

      {/* --- MODAL 2: XEM CHI TIẾT PHIẾU CHI PHÍ --- */}
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
                className="text-slate-400 hover:text-white p-1"
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
                  <span className="text-slate-500 block text-[10px]">Loại áp dụng:</span>
                  <span className="font-bold text-slate-800">{viewingExpense.category_type}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px]">Nhóm & Tên dịch vụ chi phí:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {viewingExpense.group_code || 'CPVH'}
                  </span>
                  <span className="font-semibold text-slate-700 text-xs">
                    {viewingExpense.group_name || 'Chi phí vận hành & công tác'}
                  </span>
                </div>
                <span className="font-bold text-slate-900 text-sm block mt-1">{viewingExpense.expense_name}</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" />
                In phiếu chi
              </button>

              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg text-xs hover:bg-slate-700"
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
