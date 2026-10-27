import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { 
  LayoutDashboard, 
  User, 
  FileCheck, 
  Wrench, 
  ShoppingCart, 
  Box, 
  Menu, 
  BarChart3, 
  Database 
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { WarehouseDashboard } from './components/dashboard/WarehouseDashboard';
import { AssetManagementView } from './components/assets/AssetManagementView';
import { MyAssetsView } from './components/assets/MyAssetsView';
import { RequestsView } from './components/requests/RequestsView';
import { TechnicalTicketsView } from './components/tickets/TechnicalTicketsView';
import { PurchaseOrdersView } from './components/procurement/PurchaseOrdersView';
import { ServiceExpensesView } from './components/expenses/ServiceExpensesView';
import { TransfersView } from './components/transfers/TransfersView';
import { ReportsView } from './components/reports/ReportsView';
import { SqlServerAdminView, AdminSubTab } from './components/admin/SqlServerAdminView';
import { FormTemplatesModal, TemplateType } from './components/forms/FormTemplatesModal';
import { AssetProfileModal } from './components/assets/AssetProfileModal';
import { Asset } from './types';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Default active tab based on user role (RBAC permission)
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    currentUser.role === 'CBNV' ? 'MY_ASSETS' : 'DASHBOARD'
  );
  const [adminInitialSubTab, setAdminInitialSubTab] = useState<AdminSubTab>('SERVICE_EXPENSE_CATEGORIES');

  // Automatically enforce RBAC when switching users
  useEffect(() => {
    if (currentUser.role === 'CBNV') {
      const allowedForCBNV: ActiveTab[] = ['MY_ASSETS', 'REQUESTS', 'TICKETS'];
      if (!allowedForCBNV.includes(activeTab)) {
        setActiveTab('MY_ASSETS');
      }
    } else if (currentUser.role === 'THU_MUA') {
      const allowedForThuMua: ActiveTab[] = ['PURCHASE_ORDERS', 'SERVICE_EXPENSES', 'REPORTS', 'REQUESTS', 'MY_ASSETS', 'SQL_ADMIN'];
      if (!allowedForThuMua.includes(activeTab)) {
        setActiveTab('PURCHASE_ORDERS');
      }
    } else if (currentUser.role === 'KY_THUAT') {
      const allowedForKyThuat: ActiveTab[] = ['TICKETS', 'REPORTS', 'MY_ASSETS', 'REQUESTS'];
      if (!allowedForKyThuat.includes(activeTab)) {
        setActiveTab('TICKETS');
      }
    }
  }, [currentUser.employee_id, currentUser.role]);

  // Modals state
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState<TemplateType>('BIEN_BAN_BAN_GIAO');
  const [templateInitialData, setTemplateInitialData] = useState<any>(null);

  const [inspectingAsset, setInspectingAsset] = useState<Asset | null>(null);

  const handleOpenTemplates = (type: TemplateType = 'BIEN_BAN_BAN_GIAO', data?: any) => {
    setCurrentTemplateType(type);
    setTemplateInitialData(data || null);
    setIsTemplatesOpen(true);
  };

  const handleOpenAssetProfile = (asset: Asset) => {
    setInspectingAsset(asset);
  };

  const handleReportIssueWithAsset = (asset: Asset) => {
    setActiveTab('TICKETS');
  };

  // Dynamic mobile quick bottom nav items based on user's role
  const getMobileNavTabs = () => {
    switch (currentUser.role) {
      case 'CBNV':
        return [
          { id: 'MY_ASSETS' as ActiveTab, label: 'Tài sản', icon: User },
          { id: 'REQUESTS' as ActiveTab, label: 'Đề xuất', icon: FileCheck },
          { id: 'TICKETS' as ActiveTab, label: 'Sự cố IT', icon: Wrench },
        ];
      case 'THU_MUA':
        return [
          { id: 'PURCHASE_ORDERS' as ActiveTab, label: 'Gom PO', icon: ShoppingCart },
          { id: 'REQUESTS' as ActiveTab, label: 'Yêu cầu', icon: FileCheck },
          { id: 'REPORTS' as ActiveTab, label: 'Báo cáo', icon: BarChart3 },
        ];
      case 'KY_THUAT':
        return [
          { id: 'TICKETS' as ActiveTab, label: 'Sự cố IT', icon: Wrench },
          { id: 'REQUESTS' as ActiveTab, label: 'Đề xuất VT', icon: FileCheck },
          { id: 'MY_ASSETS' as ActiveTab, label: 'Tài sản', icon: User },
        ];
      default: // THU_KHO, QUAN_TRI, QUAN_LY
        return [
          { id: 'DASHBOARD' as ActiveTab, label: 'Tổng quan', icon: LayoutDashboard },
          { id: 'ASSETS' as ActiveTab, label: 'Kho vật tư', icon: Box },
          { id: 'REQUESTS' as ActiveTab, label: 'Cấp phát', icon: FileCheck },
          { id: 'PURCHASE_ORDERS' as ActiveTab, label: 'Gom PO', icon: ShoppingCart },
        ];
    }
  };

  const mobileNavTabs = getMobileNavTabs();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* THACO AGRI Top Header with Quick Test Switcher */}
      <Header
        onOpenTemplates={() => handleOpenTemplates('BIEN_BAN_BAN_GIAO')}
        onOpenSqlModal={() => setActiveTab('SQL_ADMIN')}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Container with Left Sidebar Navigation */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto border-x border-slate-200 bg-white shadow-xs">
        {/* Left Sidebar with Role-Based Menu Permissions */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenTemplates={() => handleOpenTemplates('BIEN_BAN_BAN_GIAO')}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Main Content Area with Adaptive Mobile Padding */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 bg-slate-50 min-w-0 overflow-y-auto pb-24 lg:pb-6">
          {activeTab === 'MY_ASSETS' && (
            <MyAssetsView
              onOpenAssetProfile={handleOpenAssetProfile}
              onOpenTemplates={handleOpenTemplates}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onReportIssueWithAsset={handleReportIssueWithAsset}
            />
          )}

          {activeTab === 'DASHBOARD' && (
            <WarehouseDashboard
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenAssetProfile={handleOpenAssetProfile}
            />
          )}

          {activeTab === 'ASSETS' && (
            <AssetManagementView
              onOpenAssetProfile={handleOpenAssetProfile}
              onOpenTemplates={handleOpenTemplates}
            />
          )}

          {activeTab === 'REQUESTS' && (
            <RequestsView
              onOpenTemplates={handleOpenTemplates}
              onOpenAssetProfile={handleOpenAssetProfile}
            />
          )}

          {activeTab === 'TICKETS' && (
            <TechnicalTicketsView
              onOpenTemplates={handleOpenTemplates}
              onOpenAssetProfile={handleOpenAssetProfile}
            />
          )}

          {activeTab === 'PURCHASE_ORDERS' && <PurchaseOrdersView />}

          {activeTab === 'SERVICE_EXPENSES' && (
            <ServiceExpensesView
              onOpenCategoryConfig={() => {
                setAdminInitialSubTab('SERVICE_EXPENSE_CATEGORIES');
                setActiveTab('SQL_ADMIN');
              }}
            />
          )}

          {activeTab === 'TRANSFERS' && (
            <TransfersView
              onOpenTemplates={handleOpenTemplates}
              onOpenAssetProfile={handleOpenAssetProfile}
            />
          )}

          {activeTab === 'REPORTS' && <ReportsView />}

          {activeTab === 'SQL_ADMIN' && (
            <SqlServerAdminView initialSubTab={adminInitialSubTab} />
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (App-like UX for smartphone & tablet) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
        {/* All menus button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer ${
            isMobileMenuOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMobileMenuOpen ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">Menu đầy đủ</span>
        </button>
      </nav>

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-800">THACO AGRI</span>
            <span>• Hệ thống Quản lý Tài sản, Dịch vụ Hoạt động & Thu mua (V_Update2310)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Database: Microsoft SQL Server 2022</span>
            <span>Node.js / Express REST API</span>
            <span>Menu phân quyền RBAC</span>
          </div>
        </div>
      </footer>

      {/* Form Templates Modal */}
      <FormTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        defaultTemplate={currentTemplateType}
        initialData={templateInitialData}
      />

      {/* Asset Profile & QR Modal */}
      <AssetProfileModal
        asset={inspectingAsset}
        isOpen={!!inspectingAsset}
        onClose={() => setInspectingAsset(null)}
        onOpenHandoverDoc={() => {
          if (inspectingAsset) {
            handleOpenTemplates('BIEN_BAN_BAN_GIAO', {
              assetCode: inspectingAsset.asset_code,
              serialNo: inspectingAsset.serial_no,
            });
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#16a34a', // Agri Emerald Green
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <AntApp>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AntApp>
    </ConfigProvider>
  );
}
