/**
 * 🖨️ Script Xuất Phiếu Kiểm Đáp Án Môn Toán Cho Giáo Viên (In Được / CSV Form)
 * 
 * Tạo tệp CSV có UTF-8 BOM để mở chuẩn tiếng Việt trong Excel/LibreOffice hoặc in ra giấy.
 * Bao gồm các trường: STT, Mã câu hỏi, Phân tầng, Câu hỏi, Đáp án đề xuất, Nguồn SGK, Ô thẩm định.
 */

import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('reports/ablation/ablation_dataset_100.json');
if (!fs.existsSync(datasetPath)) {
  console.error('❌ Không tìm thấy dataset 100 câu:', datasetPath);
  process.exit(1);
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const mathCases = (dataset.cases || []).filter(c => (c.subject || '').toLowerCase() === 'toan');

console.log(`📊 Tìm thấy ${mathCases.length} câu hỏi môn Toán trong tập dữ liệu 100 câu.`);

// Thêm UTF-8 BOM để Excel tự động nhận diện font tiếng Việt
let csvContent = '\uFEFF';
csvContent += '"STT","Ma_Cau_Hoi","Phan_Tang","Cau_Hoi","Dap_An_Chuan_De_Xuat","Nguon_SGK_Goi_Y","Y_Kien_Giao_Vien (Dong_Y / Khong_Dong_Y)","Nguon_Chinh_Thuc_Xac_Nhan","Ghi_Chu_Chuyen_Mon"\n';

mathCases.forEach((item, idx) => {
  const stt = idx + 1;
  const id = `"${item.id}"`;
  const stratum = `"${item.stratum}"`;
  const q = `"${(item.question || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  const gt = `"${(item.ground_truth || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  const src = `"${(item.sgk_source || '').replace(/"/g, '""')}"`;
  const agree = '""'; // Ô trống cho giáo viên tích
  const confirmedSource = '""'; // Ô trống ghi nguồn chính thức nếu biết
  const note = '""'; // Ô trống ghi chú chuyên môn

  csvContent += `${stt},${id},${stratum},${q},${gt},${src},${agree},${confirmedSource},${note}\n`;
});

const outDir = path.resolve('reports/ablation');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outCsvPath = path.join(outDir, 'phieu_kiem_dap_an_toan_in_duoc.csv');
fs.writeFileSync(outCsvPath, csvContent, 'utf8');

console.log('✅ ĐÃ XUẤT THÀNH CÔNG PHIẾU KIỂM ĐÁP ÁN TOÁN IN ĐƯỢC:');
console.log('   -> Đường dẫn:', outCsvPath);
console.log(`   -> Tổng số câu Toán: ${mathCases.length} câu`);
console.log('   -> Định dạng: CSV UTF-8 with BOM (Sẵn sàng mở trong Excel / in phiếu giấy)');
