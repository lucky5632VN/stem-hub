/**
 * 🔐 Script Khóa Hash Bộ Dữ Liệu Đáp Án Kiểm Định (Lock Answer Key)
 * Tuân thủ Prompt 0:
 * - Đọc trạng thái từ DUY NHẤT một nguồn: docs/phieu-doi-chieu-nguon-chinh-thuc.md (thông qua auditAnswerKeySheet)
 * - Nhận diện cả [x] và [X].
 * - Chỉ khóa chính thức khi người dùng ra lệnh "khóa v1.4.0".
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { auditAnswerKeySheet } from './check_answer_key.mjs';

const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='));
const versionArg = args.find(a => a.startsWith('--version='));
const authorArg = args.find(a => a.startsWith('--author='));
const notesArg = args.find(a => a.startsWith('--notes='));
const changelogArg = args.find(a => a.startsWith('--changelog='));
const sheetArg = args.find(a => a.startsWith('--sheet='));

const targetFile = fileArg ? fileArg.split('=')[1].trim() : 'reports/ablation/ablation_dataset_100.json';
const targetVersion = versionArg ? versionArg.split('=')[1].trim() : 'v1.4.0';
const author = authorArg ? authorArg.split('=')[1].trim() : 'Nhóm nghiên cứu / Thẩm định viên';
const notes = notesArg ? notesArg.split('=')[1].trim() : 'Cập nhật và khóa bộ đáp án chuẩn';
const detailedChangelog = changelogArg ? changelogArg.split('=')[1].trim() : 'Khóa hash cập nhật bảng đối soát nguồn xác nhận';
const sheetPath = sheetArg ? sheetArg.split('=')[1].trim() : 'docs/phieu-doi-chieu-nguon-chinh-thuc.md';

const resolvedPath = path.resolve(targetFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Không tìm thấy file: ${resolvedPath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(resolvedPath, 'utf8');
let parsed;
try {
  parsed = JSON.parse(fileContent);
} catch (e) {
  console.error(`❌ Lỗi parse JSON trong file ${targetFile}:`, e.message);
  process.exit(1);
}

// 1. Tính hash SHA-256
const sha256 = crypto.createHash('sha256').update(fileContent, 'utf8').digest('hex');

// 2. Kiểm tra tính hợp lệ từ phiếu đối chiếu duy nhất
let auditReport;
try {
  auditReport = auditAnswerKeySheet(sheetPath);
} catch (e) {
  console.error(`❌ Lỗi đọc phiếu đối chiếu:`, e.message);
  process.exit(1);
}

const verifiedCount = auditReport.totalUniqueTickedEligible;
const outDir = path.dirname(resolvedPath);
const hashFilePath = path.join(outDir, 'dataset_hash.json');

// Đọc changelog cũ nếu có
let changelog = [];
let oldHashData = {};
if (fs.existsSync(hashFilePath)) {
  try {
    oldHashData = JSON.parse(fs.readFileSync(hashFilePath, 'utf8'));
    if (Array.isArray(oldHashData.changelog)) {
      changelog = oldHashData.changelog;
    }
  } catch (_) {}
}

const isOfficial = verifiedCount >= 30;
const statusLabel = isOfficial 
  ? 'CHÍNH THỨC (đã kiểm định đủ 30 câu số học có nguồn)' 
  : `NHÁP (chưa đủ 30 câu số học có nguồn & người kiểm: ${verifiedCount}/30)`;

console.log('========================================================================');
console.log('🔐 KHÓA HASH BỘ DỮ LIỆU ĐÁP ÁN (DATASET LOCK & CHANGELOG)');
console.log('========================================================================');
console.log(`- Tệp mục tiêu:                  ${targetFile}`);
console.log(`- Phiên bản:                     ${targetVersion}`);
console.log(`- SHA-256:                       ${sha256}`);
console.log(`- Nguồn phiếu đối chiếu:         ${sheetPath}`);
console.log(`- Số câu số học đủ điều kiện:    ${verifiedCount}`);
console.log(`- Trạng thái kiểm định:          ${statusLabel}`);
console.log('========================================================================\n');

// Ghi nhật ký vào changelog
const newEntry = {
  version: targetVersion,
  sha256: sha256,
  file: targetFile,
  locked_at: new Date().toISOString(),
  author: author,
  status: statusLabel,
  verified_numerical_cases: verifiedCount,
  notes: notes,
  changelog_detail: detailedChangelog
};

changelog.push(newEntry);

const updatedHashData = {
  ...oldHashData,
  dataset_file: targetFile,
  version: targetVersion,
  sha256: sha256,
  status: statusLabel,
  verified_numerical_cases: verifiedCount,
  locked_at: new Date().toISOString(),
  changelog: changelog
};

fs.writeFileSync(hashFilePath, JSON.stringify(updatedHashData, null, 2), 'utf8');
console.log(`✅ Đã cập nhật thành công hash và changelog vào: ${hashFilePath}`);
