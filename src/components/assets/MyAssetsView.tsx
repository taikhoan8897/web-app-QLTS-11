import React from 'react';
import { 
  User, 
  Box, 
  QrCode, 
  Cpu, 
  Calendar, 
  Wrench, 
  FileText, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Asset } from '../../types';
import { formatVND, formatDateVN } from '../../utils/excelExporter';

interface MyAssetsViewProps {
  onOpenAssetProfile: (asset: Asset) => void;
  onOpenTemplates: (type: any, data?: any) => void;
  onNavigateToTab: (tab: any) => void;
  onReportIssueWithAsset: (asset: Asset) => void;
}

export const MyAssetsView: React.FC<MyAssetsViewProps> = ({
  onOpenAssetProfile,
  onOpenTemplates,
  onNavigateToTab,
  onReportIssueWithAsset,
}) => {
  const { currentUser, assets, categories, warehouses, units, requests, tickets } = useApp();

  // Find assets assigned to current employee
  const myHeldAssets = assets.filter(
    (a) => a.holder_employee_id === currentUser.employee_id
  );

  // Find requests created by current employee
  const myRequests = requests.filter(
    (r) => r.requester_id === currentUser.employee_id
  );

  // Find tickets created by current employee
  const myTickets = tickets.filter(
    (t) => t.reporter_id === currentUser.employee_id
  );

  const currentUnit = units.find((u) => u.unit_id === currentUser.unit_id);

  return (
    <div className="space-y-6">
      {/* Employee Personal Profile Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-emerald-900 flex items-center justify-center font-black text-2xl shadow-md border-2 border-emerald-400">
              {currentUser.full_name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{currentUser.full_name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-emerald-950">
                  {currentUser.role === 'CBNV' ? 'CÁN BỘ NHÂN VIÊN' : currentUser.role}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Mã NV: <span className="font-mono font-bold text-white">{currentUser.employee_code}</span> • Chức danh:{' '}
                <span className="font-medium text-white">{currentUser.position}</span>
              </p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Đơn vị chi trả lương: {currentUnit?.name} • Email: {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('REQUESTS')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo đề xuất cấp phát
            </button>
            <button
              onClick={() => onNavigateToTab('TICKETS')}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              Báo sự cố kỹ thuật
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Tài sản đang giữ</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{myHeldAssets.length}</div>
            <span className="text-[11px] text-emerald-700 font-semibold">Thiết bị định danh</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Box className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Đề xuất cấp phát</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{myRequests.length}</div>
            <span className="text-[11px] text-blue-700 font-semibold">
              {myRequests.filter((r) => r.status === 'CHO_TIEP_NHAN').length} đang chờ thủ kho duyệt
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Ticket sự cố kỹ thuật</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{myTickets.length}</div>
            <span className="text-[11px] text-purple-700 font-semibold">
              {myTickets.filter((t) => t.status !== 'HOAN_THANH').length} đang xử lý
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-700">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* My Assets List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Danh Sách Tài Sản & Thiết Bị Được Giao Cho Tôi Quản Lý
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu thông tin cấu hình, hạn bảo hành, số Serial và xuất biên bản bàn giao.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
            {myHeldAssets.length} thiết bị
          </span>
        </div>

        <div className="p-5">
          {myHeldAssets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Box className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-700 text-sm">Bạn chưa được bàn giao thiết bị nào.</p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-md mx-auto">
                  (Nếu bạn là nhân sự mới như <strong>Hoàng Minh Đức</strong>, hãy bấm nút bên dưới để tạo đề xuất cấp phát máy tính/đồng phục gửi Thủ kho).
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('REQUESTS')}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tạo đề xuất cấp phát máy tính / laptop mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myHeldAssets.map((ast) => {
                const cat = categories.find((c) => c.category_id === ast.category_id);
                const wh = warehouses.find((w) => w.warehouse_id === ast.warehouse_id);

                return (
                  <div
                    key={ast.asset_id}
                    className="p-5 bg-white border-2 border-emerald-100 hover:border-emerald-400 rounded-xl shadow-xs transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
                          <Cpu className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cat?.name}</h4>
                          <span className="font-mono text-xs text-emerald-800 font-bold">
                            {ast.asset_code}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Đang sử dụng
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số Serial:</span>
                        <span className="font-mono font-bold text-slate-800">{ast.serial_no}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Hạn bảo hành:</span>
                        <span className="font-medium text-slate-800">
                          {ast.warranty_to ? formatDateVN(ast.warranty_to).slice(0, 10) : '—'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Vị trí làm việc:</span>
                        <span className="font-medium text-slate-700">{ast.location}</span>
                      </div>
                      {ast.specifications && (
                        <div className="col-span-2 pt-1 border-t border-slate-200">
                          <span className="text-slate-400 block text-[11px]">Cấu hình:</span>
                          <span className="text-slate-600 line-clamp-1">{ast.specifications}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => onOpenAssetProfile(ast)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          Hồ sơ & QR
                        </button>
                        <button
                          onClick={() => {
                            onOpenTemplates('BIEN_BAN_BAN_GIAO', {
                              assetName: cat?.name,
                              assetCode: ast.asset_code,
                              serialNo: ast.serial_no,
                              recipientName: currentUser.full_name,
                              recipientCode: currentUser.employee_code,
                              departmentName: currentUser.department_id,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          Biên bản
                        </button>
                      </div>

                      <button
                        onClick={() => onReportIssueWithAsset(ast)}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Báo hỏng / sự cố kỹ thuật cho thiết bị này"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Báo sự cố
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
