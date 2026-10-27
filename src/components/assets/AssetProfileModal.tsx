import React from 'react';
import { 
  X, 
  QrCode, 
  Building2, 
  Warehouse, 
  User, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Cpu, 
  FileCheck2, 
  AlertTriangle,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { Asset, AssetEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDateVN } from '../../utils/excelExporter';

interface AssetProfileModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenHandoverDoc?: () => void;
}

export const AssetProfileModal: React.FC<AssetProfileModalProps> = ({
  asset,
  isOpen,
  onClose,
  onOpenHandoverDoc,
}) => {
  const { categories, units, warehouses, employees, assetEvents } = useApp();

  if (!isOpen || !asset) return null;

  const category = categories.find((c) => c.category_id === asset.category_id);
  const unit = units.find((u) => u.unit_id === asset.owning_unit_id);
  const warehouse = warehouses.find((w) => w.warehouse_id === asset.warehouse_id);
  const holder = employees.find((e) => e.employee_id === asset.holder_employee_id);
  const holderUnit = units.find((u) => u.unit_id === asset.holder_unit_snapshot);

  // Filter events for this specific asset and sort by occurred_at desc
  const events = assetEvents
    .filter((e) => e.asset_id === asset.asset_id)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'TRONG_KHO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Trong kho (Sẵn sàng)</span>;
      case 'DANG_SU_DUNG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Đang sử dụng</span>;
      case 'DANG_SUA_CHUA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Đang sửa chữa / bảo trì</span>;
      case 'DANG_DIEU_CHUYEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">Đang điều chuyển kho</span>;
      case 'DA_THANH_LY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">Đã thanh lý (Đóng)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getEventBadge = (type: AssetEvent['event_type']) => {
    switch (type) {
      case 'NHAP_KHO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Nhập kho</span>;
      case 'BAN_GIAO_CAP_PHAT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">Bàn giao cấp phát</span>;
      case 'SUA_CHUA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Sự cố / Sửa chữa</span>;
      case 'DIEU_CHUYEN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">Điều chuyển kho</span>;
      case 'THU_HOI':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">Thu hồi về kho</span>;
      case 'THANH_LY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">Thanh lý tài sản</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-mono text-emerald-400">{asset.asset_code}</h3>
                {getStatusBadge(asset.status)}
              </div>
              <p className="text-xs text-slate-300">
                Hồ sơ Vòng đời Tài sản (Asset Profile & Digital Passport) - THACO AGRI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Main Specs & QR Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            {/* Left QR Code representation */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="p-3 bg-white border-2 border-emerald-600 rounded-xl shadow-xs mb-2">
                {/* SVG QR Code Simulation */}
                <svg className="w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer markers */}
                  <rect x="5" y="5" width="28" height="28" fill="#007A3D" rx="2" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="1" />
                  <rect x="13" y="13" width="12" height="12" fill="#007A3D" />

                  <rect x="67" y="5" width="28" height="28" fill="#007A3D" rx="2" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="1" />
                  <rect x="75" y="13" width="12" height="12" fill="#007A3D" />

                  <rect x="5" y="67" width="28" height="28" fill="#007A3D" rx="2" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="1" />
                  <rect x="13" y="75" width="12" height="12" fill="#007A3D" />

                  {/* Matrix dots */}
                  <rect x="40" y="8" width="8" height="8" fill="#007A3D" />
                  <rect x="52" y="8" width="6" height="6" fill="#007A3D" />
                  <rect x="40" y="24" width="6" height="6" fill="#007A3D" />
                  <rect x="50" y="20" width="8" height="8" fill="#007A3D" />
                  <rect x="10" y="42" width="8" height="6" fill="#007A3D" />
                  <rect x="25" y="42" width="6" height="6" fill="#007A3D" />
                  <rect x="40" y="40" width="20" height="20" fill="#007A3D" rx="3" />
                  <circle cx="50" cy="50" r="5" fill="white" />
                  <rect x="68" y="42" width="8" height="8" fill="#007A3D" />
                  <rect x="82" y="42" width="6" height="8" fill="#007A3D" />
                  <rect x="42" y="68" width="8" height="6" fill="#007A3D" />
                  <rect x="54" y="68" width="6" height="8" fill="#007A3D" />
                  <rect x="68" y="68" width="10" height="6" fill="#007A3D" />
                  <rect x="82" y="76" width="8" height="8" fill="#007A3D" />
                  <rect x="42" y="82" width="14" height="8" fill="#007A3D" />
                  <rect x="68" y="82" width="6" height="8" fill="#007A3D" />
                </svg>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">{asset.qr_code}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Dán nhãn thiết bị & Quét nhanh</span>
              {onOpenHandoverDoc && (
                <button
                  onClick={onOpenHandoverDoc}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Biên bản bàn giao
                </button>
              )}
            </div>

            {/* Middle specs */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">{category?.name || 'Tài sản'}</h4>
                <p className="text-xs text-slate-500">
                  Nhóm: <span className="font-semibold text-slate-700">{category?.group}</span> • Loại theo dõi:{' '}
                  <span className="font-semibold text-emerald-700">Định danh vật lý (Serialized)</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Số Serial nhà sản xuất</span>
                  <span className="font-mono font-bold text-slate-900">{asset.serial_no || 'Chưa cập nhật'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Nguyên giá mua (từ PO)</span>
                  <span className="font-bold text-emerald-800">{formatVND(asset.purchase_cost)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Đơn vị sở hữu pháp nhân</span>
                  <span className="font-semibold text-slate-900">{unit?.short_name || unit?.name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Kho lưu trữ hiện tại</span>
                  <span className="font-semibold text-slate-900">{warehouse?.name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Người đang sử dụng</span>
                  <span className="font-bold text-blue-900">
                    {holder ? `${holder.full_name} (${holder.employee_code})` : '— Không có (Đang trong kho)'}
                  </span>
                  {holderUnit && (
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Đơn vị chi trả lương: {holderUnit.short_name}
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Thời hạn bảo hành</span>
                  <span className="font-medium text-slate-800">
                    {asset.warranty_to ? formatDateVN(asset.warranty_to).slice(0, 10) : 'Không có'}
                  </span>
                </div>
              </div>

              {asset.specifications && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Thông số kỹ thuật / Cấu hình:</span>
                  <p className="text-slate-700">{asset.specifications}</p>
                </div>
              )}

              {asset.location && (
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400">Vị trí lắp đặt / Ghi chú: </span>
                  <span className="font-medium">{asset.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline of Lifecycle Events (Bất biến theo mục 5.5.1 & 7.2) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-800" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Lịch sử Vòng đời Tài sản (Timeline Sự kiện Bất biến)
                </h4>
              </div>
              <span className="text-xs text-slate-500">{events.length} sự kiện được ghi nhận</span>
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có sự kiện nào được ghi nhận cho tài sản này.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-emerald-200 space-y-6">
                {events.map((evt, idx) => (
                  <div key={evt.event_id || idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-600 shadow-xs group-hover:scale-125 transition"></div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          {getEventBadge(evt.event_type)}
                          <span className="text-xs font-semibold text-slate-800">
                            {evt.performed_by}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDateVN(evt.occurred_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium mb-1">{evt.note || 'Thao tác nghiệp vụ'}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        {evt.before_status && evt.after_status && (
                          <span>
                            Trạng thái: <span className="font-semibold text-slate-700">{evt.before_status}</span> →{' '}
                            <span className="font-semibold text-emerald-700">{evt.after_status}</span>
                          </span>
                        )}
                        {evt.to_holder && (
                          <span>
                            Người nhận: <span className="font-semibold text-blue-700">{evt.to_holder}</span>
                          </span>
                        )}
                        {evt.source_id && (
                          <span>
                            Chứng từ liên kết: <span className="font-mono font-semibold text-slate-700">{evt.source_id}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-t border-slate-200 text-xs">
          <span className="text-slate-500 italic">
            Dữ liệu vòng đời được bảo toàn bất biến theo mục 4.1 & 4.3 của tài liệu phân tích.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
