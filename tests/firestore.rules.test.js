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
  const adminContext = testEnv.authenticatedContext('admin', { email: 'admin123@gmail.com' });
  const unauthContext = testEnv.unauthenticatedContext();

  const aliceDb = aliceContext.firestore();
  const bobDb = bobContext.firestore();
  const charlieDb = charlieContext.firestore();
  const adminDb = adminContext.firestore();
  const unauthDb = unauthContext.firestore();

  let failedTests = 0;

  async function check(name, fn) {
    try {
      await fn();
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

  await testEnv.cleanup();

  console.log("\n=========================================");
  if (failedTests > 0) {
    console.error(`❌ CÓ ${failedTests} TEST CASES BỊ THẤT BẠI!`);
    process.exit(1);
  } else {
    console.log("✅ TẤT CẢ CÁC TEST CASES ĐÃ PASS THÀNH CÔNG!");
    process.exit(0);
  }
}

runTests();
