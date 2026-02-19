/**
 * Chrome Storage API 래퍼
 * 로컬 설정 및 캐시 데이터 저장
 */

/**
 * Storage에 데이터 저장
 */
export const setStorage = async <T>(key: string, value: T): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
};

/**
 * Storage에서 데이터 가져오기
 */
export const getStorage = async <T>(key: string): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result[key] ?? null);
    });
  });
};

/**
 * Storage에서 데이터 삭제
 */
export const removeStorage = async (key: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
};

/**
 * 모든 Storage 데이터 삭제
 */
export const clearStorage = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
};

// Storage 키 상수
export const STORAGE_KEYS = {
  SELECTED_BOOKMARKS: 'selectedBookmarks',
  LAST_SYNC_TIME: 'lastSyncTime',
  API_URL: 'apiUrl',
  USER_SETTINGS: 'userSettings',
} as const;

export const storageService = {
  set: setStorage,
  get: getStorage,
  remove: removeStorage,
  clear: clearStorage,
  KEYS: STORAGE_KEYS,
};
