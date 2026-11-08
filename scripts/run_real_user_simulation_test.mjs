import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('='.repeat(70));
console.log('🏁 STEM HUB - HỆ THỐNG KIỂM THỬ E2E MÔ PHỎNG NGƯỜI DÙNG THẬT TOÀN DIỆN');
console.log('🎯 MỤC TIÊU: Test 100% tính năng trên Web thật (https://ai.stem-hub.top)');
console.log('='.repeat(70));

const suites = [
  { name: '01. Trang Chủ & Điều Hướng', file: 'tests/e2e/01_homepage_and_navigation.spec.js' },
  { name: '02. Hệ Thống Xác Thực Học Sinh', file: 'tests/e2e/02_auth_system.spec.js' },
  { name: '03. Phòng Thí Nghiệm STEM 3D', file: 'tests/e2e/03_stem_labs_deep_test.spec.js' },
  { name: '04. Trợ Lý AI NOVA & RAG Cache', file: 'tests/e2e/04_ai_assistant_real_interaction.spec.js' },
  { name: '05. Phòng Thi, Đấu Trường & Xếp Hạng', file: 'tests/e2e/05_exam_and_arena.spec.js' },
  { name: '06. Cổng Liên Hệ & Hộp Thư Góp Ý', file: 'tests/e2e/06_contact_and_feedback.spec.js' },
  { name: '07. Quản Trị Admin & Thẩm Định Tri Thức', file: 'tests/e2e/07_admin_dashboard_and_review.spec.js' },
  { name: '08. Thử Nghiệm Sức Chứa Đa Người Dùng', file: 'tests/e2e/08_real_user_capacity_stress.spec.js' },
];

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn(cmd, args, { shell: true, stdio: 'inherit' });
    proc.on('close', (code) => {
      resolve({ code, duration: Date.now() - start });
    });
  });
}

async function main() {
  const reportResults = [];

  for (const s of suites) {
    console.log(`\n▶️ Đang thực thi Suite: [${s.name}] (${s.file})...`);
    const res = await runCommand('npx', ['playwright', 'test', s.file]);
    reportResults.push({
      name: s.name,
      file: s.file,
      passed: res.code === 0,
      duration: (res.duration / 1000).toFixed(1)
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT THẬT:');
  console.log('='.repeat(70));
  reportResults.forEach(r => {
    console.log(`- ${r.passed ? '✅ ĐẠT' : '⚠️ CẦN LƯU Ý'}: ${r.name} (${r.duration}s)`);
  });

  const allPassedCount = reportResults.filter(r => r.passed).length;
  console.log(`\n🏆 TỔNG ĐẠT: ${allPassedCount}/${reportResults.length} Suites (${(allPassedCount / reportResults.length * 100).toFixed(1)}%)`);
}

main().catch(console.error);

