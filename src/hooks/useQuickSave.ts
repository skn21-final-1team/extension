import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../services/storageService';
import { useBookmarkStore } from '../store/bookmarkStore';

export interface QuickSaveFolder {
  id: string;
  name: string;
}

export type QuickSaveStatus = 'idle' | 'saving' | 'success' | 'error';

/** Chrome '기타 북마크' 폴더 이름을 '빠른 저장'으로 표시 */
function displayName(name: string): string {
  return (name === '기타 북마크' || name === 'Other Bookmarks') ? '빠른 저장' : name;
}

export function useQuickSave() {
  const [folder, setFolder] = useState<QuickSaveFolder | null>(null);
  const [status, setStatus] = useState<QuickSaveStatus>('idle');

  // Load saved folder from storage on mount
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.QUICK_SAVE_FOLDER, (result) => {
      const saved = result[STORAGE_KEYS.QUICK_SAVE_FOLDER] as QuickSaveFolder | undefined;
      if (saved) setFolder({ ...saved, name: displayName(saved.name) });
    });
  }, []);

  // Validate folder still exists when bookmarks change
  useEffect(() => {
    if (!folder) return;
    const unsub = useBookmarkStore.subscribe(() => {
      chrome.bookmarks.get(folder.id, (nodes) => {
        if (chrome.runtime.lastError || !nodes?.length) {
          setFolder(null);
          chrome.storage.local.remove(STORAGE_KEYS.QUICK_SAVE_FOLDER);
        }
      });
    });
    return unsub;
  }, [folder]);

  const saveFolder = useCallback((f: QuickSaveFolder) => {
    const mapped = { ...f, name: displayName(f.name) };
    setFolder(mapped);
    chrome.storage.local.set({ [STORAGE_KEYS.QUICK_SAVE_FOLDER]: mapped });
  }, []);

  const clearFolder = useCallback(() => {
    setFolder(null);
    chrome.storage.local.remove(STORAGE_KEYS.QUICK_SAVE_FOLDER);
  }, []);

  const quickSave = useCallback(async () => {
    if (!folder) return;
    setStatus('saving');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) throw new Error('No active tab');
      await chrome.bookmarks.create({
        title: tab.title || tab.url,
        url: tab.url,
        parentId: folder.id,
      });
      useBookmarkStore.getState().loadBookmarks();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [folder]);

  return { folder, status, saveFolder, clearFolder, quickSave };
}
