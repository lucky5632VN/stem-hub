import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';

async function runClientRegistrationRulesTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ CLIENT REGISTRATION & PRIVILEGE ESCALATION RULES ===");
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'stem-hub-registration-test',
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080
      }
    });
  } catch (err) {
    if (err?.message?.includes('fetch failed') || err?.cause?.code === 'ECONNREFUSED') {
      console.error("\n❌ [LỖI KẾT NỐI]: Firestore Local Emulator chưa được bật trên cổng 8080!");
      process.exit(1);
    }
    throw err;
  }

  // Student auth context (token không có custom claims admin/teacher)
  const studentUid = 'new_student_123';
  const studentContext = testEnv.authenticatedContext(studentUid, { email: 'student_new@stem-hub.top' });
  const studentDb = studentContext.firestore();

  // Attacker attempting privilege escalation
  const attackerUid = 'attacker_456';
  const attackerContext = testEnv.authenticatedContext(attackerUid, { email: 'attacker@evil.com' });
  const attackerDb = attackerContext.firestore();

  // User whose doc might have role: 'admin' in database, but token does NOT have claims
  const impostorUid = 'impostor_doc_admin';
  const impostorContext = testEnv.authenticatedContext(impostorUid, { email: 'impostor@gmail.com' });
  const impostorDb = impostorContext.firestore();

  let passed = 0;
  let total = 0;

  async function testCase(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Tạo users/{uid} mới hợp lệ không có trường role/reviewerType/faceDescriptor
  await testCase('1. Đăng ký học sinh mới: Tạo users/{uid} với schema client mới hợp lệ', async () => {
    const userRef = studentDb.collection('users').doc(studentUid);
    await assertSucceeds(userRef.set({
      uid: studentUid,
      email: 'student_new@stem-hub.top',
      displayName: 'Học Sinh Mới',
      school: 'THPT Chuyên',
      grade: '11',
      createdAt: new Date().toISOString()
    }));
  });

  // 2. Chặn client tự gắn role: 'admin' khi tạo document
  await testCase('2. Chặn leo thang đặc quyền: Tạo users/{uid} có role="admin" bị từ chối', async () => {
    const userRef = attackerDb.collection('users').doc(attackerUid);
    await assertFails(userRef.set({
      uid: attackerUid,
      email: 'attacker@evil.com',
      role: 'admin',
      displayName: 'Attacker'
    }));
  });

  // 3. Chặn client tự gắn reviewerType: 'teacher' khi tạo document
  await testCase('3. Chặn giả mạo giáo viên: Tạo users/{uid} có reviewerType="teacher" bị từ chối', async () => {
    const userRef = attackerDb.collection('users').doc(attackerUid);
    await assertFails(userRef.set({
      uid: attackerUid,
      email: 'attacker@evil.com',
      reviewerType: 'teacher',
      displayName: 'Attacker Teacher'
    }));
  });

  // 4. Chặn client lưu faceDescriptor vào document gốc khi tạo
  await testCase('4. Chặn rò rỉ sinh trắc học: Tạo users/{uid} có faceDescriptor ở doc gốc bị từ chối', async () => {
    const userRef = attackerDb.collection('users').doc(attackerUid);
    await assertFails(userRef.set({
      uid: attackerUid,
      email: 'attacker@evil.com',
      faceDescriptor: [0.12, 0.34, 0.56]
    }));
  });

  // 5. Chặn client cập nhật role thành 'admin' trên document đã tồn tại
  await testCase('5. Chặn cập nhật role: Học sinh cập nhật role="admin" bị từ chối', async () => {
    const userRef = studentDb.collection('users').doc(studentUid);
    await assertFails(userRef.update({
      role: 'admin'
    }));
  });

  // 6. Chặn client tự cập nhật điểm số elo / crystals
  await testCase('6. Chặn tự sửa elo/crystals: Học sinh cập nhật elo=2500 bị từ chối', async () => {
    const userRef = studentDb.collection('users').doc(studentUid);
    await assertFails(userRef.update({
      elo: 2500
    }));
  });

  // 7. Học sinh tự cập nhật trường thông tin profile cho phép
  await testCase('7. Cập nhật profile hợp lệ: Sửa displayName, school, lastActive thành công', async () => {
    const userRef = studentDb.collection('users').doc(studentUid);
    await assertSucceeds(userRef.update({
      displayName: 'Học Sinh Mới Đã Đổi Tên',
      school: 'THPT Hà Nội - Amsterdam',
      lastActive: Date.now()
    }));
  });

  // 8. User có document chứa role: 'admin' (giả lập nạp sẵn qua admin SDK) nhưng KHÔNG có claims token:
  // Cố gắng ghi vào collection config/systemSettings -> Bị từ chối
  await testCase('8. Phân quyền token độc lập: User có doc role="admin" nhưng không có custom claim bị chặn ghi config', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(impostorUid).set({
        uid: impostorUid,
        email: 'impostor@gmail.com',
        role: 'admin'
      });
    });

    const configRef = impostorDb.collection('config').doc('systemSettings');
    await assertFails(configRef.set({ maintenance: true }));
  });

  await testEnv.cleanup();

  console.log(`\n========================================================================`);
  console.log(`Kết quả kiểm thử đăng ký client: ${passed}/${total} test cases passed`);
  console.log(`========================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runClientRegistrationRulesTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
