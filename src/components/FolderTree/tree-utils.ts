/**
 * FolderTree 유틸리티 — 검색 필터링, 인덱스 검색
 */

import type { BookmarkFolderList, BookmarkFolder } from '../../types/bookmark';

/** 검색 쿼리로 북마크 트리를 필터링 */
export const filterBookmarks = (
  items: BookmarkFolderList,
  query: string
): BookmarkFolderList => {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items
    .map((folder) => {
      const filteredUrls = (folder.urls || []).filter(
        (url) =>
          (url.title || '').toLowerCase().includes(lowerQuery) ||
          (url.url || '').toLowerCase().includes(lowerQuery)
      );
      const filteredSubFolders = folder.folders
        ? filterBookmarks(folder.folders, query)
        : [];
      const isFolderNameMatch = (folder.name || '').toLowerCase().includes(lowerQuery);
      if (isFolderNameMatch) {
        return folder; // 폴더명 매치 시 원본 그대로 반환 (내용 모두 표시)
      }
      if (filteredUrls.length > 0 || filteredSubFolders.length > 0) {
        return { ...folder, folders: filteredSubFolders, urls: filteredUrls } as BookmarkFolder;
      }
      return null;
    })
    .filter((item): item is BookmarkFolder => item !== null);
};

/** 북마크 ID로 부모 폴더와 인덱스를 찾기 */
export const findBookmarkIndex = (
  folders: BookmarkFolderList,
  bookmarkId: string
): { parentId: string; index: number } | null => {
  for (const folder of folders) {
    const idx = folder.urls?.findIndex((u) => u.id === bookmarkId) ?? -1;
    if (idx !== -1) return { parentId: folder.id, index: idx };
    if (folder.folders) {
      const result = findBookmarkIndex(folder.folders, bookmarkId);
      if (result) return result;
    }
  }
  return null;
};
