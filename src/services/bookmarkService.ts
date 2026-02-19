/**
 * Chrome Bookmarks API 래퍼
 * Chrome 북마크 CRUD 및 트리 변환 기능 제공
 */

import type {
  BookmarkFolder,
  BookmarkUrl,
  BookmarkItem,
  ChromeBookmarkNode,
  BookmarkFolderList,
} from '../types/bookmark';

/**
 * Chrome 북마크 노드를 앱 북마크 타입으로 변환 (재귀)
 */
const convertToBookmark = (node: ChromeBookmarkNode): BookmarkItem => {
  const isFolder = !node.url;

  if (isFolder) {
    const children = node.children?.map(convertToBookmark) || [];
    const folders = children.filter((child): child is BookmarkFolder =>
      'folders' in child
    );
    const urls = children.filter((child): child is BookmarkUrl =>
      'url' in child && !('folders' in child)
    );

    const folder: BookmarkFolder = {
      id: node.id,
      name: node.title,
      isExpanded: false, // 기본값
      folders,
      urls,
    };
    return folder;
  } else {
    const url: BookmarkUrl = {
      id: node.id,
      title: node.title,
      url: node.url || '',
      tags: [],
      isChecked: false,
    };
    return url;
  }
};

/**
 * 전체 북마크 트리 가져오기
 */
export const getAllBookmarks = async (): Promise<BookmarkFolderList> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // 루트 노드의 children이 실제 북마크
      const rootChildren = tree[0]?.children || [];
      const bookmarks = rootChildren.map((node) => {
        const item = convertToBookmark(node);
        // 최상위 레벨이 URL인 경우 가상 폴더로 감싸거나 처리 필요하지만
        // 일단 폴더만 반환하거나, 타입에 맞게 처리
        if ('url' in item && !('folders' in item)) {
          // 최상위 URL을 위한 '기타' 폴더 생성?
          // Frontend 구조상 최상위는 BookmarkFolderList이므로 폴더여야 함.
          // 여기서 임의로 폴더로 감싸주는 로직이 필요할 수 있음.
          // 하지만 Chrome 북마크 바, 기타 북마크 등은 이미 폴더임.
          return null;
        }
        return item as BookmarkFolder;
      }).filter((item): item is BookmarkFolder => item !== null);

      resolve(bookmarks);
    });
  });
};

/**
 * 북마크 생성
 */
export const createBookmark = async (
  title: string,
  url?: string,
  parentId?: string
): Promise<BookmarkItem> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create(
      {
        title,
        url,
        parentId,
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(convertToBookmark(result as ChromeBookmarkNode));
      }
    );
  });
};

/**
 * 북마크 수정
 */
export const updateBookmark = async (
  id: string,
  changes: { title?: string; url?: string }
): Promise<BookmarkItem> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.update(id, changes, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(convertToBookmark(result as ChromeBookmarkNode));
    });
  });
};

/**
 * 북마크 삭제
 */
export const removeBookmark = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
};

/**
 * 폴더 삭제 (하위 항목 포함)
 */
export const removeBookmarkTree = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
};

/**
 * 북마크 검색
 */
export const searchBookmarks = async (query: string): Promise<BookmarkItem[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search(query, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const bookmarks = results.map((node) =>
        convertToBookmark(node as ChromeBookmarkNode)
      );
      resolve(bookmarks);
    });
  });
};

/**
 * 북마크 이동 (위치 변경)
 */
export const moveBookmark = async (
  id: string,
  destination: { parentId?: string; index?: number }
): Promise<BookmarkItem> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(id, destination, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(convertToBookmark(result as ChromeBookmarkNode));
    });
  });
};

/**
 * 폴더 생성
 */
export const createFolder = async (
  title: string,
  parentId?: string
): Promise<BookmarkFolder> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create(
      {
        title,
        parentId,
        // url이 없으면 폴더로 생성됨
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const item = convertToBookmark(result as ChromeBookmarkNode);
        if ('folders' in item) {
            resolve(item as BookmarkFolder);
        } else {
             // Should not happen for folder creation
             reject(new Error("Failed to create folder"));
        }
      }
    );
  });
};

export const bookmarkService = {
  getAll: getAllBookmarks,
  create: createBookmark,
  update: updateBookmark,
  remove: removeBookmark,
  removeTree: removeBookmarkTree,
  search: searchBookmarks,
  move: moveBookmark,
  createFolder: createFolder,
};
