import React from 'react';
import {
  LayoutDashboard,
  Box,
  FileCheck,
  Wrench,
  ShoppingCart,
  ArrowLeftRight,
  BarChart3,
  Database,
  User,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  QrCode,
  X,
  ReceiptText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export type ActiveTab = 
  | 'DASHBOARD'
  | 'MY_ASSETS'
  | 'ASSETS'
  | 'REQUESTS'
  | 'TICKETS'
  | 'PURCHASE_ORDERS'
  | 'SERVICE_EXPENSES'
  | 'TRANSFERS'
  | 'REPORTS'
  | 'SQL_ADMIN';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTemplates: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[]; // RBAC permission matrix
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenTemplates,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { 
    currentUser, 
    requests, 
    purchaseOrders, 
    tickets, 
    stockBalances, 
    assets,
    selectedWarehouseId,
    warehouses,
    procurementDemands
  } = useApp();

  const userRole = currentUser.role;

  // Badges calculation
  const myHeldAssetsCount = assets.filter((a) => a.holder_employee_id === currentUser.employee_id).length;
  const pendingRequests = requests.filter((r) => r.status === 'CHO_TIEP_NHAN').length;
  const myPendingRequests = requests.filter(
    (r) => r.requester_id === currentUser.employee_id && r.status === 'CHO_TIEP_NHAN'
  ).length;
  const openDemandsCount = procurementDemands.filter((d) => d.status === 'CHO_GOM_PO').length;
  const pendingIdentifyPOs = purchaseOrders.filter((p) => p.status === 'MUA_HANG_HOAN_TAT').length;
  const pendingReceivePOs = purchaseOrders.filter((p) => p.status === 'CHO_NHAP_KHO').length;
  const activeTickets = tickets.filter((t) => t.status === 'MOI' || t.status === 'DANG_XU_LY').length;
  const lowStockCount = stockBalances.filter(
    (s) => s.warehouse_id === selectedWarehouseId && s.quantity_on_hand <= 10
  ).length;

  const currentWh = warehouses.find((w) => w.warehouse_id === selectedWarehouseId);

  // Master Menu Definition with Strict Role-Based Access Control (Mục 3 & 11.1)
  const allMenuItems: MenuItem[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard Tổng Quan',
      sub: 'UI01 Kiểm soát kho',
      icon: LayoutDashboard,
      allowedRoles: ['THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
      badge: lowStockCount > 0 ? `${lowStockCount} cảnh báo` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'MY_ASSETS',
      label: 'Tài Sản Của Tôi',
      sub: 'Thiết bị CBNV đang giữ',
      icon: User,
      allowedRoles: ['CBNV', 'THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY'],
      badge: myHeldAssetsCount > 0 ? `${myHeldAssetsCount} thiết bị` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'REQUESTS',
      label: userRole === 'CBNV' ? 'Đề Xuất Cấp Phát' : 'Quản Lý Cấp Phát',
      sub: userRole === 'CBNV' ? 'UI06 Tạo yêu cầu VPP/Laptop' : 'UI07 Hàng đợi Thủ kho',
      icon: FileCheck,
      allowedRoles: ['CBNV', 'THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY'],
      badge: userRole === 'CBNV' ? (myPendingRequests > 0 ? `${myPendingRequests} chờ duyệt` : undefined) : (pendingRequests > 0 ? `${pendingRequests} chờ duyệt` : undefined),
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'TICKETS',
      label: 'Sự Cố IT & Bảo Trì',
      sub: 'UI08 Báo lỗi & 3 kịch bản',
      icon: Wrench,
      allowedRoles: ['CBNV', 'KY_THUAT', 'THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
      badge: activeTickets > 0 ? `${activeTickets} đang xử lý` : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      id: 'ASSETS',
      label: 'Kho & Quản Lý Tài Sản',
      sub: 'UI02-05 Nhập/Cấp/Thu/Thanh lý',
      icon: Box,
      allowedRoles: ['THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
      badge: pendingIdentifyPOs > 0 ? `${pendingIdentifyPOs} PO chờ định danh` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'PURCHASE_ORDERS',
      label: 'Đơn Hàng Thu Mua (PO)',
      sub: 'UI09 Gom mua, giá & PO con',
      icon: ShoppingCart,
      allowedRoles: ['THU_MUA', 'THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
      badge: openDemandsCount > 0 ? `${openDemandsCount} chờ gom` : (pendingReceivePOs > 0 ? `${pendingReceivePOs} chờ nhập` : undefined),
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'SERVICE_EXPENSES',
      label: 'Chi Phí Dịch Vụ',
      sub: 'Nhập & Quản lý chi phí DV',
      icon: ReceiptText,
      allowedRoles: ['THU_MUA', 'THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
    },
    {
      id: 'TRANSFERS',
      label: 'Điều Chuyển Kho',
      sub: 'UI10 Đổi đơn vị sở hữu',
      icon: ArrowLeftRight,
      allowedRoles: ['THU_KHO', 'QUAN_TRI', 'QUAN_LY'],
    },
    {
      id: 'REPORTS',
      label: 'Báo Cáo & Xuất Excel',
      sub: 'UI11 R01-R11 & Chi phí',
      icon: BarChart3,
      allowedRoles: ['THU_KHO', 'THU_MUA', 'KY_THUAT', 'QUAN_TRI', 'QUAN_LY'],
    },
    {
      id: 'SQL_ADMIN',
      label: 'Cấu Hình & Quản Trị Hệ Thống',
      sub: 'NCC, Đơn vị, Kho, HRM & SQL',
      icon: Database,
      allowedRoles: ['QUAN_TRI', 'QUAN_LY'],
    },
  ];

  // Filter menus based on Current User's Role Permissions (RBAC)
  const allowedMenuItems = allMenuItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarBody = (isMobile = false) => (
    <div className="flex flex-col h-full w-full">
      {/* Current User Role Context Badge */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
              {currentUser.role.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-slate-900 truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{currentUser.position}</div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
              title="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Phân quyền:</span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
            userRole === 'CBNV'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {userRole === 'CBNV' ? 'CÁN BỘ NHÂN VIÊN' : userRole}
          </span>
        </div>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {userRole === 'CBNV' ? 'Chức Năng Cán Bộ Nhân Viên' : 'Menu Chức Năng Quản Trị'}
        </div>

        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between group ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition shrink-0 ${
                    isActive ? 'bg-emerald-700 text-white' : 'text-slate-500 group-hover:text-emerald-700 bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[10px] font-normal leading-tight truncate mt-0.5 ${
                      isActive ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge ? (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    isActive ? 'bg-white text-emerald-900 border-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 transition shrink-0 ${
                    isActive ? 'text-emerald-200 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Informative lock note for CBNV */}
        {userRole === 'CBNV' && (
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold block mb-1">ℹ️ Giới hạn quyền CBNV:</span>
            Tài khoản nhân viên được cấp quyền: xem tài sản cá nhân, tạo phiếu đề xuất cấp phát và gửi ticket sự cố kỹ thuật.
          </div>
        )}
      </div>

      {/* Bottom Warehouse & Quick Form info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] space-y-2 shrink-0">
        <div className="flex items-center justify-between text-slate-600">
          <span>Kho trực thuộc:</span>
          <span className="font-semibold text-slate-900 truncate max-w-[130px]">{currentWh?.name}</span>
        </div>
        <button
          onClick={() => {
            onOpenTemplates();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-center transition cursor-pointer text-xs"
        >
          📄 Biểu mẫu in ấn chuẩn
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on screens >= lg) */}
      <aside className="hidden lg:flex w-64 lg:w-72 bg-white border-r border-slate-200 flex-col shrink-0 min-h-[calc(100vh-64px)] shadow-xs select-none">
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Slide-Over Drawer (visible on mobile / tablet when toggled) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] bg-white h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
};
