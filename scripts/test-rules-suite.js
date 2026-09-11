import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

const PROJECT_ID = 'cuoc-thi-ai-test-' + Date.now();
const rules = readFileSync('./firestore.rules', 'utf8');

async function runRuleTests() {
  console.log("🧪 BẮT ĐẦU CHẠY BỘ TEST CASE KIỂM THỬ FIRESTORE RULES...\n");
  
  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080
      }
    });
  } catch (e) {
    console.error("Không kết nối được tới Emulator ở cổng 8080:", e.message);
    process.exit(1);
  }

  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const studentDb = testEnv.authenticatedContext('student_uid_123', { role: 'student' }).firestore();
  const student2Db = testEnv.authenticatedContext('student_uid_456', { role: 'student' }).firestore();
  const adminDb = testEnv.authenticatedContext('admin_uid_777', { role: 'admin' }).firestore();

  // Setup initial mock data using withSecurityRulesDisabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminFirestore = context.firestore();
    await adminFirestore.doc('users/admin_uid_777').set({ displayName: 'Admin User', role: 'admin' });
    await adminFirestore.doc('users/student_uid_123').set({ displayName: 'Học Sinh A', role: 'student' });
    await adminFirestore.doc('users/student_uid_456').set({ displayName: 'Học Sinh B', role: 'student' });
    await adminFirestore.doc('exams/exam_01').set({ title: 'Đề thi Hoá học 10', duration: 45 });
    await adminFirestore.doc('config/systemSettings').set({ maintenanceMode: false, pvpEloFactor: 25 });
    await adminFirestore.doc('tournaments/tour_01').set({ title: 'Giải đấu Mùa 1', status: 'active' });
    await adminFirestore.doc('match_rooms/room_100').set({
      id: 'room_100',
      status: 'playing',
      player1: { uid: 'student_uid_123', name: 'Học Sinh A' },
      player2: { uid: 'student_uid_456', name: 'Học Sinh B' }
    });
    await adminFirestore.doc('moments/moment_200').set({
      id: 'moment_200',
      authorId: 'student_uid_123',
      caption: 'Thí nghiệm thành công!'
    });
    await adminFirestore.doc('moments/moment_to_delete').set({
      id: 'moment_to_delete',
      authorId: 'student_uid_123',
      caption: 'Bài viết xóa test'
    });
    await adminFirestore.doc('stories/student_uid_123').set({
      id: 'student_uid_123',
      userId: 'student_uid_123',
      stories: [{ caption: 'Story 1' }]
    });
    await adminFirestore.doc('stories/story_to_delete').set({
      id: 'story_to_delete',
      userId: 'student_uid_123',
      stories: [{ caption: 'Story deletion test' }]
    });
    await adminFirestore.doc('match_rooms/open_room_300').set({
      id: 'open_room_300',
      status: 'waiting',
      player1: { uid: 'student_uid_123', name: 'Học Sinh A' },
      player2: null
    });
  });

  const results = [];

  async function testCase(id, description, action, expectedPass) {
    try {
      if (expectedPass) {
        await assertSucceeds(action());
        results.push({ id, description, result: 'PASS', expected: 'ALLOW', got: 'ALLOW' });
      } else {
        await assertFails(action());
        results.push({ id, description, result: 'PASS', expected: 'DENY', got: 'DENY' });
      }
    } catch (err) {
      results.push({ 
        id, 
        description, 
        result: 'FAIL', 
        expected: expectedPass ? 'ALLOW' : 'DENY', 
        got: expectedPass ? 'DENY' : 'ALLOW',
        error: err.message 
      });
    }
  }

  // --- 1. KIỂM THỬ KHÓA ĐƯỜNG DẪN BẤT KỲ (WILDCARD) ---
  await testCase('TC01', 'Người dùng ẩn danh ghi vào collection ngẫu nhiên /random_collection/doc1', 
    () => unauthDb.doc('random_collection/doc1').set({ hack: true }), false);

  // --- 2. KIỂM THỬ USERS COLLECTION ---
  await testCase('TC02', 'Người dùng ẩn danh xóa tài khoản /users/student_uid_123', 
    () => unauthDb.doc('users/student_uid_123').delete(), false);
  await testCase('TC03', 'Học sinh B tự ý xóa tài khoản của Học sinh A /users/student_uid_123', 
    () => student2Db.doc('users/student_uid_123').delete(), false);
  await testCase('TC04', 'Học sinh A xóa chính tài khoản của mình /users/student_uid_123', 
    () => studentDb.doc('users/student_uid_123').delete(), true);
  await testCase('TC05', 'Học sinh cố tình tự thăng quyền role từ student thành admin khi update', 
    () => student2Db.doc('users/student_uid_456').update({ role: 'admin' }), false);

  // --- 3. KIỂM THỬ EXAMS COLLECTION ---
  await testCase('TC06', 'Người dùng ẩn danh đọc danh sách đề thi /exams/exam_01', 
    () => unauthDb.doc('exams/exam_01').get(), true);
  await testCase('TC07', 'Người dùng ẩn danh tự ý chỉnh sửa đề thi /exams/exam_01', 
    () => unauthDb.doc('exams/exam_01').update({ title: 'Đề thi bị hack' }), false);
  await testCase('TC08', 'Học sinh đã đăng nhập tự ý chỉnh sửa đề thi /exams/exam_01', 
    () => studentDb.doc('exams/exam_01').update({ title: 'Học sinh tự sửa đề' }), false);
  await testCase('TC09', 'Tài khoản Admin cập nhật đề thi /exams/exam_01', 
    () => adminDb.doc('exams/exam_01').update({ title: 'Đề thi đã duyệt' }), true);

  // --- 4. KIỂM THỬ CONFIG COLLECTION ---
  await testCase('TC10', 'Người dùng ẩn danh đọc cấu hình hệ thống /config/systemSettings', 
    () => unauthDb.doc('config/systemSettings').get(), true);
  await testCase('TC11', 'Người dùng ẩn danh sửa cấu hình hệ thống /config/systemSettings', 
    () => unauthDb.doc('config/systemSettings').update({ maintenanceMode: true }), false);
  await testCase('TC12', 'Học sinh đã đăng nhập sửa cấu hình hệ thống /config/systemSettings', 
    () => studentDb.doc('config/systemSettings').update({ pvpEloFactor: 9999 }), false);
  await testCase('TC13', 'Tài khoản Admin cập nhật cấu hình hệ thống /config/systemSettings', 
    () => adminDb.doc('config/systemSettings').update({ pvpEloFactor: 30 }), true);

  // --- 5. KIỂM THỬ TOURNAMENTS COLLECTION ---
  await testCase('TC14', 'Người dùng ẩn danh đọc danh sách giải đấu /tournaments/tour_01', 
    () => unauthDb.doc('tournaments/tour_01').get(), true);
  await testCase('TC15', 'Học sinh tự ý tạo/sửa giải đấu /tournaments/tour_02', 
    () => studentDb.doc('tournaments/tour_02').set({ title: 'Giải đấu chui' }), false);
  await testCase('TC16', 'Tài khoản Admin tạo/sửa giải đấu /tournaments/tour_02', 
    () => adminDb.doc('tournaments/tour_02').set({ title: 'Giải đấu Chính thức Mùa 2' }), true);

  // --- 6. KIỂM THỬ MATCH_ROOMS COLLECTION ---
  await testCase('TC17', 'Người dùng ẩn danh đọc thông tin phòng đấu /match_rooms/room_100', 
    () => unauthDb.doc('match_rooms/room_100').get(), true);
  await testCase('TC18', 'Người dùng ẩn danh đọc kịch bản bot bảo mật /match_rooms/room_100/bot_schedules/script', 
    () => unauthDb.doc('match_rooms/room_100/bot_schedules/script').get(), false);
  await testCase('TC19', 'Người dùng ngoài phòng (Stranger) cố ý sửa điểm số phòng /match_rooms/room_100', 
    () => testEnv.authenticatedContext('stranger_uid_999', { role: 'student' }).firestore().doc('match_rooms/room_100').update({ player1Score: 999 }), false);
  await testCase('TC20', 'Người chơi Player 1 trong trận cập nhật tiến độ /match_rooms/room_100', 
    () => studentDb.doc('match_rooms/room_100').update({ player1Progress: 50 }), true);

  // --- 7. KIỂM THỬ MOMENTS & STORIES COLLECTION ---
  await testCase('TC21', 'Người dùng ẩn danh đọc bài viết /moments/moment_200', 
    () => unauthDb.doc('moments/moment_200').get(), true);
  await testCase('TC22', 'Học sinh B cố ý xóa bài viết của Học sinh A /moments/moment_to_delete', 
    () => student2Db.doc('moments/moment_to_delete').delete(), false);
  await testCase('TC23', 'Học sinh A xóa bài viết của chính mình /moments/moment_to_delete', 
    () => studentDb.doc('moments/moment_to_delete').delete(), true);
  await testCase('TC24', 'Học sinh B cố ý xóa Story của Học sinh A /stories/story_to_delete', 
    () => student2Db.doc('stories/story_to_delete').delete(), false);
  await testCase('TC25', 'Học sinh A cập nhật Story của mình /stories/student_uid_123', 
    () => studentDb.doc('stories/student_uid_123').update({ updatedAt: Date.now() }), true);

  // --- 8. KIỂM THỬ BỔ SUNG (VÒNG BẢO MẬT CUỐI: TC26 - TC33) ---
  await testCase('TC26', 'Học sinh đăng nhập cố ghi trực tiếp /ai_metrics/metric_01', 
    () => studentDb.doc('ai_metrics/metric_01').set({ event: 'test' }), false);
  await testCase('TC27', 'Học sinh đăng nhập cố ghi trực tiếp /ai_reasoning_logs/log_01', 
    () => studentDb.doc('ai_reasoning_logs/log_01').set({ log: 'test' }), false);
  await testCase('TC28', 'Học sinh đăng nhập cố ghi vào RAG corpus /learned_knowledge/item_01', 
    () => studentDb.doc('learned_knowledge/item_01').set({ query: 'test' }), false);
  await testCase('TC29', 'Tài khoản Admin cập nhật RAG corpus /learned_knowledge/item_01', 
    () => adminDb.doc('learned_knowledge/item_01').set({ query: 'chuẩn' }), true);
  await testCase('TC30', 'Học sinh B cố ý sửa bài viết Moment của Học sinh A /moments/moment_200', 
    () => student2Db.doc('moments/moment_200').update({ caption: 'bị sửa' }), false);
  await testCase('TC31', 'Tác giả Học sinh A cập nhật bài viết Moment của mình /moments/moment_200', 
    () => studentDb.doc('moments/moment_200').update({ caption: 'chính chủ sửa' }), true);
  await testCase('TC32', 'Người lạ cố sửa bậy thông số phòng đấu mở /match_rooms/open_room_300', 
    () => student2Db.doc('match_rooms/open_room_300').update({ status: 'hacked', player1Score: 999 }), false);
  await testCase('TC33', 'Học sinh B tham gia phòng đấu mở (chỉ update field player2) /match_rooms/open_room_300', 
    () => student2Db.doc('match_rooms/open_room_300').update({ player2: { uid: 'student_uid_456', name: 'Học Sinh B' } }), true);

  // In bảng kết quả tổng hợp
  console.log("\n==========================================================================");
  console.log("📊 BẢNG KẾT QUẢ KIỂM THỬ AN NINH BẢO MẬT (FIRESTORE SECURITY AUDIT REPORT)");
  console.log("==========================================================================");
  console.log("| Mã TC | Nội Dung Kiểm Thử | Kỳ Vọng | Thực Tế | Kết Quả |");
  console.log("|-------|-------------------|---------|---------|---------|");
  results.forEach(r => {
    console.log(`| ${r.id.padEnd(5)} | ${r.description.padEnd(45)} | ${r.expected.padEnd(7)} | ${r.got.padEnd(7)} | ${r.result === 'PASS' ? '✅ PASS' : '❌ FAIL'} |`);
  });
  console.log("==========================================================================\n");

  await testEnv.cleanup();
}

runRuleTests().catch(err => {
  console.error("Lỗi khi thực thi Suite:", err);
  process.exit(1);
});
