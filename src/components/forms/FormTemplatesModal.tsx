import React, { useState } from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDateVN } from '../../utils/excelExporter';

export type TemplateType = 
  | 'BIEN_BAN_BAN_GIAO'
  | 'BIEN_BAN_THU_HOI'
  | 'PHIEU_DE_XUAT_CAP_PHAT'
  | 'TO_TRINH_SUA_CHUA'
  | 'BIEN_BAN_DIEU_CHUYEN'
  | 'BIEN_BAN_THANH_LY';

interface FormTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTemplate?: TemplateType;
  initialData?: any;
}

export const FormTemplatesModal: React.FC<FormTemplatesModalProps> = ({
  isOpen,
  onClose,
  defaultTemplate = 'BIEN_BAN_BAN_GIAO',
  initialData,
}) => {
  const { currentUser, units, warehouses, employees } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(defaultTemplate);

  if (!isOpen) return null;

  const currentUnit = units[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Biểu mẫu Nghiệp vụ Chuẩn - THACO AGRI</h3>
              <p className="text-xs text-emerald-200">Hỗ trợ in ấn, xem trước và xuất hồ sơ trình ký ngoài phần mềm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In biểu mẫu
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'BIEN_BAN_BAN_GIAO', label: '1. Biên bản bàn giao' },
            { id: 'BIEN_BAN_THU_HOI', label: '2. Biên bản thu hồi' },
            { id: 'PHIEU_DE_XUAT_CAP_PHAT', label: '3. Phiếu đề xuất cấp phát' },
            { id: 'TO_TRINH_SUA_CHUA', label: '4. Tờ trình sự cố/thay thế' },
            { id: 'BIEN_BAN_DIEU_CHUYEN', label: '5. Biên bản điều chuyển' },
            { id: 'BIEN_BAN_THANH_LY', label: '6. Biên bản thanh lý' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id as TemplateType)}
              className={`px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedTemplate === t.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Printable Paper Document Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div
            id="printable-form"
            className="w-full max-w-2xl bg-white p-10 shadow-md border border-slate-200 rounded-sm font-serif text-slate-800 leading-relaxed text-sm"
          >
            {/* National Header */}
            <div className="grid grid-cols-2 text-center text-xs pb-6 border-b border-slate-300">
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-900">
                  TỔNG CÔNG TY NÔNG NGHIỆP THACO
                </p>
                <p className="font-bold text-emerald-800">THACO AGRI</p>
                <p className="text-[11px] text-slate-500 italic">Số: ... /BB-AGRI-2026</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-900">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-slate-900">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-[11px] text-slate-500 italic mt-1">
                  Quảng Nam, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Template 1: Biên bản Bàn giao */}
            {selectedTemplate === 'BIEN_BAN_BAN_GIAO' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    BIÊN BẢN BÀN GIAO TÀI SẢN / THIẾT BỊ / VẬT TƯ
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Căn cứ theo quy trình Quản lý Tài sản và Yêu cầu cấp phát nội bộ THACO AGRI)
                  </p>
                </div>

                <p>
                  Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại văn phòng/kho THACO AGRI, chúng tôi gồm có:
                </p>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">I. ĐẠI DIỆN BÊN GIAO (BỘ PHẬN KHO / BÀN GIAO):</p>
                  <p>- Ông/Bà: <span className="font-semibold">{initialData?.senderName || currentUser.full_name}</span></p>
                  <p>- Chức vụ: Thủ kho / Quản lý thiết bị</p>
                  <p>- Đơn vị: {currentUnit.name}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">II. ĐẠI DIỆN BÊN NHẬN (CÁN BỘ NHÂN VIÊN / BỘ PHẬN):</p>
                  <p>- Ông/Bà: <span className="font-semibold">{initialData?.recipientName || 'Phạm Hồng Ánh'}</span></p>
                  <p>- Mã nhân viên: {initialData?.recipientCode || 'TG-10112'}</p>
                  <p>- Phòng ban: {initialData?.departmentName || 'Phòng Kế toán - Tài chính'}</p>
                  <p>- Đơn vị chi trả lương: {currentUnit.short_name}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 mb-2">III. NỘI DUNG BÀN GIAO:</p>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-700">
                        <th className="border border-slate-300 p-2 text-center w-8">STT</th>
                        <th className="border border-slate-300 p-2">Tên tài sản / Thiết bị</th>
                        <th className="border border-slate-300 p-2">Mã tài sản / QR</th>
                        <th className="border border-slate-300 p-2">Số Serial</th>
                        <th className="border border-slate-300 p-2 text-center">ĐVT</th>
                        <th className="border border-slate-300 p-2 text-center">SL</th>
                        <th className="border border-slate-300 p-2">Tình trạng thực tế</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">1</td>
                        <td className="border border-slate-300 p-2 font-medium">
                          {initialData?.assetName || 'Laptop Dell Latitude 5430 (i5/16GB/512GB)'}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px] text-emerald-800 font-bold">
                          {initialData?.assetCode || 'AGRI-LT-2026-0001'}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px]">
                          {initialData?.serialNo || 'DELL-LT-99214A'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">Máy</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">1</td>
                        <td className="border border-slate-300 p-2 text-slate-600">
                          {initialData?.condition || 'Mới 100%, hoạt động bình thường, kèm sạc zin & cặp xách'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-slate-600 italic space-y-1">
                  <p>- Bên nhận cam kết sử dụng tài sản đúng mục đích công việc, bảo quản đúng quy định kỹ thuật của THACO AGRI.</p>
                  <p>- Khi nghỉ việc hoặc chuyển công tác, bên nhận có trách nhiệm hoàn trả đầy đủ cho Bộ phận Quản lý Kho.</p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">NGƯỜI NHẬN</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{initialData?.recipientName || 'Phạm Hồng Ánh'}</p>
                  </div>
                  <div>
                    <p className="uppercase">NGƯỜI GIAO (THỦ KHO)</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{initialData?.senderName || currentUser.full_name}</p>
                  </div>
                  <div>
                    <p className="uppercase">PHÊ DUYỆT LÃNH ĐẠO</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký duyệt ngoài hệ thống)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Đặng Tuấn Kiệt</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 2: Biên bản Thu hồi */}
            {selectedTemplate === 'BIEN_BAN_THU_HOI' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    BIÊN BẢN THU HỒI TÀI SẢN VÀ THIẾT BỊ VỀ KHO
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Áp dụng khi điều chuyển nhân sự, thu hồi tài sản hỏng hoặc cấp phát mới)
                  </p>
                </div>

                <p>Căn cứ tình hình sử dụng thực tế và quyết định điều động/bảo trì của THACO AGRI:</p>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">I. THÔNG TIN BÊN TRẢ VÀ BÊN NHẬN THU HỒI:</p>
                  <p>- Người trả: <span className="font-semibold">{initialData?.returnerName || 'Phạm Hồng Ánh'}</span> (Mã: TG-10112)</p>
                  <p>- Người nhận thu hồi: <span className="font-semibold">{currentUser.full_name}</span> (Bộ phận Kho THACO AGRI)</p>
                  <p>- Lý do thu hồi: <span className="font-medium">{initialData?.reason || 'Chuyển công tác / Thu hồi thiết bị cũ hỏng'}</span></p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 mb-2">II. DANH SÁCH TÀI SẢN THU HỒI:</p>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-700">
                        <th className="border border-slate-300 p-2 text-center w-8">STT</th>
                        <th className="border border-slate-300 p-2">Tên tài sản</th>
                        <th className="border border-slate-300 p-2">Mã tài sản</th>
                        <th className="border border-slate-300 p-2">Số Serial</th>
                        <th className="border border-slate-300 p-2">Tình trạng khi thu hồi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">1</td>
                        <td className="border border-slate-300 p-2 font-medium">
                          {initialData?.assetName || 'Laptop Dell Latitude 5430'}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px] text-emerald-800 font-bold">
                          {initialData?.assetCode || 'AGRI-LT-2026-0001'}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px]">
                          {initialData?.serialNo || 'DELL-LT-99214A'}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-600">
                          {initialData?.condition || 'Máy trầy xước nhẹ vỏ ngoài, các chức năng hoạt động tốt'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">NGƯỜI TRẢ TÀI SẢN</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{initialData?.returnerName || 'Phạm Hồng Ánh'}</p>
                  </div>
                  <div>
                    <p className="uppercase">NGƯỜI NHẬN THU HỒI (THỦ KHO)</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{currentUser.full_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 3: Phiếu đề xuất cấp phát */}
            {selectedTemplate === 'PHIEU_DE_XUAT_CAP_PHAT' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    PHIẾU ĐỀ XUẤT CẤP PHÁT VẬT TƯ / THIẾT BỊ
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Biểu mẫu trình ký phê duyệt ngoài trước khi gửi vào hàng đợi Thủ kho)
                  </p>
                </div>

                <div className="space-y-2">
                  <p>- Kính gửi: Ban Giám Đốc / Trưởng bộ phận phụ trách THACO AGRI</p>
                  <p>- Người đề xuất: <span className="font-semibold">{initialData?.requesterName || currentUser.full_name}</span></p>
                  <p>- Phòng ban: {initialData?.department || 'Phòng Kế toán - Tài chính'}</p>
                  <p>- Mục đích sử dụng: <span className="font-medium">{initialData?.purpose || 'Cấp văn phòng phẩm & máy tính phục vụ công việc chuyên môn'}</span></p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 mb-2">DANH MỤC ĐỀ XUẤT CẤP PHÁT:</p>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-700">
                        <th className="border border-slate-300 p-2 text-center w-8">STT</th>
                        <th className="border border-slate-300 p-2">Tên vật tư / Thiết bị</th>
                        <th className="border border-slate-300 p-2 text-center">ĐVT</th>
                        <th className="border border-slate-300 p-2 text-center">Số lượng</th>
                        <th className="border border-slate-300 p-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">1</td>
                        <td className="border border-slate-300 p-2 font-medium">
                          {initialData?.itemName || 'Giấy in A4 IK Plus 70gsm'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">Ram</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">10</td>
                        <td className="border border-slate-300 p-2 text-slate-600">In báo cáo Q3 & Q4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">NGƯỜI ĐỀ NGHỊ</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{initialData?.requesterName || currentUser.full_name}</p>
                  </div>
                  <div>
                    <p className="uppercase">LÃNH ĐẠO ĐƠN VỊ DUYỆT</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký, đóng dấu duyệt)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Đặng Tuấn Kiệt</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 4: Tờ trình sự cố kỹ thuật */}
            {selectedTemplate === 'TO_TRINH_SUA_CHUA' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    TỜ TRÌNH ĐỀ XUẤT XỬ LÝ SỰ CỐ / SỬA CHỮA / THAY THẾ
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Hồ sơ kỹ thuật trình duyệt phương án ngoài phần mềm theo mục 5.3.2)
                  </p>
                </div>

                <div className="space-y-1">
                  <p>- Kính gửi: Giám đốc Khối Hỗ trợ Vận hành & Phòng CNTT</p>
                  <p>- Kỹ thuật viên phụ trách: <span className="font-semibold">{initialData?.technicianName || 'Lê Hoàng Nam'}</span></p>
                  <p>- Mã thiết bị sự cố: <span className="font-mono text-emerald-800 font-bold">{initialData?.assetCode || 'AGRI-PR-2026-0001'}</span></p>
                  <p>- Kết quả chẩn đoán: {initialData?.diagnosis || 'Hỏng cụm sấy và bánh cao su cuốn giấy bị mòn nghiêm trọng'}</p>
                  <p>- Phương án đề xuất: <span className="font-semibold text-emerald-800">{initialData?.solution || 'Sửa chữa và thay thế linh kiện (Cụm sấy + Hộp mực 12A)'}</span></p>
                </div>

                <div className="grid grid-cols-2 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">KỸ THUẬT VIÊN ĐỀ XUẤT</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Ký xác nhận kỹ thuật)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Lê Hoàng Nam</p>
                  </div>
                  <div>
                    <p className="uppercase">LÃNH ĐẠO PHÊ DUYỆT PHƯƠNG ÁN</p>
                    <p className="text-[11px] font-normal text-slate-500 italic mt-1">(Đồng ý phương án xử lý)</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Đặng Tuấn Kiệt</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 5: Biên bản Điều chuyển */}
            {selectedTemplate === 'BIEN_BAN_DIEU_CHUYEN' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    BIÊN BẢN ĐIỀU CHUYỂN TÀI SẢN NỘI BỘ
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Tự động thay đổi đơn vị sở hữu theo quy tắc quản lý kho khi nhập tại kho mới)
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                  <p>- Kho gửi (Bên giao): <span className="font-semibold">{warehouses[0]?.name}</span></p>
                  <p>- Kho nhận (Bên nhận): <span className="font-semibold">{warehouses[2]?.name || 'Kho Vật tư Gia Lai'}</span></p>
                  <p>- Lý do điều chuyển: Bổ sung trang thiết bị phục vụ mở rộng nông trường</p>
                </div>

                <div className="grid grid-cols-2 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">THỦ KHO XUẤT GỬI</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{currentUser.full_name}</p>
                  </div>
                  <div>
                    <p className="uppercase">THỦ KHO TIẾP NHẬN</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Thủ kho bên nhận</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 6: Biên bản Thanh lý */}
            {selectedTemplate === 'BIEN_BAN_THANH_LY' && (
              <div className="mt-6 space-y-4 font-sans text-xs">
                <div className="text-center my-6">
                  <h2 className="text-base font-bold uppercase text-slate-900">
                    BIÊN BẢN HỌP HỘI ĐỒNG THANH LÝ TÀI SẢN
                  </h2>
                  <p className="italic text-slate-600 text-xs mt-1">
                    (Chỉ áp dụng khi tài sản đã thu hồi về TRONG KHO và có quyết định thanh lý)
                  </p>
                </div>

                <div className="space-y-1">
                  <p>- Hội đồng gồm: Giám đốc, Kế toán trưởng, Thủ kho, Kỹ thuật viên</p>
                  <p>- Tài sản đề nghị thanh lý: <span className="font-semibold">{initialData?.assetName || 'Máy tính để bàn HP ProTower (Hư mainboard & hết khấu hao)'}</span></p>
                  <p>- Giá trị thu hồi dự kiến: <span className="font-bold text-emerald-800">{formatVND(1200000)}</span></p>
                </div>

                <div className="grid grid-cols-3 text-center pt-8 mt-6 font-semibold">
                  <div>
                    <p className="uppercase">THỦ KHO</p>
                    <div className="h-16"></div>
                    <p className="text-xs">{currentUser.full_name}</p>
                  </div>
                  <div>
                    <p className="uppercase">KẾ TOÁN TRƯỞNG</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Phạm Hồng Ánh</p>
                  </div>
                  <div>
                    <p className="uppercase">CHỦ TỊCH HỘI ĐỒNG</p>
                    <div className="h-16"></div>
                    <p className="text-xs">Đặng Tuấn Kiệt</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-t border-slate-200 text-xs">
          <span className="text-slate-500">
            Biểu mẫu đáp ứng yêu cầu phụ lục THACO AGRI (mục 5.2.3, 5.2.5, 5.3.1, 5.3.2).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
