import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  History, 
  Download, 
  Code, 
  CheckCircle2, 
  User, 
  Building2, 
  Play, 
  Terminal,
  Table,
  Copy,
  ExternalLink,
  Truck,
  Warehouse as WarehouseIcon,
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  UserCheck,
  Layers,
  MapPin,
  Phone,
  Mail,
  FileText,
  Briefcase,
  GitFork,
  ChevronRight,
  FolderTree,
  BadgeInfo,
  ReceiptText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SQL_SERVER_SCHEMA_SCRIPT } from '../../utils/sqlServerScript';
import { formatDateVN, formatVND } from '../../utils/excelExporter';
import { Supplier, OrganizationUnit, Department, Warehouse, Employee, UserRole, Category, TrackingType, ExpenseCategory } from '../../types';

export const SqlServerAdminView: React.FC = () => {
  const { 
    employees, 
    units, 
    departments,
    warehouses, 
    suppliers = [],
    categories = [],
    auditLogs, 
    currentUser,
    expenseCategories = [],
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addUnit,
    updateUnit,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addWarehouse,
    updateWarehouse,
    addEmployee,
    updateEmployee,
    updateUserRole,
    syncEmployeesFromHRM,
    addCategory,
    updateCategory,
    deleteCategory
  } = useApp();

  type AdminTab = 
    | 'CATEGORIES'
    | 'SUPPLIERS' 
    | 'UNITS' 
    | 'DEPARTMENTS' 
    | 'USERS_HRM' 
    | 'ORG_HIERARCHY' 
    | 'WAREHOUSES' 
    | 'RBAC' 
    | 'SQL_STUDIO' 
    | 'AUDIT_LOGS'
    | 'SERVICE_EXPENSE_CATEGORIES';

  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('USERS_HRM');

  // Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ==========================================
  // TAB: DANH MỤC HÀNG HÓA (CATEGORIES) STATE
  // ==========================================
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryGroupFilter, setCategoryGroupFilter] = useState<string>('ALL');
  const [categoryTrackingFilter, setCategoryTrackingFilter] = useState<'ALL' | TrackingType>('ALL');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    code: '',
    name: '',
    group: 'Thiết bị tin học',
    tracking_type: 'DINH_DANH',
    unit_of_measure: 'Cái',
    min_stock: 5,
    estimated_unit_price: 15000000,
    prefix: 'AST',
    status: 'ACTIVE',
    description: '',
  });

  const filteredCategories = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.prefix && c.prefix.toLowerCase().includes(categorySearch.toLowerCase()));
    const matchGroup = categoryGroupFilter === 'ALL' || c.group === categoryGroupFilter;
    const matchTracking = categoryTrackingFilter === 'ALL' || c.tracking_type === categoryTrackingFilter;
    const matchStatus = categoryStatusFilter === 'ALL' || c.status === categoryStatusFilter;
    return matchSearch && matchGroup && matchTracking && matchStatus;
  });

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      code: `CAT-${Date.now().toString().slice(-4)}`,
      name: '',
      group: 'Thiết bị tin học',
      tracking_type: 'DINH_DANH',
      unit_of_measure: 'Cái',
      min_stock: 5,
      estimated_unit_price: 10000000,
      prefix: 'AST',
      status: 'ACTIVE',
      description: '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name?.trim()) {
      showToast('Vui lòng nhập tên danh mục hàng hóa!');
      return;
    }
    if (editingCategory) {
      const res = await updateCategory({
        ...editingCategory,
        name: categoryForm.name.trim(),
        group: (categoryForm.group || 'Thiết bị tin học') as any,
        tracking_type: (categoryForm.tracking_type || 'DINH_DANH') as any,
        unit_of_measure: (categoryForm.unit_of_measure || 'Cái').trim(),
        min_stock: Number(categoryForm.min_stock) || 0,
        estimated_unit_price: Number(categoryForm.estimated_unit_price) || 0,
        prefix: (categoryForm.prefix || '').toUpperCase().trim(),
        status: (categoryForm.status as any) || 'ACTIVE',
        description: (categoryForm.description || '').trim(),
      });
      showToast(res.message);
    } else {
      if (!categoryForm.code?.trim()) {
        showToast('Vui lòng nhập mã danh mục!');
        return;
      }
      const res = await addCategory({
        code: categoryForm.code.toUpperCase().trim(),
        name: categoryForm.name.trim(),
        group: (categoryForm.group || 'Thiết bị tin học') as any,
        tracking_type: (categoryForm.tracking_type || 'DINH_DANH') as any,
        unit_of_measure: (categoryForm.unit_of_measure || 'Cái').trim(),
        min_stock: Number(categoryForm.min_stock) || 0,
        estimated_unit_price: Number(categoryForm.estimated_unit_price) || 0,
        prefix: (categoryForm.prefix || 'AST').toUpperCase().trim(),
        status: (categoryForm.status as any) || 'ACTIVE',
        description: (categoryForm.description || '').trim(),
      });
      showToast(res.message);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục ${cat.name} (${cat.code})?`)) return;
    const res = await deleteCategory(cat.category_id);
    showToast(res.message);
  };

  // ==========================================
  // TAB 1: NHÀ CUNG CẤP (SUPPLIERS) STATE
  // ==========================================
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    code: '',
    name: '',
    tax_code: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    category_groups: ['Thiết bị Tin học', 'Linh kiện IT'],
    status: 'ACTIVE',
    note: ''
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const matchSearch = 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.tax_code && s.tax_code.includes(supplierSearch)) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(supplierSearch.toLowerCase()));
    const matchStatus = supplierStatusFilter === 'ALL' || s.status === supplierStatusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      code: `NCC-00${suppliers.length + 1}`,
      name: '',
      tax_code: '',
      phone: '',
      email: '',
      address: '',
      contact_person: '',
      category_groups: ['Thiết bị Tin học'],
      status: 'ACTIVE',
      note: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({ ...supplier });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.code) {
      alert('Vui lòng nhập Mã và Tên Nhà cung cấp!');
      return;
    }

    if (editingSupplier) {
      const res = await updateSupplier(editingSupplier.supplier_id, supplierForm);
      showToast(res.message);
    } else {
      const res = await addSupplier(supplierForm);
      showToast(res.message);
    }
    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (confirm(`Bạn có chắc chắn muốn xóa/ngưng hợp tác với nhà cung cấp: "${supplier.name}"?`)) {
      const res = await deleteSupplier(supplier.supplier_id);
      showToast(res.message);
    }
  };

  // ==========================================
  // TAB 2: ĐƠN VỊ (ORGANIZATION UNITS) STATE
  // ==========================================
  const [unitSearch, setUnitSearch] = useState('');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null);
  const [unitForm, setUnitForm] = useState<Partial<OrganizationUnit>>({
    code: '',
    name: '',
    short_name: '',
    parent_unit_id: '',
    address: '',
    status: 'ACTIVE'
  });

  const filteredUnits = units.filter((u) => {
    return (
      u.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.code.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.short_name.toLowerCase().includes(unitSearch.toLowerCase())
    );
  });

  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      code: `UNIT-0${units.length + 1}`,
      name: '',
      short_name: '',
      parent_unit_id: 'UNIT-01',
      address: '',
      status: 'ACTIVE'
    });
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: OrganizationUnit) => {
    setEditingUnit(unit);
    setUnitForm({ ...unit });
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name || !unitForm.code) {
      alert('Vui lòng nhập Mã và Tên Đơn vị!');
      return;
    }

    if (editingUnit) {
      const res = await updateUnit(editingUnit.unit_id, unitForm);
      showToast(res.message);
    } else {
      const res = await addUnit(unitForm);
      showToast(res.message);
    }
    setIsUnitModalOpen(false);
  };

  // ==========================================
  // TAB 3: PHÒNG BAN (DEPARTMENTS) STATE
  // ==========================================
  const [deptSearch, setDeptSearch] = useState('');
  const [deptUnitFilter, setDeptUnitFilter] = useState<string>('ALL');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({
    unit_id: units[0]?.unit_id || 'UNIT-01',
    code: '',
    name: '',
    status: 'ACTIVE'
  });

  const filteredDepartments = departments.filter((d) => {
    const matchSearch = 
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase());
    const matchUnit = deptUnitFilter === 'ALL' || d.unit_id === deptUnitFilter;
    return matchSearch && matchUnit;
  });

  const handleOpenAddDept = (preselectedUnitId?: string) => {
    setEditingDept(null);
    setDeptForm({
      unit_id: preselectedUnitId || units[0]?.unit_id || 'UNIT-01',
      code: `DEP-0${departments.length + 1}`,
      name: '',
      status: 'ACTIVE'
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ ...dept });
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code || !deptForm.unit_id) {
      alert('Vui lòng chọn Đơn vị, nhập Mã và Tên Phòng ban!');
      return;
    }

    if (editingDept) {
      const res = await updateDepartment(editingDept.department_id, deptForm);
      showToast(res.message);
    } else {
      const res = await addDepartment(deptForm);
      showToast(res.message);
    }
    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = async (dept: Department) => {
    const staffCount = employees.filter((e) => e.department_id === dept.department_id).length;
    if (staffCount > 0) {
      alert(`Không thể xóa phòng ban "${dept.name}" vì hiện đang có ${staffCount} nhân sự trực thuộc! Vui lòng chuyển nhân sự sang phòng ban khác trước.`);
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}" (${dept.code})?`)) {
      const res = await deleteDepartment(dept.department_id);
      showToast(res.message);
    }
  };

  // ==========================================
  // TAB 4: NHÂN VIÊN & CHỨC VỤ (EMPLOYEES) STATE
  // ==========================================
  const [empSearch, setEmpSearch] = useState('');
  const [empRoleFilter, setEmpRoleFilter] = useState<string>('ALL');
  const [empUnitFilter, setEmpUnitFilter] = useState<string>('ALL');
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  
  // Cascading Form State: Selecting unit_id dynamically narrows down department_id options
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    employee_code: '',
    full_name: '',
    position: 'Chuyên viên Nghiệp vụ',
    unit_id: units[0]?.unit_id || 'UNIT-01',
    department_id: departments[0]?.department_id || 'DEP-01',
    email: '',
    phone: '',
    role: 'CBNV',
    status: 'ACTIVE'
  });

  // Filtered employees list
  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.position && e.position.toLowerCase().includes(empSearch.toLowerCase())) ||
      (e.email && e.email.toLowerCase().includes(empSearch.toLowerCase()));
    const matchRole = empRoleFilter === 'ALL' || e.role === empRoleFilter;
    const matchUnit = empUnitFilter === 'ALL' || e.unit_id === empUnitFilter;
    return matchSearch && matchRole && matchUnit;
  });

  // Handle open add employee with proper default department for selected unit
  const handleOpenAddEmp = (preselectedUnitId?: string, preselectedDeptId?: string) => {
    setEditingEmp(null);
    const targetUnit = preselectedUnitId || units[0]?.unit_id || 'UNIT-01';
    const availDepts = departments.filter((d) => d.unit_id === targetUnit);
    const targetDept = preselectedDeptId || availDepts[0]?.department_id || '';

    setEmpForm({
      employee_code: `TG-${Math.floor(10000 + Math.random() * 90000)}`,
      full_name: '',
      position: 'Chuyên viên Nghiệp vụ',
      unit_id: targetUnit,
      department_id: targetDept,
      email: '',
      phone: '',
      role: 'CBNV',
      status: 'ACTIVE'
    });
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({ ...emp });
    setIsEmpModalOpen(true);
  };

  // When unit changes in Employee modal, automatically cascade department list
  const handleEmpUnitChange = (newUnitId: string) => {
    const availDepts = departments.filter((d) => d.unit_id === newUnitId);
    setEmpForm((prev) => ({
      ...prev,
      unit_id: newUnitId,
      department_id: availDepts[0]?.department_id || ''
    }));
  };

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.full_name || !empForm.employee_code || !empForm.unit_id) {
      alert('Vui lòng nhập Mã nhân viên, Họ tên và chọn Đơn vị!');
      return;
    }

    if (!empForm.department_id) {
      alert('Vui lòng chọn Phòng ban trực thuộc đơn vị đã chọn!');
      return;
    }

    // Verify department belongs to unit (Relational Logic Check)
    const selectedDept = departments.find((d) => d.department_id === empForm.department_id);
    if (selectedDept && selectedDept.unit_id !== empForm.unit_id) {
      alert(`Phòng ban "${selectedDept.name}" không thuộc Đơn vị đã chọn! Vui lòng chọn lại.`);
      return;
    }

    if (editingEmp) {
      const res = await updateEmployee(editingEmp.employee_id, empForm);
      showToast(res.message);
    } else {
      const res = await addEmployee(empForm);
      showToast(res.message);
    }
    setIsEmpModalOpen(false);
  };

  // HRM Sync Simulation Modal State
  const [isHrmSyncModalOpen, setIsHrmSyncModalOpen] = useState(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const handleTriggerHrmSync = async () => {
    setIsHrmSyncModalOpen(true);
    setIsSyncing(true);
    setSyncStep(1);
    setSyncLogs(['[00:00:01] Khởi tạo kết nối gRPC/SSL tới máy chủ THACO AGRI HRM Core (cổng 8443)...']);

    setTimeout(() => {
      setSyncStep(2);
      setSyncLogs((prev) => [
        ...prev,
        '[00:00:02] Xác thực chứng thư bảo mật mTLS tập đoàn: THACO_AGRI_CORE_CA thành công.',
        '[00:00:03] Truy vấn danh sách CBNV, chức vụ (Position), phòng ban và đơn vị chi trả lương...'
      ]);
    }, 1200);

    setTimeout(() => {
      setSyncStep(3);
      setSyncLogs((prev) => [
        ...prev,
        '[00:00:04] Nhận 12 hồ sơ nhân sự chuẩn hóa từ API Trung tâm.',
        '[00:00:05] Khớp ràng buộc khóa ngoại (Unit -> Department -> Employee) và đồng bộ vào CSDL SQL Server...'
      ]);
    }, 2400);

    setTimeout(async () => {
      try {
        const res = await syncEmployeesFromHRM();
        setSyncStep(4);
        setIsSyncing(false);
        setSyncLogs((prev) => [
          ...prev,
          `[00:00:06] Hoàn tất đồng bộ: Đã cập nhật và liên kết đúng Đơn vị & Phòng ban cho nhân sự mới nhất.`,
          `[00:00:07] Ghi nhận AuditLog DONG_BO_HRM thành công.`
        ]);
        showToast(res.message);
      } catch (err: any) {
        setIsSyncing(false);
        setSyncLogs((prev) => [...prev, `[Lỗi] ${err.message || 'Không thể đồng bộ'}`]);
      }
    }, 3600);
  };

  // ==========================================
  // TAB 5: KHO LƯU TRỮ (WAREHOUSES) STATE
  // ==========================================
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<Partial<Warehouse>>({
    code: '',
    name: '',
    owning_unit_id: units[0]?.unit_id || 'UNIT-01',
    manager_employee_id: employees[0]?.employee_id || 'EMP-001',
    address: '',
    status: 'ACTIVE'
  });

  const filteredWarehouses = warehouses.filter((w) => {
    return (
      w.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.code.toLowerCase().includes(warehouseSearch.toLowerCase())
    );
  });

  const handleOpenAddWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseForm({
      code: `WH-0${warehouses.length + 1}`,
      name: '',
      owning_unit_id: units[0]?.unit_id || 'UNIT-01',
      manager_employee_id: employees.find((e) => e.role === 'THU_KHO')?.employee_id || employees[0]?.employee_id,
      address: '',
      status: 'ACTIVE'
    });
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({ ...warehouse });
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name || !warehouseForm.code) {
      alert('Vui lòng nhập Mã và Tên Kho lưu trữ!');
      return;
    }

    if (editingWarehouse) {
      const res = await updateWarehouse(editingWarehouse.warehouse_id, warehouseForm);
      showToast(res.message);
    } else {
      const res = await addWarehouse(warehouseForm);
      showToast(res.message);
    }
    setIsWarehouseModalOpen(false);
  };

  // ==========================================
  // TAB 6: RBAC PHÂN QUYỀN STATE
  // ==========================================
  const handleRoleChange = async (empId: string, newRole: UserRole) => {
    const res = await updateUserRole(empId, newRole);
    showToast(res.message);
  };

  // ==========================================
  // TAB 7: SQL STUDIO STATE
  // ==========================================
  const [selectedTable, setSelectedTable] = useState<string>('Employees');
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT e.employee_code, e.full_name, e.position, e.role, d.name AS DepartmentName, u.name AS UnitName \nFROM dbo.Employees e \nJOIN dbo.Departments d ON e.department_id = d.department_id \nJOIN dbo.OrganizationUnits u ON e.unit_id = u.unit_id;'
  );
  const [queryResult, setQueryResult] = useState<string>(
    'Truy vấn quan hệ liên bảng thành công (Employees ⋈ Departments ⋈ OrganizationUnits). Khóa ngoại toàn vẹn 100%.'
  );
  const [isCopied, setIsCopied] = useState(false);

  const handleDownloadSql = () => {
    window.location.href = '/api/sql-schema';
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SERVER_SCHEMA_SCRIPT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRunQuery = () => {
    setQueryResult(
      `[SQL Server 2022 Query Engine] Thực thi thành công trong 3ms.\nTruy vấn: "${sqlQuery.replace(/\n/g, ' ')}"\nTrạng thái: Hoàn tất không có lỗi cú pháp. Ràng buộc quan hệ 3 bảng được bảo toàn.`
    );
  };

  const sqlTables = [
    { name: 'OrganizationUnits', count: units.length, desc: 'Cây đơn vị pháp nhân & khu liên hợp' },
    { name: 'Departments', count: departments.length, desc: 'Phòng ban nghiệp vụ (FK -> Unit)' },
    { name: 'Employees', count: employees.length, desc: 'Hồ sơ nhân viên & chức vụ (FK -> Unit, Dept)' },
    { name: 'Suppliers', count: suppliers.length, desc: 'Danh bạ nhà cung cấp hàng hóa/vật tư' },
    { name: 'Warehouses', count: warehouses.length, desc: 'Kho lưu trữ thuộc quyền quản lý' },
    { name: 'Categories', count: categories.length, desc: 'Danh mục thiết bị định danh & tiêu hao' },
    { name: 'Assets', count: 6, desc: 'Hồ sơ từng tài sản định danh (Serial, QR)' },
    { name: 'StockBalances', count: 6, desc: 'Số dư tồn kho hàng tiêu hao' },
    { name: 'InventoryTransactions', count: 8, desc: 'Sổ giao dịch nhập/xuất kho bất biến' },
    { name: 'PurchaseOrders', count: 4, desc: 'Đơn hàng thu mua PO tổng & PO con' },
    { name: 'PurchaseOrderLines', count: 8, desc: 'Chi tiết từng mặt hàng và đơn giá thực tế' },
    { name: 'Requests', count: 3, desc: 'Yêu cầu cấp phát từ CBNV (4 loại)' },
    { name: 'RequestLines', count: 5, desc: 'Chi tiết số lượng cấp & chuyển mua thiếu' },
    { name: 'SupportTickets', count: 2, desc: 'Ticket hỗ trợ kỹ thuật và 3 kịch bản xử lý' },
    { name: 'TicketMaterials', count: 1, desc: 'Vật tư đề xuất thay thế / thu hồi cấp mới' },
    { name: 'AssetEvents', count: 6, desc: 'Timeline sự kiện vòng đời tài sản bất biến' },
    { name: 'Transfers', count: 1, desc: 'Phiếu điều chuyển kho và đổi đơn vị sở hữu' },
    { name: 'AuditLogs', count: auditLogs.length, desc: 'Nhật ký kiểm toán truy vết trước/sau' },
    { name: 'ExpenseCategories', count: expenseCategories.length, desc: 'Danh mục tên & loại chi phí dịch vụ' },
  ];

  // ==========================================
  // TAB: DANH MỤC CHI PHÍ DỊCH VỤ STATE & HANDLERS
  // ==========================================
  const [expenseCatSearch, setExpenseCatSearch] = useState('');
  const STANDARD_EXPENSE_GROUPS = [
    { code: 'CPVH-CT-MS', name: 'Di chuyển, lưu trú (Công tác & Tiếp khách)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-CT-TK', name: 'Ăn uống, hội nghị (Công tác & Tiếp khách)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-VP-SUA', name: 'Bảo trì & Sửa chữa (Văn phòng & Hạ tầng)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-VP-THU', name: 'Thuê ngoài (Văn phòng & Hạ tầng)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-VP-VT', name: 'Viễn thông & Chuyển phát (Văn phòng & Hạ tầng)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-VP-MT', name: 'Môi trường & Tiện ích (Văn phòng & Hạ tầng)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-NL-SH', name: 'Điện nước sinh hoạt (Năng lượng & Nhiên liệu)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-NL-XE', name: 'Xăng dầu (Năng lượng & Nhiên liệu)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPVH-XE', name: 'Phí xe & Phí hành chính (CPVH-XE)', root: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC' },
    { code: 'CPPL-NV', name: 'Phúc lợi Nội bộ CB-NV (CPPL-NV)', root: 'VI. CHI PHÍ GIAO TẾ & PHÚC LỢI' },
    { code: 'CPPL-KH', name: 'Giao tế Đối ngoại (CPPL-KH)', root: 'VI. CHI PHÍ GIAO TẾ & PHÚC LỢI' },
  ];

  const [expenseCatGroupFilter, setExpenseCatGroupFilter] = useState('ALL');
  const [expenseCatTypeFilter, setExpenseCatTypeFilter] = useState('ALL');
  const [isExpenseCatModalOpen, setIsExpenseCatModalOpen] = useState(false);
  const [editingExpenseCat, setEditingExpenseCat] = useState<ExpenseCategory | null>(null);
  const [expenseCatForm, setExpenseCatForm] = useState<Partial<ExpenseCategory>>({
    code: '',
    name: '',
    group_code: 'CPVH-CT-MS',
    group_name: 'Di chuyển, lưu trú (Công tác & Tiếp khách)',
    category_type: 'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
    description: '',
    is_active: true,
  });

  const configuredCategoryTypes = Array.from(
    new Set(expenseCategories.map((c) => c.category_type).filter(Boolean))
  );

  const handleOpenAddExpenseCat = () => {
    setEditingExpenseCat(null);
    const defGroup = STANDARD_EXPENSE_GROUPS[0];
    const groupCount = expenseCategories.filter((c) => c.group_code === defGroup.code).length + 1;
    setExpenseCatForm({
      code: `${defGroup.code}-${String(groupCount).padStart(2, '0')}`,
      name: '',
      group_code: defGroup.code,
      group_name: defGroup.name,
      category_type: defGroup.root,
      description: '',
      is_active: true,
    });
    setIsExpenseCatModalOpen(true);
  };

  const handleOpenEditExpenseCat = (cat: ExpenseCategory) => {
    setEditingExpenseCat(cat);
    setExpenseCatForm({ ...cat });
    setIsExpenseCatModalOpen(true);
  };

  const handleSaveExpenseCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseCatForm.name?.trim()) {
      alert('Vui lòng nhập Tên chi phí dịch vụ!');
      return;
    }
    if (!expenseCatForm.code?.trim()) {
      alert('Vui lòng nhập Mã danh mục chi phí!');
      return;
    }

    if (editingExpenseCat) {
      const res = await updateExpenseCategory(editingExpenseCat.expense_category_id, expenseCatForm);
      showToast(res.message);
    } else {
      const res = await addExpenseCategory(expenseCatForm);
      showToast(res.message);
    }
    setIsExpenseCatModalOpen(false);
  };

  const handleDeleteExpenseCat = async (catId: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa danh mục chi phí "${name}"?`)) {
      const res = await deleteExpenseCategory(catId);
      showToast(res.message);
    }
  };

  const filteredExpenseCategories = expenseCategories.filter((c) => {
    const matchSearch =
      expenseCatSearch === '' ||
      c.code.toLowerCase().includes(expenseCatSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(expenseCatSearch.toLowerCase()) ||
      (c.group_code && c.group_code.toLowerCase().includes(expenseCatSearch.toLowerCase())) ||
      (c.group_name && c.group_name.toLowerCase().includes(expenseCatSearch.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(expenseCatSearch.toLowerCase()));
    const matchGroup =
      expenseCatGroupFilter === 'ALL' || c.group_code === expenseCatGroupFilter;
    const matchType =
      expenseCatTypeFilter === 'ALL' || c.category_type === expenseCatTypeFilter;
    return matchSearch && matchGroup && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-600 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trung Tâm Quản Trị Hệ Thống THACO AGRI (QUAN_TRI)
            </span>
          </div>
          <h2 className="text-xl font-bold">
            Cơ Cấu Tổ Chức: Đơn Vị ⟷ Phòng Ban ⟷ Nhân Viên (Chức Vụ & Phân Quyền)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Thiết kế chuẩn hóa dữ liệu 3 bảng quan hệ ràng buộc chặt chẽ: Một Đơn vị có nhiều Phòng ban,
            Nhân viên có Chức vụ cụ thể và trực thuộc Phòng ban của Đơn vị đó, gán Vai trò hệ thống để bảo đảm logic phần mềm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Tải tệp T-SQL (.sql)
          </button>
        </div>
      </div>

      {/* Top Navigation Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveSubTab('USERS_HRM')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'USERS_HRM'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Bảng Nhân Viên ({employees.length})
        </button>

        <button
          onClick={() => setActiveSubTab('DEPARTMENTS')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'DEPARTMENTS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          2. Bảng Phòng Ban ({departments.length})
        </button>

        <button
          onClick={() => setActiveSubTab('UNITS')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'UNITS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          3. Bảng Đơn Vị ({units.length})
        </button>

        <button
          onClick={() => setActiveSubTab('ORG_HIERARCHY')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'ORG_HIERARCHY'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4 text-emerald-700" />
          4. Cây Quan Hệ 3 Bảng
        </button>

        <button
          onClick={() => setActiveSubTab('SUPPLIERS')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'SUPPLIERS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          5. Nhà Cung Cấp ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('CATEGORIES')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'CATEGORIES'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          6. Danh Mục Hàng Hóa ({categories.length})
        </button>

        <button
          onClick={() => setActiveSubTab('WAREHOUSES')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'WAREHOUSES'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          7. Bảng Kho ({warehouses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('RBAC')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'RBAC'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          8. Ma Trận Phân Quyền
        </button>

        <button
          onClick={() => setActiveSubTab('SQL_STUDIO')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'SQL_STUDIO'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          9. SQL Server 2022
        </button>

        <button
          onClick={() => setActiveSubTab('AUDIT_LOGS')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'AUDIT_LOGS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          10. Sổ Kiểm Toán ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('SERVICE_EXPENSE_CATEGORIES')}
          className={`pb-3 px-3 flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeSubTab === 'SERVICE_EXPENSE_CATEGORIES'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ReceiptText className="w-4 h-4 text-emerald-700" />
          11. Danh Mục Chi Phí Dịch Vụ ({expenseCategories.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. SUBTAB: BẢNG NHÂN VIÊN & CHỨC VỤ (EMPLOYEES) */}
      {/* ========================================================= */}
      {activeSubTab === 'USERS_HRM' && (
        <div className="space-y-4">
          {/* Highlight HRM Sync Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-700/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-400/20 text-blue-200 border border-blue-400/40">
                  Quan Hệ 3 Bảng
                </span>
                <span className="text-xs text-blue-300 font-mono">ĐƠN VỊ ➔ PHÒNG BAN ➔ NHÂN VIÊN (CHỨC VỤ)</span>
              </div>
              <h3 className="text-base font-bold">
                Quản Trị Người Dùng & Đồng Bộ Hồ Sơ Nhân Sự Tự Động Từ THACO AGRI HRM Core
              </h3>
              <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
                Mỗi nhân viên khi được thêm vào hệ thống bắt buộc phải chọn Đơn vị, sau đó chọn Phòng ban trực thuộc đơn vị đó,
                nhập Chức vụ công tác và gán Vai trò hệ thống để phần mềm tự động điều hướng luồng duyệt và quyền kho bãi.
              </p>
            </div>

            <button
              onClick={handleTriggerHrmSync}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 shrink-0 cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4 animate-spin-reverse" />
              Đồng Bộ HRM Ngay
            </button>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã TG-, họ tên, chức danh, email..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              {/* Filter by Unit */}
              <select
                value={empUnitFilter}
                onChange={(e) => setEmpUnitFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả đơn vị</option>
                {units.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>
                    {u.short_name}
                  </option>
                ))}
              </select>

              {/* Filter by Role */}
              <select
                value={empRoleFilter}
                onChange={(e) => setEmpRoleFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="CBNV">CBNV</option>
                <option value="THU_KHO">Thủ Kho</option>
                <option value="THU_MUA">Thu Mua</option>
                <option value="KY_THUAT">Kỹ Thuật IT</option>
                <option value="QUAN_TRI">Quản Trị</option>
                <option value="QUAN_LY">Quản Lý</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleOpenAddEmp()}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Nhân Viên Mới
              </button>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Danh Sách Hồ Sơ Nhân Viên (Có Chức Vụ & Phòng Ban Ràng Buộc)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi nhân sự thuộc về 1 Phòng ban xác định của 1 Đơn vị chủ quản, chịu trách nhiệm theo Chức vụ và Quyền hạn tương ứng.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {filteredEmployees.length} Nhân sự
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã NV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Chức Vụ (Position)</th>
                    <th className="py-3 px-4">Phòng Ban (Department)</th>
                    <th className="py-3 px-4">Đơn Vị Chi Trả Lương (Unit)</th>
                    <th className="py-3 px-4">Email / SĐT</th>
                    <th className="py-3 px-4 text-center">Vai Trò Hệ Thống (Role)</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEmployees.map((emp, idx) => {
                    const empUnit = units.find((u) => u.unit_id === emp.unit_id);
                    const empDept = departments.find((d) => d.department_id === emp.department_id);
                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.employee_code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {emp.full_name}
                          {emp.employee_id === currentUser.employee_id && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-normal">
                              (Bạn)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-1.5 pt-4">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{emp.position || 'Chưa cập nhật'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {empDept ? empDept.name : emp.department_id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {empDept?.code}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-blue-900 font-medium">
                          {empUnit ? empUnit.name : emp.unit_id}
                          <span className="text-[10px] text-slate-500 block font-normal">
                            ({empUnit?.short_name})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700">{emp.email}</div>
                          <div className="text-[11px] text-slate-500">{emp.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            emp.role === 'QUAN_TRI'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : emp.role === 'THU_KHO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : emp.role === 'THU_MUA'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : emp.role === 'KY_THUAT'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditEmp(emp)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa thông tin & chức vụ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
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

      {/* ========================================================= */}
      {/* 2. SUBTAB: BẢNG PHÒNG BAN (DEPARTMENTS) */}
      {/* ========================================================= */}
      {activeSubTab === 'DEPARTMENTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã phòng ban, tên phòng ban..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              <select
                value={deptUnitFilter}
                onChange={(e) => setDeptUnitFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả đơn vị trực thuộc</option>
                {units.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>
                    {u.short_name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenAddDept()}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Phòng Ban Mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  Danh Sách Phòng Ban Nghiệp Vụ (Liên Kết Trực Thuộc Đơn Vị)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ràng buộc khóa ngoại: Mỗi phòng ban thuộc về một Đơn vị chủ quản (`unit_id`). Khi thêm nhân viên chỉ được chọn phòng ban của đơn vị tương ứng.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {filteredDepartments.length} / {departments.length} Phòng ban
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã Phòng Ban</th>
                    <th className="py-3 px-4">Tên Phòng Ban Nghiệp Vụ</th>
                    <th className="py-3 px-4">Đơn Vị Trực Thuộc (Unit)</th>
                    <th className="py-3 px-4 text-center">Số Lượng Nhân Sự</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDepartments.map((d, idx) => {
                    const parentUnit = units.find((u) => u.unit_id === d.unit_id);
                    const staffList = employees.filter((e) => e.department_id === d.department_id);
                    return (
                      <tr key={d.department_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-900">{d.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{d.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.department_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-blue-900">
                            {parentUnit?.name || d.unit_id}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Mã: {parentUnit?.code} ({parentUnit?.short_name})
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {staffList.length} nhân sự
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditDept(d)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Sửa phòng ban"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(d)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Xóa phòng ban"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ========================================================= */}
      {/* 3. SUBTAB: BẢNG ĐƠN VỊ (ORGANIZATION UNITS) */}
      {/* ========================================================= */}
      {activeSubTab === 'UNITS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã đơn vị, tên đơn vị, tên viết tắt..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
              />
            </div>

            <button
              onClick={handleOpenAddUnit}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Đơn Vị Mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  Cây Đơn Vị Pháp Nhân & Khu Liên Hợp Nông Nghiệp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đơn vị chịu trách nhiệm chi trả lương, sở hữu kho bãi và tài sản cố định theo mô hình tập đoàn THACO AGRI.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {units.length} Đơn vị hoạt động
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã Đơn Vị</th>
                    <th className="py-3 px-4">Tên Đơn Vị / Pháp Nhân</th>
                    <th className="py-3 px-4">Tên Viết Tắt</th>
                    <th className="py-3 px-4">Đơn Vị Trực Thuộc Cha</th>
                    <th className="py-3 px-4 text-center">Số Phòng Ban</th>
                    <th className="py-3 px-4 text-center">Số Nhân Sự</th>
                    <th className="py-3 px-4 text-center">Kho Trực Thuộc</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUnits.map((u, idx) => {
                    const parentUnit = units.find((p) => p.unit_id === u.parent_unit_id);
                    const boundDepts = departments.filter((d) => d.unit_id === u.unit_id);
                    const boundStaff = employees.filter((e) => e.unit_id === u.unit_id);
                    const boundWh = warehouses.filter((w) => w.owning_unit_id === u.unit_id);
                    return (
                      <tr key={u.unit_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-900">{u.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.unit_id}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-900">{u.short_name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {parentUnit ? `${parentUnit.name} (${parentUnit.short_name})` : 'Tập đoàn mẹ (Root)'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {boundDepts.length} phòng ban
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {boundStaff.length} nhân sự
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-emerald-800">
                          {boundWh.length} kho
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditUnit(u)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa đơn vị"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
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

      {/* ========================================================= */}
      {/* 4. SUBTAB: SƠ ĐỒ CÂY QUAN HỆ 3 BẢNG (HIERARCHY TREE) */}
      {/* ========================================================= */}
      {activeSubTab === 'ORG_HIERARCHY' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-700" />
                  Sơ Đồ Cây Phân Cấp Cơ Cấu Tổ Chức: Đơn Vị ➔ Phòng Ban ➔ Nhân Viên (Chức Vụ)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Trực quan hóa cấu trúc quan hệ 3 bảng: Khóa ngoại liên kết chặt chẽ đảm bảo logic phần mềm vận hành chính xác.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAddUnit()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Thêm Đơn Vị
                </button>
                <button
                  onClick={() => handleOpenAddDept()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Thêm Phòng Ban
                </button>
                <button
                  onClick={() => handleOpenAddEmp()}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Thêm Nhân Viên
                </button>
              </div>
            </div>

            {/* Tree View Structure */}
            <div className="space-y-6">
              {units.map((unit) => {
                const unitDepts = departments.filter((d) => d.unit_id === unit.unit_id);
                const unitStaffTotal = employees.filter((e) => e.unit_id === unit.unit_id).length;

                return (
                  <div key={unit.unit_id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    {/* Unit Level */}
                    <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              {unit.code}
                            </span>
                            <span className="font-bold text-sm text-white">{unit.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{unit.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-300 font-medium">
                          {unitDepts.length} Phòng ban
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 px-3 py-1 rounded-lg font-bold border border-emerald-800">
                          {unitStaffTotal} Nhân sự
                        </span>
                        <button
                          onClick={() => handleOpenAddDept(unit.unit_id)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          + Thêm Phòng Ban
                        </button>
                      </div>
                    </div>

                    {/* Department Level */}
                    <div className="p-4 bg-slate-50 space-y-4">
                      {unitDepts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400 italic">
                          Chưa có phòng ban nào được tạo cho đơn vị này.
                        </div>
                      ) : (
                        unitDepts.map((dept) => {
                          const deptStaff = employees.filter((e) => e.department_id === dept.department_id);

                          return (
                            <div key={dept.department_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <Briefcase className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <span className="font-bold text-slate-900 text-xs">{dept.name}</span>
                                    <span className="ml-2 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {dept.code}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {deptStaff.length} người
                                  </span>
                                  <button
                                    onClick={() => handleOpenAddEmp(unit.unit_id, dept.department_id)}
                                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    + Thêm Nhân Viên
                                  </button>
                                </div>
                              </div>

                              {/* Employee Level (Inside Department) */}
                              <div className="pt-3">
                                {deptStaff.length === 0 ? (
                                  <div className="text-[11px] text-slate-400 italic py-1">
                                    Chưa có nhân sự nào trong phòng ban này.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {deptStaff.map((staff) => (
                                      <div
                                        key={staff.employee_id}
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-400 transition flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <div className="font-bold text-xs text-slate-900 truncate">
                                            {staff.full_name}
                                          </div>
                                          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                                            <span className="truncate">{staff.position || 'Chuyên viên'}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {staff.employee_code}
                                          </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            staff.role === 'QUAN_TRI'
                                              ? 'bg-red-50 text-red-800 border-red-300'
                                              : staff.role === 'THU_KHO'
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                              : staff.role === 'THU_MUA'
                                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                                              : staff.role === 'KY_THUAT'
                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                              : 'bg-blue-50 text-blue-800 border-blue-300'
                                          }`}>
                                            {staff.role}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SUBTAB: CẤU HÌNH NHÀ CUNG CẤP (SUPPLIERS) */}
      {/* ========================================================= */}
      {activeSubTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên NCC, mã, MST, người liên hệ..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              <select
                value={supplierStatusFilter}
                onChange={(e) => setSupplierStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hợp tác (Active)</option>
                <option value="INACTIVE">Tạm ngưng</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleOpenAddSupplier}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Nhà Cung Cấp Mới
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  Danh Sách Nhà Cung Cấp Đã Cấu Hình
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các nhà cung cấp này sẽ xuất hiện tự động trong danh sách lựa chọn khi gom và tạo đơn mua sắm PO.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Hiển thị: {filteredSuppliers.length} / {suppliers.length} NCC
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã NCC</th>
                    <th className="py-3 px-4">Tên Nhà Cung Cấp</th>
                    <th className="py-3 px-4">Mã Số Thuế</th>
                    <th className="py-3 px-4">Liên Hệ & Email</th>
                    <th className="py-3 px-4">Địa Chỉ</th>
                    <th className="py-3 px-4">Nhóm Cung Ứng</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSuppliers.map((s, idx) => (
                    <tr key={s.supplier_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-900">{s.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                        {s.note && <div className="text-[11px] text-slate-500 italic mt-0.5">{s.note}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{s.tax_code || '---'}</td>
                      <td className="py-3 px-4">
                        {s.contact_person && (
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {s.contact_person}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {s.phone || '---'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={s.address}>
                        {s.address || '---'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.category_groups && s.category_groups.length > 0 ? (
                            s.category_groups.map((g, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">Tất cả</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đang hợp tác
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
                            Tạm ngưng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Xóa nhà cung cấp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. SUBTAB: CẤU HÌNH DANH MỤC HÀNG HÓA (CATEGORIES) */}
      {/* ========================================================= */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng danh mục</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{categories.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Tài sản Định danh</span>
                <div className="text-xl font-bold text-emerald-800 mt-0.5">
                  {categories.filter((c) => c.tracking_type === 'DINH_DANH').length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                Serial/QR
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 uppercase">Vật tư Tiêu hao</span>
                <div className="text-xl font-bold text-amber-800 mt-0.5">
                  {categories.filter((c) => c.tracking_type === 'TIEU_HAO').length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                Số lượng
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Đang áp dụng</span>
                <div className="text-xl font-bold text-slate-800 mt-0.5">
                  {categories.filter((c) => c.status !== 'INACTIVE').length} / {categories.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                ACTIVE
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã, tên danh mục, tiền tố..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              {/* Filter by Group */}
              <select
                value={categoryGroupFilter}
                onChange={(e) => setCategoryGroupFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">-- Tất cả nhóm hàng hóa --</option>
                <option value="Thiết bị tin học">Thiết bị tin học</option>
                <option value="Thiết bị điện tử văn phòng">Thiết bị điện tử văn phòng</option>
                <option value="Thiết bị gia dụng">Thiết bị gia dụng</option>
                <option value="Nội thất văn phòng">Nội thất văn phòng</option>
                <option value="Văn phòng phẩm & vật tư">Văn phòng phẩm & vật tư</option>
                <option value="Phương tiện vận tải">Phương tiện vận tải</option>
              </select>

              {/* Filter by Tracking */}
              <select
                value={categoryTrackingFilter}
                onChange={(e) => setCategoryTrackingFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">-- Loại theo dõi --</option>
                <option value="DINH_DANH">Định danh (Serial & QR)</option>
                <option value="TIEU_HAO">Tiêu hao (Số lượng tồn)</option>
              </select>

              {/* Filter by Status */}
              <select
                value={categoryStatusFilter}
                onChange={(e) => setCategoryStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">-- Trạng thái --</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Ngưng áp dụng (INACTIVE)</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="w-full md:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              Thêm Danh Mục Mới
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Bảng Cấu Hình Danh Mục Hàng Hóa & Quy Chuẩn Theo Dõi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình phân loại Định danh (sinh mã Serial/QR) vs Tiêu hao (tính tồn số lượng), ngưỡng tồn tối thiểu và đơn giá tham chiếu.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Hiển thị {filteredCategories.length} / {categories.length} danh mục
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã Danh Mục</th>
                    <th className="py-3 px-4">Tên Hàng Hóa / Thiết Bị</th>
                    <th className="py-3 px-4">Nhóm Thiết Bị</th>
                    <th className="py-3 px-4">Hình Thức Theo Dõi</th>
                    <th className="py-3 px-4 text-center">ĐVT</th>
                    <th className="py-3 px-4 text-right">Đơn Giá Dự Kiến</th>
                    <th className="py-3 px-4 text-center">Ngưỡng Tồn</th>
                    <th className="py-3 px-4 text-center">Tiền Tố QR</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Không tìm thấy danh mục hàng hóa nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat, idx) => (
                      <tr key={cat.category_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{cat.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div>{cat.name}</div>
                          {cat.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{cat.group}</td>
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
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                          {cat.estimated_unit_price ? formatVND(cat.estimated_unit_price) : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{cat.min_stock}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">{cat.prefix || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          {cat.status === 'INACTIVE' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              Ngưng áp dụng
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-xs transition"
                              title="Chỉnh sửa danh mục hàng hóa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ========================================================= */}
      {/* 7. SUBTAB: CẤU HÌNH KHO (WAREHOUSES) */}
      {/* ========================================================= */}
      {activeSubTab === 'WAREHOUSES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã kho, tên kho, địa chỉ..."
                value={warehouseSearch}
                onChange={(e) => setWarehouseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
              />
            </div>

            <button
              onClick={handleOpenAddWarehouse}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Kho Lưu Trữ Mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <WarehouseIcon className="w-4 h-4 text-emerald-700" />
                  Mạng Lưới Kho Bãi & Cấu Hình Liên Kết Đơn Vị
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi kho thuộc quyền sở hữu của một Đơn vị và do một Thủ kho được cấp chứng chỉ quản lý phụ trách.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {warehouses.length} Kho bãi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã Kho</th>
                    <th className="py-3 px-4">Tên Kho Lưu Trữ</th>
                    <th className="py-3 px-4">Đơn Vị Chủ Quản (Cấu hình)</th>
                    <th className="py-3 px-4">Thủ Kho Phụ Trách</th>
                    <th className="py-3 px-4">Địa Chỉ Kho</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredWarehouses.map((w, idx) => {
                    const owningUnit = units.find((u) => u.unit_id === w.owning_unit_id);
                    const manager = employees.find((e) => e.employee_id === w.manager_employee_id);
                    return (
                      <tr key={w.warehouse_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-900">{w.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{w.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.warehouse_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-blue-900">
                            {owningUnit?.name || w.owning_unit_id}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Mã: {owningUnit?.code || '---'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {manager?.full_name || 'Chưa chỉ định'}
                          </div>
                          <div className="text-[11px] text-slate-500">{manager?.employee_code}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={w.address}>
                          {w.address}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditWarehouse(w)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa thông tin kho"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
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

      {/* ========================================================= */}
      {/* 7. SUBTAB: CẤU HÌNH PHÂN QUYỀN (RBAC) */}
      {/* ========================================================= */}
      {activeSubTab === 'RBAC' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Ma Trận Phân Quyền 6 Vai Trò Chuẩn THACO AGRI (Mục 3 & 11.1)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quyền hạn được kiểm soát nghiêm ngặt theo vai trò hệ thống, ngăn ngừa can thiệp chéo giữa Thu mua, Thủ kho và Kỹ thuật.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4">Vai Trò</th>
                    <th className="py-3 px-4">Tên Gọi Nghiệp Vụ</th>
                    <th className="py-3 px-4">Chức Vụ Điển Hình</th>
                    <th className="py-3 px-4">Quyền Hạn Cho Phép</th>
                    <th className="py-3 px-4">Giới Hạn / Ràng Buộc Bảo Mật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-blue-800">CBNV</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Cán bộ nhân viên</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Chuyên viên, Kế toán, Nhân viên nghiệp vụ</td>
                    <td className="py-3 px-4 text-slate-700">Tạo đề xuất cấp phát (UI06), tạo ticket sự cố IT (UI08), xem tài sản đang giữ (UI02).</td>
                    <td className="py-3 px-4 text-slate-500 italic">Không tự duyệt, không thao tác kho, không xem giá thu mua.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-emerald-800">THU_KHO</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Thủ kho khu liên hợp</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Thủ kho trưởng, Nhân viên quản lý kho</td>
                    <td className="py-3 px-4 text-slate-700">Duyệt cấp phát, xuất kho, nhận bàn giao từ Thu mua, khai báo Serial/QR, lập dự trù kho.</td>
                    <td className="py-3 px-4 text-slate-500 italic">Chỉ thao tác trong kho được gán quyền; không sửa đơn giá PO.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-purple-800">THU_MUA</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Nhân viên Mua hàng</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Chuyên viên Thu mua, Trưởng phòng Cung ứng</td>
                    <td className="py-3 px-4 text-slate-700">Tiếp nhận PO đã gom, chọn Nhà cung cấp, cập nhật đơn giá thực tế và hóa đơn VAT.</td>
                    <td className="py-3 px-4 text-slate-500 italic">Không tự sinh Serial/QR; không thay đổi số lượng nhu cầu gốc.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-amber-800">KY_THUAT</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Kỹ thuật viên IT / Bảo trì</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Kỹ sư CNTT, Kỹ thuật viên Cơ điện</td>
                    <td className="py-3 px-4 text-slate-700">Tiếp nhận ticket (UI08), chẩn đoán, đề xuất 3 kịch bản: sửa tại chỗ, thay thế linh kiện, thu hồi cấp mới.</td>
                    <td className="py-3 px-4 text-slate-500 italic">Chỉ lập phương án và đề xuất; không tự động xuất kho hay tạo PO trực tiếp.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-red-800">QUAN_TRI</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Quản trị hệ thống (Admin)</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Giám đốc CNTT, Quản trị viên hệ thống</td>
                    <td className="py-3 px-4 text-slate-700">Cấu hình Đơn vị, Phòng ban, Nhân viên, Nhà cung cấp, Kho, đồng bộ HRM, phân quyền, CSDL T-SQL.</td>
                    <td className="py-3 px-4 text-slate-500 italic">Mọi thao tác quản trị đều được ghi vết bất biến vào Sổ AuditLog.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-teal-800">QUAN_LY</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">Lãnh đạo đơn vị / Giám đốc</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">Giám đốc đơn vị, Trưởng ban Kiểm soát</td>
                    <td className="py-3 px-4 text-slate-700">Xem toàn bộ Dashboard tổng quan, tra cứu báo cáo R01-R11, giám sát chi phí và tiến độ.</td>
                    <td className="py-3 px-4 text-slate-500 italic">Quyền xem toàn cục, không thực hiện thao tác nhập xuất kho vật lý.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Role Assignment Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Gán Vai Trò & Cấp Quyền Cho Người Dùng Trực Tiếp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thay đổi vai trò sẽ có hiệu lực ngay lập tức và được lưu trữ trên máy chủ cùng AuditLog ghi vết.
                </p>
              </div>
              <span className="text-xs text-slate-500 italic">Click vào dropdown để đổi vai trò</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-4">Mã NV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Chức Vụ Hiện Tại</th>
                    <th className="py-3 px-4">Phòng Ban & Đơn Vị</th>
                    <th className="py-3 px-4">Vai Trò Đang Gán</th>
                    <th className="py-3 px-4 text-right">Chuyển Đổi Quyền Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map((emp) => {
                    const empUnit = units.find((u) => u.unit_id === emp.unit_id);
                    const empDept = departments.find((d) => d.department_id === emp.department_id);
                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.employee_code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{emp.full_name}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-800">{emp.position || '---'}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {empDept?.name} ({empUnit?.short_name})
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            emp.role === 'QUAN_TRI'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : emp.role === 'THU_KHO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : emp.role === 'THU_MUA'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : emp.role === 'KY_THUAT'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={emp.role}
                            onChange={(e) => handleRoleChange(emp.employee_id, e.target.value as UserRole)}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                          >
                            <option value="CBNV">CBNV (Cán bộ nhân viên)</option>
                            <option value="THU_KHO">THU_KHO (Thủ kho)</option>
                            <option value="THU_MUA">THU_MUA (Thu mua)</option>
                            <option value="KY_THUAT">KY_THUAT (Kỹ thuật IT)</option>
                            <option value="QUAN_TRI">QUAN_TRI (Quản trị)</option>
                            <option value="QUAN_LY">QUAN_LY (Lãnh đạo)</option>
                          </select>
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

      {/* ========================================================= */}
      {/* 8. SUBTAB: SQL SERVER STUDIO & SCHEMA */}
      {/* ========================================================= */}
      {activeSubTab === 'SQL_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                18 Bảng CSDL Chuẩn (Mục 7.2)
              </span>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                SQL Server
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {sqlTables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setSelectedTable(t.name);
                    setSqlQuery(`SELECT TOP 10 * FROM dbo.${t.name};`);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                    selectedTable === t.name
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t.desc}</div>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  T-SQL Query Console (SSMS Interactive Simulation)
                </span>
                <button
                  onClick={handleRunQuery}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Thực thi (F5)
                </button>
              </div>

              <textarea
                rows={3}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-300 p-3 rounded-xl border border-slate-800 focus:outline-emerald-500"
              />

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                {queryResult}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Tệp Mã Nguồn DDL & Bảng Khởi Tạo SQL Server
                </span>
                <button
                  onClick={handleCopySql}
                  className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isCopied ? 'Đã sao chép!' : 'Sao chép T-SQL'}
                </button>
              </div>

              <pre className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[11px] text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {SQL_SERVER_SCHEMA_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. SUBTAB: SỔ NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) */}
      {/* ========================================================= */}
      {activeSubTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                Sổ Nhật Ký Kiểm Toán Hệ Thống (AuditLog - Mục 5.6 & 7.2)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận mọi thao tác cấu hình, đổi vai trò, nhập xuất và luân chuyển tài sản để phục vụ thanh tra.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {auditLogs.length} sự kiện đã ghi nhận
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-4 w-10 text-center">STT</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Người thực hiện</th>
                  <th className="py-2.5 px-4">Hành động</th>
                  <th className="py-2.5 px-4">Đối tượng</th>
                  <th className="py-2.5 px-4">Mã bản ghi</th>
                  <th className="py-2.5 px-4">Giá trị Trước → Sau</th>
                  <th className="py-2.5 px-4">Lý do / Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((log, idx) => (
                  <tr key={log.log_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateVN(log.occurred_at)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.user_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-900">{log.entity_type}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{log.entity_id}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {log.before_value ? `${log.before_value} → ` : ''}
                      <span className="font-bold text-slate-900">{log.after_value || '---'}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.reason || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. SUBTAB: DANH MỤC CHI PHÍ DỊCH VỤ (EXPENSE CATEGORIES) */}
      {/* ========================================================= */}
      {activeSubTab === 'SERVICE_EXPENSE_CATEGORIES' && (
        <div className="space-y-4">
          {/* Information Banner */}
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <ReceiptText className="w-3.5 h-3.5" />
                  Cấu Hình Chi Phí Dịch Vụ
                </span>
                <span className="text-xs text-emerald-300 font-mono">TÊN CHI PHÍ ➔ LOẠI ÁP DỤNG</span>
              </div>
              <h3 className="text-base font-bold">
                Danh Mục Tên Chi Phí & Loại Áp Dụng Chi Phí Dịch Vụ
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Chuẩn hóa các hạng mục dịch vụ thuê ngoài (bảo trì máy chủ/thiết bị IT, cước viễn thông, kiểm định xe nâng/PCCC, vận chuyển bốc xếp...).
                Khi nhập chi phí dịch vụ, người dùng sẽ chọn trực tiếp từ danh sách này giúp số liệu đồng bộ và chính xác.
              </p>
            </div>

            <button
              onClick={handleOpenAddExpenseCat}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 shrink-0 cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              + Thêm Danh Mục Chi Phí
            </button>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã CP-, tên chi phí, diễn giải..."
                  value={expenseCatSearch}
                  onChange={(e) => setExpenseCatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              {/* Filter by Category Group */}
              <select
                value={expenseCatGroupFilter}
                onChange={(e) => setExpenseCatGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả Nhóm Chi Phí ({STANDARD_EXPENSE_GROUPS.length} nhóm)</option>
                {STANDARD_EXPENSE_GROUPS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code}: {g.name}
                  </option>
                ))}
              </select>

              {/* Filter by Category Type */}
              <select
                value={expenseCatTypeFilter}
                onChange={(e) => setExpenseCatTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">Tất cả Loại áp dụng ({configuredCategoryTypes.length})</option>
                {configuredCategoryTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-900">{filteredExpenseCategories.length}</strong> / {expenseCategories.length} danh mục chi phí
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-12">STT</th>
                    <th className="py-3 px-4">Nhóm Chi Phí</th>
                    <th className="py-3 px-4">Mã Chi Phí</th>
                    <th className="py-3 px-4">Tên Chi Phí</th>
                    <th className="py-3 px-4">Loại Áp Dụng</th>
                    <th className="py-3 px-4">Diễn Giải Quy Chuẩn</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExpenseCategories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Không có danh mục chi phí nào phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenseCategories.map((c, idx) => (
                      <tr key={c.expense_category_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 block w-max mb-0.5">
                            {c.group_code || 'CPVH'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 block line-clamp-1" title={c.group_name}>
                            {c.group_name || 'Chi phí vận hành'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {c.category_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{c.description || '---'}</td>
                        <td className="py-3 px-4 text-center">
                          {c.is_active ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              Tạm ngừng
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditExpenseCat(c)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded transition cursor-pointer"
                              title="Sửa danh mục chi phí"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpenseCat(c.expense_category_id, c.name)}
                              className="p-1.5 text-red-600 hover:text-red-800 rounded transition cursor-pointer"
                              title="Xóa danh mục chi phí"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA DANH MỤC CHI PHÍ DỊCH VỤ */}
      {/* ========================================================= */}
      {isExpenseCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-emerald-300" />
                  {editingExpenseCat ? 'Cập Nhật Danh Mục Chi Phí Dịch Vụ' : 'Thêm Danh Mục Chi Phí Dịch Vụ Mới'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Cấu hình Tên chi phí và Loại áp dụng theo quy chuẩn THACO AGRI
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseCatModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpenseCat} className="p-6 space-y-4 text-xs">
              {/* Nhóm Chi Phí Cha */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <label className="block font-bold text-emerald-950">
                  Thuộc Nhóm Chi Phí Cha (THACO AGRI): <span className="text-red-500">*</span>
                </label>
                <select
                  value={expenseCatForm.group_code || ''}
                  onChange={(e) => {
                    const selGroup = STANDARD_EXPENSE_GROUPS.find((g) => g.code === e.target.value);
                    if (selGroup) {
                      const groupCount = expenseCategories.filter((c) => c.group_code === selGroup.code).length + 1;
                      setExpenseCatForm((prev) => ({
                        ...prev,
                        group_code: selGroup.code,
                        group_name: selGroup.name,
                        category_type: selGroup.root,
                        code: editingExpenseCat ? prev.code : `${selGroup.code}-${String(groupCount).padStart(2, '0')}`,
                      }));
                    } else {
                      setExpenseCatForm((prev) => ({
                        ...prev,
                        group_code: e.target.value,
                        group_name: 'Nhóm chi phí khác',
                      }));
                    }
                  }}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-emerald-700"
                >
                  <option value="">-- Chọn nhóm chi phí cha --</option>
                  {STANDARD_EXPENSE_GROUPS.map((g) => (
                    <option key={g.code} value={g.code}>
                      [{g.code}] {g.name}
                    </option>
                  ))}
                  <option value="OTHER">Nhóm khác / Tùy chỉnh</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã danh mục chi phí: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseCatForm.code}
                    onChange={(e) => setExpenseCatForm({ ...expenseCatForm, code: e.target.value })}
                    placeholder="Ví dụ: CPVH-CT-MS-01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Được tự động sinh theo nhóm cha</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trạng thái:
                  </label>
                  <select
                    value={expenseCatForm.is_active ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setExpenseCatForm({ ...expenseCatForm, is_active: e.target.value === 'ACTIVE' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="ACTIVE">Hoạt động (Hiển thị khi nhập chi phí)</option>
                    <option value="INACTIVE">Tạm ngừng sử dụng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên chi phí dịch vụ: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expenseCatForm.name}
                  onChange={(e) => setExpenseCatForm({ ...expenseCatForm, name: e.target.value })}
                  placeholder="Ví dụ: Dịch vụ vé máy bay, Dịch vụ khách sạn..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Loại áp dụng: <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={expenseCatForm.category_type}
                    onChange={(e) => setExpenseCatForm({ ...expenseCatForm, category_type: e.target.value })}
                    placeholder="Ví dụ: V. CHI PHÍ VẬN HÀNH & CÔNG TÁC, VI. CHI PHÍ GIAO TẾ & PHÚC LỢI..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-medium"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      'V. CHI PHÍ VẬN HÀNH & CÔNG TÁC',
                      'VI. CHI PHÍ GIAO TẾ & PHÚC LỢI',
                      'Dịch vụ CNTT & Phần mềm',
                      'Bảo dưỡng & Sửa chữa',
                      'Hậu cần & Kho bãi'
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setExpenseCatForm({ ...expenseCatForm, category_type: sug })}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2 py-0.5 rounded-full cursor-pointer transition border border-slate-200"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Diễn giải quy chuẩn / Ghi chú mặc định:</label>
                <textarea
                  rows={2}
                  value={expenseCatForm.description}
                  onChange={(e) => setExpenseCatForm({ ...expenseCatForm, description: e.target.value })}
                  placeholder="Nội dung diễn giải chi tiết gợi ý mặc định..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingExpenseCat ? 'Lưu Cập Nhật' : 'Tạo Danh Mục Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA NHÂN VIÊN (CÓ CHỨC VỤ & PHÒNG BAN CASCADE) */}
      {/* ========================================================= */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-300" />
                  {editingEmp ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới (User Add)'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Ràng buộc 3 bảng: Chọn Đơn vị ➔ Lọc Phòng ban ➔ Nhập Chức vụ ➔ Gán Quyền
                </p>
              </div>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmp} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã nhân viên (TG-xxxxx): *</label>
                  <input
                    type="text"
                    required
                    value={empForm.employee_code}
                    onChange={(e) => setEmpForm({ ...empForm, employee_code: e.target.value })}
                    placeholder="TG-00123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên nhân sự: *</label>
                  <input
                    type="text"
                    required
                    value={empForm.full_name}
                    onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Cascade: Step 1: Chọn Đơn Vị */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <GitFork className="w-4 h-4 text-blue-700" />
                  <span>Ràng Buộc Cơ Cấu Tổ Chức (Đơn vị ➔ Phòng ban):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      1. Đơn vị chi trả lương: *
                    </label>
                    <select
                      required
                      value={empForm.unit_id}
                      onChange={(e) => handleEmpUnitChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-blue-600 text-blue-900"
                    >
                      {units.map((u) => (
                        <option key={u.unit_id} value={u.unit_id}>
                          {u.name} ({u.short_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cascade: Step 2: Lọc Phòng Ban Theo Đơn Vị */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Phòng ban trực thuộc: *
                    </label>
                    {(() => {
                      const availDepts = departments.filter((d) => d.unit_id === empForm.unit_id);
                      if (availDepts.length === 0) {
                        return (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                            Đơn vị này chưa có phòng ban. Hãy tạo phòng ban trước!
                          </div>
                        );
                      }
                      return (
                        <select
                          required
                          value={empForm.department_id}
                          onChange={(e) => setEmpForm({ ...empForm, department_id: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-blue-600 text-slate-900"
                        >
                          {availDepts.map((d) => (
                            <option key={d.department_id} value={d.department_id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Step 3: Chức Vụ & Vai Trò Hệ Thống */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Chức vụ (Position): *
                  </label>
                  <input
                    type="text"
                    required
                    value={empForm.position}
                    onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                    placeholder="Ví dụ: Giám đốc, Trưởng phòng, Kỹ sư IT, Thủ kho..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Chuyên viên', 'Trưởng phòng', 'Kỹ sư IT', 'Thủ kho trưởng', 'Thu mua'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setEmpForm({ ...empForm, position: sug })}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Vai trò hệ thống (Role): *
                  </label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600 text-emerald-900"
                  >
                    <option value="CBNV">CBNV (Cán bộ nhân viên - Đề xuất cấp phát, ticket)</option>
                    <option value="THU_KHO">THU_KHO (Thủ kho - Duyệt, xuất nhập kho, serial)</option>
                    <option value="THU_MUA">THU_MUA (Thu mua - PO, đơn giá thực tế VAT)</option>
                    <option value="KY_THUAT">KY_THUAT (Kỹ thuật IT - Xử lý ticket & vật tư)</option>
                    <option value="QUAN_TRI">QUAN_TRI (Quản trị hệ thống - Cấu hình 3 bảng)</option>
                    <option value="QUAN_LY">QUAN_LY (Lãnh đạo đơn vị - Xem báo cáo tổng quan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email doanh nghiệp (@thacoagri.vn):</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="tennv@thacoagri.vn"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    placeholder="0905 123 456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingEmp ? 'Lưu Cập Nhật' : 'Tạo Nhân Sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA PHÒNG BAN (DEPARTMENTS) */}
      {/* ========================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-300" />
                {editingDept ? 'Cập Nhật Phòng Ban Nghiệp Vụ' : 'Thêm Phòng Ban Nghiệp Vụ Mới'}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn vị trực thuộc chủ quản: *
                </label>
                <select
                  required
                  value={deptForm.unit_id}
                  onChange={(e) => setDeptForm({ ...deptForm, unit_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600 text-blue-900"
                >
                  {units.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      {u.name} ({u.short_name} - {u.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Phòng ban sẽ được liên kết trực thuộc đơn vị này theo ràng buộc khóa ngoại `FK_Dept_Unit`.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã phòng ban: *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="IT-DX, HC-NS, KT-TC..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái:</label>
                  <select
                    value={deptForm.status}
                    onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên phòng ban đầy đủ: *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="Ví dụ: Phòng Kỹ thuật Công nghệ Nông nghiệp..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingDept ? 'Lưu Cập Nhật' : 'Tạo Phòng Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA ĐƠN VỊ (UNITS) */}
      {/* ========================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                {editingUnit ? 'Cập Nhật Đơn Vị Tổ Chức' : 'Thêm Đơn Vị Tổ Chức Mới'}
              </h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đơn vị: *</label>
                  <input
                    type="text"
                    required
                    value={unitForm.code}
                    onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                    placeholder="KLH-SNG, TH-BHH..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên viết tắt: *</label>
                  <input
                    type="text"
                    required
                    value={unitForm.short_name}
                    onChange={(e) => setUnitForm({ ...unitForm, short_name: e.target.value })}
                    placeholder="KLH Snuol, Bò Ia Puch..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đầy đủ đơn vị pháp nhân: *</label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Ví dụ: Khu Liên Hợp Snuol - Campuchia..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trực thuộc đơn vị cấp trên (Parent Unit):</label>
                <select
                  value={unitForm.parent_unit_id || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, parent_unit_id: e.target.value || null })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 font-semibold"
                >
                  <option value="">-- Trực thuộc Tập đoàn THACO AGRI (Mẹ) --</option>
                  {units
                    .filter((u) => u.unit_id !== editingUnit?.unit_id)
                    .map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.name} ({u.short_name})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở / Nông trường:</label>
                <input
                  type="text"
                  value={unitForm.address}
                  onChange={(e) => setUnitForm({ ...unitForm, address: e.target.value })}
                  placeholder="Địa chỉ khu liên hợp, tỉnh thành..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingUnit ? 'Lưu Cập Nhật' : 'Tạo Đơn Vị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA NHÀ CUNG CẤP */}
      {/* ========================================================= */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-300" />
                {editingSupplier ? 'Cập Nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã nhà cung cấp: *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    placeholder="Ví dụ: NCC-007, PV-TECH..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã số thuế (MST):</label>
                  <input
                    type="text"
                    value={supplierForm.tax_code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, tax_code: e.target.value })}
                    placeholder="Ví dụ: 0304998392"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đầy đủ nhà cung cấp / Công ty: *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Ví dụ: Công ty Cổ phần Công nghệ Tin học..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="028 3822 5555"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email đặt hàng / báo giá:</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="sales@supplier.vn"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người đại diện / phụ trách:</label>
                  <input
                    type="text"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    placeholder="Nguyễn Văn A (Trưởng phòng KD)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái hợp tác:</label>
                  <select
                    value={supplierForm.status}
                    onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  >
                    <option value="ACTIVE">Đang hợp tác (Hiển thị khi tạo PO)</option>
                    <option value="INACTIVE">Tạm ngưng cung ứng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở / kho hàng giao nhận:</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh thành..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
                <textarea
                  rows={2}
                  value={supplierForm.note}
                  onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}
                  placeholder="Ghi chú về chiết khấu, thời hạn bảo hành, chính sách công nợ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingSupplier ? 'Lưu Cập Nhật' : 'Tạo Nhà Cung Cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA KHO (WAREHOUSES) */}
      {/* ========================================================= */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-amber-300" />
                {editingWarehouse ? 'Cập Nhật Kho Lưu Trữ' : 'Thêm Kho Lưu Trữ Mới'}
              </h3>
              <button onClick={() => setIsWarehouseModalOpen(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã kho: *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    placeholder="WH-04, KHO-BHH..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái kho:</label>
                  <select
                    value={warehouseForm.status}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Tạm khóa kiểm kê</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên kho lưu trữ: *</label>
                <input
                  type="text"
                  required
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  placeholder="Ví dụ: Kho Vật Tư - KLH Snuol Campuchia..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cấu hình liên kết Đơn vị chủ quản: *</label>
                <select
                  required
                  value={warehouseForm.owning_unit_id}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, owning_unit_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600 text-blue-900"
                >
                  {units.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      {u.name} ({u.short_name} - {u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thủ kho phụ trách chính: *</label>
                <select
                  required
                  value={warehouseForm.manager_employee_id}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.position} [{emp.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ vị trí kho vật lý:</label>
                <input
                  type="text"
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  placeholder="Khu công nghiệp, xưởng sản xuất, phân xưởng nông trường..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingWarehouse ? 'Lưu Cập Nhật' : 'Tạo Kho Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA DANH MỤC HÀNG HÓA */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">
                  {editingCategory ? `Cập Nhật Danh Mục: ${editingCategory.code}` : 'Thêm Mới Danh Mục Hàng Hóa'}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-emerald-300 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã danh mục: *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.code}
                    disabled={!!editingCategory}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                    placeholder="VD: LT-LENOVO-T14"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase focus:outline-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái áp dụng:</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Ngưng áp dụng (INACTIVE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên hàng hóa / Thiết bị: *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="VD: Laptop Lenovo ThinkPad T14 Gen 4..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhóm hàng hóa: *</label>
                  <select
                    value={categoryForm.group}
                    onChange={(e) => setCategoryForm({ ...categoryForm, group: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
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
                  <label className="block font-bold text-slate-700 mb-1">Hình thức theo dõi: *</label>
                  <select
                    value={categoryForm.tracking_type}
                    onChange={(e) => setCategoryForm({ ...categoryForm, tracking_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-emerald-600"
                  >
                    <option value="DINH_DANH">Định danh (Serial & QR từng cái)</option>
                    <option value="TIEU_HAO">Tiêu hao (Số lượng tồn tổng)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn vị tính: *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.unit_of_measure}
                    onChange={(e) => setCategoryForm({ ...categoryForm, unit_of_measure: e.target.value })}
                    placeholder="Máy, Cái, Bộ, Ram..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngưỡng tồn tối thiểu:</label>
                  <input
                    type="number"
                    min={0}
                    value={categoryForm.min_stock}
                    onChange={(e) => setCategoryForm({ ...categoryForm, min_stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn giá tham chiếu (VND):</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={categoryForm.estimated_unit_price}
                    onChange={(e) => setCategoryForm({ ...categoryForm, estimated_unit_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiền tố mã QR tự sinh:</label>
                <input
                  type="text"
                  value={categoryForm.prefix}
                  onChange={(e) => setCategoryForm({ ...categoryForm, prefix: e.target.value })}
                  placeholder="VD: LP, PC, PR, TB..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả quy cách / Ghi chú:</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Quy chuẩn kỹ thuật, cấu hình tiêu chuẩn..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-emerald-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingCategory ? 'Lưu Cập Nhật' : 'Tạo Danh Mục Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MÔ PHỎNG ĐỒNG BỘ HRM CORE TẬP ĐOÀN */}
      {/* ========================================================= */}
      {isHrmSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw className={`w-5 h-5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <div>
                  <h3 className="font-bold text-sm">
                    Tiến Trình Đồng Bộ Nhân Sự THACO AGRI HRM Core
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Giao thức: gRPC / TLS 1.3 • Endpoint: hrm-core.thacoagri.vn:8443
                  </p>
                </div>
              </div>
              {!isSyncing && (
                <button
                  onClick={() => setIsHrmSyncModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Step indicator */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div className={`p-2 rounded-lg border ${syncStep >= 1 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800/40 text-slate-500 border-slate-800'}`}>
                  1. Kết nối mTLS
                </div>
                <div className={`p-2 rounded-lg border ${syncStep >= 2 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800/40 text-slate-500 border-slate-800'}`}>
                  2. Xác thực Token
                </div>
                <div className={`p-2 rounded-lg border ${syncStep >= 3 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800/40 text-slate-500 border-slate-800'}`}>
                  3. Quét sơ đồ & chức vụ
                </div>
                <div className={`p-2 rounded-lg border ${syncStep >= 4 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800/40 text-slate-500 border-slate-800'}`}>
                  4. Ghi nhận SQL
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-500 rounded-full"
                  style={{ width: `${(syncStep / 4) * 100}%` }}
                />
              </div>

              {/* Console log box */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
                {syncLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>

              {/* Completed Notice */}
              {!isSyncing && syncStep === 4 && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block">Đồng bộ hoàn tất 100%!</span>
                    <span className="text-slate-300">
                      Cơ sở dữ liệu nhân viên, chức vụ và liên kết Đơn vị - Phòng ban đã được làm mới từ trung tâm HRM tập đoàn.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  disabled={isSyncing}
                  onClick={() => setIsHrmSyncModalOpen(false)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                    isSyncing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow-md'
                  }`}
                >
                  {isSyncing ? 'Đang thực hiện đồng bộ...' : 'Đóng cửa sổ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
