const DB_NAME = 'stem_arena_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_shares';
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
      localStorage.setItem(KEY_NAME, JSON.stringify(data));
      return true;
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
        // Also clean up localStorage just in case
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
