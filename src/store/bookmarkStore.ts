import { create } from 'zustand';
import { bookmarkService } from '../services/bookmarkService';
import { apiService } from '../services/apiService';
import type { BookmarkFolderList } from '../types/bookmark';

// ✅ 분리된 유틸리티 함수 임포트
import {
  collectUrlIds,
  collectFolderUrlIds,
  findParentFolderIds,
  getSubFolderIds,
  filterBySelectedIds, // ✅ URL 단위 필터링 함수
  transformToExtensionNode,
} from './store-utils';

interface BookmarkState {
  bookmarks: BookmarkFolderList;
  selectedIds: Set<string>;
  selectedFolderIds: Set<string>; // 폴더 단위 선택 (전송용)
  expandedFolderIds: Set<string>;
  isLoading: boolean;
  syncProgress: number;
  searchQuery: string;
  error: string | null;

  loadBookmarks: () => Promise<void>;
  toggleSelect: (id: string) => void;
  toggleSelectFolder: (folderId: string) => void; // 폴더 선택 (하위 URL 전체)
  toggleFolderForSync: (folderId: string) => void; // 폴더 단위 선택 (전송용)
  selectAll: () => void;
  deselectAll: () => void;
  toggleFolder: (id: string) => void;
  setSearchQuery: (query: string) => void;
  
  // CRUD & Sync
  addBookmark: (
    title: string,
    url: string,
    parentId?: string
  ) => Promise<void>;
  updateBookmark: (
    id: string,
    changes: { title?: string; url?: string }
  ) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  deleteSelectedBookmarks: () => Promise<void>;
  moveBookmark: (
    id: string,
    destination: { parentId?: string; index?: number }
  ) => Promise<void>;
  createFolder: (title: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  syncToServer: (syncKey: string) => Promise<void>;
  
  // ✅ 전송 취소용 상태 및 메서드
  syncAbortController: AbortController | null;
  cancelSync: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [], // 초기값: 빈 배열 (BookmarkFolder[])
  selectedIds: new Set(),
  selectedFolderIds: new Set(), // 폴더 단위 선택
  expandedFolderIds: new Set(),
  isLoading: false,
  syncProgress: 0,
  searchQuery: '',
  error: null,
  syncAbortController: null, // ✅ 초기값

  loadBookmarks: async () => {
    set({ isLoading: true, error: null });
    try {
      const bookmarks = await bookmarkService.getAll();
      set({ bookmarks, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 로드 실패';
      set({ error: message, isLoading: false });
    }
  },

  toggleSelect: (id: string) => {
    const { bookmarks, selectedIds, selectedFolderIds } = get();
    const newSelectedIds = new Set(selectedIds);
    const newSelectedFolders = new Set(selectedFolderIds);

    if (newSelectedIds.has(id)) {
      // URL 체크 해제
      newSelectedIds.delete(id);

      // 부모 폴더들도 체크 해제 (재귀적으로 모든 조상 폴더)
      const parentIds = findParentFolderIds(bookmarks, id);
      if (parentIds) {
        parentIds.forEach(folderId => newSelectedFolders.delete(folderId));
      }
    } else {
      // URL 체크
      newSelectedIds.add(id);
    }

    set({ selectedIds: newSelectedIds, selectedFolderIds: newSelectedFolders });
  },

  toggleSelectFolder: (folderId: string) => {
    const { bookmarks, selectedIds } = get();
    const folderUrlIds = collectFolderUrlIds(bookmarks, folderId);

    if (folderUrlIds.length === 0) return;

    // 모든 하위 URL이 선택되어 있는지 확인
    const allSelected = folderUrlIds.every(id => selectedIds.has(id));

    set((state) => {
      const newSelected = new Set(state.selectedIds);

      if (allSelected) {
        // 모두 선택되어 있으면 전체 해제
        folderUrlIds.forEach(id => newSelected.delete(id));
      } else {
        // 하나라도 선택 안되어 있으면 전체 선택
        folderUrlIds.forEach(id => newSelected.add(id));
      }

      return { selectedIds: newSelected };
    });
  },

  toggleFolderForSync: (folderId: string) => {
    const { bookmarks, selectedFolderIds, selectedIds } = get();

    const newSelectedFolders = new Set(selectedFolderIds);
    const newSelectedIds = new Set(selectedIds);

    // 해당 폴더의 모든 하위 URL ID 수집
    const folderUrlIds = collectFolderUrlIds(bookmarks, folderId);
    // 해당 폴더의 모든 하위 폴더 ID 수집
    const subFolderIds = getSubFolderIds(bookmarks, folderId);

    if (newSelectedFolders.has(folderId)) {
      // 폴더 체크 해제 → 하위 폴더 & URL도 체크 해제
      newSelectedFolders.delete(folderId);
      subFolderIds.forEach(id => newSelectedFolders.delete(id));
      folderUrlIds.forEach(id => newSelectedIds.delete(id));
    } else {
      // 폴더 체크 → 하위 폴더 & URL도 체크
      newSelectedFolders.add(folderId);
      subFolderIds.forEach(id => newSelectedFolders.add(id));
      folderUrlIds.forEach(id => newSelectedIds.add(id));
    }

    set({ selectedFolderIds: newSelectedFolders, selectedIds: newSelectedIds });
  },

  selectAll: () => {
    const allIds = collectUrlIds(get().bookmarks);
    set({ selectedIds: new Set(allIds) });
  },

  deselectAll: () => {
    set({ selectedIds: new Set() });
  },

  toggleFolder: (id: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedFolderIds: newExpanded };
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // ... 생략된 CRUD 메서드 (addBookmark, updateBookmark 등) ...
  addBookmark: async (title: string, url: string, parentId?: string) => {
    set({ isLoading: true });
    try {
      await bookmarkService.create(title, url, parentId);
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 추가 실패';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateBookmark: async (
    id: string,
    changes: { title?: string; url?: string }
  ) => {
    set({ isLoading: true });
    try {
      await bookmarkService.update(id, changes);
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 수정 실패';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBookmark: async (id: string) => {
    set({ isLoading: true });
    try {
      await bookmarkService.remove(id);
      set((state) => {
        const newSelected = new Set(state.selectedIds);
        newSelected.delete(id);
        return { selectedIds: newSelected };
      });
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 삭제 실패';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSelectedBookmarks: async () => {
    const { selectedIds, loadBookmarks } = get();
    if (selectedIds.size === 0) return;
    
    set({ isLoading: true });
    try {
      // 선택된 ID 배열을 순회하며 모두 삭제
      const deletePromises = Array.from(selectedIds).map(id => bookmarkService.remove(id));
      await Promise.allSettled(deletePromises);
      
      set({ selectedIds: new Set() }); // 선택 목록 비우기
      await loadBookmarks(); // 서버 최신화
    } catch (error) {
      const message = error instanceof Error ? error.message : '일괄 삭제 중 오류 발생';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  moveBookmark: async (
    id: string,
    destination: { parentId?: string; index?: number }
  ) => {
    try {
      await bookmarkService.move(id, destination);
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '북마크 이동 실패';
      set({ error: message });
    }
  },

  createFolder: async (title: string, parentId?: string) => {
    try {
      await bookmarkService.createFolder(title, parentId);
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '폴더 생성 실패';
      set({ error: message });
    }
  },

  deleteFolder: async (id: string) => {
    set({ isLoading: true });
    try {
      await bookmarkService.removeTree(id);
      set((state) => {
        const newExpanded = new Set(state.expandedFolderIds);
        newExpanded.delete(id);
        return { expandedFolderIds: newExpanded };
      });
      await get().loadBookmarks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '폴더 삭제 실패';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  syncToServer: async (syncKey: string) => {
    const { bookmarks, selectedIds } = get();

    if (selectedIds.size === 0) {
      set({ error: '전송할 북마크를 선택해주세요.' });
      return;
    }

    // ✅ 새로운 AbortController 생성
    const abortController = new AbortController();

    set({ 
      isLoading: true, 
      syncProgress: 0, 
      error: null,
      syncAbortController: abortController // ✅ 저장
    });

    try {
        const selectedNodes = filterBySelectedIds(bookmarks, selectedIds);
        const extensionNodes = transformToExtensionNode(selectedNodes);

        // ✅ abortSignal 전달
        const response = await apiService.syncBookmarks(
          syncKey, 
          extensionNodes, 
          (progress) => {
            set({ syncProgress: progress });
          },
          abortController.signal // ✅ 취소 신호 전달
        );

        if (!response.success) {
            throw new Error(response.error || '동기화 실패');
        }

    } catch (error) {
       const message = error instanceof Error ? error.message : '동기화 오류';
       set({ error: message });
    } finally {
      set({ 
        isLoading: false, 
        syncProgress: 0,
        syncAbortController: null // ✅ 초기화
      });
    }
  },

  // ✅ 전송 취소 메서드
  cancelSync: () => {
    const { syncAbortController } = get();
    
    if (syncAbortController) {
      syncAbortController.abort(); // ✅ 전송 취소
      set({ 
        syncAbortController: null,
        isLoading: false,
        syncProgress: 0,
        error: '전송이 취소되었습니다.'
      });
    }
  },
}));
