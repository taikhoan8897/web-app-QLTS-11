import JSZip from 'jszip';

function escapeXml(unsafe: string): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wTitle(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:color w:val="065F46"/>
        <w:sz w:val="36"/>
        <w:szCs w:val="36"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wSubtitle(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="60" w:after="240"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:color w:val="1E293B"/>
        <w:sz w:val="26"/>
        <w:szCs w:val="26"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wH1(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="280" w:after="120"/>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="6" w:space="4" w:color="059669"/>
      </w:pBdr>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:color w:val="065F46"/>
        <w:sz w:val="28"/>
        <w:szCs w:val="28"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wH2(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="200" w:after="80"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:color w:val="0F172A"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wH3(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="140" w:after="60"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:color w:val="1E3A8A"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wPara(text: string, bold = false): string {
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="60" w:after="80"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        ${bold ? '<w:b/>' : ''}
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
      <w:t xml:space="preserve">${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wBullet(text: string): string {
  return `<w:p>
    <w:pPr>
      <w:ind w:left="360" w:hanging="180"/>
      <w:spacing w:before="40" w:after="40"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
      <w:t xml:space="preserve">• ${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function wTable(headers: string[], rows: string[][]): string {
  const headerCells = headers
    .map(
      (h) => `<w:tc>
        <w:tcPr>
          <w:shd w:val="clear" w:color="auto" w:fill="065F46"/>
        </w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
            <w:t>${escapeXml(h)}</w:t>
          </w:r>
        </w:p>
      </w:tc>`
    )
    .join('');

  const bodyRows = rows
    .map(
      (r) => `<w:tr>
        ${r
          .map(
            (cell) => `<w:tc>
              <w:p>
                <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
                <w:r>
                  <w:rPr><w:sz w:val="20"/></w:rPr>
                  <w:t xml:space="preserve">${escapeXml(cell)}</w:t>
                </w:r>
              </w:p>
            </w:tc>`
          )
          .join('')}
      </w:tr>`
    )
    .join('');

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tr>${headerCells}</w:tr>
    ${bodyRows}
  </w:tbl>`;
}

export async function exportSystemAnalysisDocx(): Promise<void> {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const bodyParts: string[] = [
    wTitle('TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ VÀ ĐẶC TẢ YÊU CẦU HỆ THỐNG'),
    wSubtitle('QUẢN LÝ TÀI SẢN, DỊCH VỤ HOẠT ĐỘNG & THU MUA - THACO AGRI (BẢN CẬP NHẬT ĐẦY ĐỦ)'),
    wPara('Đơn vị áp dụng: Tổng Công ty Nông nghiệp THACO (THACO AGRI) và các Khu Liên Hợp trực thuộc.'),

    // MỤC 1
    wH1('1. TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG'),
    wH2('1.1. Bối cảnh'),
    wPara(
      'Hệ thống phục vụ quản lý tập trung tài sản có định danh (theo dõi từng thiết bị, Hãng sản xuất, Dòng máy, Cấu hình chi tiết, Serial, QR), vật tư tiêu hao, chi phí dịch vụ hoạt động, kho các đơn vị, phiếu đề xuất cấp phát từ cán bộ nhân viên (CBNV) theo 4 biểu mẫu chuẩn, ticket sự cố kỹ thuật, nhu cầu gom đơn hàng thu mua (PO) và hệ thống 4 báo cáo quản trị chi phí trọng tâm.'
    ),
    wH2('1.2. Mục tiêu'),
    wBullet('Quản lý thống nhất cơ cấu tổ chức 3 bảng quan hệ: Đơn vị (OrganizationUnits) ➔ Phòng ban (Departments) ➔ Nhân viên (Employees) kèm Chức vụ và Vai trò phân quyền RBAC.'),
    wBullet('Phân tách rõ ràng giữa Tài sản định danh (có Hãng, Dòng máy, Cấu hình, Serial, QR), Vật tư tiêu hao (theo dõi số lượng tồn & ngưỡng cảnh báo) và Chi phí dịch vụ hoạt động.'),
    wBullet('Cấu hình Cây Danh Mục Chi Phí 3 tầng tại chức năng Cấu hình & Quản trị Hệ thống gồm 2 khối chuẩn: 1. CHI PHÍ VẬN HÀNH & CÔNG TÁC (CPVH) và 2. CHI PHÍ GIAO TẾ & PHÚC LỢI (CPPL).'),
    wBullet('Chuẩn hóa quy trình Tạo đề xuất cấp phát mới với 4 biểu mẫu động (BM_VPP01.xlsx, BM_DP01.xlsx, BM_MT01.docx, BM_CNTT01.xlsx) tự động xuất file điền đúng vị trí biểu mẫu gốc.'),
    wBullet('Hỗ trợ chỉnh sửa (Edit) trực tiếp phiếu đề xuất cấp phát và ticket sự cố bảo trì đã tạo khi đang ở giai đoạn cho phép.'),
    wBullet('Cung cấp 4 báo cáo quản trị chi phí lọc theo thời gian (Từ ngày - Đến ngày) và kết xuất Excel (.xlsx).'),

    // MỤC 2
    wH1('2. PHẠM VI CHỨC NĂNG'),
    wTable(
      ['Mã', 'Phân hệ', 'Chức năng chính', 'Kết quả nghiệp vụ'],
      [
        [
          'M1',
          'Danh mục & Cấu hình hệ thống',
          'Cây Danh mục Chi phí Dịch vụ (1. CPVH & 2. CPPL); Danh mục hàng hóa (kèm cấu hình Hãng & Cấu hình chuẩn cho tài sản định danh); Đơn vị; Phòng ban; Nhân viên; Nhà cung cấp; Kho lưu trữ.',
          'Dữ liệu nền chuẩn hóa, ràng buộc khóa ngoại chặt chẽ giữa Đơn vị - Phòng ban - Nhân viên và cấu hình Hãng/Model.',
        ],
        [
          'M2',
          'Kho trung tâm & Quản lý tài sản',
          'Nhập kho tiêu hao; Khai báo định danh tài sản từ PO (chọn Hãng, Model, Cấu hình, Serial, QR); Cấp phát; Thu hồi; Thanh lý; Bảng tồn kho hiển thị rõ Hãng & Cấu hình.',
          'Biết chính xác tài sản/vật tư đang ở kho nào, thuộc Hãng/Cấu hình gì, ai đang sử dụng.',
        ],
        [
          'M3',
          'Đề xuất cấp phát (4 biểu mẫu động)',
          'Tạo/Sửa đề xuất cấp phát theo 4 loại: Văn phòng phẩm (BM_VPP01), Đồng phục (BM_DP01), Máy tính/Laptop (BM_MT01), Thiết bị CNTT (BM_CNTT01); Xuất file tự động điền đúng vị trí; Thủ kho tiếp nhận/cấp phát/chuyển gom PO.',
          'Phiếu đề xuất hiển thị đúng tên người đề xuất/người nhận theo từng loại và xuất đúng biểu mẫu trình ký.',
        ],
        [
          'M4',
          'Ticket IT & Bảo trì',
          'Tạo/Sửa ticket sự cố; Kỹ thuật tiếp nhận và đề xuất 3 kịch bản (Sửa tại chỗ, Sửa chữa/Thay thế, Thu hồi cấp mới); Đính kèm tờ trình ký duyệt và tự động sinh yêu cầu cấp phát/gom PO.',
          'Quản lý vòng đời xử lý sự cố kỹ thuật và chi phí bảo trì theo thiết bị.',
        ],
        [
          'M5',
          'Đơn hàng thu mua (Gom PO Hub)',
          'Gom nhu cầu mua sắm tách biệt Định danh và Tiêu hao; Chọn Hãng & Cấu hình khi đặt mua hàng định danh; Xử lý giao đủ hoặc giao thiếu (sinh PO con).',
          'Theo dõi xuyên suốt từ nhu cầu đến PO, giá mua thực tế, nhà cung cấp và nhập kho.',
        ],
        [
          'M6',
          'Chi phí dịch vụ hoạt động',
          'Ghi nhận và quản lý phiếu chi phí dịch vụ theo Cây Danh Mục Chi Phí (Khối 1. CPVH và 2. CPPL), gắn Nhà cung cấp và Đơn vị chịu chi phí.',
          'Kiểm soát toàn diện chi phí dịch vụ bên cạnh chi phí mua sắm tài sản/vật tư.',
        ],
        [
          'M7',
          'Báo cáo quản trị & Xuất Excel',
          '4 Báo cáo lọc theo thời gian: (1) Chi phí theo nhóm danh mục (1a Tiêu hao, 1b Định danh, 1c Dịch vụ lọc theo Khối & Nhóm chi phí), (2) Theo Nhà cung cấp, (3) Theo Tên thiết bị, (4) Theo Đơn vị.',
          'Tổng hợp chi phí chính xác theo kỳ và kết xuất báo cáo Excel (.xlsx).',
        ],
      ]
    ),

    // MỤC 3
    wH1('3. ĐỐI TƯỢNG SỬ DỤNG VÀ PHÂN QUYỀN (RBAC)'),
    wTable(
      ['Vai trò', 'Quyền và nghiệp vụ chính', 'Giới hạn phân quyền'],
      [
        [
          'CBNV',
          'Xem Tài sản của tôi; Tạo và Sửa đề xuất cấp phát (khi ở trạng thái Nháp/Chờ tiếp nhận); Xuất 4 biểu mẫu đề xuất; Tạo và Sửa ticket sự cố IT; Đính kèm file trình ký.',
          'Không tự duyệt cấp phát, không truy cập cấu hình hệ thống hoặc kho trung tâm.',
        ],
        [
          'THU_KHO (Thủ kho)',
          'Dashboard kho; Nhập kho tiêu hao; Định danh thiết bị (chọn Hãng, Model, Cấu hình, Serial); Tiếp nhận/Từ chối/Cấp phát đề xuất; Thu hồi; Thanh lý; Điều chuyển kho; Chuyển thiếu sang Gom PO.',
          'Thao tác trong phạm vi kho được phân công.',
        ],
        [
          'THU_MUA (Thu mua)',
          'Gom nhu cầu tạo PO (Định danh / Tiêu hao); Chọn Hãng & Cấu hình đặt mua; Cập nhật đơn giá thực tế và Nhà cung cấp; Quản lý Chi phí dịch vụ; Xem báo cáo.',
          'Không trực tiếp xuất kho hoặc sửa người giữ tài sản.',
        ],
        [
          'KY_THUAT (Kỹ thuật IT)',
          'Tiếp nhận ticket sự cố; Chẩn đoán và lập phương án theo 3 kịch bản; Sửa thông tin ticket; Tra cứu báo cáo kỹ thuật.',
          'Chỉ đề xuất phương án kỹ thuật, không tự chốt xuất kho hoặc tạo PO trực tiếp.',
        ],
        [
          'QUAN_TRI (Quản trị hệ thống)',
          'Quản trị toàn bộ 11 tab Cấu hình Hệ thống: Cây Danh Mục Chi Phí, Nhân viên, Phòng ban, Đơn vị, Nhà cung cấp, Danh mục hàng hóa, Kho, Phân quyền RBAC, SQL Server 2022, Sổ Kiểm toán.',
          'Mọi thao tác cấu hình đều được ghi vết vào AuditLogs.',
        ],
      ]
    ),

    // MỤC 4
    wH1('4. CẬP NHẬT ĐẶC TẢ CHI TIẾT CÁC CHỨC NĂNG TRỌNG TÂM'),

    wH2('4.1. Tài sản định danh: Quản lý Hãng sản xuất, Dòng máy & Cấu hình chi tiết'),
    wBullet('Ở góc độ Người dùng (CBNV): Khi tạo đề xuất cấp phát (ví dụ: xin cấp Laptop hoặc Máy tính bàn), người dùng chỉ cần chọn chủng loại hàng hóa chung (Laptop / Máy tính bàn) mà không bắt buộc phải am hiểu thông số kỹ thuật chi tiết.'),
    wBullet('Ở góc độ Danh mục hàng hóa (Categories): Mỗi danh mục tài sản định danh hỗ trợ khai báo danh sách cấu hình theo Hãng (brand_configs) gồm: Hãng sản xuất (Dell, HP, Lenovo, Apple, Asus, Canon...), Tên dòng máy (Model) và Cấu hình kỹ thuật (CPU, RAM, SSD, Màn hình...).'),
    wBullet('Ở góc độ Thu mua (PO) & Kho (Assets): Khi lập PO mua sắm, khi khai báo định danh nhập kho, trên bảng hiển thị tồn kho và khi Thủ kho chọn thiết bị để cấp phát cho CBNV, hệ thống đều hiển thị và lọc rõ ràng Hãng sản xuất, Dòng máy và Cấu hình chi tiết của từng thiết bị.'),

    wH2('4.2. Tạo đề xuất cấp phát mới với 4 Biểu mẫu động (/public/form/)'),
    wPara('Khi người dùng chọn 1 trong 4 loại yêu cầu cấp phát, giao diện tự động hiển thị form nhập liệu chuyên biệt tương ứng và hỗ trợ xuất file điền tự động vào đúng vị trí trong biểu mẫu gốc tại thư mục /public/form/:'),

    wH3('1) Đề xuất cấp Văn phòng phẩm (Biểu mẫu BM_VPP01.xlsx)'),
    wBullet('Tên hiển thị trên danh sách yêu cầu phần mềm: Tên người đề xuất.'),
    wBullet('Thông tin nhập trên form: Mục đích đề xuất; Danh sách mặt hàng cần đề xuất (có thể thêm nhiều dòng, danh sách mặt hàng tự động lọc chỉ hiển thị nhóm Văn phòng phẩm & vật tư) và Số lượng.'),
    wBullet('Thông tin tự động điền khi xuất file BM_VPP01.xlsx: Người yêu cầu – Chức vụ, Phòng ban, Mục đích sử dụng, và bảng chi tiết Tên mặt hàng + Đơn vị tính + Số lượng + Ghi chú.'),

    wH3('2) Đề xuất cấp Đồng phục (Biểu mẫu BM_DP01.xlsx)'),
    wBullet('Tên hiển thị trên danh sách yêu cầu phần mềm: Tên người nhận (người được đề xuất cấp).'),
    wBullet('Thông tin nhập trên form: Danh sách người cần cấp (có thể thêm nhiều người nhận: Họ tên, Giới tính, Chức vụ) và danh sách đồng phục cần cấp (Tên vật tư đồng phục, Số lượng) đi theo từng người nhận.'),
    wBullet('Thông tin tự động điền khi xuất file BM_DP01.xlsx: Người yêu cầu, Đơn vị, Phòng/ban người yêu cầu, Chức vụ người yêu cầu, Họ tên người nhận & Chức vụ người nhận (nếu có nhiều hơn 1 người nhận hệ thống tự động chèn thêm các cặp dòng tương ứng), cùng bảng chi tiết Người cần cấp – Giới tính – Chức vụ – Tên vật tư – Số lượng (tự động chèn thêm hàng khi có nhiều dòng).'),

    wH3('3) Đề xuất cấp Máy tính / Laptop (Biểu mẫu BM_MT01.docx)'),
    wBullet('Tên hiển thị trên danh sách yêu cầu phần mềm: Tên người cần cấp (người sử dụng).'),
    wBullet('Thông tin nhập trên form: Chọn loại thiết bị (Máy tính bàn hoặc Laptop), Họ tên người sử dụng, Chức vụ, Ban/Phòng, Bộ phận, Ngày nhận việc, Mục đích sử dụng. Không cần bảng chọn danh mục mặt hàng thủ công (hệ thống mặc định tự động gán mặt hàng là Máy tính để bàn hoặc Laptop theo lựa chọn của người dùng).'),
    wBullet('Thông tin tự động điền khi xuất file Word BM_MT01.docx: Người làm đề nghị, Phòng/ban người đề nghị, Đơn vị, Ngày/tháng/năm hiện tại, Tick chọn Máy tính bàn hoặc Laptop, Tên người sử dụng, Chức vụ, Ban/Phòng người sử dụng, Bộ phận, Ngày nhận việc, Mục đích sử dụng.'),

    wH3('4) Đề xuất cấp Thiết bị CNTT (Biểu mẫu BM_CNTT01.xlsx)'),
    wBullet('Tên hiển thị trên danh sách yêu cầu phần mềm: Tên người chịu trách nhiệm (người sử dụng).'),
    wBullet('Thông tin nhập trên form: Mục đích sử dụng, Người chịu trách nhiệm/bàn giao, Danh sách mặt hàng cần đề xuất & Số lượng (có thể thêm nhiều hàng, chỉ hiển thị các vật tư liên quan đến Thiết bị CNTT).'),
    wBullet('Thông tin tự động điền khi xuất file BM_CNTT01.xlsx: Người đề xuất, Chức vụ người đề xuất, Mục đích sử dụng, Ngày/tháng/năm hiện tại, và bảng chi tiết Loại mặt hàng đề xuất – Số lượng – Người chịu trách nhiệm.'),

    wH2('4.3. Chức năng Chỉnh sửa (Edit) Đề xuất cấp phát & Ticket sự cố đã tạo'),
    wBullet('Tại màn hình Đề xuất cấp phát: Người dùng có thể bấm nút "Sửa" trên các phiếu đang ở trạng thái Nháp (NHAP) hoặc Chờ tiếp nhận (CHO_TIEP_NHAN) để cập nhật lại thông tin biểu mẫu, danh sách mặt hàng, số lượng hoặc đính kèm bổ sung file trình ký.'),
    wBullet('Tại màn hình Sự cố IT & Bảo trì: Người tạo hoặc Kỹ thuật viên có thể bấm nút "Sửa" trên ticket đã tạo (trạng thái Mới / Đang xử lý) để cập nhật loại sự cố, mức độ ưu tiên, thiết bị liên kết, mô tả chi tiết và tệp đính kèm.'),

    wH2('4.4. Cấu hình Cây Danh Mục Chi Phí Dịch Vụ tại Quản trị Hệ thống'),
    wBullet('Vị trí chức năng: Đặt tại menu "Cấu Hình & Quản Trị Hệ Thống" ➔ Tab số 1: "1. Cây Danh Mục Chi Phí".'),
    wBullet('Cấu trúc phân cấp chuẩn 3 tầng gồm 2 Khối chi phí đánh số 1 và 2:'),
    wBullet('Khối 1: "1. CHI PHÍ VẬN HÀNH & CÔNG TÁC" (Mã gốc: CPVH) — Bao gồm các nhóm: Di chuyển, lưu trú (CPVH-CT-MS); Ăn uống, hội nghị (CPVH-CT-TK); Bảo trì & Sửa chữa (CPVH-VP-SUA); Thuê ngoài (CPVH-VP-THU); Viễn thông & Chuyển phát (CPVH-VP-VT); Môi trường & Tiện ích (CPVH-VP-MT); Điện nước sinh hoạt (CPVH-NL-SH); Xăng dầu (CPVH-NL-XE); Phí xe & Phí hành chính (CPVH-XE).'),
    wBullet('Khối 2: "2. CHI PHÍ GIAO TẾ & PHÚC LỢI" (Mã gốc: CPPL) — Bao gồm các nhóm: Phúc lợi Nội bộ CB-NV (CPPL-NV); Giao tế Đối ngoại (CPPL-KH).'),

    wH2('4.5. Hệ thống 4 Báo cáo Quản trị (Tất cả đều lọc theo thời gian & xuất Excel)'),
    wTable(
      ['STT', 'Tên báo cáo', 'Bộ lọc & Phân nhánh chi tiết', 'Chỉ tiêu kết xuất chính'],
      [
        [
          '1',
          'Báo cáo 1: Chi phí theo nhóm danh mục',
          'Lọc theo khoảng thời gian (Từ ngày - Đến ngày), Đơn vị và chọn 1 trong 3 phân nhánh:\n- 1a. Tài sản tiêu hao\n- 1b. Tài sản định danh\n- 1c. Dịch vụ (Lọc sâu theo Khối chi phí: 1. CPVH / 2. CPPL và theo Nhóm chi phí)',
          'Mã danh mục, Tên mặt hàng/dịch vụ, Nhóm/Khối chi phí, Số lượng, Đơn giá, Tổng thành tiền (VNĐ), Tỷ trọng (%).',
        ],
        [
          '2',
          'Báo cáo 2: Chi phí theo Nhà cung cấp',
          'Lọc theo khoảng thời gian (Từ ngày - Đến ngày), Nhà cung cấp, Loại nguồn chi phí (PO mua sắm / Chi phí dịch vụ).',
          'Mã NCC, Tên Nhà cung cấp, Số lượng PO / Phiếu chi dịch vụ, Giá trị mua sắm tài sản/vật tư, Giá trị dịch vụ, Tổng chi phí thanh toán.',
        ],
        [
          '3',
          'Báo cáo 3: Chi phí theo Tên thiết bị',
          'Lọc theo khoảng thời gian (Từ ngày - Đến ngày), Nhóm thiết bị, Hãng sản xuất, Tên thiết bị.',
          'Mã thiết bị/danh mục, Tên thiết bị, Hãng & Cấu hình, Số lượng mua mới/bảo trì, Đơn giá thực tế, Tổng chi phí đầu tư.',
        ],
        [
          '4',
          'Báo cáo 4: Chi phí theo Đơn vị',
          'Lọc theo khoảng thời gian (Từ ngày - Đến ngày), Đơn vị pháp nhân / Khu liên hợp.',
          'Mã đơn vị, Tên đơn vị, Chi phí Tài sản tiêu hao, Chi phí Tài sản định danh, Chi phí Dịch vụ hoạt động, Tổng cộng chi phí toàn đơn vị.',
        ],
      ]
    ),

    // MỤC 5
    wH1('5. MÔ HÌNH CƠ SỞ DỮ LIỆU QUAN HỆ (SQL SERVER 2019 / 2022)'),
    wPara('Cơ sở dữ liệu ThacoAgri_AssetDB gồm 18 bảng quan hệ chuẩn hóa (DDL & Seed Data có sẵn trong file ThacoAgri_Database_SQLServer2019.sql):'),
    wTable(
      ['STT', 'Tên bảng (Table)', 'Các trường dữ liệu chính', 'Vai trò & Ràng buộc'],
      [
        ['1', 'dbo.OrganizationUnits', 'unit_id, code, name, short_name, parent_unit_id, status', 'Đơn vị pháp nhân / Khu liên hợp'],
        ['2', 'dbo.Departments', 'department_id, unit_id, code, name, status', 'Phòng ban trực thuộc Đơn vị (FK -> OrganizationUnits)'],
        ['3', 'dbo.Employees', 'employee_id, employee_code, full_name, unit_id, department_id, position, role', 'Nhân sự, Chức vụ & Phân quyền RBAC (FK -> Units, Departments)'],
        ['4', 'dbo.Suppliers', 'supplier_id, code, name, tax_code, phone, email, contact_person, status', 'Danh bạ Nhà cung cấp hàng hóa & dịch vụ'],
        ['5', 'dbo.Warehouses', 'warehouse_id, code, name, owning_unit_id, manager_employee_id, status', 'Kho lưu trữ thuộc Đơn vị'],
        ['6', 'dbo.Categories', 'category_id, code, name, group, tracking_type, unit_of_measure, min_stock, brand_configs', 'Danh mục hàng hóa Định danh / Tiêu hao & cấu hình Hãng/Model'],
        ['7', 'dbo.Assets', 'asset_id, asset_code, category_id, brand, model_name, specifications, serial_no, qr_code, status', 'Hồ sơ từng Tài sản định danh kèm Hãng & Cấu hình'],
        ['8', 'dbo.StockBalances', 'warehouse_id, category_id, quantity_on_hand, average_unit_cost', 'Tồn kho vật tư tiêu hao theo từng kho'],
        ['9', 'dbo.ProcurementDemands', 'demand_id, source_type, source_id, category_id, qty_needed, status', 'Hàng đợi nhu cầu chờ Gom PO'],
        ['10', 'dbo.PurchaseOrders', 'po_id, po_code, tracking_type, supplier_name, status, total_amount, parent_po_id', 'Đơn đặt hàng PO tổng và PO con giao thiếu'],
        ['11', 'dbo.PurchaseOrderLines', 'line_id, po_id, category_id, brand, model_name, specifications, qty_ordered, actual_unit_price', 'Chi tiết dòng hàng PO kèm Hãng & Cấu hình đặt mua'],
        ['12', 'dbo.Requests', 'request_id, request_code, requester_id, target_recipient_name, request_type, form_metadata, status', 'Phiếu đề xuất cấp phát (4 biểu mẫu động)'],
        ['13', 'dbo.RequestLines', 'request_line_id, request_id, category_id, qty_requested, qty_issued, recipient_name', 'Chi tiết mặt hàng đề xuất cấp phát'],
        ['14', 'dbo.SupportTickets', 'ticket_id, ticket_code, reporter_id, asset_id, issue_type, solution_scenario, status', 'Ticket sự cố kỹ thuật IT & Bảo trì'],
        ['15', 'dbo.TicketMaterials', 'ticket_material_id, ticket_id, category_id, qty, action_type', 'Vật tư đề xuất sửa chữa/thay thế/cấp mới'],
        ['16', 'dbo.Transfers & TransferLines', 'transfer_id, code, from_warehouse_id, to_warehouse_id, status', 'Phiếu điều chuyển tài sản liên kho/đơn vị'],
        ['17', 'dbo.ExpenseCategories & ServiceExpenses', 'expense_category_id, code, group_code, category_type; expense_id, amount, supplier_name', 'Cây Danh mục Chi phí (1. CPVH, 2. CPPL) & Phiếu Chi phí dịch vụ'],
        ['18', 'dbo.AssetEvents, InventoryTransactions, AuditLogs', 'event_id, transaction_id, log_id, occurred_at, performed_by', 'Lịch sử vòng đời tài sản, sổ giao dịch kho và nhật ký kiểm toán'],
      ]
    ),
  ];

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels')?.file('.rels', relsXml);
  zip.folder('word')?.file('document.xml', documentXml);
  zip.folder('word')?.folder('_rels')?.file('document.xml.rels', wordRelsXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Tai_Lieu_Phan_Tich_Nghiep_Vu_THACO_AGRI_Updated.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
