const DB_NAME = 'stem_arena_db';
const DB_VERSION = 2; // Incremented for model_weights store
const STORE_NAME = 'pending_shares';
const WEIGHTS_STORE = 'model_weights';
const KEY_NAME = 'pending_share_story';

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(WEIGHTS_STORE)) {
        db.createObjectStore(WEIGHTS_STORE);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function savePendingShare(data) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, KEY_NAME);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.warn('Failed to save to IndexedDB, falling back to localStorage:', error);
    try {
      const str = JSON.stringify(data);
      if (str.length < 50000) {
        localStorage.setItem(KEY_NAME, str);
        return true;
      }
      console.warn('[IndexedDB] Skip localStorage fallback: data exceeds 50KB to preserve quota.');
      return false;
    } catch (e) {
      console.error('LocalStorage fallback also failed due to quota or other error:', e);
      return false;
    }
  }
}

export async function getPendingShare() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.warn('Failed to get from IndexedDB, falling back to localStorage:', error);
    try {
      const data = localStorage.getItem(KEY_NAME);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('LocalStorage fallback read failed:', e);
      return null;
    }
  }
}

export async function deletePendingShare() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(KEY_NAME);

      request.onsuccess = () => {
        try {
          localStorage.removeItem(KEY_NAME);
        } catch (e) {}
        resolve(true);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.warn('Failed to delete from IndexedDB, falling back to localStorage:', error);
    try {
      localStorage.removeItem(KEY_NAME);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Lưu trọng số mô hình AI vào IndexedDB
 */
export async function saveWeightsToIndexedDB(key, weights) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WEIGHTS_STORE], 'readwrite');
      const store = transaction.objectStore(WEIGHTS_STORE);
      const request = store.put(weights, key);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Save weights fallback to localStorage:', error);
    try {
      const str = JSON.stringify(weights);
      if (str.length < 30000) {
        localStorage.setItem(`weights_${key}`, str);
        return true;
      }
      console.warn('[IndexedDB] Skip saving weights to localStorage: exceeds 30KB quota safety margin.');
      return false;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Đọc trọng số mô hình AI từ IndexedDB
 */
export async function loadWeightsFromIndexedDB(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WEIGHTS_STORE], 'readonly');
      const store = transaction.objectStore(WEIGHTS_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Read weights fallback to localStorage:', error);
    try {
      const item = localStorage.getItem(`weights_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }
}
