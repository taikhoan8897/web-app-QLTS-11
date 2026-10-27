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
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActiveTab = 
  | 'DASHBOARD'
  | 'ASSETS'
  | 'REQUESTS'
  | 'TICKETS'
  | 'PURCHASE_ORDERS'
  | 'TRANSFERS'
  | 'REPORTS'
  | 'SQL_ADMIN';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { requests, purchaseOrders, tickets, stockBalances, selectedWarehouseId } = useApp();

  // Badge counts
  const pendingRequests = requests.filter((r) => r.status === 'CHO_TIEP_NHAN').length;
  const pendingIdentifyPOs = purchaseOrders.filter((p) => p.status === 'MUA_HANG_HOAN_TAT').length;
  const pendingReceivePOs = purchaseOrders.filter((p) => p.status === 'CHO_NHAP_KHO').length;
  const activeTickets = tickets.filter((t) => t.status === 'MOI' || t.status === 'DANG_XU_LY').length;
  const lowStockCount = stockBalances.filter(
    (s) => s.warehouse_id === selectedWarehouseId && s.quantity_on_hand <= 10
  ).length;

  const navItems = [
    {
      id: 'DASHBOARD' as const,
      label: 'Tổng quan & Kho',
      sub: 'UI01 Dashboard',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? `${lowStockCount} cảnh báo` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'ASSETS' as const,
      label: 'Kho & Tài sản',
      sub: 'UI02-05 Nhập/Cấp/Thu',
      icon: Box,
      badge: pendingIdentifyPOs > 0 ? `${pendingIdentifyPOs} PO chờ định danh` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'REQUESTS' as const,
      label: 'Yêu cầu Cấp phát',
      sub: 'UI06-07 Đề xuất CBNV',
      icon: FileCheck,
      badge: pendingRequests > 0 ? `${pendingRequests} chờ duyệt` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'TICKETS' as const,
      label: 'Sự cố & Kỹ thuật',
      sub: 'UI08 Ticket IT',
      icon: Wrench,
      badge: activeTickets > 0 ? `${activeTickets} đang xử lý` : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      id: 'PURCHASE_ORDERS' as const,
      label: 'Đơn hàng Thu mua (PO)',
      sub: 'UI09 Gom mua & PO con',
      icon: ShoppingCart,
      badge: pendingReceivePOs > 0 ? `${pendingReceivePOs} chờ nhập kho` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'TRANSFERS' as const,
      label: 'Điều chuyển kho',
      sub: 'UI10 Giao/Nhận đơn vị',
      icon: ArrowLeftRight,
    },
    {
      id: 'REPORTS' as const,
      label: 'Báo cáo & Tra cứu',
      sub: 'UI11 R01-R11 / Excel',
      icon: BarChart3,
    },
    {
      id: 'SQL_ADMIN' as const,
      label: 'Quản trị & SQL Server',
      sub: 'UI12 RBAC & CSDL',
      icon: Database,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer relative ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <div className="text-left">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight hidden lg:block">
                    {item.sub}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-700 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
