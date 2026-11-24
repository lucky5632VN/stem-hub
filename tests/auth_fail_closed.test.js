import { verifyFirebaseIdToken } from '../src/lib/firebaseAdmin.js';
import assert from 'assert';

function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${body}.signature`;
}

console.log('🧪 === BẮT ĐẦU KIỂM THỬ XÁC THỰC FAIL-CLOSED TOÀN DIỆN (REQUIREMENT 2) ===\n');

let passCount = 0;
let failCount = 0;

async function runTestCase(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

async function runAll() {
  const originalEnv = { ...process.env };

  try {
    const adminClaimToken = createMockJwt({
      uid: 'attacker_1',
      email: 'hacker@malicious.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    // -------------------------------------------------------------
    // Nhóm 1: Mặc định KHÔNG CÓ CỜ ALLOW_INSECURE_DEV_AUTH:
    // Token không chữ ký / chữ ký giả mạo claiming role=admin BẮT BUỘC bị từ chối
    // trong CẢ 3 CẤU HÌNH: NODE_ENV chưa đặt, development, và production.
    // -------------------------------------------------------------

    // Cấu hình 1: NODE_ENV chưa đặt (undefined)
    await runTestCase('Mặc định: NODE_ENV chưa đặt -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)', async () => {
      delete process.env.NODE_ENV;
      delete process.env.ALLOW_INSECURE_DEV_AUTH;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

      const res = await verifyFirebaseIdToken(adminClaimToken);
      assert.strictEqual(res.valid, false);
      assert.ok([401, 403].includes(res.status), `Status must be 401 or 403, got ${res.status}`);
    });

    // Cấu hình 2: NODE_ENV='development'
    await runTestCase('Mặc định: NODE_ENV="development" -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOW_INSECURE_DEV_AUTH;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

      const res = await verifyFirebaseIdToken(adminClaimToken);
      assert.strictEqual(res.valid, false);
      assert.ok([401, 403].includes(res.status), `Status must be 401 or 403, got ${res.status}`);
    });

    // Cấu hình 3: NODE_ENV='production'
    await runTestCase('Mặc định: NODE_ENV="production" -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_INSECURE_DEV_AUTH;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

      const res = await verifyFirebaseIdToken(adminClaimToken);
      assert.strictEqual(res.valid, false);
      assert.ok([401, 403].includes(res.status), `Status must be 401 or 403, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // Nhóm 2: Kiểm tra cờ ALLOW_INSECURE_DEV_AUTH=1
    // -------------------------------------------------------------

    // Cờ bật nhưng chạy trên Production -> Bắt buộc từ chối
    await runTestCase('ALLOW_INSECURE_DEV_AUTH=1 trên Production -> BẮT BUỘC BỊ TỪ CHỐI (Status 403)', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_INSECURE_DEV_AUTH = '1';

      const res = await verifyFirebaseIdToken(adminClaimToken);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 403);
      assert.match(res.error, /bị cấm hoàn toàn trên Production/);
    });

    // Cờ bật nhưng host từ xa (non-localhost) -> Bắt buộc từ chối
    await runTestCase('ALLOW_INSECURE_DEV_AUTH=1 với non-localhost host -> BẮT BUỘC BỊ TỪ CHỐI', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_INSECURE_DEV_AUTH = '1';

      const res = await verifyFirebaseIdToken(adminClaimToken, { host: 'api.remotehost.com' });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 403);
      assert.match(res.error, /bị cấm hoàn toàn trên Production\/Remote Host/);
    });

    // Cờ bật chỉ trên localhost thuần túy dev -> Cho phép parse
    await runTestCase('ALLOW_INSECURE_DEV_AUTH=1 trên localhost dev -> Cho phép parse nội bộ', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_INSECURE_DEV_AUTH = '1';

      const res = await verifyFirebaseIdToken(adminClaimToken, { host: 'localhost:3000' });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.decoded.uid, 'attacker_1');
      assert.strictEqual(res.decoded.role, 'admin');
    });

    // -------------------------------------------------------------
    // Nhóm 3: Các trường hợp biên cơ bản
    // -------------------------------------------------------------

    // Missing Token
    await runTestCase('Missing Token -> Trả về 401', async () => {
      const res = await verifyFirebaseIdToken(null);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 401);
      assert.match(res.error, /Thiếu token/);
    });

    // Token sai định dạng (not 3 parts)
    await runTestCase('Token không đủ 3 phần JWT -> Trả về 401', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_INSECURE_DEV_AUTH = '1';
      const res = await verifyFirebaseIdToken('random_string_not_jwt', { host: 'localhost:3000' });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 401);
      assert.match(res.error, /không đúng định dạng JWT/);
    });

    // Expired Token trong dev mode
    await runTestCase('Token hết hạn (exp in past) -> Trả về 401', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_INSECURE_DEV_AUTH = '1';
      const pastToken = createMockJwt({
        uid: 'user_1',
        role: 'teacher',
        exp: Math.floor(Date.now() / 1000) - 3600
      });
      const res = await verifyFirebaseIdToken(pastToken, { host: 'localhost:3000' });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 401);
      assert.match(res.error, /hết hạn/);
    });

    // Chuỗi hardcoded secret cũ bị loại bỏ hoàn toàn
    await runTestCase('Chuỗi hardcoded secret cũ bị loại bỏ hoàn toàn', async () => {
      const res = await verifyFirebaseIdToken('revoked_legacy_static_secret_token');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.status, 401);
    });

  } finally {
    process.env = originalEnv;
  }

  console.log(`\n📊 KẾT QUẢ: ${passCount}/${passCount + failCount} passed (${failCount} failed)`);
  if (failCount > 0) process.exit(1);
}

runAll();


