/**
 * 북마크 관련 타입 정의
 * Frontend와 동일한 구조로 정의
 * createdAt, updatedAt는 백엔드에서 관리
 */

// 북마크 URL 아이템
export interface BookmarkUrl {
  id: string
  title: string
  url: string
  tags?: string[]
  isChecked: boolean
}

// 북마크 폴더
export interface BookmarkFolder {
  id: string
  name: string
  isExpanded: boolean
  folders?: BookmarkFolder[]
  urls: BookmarkUrl[]
}

// 북마크 아이템 (폴더 또는 URL)
export type BookmarkItem = BookmarkFolder | BookmarkUrl

// 북마크 폴더 리스트
export type BookmarkFolderList = BookmarkFolder[]

// 타입 가드: 폴더인지 확인
export const isFolder = (item: BookmarkItem): item is BookmarkFolder => {
  return 'folders' in item || 'urls' in item
}

// 타입 가드: URL인지 확인
export const isUrl = (item: BookmarkItem): item is BookmarkUrl => {
  return 'url' in item && !('folders' in item)
}

// ============================================
// API 요청/응답 타입 (백엔드 연동용)
// ============================================

// 북마크 생성 요청
export interface BookmarkCreateRequest {
  title: string
  url?: string
  parentId?: string
  tags?: string[]
}

// 북마크 수정 요청
export interface BookmarkUpdateRequest {
  title?: string
  url?: string
  tags?: string[]
}

// API 응답 기본 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 백엔드 전송용 트리 구조 (Backend: schemas/extension.py ExtensionBookmarkNode 대응)
export interface ExtensionBookmarkNode {
  id: string
  title: string
  url?: string | null
  children: ExtensionBookmarkNode[]
}

// ============================================
// Chrome API 전용 (Extension 내부에서만 사용)
// ============================================

// Chrome 북마크 → 서비스 북마크 변환 시 임시로 사용
export interface ChromeBookmarkNode {
  id: string
  parentId?: string
  index?: number
  url?: string
  title: string
  dateAdded?: number
  children?: ChromeBookmarkNode[]
}
