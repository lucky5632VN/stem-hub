// Quick validation test for all 5 bug fixes
// Run from: node tests/bugfix_validation.test.js

const { calculateLaserPath } = require('../functions/physicsEngine');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`✅ ${label}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${label}`);
    failed++;
  }
}

console.log('\n=== BUG FIX VALIDATION TESTS ===\n');

// ────────────────────────────────────────────────────────────────────
// VIỆC 1: status 'result' (can't test Firestore query here, verify via grep)
// ────────────────────────────────────────────────────────────────────
const fs = require('fs');
const dauTruongSrc = fs.readFileSync('src/app/dau-truong/page.js', 'utf-8');
const adminMatchesSrc = fs.readFileSync('src/app/admin/matches/page.js', 'utf-8');
const adminStudentsSrc = fs.readFileSync('src/app/admin/students/page.js', 'utf-8');

assert(
  !dauTruongSrc.includes("where('status', '==', 'finished')"),
  "VIỆC 1a: dau-truong/page.js không còn query status='finished'"
);
assert(
  dauTruongSrc.includes("where('status', '==', 'result')"),
  "VIỆC 1b: dau-truong/page.js đã dùng status='result'"
);
assert(
  adminMatchesSrc.includes("room.status === 'result'"),
  "VIỆC 1c: admin/matches/page.js nhận diện status='result'"
);
assert(
  adminStudentsSrc.includes("room.status === 'result'"),
  "VIỆC 1d: admin/students/page.js nhận diện status='result'"
);

// ────────────────────────────────────────────────────────────────────
// VIỆC 2: Debounce 300ms
// ────────────────────────────────────────────────────────────────────
assert(
  dauTruongSrc.includes('}, 300)') && dauTruongSrc.includes('debounceTimer'),
  "VIỆC 2: debounce 300ms đã được thêm vào physics submitAnswer"
);
assert(
  !dauTruongSrc.includes("setTimeout(updatePhysics, 0)"),
  "VIỆC 2b: timer cũ (0ms) đã bị xóa"
);

// ────────────────────────────────────────────────────────────────────
// VIỆC 3: timeRemaining anti-cheat rule
// ────────────────────────────────────────────────────────────────────
const rulesSrc = fs.readFileSync('firestore.rules', 'utf-8');
assert(
  rulesSrc.includes('isValidTimeRemainingUpdate()'),
  "VIỆC 3a: isValidTimeRemainingUpdate() được thêm vào allow update"
);
assert(
  rulesSrc.includes('request.resource.data.timeRemaining <= resource.data.timeRemaining'),
  "VIỆC 3b: rule chặn timeRemaining tăng đã được định nghĩa"
);

// ────────────────────────────────────────────────────────────────────
// VIỆC 4: Chemistry server-side validation
// ────────────────────────────────────────────────────────────────────
const functionsSrc = fs.readFileSync('functions/index.js', 'utf-8');
assert(
  functionsSrc.includes('isPhysicallyValid'),
  "VIỆC 4a: server-side physical validation đã được thêm"
);
assert(
  functionsSrc.includes('chemTemp !== undefined'),
  "VIỆC 4b: server kiểm tra chemTemp nếu client gửi kèm"
);
assert(
  functionsSrc.includes('chemEvap !== undefined'),
  "VIỆC 4c: server kiểm tra chemEvap nếu client gửi kèm"
);
assert(
  dauTruongSrc.includes("activeRoomId === 'local_sandbox'") && 
  dauTruongSrc.includes("Online mode: gửi lên server để validate, không tin trực tiếp từ iframe"),
  "VIỆC 4d: client iframe handler chuyển sang gọi server trong online mode"
);
assert(
  dauTruongSrc.includes('chemTemp,\n                chemHCl,\n                chemNaOH,\n                chemEvap: nextEvap'),
  "VIỆC 4e: handleChemistryRealtimeTick gửi kèm dữ liệu thô lên server"
);

// ────────────────────────────────────────────────────────────────────
// VIỆC 5: finalizeMatch transaction atomic
// ────────────────────────────────────────────────────────────────────
assert(
  !functionsSrc.includes("await db.collection('config').doc('systemSettings').get()"),
  "VIỆC 5a: systemSettings không còn được đọc ngoài transaction"
);
assert(
  functionsSrc.includes('transaction.get(settingsRef)'),
  "VIỆC 5b: settingsRef được đọc bằng transaction.get() bên trong transaction"
);
assert(
  functionsSrc.includes('[p1Doc, p2Doc, settingsSnap] = await Promise.all(['),
  "VIỆC 5c: tất cả reads được gộp trong 1 Promise.all() atomic"
);

// ────────────────────────────────────────────────────────────────────
// Physics engine still works
// ────────────────────────────────────────────────────────────────────
const correctMirrors = [
  { x: 45, y: 50, angle: 45 },
  { x: 175, y: 50, angle: 90 },
  { x: 175, y: 140, angle: 135 }
];
const result = calculateLaserPath(correctMirrors, { x: 45, y: 140 }, { x: 295, y: 140 });
assert(result.isHit === true, "Physics engine: [45,90,135] vẫn cho isHit=true sau các thay đổi");

const wrongMirrors = [
  { x: 45, y: 50, angle: 0 },
  { x: 175, y: 50, angle: 90 },
  { x: 175, y: 140, angle: 135 }
];
const resultWrong = calculateLaserPath(wrongMirrors, { x: 45, y: 140 }, { x: 295, y: 140 });
assert(resultWrong.isHit === false, "Physics engine: [0,90,135] vẫn cho isHit=false (sai đáp án bị chặn)");

// ────────────────────────────────────────────────────────────────────
// VIỆC 4 Layer 3: IDCL energy anti-cheat (iframe console injection protection)
// ────────────────────────────────────────────────────────────────────
const functionsSrcUpdated = fs.readFileSync('functions/index.js', 'utf-8');
assert(
  functionsSrcUpdated.includes('idclEnergy !== undefined && idclEnergy >= 100'),
  "VIỆC 4f: server từ chối khi idclEnergy=100 (không có thao tác thí nghiệm)"
);
assert(
  functionsSrcUpdated.includes('IFRAME_CHEAT_DETECTED'),
  "VIỆC 4g: server log cảnh báo khi phát hiện iframe console injection"
);
const dauTruongSrcUpdated = fs.readFileSync('src/app/dau-truong/page.js', 'utf-8');
assert(
  dauTruongSrcUpdated.includes('idclEnergy: event.data.energy'),
  "VIỆC 4h: client gửi kèm idclEnergy từ iframe postMessage lên server"
);

// ────────────────────────────────────────────────────────────────────
console.log(`\n=== KẾT QUẢ: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
