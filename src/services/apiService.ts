/**
 * FastAPI 백엔드 통신 서비스
 * 북마크 동기화 및 크롤링 요청 처리
 */

import type {
  BookmarkFolderList,
  BookmarkItem,
  BookmarkCreateRequest,
  BookmarkUpdateRequest,
  ApiResponse,
} from '../types/bookmark'

// 백엔드 BaseResponse 타입 (Backend 기준)
interface BaseResponse<T> {
  code: number
  message: string
  data: T | null
  status: 'success' | 'error'
}

// API 기본 URL (환경에 따라 변경)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// API 키 (메모리에만 보관)
let _apiKey = '';

export const setApiKey = (key: string) => {
  _apiKey = key;
};

/**
 * API 요청 헬퍼 (Backend BaseResponse 형식 처리)
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (_apiKey) {
      headers['Authorization'] = `Bearer ${_apiKey}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const backendResponse: BaseResponse<T> = await response.json();

    // Backend BaseResponse를 Extension ApiResponse로 변환
    if (backendResponse.status === 'success') {
      return { success: true, data: backendResponse.data as T };
    } else {
      return { success: false, error: backendResponse.message };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

/**
 * 전체 북마크 조회
 */
export const getBookmarks = async (): Promise<ApiResponse<BookmarkFolderList>> => {
  return fetchApi<BookmarkFolderList>('/bookmarks');
};

/**
 * 북마크 생성
 */
export const createBookmark = async (
  data: BookmarkCreateRequest
): Promise<ApiResponse<BookmarkItem>> => {
  return fetchApi<BookmarkItem>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 북마크 수정
 */
export const updateBookmark = async (
  id: string,
  data: BookmarkUpdateRequest
): Promise<ApiResponse<BookmarkItem>> => {
  return fetchApi<BookmarkItem>(`/bookmarks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * 북마크 삭제
 */
export const deleteBookmark = async (
  id: string
): Promise<ApiResponse<void>> => {
  return fetchApi<void>(`/bookmarks/${id}`, {
    method: 'DELETE',
  });
};

/**
 * 북마크를 Backend로 전송 (크롤링 요청)
 * @param urls URL 문자열 배열
 * @param onProgress 진행률 콜백 (0-100)
 */
/**
 * 북마크를 Backend로 전송 (Extension Sync)
 * @param bookmarks 전송할 북마크 트리 노드 목록
 * @param onProgress 진행률 콜백 (0-100)
 */
export const syncBookmarks = async (
  bookmarks: import('../types/bookmark').ExtensionBookmarkNode[],
  onProgress?: (progress: number) => void
): Promise<ApiResponse<void>> => {
  if (bookmarks.length === 0) {
    return { success: true };
  }

  // Backend ExtensionUploadRequest 형식
  const payload = {
    bookmarks: bookmarks
  };

  if (onProgress) {
    onProgress(50); // 요청 시작
  }

  // Backend /extension/bookmarks 엔드포인트로 전송
  const response = await fetchApi<void>('/extension/bookmarks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (onProgress) {
    onProgress(100); // 완료
  }

  return response;
};

/**
 * 크롤링 요청
 */
export const requestCrawl = async (
  bookmarkId: string
): Promise<ApiResponse<{ status: string }>> => {
  return fetchApi<{ status: string }>(`/bookmarks/${bookmarkId}/crawl`, {
    method: 'POST',
  });
};

export const apiService = {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  syncBookmarks,
  requestCrawl,
  setApiKey,
};
