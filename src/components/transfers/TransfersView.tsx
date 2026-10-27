import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Warehouse as WhIcon, 
  Building2, 
  FileText, 
  Send, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Transfer, Asset } from '../../types';
import { formatDateVN } from '../../utils/excelExporter';

interface TransfersViewProps {
  onOpenTemplates: (type: any, data?: any) => void;
  onOpenAssetProfile: (asset: Asset) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  onOpenTemplates,
  onOpenAssetProfile,
}) => {
  const { 
    transfers, 
    warehouses, 
    units, 
    assets, 
    categories, 
    selectedWarehouseId, 
    currentUser, 
    createTransfer, 
    confirmTransfer 
  } = useApp();

  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState('WH-03'); // Gia Lai
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [transferReason, setTransferReason] = useState(
    'Điều chuyển trang thiết bị văn phòng bổ sung cho Ban Cơ giới Nông trường Gia Lai'
  );

  const currentWh = warehouses.find((w) => w.warehouse_id === selectedWarehouseId);

  // Available assets in current warehouse ready for transfer (TRONG_KHO)
  const availableAssets = assets.filter(
    (a) => a.warehouse_id === selectedWarehouseId && a.status === 'TRONG_KHO'
  );

  // Submit Create Transfer (Kho gửi)
  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thiết bị trong kho để điều chuyển!');
      return;
    }
    const res = createTransfer(selectedWarehouseId, targetWarehouseId, selectedAssetIds, transferReason);
    if (res.success) {
      alert(res.message);
      setIsNewTransferOpen(false);
      setSelectedAssetIds([]);
    } else {
      alert(res.message);
    }
  };

  // Confirm Receive Transfer (Kho nhận)
  const handleConfirmReceive = (trf: Transfer) => {
    if (confirm(`Xác nhận nhập kho các thiết bị từ phiếu ${trf.code} vào kho của bạn? Đơn vị sở hữu của thiết bị sẽ tự động chuyển sang đơn vị mới theo quy tắc nguồn.`)) {
      const res = confirmTransfer(trf.transfer_id);
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
              Phân hệ Điều chuyển Tài sản Giữa Các Kho & Đơn vị (UI10 & Mục 6.7)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Quy Trình Điều Chuyển & Đổi Đơn Vị Sở Hữu Tự Động
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Theo nguyên tắc mục 4.1 & 6.7: Khi điều chuyển giữa các kho/đơn vị, việc Thủ kho bên nhận xác nhận
            nhập kho sẽ tự động thay đổi đơn vị sở hữu của tài sản sang đơn vị quản lý kho mới và ghi nhận 2 sự kiện timeline bất biến.
          </p>
        </div>

        <button
          onClick={() => setIsNewTransferOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo lệnh điều chuyển mới
        </button>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã điều chuyển</th>
                <th className="py-3 px-4">Kho xuất gửi (Bên giao)</th>
                <th className="py-3 px-4">Kho tiếp nhận (Bên nhận)</th>
                <th className="py-3 px-4">Thiết bị điều chuyển</th>
                <th className="py-3 px-4">Thời gian xuất / nhận</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác bên nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Chưa có lệnh điều chuyển kho nào.
                  </td>
                </tr>
              ) : (
                transfers.map((trf, idx) => {
                  const fromWh = warehouses.find((w) => w.warehouse_id === trf.from_warehouse_id);
                  const toWh = warehouses.find((w) => w.warehouse_id === trf.to_warehouse_id);
                  const fromUnit = units.find((u) => u.unit_id === fromWh?.owning_unit_id);
                  const toUnit = units.find((u) => u.unit_id === toWh?.owning_unit_id);
                  const isPending = trf.status === 'DANG_DIEU_CHUYEN';

                  return (
                    <tr key={trf.transfer_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{trf.code}</span>
                        <span className="text-[10px] text-slate-400">{trf.reason}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{fromWh?.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Đơn vị: {fromUnit?.short_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Xuất bởi: {trf.dispatched_by}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{toWh?.name}</div>
                        <div className="text-[11px] text-emerald-800 font-semibold">
                          Đơn vị sở hữu mới: {toUnit?.short_name}
                        </div>
                        {trf.received_by && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Nhận bởi: {trf.received_by}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {trf.lines.map((l) => {
                            const ast = assets.find((a) => a.asset_id === l.asset_id);
                            const cat = categories.find((c) => c.category_id === ast?.category_id);
                            return (
                              <div key={l.transfer_line_id} className="font-mono text-[11px]">
                                <span className="font-bold text-slate-800">{ast?.asset_code}</span> -{' '}
                                <span className="text-slate-600">{cat?.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <div>Xuất: {formatDateVN(trf.dispatched_at)}</div>
                        {trf.received_at && (
                          <div className="text-emerald-700 font-semibold mt-0.5">
                            Nhận: {formatDateVN(trf.received_at)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Đang điều chuyển
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đã hoàn thành điều chuyển
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleConfirmReceive(trf)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer"
                              title="Thủ kho nhận xác nhận nhập kho và đổi đơn vị sở hữu (mục 6.7)"
                            >
                              Xác nhận nhận thiết bị
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onOpenTemplates('BIEN_BAN_DIEU_CHUYEN', {
                                transferCode: trf.code,
                                fromWarehouse: fromWh?.name,
                                toWarehouse: toWh?.name,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            title="In biên bản điều chuyển nội bộ"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* --- MODAL: TẠO LỆNH ĐIỀU CHUYỂN MỚI --- */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Tạo Lệnh Điều Chuyển Kho Mới (Mục 6.7)</h3>
                <p className="text-xs text-emerald-200">Kho xuất: {currentWh?.name}</p>
              </div>
              <button onClick={() => setIsNewTransferOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn Kho đích tiếp nhận (Bên nhận):
                </label>
                <select
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-emerald-600"
                >
                  {warehouses
                    .filter((w) => w.warehouse_id !== selectedWarehouseId)
                    .map((w) => {
                      const u = units.find((un) => un.unit_id === w.owning_unit_id);
                      return (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          {w.name} (Đơn vị sở hữu: {u?.short_name})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chuyển:</label>
                <textarea
                  rows={2}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              {/* Chọn thiết bị trong kho xuất */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Chọn tài sản TRONG KHO để xuất điều chuyển ({availableAssets.length} sẵn sàng):
                </label>

                {availableAssets.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-lg">
                    Kho hiện tại không có tài sản nào ở trạng thái TRONG KHO để điều chuyển!
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 border border-slate-200 rounded-xl bg-slate-50">
                    {availableAssets.map((ast) => {
                      const cat = categories.find((c) => c.category_id === ast.category_id);
                      const isChecked = selectedAssetIds.includes(ast.asset_id);

                      return (
                        <label
                          key={ast.asset_id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds((prev) => [...prev, ast.asset_id]);
                              } else {
                                setSelectedAssetIds((prev) => prev.filter((id) => id !== ast.asset_id));
                              }
                            }}
                            className="accent-emerald-700"
                          />
                          <div className="font-mono text-[11px] leading-tight">
                            <span className="font-bold text-slate-900">{ast.asset_code}</span> -{' '}
                            <span className="text-slate-600">{cat?.name}</span> (SN: {ast.serial_no})
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTransferOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={availableAssets.length === 0}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  Xuất kho gửi điều chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
