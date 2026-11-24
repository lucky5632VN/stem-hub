/**
 * 📥 Script Nhập Dữ Liệu Thẩm Định Dự Phòng Từ Google Form (CSV Importer)
 * Tuân thủ Quy tắc Trung thực Prompt 0 & Bảo Mật Chống Phiếu Giả:
 * - (a) TỪ CHỐI mọi file có tên chứa "sample", "example", "demo".
 * - (b) CHỈ CHẤP NHẬN email khớp với tài khoản giáo viên có custom claims trên Firebase Auth
 *       hoặc khớp với bản ghi trong collection `teacher_consents`. Email lạ bị từ chối kèm báo cáo.
 * - (c) --execute YÊU CẦU THÊM CỜ `--confirm-real-teacher-data` và in số dòng sẽ ghi.
 * - (d) Mặc định an toàn --dry-run (CHỈ ĐỌC). Không tự ý tạo dữ liệu mẫu giả.
 * 
 * Cách dùng:
 * node scripts/import_reviews_from_form.mjs --file="path/to/real_form_responses.csv" [--execute --confirm-real-teacher-data]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='));
const isExecute = args.includes('--execute');
const hasTeacherConfirm = args.includes('--confirm-real-teacher-data');

console.log('========================================================================');
console.log('📥 SCRIPT NHẬP DỮ LIỆU ĐÁNH GIÁ CHUYÊN MÔN TỪ GOOGLE FORM');
console.log('========================================================================');

if (!fileArg) {
  console.error('❌ THIẾU THAM SỐ: Bắt buộc cung cấp đường dẫn file qua --file="path/to/form.csv"');
  console.log('Ví dụ: node scripts/import_reviews_from_form.mjs --file="data/gvt_danh_gia_thuc.csv"');
  process.exit(1);
}

const inputFilePath = fileArg.split('=')[1].trim().replace(/^["']|["']$/g, '');
const resolvedInputPath = path.resolve(inputFilePath);
const baseFileName = path.basename(resolvedInputPath).toLowerCase();

console.log(`- File nguồn:    ${resolvedInputPath}`);
console.log(`- Chế độ:        ${isExecute ? '⚡ THỰC THI GHI VÀO FIRESTORE (--execute)' : '🛡️ KIỂM THỬ AN TOÀN (--dry-run mặc định)'}`);
console.log('------------------------------------------------------------------------');

// (a) Kiểm tra tên file: Chặn mọi file sample/example/demo
const FORBIDDEN_NAME_PATTERNS = [/sample/i, /example/i, /demo/i];
for (const pattern of FORBIDDEN_NAME_PATTERNS) {
  if (pattern.test(baseFileName)) {
    console.error(`\n❌ BẢO MẬT BỊ TỪ CHỐI (Rule 1a): Tên file '${path.basename(resolvedInputPath)}' chứa từ khóa cấm (${pattern}).`);
    console.error('   Hệ thống từ chối nạp file mẫu vào cơ sở dữ liệu expert_reviews.');
    process.exit(1);
  }
}

// (c) Kiểm tra cờ xác nhận khi --execute
if (isExecute && !hasTeacherConfirm) {
  console.error('\n❌ BẢO MẬT BỊ TỪ CHỐI (Rule 1c): Chế độ --execute bắt buộc phải đi kèm cờ --confirm-real-teacher-data.');
  console.error('   Lệnh đúng: node scripts/import_reviews_from_form.mjs --file="..." --execute --confirm-real-teacher-data');
  process.exit(1);
}

if (!fs.existsSync(resolvedInputPath)) {
  console.error(`❌ KHÔNG TÌM THẤY FILE: ${resolvedInputPath}`);
  process.exit(1);
}

// Khởi tạo Firebase Admin an toàn
const envLocalPath = path.resolve('.env.local');
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let projectId = process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1];
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k === 'FIREBASE_CLIENT_EMAIL' && !clientEmail) clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY' && !privateKey) privateKey = v;
      if (k === 'FIREBASE_PROJECT_ID' && !projectId) projectId = v;
    }
  }
}

let cleanKey = (privateKey || '').replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
let normalizedPem = cleanKey;
try {
  const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizedPem
      })
    })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

// (b) Nạp danh sách giáo viên hợp lệ từ Firebase Auth Claims & Firestore teacher_consents
console.log('🔍 Đang kiểm tra danh sách giáo viên được phép thẩm định từ Firebase Auth & teacher_consents...');
const authorizedTeacherMap = new Map(); // email_lower -> { uid, source, claims }

try {
  // 1. Quét người dùng trên Auth có claims teacher hoặc admin
  const listUsersResult = await auth.listUsers(1000);
  for (const u of listUsersResult.users) {
    const claims = u.customClaims || {};
    const isTeacher = claims.teacher === true || claims.reviewerType === 'teacher' || claims.admin === true;
    if (isTeacher && u.email) {
      authorizedTeacherMap.set(u.email.toLowerCase().trim(), {
        uid: u.uid,
        source: 'firebase_auth_claims',
        email: u.email
      });
    }
  }

  // 2. Quét Firestore teacher_consents
  const consentSnap = await db.collection('teacher_consents').get();
  for (const doc of consentSnap.docs) {
    const data = doc.data();
    const consentEmail = (data.email || data.teacherEmail || '').toLowerCase().trim();
    if (consentEmail && !authorizedTeacherMap.has(consentEmail)) {
      authorizedTeacherMap.set(consentEmail, {
        uid: doc.id,
        source: 'teacher_consents',
        email: consentEmail
      });
    }
  }
  console.log(`✅ Đã nạp ${authorizedTeacherMap.size} giáo viên được cấp quyền hợp lệ vào whitelist.`);
} catch (err) {
  console.warn(`⚠️ Cảnh báo kết nối lấy whitelist giáo viên: ${err.message}`);
}

// Phân tích cú pháp CSV
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const rawContent = fs.readFileSync(resolvedInputPath, 'utf8').replace(/^\uFEFF/, '');
const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);

if (lines.length <= 1) {
  console.error('❌ File CSV rỗng hoặc chỉ có dòng tiêu đề!');
  process.exit(1);
}

const header = parseCsvLine(lines[0]);
console.log(`📋 Tiêu đề CSV (${header.length} cột): [${header.slice(0, 4).join(' | ')} ...]`);

const parsedRecords = [];
const unauthorizedEmailErrors = [];
const scoreValidationErrors = [];

for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  if (row.length < 5) continue;

  const timestamp = row[0] || '';
  const email = (row[1] || '').trim();
  const sampleId = row[2] || '';
  const subject = (row[3] || 'toan').toLowerCase();

  // Kiểm tra email thuộc whitelist
  const teacherInfo = authorizedTeacherMap.get(email.toLowerCase());
  if (!teacherInfo) {
    unauthorizedEmailErrors.push(`Dòng ${i + 1}: Email '${email}' KHÔNG thuộc danh sách giáo viên có claims hoặc có consent hợp lệ!`);
    continue;
  }

  const kScore = parseInt(row[4], 10);
  const gScore = parseInt(row[5], 10);
  const pScore = parseInt(row[6], 10);
  const sScore = parseInt(row[7], 10);
  const rawError = row[8] || 'none';
  const comments = row[9] || '';

  const validScores = [0, 1, 2];
  if (!validScores.includes(kScore) || !validScores.includes(gScore) || !validScores.includes(pScore) || !validScores.includes(sScore)) {
    scoreValidationErrors.push(`Dòng ${i + 1}: Điểm số không hợp lệ (phải là 0, 1, hoặc 2). Nhận được: [${row.slice(4, 8).join(', ')}]`);
    continue;
  }

  // Chuẩn hóa lỗi
  let primaryError = 'none';
  const errLower = rawError.toLowerCase();
  if (errLower.includes('sai_kien_thuc') || errLower.includes('sai kiến thức') || errLower.includes('sai')) {
    primaryError = 'sai_kien_thuc';
  } else if (errLower.includes('thieu_nguon') || errLower.includes('thiếu nguồn')) {
    primaryError = 'thieu_nguon';
  } else if (errLower.includes('nguon_khong_lien_quan') || errLower.includes('nguồn không liên quan')) {
    primaryError = 'nguon_khong_lien_quan';
  } else if (errLower.includes('sai_don_vi') || errLower.includes('đơn vị')) {
    primaryError = 'sai_don_vi';
  } else if (errLower.includes('dien_dat') || errLower.includes('diễn đạt')) {
    primaryError = 'dien_dat';
  } else if (!errLower.includes('none') && !errLower.includes('không')) {
    primaryError = 'khac';
  }

  const maskedEmail = email.replace(/^(.{2})[^@]*(@.*)$/, '$1***$2');
  const hashId = crypto.createHash('sha256').update(`${email}_${timestamp}_${sampleId}`).digest('hex').slice(0, 16);
  const docId = `form_${hashId}`;

  parsedRecords.push({
    docId,
    timestamp,
    originalTimestamp: timestamp,
    reviewerEmail: email,
    reviewerType: 'teacher',
    reviewerUid: teacherInfo.uid,
    sampleId,
    subject,
    scores: {
      knowledge: kScore,
      grounding: gScore,
      pedagogy: pScore,
      safety: sScore
    },
    primaryError,
    comments,
    source: 'imported_form',
    importedAt: new Date().toISOString(),
    isImportedFromGoogleForm: true,
    maskedEmail
  });
}

console.log(`\n📊 KẾT QUẢ ĐỐI SOÁT DỮ LIỆU:`);
console.log(`- Tổng số dòng trong CSV:          ${lines.length - 1} dòng`);
console.log(`- Số bản ghi hợp lệ:               ${parsedRecords.length} bản ghi`);
console.log(`- Số lỗi email lạ bị chặn:         ${unauthorizedEmailErrors.length} lỗi`);
console.log(`- Số lỗi điểm sai chuẩn:           ${scoreValidationErrors.length} lỗi`);

if (unauthorizedEmailErrors.length > 0) {
  console.log('\n❌ CÁC DÒNG BỊ TỪ CHỐI DO EMAIL KHÔNG HỢP LỆ:');
  unauthorizedEmailErrors.slice(0, 10).forEach(e => console.log(`  * ${e}`));
}

if (scoreValidationErrors.length > 0) {
  console.log('\n⚠️ CÁC DÒNG BỊ TỪ CHỐI DO ĐIỂM SỐ KHÔNG HỢP LỆ:');
  scoreValidationErrors.slice(0, 10).forEach(e => console.log(`  * ${e}`));
}

// Chế độ Dry-Run
if (!isExecute) {
  console.log('\n========================================================================');
  console.log('🛡️ TRẠNG THÁI: KIỂM THỬ THÀNH CÔNG (--dry-run). CHƯA GHI VÀO FIRESTORE.');
  console.log(`- Số dòng đủ điều kiện ghi: ${parsedRecords.length}`);
  console.log('Để thực thi ghi thật, chạy:');
  console.log(`node scripts/import_reviews_from_form.mjs --file="${inputFilePath}" --execute --confirm-real-teacher-data`);
  console.log('========================================================================\n');
  process.exit(0);
}

// Chế độ Execute
if (parsedRecords.length === 0) {
  console.error('\n❌ Không có bản ghi hợp lệ nào để ghi vào Firestore!');
  process.exit(1);
}

console.log(`\n🚀 BẮT ĐẦU GHI VÀO FIRESTORE (COLLECTION: expert_reviews)...`);
console.log(`- Số dòng sẽ ghi thực tế: ${parsedRecords.length} bản ghi`);

const batch = db.batch();
parsedRecords.forEach(rec => {
  const ref = db.collection('expert_reviews').doc(rec.docId);
  const { maskedEmail, ...cleanDoc } = rec;
  batch.set(ref, cleanDoc, { merge: true });
});

await batch.commit();
console.log(`✅ ĐÃ GHI THÀNH CÔNG ${parsedRecords.length} BẢN GHI VÀO FIRESTORE COLLECTION 'expert_reviews'!`);
console.log('========================================================================\n');
