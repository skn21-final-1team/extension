import { BookmarkFolder, BookmarkFolderList } from '../../../types/bookmark';

/**
 * 특정 폴더 하위의 모든 북마크(URL) 개수를 재귀적으로 계산합니다.
 * @param folder 계산할 폴더
 * @returns 폴더 내의 총 URL 개수
 */
export const countAllUrls = (folder: BookmarkFolder): number => {
  let count = folder.urls?.length || 0;
  if (folder.folders) {
    for (const sub of folder.folders) {
      count += countAllUrls(sub);
    }
  }
  return count;
};

/**
 * 선택된 폴더 내부의 총 북마크 개수를 계산합니다.
 * 하위 폴더가 있을 경우 재귀적으로 탐색하여 합산합니다.
 * @param folders 전체 북마크 폴더 리스트
 * @param selectedIds 사용자가 선택한 폴더 ID 목록 (Set)
 * @returns 선택된 패키지(폴더)에 속한 총 북마크 개수
 */
export const countBookmarksInFolders = (
  folders: BookmarkFolderList,
  selectedIds: Set<string>
): number => {
  let count = 0;
  for (const folder of folders) {
    if (selectedIds.has(folder.id)) {
      count += countAllUrls(folder);
    } else if (folder.folders) {
      count += countBookmarksInFolders(folder.folders, selectedIds);
    }
  }
  return count;
};
