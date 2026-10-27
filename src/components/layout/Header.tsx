import React from 'react';
import { 
  Building2, 
  Warehouse, 
  UserCheck, 
  Database, 
  FileText, 
  RotateCcw, 
  Bell, 
  ChevronDown,
  Layers,
  Sparkles,
  User,
  ShieldAlert,
  Info,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenTemplates: () => void;
  onOpenSqlModal: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenTemplates, 
  onOpenSqlModal,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { 
    currentUser, 
    setCurrentUserById, 
    employees, 
    warehouses, 
    selectedWarehouseId, 
    setSelectedWarehouseId,
    resetToDefaultData,
    requests,
    purchaseOrders,
    stockBalances
  } = useApp();

  const isCBNV = currentUser.role === 'CBNV';

  // Fast shortcut list for testing
  const quickTestUsers = [
    {
      id: 'EMP-004',
      label: 'CBNV 1: Hồng Ánh (Kế toán)',
      sub: 'Đang giữ Laptop Dell',
      role: 'CBNV',
      color: 'bg-emerald-700 text-white hover:bg-emerald-600',
    },
    {
      id: 'EMP-007',
      label: 'CBNV 2: Minh Đức (Nhân sự)',
      sub: 'Nhân sự mới, test xin cấp máy',
      role: 'CBNV',
      color: 'bg-teal-700 text-white hover:bg-teal-600',
    },
    {
      id: 'EMP-001',
      label: 'Thủ kho: Văn Hùng',
      sub: 'Quản lý kho & cấp phát',
      role: 'THU_KHO',
      color: 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800',
    },
    {
      id: 'EMP-002',
      label: 'Thu mua: Thị Mai',
      sub: 'Xử lý đơn PO',
      role: 'THU_MUA',
      color: 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800',
    },
    {
      id: 'EMP-003',
      label: 'Kỹ thuật IT: Hoàng Nam',
      sub: 'Sửa chữa & sự cố',
      role: 'KY_THUAT',
      color: 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800',
    },
  ];

  return (
    <header className="bg-emerald-800 text-white border-b border-emerald-900 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-2 text-emerald-200 hover:text-white hover:bg-emerald-700/80 rounded-xl transition cursor-pointer"
              title="Mở menu chức năng"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* THACO AGRI Stylized Brand Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-md border-2 border-emerald-500 shrink-0">
                {/* THACO AGRI 'G' Symbol */}
                <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-800 font-black">
                  <path d="M 20 20 L 80 20 L 80 35 L 38 35 L 38 65 L 65 65 L 65 50 L 50 50 L 50 38 L 80 38 L 80 80 L 20 80 Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white font-sans whitespace-nowrap">
                    THACO <span className="text-emerald-300">AGRI</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 shrink-0">
                    Kho & QLTS
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/90 font-medium hidden md:block truncate">
                  Hệ thống Quản lý Tài sản, Dịch vụ Hoạt động & Thu mua
                </p>
              </div>
            </div>
          </div>

          {/* Right Navigation & Quick Controls */}
          <div className="flex items-center gap-3">
            {/* Warehouse selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-900/60 border border-emerald-700/50 rounded-lg px-2.5 py-1 text-xs">
              <Warehouse className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200">Kho đang chọn:</span>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id} className="text-slate-900 bg-white">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons */}
            <button
              onClick={onOpenTemplates}
              title="Biểu mẫu in ấn chuẩn: Biên bản bàn giao, thu hồi, đề xuất, thanh lý"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden md:inline">Biểu mẫu</span>
            </button>

            <button
              onClick={onOpenSqlModal}
              title="Xem và tải kịch bản Microsoft SQL Server 2022"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 border border-emerald-600/50 rounded-lg text-xs font-semibold text-emerald-300 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">SQL Server</span>
            </button>

            {/* Switch User / Role Dropdown */}
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-700/60">
              <div className="relative group">
                <div className="flex items-center gap-2 bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-600 rounded-lg px-3 py-1.5 transition">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                    {currentUser.role.slice(0, 2)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      {currentUser.full_name}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isCBNV ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-700 text-emerald-200'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-200 leading-tight">
                      {currentUser.position}
                    </div>
                  </div>

                  {/* Role Switcher Select */}
                  <select
                    value={currentUser.employee_id}
                    onChange={(e) => setCurrentUserById(e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full"
                    title="Chuyển đổi vai trò người dùng (CBNV, Thủ kho, Thu mua, Kỹ thuật, Quản trị, Quản lý)"
                  >
                    <optgroup label="Cán bộ nhân viên (CBNV - Người dùng bình thường)">
                      {employees
                        .filter((e) => e.role === 'CBNV')
                        .map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id} className="text-slate-900 bg-white font-medium">
                            👤 {emp.full_name} ({emp.position}) - {emp.employee_code}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Các vai trò vận hành khác">
                      {employees
                        .filter((e) => e.role !== 'CBNV')
                        .map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id} className="text-slate-900 bg-white font-medium">
                            ⚙️ {emp.full_name} - {emp.role} ({emp.position})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                </div>
              </div>
            </div>

            {/* Reset data */}
            <button
              onClick={resetToDefaultData}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-700 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
