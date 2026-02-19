import { create } from 'zustand';
import { bookmarkService } from '../services/bookmarkService';
import { apiService } from '../services/apiService';
import type {
  BookmarkFolderList,
} from '../types/bookmark';

interface BookmarkState {
  bookmarks: BookmarkFolderList;
  selectedIds: Set<string>;
  expandedFolderIds: Set<string>;
  isLoading: boolean;
  syncProgress: number;
  searchQuery: string;
  error: string | null;

  loadBookmarks: () => Promise<void>;
  toggleSelect: (id: string) => void;
  toggleSelectFolder: (folderId: string) => void; // 폴더 선택 (하위 URL 전체)
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
  moveBookmark: (
    id: string,
    destination: { parentId?: string; index?: number }
  ) => Promise<void>;
  createFolder: (title: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  syncToServer: () => Promise<void>;
}

// 재귀적으로 모든 URL ID 수집
const collectUrlIds = (list: BookmarkFolderList): string[] => {
  let ids: string[] = [];
  for (const item of list) {
    // 폴더면 재귀 호출
    if (item.folders) {
      ids = [...ids, ...collectUrlIds(item.folders)];
    }
    // URL이면 ID 수집
    if (item.urls) {
      ids = [...ids, ...item.urls.map(u => u.id)];
    }
  }
  return ids;
};

// 특정 폴더의 모든 하위 URL ID 수집
const collectFolderUrlIds = (
  bookmarks: BookmarkFolderList,
  folderId: string
): string[] => {
  for (const folder of bookmarks) {
    if (folder.id === folderId) {
      // 해당 폴더 찾음
      const urlIds = folder.urls?.map(u => u.id) || [];
      const subFolderIds = folder.folders ? collectUrlIds(folder.folders) : [];
      return [...urlIds, ...subFolderIds];
    }
    // 하위 폴더에서 재귀 검색
    if (folder.folders) {
      const result = collectFolderUrlIds(folder.folders, folderId);
      if (result.length > 0) return result;
    }
  }
  return [];
};



// ExtensionBookmarkNode로 변환하는 헬퍼 함수
const transformToExtensionNode = (
  list: BookmarkFolderList
): import('../types/bookmark').ExtensionBookmarkNode[] => {
  return list.map(item => {
    const node: import('../types/bookmark').ExtensionBookmarkNode = {
      id: item.id,
      title: item.name || (item as any).title || 'No Title', // 폴더는 name, URL은 title
      children: []
    };

    if (item.urls) {
      // URL 아이템 처리
      item.urls.forEach(u => {
        node.children.push({
          id: u.id,
          title: u.title,
          url: u.url,
          children: []
        });
      });
    }

    if (item.folders) {
      // 하위 폴더 재귀 처리
      node.children = [...node.children, ...transformToExtensionNode(item.folders)];
    }

    return node;
  });
};

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [], // 초기값: 빈 배열 (BookmarkFolder[])
  selectedIds: new Set(),
  expandedFolderIds: new Set(),
  isLoading: false,
  syncProgress: 0,
  searchQuery: '',
  error: null,

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
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected };
    });
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

  syncToServer: async () => {
    const { bookmarks } = get();
    // 선택된 것이 없어도 전체를 보낼지, 아니면 막을지는 정책 결정.
    // 여기서는 일단 진행.
    
    set({ isLoading: true, syncProgress: 0 });

    try {
        // 전체 북마크 트리를 백엔드 포맷으로 변환
        const extensionNodes = transformToExtensionNode(bookmarks);
        
        const response = await apiService.syncBookmarks(extensionNodes, (progress) => {
            set({ syncProgress: progress });
        });

        if (!response.success) {
            throw new Error(response.error || '동기화 실패');
        }

    } catch (error) {
       const message = error instanceof Error ? error.message : '동기화 오류';
       set({ error: message });
    } finally {
      set({ isLoading: false, syncProgress: 0 });
    }
  },
}));
