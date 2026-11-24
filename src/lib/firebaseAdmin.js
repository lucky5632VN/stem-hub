import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let initializedApp = null;

export function getFirebaseAdmin() {
  if (initializedApp) {
    const auth = getAuth(initializedApp);
    const db = getFirestore(initializedApp);
    return {
      app: initializedApp,
      auth: () => auth,
      firestore: () => db
    };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    initializedApp = existingApps[0];
    const auth = getAuth(initializedApp);
    const db = getFirestore(initializedApp);
    return {
      app: initializedApp,
      auth: () => auth,
      firestore: () => db
    };
  }

  // 1. Nếu đang chạy với Firebase Auth Emulator
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    try {
      initializedApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'stemhub-ai-hub'
      });
      const auth = getAuth(initializedApp);
      const db = getFirestore(initializedApp);
      return { app: initializedApp, auth: () => auth, firestore: () => db };
    } catch (err) {
      console.warn('[FirebaseAdmin] Lỗi khởi tạo với Auth Emulator:', err.message);
    }
  }

  // 2. Thử khởi tạo từ biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY (Stringified JSON - phổ biến trên Vercel)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const credentials = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      initializedApp = initializeApp({
        credential: cert(credentials)
      });
      const auth = getAuth(initializedApp);
      const db = getFirestore(initializedApp);
      return { app: initializedApp, auth: () => auth, firestore: () => db };
    } catch (err) {
      console.warn('[FirebaseAdmin] Lỗi parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  }

  // 3. Thử khởi tạo từ các biến FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044';
  if (clientEmail && privateKey) {
    try {
      const cleanKey = privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
      initializedApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: cleanKey
        })
      });
      const auth = getAuth(initializedApp);
      const db = getFirestore(initializedApp);
      return { app: initializedApp, auth: () => auth, firestore: () => db };
    } catch (err) {
      console.warn('[FirebaseAdmin] Lỗi khởi tạo từ FIREBASE_CLIENT_EMAIL/PRIVATE_KEY:', err.message);
    }
  }

  // 4. Thử tìm file JSON Service Account trong thư mục làm việc hiện tại
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const saFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json')) || 'serviceAccountKey.json';
    const saPath = path.resolve(cwd, saFile);
    if (fs.existsSync(saPath)) {
      const saData = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      if (saData.project_id && (saData.private_key || saData.client_email)) {
        initializedApp = initializeApp({
          credential: cert(saData)
        });
        const auth = getAuth(initializedApp);
        const db = getFirestore(initializedApp);
        return { app: initializedApp, auth: () => auth, firestore: () => db };
      }
    }
  } catch (err) {
    // Không log lỗi nếu file không tồn tại
  }

  // 5. Thử Google Application Default Credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      initializedApp = initializeApp({
        credential: applicationDefault()
      });
      const auth = getAuth(initializedApp);
      const db = getFirestore(initializedApp);
      return { app: initializedApp, auth: () => auth, firestore: () => db };
    } catch (err) {
      console.warn('[FirebaseAdmin] Lỗi init applicationDefault:', err.message);
    }
  }

  return null;
}

/**
 * Xác thực Firebase ID Token với cơ chế Fail-Closed.
 * Quy tắc:
 * 1. LUÔN kiểm tra chữ ký cryptographic qua Firebase Admin ở MỌI môi trường (kể cả khi NODE_ENV chưa đặt, development, hoặc production).
 * 2. Mặc định nếu không có Admin credentials hoặc token không có chữ ký hợp lệ -> Lập tức từ chối (Fail-Closed 401/403).
 * 3. Chỉ cho phép bypass chữ ký khi có cờ tường minh ALLOW_INSECURE_DEV_AUTH=1, NHƯNG cờ này BẮT BUỘC bị vô hiệu hóa và từ chối nếu:
 *    - Đang ở môi trường Production (NODE_ENV=production, VERCEL_ENV=production)
 *    - Host request không phải localhost / 127.0.0.1
 * 
 * @param {string} token - Firebase ID Token
 * @param {object} [options] - Tuỳ chọn { host }
 */
export async function verifyFirebaseIdToken(token, options = {}) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Thiếu token xác thực', status: 401 };
  }

  const isProduction = process.env.NODE_ENV === 'production' ||
                       process.env.VERCEL_ENV === 'production' ||
                       process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  const host = options.host || '';
  const isLocalHost = !host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1');

  // Kiểm tra cờ ALLOW_INSECURE_DEV_AUTH
  const allowInsecureDevAuth = process.env.ALLOW_INSECURE_DEV_AUTH === '1';

  if (allowInsecureDevAuth) {
    // NẾU PHÁT HIỆN PRODUCTION HOẶC NON-LOCALHOST -> CHẶN ĐỨNG NGAY LẬP TỨC
    if (isProduction || !isLocalHost) {
      console.error('[FirebaseAdmin] 🚨 NGUY HIỂM: Cờ ALLOW_INSECURE_DEV_AUTH=1 bị từ chối trên môi trường Production hoặc Remote Host!');
      return {
        valid: false,
        error: 'Cờ phát triển không an toàn bị cấm hoàn toàn trên Production/Remote Host. Yêu cầu bị từ chối (Fail-Closed).',
        status: 403
      };
    }

    // Chỉ trong môi trường Dev thuần túy cục bộ mới cho phép parse token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token không đúng định dạng JWT (cần 3 phần).', status: 401 };
    }

    try {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);

      if (!payload.exp || typeof payload.exp !== 'number') {
        return { valid: false, error: 'Token thiếu trường thời hạn exp.', status: 401 };
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSeconds) {
        return { valid: false, error: 'Token đã hết hạn sử dụng.', status: 401 };
      }

      console.warn('[FirebaseAdmin] ⚠️ CẢNH BÁO: Đang sử dụng ALLOW_INSECURE_DEV_AUTH=1 (Chỉ dùng cho Local Dev Offline).');
      return { valid: true, decoded: payload };
    } catch (parseErr) {
      return { valid: false, error: 'Không thể phân tích dữ liệu token JWT.', status: 401 };
    }
  }

  // MẶC ĐỊNH Ở MỌI MÔI TRƯỜNG (KHI KHÔNG CÓ CỜ ALLOW_INSECURE_DEV_AUTH=1):
  // BẮT BUỘC KIỂM TRA CHỮ KÝ CRYPTOGRAPHIC BẰNG FIREBASE ADMIN
  const adminApp = getFirebaseAdmin();

  if (!adminApp) {
    return {
      valid: false,
      error: 'Máy chủ chưa được cấu hình Firebase Admin Credentials hoặc Auth Emulator. Từ chối yêu cầu (Fail-Closed).',
      status: 403
    };
  }

  try {
    const decoded = await adminApp.auth().verifyIdToken(token);
    return { valid: true, decoded };
  } catch (err) {
    return {
      valid: false,
      error: `Xác thực chữ ký token thất bại: ${err.message}`,
      status: 401
    };
  }
}
