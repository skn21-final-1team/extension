/**
 * Sync 슬라이스 — syncToServer, cancelSync
 */

import type { BookmarkState, SliceCreator } from '../types';
import { apiService } from '../../services/apiService';
import { filterBySelectedIds, transformToExtensionNode } from '../store-utils';

type SyncSlice = Pick<BookmarkState, 'syncToServer' | 'cancelSync'>;

export const createSyncSlice: SliceCreator<SyncSlice> = (set, get) => ({
  syncToServer: async (syncKey: string) => {
    const { bookmarks, selectedIds } = get();

    if (selectedIds.size === 0) {
      set({ error: '전송할 북마크를 선택해주세요.' });
      return false;
    }

    const abortController = new AbortController();

    set({
      isLoading: true,
      syncProgress: 0,
      error: null,
      syncAbortController: abortController,
    });

    try {
      const selectedNodes = filterBySelectedIds(bookmarks, selectedIds);
      const extensionNodes = transformToExtensionNode(selectedNodes);

      const response = await apiService.syncBookmarks(
        syncKey,
        extensionNodes,
        (progress) => { set({ syncProgress: progress }); },
        abortController.signal
      );

      if (!response.success) {
        throw new Error(response.error || '동기화 실패');
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '동기화 오류';
      set({ error: message });
      return false;
    } finally {
      set({
        isLoading: false,
        syncProgress: 0,
        syncAbortController: null,
      });
    }
  },

  cancelSync: () => {
    const { syncAbortController } = get();

    if (syncAbortController) {
      syncAbortController.abort();
      set({
        syncAbortController: null,
        isLoading: false,
        syncProgress: 0,
        error: '전송이 취소되었습니다.',
      });
    }
  },
});
