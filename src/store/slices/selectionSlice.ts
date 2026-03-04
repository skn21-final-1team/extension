/**
 * 선택 관련 슬라이스 — toggleSelect, toggleFolderForSync, selectAll, deselectAll
 */

import type { BookmarkState, SliceCreator } from '../types';
import {
  collectUrlIds,
  collectFolderUrlIds,
  findParentFolderIds,
  findAncestorFolderIds,
  getSubFolderIds,
  collectSubFolderIds,
} from '../store-utils';

type SelectionSlice = Pick<
  BookmarkState,
  'toggleSelect' | 'toggleFolderForSync' | 'selectAll' | 'deselectAll'
>;

export const createSelectionSlice: SliceCreator<SelectionSlice> = (set, get) => ({
  toggleSelect: (id: string) => {
    const { bookmarks, selectedIds, selectedFolderIds } = get();
    const newSelectedIds = new Set(selectedIds);
    const newSelectedFolders = new Set(selectedFolderIds);

    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);

      const parentIds = findParentFolderIds(bookmarks, id);
      if (parentIds) {
        parentIds.forEach(folderId => newSelectedFolders.delete(folderId));
      }
    } else {
      newSelectedIds.add(id);

      const parentIdsForAdd = findParentFolderIds(bookmarks, id);
      if (parentIdsForAdd) {
        parentIdsForAdd.forEach(folderId => {
          const folderUrlIds = collectFolderUrlIds(bookmarks, folderId);
          if (folderUrlIds.length > 0 && folderUrlIds.every(uid => newSelectedIds.has(uid))) {
            newSelectedFolders.add(folderId);
          }
        });
      }
    }

    set({ selectedIds: newSelectedIds, selectedFolderIds: newSelectedFolders });
  },

  toggleFolderForSync: (folderId: string) => {
    const { bookmarks, selectedFolderIds, selectedIds } = get();

    const newSelectedFolders = new Set(selectedFolderIds);
    const newSelectedIds = new Set(selectedIds);

    const folderUrlIds = collectFolderUrlIds(bookmarks, folderId);
    const subFolderIds = getSubFolderIds(bookmarks, folderId);

    if (newSelectedFolders.has(folderId)) {
      // 해제: 자기 + 하위 + 조상
      newSelectedFolders.delete(folderId);
      subFolderIds.forEach(id => newSelectedFolders.delete(id));
      folderUrlIds.forEach(id => newSelectedIds.delete(id));

      const ancestors = findAncestorFolderIds(bookmarks, folderId);
      if (ancestors) {
        ancestors.forEach(id => newSelectedFolders.delete(id));
      }
    } else {
      // 선택: 자기 + 하위
      newSelectedFolders.add(folderId);
      subFolderIds.forEach(id => newSelectedFolders.add(id));
      folderUrlIds.forEach(id => newSelectedIds.add(id));

      // 조상 중 모든 URL이 선택된 폴더는 자동 체크
      const ancestors = findAncestorFolderIds(bookmarks, folderId);
      if (ancestors) {
        ancestors.forEach(ancestorId => {
          const ancestorUrlIds = collectFolderUrlIds(bookmarks, ancestorId);
          if (ancestorUrlIds.length > 0 && ancestorUrlIds.every(uid => newSelectedIds.has(uid))) {
            newSelectedFolders.add(ancestorId);
          }
        });
      }
    }

    set({ selectedFolderIds: newSelectedFolders, selectedIds: newSelectedIds });
  },

  selectAll: () => {
    const { bookmarks } = get();
    const allIds = collectUrlIds(bookmarks);
    const allFolderIds = collectSubFolderIds(bookmarks);
    set({ selectedIds: new Set(allIds), selectedFolderIds: new Set(allFolderIds) });
  },

  deselectAll: () => {
    set({ selectedIds: new Set(), selectedFolderIds: new Set() });
  },
});
