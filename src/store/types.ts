/**
 * Zustand 스토어 타입 정의
 */

import type { BookmarkFolderList } from '../types/bookmark';

export interface BookmarkState {
  // ── 상태 ──
  bookmarks: BookmarkFolderList;
  selectedIds: Set<string>;
  selectedFolderIds: Set<string>;
  expandedFolderIds: Set<string>;
  isLoading: boolean;
  syncProgress: number;
  searchQuery: string;
  error: string | null;
  syncAbortController: AbortController | null;

  // ── UI 액션 ──
  loadBookmarks: () => Promise<void>;
  toggleFolder: (id: string) => void;
  setSearchQuery: (query: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // ── 선택 액션 ──
  toggleSelect: (id: string) => void;
  toggleFolderForSync: (folderId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // ── CRUD 액션 ──
  addBookmark: (title: string, url: string, parentId?: string) => Promise<void>;
  updateBookmark: (id: string, changes: { title?: string; url?: string }) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  deleteSelectedBookmarks: () => Promise<void>;
  moveBookmark: (id: string, destination: { parentId?: string; index?: number }) => Promise<void>;
  createFolder: (title: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, title: string) => Promise<void>;

  // ── Sync 액션 ──
  syncToServer: (syncKey: string) => Promise<boolean>;
  cancelSync: () => void;
}

/** Zustand 슬라이스 크리에이터 타입 */
export type SliceCreator<T> = (
  set: (partial: Partial<BookmarkState> | ((state: BookmarkState) => Partial<BookmarkState>)) => void,
  get: () => BookmarkState
) => T;
