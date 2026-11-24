/**
 * 📋 SCRIPT XUẤT BÁO CÁO THẨM ĐỊNH CHUYÊN MÔN ĐỘC LẬP (CLI)
 * 
 * Lệnh chạy:
 *   node scripts/export_expert_reviews_report.mjs
 *   node scripts/export_expert_reviews_report.mjs --csv=reports/expert_reviews_summary.csv
 * 
 * Tuân thủ tuyệt đối:
 * - Đọc trực tiếp từ collection `expert_reviews` trên Cloud Firestore thật (hoặc emulator nếu có)
 * - Tách bạch hoàn toàn giữa "Giáo viên chấm" và "Nhóm tự chấm", không gộp thành điểm chung
 * - Môn chưa có giáo viên hiển thị rõ: "Chưa có đánh giá giáo viên: 0/N"
 * - Điểm số kèm kiểm tra cỡ mẫu: nếu n < 30 ghi rõ "Mẫu quá nhỏ để khái quát"
 * - Không bao giờ đưa dữ liệu `isDemo: true` vào báo cáo
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { aggregateReviewsBySubjectAndCohort, computeCohortAgreement } from '../src/lib/reviewAgreement.js';

console.log('📊 === XUẤT BÁO CÁO THẨM ĐỊNH CHUYÊN MÔN ĐỘC LẬP (EXPERT REVIEWS REPORT) ===\n');

// 1. Phân tích cờ dòng lệnh
const args = process.argv.slice(2);
const csvArg = args.find(a => a.startsWith('--csv='));
const csvOutputPath = csvArg ? csvArg.split('=')[1] : null;

// 2. Khởi tạo Firebase Admin
let app;
if (!getApps().length) {
  // Đọc từ .env.local nếu có
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(l => {
      const match = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  try {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      app = initializeApp({ projectId: 'stem-hub-emulator' });
      console.log('ℹ️ Đang kết nối Firestore qua Emulator Host:', process.env.FIRESTORE_EMULATOR_HOST);
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
      const crypto = await import('crypto');
      const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
      let normalizedPem = cleanKey;
      try {
        const b64 = lines.slice(1, -1).join('');
        const buf = Buffer.from(b64, 'base64');
        const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
        normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
      } catch (_) {}

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizedPem
        })
      });
      console.log('✅ Đã kết nối Firebase Admin SDK với Service Account');
    } else {
      app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96' });
      console.log('ℹ️ Sử dụng Application Default Credentials / Project ID.');
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Firebase Admin SDK:', err.message);
    process.exit(1);
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

async function runReport() {
  console.log('🔍 Đang truy vấn collection "expert_reviews" từ Firestore...');
  const snapshot = await db.collection('expert_reviews').get();
  console.log(`📦 Tổng số document tìm thấy trong expert_reviews: ${snapshot.size}`);

  const rawDocs = snapshot.docs.map(d => d.data());
  const realDocs = rawDocs.filter(d => !d.isDemo);
  const demoDocs = rawDocs.filter(d => d.isDemo);

  console.log(`   - Số phiếu thật hợp lệ: ${realDocs.length}`);
  console.log(`   - Số phiếu demo/thử nghiệm (bị loại bỏ khỏi báo cáo): ${demoDocs.length}\n`);

  // Phân tích thống kê tách bạch
  const aggregated = aggregateReviewsBySubjectAndCohort(realDocs);
  const subjects = ['toan', 'ly', 'hoa', 'sinh'];

  console.log('========================================================================================================================');
  console.log('📋 BẢNG ĐỐI CHIẾU THẨM ĐỊNH CHUYÊN MÔN THEO MÔN HỌC (TÁCH BIỆT 2 NGUỒN CHẤM)');
  console.log('========================================================================================================================');
  console.log(
    'Môn học'.padEnd(10) + ' | ' +
    'Giáo viên chấm (k/n, số GV)'.padEnd(35) + ' | ' +
    'Nhóm tự chấm (k/n) [Nội bộ]'.padEnd(30) + ' | ' +
    'Điểm trung bình (ĐK/CC/SP/AT)'.padEnd(32) + ' | ' +
    'Lỗi chính phổ biến'
  );
  console.log('------------------------------------------------------------------------------------------------------------------------');

  const csvRows = [
    ['Mon', 'Nguon_Danh_Gia', 'So_Phieu', 'So_Nguoi_Cham', 'Kich_Thuoc_Mau_Khuyen_Nghi', 'Diem_Dung_Kien_Thuc', 'Diem_Co_Can_Cu', 'Diem_Su_Pham', 'Diem_An_Toan', 'Tong_Diem_TB', 'Loi_Chinh_Pho_Bien', 'Ghi_Chu_Khai_Quat']
  ];

  subjects.forEach(subj => {
    const tData = aggregated[subj]?.teacher || { totalReviews: 0, distinctReviewers: 0 };
    const sData = aggregated[subj]?.team_self || { totalReviews: 0, distinctReviewers: 0 };

    const subjDisplay = subj === 'toan' ? 'Toán' : (subj === 'ly' ? 'Vật lý' : (subj === 'hoa' ? 'Hóa học' : 'Sinh học'));

    // 1. Cột Giáo viên (Tách biệt nguồn cổng trực tiếp và nhập qua Google Form)
    const subjTeacherReviews = realDocs.filter(d => d.subject === subj && d.reviewerType === 'teacher');
    const portalTeacherCount = subjTeacherReviews.filter(d => d.source !== 'imported_form').length;
    const formTeacherCount = subjTeacherReviews.filter(d => d.source === 'imported_form').length;

    let teacherStr = '';
    if (tData.distinctReviewers > 0) {
      teacherStr = `${tData.totalReviews}/30 (${tData.distinctReviewers} GV)`;
      if (formTeacherCount > 0) {
        teacherStr += ` (${portalTeacherCount} cổng + ${formTeacherCount} qua Form nhập script)`;
      }
      if (tData.isSampleTooSmall) teacherStr += ' [Mẫu nhỏ]';
    } else {
      teacherStr = `Chưa có đánh giá giáo viên: 0/30 (0 GV)`;
    }

    // 2. Cột Nhóm tự chấm
    let teamStr = '';
    if (sData.distinctReviewers > 0) {
      teamStr = `${sData.totalReviews}/30 (${sData.distinctReviewers} người)`;
      if (sData.isSampleTooSmall) teamStr += ' [Mẫu nhỏ]';
    } else {
      teamStr = `0/30 (0 người)`;
    }

    // 3. Cột Điểm trung bình (Ưu tiên hiển thị giáo viên nếu có, nếu chưa có thì hiển thị nhóm kèm chú thích rõ)
    let scoreStr = '';
    let topError = 'None';
    if (tData.totalReviews > 0 && tData.averages) {
      const avg = tData.averages;
      scoreStr = `GV: ${avg.knowledge}/${avg.grounding}/${avg.pedagogy}/${avg.safety} (Tổng ${avg.total}/8)`;
      topError = getTopError(tData.errorDistribution);
    } else if (sData.totalReviews > 0 && sData.averages) {
      const avg = sData.averages;
      scoreStr = `Nhóm*: ${avg.knowledge}/${avg.grounding}/${avg.pedagogy}/${avg.safety} (Tổng ${avg.total}/8)`;
      topError = getTopError(sData.errorDistribution) + ' (Nhóm tự nhận)';
    } else {
      scoreStr = 'Chưa có dữ liệu';
      topError = 'Chưa có dữ liệu';
    }

    console.log(
      subjDisplay.padEnd(10) + ' | ' +
      teacherStr.padEnd(35) + ' | ' +
      teamStr.padEnd(30) + ' | ' +
      scoreStr.padEnd(32) + ' | ' +
      topError
    );

    // CSV format: 2 hàng riêng cho 2 nguồn
    csvRows.push([
      subjDisplay,
      'Giao_Vien',
      tData.totalReviews,
      tData.distinctReviewers,
      30,
      tData.averages ? tData.averages.knowledge : 'N/A',
      tData.averages ? tData.averages.grounding : 'N/A',
      tData.averages ? tData.averages.pedagogy : 'N/A',
      tData.averages ? tData.averages.safety : 'N/A',
      tData.averages ? tData.averages.total : 'N/A',
      getTopError(tData.errorDistribution),
      tData.sampleNote
    ]);

    csvRows.push([
      subjDisplay,
      'Nhom_Tu_Cham_Noi_Bo',
      sData.totalReviews,
      sData.distinctReviewers,
      30,
      sData.averages ? sData.averages.knowledge : 'N/A',
      sData.averages ? sData.averages.grounding : 'N/A',
      sData.averages ? sData.averages.pedagogy : 'N/A',
      sData.averages ? sData.averages.safety : 'N/A',
      sData.averages ? sData.averages.total : 'N/A',
      getTopError(sData.errorDistribution),
      sData.sampleNote + ' (Khong phai danh gia doc lap)'
    ]);
  });

  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('📌 GHI CHÚ BẮT BUỘC (PROMPT 0):');
  console.log('   - *: Điểm "Nhóm" là kết quả tự chấm nội bộ của thành viên nhóm phát triển, tuyệt đối không đại diện cho giáo viên.');
  console.log('   - Thang điểm Rubric: Đúng kiến thức (0-2), Có căn cứ (0-2), Sư phạm (0-2), An toàn (0-2). Tổng điểm tối đa: 8 điểm.');
  console.log('   - Với các môn hiển thị "Chưa có đánh giá giáo viên: 0/30", hệ thống ghi nhận trung thực 0 phiếu từ giáo viên ngoài.');
  console.log('========================================================================================================================\n');

  // Kiểm tra độ đồng thuận nội bộ (Cohen's Kappa)
  console.log('🔬 KIỂM TRA ĐỘ ĐỒNG THUẬN NỘI BỘ (INTER-RATER RELIABILITY):');
  subjects.forEach(subj => {
    const tAgreement = computeCohortAgreement(realDocs, 'teacher', 'knowledge');
    const sAgreement = computeCohortAgreement(realDocs, 'team_self', 'knowledge');

    if (tAgreement.numReviewers >= 2) {
      console.log(`   - Giáo viên môn [${subj}]: ${tAgreement.numReviewers} GV, Đồng thuận: ${tAgreement.meanPercentAgreement}%, Kappa: ${tAgreement.meanKappa}`);
    } else {
      console.log(`   - Giáo viên môn [${subj}]: ${tAgreement.status}`);
    }

    if (sAgreement.numReviewers >= 2) {
      console.log(`   - Nhóm tự chấm môn [${subj}]: ${sAgreement.numReviewers} người, Đồng thuận: ${sAgreement.meanPercentAgreement}%, Kappa: ${sAgreement.meanKappa}`);
    }
  });

  // Xuất file CSV nếu có tham số --csv
  if (csvOutputPath) {
    const fullCsvPath = path.resolve(csvOutputPath);
    fs.mkdirSync(path.dirname(fullCsvPath), { recursive: true });
    const csvContent = csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    fs.writeFileSync(fullCsvPath, csvContent, 'utf8');
    console.log(`\n💾 Đã xuất báo cáo CSV thành công tại: ${fullCsvPath}`);
  }
}

function getTopError(dist) {
  if (!dist) return 'None';
  const entries = Object.entries(dist).filter(([k]) => k !== 'none');
  if (entries.length === 0) return 'Không có lỗi';
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] === 0) return 'Không có lỗi';
  return `${entries[0][0]} (${entries[0][1]} ca)`;
}

runReport().catch(err => {
  console.error('❌ Lỗi chạy script báo cáo:', err);
  process.exit(1);
});
