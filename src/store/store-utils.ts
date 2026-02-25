import { BookmarkFolderList } from '../types/bookmark';

/**
 * 북마크 트리 내의 모든 URL ID를 재귀적으로 찾아 반환합니다.
 */
export const collectUrlIds = (list: BookmarkFolderList): string[] => {
  let ids: string[] = [];
  for (const item of list) {
    if (item.folders) {
      ids = [...ids, ...collectUrlIds(item.folders)];
    }
    if (item.urls) {
      ids = [...ids, ...item.urls.map(u => u.id)];
    }
  }
  return ids;
};

/**
 * 특정 폴더의 모든 하위 URL ID들을 수집합니다. (하위 폴더 포함)
 */
export const collectFolderUrlIds = (
  bookmarks: BookmarkFolderList,
  folderId: string
): string[] => {
  for (const folder of bookmarks) {
    if (folder.id === folderId) {
      const urlIds = folder.urls?.map(u => u.id) || [];
      const subFolderIds = folder.folders ? collectUrlIds(folder.folders) : [];
      return [...urlIds, ...subFolderIds];
    }
    if (folder.folders) {
      const result = collectFolderUrlIds(folder.folders, folderId);
      if (result.length > 0) return result;
    }
  }
  return [];
};

/**
 * 선택된 북마크 ID만 포함하는 새로운 트리 구조를 반환합니다.
 */
export const filterBySelectedIds = (
  list: BookmarkFolderList,
  selectedIds: Set<string>
): BookmarkFolderList => {
  const result: BookmarkFolderList = [];

  for (const folder of list) {
    const filteredUrls = (folder.urls || []).filter(u => selectedIds.has(u.id));
    const filteredFolders = folder.folders
      ? filterBySelectedIds(folder.folders, selectedIds)
      : undefined;

    const hasContent = filteredUrls.length > 0 || (filteredFolders && filteredFolders.length > 0);
    if (hasContent) {
      result.push({
        ...folder,
        urls: filteredUrls,
        folders: filteredFolders,
      });
    }
  }

  return result;
};

/**
 * 특정 폴더의 모든 하위 폴더 ID를 재귀적으로 수집합니다.
 */
export const collectSubFolderIds = (
  folders: BookmarkFolderList
): string[] => {
  let ids: string[] = [];
  for (const folder of folders) {
    ids.push(folder.id);
    if (folder.folders) {
      ids = [...ids, ...collectSubFolderIds(folder.folders)];
    }
  }
  return ids;
};

/**
 * 특정 기준 폴더의 하위 폴더 ID들을 찾습니다.
 */
export const getSubFolderIds = (
  folders: BookmarkFolderList,
  targetFolderId: string
): string[] => {
  for (const folder of folders) {
    if (folder.id === targetFolderId) {
      return folder.folders ? collectSubFolderIds(folder.folders) : [];
    }
    if (folder.folders) {
      const result = getSubFolderIds(folder.folders, targetFolderId);
      if (result.length > 0) return result;
    }
  }
  return [];
};

/**
 * 대상 URL이 속한 모든 부모 폴더 ID 경로를 재귀적으로 찾습니다.
 */
export const findParentFolderIds = (
  folders: BookmarkFolderList,
  urlId: string,
  parentIds: string[] = []
): string[] | null => {
  for (const folder of folders) {
    if (folder.urls?.some(u => u.id === urlId)) {
      return [...parentIds, folder.id];
    }
    if (folder.folders) {
      const result = findParentFolderIds(folder.folders, urlId, [...parentIds, folder.id]);
      if (result) return result;
    }
  }
  return null;
};

/**
 * 선택된 폴더들을 재귀적으로 필터링하여 반환합니다.
 * (선택된 폴더는 하위 구조 모두 포함)
 */
export const filterSelectedFolders = (
  folders: BookmarkFolderList,
  selectedIds: Set<string>
): BookmarkFolderList => {
  const result: BookmarkFolderList = [];

  for (const folder of folders) {
    if (selectedIds.has(folder.id)) {
      result.push(folder);
    } else {
      const filteredSubFolders = folder.folders
        ? filterSelectedFolders(folder.folders, selectedIds)
        : [];

      if (filteredSubFolders.length > 0) {
        result.push({
          ...folder,
          urls: [], // 현재 폴더는 선택하지 않았으므로 URL 제거
          folders: filteredSubFolders,
        });
      }
    }
  }

  return result;
};

/**
 * BookmarkFolderList 뼈대를 백엔드 수신 타입인 ExtensionBookmarkNode 배열로 변환합니다.
 */
export const transformToExtensionNode = (
  list: BookmarkFolderList
): import('../types/bookmark').ExtensionBookmarkNode[] => {
  return list.map(item => {
    const folderTitle = item.name || 'No Title';

    const node: import('../types/bookmark').ExtensionBookmarkNode = {
      id: Number(item.id),
      title: folderTitle,
      children: []
    };

    if (item.urls) {
      item.urls.forEach(u => {
        node.children.push({
          id: Number(u.id),
          title: u.title,
          url: u.url,
          children: []
        });
      });
    }

    if (item.folders) {
      node.children = [...node.children, ...transformToExtensionNode(item.folders)];
    }

    return node;
  });
};
