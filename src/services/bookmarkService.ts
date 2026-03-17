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
} from '../types/bookmark'

/**
 * Chrome 북마크 노드를 앱 북마크 타입으로 변환 (재귀)
 */
const convertToBookmark = (node: ChromeBookmarkNode, parentId?: string): BookmarkItem => {
  const isFolder = !node.url

  if (isFolder) {
    const children = node.children?.map((child) => convertToBookmark(child, node.id)) || []
    const folders = children.filter((child): child is BookmarkFolder =>
      'folders' in child
    )
    const urls = children.filter((child): child is BookmarkUrl =>
      'url' in child && !('folders' in child)
    )

    const folder: BookmarkFolder = {
      id: node.id,
      name: node.title,
      parentId,
      folders,
      urls,
    }
    return folder
  } else {
    const url: BookmarkUrl = {
      id: node.id,
      title: node.title,
      url: node.url || '',
      tags: [],
    }
    return url
  }
}

/**
 * 전체 북마크 트리 가져오기
 */
export const getAllBookmarks = async (): Promise<BookmarkFolderList> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      // Chrome 시스템 폴더: id 1(북마크 바), 2(기타 북마크), 3(모바일 북마크)만 표시
      // 그 외 루트 폴더(동기화 잔여물 등)는 기타 북마크로 병합하여 데이터 유실 방지
      const VISIBLE_ROOT_IDS = new Set(['1', '2', '3'])
      const rootChildren = tree[0]?.children || []

      const bookmarks: BookmarkFolder[] = []
      const mergeTargets: ChromeBookmarkNode[] = []

      for (const node of rootChildren) {
        if (VISIBLE_ROOT_IDS.has(node.id)) {
          const item = convertToBookmark(node)
          if ('folders' in item) bookmarks.push(item as BookmarkFolder)
        } else if (node.children && node.children.length > 0) {
          mergeTargets.push(node)
        }
      }

      // 비표시 루트 폴더의 자식을 기타 북마크(id 2)로 병합
      if (mergeTargets.length > 0) {
        // 시스템 폴더가 하나도 없는 극단적 케이스 — fallback 폴더 생성
        if (bookmarks.length === 0) {
          bookmarks.push({
            id: 'fallback-root',
            name: '북마크',
            folders: [],
            urls: [],
          })
        }

        const otherIdx = bookmarks.findIndex((b) => b.id === '2')
        const target = otherIdx >= 0 ? bookmarks[otherIdx] : bookmarks[bookmarks.length - 1]

        for (const node of mergeTargets) {
          for (const child of node.children!) {
            const item = convertToBookmark(child, target.id)
            if ('folders' in item) {
              target.folders = [...(target.folders || []), item as BookmarkFolder]
            } else {
              target.urls = [...(target.urls || []), item as BookmarkUrl]
            }
          }
        }
      }

      resolve(bookmarks)
    })
  })
}

/**
 * 북마크 생성
 */
export const createBookmark = async (
  title: string,
  url?: string,
  parentId?: string
): Promise<BookmarkItem> => {
  // parentId가 없거나 root(0)이면 기타 북마크(2)로 보정 — root에 고아 노드 생성 방지
  const safeParentId = (!parentId || parentId === '0') ? '2' : parentId
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create(
      { title, url, parentId: safeParentId },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        resolve(convertToBookmark(result as ChromeBookmarkNode))
      }
    )
  })
}

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
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(convertToBookmark(result as ChromeBookmarkNode))
    })
  })
}

/**
 * 북마크 삭제
 */
export const removeBookmark = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

/**
 * 폴더 삭제 (하위 항목 포함)
 */
export const removeBookmarkTree = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

/**
 * 북마크 검색
 */
export const searchBookmarks = async (query: string): Promise<BookmarkItem[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search(query, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      const bookmarks = results.map((node) =>
        convertToBookmark(node as ChromeBookmarkNode)
      )
      resolve(bookmarks)
    })
  })
}

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
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(convertToBookmark(result as ChromeBookmarkNode))
    })
  })
}

/**
 * 폴더 생성
 */
export const createFolder = async (
  title: string,
  parentId?: string
): Promise<BookmarkFolder> => {
  const safeParentId = (!parentId || parentId === '0') ? '2' : parentId
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create(
      { title, parentId: safeParentId },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        const item = convertToBookmark(result as ChromeBookmarkNode)
        if ('folders' in item) {
          resolve(item as BookmarkFolder)
        } else {
          // 폴더 생성 시 이 분기에 도달하지 않아야 함
          reject(new Error('Failed to create folder'))
        }
      }
    )
  })
}

/**
 * 특정 폴더의 자식 노드 목록 조회 (Chrome 실제 순서)
 */
export const getChildren = async (id: string): Promise<ChromeBookmarkNode[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getChildren(id, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(results as ChromeBookmarkNode[])
    })
  })
}

export const bookmarkService = {
  getAll: getAllBookmarks,
  create: createBookmark,
  update: updateBookmark,
  remove: removeBookmark,
  removeTree: removeBookmarkTree,
  search: searchBookmarks,
  move: moveBookmark,
  createFolder,
  getChildren,
}
