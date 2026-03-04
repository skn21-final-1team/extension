/**
 * CRUD 슬라이스 — 북마크/폴더 추가, 수정, 삭제, 이동
 */

import type { BookmarkFolderList } from '../../types/bookmark';
import type { BookmarkState, SliceCreator } from '../types';
import { bookmarkService } from '../../services/bookmarkService';
import { collectFolderUrlIds, getSubFolderIds } from '../store-utils';

type CrudSlice = Pick<
  BookmarkState,
  | 'addBookmark' | 'updateBookmark' | 'deleteBookmark'
  | 'deleteSelectedBookmarks' | 'moveBookmark'
  | 'createFolder' | 'deleteFolder' | 'renameFolder'
>;

export const createCrudSlice: SliceCreator<CrudSlice> = (set, get) => ({
  addBookmark: async (title: string, url: string, parentId?: string) => {
    set({ isLoading: true, error: null });
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

  updateBookmark: async (id: string, changes: { title?: string; url?: string }) => {
    set({ isLoading: true, error: null });
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
    set({ isLoading: true, error: null });
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
    const { bookmarks, selectedIds, selectedFolderIds, loadBookmarks } = get();
    if (selectedIds.size === 0 && selectedFolderIds.size === 0) return;

    set({ isLoading: true, error: null });
    try {
      // 최상위 선택 폴더만 추출 (부모가 이미 선택된 자식 폴더는 제외)
      const topLevelFolderIds: string[] = [];
      const findTopLevel = (folders: BookmarkFolderList, ancestorSelected: boolean) => {
        for (const folder of folders) {
          const isSelected = selectedFolderIds.has(folder.id);
          if (isSelected && !ancestorSelected) {
            topLevelFolderIds.push(folder.id);
          }
          if (folder.folders) {
            findTopLevel(folder.folders, ancestorSelected || isSelected);
          }
        }
      };
      findTopLevel(bookmarks, false);

      // Chrome 시스템 루트 폴더는 삭제 불가
      const CHROME_SYSTEM_IDS = new Set(['0', '1', '2', '3']);
      const deletableFolderIds = topLevelFolderIds.filter(id => !CHROME_SYSTEM_IDS.has(id));

      // 최상위 폴더를 순차 삭제
      let failedFolders = 0;
      const successfullyDeletedFolderIds: string[] = [];
      for (const id of deletableFolderIds) {
        try {
          await bookmarkService.removeTree(id);
          successfullyDeletedFolderIds.push(id);
        } catch {
          failedFolders++;
        }
      }

      // 성공적으로 삭제된 폴더 내 URL ID 수집
      const deletedFolderUrlIds = new Set<string>();
      for (const id of successfullyDeletedFolderIds) {
        collectFolderUrlIds(bookmarks, id).forEach(uid => deletedFolderUrlIds.add(uid));
      }

      // 폴더 삭제로 이미 제거된 URL 제외 후 개별 삭제
      const remainingUrlIds = Array.from(selectedIds).filter(id => !deletedFolderUrlIds.has(id));
      await Promise.allSettled(
        remainingUrlIds.map(id => bookmarkService.remove(id).catch(() => {}))
      );

      set({
        selectedIds: new Set(),
        selectedFolderIds: new Set(),
        ...(failedFolders > 0 ? { error: `${failedFolders}개 폴더 삭제에 실패했습니다.` } : {}),
      });
      await loadBookmarks();
    } catch (error) {
      const message = error instanceof Error ? error.message : '일괄 삭제 중 오류 발생';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  moveBookmark: async (id: string, destination: { parentId?: string; index?: number }) => {
    set({ error: null });
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
    set({ error: null });
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
    set({ isLoading: true, error: null });
    try {
      const { bookmarks } = get();
      const urlIdsToRemove = collectFolderUrlIds(bookmarks, id);
      const subFolderIdsToRemove = getSubFolderIds(bookmarks, id);

      await bookmarkService.removeTree(id);

      set((state) => {
        const newExpanded = new Set(state.expandedFolderIds);
        const newSelectedIds = new Set(state.selectedIds);
        const newSelectedFolders = new Set(state.selectedFolderIds);

        newExpanded.delete(id);
        newSelectedFolders.delete(id);
        subFolderIdsToRemove.forEach((fid) => {
          newExpanded.delete(fid);
          newSelectedFolders.delete(fid);
        });
        urlIdsToRemove.forEach((uid) => newSelectedIds.delete(uid));

        return {
          expandedFolderIds: newExpanded,
          selectedIds: newSelectedIds,
          selectedFolderIds: newSelectedFolders,
        };
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

  renameFolder: async (id: string, title: string) => {
    set({ error: null });
    try {
      await bookmarkService.update(id, { title });
      await get().loadBookmarks();
    } catch (error) {
      const message = error instanceof Error ? error.message : '폴더 이름 변경 실패';
      set({ error: message });
    }
  },
});
