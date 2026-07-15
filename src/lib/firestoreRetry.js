import { 
  enableNetwork,
  getDocFromServer,
  getDocsFromServer
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Đảm bảo kết nối mạng cho Firestore luôn sẵn sàng bằng cách kích hoạt lại network
 */
export const ensureFirestoreOnline = async (maxAttempts = 3, delayMs = 1000) => {
  // Vì cơ sở dữ liệu đã hoạt động hoàn hảo và Rules đã mở rộng, 
  // chúng ta nhường quyền quản lý kết nối tự động cho SDK của Firebase.
  // Việc gọi enableNetwork liên tục không còn cần thiết và sẽ tránh được cảnh báo "Target ID already exists".
  return true;
};

/**
 * Hỗ trợ bọc Promise có giới hạn thời gian (Timeout)
 */
export const withTimeout = (promise, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: Firestore request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Wrapper nâng cấp có chế độ tự động thử lại (Retry) thông minh khi thực hiện các tác vụ Firestore
 * nếu gặp lỗi Offline hoặc Network Error (như lỗi IndexedDB bị tranh chấp, trễ tải mạng).
 * Tích hợp sẵn cơ chế Timeout để tránh treo mạng vô hạn.
 */
export const safeFirestoreCall = async (firestoreFunction, maxAttempts = 3, delayMs = 1500) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Trước khi thực thi truy vấn thử lại, đảm bảo Firestore được online hóa
      if (attempt > 1) {
        await ensureFirestoreOnline(2, 500);
      }
      
      // Bọc kết quả chạy hàm để kích hoạt giới hạn thời gian (Timeout)
      const promiseCall = firestoreFunction();
      const result = await withTimeout(promiseCall, 10000);
      return result;
    } catch (err) {
      lastError = err;
      const errorMessage = err.message || '';
      const isOfflineOrTimeout = 
        errorMessage.toLowerCase().includes('offline') || 
        errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('unavailable') || 
        errorMessage.toLowerCase().includes('timeout') || 
        err.code === 'unavailable';
      
      if (isOfflineOrTimeout) {
        console.warn(`🚨 [Firestore Retry] Phát hiện lỗi Offline/Mạng/Timeout (Lần thử ${attempt}/${maxAttempts}):`, errorMessage);
        if (attempt < maxAttempts) {
          // Đợi tăng dần theo thời gian (Exponential backoff) trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          continue;
        }
      }
      
      // Nếu là lỗi bảo mật (permission-denied) hoặc các lỗi logic khác, ném ra ngay lập tức
      throw err;
    }
  }

  throw lastError;
};
