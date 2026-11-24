/**
 * 🔍 STEM HUB Gitleaks 111 Secrets Classifier
 * 
 * Phân loại 111 phát hiện theo 4 nhóm chuẩn:
 * 1. Khóa thật có rủi ro (Cần xoay vòng ngay trên Console)
 * 2. Khóa Client công khai theo thiết kế kiến trúc (Firebase Client apiKey)
 * 3. False Positive / Tài liệu / Profile test cục bộ (Ví dụ curl doc, Chrome CDP)
 * 4. Trùng lặp (Cùng 1 khóa xuất hiện ở nhiều commit hoặc nhiều dòng)
 * 
 * ⚠️ TUYỆT ĐỐI KHÔNG IN GIÁ TRỊ KHÓA RA MÀN HÌNH HOẶC LOG.
 */

import fs from 'fs';
import path from 'path';

const reportPath = path.resolve('reports/gitleaks-history.json');
const raw = fs.readFileSync(reportPath, 'utf8');
const findings = JSON.parse(raw);

console.log(`📊 BẮT ĐẦU PHÂN LOẠI ${findings.length} PHÁT HIỆN GITLEAKS TRONG LỊCH SỬ GIT...\n`);

const classified = {
  real_secrets_need_rotation: [],
  public_client_by_design: [],
  false_positives_and_docs: [],
  duplicates: []
};

const seenFingerprints = new Set();
const seenSecretMasked = new Set();

for (const item of findings) {
  // Tạo mặt nạ không lộ bí mật: Loại khóa + Tệp + Dòng
  const rule = item.RuleID;
  const file = item.File;
  const line = item.StartLine;
  const commit = (item.Commit || '').substring(0, 8);

  // Hash bí mật để kiểm tra trùng lặp mà không in giá trị
  const secretLength = (item.Secret || '').length;
  const secretPrefix = (item.Secret || '').substring(0, 4);
  const secretSuffix = (item.Secret || '').substring(secretLength - 3);
  const secretMask = `${secretPrefix}...${secretSuffix} (len: ${secretLength})`;

  const entry = {
    rule,
    file,
    line,
    commit,
    secretMask
  };

  // 1. Kiểm tra trùng lặp
  if (seenSecretMasked.has(secretMask)) {
    classified.duplicates.push({
      ...entry,
      duplicateOf: secretMask
    });
    continue;
  }
  seenSecretMasked.add(secretMask);

  // 2. False Positives / Tài liệu / Chrome CDP Test
  if (
    file.includes('.chrome_cdp_test_profile') ||
    file.includes('.agents/') ||
    file.includes('references/') ||
    file.includes('public/labs/lab_sinh') ||
    file.endsWith('.md')
  ) {
    classified.false_positives_and_docs.push(entry);
    continue;
  }

  // 3. Khóa Client công khai theo thiết kế (Firebase Web Client apiKey)
  // Trong kiến trúc Firebase Web SDK, apiKey là mã định danh dự án trên client
  if (
    (rule === 'gcp-api-key' || rule === 'generic-api-key') &&
    (file.includes('firebase.js') || file.includes('firebase_client') || file.includes('reseed_firestore')) &&
    !file.includes('scratch')
  ) {
    classified.public_client_by_design.push(entry);
    continue;
  }

  // 4. Khóa thật có rủi ro cần xoay (Gemini API key, scratch, service account)
  classified.real_secrets_need_rotation.push(entry);
}

console.log('========================================================================');
console.log('📋 BẢNG TỔNG HỢP PHÂN LOẠI 111 PHÁT HIỆN GITLEAKS (KHÔNG IN GIÁ TRỊ KHÓA)');
console.log('========================================================================');
console.log(`1. Khóa thật cần xoay trên Console:               ${classified.real_secrets_need_rotation.length} phát hiện`);
console.log(`2. Khóa Client công khai theo thiết kế (Firebase): ${classified.public_client_by_design.length} phát hiện`);
console.log(`3. False Positives / Tài liệu / Test Profile:      ${classified.false_positives_and_docs.length} phát hiện`);
console.log(`4. Bản ghi trùng lặp (Cùng 1 khóa ở commit khác):  ${classified.duplicates.length} phát hiện`);
console.log(`------------------------------------------------------------------------`);
console.log(`TỔNG CỘNG:                                         ${classified.real_secrets_need_rotation.length + classified.public_client_by_design.length + classified.false_positives_and_docs.length + classified.duplicates.length} / 111`);
console.log('========================================================================\n');

// Lưu bảng phân loại chi tiết (đã che mặt nạ)
const outPath = path.resolve('reports/gitleaks_classification_masked.json');
fs.writeFileSync(outPath, JSON.stringify(classified, null, 2), 'utf8');
console.log(`💾 Đã lưu bảng phân loại (đã che mặt nạ) tại: ${outPath}`);

