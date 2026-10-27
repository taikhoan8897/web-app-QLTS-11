import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Send,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Layers,
  Download,
  Boxes,
  Edit3,
  Save,
  UserCheck,
  Users,
  Laptop,
  Monitor,
  Cpu,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Request as AssetRequest,
  Category,
  Asset,
  UniformRecipientFormEntry,
  RequestFormMetadata,
} from '../../types';
import { formatDateVN } from '../../utils/excelExporter';
import {
  downloadVPPForm,
  downloadUniformForm,
  downloadComputerForm,
  downloadCNTTForm,
} from '../../utils/formTemplateExporter';

interface RequestsViewProps {
  onOpenTemplates: (type: any, data?: any) => void;
  onOpenAssetProfile: (asset: Asset) => void;
}

interface FormRequestLine {
  category_id: string;
  item_name: string;
  qty_requested: number;
  unit_of_measure: string;
  note: string;
  specifications?: string;
  recipient_name?: string;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  onOpenTemplates,
}) => {
  const {
    currentUser,
    requests,
    categories,
    assets,
    stockBalances,
    selectedWarehouseId,
    warehouses,
    employees,
    units,
    departments,
    createRequest,
    updateRequest,
    updateRequestStatus,
    issueRequestAllocation,
    addDemandFromRequest,
  } = useApp();

  const isWarehouseStaff =
    currentUser.role === 'THU_KHO' || currentUser.role === 'QUAN_TRI';

  const [activeTab, setActiveTab] = useState<'MY_REQUESTS' | 'WAREHOUSE_QUEUE'>(
    isWarehouseStaff ? 'WAREHOUSE_QUEUE' : 'MY_REQUESTS'
  );

  const [selectedReq, setSelectedReq] = useState<AssetRequest | null>(null);
  const [editingReq, setEditingReq] = useState<AssetRequest | null>(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isExportingFile, setIsExportingFile] = useState(false);

  const currentUserDept =
    departments.find((d) => d.department_id === currentUser.department_id)?.name ||
    currentUser.department_id;
  const currentUserUnit =
    units.find((u) => u.unit_id === currentUser.unit_id)?.name ||
    'Tổng Công ty Nông nghiệp THACO (THACO AGRI)';

  // Common form states
  const [newReqType, setNewReqType] =
    useState<AssetRequest['request_type']>('CAP_VAN_PHONG_PHAM');
  const [newPurpose, setNewPurpose] = useState('');
  const [newPriority, setNewPriority] =
    useState<AssetRequest['priority']>('TRUNG_BINH');

  // Common requester info
  const [requesterName, setRequesterName] = useState(currentUser.full_name);
  const [requesterPosition, setRequesterPosition] = useState(currentUser.position);
  const [requesterDepartment, setRequesterDepartment] = useState(currentUserDept);
  const [requesterUnit, setRequesterUnit] = useState(currentUserUnit);

  // VPP & CNTT item lines
  const [newLines, setNewLines] = useState<FormRequestLine[]>([
    {
      category_id: '',
      item_name: '',
      qty_requested: 1,
      unit_of_measure: '',
      note: '',
      specifications: '',
      recipient_name: '',
    },
  ]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(
    null
  );

  // Đồng phục: Multiple recipients, each with uniform items
  const [uniformRecipients, setUniformRecipients] = useState<
    UniformRecipientFormEntry[]
  >([
    {
      full_name: '',
      gender: 'Nam',
      position: '',
      items: [
        {
          category_id: 'CAT-10',
          item_name: 'Áo sơ mi đồng phục nam/nữ THACO AGRI',
          unit_of_measure: 'Cái',
          qty: 2,
          note: '',
        },
      ],
    },
  ]);

  // Máy tính / Laptop
  const [computerType, setComputerType] = useState<'DESKTOP' | 'LAPTOP'>('LAPTOP');
  const [mtBlockName, setMtBlockName] = useState('Khối Nghiệp vụ Quản trị');
  const [mtUserFullName, setMtUserFullName] = useState('');
  const [mtUserPosition, setMtUserPosition] = useState('');
  const [mtUserDepartment, setMtUserDepartment] = useState(currentUserDept);
  const [mtUserSection, setMtUserSection] = useState('');
  const [mtStartDate, setMtStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Thiết bị CNTT
  const [cnttResponsiblePerson, setCnttResponsiblePerson] = useState('');

  const [attachedFileName, setAttachedFileName] = useState('');

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Allocation modal states
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = useState(false);
  const [allocState, setAllocState] = useState<{
    [lineId: string]: {
      selectedAssetIds: string[];
      consumableQty: number;
    };
  }>({});

  const currentWh = warehouses.find(
    (w) => w.warehouse_id === selectedWarehouseId
  );

  // Filtered categories per request type
  const vppCategories = categories.filter(
    (c) =>
      c.group === 'Văn phòng phẩm & vật tư' &&
      !c.code.includes('DONG-PHUC') &&
      !c.name.toLowerCase().includes('đồng phục') &&
      !c.name.toLowerCase().includes('bảo hộ lao động')
  );

  const uniformCategories = categories.filter(
    (c) =>
      c.code.includes('DONG-PHUC') ||
      c.name.toLowerCase().includes('đồng phục') ||
      c.name.toLowerCase().includes('bảo hộ lao động') ||
      c.name.toLowerCase().includes('áo sơ mi') ||
      c.name.toLowerCase().includes('áo khoác')
  );

  const cnttCategories = categories.filter(
    (c) =>
      c.group === 'Thiết bị tin học' ||
      c.group === 'Thiết bị điện tử văn phòng'
  );

  // Filter requests
  const myRequests = requests.filter(
    (r) => r.requester_id === currentUser.employee_id
  );
  const warehouseQueueRequests = requests.filter((r) => r.status !== 'HUY');

  // Helper: Get displayed person name & role label in software table based on request_type
  const getDisplayedPersonForRequest = (req: AssetRequest) => {
    const requester = employees.find((e) => e.employee_id === req.requester_id);
    const requesterDeptName =
      departments.find((d) => d.department_id === requester?.department_id)
        ?.name ||
      requester?.department_id ||
      '';

    if (req.request_type === 'CAP_VAN_PHONG_PHAM') {
      const name =
        req.form_metadata?.requester_name ||
        requester?.full_name ||
        req.target_recipient_name ||
        'CBNV';
      const pos =
        req.form_metadata?.requester_position || requester?.position || '';
      const dept =
        req.form_metadata?.requester_department || requesterDeptName;
      return {
        roleLabel: 'Người đề xuất',
        displayName: name,
        subText: [pos, dept].filter(Boolean).join(' • '),
        createdByNote: null,
      };
    }

    if (req.request_type === 'CAP_DONG_PHUC') {
      const recipients = req.form_metadata?.uniform_recipients || [];
      const recipientNames =
        recipients.length > 0
          ? recipients.map((r) => r.full_name).filter(Boolean).join(', ')
          : req.target_recipient_name || requester?.full_name || 'Người nhận';
      const positions =
        recipients.length > 0
          ? recipients.map((r) => r.position).filter(Boolean).join(', ')
          : requester?.position || '';
      return {
        roleLabel: 'Người nhận đồng phục',
        displayName: recipientNames,
        subText: positions || requesterDeptName,
        createdByNote: `Người đề xuất: ${req.form_metadata?.requester_name || requester?.full_name || ''}`,
      };
    }

    if (req.request_type === 'CAP_MAY_TINH_LAPTOP') {
      const userName =
        req.form_metadata?.user_full_name ||
        req.target_recipient_name ||
        requester?.full_name ||
        'Người sử dụng';
      const userPos =
        req.form_metadata?.user_position || requester?.position || '';
      const userDept =
        req.form_metadata?.user_department || requesterDeptName;
      return {
        roleLabel: 'Người sử dụng',
        displayName: userName,
        subText: [userPos, userDept].filter(Boolean).join(' • '),
        createdByNote: `Người đề nghị: ${req.form_metadata?.requester_name || requester?.full_name || ''}`,
      };
    }

    const respPerson =
      req.form_metadata?.responsible_person ||
      req.target_recipient_name ||
      req.lines[0]?.recipient_name ||
      requester?.full_name ||
      'Người chịu trách nhiệm';
    return {
      roleLabel: 'Người chịu trách nhiệm',
      displayName: respPerson,
      subText:
        req.form_metadata?.requester_position ||
        [requester?.position, requesterDeptName].filter(Boolean).join(' • '),
      createdByNote: `Người đề xuất: ${req.form_metadata?.requester_name || requester?.full_name || ''}`,
    };
  };

  // Reset form for a given request type
  const resetFormForType = (type: AssetRequest['request_type']) => {
    setNewReqType(type);
    setRequesterName(currentUser.full_name);
    setRequesterPosition(currentUser.position);
    setRequesterDepartment(currentUserDept);
    setRequesterUnit(currentUserUnit);
    setActiveSuggestionIdx(null);

    if (type === 'CAP_VAN_PHONG_PHAM') {
      setNewLines([
        {
          category_id: '',
          item_name: '',
          qty_requested: 1,
          unit_of_measure: '',
          note: '',
        },
      ]);
    } else if (type === 'CAP_DONG_PHUC') {
      setUniformRecipients([
        {
          full_name: '',
          gender: 'Nam',
          position: '',
          items: [
            {
              category_id: 'CAT-10',
              item_name: 'Áo sơ mi đồng phục nam/nữ THACO AGRI',
              unit_of_measure: 'Cái',
              qty: 2,
              note: '',
            },
          ],
        },
      ]);
    } else if (type === 'CAP_MAY_TINH_LAPTOP') {
      setComputerType('LAPTOP');
      setMtBlockName('Khối Nghiệp vụ Quản trị');
      setMtUserFullName('');
      setMtUserPosition('');
      setMtUserDepartment(currentUserDept);
      setMtUserSection('');
      setMtStartDate(new Date().toISOString().slice(0, 10));
    } else if (type === 'CAP_THIET_BI_CNTT') {
      setCnttResponsiblePerson('');
      setNewLines([
        {
          category_id: '',
          item_name: '',
          qty_requested: 1,
          unit_of_measure: '',
          note: '',
          specifications: '',
          recipient_name: '',
        },
      ]);
    }
  };

  // Open Create New Request
  const handleOpenNewRequest = () => {
    setEditingReq(null);
    setNewPurpose('');
    setNewPriority('TRUNG_BINH');
    setAttachedFileName('');
    resetFormForType('CAP_VAN_PHONG_PHAM');
    setIsNewRequestOpen(true);
  };

  // Open Edit Request
  const handleOpenEditRequest = (req: AssetRequest) => {
    setEditingReq(req);
    setNewReqType(req.request_type);
    setNewPurpose(req.purpose || '');
    setNewPriority(req.priority || 'TRUNG_BINH');
    setAttachedFileName(req.attachment_file?.file_name || '');

    const reqEmp = employees.find((e) => e.employee_id === req.requester_id);
    const reqDept =
      departments.find((d) => d.department_id === reqEmp?.department_id)?.name ||
      reqEmp?.department_id ||
      currentUserDept;
    const reqUnit =
      units.find((u) => u.unit_id === req.unit_id)?.name || currentUserUnit;

    const meta = req.form_metadata;
    setRequesterName(meta?.requester_name || reqEmp?.full_name || currentUser.full_name);
    setRequesterPosition(meta?.requester_position || reqEmp?.position || currentUser.position);
    setRequesterDepartment(meta?.requester_department || reqDept);
    setRequesterUnit(meta?.requester_unit || reqUnit);

    if (req.request_type === 'CAP_DONG_PHUC') {
      if (meta?.uniform_recipients && meta.uniform_recipients.length > 0) {
        setUniformRecipients(meta.uniform_recipients);
      } else {
        setUniformRecipients([
          {
            full_name: req.target_recipient_name || reqEmp?.full_name || '',
            gender: 'Nam',
            position: reqEmp?.position || '',
            items: req.lines.map((l) => {
              const cat = categories.find((c) => c.category_id === l.category_id);
              return {
                category_id: l.category_id,
                item_name: cat?.name || l.note || 'Áo sơ mi đồng phục',
                unit_of_measure: cat?.unit_of_measure || 'Cái',
                qty: l.qty_requested,
                note: l.note || '',
              };
            }),
          },
        ]);
      }
    } else if (req.request_type === 'CAP_MAY_TINH_LAPTOP') {
      const hasPC = req.lines.some((l) => l.category_id === 'CAT-02');
      setComputerType(meta?.computer_type || (hasPC ? 'DESKTOP' : 'LAPTOP'));
      setMtBlockName(meta?.block_name || 'Khối Nghiệp vụ Quản trị');
      setMtUserFullName(
        meta?.user_full_name || req.target_recipient_name || reqEmp?.full_name || ''
      );
      setMtUserPosition(meta?.user_position || reqEmp?.position || '');
      setMtUserDepartment(meta?.user_department || reqDept);
      setMtUserSection(meta?.user_section || '');
      setMtStartDate(meta?.start_date || new Date().toISOString().slice(0, 10));
    } else {
      setCnttResponsiblePerson(
        meta?.responsible_person ||
          req.target_recipient_name ||
          req.lines[0]?.recipient_name ||
          ''
      );
      if (req.lines && req.lines.length > 0) {
        setNewLines(
          req.lines.map((l) => {
            const cat = categories.find((c) => c.category_id === l.category_id);
            return {
              category_id: l.category_id,
              item_name: cat?.name || l.note || 'Vật tư',
              qty_requested: l.qty_requested,
              unit_of_measure: cat?.unit_of_measure || '',
              note: l.note || '',
              specifications: l.specifications || cat?.description || '',
              recipient_name:
                l.recipient_name ||
                meta?.responsible_person ||
                req.target_recipient_name ||
                '',
            };
          })
        );
      } else {
        setNewLines([
          {
            category_id: '',
            item_name: '',
            qty_requested: 1,
            unit_of_measure: '',
            note: '',
            specifications: '',
            recipient_name: '',
          },
        ]);
      }
    }

    setIsNewRequestOpen(true);
  };

  // Add/Remove line for VPP & CNTT
  const handleAddLine = () => {
    setNewLines((prev) => [
      ...prev,
      {
        category_id: '',
        item_name: '',
        qty_requested: 1,
        unit_of_measure: '',
        note: '',
        specifications: '',
        recipient_name: cnttResponsiblePerson || '',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (newLines.length > 1) {
      setNewLines((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSelectCategory = (lineIdx: number, cat: Category) => {
    setNewLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx
          ? {
              ...l,
              category_id: cat.category_id,
              item_name: cat.name,
              unit_of_measure: cat.unit_of_measure,
              specifications:
                l.specifications ||
                cat.brand_configs?.[0]?.specifications ||
                cat.description ||
                '',
            }
          : l
      )
    );
    setActiveSuggestionIdx(null);
  };

  // Add/Remove Recipient & Item for Đồng phục
  const handleAddUniformRecipient = () => {
    setUniformRecipients((prev) => [
      ...prev,
      {
        full_name: '',
        gender: 'Nam',
        position: '',
        items: [
          {
            category_id: 'CAT-10',
            item_name: 'Áo sơ mi đồng phục nam/nữ THACO AGRI',
            unit_of_measure: 'Cái',
            qty: 2,
            note: '',
          },
        ],
      },
    ]);
  };

  const handleRemoveUniformRecipient = (rIdx: number) => {
    if (uniformRecipients.length > 1) {
      setUniformRecipients((prev) => prev.filter((_, i) => i !== rIdx));
    }
  };

  const handleAddUniformItemForRecipient = (rIdx: number) => {
    setUniformRecipients((prev) =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              items: [
                ...r.items,
                {
                  category_id: 'CAT-13',
                  item_name: 'Áo khoác đồng phục THACO AGRI',
                  unit_of_measure: 'Cái',
                  qty: 1,
                  note: '',
                },
              ],
            }
          : r
      )
    );
  };

  const handleRemoveUniformItemForRecipient = (rIdx: number, iIdx: number) => {
    setUniformRecipients((prev) =>
      prev.map((r, i) =>
        i === rIdx && r.items.length > 1
          ? {
              ...r,
              items: r.items.filter((_, idx) => idx !== iIdx),
            }
          : r
      )
    );
  };

  // Build payload (lines, target_recipient_name, purpose, form_metadata) from current form state
  const buildRequestSubmissionPayload = (): {
    valid: boolean;
    errorMessage?: string;
    purpose: string;
    target_recipient_name: string;
    lines: {
      category_id: string;
      qty_requested: number;
      note?: string;
      recipient_name?: string;
      specifications?: string;
    }[];
    form_metadata: RequestFormMetadata;
  } => {
    if (newReqType === 'CAP_VAN_PHONG_PHAM') {
      if (!newPurpose.trim()) {
        return {
          valid: false,
          errorMessage: 'Vui lòng nhập mục đích đề xuất cấp văn phòng phẩm!',
          purpose: '',
          target_recipient_name: '',
          lines: [],
          form_metadata: {},
        };
      }
      for (let i = 0; i < newLines.length; i++) {
        if (!newLines[i].item_name.trim()) {
          return {
            valid: false,
            errorMessage: `Vui lòng chọn hoặc nhập tên mặt hàng văn phòng phẩm ở dòng #${i + 1}!`,
            purpose: '',
            target_recipient_name: '',
            lines: [],
            form_metadata: {},
          };
        }
      }

      const lines = newLines.map((l) => {
        const matchedCat =
          categories.find((c) => c.category_id === l.category_id) ||
          vppCategories.find((c) =>
            c.name.toLowerCase().includes(l.item_name.toLowerCase())
          ) ||
          vppCategories[0] ||
          categories[0];
        return {
          category_id: matchedCat?.category_id || 'CAT-07',
          qty_requested: Math.max(1, l.qty_requested),
          note: l.note || l.item_name,
        };
      });

      return {
        valid: true,
        purpose: newPurpose.trim(),
        target_recipient_name: requesterName.trim() || currentUser.full_name,
        lines,
        form_metadata: {
          requester_name: requesterName.trim() || currentUser.full_name,
          requester_position: requesterPosition.trim() || currentUser.position,
          requester_department: requesterDepartment.trim() || currentUserDept,
          purpose: newPurpose.trim(),
        },
      };
    }

    if (newReqType === 'CAP_DONG_PHUC') {
      for (let i = 0; i < uniformRecipients.length; i++) {
        const rec = uniformRecipients[i];
        if (!rec.full_name.trim()) {
          return {
            valid: false,
            errorMessage: `Vui lòng nhập họ tên người nhận đồng phục thứ #${i + 1}!`,
            purpose: '',
            target_recipient_name: '',
            lines: [],
            form_metadata: {},
          };
        }
        if (!rec.items || rec.items.length === 0) {
          return {
            valid: false,
            errorMessage: `Vui lòng thêm ít nhất 1 mặt hàng đồng phục cho người nhận "${rec.full_name}"!`,
            purpose: '',
            target_recipient_name: '',
            lines: [],
            form_metadata: {},
          };
        }
      }

      const aggregatedMap: Record<
        string,
        { category_id: string; qty: number; notes: string[]; recipients: string[] }
      > = {};

      uniformRecipients.forEach((rec) => {
        rec.items.forEach((it) => {
          const matchedCat =
            categories.find((c) => c.category_id === it.category_id) ||
            uniformCategories.find((c) =>
              c.name.toLowerCase().includes(it.item_name.toLowerCase())
            ) ||
            uniformCategories[0] ||
            categories[0];
          const catId = matchedCat?.category_id || 'CAT-10';
          if (!aggregatedMap[catId]) {
            aggregatedMap[catId] = {
              category_id: catId,
              qty: 0,
              notes: [],
              recipients: [],
            };
          }
          aggregatedMap[catId].qty += Math.max(1, Number(it.qty) || 1);
          aggregatedMap[catId].recipients.push(rec.full_name);
          aggregatedMap[catId].notes.push(
            `${rec.full_name} (${rec.gender}${rec.position ? ` - ${rec.position}` : ''}): ${it.qty} ${it.unit_of_measure || 'Cái'}${it.note ? ` [${it.note}]` : ''}`
          );
        });
      });

      const lines = Object.values(aggregatedMap).map((entry) => ({
        category_id: entry.category_id,
        qty_requested: entry.qty,
        recipient_name: Array.from(new Set(entry.recipients)).join(', '),
        note: entry.notes.join('; '),
      }));

      const recipientNames = uniformRecipients
        .map((r) => r.full_name.trim())
        .filter(Boolean)
        .join(', ');

      return {
        valid: true,
        purpose:
          newPurpose.trim() ||
          `Đề xuất cấp đồng phục theo định mức cho: ${recipientNames}`,
        target_recipient_name: recipientNames,
        lines,
        form_metadata: {
          requester_name: requesterName.trim() || currentUser.full_name,
          requester_unit: requesterUnit.trim() || currentUserUnit,
          requester_department: requesterDepartment.trim() || currentUserDept,
          requester_position: requesterPosition.trim() || currentUser.position,
          uniform_recipients: uniformRecipients,
          purpose:
            newPurpose.trim() ||
            `Đề xuất cấp đồng phục theo định mức cho: ${recipientNames}`,
        },
      };
    }

    if (newReqType === 'CAP_MAY_TINH_LAPTOP') {
      if (!mtUserFullName.trim()) {
        return {
          valid: false,
          errorMessage: 'Vui lòng nhập họ và tên người sử dụng máy tính / laptop!',
          purpose: '',
          target_recipient_name: '',
          lines: [],
          form_metadata: {},
        };
      }
      if (!newPurpose.trim()) {
        return {
          valid: false,
          errorMessage: 'Vui lòng nhập mục đích sử dụng máy tính / laptop!',
          purpose: '',
          target_recipient_name: '',
          lines: [],
          form_metadata: {},
        };
      }

      const defaultCategoryId = computerType === 'DESKTOP' ? 'CAT-02' : 'CAT-01';
      const defaultCategoryName =
        computerType === 'DESKTOP' ? 'Máy tính để bàn (PC)' : 'Laptop văn phòng';

      return {
        valid: true,
        purpose: newPurpose.trim(),
        target_recipient_name: mtUserFullName.trim(),
        lines: [
          {
            category_id: defaultCategoryId,
            qty_requested: 1,
            recipient_name: mtUserFullName.trim(),
            note: `${defaultCategoryName} - Trang bị cho: ${mtUserFullName.trim()} (${mtUserPosition.trim() || 'CBNV'})`,
          },
        ],
        form_metadata: {
          requester_name: requesterName.trim() || currentUser.full_name,
          requester_department: requesterDepartment.trim() || currentUserDept,
          requester_unit: requesterUnit.trim() || currentUserUnit,
          block_name: mtBlockName.trim() || 'Khối Nghiệp vụ',
          computer_type: computerType,
          user_full_name: mtUserFullName.trim(),
          user_position: mtUserPosition.trim(),
          user_department: mtUserDepartment.trim() || requesterDepartment.trim(),
          user_section: mtUserSection.trim() || mtUserDepartment.trim(),
          start_date: mtStartDate,
          purpose: newPurpose.trim(),
        },
      };
    }

    // Cấp thiết bị CNTT (CAP_THIET_BI_CNTT)
    if (!newPurpose.trim()) {
      return {
        valid: false,
        errorMessage: 'Vui lòng nhập mục đích sử dụng thiết bị CNTT!',
        purpose: '',
        target_recipient_name: '',
        lines: [],
        form_metadata: {},
      };
    }
    if (!cnttResponsiblePerson.trim()) {
      return {
        valid: false,
        errorMessage: 'Vui lòng nhập người chịu trách nhiệm / bàn giao thiết bị CNTT!',
        purpose: '',
        target_recipient_name: '',
        lines: [],
        form_metadata: {},
      };
    }
    for (let i = 0; i < newLines.length; i++) {
      if (!newLines[i].item_name.trim()) {
        return {
          valid: false,
          errorMessage: `Vui lòng chọn hoặc nhập tên thiết bị CNTT cần đề xuất ở dòng #${i + 1}!`,
          purpose: '',
          target_recipient_name: '',
          lines: [],
          form_metadata: {},
        };
      }
    }

    const lines = newLines.map((l) => {
      const matchedCat =
        categories.find((c) => c.category_id === l.category_id) ||
        cnttCategories.find((c) =>
          c.name.toLowerCase().includes(l.item_name.toLowerCase())
        ) ||
        cnttCategories[0] ||
        categories[0];
      const lineResp = l.recipient_name?.trim() || cnttResponsiblePerson.trim();
      return {
        category_id: matchedCat?.category_id || 'CAT-04',
        qty_requested: Math.max(1, l.qty_requested),
        recipient_name: lineResp,
        specifications: l.specifications?.trim() || matchedCat?.description || '',
        note: `${l.item_name}${l.specifications ? ` (${l.specifications})` : ''} - Người nhận/chịu trách nhiệm: ${lineResp}`,
      };
    });

    return {
      valid: true,
      purpose: newPurpose.trim(),
      target_recipient_name: cnttResponsiblePerson.trim(),
      lines,
      form_metadata: {
        requester_name: requesterName.trim() || currentUser.full_name,
        requester_position: requesterPosition.trim() || currentUser.position,
        requester_department: requesterDepartment.trim() || currentUserDept,
        purpose: newPurpose.trim(),
        responsible_person: cnttResponsiblePerson.trim(),
      },
    };
  };

  // Export directly from current modal state into the 4 official form files in /public/form/
  const handleExportCurrentFormTemplate = async () => {
    const payload = buildRequestSubmissionPayload();
    if (!payload.valid) {
      alert(payload.errorMessage);
      return;
    }

    try {
      setIsExportingFile(true);
      if (newReqType === 'CAP_VAN_PHONG_PHAM') {
        await downloadVPPForm({
          requesterName: requesterName.trim() || currentUser.full_name,
          requesterPosition: requesterPosition.trim() || currentUser.position,
          departmentName: requesterDepartment.trim() || currentUserDept,
          purpose: newPurpose.trim(),
          items: newLines.map((l) => {
            const cat = categories.find((c) => c.category_id === l.category_id);
            return {
              itemName: l.item_name || cat?.name || 'Văn phòng phẩm',
              unitOfMeasure: l.unit_of_measure || cat?.unit_of_measure || 'Cái',
              quantity: Math.max(1, Number(l.qty_requested) || 1),
              note: l.note || '',
            };
          }),
        });
      } else if (newReqType === 'CAP_DONG_PHUC') {
        await downloadUniformForm({
          requesterName: requesterName.trim() || currentUser.full_name,
          unitName: requesterUnit.trim() || currentUserUnit,
          departmentName: requesterDepartment.trim() || currentUserDept,
          requesterPosition: requesterPosition.trim() || currentUser.position,
          recipients: uniformRecipients.map((r) => ({
            fullName: r.full_name,
            gender: r.gender,
            position: r.position,
            contractNo: r.contract_no,
            items: r.items.map((it) => ({
              itemName: it.item_name,
              unitOfMeasure: it.unit_of_measure || 'Cái',
              quantity: Math.max(1, Number(it.qty) || 1),
              note: it.note,
            })),
          })),
        });
      } else if (newReqType === 'CAP_MAY_TINH_LAPTOP') {
        await downloadComputerForm({
          requesterName: requesterName.trim() || currentUser.full_name,
          requesterDepartment: requesterDepartment.trim() || currentUserDept,
          blockName: mtBlockName.trim() || 'Khối Nghiệp vụ',
          unitName: requesterUnit.trim() || currentUserUnit,
          computerType: computerType,
          userFullName: mtUserFullName.trim(),
          userPosition: mtUserPosition.trim(),
          userDepartment: mtUserDepartment.trim() || requesterDepartment.trim(),
          userSection: mtUserSection.trim() || mtUserDepartment.trim(),
          startDate: formatDateVN(mtStartDate),
          purpose: newPurpose.trim(),
        });
      } else if (newReqType === 'CAP_THIET_BI_CNTT') {
        await downloadCNTTForm({
          requesterName: requesterName.trim() || currentUser.full_name,
          requesterPosition: requesterPosition.trim() || currentUser.position,
          purpose: newPurpose.trim(),
          responsiblePerson: cnttResponsiblePerson.trim(),
          items: newLines.map((l) => {
            const cat = categories.find((c) => c.category_id === l.category_id);
            return {
              itemName: l.item_name || cat?.name || 'Thiết bị CNTT',
              specifications: l.specifications || cat?.description || 'Theo tiêu chuẩn CNTT',
              unitOfMeasure: l.unit_of_measure || cat?.unit_of_measure || 'Cái',
              quantity: Math.max(1, Number(l.qty_requested) || 1),
              purpose: newPurpose.trim(),
              responsiblePerson:
                l.recipient_name?.trim() || cnttResponsiblePerson.trim(),
            };
          }),
        });
      }
    } catch (err: any) {
      alert(`Lỗi khi xuất biểu mẫu: ${err?.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsExportingFile(false);
    }
  };

  // Export directly from an existing saved Request row in the table
  const handleExportSavedRequestTemplate = async (req: AssetRequest) => {
    const reqEmp = employees.find((e) => e.employee_id === req.requester_id);
    const reqDept =
      departments.find((d) => d.department_id === reqEmp?.department_id)?.name ||
      reqEmp?.department_id ||
      '';
    const reqUnit =
      units.find((u) => u.unit_id === req.unit_id)?.name || currentUserUnit;
    const meta = req.form_metadata;

    try {
      setIsExportingFile(true);
      if (req.request_type === 'CAP_VAN_PHONG_PHAM') {
        await downloadVPPForm({
          requesterName: meta?.requester_name || reqEmp?.full_name || 'CBNV',
          requesterPosition: meta?.requester_position || reqEmp?.position || '',
          departmentName: meta?.requester_department || reqDept,
          purpose: meta?.purpose || req.purpose,
          items: req.lines.map((l) => {
            const cat = categories.find((c) => c.category_id === l.category_id);
            return {
              itemName: cat?.name || l.note || 'Văn phòng phẩm',
              unitOfMeasure: cat?.unit_of_measure || 'Cái',
              quantity: l.qty_requested,
              note: l.note || '',
            };
          }),
        });
      } else if (req.request_type === 'CAP_DONG_PHUC') {
        const recipients =
          meta?.uniform_recipients && meta.uniform_recipients.length > 0
            ? meta.uniform_recipients.map((r) => ({
                fullName: r.full_name,
                gender: r.gender,
                position: r.position,
                contractNo: r.contract_no,
                items: r.items.map((it) => ({
                  itemName: it.item_name,
                  unitOfMeasure: it.unit_of_measure || 'Cái',
                  quantity: it.qty,
                  note: it.note,
                })),
              }))
            : [
                {
                  fullName: req.target_recipient_name || reqEmp?.full_name || 'CBNV',
                  gender: 'Nam' as const,
                  position: reqEmp?.position || '',
                  items: req.lines.map((l) => {
                    const cat = categories.find((c) => c.category_id === l.category_id);
                    return {
                      itemName: cat?.name || 'Áo sơ mi đồng phục',
                      unitOfMeasure: cat?.unit_of_measure || 'Cái',
                      quantity: l.qty_requested,
                      note: l.note,
                    };
                  }),
                },
              ];
        await downloadUniformForm({
          requesterName: meta?.requester_name || reqEmp?.full_name || 'CBNV',
          unitName: meta?.requester_unit || reqUnit,
          departmentName: meta?.requester_department || reqDept,
          requesterPosition: meta?.requester_position || reqEmp?.position || '',
          recipients,
        });
      } else if (req.request_type === 'CAP_MAY_TINH_LAPTOP') {
        const hasPC = req.lines.some((l) => l.category_id === 'CAT-02');
        await downloadComputerForm({
          requesterName: meta?.requester_name || reqEmp?.full_name || 'CBNV',
          requesterDepartment: meta?.requester_department || reqDept,
          blockName: meta?.block_name || 'Khối Nghiệp vụ',
          unitName: meta?.requester_unit || reqUnit,
          computerType: meta?.computer_type || (hasPC ? 'DESKTOP' : 'LAPTOP'),
          userFullName:
            meta?.user_full_name || req.target_recipient_name || reqEmp?.full_name || '',
          userPosition: meta?.user_position || reqEmp?.position || '',
          userDepartment: meta?.user_department || reqDept,
          userSection: meta?.user_section || reqDept,
          startDate: meta?.start_date ? formatDateVN(meta.start_date) : formatDateVN(req.created_at),
          purpose: meta?.purpose || req.purpose,
        });
      } else if (req.request_type === 'CAP_THIET_BI_CNTT') {
        const resp =
          meta?.responsible_person ||
          req.target_recipient_name ||
          req.lines[0]?.recipient_name ||
          reqEmp?.full_name ||
          '';
        await downloadCNTTForm({
          requesterName: meta?.requester_name || reqEmp?.full_name || 'CBNV',
          requesterPosition: meta?.requester_position || reqEmp?.position || reqDept,
          purpose: meta?.purpose || req.purpose,
          responsiblePerson: resp,
          items: req.lines.map((l) => {
            const cat = categories.find((c) => c.category_id === l.category_id);
            return {
              itemName: cat?.name || l.note || 'Thiết bị CNTT',
              specifications: l.specifications || cat?.description || 'Theo tiêu chuẩn CNTT',
              unitOfMeasure: cat?.unit_of_measure || 'Cái',
              quantity: l.qty_requested,
              purpose: meta?.purpose || req.purpose,
              responsiblePerson: l.recipient_name || resp,
            };
          }),
        });
      }
    } catch (err: any) {
      alert(`Lỗi khi tải biểu mẫu: ${err?.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsExportingFile(false);
    }
  };

  // Save Draft Request
  const handleSaveDraft = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();

    const payload = buildRequestSubmissionPayload();
    if (!payload.valid) {
      alert(payload.errorMessage);
      return;
    }

    if (editingReq) {
      const res = updateRequest(editingReq.request_id, {
        request_type: newReqType,
        purpose: payload.purpose,
        priority: newPriority,
        lines: payload.lines,
        target_recipient_name: payload.target_recipient_name,
        form_metadata: payload.form_metadata,
        attachment_file_name: attachedFileName || undefined,
        is_draft: true,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    } else {
      const res = createRequest({
        request_type: newReqType,
        purpose: payload.purpose,
        priority: newPriority,
        lines: payload.lines,
        target_recipient_name: payload.target_recipient_name,
        form_metadata: payload.form_metadata,
        attachment_file_name: attachedFileName || undefined,
        is_draft: true,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    }
  };

  // Submit request to warehouse queue
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = buildRequestSubmissionPayload();
    if (!payload.valid) {
      alert(payload.errorMessage);
      return;
    }

    if (!attachedFileName.trim()) {
      alert(
        'Vui lòng đính kèm file phiếu đề xuất đã được phê duyệt (PDF/Scan) trước khi gửi vào hàng đợi Thủ kho.\n\nNếu chưa có file ký duyệt ngay lúc này, bạn có thể bấm nút "Lưu nháp (Chưa cần file)" để lưu lại và bổ sung file sau.'
      );
      return;
    }

    if (editingReq) {
      const res = updateRequest(editingReq.request_id, {
        request_type: newReqType,
        purpose: payload.purpose,
        priority: newPriority,
        lines: payload.lines,
        target_recipient_name: payload.target_recipient_name,
        form_metadata: payload.form_metadata,
        attachment_file_name: attachedFileName,
        is_draft: false,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    } else {
      const res = createRequest({
        request_type: newReqType,
        purpose: payload.purpose,
        priority: newPriority,
        lines: payload.lines,
        target_recipient_name: payload.target_recipient_name,
        form_metadata: payload.form_metadata,
        attachment_file_name: attachedFileName,
        is_draft: false,
      });
      alert(res.message);
      if (res.success) {
        setIsNewRequestOpen(false);
        setEditingReq(null);
      }
    }
  };

  // Open Allocation Modal for Thủ kho
  const handleOpenAllocationModal = (req: AssetRequest) => {
    setSelectedReq(req);
    const initialAlloc: typeof allocState = {};

    req.lines.forEach((l) => {
      const cat = categories.find((c) => c.category_id === l.category_id);
      const remainingQty = l.qty_requested - l.qty_issued;

      if (cat?.tracking_type === 'DINH_DANH') {
        const matchingAvailableAssets = assets.filter(
          (a) =>
            a.category_id === l.category_id &&
            a.warehouse_id === selectedWarehouseId &&
            a.status === 'TRONG_KHO'
        );
        const preselected = matchingAvailableAssets
          .slice(0, remainingQty)
          .map((a) => a.asset_id);
        initialAlloc[l.request_line_id] = {
          selectedAssetIds: preselected,
          consumableQty: 0,
        };
      } else {
        const stock = stockBalances.find(
          (s) =>
            s.warehouse_id === selectedWarehouseId &&
            s.category_id === l.category_id
        );
        const avail = stock?.quantity_on_hand || 0;
        initialAlloc[l.request_line_id] = {
          selectedAssetIds: [],
          consumableQty: Math.min(avail, remainingQty),
        };
      }
    });

    setAllocState(initialAlloc);
    setIsAllocatingModalOpen(true);
  };

  // Submit Allocation
  const handleConfirmAllocation = () => {
    if (!selectedReq) return;

    let totalAllocated = 0;
    const payload = selectedReq.lines.map((l) => {
      const currentAlloc = allocState[l.request_line_id] || {
        selectedAssetIds: [],
        consumableQty: 0,
      };
      const assetCount = currentAlloc.selectedAssetIds?.length || 0;
      const consQty = currentAlloc.consumableQty || 0;
      totalAllocated += assetCount + consQty;

      return {
        line_id: l.request_line_id,
        category_id: l.category_id,
        asset_ids: currentAlloc.selectedAssetIds,
        consumable_qty: currentAlloc.consumableQty,
      };
    });

    if (totalAllocated === 0) {
      alert(
        'Vui lòng chọn ít nhất 1 thiết bị định danh hoặc nhập số lượng vật tư tiêu hao để thực hiện cấp phát!'
      );
      return;
    }

    const res = issueRequestAllocation(selectedReq.request_id, payload);
    if (res.success) {
      alert(res.message);
      setIsAllocatingModalOpen(false);
      setSelectedReq(null);
    } else {
      alert(res.message || 'Cấp phát không thành công.');
    }
  };

  // Handle Reject Request
  const handleConfirmReject = () => {
    if (!selectedReq) return;
    if (!rejectReason.trim()) {
      alert('Bắt buộc phải nhập lý do từ chối yêu cầu!');
      return;
    }
    updateRequestStatus(selectedReq.request_id, 'TU_CHOI', rejectReason);
    alert(
      `Đã từ chối yêu cầu ${selectedReq.request_code}. CBNV sẽ nhận được thông báo kèm lý do.`
    );
    setIsRejectOpen(false);
    setSelectedReq(null);
    setRejectReason('');
  };

  const getStatusBadge = (status: AssetRequest['status']) => {
    switch (status) {
      case 'NHAP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Bản nháp
          </span>
        );
      case 'CHO_TIEP_NHAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Chờ tiếp nhận
          </span>
        );
      case 'DA_TIEP_NHAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Đã tiếp nhận
          </span>
        );
      case 'DANG_CAP_PHAT':
      case 'CAP_MOT_PHAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Cấp một phần
          </span>
        );
      case 'CHO_MUA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            Đã chuyển PO mua
          </span>
        );
      case 'HOAN_THANH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Hoàn thành
          </span>
        );
      case 'TU_CHOI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (p: AssetRequest['priority']) => {
    switch (p) {
      case 'KHAN_CAP':
        return (
          <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
            KHẨN CẤP
          </span>
        );
      case 'CAO':
        return (
          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
            ƯU TIÊN CAO
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            Bình thường
          </span>
        );
    }
  };

  const getRequestTypeName = (type: AssetRequest['request_type']) => {
    switch (type) {
      case 'CAP_VAN_PHONG_PHAM':
        return 'Đề xuất cấp văn phòng phẩm';
      case 'CAP_DONG_PHUC':
        return 'Đề xuất cấp đồng phục';
      case 'CAP_MAY_TINH_LAPTOP':
        return 'Đề xuất máy tính / laptop';
      case 'CAP_THIET_BI_CNTT':
        return 'Cấp thiết bị CNTT';
      default:
        return type;
    }
  };

  const displayedRequests = isWarehouseStaff
    ? activeTab === 'WAREHOUSE_QUEUE'
      ? warehouseQueueRequests
      : myRequests
    : myRequests;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              {isWarehouseStaff
                ? 'Quản lý Cấp phát Kho'
                : 'Đề xuất Cấp phát Vật tư & Thiết bị'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Người dùng:{' '}
              <strong className="text-slate-900">{currentUser.full_name}</strong> (
              {currentUser.role})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isWarehouseStaff
              ? 'Hàng Đợi Tiếp Nhận & Cấp Phát Vật Tư / Thiết Bị'
              : 'Đề Xuất Cấp Phát Vật Tư & Thiết Bị Làm Việc'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isWarehouseStaff
              ? 'Kiểm tra tồn kho khả dụng, tiếp nhận, cấp phát vật tư/thiết bị hoặc chuyển nhu cầu thiếu hụt sang đơn thu mua PO.'
              : 'Tạo đề xuất cấp phát văn phòng phẩm, đồng phục, máy tính hoặc thiết bị CNTT và xuất phiếu yêu cầu trình ký.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewRequest}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo đề xuất cấp phát mới
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-3 sm:px-6 pt-3 gap-3 sm:gap-4 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
        {isWarehouseStaff && (
          <button
            onClick={() => setActiveTab('WAREHOUSE_QUEUE')}
            className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'WAREHOUSE_QUEUE'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hàng Đợi Xử Lý Của Thủ Kho
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-black">
              {
                warehouseQueueRequests.filter((r) => r.status === 'CHO_TIEP_NHAN')
                  .length
              }{' '}
              chờ duyệt
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('MY_REQUESTS')}
          className={`pb-3 flex items-center gap-2 transition cursor-pointer border-b-2 ${
            activeTab === 'MY_REQUESTS'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Yêu Cầu Do Tôi Tạo ({myRequests.length})
        </button>
      </div>

      {/* Main Request Table */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[960px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã yêu cầu</th>
                <th className="py-3 px-4">Người đề xuất / Người nhận cấp</th>
                <th className="py-3 px-4">Loại cấp phát & Mục đích</th>
                <th className="py-3 px-4">Mặt hàng & Tiến độ cấp</th>
                <th className="py-3 px-4">Phiếu yêu cầu & File trình ký</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">
                  {isWarehouseStaff ? 'Thao tác (Thủ kho)' : 'Tiến độ xử lý'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không có yêu cầu cấp phát nào trong danh sách.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req, idx) => {
                  const personInfo = getDisplayedPersonForRequest(req);
                  const isPending = req.status === 'CHO_TIEP_NHAN';
                  const isAccepted =
                    req.status === 'DA_TIEP_NHAN' ||
                    req.status === 'CAP_MOT_PHAN' ||
                    req.status === 'DANG_CAP_PHAT';

                  return (
                    <tr key={req.request_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {req.request_code}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateVN(req.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold mb-0.5">
                          {personInfo.roleLabel}
                        </span>
                        <div className="font-bold text-slate-900">
                          {personInfo.displayName}
                        </div>
                        {personInfo.subText && (
                          <div className="text-[11px] text-slate-500">
                            {personInfo.subText}
                          </div>
                        )}
                        {personInfo.createdByNote && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {personInfo.createdByNote}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-semibold text-emerald-800 text-[11px]">
                            {getRequestTypeName(req.request_type)}
                          </span>
                          {getPriorityBadge(req.priority)}
                        </div>
                        <p className="text-slate-600 line-clamp-2">{req.purpose}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {req.lines.map((l) => {
                            const cat = categories.find(
                              (c) => c.category_id === l.category_id
                            );
                            return (
                              <div
                                key={l.request_line_id}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="font-medium text-slate-800">
                                  {cat?.name || l.note}:
                                </span>
                                <span className="font-mono font-bold text-[11px]">
                                  {l.qty_issued}/{l.qty_requested}{' '}
                                  {cat?.unit_of_measure || 'Món'}
                                  {l.qty_issued >= l.qty_requested ? (
                                    <span className="text-emerald-700 ml-1">✓</span>
                                  ) : (
                                    <span className="text-amber-700 ml-1">
                                      (Thiếu {l.qty_requested - l.qty_issued})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleExportSavedRequestTemplate(req)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold cursor-pointer transition"
                            title="Tải phiếu yêu cầu theo biểu mẫu chuẩn"
                          >
                            <Download className="w-3 h-3" />
                            Xuất phiếu yêu cầu
                          </button>
                          {req.attachment_file ? (
                            <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-[11px] font-medium">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[120px]">
                                {req.attachment_file.file_name}
                              </span>
                            </div>
                          ) : req.status === 'NHAP' ? (
                            <span className="block text-slate-500 italic text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Chưa có file (Bản nháp)
                            </span>
                          ) : (
                            <span className="block text-red-500 italic text-[11px]">
                              Thiếu file trình ký
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(req.status)}
                        {req.rejection_reason && (
                          <div className="text-[10px] text-red-600 mt-0.5 italic max-w-[140px]">
                            Lý do: {req.rejection_reason}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-center">
                        {isWarehouseStaff ? (
                          <div className="inline-flex flex-wrap items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditRequest(req)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Chỉnh sửa thông tin đề xuất cấp phát và file đính kèm"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              {req.status === 'NHAP' ? 'Sửa & Gửi' : 'Sửa'}
                            </button>

                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    updateRequestStatus(
                                      req.request_id,
                                      'DA_TIEP_NHAN'
                                    )
                                  }
                                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[11px] transition cursor-pointer"
                                  title="Tiếp nhận xử lý yêu cầu"
                                >
                                  Tiếp nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setIsRejectOpen(true);
                                  }}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-[11px] transition cursor-pointer"
                                  title="Từ chối yêu cầu"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <>
                                <button
                                  onClick={() => handleOpenAllocationModal(req)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  Cấp phát
                                </button>
                                <button
                                  onClick={() => {
                                    const res = addDemandFromRequest(req.request_id);
                                    alert(res.message);
                                  }}
                                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <Boxes className="w-3.5 h-3.5 text-purple-700" />
                                  Đưa vào Gom PO
                                </button>
                              </>
                            )}

                            {req.status === 'CHO_MUA' && (
                              <div className="inline-flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleOpenAllocationModal(req)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  Cấp phát
                                </button>
                                <span className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[11px] font-semibold flex items-center gap-1">
                                  <Boxes className="w-3 h-3 text-purple-600" />
                                  Đã gom PO
                                </span>
                              </div>
                            )}

                            {req.status === 'HOAN_THANH' && (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Hoàn thành cấp phát
                              </span>
                            )}

                            {req.status === 'TU_CHOI' && (
                              <span className="px-2 py-1 bg-red-50 text-red-800 border border-red-200 rounded text-[11px] font-semibold flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-600" />
                                Đã từ chối
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 flex-wrap">
                            {req.status === 'NHAP' && (
                              <span className="text-[11px] text-slate-600 font-medium px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                                Bản nháp (Chưa gửi)
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[11px] text-amber-700 font-medium px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                                Đang chờ Thủ kho tiếp nhận
                              </span>
                            )}
                            <button
                              onClick={() => handleOpenEditRequest(req)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              {req.status === 'NHAP' ? 'Sửa & Gửi duyệt' : 'Sửa'}
                            </button>
                            {isAccepted && (
                              <span className="text-[11px] text-blue-700 font-medium px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                Đã tiếp nhận • Chờ giao hàng
                              </span>
                            )}
                            {req.status === 'HOAN_THANH' && (
                              <span className="text-[11px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã hoàn thành cấp phát
                              </span>
                            )}
                            {req.status === 'CHO_MUA' && (
                              <span className="text-[11px] text-purple-700 font-medium px-2 py-0.5 bg-purple-50 rounded border border-purple-200">
                                Kho đã đưa vào Gom PO thu mua
                              </span>
                            )}
                            {req.status === 'TU_CHOI' && (
                              <span className="text-[11px] text-red-700 font-medium px-2 py-0.5 bg-red-50 rounded border border-red-200">
                                Bị từ chối
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: TẠO / SỬA ĐỀ XUẤT CẤP PHÁT --- */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  {editingReq ? (
                    <>
                      <Edit3 className="w-4 h-4 text-amber-300" />
                      Chỉnh Sửa Đề Xuất Cấp Phát [{editingReq.request_code}]
                    </>
                  ) : (
                    'Tạo Đề Xuất Cấp Phát Mới'
                  )}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Điền thông tin đề xuất và xuất phiếu yêu cầu trình ký
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewRequestOpen(false);
                  setEditingReq(null);
                }}
                className="text-emerald-200 hover:text-white cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitRequest}
              className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
            >
              {/* CHỌN LOẠI ĐỀ XUẤT CẤP PHÁT */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="sm:col-span-8">
                  <label className="block font-bold text-slate-800 mb-1">
                    Loại đề xuất cấp phát:
                  </label>
                  <select
                    value={newReqType}
                    onChange={(e) => {
                      const nextType = e.target.value as AssetRequest['request_type'];
                      resetFormForType(nextType);
                    }}
                    className="w-full bg-white border border-emerald-600 rounded-lg p-2.5 font-bold text-emerald-950 focus:outline-emerald-700"
                  >
                    <option value="CAP_VAN_PHONG_PHAM">
                      Đề xuất cấp văn phòng phẩm
                    </option>
                    <option value="CAP_DONG_PHUC">
                      Đề xuất cấp đồng phục
                    </option>
                    <option value="CAP_MAY_TINH_LAPTOP">
                      Đề xuất máy tính / laptop
                    </option>
                    <option value="CAP_THIET_BI_CNTT">
                      Cấp thiết bị CNTT
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-800 mb-1">
                    Mức độ ưu tiên:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-medium focus:outline-emerald-600"
                  >
                    <option value="TRUNG_BINH">Bình thường</option>
                    <option value="CAO">Ưu tiên cao</option>
                    <option value="KHAN_CAP">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              {/* =====================================================================
                  FORM 1: ĐỀ XUẤT CẤP VĂN PHÒNG PHẨM
                 ===================================================================== */}
              {newReqType === 'CAP_VAN_PHONG_PHAM' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Thông tin đề xuất văn phòng phẩm
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người yêu cầu:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Chức vụ:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterPosition}
                          onChange={(e) => setRequesterPosition(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Phòng ban:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterDepartment}
                          onChange={(e) => setRequesterDepartment(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mục đích:
                      </label>
                      <input
                        type="text"
                        required
                        value={newPurpose}
                        onChange={(e) => setNewPurpose(e.target.value)}
                        placeholder="VD: Đề xuất cấp văn phòng phẩm phục vụ công tác Quý 4/2026..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Danh sách mặt hàng VPP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Mặt hàng cần đề xuất:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Chỉ hiển thị các vật tư liên quan đến văn phòng phẩm.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm mặt hàng
                      </button>
                    </div>

                    {newLines.map((line, idx) => {
                      const matchingSuggestions = line.item_name.trim()
                        ? vppCategories.filter(
                            (c) =>
                              c.name
                                .toLowerCase()
                                .includes(line.item_name.toLowerCase()) ||
                              c.code
                                .toLowerCase()
                                .includes(line.item_name.toLowerCase())
                          )
                        : vppCategories;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Mặt hàng #{idx + 1}:
                            </span>
                            {newLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Xóa dòng
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-6 relative">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Tên mặt hàng:
                              </label>
                              <input
                                type="text"
                                required
                                value={line.item_name}
                                onFocus={() => setActiveSuggestionIdx(idx)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, item_name: val } : l
                                    )
                                  );
                                  setActiveSuggestionIdx(idx);
                                }}
                                placeholder="Chọn hoặc gõ tên văn phòng phẩm (Giấy A4, Bút bi, Bìa còng...)"
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium"
                              />
                              {activeSuggestionIdx === idx && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                                  <div className="p-1.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Danh mục Văn phòng phẩm:</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveSuggestionIdx(null)}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {matchingSuggestions.map((cat) => (
                                    <button
                                      key={cat.category_id}
                                      type="button"
                                      onClick={() => handleSelectCategory(idx, cat)}
                                      className="w-full text-left p-2 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition flex items-center justify-between cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900 text-xs">
                                          {cat.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Mã: {cat.code} • ĐVT:{' '}
                                          <strong>{cat.unit_of_measure}</strong>
                                        </div>
                                      </div>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                        VPP
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Số lượng ({line.unit_of_measure || 'ĐVT'}):
                              </label>
                              <input
                                type="number"
                                min={1}
                                required
                                value={line.qty_requested}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value));
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, qty_requested: val } : l
                                    )
                                  );
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-bold font-mono text-xs"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Ghi chú:
                              </label>
                              <input
                                type="text"
                                value={line.note}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, note: val } : l
                                    )
                                  );
                                }}
                                placeholder="Ghi chú thêm (nếu có)..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =====================================================================
                  FORM 2: ĐỀ XUẤT CẤP ĐỒNG PHỤC
                 ===================================================================== */}
              {newReqType === 'CAP_DONG_PHUC' && (
                <div className="space-y-4">
                  {/* Người yêu cầu */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Thông tin người yêu cầu
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người yêu cầu:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Đơn vị:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterUnit}
                          onChange={(e) => setRequesterUnit(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Phòng / Ban người yêu cầu:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterDepartment}
                          onChange={(e) => setRequesterDepartment(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Chức vụ người yêu cầu:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterPosition}
                          onChange={(e) => setRequesterPosition(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Danh sách Người nhận đồng phục & Vật tư đồng phục theo từng người */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Danh sách người cần cấp đồng phục:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Có thể thêm nhiều người nhận và chọn đồng phục cần cấp theo từng người.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddUniformRecipient}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Thêm người cần cấp
                      </button>
                    </div>

                    {uniformRecipients.map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-bold text-emerald-900 text-xs">
                            Người nhận #{rIdx + 1}:{' '}
                            {rec.full_name ? (
                              <span className="text-slate-900">
                                {rec.full_name} ({rec.gender} - {rec.position})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">
                                Chưa nhập tên
                              </span>
                            )}
                          </span>
                          {uniformRecipients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUniformRecipient(rIdx)}
                              className="text-red-600 hover:text-red-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa người nhận này
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5">
                            <label className="block font-semibold text-slate-700 mb-1">
                              Họ tên người nhận:
                            </label>
                            <input
                              type="text"
                              list={`emp-list-${rIdx}`}
                              required
                              value={rec.full_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matchedEmp = employees.find(
                                  (emp) => emp.full_name === val
                                );
                                setUniformRecipients((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx
                                      ? {
                                          ...item,
                                          full_name: val,
                                          position:
                                            matchedEmp?.position || item.position,
                                        }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Nhập hoặc chọn tên người cần cấp..."
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                            />
                            <datalist id={`emp-list-${rIdx}`}>
                              {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.full_name}>
                                  {emp.position}
                                </option>
                              ))}
                            </datalist>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-semibold text-slate-700 mb-1">
                              Giới tính:
                            </label>
                            <select
                              value={rec.gender}
                              onChange={(e) => {
                                const val = e.target.value as 'Nam' | 'Nữ';
                                setUniformRecipients((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx ? { ...item, gender: val } : item
                                  )
                                );
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                            >
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                            </select>
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block font-semibold text-slate-700 mb-1">
                              Chức vụ người nhận:
                            </label>
                            <input
                              type="text"
                              required
                              value={rec.position}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUniformRecipients((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx
                                      ? { ...item, position: val }
                                      : item
                                  )
                                );
                              }}
                              placeholder="VD: Chuyên viên Kế toán, Kỹ sư..."
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                            />
                          </div>
                        </div>

                        {/* Danh sách đồng phục của người nhận này */}
                        <div className="pl-3 border-l-2 border-emerald-500 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Đồng phục cần cấp cho {rec.full_name || `Người nhận #${rIdx + 1}`}:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddUniformItemForRecipient(rIdx)}
                              className="text-emerald-700 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Thêm loại đồng phục
                            </button>
                          </div>

                          {rec.items.map((it, iIdx) => (
                            <div
                              key={iIdx}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-end"
                            >
                              <div className="sm:col-span-6 relative">
                                <label className="text-[10px] text-slate-500 block mb-0.5">
                                  Tên đồng phục cần cấp:
                                </label>
                                <select
                                  value={it.category_id}
                                  onChange={(e) => {
                                    const catId = e.target.value;
                                    const cat = uniformCategories.find(
                                      (c) => c.category_id === catId
                                    );
                                    setUniformRecipients((prev) =>
                                      prev.map((r, idx) =>
                                        idx === rIdx
                                          ? {
                                              ...r,
                                              items: r.items.map((item, j) =>
                                                j === iIdx
                                                  ? {
                                                      ...item,
                                                      category_id: catId,
                                                      item_name:
                                                        cat?.name || item.item_name,
                                                      unit_of_measure:
                                                        cat?.unit_of_measure || 'Cái',
                                                    }
                                                  : item
                                              ),
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                                >
                                  {uniformCategories.map((uCat) => (
                                    <option
                                      key={uCat.category_id}
                                      value={uCat.category_id}
                                    >
                                      {uCat.name} ({uCat.unit_of_measure})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-slate-500 block mb-0.5">
                                  Số lượng ({it.unit_of_measure || 'Cái'}):
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  required
                                  value={it.qty}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setUniformRecipients((prev) =>
                                      prev.map((r, idx) =>
                                        idx === rIdx
                                          ? {
                                              ...r,
                                              items: r.items.map((item, j) =>
                                                j === iIdx
                                                  ? { ...item, qty: val }
                                                  : item
                                              ),
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold font-mono text-xs"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="text-[10px] text-slate-500 block mb-0.5">
                                  Ghi chú / Size:
                                </label>
                                <input
                                  type="text"
                                  value={it.note || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setUniformRecipients((prev) =>
                                      prev.map((r, idx) =>
                                        idx === rIdx
                                          ? {
                                              ...r,
                                              items: r.items.map((item, j) =>
                                                j === iIdx
                                                  ? { ...item, note: val }
                                                  : item
                                              ),
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  placeholder="VD: Size L, Size M..."
                                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                                />
                              </div>

                              <div className="sm:col-span-1 text-right">
                                {rec.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveUniformItemForRecipient(rIdx, iIdx)
                                    }
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Xóa đồng phục này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =====================================================================
                  FORM 3: ĐỀ XUẤT MÁY TÍNH / LAPTOP
                 ===================================================================== */}
              {newReqType === 'CAP_MAY_TINH_LAPTOP' && (
                <div className="space-y-4">
                  {/* Người làm đề nghị */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Thông tin người làm đề nghị
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người làm đề nghị:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Phòng / Ban người đề nghị:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterDepartment}
                          onChange={(e) => setRequesterDepartment(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Đơn vị:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterUnit}
                          onChange={(e) => setRequesterUnit(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tick chọn Máy tính bàn hoặc Laptop */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs">
                        Chọn loại thiết bị cần trang bị:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                          computerType === 'DESKTOP'
                            ? 'bg-white border-emerald-700 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="computerType"
                          checked={computerType === 'DESKTOP'}
                          onChange={() => setComputerType('DESKTOP')}
                          className="accent-emerald-700 w-4 h-4"
                        />
                        <Monitor className="w-5 h-5 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">
                            Máy tính để bàn (PC)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Trang bị bộ máy tính để bàn làm việc tại văn phòng
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                          computerType === 'LAPTOP'
                            ? 'bg-white border-emerald-700 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="computerType"
                          checked={computerType === 'LAPTOP'}
                          onChange={() => setComputerType('LAPTOP')}
                          className="accent-emerald-700 w-4 h-4"
                        />
                        <Laptop className="w-5 h-5 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">
                            Máy tính xách tay (Laptop)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Trang bị laptop phục vụ công việc linh hoạt và công tác
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Thông tin người sử dụng & mục đích */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Thông tin người sử dụng
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người sử dụng:
                        </label>
                        <input
                          type="text"
                          list="mt-user-list"
                          required
                          value={mtUserFullName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = employees.find(
                              (emp) => emp.full_name === val
                            );
                            const matchedDept = departments.find(
                              (d) => d.department_id === matched?.department_id
                            )?.name;
                            setMtUserFullName(val);
                            if (matched) {
                              setMtUserPosition(matched.position);
                              if (matchedDept) setMtUserDepartment(matchedDept);
                            }
                          }}
                          placeholder="Nhập họ tên nhân sự được cấp máy..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                        <datalist id="mt-user-list">
                          {employees.map((emp) => (
                            <option key={emp.employee_id} value={emp.full_name}>
                              {emp.position}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Chức vụ:
                        </label>
                        <input
                          type="text"
                          required
                          value={mtUserPosition}
                          onChange={(e) => setMtUserPosition(e.target.value)}
                          placeholder="VD: Chuyên viên Thu mua, Kỹ sư..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Ban / Phòng người sử dụng:
                        </label>
                        <input
                          type="text"
                          required
                          value={mtUserDepartment}
                          onChange={(e) => setMtUserDepartment(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Bộ phận:
                        </label>
                        <input
                          type="text"
                          value={mtUserSection}
                          onChange={(e) => setMtUserSection(e.target.value)}
                          placeholder="VD: Bộ phận Kế toán / Hành chính..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Ngày nhận việc:
                        </label>
                        <input
                          type="date"
                          required
                          value={mtStartDate}
                          onChange={(e) => setMtStartDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Mục đích sử dụng:
                        </label>
                        <input
                          type="text"
                          required
                          value={newPurpose}
                          onChange={(e) => setNewPurpose(e.target.value)}
                          placeholder="VD: Phục vụ công việc chuyên môn cho nhân sự mới nhận việc..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  FORM 4: CẤP THIẾT BỊ CNTT
                 ===================================================================== */}
              {newReqType === 'CAP_THIET_BI_CNTT' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                      Thông tin đề xuất cấp thiết bị CNTT
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người đề xuất:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Chức vụ người đề xuất:
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterPosition}
                          onChange={(e) => setRequesterPosition(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Người chịu trách nhiệm / bàn giao:
                        </label>
                        <input
                          type="text"
                          list="cntt-resp-list"
                          required
                          value={cnttResponsiblePerson}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCnttResponsiblePerson(val);
                          }}
                          placeholder="Tên người sử dụng / chịu trách nhiệm..."
                          className="w-full bg-white border border-emerald-500 rounded-lg p-2 font-bold text-slate-900"
                        />
                        <datalist id="cntt-resp-list">
                          {employees.map((emp) => (
                            <option key={emp.employee_id} value={emp.full_name}>
                              {emp.position}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mục đích sử dụng:
                      </label>
                      <input
                        type="text"
                        required
                        value={newPurpose}
                        onChange={(e) => setNewPurpose(e.target.value)}
                        placeholder="VD: Trang bị màn hình & phụ kiện CNTT phục vụ công việc tại văn phòng..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  {/* Danh sách mặt hàng Thiết bị CNTT */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Mặt hàng cần đề xuất:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Chỉ xuất hiện những vật tư liên quan đến thiết bị CNTT.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Thêm mặt hàng
                      </button>
                    </div>

                    {newLines.map((line, idx) => {
                      const matchingSuggestions = line.item_name.trim()
                        ? cnttCategories.filter(
                            (c) =>
                              c.name
                                .toLowerCase()
                                .includes(line.item_name.toLowerCase()) ||
                              c.code
                                .toLowerCase()
                                .includes(line.item_name.toLowerCase())
                          )
                        : cnttCategories;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Thiết bị #{idx + 1}:
                            </span>
                            {newLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Xóa dòng
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-5 relative">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Loại mặt hàng đề xuất:
                              </label>
                              <input
                                type="text"
                                required
                                value={line.item_name}
                                onFocus={() => setActiveSuggestionIdx(idx)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, item_name: val } : l
                                    )
                                  );
                                  setActiveSuggestionIdx(idx);
                                }}
                                placeholder="Chọn thiết bị CNTT (Màn hình, Chuột, Bàn phím, Máy in, UPS...)"
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium"
                              />
                              {activeSuggestionIdx === idx && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                                  <div className="p-1.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Danh mục Thiết bị CNTT:</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveSuggestionIdx(null)}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  {matchingSuggestions.map((cat) => (
                                    <button
                                      key={cat.category_id}
                                      type="button"
                                      onClick={() => handleSelectCategory(idx, cat)}
                                      className="w-full text-left p-2 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition flex items-center justify-between cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900 text-xs">
                                          {cat.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          ĐVT: <strong>{cat.unit_of_measure}</strong> •{' '}
                                          {cat.description}
                                        </div>
                                      </div>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                        CNTT
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Số lượng ({line.unit_of_measure || 'ĐVT'}):
                              </label>
                              <input
                                type="number"
                                min={1}
                                required
                                value={line.qty_requested}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value));
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, qty_requested: val } : l
                                    )
                                  );
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-bold font-mono text-xs"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Quy cách:
                              </label>
                              <input
                                type="text"
                                value={line.specifications || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, specifications: val } : l
                                    )
                                  );
                                }}
                                placeholder="Quy cách / thông số..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Người chịu trách nhiệm:
                              </label>
                              <input
                                type="text"
                                value={
                                  line.recipient_name || cnttResponsiblePerson || ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewLines((prev) =>
                                    prev.map((l, i) =>
                                      i === idx ? { ...l, recipient_name: val } : l
                                    )
                                  );
                                }}
                                placeholder="Người nhận..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BIỂU MẪU XUẤT & FILE ĐÍNH KÈM */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Biểu mẫu trình ký & Hồ sơ phê duyệt
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Bước 1: Bấm <strong>"Xuất phiếu yêu cầu"</strong> để tải file biểu mẫu đã điền sẵn thông tin trình ký.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isExportingFile}
                    onClick={handleExportCurrentFormTemplate}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isExportingFile
                      ? 'Đang xuất biểu mẫu...'
                      : '1. Xuất phiếu yêu cầu'}
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-emerald-950">
                      Bước 2: Đính kèm file phiếu đã được phê duyệt:
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                      Chưa có file có thể Lưu nháp
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={attachedFileName}
                      onChange={(e) => setAttachedFileName(e.target.value)}
                      placeholder="Ví dụ: Phieu_de_xuat_da_ky.pdf"
                      className="flex-1 bg-white border border-emerald-300 rounded-lg p-2 font-mono text-xs focus:outline-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttachedFileName(
                          `Phieu_de_xuat_${Date.now().toString().slice(-4)}_signed.pdf`
                        )
                      }
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      Đính kèm file đã ký
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRequestOpen(false);
                    setEditingReq(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-700" />
                    Lưu nháp (Chưa cần file)
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {editingReq && editingReq.status !== 'NHAP'
                      ? 'Lưu & Cập nhật'
                      : 'Gửi yêu cầu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: THỦ KHO CẤP PHÁT CHI TIẾT --- */}
      {isAllocatingModalOpen && selectedReq && isWarehouseStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Thủ Kho Cấp Phát Cho Yêu Cầu {selectedReq.request_code}
                </h3>
                <p className="text-xs text-emerald-200">
                  Người nhận:{' '}
                  {getDisplayedPersonForRequest(selectedReq).displayName} • Kho
                  xuất: {currentWh?.name}
                </p>
              </div>
              <button
                onClick={() => setIsAllocatingModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
                <span className="font-bold block mb-1">
                  Cấp phát rõ ràng Hãng & Cấu hình cho yêu cầu của CBNV:
                </span>
                Thủ kho kiểm tra danh sách thiết bị đang sẵn có trong kho theo
                từng <strong>Hãng, Dòng máy (Model) & Cấu hình chi tiết</strong>{' '}
                để chọn bàn giao chính xác.
              </div>

              {selectedReq.lines.map((l) => {
                const cat = categories.find(
                  (c) => c.category_id === l.category_id
                );
                const isSerialized = cat?.tracking_type === 'DINH_DANH';
                const currentAlloc = allocState[l.request_line_id] || {
                  selectedAssetIds: [],
                  consumableQty: 0,
                };
                const remaining = l.qty_requested - l.qty_issued;

                if (isSerialized) {
                  const availableAssets = assets.filter(
                    (a) =>
                      a.category_id === l.category_id &&
                      a.warehouse_id === selectedWarehouseId &&
                      a.status === 'TRONG_KHO'
                  );

                  return (
                    <div
                      key={l.request_line_id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {cat?.name || l.note}
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            Yêu cầu: {l.qty_requested} • Đã cấp: {l.qty_issued}{' '}
                            • Cần cấp thêm:{' '}
                            <strong className="text-emerald-800">
                              {remaining} chiếc
                            </strong>
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Kho có sẵn: {availableAssets.length} chiếc
                        </span>
                      </div>

                      {availableAssets.length === 0 ? (
                        <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                          Kho hiện không còn thiết bị này ở trạng thái TRONG
                          KHO! Hãy bấm nút <strong>"Đưa vào Gom PO"</strong> tại
                          hàng đợi để tổng hợp mua hàng.
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1.5">
                            Chọn thiết bị định danh cụ thể theo Hãng & Cấu hình
                            để bàn giao (
                            {currentAlloc.selectedAssetIds.length}/{remaining}{' '}
                            đã chọn):
                          </span>
                          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1">
                            {availableAssets.map((ast) => {
                              const isChecked =
                                currentAlloc.selectedAssetIds.includes(
                                  ast.asset_id
                                );
                              return (
                                <label
                                  key={ast.asset_id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setAllocState((prev) => {
                                        const oldIds =
                                          prev[l.request_line_id]
                                            ?.selectedAssetIds || [];
                                        const newIds = checked
                                          ? [...oldIds, ast.asset_id]
                                          : oldIds.filter(
                                              (id) => id !== ast.asset_id
                                            );
                                        return {
                                          ...prev,
                                          [l.request_line_id]: {
                                            ...prev[l.request_line_id],
                                            selectedAssetIds: newIds,
                                          },
                                        };
                                      });
                                    }}
                                    className="accent-emerald-700 mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[10px]">
                                          {ast.brand || 'Chưa rõ hãng'}
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs">
                                          {ast.model_name || cat?.name}
                                        </span>
                                      </div>
                                      <div className="font-mono text-[11px]">
                                        <span className="font-bold text-emerald-800">
                                          {ast.asset_code}
                                        </span>
                                        <span className="text-slate-400 mx-1">
                                          •
                                        </span>
                                        <span className="text-slate-600">
                                          SN: {ast.serial_no}
                                        </span>
                                      </div>
                                    </div>
                                    {ast.specifications && (
                                      <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        <span className="font-semibold text-slate-700">
                                          Cấu hình:{' '}
                                        </span>
                                        {ast.specifications}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const stock = stockBalances.find(
                    (s) =>
                      s.warehouse_id === selectedWarehouseId &&
                      s.category_id === l.category_id
                  );
                  const avail = stock?.quantity_on_hand || 0;

                  return (
                    <div
                      key={l.request_line_id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {cat?.name || l.note}
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            Yêu cầu: {l.qty_requested}{' '}
                            {cat?.unit_of_measure || 'Món'} • Tồn kho khả dụng:{' '}
                            <strong className="text-emerald-800">
                              {avail} {cat?.unit_of_measure || 'Món'}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            SL cấp đợt này:
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={avail}
                            value={currentAlloc.consumableQty}
                            onChange={(e) => {
                              const val = Math.min(
                                avail,
                                Math.max(0, Number(e.target.value))
                              );
                              setAllocState((prev) => ({
                                ...prev,
                                [l.request_line_id]: {
                                  ...prev[l.request_line_id],
                                  consumableQty: val,
                                },
                              }));
                            }}
                            className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold font-mono focus:outline-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Nếu không cấp đủ toàn bộ, yêu cầu sẽ chuyển thành "CẤP MỘT PHẦN"
                và có thể đưa vào Gom PO.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocatingModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllocation}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Xác nhận cấp phát & Cập nhật kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: TỪ CHỐI YÊU CẦU --- */}
      {isRejectOpen && selectedReq && isWarehouseStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-red-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                Từ Chối Yêu Cầu Cấp Phát {selectedReq.request_code}
              </h3>
              <button
                onClick={() => setIsRejectOpen(false)}
                className="text-red-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do từ chối (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Đã vượt định mức quý 4 / Chưa có phê duyệt bổ sung..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:outline-red-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận từ chối yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
