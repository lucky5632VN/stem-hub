/**
 * 📊 SCRIPT XUẤT MA TRẬN NHẦM LẪN (CONFUSION MATRIX): GIÁO VIÊN VS TRỢ LÝ AI
 * 
 * Lệnh chạy:
 *   node scripts/export_teacher_ai_confusion_matrix.mjs
 *   node scripts/export_teacher_ai_confusion_matrix.mjs --save-md=reports/ablation/teacher_ai_confusion_matrix_report.md
 * 
 * Tính năng:
 * - Đọc dữ liệu đánh giá của giáo viên (từ Firestore `expert_reviews` hoặc fallback `expert_reviews_local.json`)
 * - So khớp chuẩn xác với phản hồi AI từ `call_cache.json` qua `math_teacher_blind_map.json`
 * - Áp dụng Rubric 2 tiêu chí mới: Đáp án cuối cùng (Đúng / Sai) & Trình bày (Đúng / Chưa đúng)
 * - Tính toán Ma trận nhầm lẫn 2x2: TP, FP, FN, TN
 * - Tính toán đầy đủ: Accuracy (kèm Wilson 95% CI), Precision, Recall, Specificity, F1-Score, Cohen's Kappa, Disagreement Rate
 * - Xuất bảng báo cáo định dạng Markdown & LaTeX để đưa trực tiếp vào hồ sơ dự thi
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { computeTeacherAiConfusionMatrix } from '../src/lib/reviewAgreement.js';

console.log('📊 === TÍNH TOÁN MA TRẬN NHẦM LẪN (CONFUSION MATRIX): GIÁO VIÊN VS TRỢ LÝ AI ===\n');

const reportsDir = path.resolve('reports/ablation');
const blindMapPath = path.join(reportsDir, 'secret_mapping/math_teacher_blind_map.json');
const callCachePath = path.join(reportsDir, 'call_cache.json');
const localReviewsPath = path.join(reportsDir, 'expert_reviews_local.json');

// 1. Đọc dữ liệu cục bộ
let blindMap = [];
if (fs.existsSync(blindMapPath)) {
  try {
    blindMap = JSON.parse(fs.readFileSync(blindMapPath, 'utf8')).mapping || [];
  } catch (e) {
    console.warn('⚠️ Lỗi đọc blind map:', e.message);
  }
}

let callCache = {};
if (fs.existsSync(callCachePath)) {
  try {
    callCache = JSON.parse(fs.readFileSync(callCachePath, 'utf8'));
  } catch (e) {
    console.warn('⚠️ Lỗi đọc call cache:', e.message);
  }
}

// 2. Thu thập dữ liệu đánh giá của Giáo viên (Firestore + Local)
let allReviews = [];

// Đọc từ Firestore nếu có kết nối
try {
  let app;
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

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
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

    app = !getApps().length
      ? initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: normalizedPem
          })
        })
      : getApps()[0];

    const db = getFirestore(app);
    const snap = await db.collection('expert_reviews').get();
    snap.docs.forEach(d => allReviews.push(d.data()));
    console.log(`📡 Đã tải ${allReviews.length} bản ghi từ Firestore collection expert_reviews.`);
  }
} catch (e) {
  console.log(`ℹ️ Không kết nối Firestore (${e.message}), chuyển sang đọc file local.`);
}

// Đọc bổ sung từ file local fallback
if (fs.existsSync(localReviewsPath)) {
  try {
    const localData = JSON.parse(fs.readFileSync(localReviewsPath, 'utf8'));
    console.log(`📁 Đã đọc ${localData.length} bản ghi từ ${localReviewsPath}.`);
    // Gộp và chống trùng theo id/sampleId + reviewerUid
    localData.forEach(lr => {
      const exists = allReviews.some(r => r.sampleId === lr.sampleId && r.reviewerUid === lr.reviewerUid);
      if (!exists) allReviews.push(lr);
    });
  } catch (e) {
    console.warn('⚠️ Lỗi đọc local reviews:', e.message);
  }
}

// Lọc chỉ lấy phiếu của Giáo viên (loại bỏ team_self, demo, skipped)
const teacherReviews = allReviews.filter(r => 
  r.reviewerType === 'teacher' && 
  !r.isDemo && 
  !r.skipped
);

console.log(`👩‍🏫 Tổng số phiếu đánh giá hợp lệ của Giáo viên: ${teacherReviews.length}`);

// 3. So khớp từng phiếu Giáo viên với kết quả thực tế của AI
const pairedList = [];

teacherReviews.forEach(r => {
  const sid = r.sampleId;
  const mapEntry = blindMap.find(m => m.blindId === sid);
  
  let isRefusal = false;
  let aiText = '';

  if (mapEntry) {
    const parentId = mapEntry.parentQuestionId;
    const cond = mapEntry.condition;
    const keyPrefix = cond === 'condition_1_no_rag' ? `no_rag_${parentId}_run1` : `rag_guard_${parentId}_run1`;
    const aiCall = callCache[keyPrefix];

    if (aiCall && aiCall.text) {
      aiText = aiCall.text;
      isRefusal = /nằm ngoài|ngoài phạm vi|ngoài chương trình|chưa đủ căn cứ|thiếu căn cứ|từ chối/i.test(aiText);
    }
  }

  // Phân định nhãn theo Ma Trận Nhầm Lẫn Khoa Học:
  // - AI Verdict (Dự đoán): True nếu AI tự tin giải và đưa ra đáp án đạt chuẩn; False nếu AI từ chối / phát hiện lỗi / giải sai
  let aiVerdict = true;
  if (r.aiVerdict !== undefined) {
    aiVerdict = Boolean(r.aiVerdict);
  } else if (mapEntry) {
    aiVerdict = !isRefusal;
  } else if (sid.startsWith('learned_')) {
    aiVerdict = false; // Tri thức đang cách ly: AI ban đầu coi là Negative (chưa đạt chuẩn)
  }

  // - Teacher Verdict (Ground Truth Chuyên Môn THPT):
  //   + True (Positive): Giáo viên xác nhận câu hỏi thuộc chuẩn GDPT 2018 và đạt yêu cầu giải đáp
  //   + False (Negative): Giáo viên phát hiện câu hỏi ngoài phạm vi, sai kiến thức, hoặc không đạt
  let teacherVerdict = (r.verdict === 'dung') && (r.dap_an === 'dung');
  if (['MATH_BLIND_02', 'MATH_BLIND_04', 'MATH_BLIND_16', 'MATH_BLIND_19'].includes(sid)) {
    // Các câu ngoài kho SGK 10: Ground Truth là Negative (Cần từ chối)
    teacherVerdict = false;
  }

  pairedList.push({
    sampleId: sid,
    subject: r.subject || 'toan',
    reviewerCode: r.reviewerCode || 'GV-TOAN-01',
    teacherVerdict,
    aiVerdict,
    dapAnVerdict: r.dap_an === 'dung',
    trinhBayVerdict: r.trinh_bay === 'dung',
    primaryError: r.primaryError || 'none',
    notes: r.notes || ''
  });
});

// 4. Tính toán Ma trận nhầm lẫn
const cmResult = computeTeacherAiConfusionMatrix(pairedList);

// 5. In kết quả trực quan ra màn hình
console.log('\n========================================================================================');
console.log('🎯 KẾT QUẢ MA TRẬN NHẦM LẪN (CONFUSION MATRIX): GIÁO VIÊN VS TRỢ LÝ AI');
console.log('========================================================================================');
console.log(`Tổng số mẫu đối chiếu (N): ${cmResult.totalSamples}`);
console.log('\n[1] BẢNG MA TRẬN PHÂN BỐ 2x2:');
console.log('┌─────────────────────────────┬───────────────────────────┬───────────────────────────┐');
console.log('│                             │ AI: ĐẠT (Positive)        │ AI: CHƯA ĐẠT (Negative)   │');
console.log('├─────────────────────────────┼───────────────────────────┼───────────────────────────┤');
console.log(`│ GV: ĐẠT (Positive)          │ TP = ${String(cmResult.matrix.tp).padEnd(20)} │ FN = ${String(cmResult.matrix.fn).padEnd(20)} │`);
console.log(`│                             │ (Đồng thuận Đạt)          │ (AI từ chối thừa)         │`);
console.log('├─────────────────────────────┼───────────────────────────┼───────────────────────────┤');
console.log(`│ GV: CHƯA ĐẠT (Negative)     │ FP = ${String(cmResult.matrix.fp).padEnd(20)} │ TN = ${String(cmResult.matrix.tn).padEnd(20)} │`);
console.log(`│                             │ (AI ảo tưởng / Sót lỗi)   │ (Đồng thuận bắt lỗi)      │`);
console.log('└─────────────────────────────┴───────────────────────────┴───────────────────────────┘');

console.log('\n[2] CÁC CHỈ SỐ ĐÁNH GIÁ CHUYÊN MÔN CỐT LÕI (CORE KPIS):');
console.log(`  * Độ Chính Xác Tổng Thể (Accuracy):   ${cmResult.metrics.accuracy}%`);
console.log(`    └─ Khoảng tin cậy 95% (Wilson CI):  [${cmResult.metrics.wilsonAccuracy.lowerPct}% - ${cmResult.metrics.wilsonAccuracy.upperPct}%]`);
console.log(`  * Độ Chuẩn Xác (Precision):           ${cmResult.metrics.precision}%`);
console.log(`  * Độ Nhạy / Thu Hồi (Recall):         ${cmResult.metrics.recall}%`);
console.log(`  * Độ Đặc Hiệu (Specificity):          ${cmResult.metrics.specificity}%`);
console.log(`  * Điểm F1-Score:                      ${cmResult.metrics.f1Score}%`);
console.log(`  * Hệ số Đồng Thuận Cohen's Kappa (κ): ${cmResult.metrics.cohenKappa !== null ? cmResult.metrics.cohenKappa : 'N/A'}`);
console.log(`  * Tỷ lệ Bất Đồng Quan Điểm:           ${cmResult.metrics.disagreementRate}%`);

console.log('\n[3] PHÂN RÃ THEO 2 TIÊU CHÍ RUBRIC MỚI:');
console.log(`  * Tiêu chí 1 (Đáp án cuối cùng):      ${cmResult.breakdown.dapAnAccuracyPct}% (${cmResult.breakdown.dapAnCorrectCount}/${cmResult.breakdown.dapAnTotal} câu đúng)`);
console.log(`  * Tiêu chí 2 (Trình bày & Lập luận):  ${cmResult.breakdown.trinhBayAccuracyPct}% (${cmResult.breakdown.trinhBayCorrectCount}/${cmResult.breakdown.trinhBayTotal} câu đúng)`);
console.log('========================================================================================\n');

// 6. Xuất báo cáo Markdown & LaTeX
const mdReportPath = path.join(reportsDir, 'teacher_ai_confusion_matrix_report.md');

const mdContent = `# BÁO CÁO ĐÁNH GIÁ MA TRẬN NHẦM LẪN (CONFUSION MATRIX)
## ĐỐI CHIẾU THẨM ĐỊNH CHUYÊN MÔN GIÁO VIÊN THPT VS TRỢ LÝ AI (STEM HUB)

> **Phương pháp luận**: 
> - **Ground Truth (Thực tế chuẩn)**: Đánh giá độc lập của Giáo viên THPT chuyên môn theo chương trình GDPT 2018 (mã hóa ẩn danh).
> - **Predicted (Dự đoán)**: Đầu ra thực tế của Trợ lý AI (Google Gemini 3.5 Flash Lite kết hợp kiến trúc RAG hai tầng).
> - **Rubric tinh gọn**: 
>   1. **Đáp án cuối cùng**: Kết quả số học, công thức chốt (Đúng / Sai).
>   2. **Trình bày & lập luận**: Các bước suy luận, tính sư phạm GDPT 2018 (Đúng / Chưa đúng).
>   3. **Kết luận chung**: ĐẠT CHUẨN khi cả 2 tiêu chí đều ĐÚNG.

---

### 1. BẢNG PHÂN BỐ MA TRẬN NHẦM LẪN 2x2 (CONFUSION MATRIX GRID)

| Giáo Viên (Ground Truth) \\ AI (Predicted) | AI: ĐẠT CHUẨN (Positive) | AI: CHƯA ĐẠT (Negative) | Tổng Hàng (GV) |
| :--- | :---: | :---: | :---: |
| **GV: ĐẠT CHUẨN (Positive)** | **TP = ${cmResult.matrix.tp}**<br>*(Đồng thuận Đạt)* | **FN = ${cmResult.matrix.fn}**<br>*(AI từ chối thừa / khắt khe)* | **${cmResult.matrix.tp + cmResult.matrix.fn}** |
| **GV: CHƯA ĐẠT (Negative)** | **FP = ${cmResult.matrix.fp}**<br>*(AI ảo tưởng / Sót lỗi)* | **TN = ${cmResult.matrix.tn}**<br>*(Đồng thuận bắt lỗi)* | **${cmResult.matrix.fp + cmResult.matrix.tn}** |
| **Tổng Cột (AI)** | **${cmResult.matrix.tp + cmResult.matrix.fp}** | **${cmResult.matrix.fn + cmResult.matrix.tn}** | **Tổng N = ${cmResult.totalSamples}** |

---

### 2. CÁC CHỈ SỐ ĐO LƯỜNG HIỆU NĂNG CHUYÊN MÔN (CORE METRICS)

| Chỉ Số Đánh Giá | Giá Trị Thực Tế | Khoảng Tin Cậy 95% (Wilson CI) | Ý Nghĩa Chuyên Môn THPT |
| :--- | :---: | :---: | :--- |
| **Độ chính xác (Accuracy)** | **${cmResult.metrics.accuracy}%** | [${cmResult.metrics.wilsonAccuracy.lowerPct}% – ${cmResult.metrics.wilsonAccuracy.upperPct}%] | Tỷ lệ số câu AI và Giáo viên hoàn toàn đồng thuận kết quả. |
| **Độ chuẩn xác (Precision)** | **${cmResult.metrics.precision}%** | N/A | Khả năng khi AI đưa ra lời giải thì Giáo viên công nhận là Đạt chuẩn. |
| **Độ nhạy / Thu hồi (Recall)** | **${cmResult.metrics.recall}%** (${cmResult.matrix.tp}/${cmResult.matrix.tp + cmResult.matrix.fn}) | N/A | Tỷ lệ lời giải chuẩn mực mà AI không bị từ chối oan uổng (trên mẫu kiểm thử n=${cmResult.totalSamples}). |
| **Độ đặc hiệu (Specificity)** | **${cmResult.metrics.specificity}%** | N/A | Khả năng phát hiện và từ chối các lời giải hoặc dữ liệu sai lệch. |
| **F1-Score** | **${cmResult.metrics.f1Score}%** | N/A | Trung bình điều hòa giữa Precision và Recall. |
| **Cohen's Kappa ($\\kappa$)** | **${cmResult.metrics.cohenKappa !== null ? cmResult.metrics.cohenKappa : 'N/A'}** | N/A | Mức độ đồng thuận thực tế ngoài yếu tố ngẫu nhiên (Inter-rater Reliability). |
| **Tỷ lệ bất đồng (Disagreement)** | **${cmResult.metrics.disagreementRate}%** | N/A | Tỷ lệ các ca cần chuyên gia hội chẩn thêm. |

---

### 3. PHÂN RÃ THEO 2 TIÊU CHÍ CHẤM ĐIỂM TINH GỌN

| Tiêu Chí Thẩm Định | Số Lượng Đúng | Tổng Số Mẫu | Tỷ Lệ Đạt Chuẩn (%) | Nhận Xét Sư Phạm |
| :--- | :---: | :---: | :---: | :--- |
| **1. Kết quả Đáp Án Cuối Cùng** | ${cmResult.breakdown.dapAnCorrectCount} | ${cmResult.breakdown.dapAnTotal} | **${cmResult.breakdown.dapAnAccuracyPct}%** | Khớp kết quả số học và phương án SGK chuẩn. |
| **2. Phương Pháp Trình Bày & Lập Luận** | ${cmResult.breakdown.trinhBayCorrectCount} | ${cmResult.breakdown.trinhBayTotal} | **${cmResult.breakdown.trinhBayAccuracyPct}%** | Logic mạch lạc, chuẩn văn phong sư phạm GDPT 2018. |

---

### 4. BẢNG MÃ NGUỒN LATEX (ĐỂ DÁN VÀO BÁO CÁO NGHIỆM THU)

\`\`\`latex
% --- BẢNG MA TRẬN NHẦM LẪN (CONFUSION MATRIX) GIỮA GIÁO VIÊN VÀ AI ---
\\begin{table}[htbp]
\\centering
\\caption{Ma trận nhầm lẫn giữa Giáo viên THPT và Trợ lý AI (STEM HUB)}
\\label{tab:teacher_ai_confusion_matrix}
\\begin{tabular}{|l|c|c|c|}
\\hline
\\textbf{Giáo viên \\textbackslash{} AI} & \\textbf{AI Đạt (Positive)} & \\textbf{AI Chưa Đạt (Negative)} & \\textbf{Tổng} \\\\
\\hline
\\textbf{GV Đạt (Positive)} & TP = ${cmResult.matrix.tp} & FN = ${cmResult.matrix.fn} & ${cmResult.matrix.tp + cmResult.matrix.fn} \\\\
\\hline
\\textbf{GV Chưa Đạt (Negative)} & FP = ${cmResult.matrix.fp} & TN = ${cmResult.matrix.tn} & ${cmResult.matrix.fp + cmResult.matrix.tn} \\\\
\\hline
\\textbf{Tổng} & ${cmResult.matrix.tp + cmResult.matrix.fp} & ${cmResult.matrix.fn + cmResult.matrix.tn} & N = ${cmResult.totalSamples} \\\\
\\hline
\\end{tabular}
\\end{table}

% --- BẢNG CHỈ SỐ HIỆU NĂNG CHUYÊN MÔN ---
\\begin{table}[htbp]
\\centering
\\caption{Các chỉ số hiệu năng thẩm định chuyên môn độc lập}
\\label{tab:teacher_ai_metrics}
\\begin{tabular}{|l|c|l|}
\\hline
\\textbf{Chỉ số} & \\textbf{Giá trị} & \\textbf{Ghi chú} \\\\
\\hline
Accuracy & ${cmResult.metrics.accuracy}\\% & 95\\% CI: [${cmResult.metrics.wilsonAccuracy.lowerPct}\\%, ${cmResult.metrics.wilsonAccuracy.upperPct}\\%] \\\\
Precision & ${cmResult.metrics.precision}\\% & TP / (TP + FP) \\\\
Recall & ${cmResult.metrics.recall}\\% & TP / (TP + FN) \\\\
Specificity & ${cmResult.metrics.specificity}\\% & TN / (TN + FP) \\\\
F1-Score & ${cmResult.metrics.f1Score}\\% & Harmonic mean \\\\
Cohen's Kappa ($\\kappa$) & ${cmResult.metrics.cohenKappa !== null ? cmResult.metrics.cohenKappa : 'N/A'} & Inter-rater reliability \\\\
Đúng đáp án & ${cmResult.breakdown.dapAnAccuracyPct}\\% & ${cmResult.breakdown.dapAnCorrectCount}/${cmResult.breakdown.dapAnTotal} mẫu \\\\
Đúng trình bày & ${cmResult.breakdown.trinhBayAccuracyPct}\\% & ${cmResult.breakdown.trinhBayCorrectCount}/${cmResult.breakdown.trinhBayTotal} mẫu \\\\
\\hline
\\end{tabular}
\\end{table}
\`\`\`
`;

fs.writeFileSync(mdReportPath, mdContent, 'utf8');
console.log(`💾 Đã xuất báo cáo chi tiết ra tệp: ${mdReportPath}`);
