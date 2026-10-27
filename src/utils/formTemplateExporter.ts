import JSZip from 'jszip';

export interface VPPExportItem {
  item_name: string;
  unit_of_measure: string;
  qty_requested: number;
  note?: string;
}

export interface VPPFormExportData {
  requester_name: string;     // 1: Người yêu cầu
  requester_position: string; // 1: Chức vụ
  department_name: string;    // 2: Phòng ban
  unit_name?: string;
  purpose: string;            // 3: Mục đích
  items: VPPExportItem[];     // + Tên mặt hàng, + Số lượng
}

export interface UniformRecipientExportItem {
  item_name: string;
  uniform_type: 'AO_SO_MI' | 'AO_KHOAC' | 'BAO_HO_LAO_DONG' | 'KHAC';
  qty: number;
  note?: string;
}

export interface UniformRecipientExportEntry {
  full_name: string;          // 5: Họ tên người nhận
  gender: 'Nam' | 'Nữ';       // 7: Giới tính
  position: string;           // 6: Chức vụ người nhận
  contract_no?: string;
  contract_date?: string;
  items: UniformRecipientExportItem[];
}

export interface UniformFormExportData {
  requester_name: string;       // 1: Người yêu cầu
  unit_name: string;            // 2: Đơn vị (Tên công ty)
  requester_department: string; // 3: Phòng/ban người yêu cầu
  requester_position: string;   // 4: Chức vụ người yêu cầu
  recipients: UniformRecipientExportEntry[];
}

export interface ComputerFormExportData {
  requester_name: string;       // 1: Người làm đề nghị
  requester_department: string; // 2: Phòng/ban người đề nghị
  requester_block?: string;     // 3: Khối
  unit_name: string;            // 4: Đơn vị
  equipment_choice: 'PC' | 'LAPTOP'; // 8: Máy tính để bàn, 9: Laptop
  user_full_name: string;       // 10: Tên người sử dụng
  user_position: string;        // 11: Chức vụ
  user_department: string;      // 12: Ban/phòng người sử dụng
  user_section: string;         // 13: Bộ phận
  user_onboarding_date: string; // 14: Ngày nhận việc
  user_purpose: string;         // 15: Mục đích sử dụng
}

export interface CNTTExportItem {
  item_name: string;
  specifications?: string;      // 7: Quy cách
  unit_of_measure: string;
  qty_requested: number;
  recipient_name: string;       // Người chịu trách nhiệm
}

export interface CNTTFormExportData {
  requester_name: string;       // 1: Người đề xuất
  requester_position: string;   // 2: Chức vụ / Bộ phận người đề xuất
  purpose: string;              // 3: Mục đích sử dụng
  items: CNTTExportItem[];      // + Loại mặt hàng đề xuất - số lượng - người chịu trách nhiệm
}

function escapeXml(unsafe: string): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateParts(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return { dd, mm, yyyy };
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Helper to manage sharedStrings.xml by appending new strings at the end
 * so existing string indices in all sheets remain 100% intact.
 */
class SharedStringsManager {
  private ssXml: string;
  private currentCount: number;
  private appendedXml: string[] = [];

  constructor(ssXml: string) {
    this.ssXml = ssXml;
    const matches = ssXml.match(/<si\b[\s\S]*?<\/si>/g);
    this.currentCount = matches ? matches.length : 0;
  }

  addString(text: string): number {
    const idx = this.currentCount;
    this.currentCount += 1;
    this.appendedXml.push(`<si><t xml:space="preserve">${escapeXml(text)}</t></si>`);
    return idx;
  }

  buildXml(): string {
    if (this.appendedXml.length === 0) return this.ssXml;
    const updatedHeader = this.ssXml
      .replace(/count="\d+"/, `count="${this.currentCount}"`)
      .replace(/uniqueCount="\d+"/, `uniqueCount="${this.currentCount}"`);
    return updatedHeader.replace('</sst>', `${this.appendedXml.join('')}</sst>`);
  }
}

function shiftRowXml(rowXml: string, newRowNumber: number): string {
  const oldRowMatch = rowXml.match(/<row\b[^>]*r="(\d+)"/);
  if (!oldRowMatch) return rowXml;
  const oldRowNumber = Number(oldRowMatch[1]);
  const delta = newRowNumber - oldRowNumber;
  if (delta === 0) return rowXml;

  let updated = rowXml.replace(/(<row\b[^>]*\br=")(\d+)(")/, `$1${newRowNumber}$3`);
  updated = updated.replace(/(<c\b[^>]*\br="[A-Z]+)(\d+)(")/g, (_m, p1, rNum, p3) => {
    return `${p1}${Number(rNum) + delta}${p3}`;
  });
  return updated;
}

function setCellStringInRow(rowXml: string, colLetter: string, rowNum: number, styleId: string, strIdx: number): string {
  const cellRef = `${colLetter}${rowNum}`;
  const newCell = `<c r="${cellRef}" s="${styleId}" t="s"><v>${strIdx}</v></c>`;
  const cellRegex = new RegExp(`<c\\b[^>]*\\br="${cellRef}"[^>]*>(?:[\\s\\S]*?<\\/c>)|<c\\b[^>]*\\br="${cellRef}"[^>]*\\/>`);
  if (cellRegex.test(rowXml)) {
    return rowXml.replace(cellRegex, newCell);
  }
  return rowXml.replace('</row>', `${newCell}</row>`);
}

/**
 * 1. XUẤT BIỂU MẪU CẤP VĂN PHÒNG PHẨM (BM_VPP01.xlsx)
 * - 1: Người yêu cầu – chức vụ (A5)
 * - 2: Phòng ban (A6, A8, F1)
 * - 3: Mục đích (A7)
 * - + Tên mặt hàng, + Số lượng (Row 11+)
 */
export async function exportVPPFormTemplate(data: VPPFormExportData, templateBuffer?: ArrayBuffer): Promise<Blob> {
  const buf = templateBuffer || (await fetch('/form/BM_VPP01.xlsx').then((r) => r.arrayBuffer()));
  const zip = await JSZip.loadAsync(buf);

  const sheetPath = 'xl/worksheets/sheet1.xml';
  const ssPath = 'xl/sharedStrings.xml';
  const wbPath = 'xl/workbook.xml';
  const wbRelsPath = 'xl/_rels/workbook.xml.rels';

  let sheetXml = await zip.file(sheetPath)!.async('string');
  const ssXml = await zip.file(ssPath)!.async('string');
  let wbXml = await zip.file(wbPath)!.async('string');

  const ssm = new SharedStringsManager(ssXml);
  const { mm, yyyy } = formatDateParts();

  const requesterDisplay = data.requester_position
    ? `${data.requester_name} - ${data.requester_position}`
    : data.requester_name;
  const deptDisplay = data.department_name || 'Phòng/Ban';
  const purposeDisplay = data.purpose || 'Cấp văn phòng phẩm phục vụ công việc';

  const rowMap = new Map<number, string>();
  const rowMatches = [...sheetXml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>[\s\S]*?<\/row>/g)];
  for (const rm of rowMatches) {
    rowMap.set(Number(rm[1]), rm[0]);
  }

  // Row 1: F1 = Phòng ban
  if (rowMap.has(1)) {
    rowMap.set(1, setCellStringInRow(rowMap.get(1)!, 'F', 1, '11', ssm.addString(deptDisplay)));
  }
  // Row 5: A5 = Họ và tên: 1 (Người yêu cầu - chức vụ)
  if (rowMap.has(5)) {
    rowMap.set(5, setCellStringInRow(rowMap.get(5)!, 'A', 5, '17', ssm.addString(`Họ và tên: ${requesterDisplay}`)));
  }
  // Row 6: A6 = Đơn vị/Bộ phận trình: 2 (Phòng ban)
  if (rowMap.has(6)) {
    rowMap.set(6, setCellStringInRow(rowMap.get(6)!, 'A', 6, '17', ssm.addString(`Đơn vị/Bộ phận trình: ${deptDisplay}`)));
  }
  // Row 7: A7 = Về việc: 3 (Mục đích)
  if (rowMap.has(7)) {
    rowMap.set(7, setCellStringInRow(rowMap.get(7)!, 'A', 7, '17', ssm.addString(`Về việc: ${purposeDisplay}`)));
  }
  // Row 8: A8 = 2 (Phòng ban), C8 = Diễn giải
  if (rowMap.has(8)) {
    let r8 = setCellStringInRow(rowMap.get(8)!, 'A', 8, '42', ssm.addString(deptDisplay));
    r8 = setCellStringInRow(
      r8,
      'C',
      8,
      '21',
      ssm.addString(`Đề xuất cấp các văn phòng phẩm phục vụ cho nhu cầu công việc tháng ${mm}/${yyyy} (${purposeDisplay}), như sau:`)
    );
    rowMap.set(8, r8);
  }

  const validItems = data.items.filter((it) => it.item_name.trim() !== '');
  const itemRowsCount = Math.max(2, validItems.length);
  const delta = itemRowsCount - 2;

  const newRowsXml: string[] = [];
  for (let r = 1; r <= 10; r++) {
    if (rowMap.has(r)) newRowsXml.push(rowMap.get(r)!);
  }

  let totalQty = 0;
  for (let i = 0; i < itemRowsCount; i++) {
    const r = 11 + i;
    const item = validItems[i];
    if (item) {
      const qty = Number(item.qty_requested) || 0;
      totalQty += qty;
      const nameIdx = ssm.addString(item.item_name);
      const uomIdx = ssm.addString(item.unit_of_measure || 'Cái');
      const noteIdx = ssm.addString(item.note || '');
      newRowsXml.push(
        `<row r="${r}" spans="1:14" ht="16.9"><c r="A${r}" s="25"><v>${i + 1}</v></c><c r="B${r}" s="39" t="s"><v>${nameIdx}</v></c><c r="C${r}" s="35"/><c r="D${r}" s="26" t="s"><v>${uomIdx}</v></c><c r="E${r}" s="27"><v>${qty}</v></c><c r="F${r}" s="25" t="s"><v>${noteIdx}</v></c><c r="G${r}" s="15"/><c r="H${r}" s="15"/><c r="I${r}" s="15"/><c r="J${r}" s="15"/><c r="K${r}" s="15"/><c r="L${r}" s="15"/><c r="M${r}" s="15"/><c r="N${r}" s="15"/></row>`
      );
    } else {
      newRowsXml.push(
        `<row r="${r}" spans="1:14" ht="16.9"><c r="A${r}" s="25"/><c r="B${r}" s="39"/><c r="C${r}" s="35"/><c r="D${r}" s="26"/><c r="E${r}" s="27"/><c r="F${r}" s="25"/><c r="G${r}" s="15"/><c r="H${r}" s="15"/><c r="I${r}" s="15"/><c r="J${r}" s="15"/><c r="K${r}" s="15"/><c r="L${r}" s="15"/><c r="M${r}" s="15"/><c r="N${r}" s="15"/></row>`
      );
    }
  }

  // Shift rows >= 13
  const sortedOrigRows = [...rowMap.keys()].filter((r) => r >= 13).sort((a, b) => a - b);
  for (const origR of sortedOrigRows) {
    const newR = origR + delta;
    let shifted = shiftRowXml(rowMap.get(origR)!, newR);
    if (origR === 13) {
      // Update SUM formula and total value
      shifted = shifted.replace(
        /<c r="E\d+"[^>]*>[\s\S]*?<\/c>/,
        `<c r="E${newR}" s="30"><f>SUM(E11:E${12 + delta})</f><v>${totalQty}</v></c>`
      );
    }
    if (origR === 15 && data.unit_name) {
      shifted = setCellStringInRow(shifted, 'A', newR, '41', ssm.addString(`Đơn vị chịu chi phí: ${data.unit_name}`));
    }
    newRowsXml.push(shifted);
  }

  sheetXml = sheetXml.replace(/<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${newRowsXml.join('')}</sheetData>`);

  // Update mergeCells if delta > 0
  if (delta > 0) {
    sheetXml = sheetXml.replace(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/, (_m, inner) => {
      const merges: string[] = [];
      merges.push('<mergeCell ref="A1:B3"/>', '<mergeCell ref="C1:E3"/>', '<mergeCell ref="A8:B8"/>', '<mergeCell ref="B10:C10"/>');
      for (let i = 0; i <= itemRowsCount; i++) {
        merges.push(`<mergeCell ref="B${11 + i}:C${11 + i}"/>`);
      }
      merges.push(
        `<mergeCell ref="B${14 + delta}:C${14 + delta}"/>`,
        `<mergeCell ref="A${15 + delta}:F${15 + delta}"/>`,
        `<mergeCell ref="B${16 + delta}:C${16 + delta}"/>`,
        `<mergeCell ref="A${17 + delta}:C${17 + delta}"/>`,
        `<mergeCell ref="D${17 + delta}:F${17 + delta}"/>`,
        `<mergeCell ref="A${18 + delta}:C${18 + delta}"/>`,
        `<mergeCell ref="D${18 + delta}:F${18 + delta}"/>`
      );
      return `<mergeCells count="${merges.length}">${merges.join('')}</mergeCells>`;
    });
  }

  // Remove externalReferences from workbook.xml to prevent broken link popup
  wbXml = wbXml.replace(/<externalReferences>[\s\S]*?<\/externalReferences>/, '');
  if (zip.file(wbRelsPath)) {
    let relsXml = await zip.file(wbRelsPath)!.async('string');
    relsXml = relsXml.replace(/<Relationship\b[^>]*Type="[^"]*externalLink"[^>]*\/>/g, '');
    zip.file(wbRelsPath, relsXml);
  }

  zip.file(sheetPath, sheetXml);
  zip.file(ssPath, ssm.buildXml());
  zip.file(wbPath, wbXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 2. XUẤT BIỂU MẪU CẤP ĐỒNG PHỤC (BM_DP01.xlsx)
 * - 1: Người yêu cầu (A4)
 * - 2: Đơn vị (A5)
 * - 3: Phòng/ban người yêu cầu (A6)
 * - 4: Chức vụ người yêu cầu (E6)
 * - 5: Họ tên người nhận, 6: Chức vụ người nhận (Hàng 8 & 9, tự động chèn thêm 2 hàng cho mỗi người nhận tiếp theo)
 * - Bảng nội dung: Người cần cấp - giới tính - chức vụ - tên vật tư - số lượng tương ứng (tự động chèn thêm hàng)
 */
export async function exportUniformFormTemplate(data: UniformFormExportData, templateBuffer?: ArrayBuffer): Promise<Blob> {
  const buf = templateBuffer || (await fetch('/form/BM_DP01.xlsx').then((r) => r.arrayBuffer()));
  const zip = await JSZip.loadAsync(buf);

  const sheetPath = 'xl/worksheets/sheet2.xml';
  const ssPath = 'xl/sharedStrings.xml';
  const wbPath = 'xl/workbook.xml';

  let sheetXml = await zip.file(sheetPath)!.async('string');
  const ssXml = await zip.file(ssPath)!.async('string');
  let wbXml = await zip.file(wbPath)!.async('string');

  const ssm = new SharedStringsManager(ssXml);
  const { dd, mm, yyyy } = formatDateParts();

  const rowMap = new Map<number, string>();
  const rowMatches = [...sheetXml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>[\s\S]*?<\/row>/g)];
  for (const rm of rowMatches) {
    rowMap.set(Number(rm[1]), rm[0]);
  }

  // Row 1: F1 = Đơn vị / Ngày
  if (rowMap.has(1)) {
    rowMap.set(
      1,
      setCellStringInRow(
        rowMap.get(1)!,
        'F',
        1,
        '45',
        ssm.addString(`Đơn vị: ${data.requester_department || data.unit_name}\r\nSố: 01/ĐX-ĐP\r\nNgày: ${dd}/${mm}/${yyyy}`)
      )
    );
  }
  // Row 4: 1 Người yêu cầu
  if (rowMap.has(4)) {
    rowMap.set(4, setCellStringInRow(rowMap.get(4)!, 'A', 4, '49', ssm.addString(`Người đề nghị cấp: ${data.requester_name}`)));
  }
  // Row 5: 2 Đơn vị
  if (rowMap.has(5)) {
    rowMap.set(5, setCellStringInRow(rowMap.get(5)!, 'A', 5, '49', ssm.addString(`Tên Công ty: ${data.unit_name}`)));
  }
  // Row 6: 3 Phòng/ban người yêu cầu & 4 Chức vụ người yêu cầu
  if (rowMap.has(6)) {
    let r6 = setCellStringInRow(rowMap.get(6)!, 'A', 6, '25', ssm.addString(`Đơn vị/Bộ phận trình: ${data.requester_department}`));
    r6 = setCellStringInRow(r6, 'E', 6, '27', ssm.addString(`Chức vụ: ${data.requester_position}`));
    rowMap.set(6, r6);
  }

  const recipients = data.recipients.length > 0
    ? data.recipients
    : [{ full_name: '', gender: 'Nam' as const, position: '', items: [] }];

  const numRecipients = recipients.length;
  const delta1 = 2 * (numRecipients - 1); // Extra rows inserted for recipient headers (2 rows per extra recipient)

  const newRowsXml: string[] = [];
  for (let r = 1; r <= 7; r++) {
    if (rowMap.has(r)) newRowsXml.push(rowMap.get(r)!);
  }

  // Insert 2 rows (like original rows 8 & 9) for each recipient
  for (let k = 0; k < numRecipients; k++) {
    const rec = recipients[k];
    const r1 = 8 + 2 * k;
    const r2 = 9 + 2 * k;
    const sttIdx = ssm.addString(`${k + 1}.`);
    const nameIdx = ssm.addString(`Họ và tên: ${rec.full_name}`);
    const posIdx = ssm.addString(`Chức vụ: ${rec.position}`);
    const contractText = `Căn cứ HĐ số: ${rec.contract_no || '…………………………………………………………..'} ký ngày: ${rec.contract_date || '………………………..'} THACO AGRI`;
    const contractIdx = ssm.addString(contractText);

    newRowsXml.push(
      `<row r="${r1}" spans="1:10" s="23" customFormat="1" ht="15" x14ac:dyDescent="0.4"><c r="A${r1}" s="31" t="s"><v>${sttIdx}</v></c><c r="B${r1}" s="32" t="s"><v>${nameIdx}</v></c><c r="C${r1}" s="32"/><c r="D${r1}" s="32"/><c r="E${r1}" s="32" t="s"><v>${posIdx}</v></c><c r="F${r1}" s="32"/><c r="G${r1}" s="32"/></row>`
    );
    newRowsXml.push(
      `<row r="${r2}" spans="1:10" x14ac:dyDescent="0.45"><c r="A${r2}" s="33" t="s"><v>${contractIdx}</v></c><c r="B${r2}" s="34"/><c r="C${r2}" s="34"/><c r="D${r2}" s="34"/><c r="E${r2}" s="34"/><c r="F${r2}" s="34"/><c r="G${r2}" s="34"/></row>`
    );
  }

  // Shift original rows 10, 11, 12 by delta1
  for (const origR of [10, 11, 12]) {
    if (rowMap.has(origR)) {
      newRowsXml.push(shiftRowXml(rowMap.get(origR)!, origR + delta1));
    }
  }

  // Table rows for recipients (starting at 13 + delta1)
  const tableRowsCount = Math.max(2, numRecipients);
  const delta2 = tableRowsCount - 2;
  const totalDelta = delta1 + delta2;

  for (let k = 0; k < tableRowsCount; k++) {
    const r = 13 + delta1 + k;
    const rec = recipients[k];
    if (rec && rec.full_name.trim() !== '') {
      let qtySoMi = 0;
      let qtyAoKhoac = 0;
      let qtyBHLD = 0;
      const itemNotes: string[] = [];
      if (rec.position) itemNotes.push(rec.position);

      for (const it of rec.items) {
        const q = Number(it.qty) || 0;
        if (q <= 0) continue;
        const lower = (it.item_name || '').toLowerCase();
        if (it.uniform_type === 'AO_SO_MI' || lower.includes('sơ mi')) {
          qtySoMi += q;
        } else if (it.uniform_type === 'AO_KHOAC' || lower.includes('áo khoác') || lower.includes('khoác')) {
          qtyAoKhoac += q;
        } else if (it.uniform_type === 'BAO_HO_LAO_DONG' || lower.includes('bảo hộ')) {
          qtyBHLD += q;
        } else {
          qtySoMi += q;
        }
        itemNotes.push(`${it.item_name} (${q})${it.note ? ' - ' + it.note : ''}`);
      }

      const nameIdx = ssm.addString(rec.full_name);
      const genderIdx = ssm.addString(rec.gender || 'Nam');
      const noteIdx = ssm.addString(itemNotes.join('; '));

      const cellD = qtySoMi > 0 ? `<c r="D${r}" s="36"><v>${qtySoMi}</v></c>` : `<c r="D${r}" s="36"/>`;
      const cellE = qtyAoKhoac > 0 ? `<c r="E${r}" s="36"><v>${qtyAoKhoac}</v></c>` : `<c r="E${r}" s="36"/>`;
      const cellF = qtyBHLD > 0 ? `<c r="F${r}" s="36"><v>${qtyBHLD}</v></c>` : `<c r="F${r}" s="36"/>`;

      newRowsXml.push(
        `<row r="${r}" spans="1:10" x14ac:dyDescent="0.45"><c r="A${r}" s="35"><v>${k + 1}</v></c><c r="B${r}" s="36" t="s"><v>${nameIdx}</v></c><c r="C${r}" s="35" t="s"><v>${genderIdx}</v></c>${cellD}${cellE}${cellF}<c r="G${r}" s="36" t="s"><v>${noteIdx}</v></c></row>`
      );
    } else {
      newRowsXml.push(
        `<row r="${r}" spans="1:10" x14ac:dyDescent="0.45"><c r="A${r}" s="35"><v>${k + 1}</v></c><c r="B${r}" s="36"/><c r="C${r}" s="35"/><c r="D${r}" s="36"/><c r="E${r}" s="36"/><c r="F${r}" s="36"/><c r="G${r}" s="36"/></row>`
      );
    }
  }

  // Shift footer rows >= 15 by totalDelta
  const footerOrigRows = [...rowMap.keys()].filter((r) => r >= 15).sort((a, b) => a - b);
  for (const origR of footerOrigRows) {
    const newR = origR + totalDelta;
    let shifted = shiftRowXml(rowMap.get(origR)!, newR);
    if (origR === 15) {
      shifted = setCellStringInRow(shifted, 'A', newR, '51', ssm.addString(`ĐƠN VỊ CHỊU CHI PHÍ: ${data.unit_name}`));
    }
    newRowsXml.push(shifted);
  }

  sheetXml = sheetXml.replace(/<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${newRowsXml.join('')}</sheetData>`);

  // Shift mergeCells with row >= 15 by totalDelta
  if (totalDelta > 0) {
    sheetXml = sheetXml.replace(/<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/g, (full, c1, r1, c2, r2) => {
      const n1 = Number(r1);
      const n2 = Number(r2);
      if (n1 >= 15) {
        return `<mergeCell ref="${c1}${n1 + totalDelta}:${c2}${n2 + totalDelta}"/>`;
      }
      return full;
    });
    sheetXml = sheetXml.replace(/<dimension ref="A1:J\d+"\/>/, `<dimension ref="A1:J${30 + totalDelta}"/>`);
    wbXml = wbXml.replace(/\$A\$1:\$G\$\d+/, `$A$1:$G$${30 + totalDelta}`);
  }

  zip.file(sheetPath, sheetXml);
  zip.file(ssPath, ssm.buildXml());
  zip.file(wbPath, wbXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 3. XUẤT BIỂU MẪU CẤP MÁY TÍNH / LAPTOP (BM_MT01.docx)
 * - 1: Người làm đề nghị
 * - 2: Phòng/ban người đề nghị
 * - 3: Khối
 * - 4: Đơn vị
 * - 5, 6, 7: Ngày tháng năm hiện tại
 * - 8: Tick Máy tính để bàn, 9: Tick Laptop
 * - 10: Tên người sử dụng
 * - 11: Chức vụ
 * - 12: Ban/phòng người sử dụng
 * - 13: Bộ phận
 * - 14: Ngày nhận việc
 * - 15: Mục đích sử dụng
 */
export async function exportComputerFormTemplate(data: ComputerFormExportData, templateBuffer?: ArrayBuffer): Promise<Blob> {
  const buf = templateBuffer || (await fetch('/form/BM_MT01.docx').then((r) => r.arrayBuffer()));
  const zip = await JSZip.loadAsync(buf);

  const docPath = 'word/document.xml';
  let docXml = await zip.file(docPath)!.async('string');

  const { dd, mm, yyyy } = formatDateParts();
  const isPC = data.equipment_choice === 'PC';

  // Format onboarding date to dd/mm/yyyy if in YYYY-MM-DD format
  let onboardingFormatted = data.user_onboarding_date || `${dd}/${mm}/${yyyy}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(onboardingFormatted)) {
    const [y, m, d] = onboardingFormatted.split('-');
    onboardingFormatted = `${d}/${m}/${y}`;
  }

  const paras = [...docXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)];

  const replacePlaceholderInPara = (paraXml: string, placeholder: string, newVal: string): string => {
    const regex = new RegExp(`(<w:r\\b[^>]*w:rsidR="009F1B8B"[^>]*>[\\s\\S]*?<w:t[^>]*>)${placeholder}(<\\/w:t>[\\s\\S]*?<\\/w:r>)`);
    return paraXml.replace(regex, `$1${escapeXml(newVal)}$2`);
  };

  if (paras.length > 17) {
    let p4 = replacePlaceholderInPara(paras[4][0], '1', data.requester_name);
    let p5 = replacePlaceholderInPara(paras[5][0], '2', data.requester_department);
    let p6 = replacePlaceholderInPara(paras[6][0], '3', data.requester_block || '');
    let p7 = replacePlaceholderInPara(paras[7][0], '4', data.unit_name);

    let p8 = replacePlaceholderInPara(paras[8][0], '5', dd);
    p8 = replacePlaceholderInPara(p8, '6', mm);
    p8 = replacePlaceholderInPara(p8, '7', yyyy);

    // P10: 8 (Máy tính để bàn) & 9 (Máy tính xách tay)
    let p10 = paras[10][0];
    // Replace 8 and 9 with visible tick mark or blank + update Word FORMCHECKBOX default state
    p10 = replacePlaceholderInPara(p10, '8', isPC ? '☑ ' : '☐ ');
    p10 = replacePlaceholderInPara(p10, '9', !isPC ? '☑ ' : '☐ ');

    let checkIdx = 0;
    p10 = p10.replace(/<w:checkBox>[\s\S]*?<\/w:checkBox>/g, () => {
      checkIdx += 1;
      const shouldCheck = (checkIdx === 1 && isPC) || (checkIdx === 2 && !isPC);
      return `<w:checkBox><w:sizeAuto/><w:default w:val="${shouldCheck ? '1' : '0'}"/>${shouldCheck ? '<w:checked/>' : ''}</w:checkBox>`;
    });

    // P11: uncheck "Thiết bị khác"
    const p11 = paras[11][0].replace(
      /<w:checkBox>[\s\S]*?<\/w:checkBox>/g,
      '<w:checkBox><w:sizeAuto/><w:default w:val="0"/></w:checkBox>'
    );

    // P12: 10 (Người sử dụng) & 11 (Chức vụ)
    let p12 = replacePlaceholderInPara(paras[12][0], '10', data.user_full_name);
    const padSpaces = ' '.repeat(Math.max(4, 35 - (data.user_full_name || '').length));
    p12 = p12.replace(/<w:t xml:space="preserve">\s{15,}<\/w:t>/, `<w:t xml:space="preserve">${padSpaces}</w:t>`);
    p12 = replacePlaceholderInPara(p12, '11', data.user_position);

    const p13 = replacePlaceholderInPara(paras[13][0], '12', data.user_department);
    const p14 = replacePlaceholderInPara(paras[14][0], '13', data.user_section);
    const p16 = replacePlaceholderInPara(paras[16][0], '14', onboardingFormatted);
    const p17 = replacePlaceholderInPara(paras[17][0], '15', data.user_purpose);

    docXml = docXml
      .replace(paras[4][0], p4)
      .replace(paras[5][0], p5)
      .replace(paras[6][0], p6)
      .replace(paras[7][0], p7)
      .replace(paras[8][0], p8)
      .replace(paras[10][0], p10)
      .replace(paras[11][0], p11)
      .replace(paras[12][0], p12)
      .replace(paras[13][0], p13)
      .replace(paras[14][0], p14)
      .replace(paras[16][0], p16)
      .replace(paras[17][0], p17);
  }

  zip.file(docPath, docXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * 4. XUẤT BIỂU MẪU CẤP THIẾT BỊ CNTT (BM_CNTT01.xlsx)
 * - 1: Người đề xuất (A4)
 * - 2: Chức vụ / Bộ phận người đề xuất (F4)
 * - 3: Mục đích sử dụng (A5 & cột G:H)
 * - 4, 5, 6: Ngày tháng năm hiện tại (F11)
 * - + Loại mặt hàng đề xuất - số lượng - người chịu trách nhiệm (Row 8+)
 */
export async function exportCNTTFormTemplate(data: CNTTFormExportData, templateBuffer?: ArrayBuffer): Promise<Blob> {
  const buf = templateBuffer || (await fetch('/form/BM_CNTT01.xlsx').then((r) => r.arrayBuffer()));
  const zip = await JSZip.loadAsync(buf);

  const sheetPath = 'xl/worksheets/sheet1.xml';
  const ssPath = 'xl/sharedStrings.xml';

  let sheetXml = await zip.file(sheetPath)!.async('string');
  const ssXml = await zip.file(ssPath)!.async('string');

  const ssm = new SharedStringsManager(ssXml);
  const { dd, mm, yyyy } = formatDateParts();

  const rowMap = new Map<number, string>();
  const rowMatches = [...sheetXml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>[\s\S]*?<\/row>/g)];
  for (const rm of rowMatches) {
    rowMap.set(Number(rm[1]), rm[0]);
  }

  // Row 4: A4 = Người đề nghị: 1, F4 = Bộ phận: 2
  if (rowMap.has(4)) {
    let r4 = setCellStringInRow(rowMap.get(4)!, 'A', 4, '19', ssm.addString(`Người đề nghị: ${data.requester_name}`));
    r4 = setCellStringInRow(r4, 'F', 4, '19', ssm.addString(`Bộ phận: ${data.requester_position}`));
    rowMap.set(4, r4);
  }

  // Row 5: A5 = Đề nghị Ban lãnh đạo duyệt mua một số vật tư sau: 3
  if (rowMap.has(5)) {
    rowMap.set(
      5,
      setCellStringInRow(
        rowMap.get(5)!,
        'A',
        5,
        '19',
        ssm.addString(`Đề nghị Ban lãnh đạo duyệt mua một số vật tư sau: ${data.purpose}`)
      )
    );
  }

  const validItems = data.items.length > 0
    ? data.items
    : [{ item_name: '', specifications: '', unit_of_measure: 'Cái', qty_requested: 1, recipient_name: '' }];

  const itemCount = validItems.length;
  const delta = itemCount - 1;

  const newRowsXml: string[] = [];
  for (let r = 1; r <= 7; r++) {
    if (rowMap.has(r)) newRowsXml.push(rowMap.get(r)!);
  }

  for (let i = 0; i < itemCount; i++) {
    const r = 8 + i;
    const it = validItems[i];
    const nameIdx = ssm.addString(it.item_name);
    const specIdx = ssm.addString(it.specifications || '');
    const uomIdx = ssm.addString(it.unit_of_measure || 'Cái');
    const purposeIdx = ssm.addString(data.purpose || '');
    const respIdx = ssm.addString(it.recipient_name || '');
    const qty = Number(it.qty_requested) || 1;

    newRowsXml.push(
      `<row r="${r}" spans="1:9" ht="35.25" customHeight="1" x14ac:dyDescent="0.45"><c r="A${r}" s="7"><v>${i + 1}</v></c><c r="B${r}" s="22" t="s"><v>${nameIdx}</v></c><c r="C${r}" s="23"/><c r="D${r}" s="8" t="s"><v>${specIdx}</v></c><c r="E${r}" s="7" t="s"><v>${uomIdx}</v></c><c r="F${r}" s="7"><v>${qty}</v></c><c r="G${r}" s="24" t="s"><v>${purposeIdx}</v></c><c r="H${r}" s="25"/><c r="I${r}" s="9" t="s"><v>${respIdx}</v></c></row>`
    );
  }

  // Shift rows >= 9 by delta
  const footerOrigRows = [...rowMap.keys()].filter((r) => r >= 9).sort((a, b) => a - b);
  for (const origR of footerOrigRows) {
    const newR = origR + delta;
    let shifted = shiftRowXml(rowMap.get(origR)!, newR);
    if (origR === 11) {
      shifted = setCellStringInRow(
        shifted,
        'F',
        newR,
        '17',
        ssm.addString(`Gia Lai, ngày ${dd} tháng ${mm} năm ${yyyy}`)
      );
    }
    newRowsXml.push(shifted);
  }

  sheetXml = sheetXml.replace(/<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${newRowsXml.join('')}</sheetData>`);

  // Update mergeCells if delta > 0
  if (delta > 0) {
    sheetXml = sheetXml.replace(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/, (_m, inner) => {
      const shiftedInner = inner.replace(/<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/g, (full: string, c1: string, r1: string, c2: string, r2: string) => {
        const n1 = Number(r1);
        const n2 = Number(r2);
        if (n1 >= 9) {
          return `<mergeCell ref="${c1}${n1 + delta}:${c2}${n2 + delta}"/>`;
        }
        return full;
      });
      const extraItemMerges: string[] = [];
      for (let i = 1; i < itemCount; i++) {
        const r = 8 + i;
        extraItemMerges.push(`<mergeCell ref="B${r}:C${r}"/>`, `<mergeCell ref="G${r}:H${r}"/>`);
      }
      const combined = shiftedInner + extraItemMerges.join('');
      const count = (combined.match(/<mergeCell\b/g) || []).length;
      return `<mergeCells count="${count}">${combined}</mergeCells>`;
    });
    sheetXml = sheetXml.replace(/<dimension ref="A1:I\d+"\/>/, `<dimension ref="A1:I${17 + delta}"/>`);
  }

  zip.file(sheetPath, sheetXml);
  zip.file(ssPath, ssm.buildXml());

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function downloadVPPForm(data: VPPFormExportData) {
  const blob = await exportVPPFormTemplate(data);
  triggerBlobDownload(blob, `BM_VPP01_De_xuat_VPP_${Date.now().toString().slice(-4)}.xlsx`);
}

export async function downloadUniformForm(data: UniformFormExportData) {
  const blob = await exportUniformFormTemplate(data);
  triggerBlobDownload(blob, `BM_DP01_De_xuat_Dong_phuc_${Date.now().toString().slice(-4)}.xlsx`);
}

export async function downloadComputerForm(data: ComputerFormExportData) {
  const blob = await exportComputerFormTemplate(data);
  triggerBlobDownload(blob, `BM_MT01_De_xuat_May_tinh_${Date.now().toString().slice(-4)}.docx`);
}

export async function downloadCNTTForm(data: CNTTFormExportData) {
  const blob = await exportCNTTFormTemplate(data);
  triggerBlobDownload(blob, `BM_CNTT01_De_xuat_Thiet_bi_CNTT_${Date.now().toString().slice(-4)}.xlsx`);
}
