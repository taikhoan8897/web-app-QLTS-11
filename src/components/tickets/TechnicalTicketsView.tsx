import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  FileCheck,
  Upload, 
  Cpu, 
  ArrowRight, 
  Download,
  Send,
  Eye,
  UserCheck,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportTicket, Asset, Category } from '../../types';
import { formatDateVN } from '../../utils/excelExporter';

interface TechnicalTicketsViewProps {
  onOpenTemplates: (type: any, data?: any) => void;
  onOpenAssetProfile: (asset: Asset) => void;
}

export const TechnicalTicketsView: React.FC<TechnicalTicketsViewProps> = ({
  onOpenTemplates,
  onOpenAssetProfile,
}) => {
  const { 
    currentUser, 
    tickets, 
    assets, 
    categories, 
    employees, 
    createTicket, 
    updateTicket,
    assignTicket, 
    completeTicketScenario,
    proposeTicketScenario,
    approveTicketProposal
  } = useApp();

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeScenarioModal, setActiveScenarioModal] = useState<
    'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI' | null
  >(null);

  // CBNV Approval Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalTicket, setApprovalTicket] = useState<SupportTicket | null>(null);
  const [approvalSignedFile, setApprovalSignedFile] = useState('');

  const isTechnician = currentUser.role === 'KY_THUAT' || currentUser.role === 'QUAN_TRI';

  // New / Edit Ticket Form State
  const [newIssueType, setNewIssueType] = useState<SupportTicket['issue_type']>('SU_CO_PHAN_CUNG');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('CAO');
  const [newAssetId, setNewAssetId] = useState<string>('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('');

  // Scenario 1: Sửa tại chỗ
  const [fixDiagnosis, setFixDiagnosis] = useState('');
  const [fixResolution, setFixResolution] = useState('');

  // Scenario 2 & 3: Sửa chữa thay thế / Thu hồi cấp mới
  const [advDiagnosis, setAdvDiagnosis] = useState('');
  const [advResolution, setAdvResolution] = useState('');
  const [advMaterials, setAdvMaterials] = useState<
    { category_id: string; qty: number; action_type: 'SUA_CHUA' | 'THAY_THE' | 'CAP_MOI'; note: string }[]
  >([{ category_id: 'CAT-08', qty: 1, action_type: 'THAY_THE', note: '' }]);
  const [advSignedFile, setAdvSignedFile] = useState('');

  // CBNV assets held (or all assets if editing a ticket for another reporter / technician)
  const targetReporterId = editingTicket ? editingTicket.reporter_id : currentUser.employee_id;
  const userHeldAssets = assets.filter(
    (a) =>
      a.holder_employee_id === targetReporterId ||
      (editingTicket && a.asset_id === editingTicket.asset_id) ||
      isTechnician
  );

  // Open New Ticket Modal
  const handleOpenNewTicket = () => {
    setEditingTicket(null);
    setNewIssueType('SU_CO_PHAN_CUNG');
    setNewDesc('');
    setNewPriority('CAO');
    setNewAssetId('');
    setNewAttachmentName('');
    setNewAssignedTo('EMP-003');
    setIsNewTicketOpen(true);
  };

  // Open Edit Ticket Modal
  const handleOpenEditTicket = (ticket: SupportTicket) => {
    setEditingTicket(ticket);
    setNewIssueType(ticket.issue_type);
    setNewDesc(ticket.description || '');
    setNewPriority(ticket.priority || 'CAO');
    setNewAssetId(ticket.asset_id || '');
    setNewAttachmentName(ticket.attachment_file?.file_name || '');
    setNewAssignedTo(ticket.assigned_to || 'EMP-003');
    setIsNewTicketOpen(true);
  };

  // Submit Create or Edit Ticket (Section 5.3.2)
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicket) {
      const res = updateTicket(editingTicket.ticket_id, {
        issue_type: newIssueType,
        description: newDesc,
        priority: newPriority,
        asset_id: newAssetId || null,
        attachment_name: newAttachmentName || '',
        assigned_to: (isTechnician && newAssignedTo ? newAssignedTo : editingTicket.assigned_to) || undefined,
      });
      if (res.success) {
        alert(res.message);
        setIsNewTicketOpen(false);
        setEditingTicket(null);
      }
      return;
    }

    const res = createTicket({
      issue_type: newIssueType,
      description: newDesc,
      priority: newPriority,
      asset_id: newAssetId || null,
      attachment_name: newAttachmentName || undefined,
    });
    if (res.success) {
      alert(res.message);
      setIsNewTicketOpen(false);
      setNewDesc('');
      setNewAssetId('');
      setNewAttachmentName('');
    }
  };

  // Open Scenario Processing Modal
  const handleOpenProcessModal = (
    ticket: SupportTicket,
    scenario: 'SUA_TAI_CHO' | 'SUA_CHUA_THAY_THE' | 'THU_HOI_CAP_MOI'
  ) => {
    setSelectedTicket(ticket);
    setActiveScenarioModal(scenario);

    if (scenario === 'SUA_TAI_CHO') {
      setFixDiagnosis(ticket.diagnosis || 'Kiểm tra phần mềm và kết nối mạng');
      setFixResolution(ticket.resolution || 'Khắc phục tại chỗ, cài lại driver / gỡ bỏ xung đột');
    } else if (scenario === 'SUA_CHUA_THAY_THE') {
      setAdvDiagnosis(ticket.diagnosis || 'Hỏng hóc linh kiện cơ khí / phần cứng máy');
      setAdvResolution(ticket.resolution || 'Đề xuất thay thế linh kiện mới tương thích');
      setAdvMaterials([{ category_id: 'CAT-08', qty: 1, action_type: 'THAY_THE', note: 'Linh kiện thay thế' }]);
      setAdvSignedFile(ticket.signed_proposal_file?.file_name || '');
    } else {
      // THU_HOI_CAP_MOI
      setAdvDiagnosis(ticket.diagnosis || 'Thiết bị hư hỏng nghiêm trọng, chi phí sửa chữa không hiệu quả');
      setAdvResolution(ticket.resolution || 'Đề xuất thu hồi thiết bị cũ và cấp mới máy thay thế');
      setAdvMaterials([{ category_id: 'CAT-01', qty: 1, action_type: 'CAP_MOI', note: 'Cấp máy mới thay thế' }]);
      setAdvSignedFile(ticket.signed_proposal_file?.file_name || '');
    }
  };

  // Submit Scenario 1
  const handleSubmitFixOnSite = () => {
    if (!selectedTicket) return;
    const res = completeTicketScenario(selectedTicket.ticket_id, 'SUA_TAI_CHO', {
      diagnosis: fixDiagnosis,
      resolution: fixResolution,
    });
    if (res.success) {
      alert(res.message);
      setActiveScenarioModal(null);
      setSelectedTicket(null);
    }
  };

  // Submit Scenario 2 or 3 (Kỹ thuật viên chỉ đề xuất phương án, không duyệt)
  const handleSubmitTechnicianProposal = () => {
    if (!selectedTicket || !activeScenarioModal) return;
    if (activeScenarioModal === 'SUA_TAI_CHO') return;

    const res = proposeTicketScenario(selectedTicket.ticket_id, activeScenarioModal, {
      diagnosis: advDiagnosis,
      resolution: advResolution,
      materials: advMaterials,
    });

    if (res.success) {
      alert(res.message);
      setActiveScenarioModal(null);
      setSelectedTicket(null);
    } else {
      alert(res.message);
    }
  };

  // Open CBNV Approval Modal
  const handleOpenCBNVApprovalModal = (ticket: SupportTicket) => {
    setApprovalTicket(ticket);
    setApprovalSignedFile(`To_trinh_phuong_an_${ticket.ticket_code}_signed.pdf`);
    setIsApprovalModalOpen(true);
  };

  // Submit CBNV Approval & Auto Requisition
  const handleSubmitCBNVApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTicket) return;
    if (!approvalSignedFile.trim()) {
      alert('Vui lòng đính kèm file tờ trình PDF/Scan đã được lãnh đạo phê duyệt ngoài hệ thống!');
      return;
    }

    const res = approveTicketProposal(approvalTicket.ticket_id, approvalSignedFile);
    if (res.success) {
      alert(res.message);
      setIsApprovalModalOpen(false);
      setApprovalTicket(null);
    } else {
      alert(res.message);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'MOI':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Mới tạo</span>;
      case 'DA_TIEP_NHAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Kỹ thuật tiếp nhận</span>;
      case 'DANG_XU_LY':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Đang chẩn đoán</span>;
      case 'CHO_HO_SO':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Chờ duyệt tờ trình</span>;
      case 'HOAN_THANH':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Hoàn thành</span>;
      case 'TU_CHOI':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">Từ chối</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getIssueTypeName = (t: SupportTicket['issue_type']) => {
    switch (t) {
      case 'SU_CO_PHAN_CUNG': return 'Sự cố phần cứng';
      case 'SU_CO_PHAN_MEM': return 'Sự cố phần mềm';
      case 'SU_CO_MANG_KET_NOI': return 'Mạng / Hệ thống';
      case 'HU_HONG_LINH_KIEN': return 'Hư hỏng linh kiện';
      case 'YEU_CAU_BAO_TRI': return 'Bảo trì định kỳ';
      default: return t;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
              Hỗ Trợ Kỹ Thuật IT & Bảo Trì Thiết Bị
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tiếp Nhận & Xử Lý Sự Cố Kỹ Thuật / Bảo Trì
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tiếp nhận báo hỏng, chẩn đoán và xử lý theo các phương án: sửa chữa tại chỗ, sửa chữa/thay thế linh kiện hoặc thu hồi cấp mới.
          </p>
        </div>

        <button
          onClick={handleOpenNewTicket}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Báo sự cố kỹ thuật mới
        </button>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã ticket</th>
                <th className="py-3 px-4">Người báo & Tài sản liên kết</th>
                <th className="py-3 px-4">Loại sự cố & Mô tả chi tiết</th>
                <th className="py-3 px-4">Kỹ thuật viên phụ trách</th>
                <th className="py-3 px-4">Phương án / Kết quả</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác & Xử lý kỹ thuật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không có ticket sự cố nào.
                  </td>
                </tr>
              ) : (
                tickets.map((tck, idx) => {
                  const reporter = employees.find((e) => e.employee_id === tck.reporter_id);
                  const linkedAsset = assets.find((a) => a.asset_id === tck.asset_id);
                  const assignee = employees.find((e) => e.employee_id === tck.assigned_to);

                  return (
                    <tr key={tck.ticket_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {tck.ticket_code}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {formatDateVN(tck.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{reporter?.full_name}</div>
                        {linkedAsset ? (
                          <button
                            onClick={() => onOpenAssetProfile(linkedAsset)}
                            className="text-[11px] font-mono text-emerald-800 hover:underline font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Cpu className="w-3 h-3 text-emerald-600" />
                            {linkedAsset.asset_code}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">— Không liên kết TS</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                          {getIssueTypeName(tck.issue_type)}
                        </span>
                        <p className="text-slate-700 line-clamp-2">{tck.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        {assignee ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {assignee.full_name}
                          </div>
                        ) : isTechnician ? (
                          <button
                            onClick={() => assignTicket(tck.ticket_id, currentUser.employee_id)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition cursor-pointer"
                          >
                            Tiếp nhận xử lý
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">— Chờ KTV tiếp nhận</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {tck.solution_scenario ? (
                          <div>
                            <span className="font-bold text-purple-900 block text-[11px]">
                              {tck.solution_scenario === 'SUA_TAI_CHO' && 'KB 1: Sửa tại chỗ'}
                              {tck.solution_scenario === 'SUA_CHUA_THAY_THE' && 'KB 2: Sửa chữa / Thay thế ngoài'}
                              {tck.solution_scenario === 'THU_HOI_CAP_MOI' && 'KB 3: Thu hồi cấp mới'}
                            </span>
                            <span className="text-[11px] text-slate-600 line-clamp-1">{tck.resolution}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chốt phương án</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(tck.status)}</td>

                      {/* ACTIONS: Sửa ticket + Xử lý kỹ thuật */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditTicket(tck)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Chỉnh sửa thông tin ticket sự cố đã tạo"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
                            Sửa
                          </button>

                          {isTechnician ? (
                            tck.status === 'HOAN_THANH' ? (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã đóng ticket
                              </span>
                            ) : tck.status === 'CHO_HO_SO' ? (
                              <div className="inline-flex items-center gap-1">
                                <span className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded font-semibold text-[10px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-600" />
                                  Đã đề xuất (Chờ CBNV trình ký)
                                </span>
                                <button
                                  onClick={() => handleOpenCBNVApprovalModal(tck)}
                                  className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[10px] transition cursor-pointer"
                                  title="Duyệt thay CBNV (Hỗ trợ kiểm thử)"
                                >
                                  Duyệt thay
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Kịch bản 1: Sửa tại chỗ */}
                                <button
                                  onClick={() => handleOpenProcessModal(tck, 'SUA_TAI_CHO')}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-[10px] transition cursor-pointer"
                                  title="Kịch bản 1: Khắc phục tại chỗ"
                                >
                                  Sửa tại chỗ
                                </button>

                                {/* Kịch bản 2: Sửa chữa thay thế */}
                                <button
                                  onClick={() => handleOpenProcessModal(tck, 'SUA_CHUA_THAY_THE')}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold text-[10px] transition cursor-pointer"
                                  title="Kịch bản 2: Đề xuất sửa chữa / thay thế linh kiện"
                                >
                                  Thay thế
                                </button>

                                {/* Kịch bản 3: Thu hồi cấp mới */}
                                <button
                                  onClick={() => handleOpenProcessModal(tck, 'THU_HOI_CAP_MOI')}
                                  className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold text-[10px] transition cursor-pointer"
                                  title="Kịch bản 3: Đề xuất thu hồi để cấp mới"
                                >
                                  Thu hồi cấp mới
                                </button>
                              </>
                            )
                          ) : (
                            /* Normal CBNV user view */
                            <>
                              {tck.status === 'MOI' && (
                                <span className="px-2 py-0.5 rounded text-amber-700 bg-amber-50 font-medium border border-amber-200 text-[11px]">
                                  Đang chờ KTV tiếp nhận
                                </span>
                              )}
                              {(tck.status === 'DA_TIEP_NHAN' || tck.status === 'DANG_XU_LY') && (
                                <span className="px-2 py-0.5 rounded text-blue-700 bg-blue-50 font-medium border border-blue-200 text-[11px]">
                                  KTV đang kiểm tra xử lý
                                </span>
                              )}
                              {tck.status === 'CHO_HO_SO' && (
                                <button
                                  onClick={() => handleOpenCBNVApprovalModal(tck)}
                                  className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                                  title="Đính kèm file PDF đã ký duyệt & tự động sinh yêu cầu cấp phát sang kho"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-purple-200" />
                                  <span>Trình ký & Phê duyệt phương án</span>
                                </button>
                              )}
                              {tck.status === 'HOAN_THANH' && (
                                <span className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 font-semibold border border-emerald-200 flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã hoàn thành
                                </span>
                              )}
                            </>
                          )}
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

      {/* --- MODAL 1: TẠO HOẶC CHỈNH SỬA TICKET SỰ CỐ (CBNV / KTV) --- */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  {editingTicket ? (
                    <>
                      <Edit3 className="w-4 h-4 text-amber-300" />
                      Chỉnh Sửa Ticket Sự Cố [{editingTicket.ticket_code}]
                    </>
                  ) : (
                    'Báo Cáo Sự Cố Kỹ Thuật IT / Bảo Trì'
                  )}
                </h3>
                <p className="text-xs text-purple-200">
                  {editingTicket
                    ? `Người báo: ${employees.find((e) => e.employee_id === editingTicket.reporter_id)?.full_name || editingTicket.reporter_id}`
                    : `Người báo: ${currentUser.full_name} (${currentUser.employee_code})`}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewTicketOpen(false);
                  setEditingTicket(null);
                }}
                className="text-purple-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại sự cố / Hư hỏng:</label>
                <select
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                >
                  <option value="SU_CO_PHAN_CUNG">Sự cố phần cứng (Màn hình, nguồn, bàn phím, kẹt giấy...)</option>
                  <option value="SU_CO_PHAN_MEM">Sự cố phần mềm (Lỗi Windows, Office, phần mềm ERP/Kế toán)</option>
                  <option value="SU_CO_MANG_KET_NOI">Mạng & Kết nối hệ thống (WiFi, mạng nội bộ, máy chủ)</option>
                  <option value="HU_HONG_LINH_KIEN">Hư hỏng linh kiện cần thay thế</option>
                  <option value="YEU_CAU_BAO_TRI">Yêu cầu bảo dưỡng / vệ sinh máy định kỳ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Liên kết tài sản đang sở hữu (Không bắt buộc):
                </label>
                <select
                  value={newAssetId}
                  onChange={(e) => setNewAssetId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono focus:outline-emerald-600"
                >
                  <option value="">— Không liên kết tài sản cụ thể —</option>
                  {userHeldAssets.map((ast) => (
                    <option key={ast.asset_id} value={ast.asset_id}>
                      {ast.asset_code} (SN: {ast.serial_no}) -{' '}
                      {categories.find((c) => c.category_id === ast.category_id)?.name}
                      {ast.brand ? ` [${ast.brand}${ast.model_name ? ` ${ast.model_name}` : ''}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="CAO">Ưu tiên cao</option>
                    <option value="KHAN_CAP">Khẩn cấp</option>
                    <option value="TRUNG_BINH">Bình thường</option>
                    <option value="THAP">Thấp</option>
                  </select>
                </div>

                {editingTicket && isTechnician && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kỹ thuật viên phụ trách:</label>
                    <select
                      value={newAssignedTo}
                      onChange={(e) => setNewAssignedTo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                    >
                      {employees
                        .filter((e) => e.role === 'KY_THUAT' || e.role === 'QUAN_TRI')
                        .map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name} ({emp.role})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả hiện tượng sự cố:</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ví dụ: Máy in Canon kêu to, kéo giấy bị lệch và kẹt giấy liên tục..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đính kèm ảnh hiện tượng / Lỗi:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="Hinh_anh_loi_thiet_bi.png"
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 font-mono focus:outline-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setNewAttachmentName(`Screenshot_Error_${Date.now().toString().slice(-4)}.png`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Mẫu ảnh
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewTicketOpen(false);
                    setEditingTicket(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-800 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingTicket ? 'Lưu cập nhật Ticket' : 'Gửi ticket cho Kỹ thuật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: XỬ LÝ KỊCH BẢN 1 - SỬA TẠI CHỖ (Mục 5.3.2 Bước 32) --- */}
      {activeScenarioModal === 'SUA_TAI_CHO' && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Kịch Bản 1: Khắc Phục & Sửa Chữa Tại Chỗ</h3>
              <button onClick={() => setActiveScenarioModal(null)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                Ticket mã: <strong>{selectedTicket.ticket_code}</strong> • Hiện tượng:{' '}
                {selectedTicket.description}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kết quả kiểm tra / Chẩn đoán:</label>
                <textarea
                  rows={2}
                  value={fixDiagnosis}
                  onChange={(e) => setFixDiagnosis(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biện pháp xử lý đã thực hiện:</label>
                <textarea
                  rows={2}
                  value={fixResolution}
                  onChange={(e) => setFixResolution(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveScenarioModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFixOnSite}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Hoàn thành xử lý tại chỗ & Đóng ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: XỬ LÝ KỊCH BẢN 2 & 3 (SỬA CHỮA THAY THẾ HOẶC THU HỒI CẤP MỚI) --- */}
      {(activeScenarioModal === 'SUA_CHUA_THAY_THE' || activeScenarioModal === 'THU_HOI_CAP_MOI') && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {activeScenarioModal === 'SUA_CHUA_THAY_THE'
                    ? 'Kịch Bản 2: Sửa Chữa & Thay Thế Linh Kiện Ngoài'
                    : 'Kịch Bản 3: Đánh Giá Thu Hồi Để Cấp Mới'}
                </h3>
                <p className="text-xs text-purple-200">Ticket mã: {selectedTicket.ticket_code}</p>
              </div>
              <button onClick={() => setActiveScenarioModal(null)} className="text-purple-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 leading-relaxed">
                Sau khi xuất tờ trình và đính kèm hồ sơ phê duyệt, hệ thống sẽ tự động tạo <strong>Đề xuất cấp phát</strong> gửi đến hàng đợi Thủ kho.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kết quả chẩn đoán kỹ thuật:</label>
                <textarea
                  rows={2}
                  value={advDiagnosis}
                  onChange={(e) => setAdvDiagnosis(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phương án kỹ thuật đề xuất:</label>
                <textarea
                  rows={2}
                  value={advResolution}
                  onChange={(e) => setAdvResolution(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              {/* Vật tư thay thế / Cấp mới */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">
                  {activeScenarioModal === 'SUA_CHUA_THAY_THE'
                    ? 'Linh kiện / Thiết bị cần thay thế:'
                    : 'Thiết bị mới cần cấp thay thế:'}
                </span>

                {advMaterials.map((mat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                    <select
                      value={mat.category_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdvMaterials((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, category_id: val } : m))
                        );
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-emerald-600 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name} - ĐVT: {c.unit_of_measure}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={mat.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAdvMaterials((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, qty: val } : m))
                        );
                      }}
                      className="w-20 bg-white border border-slate-200 rounded-lg p-1.5 text-center font-bold focus:outline-emerald-600"
                    />
                  </div>
                ))}
              </div>

              {/* Thông báo phân định vai trò & xuất tờ trình */}
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 leading-relaxed text-[11px] space-y-2">
                <p>
                  <strong>Quy định nghiệp vụ (Phân định vai trò):</strong> Kỹ thuật viên chỉ chẩn đoán và đề xuất danh mục vật tư cần thay thế/cấp mới. Sau khi gửi đề xuất, ticket chuyển sang trạng thái <strong>"Chờ duyệt tờ trình"</strong>. Cán bộ nhân viên tạo ticket sẽ tải tờ trình này, trình ký lãnh đạo ngoài hệ thống, đính kèm file PDF và duyệt phương án để tự động sinh yêu cầu cấp phát sang kho.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                  <span className="font-semibold text-blue-950">Xuất mẫu tờ trình kỹ thuật:</span>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTemplates('TO_TRINH_SUA_CHUA', {
                        technicianName: currentUser.full_name,
                        assetCode: selectedTicket.asset_id || 'AGRI-AST-2026',
                        diagnosis: advDiagnosis,
                        solution: advResolution,
                      });
                    }}
                    className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Xem / Xuất biểu mẫu tờ trình
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveScenarioModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSubmitTechnicianProposal}
                  className="px-5 py-2 bg-purple-800 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Gửi Đề Xuất Phương Án Kỹ Thuật (Chờ CBNV Ký Duyệt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CBNV ĐÍNH KÈM FILE PDF & DUYỆT PHƯƠNG ÁN KỸ THUẬT --- */}
      {isApprovalModalOpen && approvalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-300" />
                  Phê Duyệt Phương Án Kỹ Thuật Ticket {approvalTicket.ticket_code}
                </h3>
                <p className="text-xs text-purple-200">
                  Cán bộ nhân viên tạo ticket kiểm tra phương án, đính kèm file duyệt ngoài và kích hoạt cấp phát
                </p>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="text-purple-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCBNVApproval} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Proposed Solution Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    {approvalTicket.solution_scenario === 'THU_HOI_CAP_MOI'
                      ? 'Phương án: Thu hồi thiết bị cũ để cấp mới'
                      : 'Phương án: Sửa chữa thay thế linh kiện ngoài'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                    KTV đã đề xuất
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <p><strong>Chẩn đoán KTV:</strong> {approvalTicket.diagnosis || 'Không có ghi chú'}</p>
                  <p className="mt-1"><strong>Biện pháp xử lý:</strong> {approvalTicket.resolution || 'Không có ghi chú'}</p>
                </div>

                {approvalTicket.materials && approvalTicket.materials.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Danh mục vật tư / thiết bị KTV đề xuất:</span>
                    <ul className="space-y-1">
                      {approvalTicket.materials.map((m, idx) => {
                        const cat = categories.find((c) => c.category_id === m.category_id);
                        return (
                          <li key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]">
                            <span className="font-semibold text-slate-800">{cat?.name}</span>
                            <span className="font-mono font-bold text-purple-900">{m.qty} {cat?.unit_of_measure}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Step 1: Download form */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block">1. Biểu mẫu tờ trình đề xuất (In trình ký ngoài)</span>
                  <p className="text-[11px] text-emerald-800">Tải biểu mẫu đã điền sẵn để xin chữ ký lãnh đạo phê duyệt</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenTemplates('TO_TRINH_SUA_CHUA', {
                      technicianName: employees.find((e) => e.employee_id === approvalTicket.assigned_to)?.full_name || 'Kỹ thuật viên',
                      assetCode: approvalTicket.asset_id || 'AGRI-AST-2026',
                      diagnosis: approvalTicket.diagnosis,
                      solution: approvalTicket.resolution,
                    });
                  }}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xem / Tải tờ trình
                </button>
              </div>

              {/* Step 2: Upload signed PDF file */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  2. Đính kèm file tờ trình đã ký duyệt ngoài phần mềm (File mềm PDF/Scan - Bắt buộc):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={approvalSignedFile}
                    onChange={(e) => setApprovalSignedFile(e.target.value)}
                    placeholder="To_trinh_phuong_an_da_ky.pdf"
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs focus:outline-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setApprovalSignedFile(`To_trinh_phuong_an_${approvalTicket.ticket_code}_signed.pdf`)}
                    className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Mô phỏng đính kèm
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Khi đính kèm file duyệt và xác nhận, hệ thống sẽ tự động tạo Đề xuất cấp phát sang hàng đợi của Thủ kho.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-800 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác Nhận Duyệt & Tự Động Sinh Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
