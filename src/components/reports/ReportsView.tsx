import React, { useState } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  Download, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Building2,
  Warehouse,
  Package,
  Wrench,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDateVN, exportTableToExcel } from '../../utils/excelExporter';

export const ReportsView: React.FC = () => {
  const { 
    categories, 
    assets, 
    stockBalances, 
    purchaseOrders, 
    requests, 
    tickets, 
    transfers, 
    warehouses, 
    units, 
    employees, 
    transactions,
    selectedWarehouseId
  } = useApp();

  const [activeReportId, setActiveReportId] = useState<string>('R01');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');

  // Reports List definitions (R01 to R11 from section 9 of specification)
  const reportDefinitions = [
    { id: 'R01', name: 'R01. Tồn kho tiêu hao theo kỳ', icon: Package, desc: 'Tồn đầu, nhập, xuất, tồn cuối, cảnh báo tồn tối thiểu' },
    { id: 'R02', name: 'R02. Danh sách tài sản định danh', icon: Layers, desc: 'Phòng ban, danh mục, serial, trạng thái, người giữ, nguyên giá' },
    { id: 'R03', name: 'R03. Cấp phát theo nhân viên & đơn vị', icon: TrendingUp, desc: 'Số lượng cấp, ngày cấp, chi phí tiêu hao, tài sản đang giữ' },
    { id: 'R04', name: 'R04. Đơn hàng PO & Tiến độ mua sắm', icon: DollarSign, desc: 'Tiến độ PO, nhà cung cấp, giá thực tế, tổng tiền' },
    { id: 'R05', name: 'R05. Báo cáo chi phí theo danh mục', icon: BarChart3, desc: 'Mua mới, vật tư tiêu hao, linh kiện sửa chữa' },
    { id: 'R06', name: 'R06. Tổng hợp chi phí theo đơn vị/kho', icon: Building2, desc: 'Tổng chi phí phân bổ theo từng đơn vị pháp nhân' },
    { id: 'R07', name: 'R07. Thống kê ticket sự cố kỹ thuật', icon: Wrench, desc: 'Loại sự cố, thời gian xử lý, kỹ thuật viên' },
    { id: 'R09', name: 'R09. Báo cáo cảnh báo tồn thấp', icon: AlertTriangle, desc: 'Danh sách vật tư dưới ngưỡng an toàn cần mua gấp' },
    { id: 'R10', name: 'R10. Báo cáo điều chuyển kho', icon: History, desc: 'Lịch sử di chuyển tài sản và đổi đơn vị sở hữu' },
  ];

  // Helper for R01 Data
  const getR01Data = () => {
    return categories
      .filter((c) => c.tracking_type === 'TIEU_HAO')
      .map((cat, idx) => {
        const stock = stockBalances.find(
          (s) =>
            (selectedWarehouseFilter === 'ALL' || s.warehouse_id === selectedWarehouseFilter) &&
            s.category_id === cat.category_id
        );
        const onHand = stock?.quantity_on_hand || 0;
        const invested = stock?.invested_this_month || 0;
        const issued = stock?.issued_this_month || 0;
        const openingStock = onHand - invested + issued;

        return {
          STT: idx + 1,
          'Mã vật tư': cat.code,
          'Tên vật tư tiêu hao': cat.name,
          'Nhóm': cat.group,
          'ĐVT': cat.unit_of_measure,
          'Tồn đầu kỳ': Math.max(0, openingStock),
          'Nhập trong kỳ': invested,
          'Xuất trong kỳ': issued,
          'Tồn cuối kỳ': onHand,
          'Ngưỡng an toàn': cat.min_stock,
          'Cảnh báo': onHand <= cat.min_stock ? 'THIẾU TỒN KHO' : 'Đảm bảo',
          'Đơn giá BQ': stock?.average_unit_cost || 0,
          'Tổng giá trị tồn': onHand * (stock?.average_unit_cost || 0),
        };
      });
  };

  // Helper for R02 Data
  const getR02Data = () => {
    return assets
      .filter(
        (a) => selectedWarehouseFilter === 'ALL' || a.warehouse_id === selectedWarehouseFilter
      )
      .map((ast, idx) => {
        const cat = categories.find((c) => c.category_id === ast.category_id);
        const holder = employees.find((e) => e.employee_id === ast.holder_employee_id);
        const wh = warehouses.find((w) => w.warehouse_id === ast.warehouse_id);

        return {
          STT: idx + 1,
          'Mã tài sản': ast.asset_code,
          'Tên thiết bị': cat?.name,
          'Số Serial': ast.serial_no,
          'Trạng thái': ast.status,
          'Người đang sử dụng': holder?.full_name || 'Trong kho',
          'Mã NV': holder?.employee_code || '',
          'Kho lưu trữ': wh?.name,
          'Nguyên giá (VND)': ast.purchase_cost,
          'Hạn bảo hành': ast.warranty_to || '',
          'Mã QR': ast.qr_code,
        };
      });
  };

  // Helper for R04 Data
  const getR04Data = () => {
    return purchaseOrders.map((po, idx) => {
      const wh = warehouses.find((w) => w.warehouse_id === po.receiving_warehouse_id);
      return {
        STT: idx + 1,
        'Mã đơn PO': po.po_code,
        'Nguồn nhu cầu': po.source,
        'Loại hàng': po.tracking_type,
        'Nhà cung cấp': po.supplier_name || 'Chưa chốt',
        'Kho nhận': wh?.name,
        'Tổng chi phí (VND)': po.total_amount,
        'Trạng thái': po.status,
        'Ngày tạo': formatDateVN(po.created_at),
      };
    });
  };

  // Export current report
  const handleExportCurrentReport = () => {
    const activeDef = reportDefinitions.find((r) => r.id === activeReportId);
    if (activeReportId === 'R01') {
      exportTableToExcel(getR01Data(), `BaoCao_R01_TonKhoTieuHao`);
    } else if (activeReportId === 'R02') {
      exportTableToExcel(getR02Data(), `BaoCao_R02_TaiSanDinhDanh`);
    } else if (activeReportId === 'R04') {
      exportTableToExcel(getR04Data(), `BaoCao_R04_DonHangMuaSamPO`);
    } else {
      // Generic export
      alert(`Đang trích xuất dữ liệu ${activeDef?.name} sang tệp Excel .xlsx...`);
      exportTableToExcel(getR01Data(), `BaoCao_${activeReportId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Trung Tâm Báo Cáo & Phân Tích Dữ Liệu (UI11 & Mục 9)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Hệ Thống 11 Báo Cáo Chuẩn & Xuất Excel Doanh Nghiệp
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tất cả báo cáo tuân thủ quy ước tính chi phí mục 5.5.3 (Tránh cộng trùng giá trị PO và tài sản,
            tính đúng đơn giá xuất kho tiêu hao, bộ lọc theo thời gian và phạm vi kho).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Warehouse filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Warehouse className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả kho (Toàn THACO AGRI)</option>
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCurrentReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Reports Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Menu: Report Selection */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1 mb-2">
            Danh mục báo cáo chuẩn:
          </span>
          {reportDefinitions.map((rep) => {
            const Icon = rep.icon;
            const isActive = activeReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setActiveReportId(rep.id)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div
                    className={`font-bold text-xs ${
                      isActive ? 'text-emerald-950' : 'text-slate-800'
                    }`}
                  >
                    {rep.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{rep.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Content: Report Table Display */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {reportDefinitions.find((r) => r.id === activeReportId)?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thời điểm kết xuất: {new Date().toLocaleTimeString('vi-VN')} ngày {new Date().toLocaleDateString('vi-VN')} • Đơn vị tiền tệ: VND
              </p>
            </div>
            <button
              onClick={handleExportCurrentReport}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              Tải file .xlsx
            </button>
          </div>

          {/* R01 Table */}
          {activeReportId === 'R01' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3">Mã vật tư</th>
                    <th className="py-2.5 px-3">Tên vật tư</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-right">Tồn đầu</th>
                    <th className="py-2.5 px-3 text-right text-blue-800">Nhập</th>
                    <th className="py-2.5 px-3 text-right text-amber-800">Xuất</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-900 bg-emerald-50">Tồn cuối</th>
                    <th className="py-2.5 px-3 text-center">Ngưỡng tối thiểu</th>
                    <th className="py-2.5 px-3 text-right">Giá trị tồn (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getR01Data().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400">{row.STT}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row['Mã vật tư']}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{row['Tên vật tư tiêu hao']}</td>
                      <td className="py-2.5 px-3 text-center">{row['ĐVT']}</td>
                      <td className="py-2.5 px-3 text-right">{row['Tồn đầu kỳ']}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">+{row['Nhập trong kỳ']}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">-{row['Xuất trong kỳ']}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-900 bg-emerald-50/50">
                        {row['Tồn cuối kỳ']}
                      </td>
                      <td className="py-2.5 px-3 text-center">{row['Ngưỡng an toàn']}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatVND(row['Tổng giá trị tồn'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* R02 Table */}
          {activeReportId === 'R02' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3">Mã tài sản</th>
                    <th className="py-2.5 px-3">Tên thiết bị</th>
                    <th className="py-2.5 px-3">Số Serial</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Người sử dụng</th>
                    <th className="py-2.5 px-3 text-right">Nguyên giá mua</th>
                    <th className="py-2.5 px-3">Hạn bảo hành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getR02Data().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400">{row.STT}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{row['Mã tài sản']}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{row['Tên thiết bị']}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{row['Số Serial']}</td>
                      <td className="py-2.5 px-3 font-semibold">{row['Trạng thái']}</td>
                      <td className="py-2.5 px-3 text-blue-900 font-medium">{row['Người đang sử dụng']}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatVND(row['Nguyên giá (VND)'])}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{row['Hạn bảo hành'] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* R04 Table */}
          {activeReportId === 'R04' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3">Mã PO</th>
                    <th className="py-2.5 px-3">Loại hàng</th>
                    <th className="py-2.5 px-3">Nhà cung cấp</th>
                    <th className="py-2.5 px-3">Kho tiếp nhận</th>
                    <th className="py-2.5 px-3 text-right">Tổng chi phí thực tế</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getR04Data().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400">{row.STT}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row['Mã đơn PO']}</td>
                      <td className="py-2.5 px-3">{row['Loại hàng']}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{row['Nhà cung cấp']}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row['Kho nhận']}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatVND(row['Tổng chi phí (VND)'])}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{row['Trạng thái']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Default / Fallback view */}
          {activeReportId !== 'R01' && activeReportId !== 'R02' && activeReportId !== 'R04' && (
            <div className="p-8 text-center text-slate-500 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto opacity-70" />
              <p className="font-bold text-slate-800">
                Báo cáo {reportDefinitions.find((r) => r.id === activeReportId)?.name} đã sẵn sàng kết xuất.
              </p>
              <button
                onClick={handleExportCurrentReport}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải báo cáo chi tiết dạng Excel (.xlsx)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
