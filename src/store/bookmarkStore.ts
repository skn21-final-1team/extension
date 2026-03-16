/**
 * Zustand 스토어 — 슬라이스 조합
 * 기존 import (`useBookmarkStore`)는 변경 없음
 */

import { create } from 'zustand'
import type { BookmarkState } from './types'
import { createUiSlice } from './slices/uiSlice'
import { createSelectionSlice } from './slices/selectionSlice'
import { createCrudSlice } from './slices/crudSlice'
import { createSyncSlice } from './slices/syncSlice'

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  // ── 초기 상태 ──
  bookmarks: [],
  selectedIds: new Set(),
  selectedFolderIds: new Set(),
  expandedFolderIds: new Set(),
  isLoading: false,
  syncProgress: 0,
  searchQuery: '',
  error: null,
  syncAbortController: null,

  // ── 슬라이스 액션 ──
  ...createUiSlice(set, get),
  ...createSelectionSlice(set, get),
  ...createCrudSlice(set, get),
  ...createSyncSlice(set, get),
}))
