import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ FIRESTORE RULES ===");
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'stem-hub-43e96',
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080
      }
    });
  } catch (err) {
    if (err?.message?.includes('fetch failed') || err?.cause?.code === 'ECONNREFUSED') {
      console.error("\n❌ [LỖI KẾT NỐI]: Firestore Local Emulator chưa được bật trên cổng 8080!");
      console.error("👉 Hãy chạy lệnh sau để tự động bật emulator và chạy test:");
      console.error("   npx firebase emulators:exec --only firestore \"node tests/firestore.rules.test.js\"");
      console.error("👉 Hoặc mở một terminal riêng và chạy: npx firebase emulators:start --only firestore\n");
      process.exit(1);
    }
    throw err;
  }

  // Tạo client context
  const aliceContext = testEnv.authenticatedContext('alice', { email: 'alice@gmail.com' });
  const bobContext = testEnv.authenticatedContext('bob', { email: 'bob@gmail.com' });
  const charlieContext = testEnv.authenticatedContext('charlie', { email: 'charlie@gmail.com' });
  const teacherContext = testEnv.authenticatedContext('teacher', { email: 'teacher@stemhub.edu.vn', role: 'teacher' });
  const adminContext = testEnv.authenticatedContext('admin', { email: 'admin@stemhub.edu.vn', role: 'admin', admin: true });
  const impostorAdminContext = testEnv.authenticatedContext('impostor_admin', { email: 'admin123@gmail.com' });
  const mathTeacherContext = testEnv.authenticatedContext('math_teacher', { email: 'teacher_toan@stemhub.edu.vn', role: 'teacher', subjects: ['toan'], isTeamMember: false });
  const teamTeacherContext = testEnv.authenticatedContext('team_teacher', { email: 'teacher_team@stemhub.edu.vn', role: 'teacher', subjects: ['toan'], isTeamMember: true });
  const teamSelfContext = testEnv.authenticatedContext('team_member', { email: 'member@stemhub.edu.vn', role: 'team_self' });
  const unauthContext = testEnv.unauthenticatedContext();

  const aliceDb = aliceContext.firestore();
  const bobDb = bobContext.firestore();
  const charlieDb = charlieContext.firestore();
  const teacherDb = teacherContext.firestore();
  const adminDb = adminContext.firestore();
  const impostorAdminDb = impostorAdminContext.firestore();
  const mathTeacherDb = mathTeacherContext.firestore();
  const teamTeacherDb = teamTeacherContext.firestore();
  const teamSelfDb = teamSelfContext.firestore();
  const unauthDb = unauthContext.firestore();

  let failedTests = 0;
  let passedTests = 0;
  let totalTests = 0;

  async function check(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`✅ [PASS] ${name}`);
    } catch (e) {
      console.error(`❌ [FAIL] ${name}:`, e);
      failedTests++;
    }
  }

  // Set up mock data
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('users').doc('alice').set({
      displayName: 'Alice',
      bio: 'Hello STEM',
      personalization: { elo: 1000, level: 1, crystals: 500 },
      friends: [],
      incomingRequests: [],
      outgoingRequests: []
    });

    await db.collection('users').doc('teacher').set({
      displayName: 'Thầy Giáo STEM',
      role: 'teacher'
    });

    await db.collection('users').doc('admin').set({
      displayName: 'Quản trị viên STEM',
      role: 'admin'
    });

    await db.collection('users').doc('impostor_admin').set({
      displayName: 'Kẻ giả mạo Admin qua document',
      role: 'admin'
    });

    // Mock data cho learned_knowledge
    await db.collection('learned_knowledge').doc('verified_doc').set({
      query: 'Thế nào là hiện tượng nhật thực?',
      answer: 'Nhật thực xảy ra khi Mặt Trăng đi qua giữa Trái Đất và Mặt Trời.',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: false,
      isDemo: false
    });

    await db.collection('learned_knowledge').doc('pending_doc').set({
      query: 'Định luật vạn vật hấp dẫn của Newton?',
      answer: 'Mọi hạt vật chất trong vũ trụ đều hút mọi hạt khác với một lực tỉ lệ thuận tích khối lượng.',
      status: 'pending_review',
      teacherVerified: false,
      quarantined: false,
      isDemo: false
    });

    await db.collection('learned_knowledge').doc('quarantined_doc').set({
      query: 'Cách tạo chất nổ nguy hiểm?',
      answer: 'Nội dung này vi phạm chính sách an toàn của hệ thống giáo dục STEM.',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: true,
      isDemo: false
    });

    await db.collection('learned_knowledge').doc('demo_doc').set({
      query: 'Câu hỏi mẫu thử nghiệm hệ thống?',
      answer: 'Đây là câu hỏi mẫu dùng trong môi trường thử nghiệm và kiểm thử tự động.',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: false,
      isDemo: true
    });
  });

  // TEST 1: Xem user khi chưa đăng nhập
  await check("Chưa đăng nhập không được đọc danh sách users", async () => {
    await assertFails(unauthDb.collection('users').get());
  });

  // TEST 2: Đăng nhập được đọc users
  await check("Đăng nhập rồi được đọc users", async () => {
    await assertSucceeds(aliceDb.collection('users').doc('alice').get());
  });

  // TEST 3: Cập nhật profile của chính mình với các trường trong whitelist
  await check("User tự cập nhật displayName của mình", async () => {
    await assertSucceeds(aliceDb.collection('users').doc('alice').update({
      displayName: 'Alice Cooper'
    }));
  });

  // TEST 4: Chặn tự cập nhật stats (chỉ số nhạy cảm nằm ngoài whitelist)
  await check("Chặn user tự cập nhật stats (không nằm trong whitelist)", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({
      stats: { elo: 2000, level: 2 }
    }));
  });

  // TEST 5: Chặn tự cập nhật personalization.crystals
  await check("Chặn user tự cập nhật personalization.crystals", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({
      'personalization.crystals': 9999
    }));
  });

  // =========================================================================
  // KIỂM THỬ BẢO MẬT ADMIN & RBAC STRICT (ITEM 1B)
  // =========================================================================
  // (i) Tạo users/{uid} mới với role: 'admin' bị từ chối
  await check("Test 5.1 (i): Tạo users/{uid} mới với role:'admin' BỊ TỪ CHỐI", async () => {
    await assertFails(bobDb.collection('users').doc('bob').set({
      displayName: 'Bob Hacking Admin',
      role: 'admin'
    }));
  });

  await check("Test 5.2 (i): Tạo users/{uid} mới với reviewerType/subjects/isTeamMember BỊ TỪ CHỐI", async () => {
    await assertFails(bobDb.collection('users').doc('bob').set({
      displayName: 'Bob Hacking Teacher',
      reviewerType: 'teacher'
    }));
    await assertFails(bobDb.collection('users').doc('bob').set({
      displayName: 'Bob Hacking Subjects',
      subjects: ['toan']
    }));
  });

  await check("Test 5.3 (i): Tạo users/{uid} hợp lệ không chứa role/privilege fields THÀNH CÔNG", async () => {
    await assertSucceeds(bobDb.collection('users').doc('bob').set({
      displayName: 'Bob Student'
    }));
  });

  // (ii) Sửa role thành admin bị từ chối
  await check("Test 5.4 (ii): Sửa role thành 'admin' hoặc đặc quyền reviewer BỊ TỪ CHỐI", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({
      role: 'admin'
    }));
    await assertFails(aliceDb.collection('users').doc('alice').update({
      reviewerType: 'teacher'
    }));
    await assertFails(aliceDb.collection('users').doc('alice').update({
      subjects: ['toan']
    }));
    await assertFails(aliceDb.collection('users').doc('alice').update({
      isTeamMember: true
    }));
  });

  // (iii) User có document role: 'admin' nhưng không có custom claims không có quyền admin ở rules
  await check("Test 5.5 (iii): User có document role:'admin' nhưng KHÔNG có custom claims KHÔNG có quyền admin ở rules", async () => {
    // impostor_admin có document users/impostor_admin với role: 'admin' nhưng token không có admin claim
    // Thử ghi vào system_config (yêu cầu isAdmin()) -> BỊ TỪ CHỐI
    await assertFails(impostorAdminDb.collection('system_config').doc('app_config').set({
      maintenance: true
    }));
    // Trong khi admin thật có custom claims (admin: true) -> THÀNH CÔNG
    await assertSucceeds(adminDb.collection('system_config').doc('app_config').set({
      maintenance: false
    }));
  });

  // Setup match room mock data
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('match_rooms').doc('room1').set({
      player1: { uid: 'alice' },
      player2: { uid: 'bob', name: 'Bob' },
      player1Progress: 0,
      player2Progress: 0,
      player1TabSwitches: 1,
      player2TabSwitches: 1,
      timeRemaining: 180,
      status: 'playing'
    });

    await db.collection('match_rooms').doc('room_waiting').set({
      player1: { uid: 'alice' },
      player2: null,
      player1Progress: 0,
      player2Progress: 0,
      timeRemaining: 180,
      status: 'waiting'
    });
  });

  // TEST 6: Host ghi heartbeat và cập nhật timeRemaining
  await check("Host ghi heartbeat và cập nhật timeRemaining", async () => {
    await assertSucceeds(aliceDb.collection('match_rooms').doc('room1').update({
      lastHeartbeat: Date.now(),
      timeRemaining: 179
    }));
  });

  // TEST 7: Chặn ghi progress trong match_rooms
  await check("Chặn user cập nhật player1Progress trong match_rooms", async () => {
    await assertFails(aliceDb.collection('match_rooms').doc('room1').update({
      player1Progress: 50
    }));
  });

  // TEST 8: Chặn ghi winnerId trong match_rooms
  await check("Chặn user cập nhật winnerId trong match_rooms", async () => {
    await assertFails(aliceDb.collection('match_rooms').doc('room1').update({
      winnerId: 'alice'
    }));
  });

  // TEST 9: Player 1 ghi nhận tab switches tăng dần (HỢP LỆ)
  await check("Player 1 cập nhật player1TabSwitches tăng dần", async () => {
    await assertSucceeds(aliceDb.collection('match_rooms').doc('room1').update({
      player1TabSwitches: 2
    }));
  });

  // TEST 10: Chặn Player 1 ghi nhận tab switches giảm đi hoặc bằng cũ (GIAN LẬN)
  await check("Chặn Player 1 cập nhật player1TabSwitches giảm đi hoặc giữ nguyên", async () => {
    await assertFails(aliceDb.collection('match_rooms').doc('room1').update({
      player1TabSwitches: 1
    }));
  });

  // TEST 11: Chặn Player 1 ghi đè tab switches của Player 2
  await check("Chặn Player 1 cập nhật player2TabSwitches của đối thủ", async () => {
    await assertFails(aliceDb.collection('match_rooms').doc('room1').update({
      player2TabSwitches: 2
    }));
  });

  // TEST 12: Chặn client tự ý thay đổi status sang finished
  await check("Chặn client tự thay đổi status sang finished", async () => {
    await assertFails(aliceDb.collection('match_rooms').doc('room1').update({
      status: 'finished'
    }));
  });

  // TEST 13: Cho phép chuyển status từ waiting sang playing khi Player 2 join phòng
  await check("Cho phép chuyển status từ waiting sang playing khi Player 2 join", async () => {
    await assertSucceeds(bobDb.collection('match_rooms').doc('room_waiting').update({
      status: 'playing',
      player2: { uid: 'bob', name: 'Bob' }
    }));
  });

  // TEST 14: Chặn học sinh thứ 3 ghi đè player2 khi phòng đã đủ 2 người
  await check("Chặn học sinh thứ 3 ghi đè player2 khi phòng đã có Player 2", async () => {
    await assertFails(charlieDb.collection('match_rooms').doc('room1').update({
      player2: { uid: 'charlie', name: 'Charlie' }
    }));
  });

  // TEST 15: Chặn học sinh tự ý join phòng mạo danh người khác
  await check("Chặn học sinh tự ý join phòng mạo danh uid khác", async () => {
    await assertFails(bobDb.collection('match_rooms').doc('room_waiting').update({
      player2: { uid: 'charlie', name: 'Charlie' }
    }));
  });

  // =========================================================================
  // KIỂM THỬ learned_knowledge (RAG Knowledge Base)
  // =========================================================================

  // Test A: Unauthenticated user CANNOT read learned_knowledge collection if it has pending or quarantined items
  await check("Test A: Unauthenticated user CANNOT read learned_knowledge collection if it has pending or quarantined items", async () => {
    await assertFails(unauthDb.collection('learned_knowledge').get());
  });

  // Test B: Student CAN create learned_knowledge with status: 'pending_review' and teacherVerified: false
  await check("Test B: Student CAN create learned_knowledge with status: 'pending_review' and teacherVerified: false", async () => {
    await assertSucceeds(aliceDb.collection('learned_knowledge').doc('student_sub_1').set({
      query: 'Tại sao bầu trời lại có màu xanh lam?',
      answer: 'Do hiện tượng tán xạ Rayleigh khi ánh sáng mặt trời chiếu vào bầu khí quyển Trái Đất.',
      status: 'pending_review',
      teacherVerified: false,
      quarantined: false,
      isDemo: false
    }));
  });

  // Test C: Student CANNOT create learned_knowledge with status: 'verified_by_teacher' or teacherVerified: true (Permission Denied)
  await check("Test C: Student CANNOT create learned_knowledge with status: 'verified_by_teacher' or teacherVerified: true", async () => {
    await assertFails(aliceDb.collection('learned_knowledge').doc('student_sub_bad_1').set({
      query: 'Tại sao lá cây có màu xanh lục?',
      answer: 'Vì trong lục lạp của tế bào thực vật có chứa chất diệp lục hấp thụ ánh sáng đỏ và xanh lam.',
      status: 'verified_by_teacher',
      teacherVerified: false,
      quarantined: false,
      isDemo: false
    }));
    await assertFails(aliceDb.collection('learned_knowledge').doc('student_sub_bad_2').set({
      query: 'Tại sao lá cây có màu xanh lục?',
      answer: 'Vì trong lục lạp của tế bào thực vật có chứa chất diệp lục hấp thụ ánh sáng đỏ và xanh lam.',
      status: 'pending_review',
      teacherVerified: true,
      quarantined: false,
      isDemo: false
    }));
  });

  // Test D: Student CANNOT update learned_knowledge to verified_by_teacher
  await check("Test D: Student CANNOT update learned_knowledge to verified_by_teacher", async () => {
    await assertFails(aliceDb.collection('learned_knowledge').doc('pending_doc').update({
      status: 'verified_by_teacher',
      teacherVerified: true
    }));
  });

  // Test E: Admin / Teacher CAN update learned_knowledge
  await check("Test E: Admin / Teacher CAN update learned_knowledge", async () => {
    await assertSucceeds(adminDb.collection('learned_knowledge').doc('pending_doc').update({
      status: 'verified_by_teacher',
      teacherVerified: true,
      verifiedBy: 'admin'
    }));
    await assertSucceeds(teacherDb.collection('learned_knowledge').doc('verified_doc').update({
      answer: 'Nhật thực toàn phần là hiện tượng kỳ thú khi Mặt Trăng che khuất hoàn toàn Mặt Trời.'
    }));
  });

  // Test F: Authenticated user CAN read verified, non-quarantined, non-demo learned_knowledge
  await check("Test F: Authenticated user CAN read verified, non-quarantined, non-demo learned_knowledge", async () => {
    await assertSucceeds(aliceDb.collection('learned_knowledge').doc('verified_doc').get());
  });

  // Test G: User CANNOT read quarantined or demo learned_knowledge directly
  await check("Test G: User CANNOT read quarantined or demo learned_knowledge directly", async () => {
    await assertFails(aliceDb.collection('learned_knowledge').doc('quarantined_doc').get());
    await assertFails(aliceDb.collection('learned_knowledge').doc('demo_doc').get());
  });

  // Test H: Student CANNOT escalate role to admin or teacher on users/{uid}
  await check("Test H: Student CANNOT escalate role to admin or teacher on users/{uid}", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({ role: 'admin' }));
    await assertFails(aliceDb.collection('users').doc('alice').update({ role: 'teacher' }));
    await assertFails(aliceDb.collection('users').doc('alice').update({ isAdmin: true }));
  });

  // Test I: Student CANNOT set teacherVerified, verifiedBy, quarantined, isDemo on users/{uid}
  await check("Test I: Student CANNOT set teacherVerified, verifiedBy, quarantined, isDemo on users/{uid}", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({ teacherVerified: true }));
    await assertFails(aliceDb.collection('users').doc('alice').update({ verifiedBy: 'admin' }));
    await assertFails(aliceDb.collection('users').doc('alice').update({ quarantined: false }));
    await assertFails(aliceDb.collection('users').doc('alice').update({ isDemo: false }));
  });

  // Test J: Student CANNOT update any field on learned_knowledge (status, teacherVerified, verifiedBy, quarantined, isDemo)
  await check("Test J: Student CANNOT update any field on learned_knowledge", async () => {
    await assertFails(aliceDb.collection('learned_knowledge').doc('pending_doc').update({ quarantined: false }));
    await assertFails(aliceDb.collection('learned_knowledge').doc('pending_doc').update({ isDemo: false }));
    await assertFails(aliceDb.collection('learned_knowledge').doc('pending_doc').update({ verifiedBy: 'alice' }));
    await assertFails(aliceDb.collection('learned_knowledge').doc('pending_doc').update({ answer: 'Tampered answer' }));
  });

  // Test K: Student CANNOT create, update, delete or read admin_logs
  await check("Test K: Student CANNOT create, update, delete or read admin_logs", async () => {
    await assertFails(aliceDb.collection('admin_logs').doc('log_1').set({ action: 'tamper' }));
    await assertFails(aliceDb.collection('admin_logs').doc('log_1').update({ action: 'tamper' }));
    await assertFails(aliceDb.collection('admin_logs').doc('log_1').delete());
    await assertFails(aliceDb.collection('admin_logs').doc('log_1').get());
  });

  // Test L: Student CANNOT read pending/unverified learned_knowledge
  await check("Test L: Student CANNOT read pending/unverified learned_knowledge", async () => {
    await assertFails(bobDb.collection('learned_knowledge').doc('student_sub_1').get());
    await assertFails(aliceDb.collection('learned_knowledge').doc('student_sub_1').get());
  });

  // =========================================================================
  // KIỂM THỬ BẢO VỆ DỮ LIỆU SINH TRẮC HỌC (REQUIREMENT 1 - BIOMETRICS PRIVACY)
  // =========================================================================

  const mockVector = new Array(128).fill(0.123456);

  // Test M: Chủ sở hữu (Alice) CÓ THỂ đọc, ghi, xóa trong users/{uid}/private/biometrics
  await check("Test M: Chủ sở hữu (Alice) CÓ THỂ đọc, ghi, xóa users/alice/private/biometrics", async () => {
    // Write
    await assertSucceeds(aliceDb.collection('users').doc('alice').collection('private').doc('biometrics').set({
      faceDescriptor: mockVector,
      updatedAt: new Date().toISOString()
    }));
    // Read
    await assertSucceeds(aliceDb.collection('users').doc('alice').collection('private').doc('biometrics').get());
    // Delete
    await assertSucceeds(aliceDb.collection('users').doc('alice').collection('private').doc('biometrics').delete());
  });

  // Test N: Người dùng khác đã đăng nhập (Bob) KHÔNG THỂ đọc biometrics của Alice
  await check("Test N: Người dùng khác đã đăng nhập (Bob) KHÔNG THỂ đọc users/alice/private/biometrics", async () => {
    // Setup biometrics for Alice via admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('alice').collection('private').doc('biometrics').set({
        faceDescriptor: mockVector
      });
    });
    await assertFails(bobDb.collection('users').doc('alice').collection('private').doc('biometrics').get());
  });

  // Test O: Người dùng chưa đăng nhập KHÔNG THỂ đọc biometrics của Alice
  await check("Test O: Người dùng chưa đăng nhập KHÔNG THỂ đọc users/alice/private/biometrics", async () => {
    await assertFails(unauthDb.collection('users').doc('alice').collection('private').doc('biometrics').get());
  });

  // Test P: Teacher / Admin KHÔNG THỂ đọc biometrics của Alice (Zero-Access)
  await check("Test P: Teacher và Admin KHÔNG THỂ đọc users/alice/private/biometrics", async () => {
    await assertFails(teacherDb.collection('users').doc('alice').collection('private').doc('biometrics').get());
    await assertFails(adminDb.collection('users').doc('alice').collection('private').doc('biometrics').get());
  });

  // Test Q: Alice KHÔNG THỂ ghi hoặc cập nhật faceDescriptor lên users/alice gốc
  await check("Test Q: Alice KHÔNG THỂ cập nhật faceDescriptor lên users/alice gốc", async () => {
    await assertFails(aliceDb.collection('users').doc('alice').update({
      faceDescriptor: mockVector
    }));
    await assertFails(aliceDb.collection('users').doc('alice').update({
      'personalization.faceDescriptor': mockVector
    }));
  });

  // Test R: Không thể tạo tài khoản mới chứa faceDescriptor ở tài liệu gốc
  await check("Test R: Không thể tạo user mới chứa faceDescriptor ở tài liệu gốc", async () => {
    const newUserContext = testEnv.authenticatedContext('new_user_1', { email: 'new1@gmail.com' });
    const newUserDb = newUserContext.firestore();
    await assertFails(newUserDb.collection('users').doc('new_user_1').set({
      displayName: 'New User',
      faceDescriptor: mockVector
    }));
    await assertFails(newUserDb.collection('users').doc('new_user_1').set({
      displayName: 'New User',
      personalization: { faceDescriptor: mockVector }
    }));
  });

  // =========================================================================
  // KIỂM THỬ XÓA EMAIL WHITELIST TRONG isAdmin()
  // =========================================================================
  await check("Test S: Tài khoản có email admin123@gmail.com nhưng không có role/claims admin KHÔNG có quyền admin", async () => {
    await assertFails(impostorAdminDb.collection('admin_logs').doc('tamper_log').set({ action: 'impostor' }));
  });

  await check("Test T: Admin có claims admin: true HOẶC role: 'admin' CÓ quyền admin", async () => {
    await assertSucceeds(adminDb.collection('admin_logs').doc('valid_log').set({ action: 'approved_audit' }));
  });

  // =========================================================================
  // KIỂM THỬ /expert_reviews/{reviewId} (Teacher Review Portal)
  // =========================================================================
  const validRubricReview = {
    reviewerUid: 'math_teacher',
    reviewerType: 'teacher',
    subject: 'toan',
    scores: {
      knowledge: 2,
      grounding: 2,
      pedagogy: 1,
      safety: 2
    },
    primaryError: 'none',
    skipped: false
  };

  await check("Test U: Unauthenticated user KHÔNG THỂ đọc hoặc tạo expert_reviews", async () => {
    await assertFails(unauthDb.collection('expert_reviews').doc('rev_unauth').get());
    await assertFails(unauthDb.collection('expert_reviews').doc('rev_unauth').set(validRubricReview));
  });

  await check("Test V: Giáo viên có quyền subject='toan' và isTeamMember=false CÓ THỂ tạo expert_review môn toán", async () => {
    await assertSucceeds(mathTeacherDb.collection('expert_reviews').doc('rev_math_1').set(validRubricReview));
  });

  await check("Test W: Giáo viên KHÔNG THỂ tạo expert_review cho môn không được phân công (ví dụ: 'ly')", async () => {
    await assertFails(mathTeacherDb.collection('expert_reviews').doc('rev_ly_1').set({
      ...validRubricReview,
      subject: 'ly'
    }));
  });

  await check("Test X: Giáo viên là thành viên nhóm (isTeamMember=true) KHÔNG THỂ chấm với tư cách 'teacher'", async () => {
    await assertFails(teamTeacherDb.collection('expert_reviews').doc('rev_team_as_teacher').set({
      ...validRubricReview,
      reviewerUid: 'team_teacher'
    }));
  });

  await check("Test Y: Thành viên nhóm (team_self) CÓ THỂ chấm với reviewerType='team_self'", async () => {
    await assertSucceeds(teamSelfDb.collection('expert_reviews').doc('rev_team_self_1').set({
      reviewerUid: 'team_member',
      reviewerType: 'team_self',
      subject: 'stem',
      scores: {
        knowledge: 1,
        grounding: 2,
        pedagogy: 2,
        safety: 2
      },
      primaryError: 'none',
      skipped: false
    }));
  });

  await check("Test Z: Học sinh thường KHÔNG THỂ mạo danh để tạo expert_review", async () => {
    await assertFails(aliceDb.collection('expert_reviews').doc('rev_alice_fake').set({
      ...validRubricReview,
      reviewerUid: 'alice'
    }));
  });

  await check("Test AA: Điểm rubric không hợp lệ (ví dụ: 3 điểm) BỊ TỪ CHỐI", async () => {
    await assertFails(mathTeacherDb.collection('expert_reviews').doc('rev_invalid_score').set({
      ...validRubricReview,
      scores: {
        knowledge: 3, // Chỉ chấp nhận 0, 1, 2
        grounding: 2,
        pedagogy: 1,
        safety: 2
      }
    }));
  });

  await check("Test AB: Phiếu skipped=true bắt buộc phải có skipReason không rỗng", async () => {
    // Không có skipReason -> FAIL
    await assertFails(mathTeacherDb.collection('expert_reviews').doc('rev_skip_bad').set({
      reviewerUid: 'math_teacher',
      reviewerType: 'teacher',
      subject: 'toan',
      skipped: true
    }));

    // Có skipReason -> PASS
    await assertSucceeds(mathTeacherDb.collection('expert_reviews').doc('rev_skip_ok').set({
      reviewerUid: 'math_teacher',
      reviewerType: 'teacher',
      subject: 'toan',
      skipped: true,
      skipReason: 'Câu hỏi vượt quá phạm vi chương trình THPT hiện hành.'
    }));
  });

  await check("Test AC: expert_reviews là BẤT BIẾN (không cho phép update hoặc delete)", async () => {
    await assertFails(mathTeacherDb.collection('expert_reviews').doc('rev_math_1').update({
      notes: 'Sửa đổi trái phép'
    }));
    await assertFails(adminDb.collection('expert_reviews').doc('rev_math_1').update({
      notes: 'Admin cũng không được sửa phiếu'
    }));
    await assertFails(mathTeacherDb.collection('expert_reviews').doc('rev_math_1').delete());
    await assertFails(adminDb.collection('expert_reviews').doc('rev_math_1').delete());
  });

  // =========================================================================
  // KIỂM THỬ /teacher_consents/{teacherUid}
  // =========================================================================
  await check("Test AD: Giáo viên có thể đọc, tạo và cập nhật consent của chính mình", async () => {
    await assertSucceeds(mathTeacherDb.collection('teacher_consents').doc('math_teacher').set({
      teacherUid: 'math_teacher',
      publicNameConsent: true,
      termsAgreed: true
    }));
    await assertSucceeds(mathTeacherDb.collection('teacher_consents').doc('math_teacher').get());
    await assertSucceeds(mathTeacherDb.collection('teacher_consents').doc('math_teacher').update({
      institution: 'THPT Chuyên'
    }));
  });

  await check("Test AE: Giáo viên khác (hoặc người dùng khác) KHÔNG THỂ đọc hoặc sửa consent của người khác", async () => {
    await assertFails(aliceDb.collection('teacher_consents').doc('math_teacher').get());
    await assertFails(aliceDb.collection('teacher_consents').doc('math_teacher').update({
      publicNameConsent: false
    }));
    await assertFails(mathTeacherDb.collection('teacher_consents').doc('math_teacher').delete());
  });

  await check("Test AF: Admin CÓ THỂ đọc, cập nhật và xóa teacher_consents", async () => {
    await assertSucceeds(adminDb.collection('teacher_consents').doc('math_teacher').get());
    await assertSucceeds(adminDb.collection('teacher_consents').doc('math_teacher').delete());
  });

  await testEnv.cleanup();

  console.log("\n=========================================");
  console.log(`🏁 KẾT QUẢ TỔNG KẾT: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
  console.log("=========================================");
  if (failedTests > 0) {
    console.error(`❌ CÓ ${failedTests} TEST CASES BỊ THẤT BẠI!`);
    process.exit(1);
  } else {
    console.log("✅ TẤT CẢ CÁC TEST CASES ĐÃ PASS THÀNH CÔNG!");
    process.exit(0);
  }
}

runTests();
