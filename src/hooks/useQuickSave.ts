import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../services/storageService'
import { useBookmarkStore } from '../store/bookmarkStore'

export interface QuickSaveFolder {
  id: string
  name: string
}

export type QuickSaveStatus = 'idle' | 'saving' | 'success' | 'error'

function useQuickSave() {
  const [folder, setFolder] = useState<QuickSaveFolder | null>(null)
  const [status, setStatus] = useState<QuickSaveStatus>('idle')

  // 마운트 시 저장된 폴더 로드 + 존재 여부 1회 검증
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.QUICK_SAVE_FOLDER, (result) => {
      const saved = result[STORAGE_KEYS.QUICK_SAVE_FOLDER] as QuickSaveFolder | undefined
      if (!saved) return

      // 저장된 폴더가 아직 Chrome에 존재하는지 확인
      chrome.bookmarks.get(saved.id, (nodes) => {
        if (chrome.runtime.lastError || !nodes?.length) {
          // 폴더가 삭제됐으면 저장값도 제거
          chrome.storage.local.remove(STORAGE_KEYS.QUICK_SAVE_FOLDER)
        } else {
          setFolder(saved)
        }
      })
    })
  }, [])

  const saveFolder = useCallback(async (f: QuickSaveFolder) => {
    setFolder(f)
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.QUICK_SAVE_FOLDER]: f }, resolve)
    })
  }, [])

  const clearFolder = useCallback(async () => {
    setFolder(null)
    await new Promise<void>((resolve) => {
      chrome.storage.local.remove(STORAGE_KEYS.QUICK_SAVE_FOLDER, resolve)
    })
  }, [])

  const quickSave = useCallback(async () => {
    if (!folder) return
    setStatus('saving')
    try {
      // 저장 전에 폴더가 아직 존재하는지 확인
      const nodes = await chrome.bookmarks.get(folder.id).catch(() => null)
      if (!nodes?.length) {
        // 폴더가 삭제됨 — 자동 해제
        setFolder(null)
        chrome.storage.local.remove(STORAGE_KEYS.QUICK_SAVE_FOLDER)
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
        return
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.url) throw new Error('No active tab')
      await chrome.bookmarks.create({
        title: tab.title || tab.url,
        url: tab.url,
        parentId: folder.id,
      })
      useBookmarkStore.getState().loadBookmarks()
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [folder])

  return { folder, status, saveFolder, clearFolder, quickSave }
}

export default useQuickSave
