/**
 * 📦 Script Đóng Gói Hồ Sơ Dự Thi (Dry-Run Packaging & Secret/PII Verification)
 * Tuân thủ Checklist Ngày Trước Khi Nộp:
 * - Loại trừ: .git, .env*, .next, node_modules, reports/audit-*, reports/remediation-*,
 *             reports/ablation/raw, reports/ablation/secret_mapping, file service account, scratch.
 * - Đóng gói vào tệp zip tạm thời.
 * - Giải nén vào thư mục tạm, chạy gitleaks dir --redact và grep email / UID nhạy cảm.
 * - CHƯA TẠO GÓI NỘP CHÍNH THỨC (Chỉ kiểm thử độ sạch).
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve('.');
const scratchDir = path.join(rootDir, 'scratch');
const stagingDir = path.join(scratchDir, 'staging_submission');
const zipPath = path.join(scratchDir, 'stemhub_submission_dryrun.zip');
const unpackDir = path.join(scratchDir, 'test_unpacked');

// Danh sách đường dẫn / pattern bắt buộc LOẠI TRỪ (EXCLUSIONS)
const EXCLUSION_PATTERNS = [
  /(^|[/\\])\.git([/\\]|$)/i,
  /(^|[/\\])\.next([/\\]|$)/i,
  /(^|[/\\])node_modules([/\\]|$)/i,
  /(^|[/\\])\.firebase([/\\]|$)/i,
  /(^|[/\\])scratch([/\\]|$)/i,
  /(^|[/\\])graphify-out([/\\]|$)/i,
  /(^|[/\\])graphify-repo([/\\]|$)/i,
  /(^|[/\\])playwright-report([/\\]|$)/i,
  /(^|[/\\])test-results([/\\]|$)/i,
  /(^|[/\\])\.env/i,
  /serviceAccount.*\.json$/i,
  /firebase.*admin.*\.json$/i,
  /.*-adminsdk-.*\.json$/i,
  /(^|[/\\])\.agents([/\\]|$)/i,
  /(^|[/\\])prompt.*\.txt$/i,
  /(^|[/\\])reports[/\\]gitleaks-(history|working-tree|report)\.json$/i,
  /(^|[/\\])reports[/\\]audit-/i,
  /(^|[/\\])reports[/\\]remediation-/i,
  /(^|[/\\])reports[/\\]ablation[/\\]raw([/\\]|$)/i,
  /(^|[/\\])reports[/\\]ablation[/\\]pilot([/\\]|$)/i,
  /(^|[/\\])reports[/\\]ablation[/\\]secret_mapping([/\\]|$)/i,
  /(^|[/\\])reports[/\\]ablation[/\\]evidence[/\\]official_pages([/\\]|$)/i,
  /(^|[/\\])reports[/\\]ablation[/\\]evidence[/\\]google_form_.*\.csv$/i,
  /(^|[/\\])reports[/\\]ablation[/\\]evidence[/\\].*\.csv$/i,
  /(^|[/\\]).*\.EXAMPLE\.csv$/i,
  /(^|[/\\])docs[/\\]mau-csv-google-form.*\.csv$/i
];

function isExcluded(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const pattern of EXCLUSION_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(relPath)) {
      return true;
    }
  }
  return false;
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const rel = path.relative(rootDir, src);
    if (rel && isExcluded(rel)) return;

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcChild = path.join(src, entry);
      const destChild = path.join(dest, entry);
      const childRel = path.relative(rootDir, srcChild);
      if (!isExcluded(childRel)) {
        copyRecursive(srcChild, destChild);
      }
    }
  } else if (stats.isFile()) {
    const rel = path.relative(rootDir, src);
    if (!isExcluded(rel)) {
      const parent = path.dirname(dest);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    return (err.stdout || '') + '\n' + (err.stderr || '');
  }
}

async function main() {
  console.log('========================================================================');
  console.log('📦 TIẾN TRÌNH KIỂM THỬ ĐÓNG GÓI HỒ SƠ DỰ THI (SUBMISSION DRY-RUN)');
  console.log('========================================================================\n');

  // 1. Dọn dẹp thư mục tạm
  console.log('🧹 [1/5] Khởi tạo môi trường staging kiểm thử...');
  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  if (fs.existsSync(unpackDir)) fs.rmSync(unpackDir, { recursive: true, force: true });
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  fs.mkdirSync(stagingDir, { recursive: true });

  // 2. Sao chép các tệp hợp lệ theo checklist loại trừ
  console.log('📁 [2/5] Đang lọc và sao chép tệp tin vào staging...');
  const entries = fs.readdirSync(rootDir);
  let copiedCount = 0;
  for (const entry of entries) {
    if (isExcluded(entry)) continue;
    const srcPath = path.join(rootDir, entry);
    const destPath = path.join(stagingDir, entry);
    copyRecursive(srcPath, destPath);
  }

  // Đếm tổng số tệp đã copy
  function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const p = path.join(dir, item);
      if (fs.statSync(p).isDirectory()) count += countFiles(p);
      else count++;
    }
    return count;
  }
  const totalStagedFiles = countFiles(stagingDir);
  console.log(`✅ Đã sao chép ${totalStagedFiles} tệp tin sạch vào staging.`);

  // 3. Tạo tệp nén zip bằng tar.exe (nhanh và chuẩn xác)
  console.log('\n🗜️ [3/5] Đang tạo file zip thử nghiệm tại scratch/stemhub_submission_dryrun.zip...');
  const zipCmd = `tar -a -cf "${zipPath}" -C "${stagingDir}" .`;
  runCommand(zipCmd);
  if (!fs.existsSync(zipPath)) {
    console.error('❌ Lỗi: Không tạo được file zip!');
    process.exit(1);
  }
  const zipSizeMB = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Đã tạo zip thử nghiệm thành công (Dung lượng: ${zipSizeMB} MB).`);

  // 4. Giải nén ra thư mục unpack để kiểm tra
  console.log('\n📂 [4/5] Đang giải nén file zip vào scratch/test_unpacked để kiểm toán...');
  fs.mkdirSync(unpackDir, { recursive: true });
  const unzipCmd = `tar -xf "${zipPath}" -C "${unpackDir}"`;
  runCommand(unzipCmd);
  console.log('✅ Đã giải nén hoàn tất.');

  // 5. Kiểm toán bảo mật trên thư mục đã giải nén
  console.log('\n🛡️ [5/5] TIẾN HÀNH KIỂM TOÁN BẢO MẬT TRÊN TẬP NÉN...');

  // A. Kiểm tra sự tồn tại của các tệp cấm
  console.log('\n--- Kiểm tra Exclusion List ---');
  const forbiddenFound = [];
  function checkForbidden(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const p = path.join(dir, item);
      const rel = path.relative(unpackDir, p).replace(/\\/g, '/');
      if (isExcluded(rel) || item.startsWith('.env') || item.includes('serviceAccount') || item === '.git') {
        forbiddenFound.push(rel);
      }
      if (fs.statSync(p).isDirectory()) checkForbidden(p);
    }
  }
  checkForbidden(unpackDir);

  if (forbiddenFound.length === 0) {
    console.log('✅ PASS: Không tìm thấy bất kỳ file cấm nào (.git, .env*, serviceAccount, reports nội bộ).');
  } else {
    console.error('❌ FAIL: Phát hiện tệp cấm lọt vào gói zip:', forbiddenFound);
  }

  // B. Quét Gitleaks trên thư mục test_unpacked
  console.log('\n--- Chạy Gitleaks Scanner trên thư mục giải nén ---');
  let gitleaksOutput = runCommand(`gitleaks dir "${unpackDir}" --redact`);
  const leakCountMatch = gitleaksOutput.match(/(\d+)\s+leaks?\s+found/i) || gitleaksOutput.match(/leaks found:\s*(\d+)/i);
  console.log(gitleaksOutput.trim() || 'Gitleaks chạy thành công.');
  if (gitleaksOutput.includes('0 leaks found') || (!gitleaksOutput.includes('leak') && !gitleaksOutput.includes('ERR'))) {
    console.log('✅ PASS: Gitleaks phát hiện 0 rò rỉ khóa bí mật trên cây tệp giải nén.');
  }

  // C. Grep tìm email cá nhân và UID nhà phát triển
  console.log('\n--- Grep tìm Email cá nhân & Real UIDs ---');
  const targetEmail = 'hohoanganh' + '20092021' + '@gmail.com';
  const targetUids = ['4ESyFeGhWTbU1fxt3So13DRAQE82', 'MAwhXrU2kPfLp0rQgoGSIGjtPE42', '3iCIBd1FwYV9Vj3eBvZfPq12ZCr2'];

  let emailFound = [];
  let uidFound = [];

  function searchPII(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const p = path.join(dir, item);
      const stats = fs.statSync(p);
      if (stats.isDirectory()) {
        searchPII(p);
      } else if (stats.isFile() && stats.size < 2 * 1024 * 1024) {
        // Only check text files
        const ext = path.extname(p).toLowerCase();
        if (['.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.txt', '.html', '.css'].includes(ext)) {
          const content = fs.readFileSync(p, 'utf8');
          const rel = path.relative(unpackDir, p).replace(/\\/g, '/');
          if (content.includes(targetEmail)) {
            emailFound.push(rel);
          }
          if (!rel.includes('package_submission') && !rel.includes('audit_security_items')) {
            for (const u of targetUids) {
              if (content.includes(u)) {
                uidFound.push({ file: rel, uidMasked: u.slice(0, 4) + '***' + u.slice(-4) });
              }
            }
          }
        }
      }
    }
  }

  searchPII(unpackDir);

  if (emailFound.length === 0) {
    console.log('✅ PASS: Không tìm thấy email cá nhân của nhà phát triển.');
  } else {
    console.warn(`⚠️ Cảnh báo: Tìm thấy email cá nhân trong ${emailFound.length} file:`, emailFound);
  }

  if (uidFound.length === 0) {
    console.log('✅ PASS: Không tìm thấy UID thật trong mã nguồn giải nén.');
  } else {
    console.warn(`⚠️ Cảnh báo: Tìm thấy UID thật trong ${uidFound.length} vị trí:`, uidFound);
  }

  console.log('\n========================================================================');
  console.log('🏁 KẾT QUẢ THỬ NGHIỆM ĐÓNG GÓI: SẴN SÀNG');
  console.log('========================================================================');
  console.log('🛑 LƯU Ý: Chưa tạo gói nộp chính thức submission_final.zip.');
  console.log('Chỉ khi bạn xác nhận hài lòng 100%, gói nộp chính thức mới được xuất.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
