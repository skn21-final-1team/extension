/**
 * 북마크 관련 유틸 함수
 */

import type { BookmarkFolder, BookmarkFolderList, BookmarkUrl } from '../types/bookmark';

/**
 * 북마크 트리에서 모든 URL을 추출 (재귀)
 * @param folders 북마크 폴더 리스트
 * @returns URL 문자열 배열
 */
export const extractAllUrls = (folders: BookmarkFolderList): string[] => {
  const urls: string[] = [];

  const traverseFolder = (folder: BookmarkFolder) => {
    // 현재 폴더의 URL들 추가
    if (folder.urls && folder.urls.length > 0) {
      folder.urls.forEach((urlItem: BookmarkUrl) => {
        if (urlItem.url) {
          urls.push(urlItem.url);
        }
      });
    }

    // 하위 폴더가 있으면 재귀 호출
    if (folder.folders && folder.folders.length > 0) {
      folder.folders.forEach(traverseFolder);
    }
  };

  // 최상위 폴더들 순회
  folders.forEach(traverseFolder);

  return urls;
};

/**
 * 선택된 북마크 URL만 추출
 * @param folders 북마크 폴더 리스트
 * @param selectedIds 선택된 북마크 ID Set
 * @returns 선택된 URL 문자열 배열
 */
export const extractSelectedUrls = (
  folders: BookmarkFolderList,
  selectedIds: Set<string>
): string[] => {
  const urls: string[] = [];

  const traverseFolder = (folder: BookmarkFolder) => {
    // 현재 폴더의 URL들 중 선택된 것만 추가
    if (folder.urls && folder.urls.length > 0) {
      folder.urls.forEach((urlItem: BookmarkUrl) => {
        if (urlItem.url && selectedIds.has(urlItem.id)) {
          urls.push(urlItem.url);
        }
      });
    }

    // 하위 폴더가 있으면 재귀 호출
    if (folder.folders && folder.folders.length > 0) {
      folder.folders.forEach(traverseFolder);
    }
  };

  // 최상위 폴더들 순회
  folders.forEach(traverseFolder);

  return urls;
};
