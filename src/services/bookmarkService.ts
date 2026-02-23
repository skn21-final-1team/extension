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
      console.log('--- CHROME BOOKMARK TREE ---', tree);
      console.log('--- ROOT CHILDREN ---', rootChildren);
      const bookmarks: BookmarkFolder[] = [];
      const orphanUrls: BookmarkUrl[] = [];

      rootChildren.forEach((node) => {
        const item = convertToBookmark(node);

        // 폴더인 경우 그대로 추가
        if ('folders' in item || ('urls' in item && !('url' in item))) {
          bookmarks.push(item as BookmarkFolder);
        }
        // 최상위 URL인 경우 (드물지만 루트에 바로 존재하는 URL 등)
        else if ('url' in item) {
          orphanUrls.push(item as BookmarkUrl);
        }
      });

      // 단일 북마크(orphanUrls)가 존재할 경우 처리
      if (orphanUrls.length > 0) {
        // 크롬 브라우저 기본 제공 '기타 북마크' 찾기 (보통 id: '2', title: 'Other Bookmarks' 또는 '기타 북마크')
        // Node의 특징을 파악하여 가장 가능성 높은 폴더에 병합
        let targetFolderIndex = bookmarks.findIndex(
          b => b.id === '2' || b.name === '기타 북마크' || b.name === 'Other Bookmarks'
        );

        // 기본 제공 기타 북마크가 배열 내에 없다면, 맨 마지막 폴더를 선택하거나 새로 생성
        if (targetFolderIndex === -1 && bookmarks.length > 0) {
           targetFolderIndex = bookmarks.length - 1; 
        }

        if (targetFolderIndex >= 0) {
          // 찾은 폴더에 추가
          bookmarks[targetFolderIndex].urls = [
            ...(bookmarks[targetFolderIndex].urls || []),
            ...orphanUrls
          ];
        } else {
           // 어떠한 폴더도 없는 아주 예외적인 상황에서만 생성
           bookmarks.push({
             id: 'orphan-urls',
             name: '기타 북마크',
             isExpanded: false,
             folders: [],
             urls: orphanUrls,
           });
        }
      }

      // 최상위 폴더 중복 방지: 동일 이름(예: '모바일 북마크')의 폴더가 여러 개인 경우 병합 (크롬 자체 버그 대비)
      const mergedMap = new Map<string, BookmarkFolder>();
      
      bookmarks.forEach((folder) => {
        const existing = mergedMap.get(folder.name);
        if (existing) {
          // 이름이 같은 기존 폴더가 있으면 자식들 추가
          // 단, 중복된 항목이 또 들어가지 않도록 id를 기준으로 Set이나 단순 배열 병합 시 중복 체크
          const currentUrls = existing.urls || [];
          const currentFolders = existing.folders || [];

          (folder.urls || []).forEach(url => {
            if (!currentUrls.some(u => u.id === url.id)) {
              currentUrls.push(url);
            }
          });

          (folder.folders || []).forEach(f => {
             if (!currentFolders.some(cf => cf.id === f.id)) {
                currentFolders.push(f);
             }
          });
          
          existing.urls = currentUrls;
          existing.folders = currentFolders;
        } else {
          // Map에 없으면 이름 기준으로 새로 저장
          // 얕은 복사 방지를 위해 새 객체로 할당
          mergedMap.set(folder.name, { ...folder, urls: [...(folder.urls || [])], folders: [...(folder.folders || [])] });
        }
      });

      resolve(Array.from(mergedMap.values()));
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
             // 폴더 생성 시 이 분기에 도달하지 않아야 함
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
